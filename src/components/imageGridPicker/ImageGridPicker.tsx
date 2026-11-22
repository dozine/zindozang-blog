"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./imageGridPicker.module.css";

interface Props {
  columns: 2 | 3;
  images: string[];
  onClose: () => void;
  onConfirm: (urls: string[]) => void;
}

export default function ImageGridPicker({ columns, images, onClose, onConfirm }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="image-grid-title"
      onCancel={onClose}
    >
      <h2 id="image-grid-title">사진 {columns}열 배치</h2>
      <p>사진을 배치할 순서대로 선택하세요. 선택한 독립 사진은 본문에서 이동합니다.</p>
      {images.length === 0 ? (
        <p>먼저 사진을 업로드해주세요.</p>
      ) : (
        <div className={styles.images}>
          {images.map((url, index) => {
            const order = selected.indexOf(url);
            return (
              <button
                type="button"
                key={url}
                aria-label={`사진 ${index + 1}`}
                aria-pressed={order >= 0}
                onClick={() =>
                  setSelected((prev) =>
                    order >= 0 ? prev.filter((item) => item !== url) : [...prev, url]
                  )
                }
              >
                <img src={url} alt={`배치 후보 ${index + 1}`} />
                {order >= 0 && <span>{order + 1}</span>}
              </button>
            );
          })}
        </div>
      )}
      <p>{selected.length}장 선택 · 최소 2장 · 모바일에서는 1열로 표시됩니다.</p>
      <div className={styles.actions}>
        <button type="button" onClick={onClose}>
          취소
        </button>
        <button type="button" disabled={selected.length < 2} onClick={() => onConfirm(selected)}>
          배치하기
        </button>
      </div>
    </dialog>
  );
}
