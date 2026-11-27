/** 클라이언트 서비스에서 사용하는 API 경로. 실제 라우트는 src/app/api에서 정의한다. */
export const API_ENDPOINTS = {
  categories: {
    list: "/api/categories",
    byId: (id: string) => `/api/categories?id=${encodeURIComponent(id)}`,
  },
  posts: {
    list: "/api/posts",
    detail: (slug: string) => `/api/posts/${encodeURIComponent(slug)}`,
  },
  drafts: {
    list: "/api/drafts",
    detail: (id: string) => `/api/drafts/${encodeURIComponent(id)}`,
    publish: (id: string) => `/api/drafts/${encodeURIComponent(id)}/publish`,
  },
  tags: {
    list: "/api/tags",
    detail: (id: string) => `/api/tags/${encodeURIComponent(id)}`,
  },
  visitor: "/api/visitor",
} as const;
