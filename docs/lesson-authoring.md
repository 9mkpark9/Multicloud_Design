# 레슨 작성 가이드

레슨 하나는 파일 하나입니다: `src/content/<챕터 id>/<레슨 id>.js`.
코스 개요(`src/content/curriculum.js`)에 있는 id와 파일 이름, `id` 필드가 모두 같아야 합니다.
제목·소개·시간·난이도는 개요에 이미 있으니 레슨 파일에는 **내용만** 씁니다.

완성된 본보기: [`src/content/ch01/cloud-basics.js`](../src/content/ch01/cloud-basics.js). 먼저 읽어 보세요.

```bash
npm run check -- vpc-subnet     # 규칙 검사 (오류 0, 경고 0이 목표)
npm run sheet -- vpc-subnet     # .sheets/vpc-subnet.png: 모든 단계를 한 장에 렌더링
```

## 레슨의 모양

```js
export default {
  id: 'vpc-subnet',
  learn: ['…', '…', '…', '…', '…'],          // "배울 내용" 4–6개. 단계가 진행되면 순서대로 체크됨
  legend: [['req', '요청'], ['res', '응답']],  // 이 레슨에 나오는 패킷 종류와 이름
  metrics: [{ id: 'cost', label: '월 비용', icon: 'coins' }],  // 무대 위 숫자 타일, 3–4개 (최대 5)
  scene: { zones: {…}, nodes: {…}, edges: {…} },               // 레슨 전체에 등장하는 모든 것
  codes: { main: { title: 'main.tf', lang: 'hcl', text: `…` } }, // (선택) 여러 단계가 함께 보는 코드
  steps: [ {…}, {…} ],                                          // 7–10단계 (6–15 허용, 심화 레슨은 12–15)
  quiz: [ { q, options: [4개], answer: 0–3, why, step } ],       // 3–4문제 (심화 레슨은 10–15), step = 정답을 가르치는 단계
};
```

## 좌표와 배치 (가장 중요)

장면은 아이소메트릭입니다. 땅 위의 격자 좌표 `[x, y]`를 씁니다.

- `x`가 커지면 화면 **오른쪽 아래**로, `y`가 커지면 **왼쪽 아래**로 갑니다.
- 화면 가로 위치 = `x − y`, 세로 위치 = `x + y`. 즉 `[2, 0]`과 `[0, 2]`는 같은 높이에 좌우로 놓이고, `[0, 0]`과 `[2, 2]`는 위아래로 놓입니다.
- 왼쪽 → 오른쪽으로 흐르는 그림을 원하면 `x`는 늘리고 `y`는 줄이세요. 예: `[0, 4] → [2.4, 2.4] → [4.8, 0.8]`.

**카메라는 단계마다 "지금 보이는 것"에 맞춰 줌됩니다.** 무대는 약 800 × 560이라, 한 단계에 보이는 것이 넓게 퍼질수록 전부 작게 그려집니다. 그래서:

- 한 단계에 보이는 노드는 **3–8개**가 좋습니다. 그 단계에 필요 없는 것은 `hide`로 치우세요.
- 일반 상자(`m`)끼리는 **x 또는 y 방향으로 2.4 이상** 띄우세요. 더 가까우면 앞의 상자가 뒤 상자의 글자를 가립니다(검사기가 오류로 잡습니다). 대각선으로 나란히 놓는 것(`[x + d, y − d]`, d ≥ 1.5)은 가려지지 않습니다.
- 영역(zone)은 꼭 필요한 크기로만. 영역이 `w × h`이면 화면 폭을 `w + h` 만큼 씁니다.
- 영역 이름은 **앞쪽 모서리(y가 큰 쪽) 0.5 띠**의 땅에 쓰입니다. 그 띠에는 노드를 세우지 마세요. 뒤쪽에 쓰려면 `labelPos: 'back'`.
- 코드 패널이 있는 단계는 장면 자리가 절반으로 줍니다. 그 단계에는 노드 2–4개만 보이게 하세요(프레임 폭 640 이하).

검사기가 겹침·프레임 크기를 계산해서 알려 주니, 경고가 사라질 때까지 좌표를 조정하고 **컨택트 시트를 눈으로 확인**하세요.

## scene

