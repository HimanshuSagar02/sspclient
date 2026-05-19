import type { SiteContent } from '@/types';

export const defaultSiteContent = (): SiteContent => ({
  siteName: 'Srishti Study Point',
  tagline: 'Selection means Srishti',
  primaryColor: '#0d9488',
  seoTitle:
    'Top SSC Coaching in Maswasi (Rampur-Swar) Area | Srishti Study Point',
  seoDescription:
    'Dedicated teachers and structured coaching for SSC and government exams. Learn with expert guidance, mock tests, and consistent study support at Srishti Study Point.',
  seoKeywords: [
    'srishti study point maswasi',
    'maswasi coaching',
    'top ssc coaching maswasi',
    'ssc coaching rampur swar',
    'ssc coaching in maswasi',
    'government exam coaching maswasi',
    'ssc institute maswasi',
    'best coaching for ssc maswasi',
    'dedicated teachers coaching',
    'ssc coaching rampur swar area',
  ],
  navLinks: [],

  hero: {
    headline: 'SELECTION मतलब SRISHTI',
    subtext: 'Expert coaching for competitive exams.',
    ctaPrimary: 'Admission Enquiry',
    ctaSecondary: 'View Exams',
    heroImageUrl: '',
  },
  whyChooseTitle: 'Why Choose Srishti Study Point',
  featureCards: [],
  aboutTitle: 'About Us',
  aboutDescription: '',
  aboutHighlights: [],
  examSectionTitle: 'Exams We Prepare For',
  examCategories: [],
  resultsTitle: 'Our Results',
  resultsSubtitle: '',
  resultEntries: [],
  appFeaturesTitle: '',
  appFeatures: [],
  appMockupUrls: [],
  achievementsTitle: 'Our Achievements',
  achievementsSubtitle: 'Milestones we have reached together',
  achievements: [],
  testimonialsTitle: 'Testimonials',
  testimonialsSubtitle: 'What our students say about us',
  testimonials: [],
  contactAddress: '',
  footerText: '© Srishti Study Point',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  telegramUrl: '',
  adBannerEnabled: false,
  adBannerImageUrl: '',
  adBannerLink: '',
  adBannerTitle: '',
  isPublished: true,
});

export const normalizeSiteContent = (raw: Partial<SiteContent> | null | undefined): SiteContent => {
  const base = defaultSiteContent();
  if (!raw) return base;

  return {
    ...base,
    ...raw,
    hero: {
      ...base.hero,
      ...(raw.hero ?? {}),
    },
    navLinks: raw.navLinks ?? base.navLinks,
    featureCards: raw.featureCards ?? base.featureCards,
    examCategories: raw.examCategories ?? base.examCategories,
    aboutHighlights: raw.aboutHighlights ?? base.aboutHighlights,
    resultEntries: raw.resultEntries ?? base.resultEntries,
    appFeatures: raw.appFeatures ?? base.appFeatures,
    achievements: raw.achievements ?? base.achievements,
    testimonials: raw.testimonials ?? base.testimonials,
  };
};
