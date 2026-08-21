# 서비스 구조

## 전체 구성

프론트엔드는 AWS S3 정적 웹 호스팅, 백엔드는 AWS EC2에서 운영합니다.
"정적 파일은 S3, 연산이 필요한 것은 EC2"라는 역할 분리가 이 구조의
핵심입니다.

```text
사용자 브라우저
    │ ① 사이트 접속
    ▼
AWS S3 정적 웹 호스팅
  React 빌드 결과물 (index.html + JS/CSS)
    │ ② POST /detect (multipart/form-data)
    ▼
AWS EC2 (Ubuntu 24.04, Elastic IP 13.124.246.14)
  Nginx(80) ─proxy─▶ uvicorn·FastAPI(8000) ─▶ YOLO 추론
    │ ③ 탐지 통계 JSON + 결과 이미지 URL
    ▼
React 결과 화면 (통계 카드, 경고, 결과 이미지)
```

## 요청 처리 흐름

1. 사용자가 사진을 선택하면
   `frontend/src/services/detectionApi.js`가 `POST /detect`로 파일을
   전송합니다. API 주소는 환경변수 `VITE_API_BASE_URL`에서 읽습니다
   (로컬은 `.env`, 배포 빌드는 `.env.production`).
2. Nginx가 80 포트로 요청을 받아 내부의 uvicorn(127.0.0.1:8000)으로
   전달합니다.
3. FastAPI가 파일 형식(jpg/png)과 용량(10MB)을 검증한 뒤
   `ai/inference.py`의 YOLO 모듈로 추론합니다.
4. 클래스별 탐지 수와 평균 신뢰도를 계산하고, 바운딩 박스를 그린
   이미지를 `backend/results/`에 저장합니다.
5. 통계 JSON과 결과 이미지의 절대 URL(`/results/...`)을 응답하고,
   프론트엔드가 결과 카드와 이미지를 표시합니다.

## 설계에서 중요한 지점

- **CORS**: 프론트(S3)와 백엔드(EC2)의 출처(origin)가 다르므로,
  백엔드가 허용 출처를 응답 헤더로 선언해야 브라우저가 요청을
  허용합니다. 허용 목록은 코드에 고정하지 않고 `ALLOWED_ORIGINS`
  환경변수로 주입해, 프론트 주소가 바뀌어도 코드 수정 없이 대응할
  수 있습니다.
- **결과 이미지 절대 URL**: FastAPI의 `url_for()`는 요청의 Host
  헤더를 기준으로 URL을 만듭니다. Nginx 설정에
  `proxy_set_header Host $host;`가 있어야 외부에서 접근 가능한
  주소가 생성됩니다.
- **SPA 라우팅**: React Router를 사용하므로 S3 정적 호스팅에서
  인덱스 문서와 오류 문서를 모두 `index.html`로 지정해 `/intro`
  새로고침에 대응합니다.
- **주소 고정**: 프론트 빌드 결과물에 백엔드 주소가 새겨지기
  때문에, Elastic IP로 주소를 고정해 "IP 변경 → 재빌드" 반복을
  없앴습니다.

배포·운영 절차는 [`infra/README.md`](../infra/README.md),
요청·응답 상세는 [`api-spec.md`](api-spec.md)를 참고합니다.
