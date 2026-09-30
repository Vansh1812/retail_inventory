import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle, CheckCircle, UserPlus, Loader2 } from 'lucide-react';
import { Customer, CreateOrderFormData } from '../../types/order';
import { Warehouse } from '../../types/warehouse';
import { Product } from '../../types/catalog';
import { InventoryItem } from '../../types/inventory';
import { fetchAllCustomers, createCustomer } from '../../api/customers';
import { fetchWarehouses } from '../../api/warehouses';
import { fetchProducts } from '../../api/catalog';
import { fetchInventoryOverview } from '../../api/inventory';
import { createOrder } from '../../api/orders';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<Record<number, number>>({}); // productId -> availableQuantity

  const [formData, setFormData] = useState<CreateOrderFormData>({
    customerId: '',
    warehouseId: '',
    notes: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
  });

  // Quick Customer Creation inline state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      const [custList, whList, prodList] = await Promise.all([
        fetchAllCustomers(),
        fetchWarehouses('ACTIVE'),
        fetchProducts(0, 100),
      ]);
      setCustomers(custList);
      setWarehouses(whList);
      setProducts(prodList.content);

      if (whList.length > 0 && formData.warehouseId === '') {
        setFormData(prev => ({ ...prev, warehouseId: whList[0].id }));
        loadWarehouseStock(whList[0].id);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load form metadata');
    } finally {
      setDataLoading(false);
    }
  };

  const loadWarehouseStock = async (whId: number) => {
    try {
      const stockItems: InventoryItem[] = await fetchInventoryOverview(whId);
      const stockMap: Record<number, number> = {};
      stockItems.forEach(item => {
        stockMap[item.productId] = item.availableQuantity;
      });
      setWarehouseStock(stockMap);
    } catch (err) {
      console.error('Failed to load live warehouse inventory levels', err);
    }
  };

  const handleWarehouseChange = (whId: number) => {
    setFormData(prev => ({ ...prev, warehouseId: whId }));
    loadWarehouseStock(whId);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      warehouseId: '',
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    });
    setShowAddCustomer(false);
    setWarehouseStock({});
    setError(null);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemProductChange = (index: number, productId: number) => {
    const prod = products.find(p => p.id === productId);
    const price = prod ? prod.sellingPrice : 0;

    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        productId,
        unitPrice: price,
      };
      return { ...prev, items: newItems };
    });
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        quantity: Math.max(1, qty),
      };
      return { ...prev, items: newItems };
    });
  };

  const handleItemPriceChange = (index: number, price: number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        unitPrice: Math.max(0, price),
      };
      return { ...prev, items: newItems };
    });
  };

  const totalAmount = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const p = item.unitPrice || 0;
      const q = item.quantity || 0;
      return sum + p * q;
    }, 0);
  }, [formData.items]);

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustEmail.trim()) {
      setError('Customer name and email are required');
      return;
    }
    try {
      setAddingCustomer(true);
      setError(null);
      const created = await createCustomer({
        name: newCustName.trim(),
        email: newCustEmail.trim(),
        phone: newCustPhone.trim() || undefined,
        address: newCustAddress.trim() || undefined,
      });
      setCustomers(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, customerId: created.id }));
      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustEmail('');
      setNewCustPhone('');
      setNewCustAddress('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to create customer');
    } finally {
      setAddingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setError('Please select or create a customer');
      return;
    }
    if (!formData.warehouseId) {
      setError('Please select a fulfillment warehouse');
      return;
    }
    for (const item of formData.items) {
      if (!item.productId) {
        setError('Please select a product for all line items');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        setError('Quantity must be greater than zero');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await createOrder(formData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Create Customer Sales Order
              </h2>
              <p className="text-[11px] text-slate-400">
                Book client order and reserve warehouse fulfillment inventory
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer & Warehouse Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Customer *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{showAddCustomer ? 'Select Existing' : '+ Quick Add'}</span>
                  </button>
                </div>

                {!showAddCustomer ? (
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerId: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden transition-all"
                    required
                  >
                    <option value="" className="bg-slate-900 text-slate-200">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2">
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Phone"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                      />
                      <input
                        type="text"
                        placeholder="Address"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickAddCustomer}
                      disabled={addingCustomer}
                      className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {addingCustomer ? 'Saving...' : 'Save & Select Customer'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Fulfillment Origin Warehouse *
                </label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => handleWarehouseChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden transition-all"
                  required
                >
                  <option value="" className="bg-slate-900 text-slate-200">-- Select Origin Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                      {w.name} ({w.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items Section */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Order Line Items *
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const selectedProd = products.find(p => p.id === item.productId);
                  const availableStock = item.productId ? (warehouseStock[item.productId as number] ?? 0) : null;
                  const isInsufficient = availableStock !== null && item.quantity > availableStock;

                  return (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/50"
                    >
                      <div className="flex-1 w-full md:w-auto">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemProductChange(index, Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                          required
                        >
                          <option value="" className="bg-slate-900 text-slate-200">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                              {p.sku} - {p.name} (${p.sellingPrice.toFixed(2)})
                            </option>
                          ))}
                        </select>
                        {selectedProd && availableStock !== null && (
                          <div className="mt-1 flex items-center gap-1 text-[11px]">
                            {isInsufficient ? (
                              <span className="text-rose-400 inline-flex items-center font-medium">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Available: {availableStock} (Insufficient stock for reservation!)
                              </span>
                            ) : (
                              <span className="text-emerald-400 inline-flex items-center font-medium">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available in warehouse: {availableStock} units
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="w-24">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemQuantityChange(index, parseInt(e.target.value) || 1)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-mono text-white text-center focus:border-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div className="w-28">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemPriceChange(index, parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-mono text-white text-right focus:border-indigo-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div className="w-28 text-right">
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Subtotal</label>
                        <span className="text-xs font-mono font-bold text-white">
                          ${((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formData.items.length <= 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30 self-center md:self-end mt-2 md:mt-0 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Order Notes / Special Delivery Instructions
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="e.g. Express shipping, gate code #1234, fragile packaging..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden transition-all resize-none"
              />
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-xs font-semibold text-slate-300">
                Calculated Order Total:
              </span>
              <span className="text-2xl font-black font-mono text-indigo-400">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 px-5 py-2 text-xs font-semibold text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Create Order (PENDING)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
