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
