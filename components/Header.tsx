"use client";

import { Search, Share2, Shield } from "lucide-react";
import SyncButton from "./SyncButton";

export default function Header({
  search,
  onSearch,
  onSync,
  syncing,
  onShare,
  onAdmin,
  isAdmin,
}: {
  search: string;
  onSearch: (value: string) => void;
  onSync: () => void;
  syncing: boolean;
  onShare: () => void;
  onAdmin: () => void;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-[0.22em] text-sky-600">
              INSTANT BOARD
            </span>
            {isAdmin && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                ADMIN MODE
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              MINDLET
            </h1>
            <p className="hidden text-sm text-slate-500 md:block">
              개인용 메모 보드
            </p>
          </div>
        </div>

        <label className="relative hidden w-full max-w-xs md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="메모 검색"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </label>

        <div className="flex items-center gap-2">
          <SyncButton onSync={onSync} syncing={syncing} />
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            aria-label="보드 공유 링크 복사"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">공유</span>
          </button>
          <button
            type="button"
            onClick={onAdmin}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium shadow-sm transition ${
              isAdmin
                ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="관리자 패널 열기"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden lg:inline">관리자</span>
          </button>
        </div>
      </div>
    </header>
  );
}
