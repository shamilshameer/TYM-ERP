import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  History, 
  Trash2, 
  X, 
  Eye, 
  FileText,
  User
} from 'lucide-react';
import { useSales } from '../db/hooks/useSales';
import { useCustomers } from '../db/hooks/useCustomers';
import { useProducts } from '../db/hooks/useProducts';
import { LocalSale, LocalSaleItem } from '../db';

export const SalesHistory: React.FC = () => {
  const { sales, voidSale, getSaleDetails } = useSales();
  const { customers } = useCustomers();
  const { products } = useProducts();

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Sale Details Modal
  const [selectedSale, setSelectedSale] = useState<LocalSale | null>(null);
  const [selectedSaleItems, setSelectedSaleItems] = useState<LocalSaleItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Helper: Resolve Customer Name
  const getCustomerName = (customerId?: string | null) => {
    if (!customerId) return 'Walk-in Customer';
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.name : 'Unknown Customer';
  };

  // Filtered sales list
  const filteredSales = sales.filter(s => {
    const custName = getCustomerName(s.customerId).toLowerCase();
    const matchesId = s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCustomer = custName.includes(searchQuery.toLowerCase());
    return matchesId || matchesCustomer;
  });

  const handleOpenDetail = async (sale: LocalSale) => {
    const details = await getSaleDetails(sale.id);
    if (details) {
      setSelectedSale(details.sale);
      setSelectedSaleItems(details.items);
      setIsDetailOpen(true);
    }
  };

  const handleVoidSale = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening modal
    if (confirm('Void this invoice? This will restock all associated products and mark the transaction as voided.')) {
      await voidSale(id);
    }
  };

  // Helper: Get Product details inside modal
  const getProductDetails = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    return {
      name: prod ? prod.name : 'Unknown Product',
      sku: prod ? prod.sku : 'N/A'
    };
  };

  return (
    <div className="space-y-6 relative select-none">
      
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight Outfit">
          Transaction Records
        </h1>
        <p className="text-slate-400 text-xs mt-1">Review historical invoices, inspect itemized receipts, and void transactions.</p>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search size={15} />
        </div>
        <input
          type="text"
          placeholder="Search by Transaction ID or Customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/40 border border-brand-border text-xs rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition"
        />
      </div>

      {/* Invoices List table */}
      <div className="glass-panel border border-brand-border rounded-2xl shadow-xl overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
            <History size={28} className="text-slate-600 mb-2" />
            <span>No historical records found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6 font-semibold">Transaction ID</th>
                  <th className="py-3.5 px-6 font-semibold">Assigned Customer</th>
                  <th className="py-3.5 px-6 font-semibold">Sale Date</th>
                  <th className="py-3.5 px-6 font-semibold">Total Cost</th>
                  <th className="py-3.5 px-6 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredSales.map((sale) => (
                  <tr 
                    key={sale.id} 
                    onClick={() => handleOpenDetail(sale)}
                    className="hover:bg-white/[0.02] cursor-pointer transition duration-150"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-indigo-400">{sale.id.substring(0, 8).toUpperCase()}</td>
                    <td className="py-4 px-6 font-medium text-slate-200">{getCustomerName(sale.customerId)}</td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(sale.saleDate).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-semibold font-mono text-slate-300">${sale.totalAmount.toFixed(2)}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        sale.syncStatus === 'pending'
                          ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      }`}>
                        {sale.syncStatus === 'pending' ? 'Unsynced' : 'Synced'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(sale)}
                          className="p-1.5 bg-slate-900 border border-brand-border rounded-lg text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={(e) => handleVoidSale(e, sale.id)}
                          className="p-1.5 bg-slate-900 border border-brand-border rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Receipt Detail Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel border border-brand-border rounded-2xl max-w-xl w-full p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              {/* Receipt Header */}
              <div className="flex justify-between items-center border-b border-brand-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-400" />
                  <h3 className="text-base font-bold text-white tracking-wide Outfit">Invoice Receipt</h3>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Transaction Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 border border-brand-border rounded-xl p-3.5 text-[11px] mb-5 text-slate-400">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 uppercase block font-bold text-[9px] leading-none">Invoice ID</span>
                    <span className="font-mono font-bold text-slate-300">{selectedSale.id.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block font-bold text-[9px] leading-none">Issue Date</span>
                    <span className="font-mono text-slate-300">{new Date(selectedSale.saleDate).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 uppercase block font-bold text-[9px] leading-none">Customer Assignment</span>
                    <span className="text-slate-300 flex items-center gap-1 mt-0.5">
                      <User size={12} className="text-slate-500" />
                      <span>{getCustomerName(selectedSale.customerId)}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase block font-bold text-[9px] leading-none">Synchronization</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      selectedSale.syncStatus === 'pending'
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                        : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    }`}>
                      {selectedSale.syncStatus === 'pending' ? 'Unsynced buffer' : 'Synced database'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized list of sales */}
              <div className="space-y-2 mb-6">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Itemized Ledger</span>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {selectedSaleItems.map((item) => {
                    const prod = getProductDetails(item.productId);
                    return (
                      <div key={item.id} className="glass-card border border-brand-border/40 p-3 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-200 line-clamp-1">{prod.name}</h4>
                          <span className="text-[9px] text-slate-500 font-mono font-semibold">{prod.sku}</span>
                        </div>

                        <div className="flex gap-6 items-center text-right">
                          <div className="font-mono text-slate-400">
                            <span>x{item.qty}</span>
                          </div>
                          <div className="font-mono text-right min-w-[70px]">
                            <span className="font-bold text-white">${item.totalPrice.toFixed(2)}</span>
                            <span className="text-[9px] text-slate-500 block">${item.unitPrice.toFixed(2)} ea</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkout Totals details */}
              <div className="border-t border-brand-border/60 pt-4 flex justify-between items-center text-sm font-extrabold text-white">
                <span className="text-slate-400 text-xs">Invoice Valuation</span>
                <span className="text-lg font-black font-mono text-indigo-400 glow-text-indigo">${selectedSale.totalAmount.toFixed(2)}</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SalesHistory;
