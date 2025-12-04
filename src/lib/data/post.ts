import { FormattedPostResponse, PostApiResponse } from "@/types";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { Prisma, Tag } from "@prisma/client";

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

export async function getPostData(
  slug: string
): Promise<FormattedPostResponse | null> {
  const decodedSlug = decodeURIComponent(slug);
  console.log("getPostData called with slug:", slug);
  console.log("Decoded slug:", decodedSlug);

  if (!decodedSlug || decodedSlug === "undefined") {
    console.error("Invalid post slug");
    return null;
  }

  try {
    const session = await getAuthSession();
    console.log("Session user:", session?.user?.email);

    const postExists = await prisma.post.findUnique({
      where: { slug: decodedSlug },
      include: { user: true },
    });

    console.log("Post found:", postExists ? "yes" : "no");
    console.log(
      "Post details:",
      postExists
        ? {
            slug: postExists.slug,
            isPublished: postExists.isPublished,
            userEmail: postExists.user.email,
          }
        : "N/A"
    );

    if (!postExists) {
      console.error("Post not found for slug:", slug);
      return null;
    }

    if (
      !postExists.isPublished &&
      session?.user.email !== postExists.user.email
    ) {
      console.error("Unauthorized access to unpublished post");
      return null;
    }

    const post = await prisma.post.update({
      where: { slug: decodedSlug },
      data: { views: { increment: 1 } },
      include: {
        user: true,
        tags: { include: { tag: true } },
      },
    });

    const formattedPost: FormattedPostResponse = {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    };

    return formattedPost;
  } catch (error) {
    console.error("Error fetching post data:", error);
    return null;
  }
}

export async function getPosts({
  page,
  cat = "",
  tags,
  postPerPage,
}: GetPostsParams): Promise<PostApiResponse | null> {
  const session = await getAuthSession();
  const postsPerPage = postPerPage || POST_PER_PAGE;
  const skip = Math.max(0, postsPerPage * (page - 1));

  const selectedTags: string[] = Array.isArray(tags)
    ? tags.filter((tag) => tag !== "")
    : tags
      ? tags.split(".").filter((tag) => tag !== "")
      : [];

  let where: Prisma.PostWhereInput = {
    isPublished: true,
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

  if (session?.user) {
    const isAdmin = session.user.email === (process.env.MYEMAIL as string);

    if (isAdmin) {
      delete where.isPublished;
    } else {
      where = {
        AND: [
          { ...where, isPublished: undefined },
          {
            OR: [{ isPublished: true }, { userEmail: session.user.email }],
          },
        ],
      };
    }
  }

  try {
    const posts = (await prisma.post.findMany({
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
    })) as PostWithRelations[];

    const count = await prisma.post.count({ where });

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
