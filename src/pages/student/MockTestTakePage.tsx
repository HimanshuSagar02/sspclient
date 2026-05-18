import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/utils/apiErrors';

type QuestionOption = { id: string; text: string; textEn?: string; textHi?: string };

type Question = {
  questionId: string;
  question: string;
  questionEn?: string;
  questionHi?: string;
  type: string;
  options?: QuestionOption[];
  marks: number;
};

type StartPayload = {
  attemptId: string;
  durationMinutes: number;
  title: string;
  questions: Question[];
};

type Lang = 'en' | 'hi' | 'both';

const langLabel: Record<Lang, string> = { en: 'English', hi: 'हिंदी', both: 'Both / दोनों' };

const qText = (q: Question, lang: Lang) => {
  const en = q.questionEn ?? q.question;
  const hi = q.questionHi;
  if (lang === 'hi' && hi) return hi;
  if (lang === 'both' && hi) return `${en}\n${hi}`;
  return en;
};

const optText = (o: QuestionOption, lang: Lang) => {
  const en = o.textEn ?? o.text;
  const hi = o.textHi;
  if (lang === 'hi' && hi) return hi;
  if (lang === 'both' && hi) return `${en}  /  ${hi}`;
  return en;
};

export const MockTestTakePage = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('en');
  const [session, setSession] = useState<StartPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const startTest = async () => {
    if (!testId) return;
    setStarting(true);
    try {
      const res = await api.post<ApiResponse<StartPayload>>(`/mock-tests/${testId}/start`, {
        lang: lang === 'both' ? 'en' : lang,
      });
      setSession(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not start test'));
    } finally {
      setStarting(false);
    }
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!session) return;
      const payload = session.questions.map((q) => ({
        questionId: q.questionId,
        answer: answers[q.questionId] ?? '',
        timeSpentSeconds: 60,
      }));
      const res = await api.post<ApiResponse<{ _id: string }>>(
        `/mock-tests/attempts/${session.attemptId}/submit`,
        { answers: payload }
      );
      const body = res.data.data as { _id?: string };
      return body._id ?? session.attemptId;
    },
    onSuccess: (attemptId) => {
      toast.success('Test submitted');
      navigate(`/student/mock-tests/result/${attemptId}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Submit failed')),
  });

  /* ── Language Selector Bar ── */
  const LangBar = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <Languages className="h-4 w-4 text-slate-500" />
      {(['en', 'hi', 'both'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            lang === l
              ? 'bg-brand-600 text-white shadow-sm'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {langLabel[l]}
        </button>
      ))}
    </div>
  );

  /* ── Pre-start Screen ── */
  if (!session) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold text-slate-900">Start Mock Test</h1>
        <p className="mt-2 text-slate-600">
          Choose your preferred language. You can switch languages anytime during the test.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-700 mb-3">भाषा चुनें / Choose Language</p>
          <LangBar />
          <p className="mt-4 text-xs text-slate-400">
            {lang === 'both'
              ? 'Questions will show in both English and Hindi side by side.'
              : lang === 'hi'
                ? 'प्रश्न हिंदी में दिखाए जाएंगे (अगर उपलब्ध हों)'
                : 'Questions will appear in English.'}
          </p>
        </div>
        <Button className="mt-6" onClick={() => void startTest()} disabled={starting}>
          {starting ? 'Loading...' : 'Begin Test / परीक्षा शुरू करें'}
        </Button>
      </div>
    );
  }

  /* ── Test In Progress ── */
  const total = session.questions.length;
  const answered = Object.keys(answers).filter((k) => answers[k]).length;

  return (
    <div>
      {/* Header Bar */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-6 border-b border-slate-200 bg-white px-4 py-3 lg:-mx-8 lg:-mt-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{session.title}</h1>
            <p className="text-xs text-slate-500">
              {answered}/{total} answered · {session.durationMinutes} min
            </p>
          </div>
          <LangBar />
        </div>
        {/* Question navigator pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.questions.map((q, i) => (
            <button
              key={q.questionId}
              type="button"
              onClick={() => setCurrentQ(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                i === currentQ
                  ? 'bg-brand-600 text-white'
                  : answers[q.questionId]
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current Question */}
      {(() => {
        const q = session.questions[currentQ];
        if (!q) return null;
        const questionText = qText(q, lang);
        return (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {questionText.includes('\n') ? (
                  <>
                    <p className="text-base font-semibold text-slate-900">
                      Q{currentQ + 1}. {questionText.split('\n')[0]}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {questionText.split('\n')[1]}
                    </p>
                  </>
                ) : (
                  <p className="text-base font-semibold text-slate-900">
                    Q{currentQ + 1}. {questionText}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {q.marks} marks
              </span>
            </div>

            {q.type === 'mcq' && q.options ? (
              <div className="mt-5 space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.questionId] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
                        selected
                          ? 'border-brand-300 bg-brand-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.questionId}
                        checked={selected}
                        onChange={() => setAnswers({ ...answers, [q.questionId]: opt.id })}
                        className="text-brand-600"
                      />
                      <span className="text-sm">{optText(opt, lang)}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <textarea
                rows={3}
                className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                placeholder={lang === 'hi' ? 'अपना उत्तर यहाँ लिखें...' : 'Type your answer here...'}
                value={answers[q.questionId] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [q.questionId]: e.target.value })}
              />
            )}

            {/* Navigation buttons */}
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                disabled={currentQ === 0}
                onClick={() => setCurrentQ(currentQ - 1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
              >
                ← {lang === 'hi' ? 'पिछला' : 'Previous'}
              </button>
              {currentQ < total - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQ(currentQ + 1)}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  {lang === 'hi' ? 'अगला' : 'Next'} →
                </button>
              ) : (
                <Button
                  onClick={() => {
                    if (
                      answered < total &&
                      !window.confirm(
                        lang === 'hi'
                          ? `आपने ${total - answered} प्रश्न छोड़े हैं। क्या आप जमा करना चाहते हैं?`
                          : `You have ${total - answered} unanswered question(s). Submit anyway?`
                      )
                    )
                      return;
                    submit.mutate();
                  }}
                  disabled={submit.isPending}
                >
                  {submit.isPending
                    ? lang === 'hi' ? 'जमा हो रहा है...' : 'Submitting...'
                    : lang === 'hi' ? 'परीक्षा जमा करें' : 'Submit Test'}
                </Button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

