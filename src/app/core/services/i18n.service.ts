import { Injectable, signal, inject, LOCALE_ID } from '@angular/core';
import { LoggerService } from './logger.service';

export type SupportedLocale = 'en' | 'es';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY';

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: CurrencyCode;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
}

export interface TranslationKey {
  key: string;
  params?: Record<string, string | number>;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private loggerService = inject(LoggerService);
  private localeId = inject(LOCALE_ID);
  
  private currentLocale = signal<SupportedLocale>('en');
  private translations = signal<Record<string, string>>({});
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // Locale configurations
  private readonly localeConfigs: Record<SupportedLocale, LocaleConfig> = {
    en: {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      currency: 'USD',
      numberFormat: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      currencyFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    es: {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h',
      currency: 'EUR',
      numberFormat: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      },
      currencyFormat: {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    }
  };

  constructor() {
    this.initializeLocale();
  }

  private async initializeLocale(): Promise<void> {
    // Try to get locale from localStorage or browser
    const savedLocale = localStorage.getItem('locale') as SupportedLocale;
    const browserLocale = this.getBrowserLocale();
    const initialLocale = savedLocale || browserLocale || 'en';

    await this.setLocale(initialLocale);
  }

  private getBrowserLocale(): SupportedLocale | null {
    const browserLang = navigator.language.split('-')[0] as SupportedLocale;
    return this.localeConfigs[browserLang] ? browserLang : null;
  }

  // Public API methods
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!this.localeConfigs[locale]) {
      this.error.set(`Unsupported locale: ${locale}`);
      this.loggerService.error('Unsupported locale', { locale }, 'i18n');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Load translations
      const translations = await this.loadTranslations(locale);
      this.translations.set(translations);
      this.currentLocale.set(locale);

      // Save to localStorage
      localStorage.setItem('locale', locale);

      // Update HTML lang attribute
      document.documentElement.lang = locale;

      this.loggerService.info('Locale changed', { locale }, 'i18n');

    } catch (error) {
      this.error.set(`Failed to load locale: ${locale}`);
      this.loggerService.error('Failed to load locale', error, 'i18n');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadTranslations(locale: SupportedLocale): Promise<Record<string, string>> {
    // In a real app, this would load from XLF files
    // For now, we'll return a mock translation object
    const mockTranslations: Record<string, Record<string, string>> = {
      en: {
        'navigation.dashboard': 'Dashboard',
        'navigation.portfolio': 'Portfolio',
        'navigation.watchlist': 'Watchlist',
        'navigation.news': 'News',
        'navigation.settings': 'Settings',
        'dashboard.title': 'CryptoVault Pro Dashboard',
        'dashboard.totalPortfolioValue': 'Total Portfolio Value',
        'dashboard.totalInvested': 'Total Invested',
        'dashboard.totalProfitLoss': 'Total Profit/Loss',
        'dashboard.dayChange': 'Day Change',
        'dashboard.bestPerformer': 'Best Performer',
        'dashboard.worstPerformer': 'Worst Performer',
        'portfolio.title': 'Portfolio',
        'portfolio.holdings': 'Holdings',
        'portfolio.transactions': 'Transactions',
        'portfolio.addTransaction': 'Add Transaction',
        'portfolio.buy': 'Buy',
        'portfolio.sell': 'Sell',
        'portfolio.amount': 'Amount',
        'portfolio.price': 'Price',
        'portfolio.date': 'Date',
        'portfolio.totalValue': 'Total Value',
        'portfolio.profitLoss': 'Profit/Loss',
        'portfolio.returnOnInvestment': 'Return on Investment',
        'watchlist.title': 'Watchlist',
        'watchlist.addToWatchlist': 'Add to Watchlist',
        'watchlist.removeFromWatchlist': 'Remove from Watchlist',
        'watchlist.noCoins': 'No coins in watchlist',
        'watchlist.addCoinsToTrack': 'Add coins to track their performance',
        'news.title': 'Crypto News',
        'news.latestNews': 'Latest News',
        'news.readMore': 'Read More',
        'news.noNews': 'No news available',
        'settings.title': 'Settings',
        'settings.appearance': 'Appearance',
        'settings.theme': 'Theme',
        'settings.darkMode': 'Dark Mode',
        'settings.lightMode': 'Light Mode',
        'settings.auto': 'Auto',
        'settings.language': 'Language',
        'settings.notifications': 'Notifications',
        'settings.priceAlerts': 'Price Alerts',
        'settings.newsUpdates': 'News Updates',
        'settings.emailNotifications': 'Email Notifications',
        'settings.privacy': 'Privacy',
        'settings.shareUsageData': 'Share Usage Data',
        'settings.analytics': 'Analytics',
        'settings.security': 'Security & Encryption',
        'settings.encryptionStatus': 'Encryption Status',
        'settings.enableEncryption': 'Enable Encryption',
        'settings.advanced': 'Advanced',
        'settings.apiKey': 'API Key',
        'settings.dataRefreshRate': 'Data Refresh Rate',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.retry': 'Retry',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.close': 'Close',
        'common.confirm': 'Confirm',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'error.networkError': 'Network Error',
        'error.noInternetConnection': 'No internet connection. Please check your network connection and try again.',
        'error.serverUnavailable': 'Server is temporarily unavailable. Please try again in a few moments.',
        'error.tooManyRequests': 'Too many requests. Please wait a moment before trying again.',
        'error.dataNotFound': 'The requested data was not found. Please refresh and try again.',
        'error.invalidRequest': 'There was a problem with your request. Please check your input and try again.',
        'success.transactionAdded': 'Transaction added successfully',
        'success.transactionDeleted': 'Transaction deleted successfully',
        'success.settingsSaved': 'Settings saved successfully',
        'success.encryptionEnabled': 'Encryption enabled successfully',
        'empty.noTransactions': 'No transactions yet',
        'empty.noTransactionsDescription': 'Start tracking your crypto portfolio by adding your first transaction.',
        'empty.noHoldings': 'No holdings yet',
        'empty.noHoldingsDescription': 'Add transactions to see your portfolio holdings.',
        'time.justNow': 'just now',
        'time.minuteAgo': '1 minute ago',
        'time.minutesAgo': '{{count}} minutes ago',
        'time.hourAgo': '1 hour ago',
        'time.hoursAgo': '{{count}} hours ago',
        'time.dayAgo': '1 day ago',
        'time.daysAgo': '{{count}} days ago',
        'currency.usd': 'USD',
        'currency.eur': 'EUR',
        'currency.gbp': 'GBP',
        'currency.jpy': 'JPY',
        'unit.bitcoin': 'BTC',
        'unit.ethereum': 'ETH',
        'unit.million': 'M',
        'unit.billion': 'B',
        'unit.trillion': 'T',
        'metrics.volatility': 'Volatility',
        'metrics.sharpeRatio': 'Sharpe Ratio',
        'metrics.maxDrawdown': 'Max Drawdown',
        'metrics.diversification': 'Diversification',
        'metrics.risk': 'Risk',
        'metrics.low': 'Low',
        'metrics.medium': 'Medium',
        'metrics.high': 'High',
        'status.online': 'Online',
        'status.offline': 'Offline',
        'status.syncing': 'Syncing',
        'status.synced': 'Synced',
        'status.pending': 'Pending',
        'status.failed': 'Failed'
      },
      es: {
        'navigation.dashboard': 'Panel Principal',
        'navigation.portfolio': 'Cartera',
        'navigation.watchlist': 'Lista de Seguimiento',
        'navigation.news': 'Noticias',
        'navigation.settings': 'Configuración',
        'dashboard.title': 'Panel Principal de CryptoVault Pro',
        'dashboard.totalPortfolioValue': 'Valor Total de la Cartera',
        'dashboard.totalInvested': 'Total Invertido',
        'dashboard.totalProfitLoss': 'Beneficio/Pérdida Total',
        'dashboard.dayChange': 'Cambio del Día',
        'dashboard.bestPerformer': 'Mejor Rendimiento',
        'dashboard.worstPerformer': 'Peor Rendimiento',
        'portfolio.title': 'Cartera',
        'portfolio.holdings': 'Posiciones',
        'portfolio.transactions': 'Transacciones',
        'portfolio.addTransaction': 'Agregar Transacción',
        'portfolio.buy': 'Comprar',
        'portfolio.sell': 'Vender',
        'portfolio.amount': 'Cantidad',
        'portfolio.price': 'Precio',
        'portfolio.date': 'Fecha',
        'portfolio.totalValue': 'Valor Total',
        'portfolio.profitLoss': 'Beneficio/Pérdida',
        'portfolio.returnOnInvestment': 'Retorno de Inversión',
        'watchlist.title': 'Lista de Seguimiento',
        'watchlist.addToWatchlist': 'Agregar a Lista de Seguimiento',
        'watchlist.removeFromWatchlist': 'Eliminar de Lista de Seguimiento',
        'watchlist.noCoins': 'No hay monedas en la lista de seguimiento',
        'watchlist.addCoinsToTrack': 'Agrega monedas para seguir su rendimiento',
        'news.title': 'Noticias de Cripto',
        'news.latestNews': 'Últimas Noticias',
        'news.readMore': 'Leer Más',
        'news.noNews': 'No hay noticias disponibles',
        'settings.title': 'Configuración',
        'settings.appearance': 'Apariencia',
        'settings.theme': 'Tema',
        'settings.darkMode': 'Modo Oscuro',
        'settings.lightMode': 'Modo Claro',
        'settings.auto': 'Automático',
        'settings.language': 'Idioma',
        'settings.notifications': 'Notificaciones',
        'settings.priceAlerts': 'Alertas de Precio',
        'settings.newsUpdates': 'Actualizaciones de Noticias',
        'settings.emailNotifications': 'Notificaciones por Correo',
        'settings.privacy': 'Privacidad',
        'settings.shareUsageData': 'Compartir Datos de Uso',
        'settings.analytics': 'Análisis',
        'settings.security': 'Seguridad y Cifrado',
        'settings.encryptionStatus': 'Estado del Cifrado',
        'settings.enableEncryption': 'Habilitar Cifrado',
        'settings.advanced': 'Avanzado',
        'settings.apiKey': 'Clave API',
        'settings.dataRefreshRate': 'Tasa de Actualización de Datos',
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.retry': 'Reintentar',
        'common.cancel': 'Cancelar',
        'common.save': 'Guardar',
        'common.delete': 'Eliminar',
        'common.edit': 'Editar',
        'common.close': 'Cerrar',
        'common.confirm': 'Confirmar',
        'common.search': 'Buscar',
        'common.filter': 'Filtrar',
        'common.sort': 'Ordenar',
        'error.networkError': 'Error de Red',
        'error.noInternetConnection': 'Sin conexión a internet. Por favor, verifique su conexión de red e inténtelo de nuevo.',
        'error.serverUnavailable': 'El servidor no está disponible temporalmente. Por favor, inténtelo de nuevo en unos momentos.',
        'error.tooManyRequests': 'Demasiadas solicitudes. Por favor, espere un momento antes de intentar de nuevo.',
        'error.dataNotFound': 'Los datos solicitados no se encontraron. Por favor, actualice e inténtelo de nuevo.',
        'error.invalidRequest': 'Hubo un problema con su solicitud. Por favor, verifique su entrada e inténtelo de nuevo.',
        'success.transactionAdded': 'Transacción agregada exitosamente',
        'success.transactionDeleted': 'Transacción eliminada exitosamente',
        'success.settingsSaved': 'Configuración guardada exitosamente',
        'success.encryptionEnabled': 'Cifrado habilitado exitosamente',
        'empty.noTransactions': 'Aún no hay transacciones',
        'empty.noTransactionsDescription': 'Comience a seguir su cartera de cripto agregando su primera transacción.',
        'empty.noHoldings': 'Aún no hay posiciones',
        'empty.noHoldingsDescription': 'Agregue transacciones para ver sus posiciones de la cartera.',
        'time.justNow': 'ahora mismo',
        'time.minuteAgo': 'hace 1 minuto',
        'time.minutesAgo': 'hace {{count}} minutos',
        'time.hourAgo': 'hace 1 hora',
        'time.hoursAgo': 'hace {{count}} horas',
        'time.dayAgo': 'hace 1 día',
        'time.daysAgo': 'hace {{count}} días',
        'currency.usd': 'USD',
        'currency.eur': 'EUR',
        'currency.gbp': 'GBP',
        'currency.jpy': 'JPY',
        'unit.bitcoin': 'BTC',
        'unit.ethereum': 'ETH',
        'unit.million': 'M',
        'unit.billion': 'B',
        'unit.trillion': 'T',
        'metrics.volatility': 'Volatilidad',
        'metrics.sharpeRatio': 'Ratio de Sharpe',
        'metrics.maxDrawdown': 'Máxima Caída',
        'metrics.diversification': 'Diversificación',
        'metrics.risk': 'Riesgo',
        'metrics.low': 'Bajo',
        'metrics.medium': 'Medio',
        'metrics.high': 'Alto',
        'status.online': 'En línea',
        'status.offline': 'Fuera de línea',
        'status.syncing': 'Sincronizando',
        'status.synced': 'Sincronizado',
        'status.pending': 'Pendiente',
        'status.failed': 'Fallido'
      }
    };

    return mockTranslations[locale] || {};
  }

  // Translation methods
  translate(key: string, params?: Record<string, string | number>): string {
    const translations = this.translations();
    let translation = translations[key] || key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }

    return translation;
  }

