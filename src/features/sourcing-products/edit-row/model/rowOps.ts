import { SourcingProductRow } from "@/entities/sourcing-product";

/**
 * 서버 id(snowflake)처럼 보이면 서버 row로 간주
 * - NEW row는 crypto.randomUUID() 사용 → 하이픈(-) 포함
 * - 서버 snowflake는 보통 숫자 문자열(하이픈 없음)
 */
function looksLikeServerId(id: string) {
  // 숫자 10자리 이상 또는 하이픈 없는 긴 문자열을 서버 id로 취급
  if (/^\d{10,}$/.test(id)) return true;
  if (!id.includes("-") && id.length >= 10) return true;
  return false;
}

export function isServerRow(row: SourcingProductRow) {
  return row.op !== "create";
}

export function markEdited(
  prev: SourcingProductRow,
  next: SourcingProductRow,
): SourcingProductRow {
  if (prev.op === "create") return next;
  if (prev.op === "delete") return prev; // 삭제된 건 편집 불가

  const changed =
    JSON.stringify({ ...prev, op: "none" }) !==
    JSON.stringify({ ...next, op: "none" });

  return changed ? { ...next, op: "update" } : next;
}

export function markDeleted(row: SourcingProductRow): SourcingProductRow {
  // NEW(create) 는 서버 삭제 대상이 아니므로 serverId를 억지로 넣지 않음
  if (row.op === "create") return { ...row, op: "delete" };

  // ✅ 서버 row인데 serverId가 비어있을 수 있으므로 id로 보정
  const serverId = row.serverId ?? (looksLikeServerId(row.id) ? row.id : undefined);

  return { ...row, serverId, op: "delete" };
}
