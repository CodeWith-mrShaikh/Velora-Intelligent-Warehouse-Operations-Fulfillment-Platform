import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getInventory } from '../api/inventory.api';
import { DataTable } from '../components/common/DataTable';
import { SearchBar } from '../components/common/SearchBar';
import { PageHeader } from '../components/common/PageHeader';
import { ArrowDownToLine, ArrowLeftRight, Settings2 } from 'lucide-react';
import { InwardModal } from '../components/inventory/InwardModal';
import { TransferModal } from '../components/inventory/TransferModal';
import { AdjustmentModal } from '../components/inventory/AdjustmentModal';

const InventoryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [inwardOpen, setInwardOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search],
    queryFn: () => getInventory({ page, limit: 10, search })
  });

  const handleOpenInward = (item?: any) => {
    setSelectedItem(item ? {
      productId: item.productId,
      binId: item.binId,
      productName: item.product?.name,
      sku: item.product?.sku,
      binLocation: item.bin?.locationCode,
      available: item.available,
      quantity: item.quantity
    } : null);
    setInwardOpen(true);
  };

  const handleOpenTransfer = (item?: any) => {
    setSelectedItem(item ? {
      productId: item.productId,
      binId: item.binId,
      productName: item.product?.name,
      sku: item.product?.sku,
      binLocation: item.bin?.locationCode,
      available: item.available,
      quantity: item.quantity
    } : null);
    setTransferOpen(true);
  };

  const handleOpenAdjust = (item?: any) => {
    setSelectedItem(item ? {
      productId: item.productId,
      binId: item.binId,
      productName: item.product?.name,
      sku: item.product?.sku,
      binLocation: item.bin?.locationCode,
      available: item.available,
      quantity: item.quantity
    } : null);
    setAdjustOpen(true);
  };

  const columns = [
    { key: 'product', label: 'Product', render: (item: any) => (
      <div>
        <div className="font-medium text-slate-800">{item.product?.name}</div>
        <div className="text-xs font-mono text-slate-500">{item.product?.sku}</div>
      </div>
    )},
    { key: 'location', label: 'Location', render: (item: any) => (
      item.bin ? <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{item.bin.locationCode}</span> : 'N/A'
    )},
    { key: 'available', label: 'Available', render: (item: any) => <span className="font-bold text-green-600">{item.available}</span> },
    { key: 'reserved', label: 'Reserved', render: (item: any) => <span className="font-medium text-orange-500">{item.reserved}</span> },
    { key: 'quantity', label: 'Total On Hand', render: (item: any) => <span className="font-bold text-slate-800">{item.quantity}</span> },
    { 
      key: 'actions', 
      label: 'Actions', 
      render: (item: any) => (
        <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button"
            onClick={() => handleOpenInward(item)} 
            title="Inward more stock to this location"
            className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded transition-colors"
          >
            <ArrowDownToLine size={16} />
          </button>
          <button 
            type="button"
            onClick={() => handleOpenTransfer(item)} 
            title="Transfer stock from this bin"
            className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <ArrowLeftRight size={16} />
          </button>
          <button 
            type="button"
            onClick={() => handleOpenAdjust(item)} 
            title="Adjust count / write-off in this bin"
            className="p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-800 rounded transition-colors"
          >
            <Settings2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const inventoryList = Array.isArray(data) ? data : (data?.data || []);

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Inventory Details" description="View and manage physical stock across all warehouse bins">
        <Link to="/inventory/search" className="mr-2 inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50">
          Staff Search Mode
        </Link>
        <div className="flex space-x-2">
          <button 
            type="button"
            onClick={() => handleOpenInward()} 
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-sm"
          >
            <ArrowDownToLine size={16} className="mr-2 text-blue-600" /> Inward
          </button>
          <button 
            type="button"
            onClick={() => handleOpenTransfer()} 
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
          >
            <ArrowLeftRight size={16} className="mr-2 text-slate-600" /> Transfer
          </button>
          <button 
            type="button"
            onClick={() => handleOpenAdjust()} 
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium bg-white hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-colors shadow-sm"
          >
            <Settings2 size={16} className="mr-2 text-amber-600" /> Adjust
          </button>
        </div>
      </PageHeader>

      <div className="mb-4">
        <SearchBar onSearch={setSearch} placeholder="Search by SKU, product name, or location code..." className="max-w-md" />
      </div>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={inventoryList}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          page={Array.isArray(data) ? 1 : (data?.page || 1)}
          totalPages={Array.isArray(data) ? 1 : (data?.totalPages || 1)}
          onPageChange={setPage}
        />
      </div>

      {/* Modals */}
      <InwardModal
        isOpen={inwardOpen}
        onClose={() => { setInwardOpen(false); setSelectedItem(null); }}
        preselectedItem={selectedItem}
      />
      <TransferModal
        isOpen={transferOpen}
        onClose={() => { setTransferOpen(false); setSelectedItem(null); }}
        preselectedItem={selectedItem}
      />
      <AdjustmentModal
        isOpen={adjustOpen}
        onClose={() => { setAdjustOpen(false); setSelectedItem(null); }}
        preselectedItem={selectedItem}
      />
    </div>
  );
};

export default InventoryPage;
