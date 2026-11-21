import { NextResponse } from "next/server";
import type { z } from "zod";
import { parseJson } from "./parse";

/** 인증 검사 이후, DB 작업 전에 외부 JSON을 검증한다. */
export async function parseApiRequest<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const result = await parseJson(request, schema);
  if (result.success) return result;

  const message =
    result.reason === "invalid_json"
      ? "유효한 JSON을 입력해주세요."
      : result.message || "요청 데이터를 확인해주세요.";
  return { success: false, response: NextResponse.json({ message }, { status: 400 }) };
}
