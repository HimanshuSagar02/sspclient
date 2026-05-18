import { useQuery } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface NoteRow {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  audience: 'all' | 'coaching' | 'library';
  createdAt: string;
}

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

export const StudentNotesPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['student-notes'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<NoteRow[]>>('/notes');
      return res.data.data;
    },
  });

  const notes = data ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Notes & Study Material</h1>
      <p className="mt-1 text-slate-600">
        Download study material shared by your institute.
      </p>

      {isLoading ? (
        <Skeleton className="mt-6 h-48 w-full" />
      ) : notes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No notes shared yet. Check back soon.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {notes.map((n) => (
            <li
              key={n._id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 shrink-0 text-brand-600" />
                  <p className="truncate font-medium text-slate-900">{n.title}</p>
                </div>
                {n.description ? (
                  <p className="mt-1 text-sm text-slate-600">{n.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">
                  {n.fileName} · {formatBytes(n.fileSize)} ·{' '}
                  {new Date(n.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <a
                href={n.fileUrl}
                target="_blank"
                rel="noreferrer"
                download={n.fileName}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
