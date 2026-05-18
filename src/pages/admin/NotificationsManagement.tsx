import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface NotificationRow {
  _id: string;
  title: string;
  message: string;
  targetRoles: string[];
  createdAt: string;
}

export const NotificationsManagement = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NotificationRow[]>>('/notifications/');
      return res.data.data;
    },
  });

  const broadcast = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/', {
        title,
        message,
        targetRoles: ['coaching_student', 'library_student'],
      });
    },
    onSuccess: () => {
      toast.success('Notification sent');
      setTitle('');
      setMessage('');
      void queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: () => toast.error('Failed to send'),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      await api.delete('/notifications/');
    },
    onSuccess: () => {
      toast.success('All notifications cleared');
      void queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: () => toast.error('Failed to clear'),
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Broadcast Notifications</h1>
          <p className="mt-1 text-slate-600">Send announcements to students</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => clearAll.mutate()} disabled={clearAll.isPending}>
          Clear all
        </Button>
      </div>

      <form
        className="mt-8 max-w-lg space-y-4 rounded-2xl border border-slate-100 bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          broadcast.mutate();
        }}
      >
        <label className="block text-sm">
          <span className="font-medium">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Message</span>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <Button type="submit" disabled={broadcast.isPending}>
          Send to all students
        </Button>
      </form>

      <h2 className="mt-10 font-semibold">Recent broadcasts</h2>
      {isLoading ? (
        <Skeleton className="mt-4 h-32 w-full" />
      ) : (
        <ul className="mt-4 space-y-3">
          {(data ?? []).map((n) => (
            <li key={n._id} className="rounded-xl border border-slate-100 bg-white p-4">
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
