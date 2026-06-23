import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSessionToken } from "@/lib/adminSession";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminHash || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "관리자 설정을 확인해 주세요." },
        { status: 500 },
      );
    }

    const matches = await verifyPassword(body.password, adminHash);
    if (!matches) {
      return NextResponse.json(
        { error: "관리자 비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    console.error("POST /api/admin/login", error);
    return NextResponse.json(
      { error: "관리자 로그인에 실패했습니다." },
      { status: 500 },
    );
  }
}
