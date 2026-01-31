import { STORAGE_KEYS } from "@/shared/config/storageKeys"; // (파일명 오타 주의)

export function clearDraftsAndUiCacheExceptAuth() {
  const keysToRemove = [
    STORAGE_KEYS.DETAIL_PLANNER_DRAFT,
    STORAGE_KEYS.THUMBNAIL_DRAFT,
    STORAGE_KEYS.HOME_ACTIVE_TAB,
    STORAGE_KEYS.RECENT_PAGES,
  ];

  const legacyKeys = ["detail-planner:v2"]; // 과거 키도 제거
  for (const k of [...keysToRemove, ...legacyKeys]) localStorage.removeItem(k);

  sessionStorage.clear();
}
