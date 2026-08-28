# AI

전동 킥보드 안전 위반을 탐지하는 YOLO 기반 객체 탐지 모듈입니다.

백엔드가 `predict_image_bytes()` 함수를 호출해 이미지 추론 결과와
바운딩 박스가 표시된 결과 이미지를 전달받아 사용합니다.

현재 탐지 대상은 다음 두 가지 안전 위반입니다.

- 안전모 미착용 (`no_helmet`)
- 다인 탑승 (`multi_riding`)

---

## 구성

| 파일 | 역할 |
|---|---|
| `inference.py` | 모델 로딩(서버 시작 시 1회), 추론, 통계 계산, 결과 이미지 생성 |
| `check_multi_riding.py` | 디버그: 사진 1장 이상을 confidence 0.001로 돌려 예측을 confidence 높은 순 상위 20개까지 출력 (`multi_riding` 유무는 전체 예측 기준 판정) |
| `check_color_order.py` | 디버그: 같은 사진을 파일 경로 / RGB numpy / PIL 세 방식으로 입력하여 결과 비교 |
| `weights/best.pt` | 학습된 YOLO 가중치 (`git` 미포함) |
| `weights/.gitkeep` | `weights/` 디렉토리를 Git에서 유지하기 위한 파일 |

---

## 모델 정보

현재 AI 모듈은 Ultralytics YOLO11s 기반 객체 탐지 모델을 사용합니다.

| 항목 | 내용 |
|---|---|
| Model Architecture | YOLO11s |
| Framework | Ultralytics YOLO |
| Input Size | 960 × 960 |
| 클래스 수 | 3 |
| 기본 Confidence Threshold | 0.25 |
| 기본 Image Size | 960 |
| 가중치 경로 | `ai/weights/best.pt` |
| Backend | FastAPI + Uvicorn |
| 배포 환경 | AWS EC2 |
| 현재 EC2 추론 장치 | CPU |

모델은 API 요청이 들어올 때마다 새로 로딩하지 않고,
FastAPI 프로세스가 시작될 때 한 번 로딩한 뒤 동일한 모델 인스턴스를
재사용합니다.

이를 통해 요청마다 `.pt` 파일을 다시 읽는 비효율을 방지합니다.

---

## 학습 데이터

AI Hub의 **개인형 이동장치 안전 데이터**를 기반으로 학습 데이터를
구성했습니다.

원천 데이터 약 58만 장의 이미지와 JSON Annotation을 분석하여
본 프로젝트에서 필요한 전동 킥보드 객체를 선별했습니다.

최종 YOLO 데이터셋은 다음과 같습니다.

| 항목 | 수량 |
|---|---:|
| 전체 이미지 | 118,554 |
| 전체 객체 | 179,889 |
| `other_kickboard` | 131,272 |
| `no_helmet` | 37,445 |
| `multi_riding` | 11,172 |

원천 CCTV 데이터에는 동일 영상의 연속 프레임이 포함되어 있기 때문에,
단순 이미지 단위 Random Split을 수행할 경우 매우 유사한 프레임이
Train과 Validation/Test에 동시에 포함될 수 있습니다.

이를 방지하기 위해 **이미지 단위가 아닌 `video_id` 단위로
Train / Validation / Test를 분리**했습니다.

| Split | 이미지 | 객체 |
|---|---:|---:|
| Train | 96,735 | 140,920 |
| Validation | 9,933 | 20,437 |
| Test | 11,886 | 18,532 |

Train / Validation / Test 사이의 `video_id`는 중복되지 않도록
구성했습니다.

---

## 탐지 클래스

| ID | 클래스 | 의미 |
|---|---|---|
| 0 | `other_kickboard` | 두 목표 위반에 해당하지 않는 비교용 킥보드 객체 |
| 1 | `no_helmet` | 안전모 미착용 |
| 2 | `multi_riding` | 다인 탑승 |

