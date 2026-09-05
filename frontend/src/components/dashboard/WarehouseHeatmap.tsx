import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BinUtilizationItem } from '../../types';

interface WarehouseHeatmapProps {
  bins: BinUtilizationItem[];
}

export const WarehouseHeatmap: React.FC<WarehouseHeatmapProps> = ({ bins }) => {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<string>('ALL');
  const [hoveredBin, setHoveredBin] = useState<BinUtilizationItem | null>(null);

  // Group bins by rowCode
  const rowGroups: Record<string, BinUtilizationItem[]> = {};
  bins.forEach((b) => {
    const row = b.rowCode || 'Other';
    if (!rowGroups[row]) rowGroups[row] = [];
    rowGroups[row].push(b);
  });

  const rowCodes = Object.keys(rowGroups).sort();
  const displayedRows = selectedRow === 'ALL' ? rowCodes : [selectedRow];

  const getColorClass = (util: number) => {
    if (util <= 30) return 'bg-emerald-500 text-white hover:bg-emerald-600';
    if (util <= 70) return 'bg-amber-400 text-slate-900 hover:bg-amber-500';
    return 'bg-rose-500 text-white hover:bg-rose-600';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Row Filter Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedRow('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              selectedRow === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Rows ({bins.length} bins)
          </button>
          {rowCodes.map((row) => (
            <button
              key={row}
              onClick={() => setSelectedRow(row)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedRow === row
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Row {row}
            </button>
          ))}
        </div>

        {/* Hover Details Preview */}
        <div className="text-xs text-slate-500 min-h-[20px] flex items-center">
          {hoveredBin ? (
            <span className="font-mono">
              <strong className="text-slate-800">{hoveredBin.locationCode}</strong>: {hoveredBin.currentQuantity} / {hoveredBin.capacity} units ({hoveredBin.utilization}%) • <span className="text-blue-600 font-bold">{hoveredBin.availableCapacity} free</span>
            </span>
          ) : (
            <span className="text-slate-400 italic">Hover over any bin slot to view details</span>
          )}
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 space-y-4">
        {displayedRows.map((row) => {
          const rowBins = rowGroups[row] || [];
          return (
            <div key={row} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Row {row}
                </span>
                <span className="text-[11px] text-slate-500">
                  {rowBins.length} Bins
                </span>
              </div>

              {/* Grid of Bins */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                {rowBins.map((bin) => (
                  <button
                    key={bin.id}
                    onClick={() => navigate(`/bins/${bin.id}`)}
                    onMouseEnter={() => setHoveredBin(bin)}
                    onMouseLeave={() => setHoveredBin(null)}
                    title={`${bin.locationCode}: ${bin.currentQuantity}/${bin.capacity} units (${bin.utilization}%)`}
                    className={`relative flex flex-col items-center justify-center p-1.5 rounded text-center transition-transform hover:scale-105 hover:shadow-md cursor-pointer ${getColorClass(
                      bin.utilization
                    )}`}
                  >
                    <span className="text-[10px] font-bold font-mono tracking-tight leading-none">
                      {bin.code}
                    </span>
                    <span className="text-[9px] font-semibold mt-0.5 leading-none opacity-90">
                      {bin.utilization}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-5 text-xs text-slate-600 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block shadow-sm"></span>
          <span>0% – 30% (Available)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-400 inline-block shadow-sm"></span>
          <span>31% – 70% (Moderate)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500 inline-block shadow-sm"></span>
          <span>71% – 100% (Full)</span>
        </div>
      </div>
    </div>
  );
};
