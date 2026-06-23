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
    async (showSuccess = false) => {
      setSyncing(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("memos")
          .select("id,title,content,created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setMemos((data ?? []) as Memo[]);
        if (showSuccess) notify("최신 메모로 동기화했습니다.", "success");
      } catch (caught) {
        console.error(caught);
        notify(
          "Supabase 연결을 확인해 주세요. 환경 변수와 schema.sql 적용이 필요합니다.",
          "error",
        );
      } finally {
        setSyncing(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    let active = true;

    try {
      const supabase = getSupabaseBrowserClient();
      void supabase
        .from("memos")
        .select("id,title,content,created_at")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!active) return;
          if (error) {
            console.error(error);
            notify(
              "Supabase 연결을 확인해 주세요. 환경 변수와 schema.sql 적용이 필요합니다.",
              "error",
            );
          } else {
            setMemos((data ?? []) as Memo[]);
          }
          setSyncing(false);
        });
    } catch (caught) {
      console.error(caught);
      queueMicrotask(() => {
        if (!active) return;
        setSyncing(false);
        notify(
          "Supabase 연결을 확인해 주세요. 환경 변수와 schema.sql 적용이 필요합니다.",
          "error",
        );
      });
    }

    void fetch("/api/admin/session")
      .then((response) => response.json())
      .then((result) => {
        if (active) setIsAdmin(Boolean(result.isAdmin));
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });

    return () => {
      active = false;
    };
  }, [notify]);

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
    await loadMemos();
    notify("새 메모를 붙였습니다.", "success");
  }

  async function afterDelete(message: string) {
    await loadMemos();
    notify(message, "success");
  }

  async function deleteAll() {
    const response = await fetch("/api/admin/delete-all", { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "전체 삭제에 실패했습니다.");
    await loadMemos();
    notify("모든 메모를 삭제했습니다.", "success");
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
