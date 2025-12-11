import { FormattedPostResponse, PostApiResponse } from "@/types";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { Prisma, Tag } from "@prisma/client";
import { cache } from "react";

interface GetPostsParams {
  page: number;
  cat?: string;
  tags?: string | string[];
  postPerPage?: number;
}

const POST_PER_PAGE = 10;

type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    user: true;
    tags: {
      include: {
        tag: true;
      };
    };
  };
}>;

type FormattedPost = Omit<PostWithRelations, "tags" | "user"> & {
  tags: Tag[];
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

export const getPostData = cache(async (slug: string): Promise<FormattedPostResponse | null> => {
  const decodedSlug = decodeURIComponent(slug);
  console.log("getPostData called with slug:", slug);

  if (!decodedSlug || decodedSlug === "undefined") {
    console.error("Invalid post slug");
    return null;
  }

  try {
    const session = await getAuthSession();
    const userEmail = session?.user.email;

    const postCheck = await prisma.post.findUnique({
      where: { slug: decodedSlug },
      select: {
        id: true,
        isPublished: true,
        userEmail: true,
      },
    });
    if (!postCheck.isPublished && userEmail !== postCheck.userEmail) {
      console.error("Unauthorized access to unpublished post");
      return null;
    }

    const [updatedPost] = await prisma.$transaction([
      prisma.post.update({
        where: { slug: decodedSlug },
        data: { views: { increment: 1 } },
        include: {
          user: true,
          tags: { include: { tag: true } },
        },
      }),
    ]);

    const formattedPost: FormattedPostResponse = {
      ...updatedPost,
      tags: updatedPost.tags.map((pt) => pt.tag),
    };

    return formattedPost;
  } catch (error) {
    console.error("Error fetching post data:", error);
    return null;
  }
});

export const getPosts = cache(
  async ({
    page,
    cat = "",
    tags,
    postPerPage,
  }: GetPostsParams): Promise<PostApiResponse | null> => {
    const session = await getAuthSession();
    const postsPerPage = postPerPage || POST_PER_PAGE;
    const skip = Math.max(0, postsPerPage * (page - 1));

    const selectedTags: string[] = Array.isArray(tags)
      ? tags.filter((tag) => tag !== "")
      : tags
        ? tags.split(".").filter((tag) => tag !== "")
        : [];

    let where: Prisma.PostWhereInput = {
      ...(cat && { catSlug: cat }),
      ...(selectedTags.length > 0 && {
        tags: {
          some: {
            tag: {
              name: { in: selectedTags },
            },
          },
        },
      }),
    };

    const userEmail = session?.user?.email;
    const isAdmin = userEmail === (process.env.MYEMAIL as string);

    if (!isAdmin) {
      where = {
        ...where,
        OR: [{ isPublished: true }, ...(userEmail ? [{ userEmail: userEmail }] : [])],
      };
    }

    try {
      const [posts, count] = (await prisma.$transaction([
        prisma.post.findMany({
          take: postsPerPage,
          skip,
          where,
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        }),
        prisma.post.count({ where }),
      ])) as [PostWithRelations[], number];

      const formattedPosts: FormattedPost[] = posts.map((post) => ({
        ...post,
        tags: post.tags.map((pt) => pt.tag),
        user: {
          id: post.user.id,
          email: post.user.email,
          name: post.user.name || "",
          image: post.user.image || "",
        },
      }));

      return {
        posts: formattedPosts,
        count,
      };
    } catch (error: any) {
      console.error("Error fetching posts:", error.message);
      return null;
    }
  }
);
