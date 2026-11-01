import { NextResponse } from "next/server";
import type { z } from "zod";

/** 인증 검사 이후, DB 작업 전에 외부 JSON을 검증한다. */
export async function validateJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ message: "유효한 JSON을 입력해주세요." }, { status: 400 }),
    };
  }

  const result = schema.safeParse(body);
  if (result.success === false) {
    return {
      success: false,
      response: NextResponse.json(
        { message: result.error.issues[0]?.message || "요청 데이터를 확인해주세요." },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}
