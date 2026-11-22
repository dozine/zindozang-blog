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

  const prepareImage = async (file: File): Promise<File> => {
    if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
    const img = new window.Image();

    return new Promise<File>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이미지를 읽을 수 없습니다."));
      };
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const scale = Math.min(1, 800 / img.width, 600 / img.height);
          if (scale === 1) {
            resolve(file);
            return;
          }
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("이미지를 변환할 수 없습니다."));
            return;
          }
          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File(
                  [blob],
                  blob.type === file.type ? file.name : `${file.name.replace(/\.[^.]+$/, "")}.png`,
                  {
                    type: blob.type,
                    lastModified: Date.now(),
                  }
                );
                resolve(resizedFile);
              } else {
                reject(new Error("이미지 변환에 실패했습니다."));
              }
            },
            file.type,
            0.8
          );
        } catch {
          reject(new Error("이미지 변환에 실패했습니다."));
        }
      };
      img.src = objectUrl;
    });
  };

  const uploadFile = async (file: File, fileIndex: number, totalFiles: number) => {
    if (file.size > 10 * 1024 * 1024) throw new Error("파일 크기는 10MB 이하여야 합니다.");
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type))
      throw new Error("지원되는 이미지 형식은 JPEG, PNG, GIF, WEBP, SVG입니다.");
    const sizedFile = await prepareImage(file);
    const storage = getStorage(app);
    const uploadId = crypto.randomUUID();
    const fileName = `images/${uploadId}_medium_${sizedFile.name}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, sizedFile);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const fraction =
            snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
          setProgress(Math.round(((fileIndex + fraction) / totalFiles) * 100));
        },
        reject,
        async () => {
          try {
            resolve(await getDownloadURL(uploadTask.snapshot.ref));
          } catch (error) {
            reject(error);
          }
        }
      );
    });
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
