import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  toggleProductStatus,
} from '../../api/catalog';
import { Category, Product, ProductFormData, ProductStatus } from '../../types/catalog';
import { ProductFormModal } from '../../components/catalog/ProductFormModal';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Power,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const ProductsListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageCatalog = hasRole('ADMIN') || hasRole('INVENTORY_MANAGER');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | ''>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Status Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Categories on mount
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const loadProducts = useCallback(
    async (
      targetPage: number = page,
      searchQuery: string = debouncedSearch,
      catId: number | '' = selectedCategory,
      stat: ProductStatus | '' = selectedStatus
    ) => {
      setLoading(true);
      try {
        const data = await fetchProducts(targetPage, 10, searchQuery, catId, stat);
        setProducts(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setPage(data.number);
      } catch (err: unknown) {
        const errObj = err as { message?: string };
        setAlert({ type: 'error', message: errObj.message || 'Failed to load product catalog.' });
      } finally {
        setLoading(false);
      }
    },
    [page, debouncedSearch, selectedCategory, selectedStatus]
  );

  useEffect(() => {
    loadProducts(page, debouncedSearch, selectedCategory, selectedStatus);
  }, [loadProducts, page, debouncedSearch, selectedCategory, selectedStatus]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: ProductFormData) => {
    if (editingProduct) {
      const updated = await updateProduct(editingProduct.id, formData);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setAlert({ type: 'success', message: `SKU '${updated.sku}' updated successfully.` });
    } else {
      const created = await createProduct(formData);
      setProducts((prev) => [created, ...prev]);
      setTotalElements((prev) => prev + 1);
      setAlert({ type: 'success', message: `Product '${created.sku}' added to catalog.` });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    setTogglingId(product.id);
    setAlert(null);
    try {
      const updated = await toggleProductStatus(product.id);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setAlert({
        type: 'success',
        message: `SKU '${product.sku}' status changed to ${updated.status}.`,
      });
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to toggle product status.' });
    } finally {
      setTogglingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Product Catalog
            </span>
            <span className="text-xs text-slate-400">Master SKU Directory &amp; Pricing</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-2">
            Products &amp; SKU Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage product identifiers, categories, wholesale cost, consumer pricing, and automated reorder points.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadProducts(page)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {canManageCatalog && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Notification Banner */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs backdrop-blur-md animate-in fade-in duration-200 ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {alert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 shadow-lg shadow-black/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU or product name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value === '' ? '' : Number(e.target.value));
                setPage(0);
              }}
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                  {cat.name} ({cat.productCount})
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div className="w-full sm:w-36">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as ProductStatus | '');
                setPage(0);
              }}
              className="w-full px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="ACTIVE" className="bg-slate-900 text-slate-200">ACTIVE</option>
              <option value="INACTIVE" className="bg-slate-900 text-slate-200">INACTIVE</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
          Displaying <span className="font-bold text-slate-200">{products.length}</span> of{' '}
          <span className="font-bold text-slate-200">{totalElements}</span> catalog SKUs
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">SKU Code</th>
                <th className="py-3.5 px-6">Product Details</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6 text-right">Cost Price</th>
                <th className="py-3.5 px-6 text-right">Selling Price</th>
                <th className="py-3.5 px-6 text-center">Margin</th>
                <th className="py-3.5 px-6 text-center">Reorder Lvl</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                {canManageCatalog && <th className="py-3.5 px-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                      <span>Loading catalog products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products found matching the specified filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const marginPercent =
                    p.sellingPrice > 0
                      ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* SKU */}
                      <td className="py-4 px-6 font-mono font-bold text-indigo-400">
                        {p.sku}
                      </td>

                      {/* Product Name */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-semibold text-white">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/80">
                          {p.categoryName}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-4 px-6 text-right font-mono text-slate-400">
                        {formatCurrency(p.costPrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-6 text-right font-mono font-semibold text-white">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Gross Margin */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            Number(marginPercent) >= 30
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {marginPercent}%
                        </span>
                      </td>

                      {/* Reorder Level */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1 font-mono text-slate-300 font-medium">
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          <span>{p.reorderLevel} units</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              p.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          <span>{p.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      {canManageCatalog && (
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Edit Product Details"
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(p)}
                              disabled={togglingId === p.id}
                              title={p.status === 'ACTIVE' ? 'Deactivate SKU' : 'Activate SKU'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                p.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Page <span className="font-semibold text-slate-200">{page + 1}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalPages || 1}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0 || loading}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialProduct={editingProduct}
        categories={categories}
      />
    </div>
  );
};
