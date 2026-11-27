import { toDraftResponse } from "@/lib/serializers/responses";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { parseApiRequest } from "@/lib/zod/request";
import { saveDraftSchema } from "@/lib/zod/draft";
import {
  draftVersionWhere,
  DraftError,
  draftError,
  draftInclude,
  privateDraftHeaders,
  replaceDraftTags,
} from "@/lib/services/draftServer";

export async function GET() {
  const email = (await getAuthSession())?.user?.email;
  if (!email) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  try {
    const posts = await prisma.post.findMany({
      where: { userEmail: email, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      include: draftInclude,
    });
    return NextResponse.json(posts.map(toDraftResponse), { headers: privateDraftHeaders });
  } catch (error) {
    return draftError(error);
  }
}
export async function POST(req: NextRequest) {
  const email = (await getAuthSession())?.user?.email;
  if (!email) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const parsed = await parseApiRequest(req, saveDraftSchema);
  if (!parsed.success) return parsed.response;
  const { id, updatedAt, content } = parsed.data;
  const data = {
    title: content.title,
    draftSlug: content.slugInput || null,
    desc: content.value,
    fontFamily: content.fontFamily,
    img: [...new Set([content.thumbnailImg, ...content.uploadedImages].filter(Boolean))],
    catSlug: content.catSlug || null,
    isPublished: content.isPublished,
  };
  try {
    const post = await prisma.$transaction(async (tx) => {
      let postId = id;
      if (postId) {
        const claimed = await tx.post.updateMany({
          where: {
            id: postId,
            userEmail: email,
            status: "DRAFT",
            ...draftVersionWhere(updatedAt ?? null),
          },
          data,
        });
        if (claimed.count !== 1)
          throw new DraftError("초안이 변경되었거나 이미 게시되었습니다. 다시 불러와주세요.");
      } else {
        const created = await tx.post.create({
          data: { ...data, userEmail: email, status: "DRAFT", slug: `draft-${randomUUID()}` },
        });
        postId = created.id;
      }
      await replaceDraftTags(
        tx,
        postId,
        content.tags.map((tag) => tag.id)
      );
      return tx.post.findUniqueOrThrow({ where: { id: postId }, include: draftInclude });
    });
    return NextResponse.json(toDraftResponse(post), { headers: privateDraftHeaders });
  } catch (error) {
    return draftError(error);
  }
}
