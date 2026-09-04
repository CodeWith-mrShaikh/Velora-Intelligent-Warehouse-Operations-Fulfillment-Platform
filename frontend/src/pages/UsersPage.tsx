import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/users.api';
import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { UserFormModal } from '../components/users/UserFormModal';
import { Plus } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => getUsers({ page, limit: 10 })
  });

  const columns = [
    { key: 'name', label: 'Name', render: (item: any) => <span className="font-bold">{item.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (item: any) => <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{item.role}</span> },
    { key: 'isActive', label: 'Status', render: (item: any) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'createdAt', label: 'Created At', render: (item: any) => new Date(item.createdAt).toLocaleDateString() }
  ];

  const userList = Array.isArray(data) ? data : (data?.data || []);

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Users" description="Manage system access and roles">
        <button
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add User
        </button>
      </PageHeader>

      <div className="flex-1 min-h-0 mt-4">
        <DataTable
          columns={columns}
          data={userList}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          page={Array.isArray(data) ? 1 : (data?.page || 1)}
          totalPages={Array.isArray(data) ? 1 : (data?.totalPages || 1)}
          onPageChange={setPage}
        />
      </div>

      <UserFormModal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} />
    </div>
  );
};

export default UsersPage;
