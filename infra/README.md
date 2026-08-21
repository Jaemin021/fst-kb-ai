# Infrastructure

AWS 배포 구성과 운영 방법을 정리합니다. (2026년 8월 배포 완료)

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
- 보안 그룹은 22(SSH), 80(HTTP), 8000(직접 테스트용)을 개방했습니다.

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

# 코드 업데이트 반영
cd ~/fst-kb-ai && git pull
sudo systemctl restart yolo-backend

# Nginx 설정 변경 시
sudo nginx -t && sudo systemctl reload nginx
```

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

## 비용과 정리

- 비용은 EC2 상시 가동분이 대부분이고, S3는 사실상 무료 수준입니다.
- 퍼블릭 IPv4 주소(Elastic IP 포함)는 시간당 소액이 과금되며,
  특히 Elastic IP를 반납하지 않으면 인스턴스를 종료한 뒤에도 과금이
  계속됩니다.
- 프로젝트 종료 시 정리 순서: **Elastic IP 릴리스(반납) → EC2
  인스턴스 종료 → S3 버킷 비우고 삭제**.

## 적용하지 않은 것과 이유

- **HTTPS**: 인증서는 도메인에만 발급되므로 도메인 구입이 선행
  조건입니다. 프론트만 HTTPS로 바꾸면 브라우저가 HTTP API 호출을
  혼합 콘텐츠(mixed content)로 차단하므로 프론트·백을 함께 전환해야
  하며, 전환 지점이 되는 Nginx는 이미 준비되어 있습니다.
