"use client";
import { useEffect, useState } from "react";
import { Tag } from "@prisma/client";
import { fetchAvailableTags } from "@/lib/services/tagService";

interface UseFetchTagsResult {
  tags: Tag[];
  loading: boolean;
  error: string | null;
}

export function useFetchTags(): UseFetchTagsResult {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      setError(null);
      try {
        const allTags = await fetchAvailableTags();
        setTags(allTags);
      } catch (err: any) {
        const errorMessage =
          err.message || "태그 불러오기 오류가 발생했습니다.";
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
