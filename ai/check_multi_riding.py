"""
다인 탑승(multi_riding) 클래스가 실제로 예측되는지 확인하는 디버그 스크립트.

서비스는 confidence 0.25 아래 예측을 버리기 때문에, threshold를 거의 0으로
낮춰서 모델이 multi_riding을 조금이라도 찍는지 본다.

사용법 (EC2에서):
    python ai/check_multi_riding.py ~/사진.jpg
    python ai/check_multi_riding.py ~/사진1.jpg ~/사진2.jpg ...
"""

from __future__ import annotations

import sys
from pathlib import Path

from ultralytics import YOLO


AI_DIR = Path(__file__).resolve().parent
MODEL_PATH = AI_DIR / "weights" / "best.pt"

# 사실상 모든 예측을 다 보기 위한 값
DEBUG_CONF = 0.001
IMAGE_SIZE = 960


def main(image_paths: list[str]) -> None:
    if not image_paths:
        print("사용법: python ai/check_multi_riding.py <사진.jpg> [사진2.jpg ...]")
        sys.exit(1)

    model = YOLO(str(MODEL_PATH))

    print("=" * 60)
    print(f"모델 클래스: {model.names}")
    print("=" * 60)

    for image_path in image_paths:
        print()
        print(f"[사진] {image_path}")

        result = model.predict(
            source=image_path,
            conf=DEBUG_CONF,
            imgsz=IMAGE_SIZE,
            verbose=False,
        )[0]

        if result.boxes is None or len(result.boxes) == 0:
            print("  예측 없음 (conf 0.001에서도 박스가 하나도 없음)")
            continue

        rows = sorted(
            zip(result.boxes.cls.tolist(), result.boxes.conf.tolist()),
            key=lambda row: row[1],
            reverse=True,
        )

        print(f"  전체 예측 {len(rows)}개 (conf 높은 순, 상위 20개만 표시)")
        for class_id, confidence in rows[:20]:
            name = model.names[int(class_id)]
            marker = "  <-- 서비스 threshold(0.25) 통과" if confidence >= 0.25 else ""
            print(f"    {name:<16} {confidence:.3f}{marker}")

        multi = [c for cls, c in rows if model.names[int(cls)] == "multi_riding"]
        print()
        if not multi:
            print("  multi_riding 예측: 없음 -> 이 사진에서는 클래스를 사실상 안 찍음")
        else:
            best = max(multi)
            print(f"  multi_riding 예측: {len(multi)}개, 최고 conf {best:.3f}")
            if best >= 0.25:
                print("  -> threshold 통과. 서비스에서도 잡혀야 정상")
            elif best >= 0.10:
                print("  -> 알긴 아는데 자신 없음. threshold 조정/데이터 보강으로 개선 여지 있음")
            else:
                print("  -> 거의 안 찍음. 라벨링 방식/학습 데이터 양 확인 필요")


if __name__ == "__main__":
    main(sys.argv[1:])
