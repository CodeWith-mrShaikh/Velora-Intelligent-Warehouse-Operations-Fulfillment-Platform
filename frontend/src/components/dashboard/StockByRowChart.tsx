import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StockByRowChartProps {
  data: { rowCode: string; totalUnits: number }[];
}

export const StockByRowChart: React.FC<StockByRowChartProps> = ({ data }) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="rowCode" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="totalUnits" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Units" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
