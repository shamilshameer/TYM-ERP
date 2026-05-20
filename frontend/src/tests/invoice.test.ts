import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals, CalculatorCartItem } from '../utils/totalsCalculator';

describe('SyncERP - Invoice Calculation Engine', () => {

  it('should sum cart item subtotal correctly', () => {
    const cart: CalculatorCartItem[] = [
      { price: 10.00, qty: 2 }, // 20
      { price: 15.50, qty: 1 }, // 15.5
      { price: 1.25,  qty: 4 }, // 5
    ];
    
    const totals = calculateInvoiceTotals(cart, 0, 0);
    
    expect(totals.subtotal).toBe(40.50);
    expect(totals.discountAmount).toBe(0.00);
    expect(totals.taxAmount).toBe(0.00);
    expect(totals.grandTotal).toBe(40.50);
  });

  it('should apply dollar discounts correctly and cap it at subtotal', () => {
    const cart: CalculatorCartItem[] = [
      { price: 100.00, qty: 1 }
    ];
    
    // Normal discount
    const normal = calculateInvoiceTotals(cart, 15.50, 0);
    expect(normal.discountAmount).toBe(15.50);
    expect(normal.taxableAmount).toBe(84.50);
    expect(normal.grandTotal).toBe(84.50);
    
    // Excess discount (should cap discount at subtotal)
    const excess = calculateInvoiceTotals(cart, 120.00, 0);
    expect(excess.discountAmount).toBe(100.00);
    expect(excess.taxableAmount).toBe(0.00);
    expect(excess.grandTotal).toBe(0.00);

    // Negative discount (should default to 0)
    const negative = calculateInvoiceTotals(cart, -10.00, 0);
    expect(negative.discountAmount).toBe(0.00);
    expect(negative.grandTotal).toBe(100.00);
  });

  it('should calculate tax on post-discount taxable amount', () => {
    const cart: CalculatorCartItem[] = [
      { price: 50.00, qty: 2 } // 100.00 subtotal
    ];
    
    // Subtotal: 100, Discount: 20, Taxable: 80, Tax Rate: 8% -> Tax: 6.40, Grand: 86.40
    const totals = calculateInvoiceTotals(cart, 20.00, 8);
    
    expect(totals.subtotal).toBe(100.00);
    expect(totals.discountAmount).toBe(20.00);
    expect(totals.taxableAmount).toBe(80.00);
    expect(totals.taxAmount).toBe(6.40);
    expect(totals.grandTotal).toBe(86.40);
  });

  it('should avoid floating-point math issues and round cleanly to two decimal places', () => {
    const cart: CalculatorCartItem[] = [
      { price: 19.99, qty: 3 } // 59.97
    ];
    
    // Subtotal: 59.97, Discount: 5.50, Taxable: 54.47, Tax Rate: 8.25% -> Tax: 4.493775 -> Rounds to 4.49, Grand: 58.96
    const totals = calculateInvoiceTotals(cart, 5.50, 8.25);
    
    expect(totals.subtotal).toBe(59.97);
    expect(totals.discountAmount).toBe(5.50);
    expect(totals.taxableAmount).toBe(54.47);
    expect(totals.taxAmount).toBe(4.49);
    expect(totals.grandTotal).toBe(58.96);
  });
});
