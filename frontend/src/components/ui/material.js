"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Import official Material Web Components
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/text-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/fab/fab.js';
import '@material/web/icon/icon.js';
import '@material/web/elevation/elevation.js';
import '@material/web/ripple/ripple.js';

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function MaterialIcon({ children, filled = false, className = '' }) {
  return (
    <md-icon
      aria-hidden="true"
      class={className}
      style={{ fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 500, "GRAD" 0, "opsz" 24` }}
    >
      {children}
    </md-icon>
  );
}

export function MaterialCard({ children, className = '', elevated = false, interactive = false, as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn(
        'relative overflow-hidden',
        elevated ? 'bg-[var(--md-sys-color-surface-container-high)]' : 'bg-[var(--md-sys-color-surface-container)]',
        'rounded-[var(--md-sys-shape-corner-large)]',
        className,
      )}
      {...props}
    >
      <md-elevation suppressHydrationWarning></md-elevation>
      {interactive && <md-ripple suppressHydrationWarning></md-ripple>}
      {children}
    </Component>
  );
}

// Generic Hook for Next.js routing with Web Components
function useRoutingHandler(href, onClick, disabled) {
  const router = useRouter();
  return (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && href && !disabled) {
      if (href.startsWith('http') || href.startsWith('//')) {
        window.location.href = href;
      } else {
        router.push(href);
      }
    }
  };
}

export function FilledButton({ children, className = '', href, onClick, disabled, type, ...props }) {
  const handleClick = useRoutingHandler(href, onClick, disabled);
  return (
    <md-filled-button class={className} disabled={disabled ? true : undefined} onClick={handleClick} type={type} {...props}>
      {children}
    </md-filled-button>
  );
}

export function TonalButton({ children, className = '', href, onClick, disabled, type, ...props }) {
  const handleClick = useRoutingHandler(href, onClick, disabled);
  return (
    <md-filled-tonal-button class={className} disabled={disabled ? true : undefined} onClick={handleClick} type={type} {...props}>
      {children}
    </md-filled-tonal-button>
  );
}

export function TextButton({ children, className = '', href, onClick, disabled, type, ...props }) {
  const handleClick = useRoutingHandler(href, onClick, disabled);
  return (
    <md-text-button class={className} disabled={disabled ? true : undefined} onClick={handleClick} type={type} {...props}>
      {children}
    </md-text-button>
  );
}

export function MaterialTextField({ label, className = '', inputClassName = '', type = 'text', value, onChange, children, ...props }) {
  // Web components emit native 'input' events, React captures them correctly in React 19.
  return (
    <md-outlined-text-field
      label={label}
      class={cn('w-full', className, inputClassName)}
      type={type}
      value={value}
      onChange={onChange}
      {...props}
    >
      {children}
    </md-outlined-text-field>
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

export function FAB({ children, href, onClick, className = '', ...props }) {
  const handleClick = useRoutingHandler(href, onClick, false);
  return (
    <md-fab class={cn('fixed bottom-24 right-5 z-30 md:bottom-8', className)} onClick={handleClick} {...props}>
      <div slot="icon" className="flex h-full w-full items-center justify-center">
        {children}
      </div>
    </md-fab>
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
