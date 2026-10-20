"use client";

import { useEffect, useMemo, useState } from "react";
import { readCachedHistory, removeCachedHistory, type CachedTranslation } from "@/lib/offline";
import { speak } from "@/lib/speech";

export function HistoryList() {
  const [rows, setRows] = useState<CachedTranslation[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setRows(readCachedHistory());
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return rows;
    }
    return rows.filter((row) => row.text.toLowerCase().includes(needle) || row.signLanguage.includes(needle));
  }, [query, rows]);

  function remove(id: string) {
    removeCachedHistory(id);
    setRows(readCachedHistory());
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      speak(text);
    }
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Saved on this device</p>
          <h1 className="font-display text-4xl">Translation history</h1>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search translations"
          className="w-full max-w-sm rounded-full border border-line bg-panel px-4 py-2 outline-none focus:border-gold"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-muted">{query.trim() ? "No matching translations." : "No saved translations yet."}</p>
      )}

      <ul className="grid gap-3">
        {filtered.map((row) => (
          <li key={row.id} className="rounded-[24px] border border-line bg-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl">{row.text}</p>
                <p className="mt-1 text-sm text-muted">
                  {row.signLanguage.toUpperCase()} · {new Date(row.createdAt).toLocaleString()} · {row.signsDetected}{" "}
                  signs
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={() => speak(row.text)}>
                  Speak
                </button>
                <button type="button" className="rounded-full border border-line px-3 py-1.5 text-sm" onClick={() => copyText(row.text)}>
                  Copy
                </button>
                <button
                  type="button"
                  className="rounded-full border border-danger px-3 py-1.5 text-sm text-danger"
                  onClick={() => remove(row.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
