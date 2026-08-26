# Infrastructure

AWS 배포 구성과 운영 방법을 정리합니다. 

## 배포 현황

| 구성요소 | 사용 서비스 | 주소 |
|---|---|---|
| 프론트엔드 | S3 정적 웹 호스팅 (버킷 `fst-kb-ai-frontend`, 서울 리전) | <http://fst-kb-ai-frontend.s3-website.ap-northeast-2.amazonaws.com> |
| 백엔드 | EC2 (Ubuntu 24.04, m7i-flex.large) + Elastic IP | <http://13.124.246.14> |
| 웹 서버 | Nginx 리버스 프록시 (80 → 127.0.0.1:8000) | EC2 내부 |
| 프로세스 관리 | systemd (`yolo-backend` 서비스) | EC2 내부 |

- S3는 인덱스 문서와 오류 문서를 모두 `index.html`로 설정했습니다
  (SPA 라우팅 대응).
- Nginx에는 `proxy_set_header Host $host;`(결과 이미지 URL 생성에
  필수), `client_max_body_size 12M`, `proxy_read_timeout 120s`가
  설정되어 있습니다.
- 외부에서 접근 가능한 포트는 22(SSH)와 80(HTTP)입니다. Nginx 적용
  이후 필요 없어진 8000 인바운드 규칙은 보안 그룹에서 제거했고,
  외부에서 접근되지 않는 것과 서비스가 정상 동작하는 것을 함께
  확인했습니다(2026-08-26).
- uvicorn 자체는 `0.0.0.0:8000`에 바인딩되어 있으므로, 외부 차단을
  담당하는 것은 보안 그룹입니다. **8000 인바운드 규칙을 다시 열면
  Nginx의 헤더 주입·용량 제한·타임아웃을 우회해 백엔드가 그대로
  노출되므로 열지 마십시오.** 근본적으로는 systemd 유닛의 `ExecStart`를
  `--host 127.0.0.1`로 바꾸면 보안 그룹 설정과 무관하게 안전합니다
  (Nginx가 `127.0.0.1:8000`으로 프록시하므로 동작에는 영향 없음).

## 프론트엔드 배포 절차

백엔드 주소는 `frontend/.env.production`에 있으므로 그대로 빌드하면
됩니다.

```bash
npm run build        # frontend/dist 생성
```

`frontend/dist`의 **내용물**(index.html + assets/)을 버킷 루트에
업로드합니다. AWS CLI를 사용하면 옛 파일 삭제까지 한 줄로 됩니다.

```bash
aws s3 sync frontend/dist/ s3://fst-kb-ai-frontend/ --delete
```

업로드 후 브라우저에서 강력 새로고침(Ctrl+Shift+R)으로 확인합니다.
빌드할 때마다 JS 파일명(해시)이 바뀌므로 옛 파일 삭제와 캐시 갱신이
중요합니다.

## 백엔드 운영

EC2에 SSH로 접속한 뒤 사용하는 명령입니다.

```bash
# 상태 확인 / 재시작 / 실시간 로그
sudo systemctl status yolo-backend
sudo systemctl restart yolo-backend
sudo journalctl -u yolo-backend -f

# 코드 업데이트 반영 (main 브랜치 기준)
cd ~/fst-kb-ai && git checkout main && git pull origin main
sudo systemctl daemon-reload
sudo systemctl restart yolo-backend

# Nginx 설정 변경 시
sudo nginx -t && sudo systemctl reload nginx
```

`daemon-reload`는 서비스 파일을 수정하지 않았다면 생략해도 되지만,
수정 여부가 기억나지 않을 때 같이 실행해도 해가 없습니다 (`systemctl
status`에 "changed on disk" 경고가 보이면 반드시 필요합니다).

파이썬 가상환경은 `~/fst-kb-ai/backend/venv`에 있습니다 (로컬 안내의
`.venv`와 이름이 다릅니다). 디버그 스크립트를 직접 실행할 때는
`source ~/fst-kb-ai/backend/venv/bin/activate` 후 사용합니다.

systemd 서비스 파일에는 CORS 허용 주소가 환경변수로 등록되어
있습니다.

```text
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://fst-kb-ai-frontend.s3-website.ap-northeast-2.amazonaws.com"
```

프론트 주소가 바뀌면 이 값을 수정하고 서비스를 재시작하면 됩니다
(코드 수정 불필요).

모델 가중치(`ai/weights/best.pt`)는 git에 포함되지 않으므로 scp로
서버에 올립니다.

```bash
scp -i <키페어.pem> best.pt ubuntu@13.124.246.14:~/fst-kb-ai/ai/weights/
```


## 적용하지 않은 것과 이유

- **HTTPS**: 인증서는 도메인에만 발급되므로 도메인 구입이 선행
  조건입니다. 프론트만 HTTPS로 바꾸면 브라우저가 HTTP API 호출을
  혼합 콘텐츠(mixed content)로 차단하므로 프론트·백을 함께 전환해야
  하며, 전환 지점이 되는 Nginx는 이미 준비되어 있습니다.
