"use client";
import { useSession } from "next-auth/react";
import styles from "./tagList.module.css";
import DeleteTagModal from "../tagModal/DeleteTagModal";
import { useTagActions } from "@/hooks/tag/useTagAction";

const TagList = ({ tags, selectedTags = [], onTagClick, onTagDelete }) => {
  const { status } = useSession();

  const {
    menuOpen,
    toggleMenu,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    handleSuccessDelete,
  } = useTagActions(onTagDelete);

  return (
    <div className={styles.container}>
      {status === "authenticated" && (
        <div className={styles.menuContainer}>
          <div className={styles.menuWrapper}>
            <button className={styles.menuButton} onClick={toggleMenu}>
              태그 관리
            </button>
            {menuOpen && (
              <div className={styles.menu}>
                <button onClick={openDeleteModal}>삭제하기</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.tagGrid}>
        {tags && tags.length > 0 ? (
          tags.map((tag) => {
            const isActive = selectedTags.includes(tag.name);
            return (
              <button
                key={tag.id || tag.name}
                onClick={() => onTagClick && onTagClick(tag.name)}
                className={`${styles.tag} ${isActive ? styles.activeTag : ""}`}
              >
                {tag.name} ({tag._count?.posts ?? 0})
              </button>
            );
          })
        ) : (
          <p>사용 가능한 태그가 없습니다.</p>
        )}
      </div>

      <DeleteTagModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onSuccessDelete={handleSuccessDelete}
        tags={tags}
      />
    </div>
  );
};

export default TagList;
