import React from 'react';
import { StockMovement } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { format } from 'date-fns';

interface RecentMovementsProps {
  movements: StockMovement[];
}

export const RecentMovements: React.FC<RecentMovementsProps> = ({ movements }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Qty</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {movements.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">No recent movements</td>
            </tr>
          ) : (
            movements.map((movement) => (
              <tr key={movement.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {format(new Date(movement.createdAt), 'dd MMM HH:mm')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={movement.type} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                  {movement.product?.sku}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {movement.type === 'OUTWARD' || (movement.type === 'ADJUSTMENT' && movement.quantity < 0) ? '-' : '+'}{Math.abs(movement.quantity)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {movement.user?.name || 'System'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
