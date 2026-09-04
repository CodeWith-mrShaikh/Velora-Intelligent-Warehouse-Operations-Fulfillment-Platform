import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustStock } from '../../api/inventory.api';
import { getBins } from '../../api/bins.api';
import { getProducts } from '../../api/products.api';
import { Modal } from '../common/Modal';
import toast from 'react-hot-toast';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItem?: {
    productId?: string;
    binId?: string;
    productName?: string;
    sku?: string;
    binLocation?: string;
    available?: number;
    quantity?: number;
  } | null;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ isOpen, onClose, preselectedItem }) => {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [binId, setBinId] = useState('');
  const [type, setType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => getProducts({ limit: 1000 }),
    enabled: isOpen
  });

  const { data: binsData, isLoading: isBinsLoading } = useQuery({
    queryKey: ['bins-all'],
    queryFn: () => getBins(),
    enabled: isOpen
  });

  const products = Array.isArray(productsData) ? productsData : (productsData?.data || []);
  const bins = Array.isArray(binsData) ? binsData : [];

  useEffect(() => {
    if (isOpen) {
      if (preselectedItem?.productId) setProductId(preselectedItem.productId);
      else if (products.length > 0 && !productId) setProductId(products[0].id);

      if (preselectedItem?.binId) setBinId(preselectedItem.binId);
      else if (bins.length > 0 && !binId) setBinId(bins[0].id);

      setType('INCREASE');
      setQuantity('');
      setReason('');
    }
  }, [isOpen, preselectedItem]);

  const mutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      toast.success('Stock adjusted successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['bins-all'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to adjust stock';
      toast.error(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Please select a product');
      return;
    }
    if (!binId) {
      toast.error('Please select a bin');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required for inventory adjustments');
      return;
    }

    const delta = type === 'DECREASE' ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));

    if (type === 'DECREASE' && preselectedItem?.available !== undefined && Math.abs(delta) > preselectedItem.available) {
      toast.error(`Cannot decrease by more than available stock (${preselectedItem.available})`);
      return;
    }

    mutation.mutate({
      productId,
      binId,
      quantity: delta,
      reason: reason.trim()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock (Cycle Count / Write-off)" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
          {isProductsLoading ? (
            <div className="text-sm text-slate-400">Loading products...</div>
          ) : (
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            >
              <option value="">Select a product</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bin Location</label>
          {isBinsLoading ? (
            <div className="text-sm text-slate-400">Loading bins...</div>
          ) : (
            <select
              value={binId}
              onChange={(e) => setBinId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              required
            >
              <option value="">Select a bin</option>
              {bins.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.locationCode}
                </option>
              ))}
            </select>
          )}
          {preselectedItem && (
            <span className="text-xs text-slate-500 mt-1 block">
              On Hand: <b>{preselectedItem.quantity ?? 0}</b> | Available: <b className="text-green-600">{preselectedItem.available ?? 0} units</b>
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Adjustment Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('INCREASE')}
              className={`py-2 text-sm font-semibold rounded-md border text-center transition-colors ${
                type === 'INCREASE'
                  ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              + Increase Stock (Found)
            </button>
            <button
              type="button"
              onClick={() => setType('DECREASE')}
              className={`py-2 text-sm font-semibold rounded-md border text-center transition-colors ${
                type === 'DECREASE'
                  ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              - Decrease Stock (Lost / Damaged)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Delta</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value, 10) : '')}
            placeholder="Units to add or remove (e.g. 5)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Audit Reason <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Physical inventory count correction, Damaged stock write-off"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
          />
        </div>

        <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
              type === 'INCREASE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {mutation.isPending ? 'Adjusting...' : type === 'INCREASE' ? 'Confirm Increase (+)' : 'Confirm Decrease (-)'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
