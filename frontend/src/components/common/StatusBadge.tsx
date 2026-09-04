import React from 'react';

type BadgeType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeConfig = (s: string): { type: BadgeType; label: string } => {
    const upper = s.toUpperCase();
    
    // Order Statuses
    if (upper === 'PENDING') return { type: 'warning', label: 'PENDING' };
    if (upper === 'ALLOCATED') return { type: 'info', label: 'ALLOCATED' };
    if (upper === 'RESERVED') return { type: 'info', label: 'RESERVED' }; // Purple in tailwind logic
    if (upper === 'PICKING') return { type: 'warning', label: 'PICKING' }; // Orange
    if (upper === 'COMPLETED') return { type: 'success', label: 'COMPLETED' };
    if (upper === 'CANCELLED') return { type: 'error', label: 'CANCELLED' };
    
    // Entity Statuses
    if (upper === 'ACTIVE') return { type: 'success', label: 'ACTIVE' };
    if (upper === 'INACTIVE') return { type: 'neutral', label: 'INACTIVE' };
    if (upper === 'ARCHIVED') return { type: 'error', label: 'ARCHIVED' };
    
    // Movement Types
    if (upper === 'INWARD') return { type: 'success', label: 'INWARD' };
    if (upper === 'OUTWARD') return { type: 'info', label: 'OUTWARD' };
    if (upper === 'TRANSFER') return { type: 'warning', label: 'TRANSFER' };
    if (upper === 'ADJUSTMENT') return { type: 'neutral', label: 'ADJUSTMENT' };

    // Default
    return { type: 'neutral', label: upper };
  };

  const config = getBadgeConfig(status);

  const colors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-slate-100 text-slate-800',
  };

  // Override specific logic for purple/orange if needed
  let customColor = colors[config.type];
  if (config.label === 'RESERVED') customColor = 'bg-purple-100 text-purple-800';
  if (config.label === 'PICKING') customColor = 'bg-orange-100 text-orange-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customColor}`}>
      {config.label}
    </span>
  );
};
