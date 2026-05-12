import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TransactionValidation {
  amount: ValidationResult;
  symbol: ValidationResult;
  date: ValidationResult;
}

export interface WatchlistValidation {
  symbol: ValidationResult;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  
  // Transaction validation
  validateTransactionAmount(amount: number | string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      errors.push('Amount must be a valid number');
      return { isValid: false, errors };
    }
    
    if (numAmount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    
    if (numAmount > 1_000_000_000) {
      errors.push('Amount exceeds maximum allowed value');
    }
    
    // Warnings for unusual amounts
    if (numAmount < 0.01) {
      warnings.push('Very small amounts may have high transaction fees');
    }
    
    if (numAmount > 100_000) {
      warnings.push('Large transactions may require additional verification');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  validateTransactionSymbol(symbol: string): ValidationResult {
    const errors: string[] = [];
    
    if (!symbol || symbol.trim().length === 0) {
      errors.push('Symbol is required');
      return { isValid: false, errors };
    }
    
    const cleanSymbol = symbol.trim().toUpperCase();
    
    if (cleanSymbol.length < 1) {
      errors.push('Symbol must be at least 1 character');
    }
    
    if (cleanSymbol.length > 20) {
      errors.push('Symbol must be less than 20 characters');
    }
    
    if (!/^[A-Z0-9]+$/.test(cleanSymbol)) {
      errors.push('Symbol can only contain letters and numbers');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  validateTransactionDate(date: Date | string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const transactionDate = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(transactionDate.getTime())) {
      errors.push('Invalid date format');
      return { isValid: false, errors };
    }
    
    const now = new Date();
    const maxFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours in future
    
    if (transactionDate > maxFutureDate) {
      errors.push('Transaction date cannot be more than 24 hours in the future');
    }
    
    const minDate = new Date('2010-01-01'); // Before most crypto existed
    if (transactionDate < minDate) {
      errors.push('Transaction date is too far in the past');
    }
    
    if (transactionDate > now) {
      warnings.push('Future-dated transactions may not be confirmed immediately');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  validateFullTransaction(transaction: {
    amount: number | string;
    symbol: string;
    date?: Date | string;
  }): TransactionValidation {
    return {
      amount: this.validateTransactionAmount(transaction.amount),
      symbol: this.validateTransactionSymbol(transaction.symbol),
      date: transaction.date ? this.validateTransactionDate(transaction.date) : { isValid: true, errors: [] }
    };
  }
  
  // Watchlist validation
  validateWatchlistSymbol(symbol: string): ValidationResult {
    return this.validateTransactionSymbol(symbol);
  }
  
  // Search validation
  validateSearchQuery(query: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!query || query.trim().length === 0) {
      errors.push('Search query is required');
      return { isValid: false, errors };
    }
    
    const cleanQuery = query.trim();
    
    if (cleanQuery.length < 1) {
      errors.push('Search query must be at least 1 character');
    }
    
    if (cleanQuery.length > 100) {
      errors.push('Search query must be less than 100 characters');
    }
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleanQuery)) {
        errors.push('Search query contains invalid characters');
        break;
      }
    }
    
    if (cleanQuery.length < 2) {
      warnings.push('Short queries may return many results');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  // Portfolio validation
  validatePortfolioName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Portfolio name is required');
      return { isValid: false, errors };
    }
    
    const cleanName = name.trim();
    
    if (cleanName.length < 1) {
      errors.push('Portfolio name must be at least 1 character');
    }
    
    if (cleanName.length > 50) {
      errors.push('Portfolio name must be less than 50 characters');
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(cleanName)) {
      errors.push('Portfolio name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  // Angular form validators
  static amountValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const validationService = new ValidationService();
      const result = validationService.validateTransactionAmount(control.value);
      
      return result.isValid ? null : { invalidAmount: result.errors };
    };
  }
  
  static symbolValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const validationService = new ValidationService();
      const result = validationService.validateTransactionSymbol(control.value);
      
      return result.isValid ? null : { invalidSymbol: result.errors };
    };
  }
  
  static searchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const validationService = new ValidationService();
      const result = validationService.validateSearchQuery(control.value);
      
      return result.isValid ? null : { invalidSearch: result.errors };
    };
  }
  
  // Sanitization utilities
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }
  
  sanitizeSymbol(symbol: string): string {
    if (!symbol) return '';
    
    return symbol
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Keep only letters and numbers
      .substring(0, 20); // Limit length
  }
  
  sanitizeSearchQuery(query: string): string {
    if (!query) return '';
    
    return this.sanitizeInput(query)
      .substring(0, 100); // Limit search query length
  }
  
  // Utility methods
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  generateSecureId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
