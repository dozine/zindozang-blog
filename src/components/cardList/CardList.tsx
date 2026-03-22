import React from "react";
import styles from "./cardList.module.css";
import Pagination from "../pagination/Pagination";
import Card from "../card/Card";
import { CardListProps, PostWithFormattedTags } from "@/types";
import { getPosts } from "@/lib/data/post";

const POSTS_PER_PAGE = 9;

const CardList = async ({ page, cat, tags }: CardListProps) => {
  const data = await getPosts({ page, cat, tags, postPerPage: POSTS_PER_PAGE });
  if (!data) {
    return <p>포스트를 불러오는 데 실패했습니다.</p>;
  }
  const posts: PostWithFormattedTags[] = data.posts || [];
  const count: number = data.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / POSTS_PER_PAGE));

  return (
    <div className={styles.container}>
      <div className={styles.posts}>
        {posts.length > 0 ? (
          posts.map((item, index) => (
            <Card key={item.id} item={item} priority={index < 3} />
          ))
        ) : (
          <p>POST가 없습니다.</p>
        )}
      </div>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
};
export default CardList;
