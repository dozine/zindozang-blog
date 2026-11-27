"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  deleteDraft,
  listDrafts,
  loadDraft,
  publishDraft,
  saveDraft,
} from "@/lib/services/draftService";
import type {
  DraftListResponse,
  DeleteDraftInput,
  PublishDraftInput,
  SaveDraftRequest,
} from "@/types/api/draft";
import { postQueryKeys } from "./post";
import { tagQueryKeys } from "./tag";

export const draftQueryKeys = {
  all: ["drafts"] as const,
  account: (account: string) => ["drafts", account] as const,
  list: (account: string) => ["drafts", account, "list"] as const,
  detail: (account: string, id: string) => ["drafts", account, "detail", id] as const,
};

function useDraftAccount() {
  const { data, status } = useSession();
  return { account: data?.user?.email ?? "local", authenticated: status === "authenticated" };
}

export function useDraftsQuery(enabled = true) {
  const { account, authenticated } = useDraftAccount();
  return useQuery({
    queryKey: draftQueryKeys.list(account),
    queryFn: listDrafts,
    enabled: enabled && authenticated,
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useDraftQuery(id: string, enabled = true) {
  const { account, authenticated } = useDraftAccount();
  return useQuery({
    queryKey: draftQueryKeys.detail(account, id),
    queryFn: () => loadDraft(id),
    enabled: enabled && authenticated && !!id,
    staleTime: 0,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useSaveDraft() {
  const client = useQueryClient();
  const { account } = useDraftAccount();
  return useMutation({
    mutationFn: (body: SaveDraftRequest) => saveDraft(body),
    onSuccess: async (draft) => {
      client.setQueryData(draftQueryKeys.detail(account, draft.id), draft);
      await client.invalidateQueries({ queryKey: draftQueryKeys.list(account) });
    },
  });
}

export function useDeleteDraft() {
  const client = useQueryClient();
  const { account } = useDraftAccount();
  return useMutation({
    mutationFn: (draft: DeleteDraftInput) => deleteDraft(draft),
    onSuccess: async (_result, draft) => {
      await client.cancelQueries({ queryKey: draftQueryKeys.list(account) });
      client.setQueryData<DraftListResponse>(draftQueryKeys.list(account), (items) =>
        items?.filter((item) => item.id !== draft.id)
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: draftQueryKeys.list(account), refetchType: "none" }),
        client.invalidateQueries({
          queryKey: draftQueryKeys.detail(account, draft.id),
          refetchType: "none",
        }),
      ]);
    },
  });
}

export function usePublishDraft() {
  const client = useQueryClient();
  const { account } = useDraftAccount();
  return useMutation({
    mutationFn: ({ id, body }: PublishDraftInput) => publishDraft(id, body),
    onSuccess: async (_result, { id }) => {
      client.setQueryData<DraftListResponse>(draftQueryKeys.list(account), (items) =>
        items?.filter((item) => item.id !== id)
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: draftQueryKeys.list(account) }),
        client.invalidateQueries({
          queryKey: draftQueryKeys.detail(account, id),
          refetchType: "none",
        }),
        client.invalidateQueries({ queryKey: postQueryKeys.all }),
        client.invalidateQueries({ queryKey: tagQueryKeys.all }),
      ]);
    },
  });
}
