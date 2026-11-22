"use client";
import styles from "./writePage.module.css";
import { postRecoverySchema } from "@/lib/zod/postRecovery";
import { useCallback, useEffect, useRef, useState } from "react";
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
import PostSettingModal from "@/components/postSettingModal/PostSettingModal";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const WritePage = () => {
  const { status, data: session } = useSession();
  const router = useRouter();
  const initializedSlug = useRef<string | null>(null);
  const { mutateAsync: createPost, isPending: isCreating } = useCreatePost();
  const { mutateAsync: updatePost, isPending: isUpdating } = useUpdatePost();
  const searchParams = useSearchParams();

  const isEditing: boolean = searchParams.get("edit") === "true";
  const editSlug: string = searchParams.get("slug") || "";

  const isAuthenticated = status === "authenticated";
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
    (isCategoriesLoading || isTagsLoading || (isEditing && (!editSlug || waitingForPost)));
  const error = postError || categoriesError || tagsError;
  const dataError = error ? getErrorMessage(error, "데이터를 불러올 수 없습니다.") : null;
  const retryData = () => {
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
  const [title, setTitle] = useState<string>("");
  const isSubmitting = isCreating || isUpdating;

  const { isOpen: showSettingsModal, openModal, closeModal } = useModal();

  const [catSlug, setCatSlug] = useState<string>("");
  const [tags, setTags] = useState<TagData[]>([]);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>("");
  const [triggerImageUpload, setTriggerImageUpload] = useState<boolean>(false);

  const postRecoveryKey = `blog:post-recovery:v1:${session?.user?.email ?? "local"}:${isEditing ? `edit:${editSlug}` : "new"}`;
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
    if (!isAuthenticated || (isEditing && !postToEdit) || postRecoveryReady === postRecoveryKey)
      return;
    const imgs = postToEdit?.img ?? [];
    const initial = {
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
    let restored = initial;
    try {
      const legacyKey = postRecoveryKey.replace("blog:post-recovery:", "blog:post-draft:");
      const stored = localStorage.getItem(postRecoveryKey) ?? localStorage.getItem(legacyKey);
      if (stored) {
        const parsed = postRecoverySchema.safeParse(JSON.parse(stored));
        if (parsed.success) {
          restored = parsed.data.content;
          // 기존 이름으로 보관한 내용도 손실 없이 새 키로 옮긴다.
          localStorage.setItem(postRecoveryKey, stored);
          localStorage.removeItem(legacyKey);
          setShowRecoveryToast(true);
          setPostRecoveryMessage("작성 내용이 이 브라우저에 자동 보관되었습니다.");
        } else {
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
    lastPersisted.current = JSON.stringify(restored);
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
  }, [isAuthenticated, isEditing, editSlug, postToEdit, postRecoveryKey, postRecoveryReady]);

  useEffect(() => {
    if (!isAuthenticated || postRecoveryReady !== postRecoveryKey || savedSuccessfully.current)
      return;
    if (serializedPostRecovery === lastPersisted.current) return;
    try {
      if (serializedPostRecovery === baseline.current) {
        localStorage.removeItem(postRecoveryKey);
        lastPersisted.current = serializedPostRecovery;
        setPostRecoveryMessage("저장할 변경사항이 없습니다.");
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
      setPostRecoveryMessage("작성 내용이 이 브라우저에 자동 보관되었습니다.");
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
  }, [postRecoveryReady, postRecoveryKey, serializedPostRecovery]);

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

  const handleImageUploaded = useCallback((url: string | string[]) => {
    let imageUrl = "";
    if (Array.isArray(url)) {
      imageUrl = url[1] || url[0];
    } else {
      imageUrl = url;
    }

    const markdownImage = `\n\n![image](${imageUrl})\n\n`;
    setValue((prevValue) => prevValue + markdownImage);

    setUploadedImages((prev) => {
      const next = [...prev, imageUrl];
      if (next.length === 1) setThumbnailImg(imageUrl);
      return next;
    });
  }, []);

  const resetImageUploadTrigger = useCallback(() => {
    setTriggerImageUpload(false);
  }, []);

  const handlePublishClick = useCallback(() => {
    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!value.trim()) return alert("내용을 입력해주세요.");
    openModal();
  }, [title, value, openModal]);

  const handleFinalPublish = useCallback(async () => {
    const tagIds: string[] = tags.map((tag) => tag.id);
    const finalCatSlug = catSlug || null;

    try {
      if (isEditing && editSlug) {
        const updateBody: UpdatePostRequest = {
          title,
          desc: value,
          img: thumbnailImg ? [thumbnailImg] : [],
          catSlug: finalCatSlug,
          tags: tagIds,
          isPublished,
        };
        await updatePost({ slug: editSlug, body: updateBody });
        clearPostRecovery();
        alert("게시글이 성공적으로 수정되었습니다.");
        router.push(`/posts/${editSlug}`);
      } else {
        const createBody = {
          title,
          desc: value,
          img: thumbnailImg ? [thumbnailImg] : [],
          slug: slugify(title),
          catSlug: finalCatSlug,
          tags: tagIds,
          isPublished,
        };
        const data = await createPost(createBody);
        clearPostRecovery();
        router.push(`/posts/${data.slug}`);
      }
    } catch (err) {
      console.error("Error submitting post:", err);
      alert(getErrorMessage(err, "게시글 저장 중 오류가 발생했습니다."));
    } finally {
      closeModal();
    }
  }, [
    isEditing,
    editSlug,
    title,
    value,
    thumbnailImg,
    catSlug,
    tags,
    isPublished,
    router,
    closeModal,
    createPost,
    updatePost,
    clearPostRecovery,
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
      execute: (state, api) => {
        api.replaceSelection(
          `<div class="img-grid-2">

![](이미지URL1)

![](이미지URL2)

</div>`
        );
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
      execute: (state, api) => {
        api.replaceSelection(
          `<div class="img-grid-3">
          ![](이미지URL1)
          ![](이미지URL2)
          ![](이미지URL3)
          </div>`
        );
      },
    },
  ];

  if (status === "loading" || isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  if (dataError) {
    return (
      <div className={styles.loading}>
        데이터를 불러오지 못했습니다: {dataError} <button onClick={retryData}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
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
      <input
        type="text"
        placeholder="Title"
        className={styles.titleInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <p role="status" className={styles.postRecoveryStatus}>
        {postRecoveryMessage || "작성 내용은 이 브라우저에 자동 보관됩니다."}
      </p>
      <ImageUploader
        onImageUploaded={handleImageUploaded}
        triggerUpload={triggerImageUpload}
        onUploadTriggered={resetImageUploadTrigger}
      />

      {uploadedImages.length > 0 && (
        <div className={styles.imagePreviewList}>
          {uploadedImages.map((url, i) => (
            <div key={i} className={styles.imagePreviewItem}>
              <img src={url} alt={`uploaded-${i}`} />
              <div className={styles.imagePreviewInfo}>
                <span className={styles.imagePreviewIndex}>#{i + 1}</span>
                {thumbnailImg === url && <span className={styles.imagePreviewThumb}>썸네일</span>}
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

      <div data-color-mode="light" className={styles.editorContainer}>
        <MDEditor
          value={value}
          onChange={(val) => setValue(val || "")}
          style={{ minHeight: 500 }}
          commands={customCommands}
        />
      </div>

      <button className={styles.publish} onClick={handlePublishClick}>
        {isEditing ? "Edit" : "Publish"}
      </button>

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
          onPublish={handleFinalPublish}
          isSubmitting={isSubmitting}
          uploadedImages={uploadedImages}
          thumbnailImg={thumbnailImg}
          setThumbnailImg={setThumbnailImg}
        />
      )}
    </div>
  );
};

export default WritePage;
