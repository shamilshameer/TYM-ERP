import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  Trash2, 
  Percent, 
  Calculator, 
  DollarSign, 
  ShoppingCart,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import { useProducts } from '../db/hooks/useProducts';
import { useCustomers } from '../db/hooks/useCustomers';
import { useSales } from '../db/hooks/useSales';
import { calculateInvoiceTotals } from '../utils/totalsCalculator';

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  maxStock: number;
}

export const Sales: React.FC = () => {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { createSale } = useSales();

  // Search & Cart States
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0); // Percentage or direct value? Let's use direct dollar discount
  const [taxRate, setTaxRate] = useState<number>(8); // Default 8% tax

  // Feedback states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLSelectElement>(null);

  // 1. Keyboard Shortcuts Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + P: Focus Product Search
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Alt + C: Focus Customer Selection
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        customerSelectRef.current?.focus();
      }
      // Alt + D: Focus Discount Input
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        discountInputRef.current?.focus();
      }
      // Alt + S: Trigger Checkout
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCheckout();
      }
      // Escape: Clear Cart
      if (e.key === 'Escape' && cart.length > 0) {
        if (confirm('Clear current transaction?')) {
          handleClearCart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomerId, discount, taxRate]);

  // 2. Calculations
  const { subtotal, discountAmount, taxAmount, grandTotal } = calculateInvoiceTotals(cart, discount, taxRate);

  // Filtered Products Search list
  const filteredProducts = products.filter(p => 
    p.deletedAt === 0 && (
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    )
  );

  // 3. Cart Actions
  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stockQty <= 0) return;

    const existingIndex = cart.findIndex(item => item.productId === productId);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].qty;
      if (currentQty >= product.stockQty) {
        setErrorMessage(`Cannot exceed available stock level (${product.stockQty}) for ${product.name}.`);
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        qty: 1,
        maxStock: product.stockQty
      }]);
    }
  };

  const handleUpdateQty = (productId: string, amount: number) => {
    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex === -1) return;

    const updatedCart = [...cart];
    const newQty = updatedCart[itemIndex].qty + amount;

    if (newQty <= 0) {
      updatedCart.splice(itemIndex, 1);
    } else if (newQty > updatedCart[itemIndex].maxStock) {
      setErrorMessage(`Cannot exceed available stock level (${updatedCart[itemIndex].maxStock}) for ${updatedCart[itemIndex].name}.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    } else {
      updatedCart[itemIndex].qty = newQty;
    }
    setCart(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomerId('');
  };

  // 4. Submit local checkout transaction
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Cannot process checkout. Cart is currently empty.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      const saleId = crypto.randomUUID();
      const salePayload = {
        id: saleId,
        customerId: selectedCustomerId || null,
        totalAmount: parseFloat(grandTotal.toFixed(2)),
        saleDate: Date.now(),
        deletedAt: 0,
        version: 1
      };

      const saleItemsPayload = cart.map(item => ({
        id: crypto.randomUUID(),
        saleId,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.price,
        totalPrice: parseFloat((item.price * item.qty).toFixed(2))
      }));

      // Submit via offline-first repository transaction
      await createSale(salePayload, saleItemsPayload);

      setSuccessMessage(`Checkout complete! Transaction ID: ${saleId.substring(0, 8)}`);
      handleClearCart();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred during checkout.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 relative select-none">
      
      {/* Toast Notifications */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 py-3.5 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm shadow-xl shadow-emerald-500/5 backdrop-blur-xl"
          >
            <Sparkles size={18} className="animate-pulse" />
            <span className="font-semibold">{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 py-3.5 px-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm shadow-xl shadow-rose-500/5 backdrop-blur-xl"
          >
            <Trash2 size={18} className="animate-pulse" />
            <span className="font-semibold">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight Outfit">
            Point of Sale Terminal
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Keyboard Shortcuts: <kbd className="bg-slate-900 border border-brand-border px-1 py-0.5 rounded text-[10px] text-slate-400">Alt+P</kbd> Search | <kbd className="bg-slate-900 border border-brand-border px-1 py-0.5 rounded text-[10px] text-slate-400">Alt+C</kbd> Customer | <kbd className="bg-slate-900 border border-brand-border px-1 py-0.5 rounded text-[10px] text-slate-400">Alt+D</kbd> Discount | <kbd className="bg-slate-900 border border-brand-border px-1 py-0.5 rounded text-[10px] text-slate-400">Alt+S</kbd> Checkout | <kbd className="bg-slate-900 border border-brand-border px-1 py-0.5 rounded text-[10px] text-slate-400">ESC</kbd> Clear
          </p>
        </div>
      </div>

      {/* POS Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        
        {/* Left Grid Panel: Product Catalog search */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Search box wrapper */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <Search size={16} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by SKU, name, or category... (Alt + P)"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-slate-950/40 border border-brand-border text-sm rounded-2xl pl-11 pr-4 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition backdrop-blur-md"
            />
          </div>

          {/* Product grid list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No matching product SKUs found in local index database.
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const isOutOfStock = prod.stockQty <= 0;
                const isLowStock = prod.stockQty <= 10 && prod.stockQty > 0;
                
                return (
                  <motion.div
                    layout
                    key={prod.id}
                    onClick={() => !isOutOfStock && handleAddToCart(prod.id)}
                    className={`glass-panel border border-brand-border p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between h-40 transition group ${
                      isOutOfStock 
                        ? 'opacity-40 cursor-not-allowed border-rose-500/10' 
                        : 'hover:border-indigo-500/30 cursor-pointer shadow-lg shadow-black/10'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">{prod.sku}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'text-rose-400 bg-rose-500/10'
                            : isLowStock
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-indigo-400 bg-indigo-500/10'
                        }`}>
                          {isOutOfStock ? 'OUT' : isLowStock ? 'LOW' : 'IN STOCK'}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-200 text-sm group-hover:text-indigo-400 transition leading-tight line-clamp-2">
                        {prod.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 capitalize">{prod.category}</span>
                    </div>

                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-brand-border/40">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block font-bold leading-none">Price</span>
                        <span className="text-sm font-extrabold font-mono text-white">${prod.price.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold leading-none">Stock</span>
                        <span className={`text-[11px] font-bold font-mono ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-slate-300'}`}>
                          {prod.stockQty} Qty
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Grid Panel: Checkout Invoice Cart */}
        <div className="xl:col-span-2 space-y-4">
          
          <div className="glass-panel border border-brand-border rounded-2xl p-6 shadow-xl shadow-black/25 flex flex-col justify-between min-h-[580px] backdrop-blur-xl relative">
            
            <div className="space-y-6">
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart size={18} className="text-indigo-400" />
                  <h3 className="text-base font-bold text-white tracking-wide Outfit">Active Transaction</h3>
                </div>
                <button
                  onClick={handleClearCart}
                  disabled={cart.length === 0}
                  className={`text-xs font-semibold flex items-center gap-1.5 transition ${
                    cart.length === 0 
                      ? 'text-slate-600' 
                      : 'text-rose-400 hover:text-rose-300 cursor-pointer'
                  }`}
                >
                  <Trash2 size={13} />
                  <span>Void Cart</span>
                </button>
              </div>

              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Customer Assignment</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={14} />
                  </div>
                  <select
                    ref={customerSelectRef}
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-brand-border text-xs rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-950">Walk-in Customer (Guest)</option>
                    {customers.filter(c => c.deletedAt === 0).map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-950">
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cart Line Items Box */}
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl h-40">
                    <ShoppingCart size={24} className="text-slate-600 mb-2" />
                    <span>Scan or select items to populate cart invoice.</span>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={item.productId}
                        className="glass-card border border-brand-border/40 p-3 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-200 line-clamp-1 leading-tight">{item.name}</h4>
                          <span className="text-[9px] text-slate-500 font-mono font-semibold">{item.sku}</span>
                        </div>

                        {/* Adjust Qty buttons */}
                        <div className="flex items-center bg-slate-950/60 border border-brand-border rounded-lg p-0.5">
                          <button
                            onClick={() => handleUpdateQty(item.productId, -1)}
                            className="w-5 h-5 rounded hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-extrabold text-white">{item.qty}</span>
                          <button
                            onClick={() => handleUpdateQty(item.productId, 1)}
                            className="w-5 h-5 rounded hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Line Item Total price */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-white">${(item.price * item.qty).toFixed(2)}</span>
                          <span className="text-[9px] text-slate-500 block font-mono font-medium">${item.price.toFixed(2)} ea</span>
                        </div>

                        {/* Trash action */}
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Calculations & Totals Footer */}
            <div className="border-t border-brand-border mt-6 pt-4 space-y-3.5">
              
              {/* Discount / Tax adjusters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Discount ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Percent size={11} />
                    </div>
                    <input
                      ref={discountInputRef}
                      type="number"
                      min="0"
                      max={subtotal}
                      value={discount || ''}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="w-full bg-slate-950/60 border border-brand-border text-xs rounded-xl pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500/40 transition font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Tax Rate (%)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Calculator size={11} />
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate || ''}
                      onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="8"
                      className="w-full bg-slate-950/60 border border-brand-border text-xs rounded-xl pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500/40 transition font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-950/50 border border-brand-border/45 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-amber-400 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">- ${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Tax ({taxRate}%)</span>
                  <span className="font-mono font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-brand-border/50 pt-2 flex justify-between items-center text-sm font-extrabold text-white">
                  <span>Grand Total</span>
                  <span className="text-base font-black font-mono text-indigo-400 glow-text-indigo">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action checkout button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl flex items-center justify-center gap-2 border transition ${
                  cart.length === 0 
                    ? 'bg-slate-950/40 text-slate-600 border-slate-950/50 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white border-indigo-500/30 cursor-pointer shadow-lg shadow-indigo-600/15'
                }`}
              >
                <DollarSign size={16} />
                <span>Process Checkout (Alt + S)</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Sales;
