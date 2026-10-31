import type { Prisma, Tag } from "@prisma/client";

/** 서버에서 조회한 태그 데이터. */
export type TagData = Tag;

export type TagWithPostCount = TagData & {
  _count: {
    posts: number;
  };
};

export type TagWithPosts = Prisma.TagGetPayload<{
  include: {
    posts: {
      include: {
        post: true;
      };
    };
  };
}>;
