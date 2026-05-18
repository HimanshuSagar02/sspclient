import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { SiteContent } from '@/types';

export const AppFeaturesSection = ({ site }: { site: SiteContent }) => {
  const features = (Array.isArray(site.appFeatures) ? [...site.appFeatures] : []).sort(
    (a, b) => a.order - b.order
  );

  return (
    <section id="app" className="bg-brand-600 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          {site.appFeaturesTitle}
        </h2>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex justify-center gap-4 overflow-x-auto pb-4 lg:justify-start">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="w-36 shrink-0 rounded-3xl border-4 border-slate-800 bg-slate-900 p-2 shadow-2xl sm:w-44"
              >
                <div className="aspect-[9/16] rounded-2xl bg-gradient-to-b from-brand-400/40 to-brand-800/60 p-3">
                  <div className="h-2 w-12 rounded bg-white/30" />
                  <div className="mt-4 space-y-2">
                    <div className="h-2 rounded bg-white/20" />
                    <div className="h-2 w-3/4 rounded bg-white/20" />
                    <div className="h-8 rounded bg-brand-400/50" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <ul className="space-y-4">
            {features.map((f, i) => (
              <motion.li
                key={f.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 text-white"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" />
                <span className="text-base sm:text-lg">{f.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
