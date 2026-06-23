import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "mindlet_admin";
const SESSION_VALUE = "mindlet-admin-v1";

function signingSecret() {
  const secret =
    process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD_HASH;
  if (!secret) throw new Error("관리자 세션 환경 변수가 설정되지 않았습니다.");
  return secret;
}

function signature() {
  return createHmac("sha256", signingSecret())
    .update(SESSION_VALUE)
    .digest("hex");
}

export function createAdminSessionToken() {
  return `${SESSION_VALUE}.${signature()}`;
}

export async function isAdminRequest() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const expected = createAdminSessionToken();
  const left = Buffer.from(token);
  const right = Buffer.from(expected);

  return left.length === right.length && timingSafeEqual(left, right);
}
