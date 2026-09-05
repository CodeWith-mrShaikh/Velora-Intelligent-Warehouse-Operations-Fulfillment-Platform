import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LayoutGrid, Gauge, PieChart as PieIcon } from 'lucide-react';
import { WarehouseHeatmap } from './WarehouseHeatmap';
import { CapacityRadialGauge } from './CapacityRadialGauge';
import { BinUtilizationResponse, BinUtilizationRange } from '../../types';

interface BinUtilizationChartProps {
  data: BinUtilizationResponse | any;
}

const DONUT_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export const BinUtilizationChart: React.FC<BinUtilizationChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'HEATMAP' | 'GAUGE' | 'DONUT'>('HEATMAP');

  // Extract bins, stats, and ranges regardless of response structure
  const bins = data?.bins || [];
  const stats = data?.stats;
  const ranges: BinUtilizationRange[] = data?.ranges || (Array.isArray(data) ? data : []);

  return (
    <div className="w-full flex flex-col">
      {/* Top Segmented Controls */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('HEATMAP')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'HEATMAP'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Heatmap Grid</span>
          </button>

          <button
            onClick={() => setViewMode('GAUGE')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'GAUGE'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge size={14} />
            <span>Capacity Gauge</span>
          </button>

          <button
            onClick={() => setViewMode('DONUT')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'DONUT'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon size={14} />
            <span>Breakdown</span>
          </button>
        </div>

        {stats && (
          <div className="text-xs text-slate-500 font-medium">
            Overall: <b className="text-blue-600 font-bold">{stats.overallUtilizationPercent}%</b> ({stats.occupiedBins}/{stats.totalBins} Bins in use)
          </div>
        )}
      </div>

      {/* Dynamic View Display */}
      <div className="w-full min-h-[360px]">
        {viewMode === 'HEATMAP' && (
          bins.length > 0 ? (
            <WarehouseHeatmap bins={bins} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              No bin location data available
            </div>
          )
        )}

        {viewMode === 'GAUGE' && (
          stats ? (
            <CapacityRadialGauge stats={stats} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              Capacity statistics loading...
            </div>
          )
        )}

        {viewMode === 'DONUT' && (
          <div className="w-full h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ranges}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="range"
                >
                  {ranges.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: 10, fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
