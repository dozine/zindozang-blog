import { FormattedPostResponse } from "@/types";
import { cookies } from "next/headers";

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
