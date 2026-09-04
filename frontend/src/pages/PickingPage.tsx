import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api/orders.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const PickingPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['picking-orders'],
    queryFn: () => getOrders({ status: 'RESERVED,PICKING', limit: 50 })
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  const orders = ordersData?.data || [];

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1 className="text-3xl font-black text-slate-900 mb-2">Active Picking Tasks</h1>
      <p className="text-slate-500 mb-8">Select an order to start picking</p>

      {orders.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <p className="text-xl text-slate-500">No active picking tasks right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div 
              key={order.id} 
              onClick={() => navigate(`/orders/${order.id}`)}
              className="bg-white p-6 rounded-xl shadow border-2 border-transparent hover:border-blue-500 cursor-pointer transition-colors flex justify-between items-center"
            >
              <div>
                <div className="text-2xl font-bold text-slate-800">{order.orderNumber}</div>
                <div className="text-slate-500 mt-1">{order.itemsCount} items to pick</div>
              </div>
              <div>
                <span className={`px-4 py-2 rounded-lg font-bold text-lg ${order.status === 'PICKING' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PickingPage;
