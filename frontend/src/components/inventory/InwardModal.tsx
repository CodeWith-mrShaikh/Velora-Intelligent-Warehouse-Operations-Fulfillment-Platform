import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inwardStock } from '../../api/inventory.api';
import { getBins } from '../../api/bins.api';
import { getProducts } from '../../api/products.api';
import { Modal } from '../common/Modal';
import toast from 'react-hot-toast';

interface InwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItem?: {
    productId?: string;
    binId?: string;
    productName?: string;
    sku?: string;
    binLocation?: string;
  } | null;
}

export const InwardModal: React.FC<InwardModalProps> = ({ isOpen, onClose, preselectedItem }) => {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [binId, setBinId] = useState('');
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

      setQuantity('');
      setReason('Inward stock receipt');
    }
  }, [isOpen, preselectedItem]);

  const selectedBin = bins.find(b => b.id === binId);
  const binFreeSpace = selectedBin ? Math.max(0, selectedBin.capacity - (selectedBin.currentQuantity ?? 0)) : 0;
  const isBinCapacityExceeded = selectedBin && quantity !== '' && Number(quantity) > binFreeSpace;

  const mutation = useMutation({
    mutationFn: inwardStock,
    onSuccess: () => {
      toast.success('Stock received successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['bins-all'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to inward stock';
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
      toast.error('Please select a destination bin');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (isBinCapacityExceeded) {
      toast.error(`Quantity (${quantity}) exceeds available space (${binFreeSpace} units) in bin ${selectedBin?.locationCode}`);
      return;
    }

    mutation.mutate({
      productId,
      binId,
      quantity: Number(quantity),
      reason: reason || undefined
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inward Stock Receipt" size="md">
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Destination Bin</label>
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
              {bins.map((b: any) => {
                const space = Math.max(0, b.capacity - (b.currentQuantity ?? 0));
                return (
                  <option key={b.id} value={b.id}>
                    {b.locationCode} — Available Space: {space} units (Capacity: {b.capacity})
                  </option>
                );
              })}
            </select>
          )}
          {selectedBin && (
            <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex justify-between items-center">
              <div>
                <span className="font-semibold">{selectedBin.locationCode}</span>
                <span className="text-slate-600 ml-2">Stock: {selectedBin.currentQuantity ?? 0}</span>
              </div>
              <div>
                <span className="text-slate-600">Available Space: </span>
                <b className="text-blue-700 font-bold text-sm">{binFreeSpace} units</b>
                <span className="text-slate-400 ml-1">/ {selectedBin.capacity}</span>
              </div>
            </div>
          )}
        </div>

        {isBinCapacityExceeded && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <p className="font-semibold">Capacity Warning</p>
              <p className="mt-0.5">
                Bin <b>{selectedBin?.locationCode}</b> only has <b>{binFreeSpace} units</b> of available space, but you entered <b>{quantity} units</b>.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Inward</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value, 10) : '')}
            placeholder="Enter quantity (e.g. 25)"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Reference</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Supplier PO receipt, Restocking"
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Submitting...' : 'Confirm Inward'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
