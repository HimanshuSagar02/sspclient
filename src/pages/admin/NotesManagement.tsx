import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { getApiErrorMessage } from '@/utils/apiErrors';

type Audience = 'all' | 'coaching' | 'library';

interface NoteRow {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  audience: Audience;
  createdAt: string;
}

const audienceLabel: Record<Audience, string> = {
  all: 'All students',
  coaching: 'Coaching only',
  library: 'Library only',
};

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

export const NotesManagement = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notes'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NoteRow[]>>('/notes/admin');
      return res.data.data;
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please pick a file');
      const body = new FormData();
      body.append('file', file);
      body.append('title', title.trim());
      if (description.trim()) body.append('description', description.trim());
      body.append('audience', audience);
      await api.post('/notes/admin', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Note uploaded');
      setTitle('');
      setDescription('');
      setAudience('all');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      void queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      void queryClient.invalidateQueries({ queryKey: ['student-notes'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Upload failed')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notes/admin/${id}`);
    },
    onSuccess: () => {
      toast.success('Note deleted');
      void queryClient.invalidateQueries({ queryKey: ['admin-notes'] });
      void queryClient.invalidateQueries({ queryKey: ['student-notes'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Delete failed')),
  });

  const notes = data ?? [];

  return (
    <section>
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Notes & Study Material</h1>
        <p className="mt-1 text-slate-600">
          Upload PDFs and documents — students can download them from their portal.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) {
            toast.error('Title is required');
            return;
          }
          if (!file) {
            toast.error('Please pick a file');
            return;
          }
          upload.mutate();
        }}
        className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Upload new note</h2>

        <label className="block text-sm">
          <span className="font-medium">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. UPSC Polity — Chapter 1"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Description (optional)</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium">Audience</span>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All students</option>
            <option value="coaching">Coaching students only</option>
            <option value="library">Library students only</option>
          </select>
        </label>

        <div>
          <span className="text-sm font-medium text-slate-700">File</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100"
            >
              <Upload className="h-4 w-4" />
              {file ? 'Replace file' : 'Choose file'}
            </button>
            {file ? (
              <span className="text-sm text-slate-600">
                {file.name} <span className="text-slate-400">({formatBytes(file.size)})</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">PDF, DOC, XLS, PPT, TXT, ZIP, images. Max 25MB.</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button type="submit" disabled={upload.isPending}>
          {upload.isPending ? 'Uploading...' : 'Upload to Cloudinary'}
        </Button>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">All notes</h2>
      {isLoading ? (
        <Skeleton className="mt-4 h-48 w-full" />
      ) : notes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No notes uploaded yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li
              key={n._id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                  <p className="truncate font-medium text-slate-900">{n.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {audienceLabel[n.audience]}
                  </span>
                </div>
                {n.description ? (
                  <p className="mt-1 text-sm text-slate-600">{n.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">
                  {n.fileName} · {formatBytes(n.fileSize)} ·{' '}
                  {new Date(n.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={n.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                >
                  <Download className="h-4 w-4" />
                  View
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete "${n.title}"?`)) remove.mutate(n._id);
                  }}
                  className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
