import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getOrders, createOrder } from '../api/orders.api';
import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { OrderForm } from '../components/orders/OrderForm';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const OrdersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => getOrders({ page, limit: 10 })
  });

  const createOrderMutation = useMutation({
    mutationFn: (formData: any) => createOrder(formData),
    onSuccess: (newOrder: any) => {
      toast.success(`Order ${newOrder?.orderNumber || ''} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsCreateModalOpen(false);
      if (newOrder?.id) {
        navigate(`/orders/${newOrder.id}`);
      }
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.response?.data?.error?.message || 'Failed to create order';
      toast.error(msg);
    }
  });

  const columns = [
    { key: 'orderNumber', label: 'Order #', render: (item: any) => <span className="font-bold">{item.orderNumber}</span> },
    { key: 'customerRef', label: 'Customer Ref' },
    { key: 'status', label: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { key: 'itemsCount', label: 'Items' },
    { key: 'totalAmount', label: 'Total', render: (item: any) => `$${Number(item.totalAmount || 0).toFixed(2)}` },
    { key: 'createdAt', label: 'Created At', render: (item: any) => item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A' }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Orders" description="Manage outbound orders">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Create Order
        </button>
      </PageHeader>

      <div className="flex-1 min-h-0 mt-4">
        <DataTable
          columns={columns}
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          onRowClick={(item) => navigate(`/orders/${item.id}`)}
          page={data?.page || 1}
          totalPages={data?.totalPages || 1}
          onPageChange={setPage}
        />
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Outbound Order"
        size="lg"
      >
        <OrderForm
          onSubmit={(formData) => createOrderMutation.mutate(formData)}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createOrderMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default OrdersPage;
