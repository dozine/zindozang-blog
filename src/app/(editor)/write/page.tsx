import { normalizePostFont } from "@/lib/utils/post";
("use client");
import styles from "./writePage.module.css";
import ImageGridPicker from "@/components/imageGridPicker/ImageGridPicker";
import { arrangeImageGrid } from "@/lib/utils/imageGrid";
import { ThemeContext } from "@/context/ThemeContext";
import { formattingCommands, fontFamilyCommand } from "@/components/writeEditor/toolbar";
import { postRecoverySchema } from "@/lib/zod/postRecovery";
import { useCallback, useContext, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ImageUploader from "@/components/imageUploader/ImageUploader";
import type { ICommand } from "@uiw/react-md-editor";
import dynamic from "next/dynamic";
import { useModal } from "@/hooks/useModal";
import { useCreatePost, usePostQuery, useUpdatePost } from "@/queries/post";
import { useCategoriesQuery } from "@/queries/category";
import { useTagsQuery } from "@/queries/tag";
import { getErrorMessage } from "@/lib/utils/error";
import type { TagData } from "@/types/tag";
import type { UpdatePostRequest } from "@/types/api/post";
import { DEFAULT_POST_FONT, POST_FONTS } from "@/lib/constants/post";
import type { PostFont } from "@/types/post";
import WriteHeader from "@/components/writeHeader/WriteHeader";
import DraftPicker from "@/components/draftPicker/DraftPicker";
import { useDraftQuery, useSaveDraft, usePublishDraft } from "@/queries/draft";
import type { DraftContent, DraftResponse } from "@/types/api/draft";
import PostSettingModal from "@/components/postSettingModal/PostSettingModal";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const WritePage = () => {
  const { theme } = useContext(ThemeContext);
  const { status, data: session } = useSession();
  const router = useRouter();
  const initializedSlug = useRef<string | null>(null);
  const { mutateAsync: createPost, isPending: isCreating } = useCreatePost();
  const { mutateAsync: updatePost, isPending: isUpdating } = useUpdatePost();
  const { mutateAsync: publishDraft, isPending: isPublishingDraft } = usePublishDraft();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft") || "";
  const detachedDraftContent = useRef<DraftContent | null>(null);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [draftLoadedKey, setDraftLoadedKey] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const { mutateAsync: saveDraft, isPending: draftBusy } = useSaveDraft();
  const [showDraftPicker, setShowDraftPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const actionInProgress = useRef(false);

  const isEditing: boolean = searchParams.get("edit") === "true";
  const editSlug: string = searchParams.get("slug") || "";

  const isAuthenticated = status === "authenticated";
  const draftKey = `${session?.user?.email ?? "local"}:${draftId}`;
  const {
    data: queriedDraft,
    isFetchedAfterMount: isDraftFetchedAfterMount,
    isFetching: isDraftFetching,
    isError: isDraftQueryError,
    error: draftQueryError,
    refetch: refetchDraft,
  } = useDraftQuery(draftId, isAuthenticated && !isEditing && !!draftId);
  const draftError =
    !isEditing && !!draftId && isDraftQueryError
      ? getErrorMessage(draftQueryError, "초안을 불러오지 못했습니다.")
      : "";
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!draftId || isEditing) {
      setDraft(null);
      setDraftLoadedKey(draftKey);
      return;
    }
    if (
      draftLoadedKey === draftKey ||
      !isDraftFetchedAfterMount ||
      isDraftFetching ||
      isDraftQueryError ||
      !queriedDraft
    )
      return;
    setDraft(queriedDraft);
    setDraftLoadedKey(draftKey);
  }, [
    isAuthenticated,
    isEditing,
    draftId,
    draftKey,
    draftLoadedKey,
    queriedDraft,
    isDraftFetchedAfterMount,
    isDraftFetching,
    isDraftQueryError,
  ]);
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategoriesQuery(isAuthenticated);
  const {
    data: availableTags = [],
    isLoading: isTagsLoading,
    isError: isTagsError,
    error: tagsError,
    refetch: refetchTags,
  } = useTagsQuery(isAuthenticated);
  const {
    data: post,
    isFetchedAfterMount: isPostFetchedAfterMount,
    isFetching: isPostFetching,
    isError: isPostError,
    error: postError,
    refetch: refetchPost,
  } = usePostQuery(editSlug, isAuthenticated && isEditing && !!editSlug);
  const waitingForPost =
    isEditing &&
    !!editSlug &&
    initializedSlug.current !== editSlug &&
    (!isPostFetchedAfterMount || isPostFetching) &&
    !isPostError;
  const isLoading =
    isAuthenticated &&
    ((!isEditing && draftLoadedKey !== draftKey && !draftError) ||
      isCategoriesLoading ||
      isTagsLoading ||
      (isEditing && (!editSlug || waitingForPost)));
  const error = postError || categoriesError || tagsError;
  const dataError =
    draftError || (error ? getErrorMessage(error, "데이터를 불러올 수 없습니다.") : null);
  const retryData = () => {
    if (draftError) {
      void refetchDraft();
      return;
    }
    if (isCategoriesError) void refetchCategories();
    if (isTagsError) void refetchTags();
    if (isPostError) void refetchPost();
  };
  const postToEdit =
    !waitingForPost && isPostFetchedAfterMount && !isPostError ? (post ?? null) : null;

  useEffect(() => {
    if (isAuthenticated && isEditing && !editSlug) {
      alert("수정할 게시글의 slug가 없습니다.");
      router.push("/write");
    }
  }, [isAuthenticated, isEditing, editSlug, router]);

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [thumbnailImg, setThumbnailImg] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const imageAnchor = useRef<number | null>(null);
  const previousValue = useRef(value);
  const [imageCaret, setImageCaret] = useState<number | null>(null);

  // 업로드 중 편집된 구간 앞뒤의 공통 부분을 비교해 삽입 위치를 보정한다.
  useEffect(() => {
    const before = previousValue.current;
    if (imageAnchor.current !== null && before !== value) {
      let start = 0;
      while (start < before.length && start < value.length && before[start] === value[start])
        start++;
      let oldEnd = before.length;
      let newEnd = value.length;
      while (oldEnd > start && newEnd > start && before[oldEnd - 1] === value[newEnd - 1]) {
        oldEnd--;
        newEnd--;
      }
      if (imageAnchor.current > oldEnd) imageAnchor.current += newEnd - oldEnd;
      else if (imageAnchor.current >= start) imageAnchor.current = newEnd;
    }
    previousValue.current = value;
  }, [value]);

  useEffect(() => {
    if (imageCaret === null) return;
    const textarea = editorContainerRef.current?.querySelector("textarea");
    textarea?.focus();
    textarea?.setSelectionRange(imageCaret, imageCaret);
    setImageCaret(null);
  }, [value, imageCaret]);

  const rememberImagePosition = useCallback(() => {
    const textarea = editorContainerRef.current?.querySelector("textarea");
    imageAnchor.current = textarea?.selectionStart ?? previousValue.current.length;
  }, []);

  const [fontFamily, setFontFamily] = useState<PostFont>(DEFAULT_POST_FONT);
  const [title, setTitle] = useState<string>("");
  const isSubmitting = isCreating || isUpdating || isPublishingDraft || draftBusy;

  const { isOpen: showSettingsModal, openModal, closeModal } = useModal();

  const [catSlug, setCatSlug] = useState<string>("");
  const [tags, setTags] = useState<TagData[]>([]);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>("");
  const [gridColumns, setGridColumns] = useState<2 | 3 | null>(null);
  const gridPosition = useRef(0);
  const [triggerImageUpload, setTriggerImageUpload] = useState<boolean>(false);

  const postRecoveryKey = `blog:post-recovery:v1:${session?.user?.email ?? "local"}:${isEditing ? `edit:${editSlug}` : draftId ? `draft:${draftId}` : "new"}`;
  const [postRecoveryReady, setPostRecoveryReady] = useState<string | null>(null);
  const [postRecoveryMessage, setPostRecoveryMessage] = useState("");
  const [showRecoveryToast, setShowRecoveryToast] = useState(false);

  useEffect(() => {
    if (!showRecoveryToast) return;
    const timer = window.setTimeout(() => setShowRecoveryToast(false), 4000);
    return () => window.clearTimeout(timer);
  }, [showRecoveryToast]);
  const savedSuccessfully = useRef(false);
  const baseline = useRef("");
  const lastPersisted = useRef("");
  const postRecovery = {
    fontFamily,
    title,
    value,
    uploadedImages,
    thumbnailImg,
    catSlug,
    tags,
    isPublished,
    tagInput,
  };
  const serializedPostRecovery = JSON.stringify(postRecovery);

  useEffect(() => {
    if (
      !isAuthenticated ||
      (!isEditing && draftLoadedKey !== draftKey) ||
      (isEditing && !postToEdit) ||
      postRecoveryReady === postRecoveryKey
    )
      return;
    const imgs = postToEdit?.img ?? [];
    const initial = (!isEditing ? draft?.content : null) ?? {
      fontFamily: normalizePostFont(postToEdit?.fontFamily),
      title: postToEdit?.title ?? "",
      value: postToEdit?.desc ?? "",
      uploadedImages: imgs,
      thumbnailImg: imgs[0] ?? "",
      catSlug: postToEdit?.catSlug ?? "",
      tags: postToEdit?.tags ?? [],
      isPublished: Boolean(postToEdit?.isPublished),
      tagInput: "",
    };
    baseline.current = JSON.stringify(initial);
    savedSuccessfully.current = false;
    const detached = !isEditing && !draftId ? detachedDraftContent.current : null;
    let restored = detached ?? initial;
    if (detached) setPostRecoveryMessage("");
    if (!detached)
      try {
        const legacyKey = postRecoveryKey.replace("blog:post-recovery:", "blog:post-draft:");
        const stored = localStorage.getItem(postRecoveryKey) ?? localStorage.getItem(legacyKey);
        if (stored) {
          const parsed = postRecoverySchema.safeParse(JSON.parse(stored));
          if (
            parsed.success &&
            (!draft?.updatedAt || Date.parse(parsed.data.savedAt) > Date.parse(draft.updatedAt))
          ) {
            restored = parsed.data.content;
            // 기존 이름으로 보관한 내용도 손실 없이 새 키로 옮긴다.
            localStorage.setItem(postRecoveryKey, stored);
            localStorage.removeItem(legacyKey);
            setShowRecoveryToast(true);
            setPostRecoveryMessage("");
          } else if (!parsed.success) {
            setPostRecoveryMessage("기존 자동 복구 데이터를 읽을 수 없습니다.");
          }
        } else {
          setPostRecoveryMessage("");
        }
      } catch {
        setPostRecoveryMessage(
          "자동 복구 데이터를 읽을 수 없습니다. 브라우저 저장소를 확인해주세요."
        );
      }
    detachedDraftContent.current = null;
    lastPersisted.current = JSON.stringify(detached ? initial : restored);
    setFontFamily(normalizePostFont(restored.fontFamily));
    setTitle(restored.title);
    setValue(restored.value);
    setUploadedImages(restored.uploadedImages);
    setThumbnailImg(restored.thumbnailImg);
    setCatSlug(restored.catSlug);
    setTags(restored.tags);
    setIsPublished(restored.isPublished);
    setTagInput(restored.tagInput);
    initializedSlug.current = isEditing ? editSlug : null;
    setPostRecoveryReady(postRecoveryKey);
  }, [
    isAuthenticated,
    isEditing,
    editSlug,
    postToEdit,
    postRecoveryKey,
    postRecoveryReady,
    draftLoadedKey,
    draftKey,
    draft,
  ]);

  useEffect(() => {
    if (!isAuthenticated || postRecoveryReady !== postRecoveryKey || savedSuccessfully.current)
      return;
    if (serializedPostRecovery === lastPersisted.current) return;
    try {
      if (serializedPostRecovery === baseline.current) {
        localStorage.removeItem(postRecoveryKey);
        lastPersisted.current = serializedPostRecovery;
        setPostRecoveryMessage("");
        return;
      }
      localStorage.setItem(
        postRecoveryKey,
        JSON.stringify({
          version: 1,
          savedAt: new Date().toISOString(),
          content: JSON.parse(serializedPostRecovery),
        })
      );
      lastPersisted.current = serializedPostRecovery;
      setPostRecoveryMessage("");
    } catch {
      setPostRecoveryMessage("자동 보관에 실패했습니다. 브라우저 저장 공간과 설정을 확인해주세요.");
    }
  }, [isAuthenticated, postRecoveryKey, postRecoveryReady, serializedPostRecovery]);

  useEffect(() => {
    if (postRecoveryReady !== postRecoveryKey || serializedPostRecovery === baseline.current)
      return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (savedSuccessfully.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [postRecoveryReady, postRecoveryKey, serializedPostRecovery, draft]);

  const clearPostRecovery = useCallback(() => {
    savedSuccessfully.current = true;
    try {
      localStorage.removeItem(postRecoveryKey);
    } catch {
      // 게시글 저장은 성공했으므로 이동을 계속한다.
    }
  }, [postRecoveryKey]);

  const slugify = (str: string) =>
    str
      .normalize("NFC")
      .trim()
      .replace(/[^\w가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

  const handleImagesUploaded = useCallback((imageUrls: string[]) => {
    if (!imageUrls.length) return;
    const markdownImage = imageUrls.map((url) => `\n\n![image](${url})\n\n`).join("");
    const position = Math.min(
      imageAnchor.current ?? previousValue.current.length,
      previousValue.current.length
    );
    imageAnchor.current = null;
    setValue(
      (prevValue) => prevValue.slice(0, position) + markdownImage + prevValue.slice(position)
    );
    setImageCaret(position + markdownImage.length);

    setUploadedImages((prev) => {
      const next = [...prev, ...imageUrls];
      if (prev.length === 0) setThumbnailImg(imageUrls[0]);
      return next;
    });
  }, []);

  const resetImageUploadTrigger = useCallback(() => {
    setTriggerImageUpload(false);
  }, []);

  const handleSaveDraft = async () => {
    if (isEditing || actionInProgress.current || uploading) return;
    actionInProgress.current = true;
    setDraftMessage("");
    try {
      const saved = await saveDraft({
        ...(draft ? { id: draft.id, updatedAt: draft.updatedAt } : {}),
        content: postRecovery,
      });
      setDraft(saved);
      baseline.current = serializedPostRecovery;
      try {
        localStorage.removeItem(postRecoveryKey);
      } catch {
        /* Server save succeeded. */
      }
      closeModal();
      if (!draftId) router.replace(`/write?draft=${encodeURIComponent(saved.id)}`);
    } catch (error) {
      setDraftMessage(getErrorMessage(error, "초안을 저장하지 못했습니다."));
    } finally {
      actionInProgress.current = false;
    }
  };

  const handleSelectDraft = (selected: DraftResponse) => {
    if (selected.id === draft?.id) {
      setShowDraftPicker(false);
      return;
    }
    if (
      serializedPostRecovery !== baseline.current &&
      !window.confirm("저장하지 않은 변경사항이 있습니다. 선택한 초안을 불러올까요?")
    )
      return;
    setShowDraftPicker(false);
    router.replace(`/write?draft=${encodeURIComponent(selected.id)}`);
  };

  const handleDeletedDraft = (deleted: DraftResponse) => {
    const key = `blog:post-recovery:v1:${session?.user?.email ?? "local"}:draft:${deleted.id}`;
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(key.replace("blog:post-recovery:", "blog:post-draft:"));
    } catch {
      /* Deletion succeeded; cleanup is best effort. */
    }
    if (deleted.id === draft?.id) {
      detachedDraftContent.current = postRecovery;
      setDraft(null);
      setShowDraftPicker(false);
      router.replace("/write");
    }
  };

  const handlePublishClick = useCallback(() => {
    setDraftMessage("");
    openModal();
  }, [openModal]);

  const handleFinalPublish = useCallback(async () => {
    if (actionInProgress.current || uploading) return;
    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!value.trim()) return alert("내용을 입력해주세요.");
    actionInProgress.current = true;
    const tagIds: string[] = tags.map((tag) => tag.id);
    const finalCatSlug = catSlug || null;

    try {
      if (isEditing && editSlug) {
        const updateBody: UpdatePostRequest = {
          title,
          desc: value,
          fontFamily,
          img: thumbnailImg ? [thumbnailImg] : [],
          catSlug: finalCatSlug,
          tags: tagIds,
          isPublished,
        };
        await updatePost({ slug: editSlug, body: updateBody });
        clearPostRecovery();
        alert("게시글이 성공적으로 수정되었습니다.");
        closeModal();
        router.push(`/posts/${editSlug}`);
      } else if (draft) {
        const data = await publishDraft({
          id: draft.id,
          body: {
            title,
            desc: value,
            fontFamily,
            img: thumbnailImg ? [thumbnailImg] : [],
            catSlug: finalCatSlug,
            tags: tagIds,
            isPublished,
            updatedAt: draft.updatedAt,
          },
        });
        clearPostRecovery();
        closeModal();
        router.push(`/posts/${data.slug}`);
      } else {
        const createBody = {
          title,
          desc: value,
          fontFamily,
          img: thumbnailImg ? [thumbnailImg] : [],
          slug: slugify(title) || `post-${crypto.randomUUID()}`,
          catSlug: finalCatSlug,
          tags: tagIds,
          isPublished,
        };
        const data = await createPost(createBody);
        clearPostRecovery();
        closeModal();
        router.push(`/posts/${data.slug}`);
      }
    } catch (err) {
      console.error("Error submitting post:", err);
      alert(getErrorMessage(err, "게시글 저장 중 오류가 발생했습니다."));
    } finally {
      actionInProgress.current = false;
    }
  }, [
    isEditing,
    editSlug,
    title,
    value,
    fontFamily,
    thumbnailImg,
    catSlug,
    tags,
    isPublished,
    router,
    closeModal,
    createPost,
    updatePost,
    clearPostRecovery,
    draft,
    publishDraft,
    uploading,
  ]);

  const customCommands: ICommand[] = [
    {
      name: "image",
      keyCommand: "image",
      buttonProps: { "aria-label": "Add image" },
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      execute: () => {
        setTriggerImageUpload(true);
      },
    },
    {
      name: "image-grid-2",
      keyCommand: "image-grid-2",
      buttonProps: { "aria-label": "2열 이미지 그리드" },
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="8" height="18" rx="1" />
          <rect x="13" y="3" width="8" height="18" rx="1" />
        </svg>
      ),
      execute: (state) => {
        gridPosition.current = state.selection.start;
        setGridColumns(2);
      },
    },
    {
      name: "image-grid-3",
      keyCommand: "image-grid-3",
      buttonProps: { "aria-label": "3열 이미지 그리드" },
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="3" width="6" height="18" rx="1" />
          <rect x="9" y="3" width="6" height="18" rx="1" />
          <rect x="16" y="3" width="6" height="18" rx="1" />
        </svg>
      ),
      execute: (state) => {
        gridPosition.current = state.selection.start;
        setGridColumns(3);
      },
    },
  ];

  const header = (
    <WriteHeader
      isEditing={isEditing}
      disabled={status !== "authenticated" || isLoading || !!dataError || isSubmitting || uploading}
      onOpenDrafts={() => setShowDraftPicker(true)}
      onOpenSettings={handlePublishClick}
    />
  );

  if (status === "loading" || isLoading) {
    return (
      <>
        {header}
        <main className={styles.loading}>Loading...</main>
      </>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  if (dataError) {
    return (
      <>
        {header}
        <main className={styles.loading}>
          데이터를 불러오지 못했습니다: {dataError} <button onClick={retryData}>다시 시도</button>
        </main>
      </>
    );
  }

  return (
    <>
      {header}
      <main className={styles.container}>
        {showRecoveryToast && (
          <div className={styles.recoveryToast} role="status" aria-live="polite">
            <span>작성 중이던 내용을 복구했습니다.</span>
            <button
              type="button"
              aria-label="복구 알림 닫기"
              onClick={() => setShowRecoveryToast(false)}
            >
              ×
            </button>
          </div>
        )}
        <fieldset className={styles.editorFields} disabled={isSubmitting}>
          <input
            type="text"
            placeholder="Title"
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {!isEditing && draft && (
            <p role="status" className={styles.postRecoveryStatus}>
              초안 · 마지막 저장:{" "}
              {draft.updatedAt
                ? new Date(draft.updatedAt).toLocaleString("ko-KR")
                : "저장 시각 없음"}
            </p>
          )}
          {postRecoveryMessage && (
            <p role="status" className={styles.postRecoveryStatus}>
              {postRecoveryMessage}
            </p>
          )}
          <ImageUploader
            onUploadingChange={setUploading}
            onImagesUploaded={handleImagesUploaded}
            onUploadRequested={rememberImagePosition}
            triggerUpload={triggerImageUpload}
            onUploadTriggered={resetImageUploadTrigger}
          />

          {uploadedImages.length > 0 && (
            <div
              className={styles.imagePreviewList}
              role="region"
              aria-label={`업로드한 사진 ${uploadedImages.length}장`}
              tabIndex={0}
            >
              {uploadedImages.map((url, i) => (
                <div key={i} className={styles.imagePreviewItem}>
                  <img src={url} alt={`uploaded-${i}`} />
                  <div className={styles.imagePreviewInfo}>
                    <span className={styles.imagePreviewIndex}>#{i + 1}</span>
                    {thumbnailImg === url && (
                      <span className={styles.imagePreviewThumb}>썸네일</span>
                    )}
                  </div>
                  <button
                    className={styles.imagePreviewRemove}
                    onClick={() => {
                      const next = uploadedImages.filter((_, idx) => idx !== i);
                      setUploadedImages(next);
                      if (thumbnailImg === url) {
                        setThumbnailImg(next[0] || "");
                      }
                      setValue((prev) =>
                        prev
                          .replace(`\n\n![image](${url})\n\n`, "")
                          .replace(`![image](${url})`, "")
                          .replace(`![](${url})`, "")
                      );
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            ref={editorContainerRef}
            data-color-mode={theme === "dark" ? "dark" : "light"}
            className={styles.editorContainer}
            style={{ "--post-font-family": POST_FONTS[fontFamily].family } as CSSProperties}
          >
            <MDEditor
              value={value}
              onChange={(val) => setValue(val || "")}
              height={560}
              minHeight={400}
              textareaProps={{ "aria-label": "본문", placeholder: "여기에 이야기를 적어보세요…" }}
              commands={[
                fontFamilyCommand(fontFamily, setFontFamily),
                ...formattingCommands,
                ...customCommands,
              ]}
            />
          </div>

          {uploading && <p role="status">사진 업로드가 끝나면 저장할 수 있습니다.</p>}
          {draftMessage && <p role="status">{draftMessage}</p>}
        </fieldset>

        {showDraftPicker && (
          <DraftPicker
            currentId={draft?.id}
            onClose={() => setShowDraftPicker(false)}
            onDeleted={handleDeletedDraft}
            onSelect={handleSelectDraft}
          />
        )}

        {gridColumns !== null && (
          <ImageGridPicker
            columns={gridColumns}
            images={[
              ...new Set([
                ...uploadedImages,
                ...Array.from(value.matchAll(/!\[[^\]]*\]\(([^\s)]+)\)/g), (match) => match[1]),
              ]),
            ]}
            onClose={() => setGridColumns(null)}
            onConfirm={(urls) => {
              const result = arrangeImageGrid(value, urls, gridColumns, gridPosition.current);
              setValue(result.value);
              setImageCaret(result.caret);
              setGridColumns(null);
            }}
          />
        )}
        {showSettingsModal && (
          <PostSettingModal
            isOpen={showSettingsModal}
            onClose={closeModal}
            catSlug={catSlug}
            setCatSlug={setCatSlug}
            isPublished={isPublished}
            setIsPublished={setIsPublished}
            tagInput={tagInput}
            setTagInput={setTagInput}
            tags={tags}
            setTags={setTags}
            categories={categories}
            availableTags={availableTags}
            onSaveDraft={isEditing ? undefined : handleSaveDraft}
            isEditing={isEditing}
            isSavingDraft={draftBusy}
            feedback={draftMessage}
            onPublish={handleFinalPublish}
            isSubmitting={isSubmitting || uploading}
            uploadedImages={uploadedImages}
            thumbnailImg={thumbnailImg}
            setThumbnailImg={setThumbnailImg}
          />
        )}
      </main>
    </>
  );
};

export default WritePage;
