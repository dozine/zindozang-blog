import type { z } from "zod";
import type { visitorStatsResponseSchema, trackVisitorResponseSchema } from "@/lib/zod/visitor";

/** GET /api/visitor 성공 응답. */
export type GetVisitorStatsResponse = z.infer<typeof visitorStatsResponseSchema>;
/** POST /api/visitor 성공 응답. counted는 이번 요청의 집계 여부다. */
export type TrackVisitorResponse = z.infer<typeof trackVisitorResponseSchema>;
