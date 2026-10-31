import type {
  CreateTagRequest,
  CreateTagResponse,
  DeleteTagResponse,
  DuplicateTagResponse,
  TagByIdRequest,
  TagListResponse,
  TagResponse,
} from "@/types/api/tag";

export async function fetchAvailableTags(): Promise<TagListResponse> {
  try {
    const res = await fetch("/api/tags", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("태그를 불러올 수 없습니다.");
    }
    const data: TagListResponse = await res.json();
    return data;
  } catch (error: any) {
    console.error("API 태그 목록 조회 오류:", error);
    throw new Error(error.message || "서버 통신 중 오류가 발생했습니다.");
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
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result: DuplicateTagResponse = await res.json();

    if (!res.ok) {
      // 409 Conflict: 이미 존재하는 태그인 경우
      if (res.status === 409 && "id" in result && "name" in result) {
        return {
          success: false,
          error: "이미 존재하는 태그입니다.",
          existingTag: result,
        };
      }
      return {
        success: false,
        error: ("message" in result && result.message) || "태그 생성에 실패했습니다.",
      };
    }

    return { success: true, tag: result as CreateTagResponse };
  } catch (err: any) {
    console.error("API 태그 생성 오류:", err);
    return {
      success: false,
      error: err.message || "서버 통신 중 오류가 발생했습니다.",
    };
  }
}

export async function deleteTag(
  tagId: TagByIdRequest["id"]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/tags/${tagId}`, {
      method: "DELETE",
      cache: "no-store",
    });

    const result: DeleteTagResponse = await res.json();

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
