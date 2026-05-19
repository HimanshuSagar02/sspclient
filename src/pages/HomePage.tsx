import { useState, type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { ApiResponse, SiteContent } from '@/types';
import { normalizeSiteContent, defaultSiteContent } from '@/utils/siteContentDefaults';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { WhyChooseSection } from '@/components/landing/WhyChooseSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ExamGridSection } from '@/components/landing/ExamGridSection';
import { ResultsSection } from '@/components/landing/ResultsSection';
import { AchievementsSection } from '@/components/landing/AchievementsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { AdBanner } from '@/components/landing/AdBanner';
import { Skeleton } from '@/components/ui/Skeleton';

const brandStyleFromColor = (color?: string): React.CSSProperties => {
  if (!color) return {};
  // Use CSS color-mix to derive a palette from a single primary color.
  // This overrides the --color-brand-* variables defined in index.css for this subtree.
  const mix = (pct: number, with_: 'white' | 'black') =>
    `color-mix(in srgb, ${color} ${pct}%, ${with_})`;
  return {
    ['--color-brand-50' as never]: mix(10, 'white'),
    ['--color-brand-100' as never]: mix(20, 'white'),
    ['--color-brand-200' as never]: mix(35, 'white'),
    ['--color-brand-300' as never]: mix(55, 'white'),
    ['--color-brand-400' as never]: mix(75, 'white'),
    ['--color-brand-500' as never]: mix(90, 'white'),
    ['--color-brand-600' as never]: color,
    ['--color-brand-700' as never]: mix(15, 'black'),
    ['--color-brand-800' as never]: mix(30, 'black'),
    ['--color-brand-900' as never]: mix(45, 'black'),
  } as CSSProperties;
};

export const HomePage = () => {
  const [enquiryExam, setEnquiryExam] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['site-public'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SiteContent>>('/site/public');
      return normalizeSiteContent(res.data.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mx-auto mt-8 h-96 max-w-7xl rounded-2xl" />
      </div>
    );
  }

  // If the query somehow returned no data (e.g. server 500), fall back to defaults
  // so the public site never blank-screens.
  const site = data ?? defaultSiteContent();

  // SEO meta tags intentionally NOT injected on the frontend.
  // (Prevents site SEO keywords from being displayed/used by the frontend.)


  return (
    <div className="min-h-screen" style={brandStyleFromColor(site.primaryColor)}>

      <AdBanner site={site} />
      <Navbar site={site} />
      <main>
        <HeroSection site={site} />
        <WhyChooseSection site={site} />
        <AboutSection site={site} />
        <ExamGridSection site={site} onEnquire={setEnquiryExam} />
        <ResultsSection site={site} />
        <AchievementsSection site={site} />
        <TestimonialsSection site={site} />
        <ContactSection site={site} preselectedExam={enquiryExam} />
      </main>
      <Footer site={site} />
    </div>
  );
};
