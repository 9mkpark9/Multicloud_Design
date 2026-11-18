export default {
  id: 'rolling-update',
  learn: [
    '한꺼번에 교체하면 왜 중단이 생기는가',
    'maxSurge · maxUnavailable로 교체 속도 정하기',
    'readiness · liveness · startup 프로브의 차이',
    '종료 신호와 graceful shutdown',
    'rollout status · undo로 확인하고 되돌리기',
  ],
  legend: [['req', '요청'], ['res', '응답'], ['bad', '실패 (5xx)'], ['ctrl', '제어 · 프로브']],
  metrics: [
    { id: 'ready', label: 'Ready Pod', icon: 'circle-check' },
    { id: 'err', label: '5xx 비율', icon: 'warn' },
    { id: 'ver', label: '떠 있는 버전', icon: 'tag' },
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
      kl: { kind: 'tile', at: [6.3, -2.9], label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
    },
    edges: {
      e_u: { from: 'users', to: 'svc' },
      e_s1: { from: 'svc', to: 'p1' },
      e_s2: { from: 'svc', to: 'p2' },
      e_s3: { from: 'svc', to: 'p3' },
      e_s4: { from: 'svc', to: 'p4' },
      e_d: { from: 'dep', to: 'p4', style: 'dashed' },
      e_k: { from: 'kl', to: 'p4', style: 'dashed' },
    },
  },
  steps: [
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
      metrics: { ready: ['0 / 3', 'bad'], err: ['100%', 'bad'], ver: 'v1 → v2' },
    },
    {
      key: '롤링 업데이트', kind: 'solution', title: '롤링 업데이트: 조금씩 바꿉니다',
      body: [
        '<b>롤링 업데이트</b>는 Deployment의 기본 전략입니다. 이미지 태그를 바꿔 적용하면 Deployment가 새 ReplicaSet을 만들고, 새 Pod를 조금 늘리고 옛 Pod를 조금 줄이기를 되풀이합니다.',
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
    },
    {
      key: '조금씩 교체', kind: 'concept', title: '하나 띄우고, Ready면 하나 내립니다',
      body: [
        '<code>maxSurge: 1</code>, <code>maxUnavailable: 0</code>으로 따라가 봅시다. ① v2 Pod 하나가 추가로 뜹니다(3 + 1개). ② 그 Pod가 <b>Ready</b>가 되면 Service의 대상에 들어갑니다. ③ 그제야 v1 하나를 종료합니다. v1이 모두 사라질 때까지 이것을 반복합니다.',
        '교체 중에는 v1과 v2가 <b>동시에</b> 요청을 받습니다. 그래서 두 버전은 서로 호환되어야 합니다. v2가 DB 컬럼을 지워 버리면 아직 남아 있는 v1이 깨집니다.',
      ],
      callout: { type: 'key', text: '모든 것이 "새 Pod가 Ready가 되면"에 걸려 있습니다. 그런데 Ready는 누가, 무엇을 보고 판단할까요?' },
      show: ['users', 'svc', 'p4'],
      hide: ['e_s1'],
      set: { p1: { state: 'dim', badge: '종료 중', tone: 'mute' }, p4: { state: 'ok' } },
      focus: ['p4'],
      tags: [{ on: 'p4', text: 'Ready → 트래픽 받음', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['dep', 'p4'], kind: 'ctrl' },
        { path: ['users', 'svc'], kind: 'req', n: 3, delay: 0.6 },
        { path: ['svc', 'p2'], kind: 'req', delay: 1.4 }, { path: ['svc', 'p3'], kind: 'req', delay: 1.7 }, { path: ['svc', 'p4'], kind: 'req', delay: 2.0 },
      ],
      metrics: { ver: 'v1 ×2 · v2 ×1' },
      changes: [['+', 'v2 Pod 1개 (surge)'], ['-', 'v1 Pod 1개 종료'], ['~', 'Ready는 계속 3개']],
    },
    {
      key: '프로브 없음', kind: 'case', title: '사례: 준비 안 된 Pod로 간 트래픽',
      body: [
        '이 팀의 Deployment에는 <b>readiness 프로브</b>가 없었습니다. 프로브가 없으면 쿠버네티스는 컨테이너 프로세스가 시작된 순간 Pod를 Ready로 칩니다. 하지만 v2는 설정을 읽고 DB 연결을 맺는 데 20초가 걸립니다.',
        '그 20초 동안 Service는 아직 포트도 열지 않은 Pod로 요청을 보내고, 사용자는 502 · 503을 받습니다. 더 나쁜 것은 롤아웃입니다. "Ready니까" 곧바로 다음 v1을 내려서, 몇 초 만에 준비된 Pod가 하나도 남지 않습니다.',
      ],
      callout: { type: 'warn', text: '<code>kubectl get pod</code>는 전부 Running · 1/1이라고 말합니다. 프로브 없는 Ready는 "프로세스가 떴다"일 뿐, "요청을 받을 수 있다"가 아닙니다.' },
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
    },
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
    },
    {
      key: '프로브 3종', kind: 'concept', title: 'liveness와 startup은 다른 질문입니다',
      body: [
        '프로브는 세 가지이고, 실패했을 때 일어나는 일이 다릅니다. <b>liveness</b>는 "살아 있는가"를 묻고, 실패하면 kubelet이 컨테이너를 <b>재시작</b>합니다. 교착 상태처럼 재시작해야만 풀리는 고장을 위한 것입니다.',
        '<b>startup</b>은 기동이 느린 앱을 위한 것입니다. 이 프로브가 통과할 때까지 나머지 둘은 시작하지 않아서, 기동 중인 앱을 liveness가 죽이고 또 죽이는 재시작 루프를 막습니다.',
      ],
      callout: { type: 'warn', text: 'liveness에 DB 같은 외부 의존성 검사를 넣지 마세요. DB가 잠깐 느려지면 멀쩡한 Pod가 전부 재시작되어 장애가 커집니다. liveness는 프로세스 자신의 상태만 가볍게 봅니다.' },
      show: ['p2', 'kl'],
      set: { p2: { label: 'v1', color: 'blue', state: null, badge: null }, p4: { badge: null } },
      focus: ['p4'],
      tags: [{ on: 'kl', text: '주기적으로 검사', icon: 'repeat' }],
      flows: [{ path: ['kl', 'p4'], kind: 'ctrl', n: 3, gap: 0.6 }],
      panel: { title: '실패하면 무슨 일이?', icon: 'heart-pulse', rows: [['startup', '통과 전까지 나머지 보류', 'info'], ['readiness', '트래픽에서 제외', 'ok'], ['liveness', '컨테이너 재시작', 'bad']] },
    },
    {
      key: '우아한 종료', kind: 'solution', title: '잘 죽는 것도 무중단의 절반입니다',
      body: [
        'Pod가 삭제되면 두 가지가 동시에 시작됩니다. Service 엔드포인트에서 빠지는 것, 그리고 컨테이너가 <code>SIGTERM</code>을 받는 것입니다. <code>terminationGracePeriodSeconds</code>(기본 30초) 안에 끝나지 않으면 <code>SIGKILL</code>로 강제 종료됩니다.',
        '엔드포인트 변경이 프록시와 로드 밸런서에 퍼지는 데는 잠깐이 걸려서, 요청이 몇 개 더 옵니다. 그래서 <code>preStop</code>에서 몇 초 기다리고, 앱은 SIGTERM을 받으면 하던 요청을 마친 뒤 종료하게 만듭니다.',
      ],
      callout: { type: 'tip', text: '노드 드레인이나 클러스터 업그레이드로 Pod가 쫓겨날 때는 <b>PodDisruptionBudget</b>(예: <code>minAvailable: 2</code>)이 동시에 빠질 수 있는 수를 제한합니다.' },
      hide: ['p2', 'kl'],
      set: {
        p3: { state: 'dim', badge: 'SIGTERM', tone: 'warn' },
        p4: { state: 'ok' },
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
      metrics: { ready: ['3 / 3', 'ok'], ver: 'v1 종료 중 · v2 ×3' },
    },
    {
      key: '되돌리기', kind: 'solution', title: '나쁜 버전은 한 줄로 되돌립니다',
      body: [
        '다음 날 v3를 내보냈는데 설정 오류로 새 Pod가 계속 죽습니다. readiness를 통과하지 못하니 롤아웃은 첫 Pod에서 <b>멈춰 서고</b>, <code>maxUnavailable: 0</code> 덕분에 v2 세 개는 그대로 요청을 받습니다. 사용자는 아무것도 모릅니다.',
        '<code>kubectl rollout status</code>로 진행을 확인하고, <code>kubectl rollout undo</code>로 직전 버전으로 돌아갑니다. Deployment가 이전 ReplicaSet을 지우지 않고 남겨 두기 때문에(<code>revisionHistoryLimit</code>, 기본 10개) 되돌리기가 빠릅니다.',
      ],
      callout: { type: 'warn', text: 'undo는 응급 처치입니다. Git의 매니페스트는 여전히 v3를 가리키니 Git도 되돌려야 하고, DB 스키마 변경은 undo로 돌아오지 않습니다.' },
      hide: ['svc'],
      show: ['p1', 'p2'],
      set: {
        p1: { label: 'v3', color: 'red', state: 'down', badge: 'CrashLoop', tone: 'bad' },
        p2: { label: 'v2', color: 'green' },
        p3: { label: 'v2', color: 'green', state: null, badge: null },
        p4: { state: null },
        e_s3: { style: null, tone: null },
      },
      tags: [
        { on: 'p1', text: '롤아웃이 여기서 멈춤', tone: 'bad', pos: 'bottom', dx: -20 },
        { on: 'p4', text: 'v2가 계속 서비스', tone: 'ok', pos: 'bottom' },
      ],
      code: {
        title: '확인하고 되돌리기', lang: 'sh', hl: [1, 10],
        text: `$ kubectl rollout status deploy/api
Waiting for deployment "api" rollout to finish:
1 out of 3 new replicas have been updated...

$ kubectl rollout history deploy/api
REVISION  CHANGE-CAUSE
2         <none>
3         <none>

$ kubectl rollout undo deploy/api
deployment.apps/api rolled back
`,
      },
      metrics: { ready: ['3 / 3', 'ok'], err: ['0%', 'ok'], ver: 'v2 ×3 · v3 실패' },
      changes: [['-', 'v3 Pod: 기동 실패 반복'], ['~', '롤아웃 정지, v2 유지'], ['+', 'rollout undo로 v2 복귀']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 시작과 끝을 지켜야 무중단입니다',
      body: [
        '롤링 업데이트는 <code>maxSurge</code> · <code>maxUnavailable</code>이 정한 속도로 Pod를 조금씩 바꿉니다. 무중단을 실제로 만드는 것은 양쪽 끝입니다. 시작할 때는 <b>readiness 프로브</b>가 준비된 Pod만 트래픽에 넣고, 끝날 때는 <b>graceful shutdown</b>이 하던 일을 마치게 합니다.',
        '잘못됐을 때는 <code>rollout undo</code>로 되돌립니다. 블루그린 · 카나리 같은 다른 배포 전략은 CI/CD 챕터에서 다룹니다. 다음 레슨에서는 Pod가 바뀌어도 <b>남아야 하는 데이터</b>를 봅니다.',
      ],
      hide: ['p1'],
      show: ['users', 'svc'],
      set: { p2: { state: 'ok' }, p3: { state: 'ok' }, p4: { state: 'ok' } },
      flows: [
        { path: ['users', 'svc'], kind: 'req', n: 3 },
        { path: ['svc', 'p2'], kind: 'req', delay: 0.9 }, { path: ['svc', 'p3'], kind: 'req', delay: 1.2 }, { path: ['svc', 'p4'], kind: 'req', delay: 1.5 },
      ],
      metrics: { ver: 'v2 ×3' },
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
      answer: 1,
      why: '프로브가 없으면 프로세스가 뜬 순간 Ready가 되어 Service 대상에 들어가고, 롤아웃도 곧바로 옛 Pod를 내립니다. 포트가 틀렸다면 배포 때만이 아니라 항상 실패하고, liveness는 기동 중 트래픽과 무관합니다.',
    },
    {
      q: 'liveness 프로브가 DB 쿼리까지 확인하도록 만들었습니다. DB가 1분간 느려지자 일어날 일로 가장 가까운 것은?',
      options: [
        'Pod들이 Service 대상에서만 잠시 빠졌다가 돌아온다',
        '아무 일도 없다. liveness는 기동할 때만 실행된다',
        '멀쩡한 Pod들이 줄줄이 재시작되어, DB가 회복된 뒤에도 장애가 이어진다',
        'Deployment가 자동으로 이전 버전으로 롤백한다',
      ],
      answer: 2,
      why: 'liveness 실패의 결과는 컨테이너 재시작입니다. 재시작으로 고칠 수 없는 외부 문제를 liveness에 넣으면 장애만 키웁니다. 대상에서만 빼는 것은 readiness의 동작이고, 쿠버네티스는 프로브 실패로 자동 롤백하지 않습니다.',
    },
    {
      q: 'replicas 4, maxSurge 1, maxUnavailable 0인 Deployment에 버그가 있는 이미지를 배포했습니다. 새 Pod는 readiness를 통과하지 못합니다. 클러스터의 상태는?',
      options: [
        '옛 Pod 4개가 계속 서비스하고, 새 Pod 1개가 준비되지 못한 채 롤아웃이 멈춘다',
        '옛 Pod가 하나씩 내려가 결국 새 Pod 4개만 남는다',
        '옛 Pod 3개와 새 Pod 1개가 트래픽을 나눠 받는다',
        'Deployment가 삭제되고 서비스가 중단된다',
      ],
      answer: 0,
      why: 'maxUnavailable 0은 Ready Pod가 4개 밑으로 내려가는 것을 허용하지 않습니다. 새 Pod가 Ready가 되어야 옛 Pod를 내리는데 그러지 못하니 롤아웃이 멈춥니다. Ready가 아닌 Pod는 트래픽도 받지 않습니다.',
    },
    {
      q: 'readiness 프로브는 잘 동작하는데, 배포 때마다 진행 중이던 요청 몇 개가 끊깁니다. 먼저 손볼 곳은?',
      options: [
        'replicas를 두 배로 늘린다',
        'maxSurge를 0으로 낮춘다',
        'liveness 프로브의 주기를 짧게 한다',
        '종료 쪽: 앱이 SIGTERM에 하던 요청을 마치게 하고, preStop으로 엔드포인트 반영을 기다린다',
      ],
      answer: 3,
      why: '새 Pod가 들어오는 쪽은 readiness가 지키고 있으니, 남은 문제는 옛 Pod가 나가는 쪽입니다. SIGTERM을 받자마자 죽거나, 엔드포인트 변경이 퍼지기 전에 종료하면 요청이 끊깁니다. Pod 수나 프로브 주기는 이 문제를 바꾸지 못합니다.',
    },
  ],
};