모델의 클래스 구성이 위와 다르면 로딩 단계에서 오류를 내도록
검증하고 있으므로, 새 가중치로 교체할 때는 클래스 구성을 맞춰야
합니다.

```python
{
    0: "other_kickboard",
    1: "no_helmet",
    2: "multi_riding",
}
````

### `other_kickboard` 해석 주의

`other_kickboard`는 **안전모를 착용한 사람을 의미하는 클래스가 아닙니다.**

본 프로젝트에서 탐지하려는 두 위반인

* 안전모 미착용
* 다인 탑승

에 해당하지 않는 킥보드 객체를 비교 클래스로 구성한 것입니다.

따라서 다음과 같이 해석하면 안 됩니다.

```text
other_kickboard = helmet
```

또는

```text
helmet = total - noHelmet
```

현재 모델에는 `helmet`이라는 독립 클래스가 존재하지 않습니다.

---

## 모델 성능 참고

전체 모델 실험에서 가장 안정적인 정량 성능을 기록한
**YOLO11s Baseline (imgsz=960)**의 Validation 결과는 다음과 같습니다.

| 클래스               | Precision | Recall | mAP50 | mAP50-95 |
| ----------------- | --------: | -----: | ----: | -------: |
| 전체                |     0.784 |  0.683 | 0.822 |    0.628 |
| `other_kickboard` |     0.808 |  0.693 | 0.862 |    0.631 |
| `no_helmet`       |     0.723 |  0.911 | 0.892 |    0.707 |
| `multi_riding`    |     0.821 |  0.443 | 0.714 |    0.547 |

`no_helmet`은 Recall 0.911, mAP50 0.892로 상대적으로 안정적인
성능을 보였습니다.

반면 `multi_riding`은 Recall 0.443으로 성능 한계가 확인되었습니다.

> **주의**
>
> 위 수치는 전체 실험에서 대표 성능으로 사용하는 Baseline 모델의
> Validation 결과입니다.
>
> `ai/weights/best.pt`가 다른 실험에서 생성된 가중치로 교체된 경우
> 위 성능 수치를 해당 배포 가중치의 성능으로 그대로 해석하면 안 됩니다.
>
> 가중치를 교체할 때는 해당 모델의 Validation/Test 결과도 함께
> 기록하는 것을 권장합니다.

---

## 동작 방식

1. 이미지 bytes를 받아 EXIF 회전을 보정하고 RGB로 변환합니다.

2. PIL 이미지를 **그대로** YOLO에 넘겨 추론합니다.

   Ultralytics는 입력 형식에 따라 이미지 Channel Order를 다르게
   해석할 수 있습니다.

   * PIL 입력: RGB
   * numpy 입력: BGR로 해석될 수 있음

   초기 구현에서는 다음과 같이 RGB numpy 배열을 만들어 YOLO에
   전달했습니다.

   ```python
   image_np = np.asarray(image)
   ```

   그러나 RGB numpy 배열을 Ultralytics가 BGR 기준으로 처리하면서
   빨강/파랑 Channel이 뒤집힌 상태로 추론되는 문제가 확인되었습니다.

   **2026-08-26 수정·배포 완료**

   테스트 사진 1장 기준:

   | 항목            |  수정 전 |  수정 후 |
   | ------------- | ----: | ----: |
   | 평균 Confidence | 26.2% | 40.3% |
   | 탐지 객체 수       |     1 |     3 |

   현재는 PIL 이미지를 직접 YOLO에 전달하도록 수정했습니다.

   단, 늘어난 탐지가 모두 정탐은 아닙니다.

   같은 사진에서 실제 2인 탑승 킥보드는 `other_kickboard`로,
   킥보드를 타지 않은 보행자는 `no_helmet`으로 분류되었습니다.

   따라서 **입력 처리 문제를 바로잡은 것과 모델 자체 정확도는
   별개의 문제입니다.**

3. 클래스별 탐지 수와 평균 confidence(%)를 계산합니다.

4. 바운딩 박스를 그린 JPEG 이미지를 함께 반환합니다.

---

## 입력 및 출력

### 입력

`predict_image_bytes()`는 이미지 파일의 raw bytes를 입력으로 받습니다.

```python
statistics, annotated_image = predict_image_bytes(image_bytes)
```

FastAPI에서 지원하는 이미지 형식은 다음과 같습니다.

* JPG
* JPEG
* PNG

현재 최대 업로드 크기는 **10MB**입니다.

### 출력

`statistics` 예시:

```json
{
  "total": 2,
  "otherKickboard": 1,
  "noHelmet": 1,
  "multiRiding": 0,
  "confidence": 81.6
}
```

`annotated_image`는 Bounding Box와 예측 클래스가 표시된 JPEG bytes입니다.

FastAPI는 해당 이미지를 `backend/results/`에 저장하고,
최종 응답에 `resultImageUrl`을 추가합니다.

예시:

```json
{
  "total": 2,
  "otherKickboard": 1,
  "noHelmet": 1,
  "multiRiding": 0,
  "confidence": 81.6,
  "resultImageUrl": "https://api.example.com/results/xxxxxxxx.jpg"
}
```

---

## Confidence 해석 주의

API의 `confidence`는 **탐지된 모든 객체의 YOLO confidence 평균값**입니다.

예를 들어 다음 결과가 있다고 가정합니다.

```json
{
  "total": 3,
  "confidence": 72.4
}
```

이 값은 서비스 전체 판단 정확도가 72.4%라는 의미가 아닙니다.

탐지된 3개 객체의 예측 confidence 평균이 72.4%라는 의미입니다.

또한 모델이 잘못된 클래스를 높은 confidence로 예측할 수도 있으므로,
confidence가 높다고 해서 해당 예측이 반드시 정답이라는 의미는 아닙니다.

---

## 서비스 처리 흐름

```text
사용자 이미지 업로드
        ↓
