import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getWarehouse, getWarehouseRows } from '../api/warehouses.api';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const WarehouseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: warehouse, isLoading: isWhLoading } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => getWarehouse(id!)
  });

  const { data: rows, isLoading: isRowsLoading } = useQuery({
    queryKey: ['warehouse-rows', id],
    queryFn: () => getWarehouseRows(id!),
    enabled: !!id
  });

  if (isWhLoading || isRowsLoading) return <LoadingSpinner fullPage />;
  if (!warehouse) return <div>Warehouse not found</div>;

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link to="/warehouses" className="text-blue-600 hover:underline">Warehouses</Link> / <span className="text-slate-500">{warehouse.code}</span>
      </div>
      <PageHeader title={warehouse.name} description={`Code: ${warehouse.code} | Location: ${warehouse.address || warehouse.location || 'N/A'}`} />
      
      <h3 className="text-lg font-bold mb-4 mt-8 text-slate-800">Rows</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rows?.map(row => (
          <div 
            key={row.id} 
            onClick={() => navigate(`/rows/${row.id}`)}
            className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="text-xl font-bold text-slate-800 mb-2">Row {row.code}</div>
            <div className="text-sm text-slate-500">{row.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarehouseDetailPage;
