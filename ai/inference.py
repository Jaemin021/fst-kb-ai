from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Any

import numpy as np
import torch
from PIL import Image, ImageOps
from ultralytics import YOLO


# ------------------------------------------------------------
# 기본 설정
# ------------------------------------------------------------

AI_DIR = Path(__file__).resolve().parent

DEFAULT_MODEL_PATH = AI_DIR / "weights" / "best.pt"

MODEL_PATH = Path(
    os.getenv("YOLO_MODEL_PATH", str(DEFAULT_MODEL_PATH))
)

CONF_THRESHOLD = float(
    os.getenv("YOLO_CONF", "0.25")
)

IMAGE_SIZE = int(
    os.getenv("YOLO_IMGSZ", "960")
)

DEVICE = os.getenv(
    "YOLO_DEVICE",
    "0" if torch.cuda.is_available() else "cpu"
)


EXPECTED_CLASSES = {
    0: "other_kickboard",
    1: "no_helmet",
    2: "multi_riding",
}


# ------------------------------------------------------------
# 모델 래퍼
# ------------------------------------------------------------

class KickboardDetector:
    """
    전동 킥보드 안전 위반 YOLO 추론 모듈.

    클래스:
        0: other_kickboard
        1: no_helmet
        2: multi_riding
    """

    def __init__(
        self,
        model_path: Path | str = MODEL_PATH,
        conf: float = CONF_THRESHOLD,
        imgsz: int = IMAGE_SIZE,
        device: str = DEVICE,
    ) -> None:

        self.model_path = Path(model_path)
        self.conf = conf
        self.imgsz = imgsz
        self.device = device

        if not self.model_path.exists():
            raise FileNotFoundError(
                f"YOLO weight를 찾을 수 없습니다: {self.model_path}"
            )

        print(f"[AI] YOLO 모델 로딩: {self.model_path}")
        print(f"[AI] device={self.device}, imgsz={self.imgsz}, conf={self.conf}")

        self.model = YOLO(str(self.model_path))

        if self.model.names != EXPECTED_CLASSES:
            raise RuntimeError(
                "모델 클래스 구성이 예상과 다릅니다.\n"
                f"expected={EXPECTED_CLASSES}\n"
                f"actual={self.model.names}"
            )

        print("[AI] YOLO 모델 로딩 완료")


    def predict_bytes(
        self,
        image_bytes: bytes,
    ) -> tuple[dict[str, Any], bytes]:
        """
        이미지 bytes를 받아 YOLO 추론을 수행한다.

        Returns
        -------
        statistics : dict
            total, noHelmet, multiRiding, confidence,
            otherKickboard 값을 포함한다.

        annotated_image : bytes
            bounding box가 그려진 JPEG 이미지.
        """

        if not image_bytes:
            raise ValueError("빈 이미지 데이터입니다.")

        # 이미지 디코딩 및 EXIF 회전 보정
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image).convert("RGB")

        image_np = np.asarray(image)

        # YOLO 추론
        results = self.model.predict(
            source=image_np,
            conf=self.conf,
            imgsz=self.imgsz,
            device=self.device,
            verbose=False,
        )

        result = results[0]

        counts = {
            "other_kickboard": 0,
            "no_helmet": 0,
            "multi_riding": 0,
        }

        confidences: list[float] = []

        if result.boxes is not None and len(result.boxes) > 0:

            classes = result.boxes.cls.detach().cpu().tolist()
            confs = result.boxes.conf.detach().cpu().tolist()

            for class_id, confidence in zip(classes, confs):

                class_id = int(class_id)
                class_name = EXPECTED_CLASSES.get(class_id)

                if class_name is not None:
                    counts[class_name] += 1

                confidences.append(float(confidence))

        total = sum(counts.values())

        # 현재 confidence 정의:
        # 탐지된 모든 객체의 평균 confidence (%)
        average_confidence = (
            round(
                sum(confidences) / len(confidences) * 100,
                1,
            )
            if confidences
            else 0.0
        )

        statistics = {
            "total": total,
            "otherKickboard": counts["other_kickboard"],
            "noHelmet": counts["no_helmet"],
            "multiRiding": counts["multi_riding"],
            "confidence": average_confidence,
        }

        # YOLO plot() 결과는 BGR ndarray
        annotated_bgr = result.plot()

        annotated_rgb = annotated_bgr[:, :, ::-1]

        annotated_pil = Image.fromarray(annotated_rgb)

        buffer = io.BytesIO()
        annotated_pil.save(
            buffer,
            format="JPEG",
            quality=90,
        )

        return statistics, buffer.getvalue()


# ------------------------------------------------------------
# 프로세스 시작 시 모델을 한 번만 로딩
# ------------------------------------------------------------

detector = KickboardDetector()


def predict_image_bytes(
    image_bytes: bytes,
) -> tuple[dict[str, Any], bytes]:
    """
    FastAPI에서 사용할 공개 함수.
    """

    return detector.predict_bytes(image_bytes)
