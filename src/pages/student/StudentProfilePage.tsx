import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getApiErrorMessage } from '@/utils/apiErrors';

type MeData = {
  user: { id: string; email: string; role: string };
  profile: {
    fullName: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
    dateOfBirth?: string;
  };
  studentMeta?: unknown;
};

export const StudentProfilePage = () => {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MeData>>('/auth/me');
      return res.data.data;
    },
  });

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    if (data?.profile) {
      setForm({
        fullName: data.profile.fullName ?? '',
        phone: data.profile.phone ?? '',
        address: data.profile.address ?? '',
        dateOfBirth: data.profile.dateOfBirth
          ? new Date(data.profile.dateOfBirth).toISOString().slice(0, 10)
          : '',
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await api.patch('/auth/profile', form);
    },
    onSuccess: async () => {
      toast.success('Profile updated');
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      if (user) setAuth({ ...user, fullName: form.fullName }, localStorage.getItem('accessToken') ?? '');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Update failed')),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('image', file);
      const res = await api.post<ApiResponse<{ avatarUrl: string }>>('/auth/profile/avatar', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data.avatarUrl;
    },
    onSuccess: () => {
      toast.success('Photo updated');
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Upload failed')),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const avatar = data?.profile?.avatarUrl;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      <p className="mt-1 text-slate-600">Update your photo and contact details</p>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-100" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-800">
              {form.fullName.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar.mutate(file);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={uploadAvatar.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {uploadAvatar.isPending ? 'Uploading...' : 'Change photo'}
            </Button>
            <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP — max 5MB</p>
          </div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <label className="block text-sm">
            <span className="font-medium">Full name</span>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Address</span>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Date of birth</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <p className="text-sm text-slate-500">Email: {data?.user?.email}</p>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving...' : 'Save profile'}
          </Button>
        </form>
      </div>
    </div>
  );
};


