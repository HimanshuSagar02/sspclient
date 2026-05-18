import { motion } from 'framer-motion';
import { GraduationCap, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SiteContent } from '@/types';

interface HeroSectionProps {
  site: SiteContent;
}

export const HeroSection = ({ site }: HeroSectionProps) => {
  const { hero } = site;

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white"
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-brand-100">
            {site.tagline}
          </p>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg">
            {hero.subtext}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#contact">
              <Button variant="white" size="lg">
                <PhoneCall className="h-5 w-5" />
                {hero.ctaPrimary}
              </Button>
            </a>
            <a href="#exams">
              <Button variant="outline" size="lg">
                <GraduationCap className="h-5 w-5" />
                {hero.ctaSecondary}
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex justify-center lg:justify-end"
        >
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-4 rounded-3xl bg-white/10 blur-2xl" />
            <div className="relative rounded-2xl bg-white p-8 shadow-2xl">
              {hero.heroImageUrl ? (
                <img
                  src={hero.heroImageUrl}
                  alt={site.siteName}
                  className="w-full rounded-xl object-cover"
                  loading="eager"
                />
              ) : (
                <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 p-8 text-center">
                  {site.logoUrl ? (
                    <img 
                      src={site.logoUrl} 
                      alt="Logo" 
                      className="mb-4 h-24 w-24 rounded-2xl bg-white object-contain p-2 shadow-lg" 
                    />
                  ) : (
                    <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-600 text-4xl font-bold text-white shadow-lg">
                      S
                    </div>
                  )}
                  <p className="text-xl font-bold text-brand-800">{site.siteName}</p>
                  <p className="mt-3 text-sm text-brand-700">
                    UP Police • UP SI • SSC • State Exams
                  </p>
                  <ul className="mt-6 w-full space-y-2 text-left text-sm text-slate-700">
                    <li className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-brand-500" />
                      Live Classes & Mock Tests
                    </li>
                    <li className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-brand-500" />
                      Library & Study Material
                    </li>
                    <li className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2">
                      <span className="h-2 w-2 rounded-full bg-brand-500" />
                      Proven Selection Record
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};
