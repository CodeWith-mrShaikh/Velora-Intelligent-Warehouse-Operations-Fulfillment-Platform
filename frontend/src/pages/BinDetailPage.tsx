import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBin, updateBin } from '../api/bins.api';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

const BinDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number | ''>('');

  const { data: bin, isLoading } = useQuery({
    queryKey: ['bin', id],
    queryFn: () => getBin(id!)
  });

  const mutation = useMutation({
    mutationFn: (capacity: number) => updateBin(id!, { capacity }),
    onSuccess: () => {
      toast.success('Bin capacity updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['bin', id] });
      queryClient.invalidateQueries({ queryKey: ['bins-all'] });
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update capacity');
    }
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!bin) return <div>Bin not found</div>;

  const currentQty = bin.currentQuantity || 0;
  const percent = bin.capacity > 0 ? (currentQty / bin.capacity) * 100 : 0;
  const freeSpace = Math.max(0, bin.capacity - currentQty);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapacity || Number(newCapacity) < currentQty) {
      toast.error(`Capacity cannot be less than current stock (${currentQty} units)`);
      return;
    }
    mutation.mutate(Number(newCapacity));
  };

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link to="/warehouses" className="text-blue-600 hover:underline">Warehouses</Link> / 
        {bin.rowId && <Link to={`/rows/${bin.rowId}`} className="text-blue-600 hover:underline ml-1">Row</Link>} / 
        <span className="text-slate-500 ml-1">Bin {bin.code}</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-8 text-center bg-slate-900 text-white relative">
          <h2 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-widest">Location Code</h2>
          <div className="text-5xl md:text-7xl font-black tracking-tight">{bin.locationCode}</div>
          <button
            onClick={() => {
              setNewCapacity(bin.capacity);
              setIsEditOpen(true);
            }}
            className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition-all"
          >
            <Edit3 size={14} />
            Edit Capacity
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-sm text-slate-500 mb-1">Max Capacity</div>
              <div className="text-2xl font-bold">{bin.capacity} units</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Current Qty</div>
              <div className="text-2xl font-bold">{currentQty} units</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Free Space</div>
              <div className="text-2xl font-bold text-blue-600">{freeSpace} units</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-2">Utilization ({Math.round(percent)}%)</div>
              <div className="w-full bg-slate-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(percent, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PageHeader title="Products in this Bin" />
      <div className="bg-white rounded-lg shadow border border-slate-200 p-8 text-center text-slate-500">
        {currentQty > 0 ? (
          <p className="text-slate-700 font-medium">Currently holding {currentQty} units of stock.</p>
        ) : (
          <p>This bin is currently empty. Free space: {bin.capacity} units.</p>
        )}
      </div>

      {/* Edit Capacity Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Update Capacity: ${bin.locationCode}`} size="sm">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Capacity (units)</label>
            <input
              type="number"
              min={currentQty}
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value ? parseInt(e.target.value, 10) : '')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
            <span className="text-xs text-slate-500 mt-1 block">
              Current stock is <b>{currentQty} units</b>. Minimum capacity is {currentQty}.
            </span>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save Capacity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BinDetailPage;
