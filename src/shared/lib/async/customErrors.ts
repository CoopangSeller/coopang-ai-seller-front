/*
* 타임아웃 에러
*/
export class TimeoutError extends Error {
  readonly ms: number;

  constructor(ms: number, message?: string) {
    super(message ?? `Timeout after ${ms}ms`);
    this.name = "TimeoutError";
    this.ms = ms;
  }
}

/*
* GEMINI API NULL 에러
*/
export class MissingGeminiApiKeyError extends Error {
  constructor() {
    super("Missing Gemini API key");
    this.name = "MissingGeminiApiKeyError";
  }
}