```js
scene: {
  zones: {
    vpc: { at: [2, -2], size: [6, 4], label: 'VPC 10.0.0.0/16', color: 'purple' },   // 점선 영역. style: 'solid' 가능
  },
  nodes: {
    web:   { at: [3, 0], label: '웹 서버', sub: 'EC2', icon: 'server', color: 'blue' },      // kind 기본값 'box'
    db:    { kind: 'cyl', at: [6, 0], label: 'DB', icon: 'database', color: 'purple' },
    user:  { kind: 'client', at: [0, 3], label: '사용자' },                                   // 노트북
    crowd: { kind: 'users', at: [0, 3], label: '고객들' },                                    // 사람들
    tf:    { kind: 'tile', at: [1, 1], label: 'main.tf', icon: 'file-code', color: 'olive' }, // 납작한 판 (파일, 작은 것)
    pod1:  { at: [4, 1], size: 's', label: 'Pod', icon: 'box', color: 'teal' },               // size: 's' | 'm' | 'l'
  },
  edges: {
    e1: { from: 'user', to: 'web' },                                  // 화살표 (실선)
    e2: { from: 'web', to: 'db', style: 'dashed', label: '3306' },   // 점선 + 가운데 이름표
    e3: { from: 'a', to: 'b', bi: true, tone: 'bad' },                // 양방향. tone: mute | bad | ok | accent
    e4: { from: 'a', to: 'b', via: [[3, 2]], arrow: false, off: true }, // 꺾이는 점, 화살촉 없음, 처음엔 숨김
  },
}
```

| 노드 kind | 생김새 | 이름이 놓이는 곳 |
| --- | --- | --- |
| `box` (기본) | 아이소메트릭 상자 | 상자 안: 아이콘 + `label`(최대 2줄, `\n`) + `sub`(작은 한 줄) |
| `cyl` | 원통 (DB, 버킷, 큐, 레지스트리) | 아래 알약 이름표 |
| `client` | 받침대 위 노트북 (사람 한 명, 개발자) | 아래 알약 이름표 |
| `users` | 받침대 위 여러 사람 (사용자 무리) | 아래 알약 이름표 |
| `tile` | 납작한 판 + 아이콘 (파일, 설정, 작은 부품) | 아래 알약 이름표 |

- **상자 안 글자 폭**: 한글 1, 영문·숫자 0.6으로 셉니다. 한 줄에 `s` 5.6, `m` 6.3, `l` 7.2까지. 길면 `\n`으로 두 줄, 또는 `sub`로 내리세요. 예: `label: 'Load\nBalancer'`, `label: 'NAT', sub: 'Gateway'`.
- **색**: `sand green blue purple yellow orange red teal gray olive slate navy`. 클라우드 사업자는 `aws`(주황) `azure`(파랑) `gcp`(빨강) `ncp`(초록)로 통일합니다.
- **아이콘**: `src/engine/icons.js`의 `ICONS` 키만 쓸 수 있습니다(예: `server database globe cloud shield lock key network router split zap box container layers helm git rocket hammer flask file-code terminal activity coins …`). 목록에 없는 이름은 검사기가 오류로 잡습니다.
- `tile`을 `z: 0, 16, 32`로 같은 자리에 쌓으면 레이어 탑이 됩니다. 쌓을 때는 `label` 없이, 이름은 `pos: 'right'` 태그로 붙이세요.
- 화살표는 **양 끝 노드가 모두 보일 때** 자동으로 나타납니다. 따로 숨기려면 `hide: ['e1']`, 다시 보이려면 `show: ['e1']`.

## steps

단계 전환은 자동으로 연출됩니다: 사라지는 것이 먼저 빠지고, 옮겨진 노드가 미끄러지고, 새 노드가 `show` 순서대로 하나씩 떨어져 내려오고, 양 끝이 도착한 화살표가 그려지고, 태그가 붙은 뒤, 패킷이 흐르기 시작합니다. 그래서 **`show` 배열의 순서가 등장 순서**입니다. 이야기 순서대로 적으세요.

단계는 **누적**됩니다. `show`·`hide`·`set`·`metrics`는 이전 단계들 위에 쌓이고, `tags`·`flows`·`panel`·`code`·`focus`는 **그 단계에만** 나타납니다.

