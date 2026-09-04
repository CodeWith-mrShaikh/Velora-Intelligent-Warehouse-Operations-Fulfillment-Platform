import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../../api/products.api';

interface OrderItemInput {
  productId: string;
  quantity: number;
}

export const OrderForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [customerRef, setCustomerRef] = useState(`CUST-${Math.floor(1000 + Math.random() * 9000)}`);
  const [items, setItems] = useState<OrderItemInput[]>([{ productId: 'WM-001', quantity: 1 }]);

  const { data: productsData } = useQuery({
    queryKey: ['products-dropdown-list'],
    queryFn: () => getProducts({ limit: 100 }),
    staleTime: 60 * 1000
  });

  const products = useMemo(() => productsData?.data || [], [productsData]);

  const productMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of products) {
      if (p.sku) map.set(p.sku.toLowerCase(), p);
      if (p.id) map.set(p.id.toLowerCase(), p);
    }
    return map;
  }, [products]);

  const addItem = () => setItems([...items, { productId: '', quantity: 1 }]);

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItemInput, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items
      .filter(item => item.productId.trim().length > 0 && item.quantity > 0)
      .map(item => ({
        sku: item.productId.trim(),
        productId: item.productId.trim(),
        quantity: Number(item.quantity)
      }));

    if (validItems.length === 0) return;

    onSubmit({
      customerReference: customerRef.trim(),
      customerRef: customerRef.trim(),
      items: validItems
    });
  };

  const estimatedTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const match = productMap.get(it.productId.trim().toLowerCase());
      if (match) {
        return sum + Number(match.unitPrice || match.price || 0) * (Number(it.quantity) || 1);
      }
      return sum;
    }, 0);
  }, [items, productMap]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <datalist id="order-products-datalist">
        {products.map(p => (
          <option key={p.id} value={p.sku}>
            {p.name} — ${Number(p.unitPrice || p.price || 0).toFixed(2)}
          </option>
        ))}
      </datalist>

      <div>
        <label className="block text-sm font-semibold text-slate-700">
          Customer Reference
        </label>
        <input
          required
          type="text"
          placeholder="e.g. CUST-5821"
          value={customerRef}
          onChange={e => setCustomerRef(e.target.value)}
          className="mt-1 block w-full border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Order Items</label>
            <span className="text-xs text-slate-500">Select product SKU and enter requested quantity</span>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors"
          >
            <Plus size={14} className="mr-1" /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const matchedProduct = productMap.get(item.productId.trim().toLowerCase());

            return (
              <div
                key={index}
                className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      required
                      type="text"
                      list="order-products-datalist"
                      placeholder="Type or select SKU (e.g. WM-001)"
                      value={item.productId}
                      onChange={e => updateItem(index, 'productId', e.target.value)}
                      className="block w-full border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="block w-full border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 text-center bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {matchedProduct && (
                  <div className="flex justify-between items-center text-xs text-slate-600 bg-white px-3 py-1.5 rounded border border-slate-100">
                    <span className="font-medium text-slate-800 truncate mr-2">
                      {matchedProduct.name}
                    </span>
                    <div className="shrink-0 space-x-3">
                      <span>${Number(matchedProduct.unitPrice || matchedProduct.price || 0).toFixed(2)} / unit</span>
                      <span className="font-semibold text-blue-600">
                        Subtotal: ${(Number(matchedProduct.unitPrice || matchedProduct.price || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {estimatedTotal > 0 && (
        <div className="flex justify-between items-center bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
          <span className="text-sm font-medium text-blue-900 flex items-center">
            <ShoppingBag size={16} className="mr-2 text-blue-600" />
            Estimated Total
          </span>
          <span className="text-lg font-bold text-blue-700">
            ${estimatedTotal.toFixed(2)}
          </span>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Creating Order...
            </>
          ) : (
            'Create Order'
          )}
        </button>
      </div>
    </form>
  );
};
