import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMovements } from '../api/movements.api';
import { exportMovementsCsv } from '../api/reports.api';
import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const StockMovementsPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['movements', page],
    queryFn: () => getMovements({ page, limit: 15 })
  });

  const handleExport = async () => {
    try {
      await exportMovementsCsv();
      toast.success('Export started');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const columns = [
    { key: 'createdAt', label: 'Time', render: (item: any) => format(new Date(item.createdAt), 'dd MMM yy HH:mm') },
    { key: 'type', label: 'Type', render: (item: any) => <StatusBadge status={item.type} /> },
    { key: 'product', label: 'Product', render: (item: any) => item.product?.sku },
    { key: 'quantity', label: 'Qty', render: (item: any) => <span className="font-bold">{item.quantity}</span> },
    { key: 'source', label: 'Source', render: (item: any) => item.sourceBin?.locationCode || '-' },
    { key: 'destination', label: 'Destination', render: (item: any) => item.destinationBin?.locationCode || '-' },
    { key: 'user', label: 'User', render: (item: any) => item.user?.name || 'System' },
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Stock Movements" description="History of all inventory changes">
        <button onClick={handleExport} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
          <Download className="-ml-1 mr-2 h-5 w-5 text-slate-500" />
          Export CSV
        </button>
      </PageHeader>

      <div className="flex-1 min-h-0 mt-4">
        <DataTable
          columns={columns}
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          page={data?.page || 1}
          totalPages={data?.totalPages || 1}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default StockMovementsPage;
