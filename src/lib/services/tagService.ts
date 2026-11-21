import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { tagListResponseSchema, tagResponseSchema } from "@/lib/zod/tag";
import { parseApiResponse, readApiError } from "@/lib/zod/response";
import { getErrorMessage } from "@/lib/utils/error";
import type {
  CreateTagRequest,
  TagByIdRequest,
  TagListResponse,
  TagResponse,
} from "@/types/api/tag";

export async function fetchAvailableTags(): Promise<TagListResponse> {
  try {
    const res = await fetch(API_ENDPOINTS.tags.list, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("태그를 불러올 수 없습니다.");
    }
    const data = await parseApiResponse(res, tagListResponseSchema);
    return data;
  } catch (error) {
    console.error("API 태그 목록 조회 오류:", error);
    throw new Error(getErrorMessage(error, "서버 통신 중 오류가 발생했습니다."));
  }
}

export async function createTag(
  name: string
): Promise<{ success: boolean; tag?: TagResponse; error?: string; existingTag?: TagResponse }> {
  if (!name.trim()) {
    return { success: false, error: "태그 이름을 입력해주세요." };
  }

  try {
    const body: CreateTagRequest = { name: name.trim() };
    const res = await fetch(API_ENDPOINTS.tags.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 409) {
        const body: unknown = await res.json().catch(() => null);
        const existing = tagResponseSchema.safeParse(body);
        if (existing.success) {
          return { success: false, error: "이미 존재하는 태그입니다.", existingTag: existing.data };
        }
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "태그 생성에 실패했습니다.";
        return { success: false, error: message };
      }
      return { success: false, error: await readApiError(res, "태그 생성에 실패했습니다.") };
    }

    return { success: true, tag: await parseApiResponse(res, tagResponseSchema) };
  } catch (err) {
    console.error("API 태그 생성 오류:", err);
    return {
      success: false,
      error: getErrorMessage(err, "서버 통신 중 오류가 발생했습니다."),
    };
  }
}

export async function deleteTag(
  tagId: TagByIdRequest["id"]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(API_ENDPOINTS.tags.detail(tagId), {
      method: "DELETE",
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, error: await readApiError(res, "Failed to delete tag") };
    }

    return { success: true, message: "태그가 성공적으로 삭제되었습니다." };
  } catch (err) {
    console.error("API 태그 삭제 오류:", err);
    return {
      success: false,
      error: getErrorMessage(err, "서버 통신 중 오류가 발생했습니다."),
    };
  }
}
