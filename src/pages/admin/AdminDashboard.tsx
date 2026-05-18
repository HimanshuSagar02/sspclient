import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, Library, ClipboardCheck, UserCheck } from 'lucide-react';
import api from '@/services/api';
import type { ApiResponse, DashboardStats } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ComponentType } from 'react';

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
}) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

export const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const stats = data ?? {
    totalUsers: 0,
    coachingStudents: 0,
    libraryStudents: 0,
    teachers: 0,
    totalMockAttempts: 0,
    libraryCheckedIn: 0,
    libraryOccupied: 0,
    libraryVacant: 0,
    recentAuditLogs: [],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-slate-600">Full control over Srishti Study Point portal</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} />
        <StatCard label="Coaching Students" value={stats.coachingStudents} icon={GraduationCap} />
        <StatCard label="Library Students" value={stats.libraryStudents} icon={Library} />
        <StatCard label="Teachers" value={stats.teachers} icon={UserCheck} />
        <StatCard label="Mock Attempts" value={stats.totalMockAttempts} icon={ClipboardCheck} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Library Live Status</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Occupied</p>
            <p className="mt-2 text-3xl font-bold text-brand-600">{stats.libraryOccupied}</p>
            <p className="text-sm text-slate-500">seats currently taken</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Vacant</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.libraryVacant}</p>
            <p className="text-sm text-slate-500">seats available now</p>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">Recent Audit Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Resource</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentAuditLogs as { action: string; resource: string; createdAt: string }[]).map(
                (log, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-6 py-3">{log.action}</td>
                    <td className="px-6 py-3">{log.resource}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
