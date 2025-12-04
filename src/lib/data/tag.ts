import { TagWithPostCount } from "@/types/tag";

export async function getAllTags(): Promise<TagWithPostCount[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return [];

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("태그를 불러오는데 실패했습니다.");
    }

    const data: TagWithPostCount[] = await res.json();

    return Array.from(new Map(data.map((tag) => [tag.name, tag])).values());
  } catch (error: any) {
    console.error("태그 데이터 가져오기 실패:", error);
    return [];
  }
}
