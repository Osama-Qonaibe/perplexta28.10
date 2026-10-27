export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  }
  return `${amount} ${currency}`;
}
