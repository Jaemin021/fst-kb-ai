# API 명세서

## 기본 정보

| 항목 | 값 |
|---|---|
| Base URL (로컬 개발) | `http://localhost:8000` |
| Base URL (배포) | `http://13.124.246.14` |
| 응답 형식 | JSON |
| 사진 업로드 | `multipart/form-data` |
| 인증 | 없음 (로그인 기능 없음) |

CORS 허용 주소는 백엔드의 `ALLOWED_ORIGINS` 환경변수로 관리합니다.
환경변수가 없으면 로컬 개발 주소(`http://localhost:5173`,
`http://127.0.0.1:5173`)만 허용하며, 배포 서버에는 S3 사이트 주소가
추가로 등록되어 있습니다.

## GET /health

서버와 AI 모델이 준비되었는지 확인합니다.

**Request**

| 항목 | 값 |
|---|---|
| Method | GET |
| Path | `/health` |
| Body | 없음 |

**Response 200**

```json
{ "status": "ok", "ai": "ready" }
```

모델 로딩에 실패하면 서버 자체가 시작되지 않으므로, 이 응답이
온다는 것은 모델까지 정상 로딩되었다는 뜻입니다.

## POST /detect

사진 한 장을 업로드해 킥보드 안전 위반 여부를 분석합니다.

**Request**

| 항목 | 값 |
|---|---|
| Method | POST |
| Path | `/detect` |
| Content-Type | `multipart/form-data` |

Body (form-data):

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `file` | File (jpg/jpeg/png) | Y | 분석할 사진 1장, 10MB 이하 |

**Response 200**

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

| 필드명 | 타입 | 설명 |
|---|---|---|
| `total` | number | 탐지된 전체 객체 수 |
| `otherKickboard` | number | 기타 킥보드 탐지 수 (위반 아님) |
| `noHelmet` | number | 안전모 미착용 탐지 수 |
| `multiRiding` | number | 다인 탑승 탐지 수 |
| `confidence` | number | 탐지된 객체들의 평균 신뢰도(%). 탐지가 없으면 `0.0` |
| `resultImageUrl` | string | 바운딩 박스가 그려진 결과 이미지의 절대 URL |

결과 이미지는 백엔드가 `backend/results/`에 저장한 뒤
`/results/<파일명>.jpg` 경로로 정적 서빙합니다. URL은 요청의 Host
기준 절대 주소로 생성되므로 로컬에서는 `http://localhost:8000/...`,
배포 서버에서는 `http://13.124.246.14/...` 형태가 됩니다.

**오류 응답**

| 상태 코드 | 상황 |
|---|---|
| 400 | 빈 파일이거나 이미지로 해석할 수 없는 데이터 |
| 413 | 파일이 10MB를 초과 |
| 415 | JPG/JPEG/PNG가 아닌 형식 |
| 422 | `file` 필드 없이 요청 |
| 500 | AI 추론 중 서버 오류 |

오류 본문은 FastAPI 기본 형식인 `{"detail": "..."}` 입니다.

**요청 예시**

```bash
curl -X POST http://13.124.246.14/detect -F "file=@sample.jpg"
```

## 탐지 클래스와 신뢰도

모델이 탐지하는 클래스는 3종입니다.

| 클래스 | 의미 |
|---|---|
| `other_kickboard` | 기타 킥보드 |
| `no_helmet` | 안전모 미착용 |
| `multi_riding` | 다인 탑승 |

confidence threshold 기본값은 0.25이며, 백엔드 환경변수
`YOLO_CONF`로 조정할 수 있습니다.

## 자동 생성 문서 (Swagger)

- 로컬: `http://localhost:8000/docs`
- 배포: `http://13.124.246.14/docs`
