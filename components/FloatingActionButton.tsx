"use client";

import { Plus } from "lucide-react";

export default function FloatingActionButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_14px_35px_rgba(14,165,233,0.35)] transition hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-[0_18px_40px_rgba(14,165,233,0.42)] focus:outline-none focus:ring-4 focus:ring-sky-200 sm:bottom-8 sm:right-8"
      aria-label="새 메모 작성"
    >
      <Plus className="h-7 w-7" strokeWidth={2.4} />
    </button>
  );
}
