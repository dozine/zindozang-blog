import { FormattedPostResponse, PostApiResponse } from "@/types";
import { cookies } from "next/headers";

interface GetPostsParams {
  page: number;
  cat?: string;
  tags?: string | string[];
  postPerPage?: number;
}

export async function getPostData(
  slug: string
): Promise<FormattedPostResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.error("Next_PUBLIC_BASE_URL이 설정되지 않았습니다.");
  }

  try {
    const cookie = await cookies();
    const cookieHeader = cookie.toString();

    const res = await fetch(`${baseUrl}/api/posts/${slug}?popular=true`, {
      next: { revalidate: 3600 },
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) {
      console.error(
        `Error fetching post data: ${res.status} ${res.statusText}`
      );
      return null;
    }

    const data: FormattedPostResponse = await res.json();

    if (!data || typeof data !== "object" || !data.title) {
      console.warn("Invalid data received for post:", data);
      return null;
    }
    return data;
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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
    return null;
  }

  const tagsParam: string = Array.isArray(tags) ? tags.join(".") : tags || "";
  const postPerPageParam = postPerPage ? `&postPerPage=${postPerPage}` : "";

  const cookie = await cookies();
  const cookieHeader = cookie.toString();

  const apiUrl = `${baseUrl}/api/posts?page=${page}&cat=${cat}&tags=${tagsParam}${postPerPageParam}`;

  try {
    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        "Failed to fetch posts on server:",
        res.status,
        res.statusText,
        errorText
      );
      return null;
    }

    return (await res.json()) as PostApiResponse;
  } catch (error: any) {
    console.error("Error fetching posts:", error.message);
    return null;
  }
}
