from __future__ import annotations

import sys
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


# ------------------------------------------------------------
# 프로젝트 경로
# ------------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[2]
RESULTS_DIR = BACKEND_DIR / "results"

RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# backend/ 폴더에서 uvicorn을 실행해도
# repo root의 ai 패키지를 import할 수 있도록 설정
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


from ai.inference import predict_image_bytes


# ------------------------------------------------------------
# FastAPI
# ------------------------------------------------------------

app = FastAPI(
    title="fst-kb-ai backend",
    version="0.2.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# YOLO bounding box 결과 이미지 제공
app.mount(
    "/results",
    StaticFiles(directory=str(RESULTS_DIR)),
    name="results",
)


# ------------------------------------------------------------
# 설정
# ------------------------------------------------------------

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
}

MAX_FILE_SIZE = 10 * 1024 * 1024


# ------------------------------------------------------------
# Health Check
# ------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "ai": "ready",
    }


# ------------------------------------------------------------
# Detection
# ------------------------------------------------------------

@app.post("/detect")
async def detect(
    request: Request,
    file: UploadFile = File(...),
):
    """
    JPG/JPEG/PNG 이미지 한 장을 받아 YOLO 추론을 수행한다.

    실제 모델 클래스:
      - other_kickboard
      - no_helmet
      - multi_riding
    """

    # --------------------------------------------------------
    # 1. 파일 형식 검증
    # --------------------------------------------------------

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="JPG, JPEG, PNG 이미지만 업로드할 수 있습니다.",
        )


    # --------------------------------------------------------
    # 2. 파일 읽기
    # --------------------------------------------------------

    image_bytes = await file.read()
    await file.close()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="빈 이미지 파일입니다.",
        )

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="이미지 크기는 10MB 이하여야 합니다.",
        )


    # --------------------------------------------------------
    # 3. YOLO 추론
    # --------------------------------------------------------

    try:
        statistics, annotated_bytes = predict_image_bytes(
            image_bytes
        )

    except (ValueError, OSError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"이미지를 처리할 수 없습니다: {exc}",
        ) from exc

    except Exception as exc:
        print(f"[ERROR] AI inference failed: {exc}")

        raise HTTPException(
            status_code=500,
            detail="AI 이미지 분석 중 오류가 발생했습니다.",
        ) from exc


    # --------------------------------------------------------
    # 4. Bounding Box 결과 이미지 저장
    # --------------------------------------------------------

    result_filename = f"{uuid4().hex}.jpg"

    result_path = RESULTS_DIR / result_filename
    result_path.write_bytes(annotated_bytes)


    # --------------------------------------------------------
    # 5. 절대 URL 생성
    #
    # React는 localhost:5173에서 실행되므로
    # /results/... 같은 상대 URL 대신
    # http://localhost:8000/results/... 형태를 반환한다.
    # --------------------------------------------------------

    result_image_url = str(
        request.url_for(
            "results",
            path=result_filename,
        )
    )


    # --------------------------------------------------------
    # 6. API 응답
    # --------------------------------------------------------

    return {
        **statistics,
        "resultImageUrl": result_image_url,
    }
