import React, { StrictMode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVisitorTracker } from "@/hooks/visitor/useVisitorTracker";
import { visitorQueryKeys } from "@/queries/visitor";
import { visitorService } from "@/lib/services/visitorService";

jest.mock("@/lib/services/visitorService", () => ({
  visitorService: { trackVisitor: jest.fn(), getStats: jest.fn() },
}));

const stats = { todayVisitors: 3, totalVisitors: 100 };
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StrictMode>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </StrictMode>
  );
  return { client, wrapper };
}

beforeEach(() => jest.resetAllMocks());

test("방문 기록을 한 번 요청하고 통계를 캐시에 저장한다", async () => {
  jest.mocked(visitorService.trackVisitor).mockResolvedValue({ ...stats, counted: true });
  const { wrapper, client } = setup();
  const { result } = renderHook(() => useVisitorTracker(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.stats).toEqual(stats);
  expect(visitorService.trackVisitor).toHaveBeenCalledTimes(1);
  expect(visitorService.getStats).not.toHaveBeenCalled();
  expect(client.getQueryData(visitorQueryKeys.stats)).toEqual(stats);
});

test("방문 기록 실패 시 통계 조회 결과를 보여준다", async () => {
  jest.mocked(visitorService.trackVisitor).mockRejectedValue(new Error("tracking failed"));
  jest.mocked(visitorService.getStats).mockResolvedValue(stats);
  const { wrapper } = setup();
  const { result } = renderHook(() => useVisitorTracker(), { wrapper });
  await waitFor(() => expect(result.current.stats).toEqual(stats));
  expect(result.current.error).toBeNull();
  expect(visitorService.trackVisitor).toHaveBeenCalledTimes(1);
  expect(visitorService.getStats).toHaveBeenCalledTimes(1);
});

test("방문 기록과 통계 조회가 모두 실패하면 오류를 보여준다", async () => {
  jest.mocked(visitorService.trackVisitor).mockRejectedValue(new Error("tracking failed"));
  jest.mocked(visitorService.getStats).mockRejectedValue(new Error("stats failed"));
  const { wrapper } = setup();
  const { result } = renderHook(() => useVisitorTracker(), { wrapper });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(result.current.isLoading).toBe(false);
});
