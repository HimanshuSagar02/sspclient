import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse, PaginatedMeta } from '@/types';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { MessageSquare, Search } from 'lucide-react';

type EnquiryStatus = 'new' | 'contacted' | 'closed';

type EnquiryRow = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  exam?: string;
  message?: string;
  status: EnquiryStatus;
  createdAt: string;
};

export const EnquiriesManagement = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | EnquiryStatus>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-enquiries', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);

      const res = await api.get<ApiResponse<EnquiryRow[]>>(`/site/admin/enquiries?${params}`);
      return { rows: res.data.data, meta: res.data.meta as PaginatedMeta };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: EnquiryStatus }) => {
      await api.patch(`/site/admin/enquiries/${id}`, { status: nextStatus });
    },
    onSuccess: () => {
      toast.success('Status updated');
      void queryClient.invalidateQueries({ queryKey: ['admin-enquiries'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const rows = data?.rows ?? [];
  const meta = data?.meta ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Enquiries</h1>
      <p className="mt-1 text-slate-600">Manage incoming admission enquiries</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, phone, email, exam..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | EnquiryStatus);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <Skeleton className="m-6 h-56 w-full" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Exam</th>
                  <th className="px-6 py-3 font-medium">Message</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No enquiries found
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id} className="border-t border-slate-100">
                      <td className="px-6 py-3 font-medium">{row.name}</td>
                      <td className="px-6 py-3">
                        <div>{row.phone}</div>
                        {row.email ? <div className="text-xs text-slate-500">{row.email}</div> : null}
                      </td>
                      <td className="px-6 py-3">{row.exam ?? '—'}</td>
                      <td className="px-6 py-3 text-slate-700">
                        {row.message ? (
                          <span className="inline-flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-slate-400" />
                            {row.message.length > 48 ? `${row.message.slice(0, 48)}…` : row.message}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-3 text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            disabled={row.status === 'contacted' || updateStatusMutation.isPending}
                            onClick={() =>
                              updateStatusMutation.mutate({ id: row._id, nextStatus: 'contacted' })
                            }
                          >
                            Mark Contacted
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            disabled={row.status === 'closed' || updateStatusMutation.isPending}
                            onClick={() => updateStatusMutation.mutate({ id: row._id, nextStatus: 'closed' })}
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading ? (
          <div className="px-4 pb-4">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages ?? Math.ceil(meta.total / meta.limit)}
              total={meta.total}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </article>
    </section>
  );
};

