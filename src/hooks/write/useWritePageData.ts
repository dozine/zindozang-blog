import { useEffect, useState, useRef } from "react";
import { Category } from "@prisma/client";
import { TagWithPostCount } from "@/types/tag";
import { PostWithFormattedTags } from "@/types";
import { fetchPostBySlug } from "@/lib/services/postService";
import { fetchCategories } from "@/lib/services/categoryService";
import { fetchAvailableTags } from "@/lib/services/tagService";

interface PostDataLoaderProps {
  isEditing: boolean;
  editSlug: string;
  isAuthenticated: boolean;
  onPostLoadError: (message: string) => void;
  onNavigate: (path: string) => void;
}

interface PostDataLoaderResult {
  isLoading: boolean;
  postToEdit: PostWithFormattedTags | null;
  categories: Category[];
  availableTags: TagWithPostCount[];
}

export const usePostDataLoader = ({
  isEditing,
  editSlug,
  isAuthenticated,
  onPostLoadError,
  onNavigate,
}: PostDataLoaderProps): PostDataLoaderResult => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [postToEdit, setPostToEdit] = useState<PostWithFormattedTags | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<TagWithPostCount[]>([]);

  const onPostLoadErrorRef = useRef(onPostLoadError);
  const onNavigateRef = useRef(onNavigate);

  useEffect(() => {
    onPostLoadErrorRef.current = onPostLoadError;
    onNavigateRef.current = onNavigate;
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(true);
      return;
    }

    if (isEditing && !editSlug) {
      onPostLoadErrorRef.current("수정할 게시글의 slug가 없습니다.");
      onNavigateRef.current("/write");
      return;
    }

    const loadAllData = async () => {
      setIsLoading(true);

      let postPromise: Promise<PostWithFormattedTags | null> = Promise.resolve(null);
      if (isEditing && editSlug) {
        postPromise = fetchPostBySlug(editSlug).catch((err) => {
          onPostLoadErrorRef.current(err.message || "게시글을 불러올 수 없습니다.");
          return null;
        });
      }

      const metadataPromise = Promise.all([
        fetchCategories().catch((err) => {
          console.error("카테고리 로딩 실패:", err);
          return [];
        }),
        fetchAvailableTags().catch((err) => {
          console.error("태그 로딩 실패:", err);
          return [];
        }),
      ]);

      try {
        const [postResult, [catData, tagData]] = await Promise.all([postPromise, metadataPromise]);

        if (postResult) setPostToEdit(postResult);
        setCategories(catData);
        setAvailableTags(tagData);
      } catch (err: any) {
        console.error("데이터 로딩 중 치명적인 오류 발생:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [isEditing, editSlug, isAuthenticated]);

  return {
    isLoading,
    postToEdit,
    categories,
    availableTags,
  };
};
