"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const { menuOpen, toggleMenu, isDeleteModalOpen, openDeleteModal, closeDeleteModal, handleEdit } =
    usePostActions(slug);
  const renderedContent = useMemo(() => {
    return <PostContent desc={data.desc} isDark={isDark} fontFamily={data.fontFamily} />;
  }, [data.desc, data.fontFamily, isDark]);

  return (
    <article className={styles.container}>
      <header className={styles.infoContainer}>
        {data.catSlug && (
          <Link href={`/blog?cat=${encodeURIComponent(data.catSlug)}`} className={styles.category}>
            {data.catSlug}
          </Link>
        )}
        <h1 className={styles.title}>{data.title}</h1>
        <div className={styles.metaRow}>
          <div className={styles.metaDetails}>
            <time className={styles.date} dateTime={new Date(data.createdAt).toISOString()}>
              {new Date(data.createdAt).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Seoul",
              })}
            </time>
            <span className={styles.views} aria-label={`조회수 ${data.views || 0}`}>
              <FaEye className={styles.viewIcon} aria-hidden="true" />
              {data.views || 0}
            </span>
          </div>
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
                    type="button"
                    aria-label="포스트 메뉴 열기"
                    aria-expanded={menuOpen}
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
      </header>

      <div className={styles.content}>
        <div className={styles.post}>{renderedContent}</div>
      </div>
      {data.tags && data.tags.length > 0 && (
        <footer className={styles.postFooter}>
          <nav className={styles.tagContainer} aria-label="게시글 태그">
            {data.tags.map((tag) => (
              <Link
                key={tag.id || tag.name}
                href={`/tags?tags=${encodeURIComponent(tag.name)}`}
                className={styles.tag}
              >
                #{tag.name}
              </Link>
            ))}
          </nav>
        </footer>
      )}
      <section className={styles.comments} aria-labelledby="post-comments-heading">
        <h2 id="post-comments-heading" className={styles.sectionTitle}>
          Comments
        </h2>
        <div id="comments-container" className={styles.commentsContainer} />
      </section>
      <PostDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        slug={slug}
        onSuccess={handlePostDeleteSuccess}
      />
    </article>
  );
};

export default SinglePageClient;
