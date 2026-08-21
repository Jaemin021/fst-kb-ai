# AI

전동 킥보드 안전 위반을 탐지하는 YOLO 추론 모듈입니다. 백엔드가
`predict_image_bytes()` 함수를 호출해 사용합니다.

## 구성

| 파일 | 역할 |
|---|---|
| `inference.py` | 모델 로딩(서버 시작 시 1회), 추론, 통계 계산, 결과 이미지 생성 |
| `weights/best.pt` | 학습된 YOLO 가중치 (git 미포함) |

## 탐지 클래스

| ID | 클래스 | 의미 |
|---|---|---|
| 0 | `other_kickboard` | 기타 킥보드 |
| 1 | `no_helmet` | 안전모 미착용 |
| 2 | `multi_riding` | 다인 탑승 |

모델의 클래스 구성이 위와 다르면 로딩 단계에서 오류를 내도록
검증하고 있으므로, 새 가중치로 교체할 때는 클래스 구성을 맞춰야
합니다.

## 동작 방식

1. 이미지 bytes를 받아 EXIF 회전을 보정하고 RGB로 변환합니다.
2. YOLO 추론 후 클래스별 탐지 수와 평균 confidence(%)를 계산합니다.
3. 바운딩 박스를 그린 JPEG 이미지를 함께 반환합니다.

## 가중치 교체 (모델 재학습 시)

1. 새 `best.pt`를 `ai/weights/`에 넣습니다 (배포 서버는 scp로 전송).
2. 서버에서 `sudo systemctl restart yolo-backend`로 재시작하면
   반영됩니다. 코드나 프론트엔드는 수정할 필요가 없습니다.

조정 가능한 환경변수(`YOLO_CONF`, `YOLO_IMGSZ` 등)는
[`backend/README.md`](../backend/README.md)를 참고합니다.
