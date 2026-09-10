# AI Sync Club

### Coupang Seller Toolkit

쿠팡 판매자를 위한 **상품 소싱 · 기획 · 중국 사입 원가 계산 SaaS 도구**입니다.
React + Vite 기반 프론트엔드 프로젝트이며 **FSD(Feature-Sliced Design)** 구조를 따릅니다.

---

# 📑 목차

1. [프로젝트 초기 세팅 및 실행 방법](#1️⃣-프로젝트-초기-세팅-및-실행-방법)
2. [페이지별 가이드](#2️⃣-페이지별-가이드-추후-작성)
3. [Vercel 배포 가이드](#3️⃣-vercel-배포-가이드)
4. [프로젝트 구조](#🗂-프로젝트-구조)
5. [주요 계산 로직](#🧮-주요-계산-로직)
6. [기술 스택](#🧑‍💻-기술-스택)
7. [프로젝트 목적](#📌-프로젝트-목적)

---

# ▶ 1️⃣ 프로젝트 초기 세팅 및 실행 방법

<details open>
<summary><b>STEP 1. 필수 프로그램 설치</b></summary>

### ✔ Git 설치

```bash
git --version
```

### ✔ Node.js 설치 (권장 v22 이상)

```bash
node -v
npm -v
```

### ✔ VSCode 설치

권장 확장 프로그램

- ESLint
- Prettier
- Tailwind CSS IntelliSense

</details>

---

<details>
<summary><b>STEP 2. 프로젝트 받기 (git clone)</b></summary>

```bash
git clone git@github.com:CoopangSeller/coopang-ai-seller-front.git
cd coopang-ai-seller-front
```

</details>

---

<details>
<summary><b>STEP 3. 환경설정 파일 (.env.local)</b></summary>

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
VITE_API_BASE_URL=http://localhost:8080
VITE_API_ENABLED=true
```

🔐 API 키 GitHub 업로드 금지

</details>

---

<details>
<summary><b>STEP 4. 의존성 설치</b></summary>

```bash
npm install
```

👉 반드시 실행 후 `npm run dev`

</details>

---

<details>
<summary><b>STEP 5. 개발 서버 실행</b></summary>

```bash
npm run dev
```

브라우저 접속
👉 http://localhost:3000

</details>

---

<details>
<summary><b>STEP 6. 자주 발생하는 문제</b></summary>

.env.local 수정 후 반영 안되면

```bash
Ctrl + C
npm run dev
```

API 에러 발생 시
👉 백엔드 서버 실행 확인

</details>

---

# ▶ 2️⃣ 페이지별 가이드 (추후 작성)

<details>
<summary><b>페이지 설명 템플릿</b></summary>

각 페이지는 아래 형식으로 작성 예정

### ✔ 페이지 이름

**목적**

- 무엇을 하는 페이지인지

**사용 방법**

1. 입력
2. 저장
3. 결과 확인

**주의사항**

- 실수하기 쉬운 부분

**FAQ**

- 자주 묻는 질문

예정 페이지

- 상품 소싱 페이지
- 중국 사입 원가 계산 페이지
- 상세페이지 생성
- 썸네일 생성

</details>

---

# ▶ 3️⃣ Vercel 배포 가이드

<details>
<summary><b>STEP 1. 로컬 빌드 테스트</b></summary>

```bash
npm run build
npm run preview
```

</details>

---

<details>
<summary><b>STEP 2. Vercel 연결</b></summary>

1. Vercel 로그인
2. GitHub 저장소 Import
3. Deploy

</details>

---

<details>
<summary><b>STEP 3. Environment Variables</b></summary>

추가 항목

```
VITE_GEMINI_API_KEY
VITE_API_BASE_URL
VITE_API_ENABLED
```

</details>

---

<details>
<summary><b>STEP 4. Not Found 오류 해결</b></summary>

`vercel.json`

```json
{
  "routes": [{ "src": "/(.*)", "dest": "/" }]
}
```

👉 `/planning/thumbnail` 같은 라우팅 문제 해결

</details>

---

# 🗂 프로젝트 구조

```
src/
 ├─ pages/
 ├─ widgets/
 ├─ features/
 ├─ entities/
 ├─ shared/
```

👉 **FSD 구조 기반**

---

# 🧮 주요 계산 로직

- 마진 계산
- ROI 계산 (1.36 → 136%)
- 위안 → 원 환율 계산
- 중국 사입 원가 자동 요약

👉 쿠팡 MD 실사용 기준 계산 로직

---

# 🧑‍💻 기술 스택

- React
- Vite
- TypeScript
- TailwindCSS
- FSD Architecture

---

# 📌 프로젝트 목적

AI Sync Club은 쿠팡 판매자의
👉 **상품 소싱 → 원가 계산 → AI 기획 → 썸네일 생성**
전체 워크플로우 자동화를 목표로 제작되었습니다.


## OpenAI API 연결

텍스트 기획·태그는 GPT, 썸네일·상세페이지 이미지는 GPT Image를 사용합니다.
.env.local의 OPENAI_API_KEY에 실제 키를 넣고 개발 서버를 재시작하세요. 키는 서버에서만 읽으며 VITE_ 접두사를 붙이지 않습니다.

.env.example에서 모델 기본값을 확인할 수 있습니다. 기본/고품질 모두 OpenAI API 사용량에 따라 과금됩니다. 상품 참고사진은 PNG/JPEG/WebP를 지원하며 전체 요청은 4MB 이하여야 합니다. 정사각형과 9:16 비율을 유지합니다.

Vercel에서는 OPENAI_API_KEY 환경변수와 /api/ai 서버 함수가 필요합니다. dist만 올리는 정적 호스팅으로는 생성 기능을 사용할 수 없습니다. 공개 서비스 운영 시 사용자 인증·사용량 제한을 이 API에도 연결하세요. 호스팅 요금제의 실행시간 및 응답 크기 제한에 따라 큰 이미지 생성이 실패할 수 있습니다.

검증: npm run build 및 node --test server/openai.test.mjs. 실제 생성은 유효한 키와 모델 접근 권한이 필요합니다.

공식 문서: [이미지 생성](https://developers.openai.com/api/docs/guides/image-generation), [구조화된 응답](https://developers.openai.com/api/docs/guides/structured-outputs).
