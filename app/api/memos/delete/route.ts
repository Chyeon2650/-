import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isFourDigitPassword, verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !isFourDigitPassword(body.password)) {
      return NextResponse.json(
        { error: "메모와 숫자 4자리 비밀번호를 확인해 주세요." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: memo, error: readError } = await supabase
      .from("memos")
      .select("id,password_hash")
      .eq("id", body.id)
      .maybeSingle();

    if (readError) throw readError;
    if (!memo) {
      return NextResponse.json({ error: "메모를 찾을 수 없습니다." }, { status: 404 });
    }

    const matches = await verifyPassword(body.password, memo.password_hash);
    if (!matches) {
      return NextResponse.json(
        { error: "삭제 비밀번호가 일치하지 않습니다." },
        { status: 403 },
      );
    }

    const { error: deleteError } = await supabase
      .from("memos")
      .delete()
      .eq("id", body.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/memos/delete", error);
    return NextResponse.json(
      { error: "메모를 삭제하지 못했습니다." },
      { status: 500 },
    );
  }
}
