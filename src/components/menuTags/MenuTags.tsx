"use client";
import Link from "next/link";
import React, { useState } from "react";
import styles from "./menuTags.module.css";
import type { TagData } from "@/types/tag";
import { useFetchTags } from "@/hooks/tag/useFetchTags";

const MenuTags = () => {
  const { tags, loading, error } = useFetchTags();

  const [showAll, setShowAll] = useState<boolean>(false);

  const initialTagsToShow = 15;
  const visibleTags: TagData[] = showAll ? tags : tags.slice(0, initialTagsToShow);
  const hasMoreTags: boolean = tags.length > initialTagsToShow;

  if (loading) return <div className={styles.loading}>태그 로딩 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.tagGrid}>
        {visibleTags.map((tag) => (
          <Link
            href={`/tags?tags=${encodeURIComponent(tag.name)}`}
            key={tag.id || tag.name}
            className={styles.tag}
          >
            {tag.name}
          </Link>
        ))}
      </div>
      {hasMoreTags && (
        <div className={styles.viewMoreContainer}>
          {showAll ? (
            <button className={styles.viewMoreBtn} onClick={() => setShowAll(false)}>
              접기
            </button>
          ) : (
            <Link href="/tags" className={styles.viewMoreLink}>
              <span className={styles.arrow}>→ </span>
              전체 보기
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuTags;
