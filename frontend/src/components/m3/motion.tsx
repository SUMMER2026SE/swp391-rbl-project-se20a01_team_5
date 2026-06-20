"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  animate,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* =========================================================================
   GSAP-STYLE SPLIT TEXT REVEAL — word-by-word clip reveal
   Refined: tighter spring, mask stays clean, no overflow leak
   ========================================================================= */
export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.05,
  as: As = "h1",
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: React.ElementType;
  once?: boolean;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { once, margin: "-8% 0px" });
  const words = React.useMemo(() => text.split(" "), [text]);
  return (
    <As
      ref={ref as any}
      className={cn("inline-block", className)}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.08em", marginBottom: "-0.08em" }}
          aria-hidden
        >
          <motion.span
            className="inline-block"
            initial={{ y: "115%", opacity: 0 }}
            animate={inView ? { y: "0%", opacity: 1 } : {}}
            transition={{
              delay: delay + i * stagger,
              type: "spring",
              stiffness: 420,
              damping: 38,
              mass: 0.7,
            }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </As>
  );
}

/* =========================================================================
   SCROLL REVEAL — refined GSAP-style: clip-path reveal, no blur flicker
   Mobile: skip animation for perf (just render)
   ========================================================================= */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 24,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay,
        type: "spring",
        stiffness: 180,
        damping: 24,
        mass: 0.5,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   STAGGER GROUP — orchestrated children reveal
   ========================================================================= */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 240, damping: 26 },
  },
};

export function StaggerGroup({
  children,
  className,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-8% 0px" });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/* =========================================================================
   MAGNETIC — REMOVED cursor-follow (caused "div trôi theo con trỏ" bug)
   Replaced with a subtle hover-lift that feels GSAP-refined but stays put.
   ========================================================================= */
export function Magnetic({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   COUNTER — animated count-up when in view (GSAP-style)
   ========================================================================= */
export function Counter({
  to,
  from = 0,
  duration = 1.6,
  format = (n) => Math.round(n).toLocaleString("vi-VN"),
  className,
}: {
  to: number;
  from?: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [val, setVal] = React.useState(from);
  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(from, to, {
      duration,
      ease: [0.05, 0.7, 0.1, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, from, to, duration]);
  // Reserve width based on FINAL value's formatted string so the layout
  // doesn't shift as the number grows from "0" to "126.000".
  const finalStr = format(to);
  return (
    <span
      ref={ref}
      className={className}
      style={{
        fontVariantNumeric: "tabular-nums",
        // Reserve space for the final string; the counter grows into it.
        // Use ch units (1ch ≈ width of "0") + small buffer.
        minWidth: `${finalStr.length + 1}ch`,
        display: "inline-block",
        textAlign: "inherit",
      }}
    >
      {format(val)}
    </span>
  );
}

/* =========================================================================
   MARQUEE — infinite horizontal scroll, paused on hover, touch-friendly
   ========================================================================= */
export function Marquee({
  children,
  className,
  speed = 30,
  reverse = false,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  reverse?: boolean;
}) {
  return (
    <div className={cn("group overflow-hidden", className)}>
      <motion.div
        className="flex gap-8 w-max will-change-transform"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        <div className="flex gap-8 shrink-0">{children}</div>
        <div className="flex gap-8 shrink-0" aria-hidden>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   PARALLAX — useScroll + useTransform. Disabled on mobile (touch) to avoid
   the "container position" warning and jank.
   ========================================================================= */
export function Parallax({
  children,
  className,
  offset = 80,
}: {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [enabled] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  );
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [enabled ? offset : 0, enabled ? -offset : 0]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* =========================================================================
   PINNED SECTION — sticky with scrubbed reveal
   ========================================================================= */
export function PinnedSection({
  children,
  className,
  height = "180vh",
}: {
  children: React.ReactNode;
  className?: string;
  height?: string;
}) {
  return (
    <div className={className} style={{ height }}>
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        {children}
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE TRANSITION — fade + slide, no blur (cleaner)
   ========================================================================= */
export function PageTransition({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   SHIMMER / LOADING
   ========================================================================= */
export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-container-high rounded-xl",
        className
      )}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklch, var(--m3-primary) 14%, transparent), transparent)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* =========================================================================
   GSAP-style CLIP REVEAL — for sections entering with a wipe effect
   ========================================================================= */
export function ClipReveal({
  children,
  className,
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
      animate={
        inView
          ? { clipPath: "inset(0 0% 0 0)", opacity: 1 }
          : { clipPath: "inset(0 100% 0 0)", opacity: 0 }
      }
      transition={{ delay, duration: 0.7, ease: [0.05, 0.7, 0.1, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
