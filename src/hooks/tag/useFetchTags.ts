"use client";

import { getErrorMessage } from "@/lib/utils/error";
import { useEffect, useState } from "react";
import type { TagListResponse } from "@/types/api/tag";
import { fetchAvailableTags } from "@/lib/services/tagService";

interface UseFetchTagsResult {
  tags: TagListResponse;
  loading: boolean;
  error: string | null;
}

export function useFetchTags(): UseFetchTagsResult {
  const [tags, setTags] = useState<TagListResponse>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);
      try {
        const allTags = await fetchAvailableTags();
        setTags(allTags);
      } catch (err) {
        const errorMessage = getErrorMessage(err, "태그 불러오기 오류가 발생했습니다.");
        console.error("태그 불러오기 오류", err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTags();
  }, []);

  return { tags, loading, error };
}
