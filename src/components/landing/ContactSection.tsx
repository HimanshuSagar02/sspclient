import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Phone, Mail, MapPin } from 'lucide-react';
import api from '@/services/api';
import type { ApiResponse, SiteContent } from '@/types';
import { Button } from '@/components/ui/Button';

interface ContactSectionProps {
  site: SiteContent;
  preselectedExam?: string;
}

export const ContactSection = ({ site, preselectedExam = '' }: ContactSectionProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [exam, setExam] = useState(preselectedExam);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (preselectedExam) setExam(preselectedExam);
  }, [preselectedExam]);

  const exams = (Array.isArray(site.examCategories) ? site.examCategories : []).map((e) => e.name);

  const submit = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ id: string }>>('/site/enquiry', {
        name,
        phone,
        email: email || undefined,
        exam: exam || undefined,
        message: message || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message ?? 'Enquiry submitted!');
      setName('');
      setPhone('');
      setEmail('');
      setExam('');
      setMessage('');
    },
    onError: () => toast.error('Could not submit. Please call us directly.'),
  });

  return (
    <section id="contact" className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {site.contactTitle ?? 'Contact Us'}
            </h2>
            <p className="mt-2 text-slate-600">{site.contactSubtitle}</p>

            <ul className="mt-8 space-y-4">
              {site.contactPhone && (
                <li className="flex items-center gap-3 text-slate-700">
                  <Phone className="h-5 w-5 text-brand-600" />
                  <a href={`tel:${site.contactPhone.replace(/\s/g, '')}`} className="hover:text-brand-600">
                    {site.contactPhone}
                  </a>
                </li>
              )}
              {site.contactEmail && (
                <li className="flex items-center gap-3 text-slate-700">
                  <Mail className="h-5 w-5 text-brand-600" />
                  <a href={`mailto:${site.contactEmail}`} className="hover:text-brand-600">
                    {site.contactEmail}
                  </a>
                </li>
              )}
              {site.contactAddress && (
                <li className="flex items-start gap-3 text-slate-700">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <span>{site.contactAddress}</span>
                </li>
              )}
            </ul>

            {site.whatsappNumber && (
              <a
                href={`https://wa.me/${site.whatsappNumber}?text=Hi, I want admission enquiry`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
              >
                WhatsApp पर बात करें
              </a>
            )}
          </div>

          <form
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone *</label>
                <input
                  required
                  type="tel"
                  pattern="[0-9]{10,15}"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="10 digit mobile"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Exam</label>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Select exam</option>
                  {exams.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Message</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Any question?"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submit.isPending}>
                {submit.isPending ? 'Submitting...' : 'Submit Enquiry'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
