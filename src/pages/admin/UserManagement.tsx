import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { AdminUser, ApiResponse, PaginatedMeta, Role } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Modal } from '@/components/admin/Modal';

const ROLES: Role[] = ['admin', 'teacher', 'coaching_student', 'library_student'];

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<Role>('coaching_student');
  const [editActive, setEditActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get<ApiResponse<AdminUser[]>>(`/admin/users?${params}`);
      return { users: res.data.data, meta: res.data.meta as PaginatedMeta };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, isActive, role }: { id: string; isActive: boolean; role: Role }) => {
      await api.patch(`/admin/users/${id}`, { isActive, role });
    },
    onSuccess: () => {
      toast.success('User updated');
      setEditUser(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Failed to update user'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      await api.patch(`/admin/users/${id}/password`, { password });
    },
    onSuccess: () => {
      toast.success('Password reset successfully');
      setNewPassword('');
      setShowResetPw(false);
    },
    onError: () => toast.error('Failed to reset password'),
  });

  const openEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditRole(user.role);
    setEditActive(user.isActive);
    setNewPassword('');
    setShowResetPw(false);
  };

  const users = data?.users ?? [];
  const meta = data?.meta ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
      <p className="mt-1 text-slate-600">View and manage all portal accounts</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by email..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
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
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="border-t border-slate-100">
                        <td className="px-6 py-3 font-medium">
                          {user.profile?.fullName ?? '—'}
                        </td>
                        <td className="px-6 py-3">{user.email}</td>
                        <td className="px-6 py-3">
                          <StatusBadge status={user.role} />
                        </td>
                        <td className="px-6 py-3">
                          <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="text-brand-600 hover:underline"
                          >
                            Edit
                          </button>
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

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate({
                id: editUser._id,
                isActive: editActive,
                role: editRole,
              });
            }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-600">{editUser.email}</p>
            <div>
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Role)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              Account active
            </label>

            {/* Reset Password */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <button
                type="button"
                onClick={() => setShowResetPw(!showResetPw)}
                className="flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
              >
                <KeyRound className="h-4 w-4" />
                Reset Password
              </button>
              {showResetPw && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    minLength={8}
                  />
                  <button
                    type="button"
                    disabled={newPassword.length < 8 || resetPasswordMutation.isPending}
                    onClick={() =>
                      resetPasswordMutation.mutate({ id: editUser._id, password: newPassword })
                    }
                    className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
