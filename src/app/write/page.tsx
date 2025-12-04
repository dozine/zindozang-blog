"use client";
import React from "react";
import styles from "./writePage.module.css";
import { useRouter } from "next/navigation";
import PostSettingModal from "@/components/postSettingModal/PostSettingModal";
import ImageUploader from "@/components/imageUploader/ImageUploader";
import { ICommand } from "@uiw/react-md-editor";
import dynamic from "next/dynamic";
import { usePostEditor } from "@/hooks/write/useWritePage";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const WritePage = () => {
  const router = useRouter();

  const {
    status,
    loading,
    isEditing,
    title,
    value,
    media,
    showSettingsModal,
    catSlug,
    tags,
    isPublished,
    tagInput,
    categories,
    availableTags,
    triggerImageUpload,

    setTitle,
    setValue,
    setMedia,
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
  } = usePostEditor();

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
          setAvailableTags={() => {}}
          onPublish={handleFinalPublish}
        />
      )}
    </div>
  );
};

export default WritePage;
