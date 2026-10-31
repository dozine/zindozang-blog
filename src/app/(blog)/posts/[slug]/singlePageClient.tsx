"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import PostDeleteModal from "@/components/modal/postModal/PostDeleteModal";
import styles from "./singlePage.module.css";
import type { PostDetailView } from "@/types/post";
import { FaEllipsisH, FaEye } from "react-icons/fa";
import { usePostActions } from "@/hooks/post/usePostAction";
import { useUtterances } from "@/hooks/useUtterances";
import PostContent from "@/components/post/PostContent";

export interface SinglePageClientProps {
  data: PostDetailView;
  slug: string;
}
const UTTERANCES_REPO = "dozine/blog-comments";

const SinglePageClient = ({ data, slug }: SinglePageClientProps) => {
  const router = useRouter();
  const isDark = useUtterances(UTTERANCES_REPO, slug);
  const handlePostDeleteSuccess = () => {
    router.push("/blog");
    router.refresh();
  };

  const {
    menuOpen,
    toggleMenu,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    handleEdit,
    handleDelete,
  } = usePostActions(slug, handlePostDeleteSuccess);
  const renderedContent = useMemo(() => {
    return <PostContent desc={data.desc} isDark={isDark} />;
  }, [data.desc, isDark]);

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <h1 className={styles.title}>{data.title}</h1>
        <div className={styles.metaRow}>
          <span className={styles.date}>
            {new Date(data.createdAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <div className={styles.metaRight}>
            {data.isAuthor && (
              <>
                <span className={data.isPublished ? styles.published : styles.unpublished}>
                  {data.isPublished ? "공개" : "비공개"}
                </span>
                <div className={styles.menuContainer}>
                  <button
                    className={styles.menuButton}
                    onClick={toggleMenu}
                    aria-label="포스트 메뉴 열기"
                  >
                    <FaEllipsisH />
                  </button>
                  {menuOpen && (
                    <div className={styles.menu}>
                      <button className={styles.menuItem} onClick={handleEdit}>
                        수정하기
                      </button>
                      <button className={styles.menuItem} onClick={openDeleteModal}>
                        삭제하기
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className={styles.bottomRow}>
          {data?.tags && data.tags.length > 0 && (
            <div className={styles.tagContainer}>
              {data.tags.map((tag) => (
                <a
                  key={tag.id || tag.name}
                  href={`/tags?tags=${encodeURIComponent(tag.name)}`}
                  className={styles.tag}
                >
                  #{tag.name}
                </a>
              ))}
            </div>
          )}
          <span className={styles.views}>
            <FaEye className={styles.viewIcon} />
            {`${data.views || 0}`}
          </span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.post}>{renderedContent}</div>
      </div>
      <div
        id="comments-container"
        style={{
          marginTop: "3rem",
          minHeight: "400px",
        }}
      />
      <PostDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default SinglePageClient;
