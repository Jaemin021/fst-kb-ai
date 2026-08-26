"""
YOLO 입력의 채널 순서(RGB/BGR)에 따라 결과가 달라지는지 확인하는 디버그
스크립트.

2026-08-26 이전의 inference.py는 PIL로 연 이미지를 np.asarray로 바꿔
(RGB 순서) YOLO에 넘기고 있었는데, ultralytics는 numpy 배열을
BGR(OpenCV 순서)로 간주한다. 그래서 서비스가 빨강/파랑이 뒤집힌 이미지로
추론하고 있었고, 이 스크립트로 그 사실을 확인한 뒤 PIL 이미지를 그대로
넘기도록 수정했다. 같은 사진을

    A) 파일 경로로 넘김           (ultralytics가 직접 읽음, 정상 기준)
    B) RGB numpy로 넘김            (수정 전 버그 경로 재현)
    C) PIL 이미지 그대로 넘김      (현재 inference.py 방식)

세 가지로 돌려서 threshold 0.25 이상 결과를 나란히 보여준다.
가중치를 교체한 뒤 A/C가 서로 같고 B만 낮게 나오면 정상이다.

사용법 (EC2에서):
    python ai/check_color_order.py ~/test.jpg
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from ultralytics import YOLO


AI_DIR = Path(__file__).resolve().parent
MODEL_PATH = AI_DIR / "weights" / "best.pt"

# inference.py 기본값과 동일 (환경변수 오버라이드는 반영하지 않음)
CONF = 0.25
IMAGE_SIZE = 960


def summarize(model: YOLO, result) -> None:
    if result.boxes is None or len(result.boxes) == 0:
        print("    (탐지 없음)")
        return

    rows = sorted(
        zip(result.boxes.cls.tolist(), result.boxes.conf.tolist()),
        key=lambda row: row[1],
        reverse=True,
    )
    confs = [c for _, c in rows]
    for class_id, confidence in rows:
        print(f"    {model.names[int(class_id)]:<16} {confidence:.3f}")
    print(
        f"    -> total={len(rows)}, "
        f"평균 confidence={sum(confs) / len(confs) * 100:.1f}%"
    )


def main(image_path: str) -> None:
    model = YOLO(str(MODEL_PATH))

    # inference.py 와 똑같은 디코딩
    image = Image.open(image_path)
    image = ImageOps.exif_transpose(image).convert("RGB")
    image_np_rgb = np.asarray(image)

    cases = [
        ("A) 파일 경로 (정상 기준)", image_path),
        ("B) RGB numpy (수정 전 버그 경로)", image_np_rgb),
        ("C) PIL 이미지 그대로 (현재 방식)", image),
    ]

    print("=" * 60)
    print(f"사진: {image_path}  크기: {image.size}")
    print(f"설정: conf={CONF}, imgsz={IMAGE_SIZE}")
    print("=" * 60)

    for label, source in cases:
        print()
        print(f"[{label}]")
        result = model.predict(
            source=source,
            conf=CONF,
            imgsz=IMAGE_SIZE,
            verbose=False,
        )[0]
        summarize(model, result)

    print()
    print("판독: A와 C가 같고 B만 낮으면 정상 (B는 수정 전 버그 경로 재현).")
    print("      서비스 화면 결과가 B와 같다면 수정 코드가 아직 배포되지 않은 것.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("사용법: python ai/check_color_order.py <사진.jpg>")
        sys.exit(1)
    main(sys.argv[1])
