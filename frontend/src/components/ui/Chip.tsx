
import { cn } from '../../utils/cn';
interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: (() => void) | undefined;
  className?: string;
  count?: number;
}
export function Chip({
  label,
  selected,
  onClick,
  className,
  count
}: ChipProps) {
  const Tag = onClick ? 'button' : 'span';
  return <Tag type={onClick ? 'button' : undefined} onClick={onClick} aria-pressed={onClick ? selected : undefined} className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-[background-color,border-color,color] duration-150 ease-firm whitespace-nowrap', selected ? 'bg-terracotta text-paper border-terracotta' : 'bg-paper text-charcoal-muted border-sand-light hover:border-charcoal-soft hover:text-charcoal', className)}>
      {label}
      {typeof count === 'number' && <span className={cn('text-[11px]', selected ? 'text-paper/75' : 'text-charcoal-soft')}>{count}</span>}
    </Tag>;
}
