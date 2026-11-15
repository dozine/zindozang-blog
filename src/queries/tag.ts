"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTag, deleteTag, fetchAvailableTags } from "@/lib/services/tagService";
import type { TagListResponse } from "@/types/api/tag";
import { postQueryKeys } from "./post";

export const tagQueryKeys = { all: ["tags"] as const };

export function useTagsQuery(enabled = true, initialData?: TagListResponse) {
  return useQuery({
    queryKey: tagQueryKeys.all,
    queryFn: fetchAvailableTags,
    enabled,
    initialData,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const result = await createTag(name);
      if (!result.success && !result.existingTag) {
        throw new Error(result.error || "태그 생성 중 오류가 발생했습니다.");
      }
      return result;
    },
    onSuccess: async (result) => {
      if (result.success || result.existingTag) {
        await queryClient.invalidateQueries({ queryKey: tagQueryKeys.all });
      }
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTag(id);
      if (!result.success) throw new Error(result.error || "삭제 중 오류가 발생했습니다.");
      return result;
    },
    onSuccess: async (_result, id) => {
      queryClient.setQueryData<TagListResponse>(tagQueryKeys.all, (tags) =>
        tags?.filter((tag) => tag.id !== id)
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tagQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: postQueryKeys.all }),
      ]);
    },
  });
}