```js
{
  key: '서브넷',                       // 타임라인 이름. 한글 8자 이내
  kind: 'problem',                     // problem(문제) solution(해결) concept(개념) case(사례) compare(비교) recap(정리)
  title: '서버를 인터넷에 그대로 내놓으면',   // 한글 26자 이내
  body: [                              // 2문단(최대 3). 문단마다 1–3문장. <b> <code> <em> 사용 가능
    '첫 문단…',
    '둘째 문단…',
  ],
  callout: { type: 'key', text: '…' },  // (선택) key(핵심) warn(주의) tip(팁) cloud(클라우드별로)
  changes: [['+', '프라이빗 서브넷 추가'], ['~', '공격 표면 3 → 1'], ['-', 'DB의 공인 IP']],  // (선택) 달라진 점, 최대 4줄

  show: ['vpc', 'web'],                // 노드·영역 등장 (화살표 id도 가능)
  hide: ['old'],
  set: {                               // 노드·영역·화살표의 속성 바꾸기 (누적)
    web: { state: 'hot', badge: 'CPU 97%', tone: 'bad' },   // state: 'down' | 'hot' | 'dim' | 'ok' | null
    db:  { label: 'DB (대기)', color: 'gray' },              // label · sub · icon · color 변경 → 이전 모습에서 부드럽게 바뀜
    lb:  { at: [3, 1] },                                      // 위치 변경 → 노드가 미끄러져 이동하고 화살표가 따라감 (kind · size는 불가)
    e2:  { style: 'dashed', tone: 'bad', label: '차단' },
    vpc: { label: '새 이름' },
  },
  focus: ['web'],                      // 주목할 노드에 퍼지는 고리
  tags: [                              // 그 단계에만 붙는 이름표
    { on: 'web', text: '공인 IP 노출', tone: 'bad', icon: 'unlock' },          // pos: 'top'(기본) | 'bottom' | 'left' | 'right'
    { at: [4, 2], text: '10.0.1.0/24', dx: 0, dy: -10 },                       // 땅 위 좌표에. dx/dy로 미세 조정(px)
  ],
  flows: [                             // 움직이는 패킷. 경로는 노드 id 또는 [x, y]
    { path: ['user', 'web', 'db'], kind: 'req', n: 3 },
    { path: ['db', 'web', 'user'], kind: 'res', n: 3, delay: 1.6 },            // delay(초) 뒤에 출발. gap, dur도 지정 가능
  ],
  metrics: { cost: '12만 원', err: ['3%', 'bad'] },   // 값 또는 [값, 'ok' | 'bad' | 'warn']
  panel: { title: '네 클라우드의 이름', icon: 'cloud', rows: [['AWS', 'VPC', 'aws'], ['Azure', 'VNet', 'azure'], ['GCP', 'VPC (글로벌)', 'gcp'], ['NCP', 'VPC', 'ncp']] },
  code: { ref: 'main', hl: [3, 4, 5] },               // codes의 코드를 보여 주고 3–5행 강조. 또는 { title, lang, text, hl } 직접
}
```

- 패킷 `kind`: `req`(요청) `res`(응답) `data`(데이터) `ctrl`(제어·헬스 체크·API) `sync`(복제) `build`(빌드·아티팩트, 네모) `bad`(실패·차단, ×).
- 패킷이 지나는 두 노드 사이에는 화살표(edge)를 두세요. 없으면 패킷이 허공을 날아갑니다(검사기 경고).
- 태그·배지·패널 행의 `tone`: `ok warn bad info accent mute aws azure gcp ncp`.
- `panel` 행은 `[왼쪽, 오른쪽, tone]`, 최대 6행. 4대 클라우드 비교는 위 예시처럼 사업자 tone을 쓰세요.
- 코드 `lang`: `hcl yaml dockerfile sh json text`. 22행·46열 이내. `sh`에서 명령 줄은 `$ `로 시작.
- 첫 단계는 반드시 노드를 하나 이상 `show` 해야 합니다.

## 심화 레슨 (앞으로 배울 챕터: 06–11)

`curriculum.js`에서 `phase: 'next'`인 챕터의 레슨은 더 깊게 씁니다. 검사기가 아래를 경고로 알려 줍니다.

