import { lsGet, lsSet } from "@/shared/lib/storage/storage";
import { STORAGE_KEYS } from "@/shared/config/storageKeys";

export type RecentPage = {
  key: string;        // "detail" | "thumbnail" 같은 내부키
  label: string;      // 화면 표시명
  visitedAt: number;
};

const LIMIT = 8;

export function pushRecentPage(key: string, label: string) {
  const list = lsGet<RecentPage[]>(STORAGE_KEYS.RECENT_PAGES) ?? [];

  const next: RecentPage[] = [
    { key, label, visitedAt: Date.now() },
    ...list.filter((x) => x.key !== key),
  ].slice(0, LIMIT);

  lsSet(STORAGE_KEYS.RECENT_PAGES, next);
}

export function getRecentPages(): RecentPage[] {
  return lsGet<RecentPage[]>(STORAGE_KEYS.RECENT_PAGES) ?? [];
}

export function clearRecentPages() {
  lsSet<RecentPage[]>(STORAGE_KEYS.RECENT_PAGES, []);
}
