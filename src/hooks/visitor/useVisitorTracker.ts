import { useState, useEffect } from "react";
import { visitorService, VisitorStats } from "@/lib/services/visitorService";

export const useVisitorTracker = () => {
  const [stats, setStats] = useState<VisitorStats>({
    todayVisitors: 0,
    totalVisitors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await visitorService.trackVisitor();
        setStats({
          todayVisitors: data.todayVisitors,
          totalVisitors: data.totalVisitors,
        });
      } catch (err) {
        console.error("Failed to track visitor:", err);
        setError(err instanceof Error ? err.message : "Unknown error");

        try {
          const data = await visitorService.getStats();
          setStats(data);
        } catch (fallbackErr) {
          console.error("Failed to get visitor stats:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    trackVisitor();
  }, []);

  return { stats, loading, error };
};
