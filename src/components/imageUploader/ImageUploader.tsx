"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ref, uploadBytesResumable, getDownloadURL, getStorage } from "firebase/storage";

import styles from "./ImageUploader.module.css";
import { app } from "@/lib/external/firebase";

interface ImageUploaderProps {
  onImagesUploaded?: (urls: string[]) => void;
  triggerUpload?: boolean;
  onUploadTriggered?: () => void;
  onUploadRequested?: () => void;
}

interface SizedImageResult {
  file: File;
  sizeName: string;
}

const ImageUploader = ({
  onImagesUploaded,
  triggerUpload = false,
  onUploadTriggered,
  onUploadRequested,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [fileStatus, setFileStatus] = useState("");
  const uploadInProgress = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlusButtonClick = useCallback(() => {
    if (uploadInProgress.current) return;
    onUploadRequested?.();
    fileInputRef.current?.click();
  }, [onUploadRequested]);

  useEffect(() => {
    if (triggerUpload) {
      handlePlusButtonClick();
      onUploadTriggered?.();
    }
  }, [triggerUpload, onUploadTriggered, handlePlusButtonClick]);

  const createMultipleSizes = async (file: File): Promise<SizedImageResult[]> => {
    const sizes = [
      { name: "card", width: 400, height: 300 },
      { name: "medium", width: 800, height: 600 },
      { name: "large", width: 1200, height: 900 },
    ];

    const outputType = file.type === "image/svg+xml" ? "image/png" : file.type;
    const outputName =
      file.type === "image/svg+xml" ? `${file.name.replace(/\.svg$/i, "")}.png` : file.name;
    const results: SizedImageResult[] = [];

    for (const size of sizes) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      const resizedFile = await new Promise<File>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("이미지를 읽을 수 없습니다."));
        };
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (!ctx) {
            reject(new Error("이미지를 변환할 수 없습니다."));
            return;
          }
          try {
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
                  const resizedFile = new File([blob], outputName, {
                    type: blob.type,
                    lastModified: Date.now(),
                  });
                  resolve(resizedFile);
                } else {
                  reject(new Error("이미지 변환에 실패했습니다."));
                }
              },
              outputType,
              0.8
            );
          } catch {
            reject(new Error("이미지 변환에 실패했습니다."));
          }
        };
        img.src = objectUrl;
      });

      results.push({
        file: resizedFile,
        sizeName: size.name,
      });
    }

    return results;
  };

  const uploadFile = async (file: File, fileIndex: number, totalFiles: number) => {
    if (file.size > 10 * 1024 * 1024) throw new Error("파일 크기는 10MB 이하여야 합니다.");
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type))
      throw new Error("지원되는 이미지 형식은 JPEG, PNG, GIF, WEBP, SVG입니다.");
    const imageSizes: SizedImageResult[] = await createMultipleSizes(file);
    const storage = getStorage(app);
    const uploadId = crypto.randomUUID();
    const uploadedUrls: { [key: string]: string } = {};

    for (let i = 0; i < imageSizes.length; i++) {
      const { file: sizedFile, sizeName } = imageSizes[i];
      const fileName = `images/${uploadId}_${sizeName}_${sizedFile.name}`;
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
            setProgress(Math.round((fileIndex * 100 + progress) / totalFiles));
          },
          (error) => {
            console.error("업로드 오류:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls[sizeName] = downloadURL;
              resolve();
            } catch (err) {
              console.error("다운로드 URL 가져오기 실패:", err);
              reject(err);
            }
          }
        );
      });
    }

    return uploadedUrls.medium;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || uploadInProgress.current) return;
    uploadInProgress.current = true;
    setUploading(true);
    setUploadErrors([]);
    setProgress(0);
    const urls: string[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setFileStatus(`${index + 1}/${files.length} · ${file.name}`);
        try {
          urls.push(await uploadFile(file, index, files.length));
        } catch (error) {
          const reason = error instanceof Error ? error.message : "업로드에 실패했습니다.";
          setUploadErrors((prev) => [...prev, `${file.name}: ${reason}`]);
        }
        setProgress(Math.round(((index + 1) / files.length) * 100));
      }
      if (urls.length) onImagesUploaded?.(urls);
    } finally {
      uploadInProgress.current = false;
      setUploading(false);
      setProgress(0);
      setFileStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.plusButton} onClick={handlePlusButtonClick} disabled={uploading}>
        <Image src="/plus.png" alt="Add content" width={24} height={24} />
      </button>
      <input
        type="file"
        multiple
        disabled={uploading}
        aria-label="사진 선택"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*"
      />
      {uploading && (
        <div className={styles.uploadStatus}>
          <p>업로드 중 {fileStatus}</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}
      {uploadErrors.length > 0 && (
        <div className={styles.uploadError}>
          <ul role="alert">
            {uploadErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
