import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse, MockTestRow, PaginatedMeta } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';

const defaultGenerate = {
  title: '',
  subject: 'General Knowledge',
  durationMinutes: '30',
  questionCount: '10',
  topics: 'General Knowledge',
  easy: '30',
  medium: '50',
  hard: '20',
  sourceMaterial: '',
};

export const MockTestsManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [publishedFilter, setPublishedFilter] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState(defaultGenerate);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-mock-tests', page, publishedFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (publishedFilter) params.set('published', publishedFilter);
      const res = await api.get<ApiResponse<MockTestRow[]>>(`/admin/mock-tests?${params}`);
      return { tests: res.data.data, meta: res.data.meta as PaginatedMeta };
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const topics = form.topics.split(',').map((t) => t.trim()).filter(Boolean);
      // Uses Gemini AI to actually create the questions in the question bank and
      // assemble a published mock test that students see immediately.
      await api.post('/mock-tests/generate-ai', {
        title: form.title.trim(),
        subject: form.subject.trim() || 'General Knowledge',
        durationMinutes: Number(form.durationMinutes),
        questionCount: Number(form.questionCount),
        topics,
        difficultyMix: {
          easy: Number(form.easy),
          medium: Number(form.medium),
          hard: Number(form.hard),
        },
        source: 'question_bank',
        sourceMaterial: form.sourceMaterial.trim() || undefined,
        mode: 'gemini',
        saveToQuestionBank: true,
      });
    },
    onSuccess: () => {
      toast.success('Mock test generated and published \u2014 students can start it now');
      setShowGenerate(false);
      setForm(defaultGenerate);
      void queryClient.invalidateQueries({ queryKey: ['admin-mock-tests'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(
        err.response?.data?.message ??
          'Generation failed \u2014 check that GEMINI_API_KEY is set on the server'
      ),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/admin/mock-tests/${id}`, { isPublished }),
    onSuccess: () => {
      toast.success('Test updated');
      void queryClient.invalidateQueries({ queryKey: ['admin-mock-tests'] });
    },
    onError: () => toast.error('Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/mock-tests/${id}`),
    onSuccess: () => {
      toast.success('Test deleted');
      void queryClient.invalidateQueries({ queryKey: ['admin-mock-tests'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  const tests = data?.tests ?? [];
  const meta = data?.meta ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <section>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <article>
          <h1 className="text-2xl font-bold text-slate-900">AI Mock Tests</h1>
          <p className="mt-1 text-slate-600">Generate, publish, and manage mock tests</p>
        </article>
        <Button onClick={() => setShowGenerate(true)} size="sm">
          <Plus className="h-4 w-4" />
          Generate Test
        </Button>
      </header>

      <label className="mt-6 inline-block text-sm">
        <span className="mr-2 font-medium text-slate-700">Filter</span>
        <select
          value={publishedFilter}
          onChange={(e) => {
            setPublishedFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All tests</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </label>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <Skeleton className="m-6 h-48 w-full" />
        ) : (
          <>
            <table className="w-full text-sm overflow-x-auto block md:table">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Questions</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                  <th className="px-6 py-3 font-medium">Source</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No mock tests yet — generate one from the question bank
                    </td>
                  </tr>
                ) : (
                  tests.map((test) => (
                    <tr key={test._id} className="border-t border-slate-100">
                      <td className="px-6 py-3 font-medium">{test.title}</td>
                      <td className="px-6 py-3">{test.questions?.length ?? 0}</td>
                      <td className="px-6 py-3">{test.durationMinutes} min</td>
                      <td className="px-6 py-3">
                        {test.aiGenerated ? (
                          <span className="inline-flex items-center gap-1 text-violet-600">
                            <Sparkles className="h-3.5 w-3.5" />
                            {test.aiProvider ?? 'AI'}
                          </span>
                        ) : (
                          <span className="text-slate-500">Bank</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={test.isPublished ? 'published' : 'draft'} />
                      </td>
                      <td className="px-6 py-3">
                        <span className="flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              togglePublish.mutate({
                                id: test._id,
                                isPublished: !test.isPublished,
                              })
                            }
                            className="text-brand-600 hover:underline"
                          >
                            {test.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this test permanently?')) {
                                deleteMutation.mutate(test._id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages ?? Math.ceil(meta.total / meta.limit)}
              total={meta.total}
              onPageChange={setPage}
            />
          </>
        )}
      </article>

      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Mock Test" wide>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateMutation.mutate();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-500">
            Questions are generated using Google Gemini AI, saved to the question bank, and the
            mock test is published instantly so students can start it from their dashboard.
          </p>
          <label className="block text-sm">
            <span className="font-medium">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. UP Police Mock Test #1"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Subject</span>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. General Knowledge, Reasoning, Hindi, Maths"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Topics (comma-separated)</span>
            <input
              required
              value={form.topics}
              onChange={(e) => setForm({ ...form, topics: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="e.g. Indian History, Geography, Current Affairs"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Source material (optional)</span>
            <textarea
              rows={3}
              value={form.sourceMaterial}
              onChange={(e) => setForm({ ...form, sourceMaterial: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Paste PYQs, notes, or syllabus text here for context-aware questions (optional)"
            />
          </label>
          <span className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium">Duration (min)</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="font-medium">Question count</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.questionCount}
                onChange={(e) => setForm({ ...form, questionCount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </span>
          <span className="grid gap-4 sm:grid-cols-3">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <label key={level} className="text-sm capitalize">
                <span className="font-medium">{level} %</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form[level]}
                  onChange={(e) => setForm({ ...form, [level]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            ))}
          </span>
          <footer className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Generate
            </button>
          </footer>
        </form>
      </Modal>
    </section>
  );
};
