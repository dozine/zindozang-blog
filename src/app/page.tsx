import CategoryList from "@/components/categoryList/CategoryList";
import styles from "./homepage.module.css";
import RecentPosts from "@/components/recentPosts/RecentPosts";

import { Suspense } from "react";
import Featured from "@/components/featured/Featured";

const FeaturedLoading = () => (
  <div style={{ height: "400px", backgroundColor: "#eee" }}>Featured Loading...</div>
);
const PostsLoading = () => (
  <div style={{ height: "600px", backgroundColor: "#f0f0f0" }}>Recent Posts Loading...</div>
);

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt((params.page as string) || "1", 10);
  return (
    <div className={styles.container}>
      <Suspense fallback={<FeaturedLoading />}>
        <Featured />
      </Suspense>
      <CategoryList />
      <div className={styles.content}>
        <Suspense fallback={<PostsLoading />}>
          <RecentPosts page={page} />
        </Suspense>
      </div>
    </div>
  );
}
