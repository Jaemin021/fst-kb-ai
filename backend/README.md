# Backend

FastAPI 기반 API 서버입니다. 업로드된 사진을 검증한 뒤 `ai/` 모듈의
YOLO 추론을 호출하고, 탐지 통계와 바운딩 박스 결과 이미지를
응답합니다.

## 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 서버·모델 준비 상태 확인 |
| POST | `/detect` | 사진 1장 분석 (`multipart/form-data`, `file` 필드) |
| GET | `/results/<파일명>` | 바운딩 박스 결과 이미지 (정적 서빙) |

상세 명세는 [`docs/api-spec.md`](../docs/api-spec.md)를 참고합니다.

## 로컬 실행 방법

모델 가중치 `ai/weights/best.pt`가 먼저 있어야 합니다 (git 미포함,
팀 공유 채널에서 전달). 파일이 없으면 서버가 시작 시점에
종료됩니다.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/health`에서 `{"status":"ok","ai":"ready"}`가
보이면 정상입니다.

배포 서버(EC2)의 가상환경은 이름이 `.venv`가 아니라
`backend/venv`이고, 직접 실행하지 않고 systemd(`yolo-backend`)가
구동합니다. 운영 절차는 [`infra/README.md`](../infra/README.md)를
참고합니다.

## 환경변수

| 이름 | 기본값 | 설명 |
|---|---|---|
| `ALLOWED_ORIGINS` | 로컬 개발 주소 2개 | CORS 허용 출처 목록 (쉼표 구분) |
| `YOLO_MODEL_PATH` | `ai/weights/best.pt` | 가중치 파일 경로 |
| `YOLO_CONF` | `0.25` | confidence threshold |
| `YOLO_IMGSZ` | `960` | 추론 입력 크기 |
| `YOLO_DEVICE` | GPU 있으면 `0`, 없으면 `cpu` | 추론 장치 |

## 참고

- 서버 검증 규칙: JPG/JPEG/PNG만 허용, 10MB 이하.
- 결과 이미지는 `backend/results/`에 저장되며 git에는 포함되지
  않습니다.
