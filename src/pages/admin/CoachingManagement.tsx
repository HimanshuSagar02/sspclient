import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse, CoachingStudentRow, PaginatedMeta } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/utils/apiErrors';

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  guardianName: '',
  guardianPhone: '',
};

export const CoachingManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editRow, setEditRow] = useState<CoachingStudentRow | null>(null);
  const [editForm, setEditForm] = useState({ guardianName: '', guardianPhone: '', isActive: true });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coaching', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const res = await api.get<ApiResponse<CoachingStudentRow[]>>(
        `/admin/coaching-students?${params}`
      );
      return { rows: res.data.data, meta: res.data.meta as PaginatedMeta };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {
        email: createForm.email.trim(),
        password: createForm.password,
        fullName: createForm.fullName.trim(),
      };
      if (createForm.phone.trim()) payload.phone = createForm.phone.trim();
      if (createForm.guardianName.trim()) payload.guardianName = createForm.guardianName.trim();
      if (createForm.guardianPhone.trim()) payload.guardianPhone = createForm.guardianPhone.trim();
      await api.post('/auth/coaching-students', payload);
    },
    onSuccess: () => {
      toast.success('Coaching student enrolled');
      setShowCreate(false);
      setCreateForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ['admin-coaching'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to create student')),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editRow) return;
      await api.patch(`/admin/coaching-students/${editRow._id}`, {
        guardianName: editForm.guardianName,
        guardianPhone: editForm.guardianPhone,
        isActive: editForm.isActive,
      });
    },
    onSuccess: () => {
      toast.success('Student updated');
      setEditRow(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-coaching'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/coaching-students/${id}`);
    },
    onSuccess: () => {
      toast.success('Student deactivated');
      void queryClient.invalidateQueries({ queryKey: ['admin-coaching'] });
    },
    onError: () => toast.error('Failed to deactivate'),
  });

  const rows = data?.rows ?? [];
  const meta = data?.meta ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Coaching Management</h1>
          <p className="mt-1 text-slate-600">Enroll and manage coaching students (COA IDs)</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name, email, enrollment ID..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <Skeleton className="m-6 h-48 w-full" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-medium">Enrollment ID</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Guardian</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No coaching students yet
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row._id} className="border-t border-slate-100">
                        <td className="px-6 py-3 font-mono text-brand-700">{row.enrollmentId}</td>
                        <td className="px-6 py-3 font-medium">{row.profile?.fullName ?? '—'}</td>
                        <td className="px-6 py-3">{row.user?.email ?? '—'}</td>
                        <td className="px-6 py-3 text-slate-600">
                          {row.guardianName ?? '—'}
                          {row.guardianPhone ? ` · ${row.guardianPhone}` : ''}
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={row.user?.isActive ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setEditRow(row);
                                setEditForm({
                                  guardianName: row.guardianName ?? '',
                                  guardianPhone: row.guardianPhone ?? '',
                                  isActive: row.user?.isActive ?? true,
                                });
                              }}
                              className="text-brand-600 hover:underline"
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
                              className="text-red-600 hover:underline"
                            >
                              <Trash2 className="inline h-3.5 w-3.5" />
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
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Enroll Coaching Student" wide>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {(['fullName', 'email', 'password', 'phone', 'guardianName', 'guardianPhone'] as const).map(
            (field) => (
              <div key={field} className={field === 'email' || field === 'password' ? '' : ''}>
                <label className="text-sm font-medium capitalize text-slate-700">
                  {field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  required={['fullName', 'email', 'password'].includes(field)}
                  value={createForm[field]}
                  onChange={(e) => setCreateForm({ ...createForm, [field]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )
          )}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
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
              Enroll
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Coaching Student">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <p className="font-mono text-sm text-brand-700">{editRow?.enrollmentId}</p>
          <div>
            <label className="text-sm font-medium text-slate-700">Guardian Name</label>
            <input
              value={editForm.guardianName}
              onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Guardian Phone</label>
            <input
              value={editForm.guardianPhone}
              onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
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
    </div>
  );
};

