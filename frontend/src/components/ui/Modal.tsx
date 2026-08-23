import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | undefined;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  return createPortal(<AnimatePresence>
      {open && <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <motion.div className="absolute inset-0 bg-charcoal/45" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1]
      }} onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-label={title} className="relative w-full sm:max-w-lg bg-paper rounded-t-2xl sm:rounded-card border border-sand-light max-h-[88vh] sm:max-h-[85dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:pb-0" initial={{
        opacity: 0,
        y: 24,
        scale: 0.98
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: 16,
        scale: 0.98
      }} transition={{
        duration: 0.24,
        ease: [0.23, 1, 0.32, 1]
      }}>
            <div className="flex items-start justify-between gap-4 p-5 border-b border-sand-lighter">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-charcoal">{title}</h2>
                {description && <p className="mt-1 truncate text-sm text-charcoal-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-charcoal-soft hover:text-charcoal transition-colors duration-150 ease-firm">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && <div className="p-5 pt-0 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>}
    </AnimatePresence>, document.body);
}