"use client";

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { visitorService } from "@/lib/services/visitorService";
import type { VisitorStats } from "@/types/visitor";

export const visitorQueryKeys = { stats: ["visitor", "stats"] as const };

// 여러 컴포넌트가 동시에 마운트돼도 방문 기록은 한 번만 요청한다.
const pendingTracking = new WeakMap<QueryClient, Promise<VisitorStats>>();

function trackOnce(client: QueryClient): Promise<VisitorStats> {
  const pending = pendingTracking.get(client);
  if (pending) return pending;

  const request = visitorService.trackVisitor().then(({ todayVisitors, totalVisitors }) => ({
    todayVisitors,
    totalVisitors,
  }));
  pendingTracking.set(client, request);
  void request.then(
    () => pendingTracking.delete(client),
    () => pendingTracking.delete(client)
  );
  return request;
}

export function useTrackVisitor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => trackOnce(client),
    retry: false,
    onSuccess: (stats) => client.setQueryData(visitorQueryKeys.stats, stats),
  });
}

export function useVisitorStats(enabled: boolean) {
  return useQuery({
    queryKey: visitorQueryKeys.stats,
    queryFn: visitorService.getStats,
    enabled,
    retry: false,
  });
}
