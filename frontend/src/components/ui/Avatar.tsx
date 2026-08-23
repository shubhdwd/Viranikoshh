
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
export function Avatar({
  src,
  name,
  size = 'sm',
  className
}: AvatarProps) {
  return <img src={src} alt={name} className={cn('rounded-full object-cover bg-sand-lighter ring-1 ring-sand-light shrink-0', SIZES[size], className)} />;
}
