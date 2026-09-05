import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBin } from '../api/bins.api';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const BinDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: bin, isLoading } = useQuery({
    queryKey: ['bin', id],
    queryFn: () => getBin(id!)
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!bin) return <div>Bin not found</div>;

  const percent = bin.capacity > 0 ? ((bin.currentQuantity || 0) / bin.capacity) * 100 : 0;

  return (
    <div>
      <div className="mb-4 text-sm">
        <Link to="/warehouses" className="text-blue-600 hover:underline">Warehouses</Link> / 
        {bin.rowId && <Link to={`/rows/${bin.rowId}`} className="text-blue-600 hover:underline ml-1">Row</Link>} / 
        <span className="text-slate-500 ml-1">Bin {bin.code}</span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-8 text-center bg-slate-900 text-white">
          <h2 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-widest">Location Code</h2>
          <div className="text-5xl md:text-7xl font-black tracking-tight">{bin.locationCode}</div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-sm text-slate-500 mb-1">Capacity</div>
              <div className="text-2xl font-bold">{bin.capacity}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Current Qty</div>
              <div className="text-2xl font-bold">{bin.currentQuantity}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-slate-500 mb-2">Utilization</div>
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
        Product listing for this bin will be displayed here.
      </div>
    </div>
  );
};

export default BinDetailPage;
