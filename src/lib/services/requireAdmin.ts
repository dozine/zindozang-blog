import { NextResponse } from "next/server";
import { getAuthSession } from "./authService";

/** Returns an error response unless the current session belongs to the configured admin. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const adminEmail = process.env.MYEMAIL;
  if (!adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  return null;
}
