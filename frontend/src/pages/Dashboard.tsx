import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Send,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { useProducts } from '../db/hooks/useProducts';
import { useSales } from '../db/hooks/useSales';
import { useConnectivity } from '../db/hooks/useConnectivity';

export const Dashboard: React.FC = () => {
  const { products, isLoading: productsLoading } = useProducts();
  const { sales, isLoading: salesLoading } = useSales();
  const { isOnline, isSyncing, queueCount, lastSyncedAt } = useConnectivity();

  // 1. Calculations & KPIs
  // Today's Sales Sum
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(s => s.saleDate >= todayStart.getTime());
  const todaySalesSum = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Total Inventory Value
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stockQty), 0);

  // Low Stock Items (Stock qty <= 10)
  const lowStockThreshold = 10;
  const lowStockProducts = products.filter(p => p.stockQty <= lowStockThreshold);
  const lowStockCount = lowStockProducts.length;

  // Last Sync display string
  const getLastSyncString = () => {
    if (!lastSyncedAt) return 'Never';
    const diffMins = Math.floor((Date.now() - lastSyncedAt) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    return `${diffMins} minutes ago`;
  };

  // 2. Custom SVG Chart Mock Data
  // Generate mock revenue points for last 7 days including today
  const last7DaysRevenue = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    d.setHours(0, 0, 0, 0);
    
    // Sum matching day sales
    const daySales = sales.filter(s => {
      const saleDay = new Date(s.saleDate);
      saleDay.setHours(0, 0, 0, 0);
      return saleDay.getTime() === d.getTime();
    });

    const sum = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { label: dayName, value: sum };
  });

  const maxRevenue = Math.max(...last7DaysRevenue.map(d => d.value), 100);

  // Category Inventory values for bar distribution chart
  const categories = products.reduce((acc: Record<string, number>, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.stockQty;
    return acc;
  }, {});

  const categoryDistribution = Object.entries(categories).map(([name, qty]) => ({
    name,
    qty,
  })).slice(0, 5); // display top 5 categories

  const maxCategoryQty = Math.max(...categoryDistribution.map(c => c.qty), 1);

  // Grid transition setup
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
  };

  return (
    <div className="space-y-8 select-none">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight Outfit">
            Control Center
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Futuristic real-time overview of your retail register node.
          </p>
        </div>

        {/* Sync Status Floating Widget */}
        <div className="flex items-center gap-4 bg-slate-950/40 border border-brand-border backdrop-blur-xl py-2.5 px-4 rounded-2xl">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-bold block leading-none uppercase tracking-wider">Sync State</span>
            <span className="text-xs text-slate-300 font-semibold mt-0.5 inline-block">
              {isSyncing ? 'Synchronizing database...' : `Last Synced: ${getLastSyncString()}`}
            </span>
          </div>
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
            isOnline 
              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* KPI 1: Today's Revenue */}
        <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Today's Revenue</span>
              <h2 className="text-3xl font-extrabold text-white leading-none Outfit">
                ${todaySalesSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-indigo-400 font-semibold block bg-indigo-500/10 border border-indigo-500/20 py-0.5 px-2 rounded-full w-max">
                {todaySales.length} Transactions
              </span>
            </div>
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/5">
              <DollarSign size={18} className="glow-text-indigo" />
            </div>
          </div>
        </motion.div>

        {/* KPI 2: Total Inventory Valuation */}
        <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Inventory Value</span>
              <h2 className="text-3xl font-extrabold text-white leading-none Outfit">
                ${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-cyan-400 font-semibold block bg-cyan-500/10 border border-cyan-500/20 py-0.5 px-2 rounded-full w-max">
                {products.length} Active SKUs
              </span>
            </div>
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/5">
              <Package size={18} className="glow-text-cyan" />
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Outbox Sync Queue */}
        <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sync Buffer Queue</span>
              <h2 className="text-3xl font-extrabold text-white leading-none Outfit">
                {queueCount}
              </h2>
              <span className={`text-[10px] font-semibold block py-0.5 px-2 rounded-full w-max border ${
                queueCount > 0 
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {queueCount > 0 ? 'Pending Push Transmission' : 'Database fully synchronized'}
              </span>
            </div>
            <div className={`w-10 h-10 border rounded-xl flex items-center justify-center shadow-lg ${
              queueCount > 0 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5'
            }`}>
              <Send size={16} className={queueCount > 0 ? 'glow-text-amber' : 'glow-text-emerald'} />
            </div>
          </div>
        </motion.div>

        {/* KPI 4: Low Stock Products count */}
        <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group shadow-lg shadow-black/20">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Low Stock Products</span>
              <h2 className="text-3xl font-extrabold text-white leading-none Outfit">
                {lowStockCount}
              </h2>
              <span className={`text-[10px] font-semibold block py-0.5 px-2 rounded-full w-max border ${
                lowStockCount > 0 
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                  : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
              }`}>
                {lowStockCount > 0 ? 'Requires stock replenishing' : 'Inventory levels optimal'}
              </span>
            </div>
            <div className={`w-10 h-10 border rounded-xl flex items-center justify-center shadow-lg ${
              lowStockCount > 0 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/5' 
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              <AlertTriangle size={18} className={lowStockCount > 0 ? 'glow-text-rose animate-pulse' : ''} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Grid for Charts & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Glowing Custom Revenue SVG Line Chart */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400">
                <TrendingUp size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Revenue Trend (Last 7 Days)</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide Outfit">Sales Volume Velocity</h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Max Single Day</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">${maxRevenue.toFixed(2)}</span>
            </div>
          </div>

          {/* SVG Line Graph */}
          <div className="relative h-48 w-full mt-4 select-none">
            {salesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500/10 border-t-indigo-400 rounded-full animate-spin" />
              </div>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 700 180" preserveAspectRatio="none">
                <defs>
                  {/* Linear Gradient for Line Fill */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Linear Gradient for Stroke Line */}
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <line x1="0" y1="80" x2="700" y2="80" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                <line x1="0" y1="130" x2="700" y2="130" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                {/* Chart Path Area Fill */}
                <path
                  d={`
                    M 0 160
                    ${last7DaysRevenue.map((d, i) => {
                      const x = (i * (700 / 6));
                      const y = 160 - ((d.value / maxRevenue) * 120);
                      return `L ${x} ${y}`;
                    }).join(' ')}
                    L 700 160 Z
                  `}
                  fill="url(#areaGrad)"
                />

                {/* Glowing Stroke Line */}
                <path
                  d={last7DaysRevenue.map((d, i) => {
                    const x = (i * (700 / 6));
                    const y = 160 - ((d.value / maxRevenue) * 120);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Glowing Grid Orbits */}
                {last7DaysRevenue.map((d, i) => {
                  const x = (i * (700 / 6));
                  const y = 160 - ((d.value / maxRevenue) * 120);
                  return (
                    <g key={i} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="8" fill="#6366f1" fillOpacity="0.1" stroke="#6366f1" strokeOpacity="0.2" strokeWidth="6" />
                      <circle cx={x} cy={y} r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" className="shadow-[0_0_10px_#6366f1]" />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between px-2 mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            {last7DaysRevenue.map((d, i) => (
              <span key={i}>{d.label}</span>
            ))}
          </div>
        </div>

        {/* Inventory Category Share Card */}
        <div className="glass-panel rounded-2xl p-6 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-400">
              <PieIcon size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Stock Distributions</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide Outfit">Category Shares</h3>
          </div>

          {productsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : categoryDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">
              No product stock registered.
            </div>
          ) : (
            <div className="space-y-4 my-6">
              {categoryDistribution.map((cat, idx) => {
                const colors = ['bg-indigo-500 shadow-glow-indigo', 'bg-cyan-500 shadow-glow-cyan', 'bg-emerald-500 shadow-glow-emerald', 'bg-amber-500', 'bg-rose-500'];
                const textColors = ['text-indigo-400', 'text-cyan-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400'];
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 font-medium capitalize">{cat.name}</span>
                      <span className={`${textColors[idx % colors.length]} font-mono`}>{cat.qty} units</span>
                    </div>
                    {/* Glowing progress bars */}
                    <div className="w-full bg-slate-950/70 border border-brand-border h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.qty / maxCategoryQty) * 100}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className={`h-full ${colors[idx % colors.length]}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[10px] text-slate-500 leading-tight">
            * Displays quantities of products inside indexed category partitions.
          </div>
        </div>
      </div>

      {/* Low Stock Warning Table */}
      <div className="glass-panel rounded-2xl p-6 shadow-lg shadow-black/20">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-wide Outfit">Critical Depletion Alerts</h3>
            <p className="text-xs text-slate-500">Inventory items currently at or below the warning threshold (10 units).</p>
          </div>
          <span className="text-xs font-bold font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-xl">
            {lowStockCount} Flags
          </span>
        </div>

        {productsLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-rose-500/10 border-t-rose-400 rounded-full animate-spin" />
          </div>
        ) : lowStockProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            Clean status report: All registered product stock is above the critical warning threshold.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-500 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-4 font-semibold">SKU / Code</th>
                  <th className="pb-3 px-4 font-semibold">Product Name</th>
                  <th className="pb-3 px-4 font-semibold">Category</th>
                  <th className="pb-3 px-4 font-semibold">Unit Cost</th>
                  <th className="pb-3 px-4 font-semibold text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {lowStockProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-white/[0.02] transition duration-150">
                    <td className="py-4 px-4 font-mono font-bold text-indigo-400">{prod.sku}</td>
                    <td className="py-4 px-4 font-medium text-slate-200">{prod.name}</td>
                    <td className="py-4 px-4 text-slate-400 capitalize">{prod.category}</td>
                    <td className="py-4 px-4 font-semibold font-mono text-slate-300">${prod.price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-mono font-bold px-2.5 py-0.5 rounded-lg border ${
                        prod.stockQty === 0
                          ? 'text-rose-500 bg-rose-500/15 border-rose-500/30'
                          : 'text-amber-500 bg-amber-500/15 border-amber-500/30'
                      }`}>
                        {prod.stockQty === 0 ? 'DEPLETED' : `${prod.stockQty} left`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
