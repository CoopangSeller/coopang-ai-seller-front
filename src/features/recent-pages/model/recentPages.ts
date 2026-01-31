import { lsGet, lsSet } from "@/shared/lib/storage/storage";
import { STORAGE_KEYS } from "@/shared/config/storageKeys";

export type RecentPage = {
  path: string;
  label: string;
  visitedAt: number;
};

const LIMIT = 8;

export function pushRecentPage(path: string, label: string) {
  const list = lsGet<RecentPage[]>(STORAGE_KEYS.RECENT_PAGES) ?? [];

  const next: RecentPage[] = [
    { path, label, visitedAt: Date.now() },
    ...list.filter((x) => x.path !== path),
  ].slice(0, LIMIT);

  lsSet(STORAGE_KEYS.RECENT_PAGES, next);
}

export function getRecentPages(): RecentPage[] {
  return lsGet<RecentPage[]>(STORAGE_KEYS.RECENT_PAGES) ?? [];
}

export function clearRecentPages() {
  lsSet<RecentPage[]>(STORAGE_KEYS.RECENT_PAGES, []);
}
