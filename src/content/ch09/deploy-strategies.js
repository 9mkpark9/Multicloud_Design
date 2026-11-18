export default {
  id: 'deploy-strategies',
  learn: [
    'Recreate와 롤링: 가장 단순한 두 방법의 한계',
    '블루그린: 두 벌을 두고 한 번에 전환',
    '카나리와 가중치 라우팅, 지표 기반 자동 롤백',
    'DB 스키마 변경을 expand → contract로 나누기',
    '기능 플래그로 배포와 출시 분리하기',
    '상황과 클라우드에 맞는 전략 고르기',
  ],
  legend: [['req', 'v1이 받는 요청'], ['data', 'v2가 받는 요청'], ['ctrl', '지표 · 제어'], ['bad', '실패한 요청']],
  metrics: [
    { id: 'down', label: '다운타임', icon: 'power' },
    { id: 'cost', label: '추가 자원', icon: 'coins' },
    { id: 'rb', label: '롤백', icon: 'undo' },
    { id: 'blast', label: '영향 범위', icon: 'target' },
  ],
  scene: {
    zones: {
      dep: { at: [2.5, -2.3], size: [2.8, 3.2], label: 'Deployment', color: 'blue' },
    },
    nodes: {
      users: { kind: 'users', at: [-0.6, 3.4], label: '사용자' },
      lb: { at: [1.4, 1.4], label: 'LB', sub: '트래픽 분배', icon: 'split', color: 'purple' },
      p1: { size: 's', at: [3.2, -1.6], label: 'v1', icon: 'box', color: 'blue' },
      p2: { size: 's', at: [4.5, -1.6], label: 'v1', icon: 'box', color: 'blue' },
      p3: { size: 's', at: [3.2, -0.3], label: 'v1', icon: 'box', color: 'blue' },
      p4: { size: 's', at: [4.5, -0.3], label: 'v1', icon: 'box', color: 'blue' },
      blue: { at: [2.6, -2.2], label: 'v1', sub: '블루 · Pod × 4', icon: 'boxes', color: 'blue' },
      green: { at: [5, 0.2], label: 'v2', sub: '그린 · Pod × 4', icon: 'boxes', color: 'green' },
      judge: { at: [3.8, 3.2], label: '지표 분석', sub: '배포 컨트롤러', icon: 'activity', color: 'yellow' },
      prom: { kind: 'cyl', at: [6.2, 2.6], label: 'Prometheus', icon: 'chart-line', color: 'red' },
      db: { kind: 'cyl', at: [5.6, -2.6], label: 'DB', icon: 'database', color: 'purple' },
      flag: { at: [3.8, 3.2], label: '플래그', sub: '설정 서비스', icon: 'flag', color: 'orange' },
      cAws: { at: [3, 1], label: 'CodeDeploy', sub: 'AWS', icon: 'rocket', color: 'aws' },
      cAz: { at: [4.6, -0.6], label: '배포 슬롯', sub: 'Azure', icon: 'swap', color: 'azure' },
      cGcp: { at: [6.2, -2.2], label: 'Cloud Run', sub: 'GCP', icon: 'split', color: 'gcp' },
      cNcp: { at: [7.8, -3.8], label: 'NKS', sub: 'NCP', icon: 'boxes', color: 'ncp' },
    },
    edges: {
      e_u: { from: 'users', to: 'lb' },
      e_p1: { from: 'lb', to: 'p1' },
      e_p2: { from: 'lb', to: 'p2' },
      e_p3: { from: 'lb', to: 'p3' },
      e_p4: { from: 'lb', to: 'p4' },
      e_blue: { from: 'lb', to: 'blue' },
      e_green: { from: 'lb', to: 'green' },
      e_gj: { from: 'green', to: 'judge', style: 'dashed' },
      e_jl: { from: 'judge', to: 'lb', style: 'dashed' },
      e_gp: { from: 'green', to: 'prom', style: 'dashed' },
      e_pj: { from: 'prom', to: 'judge', style: 'dashed' },
      e_bdb: { from: 'blue', to: 'db' },
      e_gdb: { from: 'green', to: 'db' },
      e_flag: { from: 'flag', to: 'green', style: 'dashed' },
    },
  },
  codes: {
    svc: {
      title: 'service.yaml',
      lang: 'yaml',
      text: `apiVersion: v1
kind: Service
metadata:
  name: shop-api
spec:
  selector:
    app: shop-api
    track: green     # blue → green
  ports:
    - port: 80
      targetPort: 8080
`,
    },
    route: {
      title: 'httproute.yaml',
      lang: 'yaml',
      text: `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: shop-api
spec:
  parentRefs:
    - name: public-gw
  rules:
    - matches:
        - headers:
            - name: x-canary
              value: "true"
      backendRefs:
        - name: shop-api-v2
          port: 80
    - backendRefs:
        - name: shop-api-v1
          port: 80
          weight: 90
        - name: shop-api-v2
          port: 80
          weight: 10
`,
    },
    rollout: {
      title: 'rollout.yaml (발췌)',
      lang: 'yaml',
      text: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: shop-api
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: shop-api-canary
      stableService: shop-api-stable
      trafficRouting:
        nginx:
          stableIngress: shop-api
      analysis:
        templates:
          - templateName: error-rate
        startingStep: 1
      steps:
        - setWeight: 10
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
`,
    },
  },
  steps: [
    {
      key: 'Recreate', kind: 'problem', title: '전부 내리고 새로 올리면',
      body: [
        '이미지 <code>shop-api:a3f9c2e</code>가 준비됐습니다. 가장 단순한 배포는 <b>Recreate</b>예요. 기존 v1 Pod를 전부 내린 다음 v2를 올립니다.',
        '두 버전이 함께 도는 순간이 없어 단순하지만, v1이 내려가고 v2가 준비될 때까지 <b>서비스가 멈춥니다</b>. v2에 문제가 있으면 그 멈춤은 v1을 다시 올릴 때까지 이어져요.',
      ],
      callout: { type: 'tip', text: '쓸모가 없지는 않습니다. 두 버전이 <b>절대 함께 돌면 안 되는</b> 경우나, 점검 시간을 공지할 수 있는 내부 도구라면 가장 덜 복잡한 선택입니다.' },
      show: ['users', 'lb', 'dep', 'p1', 'p2', 'p3', 'p4'],
      set: { p1: { state: 'down' }, p2: { state: 'down' }, p3: { state: 'down' }, p4: { state: 'down' } },
      tags: [{ on: 'p2', text: 'v2 준비까지 중단', tone: 'bad', pos: 'right' }],
      flows: [
        { path: ['users', 'lb'], kind: 'req', n: 3 },
        { path: ['lb', 'p3'], kind: 'bad', n: 2, delay: 1 },
        { path: ['lb', 'p1'], kind: 'bad', delay: 1.3 },
      ],
      metrics: { down: ['수 분', 'bad'], cost: '없음', rb: '다시 배포', blast: ['100%', 'bad'] },
      more: [
        { title: '설정 예시', body: ['쿠버네티스 Deployment에서는 전략 한 줄입니다. 기존 ReplicaSet을 0으로 줄인 뒤에야 새 ReplicaSet을 늘려요.'], code: { title: 'deployment.yaml', lang: 'yaml', text: 'spec:\n  replicas: 4\n  strategy:\n    type: Recreate   # 기본값은 RollingUpdate' } },
        { title: '언제 맞나', list: [
          '한 번에 하나만 붙을 수 있는 볼륨(ReadWriteOnce)을 쓰는 단일 인스턴스: 새 Pod가 볼륨을 붙이려면 옛 Pod가 먼저 놓아야 합니다.',
          '메시지 형식이 바뀌어 옛 소비자와 새 소비자가 같은 큐를 함께 읽으면 안 될 때.',
          '야간 배치, 사내 관리 도구처럼 몇 분의 중단이 문제되지 않고 단순함이 더 중요한 곳.',
        ] },
        { title: '다운타임은 얼마나', body: ['중단 시간 = 옛 Pod 종료(graceful shutdown 대기 포함) + 이미지 받기 + 앱 시작 + readiness 통과입니다. 노드에 이미지가 없고 앱이 JVM처럼 느리게 뜨면 몇 분이 되기도 해요. 그래서 Recreate를 쓴다면 이미지를 미리 받아 두거나 시작 시간을 줄이는 것이 그대로 다운타임 단축입니다.'] },
      ],
    },
    {
      key: '롤링', kind: 'concept', title: '롤링: 조금씩 바꿔 끼우기',
      body: [
        'Deployment의 기본값인 <b>롤링 업데이트</b>는 Pod를 몇 개씩 v2로 바꿉니다. 새 Pod가 readiness 프로브를 통과해야 다음으로 넘어가니 중단이 없고, 여분도 Pod 한두 개면 돼요.',
        '대신 교체하는 동안 <b>v1과 v2가 함께</b> 요청을 받고, 그 비율은 Pod 개수가 정할 뿐 내가 고를 수 없습니다. 프로브는 통과하지만 결제가 실패하는 버그라면 <b>전부 바뀐 뒤에야</b> 드러나고, 되돌리는 것도 다시 롤링입니다.',
      ],
      callout: { type: 'key', text: '롤링은 "<b>죽지 않는가</b>"만 확인합니다. "<b>제대로 동작하는가</b>"를 보고 멈추려면 트래픽을 직접 쥐는 전략이 필요해요.' },
      set: {
        p1: { state: null, label: 'v2', color: 'green' }, p2: { state: null, label: 'v2', color: 'green' },
        p3: { state: 'dim', label: 'v2', color: 'green', badge: '준비 중' }, p4: { state: null },
      },
      tags: [{ on: 'p2', text: '교체 완료', tone: 'ok', pos: 'right' }, { on: 'p4', text: '다음 차례', pos: 'bottom' }],
      flows: [
        { path: ['users', 'lb'], kind: 'req', n: 3 },
        { path: ['lb', 'p1'], kind: 'data', delay: 1 },
        { path: ['lb', 'p2'], kind: 'data', delay: 1.2 },
        { path: ['lb', 'p4'], kind: 'req', n: 2, delay: 1.1 },
      ],
      metrics: { down: ['0', 'ok'], cost: 'Pod +1', rb: '다시 롤링', blast: ['점점 100%', 'warn'] },
      changes: [['~', '다운타임 수 분 → 0'], ['~', 'v1 · v2가 함께 서비스'], ['-', '트래픽 비율은 못 고름']],
      more: [
        { title: '전략으로서의 한계', body: [
          '<code>maxSurge</code>·<code>maxUnavailable</code>, 프로브, <code>rollout undo</code> 같은 손잡이는 ch07 「롤링 업데이트와 롤백」에서 다뤘습니다. 여기서 볼 것은 전략의 성격이에요. 롤링에서 v2가 받는 트래픽 비율은 <b>v2 Pod 수 ÷ 전체 Pod 수</b>로 저절로 정해집니다. Pod가 4개면 25%, 50%, 75%로만 움직이고, "1%만"은 Pod를 100개 두지 않는 한 불가능해요.',
          '또 진행 속도는 readiness가 정합니다. 프로브는 "요청을 받을 수 있는가"를 볼 뿐, 오류율이나 결제 성공률 같은 <b>업무 지표</b>는 보지 않아요.',
        ] },
        { title: '섞여 도는 동안', list: [
          '한 사용자의 연속 요청이 v1과 v2를 번갈아 맞을 수 있습니다. 화면과 API 응답 형식이 버전마다 다르면 깨져요. 새 필드는 추가만 하고, 옛 클라이언트가 모르는 값을 보내지 않게 합니다.',
          '세션을 Pod 메모리에 두면 교체될 때 로그인이 풀립니다. 세션은 Redis 같은 외부 저장소로.',
        ] },
        { title: '실무 팁', body: ['대부분의 일상 배포는 롤링으로 충분합니다. 롤링에 <b>기능 플래그</b>(12단계)를 더하면, 코드 교체는 롤링으로 조용히 하고 위험한 기능의 노출만 따로 조절할 수 있어 많은 팀의 기본 조합이 됩니다.'] },
      ],
    },
    {
      key: '블루그린', kind: 'solution', title: '블루그린: 두 벌을 두고 스위치 전환',
      body: [
        '<b>블루그린</b>은 운영 중인 v1(블루) 옆에 <b>같은 크기의 v2(그린)</b>를 통째로 띄웁니다. 그린은 아직 사용자 트래픽을 받지 않으니, 실제 환경에서 충분히 점검할 수 있어요.',
        '준비되면 로드 밸런서가 가리키는 곳을 <b>한 번에</b> 그린으로 바꿉니다. 문제가 생기면 다시 블루로 돌리면 끝이라 롤백이 몇 초예요. 그 값은 전환 기간 동안의 <b>두 배 자원</b>입니다.',
      ],
      callout: { type: 'warn', text: '전환 순간 <b>모든 사용자</b>가 새 버전으로 갑니다. 실사용 트래픽에서만 드러나는 문제는 전원이 함께 겪어요. 블루는 롤백용으로 한동안 남겨 두세요.' },
      hide: ['dep', 'p1', 'p2', 'p3', 'p4'],
      show: ['blue', 'green'],
      set: { e_blue: { style: 'dashed', tone: 'mute', label: '0%' }, e_green: { tone: 'ok', label: '100%' } },
      focus: ['green'],
      tags: [{ on: 'blue', text: '대기 · 롤백용', icon: 'undo' }],
      flows: [
        { path: ['users', 'lb'], kind: 'data', n: 4 },
        { path: ['lb', 'green'], kind: 'data', n: 4, delay: 1 },
      ],
      metrics: { cost: ['2배', 'warn'], rb: ['수 초', 'ok'], blast: ['100% 한 번에', 'warn'] },
      changes: [['+', '그린 환경 (v2 전체)'], ['~', '롤백: 다시 롤링 → 스위치'], ['~', '추가 자원 Pod +1 → 2배']],
      more: [
        { title: '전환 전 점검', list: [
          '그린 전용 내부 주소(예: 사내망에서만 열리는 테스트용 호스트)로 스모크 테스트와 핵심 시나리오를 돌립니다.',
          '캐시·커넥션 풀·JIT를 데워 둡니다. 차가운 그린에 100%가 한꺼번에 몰리면 첫 몇 분의 지연이 튑니다.',
          '그린의 Pod 수와 오토스케일 설정이 블루와 같은지 확인합니다. 테스트할 때 작게 띄워 두고 잊는 일이 흔해요.',
        ] },
        { title: '함께 쓰는 것들', body: [
          '블루와 그린이 둘이어도 <b>DB, 큐, 외부 결제사</b>는 보통 하나를 함께 씁니다. 그린이 점검 중에 실제 큐의 메시지를 소비하거나 실제 결제를 일으키지 않게, 백그라운드 작업은 전환 뒤에 켜도록 설정을 나눠 두세요. 스키마 변경은 10단계 사례처럼 두 버전 모두와 호환돼야 합니다.',
        ] },
        { title: '흔한 실수', list: [
          '전환 직후 블루를 지워 비용을 아끼기: 롤백 경로가 사라집니다. 보통 몇 시간~하루 이상 지켜본 뒤 내립니다.',
          'DNS 가중치로 전환하기: 클라이언트와 리졸버가 TTL 동안 옛 주소를 기억해 "한 번에"가 되지 않습니다. 전환은 로드 밸런서나 Service처럼 우리가 쥔 계층에서.',
        ] },
      ],
    },
    {
      key: '스위치', kind: 'concept', title: '스위치의 정체: 라벨 하나 바꾸기',
      body: [
        '쿠버네티스에서 블루그린의 스위치는 대개 <b>Service의 selector</b>입니다. 블루와 그린 Deployment에 <code>track: blue</code>, <code>track: green</code> 라벨을 붙여 두고, Service가 고르는 라벨만 바꿔요.',
        'selector가 바뀌면 엔드포인트 목록이 그린 Pod로 갈아 끼워지고, 새 연결은 모두 그린으로 갑니다. 되돌릴 때도 같은 한 줄이에요.',
      ],
      callout: { type: 'tip', text: '이미 맺어진 연결(keep-alive, WebSocket)은 바로 옮겨 가지 않습니다. 블루를 내릴 때는 <b>연결이 빠질 시간</b>을 줍니다.' },
      hide: ['users'],
      code: { ref: 'svc', hl: [6, 7, 8] },
      tags: [{ on: 'lb', text: 'track: green', tone: 'accent', icon: 'tag' }],
      flows: [{ path: ['lb', 'green'], kind: 'data', n: 3 }],
      more: [
        { title: '직접 해보기', body: ['selector를 바꾸고, 엔드포인트가 실제로 그린 Pod IP로 바뀌었는지 확인합니다.'], code: { title: 'terminal', lang: 'sh', text: '$ kubectl patch svc shop-api -p \\\n  \'{"spec":{"selector":{"app":"shop-api","track":"green"}}}\'\nservice/shop-api patched\n$ kubectl get endpointslices \\\n    -l kubernetes.io/service-name=shop-api\nNAME             ADDRESSTYPE  PORTS  ENDPOINTS\nshop-api-7xk2p   IPv4         8080   10.0.3.21,10.0.3.22 + 2 more...' } },
        { title: '다른 계층의 스위치', rows: [
          ['k8s Service', 'selector 라벨 교체 · 몇 초', 'ok'],
          ['L7 로드 밸런서', '리스너가 가리킬 대상 그룹 교체', 'ok'],
          ['Ingress·Gateway', '백엔드 Service 교체', 'ok'],
          ['DNS', '레코드 교체 · TTL만큼 늦게 퍼짐', 'warn'],
        ] },
        { title: '실무 팁', body: ['수동 <code>kubectl patch</code>는 기록이 남지 않고 Git의 매니페스트와 어긋납니다. 실제로는 selector 값을 Git에서 바꾸고 GitOps 도구가 적용하게 하거나(다음 레슨), Argo Rollouts의 <code>blueGreen</code> 전략처럼 전환과 미리보기 Service를 대신 관리해 주는 도구를 씁니다.'] },
      ],
    },
    {
      key: '카나리', kind: 'solution', title: '카나리: 10%에게 먼저 보여 주기',
      body: [
        '<b>카나리</b> 배포는 v2를 조금만 띄우고 트래픽의 <b>일부만</b>, 예를 들어 10%를 보냅니다. 오류율과 지연 시간을 v1과 비교해 괜찮으면 50%, 100%로 넓혀 가요.',
        '문제가 있어도 <b>영향받는 사용자는 10%</b>이고, 가중치를 0으로 돌리면 끝납니다. 자원도 카나리 몫만 더 들어요. 대신 가중치를 조절할 라우팅 계층(Ingress, 서비스 메시, 가중치 LB)과 <b>버전별 지표</b>가 있어야 합니다.',
      ],
      callout: { type: 'key', text: '탄광의 카나리아처럼 <b>작은 실제 트래픽</b>으로 먼저 위험을 감지합니다. 그림에서 요청 10개 가운데 1개만 v2로 가요.' },
      show: ['users'],
      set: {
        blue: { sub: '안정 버전' }, green: { sub: '카나리' },
        e_blue: { style: '', tone: '', label: '90%' }, e_green: { tone: 'accent', label: '10%' },
      },
      focus: ['green'],
      flows: [
        { path: ['users', 'lb'], kind: 'req', n: 5, gap: 0.3 },
        { path: ['lb', 'blue'], kind: 'req', n: 9, gap: 0.22, delay: 1 },
        { path: ['lb', 'green'], kind: 'data', n: 1, delay: 1.8 },
      ],
      metrics: { cost: ['카나리 몫', 'ok'], rb: ['수 초', 'ok'], blast: ['10%', 'ok'] },
      changes: [['~', 'v2 트래픽 100% → 10%'], ['~', '추가 자원 2배 → 카나리 몫'], ['+', '가중치 라우팅 필요']],
      more: [
        { title: '무엇을 비교하나', list: [
          '<b>오류율</b>: 5xx 비율. 카나리만 따로, 같은 시간대의 안정 버전과 나란히.',
          '<b>지연 시간</b>: 평균이 아니라 p95·p99. 일부 요청만 느려지는 문제는 평균에 묻힙니다.',
          '<b>포화도</b>: CPU·메모리·커넥션 수. 메모리 누수는 몇 시간 뒤에야 보이기도 해요.',
          '<b>업무 지표</b>: 결제 성공률, 장바구니 담기 수. 서버는 200을 주는데 버튼이 안 눌리는 버그는 여기서만 보입니다.',
        ] },
        { title: '누구를 카나리로 보낼까', rows: [
          ['무작위 %', '가장 흔함 · 대표성 좋음', 'ok'],
          ['헤더·쿠키', '사내 직원, 베타 사용자 먼저', 'info'],
          ['지역·리전', '한 리전에서 먼저 시작', 'info'],
          ['사용자 고정', '같은 사용자는 계속 같은 버전', 'accent'],
        ] },
        { title: '흔한 실수', body: ['단계마다 시간만 정하고 판단 기준은 정하지 않기: 그러면 카나리는 "천천히 하는 롤링"일 뿐입니다. 단계를 넘기는 조건(예: 오류율이 안정 버전보다 0.5%p 이상 높지 않을 것, 최소 요청 수 1,000건)을 미리 적어 둬야 의미가 있어요.'] },
      ],
    },
    {
      key: '가중치 라우팅', kind: 'concept', title: '10%는 누가 나누나: 가중치 라우팅',
      body: [
        '카나리의 비율은 Pod 수가 아니라 <b>라우팅 규칙</b>이 정합니다. Gateway API의 <b>HTTPRoute</b>는 백엔드마다 <code>weight</code>를 적어 v1에 90, v2에 10을 보내요. v2 Pod가 하나여도 정확히 10%입니다.',
        '규칙에 <b>헤더 조건</b>을 더하면 <code>x-canary: true</code>를 붙인 사내 테스터는 늘 v2로 갑니다. 일반 사용자 전에 우리가 먼저 써 보는 단계예요.',
      ],
      callout: { type: 'cloud', text: '같은 일을 서비스 메시(Istio 등)의 라우팅 규칙, Ingress 컨트롤러의 카나리 설정, 클라우드 L7 로드 밸런서의 가중치 대상으로도 합니다.' },
      hide: ['users'],
      set: { lb: { label: 'Gateway', sub: 'HTTPRoute', icon: 'route' } },
      code: { ref: 'route', hl: [9, 10, 11, 12, 19, 22] },
      tags: [{ on: 'green', text: '헤더 → 항상 v2', icon: 'user-check', pos: 'bottom' }],
      flows: [
        { path: ['lb', 'blue'], kind: 'req', n: 6, gap: 0.3 },
        { path: ['lb', 'green'], kind: 'data', delay: 0.8 },
      ],
      more: [
        { title: '동작 원리', body: [
          'Gateway 구현체(로드 밸런서나 프록시)는 요청마다 규칙을 위에서부터 맞춰 봅니다. 헤더 조건이 맞으면 그 규칙으로, 아니면 다음 규칙의 가중치에 따라 백엔드를 고르죠. 가중치는 <b>요청 단위 확률</b>이라, 같은 사용자의 다음 요청이 다른 버전으로 갈 수 있습니다. 화면이 버전마다 다르면 사용자 고정(쿠키 기반 등)이 필요해요.',
          '가중치를 바꾸는 것은 매니페스트 숫자 두 개를 고치는 일입니다. 사람이 고치면 실수가 나니, 다음 단계처럼 컨트롤러가 단계별로 바꾸게 합니다.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: '$ for i in $(seq 200); do\n    curl -s https://shop.example/api/version\n  done | sort | uniq -c\n    181 a1b2c3d\n     19 a3f9c2e\n$ curl -s -H "x-canary: true" \\\n    https://shop.example/api/version\na3f9c2e' }, body: ['200번 중 19번이 새 버전(약 10%)입니다. 표본이 작으면 정확히 10%가 아닌 것이 정상이에요.'] },
        { title: '흔한 실수', list: [
          '가중치는 Gateway·Ingress를 <b>거치는</b> 트래픽에만 적용됩니다. 클러스터 안의 다른 서비스가 Service 이름으로 직접 부르면 Pod 수 비율로 나뉘어요.',
          '헤더 조건을 외부에서 아무나 붙일 수 있게 열어 두면, 아직 숨겨야 할 기능이 노출됩니다. 사내망이나 인증된 사용자로 한정하세요.',
        ] },
      ],
    },
    {
      key: '자동 롤백', kind: 'concept', title: '지표가 나빠지면 스스로 되돌립니다',
      body: [
        '사람이 배포할 때마다 대시보드를 지켜볼 수는 없습니다. <b>지표 기반 자동 롤백</b>은 "카나리의 5xx 비율이 1%를 넘으면 중단"처럼 <b>합격 기준을 미리</b> 적어 둡니다.',
        '배포 컨트롤러(Argo Rollouts, Flagger 등)가 단계마다 지표를 조회해, 통과하면 가중치를 올리고 실패하면 <b>0으로 내려 v1으로 되돌립니다</b>. 판단이 한결같고, 사람이 깨어 있지 않아도 돼요.',
      ],
      callout: { type: 'warn', text: '트래픽이 너무 적으면 지표는 의미가 없습니다. 요청 20개 중 1개 실패는 5%지만 우연일 수 있어요. 단계마다 <b>충분한 표본</b>이 쌓일 시간을 두세요.' },
      show: ['judge'],
      set: { lb: { label: 'LB', sub: '트래픽 분배', icon: 'split' }, green: { state: 'hot', badge: '5xx 4%', tone: 'bad' }, e_green: { tone: 'bad', label: '10% → 0%' }, e_blue: { label: '100%' } },
      focus: ['judge'],
      tags: [{ on: 'judge', text: '기준: 5xx 1% 미만', icon: 'gauge', pos: 'bottom' }],
      flows: [
        { path: ['lb', 'green'], kind: 'bad', n: 2 },
        { path: ['green', 'judge'], kind: 'ctrl', delay: 1 },
        { path: ['judge', 'lb'], kind: 'ctrl', delay: 2 },
        { path: ['lb', 'blue'], kind: 'req', n: 5, gap: 0.25, delay: 3 },
      ],
      metrics: { rb: ['자동', 'ok'] },
      changes: [['+', '지표 분석 단계'], ['~', '롤백 판단: 사람 → 기준']],
      more: [
        { title: '동작 원리', body: [
          '컨트롤러는 배포를 상태 기계로 다룹니다. "가중치 10% → 10분 대기하며 분석 → 50% → …" 단계를 하나씩 밟고, 분석이 실패로 끝나면 배포를 <b>중단(abort)</b>해 가중치를 안정 버전 100%로 돌립니다. 카나리 Pod는 0으로 줄어들고, 배포 객체는 실패 상태로 남아 알림이 갑니다.',
          '자동 롤백은 <b>되돌릴 뿐 고치지는 않습니다</b>. 다음 배포는 원인을 고친 새 커밋으로 시작해요.',
        ] },
        { title: '좋은 기준의 조건', list: [
          '<b>상대 비교</b>: "1% 미만" 같은 절대값보다 "안정 버전보다 나쁘지 않음"이 트래픽 변동에 강합니다.',
          '<b>최소 표본</b>: 요청이 n건 이상 쌓이기 전에는 판단 보류.',
          '<b>여러 번 실패해야 중단</b>: 한 번 튄 값으로 롤백하지 않게 허용 횟수를 둡니다.',
          '<b>지표 조회 실패는 실패로</b>: Prometheus가 응답하지 않을 때 "통과"로 넘어가면 안 됩니다.',
        ] },
        { title: '실무 팁', body: ['자동 롤백을 처음 켤 때는 판단만 기록하고 실제 중단은 하지 않는 기간을 둬 보세요. 지난 배포들에 기준을 대 보면 너무 예민한지(멀쩡한 배포를 중단) 너무 둔한지(장애를 통과) 감이 옵니다.'] },
      ],
    },
    {
      key: 'Rollout', kind: 'concept', title: 'Rollout: 단계와 분석을 선언하기',
      body: [
        '<b>Argo Rollouts</b>는 Deployment 대신 <b>Rollout</b> 리소스를 씁니다. Pod 템플릿은 같고, <code>strategy.canary.steps</code>에 "10% → 10분 대기 → 50%"처럼 단계를 적어요.',
        '<code>analysis</code>는 배포 내내 <b>AnalysisTemplate</b>을 돌려 Prometheus에 카나리의 오류율을 묻습니다. 기준을 넘으면 그 자리에서 중단하고 가중치를 되돌려요.',
      ],
      callout: { type: 'tip', text: '<code>trafficRouting</code>이 가중치를 Ingress·메시에 실제로 적용합니다. 이것이 없으면 Pod 수 비율로만 근사해요.' },
      hide: ['blue', 'e_gj'],
      show: ['prom'],
      set: { green: { state: null, badge: null }, e_green: { tone: 'accent', label: '10%' } },
      code: { ref: 'rollout', hl: [14, 15, 16, 17, 18, 19, 20, 21, 22] },
      tags: [{ on: 'prom', text: 'track="canary"', icon: 'search', pos: 'bottom' }],
      flows: [
        { path: ['lb', 'green'], kind: 'data', n: 2 },
        { path: ['green', 'prom'], kind: 'ctrl', delay: 0.8 },
        { path: ['prom', 'judge'], kind: 'ctrl', delay: 1.6 },
        { path: ['judge', 'lb'], kind: 'ctrl', delay: 2.4 },
      ],
      more: [
        { title: '설정 예시', body: ['Rollout이 참조하는 분석 템플릿입니다. 1분마다 카나리의 5xx 비율을 묻고, 두 번 넘게 기준을 어기면 실패예요.'], code: { title: 'analysis.yaml', lang: 'yaml', text: `apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate
spec:
  metrics:
    - name: error-rate
      interval: 1m
      failureLimit: 2
      successCondition: result[0] < 0.01
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{
              app="shop-api",track="canary",code=~"5.."}[2m]))
            /
            sum(rate(http_requests_total{
              app="shop-api",track="canary"}[2m]))` } },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: '$ kubectl argo rollouts get rollout shop-api\nName:            shop-api\nStatus:          ॥ Paused\nStrategy:        Canary\n  Step:          1/4\n  SetWeight:     10\n  ActualWeight:  10\nImages:          shop-api:a1b2c3d (stable)\n                 shop-api:a3f9c2e (canary)' }, body: ['<code>promote</code>로 다음 단계로 넘기거나 <code>abort</code>로 즉시 중단할 수 있습니다. 둘 다 사람이 개입하는 비상 손잡이예요.'] },
        { title: '비슷한 도구', list: [
          '<b>Flagger</b>: 기존 Deployment를 그대로 두고 옆에 카나리 자원을 만들어 단계별로 옮겨 줍니다. 서비스 메시·Ingress와 연동해요.',
          '클라우드 관리형 배포 서비스도 카나리 단계를 제공합니다(14단계).',
        ] },
      ],
    },
    {
      key: '희석된 지표', kind: 'case', title: '사례: 분석은 통과했는데 장애였다',
      body: [
        '카나리 10% 단계의 분석이 통과해 50%로 넘어간 뒤에야 오류가 쏟아졌고, 그제야 롤백됐습니다. 카나리 Pod의 실제 5xx는 <b>4%</b>였는데 왜 통과했을까요?',
        '분석 쿼리에 <code>track="canary"</code> 조건이 빠져 있었습니다. <b>전체 트래픽</b>의 오류율을 재니 4%가 90%의 정상 요청에 묻혀 <b>0.4%</b>로 보였고, 기준 1%를 가볍게 넘겼죠.',
      ],
      callout: { type: 'key', text: '카나리 분석은 <b>카나리만</b> 재야 합니다. 10%의 문제는 전체 평균에서 10분의 1로 희석돼요.' },
      show: ['blue'],
      set: { green: { state: 'hot', badge: '5xx 4%', tone: 'bad' }, e_green: { tone: 'bad', label: '10% → 50%' } },
      tags: [{ on: 'prom', text: '버전 구분 없음', tone: 'bad', icon: 'search', pos: 'bottom' }, { on: 'judge', text: '전체 0.4% → 통과', tone: 'warn', pos: 'left' }],
      flows: [
        { path: ['lb', 'blue'], kind: 'req', n: 5, gap: 0.25 },
        { path: ['lb', 'green'], kind: 'bad', n: 2, delay: 0.4 },
        { path: ['green', 'prom'], kind: 'ctrl', delay: 1.2 },
        { path: ['prom', 'judge'], kind: 'ctrl', delay: 2 },
      ],
      metrics: { rb: ['늦게 자동', 'warn'], blast: ['50%', 'bad'] },
      changes: [['-', '쿼리에 버전 라벨 없음'], ['~', '영향 범위 10% → 50%']],
      more: [
        { title: '증상', list: [
          '분석 결과는 매 단계 "Successful", 그런데 카나리 Pod 로그에는 오류가 가득합니다.',
          '가중치가 올라갈수록 전체 오류율이 0.4% → 2%로 계단처럼 오르다가, 높은 단계에서야 기준을 넘습니다.',
          '같은 쿼리를 Grafana에서 <code>by (track)</code>로 나눠 보면 카나리만 튀어 있습니다.',
        ] },
        { title: '고친 방법', body: [
          '쿼리에 <code>track="canary"</code>를 넣고, 같은 형태로 <code>track="stable"</code>도 재서 <b>둘을 비교</b>하는 조건(카나리 오류율 − 안정 오류율 &lt; 0.5%p)으로 바꿨습니다. 메트릭에 버전 라벨이 붙도록 Pod 템플릿의 라벨이 수집 설정까지 이어지는지도 확인했어요.',
          '또 "요청 수가 n건 미만이면 판단 보류" 지표를 추가해, 표본 없이 통과하는 일도 막았습니다.',
        ] },
        { title: '더 생각해 볼 것', body: ['분석 기준 자체도 코드입니다. 기준을 바꾸는 PR은 일부러 오류를 내는 카나리(예: 일정 비율로 500을 주는 테스트 빌드)를 스테이징에서 돌려, 실제로 중단되는지 확인한 뒤 머지하는 팀도 있어요. 경보 장치는 울려 봐야 믿을 수 있습니다.'] },
      ],
    },
    {
      key: 'DB 스키마', kind: 'case', title: '사례: 롤백했는데 복구되지 않습니다',
      body: [
        'v2는 <code>users.name</code> 컬럼을 <code>full_name</code>으로 바꾸는 마이그레이션과 함께 나갔습니다. 카나리가 뜨며 컬럼 이름이 바뀌자, <b>아직 90%를 받는 v1</b>이 <code>name</code>을 찾다가 전부 오류를 냅니다.',
        '급히 v2를 롤백해도 소용없습니다. 코드는 되돌아가도 <b>DB는 되돌아가지 않으니까요</b>. 롤링·블루그린·카나리 어느 전략이든 두 버전이 한 DB를 함께 쓰는 순간이 있습니다.',
      ],
      callout: { type: 'warn', text: '배포 전략이 되돌려 주는 것은 <b>상태 없는 코드</b>뿐입니다. 스키마 변경은 "구버전과 신버전이 <b>동시에</b> 견딜 수 있는가"로 따져야 해요.' },
      hide: ['judge', 'prom'],
      show: ['users', 'db'],
      set: {
        green: { state: null, badge: null }, blue: { state: 'hot', badge: '컬럼 없음', tone: 'bad' },
        e_green: { tone: 'accent', label: '10%' }, e_blue: { label: '90%' }, e_bdb: { tone: 'bad' },
      },
      tags: [{ on: 'db', text: 'name → full_name', tone: 'bad' }],
      flows: [
        { path: ['lb', 'green', 'db'], kind: 'data' },
        { path: ['lb', 'blue'], kind: 'req', n: 3, delay: 0.6 },
        { path: ['blue', 'db'], kind: 'bad', n: 3, delay: 1.6 },
      ],
      metrics: { down: ['장애 중', 'bad'], rb: ['효과 없음', 'bad'], blast: ['90%', 'bad'] },
      changes: [['-', 'v1이 찾는 컬럼이 사라짐'], ['-', '코드 롤백으로는 복구 불가']],
      more: [
        { title: '증상 → 원인', list: [
          '카나리를 올리자마자 <b>안정 버전</b>의 오류가 튑니다. 카나리 분석은 카나리만 보니 멀쩡하다고 판단할 수도 있어요.',
          '로그: <code>ERROR: column "name" does not exist</code>. 코드가 아니라 스키마가 바뀌었다는 신호입니다.',
          '롤백 후에도 v1 오류가 계속됩니다. 마이그레이션은 배포 전에 한 번 실행됐고, 되돌리는 마이그레이션은 없었어요.',
        ] },
        { title: '그날의 응급 처치', body: [
          '되돌리기(down 마이그레이션)로 컬럼 이름을 다시 바꾸면 이번엔 v2가 깨지고, 그 사이 v2가 쓴 데이터도 꼬일 수 있습니다. 그래서 팀은 <b>앞으로 고치기</b>(roll forward)를 택했어요. 옛 이름의 컬럼을 다시 추가하고 트리거로 두 컬럼을 맞춰, 두 버전이 모두 동작하게 만든 뒤 숨을 돌렸습니다.',
        ] },
        { title: '배포 전 질문 세 가지', list: [
          '이 마이그레이션 뒤에 <b>지금 운영 중인 버전</b>이 그대로 동작하나?',
          '이 배포를 롤백하면 <b>새 스키마 위에서 옛 코드</b>가 동작하나?',
          '큰 테이블을 잠그는 작업(전체 재작성, 잠금이 긴 인덱스 생성)이 섞여 있지 않나?',
        ] },
      ],
    },
    {
      key: '스키마 나누기', kind: 'solution', title: 'expand → contract: 나눠서 바꾸기',
      body: [
        '호환을 깨는 변경은 <b>여러 번의 배포로 쪼갭니다</b>. 먼저 <b>expand</b>: 옛 컬럼은 그대로 두고 새 컬럼을 <b>추가</b>만 해요. 추가는 구버전에 해가 없습니다.',
        '다음 배포에서 코드가 두 컬럼에 함께 쓰고 기존 데이터를 옮긴 뒤, 읽기를 새 컬럼으로 바꿉니다. 옛 컬럼을 쓰는 버전이 <b>하나도 남지 않았을 때</b> 비로소 <b>contract</b>, 곧 삭제합니다.',
      ],
      callout: { type: 'key', text: '각 단계가 <b>바로 앞 버전과 호환</b>되니 언제든 한 단계 롤백할 수 있습니다. 느리지만, 되돌릴 수 없는 순간을 맨 끝의 삭제 하나로 줄여요.' },
      hide: ['users'],
      set: { blue: { state: null, badge: null }, e_bdb: { tone: '' } },
      panel: { title: '컬럼 이름 바꾸기 = 배포 4번', icon: 'steps', rows: [['① expand', 'full_name 추가', 'ok'], ['② 이중 쓰기', '두 컬럼에 쓰고 백필', 'info'], ['③ 전환', 'full_name만 읽기', 'info'], ['④ contract', 'name 삭제', 'warn']] },
      tags: [{ on: 'db', text: 'name + full_name', tone: 'ok' }],
      flows: [
        { path: ['lb', 'blue', 'db'], kind: 'req', n: 3 },
        { path: ['lb', 'green', 'db'], kind: 'data', delay: 0.5 },
      ],
      metrics: { down: ['0', 'ok'], rb: ['단계마다 가능', 'ok'], blast: ['10%', 'ok'] },
      changes: [['+', '새 컬럼 추가 (expand)'], ['~', '삭제는 맨 마지막 배포로']],
      more: [
        { title: '설정 예시', body: ['PostgreSQL 기준으로 단계마다 나가는 마이그레이션입니다. 각 줄은 서로 다른 배포에 실립니다.'], code: { title: 'migrations', lang: 'text', text: '-- ① expand (v2 배포 전)\nALTER TABLE users ADD COLUMN full_name text;\n\n-- ② 백필: 작은 묶음으로 나눠 반복\nUPDATE users SET full_name = name\n WHERE full_name IS NULL\n   AND id BETWEEN 1 AND 10000;\n\n-- ③ 읽기 전환은 코드 배포만 (스키마 변경 없음)\n\n-- ④ contract (옛 코드가 모두 사라진 뒤)\nALTER TABLE users DROP COLUMN name;' } },
        { title: '흔한 실수', list: [
          '백필을 한 문장으로 전체 테이블에 실행: 오래 잠기고 복제 지연이 커집니다. 묶음으로 나누고 사이에 쉬어 갑니다.',
          '큰 테이블에 잠금이 긴 인덱스 생성: PostgreSQL이라면 <code>CREATE INDEX CONCURRENTLY</code>처럼 잠금을 줄이는 방식을 씁니다.',
          '④를 "다음 스프린트에"로 미루다 잊기: 이중 쓰기 코드와 옛 컬럼이 영원히 남습니다. 작업 목록에 날짜와 함께 남기세요.',
        ] },
        { title: '마이그레이션은 언제 돌리나', body: ['흔한 방식은 배포 직전에 별도 작업(쿠버네티스 Job)으로 한 번 돌리는 것입니다. 앱이 뜰 때마다 Pod가 각자 실행하면 여러 Pod가 동시에 같은 마이그레이션을 시도하니 피하세요. GitOps 도구에서는 동기화 전에 도는 훅으로 거는 방법도 있습니다(다음 레슨).'] },
      ],
    },
    {
      key: '기능 플래그', kind: 'concept', title: '기능 플래그: 배포와 출시를 분리',
      body: [
        '<b>배포</b>(deploy)는 코드를 운영에 올리는 것, <b>출시</b>(release)는 사용자에게 기능을 여는 것입니다. <b>기능 플래그</b>는 새 코드를 <code>if (flag)</code> 뒤에 꺼진 채로 배포해 이 둘을 떼어 놓아요.',
        'v2가 100% 배포된 뒤에도 새 결제 화면은 꺼져 있습니다. 플래그를 내부 직원 → 5% → 전체로 켜고, 문제가 생기면 <b>재배포 없이 끄면</b> 됩니다. 되돌리는 데 몇 초면 충분해요.',
      ],
      callout: { type: 'warn', text: '플래그는 <b>빚</b>입니다. 켜고 끄는 조합마다 테스트할 경로가 늘어나니, 출시가 끝난 플래그는 코드에서 지우세요.' },
      hide: ['blue', 'db'],
      show: ['users', 'flag'],
      set: { green: { sub: 'Pod × 4', badge: '새 결제 OFF' }, e_green: { tone: '', label: '100%' } },
      focus: ['flag'],
      tags: [{ on: 'flag', text: '직원 → 5% → 전체', icon: 'sliders', pos: 'bottom' }],
      flows: [
        { path: ['users', 'lb', 'green'], kind: 'data', n: 3 },
        { path: ['flag', 'green'], kind: 'ctrl', delay: 1 },
      ],
      metrics: { cost: '없음', rb: ['플래그 끄기', 'ok'], blast: ['켠 만큼만', 'ok'] },
      changes: [['+', '기능 플래그'], ['~', '출시 = 플래그 켜기'], ['~', '되돌리기 = 플래그 끄기']],
      more: [
        { title: '설정 예시', body: ['코드는 플래그 이름과 사용자 정보만 넘기고, 누구에게 켤지는 설정 서비스가 정합니다.'], code: { title: 'checkout.js', lang: 'text', text: "const on = await flags.isEnabled('new-checkout', {\n  userId: user.id,\n  country: user.country,\n});\nreturn on ? renderNewCheckout() : renderOldCheckout();" } },
        { title: '플래그의 종류', rows: [
          ['출시 플래그', '새 기능을 점진적으로 · 몇 주 뒤 삭제', 'info'],
          ['운영 스위치', '부하 시 무거운 기능 끄기 · 오래 유지', 'warn'],
          ['실험 플래그', 'A/B 테스트 · 결론 나면 삭제', 'info'],
          ['권한 플래그', '요금제별 기능 · 사실상 제품 설정', 'mute'],
        ] },
        { title: '흔한 실수', list: [
          '옛 플래그 이름을 새 기능에 재사용: 2012년 미국의 한 증권사는 오래된 플래그를 다른 용도로 다시 쓰다가, 업데이트가 빠진 서버에서 옛 코드가 깨어나 짧은 시간에 막대한 손실을 냈습니다.',
          '플래그 서비스가 응답하지 않을 때의 기본값을 정하지 않기: 장애 때 모든 플래그가 켜지거나 꺼질 수 있어요. 안전한 쪽을 기본값으로.',
        ] },
      ],
    },
    {
      key: '전략 비교', kind: 'compare', title: '네 전략을 나란히 놓으면',
      body: [
        '정답은 하나가 아닙니다. <b>Recreate</b>는 중단을 감수할 수 있을 때, <b>롤링</b>은 대부분의 일상 배포에, <b>블루그린</b>은 전환과 롤백이 단순해야 할 때, <b>카나리</b>는 사용자가 많아 작은 실수도 비쌀 때 맞습니다.',
        '표의 아래로 갈수록 안전해지지만 <b>필요한 장치</b>도 늘어납니다. 두 벌의 자원, 가중치 라우팅, 버전별 지표, 자동 분석. 팀이 그 장치를 운영할 수 있는지가 선택의 기준이에요.',
      ],
      callout: { type: 'tip', text: '전략은 섞어 씁니다. 블루그린으로 띄운 그린에 카나리처럼 조금씩 트래픽을 옮기기도 하고, 롤링에 플래그를 얹기도 해요.' },
      hide: ['flag'],
      show: ['blue'],
      set: { green: { sub: '카나리', badge: null }, e_green: { tone: 'accent', label: '10%' }, e_blue: { label: '90%' } },
      panel: { title: '전략 비교', icon: 'scale', rows: [['Recreate', '중단 있음 · 추가 자원 0', 'bad'], ['롤링', '무중단 · 롤백 느림', 'info'], ['블루그린', '즉시 롤백 · 자원 2배', 'warn'], ['카나리', '소수만 노출 · 장치 많음', 'ok']] },
      flows: [
        { path: ['users', 'lb'], kind: 'req', n: 4, gap: 0.3 },
        { path: ['lb', 'blue'], kind: 'req', n: 9, gap: 0.22, delay: 1 },
        { path: ['lb', 'green'], kind: 'data', n: 1, delay: 1.8 },
      ],
      metrics: { cost: '전략마다', rb: '전략마다', blast: '전략마다' },
      more: [
        { title: '고르는 질문', list: [
          '몇 분의 중단을 공지로 감당할 수 있나? → 예: Recreate도 후보.',
          '두 버전이 동시에 돌아도 되나(API·스키마·큐 호환)? → 아니오: Recreate, 또는 호환부터 만들기.',
          '버전별 지표와 가중치 라우팅이 있나? → 없으면 카나리는 이름뿐. 롤링 + 플래그부터.',
          '롤백이 몇 초여야 하나, 자원 두 배를 낼 수 있나? → 예: 블루그린.',
        ] },
        { title: '비용 감각', rows: [
          ['Recreate', '자원 +0 · 장치 0 · 중단 있음', 'mute'],
          ['롤링', '자원 +α · 장치: 프로브', 'mute'],
          ['블루그린', '자원 ×2 · 장치: 스위치', 'mute'],
          ['카나리', '자원 +α · 장치: 라우팅·지표·분석', 'mute'],
        ] },
        { title: '실무 팁', body: ['모든 서비스에 같은 전략을 강요할 필요는 없습니다. 결제·로그인처럼 실수가 비싼 핵심 경로에는 카나리와 자동 분석을, 사내 도구와 배치에는 롤링이나 Recreate를 쓰는 식으로 <b>위험에 맞춰</b> 나눕니다.'] },
      ],
    },
    {
      key: '클라우드별', kind: 'compare', title: '클라우드가 제공하는 배포 장치',
      body: [
        '쿠버네티스 밖에서도 같은 전략을 클라우드 서비스로 쓸 수 있습니다. 이름은 달라도 하는 일은 <b>두 벌을 띄우고, 트래픽을 옮기고, 지표로 판단</b>하는 것이에요.',
        'AWS는 <b>CodeDeploy</b>가 ECS·Lambda의 블루그린과 단계적 전환을, Azure는 App Service <b>배포 슬롯</b>이 교체와 비율 분배를, GCP는 <b>Cloud Run</b>이 리비전별 트래픽 분할을 해 줍니다.',
      ],
      callout: { type: 'cloud', text: 'NCP의 NKS 같은 관리형 쿠버네티스 위에서는 앞에서 본 Ingress·Argo Rollouts로 같은 전략을 구현합니다. 쿠버네티스 도구는 어느 클라우드에서나 같게 동작해요.' },
      hide: ['users', 'lb', 'blue', 'green'],
      show: ['cAws', 'cAz', 'cGcp', 'cNcp'],
      panel: { title: '관리형 배포 장치', icon: 'cloud', rows: [['AWS', 'CodeDeploy · ALB 가중치 대상 그룹', 'aws'], ['Azure', 'App Service 배포 슬롯', 'azure'], ['GCP', 'Cloud Run 트래픽 분할 · Cloud Deploy', 'gcp'], ['NCP', 'NKS 위 Ingress · Argo Rollouts', 'ncp']] },
      metrics: { cost: '-', rb: '-', blast: '-' },
      more: [
        { title: '클라우드별로', list: [
          '<b>AWS</b>: ALB 리스너 규칙은 여러 대상 그룹에 가중치를 줄 수 있습니다. CodeDeploy는 ECS 서비스에 대해 블루그린을 하면서 "10% 먼저, n분 뒤 나머지" 같은 전환 설정과 CloudWatch 경보 기반 자동 롤백을 제공해요.',
          '<b>Azure</b>: App Service의 스테이징 슬롯에 새 버전을 올려 데운 뒤 프로덕션과 <b>교체</b>(swap)합니다. 슬롯별 트래픽 비율도 줄 수 있어요. Front Door 같은 전역 LB의 가중치로 리전 단위 전환도 합니다.',
          '<b>GCP</b>: Cloud Run은 배포마다 리비전이 생기고, 리비전별 비율을 바로 지정합니다. Cloud Deploy는 GKE·Cloud Run에 대한 카나리 단계를 파이프라인으로 관리해요.',
          '<b>NCP</b>: NKS 클러스터에 Ingress 컨트롤러와 Argo Rollouts를 올려 이 레슨의 방법을 그대로 씁니다.',
        ] },
        { title: '멀티클라우드에서', body: ['클라우드마다 관리형 장치를 따로 쓰면 전략은 같아도 설정·지표·롤백 방식이 제각각이 됩니다. 여러 클라우드에서 같은 방식으로 배포하고 싶다면 쿠버네티스 위의 공통 도구(Argo Rollouts, Flagger)로 통일하고, 관리형 장치는 쿠버네티스 밖의 서비스에만 쓰는 것이 흔한 절충입니다.'] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 작게 노출하고, 빨리 되돌리기',
      body: [
        '좋은 배포는 두 가지를 줄입니다. 문제가 <b>닿는 범위</b>와 <b>되돌리는 시간</b>. 롤링은 중단을 없애고, 블루그린은 롤백을 스위치 하나로 만들고, 카나리는 노출을 소수로 묶으며 지표가 그 판단을 자동으로 내립니다.',
        '코드 밖의 것도 잊지 마세요. 스키마는 expand → contract로, 출시는 플래그로 나눕니다. 다음 레슨에서는 이 배포를 <b>누가 클러스터에 적용하는지</b>, GitOps를 다룹니다.',
      ],
      hide: ['cAws', 'cAz', 'cGcp', 'cNcp'],
      show: ['users', 'lb', 'blue', 'green'],
      focus: ['lb'],
      flows: [
        { path: ['users', 'lb'], kind: 'req', n: 4, gap: 0.3 },
        { path: ['lb', 'blue'], kind: 'req', n: 9, gap: 0.22, delay: 1 },
        { path: ['lb', 'green'], kind: 'data', n: 1, delay: 1.8 },
      ],
      metrics: { down: ['0', 'ok'], cost: '카나리 몫', rb: ['수 초 · 자동', 'ok'], blast: ['10%', 'ok'] },
    },
  ],
  quiz: [
    {
      q: '단일 인스턴스로 도는 사내 정산 배치가 ReadWriteOnce 볼륨을 씁니다. 롤링 배포를 하자 새 Pod가 볼륨을 붙이지 못하고 대기합니다. 알맞은 전략은?',
      options: ['카나리로 1%씩 옮긴다', '블루그린으로 두 벌을 띄운다', 'Recreate로 옛 Pod를 먼저 내리고 새 Pod를 띄운다', 'maxSurge를 늘린다'],
      answer: 2, step: 1,
      why: '한 번에 하나만 붙을 수 있는 볼륨은 옛 Pod가 놓아야 새 Pod가 쓸 수 있습니다. 잠깐의 중단이 괜찮은 배치라면 Recreate가 가장 단순하고 맞습니다. maxSurge를 늘리면 동시에 뜨는 Pod가 늘어 오히려 더 막힙니다.',
    },
    {
      q: 'Pod 4개로 도는 서비스에서 롤링 배포로 "새 버전에 트래픽 1%만" 먼저 보내고 싶습니다. 왜 어렵나?',
      options: ['롤링에서 트래픽 비율은 새 버전 Pod 수 비율로 정해져 4개면 25% 단위로만 움직여서', '롤링은 readiness 프로브를 쓸 수 없어서', '롤링은 다운타임이 있어서', '롤링은 이미지 태그를 바꿀 수 없어서'],
      answer: 0, step: 2,
      why: '롤링에는 가중치 개념이 없어, 새 Pod 하나가 곧 4분의 1입니다. 1%처럼 세밀한 노출은 라우팅 계층이 가중치를 정하는 카나리가 필요합니다. 프로브와 무중단은 롤링이 잘하는 부분입니다.',
    },
    {
      q: '블루그린으로 그린 전환을 마치자마자 비용을 아끼려고 블루를 삭제했습니다. 무엇을 잃었나요?',
      options: ['무중단 배포', '그린의 성능', '몇 초 만에 되돌릴 수 있는 롤백 경로', '로드 밸런서의 헬스 체크'],
      answer: 2, step: 3,
      why: '블루그린의 가장 큰 장점은 스위치만 돌리면 되는 롤백인데, 그 대상이 바로 살아 있는 블루입니다. 전환 직후가 문제가 드러날 가능성이 가장 높은 때이니, 안정이 확인될 때까지 남겨 두어야 합니다.',
    },
    {
      q: '블루그린 전환을 DNS 레코드 교체로 했더니, 한 시간이 지나도 일부 사용자가 블루로 접속합니다. 원인과 개선 방향은?',
      options: ['그린의 readiness가 실패해서, 프로브를 끈다', '클라이언트와 리졸버가 TTL 동안 옛 주소를 기억해서, 전환을 로드 밸런서나 Service selector에서 한다', '블루가 너무 빨라서, 블루의 Pod를 줄인다', '브라우저 캐시 때문이라 사용자에게 새로고침을 안내한다'],
      answer: 1, step: 4,
      why: 'DNS는 캐시되는 구조라 "한 번에" 바뀌지 않습니다. 전환은 우리가 직접 쥔 계층(LB 대상, Service selector)에서 해야 몇 초 안에 끝나고 되돌리기도 확실합니다.',
    },
    {
      q: '카나리 단계를 "10% → 30분 → 50% → 30분 → 100%"로만 정해 두고, 그 사이에 볼 기준은 없습니다. 이 구성의 문제는?',
      options: ['30분이 너무 길다', '50% 단계가 불필요하다', '시간만 지나면 넘어가니, 문제가 있어도 멈출 근거가 없어 천천히 하는 롤링과 같다', '카나리는 원래 기준 없이 쓰는 방법이다'],
      answer: 2, step: 5,
      why: '카나리의 가치는 작은 노출 중에 지표로 판단해 멈추는 데 있습니다. 넘어가는 조건(오류율, 지연, 최소 표본)이 없으면 결국 전원에게 퍼집니다. 시간 길이나 단계 수는 부차적인 문제입니다.',
    },
    {
      q: '카나리 가중치를 HTTPRoute에서 90/10으로 줬는데, 클러스터 안의 주문 서비스가 shop-api를 부를 때는 v2가 절반쯤 응답합니다. 가장 그럴듯한 이유는?',
      options: ['주문 서비스가 Service 이름으로 직접 불러 Gateway 가중치를 거치지 않고 Pod 수 비율로 나뉘어서', 'HTTPRoute의 weight는 합이 100이 아니면 무시돼서', 'v2의 readiness가 실패해서', '헤더 조건이 모든 요청에 걸려서'],
      answer: 0, step: 6,
      why: '가중치는 그 라우팅 계층을 지나는 트래픽에만 적용됩니다. 내부 호출이 Service로 바로 가면 v1·v2 Pod 수 비율대로 나뉩니다. 내부 트래픽까지 제어하려면 서비스 메시 같은 계층이 필요합니다. weight는 상대값이라 합이 100일 필요가 없습니다.',
    },
    {
      q: '카나리 1% 단계에서 5분 동안 요청이 12건 들어왔고 오류는 0건이었습니다. 바로 100%로 올려도 될까요?',
      options: ['오류율 0%이므로 올려도 된다', '카나리는 시간만 채우면 되므로 5분이면 충분하다', '오류가 없으니 카나리를 건너뛰고 Recreate로 바꾼다', '표본이 너무 적어 판단할 수 없으니, 더 기다리거나 비율을 조금 올려 표본을 모은다'],
      answer: 3, step: 7,
      why: '12건에서 오류가 없다는 것은 실제 오류율이 낮다는 근거가 되기 어렵습니다. 지표 기반 판단은 충분한 표본이 있을 때만 의미가 있어요. 그래서 단계마다 최소 요청 수나 관찰 시간을 기준에 함께 넣습니다.',
    },
    {
      q: '분석 중 Prometheus가 몇 분간 응답하지 않았는데 카나리가 다음 단계로 넘어갔습니다. 분석 설정에서 먼저 고칠 것은?',
      options: ['분석 간격을 늘린다', '지표 조회 실패를 통과가 아니라 실패(또는 판단 보류)로 다루게 한다', '카나리 가중치를 높인다', 'Prometheus를 두 대로 늘리기만 한다'],
      answer: 1, step: 8,
      why: '판단 근거가 없을 때 통과시키면 자동 분석이 가장 필요한 순간에 무력해집니다. 조회 실패는 안전한 쪽(중단·보류)으로 다뤄야 합니다. Prometheus 이중화도 좋지만, 실패 처리 규칙이 먼저입니다.',
    },
    {
      q: '카나리 분석이 매 단계 통과했는데, 50% 단계에서야 장애가 드러났습니다. 카나리 Pod 로그에는 처음부터 오류가 많았습니다. 먼저 확인할 것은?',
      options: ['분석 쿼리가 카나리 트래픽만 따로 재고 있는지', '카나리 Pod의 CPU limit', 'HTTPRoute의 parentRefs', '이미지 태그 형식'],
      answer: 0, step: 9,
      why: '버전 구분 없이 전체 오류율을 재면 10% 카나리의 문제가 10분의 1로 희석됩니다. 쿼리에 버전 라벨 조건을 넣고 안정 버전과 비교해야 합니다. CPU나 태그 형식은 "통과했는데 오류"라는 증상을 설명하지 못합니다.',
    },
    {
      q: '컬럼 이름을 바꾸는 마이그레이션과 함께 카나리를 시작하자 안정 버전 v1에서 오류가 쏟아집니다. v2를 롤백했는데도 그대로입니다. 지금 가장 현실적인 조치는?',
      options: ['DB를 어제 백업으로 복원한다', 'v1도 함께 삭제한다', '옛 이름의 컬럼을 다시 추가하고 두 컬럼을 맞춰 두 버전이 모두 동작하게 하는 앞으로 고치기를 한다', '카나리 가중치를 100%로 올린다'],
      answer: 2, step: 10,
      why: '코드 롤백은 DB를 되돌리지 않습니다. 백업 복원은 그 사이 데이터를 잃고, 100%로 올리면 v1 문제는 사라져도 검증 안 된 v2가 전원에게 갑니다. 호환 컬럼을 되살려 두 버전을 모두 살리는 것이 피해가 가장 작습니다.',
    },
    {
      q: 'orders.price 컬럼을 금액·통화 두 컬럼으로 나누려 합니다. 무중단 배포를 지키는 첫 배포에 들어갈 내용은?',
      options: ['price 삭제와 새 두 컬럼 추가를 한 번에', '새 두 컬럼만 추가하고 price는 그대로 둔다', 'price의 이름을 amount로 바꾼다', '테이블을 새로 만들고 앱을 그쪽으로 바로 돌린다'],
      answer: 1, step: 11,
      why: 'expand 단계는 추가만 해서 지금 도는 버전에 영향이 없게 합니다. 이후 이중 쓰기·백필·읽기 전환을 거쳐 옛 컬럼을 쓰는 버전이 사라졌을 때 삭제합니다. 이름 변경이나 삭제를 먼저 하면 구버전이 즉시 깨집니다.',
    },
    {
      q: '새 결제 화면을 금요일 마케팅 행사에 맞춰 공개해야 합니다. 개발은 화요일에 끝납니다. 가장 안전한 방법은?',
      options: ['금요일 아침에 배포한다', '목요일 밤에 배포하고 기도한다', '브랜치에 묵혀 두었다가 금요일에 머지한다', '화요일에 플래그를 끈 채 배포해 두고, 금요일에 플래그를 켜서 출시한다'],
      answer: 3, step: 12,
      why: '배포와 출시를 나누면 위험한 배포는 여유 있는 화요일에 끝내고, 금요일에는 설정만 바꿉니다. 문제가 생기면 재배포 없이 끄면 됩니다. 행사 당일 배포나 브랜치에 묵히기는 위험을 가장 바쁜 순간에 몰아넣습니다.',
    },
    {
      q: '스타트업 팀입니다. 서비스 메시도, 버전별 지표도 아직 없고, 하루에 여러 번 배포합니다. 지금 가장 현실적인 기본 전략은?',
      options: ['롤링 업데이트에 기능 플래그를 더한다', '모든 서비스를 카나리로 바꾼다', '블루그린으로 항상 두 벌을 유지한다', 'Recreate로 단순하게 간다'],
      answer: 0, step: 13,
      why: '장치 없는 카나리는 이름뿐이고, 블루그린은 자원이 두 배입니다. 롤링은 무중단을 주고, 위험한 기능의 노출은 플래그로 조절할 수 있어 지금의 팀에 맞습니다. 하루 여러 번 배포하면서 Recreate는 잦은 중단을 부릅니다.',
    },
    {
      q: 'AWS의 ECS, GCP의 Cloud Run, 그리고 NCP의 NKS에 같은 서비스를 배포합니다. 세 곳에서 카나리 방식과 롤백 기준을 같게 유지하려면?',
      options: ['각 클라우드의 관리형 배포 기능을 각자 설정하고 문서로 맞춘다', '카나리를 포기하고 모두 Recreate로 바꾼다', '가능하면 쿠버네티스 위로 모아 Argo Rollouts 같은 공통 도구로 통일한다', 'NCP만 카나리를 하고 나머지는 블루그린으로 한다'],
      answer: 2, step: 14,
      why: '관리형 기능은 클라우드마다 설정과 롤백 방식이 달라 기준이 쉽게 어긋납니다. 공통 플랫폼과 도구로 모으면 같은 정의를 어디서나 씁니다. 관리형 장치는 쿠버네티스 밖에 남는 서비스에 쓰는 절충이 흔합니다.',
    },
  ],
};
