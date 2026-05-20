import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Users, 
  UserPlus 
} from 'lucide-react';
import { useCustomers } from '../db/hooks/useCustomers';
import { LocalCustomer } from '../db';

export const Customers: React.FC = () => {
  const { customers, saveCustomer, deleteCustomer } = useCustomers();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<LocalCustomer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered Customers
  const filteredCustomers = customers.filter(c => 
    c.deletedAt === 0 && (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cust: LocalCustomer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) return setFormError('Customer Name is required.');

    try {
      const customerPayload = {
        id: editingCustomer ? editingCustomer.id : crypto.randomUUID(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        deletedAt: 0,
        version: editingCustomer ? editingCustomer.version : 1
      };

      await saveCustomer(customerPayload);
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Failed to save customer in local database.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      await deleteCustomer(id);
    }
  };

  return (
    <div className="space-y-6 relative select-none">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight Outfit">
            Customer Directory
          </h1>
          <p className="text-slate-400 text-xs mt-1">Manage offline customer portfolios and assign sales details.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search size={15} />
        </div>
        <input
          type="text"
          placeholder="Search customers by Name, Phone number, or Email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/40 border border-brand-border text-xs rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition"
        />
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center">
            <Users size={28} className="text-slate-600 mb-2 animate-bounce" />
            <span>Directory empty. Register a customer to manage client assignments.</span>
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <motion.div
              layout
              key={cust.id}
              className="glass-panel border border-brand-border p-5 rounded-2xl flex flex-col justify-between h-40 relative group shadow-lg"
            >
              {/* Customer Info */}
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                    cust.syncStatus === 'pending'
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {cust.syncStatus === 'pending' ? 'Unsynced' : 'Synced'}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-100 text-base leading-snug group-hover:text-indigo-400 transition line-clamp-1">
                  {cust.name}
                </h3>
                {cust.email && <span className="text-[11px] text-slate-400 block">{cust.email}</span>}
                {cust.phone && <span className="text-[11px] text-slate-400 block">{cust.phone}</span>}
              </div>

              {/* Address indicator */}
              {cust.address && (
                <div className="border-t border-brand-border/40 pt-2 mt-2">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold leading-none">Shipping Address</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{cust.address}</span>
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-300">
                <button
                  onClick={() => openEditModal(cust)}
                  className="p-1.5 bg-slate-900 border border-brand-border rounded-lg text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => handleDelete(cust.id, cust.name)}
                  className="p-1.5 bg-slate-900 border border-brand-border rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Customer Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel border border-brand-border rounded-2xl max-w-md w-full p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-5">
                <h3 className="text-base font-bold text-white tracking-wide Outfit flex items-center gap-2">
                  <UserPlus size={18} className="text-indigo-400" />
                  <span>{editingCustomer ? 'Update Customer Record' : 'Register New Customer'}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
                <div className="space-y-1">
                  <label className="text-slate-400 block">Customer Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. johndoe@example.com"
                    className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block">Postal Address</label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 100 Broadway Ave, New York, NY"
                    className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 transition mt-6 cursor-pointer"
                >
                  {editingCustomer ? 'Save Customer Changes' : 'Confirm Registration'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Customers;
