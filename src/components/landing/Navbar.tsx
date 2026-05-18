import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import type { NavLink, SiteContent } from '@/types';
import { cn } from '@/utils/cn';

interface NavbarProps {
  site: SiteContent;
}

export const Navbar = ({ site }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const links = (Array.isArray(site.navLinks) ? site.navLinks : [])
    .filter((l) => l.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <header className="sticky top-0 z-50 bg-brand-600 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2">
          {site.logoUrl ? (
            <img src={site.logoUrl} alt={site.siteName} className="h-9 object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-700 font-bold text-lg">
              S
            </div>
          )}
          <span className="text-lg font-bold text-white sm:text-xl">{site.siteName}</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link: NavLink) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/90 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <motion.div className="hidden items-center gap-3 lg:flex">
          <a href="#contact">
            <Button variant="outline" size="sm">
              Enquiry
            </Button>
          </a>
          <Link to="/login">
            <Button variant="white" size="sm">
              Login
            </Button>
          </Link>
          {site.whatsappNumber && (
            <a
              href={`https://wa.me/${site.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
        </motion.div>

        <button
          className="rounded-lg p-2 text-white lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/20 bg-brand-700 lg:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-white font-medium"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className={cn('flex flex-col gap-2 pt-2')}>
                <a href="#contact" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Enquiry
                  </Button>
                </a>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="white" className="w-full">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