React Frontend
        ↓
POST /detect
        ↓
FastAPI Backend
        ↓
predict_image_bytes()
        ↓
YOLO11s
        ↓
클래스별 탐지 결과 계산
        ↓
Bounding Box 이미지 생성
        ↓
JSON + resultImageUrl 반환
        ↓
React 결과 화면 표시
```

AI 추론 코드와 HTTP API를 분리했기 때문에,
클래스 계약이 동일하다면 모델 재학습 후 `best.pt`만 교체하여
새 모델을 서비스에 적용할 수 있습니다.

---

## 디버그 스크립트 (EC2에서 실행)

가중치를 교체했거나 특정 사진이 왜 안 잡히는지 볼 때 사용합니다.

서비스는 confidence 0.25 아래 예측을 버리기 때문에,
서비스 화면만으로는

> 모델이 아예 못 보는지 / 예측은 하지만 confidence가 낮은지

를 구분할 수 없습니다.

```bash
cd ~/fst-kb-ai
source backend/venv/bin/activate

python ai/check_multi_riding.py ~/사진.jpg [사진2.jpg ...]
python ai/check_color_order.py ~/사진.jpg
```

두 스크립트는 `ai/weights/best.pt`와 conf·imgsz를 하드코딩하므로
`YOLO_MODEL_PATH` 등 환경변수 오버라이드는 반영되지 않습니다.

서비스가 환경변수로 다른 가중치를 사용하고 있다면 디버그 스크립트도
동일한 모델을 사용하도록 수정해야 합니다.

### 2026-08-26 multi_riding 검증

배포 가중치는 `multi_riding` 클래스를 가지고 있지만,
테스트한 실제 2인 탑승 사진 1장에서 해당 클래스 예측이
**confidence 0.001에서도 0건**이었습니다.

따라서 해당 사례는 단순히 서비스의 confidence threshold를
0.25에서 낮추는 것으로 해결되지 않습니다.

현재까지 확인된 가능성은 다음과 같습니다.

* 학습 데이터의 특정 영상 편향
* 촬영 환경 차이
* Small Object 문제
* 다른 킥보드 클래스로의 오분류
* Annotation 구성 문제

정확한 원인 분석에는 학습 데이터 분포 및 confusion matrix 확인이
필요합니다.

---

## 알려진 모델 한계

### 1. `multi_riding` 성능

현재 모델에서 가장 큰 한계는 다인 탑승 탐지입니다.

Validation 기준 `multi_riding` Recall은 약 **0.443**입니다.

추가 오류 분석 결과 `multi_riding` 객체를 아예 찾지 못하는 경우보다
다른 클래스로 잘못 분류하는 경우가 더 많이 나타났습니다.

대표적인 오류는 다음과 같습니다.

```text
multi_riding → other_kickboard
multi_riding → no_helmet
```

따라서 confidence threshold만 조절하는 방식으로 해결되지 않는
사례가 존재합니다.

---

### 2. 데이터 불균형

전체 객체 179,889개 중 클래스별 분포는 다음과 같습니다.

```text
other_kickboard : 131,272
no_helmet       : 37,445
multi_riding    : 11,172
```

특히 `multi_riding` 데이터가 상대적으로 부족합니다.

클래스 균형화를 위해 Undersampling 기반 Balanced Dataset을 별도로
구성하여 실험했지만 단순하게 클래스 수를 1:1:1에 가깝게 맞추는 것만으로는
`multi_riding` 성능이 유의미하게 향상되지 않았습니다.

---

### 3. 특정 영상 편향

학습 데이터 분석 결과 `multi_riding` 객체가 일부 특정 영상에
집중되어 있었습니다.

Train의 multi_riding 8,936개 중 상위 3개 영상이 약 88%를
차지하는 구조가 확인되었습니다.

따라서 객체 개수는 많더라도 실제로는 서로 매우 비슷한 연속 프레임을
반복 학습할 가능성이 있습니다.

이는 새로운 카메라 또는 새로운 촬영 환경에서의 일반화 성능을
저하시킬 수 있습니다.

---

### 4. Small Object

CCTV 환경에서는 전동 킥보드와 탑승자가 화면에서 매우 작게 나타나는
경우가 많습니다.

객체 크기 분석 결과 작은 객체일수록 `multi_riding` 판별 성공률이
크게 감소하는 경향이 확인되었습니다.

특히 bbox의 짧은 변이 32px 이하인 영역에서 성능 저하가 크게
나타났습니다.

이러한 문제를 완화하기 위해 현재 모델의 입력 크기를 일반적인
640보다 큰 **960**으로 설정했습니다.

---

### 5. 클래스 구조의 한계

현재 모델은 하나의 Bounding Box에 하나의 클래스만 부여하는
3-class Object Detection 구조입니다.

그러나 실제 상황에서는 다음 두 위반이 동시에 발생할 수 있습니다.

```text
안전모 미착용 + 다인 탑승
```

현재 구조에서는 하나의 객체가 동시에 두 가지 위반 속성을 표현하기
어렵습니다.

장기적으로는 안전모 착용 여부와 다인 탑승 여부를 독립적으로 판정하는
Multi-label 또는 2-stage 구조가 더 적합할 수 있습니다.

---

## 모델 개선 실험

`multi_riding` 성능을 개선하기 위해 다음 실험을 수행했습니다.

### 클래스 균형화

모든 `multi_riding` 데이터를 유지하고 `other_kickboard`,
`no_helmet`을 Undersampling하여 약 1:1:1 수준의 Balanced Dataset을
구성했습니다.

그러나 `multi_riding` Recall은 약 0.443에서 약 0.446으로
거의 변화하지 않았습니다.

이를 통해 단순 클래스 개수 불균형만이 문제의 핵심 원인은 아니라는
것을 확인했습니다.

### 2-stage Binary Classifier

YOLO Detector가 킥보드 객체를 찾은 뒤,
해당 Crop을 다시 `multi_riding / non_multi`로 분류하는
Binary Classifier도 실험했습니다.

균형 Validation에서는 높은 성능을 보였지만 실제 자연 데이터 분포에서
False Positive가 크게 증가하는 문제가 확인되었습니다.

이는 실제 데이터에서 `multi_riding` 비율이 매우 낮기 때문에
작은 False Positive Rate도 많은 오탐을 발생시키는
Base-rate Effect의 영향을 받기 때문입니다.

### Hard Negative Mining

Binary Classifier가 높은 확률로 `multi_riding`이라고 잘못 판단한
Negative Sample을 수집해 다시 학습하는 Hard Negative Mining도
수행했습니다.

False Positive를 일부 감소시킬 수 있었지만 Recall과의 Trade-off가
발생했으며 독립 Test에서는 최종적인 성능 향상이 확인되지 않아
최종 모델로 채택하지 않았습니다.

---

## EC2 배포 검증

AWS EC2 서버에서 실제 모델 로딩 및 FastAPI 추론을 검증했습니다.

확인 항목:

* `ai/weights/best.pt` 로딩 성공
* Ultralytics 정상 실행
* 모델 클래스 구성 정상
* FastAPI `/health` 정상
* FastAPI `/detect` 정상
* Bounding Box 결과 이미지 생성 정상
* CPU 추론 정상

`/health` 응답 예시:

```json
{
  "status": "ok",
  "ai": "ready"
}
```

실제 이미지 1장을 `/detect`에 전달한 테스트에서는
EC2 CPU 기준 전체 API 처리 시간이 약 **2.58초**로 측정되었습니다.

따라서 현재 EC2 CPU 환경은 이미지 1장 단위 MVP 서비스에는 사용할 수
있지만, 실시간 CCTV 영상 처리를 위해서는 추가적인 추론 최적화가
필요합니다.

---

## 가중치 교체 (모델 재학습 시)

1. 새 `best.pt`를 `ai/weights/`에 넣습니다.

   배포 서버에는 `scp` 등을 이용하여 직접 전송합니다.

   ```bash
   scp -i <key.pem> best.pt \
   ubuntu@<SERVER_IP>:/home/ubuntu/fst-kb-ai/ai/weights/best.pt
   ```

2. 서버에서 Backend를 재시작합니다.

   ```bash
   sudo systemctl restart yolo-backend
   ```

3. 서버 상태를 확인합니다.

   ```bash
   curl http://127.0.0.1:8000/health
   ```

4. 대표 이미지로 실제 `/detect` 요청을 확인합니다.

클래스 구성이 동일하다면 코드나 프론트엔드를 수정하지 않고
`best.pt`만 교체하여 새 모델을 적용할 수 있습니다.

---

## 가중치 교체 후 체크리스트

새 모델을 배포할 때는 다음 내용을 확인합니다.

1. 모델 클래스 확인

   ```python
   {
       0: "other_kickboard",
       1: "no_helmet",
       2: "multi_riding",
   }
   ```

2. 모델 파일 위치 확인

   ```text
   ai/weights/best.pt
   ```

3. 디버그 스크립트 실행

   ```bash
   python ai/check_multi_riding.py ~/test.jpg
   python ai/check_color_order.py ~/test.jpg
   ```

4. Backend 재시작

   ```bash
   sudo systemctl restart yolo-backend
   ```

5. Health Check

   ```bash
   curl http://127.0.0.1:8000/health
   ```

6. `other_kickboard`, `no_helmet`, `multi_riding` 대표 이미지 각각 테스트

7. 이전 모델과 결과 비교

특정 이미지 몇 장에서 성능이 향상됐다는 이유만으로 새 모델이
전체적으로 더 우수하다고 판단하지 않습니다.

Validation/Test 지표와 실제 이미지에 대한 정성 평가를 함께
확인해야 합니다.

---

## 문제 발생 시 확인 순서

서비스 추론 결과에 문제가 있을 경우 다음 순서로 원인을 구분합니다.

```text
1. Bounding Box가 아예 없는가?
   → Detection / confidence / Small Object 문제 확인

