# 서비스 구조와 연결 계약

## 현재 단계

React/Vite 프론트엔드와 FastAPI 백엔드가 실제로 연결되어 있습니다.
브라우저에서 이미지를 선택하면 `frontend/src/services/detectionApi.js`가
`POST /detect`로 사진을 보내고, 백엔드(`backend/app/main.py`)가 응답을
돌려줍니다. 다만 아직 AI 모델이 없어서 백엔드는 어떤 사진을 받아도
항상 같은 고정 JSON을 돌려주는 고정 상태입니다.

```text
사용자
  → JPG/JPEG/PNG 사진 선택
  → 브라우저 미리보기
  → detectionApi.js가 POST /detect 요청
  → FastAPI 스텁이 고정 결과 응답
  → 결과 카드와 원본 사진 표시
```

## 향후 AI 모델 연결

```text
React Frontend
  → POST /detect (multipart/form-data)
  → FastAPI Backend
  → AI Inference
  → JSON 결과 및 결과 이미지 URL
```

요청 필드 이름은 `file`로 통일합니다.

```text
POST /detect
Content-Type: multipart/form-data
file: <JPG/JPEG/PNG>
```

현재 응답(고정)은 다음과 같습니다.

```json
{
  "total": 3,
  "helmet": 2,
  "noHelmet": 1,
  "confidence": 94.8,
  "resultImageUrl": null
}
```

AI 모델이 붙으면 `resultImageUrl`에 실제 탐지 결과 이미지 주소가
채워질 예정입니다. 프론트엔드는 `resultImageUrl`이 없을 때 업로드한
원본 사진을 결과 예시로 표시합니다.

필드별 타입, 에러 응답, 요청 예시 등 자세한 내용은
[`docs/api-spec.md`](api-spec.md)를 참고합니다.
