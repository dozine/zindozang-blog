"use client";

import { resolvePostSlug } from "@/lib/utils/slug";

import { getErrorMessage } from "@/lib/utils/error";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import CategorySelect from "./CategorySelect";
import styles from "./postSettingModal.module.css";
import type { CategoryData } from "@/types/category";
import type { TagData, TagWithPostCount } from "@/types/tag";
import { useCreateTag } from "@/queries/tag";

export interface PostSettingModalProps {
  postTitle: string;
  slugInput: string;
  setSlugInput: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  catSlug: string;
  setCatSlug: (slug: string) => void;
  isPublished: boolean;
  setIsPublished: (published: boolean) => void;
  tagInput: string;
  setTagInput: (input: string) => void;
  tags: TagData[];
  setTags: (tags: TagData[]) => void;
  categories: CategoryData[];
  availableTags: TagWithPostCount[];
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  isEditing?: boolean;
  feedback?: string;
  onPublish: () => void;
  isSubmitting?: boolean;
  uploadedImages: string[];
  thumbnailImg: string;
  setThumbnailImg: (url: string) => void;
}

const PostSettingModal = ({
  postTitle,
  slugInput,
  setSlugInput,
  isOpen,
  onClose,
  catSlug,
  setCatSlug,
  isPublished,
  setIsPublished,
  tagInput,
  setTagInput,
  tags,
  setTags,
  categories,
  availableTags,
  onSaveDraft,
  isSavingDraft = false,
  isEditing = false,
  feedback,
  onPublish,
  isSubmitting = false,
  uploadedImages,
  thumbnailImg,
  setThumbnailImg,
}: PostSettingModalProps) => {
  const { mutateAsync: createTag, isPending: isCreatingTag } = useCreateTag();
  const [filteredTags, setFilteredTags] = useState<TagWithPostCount[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && tagInputRef.current && process.env.NODE_ENV !== "test") {
      setTimeout(() => tagInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (tagInput.trim()) {
      const filtered = availableTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
          !tags.some((selectedTag) => selectedTag.id === tag.id)
      );
      setFilteredTags(filtered);
    } else {
      setFilteredTags([]);
    }
  }, [tagInput, availableTags, tags]);

  const addTag = (tag: TagWithPostCount): void => {
    if (tags.length >= 5) {
      alert("태그는 최대 5개까지만 추가할 수 있습니다.");
      return;
    }
    if (tag && !tags.some((t) => t.id === tag.id)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
    setShowTagSuggestions(false);
    if (process.env.NODE_ENV !== "test") {
      tagInputRef.current?.focus();
    }
  };

  const createNewTag = async (): Promise<void> => {
    if (!tagInput.trim()) return;
    if (tags.length >= 5) {
      alert("태그는 최대 5개까지만 추가할 수 있습니다.");
      return;
    }
    try {
      const result = await createTag(tagInput);
      if (result.success && result.tag) {
        const newTagWithCount: TagWithPostCount = {
          ...result.tag,
          _count: { posts: 0 },
        };
        addTag(newTagWithCount);
      } else if (result.existingTag) {
        const existingTagWithCount: TagWithPostCount = {
          ...result.existingTag,
          _count: { posts: 0 },
        };
        const foundTag = availableTags.find((t) => t.id === existingTagWithCount.id);
        if (foundTag) {
          addTag(foundTag);
        } else {
          addTag(existingTagWithCount);
        }
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("태그 생성 실패:", err);
      alert(getErrorMessage(err, "태그 생성 중 오류가 발생했습니다."));
    } finally {
      setTagInput("");
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagId: string): void => {
    setTags(tags.filter((tag) => tag.id !== tagId));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-settings-title"
      >
        <h2 id="post-settings-title" className={styles.modalTitle}>
          {isEditing ? "게시글 수정" : "저장 및 게시"}
        </h2>
        <fieldset className={styles.settingsFields} disabled={isSubmitting || isCreatingTag}>
          {/* 썸네일 선택 */}
          {uploadedImages && uploadedImages.length > 0 && (
            <div className={styles.settingSection}>
              <h3>썸네일 선택</h3>
              <div className={styles.thumbnailGrid}>
                {uploadedImages.map((url, i) => (
                  <div
                    key={i}
                    className={`${styles.thumbnailItem} ${
                      thumbnailImg === url ? styles.thumbnailSelected : ""
                    }`}
                    onClick={() => {
                      if (!isSubmitting && !isCreatingTag) setThumbnailImg(url);
                    }}
                  >
                    <img src={url} alt={`thumbnail-${i}`} />
                    {thumbnailImg === url && <span className={styles.thumbnailCheck}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.settingSection}>
            <h3>
              <label htmlFor="post-slug">게시글 주소{!isEditing && " (선택)"}</label>
            </h3>
            <div className={styles.slugField}>
              <span>/posts/</span>
              <input
                id="post-slug"
                value={slugInput}
                readOnly={isEditing}
                onChange={(event) => setSlugInput(event.target.value)}
                placeholder="비워두면 제목으로 자동 생성"
                aria-describedby="post-slug-hint"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            <p id="post-slug-hint" className={styles.slugHint}>
              {isEditing
                ? "제목을 수정해도 게시글 주소는 유지됩니다."
                : "비워두면 제목으로 자동 생성됩니다. 공백은 하이픈으로 바뀝니다."}
            </p>
            {!isEditing && resolvePostSlug(postTitle, slugInput) && (
              <p className={styles.slugPreview}>
                예상 주소: /posts/{resolvePostSlug(postTitle, slugInput)}
              </p>
            )}
          </div>

          {/* 카테고리 */}
          <div className={styles.settingSection}>
            <h3>카테고리</h3>
            <CategorySelect
              value={catSlug}
              categories={categories}
              onChange={setCatSlug}
              disabled={isSubmitting || isCreatingTag}
            />
          </div>

          {/* 태그 */}
          <div className={styles.settingSection}>
            <h3>태그 설정</h3>
            <div className={styles.tagsContainer}>
              <div className={styles.tagInputWrapper}>
                <input
                  ref={tagInputRef}
                  type="text"
                  placeholder={tags.length >= 5 ? "태그 최대 5개" : "태그 입력 (최대 5개)"}
                  className={styles.tagInput}
                  value={tagInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredTags.length > 0) {
                        addTag(filteredTags[0]);
                      } else if (tagInput.trim()) {
                        createNewTag();
                      }
                    }
                  }}
                  disabled={tags.length >= 5 || isCreatingTag}
                />
                {tags.length < 5 && tagInput && (
                  <button
                    className={styles.addTagButton}
                    onClick={createNewTag}
                    disabled={isCreatingTag}
                  >
                    +
                  </button>
                )}
              </div>

              {showTagSuggestions && filteredTags.length > 0 && (
                <div className={styles.tagSuggestions}>
                  {filteredTags.slice(0, 5).map((tag: TagWithPostCount) => (
                    <button
                      type="button"
                      key={tag.id}
                      className={styles.tagSuggestion}
                      onClick={() => {
                        if (!isSubmitting && !isCreatingTag) addTag(tag);
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.selectedTags}>
                {tags.map((tag: TagData) => (
                  <span key={tag.id} className={styles.tagBadge}>
                    {tag.name}
                    <button className={styles.removeTagButton} onClick={() => removeTag(tag.id)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 공개 설정 */}
          <div className={styles.settingSection}>
            <h3>공개 설정</h3>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                aria-label="공개 설정"
                checked={isPublished}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setIsPublished(e.target.checked)}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleText}>{isPublished ? "공개" : "비공개"}</span>
            </label>
          </div>
        </fieldset>
        {feedback && (
          <p role="status" className={styles.feedback}>
            {feedback}
          </p>
        )}
        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onClose} disabled={isSubmitting}>
            취소
          </button>
          {!isEditing && onSaveDraft && (
            <button
              className={styles.draftButton}
              onClick={onSaveDraft}
              disabled={isSubmitting || isCreatingTag}
            >
              {isSavingDraft ? "초안 저장 중…" : "초안 저장"}
            </button>
          )}
          <button
            className={styles.publishButton}
            onClick={onPublish}
            disabled={isSubmitting || isCreatingTag}
          >
            {isSubmitting && !isSavingDraft
              ? "저장 중..."
              : isEditing
                ? "수정 반영"
                : isPublished
                  ? "공개 게시"
                  : "비공개 게시"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostSettingModal;
