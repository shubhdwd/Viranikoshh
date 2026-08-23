
import { cn } from '../../utils/cn';
export interface TabItem {
  id: string;
  label: string;
  count?: number;
}
interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}
export function Tabs({
  items,
  active,
  onChange,
  className
}: TabsProps) {
  return <div role="tablist" className={cn('vk-scroll-x flex w-full max-w-full gap-0.5 overflow-x-auto border-b border-sand-light sm:gap-1', className)}>
      {items.map((item) => {
      const selected = item.id === active;
      return <button key={item.id} role="tab" type="button" aria-selected={selected} onClick={() => onChange(item.id)} className={cn('relative shrink-0 whitespace-nowrap px-3 py-3 text-[13px] font-medium transition-colors duration-150 ease-firm sm:px-4 sm:text-sm', selected ? 'text-terracotta' : 'text-charcoal-muted hover:text-charcoal')}>
            {item.label}
            {typeof item.count === 'number' && <span className="ml-1.5 text-xs text-charcoal-soft">{item.count}</span>}
            {selected && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-terracotta sm:inset-x-3" />}
          </button>;
    })}
    </div>;
}
