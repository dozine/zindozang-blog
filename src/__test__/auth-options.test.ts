/** @jest-environment node */
import NextAuth, { type Session } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/services/authService";

jest.mock("@/lib/db/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [{ name: "next-auth.session-token", value: "test-token" }],
  }),
  headers: async () => new Headers({ host: "localhost:3000" }),
}));

const signIn = authOptions.callbacks?.signIn;
const sessionCallback = authOptions.callbacks?.session;
if (!signIn || !sessionCallback) throw new Error("인증 콜백이 설정되지 않았습니다.");

const originalAdminEmail = process.env.MYEMAIL;
const adminEmail = "admin@example.test";
const callbackParams = (session: Session) => ({
  session,
  token: {},
  user: { id: "user-1", email: adminEmail, emailVerified: null, name: null, image: null },
  newSession: null,
  trigger: "update" as const,
});

beforeEach(() => {
  process.env.MYEMAIL = adminEmail;
});

afterAll(() => {
  if (originalAdminEmail === undefined) delete process.env.MYEMAIL;
  else process.env.MYEMAIL = originalAdminEmail;
});

test("관리자 이메일만 로그인을 허용한다", async () => {
  expect(await signIn({ user: { id: "1", email: adminEmail }, account: null })).toBe(true);
  expect(await signIn({ user: { id: "2", email: "other@example.test" }, account: null })).toBe(
    false
  );
  expect(await signIn({ user: { id: "3" }, account: null })).toBe(false);
});

test("관리자 세션은 반환하고 다른 사용자 세션은 거부한다", async () => {
  const session = { user: { email: adminEmail }, expires: "2099-01-01" };
  await expect(sessionCallback(callbackParams(session))).resolves.toEqual(session);
  await expect(
    sessionCallback(
      callbackParams({ user: { email: "other@example.test" }, expires: "2099-01-01" })
    )
  ).rejects.toThrow("Unauthorized session");
  await expect(sessionCallback(callbackParams({ expires: "2099-01-01" }))).rejects.toThrow(
    "Unauthorized session"
  );
});

test("관리자 이메일 설정이 없으면 로그인과 세션을 모두 거부한다", async () => {
  delete process.env.MYEMAIL;
  expect(await signIn({ user: { id: "1", email: adminEmail }, account: null })).toBe(false);
  expect(await signIn({ user: { id: "2" }, account: null })).toBe(false);
  await expect(
    sessionCallback(callbackParams({ user: { email: adminEmail }, expires: "2099-01-01" }))
  ).rejects.toThrow("Unauthorized session");
});

test("NextAuth 세션 응답에서 허용되지 않은 기존 세션을 반환하지 않는다", async () => {
  const runSession = async (email: string) => {
    const handler = NextAuth({
      ...authOptions,
      secret: "test-secret",
      useSecureCookies: false,
      session: { strategy: "database" },
      logger: { error: jest.fn() },
      adapter: {
        ...authOptions.adapter,
        getSessionAndUser: async () => ({
          session: {
            sessionToken: "test-token",
            userId: "user-1",
            expires: new Date("2099-01-01"),
          },
          user: { id: "user-1", email, emailVerified: null, name: null, image: null },
        }),
        updateSession: async () => null,
      },
    });
    const response: Response = await handler(
      new NextRequest("http://localhost:3000/api/auth/session"),
      { params: Promise.resolve({ nextauth: ["session"] }) }
    );
    return response.json();
  };

  const adminResponse = await runSession(adminEmail);
  expect(adminResponse.user.email).toBe(adminEmail);
  const deniedResponse = await runSession("other@example.test");
  expect(deniedResponse).toEqual({});
});
