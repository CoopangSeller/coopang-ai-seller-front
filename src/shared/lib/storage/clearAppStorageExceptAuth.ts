import { STORAGE_KEYS } from "@/shared/config/storageKeys"; // (파일명 오타 주의)

export function clearDraftsAndUiCacheExceptAuth() {
  const keysToRemove = [
    STORAGE_KEYS.DETAIL_PLANNER_DRAFT,
    STORAGE_KEYS.THUMBNAIL_DRAFT,
    STORAGE_KEYS.HOME_ACTIVE_TAB,
    STORAGE_KEYS.RECENT_PAGES,
  ];

  for (const k of keysToRemove) localStorage.removeItem(k);
  sessionStorage.clear();
}
