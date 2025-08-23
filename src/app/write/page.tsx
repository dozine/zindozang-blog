"use client";
import React from "react";
import styles from "./writePage.module.css";
import { useEffect, useState } from "react";
import "react-quill-new/dist/quill.bubble.css";
import "react-quill-new/dist/quill.snow.css";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import PostSettingModal from "@/components/postSettingModal/PostSettingModal";
import ImageUploader from "@/components/imageUploader/ImageUploader";
import { Category, Tag } from "@prisma/client";
import { TagWithPostCount } from "@/types/tag";
import { PostWithFormattedTags, UpdatePostBody } from "@/types";
import { ICommand } from "@uiw/react-md-editor";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const WritePage = () => {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing: boolean = searchParams.get("edit") === "true";
  const editSlug: string = searchParams.get("slug");

  const [media, setMedia] = useState<string | string[] | null>("");
  const [value, setValue] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [catSlug, setCatSlug] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<TagWithPostCount[]>([]);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [triggerImageUpload, setTriggerImageUpload] = useState<boolean>(false);

  useEffect(() => {
    if (isEditing && editSlug) {
      const fetchPost = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/posts/${editSlug}`);
          if (!res.ok) throw new Error("게시글을 불러올 수 없습니다.");

          const post: PostWithFormattedTags = await res.json();
          setTitle(post.title);
          setValue(post.desc);
          setMedia(post.img || "");
          setCatSlug(post.catSlug || "");
          setIsPublished(Boolean(post.isPublished));

          if (post.tags && Array.isArray(post.tags)) {
            setTags(post.tags);
          }
        } catch (err) {
          console.error("게시글 불러오기 실패:", err);
          alert("게시글을 불러올 수 없습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    } else if (isEditing && !editSlug) {
      console.error("수정할 게시글의 slug가 없습니다.");
      router.push("/write");
    }
  }, [isEditing, editSlug, router]);

  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("카테고리를 불러올 수 없습니다.");
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (err: any) {
        console.error("카테고리 가져오기 실패:", err);
      }
    };
    getCategories();
  }, []);

  useEffect(() => {
    const fetchAvailableTags = async () => {
      try {
        const res = await fetch("/api/tags");
        if (!res.ok) throw new Error("태그를 불러올 수 없습니다.");

        const data: TagWithPostCount[] = await res.json();
        setAvailableTags(data);
      } catch (err: any) {
        console.error("태그 불러오기 실패:", err);
      }
    };
    fetchAvailableTags();
  }, []);

  const handlePublishClick = () => {
    if (!title.trim()) return alert("제목을 입력해주세요.");
    if (!value.trim()) return alert("내용을 입력해주세요.");
    setShowSettingsModal(true);
  };

  const handleImageUploaded = (url: string | string[]) => {
    let imageUrl = "";
    if (Array.isArray(url)) {
      // 배열인 경우 medium 크기 이미지 사용 (두 번째 요소)
      imageUrl = url[1] || url[0];
      console.log("이미지 업로드 완료 (배열):", url[1] || url[0]);
    } else {
      // 단일 URL인 경우
      console.log("이미지 업로드 완료 (단일):", url);
      imageUrl = url;
    }
    const markdownImage = `\n\n![image](${imageUrl})\n\n`;
    setValue((prevValue) => prevValue + markdownImage);
    setMedia(imageUrl);
  };

  const resetImageUploadTrigger = () => {
    setTriggerImageUpload(false);
  };

  const slugify = (str: string) =>
    str
      .normalize("NFC")
      .trim()
      .replace(/[^\w가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

  const handleFinalPublish = async () => {
    const tagIds: string[] = tags.map((tag) => tag.id);
    const finalCatSlug: string = catSlug || "uncategorized";
    setLoading(true);
    try {
      if (isEditing && editSlug) {
        const updateBody: UpdatePostBody = {
          title,
          desc: value,
          img: media,
          catSlug: finalCatSlug,
          tags: tagIds,
          isPublished,
        };
        const res = await fetch(`/api/posts/${editSlug}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateBody),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.log("Error response data:", errorData);
          throw new Error(errorData.message || "게시글 수정에 실패했습니다.");
        }

        alert("게시글이 성공적으로 수정되었습니다.");
        router.push(`/posts/${editSlug}`);
      } else {
        const createBody = {
          title,
          desc: value,
          img: Array.isArray(media) ? media : media ? [media] : [],
          slug: slugify(title),
          catSlug: finalCatSlug,
          tags: tagIds,
          isPublished,
        };

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createBody),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "게시글 작성에 실패했습니다.");
        }

        const data: { slug: string } = await res.json();
        console.log("slug after submit:", data.slug);
        router.push(`/posts/${data.slug}`);
      }
    } catch (err) {
      console.error("Error submitting post:", err);
      alert(err.message);
    } finally {
      setLoading(false);
      setShowSettingsModal(false);
    }
  };

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
        console.log("이미지 업로드 트리거");
        setTriggerImageUpload(true);
      },
    },
  ];
  if (status === "loading" || loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }
  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Title"
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <ImageUploader
        onImageUploaded={handleImageUploaded}
        triggerUpload={triggerImageUpload}
        onUploadTriggered={resetImageUploadTrigger}
      />

      {media && typeof media === "string" && (
        <div className={styles.imagePreview}>
          <img
            src={media}
            alt="업로드된 이미지"
            style={{
              maxWidth: "300px",
              maxHeight: "200px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid var(--soft-textColor)",
            }}
          />
          <button
            onClick={() => setMedia("")}
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "none",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
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
        {isEditing ? "수정하기" : "Publish"}
      </button>
      {showSettingsModal && (
        <PostSettingModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
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
          setAvailableTags={setAvailableTags}
          onPublish={() => {
            handleFinalPublish();
            setShowSettingsModal(false);
          }}
        />
      )}
    </div>
  );
};

export default WritePage;
