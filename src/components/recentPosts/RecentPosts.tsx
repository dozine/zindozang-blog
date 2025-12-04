import React from "react";
import styles from "./recentPosts.module.css";
import Card from "../card/Card";
import {
  PostApiResponse,
  PostWithFormattedTags,
  RecentPostsProps,
} from "@/types";
import Link from "next/link";
import { getPosts } from "@/lib/data/post";

const RecentPosts = async ({ page }: RecentPostsProps) => {
  const data: PostApiResponse | null = await getPosts({ page, postPerPage: 5 });
  if (!data) {
    return <p>포스트를 불러오는 데 실패했습니다.</p>;
  }
  const posts: PostWithFormattedTags[] = data.posts ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2 className={styles.mainTitle}>Recent Posts</h2>
        <Link href="/blog" className={styles.subTitle}>
          view more
        </Link>
      </div>
      <div className={styles.posts}>
        {posts.length > 0 ? (
          posts.map((item: PostWithFormattedTags, index: number) => (
            <Card key={item.id} item={item} priority={index < 3} />
          ))
        ) : (
          <p>포스트가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default RecentPosts;
