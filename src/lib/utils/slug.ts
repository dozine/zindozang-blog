/** 게시글 주소에 사용할 한글·영문·숫자와 구분자를 정리한다. */
export function normalizePostSlug(value: string): string {
  const slug = value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s_-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "undefined" ? "" : slug;
}

/** 직접 입력한 주소가 없으면 제목을 사용한다. */
export function resolvePostSlug(title: string, customSlug?: string | null): string {
  return normalizePostSlug(customSlug?.trim() ? customSlug : title);
}
