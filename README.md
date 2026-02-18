<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tNccFKypMusMEALtQxiMeBo014B-9yp2

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
`npm run dev`
ㅁ<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Sync Club

### Coupang Seller Toolkit

쿠팡 판매자를 위한 상품 소싱 · 기획 · 중국 사입 원가 계산 SaaS 도구입니다.  
React + Vite 기반 프론트엔드 프로젝트입니다.

---

# 🚀 실행 방법 (비개발자도 가능)

## 1️⃣ 준비물

- Node.js (권장: 18 이상)

설치 확인:

```bash
node -v
npm -v
2️⃣ 프로젝트 실행 순서
① 의존성 설치
프로젝트 폴더에서:

npm install
② .env.local 파일 만들기 (중요)
프로젝트 최상단(= package.json 있는 폴더)에
.env.local 파일을 새로 생성하세요.

아래 내용을 그대로 복사하고, Gemini API 키는 직접 입력하세요.

# Google Gemini API Key (직접 발급받은 키 입력)
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# 백엔드 API 주소
# 로컬 서버 사용 시:
VITE_API_BASE_URL=http://localhost:8080

# API 사용 여부
VITE_API_ENABLED=true
⚠️ 중요
API 키는 절대 GitHub에 올리면 안 됩니다.

채팅이나 문서에 그대로 공유하지 마세요.

.env.local은 개인 설정 파일입니다.

③ 개발 서버 실행
npm run dev
터미널에 표시되는 주소로 접속하세요.
보통:

http://localhost:5173
📁 프로젝트 구조 (쉽게 설명)
src/
 ├─ pages/        → 페이지 단위 화면 (소싱, 중국사입계산기 등)
 ├─ widgets/      → 큰 UI 블록 (그리드, 상세패널 등)
 ├─ features/     → 기능 단위 모듈
 ├─ entities/     → 데이터 모델 + 계산 로직 (마진, ROI 등)
 ├─ shared/       → 공통 UI, 유틸, 설정
이 구조는 FSD(Feature-Sliced Design) 기반입니다.
기능 단위로 분리되어 유지보수가 쉽습니다.

💡 .env.local이란?
.env.local은 내 컴퓨터에서만 사용하는 설정 파일입니다.

예:

어떤 서버에 연결할지

AI API 키가 무엇인지

API를 켤지 끌지

GitHub에는 보통 포함되지 않습니다.

🧠 API 없이 화면만 보고 싶다면
.env.local에서 아래처럼 변경하세요:

VITE_API_ENABLED=false
그러면 백엔드 없이 화면만 동작합니다.
(일부 데이터 저장/조회 기능은 제한됩니다)

❓ 자주 발생하는 문제
1. 실행했는데 API 에러가 나요
→ VITE_API_ENABLED=true인데 백엔드가 꺼져 있을 가능성

해결 방법:

백엔드 서버 실행
또는

.env.local에서 VITE_API_ENABLED=false

2. .env.local 수정했는데 반영이 안 돼요
→ 개발 서버 재시작 필요

Ctrl + C
npm run dev
3. Gemini API 키는 어디서 받나요?
Google AI Studio에서 발급받아 .env.local에 입력하세요.

🏗 배포용 빌드 (선택)
npm run build
npm run preview
build → 배포용 파일 생성 (dist/)

preview → 배포 결과 미리보기

🔐 보안 주의
API 키는 절대 공개 저장소에 올리지 마세요.

.env.local 파일은 개인 설정용입니다.

키가 노출되었으면 즉시 재발급하세요.

✨ 개발 환경
React

Vite

TypeScript

TailwindCSS

FSD Architecture
```
