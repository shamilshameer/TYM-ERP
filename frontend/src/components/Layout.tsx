import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  ShoppingCart, 
  History,
  Wifi, 
  WifiOff, 
  RefreshCw 
} from 'lucide-react';
import { useConnectivity } from '../db/hooks/useConnectivity';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isOnline, isSyncing, queueCount, syncNow } = useConnectivity();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: ShoppingBag },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'New Sale', path: '/sales', icon: ShoppingCart },
    { name: 'Sales History', path: '/history', icon: History },
  ];

  return (
    <div className="min-h-screen flex bg-brand-bg text-slate-100 font-sans relative overflow-hidden">
      {/* Dynamic Background Glowing Orbs */}
      <div className="orb w-[500px] h-[500px] bg-indigo-500 top-[-100px] left-[-100px]" />
      <div className="orb w-[500px] h-[500px] bg-cyan-500 bottom-[-100px] right-[-100px]" />
      
      {/* Sidebar - Dark Glassmorphism */}
      <aside className="w-64 border-r border-brand-border bg-slate-950/40 backdrop-blur-xl flex flex-col justify-between p-6 z-10 shrink-0 select-none">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <span className="font-bold text-xl glow-text-indigo">S</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-wide bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">SyncERP</h1>
              <span className="text-[10px] text-slate-500 tracking-widest uppercase font-semibold">Offline-First</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium relative transition duration-300 ${
                    isActive 
                      ? 'text-indigo-400' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {/* Indicator for Active State */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl -z-10 shadow-inner"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sync & Connection Footer Widget */}
        <div className="glass-card border border-brand-border rounded-xl p-4 space-y-4">
          {/* Connection Status Indicator */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Connectivity</span>
            <div className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-full ${
              isOnline 
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.1)]' 
                : 'text-rose-400 bg-rose-500/10 border border-rose-500/20 shadow-[0_0_8px_rgba(251,113,133,0.1)]'
            }`}>
              {isOnline ? (
                <>
                  <Wifi size={12} />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Sync Queue Monitor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Outbox Buffer</span>
              <span className="font-semibold">{queueCount} pending</span>
            </div>
            
            {/* Outbox progress bar */}
            <div className="w-full bg-slate-950/80 border border-brand-border h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${queueCount > 0 ? 'bg-indigo-500 shadow-glow-indigo' : 'bg-emerald-500'}`}
                animate={{ width: queueCount > 0 ? '60%' : '100%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Manual sync syncNow trigger */}
          <button
            onClick={syncNow}
            disabled={isSyncing || !isOnline}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border transition ${
              !isOnline 
                ? 'bg-slate-950/40 text-slate-600 border-slate-950/50 cursor-not-allowed'
                : 'bg-indigo-600/10 hover:bg-indigo-600/20 active:bg-indigo-600/30 text-indigo-400 border-indigo-500/30 shadow-lg shadow-indigo-500/5 cursor-pointer'
            }`}
          >
            <RefreshCw 
              size={13} 
              className={`${isSyncing ? 'animate-spin' : ''} ${!isOnline ? 'text-slate-600' : 'text-indigo-400'}`} 
            />
            <span>{isSyncing ? 'Syncing...' : 'Sync Diagnostics'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 z-10 relative">
        {/* Offline Warning Banner */}
        {!isOnline && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-400 text-xs shadow-lg shadow-amber-500/5"
          >
            <WifiOff size={16} className="animate-pulse" />
            <div className="flex-1">
              <span className="font-semibold">Local Offline Sandbox Mode Active</span> — You can safely perform sales checkout, manage customers, and add inventory. All operations are stored in your secure local IndexedDB and will synchronize automatically once your connection is restored.
            </div>
          </motion.div>
        )}
        
        {/* Render child pages */}
        {children}
      </main>
    </div>
  );
};

export default Layout;
