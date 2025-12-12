export interface VisitorStats {
  todayVisitors: number;
  totalVisitors: number;
  counted?: boolean;
}

export interface UseVisitorTrackerReturn {
  stats: VisitorStats;
  loading: boolean;
  error: string | null;
}
