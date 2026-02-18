import { useCallback, useMemo, useState } from "react";
import { chinaImportCalcApi } from "@/entities/china-import-calc";
import type { AuthorizedUser, ChinaImportCalc, UpsertCommand } from "@/entities/china-import-calc";
import { toastStore } from "@/shared/model/toastStore";

/**
 * - AbortController 미지원 환경 고려: withTimeout은 "흐름 차단 + 결과 무시" 방식(프로젝트 룰).
 * - 404/없음 처리는 백엔드 정책에 따라 달라질 수 있음.
 */
export function useChinaImportCalcRemote(
  productSourcingId?: string | null,
  user?: AuthorizedUser | null,
) {
  const enabled = useMemo(() => !!productSourcingId, [productSourcingId]);

  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<ChinaImportCalc | null>(null);

  const load = useCallback(async () => {
    if (!productSourcingId) return null;

    setLoading(true);
    try {
      const res = await chinaImportCalcApi.get(productSourcingId);
      setRemote(res.chinaImportCalc);

      toastStore.push({
        type: "success",
        message: "저장된 중국 사입 계산기를 불러왔습니다.",
      });

      return res.chinaImportCalc;
    } catch (e: any) {
      // 서버가 "없음"을 404로 주는 경우가 흔함
      if (e?.status === 404 || e?.response?.status === 404) {
        setRemote(null);
        toastStore.push({
          type: "info",
          message: "저장된 중국 사입 계산기 데이터가 없습니다.",
        });
        return null;
      }

      toastStore.push({
        type: "error",
        message: e?.message ?? "불러오기에 실패했습니다.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [productSourcingId, user]);

  const save = useCallback(
    async (command: UpsertCommand) => {
      if (!productSourcingId) return null;

      setLoading(true);
      try {
        const res = await chinaImportCalcApi.upsert(productSourcingId, command);
        setRemote(res.chinaImportCalc);

        toastStore.push({
          type: "success",
          message: "중국 사입 계산기를 저장했습니다.",
        });

        return res.chinaImportCalc;
      } catch (e: any) {
        toastStore.push({
          type: "error",
          message: e?.message ?? "저장에 실패했습니다.",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [productSourcingId, user],
  );

  return { enabled, loading, remote, load, save };
}
