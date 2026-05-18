import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DynamicIcon } from '@/utils/icons';
import { Button } from '@/components/ui/Button';
import type { ExamCategory, SiteContent } from '@/types';

interface ExamGridSectionProps {
  site: SiteContent;
  onEnquire?: (examName: string) => void;
}

export const ExamGridSection = ({ site, onEnquire }: ExamGridSectionProps) => {
  const exams = (Array.isArray(site.examCategories) ? [...site.examCategories] : []).sort(
    (a, b) => a.order - b.order
  );
  const [selected, setSelected] = useState<ExamCategory | null>(null);

  const handleEnquire = (examName: string) => {
    setSelected(null);
    onEnquire?.(examName);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="exams" className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-12">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            {site.examSectionTitle}
          </h2>
          {site.examSectionSubtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              {site.examSectionSubtitle}
            </p>
          )}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {exams.map((exam, i) => (
              <motion.button
                key={exam.id}
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(exam)}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-200 bg-brand-50 text-brand-600 transition group-hover:border-brand-500 sm:h-16 sm:w-16">
                  <DynamicIcon name={exam.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <span className="text-xs font-semibold text-slate-800 sm:text-sm">{exam.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setSelected(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <DynamicIcon name={selected.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{selected.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {selected.description ?? `${selected.name} ki complete preparation available hai.`}
              </p>
              {selected.batches && (
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-slate-800">Batches: </span>
                  <span className="text-brand-700">{selected.batches}</span>
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => handleEnquire(selected.name)}>Admission Enquiry</Button>
                {site.whatsappNumber && (
                  <a
                    href={`https://wa.me/${site.whatsappNumber}?text=Hi, I want to join ${selected.name} batch`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="ghost">WhatsApp</Button>
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};
