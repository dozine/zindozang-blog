/** @jest-environment node */
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/services/authService";
import { GET as list, POST as save } from "@/app/api/drafts/route";
import { GET as load, DELETE as remove } from "@/app/api/drafts/[id]/route";
import { POST as publish } from "@/app/api/drafts/[id]/publish/route";

jest.mock("@/lib/services/authService", () => ({ getAuthSession: jest.fn() }));
jest.mock("@/lib/db/prisma", () => ({
  __esModule: true,
  default: {
    post: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    postTag: { deleteMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));
const db = prisma as unknown as {
  post: Record<string, jest.Mock>;
  postTag: Record<string, jest.Mock>;
  $transaction: jest.Mock;
};
const email = "me@example.test";
const date = new Date("2026-11-27T03:00:00Z");
const content = {
  slugInput: "",
  fontFamily: "serif" as const,
  title: "",
  value: "미완성 내용",
  uploadedImages: ["/a.png", "/b.png"],
  thumbnailImg: "/b.png",
  catSlug: "",
  tags: [],
  isPublished: true,
  tagInput: "",
};
const post = {
  id: "post-1",
  title: "",
  desc: content.value,
  img: ["/b.png", "/a.png"],
  catSlug: null,
  tags: [],
  isPublished: true,
  status: "DRAFT",
  createdAt: date,
  updatedAt: date,
  slug: "draft-uuid",
  views: 0,
  userEmail: email,
  user: { id: "user-1", name: "Me", image: null },
};
const req = (body?: unknown) =>
  new NextRequest(
    "http://localhost/api/drafts",
    body === undefined ? undefined : { method: "POST", body: JSON.stringify(body) }
  );
const context = { params: Promise.resolve({ id: post.id }) };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getAuthSession).mockResolvedValue({ user: { email }, expires: "2099-01-01" });
  db.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(db));
  db.post.create.mockResolvedValue(post);
  db.post.findUniqueOrThrow.mockResolvedValue(post);
});

test("초안 API는 로그인하지 않으면 조회·저장·불러오기·게시를 거절한다", async () => {
  jest.mocked(getAuthSession).mockResolvedValue(null);
  const responses = [
    await list(),
    await save(req({ content })),
    await load(req(), context),
    await publish(req({}), context),
  ];
  responses.forEach((response) => expect(response.status).toBe(401));
  expect(db.post.findMany).not.toHaveBeenCalled();
  expect(db.$transaction).not.toHaveBeenCalled();
});
test("초안 목록은 작성자의 DRAFT 글만 가져온다", async () => {
  db.post.findMany.mockResolvedValue([post]);
  const response = await list();
  expect(response.status).toBe(200);
  expect(db.post.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { userEmail: email, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
    })
  );
  const items = await response.json();
  expect(items[0].id).toBe(post.id);
  expect(items[0]).not.toHaveProperty("userEmail");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
test("제목이 비어도 Post에 DRAFT로 저장하며 썸네일과 사진 목록을 보존한다", async () => {
  const response = await save(req({ content }));
  expect(response.status).toBe(200);
  expect(db.post.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      title: "",
      desc: content.value,
      status: "DRAFT",
      userEmail: email,
      img: ["/b.png", "/a.png"],
    }),
  });
  expect((await response.json()).content.thumbnailImg).toBe("/b.png");
});
test("초안 갱신은 기존 Post의 소유자·상태·저장 시각을 검사한다", async () => {
  db.post.updateMany.mockResolvedValue({ count: 1 });
  const response = await save(req({ id: post.id, updatedAt: date.toISOString(), content }));
  expect(response.status).toBe(200);
  expect(db.post.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: post.id, userEmail: email, status: "DRAFT", updatedAt: date },
    })
  );
  expect(db.post.create).not.toHaveBeenCalled();
});
test("게시글이나 오래된 초안 버전은 초안 저장으로 덮어쓸 수 없다", async () => {
  db.post.updateMany.mockResolvedValue({ count: 0 });
  const response = await save(req({ id: post.id, updatedAt: date.toISOString(), content }));
  expect(response.status).toBe(409);
  expect(db.postTag.deleteMany).not.toHaveBeenCalled();
});
test("타인의 초안이나 게시된 글은 초안 조회에서 반환하지 않는다", async () => {
  db.post.findFirst.mockResolvedValue(null);
  expect((await load(req(), context)).status).toBe(404);
  expect(db.post.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: { id: post.id, userEmail: email, status: "DRAFT" } })
  );
});
test("초안 게시 시 새 레코드 없이 같은 Post를 PUBLISHED로 전환한다", async () => {
  db.post.updateMany.mockResolvedValue({ count: 1 });
  db.post.findUniqueOrThrow.mockResolvedValue({
    ...post,
    title: "완성한 글",
    status: "PUBLISHED",
    slug: "완성한-글",
  });
  const response = await publish(
    req({
      title: "완성한 글",
      desc: "완성한 내용",
      updatedAt: date.toISOString(),
      isPublished: false,
    }),
    context
  );
  expect(response.status).toBe(200);
  expect(db.post.updateMany).toHaveBeenCalledWith({
    where: { id: post.id, userEmail: email, status: "DRAFT", updatedAt: date },
    data: expect.objectContaining({
      status: "PUBLISHED",
      isPublished: false,
      slug: "완성한-글",
      createdAt: expect.any(Date),
    }),
  });
  expect((await response.json()).id).toBe(post.id);
  expect(db.post.create).not.toHaveBeenCalled();
});
test("초안 게시에도 제목과 본문은 필수다", async () => {
  expect(
    (await publish(req({ title: "", desc: "본문", updatedAt: date.toISOString() }), context)).status
  ).toBe(400);
  expect(db.$transaction).not.toHaveBeenCalled();
});
test("이미 게시되거나 다른 탭에서 바뀐 초안을 다시 게시하지 않는다", async () => {
  db.post.updateMany.mockResolvedValue({ count: 0 });
  expect(
    (await publish(req({ title: "제목", desc: "본문", updatedAt: date.toISOString() }), context))
      .status
  ).toBe(409);
  expect(db.postTag.deleteMany).not.toHaveBeenCalled();
  expect(db.post.findUniqueOrThrow).not.toHaveBeenCalled();
});