2. Bounding Box는 있지만 클래스가 틀리는가?
   → Classification / 학습 데이터 문제 확인

3. confidence를 매우 낮춰도 목표 클래스가 없는가?
   → threshold 문제가 아니라 모델 자체가 해당 클래스를 예측하지 않는 상태

4. 로컬과 EC2 결과가 다른가?
   → Python / Ultralytics / 입력 처리 방식 확인

5. PIL / numpy / 파일 경로 입력 결과가 다른가?
   → RGB/BGR Color Order 확인

6. 특정 촬영 환경에서만 반복적으로 실패하는가?
   → 학습 데이터의 Camera / Video / Domain 편향 확인
```

---

## 향후 개선 방향

### 데이터 다양성 개선

현재 `multi_riding` 데이터는 특정 영상과 촬영 조건에 집중되어 있는
문제가 있습니다.

향후에는 단순 객체 수 기준 균형보다 다음 요소를 고려하여 데이터를
구성할 계획입니다.

* video별 최대 Sample 제한
* camera별 균형
* scene별 균형
* 주간 / 야간
* 원거리 / 근거리
* 촬영 각도
* 객체 크기
* 실제 서비스 환경 CCTV 데이터 추가

---

### Annotation 재검수

Hard Negative Mining 과정에서 모델이 높은 confidence로 기존
Annotation과 반대 판단을 하는 사례가 일부 확인되었습니다.

향후에는 이러한 데이터를 우선 검수 대상으로 선정하는
Active Learning 방식도 활용할 수 있습니다.

---

### Multi-label / 2-stage 구조

현재의 배타적인 3-class 구조 대신 다음과 같은 구조를 검토할 수 있습니다.

```text
Kickboard Detection
        ↓
