import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "cheonghyeon_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;
const SESSION_VERSION = "cheonghyeon-admin-v1";

function signingSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET에 32자 이상의 무작위 문자열이 필요합니다.");
  }
  return secret;
}

function signature(payload: string) {
  return createHmac("sha256", signingSecret())
    .update(`${payload}.${process.env.ADMIN_PASSWORD_HASH ?? ""}`)
    .digest("hex");
}

export function createAdminSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  const payload = `${SESSION_VERSION}.${expiresAt}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${signature(payload)}`;
}

export async function isAdminRequest() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, expiry, nonce, suppliedSignature] = parts;
  if (
    version !== SESSION_VERSION ||
    !/^\d{10}$/.test(expiry) ||
    !/^[a-f0-9]{32}$/.test(nonce) ||
    !/^[a-f0-9]{64}$/.test(suppliedSignature)
  ) {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  if (Number(expiry) <= now || Number(expiry) > now + ADMIN_SESSION_SECONDS) return false;

  try {
    const expected = signature(parts.slice(0, 3).join("."));
    return timingSafeEqual(
      Buffer.from(suppliedSignature, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
