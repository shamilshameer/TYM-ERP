export interface CalculatorCartItem {
  price: number;
  qty: number;
}

/**
 * Calculates itemized totals for an active sale invoice.
 * Performs precision-safe decimal rounding for subtotal, tax, discounts and grand total.
 */
export const calculateInvoiceTotals = (
  cart: CalculatorCartItem[],
  discount: number, // Direct dollar discount
  taxRate: number   // Tax percentage (e.g. 8 for 8%)
) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Guard rails: discount cannot be negative or exceed subtotal
  const discountAmount = Math.max(0, Math.min(discount, subtotal));
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  // Tax = Taxable amount * (tax rate / 100)
  const taxAmount = taxableAmount * (taxRate / 100);
  const grandTotal = taxableAmount + taxAmount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    taxableAmount: parseFloat(taxableAmount.toFixed(2)),
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
};
