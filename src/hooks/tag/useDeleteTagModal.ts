import { getErrorMessage } from "@/lib/utils/error";
import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { useDeleteTag } from "@/queries/tag";

export function useDeleteTagModal(isOpen: boolean, onClose: () => void) {
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [validationError, setValidationError] = useState("");
  const { mutateAsync: deleteTag, isPending, isError, error, reset } = useDeleteTag();

  useEffect(() => {
    if (!isOpen) {
      setSelectedTagId("");
      setValidationError("");
      reset();
    }
  }, [isOpen, reset]);

  const handleTagSelectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setSelectedTagId(e.target.value);
      setValidationError("");
      reset();
    },
    [reset]
  );

  const handleDeleteSubmit = useCallback(
    async (onSuccessCallback: (tagId: string) => void) => {
      if (!selectedTagId) {
        setValidationError("삭제할 태그를 선택해주세요.");
        return;
      }
      setValidationError("");
      try {
        await deleteTag(selectedTagId);
      } catch {
        return;
      }
      onSuccessCallback(selectedTagId);
      setSelectedTagId("");
      onClose();
    },
    [selectedTagId, onClose, deleteTag]
  );

  return {
    selectedTagId,
    isLoading: isPending,
    error:
      validationError || (isError ? getErrorMessage(error, "삭제 중 오류가 발생했습니다.") : ""),
    handleTagSelectChange,
    handleDeleteSubmit,
  };
}
