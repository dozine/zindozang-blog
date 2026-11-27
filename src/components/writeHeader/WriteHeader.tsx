import Link from "next/link";
import styles from "./writeHeader.module.css";

interface WriteHeaderProps {
  isEditing: boolean;
  disabled: boolean;
  onOpenDrafts: () => void;
  onOpenSettings: () => void;
}

export default function WriteHeader({
  isEditing,
  disabled,
  onOpenDrafts,
  onOpenSettings,
}: WriteHeaderProps) {
  return (
    <header className={styles.header}>
      <nav className={styles.inner} aria-label="글 작성 메뉴">
        <Link href="/" className={styles.brand}>
          zindozang
        </Link>
        <div className={styles.actions}>
          {!isEditing && (
            <button
              type="button"
              className={styles.drafts}
              onClick={onOpenDrafts}
              disabled={disabled}
            >
              내 초안
            </button>
          )}
          <button
            type="button"
            className={styles.publish}
            onClick={onOpenSettings}
            disabled={disabled}
          >
            {isEditing ? "수정 반영" : "저장 및 게시"}
          </button>
        </div>
      </nav>
    </header>
  );
}
