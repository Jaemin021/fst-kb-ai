# fst-kb-ai

AI를 활용해 킥보드 이용자의 헬멧 착용 여부를 분석하는 **First Penguin**
팀 프로젝트입니다.

사진을 업로드하면 AI가 이용자를 탐지하고, 헬멧 착용 및 미착용 인원과
분석 신뢰도를 보여주는 서비스를 목표로 합니다.

> 현재 프론트엔드는 FastAPI 백엔드와 실제로 통신합니다. 다만 백엔드에
> 아직 AI 모델이 없어서, 어떤 사진을 올려도 항상 같은 고정 결과를
> 돌려주는 스텁(stub) 서버 상태입니다.

## 프로젝트 구성

이 저장소는 프론트엔드, 백엔드, AI 모델, AWS 인프라를 하나의 저장소에서
관리하는 모노레포입니다. 각 담당 영역은 폴더로 분리되어 독립적으로 개발할
수 있습니다.

| 폴더 | 담당 영역 | 현재 상태 |
|---|---|---|
| `frontend/` | React 웹 화면 | 구현 완료, 백엔드와 연동 |
| `backend/` | FastAPI 서버와 API | `/detect` 스텁 구현 (고정 응답) |
| `ai/` | 헬멧 탐지 모델과 추론 | 구현 예정 |
| `infra/` | AWS 배포와 인프라 설정 | 구현 예정 |
| `docs/` | API 계약과 설계 문서 | 기본 구조 작성 |

## 현재 구현된 기능

- 상단 "서비스 소개" 메뉴로 이동하는 별도 소개 페이지(`/intro`) — 문제 제기, 3단계 이용 흐름, 공익 목적 소개
- JPG, JPEG, PNG 이미지 선택
- 클릭 및 드래그 앤 드롭 업로드
- 선택한 이미지와 파일 이름 미리보기
- 이미지 변경 및 삭제
- FastAPI 서버로 사진을 전송하고 분석 중 로딩 상태 표시
- 분석 결과 카드와 미착용 경고 표시
- 업로드한 이미지를 분석 결과 예시로 표시
- PC, 태블릿, 모바일 반응형 화면
- 잘못된 파일 형식, 용량 초과(10MB), 파일 미선택 오류 처리
- 키보드 조작과 기본 접근성 지원

지금 받는 분석 결과는 실제 AI 모델이 만든 게 아니라, 백엔드가 항상
똑같이 돌려주는 고정 데이터입니다.

```json
{
  "total": 3,
  "helmet": 2,
  "noHelmet": 1,
  "confidence": 94.8,
  "resultImageUrl": null
}
```

## 폴더 구조

```text
fst-kb-ai/
├── frontend/                         # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # 로고, 팀명, 페이지 이동 메뉴
│   │   │   ├── ScrollToTop.jsx      # 페이지 이동 시 스크롤 초기화
│   │   │   ├── ImageUploader.jsx    # 클릭 및 드래그 앤 드롭
│   │   │   ├── ImagePreview.jsx     # 이미지 미리보기, 변경, 삭제
│   │   │   ├── DetectButton.jsx     # 분석 실행 버튼
│   │   │   ├── LoadingSpinner.jsx   # 분석 중 로딩 표시
│   │   │   ├── ResultSection.jsx    # 결과 카드와 결과 이미지
│   │   │   └── Footer.jsx           # 팀 프로젝트 정보
│   │   ├── pages/
│   │   │   ├── Home.jsx             # 메인 화면(업로드, 분석, 결과)
│   │   │   └── ServiceIntroPage.jsx # 서비스 소개 페이지(`/intro`)
│   │   ├── services/
│   │   │   └── detectionApi.js      # FastAPI POST /detect 요청
│   │   ├── styles/
│   │   │   └── global.css           # 공통 및 반응형 스타일
│   │   ├── App.jsx                  # 라우팅과 공통 레이아웃
│   │   └── main.jsx                 # React 시작점, 라우터 설정
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                          # FastAPI 스텁 서버
│   ├── app/
│   │   └── main.py                  # `/detect`, `/health` 엔드포인트
│   ├── requirements.txt
│   └── README.md
├── ai/
│   └── README.md                    # AI 모델 구현 예정 영역
├── infra/
│   └── README.md                    # AWS 배포 구현 예정 영역
├── docs/
│   └── architecture.md              # 현재와 향후 데이터 흐름
├── package.json                     # 루트 npm workspace 명령
├── package-lock.json                # npm install 후 생성
├── .gitignore
└── README.md
```

## 사용 기술

