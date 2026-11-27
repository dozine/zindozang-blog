import type { DraftIdRequest } from "@/types/api/draft";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { parseApiRequest } from "@/lib/zod/request";
import { publishDraftSchema } from "@/lib/zod/draft";
import {
  draftVersionWhere,
  DraftError,
  draftError,
  replaceDraftTags,
} from "@/lib/services/draftServer";
import { toPostResponse } from "@/lib/serializers/responses";

export async function POST(req: NextRequest, { params }: { params: Promise<DraftIdRequest> }) {
  const email = (await getAuthSession())?.user?.email;
  if (!email) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const parsed = await parseApiRequest(req, publishDraftSchema);
  if (!parsed.success) return parsed.response;
  const { id } = await params;
  const body = parsed.data;
  const slug =
    body.title
      .normalize("NFC")
      .trim()
      .replace(/[^\w가-힣\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || `post-${randomUUID()}`;
  try {
    const post = await prisma.$transaction(async (tx) => {
      const result = await tx.post.updateMany({
        where: { id, userEmail: email, status: "DRAFT", ...draftVersionWhere(body.updatedAt) },
        data: {
          status: "PUBLISHED",
          slug,
          createdAt: new Date(),
          title: body.title,
          desc: body.desc,
          img: Array.isArray(body.img) ? body.img : body.img ? [body.img] : [],
          catSlug: body.catSlug || null,
          isPublished: body.isPublished ?? false,
        },
      });
      if (result.count !== 1)
        throw new DraftError("초안이 변경되었거나 이미 게시되었습니다. 다시 불러와주세요.");
      await replaceDraftTags(tx, id, body.tags ?? []);
      return tx.post.findUniqueOrThrow({
        where: { id },
        include: { user: true, tags: { include: { tag: true } } },
      });
    });
    return NextResponse.json(
      toPostResponse({ ...post, tags: post.tags.map((relation) => relation.tag) })
    );
  } catch (error) {
    return draftError(error);
  }
}
