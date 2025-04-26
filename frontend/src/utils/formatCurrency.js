/**
 * Format a number to Vietnamese currency format
 * @param {number} amount - The amount to format
 * @param {boolean} showCurrency - Whether to show the currency symbol (₫)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showCurrency = true) => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(amount);
};

/**
 * Format a number to Vietnamese currency format with compact notation
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string with compact notation
 */
export const formatCompactCurrency = (amount) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ₫`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₫`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K ₫`;
  }
  return formatCurrency(amount);
};

/**
 * Parse a Vietnamese currency string back to a number
 * @param {string} currencyString - The currency string to parse
 * @returns {number} The parsed amount
 */
export const parseCurrency = (currencyString) => {
  return Number(currencyString.replace(/[^\d]/g, ''));
}; 