import React from 'react';
import { OrderStatus } from '../../types';
import { Check, Clock } from 'lucide-react';

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, createdAt, updatedAt }) => {
  const steps: { label: string; key: OrderStatus }[] = [
    { label: 'Pending', key: 'PENDING' },
    { label: 'Allocated', key: 'ALLOCATED' },
    { label: 'Reserved', key: 'RESERVED' },
    { label: 'Picking', key: 'PICKING' },
    { label: 'Completed', key: 'COMPLETED' },
  ];

  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
        <h4 className="font-bold">Order Cancelled</h4>
        <p className="text-sm mt-1">This order was cancelled on {new Date(updatedAt).toLocaleString()}</p>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex(s => s.key === status) === -1 ? steps.length - 1 : steps.findIndex(s => s.key === status);

  return (
    <div className="py-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="h-0.5 w-full bg-slate-200"></div>
        </div>
        <ul className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <li key={step.key} className="relative">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                  isCompleted ? 'bg-blue-600' : isCurrent ? 'bg-blue-600' : 'bg-slate-200'
                }`}>
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : isCurrent ? (
                    <div className="h-2.5 w-2.5 bg-white rounded-full"></div>
                  ) : (
                    <Clock className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center w-24">
                  <span className={`text-xs font-medium ${isCurrent || isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-12 text-xs text-slate-500 text-center">
        Created: {new Date(createdAt).toLocaleString()} | Last Updated: {new Date(updatedAt).toLocaleString()}
      </div>
    </div>
  );
};
