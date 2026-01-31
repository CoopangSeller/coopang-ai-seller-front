export type HttpError = {
  status: number;
  message: string;
  body?: unknown;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function resolveUrl(input: RequestInfo) {
  if (typeof input === "string" && input.startsWith("/")) return `${API_BASE}${input}`;
  return input;
}

async function parseBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json().catch(() => undefined);
  return res.text().catch(() => undefined);
}

function toHttpError(status: number, body: unknown): HttpError {
  const msg =
    typeof body === "string"
      ? body
      : (body as any)?.message || (status === 401 ? "인증이 만료되었습니다." : "요청에 실패했습니다.");
  return { status, message: msg, body };
}

export type HttpBaseOptions = RequestInit & {
  headers?: HeadersInit;
};

function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) return Object.fromEntries(h.entries());
  if (Array.isArray(h)) return Object.fromEntries(h);
  return h as Record<string, string>;
}

export async function httpBase<T>(input: RequestInfo, init?: HttpBaseOptions): Promise<T> {
    const baseHeaders = normalizeHeaders(init?.headers);
  
    const res = await fetch(resolveUrl(input), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
  });

  if (!res.ok) {
    const body = await parseBody(res);
    throw toHttpError(res.status, body);
  }

  return (await parseBody(res)) as T;
}
