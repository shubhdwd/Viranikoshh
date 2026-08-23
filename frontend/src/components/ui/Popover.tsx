import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PopoverProps {
  /** Rendered as the trigger. Receives the open state so it can show a caret. */
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  label: string;
  align?: 'left' | 'right';
  className?: string;
  panelClassName?: string;
}

/**
 * Small anchored popover shared by the audio speed control and the share action.
 * Closes on outside click and Escape, and is keyboard reachable.
 */
export function Popover({ trigger, children, label, align = 'right', className, panelClassName }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex">
        
        {trigger(open)}
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 2, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'absolute bottom-full z-30 mb-2 min-w-[9rem] overflow-hidden rounded-lg border border-sand-light bg-paper p-1 shadow-[0_6px_20px_rgba(38,34,31,0.12)]',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName
          )}>
          
            {children(() => setOpen(false))}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}