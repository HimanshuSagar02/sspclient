import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse, LibraryStudentRow, PaginatedMeta } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage, parseOptionalAmount } from '@/utils/apiErrors';

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  seatNumber: '',
  feeDueAmount: '',
};

const buildLibraryCreatePayload = (form: typeof emptyForm) => {
  const payload: Record<string, string | number> = {
    email: form.email.trim(),
    password: form.password,
    fullName: form.fullName.trim(),
  };
  if (form.phone.trim()) payload.phone = form.phone.trim();
  if (form.seatNumber.trim()) payload.seatNumber = form.seatNumber.trim();
  const fee = parseOptionalAmount(form.feeDueAmount);
  if (fee !== undefined) payload.feeDueAmount = fee;
  return payload;
};

export const LibraryManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [checkedInFilter, setCheckedInFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editRow, setEditRow] = useState<LibraryStudentRow | null>(null);
  const [editForm, setEditForm] = useState({
    seatNumber: '',
    feeStatus: 'due' as 'paid' | 'due' | 'partial',
    feeDueAmount: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-library', page, search, checkedInFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (checkedInFilter) params.set('checkedIn', checkedInFilter);
      const res = await api.get<ApiResponse<LibraryStudentRow[]>>(
        `/admin/library-students?${params}`
      );
      return { rows: res.data.data, meta: res.data.meta as PaginatedMeta };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/library-students', buildLibraryCreatePayload(createForm));
    },
    onSuccess: () => {
      toast.success('Library student registered');
      setShowCreate(false);
      setCreateForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ['admin-library'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to register')),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editRow) return;
      const fee = parseOptionalAmount(editForm.feeDueAmount);
      await api.patch(`/admin/library-students/${editRow._id}`, {
        seatNumber: editForm.seatNumber.trim() || undefined,
        feeStatus: editForm.feeStatus,
        feeDueAmount: fee,
        isActive: editForm.isActive,
      });
    },
    onSuccess: () => {
      toast.success('Student updated');
      setEditRow(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-library'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/library-students/${id}/check-in`),
    onSuccess: () => {
      toast.success('Checked in');
      void queryClient.invalidateQueries({ queryKey: ['admin-library'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? 'Check-in failed'),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/library-students/${id}/check-out`),
    onSuccess: () => {
      toast.success('Checked out');
      void queryClient.invalidateQueries({ queryKey: ['admin-library'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? 'Check-out failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/library-students/${id}`),
    onSuccess: () => {
      toast.success('Student deactivated');
      void queryClient.invalidateQueries({ queryKey: ['admin-library'] });
    },
    onError: () => toast.error('Failed to deactivate'),
  });

  const rows = data?.rows ?? [];
  const meta = data?.meta ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <section>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Library Management</h1>
          <p className="mt-1 text-slate-600">Seat assignment, fees, and check-in/out (LIB IDs)</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, library ID..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={checkedInFilter}
          onChange={(e) => {
            setCheckedInFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All students</option>
          <option value="true">Checked in</option>
          <option value="false">Not checked in</option>
        </select>
      </div>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <Skeleton className="m-6 h-48 w-full" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Library ID</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Seat</th>
                    <th className="px-6 py-3 font-medium">Fee</th>
                    <th className="px-6 py-3 font-medium">Check-in</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No library students yet
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row._id} className="border-t border-slate-100">
                        <td className="px-6 py-3 font-mono text-brand-700">{row.libraryId}</td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{row.profile?.fullName ?? '—'}</p>
                          <p className="text-xs text-slate-500">{row.user?.email}</p>
                        </td>
                        <td className="px-6 py-3">{row.seatNumber ?? '—'}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={row.feeStatus} />
                          {row.feeDueAmount > 0 && (
                            <span className="ml-1 text-xs text-slate-500">₹{row.feeDueAmount} due</span>
                          )}
                          {row.nextFeeDueAt && (
                            <span className="block text-xs text-slate-400">
                              Next: {new Date(row.nextFeeDueAt).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge
                            status={row.isCheckedIn ? 'occupied' : 'vacant'}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            {row.isCheckedIn ? (
                              <button
                                type="button"
                                onClick={() => checkOutMutation.mutate(row._id)}
                                className="flex items-center gap-1 text-amber-600 hover:underline text-xs"
                              >
                                <LogOut className="h-3.5 w-3.5" /> Out
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => checkInMutation.mutate(row._id)}
                                className="flex items-center gap-1 text-emerald-600 hover:underline text-xs"
                              >
                                <LogIn className="h-3.5 w-3.5" /> In
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditRow(row);
                                setEditForm({
                                  seatNumber: row.seatNumber ?? '',
                                  feeStatus: row.feeStatus,
                                  feeDueAmount: String(row.feeDueAmount ?? ''),
                                  isActive: row.user?.isActive ?? true,
                                });
                              }}
                              className="text-brand-600 hover:underline text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Deactivate this student?')) {
                                  deleteMutation.mutate(row._id);
                                }
                              }}
                              className="text-red-600 text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages ?? Math.ceil(meta.total / meta.limit)}
              total={meta.total}
              onPageChange={setPage}
            />
          </>
        )}
      </article>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Library Student" wide>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="text-sm">
            <span className="font-medium">Full name</span>
            <input
              required
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Email</span>
            <input
              required
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Password</span>
            <input
              required
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Phone</span>
            <input
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Seat number</span>
            <input
              value={createForm.seatNumber}
              onChange={(e) => setCreateForm({ ...createForm, seatNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium">Monthly fee (₹)</span>
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              Due on registration date, then same day each month
            </p>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={createForm.feeDueAmount}
              onChange={(e) => setCreateForm({ ...createForm, feeDueAmount: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Register
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Library Student">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <p className="font-mono text-sm text-brand-700">{editRow?.libraryId}</p>
          <label className="block text-sm">
            <span className="font-medium">Seat</span>
            <input
              value={editForm.seatNumber}
              onChange={(e) => setEditForm({ ...editForm, seatNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Fee status</span>
            <select
              value={editForm.feeStatus}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  feeStatus: e.target.value as 'paid' | 'due' | 'partial',
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="paid">Paid</option>
              <option value="due">Due</option>
              <option value="partial">Partial</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Due amount (₹)</span>
            <input
              type="text"
              inputMode="decimal"
              value={editForm.feeDueAmount}
              onChange={(e) => setEditForm({ ...editForm, feeDueAmount: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
            />
            Account active
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditRow(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
