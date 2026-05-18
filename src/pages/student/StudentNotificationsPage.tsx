import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface NotificationRow {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
}

export const StudentNotificationsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NotificationRow[]>>('/notifications/mine');
      return res.data.data;
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      <p className="mt-1 text-slate-600">Announcements from your institute</p>
      {isLoading ? (
        <Skeleton className="mt-6 h-40 w-full" />
      ) : (
        <ul className="mt-6 space-y-3">
          {(data ?? []).map((n) => (
            <li key={n._id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">{n.title}</p>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(n.createdAt).toLocaleString('en-IN')}
              </p>
            </li>
          ))}
          {!data?.length ? <p className="text-sm text-slate-500">No notifications.</p> : null}
        </ul>
      )}
    </div>
  );
};
