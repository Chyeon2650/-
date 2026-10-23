"use client";

import { useState } from "react";
import { LoaderCircle, MoreHorizontal, Trash2, X } from "lucide-react";
import type { Memo } from "@/lib/types";

export default function MemoCard({
  memo,
  index,
  isAdmin,
  onDeleted,
}: {
  memo: Memo;
  index: number;
  isAdmin: boolean;
  onDeleted: (message: string) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function removeMemo() {
    if (!isAdmin && !/^\d{4}$/.test(password)) {
      setError("숫자 4자리 비밀번호를 입력해 주세요.");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(
        isAdmin ? "/api/admin/delete" : "/api/memos/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: memo.id, password }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "삭제하지 못했습니다.");
      setDeleteOpen(false);
      await onDeleted("메모를 삭제했습니다.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "삭제하지 못했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <article
        className={`relative break-inside-avoid rounded-xl border border-sky-300 bg-slate-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          index % 3 === 0
            ? "rotate-[-0.25deg]"
            : index % 3 === 1
              ? "rotate-[0.2deg]"
              : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 whitespace-pre-wrap break-words text-base font-semibold leading-6 text-slate-950">
            {memo.title}
          </h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
              aria-label="메모 메뉴"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-10 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setPassword("");
                    setError("");
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium ${
                    isAdmin
                      ? "text-rose-700 hover:bg-rose-50"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  {isAdmin ? "강제 삭제" : "삭제"}
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
          {memo.content}
        </p>
        <p className="mt-5 font-mono text-[11px] text-slate-400">
          {new Intl.DateTimeFormat("ko-KR", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(memo.created_at))}
        </p>
      </article>

      {deleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-rose-600">
                  DELETE
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  {isAdmin ? "메모를 강제로 삭제할까요?" : "메모를 삭제할까요?"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isAdmin && (
              <label className="mt-5 block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  작성 시 설정한 비밀번호
                </span>
                <input
                  autoFocus
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  inputMode="numeric"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 font-mono tracking-[0.35em] outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="0000"
                />
              </label>
            )}

            {error && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={removeMemo}
                disabled={deleting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
