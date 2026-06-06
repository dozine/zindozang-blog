"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ref, uploadBytesResumable, getDownloadURL, getStorage } from "firebase/storage";

import styles from "./ImageUploader.module.css";
import { app } from "@/lib/external/firebase";

interface ImageUploaderProps {
  onImageUploaded?: (url: string | string[]) => void;
  triggerUpload?: boolean;
  onUploadTriggered?: () => void;
}

interface SizedImageResult {
  file: File;
  sizeName: string;
}

const ImageUploader = ({
  onImageUploaded,
  triggerUpload = false,
  onUploadTriggered,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (triggerUpload) {
      handlePlusButtonClick();
      onUploadTriggered?.();
    }
  }, [triggerUpload, onUploadTriggered]);

  const handlePlusButtonClick = () => {
    fileInputRef.current?.click();
  };

  const createMultipleSizes = async (file: File): Promise<SizedImageResult[]> => {
    const sizes = [
      { name: "card", width: 400, height: 300 },
      { name: "medium", width: 800, height: 600 },
      { name: "large", width: 1200, height: 900 },
    ];

    const results: SizedImageResult[] = [];

    for (const size of sizes) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      const resizedFile = await new Promise<File>((resolve) => {
        img.onload = () => {
          // 원본 비율 유지하면서 리사이징
          const aspectRatio = img.width / img.height;
          let { width, height } = size;

          if (aspectRatio > width / height) {
            height = width / aspectRatio;
          } else {
            width = height * aspectRatio;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              }
            },
            file.type,
            0.8
          );
        };
        img.src = URL.createObjectURL(file);
      });

      results.push({
        file: resizedFile,
        sizeName: size.name,
      });
    }

    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setProgress(0);
    setUploading(true);

    try {
      if (file.size > 3 * 1024 * 1024) {
        setUploadError("파일 크기는 3MB 이하여야 합니다.");
        setUploading(false);
        return;
      }

      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setUploadError("지원되는 이미지 형식은 JPEG, PNG, GIF, WEBP입니다.");
        setUploading(false);
        return;
      }

      const imageSizes: SizedImageResult[] = await createMultipleSizes(file);
      const storage = getStorage(app);
      const timestamp = new Date().getTime();
      const uploadedUrls: { [key: string]: string } = {};

      for (let i = 0; i < imageSizes.length; i++) {
        const { file: sizedFile, sizeName } = imageSizes[i];
        const fileName = `images/${timestamp}_${sizeName}_${sizedFile.name}`;
        const storageRef = ref(storage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, sizedFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (i / imageSizes.length +
                  snapshot.bytesTransferred / snapshot.totalBytes / imageSizes.length) *
                100;
              setProgress(Math.round(progress));
            },
            (error) => {
              console.error("업로드 오류:", error);
              setUploadError("이미지 업로드 중 오류가 발생했습니다: " + error.message);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                uploadedUrls[sizeName] = downloadURL;
                resolve();
              } catch (err: any) {
                console.error("다운로드 URL 가져오기 실패:", err);
                reject(err);
              }
            }
          );
        });
      }

      const urlArray: string[] = [uploadedUrls.card, uploadedUrls.medium, uploadedUrls.large];

      onImageUploaded?.(urlArray);
      setProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("이미지 업로드 오류:", error);
      setUploadError("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.plusButton} onClick={handlePlusButtonClick} disabled={uploading}>
        <Image src="/plus.png" alt="Add content" width={24} height={24} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*"
      />
      {uploading && (
        <div className={styles.uploadStatus}>
          <p>업로드 중 ... </p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}
      {uploadError && (
        <div className={styles.uploadError}>
          <p style={{ color: "red" }}>{uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
