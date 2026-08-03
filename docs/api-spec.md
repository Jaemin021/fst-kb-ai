# API 명세서

## 기본 정보

- Base URL (로컬 개발): `http://localhost:8000`
- 데이터 형식: 응답은 JSON, 사진 업로드는 `multipart/form-data`
- 인증: 없음 (로그인 기능 없음)
- CORS: `http://localhost:5173`, `http://127.0.0.1:5173`만 허용

> 지금은 AI 모델이 없는 스텁 서버라, `POST /detect`는 어떤 사진을
> 보내도 항상 같은 고정 값을 반환합니다.

## GET /health

서버가 살아있는지 확인하는 용도입니다.

**Request**

| 항목 | 값 |
|---|---|
| Method | GET |
| Path | `/health` |
| Body | 없음 |

**Response 200**

```json
{ "status": "ok" }
```

## POST /detect

사진을 업로드해 킥보드 이용자의 헬멧 착용 여부를 분석합니다.

**Request**

| 항목 | 값 |
|---|---|
| Method | POST |
| Path | `/detect` |
| Content-Type | `multipart/form-data` |

Body (form-data):

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `file` | File (jpg/jpeg/png) | Y | 분석할 사진 1장 |

**Response 200**

```json
{
  "total": 3,
  "helmet": 2,
  "noHelmet": 1,
  "confidence": 94.8,
  "resultImageUrl": null
}
```

| 필드명 | 타입 | 설명 |
|---|---|---|
| `total` | number | 사진에서 탐지된 전체 인원 수 |
| `helmet` | number | 헬멧 착용 인원 수 |
| `noHelmet` | number | 헬멧 미착용 인원 수 |
| `confidence` | number | 분석 신뢰도(%), 0~100 |
| `resultImageUrl` | string \| null | 탐지 결과 이미지 주소. `null`이면 프론트엔드가 업로드한 원본 사진을 대신 보여줌 |

**에러 응답**

| 상황 | 상태 코드 |
|---|---|
| `file` 필드 없이 요청 | 422 Unprocessable Entity |

**요청 예시**

```bash
curl -X POST http://localhost:8000/detect \
  -F "file=@sample.jpg"
```

## 현재 제한 사항 (스텁 단계)

- 실제 이미지를 분석하지 않고 항상 같은 값을 반환합니다.
- 서버 쪽에는 파일 형식·용량 검증이 없습니다. 지금은 프론트엔드에서만
  jpg/png, 10MB 이하로 막고 있습니다.
- AI 모델이 붙으면 `total`/`helmet`/`noHelmet`/`confidence`가 실제
  분석 값으로, `resultImageUrl`은 탐지 박스가 그려진 이미지 주소로
  채워질 예정입니다. 요청/응답 형식 자체는 바뀌지 않습니다.

## 자동 생성 문서 (Swagger)

FastAPI 서버를 실행 중이면 아래 주소에서 API 문서를 바로 확인하고
직접 요청도 보내볼 수 있습니다.

- `http://localhost:8000/docs` — Swagger UI
- `http://localhost:8000/redoc` — ReDoc