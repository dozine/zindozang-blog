"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPost, deletePost, fetchPostBySlug, updatePost } from "@/lib/services/postService";
import type { UpdatePostRequest } from "@/types/api/post";

export const postQueryKeys = {
  all: ["posts"] as const,
  detail: (slug: string) => ["posts", "detail", slug] as const,
};

export function usePostQuery(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: postQueryKeys.detail(slug),
    queryFn: () => fetchPostBySlug(slug),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: async () => {
      const { tagQueryKeys } = await import("./tag");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: tagQueryKeys.all }),
      ]);
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, body }: { slug: string; body: UpdatePostRequest }) =>
      updatePost(slug, body),
    onSuccess: async () => {
      const { tagQueryKeys } = await import("./tag");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: tagQueryKeys.all }),
      ]);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: async () => {
      const { tagQueryKeys } = await import("./tag");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: tagQueryKeys.all }),
      ]);
    },
  });
}
