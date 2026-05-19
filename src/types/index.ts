export type Role = 'admin' | 'teacher' | 'coaching_student' | 'library_student';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface NavLink {
  label: string;
  href: string;
  order: number;
  isVisible: boolean;
}

export interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface ExamCategory {
  id: string;
  name: string;
  icon: string;
  slug: string;
  description?: string;
  batches?: string;
  order: number;
}

export interface AboutHighlight {
  id: string;
  title: string;
  text: string;
  order: number;
}

export interface ResultEntry {
  id: string;
  studentName: string;
  exam: string;
  rank: string;
  year: string;
  photoUrl?: string;
  order: number;
}

export interface AchievementStat {
  id: string;
  value: string;
  label: string;
  icon: string;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  achievement: string;
  quote: string;
  avatarUrl?: string;
  order: number;
}

export interface SiteContent {
  _id?: string;
  siteName: string;
  tagline: string;
  primaryColor: string;
  logoUrl?: string;

  /** SEO (public landing page) */
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];


  navLinks: NavLink[];
  hero: {
    headline: string;
    headlineHindi?: string;
    subtext: string;
    ctaPrimary: string;
    ctaSecondary: string;
    heroImageUrl?: string;
    videoUrl?: string;
  };
  whyChooseTitle: string;
  whyChooseSubtitle?: string;
  featureCards: FeatureCard[];
  aboutTitle?: string;
  aboutDescription?: string;
  aboutHighlights?: AboutHighlight[];
  examSectionTitle: string;
  examSectionSubtitle?: string;
  examCategories: ExamCategory[];
  resultsTitle?: string;
  resultsSubtitle?: string;
  resultsImageUrl?: string;
  resultEntries?: ResultEntry[];
  contactTitle?: string;
  contactSubtitle?: string;
  appFeaturesTitle: string;
  appFeatures: { id: string; text: string; order: number }[];
  appMockupUrls: string[];
  achievementsTitle: string;
  achievementsSubtitle?: string;
  achievements: AchievementStat[];
  testimonialsTitle: string;
  testimonialsSubtitle?: string;
  testimonials: Testimonial[];
  footerText: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  adBannerEnabled?: boolean;
  adBannerImageUrl?: string;
  adBannerLink?: string;
  adBannerTitle?: string;
  isPublished: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  fullName?: string;
}

export interface DashboardStats {
  totalUsers: number;
  coachingStudents: number;
  libraryStudents: number;
  teachers: number;
  totalMockAttempts: number;
  // Backward compatible
  libraryCheckedIn: number;
  // New vacant/occupied fields
  libraryOccupied: number;
  libraryVacant: number;
  recentAuditLogs: unknown[];
}


export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  profile?: { fullName: string; phone?: string };
}

export interface CoachingStudentRow {
  _id: string;
  enrollmentId: string;
  guardianName?: string;
  guardianPhone?: string;
  joinedAt: string;
  user?: { email?: string; isActive?: boolean };
  profile?: { fullName: string; phone?: string };
}

export interface LibraryStudentRow {
  _id: string;
  libraryId: string;
  seatNumber?: string;
  registeredAt?: string;
  monthlyFeeAmount?: number;
  nextFeeDueAt?: string;
  feeStatus: 'paid' | 'due' | 'partial';
  feeDueAmount: number;
  isCheckedIn: boolean;
  checkInAt?: string;
  user?: { email?: string; isActive?: boolean };
  profile?: { fullName: string; phone?: string };
}

export interface MockTestRow {
  _id: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  aiGenerated: boolean;
  aiProvider?: string;
  questions: { length?: number }[];
  createdAt: string;
}

export interface AuditLogRow {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actorId?: { email?: string; role?: string };
}
