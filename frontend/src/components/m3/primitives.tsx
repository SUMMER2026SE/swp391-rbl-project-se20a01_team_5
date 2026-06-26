"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/* =========================================================================
   M3 EXPRESSIVE BUTTON
   Filled · Tonal · Outlined · Text · Elevated + state layers + spring press
   ========================================================================= */
const expressiveButtonVariants = cva(
  "state-layer relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-38 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary elev-1 hover:elev-2",
        tonal: "bg-secondary-container text-on-secondary-container",
        "tertiary-tonal": "bg-tertiary-container text-on-tertiary-container",
        outlined: "border-2 border-outline bg-transparent text-primary",
        text: "bg-transparent text-primary px-3",
        elevated: "bg-surface-container-low text-primary elev-1 hover:elev-2",
        error: "bg-error text-on-error elev-1",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-full has-[>svg]:px-3",
        md: "h-11 px-6 text-sm rounded-full has-[>svg]:px-5",
        lg: "h-14 px-8 text-base rounded-full has-[>svg]:px-7",
        icon: "size-12 rounded-full",
        "icon-sm": "size-10 rounded-full",
      },
    },
    defaultVariants: { variant: "filled", size: "md" },
  }
);

export interface ExpressiveButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof expressiveButtonVariants> {
  asChild?: boolean;
}

export const ExpressiveButton = React.forwardRef<
  HTMLButtonElement,
  ExpressiveButtonProps
>(({ className, variant, size, asChild, children, ...props }, ref) => {
  const Comp = asChild ? (Slot as any) : motion.button;
  return (
    <Comp
      ref={ref}
      className={cn(expressiveButtonVariants({ variant, size }), className)}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 600, damping: 25 }}
      {...(props as any)}
    >
      {children}
    </Comp>
  );
});
ExpressiveButton.displayName = "ExpressiveButton";
export { expressiveButtonVariants };

/* =========================================================================
   M3 EXPRESSIVE CARD — filled / outlined / elevated
   ========================================================================= */
export interface ExpressiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "filled" | "outlined" | "elevated";
  interactive?: boolean;
}

export function ExpressiveCard({
  className,
  variant = "filled",
  interactive = false,
  children,
  ...props
}: ExpressiveCardProps) {
  const styles = {
    filled: "bg-surface-container-high",
    outlined: "bg-surface border-2 border-outline-variant",
    elevated: "bg-surface-container-low elev-2",
  }[variant];
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        styles,
        interactive && "state-layer cursor-pointer transition-shadow hover:elev-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* =========================================================================
   M3 CHIP — assist / filter / input / suggestion
   ========================================================================= */
const chipVariants = cva(
  "state-layer inline-flex items-center gap-2 h-8 px-4 text-sm font-medium rounded-lg border-2 transition-colors select-none cursor-pointer",
  {
    variants: {
      variant: {
        assist: "border-transparent bg-surface-container-low text-on-surface-variant",
        filter: "border-outline-variant bg-transparent text-on-surface-variant",
        "filter-selected": "border-primary bg-secondary-container text-on-secondary-container",
        input: "border-transparent bg-secondary-container text-on-secondary-container",
        suggestion: "border-outline-variant bg-surface-container-highest text-on-surface",
      },
    },
    defaultVariants: { variant: "assist" },
  }
);
export function Chip({
  className,
  variant,
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & VariantProps<typeof chipVariants>) {
  return (
    <button className={cn(chipVariants({ variant }), className)} {...(props as any)}>
      {children}
    </button>
  );
}
export { chipVariants };

/* =========================================================================
   M3 SEGMENTED BUTTON
   ========================================================================= */
export function SegmentedButton<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-full border-2 border-outline overflow-hidden", className)}>
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "state-layer relative inline-flex items-center gap-2 h-10 px-4 text-sm font-medium transition-colors",
              selected ? "bg-secondary-container text-on-secondary-container" : "bg-transparent text-on-surface-variant",
              i > 0 && "border-l-2 border-outline"
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   M3 FAB / Extended FAB
   ========================================================================= */
export function Fab({
  className,
  children,
  extended = false,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & { extended?: boolean }) {
  return (
    <motion.button
      className={cn(
        "state-layer fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 bg-primary-container text-on-primary-container elev-3",
        extended ? "h-14 px-6 rounded-2xl" : "size-14 rounded-2xl justify-center",
        className
      )}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 600, damping: 22 }}
      whileHover={{ y: -2 }}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

/* =========================================================================
   M3 LIST ITEM
   ========================================================================= */
export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  active = false,
  className,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "state-layer flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors",
        active && "bg-secondary-container text-on-secondary-container",
        className
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {subtitle && <p className="text-xs text-on-surface-variant truncate mt-0.5">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 text-on-surface-variant">{trailing}</div>}
    </div>
  );
}

/* =========================================================================
   M3 Top App Bar headline
   ========================================================================= */
export function AppBarHeadline({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-on-surface text-balance">
        {title}
      </h1>
      {subtitle && (
        <p className="text-base text-on-surface-variant text-pretty">{subtitle}</p>
      )}
    </div>
  );
}

/* =========================================================================
   M3 StatusPill
   ========================================================================= */
export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: "neutral" | "primary" | "tertiary" | "success" | "warning" | "error";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-container-highest text-on-surface-variant",
    primary: "bg-primary-container text-on-primary-container",
    tertiary: "bg-tertiary-container text-on-tertiary-container",
    success: "bg-success-container text-on-surface",
    warning: "bg-warning-container text-on-surface",
    error: "bg-error-container text-on-error-container",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 h-6 px-3 rounded-full text-xs font-medium", tones[tone], className)}>
      <span className={cn("size-1.5 rounded-full",
        tone === "success" && "bg-success",
        tone === "error" && "bg-error",
        tone === "warning" && "bg-warning",
        tone === "primary" && "bg-primary",
        tone === "tertiary" && "bg-tertiary",
        tone === "neutral" && "bg-on-surface-variant",
      )} />
      {label}
    </span>
  );
}

/* =========================================================================
   M3 Progress
   ========================================================================= */
export function M3Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1 rounded-full bg-surface-container-highest overflow-hidden", className)}>
      <motion.div
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
