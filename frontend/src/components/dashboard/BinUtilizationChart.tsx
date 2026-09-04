import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BinUtilizationChartProps {
  data: { range: string; count: number }[];
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export const BinUtilizationChart: React.FC<BinUtilizationChartProps> = ({ data }) => {
  return (
    <div className="w-full" style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={5}
            dataKey="count"
            nameKey="range"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            wrapperStyle={{ paddingTop: 8, fontSize: '12px', lineHeight: '16px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
