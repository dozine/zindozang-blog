"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PostDeleteModal from "@/components/modal/PostDeleteModal";
import styles from "./singlePage.module.css";
import { SinglePageClientProps } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import CodeBlock from "@/components/codeBlock/CodeBlock";
import { FaEllipsisH } from "react-icons/fa";
import { usePostActions } from "@/hooks/post/usePostAction";
import { useUtterances } from "@/hooks/useUtterances";

export interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

const UTTERANCES_REPO = "dozine/blog-comments";

const SinglePageClient = ({ data, slug }: SinglePageClientProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthor: boolean = session?.user?.email === data?.user?.email;
  const isAuthenticated: boolean = status === "authenticated";

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

  const isDark = useUtterances(UTTERANCES_REPO, slug);

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.textContainer}>
          <h1 className={styles.title}>{data.title}</h1>
          <div className={styles.userContainer}>
            <span className={styles.date}>
              {new Date(data.createdAt).toLocaleString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {isAuthenticated && isAuthor && (
              <>
                <div className={styles.status}>
                  {data.isPublished ? (
                    <span className={styles.published}>공개</span>
                  ) : (
                    <span className={styles.unpublished}>비공개</span>
                  )}
                </div>
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
                      <button
                        className={styles.menuItem}
                        onClick={openDeleteModal}
                      >
                        삭제하기
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
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
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.post}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks as any]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ inline, node, className, children, ...props }: CodeProps) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                const codeString = String(children).replace(/\n$/, "");
                const isInlineCode =
                  inline === true ||
                  (!className &&
                    !codeString.includes("\n") &&
                    codeString.length < 100);
                if (isInlineCode) {
                  return (
                    <code
                      className={className}
                      style={{
                        background: isDark ? "#2d2d2d" : "silver",
                        color: isDark ? "#e2e8f0" : "#1a202c",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        fontWeight: "500",
                        fontFamily:
                          '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock language={language} isDark={isDark}>
                    {codeString}
                  </CodeBlock>
                );
              },
            }}
          >
            {data.desc}
          </ReactMarkdown>
        </div>
      </div>
      <div
        id="comments-container"
        style={{
          marginTop: "3rem",
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
