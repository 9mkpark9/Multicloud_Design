export default {
  id: 'rolling-update',
  learn: [
    '한꺼번에 교체하면 왜 중단이 생기는가, ReplicaSet 두 개로 바꾸는 원리',
    'maxSurge · maxUnavailable로 교체 속도 정하기',
    'readiness · liveness · startup 프로브의 차이와 재시작 루프',
    '종료 신호, graceful shutdown, PodDisruptionBudget',
    'rollout status · undo로 확인하고 되돌리기',
  ],
  legend: [['req', '요청'], ['res', '응답'], ['bad', '실패 (5xx)'], ['ctrl', '제어 · 프로브']],
  metrics: [
    { id: 'ready', label: 'Ready Pod', icon: 'circle-check' },
    { id: 'err', label: '5xx 비율', icon: 'warn' },
    { id: 'ver', label: '떠 있는 버전', icon: 'tag' },
    { id: 'rst', label: '재시작 횟수', icon: 'refresh' },
  ],
  scene: {
    nodes: {
      users: { kind: 'users', at: [-0.9, 3.0], label: '사용자' },
      svc: { at: [1.6, 1.8], label: 'Service', sub: 'api', icon: 'split', color: 'purple' },
      p1: { at: [2.4, -0.4], size: 's', label: 'v1', icon: 'box', color: 'blue' },
      p2: { at: [3.7, -0.4], size: 's', label: 'v1', icon: 'box', color: 'blue' },
      p3: { at: [5.0, -0.4], size: 's', label: 'v1', icon: 'box', color: 'blue' },
      p4: { at: [6.3, -0.4], size: 's', label: 'v2', icon: 'box', color: 'green' },
      dep: { at: [4.4, -3.0], label: 'Deployment', sub: 'api', icon: 'layers', color: 'teal' },
      rs1: { kind: 'tile', at: [2.0, -3.0], label: 'RS v1 · 3', icon: 'copy', color: 'blue' },
      rs2: { kind: 'tile', at: [6.8, -3.0], label: 'RS v2 · 0', icon: 'copy', color: 'green' },
      kl: { kind: 'tile', at: [6.3, -2.9], label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
    },
    edges: {
      e_u: { from: 'users', to: 'svc' },
      e_s1: { from: 'svc', to: 'p1' },
      e_s2: { from: 'svc', to: 'p2' },
      e_s3: { from: 'svc', to: 'p3' },
      e_s4: { from: 'svc', to: 'p4' },
      e_d: { from: 'dep', to: 'p4', style: 'dashed' },
      e_r1: { from: 'dep', to: 'rs1', style: 'dashed' },
      e_r2: { from: 'dep', to: 'rs2', style: 'dashed' },
      e_k: { from: 'kl', to: 'p4', style: 'dashed' },
    },
  },
  steps: [
    // 1
    {
      key: '한꺼번에', kind: 'problem', title: '전부 내리고 새로 띄우면 생기는 일',
      body: [
        'shop.example의 api를 v1에서 v2로 올려야 합니다. 가장 단순한 방법은 기존 Pod를 모두 내리고 새 버전을 띄우는 것입니다(Deployment의 <code>Recreate</code> 전략).',
        '문제는 그 사이입니다. v1은 이미 없고 v2는 아직 뜨는 중이라 Service가 보낼 곳이 없습니다. 이미지를 받고 앱이 기동하는 수십 초 동안 모든 요청이 실패합니다. 하루에도 몇 번씩 배포하는 팀이라면 받아들일 수 없는 일이죠.',
      ],
      callout: { type: 'key', text: '목표는 <b>무중단 배포</b>입니다. 교체하는 동안에도 요청을 받을 Pod가 항상 충분히 남아 있어야 합니다.' },
      show: ['users', 'svc', 'p1', 'p2', 'p3'],
      set: { p1: { state: 'down' }, p2: { state: 'down' }, p3: { state: 'down' } },
      tags: [
        { on: 'p1', text: 'v1 전부 종료', tone: 'bad' },
        { on: 'svc', text: '보낼 곳이 없음', tone: 'bad', pos: 'bottom' },
      ],
      flows: [{ path: ['users', 'svc'], kind: 'req', n: 3 }, { path: ['svc', 'p2'], kind: 'bad', n: 2, delay: 0.8 }],
      metrics: { ready: ['0 / 3', 'bad'], err: ['100%', 'bad'], ver: 'v1 → v2', rst: '0' },
      more: [
        { title: '동작 원리', body: [
          '<code>strategy.type: Recreate</code>는 옛 ReplicaSet을 0개로 줄이고, 그 Pod들이 <b>모두 종료된 뒤에야</b> 새 ReplicaSet을 늘립니다. 두 버전이 동시에 떠 있는 순간이 없다는 것이 이 전략의 유일한 장점입니다.',
          '빈 시간은 "옛 Pod 종료 대기 + 이미지 pull + 앱 기동 + readiness 통과"의 합입니다. 이미지가 크고 앱이 무겁다면 1분을 쉽게 넘깁니다.',
        ] },
        { title: '실무 판단', list: [
          'Recreate가 맞는 경우도 있습니다. 두 버전이 같은 DB 스키마를 동시에 쓰면 안 되거나, 한 번에 하나만 떠 있어야 하는 앱(파일 잠금, 단일 소비자)이라면 중단을 감수하고 Recreate를 씁니다.',
          '그 밖의 대부분의 무상태 웹 서비스는 RollingUpdate가 기본입니다. Deployment에 아무것도 적지 않으면 RollingUpdate로 동작합니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get deploy api \\
    -o jsonpath='{.spec.strategy}'
{"rollingUpdate":{"maxSurge":"25%",
 "maxUnavailable":"25%"},"type":"RollingUpdate"}` } },
      ],
    },
    // 2
    {
      key: '롤링 업데이트', kind: 'solution', title: '롤링 업데이트: 조금씩 바꿉니다',
      body: [
        '<b>롤링 업데이트</b>는 Deployment의 기본 전략입니다. 이미지 태그를 바꿔 적용하면 Deployment가 새 Pod를 조금 늘리고 옛 Pod를 조금 줄이기를 되풀이합니다.',
        '속도는 두 값으로 정합니다. <code>maxSurge</code>는 원하는 개수보다 몇 개까지 더 띄워도 되는지, <code>maxUnavailable</code>은 몇 개까지 모자라도 되는지입니다. 둘 다 기본값은 25%입니다.',
      ],
      callout: { type: 'tip', text: '<code>maxSurge: 1</code>, <code>maxUnavailable: 0</code>이면 용량이 줄지 않는 대신 여분 자리가 필요합니다. 반대로 surge 0, unavailable 1이면 자리는 안 늘지만 교체 중 용량이 줄어요.' },
      hide: ['users', 'svc'],
      show: ['dep'],
      set: { p1: { state: null }, p2: { state: null }, p3: { state: null } },
      tags: [{ on: 'dep', text: 'image 1.4 → 2.0', tone: 'accent', icon: 'pencil' }],
      code: {
        title: 'api-deployment.yaml', lang: 'yaml', hl: [7, 8, 9, 10, 11],
        text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # 최대 3 + 1개
      maxUnavailable: 0    # Ready는 늘 3개
  # selector · labels 생략
  template:
    spec:
      containers:
        - name: api
          image: shop/api:2.0   # 1.4 → 2.0
`,
      },
      metrics: { ready: ['3 / 3', 'ok'], err: ['0%', 'ok'], ver: 'v1 ×3' },
      more: [
        { title: '퍼센트 계산', body: [
          '퍼센트로 적으면 개수로 바꿔 씁니다. <code>maxSurge</code>는 <b>올림</b>, <code>maxUnavailable</code>은 <b>내림</b>입니다. 그래서 replicas 3에 기본값 25%면 surge 1, unavailable 0이 되어 "하나 더 띄우고 하나 내리기"가 됩니다. 둘을 동시에 0으로 둘 수는 없습니다. 아무것도 움직일 수 없으니까요.',
        ] },
        { title: '값 고르기', rows: [
          ['replicas 10 · 기본 25%', 'surge 3 · unavailable 2', 'info'],
          ['surge 1 · unavail 0', '가장 안전, 가장 느림', 'ok'],
          ['surge 100% · unavail 0', '한 번에 두 배로 띄움, 빠름', 'warn'],
          ['surge 0 · unavail 1', '여분 자리 없을 때', 'warn'],
        ] },
        { title: '직접 해보기', body: ['매니페스트를 고치지 않고 이미지만 바꾸는 방법입니다. 실무에서는 Git의 매니페스트를 고쳐 배포하는 것이 원칙이에요.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl set image deploy/api api=shop/api:2.0
deployment.apps/api image updated
$ kubectl rollout status deploy/api
Waiting for deployment "api" rollout to finish:
1 out of 3 new replicas have been updated...
deployment "api" successfully rolled out` } },
      ],
    },
    // 3
    {
      key: 'ReplicaSet', kind: 'concept', title: '속에서는 ReplicaSet 두 개가 움직입니다',
      body: [
        'Pod 템플릿이 바뀌면 Deployment는 템플릿의 해시로 이름 붙인 <b>새 ReplicaSet</b>을 만듭니다. 롤링 업데이트는 결국 새 ReplicaSet의 개수를 0 → 3으로 올리고, 옛 ReplicaSet을 3 → 0으로 내리는 일입니다.',
        '옛 ReplicaSet은 0개가 되어도 지워지지 않고 남습니다. 이것이 나중에 한 줄로 되돌릴 수 있는 비결입니다.',
      ],
      callout: { type: 'key', text: 'replicas만 바꾸면 새 ReplicaSet은 생기지 않습니다. <b>Pod 템플릿</b>(이미지, 환경 변수, 라벨 …)이 바뀔 때만 롤아웃이 일어나요.' },
      hide: ['e_d'],
      show: ['rs1', 'rs2', 'p4'],
      set: { p4: { badge: '새 RS', tone: 'ok' }, rs2: { label: 'RS v2 · 1' } },
      focus: ['rs2'],
      tags: [{ on: 'p1', text: '옛 RS 소속', pos: 'bottom' }],
      flows: [{ path: ['dep', 'rs2'], kind: 'ctrl', n: 2 }, { path: ['dep', 'rs1'], kind: 'ctrl', delay: 1.0 }],
      metrics: { ver: 'v1 ×3 · v2 ×1' },
      changes: [['+', 'ReplicaSet v2 (새 템플릿)'], ['~', 'RS v2: 0 → 1 (surge)'], ['~', 'RS v1은 아직 3']],
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get rs -l app=api
NAME             DESIRED  CURRENT  READY  AGE
api-6f8d4c9b7    3        3        3      12d
api-7c5b8d6f4    1        1        0      9s

$ kubectl get pod -l app=api --show-labels
NAME                  READY  LABELS
api-7c5b8d6f4-q2w8x   0/1    app=api,
                             pod-template-hash=7c5b8d6f4` } },
        { title: '동작 원리', body: [
          'ReplicaSet 이름의 꼬리(<code>7c5b8d6f4</code>)가 템플릿 해시이고, 같은 값이 Pod의 <code>pod-template-hash</code> 라벨로 붙습니다. 덕분에 두 ReplicaSet이 같은 <code>app=api</code> 라벨을 쓰면서도 서로의 Pod를 헷갈리지 않습니다. Service는 이 해시 라벨을 보지 않으므로 두 버전 Pod 모두에게 트래픽을 보냅니다.',
          'Deployment 컨트롤러는 "새 RS를 surge만큼 늘린다 → 새 Pod가 Available이 되면 옛 RS를 줄인다"를 반복합니다. 이 판단을 다음 단계에서 따라가 봅니다.',
        ] },
        { title: '흔한 실수', list: [
          'ReplicaSet을 직접 고치지 마세요. Deployment가 곧바로 자기가 원하는 값으로 되돌립니다.',
          'ConfigMap 내용만 바꾸면 템플릿은 그대로라 롤아웃이 일어나지 않습니다. 템플릿에 설정 해시 주석을 넣거나 <code>kubectl rollout restart</code>로 다시 띄웁니다.',
        ] },
      ],
    },
    // 4
    {
      key: '조금씩 교체', kind: 'concept', title: '하나 띄우고, Ready면 하나 내립니다',
      body: [
        '<code>maxSurge: 1</code>, <code>maxUnavailable: 0</code>으로 따라가 봅시다. ① v2 Pod 하나가 추가로 뜹니다(3 + 1개). ② 그 Pod가 <b>Ready</b>가 되면 Service의 대상에 들어갑니다. ③ 그제야 v1 하나를 종료합니다. v1이 모두 사라질 때까지 반복합니다.',
        '교체 중에는 v1과 v2가 <b>동시에</b> 요청을 받습니다. 그래서 두 버전은 서로 호환되어야 합니다. v2가 DB 컬럼을 지워 버리면 아직 남은 v1이 깨집니다.',
      ],
      callout: { type: 'key', text: '모든 것이 "새 Pod가 Ready가 되면"에 걸려 있습니다. 그런데 Ready는 누가, 무엇을 보고 판단할까요?' },
      show: ['users', 'svc', 'e_d'],
      hide: ['e_s1', 'rs1', 'rs2'],
      set: { p1: { state: 'dim', badge: '종료 중', tone: 'mute' }, p4: { state: 'ok', badge: null } },
      focus: ['p4'],
      tags: [{ on: 'p4', text: 'Ready → 트래픽 받음', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['dep', 'p4'], kind: 'ctrl' },
        { path: ['users', 'svc'], kind: 'req', n: 3, delay: 0.6 },
        { path: ['svc', 'p2'], kind: 'req', delay: 1.4 }, { path: ['svc', 'p3'], kind: 'req', delay: 1.7 }, { path: ['svc', 'p4'], kind: 'req', delay: 2.0 },
      ],
      metrics: { ver: 'v1 ×2 · v2 ×1' },
      changes: [['+', 'v2 Pod 1개 (surge)'], ['-', 'v1 Pod 1개 종료'], ['~', 'Ready는 계속 3개']],
      more: [
        { title: '동작 원리', body: [
          '정확히는 Ready가 아니라 <b>Available</b>을 기다립니다. Available은 "Ready 상태가 <code>minReadySeconds</code> 동안 이어졌다"는 뜻이고, 기본값 0이면 Ready와 같습니다. 이 값을 10초쯤 주면 뜨자마자 죽는 Pod를 성공으로 세지 않아 롤아웃이 더 신중해집니다.',
          '진행 중에는 <code>kubectl rollout pause</code>로 멈추고 <code>resume</code>으로 이어 갈 수 있습니다. 첫 Pod만 바꾼 상태에서 지표를 지켜보는 간단한 카나리처럼 쓰기도 해요.',
        ] },
        { title: '호환성 지키기', list: [
          'DB 스키마는 <b>확장 → 전환 → 축소</b> 순서로 나눠 배포합니다. ① 새 컬럼을 추가(옛 코드는 무시) ② 새 코드 배포 ③ 옛 컬럼은 다음 배포에서 삭제.',
          'API 응답 필드도 마찬가지입니다. 필드를 지우거나 의미를 바꾸면, 교체 중 v1과 v2를 오가는 클라이언트가 깨집니다.',
          '세션을 Pod 메모리에 두면 Pod가 바뀔 때 로그인이 풀립니다. 세션은 Redis 같은 외부 저장소로 옮기세요.',
        ] },
      ],
    },
    // 5
    {
      key: '프로브 없음', kind: 'case', title: '사례: 준비 안 된 Pod로 간 트래픽',
      body: [
        '이 팀의 Deployment에는 <b>readiness 프로브</b>가 없었습니다. 프로브가 없으면 쿠버네티스는 컨테이너 프로세스가 시작된 순간 Pod를 Ready로 칩니다. 하지만 v2는 설정을 읽고 DB 연결을 맺는 데 20초가 걸립니다.',
        '그 20초 동안 Service는 아직 포트도 열지 않은 Pod로 요청을 보내고, 사용자는 502 · 503을 받습니다. 롤아웃도 "Ready니까" 곧바로 다음 v1을 내려서, 몇 초 만에 준비된 Pod가 하나도 남지 않습니다.',
      ],
      callout: { type: 'warn', text: '<code>kubectl get pod</code>는 전부 Running · 1/1이라고 말합니다. 프로브 없는 Ready는 "프로세스가 떴다"일 뿐입니다.' },
      hide: ['p1', 'dep'],
      set: {
        p2: { label: 'v2', color: 'green', state: 'hot', badge: '기동 중', tone: 'warn' },
        p3: { label: 'v2', color: 'green', state: 'hot', badge: '기동 중', tone: 'warn' },
        p4: { state: 'hot', badge: '기동 중', tone: 'warn' },
      },
      tags: [{ on: 'svc', text: '셋 다 Ready로 보임', tone: 'bad', icon: 'eye', pos: 'bottom' }],
      flows: [
        { path: ['users', 'svc'], kind: 'req', n: 3 },
        { path: ['svc', 'p2'], kind: 'bad', delay: 0.9 }, { path: ['svc', 'p3'], kind: 'bad', delay: 1.2 }, { path: ['svc', 'p4'], kind: 'bad', delay: 1.5 },
      ],
      metrics: { ready: ['3 / 3 ?', 'warn'], err: ['100%', 'bad'], ver: 'v2 ×3 (기동 중)' },
      changes: [['-', 'v1 Pod가 몇 초 만에 모두 종료'], ['~', 'v2 3개: Ready지만 기동 중'], ['-', '20초 동안 요청이 5xx']],
      more: [
        { title: '증상 → 원인', list: [
          '증상: 배포할 때만 20–30초 동안 5xx가 치솟고, 평소에는 멀쩡합니다. 롤아웃은 유난히 빨리 끝납니다.',
          '원인: readiness 프로브가 없어 "컨테이너 시작 = Ready"로 처리됐습니다. 엔드포인트에 너무 일찍 들어가고, 롤아웃도 옛 Pod를 너무 일찍 내립니다.',
        ] },
        { title: '직접 확인', body: ['프로브가 설정돼 있는지, 엔드포인트에 언제 들어갔는지 봅니다.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl get deploy api -o yaml | grep -c Probe
0
$ kubectl get endpointslice -l \\
    kubernetes.io/service-name=api -o wide
NAME        ADDRESSTYPE  PORTS  ENDPOINTS
api-x7k2p   IPv4         8080   10.0.1.23,10.0.2.41,...` } },
        { title: '흔한 실수', list: [
          '"헬스 체크는 로드 밸런서가 하니까"라며 프로브를 생략하는 경우가 많습니다. 클러스터 안 Service 트래픽과 롤아웃 판단은 Pod의 readiness만 봅니다.',
          '포트만 열리면 성공하는 <code>tcpSocket</code> 프로브는, 포트를 먼저 열고 초기화를 나중에 하는 프레임워크에서는 같은 사고를 막지 못합니다.',
        ] },
      ],
    },
    // 6
    {
      key: 'readiness', kind: 'solution', title: 'readiness: 준비됐을 때만 받습니다',
      body: [
        '<b>readiness 프로브</b>는 "지금 요청을 받을 수 있는가"를 묻는 검사입니다. 노드의 kubelet이 주기적으로 <code>/ready</code>를 호출하고, 통과한 Pod만 Service의 엔드포인트에 올라갑니다. 실패하면 재시작하지 않고 대상에서만 뺍니다.',
        '롤아웃도 이 신호를 기다립니다. v2가 진짜로 준비될 때까지 v1은 내려가지 않으니, 앞의 사고가 구조적으로 막힙니다.',
      ],
      callout: { type: 'tip', text: '<code>/ready</code>는 앱이 실제로 일할 준비가 됐을 때만 200을 돌려줘야 합니다. 초기화가 끝났는지, 꼭 필요한 연결이 맺어졌는지 확인하세요.' },
      hide: ['users', 'p2'],
      set: {
        p3: { label: 'v1', color: 'blue', state: null, badge: null },
        p4: { state: null, badge: '0/1', tone: 'warn' },
        e_s4: { style: 'dashed', tone: 'mute' },
      },
      focus: ['p4'],
      tags: [{ on: 'p4', text: '통과 전엔 트래픽 없음', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['svc', 'p3'], kind: 'req', n: 3 }],
      code: {
        title: 'readinessProbe', lang: 'yaml', hl: [6, 7, 8, 9, 10, 11],
        text: `containers:
  - name: api
    image: shop/api:2.0
    ports:
      - containerPort: 8080
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      periodSeconds: 5       # 5초마다 검사
      failureThreshold: 3    # 3번 실패 → 제외
`,
      },
      metrics: { ready: ['3 / 4', 'ok'], err: ['0%', 'ok'], ver: 'v1 ×3 · v2 준비 중' },
      changes: [['+', 'readinessProbe 추가'], ['~', '준비 전 Pod는 엔드포인트에서 제외'], ['~', '5xx 100% → 0%']],
      more: [
        { title: '프로브 공통 설정', rows: [
          ['initialDelaySeconds', '첫 검사까지 대기 · 기본 0', 'info'],
          ['periodSeconds', '검사 간격 · 기본 10', 'info'],
          ['timeoutSeconds', '응답 대기 · 기본 1', 'info'],
          ['failureThreshold', '연속 실패 몇 번에 판정 · 기본 3', 'info'],
          ['successThreshold', '연속 성공 몇 번에 복귀 · 기본 1', 'info'],
        ] },
        { title: '동작 원리', body: [
          '검사 방법은 <code>httpGet</code>(200–399면 성공), <code>tcpSocket</code>, <code>exec</code>(종료 코드 0이면 성공), <code>grpc</code> 네 가지입니다. kubelet이 노드에서 Pod IP로 직접 호출하므로 Service나 Ingress를 거치지 않아요.',
          'readiness는 기동 때만이 아니라 <b>계속</b> 돕니다. 실행 중에 과부하로 응답이 느려지면 잠시 엔드포인트에서 빠졌다가 회복하면 돌아옵니다. 그래서 모든 Pod가 동시에 실패하면 Service에 대상이 하나도 없게 되니, 검사 기준을 너무 예민하게 잡지 마세요.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl describe pod api-7c5b8d6f4-q2w8x
Events:
  Warning  Unhealthy  Readiness probe failed:
           HTTP probe failed with statuscode: 503` } },
      ],
    },
    // 7
    {
      key: '프로브 3종', kind: 'concept', title: 'liveness와 startup은 다른 질문입니다',
      body: [
        '프로브는 세 가지이고, 실패했을 때 일어나는 일이 다릅니다. <b>liveness</b>는 "살아 있는가"를 묻고, 실패하면 kubelet이 컨테이너를 <b>재시작</b>합니다. 교착 상태처럼 재시작해야만 풀리는 고장을 위한 것입니다.',
        '<b>startup</b>은 기동이 느린 앱을 위한 것입니다. 이 프로브가 통과할 때까지 나머지 둘은 시작하지 않아서, 기동 중인 앱을 liveness가 죽이는 일을 막습니다.',
      ],
      callout: { type: 'warn', text: 'liveness에 DB 같은 외부 의존성 검사를 넣지 마세요. DB가 잠깐 느려지면 멀쩡한 Pod가 전부 재시작되어 장애가 커집니다.' },
      show: ['p2', 'kl'],
      set: { p2: { label: 'v1', color: 'blue', state: null, badge: null }, p4: { badge: null } },
      focus: ['p4'],
      tags: [{ on: 'kl', text: '주기적으로 검사', icon: 'repeat' }],
      flows: [{ path: ['kl', 'p4'], kind: 'ctrl', n: 3, gap: 0.6 }],
      panel: { title: '실패하면 무슨 일이?', icon: 'heart-pulse', rows: [['startup', '통과 전까지 나머지 보류', 'info'], ['readiness', '트래픽에서 제외', 'ok'], ['liveness', '컨테이너 재시작', 'bad']] },
      more: [
        { title: '설정 예시', body: ['세 프로브를 함께 쓰는 흔한 모양입니다. 엔드포인트를 나눠 각자 다른 질문에 답하게 합니다.'], code: { title: 'api 컨테이너', lang: 'yaml', text: `startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  periodSeconds: 5
  failureThreshold: 24     # 최대 120초 기동 허용
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  periodSeconds: 10
  failureThreshold: 3      # 30초 응답 없으면 재시작
readinessProbe:
  httpGet: { path: /ready, port: 8080 }
  periodSeconds: 5` } },
        { title: '엔드포인트 나누기', list: [
          '<code>/healthz</code>(liveness · startup): 프로세스가 요청을 처리할 수 있는지만. 외부 호출 없이 즉시 200을 돌려줍니다.',
          '<code>/ready</code>(readiness): 초기화 완료, 꼭 필요한 연결, 종료 중이 아닌지까지 봅니다. 종료가 시작되면 일부러 503을 돌려주기도 합니다.',
          'liveness가 꼭 필요한지부터 생각해 보세요. 고장 나면 스스로 종료하는 앱이라면 kubelet이 어차피 재시작하므로 liveness가 없어도 됩니다.',
        ] },
      ],
    },
    // 8
    {
      key: '재시작 루프', kind: 'case', title: '사례: 뜨기도 전에 죽이는 liveness',
      body: [
        '다른 팀의 JVM 서비스는 기동에 60초가 걸립니다. 그런데 liveness가 10초 뒤부터 10초 간격으로 3번 실패하면 재시작하도록 되어 있었습니다. 앱은 40초쯤에 죽고, 다시 처음부터 기동하다 또 죽습니다.',
        '재시작 횟수만 쌓이고 Pod는 <code>CrashLoopBackOff</code>에 빠집니다. 로그에는 에러가 없어서 더 헷갈립니다. 해결은 <b>startupProbe</b>로 기동 시간을 넉넉히 주는 것입니다.',
      ],
      callout: { type: 'tip', text: 'Events에서 <code>failed liveness probe, will be restarted</code>를 찾으세요. 재시작 원인이 앱이 아니라 kubelet이라는 증거입니다.' },
      hide: ['svc', 'p2'],
      set: { p4: { state: 'down', badge: '재시작 5', tone: 'bad' } },
      focus: ['p4'],
      tags: [{ on: 'kl', text: '40초 만에 실패 판정', tone: 'bad', icon: 'x' }],
      flows: [{ path: ['kl', 'p4'], kind: 'bad', n: 3, gap: 0.6 }],
      code: {
        title: 'kubectl describe pod', lang: 'sh', hl: [4, 5, 7],
        text: `Events:
  Normal   Started    Started container api
  Warning  Unhealthy  Liveness probe failed:
    Get "http://10.0.2.41:8080/healthz":
    connect: connection refused
  Normal   Killing    Container api failed
    liveness probe, will be restarted
  Warning  BackOff    Back-off restarting
    failed container
`,
      },
      metrics: { ready: ['3 / 4', 'warn'], rst: ['5', 'bad'], ver: 'v1 ×3 · v2 루프' },
      changes: [['-', 'v2: 기동 40초에 강제 재시작'], ['~', '재시작 0 → 5'], ['+', '해결: startupProbe 추가']],
      more: [
        { title: '동작 원리', body: [
          'liveness의 판정 시간은 대략 <code>initialDelaySeconds + periodSeconds × failureThreshold</code>입니다. 10 + 10 × 3 = 40초 안에 <code>/healthz</code>가 응답하지 않으면 컨테이너가 죽습니다. 기동이 60초인 앱은 영원히 끝까지 뜨지 못해요.',
          '재시작이 반복되면 kubelet은 다음 시도까지의 대기를 10초, 20초, 40초 … 최대 5분까지 늘립니다. 이것이 <code>CrashLoopBackOff</code> 상태입니다.',
        ] },
        { title: '고치는 법', list: [
          '<code>startupProbe</code>의 <code>failureThreshold × periodSeconds</code>를 최악의 기동 시간보다 크게 잡습니다(예: 5초 × 24 = 120초). 통과한 뒤에는 liveness가 평소처럼 빠르게 고장을 잡습니다.',
          '<code>initialDelaySeconds</code>를 크게 늘리는 것도 방법이지만, 기동이 빠를 때도 그만큼 고장 감지가 늦어집니다. startupProbe가 낫습니다.',
          '노드가 바쁘면 기동이 평소보다 느려집니다. 개발 PC에서 잰 시간에 여유를 두세요.',
        ] },
        { title: '구별하기', rows: [
          ['Reason: OOMKilled', '메모리 limit 초과 (지난 레슨)', 'warn'],
          ['Reason: Error · Exit 1', '앱이 스스로 죽음 → 로그 확인', 'warn'],
          ['Killing · failed liveness', 'kubelet이 죽임 → 프로브 확인', 'bad'],
        ] },
      ],
    },
    // 9
    {
      key: '우아한 종료', kind: 'solution', title: '잘 죽는 것도 무중단의 절반입니다',
      body: [
        'Pod가 삭제되면 두 가지가 동시에 시작됩니다. Service 엔드포인트에서 빠지는 것, 그리고 컨테이너가 <code>SIGTERM</code>을 받는 것입니다. <code>terminationGracePeriodSeconds</code>(기본 30초) 안에 끝나지 않으면 <code>SIGKILL</code>로 강제 종료됩니다.',
        '엔드포인트 변경이 모든 노드에 퍼지는 데는 잠깐이 걸려서, 요청이 몇 개 더 옵니다. 그래서 <code>preStop</code>에서 몇 초 기다리고, 앱은 SIGTERM을 받으면 하던 요청을 마친 뒤 종료하게 만듭니다.',
      ],
      callout: { type: 'tip', text: '유예 시간은 preStop을 포함해서 셉니다. preStop 5초 + 요청 마무리 시간이 30초 안에 들어오는지 확인하세요.' },
      show: ['svc'],
      hide: ['kl'],
      set: {
        p3: { state: 'dim', badge: 'SIGTERM', tone: 'warn' },
        p4: { state: 'ok', badge: null },
        e_s3: { style: 'dashed', tone: 'mute' },
        e_s4: { style: null, tone: null },
      },
      tags: [{ on: 'p3', text: '하던 요청은 끝내고 종료', pos: 'bottom', dx: -30 }],
      flows: [{ path: ['svc', 'p4'], kind: 'req', n: 3 }, { path: ['p3', 'svc'], kind: 'res', delay: 0.5 }],
      code: {
        title: 'graceful shutdown', lang: 'yaml', hl: [2, 6, 7, 8, 9],
        text: `spec:
  terminationGracePeriodSeconds: 30
  containers:
    - name: api
      image: shop/api:2.0
      lifecycle:
        preStop:           # SIGTERM 전에 실행
          exec:
            command: ["sleep", "5"]
`,
      },
      metrics: { ready: ['3 / 3', 'ok'], ver: 'v1 종료 중 · v2 ×3', rst: '0' },
      more: [
        { title: '순서대로 보면', list: [
          '① API 서버에 Pod 삭제가 기록되고 상태가 Terminating이 됩니다.',
          '② 동시에: 엔드포인트 컨트롤러가 Pod를 대상에서 빼고(→ 각 노드의 kube-proxy가 반영), kubelet은 preStop을 실행합니다.',
          '③ preStop이 끝나면 컨테이너의 PID 1에 SIGTERM을 보냅니다. 앱은 새 연결을 받지 않고 진행 중인 요청을 마칩니다.',
          '④ 유예 시간이 다 되면 남은 프로세스에 SIGKILL을 보냅니다.',
        ] },
        { title: '흔한 실수', list: [
          'Dockerfile에서 <code>CMD npm start</code>처럼 셸 형식으로 시작하면 PID 1이 셸이 되어 SIGTERM이 앱까지 전달되지 않습니다. 앱은 신호를 못 받은 채 30초를 버티다 SIGKILL로 죽어요. <code>CMD ["node", "server.js"]</code>처럼 exec 형식을 쓰세요.',
          '이미지에 <code>sleep</code> 명령이 없는 최소 이미지(distroless 등)에서는 exec preStop이 실패합니다. 앱 안에서 종료 대기를 구현하거나 다른 방법을 씁니다.',
        ] },
        { title: '출력 읽기', body: ['종료가 깨끗하면 종료 코드 0 또는 143(128 + SIGTERM 15)이 남습니다. 137(SIGKILL)이 보이면 유예 시간 안에 끝내지 못한 것입니다.'] },
      ],
    },
    // 10
    {
      key: 'PDB', kind: 'concept', title: 'PDB: 한꺼번에 빠지지 않게 막기',
      body: [
        '롤아웃은 끝났고 v2가 셋입니다. 그런데 노드 업그레이드로 운영자가 <code>kubectl drain</code>을 돌리면, 그 노드의 Pod들이 한꺼번에 쫓겨날 수 있습니다. 롤아웃의 <code>maxUnavailable</code>은 이런 <b>자발적 중단</b>을 막지 못합니다.',
        '<b>PodDisruptionBudget</b>(PDB)은 "api는 최소 2개가 늘 떠 있어야 한다"를 선언합니다. drain은 이를 지키며 한 번에 하나씩만 내보내고, 나머지는 새 Pod가 Ready가 될 때까지 기다립니다.',
      ],
      callout: { type: 'warn', text: 'PDB는 노드가 갑자기 죽는 것 같은 <b>비자발적</b> 중단은 막지 못합니다. 그건 여러 노드 · AZ에 흩어 두는 것으로 대비합니다.' },
      hide: ['svc'],
      show: ['p2'],
      set: {
        p2: { label: 'v2', color: 'green', state: 'dim', badge: '퇴거 중', tone: 'warn' },
        p3: { label: 'v2', color: 'green', state: null, badge: null },
        p4: { state: null },
        e_s3: { style: null, tone: null },
      },
      tags: [
        { on: 'p4', text: '대기: 최소 2개 유지', tone: 'accent', icon: 'hourglass', pos: 'right' },
      ],
      code: {
        title: 'api-pdb.yaml', lang: 'yaml', hl: [6, 7, 8, 9],
        text: `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api
`,
      },
      metrics: { ready: ['2 / 3', 'warn'], ver: 'v2 ×3' },
      changes: [['+', 'PDB minAvailable 2'], ['~', 'drain: 한 번에 1개씩만 퇴거'], ['~', 'Ready는 2개 아래로 안 내려감']],
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get pdb api
NAME  MIN AVAILABLE  MAX UNAVAILABLE  ALLOWED DISRUPTIONS
api   2              N/A              1

$ kubectl drain node-b --ignore-daemonsets
evicting pod shop/api-7c5b8d6f4-q2w8x
evicting pod shop/api-7c5b8d6f4-z9m1k
error when evicting pods/"api-7c5b8d6f4-z9m1k":
Cannot evict pod as it would violate the pod's
disruption budget.` } },
        { title: '동작 원리', body: [
          'drain과 노드 오토스케일러의 축소, 관리형 서비스의 노드 업그레이드는 모두 <b>Eviction API</b>로 Pod를 내보냅니다. Eviction API는 PDB의 <code>ALLOWED DISRUPTIONS</code>가 0이면 거절하고, drain은 잠시 뒤 다시 시도합니다. 그사이 Deployment가 다른 노드에 새 Pod를 띄워 Ready가 되면 여유가 생겨 다음 Pod를 내보냅니다.',
        ] },
        { title: '흔한 실수', list: [
          '<code>minAvailable</code>을 replicas와 같게(예: 3 중 3) 잡으면 허용 중단이 0이라 drain이 영원히 끝나지 않고, 노드 업그레이드가 멈춥니다.',
          'replicas 1인 Deployment에 PDB를 걸어도 같은 일이 생깁니다. 정말 하나뿐이라면 PDB 대신 짧은 중단을 계획하세요.',
          '비율로 적을 수도 있습니다: <code>maxUnavailable: 25%</code>. Pod 수가 HPA로 바뀌어도 알맞게 따라갑니다.',
        ] },
      ],
    },
    // 11
    {
      key: '멈춘 롤아웃', kind: 'case', title: '사례: 롤아웃이 멈춘 줄 몰랐습니다',
      body: [
        '다음 날 v3를 내보냈는데 설정 오류로 새 Pod가 계속 죽습니다. readiness를 통과하지 못하니 롤아웃은 첫 Pod에서 <b>멈춰 서고</b>, <code>maxUnavailable: 0</code> 덕분에 v2 셋은 그대로 요청을 받습니다.',
        '사용자는 아무것도 모르지만, 팀도 몰랐습니다. CI가 <code>kubectl apply</code>만 하고 성공으로 끝났기 때문입니다. 10분 뒤 Deployment에 <code>ProgressDeadlineExceeded</code>가 찍혔지만 아무도 보지 않았습니다.',
      ],
      callout: { type: 'tip', text: '배포 파이프라인 끝에 <code>kubectl rollout status --timeout</code>을 넣으세요. 롤아웃이 실패하면 0이 아닌 종료 코드로 파이프라인을 실패시킵니다.' },
      show: ['p1'],
      set: {
        p1: { label: 'v3', color: 'red', state: 'down', badge: 'CrashLoop', tone: 'bad' },
        p2: { state: null, badge: null },
      },
      focus: ['p1'],
      tags: [
        { on: 'p1', text: '롤아웃이 여기서 멈춤', tone: 'bad', pos: 'bottom', dx: -20 },
      ],
      code: {
        title: 'rollout status', lang: 'sh', hl: [4, 5, 9],
        text: `$ kubectl rollout status deploy/api \\
    --timeout=5m
Waiting for deployment "api" rollout to
finish: 1 out of 3 new replicas have been
updated...
error: timed out waiting for the condition

$ kubectl get deploy api -o wide | head -2
Progressing False ProgressDeadlineExceeded
`,
      },
      metrics: { ready: ['3 / 3', 'ok'], err: ['0%', 'ok'], ver: 'v2 ×3 · v3 실패', rst: ['7', 'bad'] },
      changes: [['-', 'v3 Pod: 기동 실패 반복'], ['~', '롤아웃 정지, v2 유지'], ['-', 'CI는 성공으로 끝남']],
      more: [
        { title: '동작 원리', body: [
          'Deployment의 <code>progressDeadlineSeconds</code>(기본 600초) 동안 진전이 없으면 상태 조건 <code>Progressing</code>이 <code>False</code>, 이유 <code>ProgressDeadlineExceeded</code>가 됩니다. 쿠버네티스는 이 표시만 할 뿐, <b>자동으로 롤백하지 않습니다</b>. 멈춘 채 그대로 둡니다.',
          '멈춘 상태도 비용이 있습니다. 실패하는 v3 Pod가 자리(requests)를 차지하고, 다음 배포는 이 어정쩡한 상태 위에서 시작합니다.',
        ] },
        { title: '직접 확인', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get deploy api \\
    -o jsonpath='{.status.conditions[*].reason}'
MinimumReplicasAvailable ProgressDeadlineExceeded
$ kubectl logs deploy/api --previous | tail -2
Error: missing required env DB_URL` } },
        { title: '실무 팁', list: [
          'CI에서 apply 직후 <code>rollout status --timeout</code>을 돌리면 "배포 성공"이 "롤아웃 성공"과 같은 뜻이 됩니다.',
          '자동 롤백까지 원한다면 Argo Rollouts 같은 도구나 GitOps의 상태 확인을 씁니다. CI/CD 챕터에서 다룹니다.',
        ] },
      ],
    },
    // 12
    {
      key: '되돌리기', kind: 'solution', title: '나쁜 버전은 한 줄로 되돌립니다',
      body: [
        '<code>kubectl rollout undo</code>는 직전 ReplicaSet의 Pod 템플릿을 다시 적용합니다. 이전 ReplicaSet이 0개로 남아 있으니(<code>revisionHistoryLimit</code>, 기본 10개) 이미지를 다시 받을 필요도 거의 없이 빠르게 돌아옵니다.',
        '실패하던 v3 Pod는 사라지고 v2 셋이 그대로 남습니다. 특정 버전으로 가려면 <code>--to-revision</code>을 씁니다.',
      ],
      callout: { type: 'warn', text: 'undo는 응급 처치입니다. Git의 매니페스트는 여전히 v3를 가리키니 Git도 되돌려야 하고, DB 스키마 변경은 undo로 돌아오지 않습니다.' },
      hide: ['p1'],
      set: { p2: { state: 'ok' }, p3: { state: 'ok' }, p4: { state: 'ok' } },
      tags: [
        { on: 'p4', text: 'v2가 계속 서비스', tone: 'ok', pos: 'bottom' },
      ],
      code: {
        title: '확인하고 되돌리기', lang: 'sh', hl: [1, 7],
        text: `$ kubectl rollout history deploy/api
REVISION  CHANGE-CAUSE
2         v2 배포 (#481)
3         v3 배포 (#495)

$ kubectl rollout undo deploy/api
deployment.apps/api rolled back
$ kubectl rollout status deploy/api
deployment "api" successfully rolled out
`,
      },
      metrics: { ready: ['3 / 3', 'ok'], err: ['0%', 'ok'], ver: 'v2 ×3', rst: '0' },
      changes: [['+', 'rollout undo로 v2 복귀'], ['-', 'v3 Pod 정리'], ['~', 'revision 2가 4번으로 다시 기록']],
      more: [
        { title: '동작 원리', body: [
          'undo는 시간을 되감는 것이 아니라 <b>새 롤아웃</b>입니다. 옛 템플릿을 다시 적용하므로 revision 번호가 새로 붙고(2 → 4), 평소와 같은 롤링 업데이트 규칙(maxSurge, readiness)으로 진행됩니다.',
          'CHANGE-CAUSE는 Deployment의 <code>kubernetes.io/change-cause</code> 주석에서 옵니다. 비워 두면 <code>&lt;none&gt;</code>만 보여 어느 번호로 돌아갈지 헷갈립니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl annotate deploy/api \\
    kubernetes.io/change-cause="v3 배포 (#495)"
$ kubectl rollout history deploy/api --revision=2
$ kubectl rollout undo deploy/api --to-revision=2` } },
        { title: '흔한 실수', list: [
          'undo만 하고 Git을 그대로 두면, 다음 배포나 GitOps 동기화가 v3를 다시 내보냅니다. 응급 undo 뒤에는 반드시 Git에서 revert 커밋을 만드세요.',
          'v3가 DB 마이그레이션을 이미 실행했다면 v2가 새 스키마에서 깨질 수 있습니다. 4단계의 확장 → 전환 → 축소 순서를 지켰다면 안전합니다.',
        ] },
      ],
    },
    // 13
    {
      key: '클라우드 LB', kind: 'compare', title: '클라우드 LB가 Pod로 직접 보낼 때',
      body: [
        '클라우드 로드 밸런서가 노드를 거치지 않고 <b>Pod IP로 직접</b> 보내는 구성이 늘고 있습니다. 이때는 Pod readiness만으로 부족합니다. LB가 새 Pod를 정상으로 보기 전에 옛 Pod가 내려가면 순간적으로 대상이 비어요.',
        '그래서 각 클라우드는 "LB 상태 검사 통과"를 Pod 조건으로 붙이는 <b>readiness gate</b>와, 빠지는 대상에 남은 연결을 마무리할 시간을 줍니다.',
      ],
      callout: { type: 'cloud', text: 'LB의 연결 드레이닝 시간과 Pod의 종료 유예 시간을 함께 맞추세요. 한쪽만 길면 다른 쪽이 먼저 연결을 끊습니다.' },
      show: ['users', 'svc'],
      set: { svc: { label: 'Cloud LB', sub: 'Pod IP 직접', icon: 'globe', color: 'orange' }, p2: { state: null, badge: null }, p3: { state: null }, p4: { state: null } },
      flows: [
        { path: ['users', 'svc'], kind: 'req', n: 3 },
        { path: ['svc', 'p2'], kind: 'req', delay: 0.9 }, { path: ['svc', 'p3'], kind: 'req', delay: 1.2 }, { path: ['svc', 'p4'], kind: 'req', delay: 1.5 },
      ],
      panel: { title: 'LB와 롤아웃 맞추기', icon: 'globe', rows: [
        ['AWS', 'LB Controller · readiness gate', 'aws'],
        ['Azure', 'App Gateway 등 · 상태 검사 정렬', 'azure'],
        ['GCP', 'NEG · readiness gate 자동', 'gcp'],
        ['NCP', 'Load Balancer · 상태 검사 정렬', 'ncp'],
      ] },
      metrics: { ver: 'v2 ×3' },
      more: [
        { title: '클라우드별로', rows: [
          ['AWS EKS', 'AWS Load Balancer Controller의 IP 대상 모드. 네임스페이스에 주입 라벨을 달면 "대상 그룹에서 정상"이 Pod readiness gate로 붙습니다. 대상 제거 지연(deregistration delay)도 함께 조정합니다.', 'aws'],
          ['Azure AKS', 'Application Gateway 같은 외부 LB와 연동할 때 상태 검사 경로 · 간격을 readiness와 맞추고, 종료 시 연결 드레이닝 시간을 둡니다.', 'azure'],
          ['GCP GKE', '컨테이너 네이티브 LB(NEG)를 쓰면 GKE가 LB 상태를 readiness gate로 자동 추가합니다.', 'gcp'],
          ['NCP NKS', 'Service type LoadBalancer로 만든 Load Balancer의 상태 검사 설정을 앱의 readiness 경로와 맞춥니다.', 'ncp'],
        ] },
        { title: '동작 원리', body: [
          'readiness gate는 Pod의 Ready 조건에 "외부 조건"을 하나 더 거는 기능입니다. 컨트롤러가 LB 상태를 보고 조건을 True로 바꿔 줄 때까지 Pod는 Ready가 아니므로, 롤아웃도 그만큼 기다립니다.',
        ] },
        { title: '확인하기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get pod -l app=api -o wide
NAME        READY  STATUS   READINESS GATES
api-...q2w  1/1    Running  1/1
api-...z9m  1/1    Running  0/1` } },
      ],
    },
    // 14
    {
      key: '정리', kind: 'recap', title: '정리: 시작과 끝을 지켜야 무중단입니다',
      body: [
        '롤링 업데이트는 ReplicaSet 두 개를 <code>maxSurge</code> · <code>maxUnavailable</code>이 정한 속도로 맞바꿉니다. 무중단을 실제로 만드는 것은 양쪽 끝입니다. 시작할 때는 <b>readiness</b>가 준비된 Pod만 넣고(startup이 기동 시간을 지키고), 끝날 때는 <b>graceful shutdown</b>과 PDB가 하던 일을 마치게 합니다.',
        '잘못됐을 때는 <code>rollout status</code>로 알아채고 <code>undo</code>로 되돌린 뒤 Git도 되돌립니다. 다음 레슨에서는 Pod가 바뀌어도 <b>남아야 하는 데이터</b>를 봅니다.',
      ],
      set: { svc: { label: 'Service', sub: 'api', icon: 'split', color: 'purple' } },
      flows: [
        { path: ['users', 'svc'], kind: 'req', n: 3 },
        { path: ['svc', 'p2'], kind: 'req', delay: 0.9 }, { path: ['svc', 'p3'], kind: 'req', delay: 1.2 }, { path: ['svc', 'p4'], kind: 'req', delay: 1.5 },
      ],
    },
  ],
  quiz: [
    {
      q: '배포할 때마다 20~30초 동안만 5xx가 치솟습니다. 그동안에도 kubectl get pod는 모든 Pod가 Running · 1/1이라고 합니다. 가장 유력한 원인은?',
      options: [
        'maxSurge가 너무 커서 Pod가 한꺼번에 많이 뜬다',
        'readiness 프로브가 없어, 기동이 끝나지 않은 Pod가 Ready로 취급되어 트래픽을 받는다',
        'liveness 프로브가 없어 죽은 Pod가 재시작되지 않는다',
        'Service의 포트 번호가 잘못됐다',
      ],
      answer: 1, step: 5,
      why: '프로브가 없으면 프로세스가 뜬 순간 Ready가 되어 Service 대상에 들어가고, 롤아웃도 곧바로 옛 Pod를 내립니다. 포트가 틀렸다면 배포 때만이 아니라 항상 실패하고, liveness는 기동 중 트래픽과 무관합니다.',
    },
    {
      q: '두 버전이 동시에 떠 있으면 데이터가 깨지는 배치 소비자 앱입니다. 짧은 중단은 괜찮습니다. 어떤 전략이 맞을까요?',
      options: [
        'RollingUpdate, maxSurge 100%',
        'RollingUpdate, maxSurge 1 · maxUnavailable 0',
        'Recreate',
        'replicas를 0으로 두고 HPA에 맡긴다',
      ],
      answer: 2, step: 1,
      why: 'Recreate는 옛 Pod가 모두 종료된 뒤 새 Pod를 띄우므로 두 버전이 겹치지 않습니다. RollingUpdate는 어떤 값을 줘도 교체 중 두 버전이 함께 떠 있습니다.',
    },
    {
      q: 'replicas 8에 maxSurge 25%, maxUnavailable 25%(기본값)입니다. 롤아웃 중 Pod 수의 범위로 옳은 것은?',
      options: [
        'Ready 6개 이상, 전체 10개 이하',
        'Ready 8개 이상, 전체 8개 이하',
        'Ready 7개 이상, 전체 9개 이하',
        'Ready 4개 이상, 전체 12개 이하',
      ],
      answer: 0, step: 2,
      why: '8의 25%는 2이므로 surge 2(전체 최대 10), unavailable 2(가용 최소 6)입니다. 나누어떨어지지 않을 때는 surge는 올림, unavailable은 내림으로 계산합니다.',
    },
    {
      q: 'ConfigMap의 값만 바꾸고 kubectl apply를 했는데 Pod들이 옛 설정을 계속 씁니다. 롤아웃도 일어나지 않았습니다. 왜일까요?',
      options: [
        'ConfigMap은 Deployment와 다른 네임스페이스에만 둘 수 있다',
        'maxUnavailable이 0이라 롤아웃이 막혔다',
        'readiness 프로브가 실패하고 있다',
        'Pod 템플릿이 바뀌지 않아 새 ReplicaSet이 만들어지지 않았다',
      ],
      answer: 3, step: 3,
      why: '롤아웃은 Pod 템플릿이 바뀔 때만 일어납니다. ConfigMap 내용 변경은 템플릿을 바꾸지 않으므로, 템플릿에 설정 해시 주석을 넣거나 rollout restart로 Pod를 다시 띄워야 합니다.',
    },
    {
      q: 'v2에서 DB의 옛 컬럼 이름을 바꾸는 마이그레이션을 배포와 함께 실행하려 합니다. 롤링 업데이트에서 가장 안전한 방법은?',
      options: [
        '마이그레이션과 v2 배포를 같은 순간에 실행한다',
        '새 컬럼 추가 → 새 코드 배포 → 다음 배포에서 옛 컬럼 삭제로 나눈다',
        'maxSurge를 100%로 올려 교체를 빨리 끝낸다',
        'readiness 프로브에서 스키마 버전을 확인한다',
      ],
      answer: 1, step: 4,
      why: '교체 중에는 v1과 v2가 동시에 요청을 받으므로 스키마는 두 버전 모두와 호환되어야 합니다. 확장 → 전환 → 축소로 나누면 어느 순간에도 둘 다 동작합니다. 교체를 빨리 해도 겹치는 시간이 0이 되지는 않습니다.',
    },
    {
      q: 'liveness 프로브가 DB 쿼리까지 확인하도록 만들었습니다. DB가 1분간 느려지자 일어날 일로 가장 가까운 것은?',
      options: [
        'Pod들이 Service 대상에서만 잠시 빠졌다가 돌아온다',
        '아무 일도 없다. liveness는 기동할 때만 실행된다',
        '멀쩡한 Pod들이 줄줄이 재시작되어, DB가 회복된 뒤에도 장애가 이어진다',
        'Deployment가 자동으로 이전 버전으로 롤백한다',
      ],
      answer: 2, step: 7,
      why: 'liveness 실패의 결과는 컨테이너 재시작입니다. 재시작으로 고칠 수 없는 외부 문제를 liveness에 넣으면 장애만 키웁니다. 대상에서만 빼는 것은 readiness의 동작이고, 쿠버네티스는 프로브 실패로 자동 롤백하지 않습니다.',
    },
    {
      q: '기동에 90초 걸리는 앱이 CrashLoopBackOff에 빠졌습니다. 로그에는 에러가 없고, Events에 "failed liveness probe, will be restarted"가 반복됩니다. 가장 알맞은 조치는?',
      options: [
        'startupProbe를 추가해 기동에 최대 2분 정도를 허용한다',
        'liveness의 periodSeconds를 1초로 줄인다',
        '메모리 limit을 올린다',
        'readiness 프로브를 삭제한다',
      ],
      answer: 0, step: 8,
      why: 'kubelet이 기동 중인 컨테이너를 liveness 실패로 죽이고 있습니다. startupProbe가 통과할 때까지 liveness가 시작되지 않으므로 기동 시간을 보장할 수 있습니다. 검사 주기를 줄이면 더 빨리 죽고, 메모리는 OOMKilled일 때의 문제입니다.',
    },
    {
      q: 'readiness 프로브는 잘 동작하는데, 배포 때마다 진행 중이던 요청 몇 개가 끊깁니다. 먼저 손볼 곳은?',
      options: [
        'replicas를 두 배로 늘린다',
        'maxSurge를 0으로 낮춘다',
        'liveness 프로브의 주기를 짧게 한다',
        '종료 쪽: 앱이 SIGTERM에 하던 요청을 마치게 하고, preStop으로 엔드포인트 반영을 기다린다',
      ],
      answer: 3, step: 9,
      why: '새 Pod가 들어오는 쪽은 readiness가 지키고 있으니, 남은 문제는 옛 Pod가 나가는 쪽입니다. SIGTERM을 받자마자 죽거나, 엔드포인트 변경이 퍼지기 전에 종료하면 요청이 끊깁니다. Pod 수나 프로브 주기는 이 문제를 바꾸지 못합니다.',
    },
    {
      q: 'Pod가 종료될 때마다 정확히 30초씩 걸리고, 종료 코드가 137입니다. Dockerfile은 CMD npm start 입니다. 원인은?',
      options: [
        'preStop의 sleep이 30초로 잡혀 있다',
        '셸이 PID 1이라 SIGTERM이 앱에 전달되지 않아, 유예 시간 끝에 SIGKILL로 죽는다',
        '메모리 limit을 넘어 OOMKilled됐다',
        'readiness 프로브가 30초 동안 실패했다',
      ],
      answer: 1, step: 9,
      why: '셸 형식 CMD는 셸이 PID 1이 되어 신호를 자식 프로세스에 넘기지 않는 경우가 많습니다. 앱은 SIGTERM을 못 받고 기본 30초 유예가 끝나 SIGKILL(137)로 죽습니다. exec 형식 CMD로 바꾸면 해결됩니다. OOMKilled라면 Reason에 그렇게 적힙니다.',
    },
    {
      q: '노드 업그레이드가 몇 시간째 끝나지 않습니다. kubectl get pdb를 보니 api의 ALLOWED DISRUPTIONS가 0이고, replicas 3에 minAvailable 3입니다. 옳은 조치는?',
      options: [
        'PDB를 minAvailable 2나 maxUnavailable 1처럼 중단을 1개 허용하도록 고친다',
        'drain에 --force를 붙여 계속 돌린다',
        'api의 readiness 프로브를 제거한다',
        'maxSurge를 0으로 바꾼다',
      ],
      answer: 0, step: 10,
      why: 'minAvailable이 replicas와 같으면 허용 중단이 0이라 Eviction API가 모든 퇴거를 거절합니다. 하나씩은 빠질 수 있게 PDB를 고쳐야 합니다. --force는 PDB가 아니라 관리되지 않는 Pod에 관한 옵션이고, 롤아웃 설정은 drain과 무관합니다.',
    },
    {
      q: 'CI가 kubectl apply 후 성공으로 끝났는데, 다음 날 보니 새 버전 Pod가 하나도 Ready가 아니고 Deployment에 ProgressDeadlineExceeded가 찍혀 있습니다. 재발을 막는 가장 직접적인 방법은?',
      options: [
        'progressDeadlineSeconds를 0으로 둔다',
        'revisionHistoryLimit을 늘린다',
        'liveness 프로브를 추가한다',
        'apply 뒤에 kubectl rollout status --timeout을 실행해 롤아웃이 끝나지 않으면 파이프라인을 실패시킨다',
      ],
      answer: 3, step: 11,
      why: 'apply는 원하는 상태를 기록할 뿐 롤아웃 완료를 기다리지 않습니다. rollout status가 완료를 기다리고 실패 시 0이 아닌 코드로 끝나므로 CI가 실패를 알아챕니다. 쿠버네티스는 ProgressDeadlineExceeded에도 자동 롤백하지 않습니다.',
    },
    {
      q: '장애 중에 kubectl rollout undo로 v2로 되돌렸습니다. 몇 분 뒤 GitOps 도구가 동기화하자 다시 v3가 배포됐습니다. 무엇을 빠뜨렸을까요?',
      options: [
        'undo에 --to-revision을 주지 않았다',
        'PDB를 만들지 않았다',
        'Git의 매니페스트를 v2로 되돌리는 revert 커밋',
        'readiness gate 설정',
      ],
      answer: 2, step: 12,
      why: 'undo는 클러스터 안의 Deployment만 바꿉니다. Git이 여전히 v3를 가리키면 다음 배포나 동기화가 v3를 다시 적용합니다. 응급 undo 뒤에는 Git에서도 되돌려야 합니다.',
    },
    {
      q: 'EKS에서 ALB가 IP 대상 모드로 Pod에 직접 보냅니다. 롤아웃 때마다 잠깐 502가 나는데, Pod readiness는 정상입니다. 먼저 검토할 것은?',
      options: [
        'Pod readiness gate를 켜서 대상 그룹에서 정상이 될 때까지 롤아웃이 기다리게 하고, 대상 제거 지연과 종료 유예를 맞춘다',
        'HPA의 minReplicas를 늘린다',
        'Service type을 ClusterIP로 바꾼다',
        'liveness 프로브를 제거한다',
      ],
      answer: 0, step: 13,
      why: 'LB가 Pod로 직접 보낼 때는 Pod가 Ready여도 LB 상태 검사를 아직 통과하지 못했을 수 있습니다. readiness gate가 그 조건을 Pod Ready에 묶어 롤아웃이 기다리게 합니다. Pod 수를 늘려도 교체 순간의 공백은 그대로입니다.',
    },
  ],
};
