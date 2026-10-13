import type { ComponentPropsWithRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  accent: 'bg-accent-600 text-white shadow-sm hover:bg-accent-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200',
  danger: 'border border-accent-100 bg-white text-accent-700 hover:bg-accent-50',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-3 text-sm',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-base',
  icon: 'size-10 rounded-lg',
};

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) =>
  cn(
    'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = ({ variant, size, loading, className, children, disabled, type = 'button', ...props }: ButtonProps) => (
  <button
    type={type}
    className={buttonClass(variant, size, className)}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
    {children}
  </button>
);

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; size?: ButtonSize };

export const ButtonLink = ({ variant, size, className, ...props }: ButtonLinkProps) => (
  <Link className={buttonClass(variant, size, className as string | undefined)} {...props} />
);
