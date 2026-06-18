"use client";

import Link from 'next/link';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function MaterialIcon({ children, filled = false, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={cn('material-symbols-rounded', className)}
      style={{ fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 500, "GRAD" 0, "opsz" 24` }}
    >
      {children}
    </span>
  );
}

export function MaterialCard({ children, className = '', elevated = false, interactive = false, as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn(
        elevated ? 'm3-surface-high' : 'm3-surface',
        interactive && 'm3-state-layer m3-focus-ring transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0',
        'rounded-[var(--md-sys-shape-corner-extra-large)]',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function FilledButton({ children, className = '', as: Component = 'button', ...props }) {
  return (
    <Component
      className={cn(
        'm3-state-layer m3-focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-6 py-3 text-sm font-black text-[var(--md-sys-color-on-primary)] shadow-[var(--md-sys-elevation-1)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function TonalButton({ children, className = '', as: Component = 'button', ...props }) {
  return (
    <Component
      className={cn(
        'm3-state-layer m3-focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--md-sys-color-secondary-container)] px-6 py-3 text-sm font-black text-[var(--md-sys-color-on-secondary-container)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function TextButton({ children, className = '', as: Component = 'button', ...props }) {
  return (
    <Component
      className={cn(
        'm3-state-layer m3-focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-black text-[var(--md-sys-color-primary)] transition-colors disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function MaterialTextField({ label, className = '', inputClassName = '', ...props }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="mb-2 block text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">{label}</span>}
      <input
        className={cn(
          'm3-focus-ring min-h-14 w-full rounded-[var(--md-sys-shape-corner-large)] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] px-4 py-3 text-sm font-bold text-[var(--md-sys-color-on-surface)] outline-none transition-colors placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--md-sys-color-surface-container-lowest)] disabled:opacity-60',
          inputClassName,
        )}
        {...props}
      />
    </label>
  );
}

export function StatusChip({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]',
    primary: 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]',
    success: 'bg-[var(--unibus-success-container)] text-[var(--unibus-success)]',
    warning: 'bg-[var(--unibus-warning-container)] text-[var(--unibus-warning)]',
    danger: 'bg-[var(--unibus-danger-container)] text-[var(--unibus-danger)]',
  };

  return (
    <span className={cn('inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-black', tones[tone] || tones.neutral, className)}>
      {children}
    </span>
  );
}

export function FAB({ children, href, className = '', ...props }) {
  const Component = href ? Link : 'button';
  return (
    <Component
      href={href}
      className={cn(
        'm3-state-layer m3-focus-ring fixed bottom-24 right-5 z-30 inline-flex h-16 min-w-16 items-center justify-center gap-2 rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-primary-container)] px-5 text-sm font-black text-[var(--md-sys-color-on-primary-container)] shadow-[var(--md-sys-elevation-3)] transition-transform hover:-translate-y-1 active:translate-y-0 md:bottom-8',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={cn('animate-pulse rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-surface-container-high)]', className)} />
  );
}

export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <MaterialCard className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">{icon}</div>}
      <h3 className="text-xl font-black text-[var(--md-sys-color-on-surface)]">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm font-bold leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </MaterialCard>
  );
}
