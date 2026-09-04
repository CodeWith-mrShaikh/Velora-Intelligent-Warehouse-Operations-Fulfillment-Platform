import React from 'react';
import { LowStockItem } from '../../types';

interface LowStockTableProps {
  items: LowStockItem[];
}

export const LowStockTable: React.FC<LowStockTableProps> = ({ items }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">SKU</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product Name</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Stock</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Min Level</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">No low stock items</td>
            </tr>
          ) : (
            items.map((item) => {
              const isCritical = item.totalStock <= item.reorderLevel / 2;
              return (
                <tr key={item.productId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{item.sku}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{item.productName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-right text-slate-900">{item.totalStock}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-500">{item.reorderLevel}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isCritical ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {isCritical ? 'CRITICAL' : 'LOW'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
