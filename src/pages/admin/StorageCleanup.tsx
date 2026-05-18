import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  ClipboardList,
  FileText,
  HardDrive,
  Notebook,
  Shield,
  Trash2,
  Zap,
  Clock,
  CheckSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

type Stats = {
  notifications: number;
  attempts: number;
  notesQuestions: number;
  auditLogs: number;
  notesCount: number;
  notesTotalSize: number;
};

type NoteRow = {
  _id: string;
  title: string;
  fileName: string;
  fileSize: number;
  audience: string;
  createdAt: string;
};

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export const StorageCleanup = () => {
  const queryClient = useQueryClient();

  // Cleanup options
  const [clearNotifications, setClearNotifications] = useState(false);
  const [notifDays, setNotifDays] = useState('30');
  const [clearOldAttempts, setClearOldAttempts] = useState(false);
  const [attemptDays, setAttemptDays] = useState('90');
  const [clearNotesQuestions, setClearNotesQuestions] = useState(false);
  const [clearAuditLogs, setClearAuditLogs] = useState(false);
  const [auditDays, setAuditDays] = useState('30');

  // Notes selection
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

  const { data: stats, isLoading } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Stats>>('/admin/storage/stats');
      return res.data.data;
    },
  });

  const { data: notesData, isLoading: loadingNotes } = useQuery({
    queryKey: ['admin-notes'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NoteRow[]>>('/notes/admin');
      return res.data.data;
    },
  });

  const cleanup = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<Record<string, number>>>('/admin/storage/cleanup', {
        clearNotifications,
        clearOldAttempts,
        clearNotesQuestions,
        clearAuditLogs,
        attemptsOlderThanDays: Number(attemptDays) || 90,
        auditLogsOlderThanDays: Number(auditDays) || 30,
        notificationsOlderThanDays: Number(notifDays) || undefined,
      });
      return res.data.data;
    },
    onSuccess: (summary) => {
      const parts = Object.entries(summary).map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/deleted/i, '').trim();
        return `${v} ${label}`;
      });
      toast.success(`Cleaned: ${parts.join(', ')}`);
      setClearNotifications(false);
      setClearOldAttempts(false);
      setClearNotesQuestions(false);
      setClearAuditLogs(false);
      void queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
    onError: () => toast.error('Cleanup failed'),
  });

  const deleteNotes = useMutation({
    mutationFn: async (noteIds: string[]) => {
      const res = await api.post<ApiResponse<{ deletedCount: number }>>('/admin/storage/delete-notes', { noteIds });
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} note(s) deleted — storage freed`);
      setSelectedNotes(new Set());
      void queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      void queryClient.invalidateQueries({ queryKey: ['student-notes'] });
      void queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
    onError: () => toast.error('Failed to delete notes'),
  });

  const notes = notesData ?? [];
  const anyCleanupSelected = clearNotifications || clearOldAttempts || clearNotesQuestions || clearAuditLogs;
  const selectedSize = notes
    .filter((n) => selectedNotes.has(n._id))
    .reduce((s, n) => s + n.fileSize, 0);

  const toggleNote = (id: string) => {
    setSelectedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllNotes = () => {
    if (selectedNotes.size === notes.length) setSelectedNotes(new Set());
    else setSelectedNotes(new Set(notes.map((n) => n._id)));
  };

  const statCards: { label: string; value: string | number; icon: typeof HardDrive; color: string; sub?: string }[] = [
    {
      label: 'Audit Logs',
      value: stats?.auditLogs ?? 0,
      icon: Shield,
      color: 'bg-purple-50 text-purple-600',
      sub: 'Auto-purged every 24h (>30d)',
    },
    {
      label: 'Notifications',
      value: stats?.notifications ?? 0,
      icon: Bell,
      color: 'bg-blue-50 text-blue-600',
      sub: 'Auto-purged every 24h (>30d)',
    },
    {
      label: 'Test Attempts',
      value: stats?.attempts ?? 0,
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600',
      sub: 'Auto-purged every 24h (>90d)',
    },
    {
      label: 'Notes Questions',
      value: stats?.notesQuestions ?? 0,
      icon: FileText,
      color: 'bg-cyan-50 text-cyan-600',
    },
    {
      label: 'Uploaded Notes',
      value: stats?.notesCount ?? 0,
      icon: Notebook,
      color: 'bg-emerald-50 text-emerald-600',
      sub: stats?.notesTotalSize ? formatBytes(stats.notesTotalSize) : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Storage & Cleanup</h1>
        <p className="mt-1 text-slate-600">
          Monitor data usage and free space. Old audit logs, notifications and attempts are auto-purged every 24 hours.
        </p>
      </div>

      {/* Auto Cleanup Badge */}
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <Zap className="h-5 w-5 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-green-800">Auto-Cleanup Active</p>
          <p className="text-xs text-green-600">
            Audit logs &gt;30 days, notifications &gt;30 days, and evaluated attempts &gt;90 days are automatically deleted every 24 hours.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
                {s.sub && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {s.sub}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Cleanup Panel */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Trash2 className="h-5 w-5 text-red-500" />
          Manual Cleanup
        </h2>
        <p className="mt-1 text-sm text-slate-500">Select what to clean and configure retention period</p>

        <div className="mt-5 space-y-4">
          {/* Audit Logs */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={clearAuditLogs}
                onChange={(e) => setClearAuditLogs(e.target.checked)}
                className="rounded border-slate-300 text-brand-600"
              />
              <Shield className="h-4 w-4 text-purple-500" />
              Delete audit logs older than
            </label>
            <input
              type="number"
              min={1}
              value={auditDays}
              onChange={(e) => setAuditDays(e.target.value)}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
            />
            <span className="text-sm text-slate-500">days</span>
            <span className="ml-auto text-xs text-slate-400">{stats?.auditLogs ?? 0} total</span>
          </div>

          {/* Notifications */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={clearNotifications}
                onChange={(e) => setClearNotifications(e.target.checked)}
                className="rounded border-slate-300 text-brand-600"
              />
              <Bell className="h-4 w-4 text-blue-500" />
              Delete notifications older than
            </label>
            <input
              type="number"
              min={1}
              value={notifDays}
              onChange={(e) => setNotifDays(e.target.value)}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
            />
            <span className="text-sm text-slate-500">days</span>
            <span className="ml-auto text-xs text-slate-400">{stats?.notifications ?? 0} total</span>
          </div>

          {/* Old Attempts */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={clearOldAttempts}
                onChange={(e) => setClearOldAttempts(e.target.checked)}
                className="rounded border-slate-300 text-brand-600"
              />
              <ClipboardList className="h-4 w-4 text-amber-500" />
              Delete evaluated attempts older than
            </label>
            <input
              type="number"
              min={7}
              value={attemptDays}
              onChange={(e) => setAttemptDays(e.target.value)}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm"
            />
            <span className="text-sm text-slate-500">days</span>
            <span className="ml-auto text-xs text-slate-400">{stats?.attempts ?? 0} total</span>
          </div>

          {/* Notes Questions */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={clearNotesQuestions}
                onChange={(e) => setClearNotesQuestions(e.target.checked)}
                className="rounded border-slate-300 text-brand-600"
              />
              <FileText className="h-4 w-4 text-cyan-500" />
              Delete question-bank entries sourced from notes
            </label>
            <span className="ml-auto text-xs text-slate-400">{stats?.notesQuestions ?? 0} total</span>
          </div>

          <button
            type="button"
            disabled={cleanup.isPending || !anyCleanupSelected}
            onClick={() => {
              if (window.confirm('This cannot be undone. Proceed with cleanup?')) cleanup.mutate();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {cleanup.isPending ? 'Cleaning...' : 'Run Cleanup'}
          </button>
        </div>
      </div>

      {/* Notes Storage — Selective Delete */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <HardDrive className="h-5 w-5 text-emerald-500" />
              Notes Storage
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Select notes to delete and free Cloudinary / disk storage.
              {stats?.notesTotalSize ? ` Total: ${formatBytes(stats.notesTotalSize)}` : ''}
            </p>
          </div>
          {selectedNotes.size > 0 && (
            <button
              type="button"
              disabled={deleteNotes.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${selectedNotes.size} note(s) (${formatBytes(selectedSize)}) permanently? Files will be removed from Cloudinary.`
                  )
                )
                  deleteNotes.mutate([...selectedNotes]);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleteNotes.isPending
                ? 'Deleting...'
                : `Delete ${selectedNotes.size} selected (${formatBytes(selectedSize)})`}
            </button>
          )}
        </div>

        {loadingNotes ? (
          <Skeleton className="mt-4 h-40 w-full rounded-xl" />
        ) : notes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No uploaded notes.</p>
        ) : (
          <div className="mt-4">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={selectedNotes.size === notes.length && notes.length > 0}
                onChange={toggleAllNotes}
                className="rounded border-slate-300 text-brand-600"
              />
              <CheckSquare className="h-4 w-4" />
              Select all ({notes.length})
            </label>
            <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
              {notes.map((n) => (
                <li
                  key={n._id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    selectedNotes.has(n._id)
                      ? 'border-red-200 bg-red-50'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedNotes.has(n._id)}
                    onChange={() => toggleNote(n._id)}
                    className="rounded border-slate-300 text-red-600"
                  />
                  <Notebook className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-400">
                      {n.fileName} · {formatBytes(n.fileSize)} · {n.audience} ·{' '}
                      {new Date(n.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-500">
                    {formatBytes(n.fileSize)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
