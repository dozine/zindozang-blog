import type { VisitorStats } from "@/types/visitor";

/** GET /api/visitor 성공 응답. */
export type GetVisitorStatsResponse = VisitorStats;

/** POST /api/visitor 성공 응답. counted는 이번 요청의 집계 여부다. */
export interface TrackVisitorResponse extends VisitorStats {
  counted: boolean;
}
