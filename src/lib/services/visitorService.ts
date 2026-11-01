import type { GetVisitorStatsResponse, TrackVisitorResponse } from "@/types/api/visitor";

export const visitorService = {
  trackVisitor: async (): Promise<TrackVisitorResponse> => {
    const response = await fetch("/api/visitor", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to track visitor");
    }

    return response.json();
  },

  getStats: async (): Promise<GetVisitorStatsResponse> => {
    const response = await fetch("/api/visitor", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to get visitor stats");
    }

    return response.json();
  },
};
