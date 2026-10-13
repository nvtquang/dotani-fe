import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row, pinned under the scrolling body. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

/**
 * Modal built on the native <dialog>: focus is trapped and restored by the browser, Esc closes,
 * the rest of the page is inert. Centered on desktop, a bottom sheet on phones.
 */
export const Dialog = ({ open, onClose, title, description, children, footer, size = 'md', className }: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      if (open) {
        document.documentElement.style.overflow = '';
      }
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // a click on the dialog element itself is a click on the backdrop
        if (event.target === ref.current) {
          onClose();
        }
      }}
      className={cn(
        'fixed m-auto w-full max-w-none overflow-hidden bg-white p-0 text-slate-900 shadow-overlay',
        'max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:rounded-t-2xl sm:max-h-[min(88dvh,52rem)] sm:w-[calc(100%-2rem)] sm:rounded-2xl',
        'open:flex open:animate-slide-up open:flex-col',
        widths[size],
        className,
      )}
    >
      {open && (
        <>
          <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold text-slate-900">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-slate-600">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 inline-flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Đóng"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
          {footer && (
            <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </footer>
          )}
        </>
      )}
    </dialog>
  );
};
