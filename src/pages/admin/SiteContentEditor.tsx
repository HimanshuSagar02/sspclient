import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';
import type {
  ApiResponse,
  ResultEntry,
  SiteContent,
  FeatureCard,
  ExamCategory,
  AboutHighlight,
  AchievementStat,
  Testimonial,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { normalizeSiteContent, defaultSiteContent } from '@/utils/siteContentDefaults';
import { getApiErrorMessage } from '@/utils/apiErrors';

const DRAFT_KEY = 'srishti-site-cms-draft-v1';

const readDraft = (): SiteContent | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return normalizeSiteContent(JSON.parse(raw));
  } catch {
    return null;
  }
};

const writeDraft = (form: SiteContent) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch {
    /* quota or private mode \u2014 ignore */
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
};

const newResultEntry = (order: number): ResultEntry => ({
  id: crypto.randomUUID(),
  studentName: '',
  exam: '',
  rank: '',
  year: new Date().getFullYear().toString(),
  photoUrl: '',
  order,
});

export const SiteContentEditor = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['site-admin'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SiteContent>>('/site/admin');
      return normalizeSiteContent(res.data.data);
    },
    retry: 1,
  });

  const [form, setForm] = useState<SiteContent | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const draftPromptShown = useRef(false);

  // On first server load: if a local draft exists from a previous failed/interrupted save,
  // prefer it (user's unsaved work) and let them discard if needed.
  useEffect(() => {
    if (!data || form) return;
    const draft = readDraft();
    if (draft) {
      setForm(draft);
      setHasDraft(true);
      if (!draftPromptShown.current) {
        draftPromptShown.current = true;
        toast(
          'Restored your unsaved Website CMS changes from this browser. Use "Discard draft" to revert.',
          { duration: 6000, icon: '\uD83D\uDCBE' }
        );
      }
    } else {
      setForm(data);
    }
  }, [data, form]);

  // If the server is unreachable at all, fall back to a sensible default
  // OR the draft (if one was saved earlier).
  useEffect(() => {
    if (isError && !form) {
      const draft = readDraft();
      if (draft) {
        setForm(draft);
        setHasDraft(true);
        toast('Server unreachable \u2014 loaded your local draft.', { icon: '\u26A0\uFE0F' });
      } else {
        setForm(defaultSiteContent());
      }
    }
  }, [isError, form]);

  // Persist every change so a crash/refresh never loses work.
  useEffect(() => {
    if (form) {
      writeDraft(form);
      setHasDraft(true);
    }
  }, [form]);

  const discardDraft = () => {
    clearDraft();
    setHasDraft(false);
    if (data) setForm(data);
    toast.success('Draft discarded \u2014 reverted to last saved version');
  };

  const save = useMutation({
    mutationFn: async (payload: Partial<SiteContent>) => {
      const res = await api.patch<ApiResponse<SiteContent>>('/site/admin', payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success('Website updated successfully');
      clearDraft();
      setHasDraft(false);
      void queryClient.invalidateQueries({ queryKey: ['site-public'] });
      void queryClient.invalidateQueries({ queryKey: ['site-admin'] });
    },
    onError: (err) =>
      toast.error(
        `${getApiErrorMessage(err, 'Failed to save')} \u2014 your edits are kept locally and will retry on next save.`
      ),
  });

  const buildSavePayload = (f: SiteContent): Partial<SiteContent> => {
    const heroIn = f.hero ?? defaultSiteContent().hero;
    return {
      siteName: f.siteName,
      tagline: f.tagline,
      primaryColor: f.primaryColor,
      logoUrl: f.logoUrl || undefined,
      navLinks: (f.navLinks ?? []).map((l) => ({
        label: l.label ?? '',
        href: l.href ?? '',
        order: Number(l.order) || 0,
        isVisible: Boolean(l.isVisible),
      })),
      hero: {
        headline: heroIn.headline ?? '',
        headlineHindi: heroIn.headlineHindi,
        subtext: heroIn.subtext ?? '',
        ctaPrimary: heroIn.ctaPrimary ?? '',
        ctaSecondary: heroIn.ctaSecondary ?? '',
        heroImageUrl: heroIn.heroImageUrl || undefined,
        videoUrl: heroIn.videoUrl || undefined,
      },
      whyChooseTitle: f.whyChooseTitle,
      whyChooseSubtitle: f.whyChooseSubtitle,
      featureCards: (f.featureCards ?? []).map((c) => ({
        id: c.id,
        icon: c.icon ?? '',
        title: c.title ?? '',
        description: c.description ?? '',
        order: Number(c.order) || 0,
      })),
      aboutTitle: f.aboutTitle,
      aboutDescription: f.aboutDescription,
      aboutHighlights: (f.aboutHighlights ?? []).map((h) => ({
        id: h.id,
        title: h.title ?? '',
        text: h.text ?? '',
        order: Number(h.order) || 0,
      })),
      examSectionTitle: f.examSectionTitle,
      examSectionSubtitle: f.examSectionSubtitle,
      examCategories: (f.examCategories ?? []).map((e) => ({
        id: e.id,
        name: e.name ?? '',
        icon: e.icon ?? '',
        slug: e.slug ?? '',
        description: e.description,
        batches: e.batches,
        order: Number(e.order) || 0,
      })),
      resultsTitle: f.resultsTitle,
      resultsSubtitle: f.resultsSubtitle,
      resultsImageUrl: f.resultsImageUrl || undefined,
      resultEntries: (f.resultEntries ?? []).map((r) => ({
        id: r.id,
        studentName: r.studentName ?? '',
        exam: r.exam ?? '',
        rank: r.rank ?? '',
        year: r.year ?? '',
        photoUrl: r.photoUrl || undefined,
        order: Number(r.order) || 0,
      })),
      achievementsTitle: f.achievementsTitle,
      achievementsSubtitle: f.achievementsSubtitle,
      achievements: (f.achievements ?? []).map((a) => ({
        id: a.id,
        value: a.value ?? '',
        label: a.label ?? '',
        icon: a.icon ?? '',
        order: Number(a.order) || 0,
      })),
      testimonialsTitle: f.testimonialsTitle,
      testimonialsSubtitle: f.testimonialsSubtitle,
      testimonials: (f.testimonials ?? []).map((t) => ({
        id: t.id,
        name: t.name ?? '',
        achievement: t.achievement ?? '',
        quote: t.quote ?? '',
        avatarUrl: t.avatarUrl || undefined,
        order: Number(t.order) || 0,
      })),
      appFeaturesTitle: f.appFeaturesTitle,
      appFeatures: (f.appFeatures ?? []).map((af) => ({
        id: af.id,
        text: af.text ?? '',
        order: Number(af.order) || 0,
      })),
      contactTitle: f.contactTitle,
      contactSubtitle: f.contactSubtitle,
      contactPhone: f.contactPhone,
      contactEmail: f.contactEmail,
      contactAddress: f.contactAddress,
      whatsappNumber: f.whatsappNumber,
      facebookUrl: f.facebookUrl,
      instagramUrl: f.instagramUrl,
      youtubeUrl: f.youtubeUrl,
      telegramUrl: f.telegramUrl,
      footerText: f.footerText,
      adBannerEnabled: f.adBannerEnabled,
      adBannerImageUrl: f.adBannerImageUrl,
      adBannerLink: f.adBannerLink,
      adBannerTitle: f.adBannerTitle,
      isPublished: f.isPublished,
    };
  };

  const updateResultEntry = (id: string, patch: Partial<ResultEntry>) => {
    if (!form) return;
    setForm({
      ...form,
      resultEntries: (form.resultEntries ?? []).map((row) =>
        row.id === id ? { ...row, ...patch } : row
      ),
    });
  };

  const addResultEntry = () => {
    if (!form) return;
    const entries = form.resultEntries ?? [];
    setForm({
      ...form,
      resultEntries: [...entries, newResultEntry(entries.length)],
    });
  };

  const removeResultEntry = (id: string) => {
    if (!form) return;
    setForm({
      ...form,
      resultEntries: (form.resultEntries ?? [])
        .filter((row) => row.id !== id)
        .map((row, index) => ({ ...row, order: index })),
    });
  };

  const addNavLink = () => {
    if (!form) return;
    const links = form.navLinks ?? [];
    setForm({
      ...form,
      navLinks: [...links, { label: 'New Link', href: '#', order: links.length, isVisible: true }],
    });
  };

  const updateNavLink = (index: number, patch: Partial<SiteContent['navLinks'][0]>) => {
    if (!form) return;
    const links = [...(form.navLinks ?? [])];
    links[index] = { ...links[index], ...patch };
    setForm({ ...form, navLinks: links });
  };

  const removeNavLink = (index: number) => {
    if (!form) return;
    const links = [...(form.navLinks ?? [])];
    links.splice(index, 1);
    setForm({
      ...form,
      navLinks: links.map((l, i) => ({ ...l, order: i })),
    });
  };

  // --- Feature Cards (Why Choose) ---
  const addFeatureCard = () => {
    if (!form) return;
    const cards = form.featureCards ?? [];
    setForm({
      ...form,
      featureCards: [
        ...cards,
        { id: crypto.randomUUID(), icon: 'BookOpen', title: '', description: '', order: cards.length },
      ],
    });
  };
  const updateFeatureCard = (id: string, patch: Partial<FeatureCard>) => {
    if (!form) return;
    setForm({
      ...form,
      featureCards: (form.featureCards ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };
  const removeFeatureCard = (id: string) => {
    if (!form) return;
    setForm({
      ...form,
      featureCards: (form.featureCards ?? []).filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i })),
    });
  };

  // --- About Highlights ---
  const addAboutHighlight = () => {
    if (!form) return;
    const items = form.aboutHighlights ?? [];
    setForm({
      ...form,
      aboutHighlights: [
        ...items,
        { id: crypto.randomUUID(), title: '', text: '', order: items.length },
      ],
    });
  };
  const updateAboutHighlight = (id: string, patch: Partial<AboutHighlight>) => {
    if (!form) return;
    setForm({
      ...form,
      aboutHighlights: (form.aboutHighlights ?? []).map((h) => (h.id === id ? { ...h, ...patch } : h)),
    });
  };
  const removeAboutHighlight = (id: string) => {
    if (!form) return;
    setForm({
      ...form,
      aboutHighlights: (form.aboutHighlights ?? []).filter((h) => h.id !== id).map((h, i) => ({ ...h, order: i })),
    });
  };

  // --- Exam Categories ---
  const addExamCategory = () => {
    if (!form) return;
    const items = form.examCategories ?? [];
    setForm({
      ...form,
      examCategories: [
        ...items,
        { id: crypto.randomUUID(), name: '', icon: 'FileText', slug: '', description: '', batches: '', order: items.length },
      ],
    });
  };
  const updateExamCategory = (id: string, patch: Partial<ExamCategory>) => {
    if (!form) return;
    setForm({
      ...form,
      examCategories: (form.examCategories ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };
  const removeExamCategory = (id: string) => {
    if (!form) return;
    setForm({
      ...form,
      examCategories: (form.examCategories ?? []).filter((e) => e.id !== id).map((e, i) => ({ ...e, order: i })),
    });
  };

  // --- Achievement Stats ---
  const addAchievement = () => {
    if (!form) return;
    const items = form.achievements ?? [];
    setForm({
      ...form,
      achievements: [
        ...items,
        { id: crypto.randomUUID(), value: '', label: '', icon: 'Trophy', order: items.length },
      ],
    });
  };
  const updateAchievement = (id: string, patch: Partial<AchievementStat>) => {
    if (!form) return;
    setForm({
      ...form,
      achievements: (form.achievements ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };
  const removeAchievement = (id: string) => {
    if (!form) return;
    setForm({
      ...form,
      achievements: (form.achievements ?? []).filter((a) => a.id !== id).map((a, i) => ({ ...a, order: i })),
    });
  };

  // --- Testimonials ---
  const addTestimonial = () => {
    if (!form) return;
    const items = form.testimonials ?? [];
    setForm({
      ...form,
      testimonials: [
        ...items,
        { id: crypto.randomUUID(), name: '', achievement: '', quote: '', avatarUrl: '', order: items.length },
      ],
    });
  };
  const updateTestimonial = (id: string, patch: Partial<Testimonial>) => {
    if (!form) return;
    setForm({
      ...form,
      testimonials: (form.testimonials ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };
  const removeTestimonial = (id: string) => {
    if (!form) return;
    setForm({
      ...form,
      testimonials: (form.testimonials ?? []).filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })),
    });
  };

  // --- App Features ---
  const addAppFeature = () => {
    if (!form) return;
    const items = form.appFeatures ?? [];
    setForm({
      ...form,
      appFeatures: [
        ...items,
        { id: crypto.randomUUID(), text: '', order: items.length },
      ],
    });
  };
  const updateAppFeature = (id: string, patch: Partial<{ text: string }>) => {
    if (!form) return;
    setForm({
      ...form,
      appFeatures: (form.appFeatures ?? []).map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };
  const removeAppFeature = (id: string) => {
    if (!form) return;
    setForm({
      ...form,
      appFeatures: (form.appFeatures ?? []).filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })),
    });
  };

  if (isLoading || !form) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const hero = form.hero ?? defaultSiteContent().hero;
  const resultEntries = [...(form.resultEntries ?? [])].sort((a, b) => a.order - b.order);
  const featureCards = [...(form.featureCards ?? [])].sort((a, b) => a.order - b.order);
  const aboutHighlights = [...(form.aboutHighlights ?? [])].sort((a, b) => a.order - b.order);
  const examCategories = [...(form.examCategories ?? [])].sort((a, b) => a.order - b.order);
  const achievements = [...(form.achievements ?? [])].sort((a, b) => a.order - b.order);
  const testimonials = [...(form.testimonials ?? [])].sort((a, b) => a.order - b.order);
  const appFeatures = [...(form.appFeatures ?? [])].sort((a, b) => a.order - b.order);

  const inputCls = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500';
  const addBtnCls = 'inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-100';
  const removeBtnCls = 'rounded p-1.5 text-red-600 hover:bg-red-50';
  const sectionCls = 'rounded-2xl border border-slate-100 bg-white p-6 shadow-sm';
  const cardCls = 'rounded-xl border border-slate-200 bg-slate-50/50 p-4';

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Website CMS</h1>
      <p className="mt-1 text-slate-600">
        Control the public landing page — every section, heading, subtitle and content
      </p>

      {isError ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>Could not load from server ({getApiErrorMessage(error, 'server unavailable')}).</p>
          <p className="mt-1">
            Start API: <code className="rounded bg-white px-1">cd server &amp;&amp; npm run dev</code>
          </p>
          <button type="button" onClick={() => void refetch()} className="mt-2 font-medium text-brand-700 hover:underline">
            Retry
          </button>
        </div>
      ) : null}

      <div className="mt-8 space-y-6">

        {/* ─── General ─── */}
        <section className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-900">General</h2>
          <p className="mt-1 text-xs text-slate-500">Site-wide branding settings</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Site Name</label>
              <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Tagline</label>
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Primary Color</label>
              <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300" />
            </div>
          </div>
          <div className="mt-4">
            <ImageUploadField label="Site Logo (Header & Footer)" value={form.logoUrl ?? ''} onChange={(url) => setForm({ ...form, logoUrl: url || undefined })} folder="site" previewClassName="mt-3 h-16 w-auto object-contain" />
          </div>
        </section>

        {/* ─── Advertisement Banner ─── */}
        <section className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-900">Advertisement Banner</h2>
          <p className="mt-1 text-xs text-slate-500">Popup banner shown when visitors open the website</p>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.adBannerEnabled ?? false}
                onChange={(e) => setForm({ ...form, adBannerEnabled: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Enable advertisement banner
            </label>
            <div>
              <label className="text-sm font-medium text-slate-700">Banner Title (optional)</label>
              <input value={form.adBannerTitle ?? ''} onChange={(e) => setForm({ ...form, adBannerTitle: e.target.value })} className={inputCls} placeholder="e.g. New Batch Starting!" />
            </div>
            <ImageUploadField
              label="Banner Image"
              value={form.adBannerImageUrl ?? ''}
              onChange={(url) => setForm({ ...form, adBannerImageUrl: url || undefined })}
              folder="site"
              previewClassName="mt-3 h-48 w-full max-w-2xl rounded-lg object-contain"
            />
            <div>
              <label className="text-sm font-medium text-slate-700">Banner Link URL (optional — opens on click)</label>
              <input value={form.adBannerLink ?? ''} onChange={(e) => setForm({ ...form, adBannerLink: e.target.value })} className={inputCls} placeholder="https://..." />
            </div>
          </div>
        </section>

        {/* ─── Hero Banner ─── */}
        <section className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-900">Hero Banner</h2>
          <p className="mt-1 text-xs text-slate-500">The main banner visible at the top of the homepage</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Headline</label>
              <input value={hero.headline} onChange={(e) => setForm({ ...form, hero: { ...hero, headline: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Headline (Hindi)</label>
              <input value={hero.headlineHindi ?? ''} onChange={(e) => setForm({ ...form, hero: { ...hero, headlineHindi: e.target.value || undefined } })} className={inputCls} placeholder="Optional Hindi headline" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Subtext</label>
              <textarea rows={3} value={hero.subtext} onChange={(e) => setForm({ ...form, hero: { ...hero, subtext: e.target.value } })} className={inputCls} />
            </div>
            <ImageUploadField label="Hero banner image" value={hero.heroImageUrl ?? ''} onChange={(url) => setForm({ ...form, hero: { ...hero, heroImageUrl: url || undefined } })} folder="site" />
            <div>
              <label className="text-sm font-medium text-slate-700">Video URL (YouTube/embed)</label>
              <input value={hero.videoUrl ?? ''} onChange={(e) => setForm({ ...form, hero: { ...hero, videoUrl: e.target.value || undefined } })} className={inputCls} placeholder="https://youtube.com/..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">CTA Primary</label>
                <input value={hero.ctaPrimary} onChange={(e) => setForm({ ...form, hero: { ...hero, ctaPrimary: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">CTA Secondary</label>
                <input value={hero.ctaSecondary} onChange={(e) => setForm({ ...form, hero: { ...hero, ctaSecondary: e.target.value } })} className={inputCls} />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Navigation Links ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Navigation Links</h2>
              <p className="mt-1 text-xs text-slate-500">Navbar menu items shown on the homepage</p>
            </div>
            <button type="button" onClick={addNavLink} className={addBtnCls}><Plus className="h-4 w-4" /> Add link</button>
          </div>
          <div className="mt-6 space-y-3">
            {(form.navLinks ?? []).sort((a, b) => a.order - b.order).map((link, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <label className="flex-1 min-w-[150px]">
                  <span className="block text-xs font-medium text-slate-600">Label</span>
                  <input value={link.label} onChange={(e) => updateNavLink(i, { label: e.target.value })} className={inputCls} />
                </label>
                <label className="flex-1 min-w-[150px]">
                  <span className="block text-xs font-medium text-slate-600">Link / URL (e.g., #contact)</span>
                  <input value={link.href} onChange={(e) => updateNavLink(i, { href: e.target.value })} className={inputCls} />
                </label>
                <label className="flex items-center gap-2 text-sm pb-2">
                  <input type="checkbox" checked={link.isVisible} onChange={(e) => updateNavLink(i, { isVisible: e.target.checked })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  Visible
                </label>
                <button type="button" onClick={() => removeNavLink(i)} className={removeBtnCls}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {(form.navLinks ?? []).length === 0 && <p className="text-sm text-slate-500">No navigation links added.</p>}
          </div>
        </section>

        {/* ─── Why Choose Section ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Why Choose Us</h2>
              <p className="mt-1 text-xs text-slate-500">Section heading, subtitle and feature cards</p>
            </div>
            <button type="button" onClick={addFeatureCard} className={addBtnCls}><Plus className="h-4 w-4" /> Add card</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Section Heading</label>
              <input value={form.whyChooseTitle} onChange={(e) => setForm({ ...form, whyChooseTitle: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Section Subtitle</label>
              <input value={form.whyChooseSubtitle ?? ''} onChange={(e) => setForm({ ...form, whyChooseSubtitle: e.target.value })} className={inputCls} placeholder="Optional subtitle" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {featureCards.map((card) => (
              <div key={card.id} className={cardCls}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><GripVertical className="h-4 w-4 text-slate-400" /> Feature Card</span>
                  <button type="button" onClick={() => removeFeatureCard(card.id)} className={removeBtnCls}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-sm"><span className="font-medium text-slate-700">Icon name</span>
                    <input value={card.icon} onChange={(e) => updateFeatureCard(card.id, { icon: e.target.value })} className={inputCls} placeholder="e.g. BookOpen, Users" />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Title</span>
                    <input value={card.title} onChange={(e) => updateFeatureCard(card.id, { title: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm sm:col-span-1"><span className="font-medium text-slate-700">Description</span>
                    <input value={card.description} onChange={(e) => updateFeatureCard(card.id, { description: e.target.value })} className={inputCls} />
                  </label>
                </div>
              </div>
            ))}
            {featureCards.length === 0 && <p className="text-sm text-slate-500">No feature cards yet.</p>}
          </div>
        </section>

        {/* ─── About Section ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">About Section</h2>
              <p className="mt-1 text-xs text-slate-500">About title, description and highlight cards</p>
            </div>
            <button type="button" onClick={addAboutHighlight} className={addBtnCls}><Plus className="h-4 w-4" /> Add highlight</button>
          </div>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Section Heading</label>
                <input value={form.aboutTitle ?? ''} onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea rows={3} value={form.aboutDescription ?? ''} onChange={(e) => setForm({ ...form, aboutDescription: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {aboutHighlights.map((hl) => (
              <div key={hl.id} className={cardCls}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Highlight</span>
                  <button type="button" onClick={() => removeAboutHighlight(hl.id)} className={removeBtnCls}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm"><span className="font-medium text-slate-700">Title</span>
                    <input value={hl.title} onChange={(e) => updateAboutHighlight(hl.id, { title: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Text</span>
                    <input value={hl.text} onChange={(e) => updateAboutHighlight(hl.id, { text: e.target.value })} className={inputCls} />
                  </label>
                </div>
              </div>
            ))}
            {aboutHighlights.length === 0 && <p className="text-sm text-slate-500">No highlights yet.</p>}
          </div>
        </section>

        {/* ─── Exam Grid Section ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Exam Categories</h2>
              <p className="mt-1 text-xs text-slate-500">Section heading, subtitle and exam cards shown on homepage</p>
            </div>
            <button type="button" onClick={addExamCategory} className={addBtnCls}><Plus className="h-4 w-4" /> Add exam</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Section Heading</label>
              <input value={form.examSectionTitle} onChange={(e) => setForm({ ...form, examSectionTitle: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Section Subtitle</label>
              <input value={form.examSectionSubtitle ?? ''} onChange={(e) => setForm({ ...form, examSectionSubtitle: e.target.value })} className={inputCls} placeholder="Optional subtitle" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {examCategories.map((exam) => (
              <div key={exam.id} className={cardCls}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><GripVertical className="h-4 w-4 text-slate-400" /> Exam</span>
                  <button type="button" onClick={() => removeExamCategory(exam.id)} className={removeBtnCls}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm"><span className="font-medium text-slate-700">Name</span>
                    <input value={exam.name} onChange={(e) => updateExamCategory(exam.id, { name: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Icon</span>
                    <input value={exam.icon} onChange={(e) => updateExamCategory(exam.id, { icon: e.target.value })} className={inputCls} placeholder="e.g. Shield, FileText" />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Slug</span>
                    <input value={exam.slug} onChange={(e) => updateExamCategory(exam.id, { slug: e.target.value })} className={inputCls} placeholder="e.g. ssc-cgl" />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Description</span>
                    <input value={exam.description ?? ''} onChange={(e) => updateExamCategory(exam.id, { description: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Batches</span>
                    <input value={exam.batches ?? ''} onChange={(e) => updateExamCategory(exam.id, { batches: e.target.value })} className={inputCls} placeholder="e.g. Morning, Evening" />
                  </label>
                </div>
              </div>
            ))}
            {examCategories.length === 0 && <p className="text-sm text-slate-500">No exam categories yet.</p>}
          </div>
        </section>

        {/* ─── Results Section ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Results</h2>
              <p className="mt-1 text-xs text-slate-500">Showcase student results with heading, subtitle and entries</p>
            </div>
            <button type="button" onClick={addResultEntry} className={addBtnCls}><Plus className="h-4 w-4" /> Add result</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Section Heading</label>
              <input value={form.resultsTitle ?? ''} onChange={(e) => setForm({ ...form, resultsTitle: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Section Subtitle</label>
              <input value={form.resultsSubtitle ?? ''} onChange={(e) => setForm({ ...form, resultsSubtitle: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <ImageUploadField label="Results section banner image" value={form.resultsImageUrl ?? ''} onChange={(url) => setForm({ ...form, resultsImageUrl: url || undefined })} folder="results" previewClassName="mt-3 h-40 w-full max-w-2xl rounded-lg object-cover" />
          </div>
          <div className="mt-6 space-y-3">
            {resultEntries.map((row) => (
              <article key={row.id} className={cardCls}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Result entry</span>
                  <button type="button" onClick={() => removeResultEntry(row.id)} className={removeBtnCls} aria-label="Remove result"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-sm"><span className="font-medium text-slate-700">Student name</span>
                    <input value={row.studentName} onChange={(e) => updateResultEntry(row.id, { studentName: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Exam</span>
                    <input value={row.exam} onChange={(e) => updateResultEntry(row.id, { exam: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Rank / Result</span>
                    <input value={row.rank} onChange={(e) => updateResultEntry(row.id, { rank: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Year</span>
                    <input type="text" inputMode="numeric" value={row.year} onChange={(e) => updateResultEntry(row.id, { year: e.target.value })} className={inputCls} />
                  </label>
                  <div className="sm:col-span-2">
                    <ImageUploadField label="Student photo" value={row.photoUrl ?? ''} onChange={(url) => updateResultEntry(row.id, { photoUrl: url || undefined })} folder="results" previewClassName="mt-3 h-16 w-16 rounded-full object-cover" />
                  </div>
                </div>
              </article>
            ))}
            {resultEntries.length === 0 && <p className="text-sm text-slate-500">No results yet. Click &quot;Add result&quot;.</p>}
          </div>
        </section>

        {/* ─── Achievements Section ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Achievements / Stats</h2>
              <p className="mt-1 text-xs text-slate-500">Counters shown on the homepage (e.g. 5000+ Students)</p>
            </div>
            <button type="button" onClick={addAchievement} className={addBtnCls}><Plus className="h-4 w-4" /> Add stat</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Section Heading</label>
              <input value={form.achievementsTitle} onChange={(e) => setForm({ ...form, achievementsTitle: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Section Subtitle</label>
              <input value={form.achievementsSubtitle ?? ''} onChange={(e) => setForm({ ...form, achievementsSubtitle: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {achievements.map((stat) => (
              <div key={stat.id} className={cardCls}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Stat</span>
                  <button type="button" onClick={() => removeAchievement(stat.id)} className={removeBtnCls}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-sm"><span className="font-medium text-slate-700">Value</span>
                    <input value={stat.value} onChange={(e) => updateAchievement(stat.id, { value: e.target.value })} className={inputCls} placeholder="e.g. 5000+" />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Label</span>
                    <input value={stat.label} onChange={(e) => updateAchievement(stat.id, { label: e.target.value })} className={inputCls} placeholder="e.g. Students" />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Icon</span>
                    <input value={stat.icon} onChange={(e) => updateAchievement(stat.id, { icon: e.target.value })} className={inputCls} placeholder="e.g. Users, Trophy" />
                  </label>
                </div>
              </div>
            ))}
            {achievements.length === 0 && <p className="text-sm text-slate-500">No achievement stats yet.</p>}
          </div>
        </section>

        {/* ─── Testimonials Section ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Testimonials</h2>
              <p className="mt-1 text-xs text-slate-500">Student testimonials with heading and subtitle</p>
            </div>
            <button type="button" onClick={addTestimonial} className={addBtnCls}><Plus className="h-4 w-4" /> Add testimonial</button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Section Heading</label>
              <input value={form.testimonialsTitle} onChange={(e) => setForm({ ...form, testimonialsTitle: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Section Subtitle</label>
              <input value={form.testimonialsSubtitle ?? ''} onChange={(e) => setForm({ ...form, testimonialsSubtitle: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {testimonials.map((t) => (
              <div key={t.id} className={cardCls}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Testimonial</span>
                  <button type="button" onClick={() => removeTestimonial(t.id)} className={removeBtnCls}><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm"><span className="font-medium text-slate-700">Name</span>
                    <input value={t.name} onChange={(e) => updateTestimonial(t.id, { name: e.target.value })} className={inputCls} />
                  </label>
                  <label className="text-sm"><span className="font-medium text-slate-700">Achievement</span>
                    <input value={t.achievement} onChange={(e) => updateTestimonial(t.id, { achievement: e.target.value })} className={inputCls} placeholder="e.g. SSC CGL 2024" />
                  </label>
                  <label className="text-sm sm:col-span-2"><span className="font-medium text-slate-700">Quote</span>
                    <textarea rows={2} value={t.quote} onChange={(e) => updateTestimonial(t.id, { quote: e.target.value })} className={inputCls} />
                  </label>
                  <div className="sm:col-span-2">
                    <ImageUploadField label="Avatar photo" value={t.avatarUrl ?? ''} onChange={(url) => updateTestimonial(t.id, { avatarUrl: url || undefined })} folder="site" previewClassName="mt-3 h-16 w-16 rounded-full object-cover" />
                  </div>
                </div>
              </div>
            ))}
            {testimonials.length === 0 && <p className="text-sm text-slate-500">No testimonials yet.</p>}
          </div>
        </section>

        {/* ─── App Features Section ─── */}
        <section className={sectionCls}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">App Features</h2>
              <p className="mt-1 text-xs text-slate-500">Mobile app feature list shown on homepage</p>
            </div>
            <button type="button" onClick={addAppFeature} className={addBtnCls}><Plus className="h-4 w-4" /> Add feature</button>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700">Section Heading</label>
            <input value={form.appFeaturesTitle} onChange={(e) => setForm({ ...form, appFeaturesTitle: e.target.value })} className={inputCls} />
          </div>
          <div className="mt-6 space-y-3">
            {appFeatures.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
                <input value={f.text} onChange={(e) => updateAppFeature(f.id, { text: e.target.value })} className={`flex-1 ${inputCls}`} placeholder="Feature text..." />
                <button type="button" onClick={() => removeAppFeature(f.id)} className={removeBtnCls}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {appFeatures.length === 0 && <p className="text-sm text-slate-500">No app features yet.</p>}
          </div>
        </section>

        {/* ─── Contact Section ─── */}
        <section className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-900">Contact / Enquiry Section</h2>
          <p className="mt-1 text-xs text-slate-500">Section heading, subtitle and contact details shown on homepage</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Section Heading</label>
              <input value={form.contactTitle ?? ''} onChange={(e) => setForm({ ...form, contactTitle: e.target.value })} className={inputCls} placeholder="e.g. Admission Enquiry" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Section Subtitle</label>
              <input value={form.contactSubtitle ?? ''} onChange={(e) => setForm({ ...form, contactSubtitle: e.target.value })} className={inputCls} placeholder="e.g. Fill the form..." />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone Number</label>
              <input value={form.contactPhone ?? ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} placeholder="e.g. +91 98765 43210" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={form.contactEmail ?? ''} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">WhatsApp (no +)</label>
              <input value={form.whatsappNumber ?? ''} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Address / Location</label>
              <input value={form.contactAddress ?? ''} onChange={(e) => setForm({ ...form, contactAddress: e.target.value })} className={inputCls} placeholder="Full address" />
            </div>
          </div>
        </section>

        {/* ─── Footer & Social ─── */}
        <section className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-900">Footer & Social Links</h2>
          <p className="mt-1 text-xs text-slate-500">Footer text and social media URLs</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">Footer Text (Copyright)</label>
              <input value={form.footerText ?? ''} onChange={(e) => setForm({ ...form, footerText: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Facebook URL</label>
              <input value={form.facebookUrl ?? ''} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Instagram URL</label>
              <input value={form.instagramUrl ?? ''} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">YouTube URL</label>
              <input value={form.youtubeUrl ?? ''} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Telegram URL</label>
              <input value={form.telegramUrl ?? ''} onChange={(e) => setForm({ ...form, telegramUrl: e.target.value })} className={inputCls} />
            </div>
          </div>
        </section>

        {/* ─── Publish + Save ─── */}
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Publish website
          </label>
          <Button onClick={() => save.mutate(buildSavePayload(form))} disabled={save.isPending}>
            {save.isPending ? 'Saving...' : 'Save All Changes'}
          </Button>
          {hasDraft && (
            <button type="button" onClick={discardDraft} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" title="Discard your local unsaved changes and reload the last saved version">
              Discard draft
            </button>
          )}
          {hasDraft && <span className="text-xs text-amber-700">Unsaved changes are auto-saved in this browser.</span>}
        </div>
      </div>
    </div>
  );
};
