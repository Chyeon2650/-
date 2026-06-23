"use client";

import { useState } from "react";
import { LoaderCircle, X } from "lucide-react";

export default function MemoFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function closeAndReset() {
    setTitle("");
    setContent("");
    setPassword("");
    setError("");
    onClose();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해 주세요.");
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setError("삭제 비밀번호는 숫자 4자리여야 합니다.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "메모를 저장하지 못했습니다.");

      await onCreated();
      closeAndReset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "메모를 저장하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAndReset();
      }}
    >
      <div
        className="w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-form-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-sky-600">
              NEW MINDLET
            </p>
            <h2 id="memo-form-title" className="mt-1 text-xl font-semibold">
              생각 붙이기
            </h2>
          </div>
          <button
            type="button"
            onClick={closeAndReset}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">제목</span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="짧고 선명하게"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={2000}
              rows={6}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="떠오른 생각을 적어 두세요."
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              삭제 비밀번호
            </span>
            <input
              value={password}
              onChange={(event) =>
                setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 font-mono tracking-[0.35em] outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="0000"
            />
            <span className="mt-1.5 block text-xs text-slate-500">
              이 메모를 삭제할 때 사용할 숫자 4자리입니다.
            </span>
          </label>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeAndReset}
              className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              메모 붙이기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
