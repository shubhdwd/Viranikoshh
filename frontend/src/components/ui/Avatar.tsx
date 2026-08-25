
import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
interface AvatarProps {
  src: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
const SIZES = {
  xs: 'h-6 w-6',
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};
const TEXT_SIZES = {
  xs: 'text-[9px]',
  sm: 'text-[12px]',
  md: 'text-[14px]',
  lg: 'text-[18px]',
  xl: 'text-[26px]'
};

/** "Kamla Devi" → "KD", "meera" → "M". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 'sm',
  className
}: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const shared = cn('rounded-full object-cover bg-sand-lighter ring-1 ring-sand-light shrink-0', SIZES[size], className);

  // Most API profiles have no avatar yet — show initials rather than a broken
  // image frame.
  if (!src || failed) {
    return <span role="img" aria-label={name || 'Member'} className={cn(shared, 'flex items-center justify-center font-medium text-charcoal-muted', TEXT_SIZES[size])}>
        {initials(name)}
      </span>;
  }
  return <img src={src} alt={name} onError={() => setFailed(true)} className={shared} />;
}
