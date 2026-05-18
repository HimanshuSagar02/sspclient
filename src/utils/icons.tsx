import type { ReactElement } from 'react';
import {
  ClipboardCheck,
  Video,
  BookOpen,
  Trophy,
  GraduationCap,
  Landmark,
  Train,
  Building2,
  Shield,
  Users,
  MapPin,
  BadgeCheck,
  Briefcase,
  HeartPulse,
  Atom,
  Layers,
  Star,
  Award,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'clipboard-check': ClipboardCheck,
  video: Video,
  'book-open': BookOpen,
  trophy: Trophy,
  'graduation-cap': GraduationCap,
  landmark: Landmark,
  train: Train,
  'building-2': Building2,
  shield: Shield,
  users: Users,
  'map-pin': MapPin,
  'badge-check': BadgeCheck,
  briefcase: Briefcase,
  'heart-pulse': HeartPulse,
  atom: Atom,
  layers: Layers,
  star: Star,
  award: Award,
  'user-check': UserCheck,
};

export const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}): ReactElement => {
  const Icon = iconMap[name] ?? BookOpen;
  return <Icon className={className} />;
};
