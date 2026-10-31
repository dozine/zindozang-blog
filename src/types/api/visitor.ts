/** GET /api/visitor 성공 응답. */
export interface GetVisitorStatsResponse {
  todayVisitors: number;
  totalVisitors: number;
}

/** POST /api/visitor 성공 응답. counted는 이번 요청의 집계 여부다. */
export interface TrackVisitorResponse extends GetVisitorStatsResponse {
  counted: boolean;
}
