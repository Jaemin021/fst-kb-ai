# Backend

FastAPI 기반 API 서버입니다. 지금은 AI 모델이 없어서 `POST /detect`가
어떤 사진을 받아도 항상 같은 고정 JSON을 돌려주는 고정 상태입니다.

## 실행

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

`http://localhost:8000/health`로 접속해 `{"status":"ok"}`가 뜨면
정상입니다.

## 앞으로 할 일

- `app/main.py`의 고정 응답 부분을 AI 모델 추론 결과로 교체
- `ai/` 쪽에서 모델이 준비되면 이미지 입력 → 탐지 결과를 반환하는
  함수를 만들고, 여기서 불러와 연결