- **단계 12–15개.** 개념을 더 잘게 나눠 한 단계에 한 가지만. 사례(case) 2개 이상, 클라우드 비교(compare) 1개 이상.
- **모든 단계(정리 제외)에 `more`.** 단계 카드의 짧은 설명 아래 "더 알아보기" 버튼이 생기고, 넓은 화면에서는 무대 위 패널로, 휴대폰에서는 카드 안에 펼쳐집니다(`D` 키).
- **퀴즈 10–15문제**, 문제마다 `step`(정답을 가르치는 단계 번호). 연습 화면에서 "n단계에서 다시 보기"로 이어집니다. 정답 위치(0–3)를 고르게 섞으세요.

```js
{
  key: '…', kind: 'concept', title: '…', body: ['…', '…'],
  more: [                                   // 2–4개 섹션, 섹션마다 title + (body | list | rows | code) 중 하나 이상
    { title: '동작 원리', body: ['단계 본문보다 한 단계 더 깊은 설명…', '…'] },
    { title: '직접 해보기', body: ['무엇을 확인하는지 한 줄'], code: { title: 'terminal', lang: 'sh', text: '$ docker inspect web\n…' } },
    { title: '클라우드별로', rows: [['AWS', 'ECR · ECS', 'aws'], ['Azure', 'ACR · AKS', 'azure'], ['GCP', 'Artifact Registry', 'gcp'], ['NCP', 'Container Registry', 'ncp']] },
    { title: '흔한 실수', list: ['…', '…'] },
  ],
}
```

- `more`의 글은 단계 본문을 **반복하지 말고 그다음을 설명**합니다: 왜 그렇게 동작하는지, 실제 명령·설정·출력, 기본값과 한도, 실무 판단 기준, 흔한 실수와 증상·해결.
- 섹션 제목 예: 동작 원리 · 직접 해보기 · 출력 읽기 · 설정 예시 · 클라우드별로 · 흔한 실수 · 실무 팁 · 더 생각해 볼 것.
- 분량은 단계당 500–1400자(코드 제외). 코드는 60열 · 30행 이내. `body`·`list`에는 `<b>`, `<code>` 사용 가능.
- 퀴즈는 개념 확인보다 **상황 판단**("이런 증상이면 무엇을 먼저 확인할까?", "이 요구라면 어떤 전략?")을 절반 이상으로.

## 이야기 짜기

참고한 코스처럼 **문제 → 해결을 한 조각씩** 쌓습니다.

1. 구체적인 상황과 **문제**로 시작합니다(같은 쇼핑몰 `shop.example`을 계속 써도 좋습니다).
2. 한 단계에 **개념 하나**. 장면에 새로 등장하는 것도 한두 개.
3. 중간에 **사례(case)** 를 최소 하나: 실제로 흔한 실수·장애와 그 원인.
4. 관련이 있으면 **4대 클라우드 비교(compare)** 단계 하나: 같은 개념의 AWS · Azure · GCP · NCP 이름과 차이.
5. 마지막은 **정리(recap)**: 핵심 3–4가지와 다음 레슨으로의 연결.

`metrics`의 숫자가 단계마다 변하면서 이야기를 받쳐 주도록 하세요(예: 지연 시간, 비용, 가용성, 복구 시간).

## 글쓰기

- 한국어, "~합니다 / ~해요"체. 한 단계 본문(콜아웃 포함)은 **450자 이내**.
- 기술 용어는 현업에서 쓰는 영어 그대로(VPC, Pod, state), 처음 나올 때 `<b>`로 강조하고 한 구절로 풀이합니다.
- 명령어·리소스 이름·값은 `<code>`.
- 사실만 씁니다. 서비스 이름·기본값·한도가 확실하지 않으면 일반적인 표현으로 쓰세요. 특히 NCP는 실제 서비스 이름(Server, VPC, Load Balancer, NKS, Object Storage, Cloud DB, Container Registry, Sub Account, Cloud Insight, Global DNS, IPsec VPN, Cloud Connect, SourcePipeline …)만 쓰세요.
- 퀴즈는 암기보다 **판단**을 묻습니다. 보기 4개는 모두 그럴듯하게, `why`에는 정답 이유와 흔한 오답의 이유를 씁니다.

## 끝내기 전에

1. `npm run check -- <id>` → 오류 0. 경고도 가능한 한 0 (남기려면 이유가 있어야 합니다).
2. `npm run sheet -- <id>` → PNG를 열어 **모든 단계**를 확인: 글자가 가려지지 않는지, 태그가 겹치지 않는지, 패킷 경로가 화살표 위에 있는지, 장면이 본문과 같은 이야기를 하는지.
