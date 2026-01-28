/**
 * 동시성 제한 실행 유틸
 * - tasks를 limit 개 워커로 병렬 처리
 * - onSettled로 개별 완료 시점에 UI 반영 가능
 */
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
  onSettled?: (i: number, r: PromiseSettledResult<T>) => void,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let next = 0;

  const worker = async () => {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;

      try {
        const v = await tasks[i]();
        const r: PromiseFulfilledResult<T> = { status: "fulfilled", value: v };
        results[i] = r;
        onSettled?.(i, r);
      } catch (e) {
        const r: PromiseRejectedResult = { status: "rejected", reason: e };
        results[i] = r;
        onSettled?.(i, r);
      }
    }
  };

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}
