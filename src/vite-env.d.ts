
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL, VITE_API_ENABLED: string;
  
  // 필요에 따라 추가 환경 변수 타입을 정의
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}