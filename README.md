# Multi Cloud — 인터랙티브 멀티클라우드 코스

AWS · Azure · GCP · NCP, Linux와 네트워크, Docker, Kubernetes, Terraform, CI/CD·GitOps, 관측·보안·비용, 그리고 멀티클라우드 플랫폼 설계까지.
개념 하나하나를 **단계별로 움직이는 아이소메트릭 다이어그램**으로 배우는 한국어 코스입니다.

형식은 [@DilumSanjaya](https://x.com/DilumSanjaya)의 [System Design 코스](https://designed-to-scale.vercel.app/)에서 영감을 받았고, 코드·그림·내용은 이 저장소에서 새로 만들었습니다.

## 무엇이 들어 있나

| 화면 | 내용 |
| --- | --- |
| **학습** | 11개 챕터 · 52개 레슨. 레슨마다 문제 → 해결을 7–12단계로 쌓아 가며, 장면·숫자 타일·코드 패널이 함께 바뀝니다 |
| **연습** | 레슨별 퀴즈(이 레슨 / 이 챕터 / 전체 섞기), 답을 고르면 바로 이유 |
| **설계 랩** | 같은 3계층 웹 아키텍처를 네 클라우드의 부품으로 조립하고, 번역표와 Terraform 리소스 이름, 설계 점검을 확인 |
| **치트시트** | 4대 클라우드 서비스 매핑, 계정 구조, CLI, Linux, CIDR·포트, Docker, kubectl·Helm, Terraform, Git |
| **로드맵** | 지금까지 배운 것 / 학습 중 / 앞으로 배울 것. 챕터 상태는 눌러서 내 진도에 맞게 변경 |

진도·퀴즈 기록·테마는 브라우저(localStorage)에만 저장됩니다. `Ctrl K`로 레슨·단계·명령어를 검색하고, 레슨에서는 `←` `→`로 단계를 넘깁니다.

## 실행

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

`npm run build`는 `dist/`에 정적 파일을 만듭니다. Vercel·Netlify·GitHub Pages·S3 + CloudFront 어디에든 그대로 올릴 수 있습니다(Vercel은 저장소를 연결하면 Vite를 자동 인식합니다).

## 구조

```
src/
  content/curriculum.js      코스 개요: 챕터와 레슨 목록
  content/chNN/<레슨>.js      레슨 하나 = 파일 하나 (장면 · 단계 · 퀴즈)
  content/cheats.js          치트시트 데이터
  engine/                    아이소메트릭 장면 렌더러 (SVG), 코드 패널, 아이콘
  ui/                        학습 · 연습 · 설계 랩 · 치트시트 · 로드맵 · 검색
  styles/
docs/lesson-authoring.md     레슨 작성 가이드
tools/check.mjs              레슨 검증기 (참조 · 겹침 · 프레임 크기 · 분량)
tools/sheet.mjs              레슨의 모든 단계를 한 장에 렌더링
```

## 레슨 추가·수정

[레슨 작성 가이드](docs/lesson-authoring.md)를 따르세요.

```bash
npm run check
```

```bash
npm run sheet -- <레슨 id>
```
