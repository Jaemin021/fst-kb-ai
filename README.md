# fst-kb-ai

AI를 활용해 전동 킥보드 이용자의 안전 위반 여부를 분석하는
**First Penguin** 팀 프로젝트입니다.

사진을 업로드하면 YOLO 모델이 킥보드 이용자를 탐지해 **안전모
미착용**, **다인 탑승** 건수와 분석 신뢰도를 계산하고, 탐지 위치에
바운딩 박스를 그린 결과 이미지를 보여줍니다.

> **현재 AWS에 배포되어 실제로 동작 중입니다.**
>
> - 서비스 주소: <http://fst-kb-ai-frontend.s3-website.ap-northeast-2.amazonaws.com>
> - API 문서(Swagger): <http://13.124.246.14/docs>

## 프로젝트 구성

이 저장소는 프론트엔드, 백엔드, AI 모델, AWS 인프라를 하나의
저장소에서 관리하는 모노레포입니다.

| 폴더 | 담당 영역 | 현재 상태 |
|---|---|---|
| `frontend/` | React 웹 화면 | 구현 완료, S3 정적 호스팅으로 배포 |
| `backend/` | FastAPI 서버와 API | YOLO 추론 연동 완료, EC2에서 운영 중 |
| `ai/` | YOLO 모델과 추론 코드 | 추론 모듈 구현 완료 (가중치는 별도 전달) |
| `infra/` | AWS 배포와 운영 | S3 + EC2 + Nginx + systemd 구성 완료 |
| `docs/` | API 명세와 설계 문서 | 배포 상태를 반영해 최신화 |

## 서비스 구조

```text
사용자 브라우저
   │ ① 사이트 접속
   ▼
AWS S3 정적 웹 호스팅 ─ React 빌드 결과물(HTML/CSS/JS)
   │ ② 사진 업로드 → POST /detect
   ▼
AWS EC2 (고정 IP 13.124.246.14)
   Nginx(80) → FastAPI·uvicorn(8000, systemd 관리) → YOLO 추론
   │ ③ 탐지 통계 + 결과 이미지 URL 응답
   ▼
React 결과 화면
```

구조 설명은 [`docs/architecture.md`](docs/architecture.md),
배포·운영 방법은 [`infra/README.md`](infra/README.md)에 정리되어
있습니다.

## 주요 기능

- JPG, JPEG, PNG 이미지 클릭 및 드래그 앤 드롭 업로드
- 선택한 이미지 미리보기, 변경, 삭제
- YOLO 모델이 분석한 실제 결과 표시
  - 전체 탐지 객체 수, 안전모 미착용 수, 다인 탑승 수, 분석 신뢰도
  - 안전모 미착용·다인 탑승 탐지 시 경고 문구
  - 바운딩 박스가 그려진 결과 이미지
- 상단 메뉴의 서비스 소개 페이지(`/intro`)
- PC, 태블릿, 모바일 반응형 화면
- 잘못된 파일 형식, 용량 초과(10MB), 파일 미선택 오류 처리

`POST /detect`의 실제 응답 예시는 다음과 같습니다.

```json
{
  "total": 2,
  "otherKickboard": 0,
  "noHelmet": 1,
  "multiRiding": 1,
  "confidence": 87.5,
  "resultImageUrl": "http://13.124.246.14/results/1a2b3c4d.jpg"
}
```

필드 설명과 오류 응답은 [`docs/api-spec.md`](docs/api-spec.md)를
참고합니다.

## 폴더 구조

```text
fst-kb-ai/
├── frontend/                         # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/              # Header, ImageUploader, ResultSection 등
│   │   ├── pages/                   # Home, ServiceIntroPage
│   │   ├── services/detectionApi.js # 백엔드 POST /detect 호출
│   │   └── styles/global.css
│   ├── .env.example                 # 로컬 개발용 환경변수 예시
│   ├── .env.production              # 배포 빌드용 환경변수 (EC2 주소)
│   └── vite.config.js
├── backend/                          # FastAPI 서버
│   ├── app/main.py                  # /health, /detect, /results 정적 서빙
│   ├── results/                     # 결과 이미지 저장 폴더 (실행 시 생성, git 제외)
│   └── requirements.txt
├── ai/                               # YOLO 추론 모듈
│   ├── inference.py                 # 모델 로딩, 추론, 통계 계산
│   └── weights/                     # best.pt 가중치 위치 (git 제외)
├── infra/README.md                  # AWS 구성과 배포·운영 절차
├── docs/
│   ├── architecture.md              # 서비스 구조와 설계 배경
│   └── api-spec.md                  # API 명세서
└── package.json                     # 루트 npm workspace 명령
```

