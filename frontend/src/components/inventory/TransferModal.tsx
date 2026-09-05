import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transferStock } from '../../api/inventory.api';
import { getBins } from '../../api/bins.api';
import { getProducts } from '../../api/products.api';
import { Modal } from '../common/Modal';
import toast from 'react-hot-toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItem?: {
    productId?: string;
    binId?: string;
    productName?: string;
    sku?: string;
    binLocation?: string;
    available?: number;
  } | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, preselectedItem }) => {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [sourceBinId, setSourceBinId] = useState('');
  const [destinationBinId, setDestinationBinId] = useState('');
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

      if (preselectedItem?.binId) setSourceBinId(preselectedItem.binId);
      else if (bins.length > 0 && !sourceBinId) setSourceBinId(bins[0].id);

      setDestinationBinId('');
      setQuantity('');
      setReason('Stock rebalancing');
    }
  }, [isOpen, preselectedItem]);

  const selectedDestBin = bins.find(b => b.id === destinationBinId);
  const destFreeSpace = selectedDestBin ? Math.max(0, selectedDestBin.capacity - (selectedDestBin.currentQuantity ?? 0)) : 0;
  const isDestCapacityExceeded = selectedDestBin && quantity !== '' && Number(quantity) > destFreeSpace;

  const mutation = useMutation({
    mutationFn: transferStock,
    onSuccess: () => {
      toast.success('Stock transferred successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['bins-all'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to transfer stock';
      toast.error(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error('Please select a product');
      return;
    }
    if (!sourceBinId) {
      toast.error('Please select a source bin');
      return;
    }
    if (!destinationBinId) {
      toast.error('Please select a destination bin');
      return;
    }
    if (sourceBinId === destinationBinId) {
      toast.error('Source and destination bins must be different');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (preselectedItem?.available !== undefined && Number(quantity) > preselectedItem.available) {
      toast.error(`Quantity exceeds available stock (${preselectedItem.available})`);
      return;
    }
    if (isDestCapacityExceeded) {
      toast.error(`Quantity (${quantity}) exceeds destination bin free space (${destFreeSpace} units)`);
      return;
    }

    mutation.mutate({
      productId,
      sourceBinId,
      destinationBinId,
      quantity: Number(quantity),
      reason: reason || undefined
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Stock" size="md">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source Bin</label>
            <select
              value={sourceBinId}
              onChange={(e) => setSourceBinId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              required
            >
              <option value="">Select source bin</option>
              {bins.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.locationCode}
                </option>
              ))}
            </select>
            {preselectedItem?.available !== undefined && (
              <span className="text-xs text-slate-500 mt-1 block">
                Available: <b className="text-green-600">{preselectedItem.available} units</b>
              </span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination Bin</label>
            <select
              value={destinationBinId}
              onChange={(e) => setDestinationBinId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              required
            >
              <option value="">Select destination bin</option>
              {bins.filter(b => b.id !== sourceBinId).map((b: any) => {
                const space = Math.max(0, b.capacity - (b.currentQuantity ?? 0));
                return (
                  <option key={b.id} value={b.id}>
                    {b.locationCode} — Available Space: {space} units (Capacity: {b.capacity})
                  </option>
                );
              })}
            </select>
            {selectedDestBin && (
              <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex justify-between items-center">
                <div>
                  <span className="font-semibold">{selectedDestBin.locationCode}</span>
                  <span className="text-slate-600 ml-2">Stock: {selectedDestBin.currentQuantity ?? 0}</span>
                </div>
                <div>
                  <span className="text-slate-600">Available Space: </span>
                  <b className="text-blue-700 font-bold text-sm">{destFreeSpace} units</b>
                  <span className="text-slate-400 ml-1">/ {selectedDestBin.capacity}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {isDestCapacityExceeded && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <p className="font-semibold">Capacity Warning</p>
              <p className="mt-0.5">
                Bin <b>{selectedDestBin?.locationCode}</b> only has <b>{destFreeSpace} units</b> of available space, but you entered <b>{quantity} units</b>.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Transfer</label>
          <input
            type="number"
            min="1"
            max={preselectedItem?.available}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value, 10) : '')}
            placeholder="Enter quantity"
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
            placeholder="e.g. Aisle rebalancing, stock consolidation"
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
            {mutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
