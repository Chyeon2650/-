import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createAdminSessionToken } from "@/lib/adminSession";
import { readJsonObject } from "@/lib/apiValidation";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const adminHash = process.env.ADMIN_PASSWORD_HASH;

    if (typeof body.password !== "string" || !body.password || Buffer.byteLength(body.password, "utf8") > 72) {
      return NextResponse.json(
        { error: "관리자 비밀번호를 확인해 주세요. 최대 72바이트까지 입력할 수 있습니다." },
        { status: 400 },
      );
    }
    if (!adminHash) {
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
      maxAge: ADMIN_SESSION_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/admin/login", error);
    return NextResponse.json(
      { error: "관리자 로그인에 실패했습니다." },
      { status: 500 },
    );
  }
}