## 사용 기술

### Frontend

- React, React Router, Vite
- 순수 CSS (외부 UI 라이브러리 미사용)

### Backend

- Python, FastAPI, uvicorn
- 파일 검증(형식·용량)과 결과 이미지 정적 서빙(`/results`)
- CORS 허용 주소를 `ALLOWED_ORIGINS` 환경변수로 관리

### AI

- YOLO (ultralytics), PyTorch, Pillow
- 탐지 클래스 3종: `other_kickboard`, `no_helmet`, `multi_riding`
- 탐지 통계 계산과 바운딩 박스 결과 이미지 생성

### Infrastructure

- Frontend: AWS S3 정적 웹 호스팅
- Backend: AWS EC2 (Ubuntu 24.04) + Elastic IP (고정 주소)
- Nginx 리버스 프록시(80 → 8000), systemd 프로세스 관리(자동 시작·자동 복구)

## 로컬 실행 방법

### 1. 저장소 받기

```bash
git clone https://github.com/Jaemin021/fst-kb-ai.git
cd fst-kb-ai
```

### 2. 프론트엔드

```bash
npm install
cp frontend/.env.example frontend/.env   # API 주소 설정 (기본: localhost:8000)
npm run dev
```

기본 주소는 `http://127.0.0.1:5173`입니다.

### 3. 백엔드

**모델 가중치 파일이 먼저 필요합니다.** `ai/weights/best.pt`는 용량
문제로 git에 포함되어 있지 않으므로, 팀 공유 채널에서 받아 해당
위치에 넣어야 합니다. 파일이 없으면 서버가 시작 단계에서 오류로
종료됩니다.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/health`에서 `{"status":"ok","ai":"ready"}`가
보이면 정상입니다. 프론트엔드와 백엔드를 서로 다른 터미널에서 동시에
실행해야 화면에서 분석이 동작합니다.

### 4. 검사와 빌드

```bash
npm run lint      # 코드 검사
npm run build     # 배포용 빌드 (frontend/dist 생성, .env.production 사용)
```

## 현재 제한 사항

- 모델 정확도가 아직 낮은 편입니다. 악천후, 인물 겹침 등 어려운
  조건에서 미탐지가 발생해 학습 데이터 보강과 threshold 조정을
  진행할 예정입니다.
- HTTP로 서비스 중입니다. HTTPS는 도메인 구입이 선행되어야 해서
  이번 범위에서는 제외했습니다 (전환 가능한 구조는 준비되어 있습니다).
- 결과 이미지가 서버 디스크에 계속 쌓입니다. 주기적 정리 정책은
  아직 없습니다.
- 업로드 기록 저장, 로그인 기능은 없습니다.

## 개발 진행 상황

1. ~~프론트엔드 화면과 반응형 검증~~ (완료)
2. ~~FastAPI 요청·응답 계약 확정~~ (완료)
3. ~~FastAPI `POST /detect` 구현~~ (완료)
4. ~~AI 모델과 FastAPI 연결~~ (완료)
5. ~~바운딩 박스 결과 이미지 표시~~ (완료)
6. ~~AWS 배포 (S3 + EC2 + Nginx + systemd + 고정 IP)~~ (완료)
7. 모델 정확도 개선 (진행 중)
8. HTTPS 적용, 결과 이미지 정리 정책 (선택 과제)

## 팀 정보

**First Penguin**

AI 기술을 활용해 더 안전한 킥보드 이용 문화를 만드는 학교 팀
프로젝트입니다.
