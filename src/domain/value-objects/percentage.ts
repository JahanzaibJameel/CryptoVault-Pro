export class Percentage {
  constructor(public readonly value: number) {
    if (value < -100) throw new Error('Percentage cannot be less than -100');
  }

  format(): string {
    const sign = this.value >= 0 ? '+' : '';
    return `${sign}${this.value.toFixed(2)}%`;
  }

  isPositive(): boolean {
    return this.value > 0;
  }

  isNegative(): boolean {
    return this.value < 0;
  }

  static fromNumber(value: number): Percentage {
    return new Percentage(value);
  }

  static fromDecimal(decimal: number): Percentage {
    return new Percentage(decimal * 100);
  }
}
