import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../api/audit.api';
import { DataTable } from '../components/common/DataTable';
import { PageHeader } from '../components/common/PageHeader';
import { format } from 'date-fns';

const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => getAuditLogs({ page, limit: 15 })
  });

  const columns = [
    { key: 'createdAt', label: 'Time', render: (item: any) => format(new Date(item.createdAt), 'dd MMM yy HH:mm:ss') },
    { key: 'user', label: 'User', render: (item: any) => item.user?.name || item.user?.email || 'System' },
    { key: 'action', label: 'Action', render: (item: any) => <span className="font-bold text-slate-700">{item.action}</span> },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'entityId', label: 'Entity ID', render: (item: any) => <span className="font-mono text-xs">{item.entityId}</span> },
    { 
      key: 'details', 
      label: 'Details', 
      render: (item: any) => {
        const raw = item.details || item.afterData || item.beforeData;
        if (!raw) return <span className="text-slate-400 italic">None</span>;
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return (
            <span className="font-mono text-xs text-slate-600 truncate max-w-xs block" title={JSON.stringify(parsed)}>
              {Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ')}
            </span>
          );
        } catch {
          return <span className="truncate max-w-xs block text-xs" title={raw}>{raw}</span>;
        }
      }
    },
  ];

  const logsList = Array.isArray(data) ? data : (data?.data || []);

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Audit Logs" description="System-wide activity tracking" />

      {error ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mt-4 text-sm">
          Unable to load audit logs. Note: Audit log access requires Administrator or Warehouse Manager privileges.
        </div>
      ) : (
        <div className="flex-1 min-h-0 mt-4">
          <DataTable
            columns={columns}
            data={logsList}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            page={Array.isArray(data) ? 1 : (data?.page || 1)}
            totalPages={Array.isArray(data) ? 1 : (data?.totalPages || 1)}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
