import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRow, getRowBins } from '../api/rows.api';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const RowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: row, isLoading: isRowLoading } = useQuery({
    queryKey: ['row', id],
    queryFn: () => getRow(id!)
  });

  const { data: bins, isLoading: isBinsLoading } = useQuery({
    queryKey: ['row-bins', id],
    queryFn: () => getRowBins(id!),
    enabled: !!id
  });

  if (isRowLoading || isBinsLoading) return <LoadingSpinner fullPage />;
  if (!row) return <div>Row not found</div>;

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link to="/warehouses" className="text-blue-600 hover:underline">Warehouses</Link> / 
        {row.warehouseId && <Link to={`/warehouses/${row.warehouseId}`} className="text-blue-600 hover:underline ml-1">WH</Link>} / 
        <span className="text-slate-500 ml-1">Row {row.code}</span>
      </div>
      <PageHeader title={`Row ${row.code}`} description={row.description} />
      
      <h3 className="text-lg font-bold mb-4 mt-8 text-slate-800">Bins</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {bins?.map(bin => {
          const percent = bin.capacity > 0 ? ((bin.currentQuantity || 0) / bin.capacity) * 100 : 0;
          return (
            <div 
              key={bin.id} 
              onClick={() => navigate(`/bins/${bin.id}`)}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="text-2xl font-black text-slate-800">{bin.code}</div>
                <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{bin.locationCode}</div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(percent, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{bin.currentQuantity} units</span>
                <span>{bin.capacity} cap</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RowDetailPage;
