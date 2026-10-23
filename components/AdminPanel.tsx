"use client";

import { useState } from "react";
import { LoaderCircle, LogOut, ShieldCheck, Trash2, X } from "lucide-react";

export default function AdminPanel({
  open,
  isAdmin,
  onClose,
  onAuthChanged,
  onDeleteAll,
}: {
  open: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onAuthChanged: (isAdmin: boolean, message: string) => void;
  onDeleteAll: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  if (!open) return null;

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "로그인하지 못했습니다.");
      setPassword("");
      onAuthChanged(true, "관리자 모드로 전환했습니다.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("로그아웃하지 못했습니다.");
      setConfirmAll(false);
      onAuthChanged(false, "관리자 모드를 종료했습니다.");
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그아웃하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAll() {
    setLoading(true);
    setError("");
    try {
      await onDeleteAll();
      setConfirmAll(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "전체 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[2px]">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-sky-600">
              청현 · 관리자
            </p>
            <h2 className="mt-1 text-xl font-semibold">관리자 패널</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="관리자 패널 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isAdmin ? (
          <form onSubmit={login} className="mt-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-8 w-8 text-sky-500" />
              <p className="mt-3 text-sm leading-6 text-slate-600">
                관리자 비밀번호는 서버에서만 검증됩니다. 로그인하면 모든 메모를
                강제 삭제할 수 있습니다.
              </p>
            </div>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                관리자 비밀번호
              </span>
              <input
                autoFocus
                type="password"
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            {error && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
            >
              {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              관리자 로그인
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4">
            {error && !confirmAll && (
              <p role="alert" className="text-sm text-rose-700">{error}</p>
            )}
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-sky-800">
                <ShieldCheck className="h-5 w-5" />
                Admin Mode
              </div>
              <p className="mt-2 text-sm leading-6 text-sky-700">
                각 카드 메뉴에서 작성 비밀번호 없이 강제 삭제할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfirmAll(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 className="h-5 w-5" />
              <span>
                <strong className="block text-sm">전체 메모 삭제</strong>
                <span className="mt-0.5 block text-xs">되돌릴 수 없습니다.</span>
              </span>
            </button>

            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-4 w-4" />
              관리자 로그아웃
            </button>
          </div>
        )}

        {confirmAll && (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-white p-4 shadow-lg">
            <h3 className="font-semibold text-rose-700">정말 모두 삭제할까요?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              보드의 모든 메모가 영구적으로 삭제됩니다.
            </p>
            {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAll(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={deleteAll}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                전체 삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
