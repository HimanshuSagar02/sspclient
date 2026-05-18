import { motion } from 'framer-motion';
import { DynamicIcon } from '@/utils/icons';
import type { SiteContent } from '@/types';

export const AchievementsSection = ({ site }: { site: SiteContent }) => {
  const stats = (Array.isArray(site.achievements) ? [...site.achievements] : []).sort(
    (a, b) => a.order - b.order
  );

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {site.achievementsTitle}
          </h2>
          {site.achievementsSubtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">{site.achievementsSubtitle}</p>
          )}
        </div>
        <div className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-3 text-brand-500">
                <DynamicIcon name={stat.icon} className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
