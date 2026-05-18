import { motion } from 'framer-motion';
import { DynamicIcon } from '@/utils/icons';
import type { SiteContent } from '@/types';

export const WhyChooseSection = ({ site }: { site: SiteContent }) => {
  const cards = (Array.isArray(site.featureCards) ? [...site.featureCards] : []).sort(
    (a, b) => a.order - b.order
  );

  return (
    <section id="courses" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            {site.whyChooseTitle}
          </h2>
          {site.whyChooseSubtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">{site.whyChooseSubtitle}</p>
          )}
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <DynamicIcon name={card.icon} className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
