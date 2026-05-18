import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  CreditCard,
  ClipboardList,
  Bell,
  Menu,
  X,
  LogOut,
  Home,
  Notebook,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { Role } from '@/types';

const navForRole = (role: Role) => {
  const base = [
    { to: '/student', label: 'Overview', icon: Home, end: true },
    { to: '/student/profile', label: 'Profile', icon: User },
    { to: '/student/notes', label: 'Notes', icon: Notebook },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
  ];
  if (role === 'library_student') {
    base.push({ to: '/student/payments', label: 'Payments', icon: CreditCard });
  }
  if (role === 'coaching_student' || role === 'library_student') {
    base.push({ to: '/student/mock-tests', label: 'Mock Tests', icon: ClipboardList });
  }
  return base;
};

export const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const { user, clearAuth, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const items = user ? navForRole(user.role) : [];

  const changePwMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/change-password', {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      return res.data;
    },
    onSuccess: (data: { data?: { accessToken?: string } }) => {
      if (data?.data?.accessToken && user) {
        setAuth(user, data.data.accessToken);
      }
      toast.success('Password changed successfully');
      setShowChangePw(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to change password';
      toast.error(msg);
    },
  });

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-white transition lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-bold">
            S
          </div>
          <div>
            <p className="font-semibold text-sm">Student Portal</p>
            <p className="text-xs text-slate-400 truncate max-w-[140px]">{user?.fullName}</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => void logout()}
          className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </aside>

      {sidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
          <button
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="text-sm text-brand-600 hover:underline">
            Public site
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowChangePw(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              title="Change your password"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Change Password</span>
            </button>
            <span className="text-sm text-slate-600">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <ErrorBoundary scope="This page" homePath="/student">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowChangePw(false)}
            aria-label="Close"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
              <button type="button" onClick={() => setShowChangePw(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (newPw !== confirmPw) {
                  toast.error('New passwords do not match');
                  return;
                }
                changePwMutation.mutate();
              }}
            >
              <div>
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={cn(
                    'mt-1 w-full rounded-lg border px-3 py-2 text-sm',
                    confirmPw && confirmPw !== newPw
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-brand-500'
                  )}
                  required
                  minLength={8}
                />
                {confirmPw && confirmPw !== newPw && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePw(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changePwMutation.isPending || newPw.length < 8 || newPw !== confirmPw}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {changePwMutation.isPending ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
