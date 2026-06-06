"use client";
import styles from "./writePage.module.css";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/imageUploader/ImageUploader";
import { ICommand } from "@uiw/react-md-editor";
import dynamic from "next/dynamic";
import { usePostEditor } from "@/hooks/write/useWritePage";
import PostSettingModal from "@/components/postSettingModal/PostSettingModal";

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
    setUploadedImages,
    closeModal,
    setTriggerImageUpload,
    handlePublishClick,
    handleFinalPublish,
    handleImageUploaded,
    resetImageUploadTrigger,
    uploadedImages,
    thumbnailImg,
    setThumbnailImg,
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
        className={styles.titleInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
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
          setAvailableTags={() => {}}
          onPublish={handleFinalPublish}
          uploadedImages={uploadedImages}
          thumbnailImg={thumbnailImg}
          setThumbnailImg={setThumbnailImg}
        />
      )}
    </div>
  );
};

export default WritePage;
