import { TagWithPostCount } from "@/types/tag";
import { Tag } from "@prisma/client";

export async function fetchAvailableTags(): Promise<TagWithPostCount[]> {
  try {
    const res = await fetch("/api/tags", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("태그를 불러올 수 없습니다.");
    }
    const data: TagWithPostCount[] = await res.json();
    return data;
  } catch (error: any) {
    console.error("API 태그 목록 조회 오류:", error);
    throw new Error(error.message || "서버 통신 중 오류가 발생했습니다.");
  }
}

export async function createTag(
  name: string
): Promise<{ success: boolean; tag?: Tag; error?: string; existingTag?: Tag }> {
  if (!name.trim()) {
    return { success: false, error: "태그 이름을 입력해주세요." };
  }

  try {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const result = await res.json();

    if (!res.ok) {
      // 409 Conflict: 이미 존재하는 태그인 경우
      if (res.status === 409 && result.existingTag) {
        return {
          success: false,
          error: "이미 존재하는 태그입니다.",
          existingTag: result.existingTag,
        };
      }
      return {
        success: false,
        error: result.message || "태그 생성에 실패했습니다.",
      };
    }

    return { success: true, tag: result as Tag };
  } catch (err: any) {
    console.error("API 태그 생성 오류:", err);
    return {
      success: false,
      error: err.message || "서버 통신 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteTag(
  tagId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/tags/${tagId}`, {
      method: "DELETE",
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: result.message || "Failed to delete tag",
      };
    }

    return { success: true, message: "태그가 성공적으로 삭제되었습니다." };
  } catch (err: any) {
    console.error("API 태그 삭제 오류:", err);
    return {
      success: false,
      error: err.message || "서버 통신 중 오류가 발생했습니다.",
    };
  }
}
