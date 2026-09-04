import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrder, allocateOrder, reserveOrder, releaseOrder, pickOrder, completeOrder, cancelOrder } from '../api/orders.api';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { LocationCard } from '../components/inventory/LocationCard';
import toast from 'react-hot-toast';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!)
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['order', id] });

  const extractError = (err: any, fallback: string) =>
    err?.response?.data?.message || err?.response?.data?.error?.message || fallback;

  const mutAllocate = useMutation({
    mutationFn: () => allocateOrder(id!),
    onSuccess: () => { toast.success('Order Allocated'); invalidate(); },
    onError: (err) => toast.error(extractError(err, 'Failed to allocate stock'))
  });
  const mutReserve = useMutation({
    mutationFn: () => reserveOrder(id!),
    onSuccess: () => { toast.success('Order Stock Reserved'); invalidate(); },
    onError: (err) => toast.error(extractError(err, 'Failed to reserve stock'))
  });
  const mutRelease = useMutation({
    mutationFn: () => releaseOrder(id!),
    onSuccess: () => { toast.success('Reservation Released'); invalidate(); },
    onError: (err) => toast.error(extractError(err, 'Failed to release reservation'))
  });
  const mutPick = useMutation({
    mutationFn: () => pickOrder(id!),
    onSuccess: () => { toast.success('Order Picked'); invalidate(); },
    onError: (err) => toast.error(extractError(err, 'Failed to record pick'))
  });
  const mutComplete = useMutation({
    mutationFn: () => completeOrder(id!),
    onSuccess: () => { toast.success('Order Completed'); invalidate(); },
    onError: (err) => toast.error(extractError(err, 'Failed to complete order'))
  });
  const mutCancel = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => { toast.success('Order Cancelled'); invalidate(); },
    onError: (err) => toast.error(extractError(err, 'Failed to cancel order'))
  });

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-sm mb-4">
        <Link to="/orders" className="text-blue-600 hover:underline">Orders</Link> / <span className="text-slate-500">{order.orderNumber}</span>
      </div>
      
      <div className="flex justify-between items-start">
        <PageHeader title={`Order ${order.orderNumber}`} description={`Customer Ref: ${order.customerRef}`} />
        <StatusBadge status={order.status} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <OrderTimeline status={order.status} createdAt={order.createdAt} updatedAt={order.updatedAt} />
      </div>

      {/* Action Buttons based on status */}
      <div className="flex space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        {order.status === 'PENDING' && (
          <>
            <button onClick={() => mutAllocate.mutate()} className="px-4 py-2 bg-blue-600 text-white rounded">Allocate Stock</button>
            <button onClick={() => mutCancel.mutate()} className="px-4 py-2 bg-red-600 text-white rounded">Cancel Order</button>
          </>
        )}
        {order.status === 'ALLOCATED' && (
          <>
            <button onClick={() => mutReserve.mutate()} className="px-4 py-2 bg-purple-600 text-white rounded">Reserve Stock</button>
            <button onClick={() => mutCancel.mutate()} className="px-4 py-2 bg-red-600 text-white rounded">Cancel Order</button>
          </>
        )}
        {order.status === 'RESERVED' && (
          <>
            <button onClick={() => mutPick.mutate()} className="px-4 py-2 bg-orange-600 text-white rounded">Start Picking</button>
            <button onClick={() => mutRelease.mutate()} className="px-4 py-2 bg-slate-600 text-white rounded">Release Reservation</button>
          </>
        )}
        {order.status === 'PICKING' && (
          <button onClick={() => mutComplete.mutate()} className="px-4 py-2 bg-green-600 text-white rounded">Complete Order</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Order Items</h3>
        </div>
        <div className="p-6 space-y-6">
          {order.items?.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="font-bold text-lg">{item.product?.name}</div>
                  <div className="text-slate-500">{item.product?.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Requested</div>
                  <div className="font-bold text-xl">{item.requestedQty}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-4 bg-slate-50 p-2 rounded">
                <div><span className="text-xs text-slate-500 block">Allocated</span><span className="font-bold">{item.allocatedQty}</span></div>
                <div><span className="text-xs text-slate-500 block">Reserved</span><span className="font-bold">{item.reservedQty}</span></div>
                <div><span className="text-xs text-slate-500 block">Picked</span><span className="font-bold">{item.pickedQty}</span></div>
              </div>

              {item.allocations && item.allocations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-2">Pick Locations:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.allocations.map((alloc: any) => (
                      <LocationCard 
                        key={alloc.id} 
                        bin={alloc.bin} 
                        highlightText={`PICK: ${alloc.quantity} UNITS`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
