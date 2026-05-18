import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { SiteContent } from '@/types';

export const TestimonialsSection = ({ site }: { site: SiteContent }) => {
  const items = (Array.isArray(site.testimonials) ? [...site.testimonials] : []).sort(
    (a, b) => a.order - b.order
  );
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === items.length - 1 ? 0 : i + 1));

  if (items.length === 0) return null;

  const current = items[index];

  return (
    <section id="mock-tests" className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {site.testimonialsTitle}
          </h2>
          {site.testimonialsSubtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">{site.testimonialsSubtitle}</p>
          )}
        </div>

        <div className="relative mt-12">
          <button
            onClick={prev}
            className="absolute -left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 sm:-left-12"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl bg-white p-8 shadow-md sm:p-10"
            >
              <Quote className="h-8 w-8 text-brand-200" />
              <p className="mt-4 text-base leading-relaxed text-slate-700 sm:text-lg">
                &ldquo;{current.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                  {current.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{current.name}</p>
                  <p className="text-sm text-brand-600">{current.achievement}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={next}
            className="absolute -right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700 sm:-right-12"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-brand-600' : 'w-2 bg-slate-300'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
