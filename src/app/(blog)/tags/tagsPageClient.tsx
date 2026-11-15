"use client";
import { useRouter } from "next/navigation";
import { useTagsQuery } from "@/queries/tag";
import TagList from "@/components/tagList/TagList";
import styles from "./tagsPage.module.css";
import type { TagWithPostCount } from "@/types/tag";
import { useTagSelection } from "@/hooks/tag/useTagSelection";

interface TagsPageClientProps {
  allTags: TagWithPostCount[];
  selectedTags: string[];
}

const TagsPageClient = ({ allTags, selectedTags }: TagsPageClientProps) => {
  const { handleTagClick } = useTagSelection();
  const router = useRouter();
  const { data: tags = allTags } = useTagsQuery(true, allTags);

  const handleTagDelete = () => {
    router.refresh();
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
