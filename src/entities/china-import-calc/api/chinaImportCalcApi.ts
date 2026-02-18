import { authHttp } from "@/entities/session/api/authHttp";
import type { ChinaImportCalcResponse, UpsertCommand } from "../model/types";

function buildOptionalUserQuery(): string {
  return "";
}

export const chinaImportCalcApi = {
  get(productSourcingId: string) {
    const q = buildOptionalUserQuery();
    return authHttp<ChinaImportCalcResponse>(
      `/product/importing/${encodeURIComponent(productSourcingId)}${q}`,
      { method: "GET" },
    );
  },

  upsert(productSourcingId: string, body: UpsertCommand) {
    const q = buildOptionalUserQuery();
    return authHttp<ChinaImportCalcResponse>(
      `/product/importing/${encodeURIComponent(productSourcingId)}${q}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },
};
