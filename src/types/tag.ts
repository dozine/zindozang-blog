import type { Prisma } from "@prisma/client";
import type { TagResponse, TagWithPostCountResponse } from "@/types/api/tag";

/** 화면에서 사용하는 태그와 게시글 수. */
export type TagData = TagResponse;
export type TagWithPostCount = TagWithPostCountResponse;

export type TagWithPosts = Prisma.TagGetPayload<{
  include: {
    posts: {
      include: {
        post: true;
      };
    };
  };
}>;
