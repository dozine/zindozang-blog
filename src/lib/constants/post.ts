import type { PostFont } from "@/types/post";

export const DEFAULT_POST_FONT = "serif";
export const POST_FONTS = {
  serif: { label: "명조체", family: "var(--font-noto-serif-kr), serif" },
  sans: { label: "고딕체", family: "var(--font-noto-sans-kr), sans-serif" },
  nanum: { label: "나눔고딕", family: "var(--font-nanum-gothic), sans-serif" },
  "nanum-myeongjo": { label: "나눔명조", family: "var(--font-nanum-myeongjo), serif" },
  "gowun-batang": { label: "고운바탕", family: "var(--font-gowun-batang), serif" },
  "gowun-dodum": { label: "고운돋움", family: "var(--font-gowun-dodum), sans-serif" },
  system: {
    label: "시스템 기본",
    family: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
} satisfies Record<PostFont, { label: string; family: string }>;