### Frontend

- React
- React Router (페이지 이동)
- Vite
- JavaScript와 JSX
- 일반 CSS
- 외부 UI 컴포넌트 및 아이콘 라이브러리 사용 안 함

### Backend

- Python
- FastAPI
- `POST /detect` 이미지 분석 API (현재는 고정 응답만 돌려주는 스텁)
- AI 모델 연결은 아직 예정

### AI - 예정

- 킥보드 이용자 탐지
- 탑승자의 헬멧 착용 상태 판별
- 탐지 결과 이미지 생성

### Infrastructure - 예정

- Frontend: AWS Amplify Hosting
- Backend API: API Gateway와 Lambda 또는 ECS
- Image storage: Amazon S3
- AI inference: Amazon SageMaker 또는 GPU 추론 서버
- Monitoring: Amazon CloudWatch


## 1. 실행


```bash
git clone https://github.com/Jaemin021/fst-kb-ai.git
cd fst-kb-ai
```


### 2. 패키지

저장소 루트에서 실행합니다.

```bash
npm install
```

### 3.  서버 실행

```bash
npm run dev
```

터미널에 표시되는 주소를 브라우저에서 엽니다. 기본 주소는
`http://127.0.0.1:5173`입니다. 서버 종료는 `Ctrl + C`입니다.

### 4. 코드 검사

```bash
npm run lint
```

### 5. 배포용 빌드

```bash
npm run build
```

빌드 결과를 로컬에서 확인하려면 다음 명령을 실행합니다.

```bash
npm run preview
```

프론트엔드가 실제로 사진을 서버로 보내기 때문에, 위 3번 서버 실행 전에
`frontend/.env.example`을 복사해 `frontend/.env`를 만들어둬야 합니다.
없으면 분석 요청이 실패합니다.

```bash
cp frontend/.env.example frontend/.env
```

## 백엔드 실행 (FastAPI 스텁 서버)

`backend/` 폴더에서 따로 실행합니다. Python 3.11 이상을 권장합니다.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/health`에 접속해 `{"status":"ok"}`가 뜨면 정상
동작하는 것입니다. 지금은 어떤 사진을 보내도 항상 같은 고정 JSON을
돌려주는 상태이고, 실제 AI 분석은 아직 붙어 있지 않습니다.

프론트엔드(`npm run dev`)와 백엔드(`uvicorn ...`)를 각각 다른 터미널
창에서 동시에 켜둬야 화면에서 분석 버튼이 정상 동작합니다.

## 화면 사용 

1. 업로드 영역을 클릭하거나 사진을 드래그 앤 드롭합니다.
2. 선택한 사진과 파일 이름을 확인합니다.
3. `헬멧 착용 여부 탐지` 버튼을 누릅니다.
4. 잠깐 `AI 분석 중...` 상태를 확인합니다.
5. 결과 카드와 결과 예시 이미지를 확인합니다.
6. `사진 변경` 또는 `사진 삭제`로 다시 선택할 수 있습니다.

## 이미지 제한

- 지원 형식: `.jpg`, `.jpeg`, `.png`
- 최대 용량: 10MB (넘으면 업로드 전에 안내 문구로 막음)
- 한 번에 한 장만 선택 가능
- GIF, SVG, 영상 파일은 지원X
- 선택한 사진은 백엔드로 전송되지만, 아직 실제로 분석하지는 않고 고정 응답만 돌려줌
- 이 10MB 기준은 프론트에서 임시로 정한 값

## 프론트엔드 데이터 흐름

```text
사용자 사진 선택
        ↓
파일 형식 검사
        ↓
Home.jsx에 파일과 미리보기 주소 저장
        ↓
헬멧 착용 여부 탐지 버튼 클릭
        ↓
detectionApi.js가 FastAPI에 POST /detect 요청
        ↓
백엔드가 고정 JSON 결과 응답
        ↓
