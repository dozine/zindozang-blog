import type { PostResponse } from "@/types/api/post";
import type { Post, Tag, User } from "@prisma/client";

/** 서버에서 직접 조회한 게시글의 작성자 정보. */
export type PostAuthor = Pick<User, "id" | "email" | "name" | "image">;

/** Prisma 조회 결과를 화면에 사용하기 좋게 태그를 펼친 형태. */
export type PostData = Post & {
  tags: Tag[];
  user: PostAuthor;
};

/** 서버에서 조회한 게시글 목록. createdAt은 Date다. */
export interface PostListData {
  posts: PostData[];
  count: number;
}

/** 서버 렌더링 화면의 게시글. API 응답과 달리 날짜는 Date다. */
export type PostView = Omit<PostResponse, "createdAt"> & { createdAt: Date };
