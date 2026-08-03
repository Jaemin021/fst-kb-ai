from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="fst-kb-ai backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    # AI 모델이 아직 없어서 프론트 mock과 같은 형태의 고정 결과를 돌려줍니다.
    return {
        "total": 3,
        "helmet": 2,
        "noHelmet": 1,
        "confidence": 94.8,
        "resultImageUrl": None,
    }
