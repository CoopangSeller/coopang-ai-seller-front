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
* OpenAI API 키 미설정
*/
export class MissingOpenAIApiKeyError extends Error {
  constructor() {
    super("서버의 OPENAI_API_KEY를 설정한 후 다시 실행해 주세요.");
    this.name = "MissingOpenAIApiKeyError";
  }
}
