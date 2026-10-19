import type { Transition } from "motion/react";

/** Shared Motion presets. CSS equivalents live in foundation.css. */
export const spring = {
  snappy: { type: "spring", visualDuration: 0.24, bounce: 0.1 },
  smooth: { type: "spring", visualDuration: 0.38, bounce: 0 },
  morph: { type: "spring", visualDuration: 0.42, bounce: 0.15 },
  track: { type: "spring", stiffness: 520, damping: 38 },
} as const satisfies Record<string, Transition>;

/** Seconds, as required by Motion; CSS duration tokens use milliseconds. */
export const duration = { fast: 0.15, base: 0.24, slow: 0.48 } as const;
export const easing = {
  standard: [0.2, 0.8, 0.2, 1],
  enter: [0.16, 1, 0.3, 1],
} as const;

/** Consumers may opt into this opacity transition instead of spatial motion. */
export const reducedMotionTransition = {
  duration: duration.fast,
  ease: easing.standard,
} as const satisfies Transition;
