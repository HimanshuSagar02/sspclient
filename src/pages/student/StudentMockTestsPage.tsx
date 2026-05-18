import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Award, Languages, BarChart3 } from 'lucide-react';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

interface MockTestListItem {
  _id: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  language?: string;
  questions?: unknown[];
}

const langBadge: Record<string, { label: string; cls: string }> = {
  english: { label: 'English', cls: 'bg-blue-100 text-blue-700' },
  hindi: { label: 'हिंदी', cls: 'bg-orange-100 text-orange-700' },
  bilingual: { label: 'EN / हिंदी', cls: 'bg-purple-100 text-purple-700' },
};

export const StudentMockTestsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['student-mock-tests'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MockTestListItem[]>>('/mock-tests/?limit=20');
      return res.data.data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<unknown[]>>('/mock-tests/attempts/mine');
      return res.data.data as {
        _id: string;
        status: string;
        obtainedMarks?: number;
        totalMarks?: number;
        accuracy?: number;
        mockTestId?: { title?: string; language?: string };
      }[];
    },
  });

  const evaluated = (attempts ?? []).filter((a) => a.status === 'evaluated');

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Mock Tests / मॉक टेस्ट</h1>
      <p className="mt-1 text-slate-600">
        Practice in Hindi or English — switch language anytime during the test and in analysis.
      </p>

      {/* ── Available Tests ── */}
      <h2 className="mt-8 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Languages className="h-5 w-5 text-brand-600" />
        Available Tests / उपलब्ध परीक्षाएँ
      </h2>
      {isLoading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((test) => {
            const badge = langBadge[test.language ?? 'bilingual'] ?? langBadge.bilingual;
            return (
              <article
                key={test._id}
                className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{test.title}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {test.durationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {test.totalMarks} marks
                  </span>
                </div>
                <Link to={`/student/mock-tests/${test._id}/take`} className="mt-4 inline-block">
                  <Button size="sm">Start Test / परीक्षा शुरू करें</Button>
                </Link>
              </article>
            );
          })}
          {!data?.length && (
            <p className="col-span-full text-sm text-slate-500">
              No published tests yet. / अभी कोई प्रकाशित परीक्षा नहीं है।
            </p>
          )}
        </div>
      )}

      {/* ── Past Attempts ── */}
      <h2 className="mt-10 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <BarChart3 className="h-5 w-5 text-brand-600" />
        Past Attempts / पिछले प्रयास
      </h2>
      {evaluated.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No attempts yet. Start a test above! / अभी तक कोई प्रयास नहीं। ऊपर से परीक्षा शुरू करें!
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {evaluated.map((a) => {
            const badge = langBadge[a.mockTestId?.language ?? 'bilingual'] ?? langBadge.bilingual;
            return (
              <li
                key={a._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-brand-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900">
                    {a.mockTestId?.title ?? 'Mock test'}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">
                    <strong>{a.obtainedMarks ?? 0}</strong>
                    {a.totalMarks ? `/${a.totalMarks}` : ''} marks
                    {a.accuracy !== undefined && (
                      <span className="ml-2 text-xs text-slate-400">({a.accuracy}%)</span>
                    )}
                  </span>
                  <Link
                    to={`/student/mock-tests/result/${a._id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    View Analysis / विश्लेषण देखें
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

