import { SourcingProductRow } from "@/entities/sourcing-product";

export function markEdited(prev: SourcingProductRow, next: SourcingProductRow): SourcingProductRow {
  if (prev.op === "create") return next;
  if (prev.op === "delete") return prev; // 삭제된 건 편집 불가
  const changed = JSON.stringify({ ...prev, op: "none" }) !== JSON.stringify({ ...next, op: "none" });
  return changed ? { ...next, op: "update" } : next;
}

export function markDeleted(row: SourcingProductRow): SourcingProductRow {
  if (row.op === "create") return { ...row, op: "delete" }; // UI에서 숨기거나 완전 제거도 가능
  return { ...row, op: "delete" };
}
