import { cn } from '@/utils/cn';

const variants: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  paid: 'bg-emerald-50 text-emerald-700',
  due: 'bg-red-50 text-red-700',
  partial: 'bg-amber-50 text-amber-700',
  checked_in: 'bg-brand-50 text-brand-700',
  checked_out: 'bg-slate-100 text-slate-600',
  occupied: 'bg-brand-50 text-brand-700',
  vacant: 'bg-slate-100 text-slate-600',
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-amber-50 text-amber-700',
  admin: 'bg-purple-50 text-purple-700',
  teacher: 'bg-blue-50 text-blue-700',
  coaching_student: 'bg-indigo-50 text-indigo-700',
  library_student: 'bg-teal-50 text-teal-700',
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={cn(
      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
      variants[status] ?? 'bg-slate-100 text-slate-600'
    )}
  >
    {status.replace(/_/g, ' ')}
  </span>
);
