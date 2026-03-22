import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tag } from "@prisma/client";
import { useModal } from "@/hooks/useModal";
import { UpdatePostBody } from "@/types";
import { createPost, updatePost } from "@/lib/services/postService";
import { usePostDataLoader } from "./useWritePageData";

export const usePostEditor = () => {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isEditing: boolean = searchParams.get("edit") === "true";
  const editSlug: string = searchParams.get("slug") || "";

  const {
    isLoading: isDataLoading,
    postToEdit,
    categories,
    availableTags,
  } = usePostDataLoader({
    isEditing,
    editSlug,
    isAuthenticated: status === "authenticated",
    onPostLoadError: (message) => alert(message),
    onNavigate: (path) => router.push(path),
  });

  const [media, setMedia] = useState<string | string[] | null>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [thumbnailImg, setThumbnailImg] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { isOpen: showSettingsModal, openModal, closeModal } = useModal();

  const [catSlug, setCatSlug] = useState<string>("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>("");
  const [triggerImageUpload, setTriggerImageUpload] = useState<boolean>(false);

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setValue(postToEdit.desc);
      const imgs = postToEdit.img || [];
      setMedia(Array.isArray(imgs) ? imgs[0] || "" : imgs);
      setUploadedImages(Array.isArray(imgs) ? imgs : imgs ? [imgs] : []);
      setThumbnailImg(Array.isArray(imgs) ? imgs[0] || "" : imgs || "");
      setCatSlug(postToEdit.catSlug || "");
      setIsPublished(Boolean(postToEdit.isPublished));
      setTags(postToEdit.tags || []);
    }
  }, [postToEdit]);

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

    setMedia(imageUrl);
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
    const finalCatSlug: string = catSlug || "uncategorized";
    setIsSubmitting(true);

    try {
      if (isEditing && editSlug) {
        const updateBody: UpdatePostBody = {
          title,
          desc: value,
          img: thumbnailImg ? [thumbnailImg] : [],
          catSlug: finalCatSlug,
          tags: tagIds,
          isPublished,
        };
        await updatePost(editSlug, updateBody);
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
        router.push(`/posts/${data.slug}`);
      }
    } catch (err: any) {
      console.error("Error submitting post:", err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
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
  ]);

  return {
    status,
    loading: isDataLoading,
    isEditing,
    title,
    value,
    media,
    uploadedImages,
    setUploadedImages,
    thumbnailImg,
    catSlug,
    tags,
    isPublished,
    tagInput,
    showSettingsModal,
    triggerImageUpload,
    categories,
    availableTags,
    setTitle,
    setValue,
    setMedia,
    setThumbnailImg,
    setCatSlug,
    setTags,
    setIsPublished,
    setTagInput,
    closeModal,
    setTriggerImageUpload,
    handlePublishClick,
    handleFinalPublish,
    handleImageUploaded,
    resetImageUploadTrigger,
  };
};
