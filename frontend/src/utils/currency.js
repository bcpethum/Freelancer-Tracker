/**
 * Currency utility for FreelanceTrack.
 * Maps currency codes to their symbols and provides a formatter function.
 */

const CURRENCY_SYMBOLS = {
  LKR: 'Rs',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  AED: 'د.إ',
};

/**
 * Returns the symbol for a given currency code.
 * Falls back to the code itself if unknown.
 */
export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || currency || 'Rs';
}

/**
 * Formats a number as a currency string.
 * e.g. formatCurrency(1500, 'LKR') → 'Rs 1,500.00'
 */
export function formatCurrency(amount, currency = 'LKR', opts = {}) {
  const symbol = getCurrencySymbol(currency);
  const { decimals = 2, compact = false } = opts;

  if (compact && amount >= 1000) {
    const compacted = (amount / 1000).toFixed(1).replace(/\.0$/, '');
    return `${symbol} ${compacted}k`;
  }

  const formatted = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol} ${formatted}`;
}
