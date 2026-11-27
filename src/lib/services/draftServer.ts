import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export class DraftError extends Error {
  constructor(
    message: string,
    public status = 409
  ) {
    super(message);
  }
}
export function draftError(error: unknown) {
  if (error instanceof DraftError)
    return NextResponse.json({ message: error.message }, { status: error.status });
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2034")
  )
    return NextResponse.json(
      {
        message:
          error.code === "P2002"
            ? "같은 주소의 글이 있습니다. 제목을 바꿔 다시 게시해주세요."
            : "다른 작업과 충돌했습니다. 초안을 다시 불러와주세요.",
      },
      { status: 409 }
    );
  console.error("Draft error:", error);
  return NextResponse.json(
    { message: "초안을 처리하지 못했습니다. 다시 시도해주세요." },
    { status: 500 }
  );
}

export const draftInclude = { tags: { include: { tag: true } } } as const;
export async function replaceDraftTags(
  tx: Prisma.TransactionClient,
  postId: string,
  tagIds: string[]
) {
  await tx.postTag.deleteMany({ where: { postId } });
  for (const tagId of new Set(tagIds)) await tx.postTag.create({ data: { postId, tagId } });
}
export const privateDraftHeaders = { "Cache-Control": "no-store" };

// A missing MongoDB field and an explicit null both represent an unsaved timestamp.
export function draftVersionWhere(updatedAt: string | null): Prisma.PostWhereInput {
  return updatedAt === null
    ? { OR: [{ updatedAt: null }, { updatedAt: { isSet: false } }] }
    : { updatedAt: new Date(updatedAt) };
}
