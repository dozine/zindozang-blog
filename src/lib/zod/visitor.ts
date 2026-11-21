import { z } from "zod";

export const visitorStatsResponseSchema = z.object({
  todayVisitors: z.number(),
  totalVisitors: z.number(),
});
export const trackVisitorResponseSchema = visitorStatsResponseSchema.extend({
  counted: z.boolean(),
});
