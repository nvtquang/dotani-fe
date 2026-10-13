import { cloneElement, isValidElement, useId, type ComponentPropsWithRef, type ReactElement, type ReactNode } from 'react';
import { cn } from './cn';

const controlBase =
  'w-full rounded-lg border bg-white px-3 text-base text-slate-900 transition-colors placeholder:text-slate-500 sm:text-sm ' +
  'focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600';

const controlBorder = (invalid?: boolean) => (invalid ? 'border-accent-600' : 'border-slate-300');

type ControlProps = { invalid?: boolean };

export const Input = ({ className, invalid, ...props }: ComponentPropsWithRef<'input'> & ControlProps) => (
  <input className={cn(controlBase, controlBorder(invalid), 'h-10', className)} aria-invalid={invalid || undefined} {...props} />
);

export const Textarea = ({ className, invalid, ...props }: ComponentPropsWithRef<'textarea'> & ControlProps) => (
  <textarea
    className={cn(controlBase, controlBorder(invalid), 'min-h-24 py-2 leading-relaxed', className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
);

export const Select = ({ className, invalid, ...props }: ComponentPropsWithRef<'select'> & ControlProps) => (
  <select
    className={cn(controlBase, controlBorder(invalid), 'h-10 appearance-auto pr-8', className)}
    aria-invalid={invalid || undefined}
    {...props}
  />
);

type FieldProps = {
  label: ReactNode;
  /** The single control; it gets id, aria-describedby and aria-invalid wired up. */
  children: ReactElement<Record<string, unknown>>;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
};

/** Label + control + hint/error underneath, connected for screen readers. */
export const Field = ({ label, children, error, hint, required, className }: FieldProps) => {
  const id = useId();
  const controlId = (children.props.id as string | undefined) ?? id;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={controlId} className="text-sm font-medium text-slate-800">
        {label}
        {required && (
          <span className="ml-0.5 text-accent-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {isValidElement(children)
        ? cloneElement(children, {
            id: controlId,
            'aria-describedby': describedBy,
            invalid: Boolean(error),
            'aria-required': required || undefined,
          })
        : children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-accent-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/** Checkbox with its label to the right. */
export const Checkbox = ({ label, className, ...props }: ComponentPropsWithRef<'input'> & { label: ReactNode }) => (
  <label className={cn('inline-flex min-h-10 items-center gap-2 text-sm text-slate-800', className)}>
    <input type="checkbox" className="size-4 rounded border-slate-400 accent-brand-600" {...props} />
    {label}
  </label>
);
