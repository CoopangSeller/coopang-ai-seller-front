# AI Sync Club

### Coupang Seller Toolkit

쿠팡 판매자를 위한 **상품 소싱 · 기획 · 중국 사입 원가 계산 SaaS 도구**입니다.
React + Vite 기반 프론트엔드 프로젝트이며 **FSD(Feature-Sliced Design)** 구조를 따릅니다.

---

# 📚 섹터별 가이드

---

## ▶ 1️⃣ 프로젝트 초기 세팅 및 실행 방법

<details open>
<summary><b>STEP 1. 필수 프로그램 설치</b></summary>

### ✔ Git 설치

설치 후 확인

```bash
git --version
```

---

### ✔ Node.js 설치 (권장 v18 이상)

설치 확인

```bash
node -v
npm -v
```

---

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
git clone <YOUR_REPO_URL>
cd <PROJECT_FOLDER>
```

👉 `<YOUR_REPO_URL>` → 깃허브 저장소 주소로 변경

</details>

---

<details>
<summary><b>STEP 3. 환경설정 파일 (.env.local)</b></summary>

프로젝트 최상단(package.json 위치)에 `.env.local` 생성

```env
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
VITE_API_BASE_URL=http://localhost:8080
VITE_API_ENABLED=true
```

### 🔐 보안 주의

- API 키 GitHub 업로드 금지
- `.env.local`은 개인 파일

</details>

---

<details>
<summary><b>STEP 4. 의존성 설치 (반드시 먼저)</b></summary>

```bash
npm install
```

👉 무조건 실행 후 `npm run dev`

</details>

---

<details>
<summary><b>STEP 5. 개발 서버 실행</b></summary>

```bash
npm run dev
```

브라우저 접속

```
http://localhost:3000
```

</details>

---

<details>
<summary><b>STEP 6. 자주 발생하는 문제</b></summary>

### ✔ .env.local 수정했는데 반영 안됨

```bash
Ctrl + C
npm run dev
```

---

### ✔ API 에러 발생

👉 백엔드 실행 확인

👉 화면만 실행하려면

```env
VITE_API_ENABLED=false
```

</details>

---

# ▶ 2️⃣ 페이지별 가이드 (추후 작성)

<details>
<summary><b>페이지 설명 템플릿</b></summary>

각 페이지는 아래 형식으로 작성 예정

---

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

---

### 예정 페이지

- 상품 소싱 페이지
- 중국 사입 원가 계산 페이지
- 상세페이지 기획/생성 페이지
- 썸네일 기획/생성 페이지

👉 실제 화면 스크린샷 기준으로 추가 예정

</details>

---

# ▶ 3️⃣ Vercel 배포 가이드

<details>
<summary><b>STEP 1. 로컬 빌드 테스트</b></summary>

```bash
npm run build
npm run preview
```

👉 오류 없이 실행되면 배포 가능

</details>

---

<details>
<summary><b>STEP 2. Vercel 연결</b></summary>

1. Vercel 로그인
2. GitHub 저장소 Import
3. Deploy 클릭

</details>

---

<details>
<summary><b>STEP 3. Environment Variables 설정</b></summary>

Vercel → Project Settings → Environment Variables

추가 항목

```
VITE_GEMINI_API_KEY
VITE_API_BASE_URL
VITE_API_ENABLED
```

예시

```
VITE_API_BASE_URL=https://your-backend-domain.com
```

</details>

---

<details>
<summary><b>STEP 4. Not Found 오류 해결 (SPA 라우팅)</b></summary>

Vercel에서 직접 URL 접근 시 404 뜨면
`vercel.json` 필요

예시:

```json
{
  "routes": [{ "src": "/(.*)", "dest": "/" }]
}
```

👉 `/planning/thumbnail` 같은 라우팅 문제 해결됨

</details>

---

# 🗂 프로젝트 구조

```
src/
 ├─ pages/        → 페이지 화면
 ├─ widgets/      → 큰 UI 블록
 ├─ features/     → 기능 모듈
 ├─ entities/     → 데이터 모델
 ├─ shared/       → 공통 유틸
```

👉 AI Sync Club은 **FSD 구조** 기반

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
