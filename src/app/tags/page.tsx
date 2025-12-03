import styles from "./tagsPage.module.css";
import CardList from "@/components/cardList/CardList";
import TagsPageClient from "./tagsPageClient";
import { getAllTags } from "@/lib/data/tag";
import { TagWithPostCount } from "@/types/tag";
const TagsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tags?: string }>;
}) => {
  const params = await searchParams;
  const page: number = Number(params.page) || 1;
  const rawTags: string = params.tags || "";
  const tags: string[] = rawTags
    ? rawTags.split(".").filter((tag) => tag !== "")
    : [];

  const allTags: TagWithPostCount[] = await getAllTags();
  return (
    <div className={styles.container}>
      <TagsPageClient initialTags={tags} initialPage={page} allTags={allTags} />
      <div className={styles.content}>
        <CardList page={page} tags={tags} />
      </div>
    </div>
  );
};

export default TagsPage;
