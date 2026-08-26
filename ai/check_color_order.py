"""
서비스(inference.py)와 똑같은 전처리로 돌렸을 때 결과가 달라지는지 확인하는
디버그 스크립트.

inference.py는 PIL로 연 이미지를 np.asarray로 바꿔(RGB 순서) YOLO에 넘기는데,
ultralytics는 numpy 배열을 BGR(OpenCV 순서)로 간주한다. 그러면 서비스는
빨강/파랑이 뒤집힌 이미지로 추론하게 된다. 이 스크립트는 같은 사진을

    A) 파일 경로로 넘김           (ultralytics가 직접 읽음, 정상 기준)
    B) 서비스와 똑같이 RGB numpy   (현재 배포 코드 방식)
    C) PIL 이미지 그대로 넘김      (수정안: ultralytics가 알아서 BGR로 변환)

세 가지로 돌려서 threshold 0.25 이상 결과를 나란히 보여준다.
B가 A/C와 다르고 서비스 화면에서 본 결과와 같으면, 채널 순서 버그가 확정이다.

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

# 서비스와 동일한 설정 (inference.py 기본값)
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
        ("B) RGB numpy (현재 서비스 방식)", image_np_rgb),
        ("C) PIL 이미지 그대로 (수정안)", image),
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
    print("판독: B가 A/C와 다르고 서비스 화면 결과와 같으면 채널 순서 버그 확정.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("사용법: python ai/check_color_order.py <사진.jpg>")
        sys.exit(1)
    main(sys.argv[1])
