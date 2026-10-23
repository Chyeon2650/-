import "server-only";
import { NextResponse } from "next/server";

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw NextResponse.json({ error: "올바른 JSON 요청을 보내 주세요." }, { status: 400 });
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  return body as Record<string, unknown>;
}

export function isMemoId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
