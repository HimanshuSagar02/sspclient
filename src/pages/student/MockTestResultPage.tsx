import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Languages,
  CheckCircle2,
  XCircle,
  Target,
  Trophy,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import api from '@/services/api';
import type { ApiResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

type SolutionOption = { id: string; text: string; textEn?: string; textHi?: string };

type Solution = {
  index: number;
  questionId: string;
  question: string;
  questionHi?: string;
  options?: SolutionOption[];
  topic: string;
  studentAnswer?: string | string[];
  isCorrect: boolean;
  marksObtained: number;
  correctAnswer?: string | string[];
  explanation?: string;
  explanationHi?: string;
};

type ResultData = {
  summary: {
    obtainedMarks: number;
    totalMarks: number;
    accuracy: number;
    rank?: number;
    totalAttempts: number;
    weakTopics: string[];
    strongTopics: string[];
  };
  topicBreakdown: { topic: string; correct: boolean; marksObtained: number; maxMarks: number }[];
  solutions: Solution[];
  mockTest: { title: string; language?: string };
};

type Lang = 'en' | 'hi' | 'both';

const langLabel: Record<Lang, string> = { en: 'English', hi: 'हिंदी', both: 'Both / दोनों' };

const qText = (q: Solution, lang: Lang) => {
  const en = q.question;
  const hi = q.questionHi;
  if (lang === 'hi' && hi) return { primary: hi, secondary: undefined };
  if (lang === 'both' && hi) return { primary: en, secondary: hi };
  return { primary: en, secondary: undefined };
};

const optLabel = (o: SolutionOption, lang: Lang) => {
  const en = o.textEn ?? o.text;
  const hi = o.textHi;
  if (lang === 'hi' && hi) return hi;
  if (lang === 'both' && hi) return `${en}  /  ${hi}`;
  return en;
};

const explText = (s: Solution, lang: Lang) => {
  const en = s.explanation;
  const hi = s.explanationHi;
  if (lang === 'hi' && hi) return hi;
  if (lang === 'both' && hi && en) return `${en}\n\n${hi}`;
  return en ?? hi;
};

const answerLabel = (answer: string | string[] | undefined, options?: SolutionOption[], lang?: Lang) => {
  if (!answer) return '—';
  const str = Array.isArray(answer) ? answer.join(', ') : answer;
  if (!options?.length) return str;
  const opt = options.find((o) => o.id === str);
  if (!opt) return str;
  return lang ? `${str}) ${optLabel(opt, lang)}` : `${str}) ${opt.text}`;
};

/* ── Topic Chart ── */
const TopicChart = ({ items }: { items: ResultData['topicBreakdown'] }) => {
  const max = Math.max(...items.map((i) => i.maxMarks), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.round((item.marksObtained / item.maxMarks) * 100);
        return (
          <div key={item.topic}>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">{item.topic}</span>
              <span className="text-slate-500">
                {item.marksObtained}/{item.maxMarks} ({pct}%)
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${(item.marksObtained / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const MockTestResultPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [lang, setLang] = useState<Lang>('both');
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['attempt-result', attemptId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ResultData>>(
        `/mock-tests/attempts/${attemptId}/result`
      );
      return res.data.data;
    },
    enabled: Boolean(attemptId),
  });

  if (isLoading || !data) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const { summary, topicBreakdown, solutions, mockTest } = data;
  const correctCount = solutions.filter((s) => s.isCorrect).length;
  const wrongCount = solutions.filter((s) => !s.isCorrect && s.studentAnswer).length;
  const skippedCount = solutions.filter((s) => !s.isCorrect && !s.studentAnswer).length;

  const filtered = solutions.filter((s) => {
    if (filter === 'correct') return s.isCorrect;
    if (filter === 'wrong') return !s.isCorrect;
    return true;
  });

  /* ── Language Bar ── */
  const LangBar = () => (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-slate-400" />
      {(['en', 'hi', 'both'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
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

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/student/mock-tests" className="text-sm text-brand-600 hover:underline">
          ← {lang === 'hi' ? 'वापस जाएँ' : 'Back to tests'}
        </Link>
        <LangBar />
      </div>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        {mockTest.title} — {lang === 'hi' ? 'विश्लेषण' : 'Analysis'}
      </h1>

      {/* ── Score Cards ── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-center text-white shadow-sm">
          <p className="text-3xl font-bold">
            {summary.obtainedMarks}<span className="text-lg font-normal opacity-70">/{summary.totalMarks}</span>
          </p>
          <p className="text-xs opacity-80">{lang === 'hi' ? 'अंक' : 'Score'}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <Target className="h-5 w-5 text-blue-500" />
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.accuracy}%</p>
          <p className="text-xs text-slate-500">{lang === 'hi' ? 'सटीकता' : 'Accuracy'}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <Trophy className="h-5 w-5 text-amber-500" />
          <p className="mt-1 text-2xl font-bold text-slate-900">#{summary.rank ?? '—'}</p>
          <p className="text-xs text-slate-500">{lang === 'hi' ? `रैंक / ${summary.totalAttempts}` : `Rank / ${summary.totalAttempts}`}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="mt-1 text-2xl font-bold text-emerald-700">{correctCount}</p>
          <p className="text-xs text-emerald-600">{lang === 'hi' ? 'सही' : 'Correct'}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm">
          <XCircle className="h-5 w-5 text-red-500" />
          <p className="mt-1 text-2xl font-bold text-red-700">{wrongCount}</p>
          <p className="text-xs text-red-500">
            {lang === 'hi' ? 'गलत' : 'Wrong'}
            {skippedCount > 0 && ` + ${skippedCount} ${lang === 'hi' ? 'छोड़े' : 'skipped'}`}
          </p>
        </div>
      </div>

      {/* ── Strong / Weak Topics ── */}
      {(summary.strongTopics.length > 0 || summary.weakTopics.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {summary.strongTopics.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <TrendingUp className="h-4 w-4" />
                {lang === 'hi' ? 'मजबूत विषय' : 'Strong Topics'}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {summary.strongTopics.map((t) => (
                  <span key={t} className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {summary.weakTopics.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-red-800">
                <AlertTriangle className="h-4 w-4" />
                {lang === 'hi' ? 'कमजोर विषय' : 'Weak Topics'}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {summary.weakTopics.map((t) => (
                  <span key={t} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Topic Breakdown ── */}
      <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">
          {lang === 'hi' ? 'विषय-वार प्रदर्शन' : 'Topic-wise Performance'}
        </h2>
        <div className="mt-4">
          <TopicChart items={topicBreakdown} />
        </div>
      </section>

      {/* ── Solutions ── */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {lang === 'hi' ? 'हल / Solutions' : 'Solutions'}
          </h2>
          <div className="flex items-center gap-2">
            {(['all', 'correct', 'wrong'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === f
                    ? f === 'correct'
                      ? 'bg-emerald-600 text-white'
                      : f === 'wrong'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f === 'all'
                  ? lang === 'hi' ? 'सभी' : 'All'
                  : f === 'correct'
                    ? lang === 'hi' ? `सही (${correctCount})` : `Correct (${correctCount})`
                    : lang === 'hi' ? `गलत (${wrongCount + skippedCount})` : `Wrong (${wrongCount + skippedCount})`}
              </button>
            ))}
          </div>
        </div>

        <ol className="mt-4 space-y-5">
          {filtered.map((s) => {
            const { primary, secondary } = qText(s, lang);
            const explanation = explText(s, lang);
            return (
              <li
                key={s.index}
                className={`rounded-2xl border p-5 ${
                  s.isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'
                }`}
              >
                {/* Question */}
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {s.index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{primary}</p>
                    {secondary && <p className="mt-1 text-sm text-slate-600">{secondary}</p>}
                    <span className="mt-1 inline-block rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">{s.topic}</span>
                  </div>
                  <span className={`shrink-0 text-sm font-bold ${s.isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                    {s.marksObtained > 0 ? `+${s.marksObtained}` : s.marksObtained}
                  </span>
                </div>

                {/* Options (if MCQ) */}
                {s.options && s.options.length > 0 && (
                  <div className="mt-3 ml-10 space-y-1.5">
                    {s.options.map((opt) => {
                      const isStudentChoice = String(s.studentAnswer) === opt.id;
                      const isCorrectOpt = String(s.correctAnswer) === opt.id;
                      let cls = 'border-slate-200 bg-white';
                      if (isCorrectOpt) cls = 'border-emerald-300 bg-emerald-50';
                      else if (isStudentChoice && !s.isCorrect) cls = 'border-red-300 bg-red-50';
                      return (
                        <div key={opt.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${cls}`}>
                          <span className="font-mono text-xs text-slate-400">{opt.id})</span>
                          <span className="flex-1">{optLabel(opt, lang)}</span>
                          {isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          {isStudentChoice && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-500" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Non-MCQ answers */}
                {(!s.options || s.options.length === 0) && (
                  <div className="mt-3 ml-10 space-y-1 text-sm">
                    <p>
                      <span className="text-slate-500">{lang === 'hi' ? 'आपका उत्तर:' : 'Your answer:'}</span>{' '}
                      <strong>{answerLabel(s.studentAnswer)}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500">{lang === 'hi' ? 'सही उत्तर:' : 'Correct:'}</span>{' '}
                      <strong className="text-emerald-700">{answerLabel(s.correctAnswer)}</strong>
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {explanation && (
                  <div className="mt-3 ml-10 rounded-xl bg-white/80 p-3 text-sm text-slate-700 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      {lang === 'hi' ? 'व्याख्या' : 'Explanation'}
                    </p>
                    {explanation.split('\n\n').map((para, pi) => (
                      <p key={pi} className={pi > 0 ? 'mt-2 text-slate-600' : ''}>
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">
              {lang === 'hi' ? 'इस फ़िल्टर में कोई प्रश्न नहीं' : 'No questions match this filter'}
            </p>
          )}
        </ol>
      </section>
    </div>
  );
};
