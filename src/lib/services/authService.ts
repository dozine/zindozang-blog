import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import prisma from "../db/prisma";
import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import type { Session } from "next-auth";

function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && process.env.MYEMAIL && email === process.env.MYEMAIL);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // javascript와 typescript연결 방식이 다름 .
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return isAdminEmail(user.email);
    },
    async session({ session }: { session: Session }) {
      if (isAdminEmail(session.user?.email)) {
        return session;
      }
      // NextAuth v4는 세션 콜백 오류를 처리하고 세션을 반환하지 않는다.
      throw new Error("Unauthorized session");
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);
