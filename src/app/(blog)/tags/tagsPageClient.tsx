"use client";
import { useState } from "react";
import TagList from "@/components/tagList/TagList";
import styles from "./tagsPage.module.css";
import { TagWithPostCount } from "@/types/tag";
import { useTagSelection } from "@/hooks/tag/useTagSelection";

interface TagsPageClientProps {
  allTags: TagWithPostCount[];
  selectedTags: string[];
}

const TagsPageClient = ({ allTags, selectedTags }: TagsPageClientProps) => {
  const { handleTagClick } = useTagSelection();
  const [tags, setTags] = useState<TagWithPostCount[]>(allTags);

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
