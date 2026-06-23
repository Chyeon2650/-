"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import type { ToastMessage } from "@/lib/types";

export default function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  const Icon =
    toast.tone === "success"
      ? CheckCircle2
      : toast.tone === "error"
        ? CircleAlert
        : Info;

  const tone =
    toast.tone === "error"
      ? "border-rose-200 text-rose-700"
      : toast.tone === "success"
        ? "border-sky-200 text-sky-700"
        : "border-slate-200 text-slate-700";

  return (
    <div
      className={`toast-in fixed bottom-24 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg ${tone}`}
      role="status"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
