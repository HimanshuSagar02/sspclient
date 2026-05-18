import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse, AuditLogRow, PaginatedMeta } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/admin/Pagination';

export const AuditLogsPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<AuditLogRow[]>>(
        `/admin/audit-logs?page=${page}&limit=25`
      );
      return { logs: res.data.data, meta: res.data.meta as PaginatedMeta };
    },
  });

  const logs = data?.logs ?? [];
  const meta = data?.meta ?? { page: 1, limit: 25, total: 0, totalPages: 1 };

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
      <p className="mt-1 text-slate-600">Track all admin actions across the portal</p>

      <article className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <Skeleton className="m-6 h-48 w-full" />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Resource</th>
                  <th className="px-6 py-3 font-medium">Actor</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No audit logs yet
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="border-t border-slate-100">
                      <td className="px-6 py-3 font-mono text-xs">{log.action}</td>
                      <td className="px-6 py-3">
                        {log.resource}
                        {log.resourceId && (
                          <span className="block text-xs text-slate-400">{log.resourceId}</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {typeof log.actorId === 'object' && log.actorId?.email
                          ? log.actorId.email
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages ?? Math.ceil(meta.total / meta.limit)}
              total={meta.total}
              onPageChange={setPage}
            />
          </>
        )}
      </article>
    </section>
  );
};
