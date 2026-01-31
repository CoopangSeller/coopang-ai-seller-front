import React, { useRef } from "react";
import { Button } from "@/shared/ui";
import { importRowsFromXlsx, exportRowsToXlsx } from "../model/excel";
import { SourcingProductRow } from "@/entities/sourcing-product";

export function ExcelButtons(props: {
  rows: SourcingProductRow[];
  onImport: (rows: SourcingProductRow[]) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const rows = await importRowsFromXlsx(f);
          props.onImport(rows);
          e.currentTarget.value = "";
        }}
      />
      <Button variant="ghost" onClick={() => ref.current?.click()}>
        엑셀 업로드
      </Button>
      <Button variant="ghost" onClick={() => exportRowsToXlsx(props.rows)}>
        엑셀 다운로드
      </Button>
    </div>
  );
}
