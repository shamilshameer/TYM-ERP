import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  ShoppingBag, 
  FolderPlus 
} from 'lucide-react';
import { useProducts } from '../db/hooks/useProducts';
import { LocalProduct } from '../db';

export const Products: React.FC = () => {
  const { products, saveProduct, deleteProduct } = useProducts();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [stockQty, setStockQty] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Unique categories list
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setCategory('');
    setPrice(0);
    setStockQty(0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: LocalProduct) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setCategory(prod.category);
    setPrice(prod.price);
    setStockQty(prod.stockQty);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) return setFormError('Product Name is required.');
    if (!sku.trim()) return setFormError('SKU is required.');
    if (!category.trim()) return setFormError('Category is required.');
    if (price <= 0) return setFormError('Price must be greater than $0.00.');
    if (stockQty < 0) return setFormError('Stock level cannot be negative.');

    // Check SKU uniqueness locally (exclude own SKU if editing)
    const skuExists = products.some(p => p.sku === sku && p.id !== editingProduct?.id);
    if (skuExists) return setFormError(`Product SKU "${sku}" already exists.`);

    try {
      const productPayload = {
        id: editingProduct ? editingProduct.id : crypto.randomUUID(),
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim().toLowerCase(),
        price,
        stockQty,
        deletedAt: 0,
        version: editingProduct ? editingProduct.version : 1
      };

      await saveProduct(productPayload);
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Failed to save product in local database.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}"?`)) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6 relative select-none">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight Outfit">
            Inventory Catalog
          </h1>
          <p className="text-slate-400 text-xs mt-1">Manage and track your retail product levels offline.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Register Product</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative md:col-span-3">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={15} />
          </div>
          <input
            type="text"
            placeholder="Search products by SKU or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/40 border border-brand-border text-xs rounded-xl pl-10 pr-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 transition"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full bg-slate-950/40 border border-brand-border text-xs rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500/40 transition appearance-none cursor-pointer capitalize"
        >
          <option value="" className="bg-slate-950">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat} className="bg-slate-950 capitalize">{cat}</option>
          ))}
        </select>
      </div>

      {/* Inventory Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center">
            <ShoppingBag size={28} className="text-slate-600 mb-2 animate-bounce" />
            <span>Catalog empty. Register a product to begin tracking.</span>
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <motion.div
              layout
              key={prod.id}
              className="glass-panel border border-brand-border p-5 rounded-2xl flex flex-col justify-between h-44 relative group shadow-lg"
            >
              {/* Product Info */}
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">{prod.sku}</span>
                  <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                    prod.syncStatus === 'pending'
                      ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  }`}>
                    {prod.syncStatus === 'pending' ? 'Unsynced' : 'Synced'}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-100 text-base leading-snug group-hover:text-indigo-400 transition line-clamp-1">
                  {prod.name}
                </h3>
                <span className="text-[10px] text-slate-500 capitalize">{prod.category}</span>
              </div>

              {/* Price & Stock */}
              <div className="flex justify-between items-end border-t border-brand-border/40 pt-3 mt-3">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-bold leading-none">Cost</span>
                  <span className="text-base font-extrabold font-mono text-white">${prod.price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-bold leading-none text-right">In Stock</span>
                  <span className={`text-xs font-bold font-mono block text-right mt-0.5 ${
                    prod.stockQty <= 0 
                      ? 'text-rose-500' 
                      : prod.stockQty <= 10 
                      ? 'text-amber-500' 
                      : 'text-slate-300'
                  }`}>
                    {prod.stockQty} Units
                  </span>
                </div>
              </div>

              {/* Action buttons (Appear on Hover) */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition duration-300">
                <button
                  onClick={() => openEditModal(prod)}
                  className="p-1.5 bg-slate-900 border border-brand-border rounded-lg text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => handleDelete(prod.id, prod.name)}
                  className="p-1.5 bg-slate-900 border border-brand-border rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* CRUD Add/Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel border border-brand-border rounded-2xl max-w-md w-full p-6 relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-5">
                <h3 className="text-base font-bold text-white tracking-wide Outfit flex items-center gap-2">
                  <FolderPlus size={18} className="text-indigo-400" />
                  <span>{editingProduct ? 'Update Product Details' : 'Register New Product'}</span>
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
                  <label className="text-slate-400 block">Product SKU / Barcode</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={!!editingProduct}
                    placeholder="e.g. BARCODE123"
                    className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 uppercase font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Wireframe Gaming Mouse"
                    className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. electronics"
                    className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 lowercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 block">Unit Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="29.99"
                      className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 block">Initial Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={stockQty || ''}
                      onChange={(e) => setStockQty(parseInt(e.target.value) || 0)}
                      placeholder="100"
                      className="w-full bg-slate-950/60 border border-brand-border rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 font-mono font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 transition mt-6 cursor-pointer"
                >
                  {editingProduct ? 'Save Product Changes' : 'Confirm Registration'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Products;
