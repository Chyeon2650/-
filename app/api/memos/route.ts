import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { readJsonObject } from "@/lib/apiValidation";
import { hashPassword, isFourDigitPassword } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용을 모두 입력해 주세요." },
        { status: 400 },
      );
    }
    if (title.length > 80 || content.length > 2000) {
      return NextResponse.json(
        { error: "메모가 허용된 길이를 초과했습니다." },
        { status: 400 },
      );
    }
    if (!isFourDigitPassword(body.password)) {
      return NextResponse.json(
        { error: "삭제 비밀번호는 숫자 4자리여야 합니다." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(body.password);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("memos")
      .insert({ title, content, password_hash: passwordHash })
      .select("id,title,content,created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ memo: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("POST /api/memos", error);
    return NextResponse.json(
      { error: "메모를 저장하지 못했습니다." },
      { status: 500 },
    );
  }
}
