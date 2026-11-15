import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TagsPageClient from "@/app/(blog)/tags/tagsPageClient";
import { tagQueryKeys } from "@/queries/tag";

jest.mock("next-auth/react", () => ({ useSession: () => ({ status: "unauthenticated" }) }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

test("태그 캐시가 바뀌면 태그 페이지도 갱신된다", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: false } },
  });
  const allTags = [{ id: "1", name: "React", _count: { posts: 1 } }];
  render(
    <QueryClientProvider client={client}>
      <TagsPageClient allTags={allTags} selectedTags={[]} />
    </QueryClientProvider>
  );
  expect(screen.getByRole("button", { name: "React (1)" })).toBeTruthy();
  act(() =>
    client.setQueryData(tagQueryKeys.all, [{ id: "2", name: "Next", _count: { posts: 2 } }])
  );
  await waitFor(() => expect(screen.queryByRole("button", { name: "React (1)" })).toBeNull());
  expect(screen.getByRole("button", { name: "Next (2)" })).toBeTruthy();
});
