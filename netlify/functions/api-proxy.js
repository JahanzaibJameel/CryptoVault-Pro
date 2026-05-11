const crypto = require('crypto');

// Cache with TTL to reduce API calls
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// Circuit breaker state
let circuitState = 'CLOSED';
let failureCount = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT = 60 * 1000; // 1 minute

function getCircuitBreakerState() {
  if (circuitState === 'OPEN') {
    if (Date.now() - lastFailureTime > RECOVERY_TIMEOUT) {
      circuitState = 'HALF_OPEN';
      failureCount = 0;
    }
  }
  return circuitState;
}

function recordSuccess() {
  failureCount = 0;
  circuitState = 'CLOSED';
}

function recordFailure() {
  failureCount++;
  lastFailureTime = Date.now();
  
  if (failureCount >= FAILURE_THRESHOLD) {
    circuitState = 'OPEN';
  }
}

function isRateLimited(clientId) {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientId);
  
  if (!clientData) {
    rateLimitMap.set(clientId, { count: 1, windowStart: now });
    return false;
  }
  
  if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(clientId, { count: 1, windowStart: now });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  clientData.count++;
  return false;
}

function getCacheKey(url, headers) {
  const authHeader = headers.authorization || '';
  const urlHash = crypto.createHash('md5').update(url).digest('hex');
  return `${urlHash}_${authHeader.slice(0, 10)}`;
}

function getFromCache(cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached;
  }
  cache.delete(cacheKey);
  return null;
}

function setCache(cacheKey, data) {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Limit cache size
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

async function proxyRequest(url, method, headers, body) {
  const circuitBreakerState = getCircuitBreakerState();
  
  if (circuitBreakerState === 'OPEN') {
    return {
      status: 503,
      body: JSON.stringify({
        error: 'Service temporarily unavailable',
        message: 'API service is experiencing issues. Please try again later.'
      })
    };
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        'User-Agent': 'CryptoVault-Pro/1.0',
        'Accept': 'application/json',
        // Remove host header to avoid conflicts
        'host': undefined
      },
      body: body || undefined
    });

    if (!response.ok) {
      recordFailure();
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    recordSuccess();
    
    const data = await response.json();
    
    return {
      status: response.status,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'Content-Type, Authorization',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'cache-control': 'public, max-age=30'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    recordFailure();
    
    console.error('Proxy request failed:', error);
    
    return {
      status: 502,
      body: JSON.stringify({
        error: 'Bad Gateway',
        message: 'Failed to fetch data from CoinGecko API. Please try again later.'
      })
    };
  }
}

exports.handler = async function(event, context) {
  const { path, httpMethod, headers, body, queryStringParameters } = event;
  
  // Handle CORS preflight
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'Content-Type, Authorization',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-max-age': '86400'
      },
      body: ''
    };
  }

  // Rate limiting
  const clientId = headers['x-forwarded-for'] || 
                   headers['client-ip'] || 
                   context.clientIP || 
                   'anonymous';
  
  if (isRateLimited(clientId)) {
    return {
      statusCode: 429,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*'
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      })
    };
  }

  // Validate path
  if (!path || !path.startsWith('/api/')) {
    return {
      statusCode: 400,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*'
      },
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid API path'
      })
    };
  }

  // Build target URL
  const coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  const targetPath = path.replace('/api', '');
  const queryString = queryStringParameters ? 
    '?' + new URLSearchParams(queryStringParameters).toString() : '';
  const targetUrl = coingeckoBaseUrl + targetPath + queryString;

  // Check cache for GET requests
  if (httpMethod === 'GET') {
    const cacheKey = getCacheKey(targetUrl, headers);
    const cached = getFromCache(cacheKey);
    
    if (cached) {
      return {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'x-cache': 'HIT'
        },
        body: JSON.stringify(cached.data)
      };
    }
  }

  // Add API key from environment if available
  const enhancedHeaders = {
    ...headers,
    'accept': 'application/json'
  };

  if (process.env.COINGECKO_API_KEY) {
    enhancedHeaders['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  }

  // Make the proxy request
  const result = await proxyRequest(targetUrl, httpMethod, enhancedHeaders, body);
  
  // Cache successful GET responses
  if (httpMethod === 'GET' && result.status === 200) {
    const cacheKey = getCacheKey(targetUrl, headers);
    const responseData = JSON.parse(result.body);
    setCache(cacheKey, responseData);
  }

  return {
    statusCode: result.status,
    headers: result.headers || {
      'content-type': 'application/json',
      'access-control-allow-origin': '*'
    },
    body: result.body
  };
};
