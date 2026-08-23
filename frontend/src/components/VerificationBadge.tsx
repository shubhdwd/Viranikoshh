
import { BadgeCheckIcon, ClockIcon, FlagIcon, PencilLineIcon } from 'lucide-react';
import { VERIFICATION_LABELS, type VerificationStatus } from '../types/verification';
import { cn } from '../utils/cn';
const STYLES: Record<VerificationStatus, {
  className: string;
  Icon: typeof BadgeCheckIcon;
}> = {
  verified: {
    className: 'bg-verified-soft text-verified border-verified/20',
    Icon: BadgeCheckIcon
  },
  pending: {
    className: 'bg-pending-soft text-pending border-pending/20',
    Icon: ClockIcon
  },
  'correction-suggested': {
    className: 'bg-[#fbeee6] text-clay border-clay/25',
    Icon: PencilLineIcon
  },
  flagged: {
    className: 'bg-flagged-soft text-flagged border-flagged/25',
    Icon: FlagIcon
  }
};
interface VerificationBadgeProps {
  status: VerificationStatus;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}
export function VerificationBadge({
  status,
  count,
  size = 'sm',
  className
}: VerificationBadgeProps) {
  const {
    className: tone,
    Icon
  } = STYLES[status];
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap', size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[13px]', tone, className)}>
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
      {VERIFICATION_LABELS[status]}
      {typeof count === 'number' && count > 0 && <span className="opacity-70">· {count}</span>}
    </span>;
}
