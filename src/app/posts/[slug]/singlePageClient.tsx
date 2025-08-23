"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PostDeleteModal from "@/components/modal/PostDeleteModal";
import styles from "./singlePage.module.css";
import { SinglePageClientProps } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import CodeBlock from "@/components/codeBlock/CodeBlock";
import { FaEllipsisH } from "react-icons/fa";
export interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

const SinglePageClient = ({ data, slug }: SinglePageClientProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const isAuthor: boolean = session?.user?.email === data?.user?.email;
  const isAuthenticated: boolean = status === "authenticated";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsDark(theme === "dark");
  }, []);

  const handleDelete = async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to delete post");
      alert("삭제되었습니다.");
      router.push("/blog");
      router.refresh();
    } catch (err: any) {
      console.error("삭제 오류", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleEdit = () => {
    router.push(`/write?edit=true&slug=${slug}`);
  };

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
                    onClick={() => setMenuOpen(!menuOpen)}
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
                        onClick={() => setIsDeleteModalOpen(true)}
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
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ inline, node, className, children, ...props }: CodeProps) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";
                const codeString = String(children).replace(/\n$/, "");
                const isInlineCode =
                  inline === true ||
                  (!className && !codeString.includes("\n") && codeString.length < 100);

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
                console.log("Rendering as code block");
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
      <PostDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default SinglePageClient;