탑승 영역 Crop
        ↓
Helmet Classification
+
Multi-riding Classification
```

또는 사람과 킥보드를 각각 Detection한 후 객체 간 관계를 분석하여
탑승 인원을 계산하는 방식도 고려할 수 있습니다.

---

### 영상 기반 판정

실제 CCTV 영상에서는 한 프레임의 결과만으로 위반을 확정하지 않고
객체 추적을 추가할 수 있습니다.

예:

* ByteTrack
* BoT-SORT
* Track ID 유지
* 최근 N Frame Voting
* 일정 시간 이상 위반 지속 시 이벤트 확정

이를 통해 단일 프레임 오분류에 의한 오탐을 감소시킬 수 있습니다.

---

### 추론 최적화

현재 EC2 CPU 환경에서는 이미지 1장당 약 2~3초의 처리 시간이
필요합니다.

실시간 CCTV 서비스로 확장할 경우 다음 기술을 검토할 수 있습니다.

* GPU EC2
* ONNX
* OpenVINO
* TensorRT
* Quantization
* Async Inference
* Batch Processing

---

## 환경변수

서비스에서 조정 가능한 주요 환경변수는 다음과 같습니다.

* `YOLO_MODEL_PATH`
* `YOLO_CONF`
* `YOLO_IMGSZ`
* `YOLO_DEVICE`

세부 설정 및 Backend 실행 방법은
[`backend/README.md`](../backend/README.md)를 참고합니다.

```

이대로 **GitHub의 `ai/README.md` 편집 창에서 `Ctrl+A → 붙여넣기 → 변경 사항 커밋`** 하면 돼.

한 가지는 의도적으로 이렇게 적었어:

> **모델 성능 참고 = Baseline 성능이며, 현재 `best.pt`가 다른 실험 가중치라면 동일 성능으로 해석하지 말 것**

이 문구는 꼭 유지하는 게 좋아. 지금 배포 과정에서 가중치가 교체될 수 있기 때문에, README에 `mAP50 0.822`를 적어놓고 현재 서비스 모델도 정확히 그 수치라고 오해하는 걸 방지해줘. 
```
