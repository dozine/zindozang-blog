import { getErrorMessage } from "@/lib/utils/error";
import type {
  CreatePostRequest,
  CreatePostResponse,
  PostDetailResponse,
  UpdatePostRequest,
} from "@/types/api/post";

export async function fetchPostBySlug(slug: string): Promise<PostDetailResponse> {
  try {
    const res = await fetch(`/api/posts/${slug}`, { cache: "no-store" });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "게시글을 불러올 수 없습니다.");
    }
    return await res.json();
  } catch (error) {
    console.error("API 게시글 조회 오류:", error);
    throw new Error(getErrorMessage(error, "서버 통신 중 오류가 발생했습니다."));
  }
}

export async function createPost(createBody: CreatePostRequest): Promise<CreatePostResponse> {
  try {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createBody),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "게시글 작성에 실패했습니다.");
    }
    return await res.json();
  } catch (error) {
    console.error("API 게시글 작성 오류:", error);
    throw new Error(getErrorMessage(error, "서버 통신 중 오류가 발생했습니다."));
  }
}

export async function updatePost(slug: string, updateBody: UpdatePostRequest): Promise<void> {
  try {
    const res = await fetch(`/api/posts/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateBody),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "게시글 수정에 실패했습니다.");
    }
  } catch (error) {
    console.error("API 게시글 수정 오류:", error);
    throw new Error(getErrorMessage(error, "서버 통신 중 오류가 발생했습니다."));
  }
}

export async function deletePost(slug: string): Promise<void> {
  if (!slug) throw new Error("Slug is required for deletion.");

  const res = await fetch(`/api/posts/${slug}`, {
    method: "DELETE",
    cache: "no-store",
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to delete post");
  }
}
