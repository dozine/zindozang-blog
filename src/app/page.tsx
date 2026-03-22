import CategoryList from "@/components/categoryList/CategoryList";
import styles from "./homepage.module.css";
import RecentPosts from "@/components/recentPosts/RecentPosts";

import { Suspense } from "react";
import Featured from "@/components/featured/Featured";
import Marquee from "@/components/marquee/marquee";

const FeaturedLoading = () => (
  <div style={{ height: "400px", backgroundColor: "#eee" }}>
    Featured Loading...
  </div>
);
// const PostsLoading = () => (
//   <div style={{ height: "600px", backgroundColor: "#f0f0f0" }}>
//     Recent Posts Loading...
//   </div>
// );

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt((params.page as string) || "1", 10);
  return (
    <div className={styles.container}>
      {/* <Suspense fallback={<FeaturedLoading />}>
        <Featured />
      </Suspense> */}
      {/* <CategoryList /> */}
      <div
        style={{
          display: "flex", // 레이아웃을 Flexbox로 설정
          justifyContent: "center", // 가로축 중앙 정렬
          alignItems: "center", // 세로축 중앙 정렬
        }}
      >
        <div
          style={{
            height: "500px",
            width: "400px",
            background: "#F5F5F5",
            padding: "50px",
            margin: "50px", // 중앙 정렬 시 margin은 빼셔도 됩니다.
            border: "1px solid #444",
          }}
        >
          HELLO!
        </div>
      </div>
      {/* <div className={styles.content}>
        <RecentPosts page={page} />
      </div>{" "} */}
    </div>
  );
}
