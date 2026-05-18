import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SiteContent } from '@/types';

const SESSION_KEY = 'srishti-ad-banner-dismissed';

export const AdBanner = ({ site }: { site: SiteContent }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!site.adBannerEnabled || !site.adBannerImageUrl) return;
    const dismissed = sessionStorage.getItem(SESSION_KEY);
    if (!dismissed) {
      // Small delay so it doesn't flash immediately
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [site.adBannerEnabled, site.adBannerImageUrl]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  const content = (
    <img
      src={site.adBannerImageUrl}
      alt={site.adBannerTitle || 'Advertisement'}
      className="max-h-[80vh] w-full max-w-lg rounded-2xl object-contain shadow-2xl"
    />
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-label="Close advertisement"
      />
      {/* Banner */}
      <div className="relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {site.adBannerTitle && (
          <h3 className="mb-3 text-center text-lg font-bold text-white drop-shadow-lg sm:text-xl">
            {site.adBannerTitle}
          </h3>
        )}
        {site.adBannerLink ? (
          <a
            href={site.adBannerLink}
            target="_blank"
            rel="noreferrer"
            onClick={dismiss}
            className="block"
          >
            {content}
          </a>
        ) : (
          content
        )}
        <button
          type="button"
          onClick={dismiss}
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
