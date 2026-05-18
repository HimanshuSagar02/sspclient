import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Notebook,
  CreditCard,
  ClipboardList,
  Bell,
  ArrowRight,
  BookOpen,
  Award,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import type { ApiResponse, Role } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

/* ── helpers ── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const roleBadge = (role: Role) => {
  const map: Record<string, { label: string; cls: string }> = {
    coaching_student: { label: 'Coaching Student', cls: 'bg-blue-100 text-blue-800' },
    library_student: { label: 'Library Student', cls: 'bg-emerald-100 text-emerald-800' },
    admin: { label: 'Admin', cls: 'bg-purple-100 text-purple-800' },
    teacher: { label: 'Teacher', cls: 'bg-amber-100 text-amber-800' },
  };
  const b = map[role] ?? { label: role, cls: 'bg-slate-100 text-slate-700' };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${b.cls}`}>{b.label}</span>;
};

/* ── types for API data ── */
type MeData = {
  user: { email: string; role: string };
  profile: { fullName: string; avatarUrl?: string };
  studentMeta?: {
    feeStatus?: string;
    feeDueAmount?: number;
    monthlyFeeAmount?: number;
    nextFeeDueAt?: string;
    enrollmentId?: string;
    libraryId?: string;
    seatNumber?: string;
  };
};

type Attempt = {
  _id: string;
  status: string;
  obtainedMarks?: number;
  totalMarks?: number;
  mockTestId?: { title?: string };
  createdAt?: string;
};

type Notification = {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
};

export const StudentOverviewPage = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'coaching_student';

  /* ── fetch data ── */
  const { data: me, isLoading: loadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MeData>>('/auth/me');
      return res.data.data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Attempt[]>>('/mock-tests/attempts/mine');
      return res.data.data;
    },
    enabled: role === 'coaching_student' || role === 'library_student',
  });

  const { data: notifications } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Notification[]>>('/notifications/mine');
      return res.data.data;
    },
  });

  const { data: notes } = useQuery({
    queryKey: ['student-notes'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ _id: string }[]>>('/notes');
      return res.data.data;
    },
  });

  if (loadingMe) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const avatar = me?.profile?.avatarUrl;
  const fullName = me?.profile?.fullName ?? user?.fullName ?? 'Student';
  const meta = me?.studentMeta;
  const evaluatedAttempts = (attempts ?? []).filter((a) => a.status === 'evaluated');
  const recentAttempts = evaluatedAttempts.slice(0, 3);
  const recentNotifications = (notifications ?? []).slice(0, 3);
  const notesCount = notes?.length ?? 0;

  /* ── stat cards ── */
  const stats: { label: string; value: string | number; icon: typeof Award; color: string; to?: string }[] = [];

  if (role === 'coaching_student' || role === 'library_student') {
    stats.push({
      label: 'Tests Taken',
      value: evaluatedAttempts.length,
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-600',
      to: '/student/mock-tests',
    });
    const best = evaluatedAttempts.reduce<number | null>((max, a) => {
      if (a.obtainedMarks == null) return max;
      return max == null ? a.obtainedMarks : Math.max(max, a.obtainedMarks);
    }, null);
    stats.push({
      label: 'Best Score',
      value: best != null ? `${best}` : '—',
      icon: Award,
      color: 'bg-amber-50 text-amber-600',
    });
  }
  if (role === 'library_student' && meta) {
    stats.push({
      label: 'Fee Status',
      value: meta.feeStatus === 'due' ? `₹${meta.feeDueAmount ?? 0} Due` : 'Paid',
      icon: CreditCard,
      color: meta.feeStatus === 'due' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600',
      to: '/student/payments',
    });
  }
  stats.push({
    label: 'Notes',
    value: notesCount,
    icon: Notebook,
    color: 'bg-violet-50 text-violet-600',
    to: '/student/notes',
  });
  stats.push({
    label: 'Notifications',
    value: notifications?.length ?? 0,
    icon: Bell,
    color: 'bg-rose-50 text-rose-600',
    to: '/student/notifications',
  });

  /* ── quick actions ── */
  const actions: { to: string; label: string; desc: string; icon: typeof User }[] = [
    { to: '/student/profile', label: 'My Profile', desc: 'Update photo & details', icon: User },
    { to: '/student/notes', label: 'Study Material', desc: `${notesCount} files available`, icon: BookOpen },
  ];
  if (role === 'library_student') {
    actions.push({ to: '/student/payments', label: 'Fee Payment', desc: 'Pay via Razorpay UPI', icon: CreditCard });
  }
  if (role === 'coaching_student' || role === 'library_student') {
    actions.push({ to: '/student/mock-tests', label: 'Mock Tests', desc: 'Practice & analyze', icon: ClipboardList });
  }
  actions.push({ to: '/student/notifications', label: 'Notifications', desc: 'Institute announcements', icon: Bell });

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-16 h-32 w-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {avatar ? (
            <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-4 ring-white/30 sm:h-20 sm:w-20" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold ring-4 ring-white/30 sm:h-20 sm:w-20 sm:text-3xl">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm text-brand-100">{greeting()}</p>
            <h1 className="text-2xl font-bold sm:text-3xl">{fullName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-brand-100">
              {roleBadge(role)}
              {meta?.enrollmentId && <span>ID: {meta.enrollmentId}</span>}
              {meta?.libraryId && <span>LIB: {meta.libraryId}</span>}
              {meta?.seatNumber && <span>Seat: {meta.seatNumber}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const card = (
            <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.color} transition group-hover:scale-110`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            </div>
          );
          return s.to ? (
            <Link key={s.label} to={s.to}>{card}</Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{a.label}</p>
                  <p className="text-sm text-slate-500">{a.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Test Results */}
        {(role === 'coaching_student' || role === 'library_student') && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-600" />
                Recent Results
              </h2>
              <Link to="/student/mock-tests" className="text-sm font-medium text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {recentAttempts.length === 0 ? (
              <p className="mt-4 text-sm text-slate-400">No test results yet. Take a mock test to see your scores here.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentAttempts.map((a) => (
                  <li key={a._id}>
                    <Link
                      to={`/student/mock-tests/result/${a._id}`}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition hover:bg-brand-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{a.mockTestId?.title ?? 'Mock Test'}</p>
                        <p className="text-xs text-slate-500">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-brand-700">{a.obtainedMarks ?? 0}</span>
                        {a.totalMarks ? <span className="text-xs text-slate-400">/{a.totalMarks}</span> : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Recent Notifications */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-600" />
              Recent Notifications
            </h2>
            <Link to="/student/notifications" className="text-sm font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {recentNotifications.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No notifications yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentNotifications.map((n) => (
                <li key={n._id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fee Summary — Library Students */}
        {role === 'library_student' && meta && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-600" />
              Fee Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="text-sm text-slate-600">Monthly Fee</span>
                <span className="font-semibold text-slate-900">₹{meta.monthlyFeeAmount ?? 0}</span>
              </div>
              <div className={`flex items-center justify-between rounded-xl p-3 ${meta.feeStatus === 'due' ? 'bg-red-50' : 'bg-green-50'}`}>
                <span className="text-sm text-slate-600">Due Amount</span>
                <span className={`font-bold ${meta.feeStatus === 'due' ? 'text-red-700' : 'text-green-700'}`}>
                  ₹{meta.feeDueAmount ?? 0}
                </span>
              </div>
              {meta.nextFeeDueAt && (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span className="text-sm text-slate-600">Next Due Date</span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(meta.nextFeeDueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              {meta.feeStatus === 'due' && (
                <Link
                  to="/student/payments"
                  className="mt-2 block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
                >
                  Pay Now →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
