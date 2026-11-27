import type { DraftIdRequest } from "@/types/api/draft";
import { parseApiRequest } from "@/lib/zod/request";
import { deleteDraftSchema } from "@/lib/zod/draft";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import {
  DraftError,
  draftVersionWhere,
  draftError,
  draftInclude,
  privateDraftHeaders,
  toDraftResponse,
} from "@/lib/services/draftServer";

export async function GET(_req: NextRequest, { params }: { params: Promise<DraftIdRequest> }) {
  const email = (await getAuthSession())?.user?.email;
  if (!email) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  try {
    const post = await prisma.post.findFirst({
      where: { id: (await params).id, userEmail: email, status: "DRAFT" },
      include: draftInclude,
    });
    if (!post) return NextResponse.json({ message: "초안을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(toDraftResponse(post), { headers: privateDraftHeaders });
  } catch (error) {
    return draftError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<DraftIdRequest> }) {
  const email = (await getAuthSession())?.user?.email;
  if (!email) return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  const parsed = await parseApiRequest(req, deleteDraftSchema);
  if (!parsed.success) return parsed.response;
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      const draft = await tx.post.findFirst({ where: { id, userEmail: email, status: "DRAFT" } });
      if (!draft) throw new DraftError("초안을 찾을 수 없습니다.", 404);
      await tx.postTag.deleteMany({ where: { postId: id } });
      const result = await tx.post.deleteMany({
        where: {
          id,
          userEmail: email,
          status: "DRAFT",
          ...draftVersionWhere(parsed.data.updatedAt),
        },
      });
      if (result.count !== 1)
        throw new DraftError("초안이 변경되었습니다. 목록을 다시 불러와주세요.");
    });
    return NextResponse.json({ success: true }, { headers: privateDraftHeaders });
  } catch (error) {
    return draftError(error);
  }
}
