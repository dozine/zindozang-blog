import { requireAdmin } from "@/lib/services/requireAdmin";
import prisma from "@/lib/db/prisma";
import { toTagResponse, toTagWithPostCountResponse } from "@/lib/serializers/responses";
import type { TagWithPostCount } from "@/types/tag";
import { createTagSchema } from "@/lib/validation/schemas";
import { validateJsonBody } from "@/lib/validation/request";
import { Prisma, Tag } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const tags: TagWithPostCount[] = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: {
                post: {
                  isPublished: true,
                },
              },
            },
          },
        },
      },
    });
    return NextResponse.json(tags.map(toTagWithPostCountResponse), { status: 200 });
  } catch (error) {
    console.error("태그 조회 중 오류 발생", error);
    return NextResponse.json(
      { message: "태그 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const validation = await validateJsonBody(req, createTagSchema);
    if (validation.success === false) return validation.response;
    const { name } = validation.data;

    const existingTag: Tag | null = await prisma.tag.findUnique({
      where: { name },
    });

    if (existingTag) {
      return NextResponse.json(toTagResponse(existingTag), { status: 409 });
    }

    const newTag = await prisma.tag.create({
      data: { name },
    });

    return NextResponse.json(toTagResponse(newTag), { status: 201 });
  } catch (error: any) {
    console.error("태그 생성 중 오류 발생:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "이미 존재하는 태그 이름입니다." },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { message: "태그 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
