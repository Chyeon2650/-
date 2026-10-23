import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";

// Isolated HTTP substitute: these tests never connect to a real Supabase project.
const memos = new Map();
const adminPassword = "test-admin-password";
const sessionSecret = "test-only-session-secret-with-more-than-32-characters";
let adminHash;
let app;
let baseUrl;
let output = "";
let databaseUnavailable = false;

const database = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.headers.apikey !== "test-server-key") {
    response.writeHead(403).end(JSON.stringify({ message: "Server key required" }));
    return;
  }
  if (databaseUnavailable) {
    response.writeHead(503).end(JSON.stringify({ message: "Test database unavailable" }));
    return;
  }
  const url = new URL(request.url, "http://localhost");
  assert.equal(url.pathname, "/rest/v1/memos");
  const id = url.searchParams.get("id")?.replace(/^eq\./, "");
  if (request.method === "POST") {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const memo = { ...JSON.parse(raw), id: randomUUID(), created_at: new Date().toISOString() };
    memos.set(memo.id, memo);
    const { password_hash: hash, ...publicMemo } = memo;
    assert.ok(hash.startsWith("$2"));
    response.writeHead(201).end(JSON.stringify(publicMemo));
  } else if (request.method === "GET") {
    response.end(JSON.stringify(memos.has(id) ? [memos.get(id)] : []));
  } else if (request.method === "DELETE") {
    if (id === "not.is.null") memos.clear();
    else memos.delete(id);
    response.writeHead(204).end();
  } else {
    response.writeHead(405).end();
  }
});

before(async () => {
  adminHash = await bcrypt.hash(adminPassword, 4);
  database.listen(0, "127.0.0.1");
  await once(database, "listening");
  const portProbe = createServer();
  portProbe.listen(0, "127.0.0.1");
  await once(portProbe, "listening");
  const port = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  baseUrl = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    windowsHide: true,
    env: {
      ...process.env,
      // Next.js skips .env.local in test mode so personal settings cannot alter fixtures.
      NODE_ENV: "test",
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${database.address().port}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-public-key",
      SUPABASE_SERVICE_ROLE_KEY: "test-server-key",
      ADMIN_PASSWORD_HASH: adminHash,
      ADMIN_SESSION_SECRET: sessionSecret,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout.on("data", (chunk) => { output += chunk; });
  app.stderr.on("data", (chunk) => { output += chunk; });
  let startupError;
  app.on("error", (error) => { startupError = error; });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (startupError) throw startupError;
    if (app.exitCode !== null) throw new Error(output);
    try {
      const response = await fetch(`${baseUrl}/api/admin/session`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) return;
    } catch { /* Wait until Next.js is listening. */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Test server did not start. ${output}`);
}, { timeout: 130_000 });

after(async () => {
  if (app && app.exitCode === null) {
    app.kill();
    await once(app, "exit");
  }
  database.closeAllConnections();
  await new Promise((resolve) => database.close(resolve));
});

async function post(path, body, cookie) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  });
}

async function createMemo() {
  const response = await post("/api/memos", { title: " 청현 ", content: " 첫 메모 ", password: "1234" });
  assert.equal(response.status, 201);
  const { memo } = await response.json();
  assert.equal(memo.title, "청현");
  assert.equal(memo.content, "첫 메모");
  assert.equal(memo.password_hash, undefined);
  assert.equal(await bcrypt.compare("1234", memos.get(memo.id).password_hash), true);
  return memo;
}

test("page uses the 청현 name", async () => {
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<title>청현 · 메모 보드<\/title>/);
});

test("malformed JSON and invalid inputs return 400 instead of 500", async () => {
  for (const path of ["/api/memos", "/api/memos/delete", "/api/admin/login"]) {
    for (const body of ["{", "null", "[]", '"text"']) {
      const response = await fetch(`${baseUrl}${path}`, { method: "POST", body });
      assert.equal(response.status, 400, `${path}: ${body}`);
    }
  }
  for (const body of [
    { title: "", content: "메모", password: "1234" },
    { title: "a".repeat(81), content: "메모", password: "1234" },
    { title: "제목", content: "a".repeat(2001), password: "1234" },
    { title: "제목", content: "메모", password: "123" },
  ]) assert.equal((await post("/api/memos", body)).status, 400);
  assert.equal((await post("/api/memos/delete", { id: "invalid", password: "1234" })).status, 400);
  assert.equal((await post("/api/admin/login", { password: "가".repeat(25) })).status, 400);
});

test("memo creation hashes the password; only a matching password deletes it", async () => {
  const memo = await createMemo();
  assert.equal((await post("/api/memos/delete", { id: memo.id, password: "9999" })).status, 403);
  assert.ok(memos.has(memo.id));
  assert.equal((await post("/api/memos/delete", { id: memo.id, password: "1234" })).status, 200);
  assert.equal(memos.has(memo.id), false);
  assert.equal((await post("/api/memos/delete", { id: memo.id, password: "1234" })).status, 404);
});

test("admin session, protected deletion and logout", async () => {
  assert.equal((await post("/api/admin/delete-all", {})).status, 401);
  assert.equal((await post("/api/admin/delete", { id: randomUUID() })).status, 401);
  assert.equal((await post("/api/admin/login", { password: "wrong" })).status, 401);
  const login = await post("/api/admin/login", { password: adminPassword });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=strict/i);
  assert.match(setCookie, /Max-Age=28800/i);
  const cookie = setCookie.split(";")[0];
  const session = await fetch(`${baseUrl}/api/admin/session`, { headers: { Cookie: cookie } });
  assert.equal((await session.json()).isAdmin, true);
  assert.equal(session.headers.get("cache-control"), "no-store");
  assert.equal((await post("/api/admin/delete", { id: "invalid" }, cookie)).status, 400);
  const memo = await createMemo();
  assert.equal((await post("/api/admin/delete", { id: memo.id }, cookie)).status, 200);
  assert.equal(memos.has(memo.id), false);
  await createMemo();
  assert.equal((await post("/api/admin/delete-all", {}, cookie)).status, 200);
  assert.equal(memos.size, 0);
  const logout = await post("/api/admin/logout", {}, cookie);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
});

test("forged and correctly signed but expired admin cookies are rejected", async () => {
  const expired = `cheonghyeon-admin-v1.${Math.floor(Date.now() / 1000) - 1}.${"a".repeat(32)}`;
  const signature = createHmac("sha256", sessionSecret).update(`${expired}.${adminHash}`).digest("hex");
  for (const token of ["forged", `${expired}.${signature}`, `${expired}.${"0".repeat(64)}`]) {
    const cookie = `cheonghyeon_admin=${token}`;
    const session = await fetch(`${baseUrl}/api/admin/session`, { headers: { Cookie: cookie } });
    assert.equal((await session.json()).isAdmin, false);
    assert.equal((await post("/api/admin/delete-all", {}, cookie)).status, 401);
  }
});

test("database failures produce controlled JSON errors", async () => {
  databaseUnavailable = true;
  try {
    const response = await post("/api/memos", { title: "제목", content: "내용", password: "1234" });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "메모를 저장하지 못했습니다." });
  } finally {
    databaseUnavailable = false;
  }
});
