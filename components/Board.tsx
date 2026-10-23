"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPanel from "./AdminPanel";
import FloatingActionButton from "./FloatingActionButton";
import Header from "./Header";
import MemoCard from "./MemoCard";
import MemoFormModal from "./MemoFormModal";
import Toast from "./Toast";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Memo, ToastMessage } from "@/lib/types";

export default function Board() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback(
    (message: string, tone: ToastMessage["tone"] = "info") => {
      const next = { id: Date.now(), message, tone };
      setToast(next);
      window.setTimeout(() => {
        setToast((current) => (current?.id === next.id ? null : current));
      }, 3200);
    },
    [],
  );

  const loadMemos = useCallback(
    async (showSuccess = false, signal?: AbortSignal) => {
      setSyncing(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const query = supabase
          .from("memos")
          .select("id,title,content,created_at")
          .order("created_at", { ascending: false });
        const { data, error } = await (signal ? query.abortSignal(signal) : query);

        if (signal?.aborted) return false;
        if (error) throw error;
        setMemos((data ?? []) as Memo[]);
        setLoadError(false);
        if (showSuccess) notify("최신 메모로 동기화했습니다.", "success");
        return true;
      } catch (caught) {
        if (signal?.aborted) return false;
        console.error(caught);
        setLoadError(true);
        notify(
          "메모를 불러오지 못했습니다. 잠시 후 동기화 버튼으로 다시 시도해 주세요.",
          "error",
        );
        return false;
      } finally {
        if (!signal?.aborted) setSyncing(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadMemos(false, controller.signal);
    });

    void fetch("/api/admin/session", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!controller.signal.aborted) setIsAdmin(Boolean(result.isAdmin));
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsAdmin(false);
      });

    return () => {
      controller.abort();
    };
  }, [loadMemos]);

  const filteredMemos = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko");
    if (!query) return memos;
    return memos.filter(
      (memo) =>
        memo.title.toLocaleLowerCase("ko").includes(query) ||
        memo.content.toLocaleLowerCase("ko").includes(query),
    );
  }, [memos, search]);

  async function afterCreate() {
    if (await loadMemos()) notify("새 메모를 붙였습니다.", "success");
  }

  async function afterDelete(message: string) {
    if (await loadMemos()) notify(message, "success");
  }

  async function deleteAll() {
    const response = await fetch("/api/admin/delete-all", { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "전체 삭제에 실패했습니다.");
    if (await loadMemos()) notify("모든 메모를 삭제했습니다.", "success");
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("보드 주소를 클립보드에 복사했습니다.", "success");
    } catch {
      notify("주소 복사에 실패했습니다.", "error");
    }
  }

  return (
    <div className="min-h-screen text-slate-900">
      <Header
        search={search}
        onSearch={setSearch}
        onSync={() => void loadMemos(true)}
        syncing={syncing}
        onShare={() => void share()}
        onAdmin={() => setAdminOpen(true)}
        isAdmin={isAdmin}
      />

      <main className="mx-auto min-h-[calc(100vh-73px)] max-w-[1500px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <label className="mb-5 block md:hidden">
          <span className="sr-only">메모 검색</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="메모 검색"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>

        {loadError && (
          <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            메모를 불러오지 못했습니다. 동기화 버튼으로 다시 시도해 주세요.
          </p>
        )}
        {!syncing && !loadError && filteredMemos.length === 0 && (
          <p role="status" className="py-20 text-center text-sm text-slate-500">
            {search.trim() ? "검색 결과가 없습니다." : "아직 메모가 없습니다. + 버튼으로 첫 생각을 붙여 보세요."}
          </p>
        )}
        {syncing && memos.length === 0 && (
          <p role="status" className="py-20 text-center text-sm text-slate-500">메모를 불러오는 중입니다.</p>
        )}
        {filteredMemos.length > 0 && (
          <section className="memo-grid" aria-label="메모 목록">
            {filteredMemos.map((memo, index) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                index={index}
                isAdmin={isAdmin}
                onDeleted={afterDelete}
              />
            ))}
          </section>
        )}
      </main>

      <FloatingActionButton onClick={() => setFormOpen(true)} />
      <MemoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={afterCreate}
      />
      <AdminPanel
        open={adminOpen}
        isAdmin={isAdmin}
        onClose={() => setAdminOpen(false)}
        onAuthChanged={(nextAdmin, message) => {
          setIsAdmin(nextAdmin);
          notify(message, "success");
        }}
        onDeleteAll={deleteAll}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
