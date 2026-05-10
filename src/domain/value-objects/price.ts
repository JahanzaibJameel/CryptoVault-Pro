export class Price {
  constructor(public readonly amount: number, public readonly currency: string = 'USD') {
    if (amount < 0) throw new Error('Price cannot be negative');
  }

  format(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(this.amount);
  }

  static fromNumber(amount: number, currency: string = 'USD'): Price {
    return new Price(amount, currency);
  }
}
