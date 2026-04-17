import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PublicStats {
  entries_today: number;
  hometowns_total: number;
  countries_total: number;
  brooks_active: number;
}

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setVal(0);
      return;
    }
    let raf = 0;
    const step = (ts: number) => {
      if (startedAt.current === null) startedAt.current = ts;
      const elapsed = ts - startedAt.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      startedAt.current = null;
    };
  }, [target, duration]);

  return val;
}

export const LiveStatsStrip = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-public-stats");
        if (!cancelled && !error && data) setStats(data as PublicStats);
      } catch (e) {
        console.error("stats fetch failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useCountUp(stats?.entries_today ?? 0);
  const hometowns = useCountUp(stats?.hometowns_total ?? 0);
  const countries = useCountUp(stats?.countries_total ?? 0);
  const brooks = useCountUp(stats?.brooks_active ?? 0);

  if (!stats) {
    return <div className="h-8" aria-hidden />;
  }

  return (
    <div className="text-sm md:text-base text-foreground/70 max-w-3xl mx-auto px-4 animate-fade-in">
      <span className="font-semibold text-primary">{entries}</span> moments shared today
      <span className="mx-2 text-foreground/30">·</span>
      <span className="font-semibold text-primary">{hometowns}</span> hometowns across{" "}
      <span className="font-semibold text-primary">{countries}</span> countries
      <span className="mx-2 text-foreground/30">·</span>
      <span className="font-semibold text-primary">{brooks}</span> private streams flowing
    </div>
  );
};
