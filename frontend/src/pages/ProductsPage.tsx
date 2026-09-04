import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getProducts, createProduct } from '../api/products.api';
import { DataTable } from '../components/common/DataTable';
import { SearchBar } from '../components/common/SearchBar';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Electronics',
    unitPrice: 19.99,
    reorderLevel: 10,
    barcode: ''
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => getProducts({ page, limit: 10, search })
  });

  const createMutation = useMutation({
    mutationFn: (newProduct: any) => createProduct(newProduct),
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setFormData({
        sku: '',
        name: '',
        category: 'Electronics',
        unitPrice: 19.99,
        reorderLevel: 10,
        barcode: ''
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create product');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      toast.error('SKU and Name are required');
      return;
    }
    createMutation.mutate({
      ...formData,
      unitPrice: Number(formData.unitPrice),
      reorderLevel: Number(formData.reorderLevel)
    });
  };

  const columns = [
    { key: 'sku', label: 'SKU', render: (item: any) => <span className="font-mono font-bold text-blue-700">{item.sku}</span> },
    { key: 'name', label: 'Name', render: (item: any) => <span className="font-medium text-slate-800">{item.name}</span> },
    { key: 'category', label: 'Category', render: (item: any) => <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{item.category || 'General'}</span> },
    { key: 'price', label: 'Price', render: (item: any) => `$${Number(item.price ?? item.unitPrice ?? 0).toFixed(2)}` },
    { key: 'totalStock', label: 'Total Stock', render: (item: any) => (
      <span className={`font-bold ${(item.totalStock || item.totalQuantity || 0) > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
        {item.totalStock ?? item.totalQuantity ?? 0}
      </span>
    )},
    { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> }
  ];

  const currentPage = data?.meta?.page || data?.page || 1;
  const totalPages = data?.meta?.totalPages || data?.totalPages || 1;

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Products" description="Manage SKU master catalog and product details">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Product
        </button>
      </PageHeader>

      <div className="mb-4">
        <SearchBar 
          onSearch={(val) => { setSearch(val); setPage(1); }} 
          placeholder="Search products by name, SKU, or barcode..." 
          className="max-w-md" 
        />
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          onRowClick={(item) => navigate(`/products/${item.id}`)}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
            <input 
              type="text" 
              required 
              value={formData.sku} 
              onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})} 
              placeholder="e.g. EL-999" 
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input 
              type="text" 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="e.g. Ergonomic Bluetooth Mouse" 
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Sports & Outdoors">Sports & Outdoors</option>
                <option value="Tools & Hardware">Tools & Hardware</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price ($)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                required 
                value={formData.unitPrice} 
                onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
              <input 
                type="number" 
                min="0" 
                value={formData.reorderLevel} 
                onChange={e => setFormData({...formData, reorderLevel: parseInt(e.target.value, 10) || 0})} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Barcode (EAN-13)</label>
              <input 
                type="text" 
                value={formData.barcode} 
                onChange={e => setFormData({...formData, barcode: e.target.value})} 
                placeholder="Optional 13-digit code" 
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;
