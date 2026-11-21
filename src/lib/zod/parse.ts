import type { z } from "zod";

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; reason: "invalid_json" }
  | { success: false; reason: "invalid_data"; message: string | undefined };

/** 요청과 응답의 JSON 파싱 및 스키마 검증을 공통으로 처리한다. */
export async function parseJson<T>(
  source: Pick<Request | Response, "json">,
  schema: z.ZodType<T>
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await source.json();
  } catch {
    return { success: false, reason: "invalid_json" };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { success: false, reason: "invalid_data", message: result.error.issues[0]?.message };
  }
  return { success: true, data: result.data };
}
