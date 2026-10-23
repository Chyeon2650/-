import { NextResponse } from "next/server";
import { isMemoId, readJsonObject } from "@/lib/apiValidation";
import { isAdminRequest } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await readJsonObject(request);
    if (!isMemoId(body.id)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from("memos")
      .delete()
      .eq("id", body.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/admin/delete", error);
    return NextResponse.json(
      { error: "메모를 강제 삭제하지 못했습니다." },
      { status: 500 },
    );
  }
}
