"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Load Speed Insights after first paint / during idle time so it does not compete with Core Web Vitals.
 */
export function SpeedInsightsDeferred() {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    const load = () => {
      void import("@vercel/speed-insights/next").then((m) => setComp(() => m.SpeedInsights));
    };

    if (typeof window === "undefined") return;

    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric(load, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(load, 1);
    return () => window.clearTimeout(id);
  }, []);

  return Comp ? <Comp /> : null;
}
