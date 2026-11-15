"use client";

import { useEffect, useRef } from "react";
import { useTrackVisitor, useVisitorStats } from "@/queries/visitor";

export const useVisitorTracker = () => {
  const started = useRef(false);
  const {
    mutate,
    data: trackedStats,
    isError: isTrackingError,
    isIdle,
    isPending,
  } = useTrackVisitor();
  const {
    data: fetchedStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useVisitorStats(isTrackingError);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mutate();
  }, [mutate]);

  const stats = trackedStats ?? (isTrackingError ? fetchedStats : undefined);
  return {
    stats: stats ?? { todayVisitors: 0, totalVisitors: 0 },
    isLoading: isIdle || isPending || (isTrackingError && isStatsLoading),
    error: isTrackingError && isStatsError ? "방문자 통계를 불러올 수 없습니다." : null,
  };
};