  translateAsync(key: string, params?: Record<string, string | number>): Promise<string> {
    return Promise.resolve(this.translate(key, params));
  }

  // Locale information
  getCurrentLocale(): SupportedLocale {
    return this.currentLocale();
  }

  getLocaleConfig(locale?: SupportedLocale): LocaleConfig {
    return this.localeConfigs[locale || this.currentLocale()];
  }

  getSupportedLocales(): LocaleConfig[] {
    return Object.values(this.localeConfigs);
  }

  // Formatting methods
  formatDate(date: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
    const config = this.getLocaleConfig();
    const locale = config.code;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      ...options,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  }

  formatTime(date: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
    const config = this.getLocaleConfig();
    const locale = config.code;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      hour12: config.timeFormat === '12h'
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  }

  formatDateTime(date: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
    const config = this.getLocaleConfig();
    const locale = config.code;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      ...options,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: config.timeFormat === '12h'
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const config = this.getLocaleConfig();
    const locale = config.code;
    
    const mergedOptions = { ...config.numberFormat, ...options };
    return new Intl.NumberFormat(locale, mergedOptions).format(value);
  }

  formatCurrency(value: number, currency?: CurrencyCode, options?: Intl.NumberFormatOptions): string {
    const config = this.getLocaleConfig();
    const locale = config.code;
    const targetCurrency = currency || config.currency;
    
    const mergedOptions: Intl.NumberFormatOptions = {
      ...config.currencyFormat,
      ...options,
      currency: targetCurrency
    };

    return new Intl.NumberFormat(locale, mergedOptions).format(value);
  }

