import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { SiteContent } from '@/types';

export const ResultsSection = ({ site }: { site: SiteContent }) => {
  const results = [...(site.resultEntries ?? [])].sort((a, b) => a.order - b.order);

  return (
    <section id="results" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Trophy className="mx-auto h-10 w-10 text-brand-600" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
            {site.resultsTitle ?? 'Our Results'}
          </h2>
          <p className="mt-2 text-slate-600">{site.resultsSubtitle}</p>
        </div>

        {site.resultsImageUrl ? (
          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <img
              src={site.resultsImageUrl}
              alt={site.resultsTitle ?? 'Our results'}
              className="w-full max-h-80 object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center"
            >
              {row.photoUrl ? (
                <img
                  src={row.photoUrl}
                  alt={row.studentName}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-brand-50"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-3xl font-bold text-brand-600 ring-4 ring-brand-50/50">
                  {row.studentName.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="mt-4 text-lg font-bold text-slate-900">{row.studentName}</h3>
              <p className="mt-1 text-sm font-medium text-brand-600">{row.exam}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  {row.rank}
                </span>
                <span className="text-sm text-slate-500">{row.year}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
