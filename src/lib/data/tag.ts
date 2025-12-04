import prisma from "@/lib/db/prisma";
import { TagWithPostCount, TagWithPosts } from "@/types/tag";

export async function getAllTags(): Promise<TagWithPostCount[]> {
  try {
    const tags: TagWithPostCount[] = await prisma.tag.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return Array.from(new Map(tags.map((tag) => [tag.name, tag])).values());
  } catch (error: any) {
    console.error("태그 데이터 가져오기 실패:", error);
    return [];
  }
}

export async function getTagById(id: string): Promise<TagWithPosts | null> {
  if (!id || id === "undefined") {
    console.error("유효하지 않은 태그 ID입니다.");
    return null;
  }

  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            post: true,
          },
        },
      },
    });

    if (!tag) {
      console.error("태그를 찾을 수 없습니다:", id);
      return null;
    }

    return tag as TagWithPosts;
  } catch (error: any) {
    console.error("태그 조회 중 오류 발생:", error);
    return null;
  }
}
