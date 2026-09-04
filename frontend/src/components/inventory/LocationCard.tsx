import React from 'react';
import { Bin } from '../../types';

interface LocationCardProps {
  bin: Bin;
  available?: number;
  reserved?: number;
  highlightText?: string; // Optional text like "PICK: 5 UNITS"
}

export const LocationCard: React.FC<LocationCardProps> = ({ bin, available, reserved, highlightText }) => {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 tracking-wider">LOCATION DETAILS</span>
        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          {bin.row?.warehouse?.code} / {bin.row?.code} / {bin.code}
        </span>
      </div>
      
      <div className="p-6 bg-blue-50/50">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500 mb-1">LOCATION CODE</p>
          <div className="bg-blue-600 text-white rounded-lg py-3 px-4 inline-block shadow-inner">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-widest">{bin.locationCode}</span>
          </div>
        </div>
      </div>

      {(available !== undefined || reserved !== undefined || highlightText) && (
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex justify-between items-center flex-wrap gap-4">
          <div className="flex space-x-4">
            {available !== undefined && (
              <div className="text-sm">
                <span className="text-slate-500">Available: </span>
                <span className="font-bold text-slate-900">{available} units</span>
              </div>
            )}
            {reserved !== undefined && (
              <div className="text-sm">
                <span className="text-slate-500">Reserved: </span>
                <span className="font-bold text-slate-900">{reserved} units</span>
              </div>
            )}
          </div>
          {highlightText && (
            <div className="text-lg font-bold text-red-600 bg-red-50 px-3 py-1 rounded">
              {highlightText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
