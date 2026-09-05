import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Layers, AlertTriangle, ShoppingCart } from 'lucide-react';
import { KPICard } from '../components/common/KPICard';
import { StockByRowChart } from '../components/dashboard/StockByRowChart';
import { BinUtilizationChart } from '../components/dashboard/BinUtilizationChart';
import { RecentMovements } from '../components/dashboard/RecentMovements';
import { LowStockTable } from '../components/dashboard/LowStockTable';
import { getDashboardSummary, getRowStock, getLowStock, getBinUtilization } from '../api/dashboard.api';
import { getMovements } from '../api/movements.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { data: summary, isLoading: isLoadingSummary } = useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary, refetchInterval: 30000 });
  const { data: rowStock, isLoading: isLoadingRowStock } = useQuery({ queryKey: ['dashboard-row-stock'], queryFn: getRowStock, refetchInterval: 30000 });
  const { data: binUtil, isLoading: isLoadingBinUtil } = useQuery({ queryKey: ['dashboard-bin-util'], queryFn: getBinUtilization, refetchInterval: 30000 });
  const { data: lowStock, isLoading: isLoadingLowStock } = useQuery({ queryKey: ['dashboard-low-stock'], queryFn: getLowStock, refetchInterval: 30000 });
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({ queryKey: ['dashboard-recent-movements'], queryFn: () => getMovements({ limit: 10 }), refetchInterval: 30000 });

  if (isLoadingSummary) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total SKUs" value={summary?.totalSkus?.toLocaleString() || 0} icon={Package} colorClass="text-blue-600 bg-blue-100" />
        <KPICard title="Available Units" value={summary?.availableUnits?.toLocaleString() || 0} icon={Layers} colorClass="text-emerald-600 bg-emerald-100" />
        <KPICard title="Low Stock Items" value={summary?.lowStockItemsCount?.toLocaleString() || 0} icon={AlertTriangle} colorClass="text-rose-600 bg-rose-100" />
        <KPICard title="Pending Orders" value={summary?.pendingOrdersCount?.toLocaleString() || 0} icon={ShoppingCart} colorClass="text-amber-600 bg-amber-100" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock by Row</h3>
          {isLoadingRowStock ? <LoadingSpinner /> : <StockByRowChart data={rowStock || []} />}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Warehouse Bin Utilization</h3>
          {isLoadingBinUtil ? <LoadingSpinner /> : <BinUtilizationChart data={binUtil} />}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">Low Stock Alerts</h3>
          </div>
          <div className="p-0">
            {isLoadingLowStock ? <LoadingSpinner /> : <LowStockTable items={lowStock || []} />}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">Recent Movements</h3>
          </div>
          <div className="p-0">
            {isLoadingMovements ? <LoadingSpinner /> : <RecentMovements movements={movementsData?.data || []} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
