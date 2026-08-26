# AI

전동 킥보드 안전 위반을 탐지하는 YOLO 추론 모듈입니다. 백엔드가
`predict_image_bytes()` 함수를 호출해 사용합니다.

## 구성

| 파일 | 역할 |
|---|---|
| `inference.py` | 모델 로딩(서버 시작 시 1회), 추론, 통계 계산, 결과 이미지 생성 |
| `check_multi_riding.py` | 디버그: 사진 1장 이상을 confidence 0.001로 돌려 클래스별 예측을 전부 출력 |
| `check_color_order.py` | 디버그: 같은 사진을 파일 경로 / RGB numpy / PIL 세 방식으로 넣어 결과 비교 |
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
2. PIL 이미지를 **그대로** YOLO에 넘겨 추론합니다. ultralytics는 PIL
   입력을 RGB로, numpy 입력을 BGR로 해석하므로 `np.asarray()`로 바꿔
   넘기면 빨강/파랑이 뒤집힌 채 추론되어 신뢰도가 떨어집니다
   (2026-08-26 수정: 같은 사진에서 신뢰도 26% → 40%).
3. 클래스별 탐지 수와 평균 confidence(%)를 계산합니다.
4. 바운딩 박스를 그린 JPEG 이미지를 함께 반환합니다.

## 디버그 스크립트 (EC2에서 실행)

가중치를 교체했거나 특정 사진이 왜 안 잡히는지 볼 때 사용합니다.
서비스는 confidence 0.25 아래 예측을 버리기 때문에, 서비스 화면만으로는
"모델이 아예 못 보는지 / 자신이 없는지"를 구분할 수 없습니다.

```bash
cd ~/fst-kb-ai && source backend/venv/bin/activate
python ai/check_multi_riding.py ~/사진.jpg [사진2.jpg ...]
python ai/check_color_order.py ~/사진.jpg
```

2026-08-26 검증 결과: 배포 가중치는 `multi_riding` 클래스를 갖고
있지만, 2인 탑승 사진에서 해당 클래스 예측이 confidence 0.001에서도
0건이었습니다. threshold 조정으로 해결되지 않으며 학습 데이터 보강이
필요합니다.

## 가중치 교체 (모델 재학습 시)

1. 새 `best.pt`를 `ai/weights/`에 넣습니다 (배포 서버는 scp로 전송).
2. 서버에서 `sudo systemctl restart yolo-backend`로 재시작하면
   반영됩니다. 코드나 프론트엔드는 수정할 필요가 없습니다.

조정 가능한 환경변수(`YOLO_CONF`, `YOLO_IMGSZ` 등)는
[`backend/README.md`](../backend/README.md)를 참고합니다.
