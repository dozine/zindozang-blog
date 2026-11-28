"use client";
import { useEffect, useRef } from "react";
import { useDraftsQuery, useDeleteDraft } from "@/queries/draft";
import { getErrorMessage } from "@/lib/utils/error";
import type { DraftResponse } from "@/types/api/draft";
import styles from "./draftPicker.module.css";

export default function DraftPicker({
  currentId,
  onClose,
  onSelect,
  onDeleted,
}: {
  currentId?: string;
  onClose: () => void;
  onSelect: (draft: DraftResponse) => void;
  onDeleted: (draft: DraftResponse) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const {
    data: drafts = [],
    isPending: loading,
    isError,
    error: listError,
    refetch,
  } = useDraftsQuery();
  const {
    mutateAsync: deleteDraft,
    isPending: deleting,
    variables,
    error: mutationError,
    reset,
  } = useDeleteDraft();
  const error = isError ? getErrorMessage(listError, "초안을 불러오지 못했습니다.") : "";
  const deleteError = mutationError
    ? getErrorMessage(mutationError, "초안을 삭제하지 못했습니다.")
    : "";
  const deletingId = deleting ? (variables?.id ?? "") : "";
  const deleteInProgress = useRef(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const retry = () => {
    reset();
    void refetch();
  };
  async function remove(draft: DraftResponse) {
    if (
      deleteInProgress.current ||
      !window.confirm(
        draft.id === currentId
          ? "이 초안을 삭제할까요? 현재 편집 내용은 새 글로 계속 작성할 수 있습니다."
          : "이 초안을 삭제할까요? 삭제한 초안은 되돌릴 수 없습니다."
      )
    )
      return;
    deleteInProgress.current = true;
    try {
      await deleteDraft(draft);
      onDeleted(draft);
    } catch {
      // The mutation exposes the error while keeping the list intact.
    } finally {
      deleteInProgress.current = false;
    }
  }
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="draft-picker-title"
      onCancel={(event) => {
        if (deleteInProgress.current) event.preventDefault();
        else onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !deleteInProgress.current) onClose();
      }}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 id="draft-picker-title">내 초안</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={!!deletingId}
            aria-label="초안 목록 닫기"
          >
            ×
          </button>
        </div>
        <p className={styles.description}>저장한 글을 선택해 이어서 작성하세요.</p>
        {deleteError && (
          <p role="alert">
            {deleteError}{" "}
            <button type="button" disabled={!!deletingId} onClick={retry}>
              목록 새로고침
            </button>
          </p>
        )}
        {loading ? (
          <p role="status">초안을 불러오는 중…</p>
        ) : error ? (
          <div role="alert">
            {error}{" "}
            <button type="button" onClick={retry}>
              다시 불러오기
            </button>
          </div>
        ) : !drafts.length ? (
          <p className={styles.emptyMessage}>
            저장한 초안이 없습니다. ‘저장 및 게시’에서 초안을 저장할 수 있습니다.
          </p>
        ) : (
          <ul className={styles.list}>
            {drafts.map((draft) => (
              <li key={draft.id} className={styles.row}>
                <button
                  type="button"
                  className={styles.item}
                  aria-label={`${draft.content.title.trim() || "제목 없는 글"} 초안 불러오기`}
                  onClick={() => onSelect(draft)}
                  disabled={!!deletingId}
                >
                  <span className={styles.title}>
                    {draft.content.title.trim() || "제목 없는 글"}
                  </span>
                  <span className={styles.meta}>
                    마지막 저장:{" "}
                    {draft.updatedAt
                      ? new Date(draft.updatedAt).toLocaleString("ko-KR")
                      : "저장 시각 없음"}
                    {draft.id === currentId && " · 현재 작성 중"}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  disabled={!!deletingId}
                  aria-label={`${draft.content.title.trim() || "제목 없는 글"} 초안 삭제`}
                  onClick={() => remove(draft)}
                >
                  {deletingId === draft.id ? "삭제 중…" : "삭제"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