ResultSection.jsx에 결과 카드와 이미지 표시
```

`Home.jsx`에서 관리하는 상태는 다음과 같습니다.

| 상태 | 역할 |
| `selectedFile` | 사용자가 선택한 이미지 파일 |
| `previewUrl` | 브라우저 미리보기 주소 |
| `isLoading` | AI 분석 진행 여부 |
| `result` | 분석 완료 후 받은 결과 |
| `error` | 파일 또는 분석 오류 메시지 |

새 사진을 선택하거나 기존 사진을 삭제하면 이전 결과와 오류도 함께
초기화됩니다.

## FastAPI 백엔드 연결

백엔드 연결은 다음 파일 한 곳에서 관리합니다.

```text
frontend/src/services/detectionApi.js
```

지금은 아래 코드처럼 실제로 `FormData`를 만들어서 FastAPI에 요청을
보내고 있습니다. AI 모델이 붙어도 이 파일은 그대로 두면 됩니다 —
바뀌는 건 백엔드가 돌려주는 값의 내용뿐입니다.

```javascript
export async function detectHelmet(imageFile) {
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/detect`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    throw new Error('이미지 분석에 실패했습니다.')
  }

  return response.json()
}
```

`FormData`를 사용할 때는 브라우저가 파일 경계를 자동으로 만들기 때문에
`Content-Type` 헤더를 직접 지정하지 않습니다.

환경변수 예시는 `frontend/.env.example`에 있고, 실제 실행에는 이걸
복사한 `frontend/.env`가 필요합니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

현재 API 연결:

```text
POST /detect
Content-Type: multipart/form-data
이미지 필드명: file
```

```json
{
  "total": 3,
  "helmet": 2,
  "noHelmet": 1,
  "confidence": 94.8,
  "resultImageUrl": null
}
```

AI 모델이 붙으면 `resultImageUrl`에 탐지 박스가 그려진 결과 이미지
주소가 채워질 예정입니다.

`resultImageUrl`이 없으면 프론트엔드는 업로드한 원본 사진을 결과 예시로
표시합니다. 전체 설계는 

## 현재 데이터 흐름

```text
사용자
  ↓ 사진 선택
React Frontend
  ↓ multipart/form-data
FastAPI POST /detect (스텁)
  ↓ 고정 JSON 응답
React 결과 화면
```

## 향후 데이터 흐름 (AI 연결 후)

```text
사용자
  ↓ 사진 선택
React Frontend
  ↓ multipart/form-data
FastAPI POST /detect
  ↓ 사진 전달
AI 헬멧 탐지 모델
  ↓ 탐지 결과
FastAPI 응답
  ↓ JSON 및 결과 이미지 URL
React 결과 화면
```

프론트엔드는 AI 모델을 직접 실행하지 않고, 백엔드에 사진을 전달한 뒤
분석 결과를 화면에 표시합니다.



현재 작업에서는 로컬 구현과 검증까지만 수행하며, 사용자 승인 전에는
커밋하거나 push하지 않습니다.

## 현재 제한 사항

- 백엔드가 사진을 받긴 하지만 실제로 분석하지 않음 (AI 모델 미연결)
- 결과와 신뢰도는 고정된 임시 데이터
- 업로드 기록을 저장하지 않음
- 로그인 및 사용자 관리 기능 없음
- 결과 이미지에 실제 탐지 박스가 표시되지 않음

## 향후 개발 순서

1. ~~프론트엔드 mock 화면과 반응형 검증~~ (완료)
2. ~~FastAPI 요청·응답 계약 확정~~ (완료)
3. ~~FastAPI `POST /detect` 스텁 구현~~ (완료)
4. AI 모델과 FastAPI 연결
5. 실제 결과 이미지 표시
6. 오류 처리와 성능 최적화
7. AWS 개발 환경 배포
8. 실제 데이터 기반 통합 테스트

## 브랜치 전략

팀원이 늘어나면서 다 같이 `main`에 바로 push하면 충돌 위험이 커서,
간단한 규칙을 정했습니다.

- `main`은 항상 실행 가능한 상태로 유지합니다. 여기에 직접 push하지
  않습니다.
- 작업할 때는 본인 영역 기준으로 브랜치를 새로 만듭니다.

  ```bash
  git switch -c feat/ai-model
  git switch -c feat/backend-detect
  git switch -c fix/upload-error
  ```

  접두사는 `feat/`(기능 추가), `fix/`(버그 수정), `docs/`(문서만 수정)
  중에서 상황에 맞게 씁니다.

- 작업이 끝나면 GitHub에서 `main`으로 Pull Request를 올립니다.

  ```bash
  git push -u origin feat/ai-model
  ```

- 다른 팀원 코드와 겹치는 부분이 있으면 PR에서 서로 확인한 뒤
  merge합니다. 급하지 않으면 최소 1명은 리뷰하고 merge하는 걸
  권장합니다.

GitHub 저장소 Settings → Branches에서 `main`에 "Require a pull
request before merging" 규칙을 켜두면, 실수로 누가 바로 push하는 것도
막을 수 있습니다.

## 팀 정보

**First Penguin**

AI 기술을 활용해 더 안전한 킥보드 이용 문화를 만드는 학교 팀
프로젝트입니다.
