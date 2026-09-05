import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BinUtilizationStats } from '../../types';

interface CapacityRadialGaugeProps {
  stats?: BinUtilizationStats;
}

export const CapacityRadialGauge: React.FC<CapacityRadialGaugeProps> = ({ stats }) => {
  if (!stats) return null;

  const percent = Math.min(100, Math.max(0, stats.overallUtilizationPercent || 0));
  const freePercent = 100 - percent;

  // Data for the semi-circle gauge: [Occupied, Free]
  const gaugeData = [
    { name: 'Occupied', value: percent, color: '#3b82f6' },
    { name: 'Free', value: freePercent, color: '#e2e8f0' }
  ];

  return (
    <div className="flex flex-col items-center justify-between h-full py-1">
      {/* Semi-Circle Radial Gauge */}
      <div className="relative w-full max-w-[280px] h-[150px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height={260} className="absolute top-0">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={72}
              outerRadius={96}
              paddingAngle={2}
              dataKey="value"
            >
              <Cell key="occupied" fill={percent > 85 ? '#ef4444' : percent > 70 ? '#f59e0b' : '#3b82f6'} />
              <Cell key="free" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Percentage & Label */}
        <div className="absolute top-[70px] flex flex-col items-center text-center">
          <span className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            {percent}%
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
            Capacity Utilized
          </span>
        </div>
      </div>

      {/* Stacked Capacity Progress Bar */}
      <div className="w-full mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Occupied: <b>{percent}%</b></span>
          <span>Free Space: <b>{freePercent}%</b></span>
        </div>

        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
          <div
            style={{ width: `${percent}%` }}
            className={`h-full transition-all duration-500 ${
              percent > 85 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-blue-600'
            }`}
          />
          <div
            style={{ width: `${freePercent}%` }}
            className="h-full bg-slate-200 transition-all duration-500"
          />
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 gap-3 w-full mt-4 pt-3 border-t border-slate-100">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-center">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide block">
            Occupied Units
          </span>
          <span className="text-lg font-black text-blue-900 mt-0.5 block">
            {stats.totalOccupiedUnits.toLocaleString()}
          </span>
          <span className="text-[11px] text-blue-600">
            Across {stats.occupiedBins} active bins
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-center">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide block">
            Free Space Units
          </span>
          <span className="text-lg font-black text-emerald-900 mt-0.5 block">
            {stats.totalFreeUnits.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-600">
            Available for inwarding
          </span>
        </div>
      </div>
    </div>
  );
};
