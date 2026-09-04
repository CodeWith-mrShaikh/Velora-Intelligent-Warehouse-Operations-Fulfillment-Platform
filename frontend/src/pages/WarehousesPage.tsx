import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getWarehouses } from '../api/warehouses.api';
import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';

const WarehousesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', page],
    queryFn: () => getWarehouses({ page, limit: 10 })
  });

  const columns = [
    { key: 'code', label: 'Code', render: (item: any) => <span className="font-bold">{item.code}</span> },
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location', render: (item: any) => item.address || item.location || 'N/A' },
    { key: 'capacity', label: 'Capacity', render: (item: any) => item.capacity?.toLocaleString() || 'Flexible' },
    { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> }
  ];

  const warehouseList = Array.isArray(data) ? data : (data?.data || []);

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Warehouses" description="Manage warehouse locations" />
      
      <div className="flex-1 min-h-0 mt-4">
        <DataTable
          columns={columns}
          data={warehouseList}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          onRowClick={(item) => navigate(`/warehouses/${item.id}`)}
          page={Array.isArray(data) ? 1 : (data?.page || 1)}
          totalPages={Array.isArray(data) ? 1 : (data?.totalPages || 1)}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default WarehousesPage;
