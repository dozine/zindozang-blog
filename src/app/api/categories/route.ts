import { getErrorMessage } from "@/lib/utils/error";
import { requireAdmin } from "@/lib/services/requireAdmin";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { toCategoryResponse } from "@/lib/serializers/responses";
import { Category } from "@prisma/client";
import { createCategorySchema } from "@/lib/validation/schemas";
import { validateJsonBody } from "@/lib/validation/request";

// GET API 함수
export const GET = async () => {
  try {
    const categories: Category[] = await prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
    });

    return NextResponse.json(categories.map(toCategoryResponse), { status: 200 });
  } catch (err) {
    console.error("카테고리 조회 오류:", err);
    return new NextResponse(`카테고리 조회 중 오류 발생 : ${getErrorMessage(err, "알수없는 오류")}`, {
      status: 500,
    });
  }
};

// POST API 함수
export const POST = async (req: NextRequest) => {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const validation = await validateJsonBody(req, createCategorySchema);
    if (validation.success === false) return validation.response;
    const { slug, title, img } = validation.data;

    const existingCategory: Category | null = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return new NextResponse("이미 사용 중인 slug입니다.", { status: 400 });
    }

    // 새 카테고리 생성
    const newCategory: Category = await prisma.category.create({
      data: {
        slug,
        title,
        img: img || null,
      },
    });

    return NextResponse.json(
      { message: "카테고리 생성 완료", category: toCategoryResponse(newCategory) },
      { status: 201 }
    );
  } catch (err) {
    console.error("카테고리 생성 오류:", err);
    return new NextResponse("카테고리 생성 중 오류 발생: " + getErrorMessage(err, "알 수 없는 오류"), {
      status: 500,
    });
  }
};

// DELETE API 함수 - 카테고리 삭제 및 게시글 분류 해제
export const DELETE = async (req: NextRequest) => {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const id: string | null = searchParams.get("id");

    if (!id) {
      return new NextResponse("카테고리 id가 없습니다.", { status: 400 });
    }

    // 먼저 카테고리 정보 조회
    const categoryToDelete: Category | null = await prisma.category.findUnique({
      where: { id },
    });

    if (!categoryToDelete) {
      return new NextResponse("해당 카테고리를 찾을 수 없습니다.", {
        status: 404,
      });
    }

    const deleted: Category = await prisma.$transaction(async (tx) => {
      await tx.post.updateMany({
        where: { catSlug: categoryToDelete.slug },
        data: { catSlug: null },
      });
      return await tx.category.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "카테고리 삭제 완료", deleted: toCategoryResponse(deleted) }, { status: 200 });
  } catch (err) {
    console.error("카테고리 삭제 오류:", err);
    return new NextResponse("카테고리 삭제 중 오류 발생: " + getErrorMessage(err, "알 수 없는 오류"), {
      status: 500,
    });
  }
};
