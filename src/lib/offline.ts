export type CachedTranslation = {
  id: string;
  text: string;
  signLanguage: string;
  signsDetected: number;
  createdAt: string;
};

const KEY = "slt-history-cache";

export function readCachedHistory(): CachedTranslation[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return (JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as CachedTranslation[]) ?? [];
  } catch {
    return [];
  }
}

export function writeCachedHistory(rows: CachedTranslation[]) {
  window.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 100)));
}

export function upsertCachedHistory(row: CachedTranslation) {
  const rows = readCachedHistory().filter((item) => item.id !== row.id);
  writeCachedHistory([row, ...rows]);
}

export function removeCachedHistory(id: string) {
  writeCachedHistory(readCachedHistory().filter((item) => item.id !== id));
}
