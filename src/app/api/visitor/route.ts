import prisma from "@/lib/db/prisma";
import { NextRequest, NextResponse } from "next/server";

const SITE_STATS_ID = "main";

export async function POST(req: NextRequest) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    const hasVisited = req.cookies.get("visited");

    if (hasVisited) {
      const todayVisitor = await prisma.visitor.findUnique({
        where: { date: today },
      });

      const siteStats = await prisma.siteStats.findUnique({
        where: { id: SITE_STATS_ID },
      });

      return NextResponse.json({
        todayVisitors: todayVisitor?.count || 0,
        totalVisitors: siteStats?.totalVisitors || 0,
        counted: false,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const todayVisitor = await tx.visitor.upsert({
        where: { date: today },
        update: { count: { increment: 1 } },
        create: { date: today, count: 1 },
      });

      const siteStats = await tx.siteStats.upsert({
        where: { id: SITE_STATS_ID },
        update: { totalVisitors: { increment: 1 } },
        create: { id: SITE_STATS_ID, totalVisitors: 1 },
      });

      return {
        todayVisitors: todayVisitor.count,
        totalVisitors: siteStats.totalVisitors,
        counted: true,
      };
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const response = NextResponse.json(result);
    response.cookies.set("visited", "true", {
      expires: tomorrow,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Visitor tracking error:", error);
    return NextResponse.json({ error: "Failed to track visitor" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

    const [todayVisitor, siteStats] = await Promise.all([
      prisma.visitor.findUnique({
        where: { date: today },
      }),
      prisma.siteStats.findUnique({
        where: { id: SITE_STATS_ID },
      }),
    ]);

    return NextResponse.json({
      todayVisitors: todayVisitor?.count || 0,
      totalVisitors: siteStats?.totalVisitors || 0,
    });
  } catch (error) {
    console.error("Failed to get visitor stats:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
