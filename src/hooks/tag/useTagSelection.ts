"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

export function useTagSelection() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleTagClick = useCallback(
    (tagName: string) => {
      const params = new URLSearchParams(searchParams.toString());

      const currentTags: string[] = params.get("tags")
        ? params
            .get("tags")
            .split(".")
            .filter((t) => t !== "")
        : [];

      if (!currentTags.includes(tagName)) {
        currentTags.push(tagName);
      } else {
        const filtered = currentTags.filter((t) => t !== tagName);

        if (filtered.length === 0) {
          params.delete("tags");
        } else {
          params.set("tags", filtered.join("."));
        }

        if (currentTags.length === filtered.length) return;
      }

      params.set("tags", currentTags.join("."));

      params.set("page", "1");

      router.push(`/tags?${params.toString()}`);
    },
    [searchParams, router]
  );

  const getSelectedTags = useCallback(
    (initialTags: string[]): string[] => {
      const rawTags: string | null = searchParams.get("tags");
      return rawTags
        ? rawTags.split(".").filter((tag) => tag !== "")
        : initialTags;
    },
    [searchParams]
  );

  return {
    handleTagClick,
    getSelectedTags,
  };
}
