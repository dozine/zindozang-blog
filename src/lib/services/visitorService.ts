import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { trackVisitorResponseSchema, visitorStatsResponseSchema } from "@/lib/zod/visitor";
import { parseApiResponse } from "@/lib/zod/response";
import type { GetVisitorStatsResponse, TrackVisitorResponse } from "@/types/api/visitor";

export const visitorService = {
  trackVisitor: async (): Promise<TrackVisitorResponse> => {
    const response = await fetch(API_ENDPOINTS.visitor, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to track visitor");
    }

    return parseApiResponse(response, trackVisitorResponseSchema);
  },

  getStats: async (): Promise<GetVisitorStatsResponse> => {
    const response = await fetch(API_ENDPOINTS.visitor, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to get visitor stats");
    }

    return parseApiResponse(response, visitorStatsResponseSchema);
  },
};