test("저장 시각이 null인 초안도 조회 응답으로 반환한다", async () => {
  db.post.findFirst.mockResolvedValue({ ...post, updatedAt: null });
  const response = await load(req(), context);
  expect(response.status).toBe(200);
  expect((await response.json()).updatedAt).toBeNull();
});

test("저장 시각이 없는 초안을 저장할 때 null과 필드 미존재를 함께 검사한다", async () => {
  db.post.updateMany.mockResolvedValue({ count: 1 });
  const response = await save(req({ id: post.id, updatedAt: null, content }));
  expect(response.status).toBe(200);
  expect(db.post.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: post.id,
        userEmail: email,
        status: "DRAFT",
        OR: [{ updatedAt: null }, { updatedAt: { isSet: false } }],
      },
    })
  );
});

test("초안 삭제는 인증과 소유자 및 상태 검사를 통과해야 한다", async () => {
  jest.mocked(getAuthSession).mockResolvedValue(null);
  expect((await remove(req({ updatedAt: date.toISOString() }), context)).status).toBe(401);
  jest.mocked(getAuthSession).mockResolvedValue({ user: { email }, expires: "2099-01-01" });
  db.post.findFirst.mockResolvedValue(null);
  expect((await remove(req({ updatedAt: date.toISOString() }), context)).status).toBe(404);
  expect(db.post.findFirst).toHaveBeenCalledWith({
    where: { id: post.id, userEmail: email, status: "DRAFT" },
  });
  expect(db.post.deleteMany).not.toHaveBeenCalled();
  expect(db.postTag.deleteMany).not.toHaveBeenCalled();
});

test("초안과 태그 관계를 같은 트랜잭션에서 삭제한다", async () => {
  db.post.findFirst.mockResolvedValue(post);
  db.post.deleteMany.mockResolvedValue({ count: 1 });
  const response = await remove(req({ updatedAt: date.toISOString() }), context);
  expect(response.status).toBe(200);
  expect(db.postTag.deleteMany).toHaveBeenCalledWith({ where: { postId: post.id } });
  expect(db.post.deleteMany).toHaveBeenCalledWith({
    where: { id: post.id, userEmail: email, status: "DRAFT", updatedAt: date },
  });
  expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function));
});

test("다른 탭에서 저장한 초안은 오래된 목록에서 삭제하지 않는다", async () => {
  db.post.findFirst.mockResolvedValue(post);
  db.post.deleteMany.mockResolvedValue({ count: 0 });
  expect((await remove(req({ updatedAt: date.toISOString() }), context)).status).toBe(409);
});

test("삭제 요청에 저장 시각이 빠지면 거절한다", async () => {
  expect((await remove(req({}), context)).status).toBe(400);
  expect(db.$transaction).not.toHaveBeenCalled();
});

test("초안 저장과 게시 전환에 선택한 본문 글꼴을 유지한다", async () => {
  db.post.findUniqueOrThrow.mockResolvedValue({ ...post, fontFamily: "nanum" });
  const saved = await save(req({ content: { ...content, fontFamily: "nanum" } }));
  expect(saved.status).toBe(200);
  expect((await saved.json()).content.fontFamily).toBe("nanum");
  expect(db.post.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ fontFamily: "nanum" }),
  });
  db.post.updateMany.mockResolvedValue({ count: 1 });
  const published = await publish(
    req({ title: "제목", desc: "본문", updatedAt: date.toISOString(), fontFamily: "nanum" }),
    context
  );
  expect(published.status).toBe(200);
  expect(db.post.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ fontFamily: "nanum" }) })
  );
});

test("직접 입력한 주소를 초안에 보관하고 불러온다", async () => {
  db.post.findUniqueOrThrow.mockResolvedValue({ ...post, draftSlug: "custom-address" });
  const response = await save(req({ content: { ...content, slugInput: "custom-address" } }));
  expect(response.status).toBe(200);
  expect(db.post.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      draftSlug: "custom-address",
      slug: expect.stringMatching(/^draft-/),
    }),
  });
  expect((await response.json()).content.slugInput).toBe("custom-address");
});

test("초안 게시 시 직접 입력한 주소를 제목보다 우선하고 임시 설정을 정리한다", async () => {
  db.post.updateMany.mockResolvedValue({ count: 1 });
  const response = await publish(
    req({
      title: "원래 제목",
      desc: "본문",
      slug: "Custom Address",
      updatedAt: date.toISOString(),
    }),
    context
  );
  expect(response.status).toBe(200);
  expect(db.post.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ slug: "custom-address", draftSlug: null }),
    })
  );
});

test("게시 요청에서 주소를 생략하면 초안에 보관한 주소를 사용한다", async () => {
  db.post.findFirst.mockResolvedValue({ draftSlug: "saved-address" });
  db.post.updateMany.mockResolvedValue({ count: 1 });
  await publish(req({ title: "제목", desc: "본문", updatedAt: date.toISOString() }), context);
  expect(db.post.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ slug: "saved-address" }) })
  );
});
