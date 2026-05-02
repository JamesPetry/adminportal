import type { ReactNode } from "react";

/**
 * Lightweight entrance animation (CSS only — no Framer on the critical path).
 * Respects `prefers-reduced-motion` via global styles.
 */
export function AnimatedReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div className="animate-reveal" style={delay > 0 ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </div>
  );
}
