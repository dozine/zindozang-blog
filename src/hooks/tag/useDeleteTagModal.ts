import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { deleteTag } from "@/lib/services/tagService";

export function useDeleteTagModal(isOpen: boolean, onClose: () => void) {
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedTagId("");
      setError("");
    }
  }, [isOpen]);

  const handleTagSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedTagId(e.target.value);
    setError("");
  }, []);

  const handleDeleteSubmit = useCallback(
    async (onSuccessCallback: (tagId: string) => void) => {
      if (!selectedTagId) {
        setError("삭제할 태그를 선택해주세요.");
        return;
      }
      setError("");
      setIsLoading(true);

      try {
        const result = await deleteTag(selectedTagId);

        if (result.success === false) {
          setError(result.error || "삭제 중 오류가 발생했습니다.");
        } else {
          onSuccessCallback(selectedTagId);
          setSelectedTagId("");
          onClose();
        }
        return result;
      } catch (err: any) {
        setError(err.message || "삭제 중 오류가 발생했습니다.");
        console.error("태그 삭제 오류:", err);
        return { success: false, error: err.message || "알 수 없는 오류" };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTagId, onClose]
  );

  return {
    selectedTagId,
    isLoading,
    error,
    handleTagSelectChange,
    handleDeleteSubmit,
  };
}