  formatPercent(value: number, options?: Intl.NumberFormatOptions): string {
    const config = this.getLocaleConfig();
    const locale = config.code;
    
    const defaultOptions: Intl.NumberFormatOptions = {
      ...options,
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  }

  formatCompactNumber(value: number, options?: Intl.NumberFormatOptions): string {
    const config = this.getLocaleConfig();
    const locale = config.code;
    
    const defaultOptions: Intl.NumberFormatOptions = {
      ...options,
      notation: 'compact',
      compactDisplay: 'short'
    };

    return new Intl.NumberFormat(locale, defaultOptions).format(value);
  }

  // Relative time formatting
  formatRelativeTime(date: Date | number | string): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return this.translate('time.justNow');
    } else if (diffMinutes === 1) {
      return this.translate('time.minuteAgo');
    } else if (diffMinutes < 60) {
      return this.translate('time.minutesAgo', { count: diffMinutes });
    } else if (diffHours === 1) {
      return this.translate('time.hourAgo');
    } else if (diffHours < 24) {
      return this.translate('time.hoursAgo', { count: diffHours });
    } else if (diffDays === 1) {
      return this.translate('time.dayAgo');
    } else {
      return this.translate('time.daysAgo', { count: diffDays });
    }
  }

  // Crypto-specific formatting
  formatCryptoAmount(value: number, symbol: string = ''): string {
    const formatted = this.formatNumber(value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    });
    return symbol ? `${formatted} ${symbol}` : formatted;
  }

  formatCryptoPrice(value: number, currency?: CurrencyCode): string {
    return this.formatCurrency(value, currency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }

  formatPercentageChange(value: number): string {
    const sign = value >= 0 ? '+' : '';
    const formatted = this.formatPercent(Math.abs(value) / 100, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${sign}${formatted}`;
  }

  // Status getters
  isLoadingLocale(): boolean {
    return this.isLoading();
  }

  hasError(): boolean {
    return this.error() !== null;
  }

  getError(): string | null {
    return this.error();
  }

  // Utility methods
  isRTL(): boolean {
    const rtlLocales = ['ar', 'he', 'fa', 'ur'];
    return rtlLocales.includes(this.currentLocale());
  }

  getDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  // Health check
  checkHealth(): { healthy: boolean; checks: Record<string, boolean> } {
    const checks = {
      locale_loaded: !!this.currentLocale(),
      translations_loaded: Object.keys(this.translations()).length > 0,
      no_errors: !this.hasError(),
      not_loading: !this.isLoadingLocale()
    };

    return {
      healthy: Object.values(checks).every(check => check),
      checks
    };
  }
}
