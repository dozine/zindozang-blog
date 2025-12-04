"use client";
import React, { useState } from "react";
import TagList from "@/components/tagList/TagList";
import styles from "./tagsPage.module.css";
import { TagsPageClientProp, TagWithPostCount } from "@/types/tag";
import { useTagSelection } from "@/hooks/tag/useTagSelection";

const TagsPageClient = ({
  initialPage,
  initialTags,
  allTags,
}: TagsPageClientProp) => {
  const { handleTagClick, getSelectedTags } = useTagSelection();

  const [tags, setTags] = useState<TagWithPostCount[]>(allTags);

  const selectedTags: string[] = getSelectedTags(initialTags);

  const page: number = initialPage;
  const handleTagDelete = (deletedTagId: string) => {
    setTags((prevTags) => prevTags.filter((tag) => tag.id !== deletedTagId));
  };
  return (
    <div className={styles.container}>
      <TagList
        tags={tags}
        selectedTags={selectedTags}
        onTagClick={handleTagClick}
        onTagDelete={handleTagDelete}
      />
    </div>
  );
};

export default TagsPageClient;
