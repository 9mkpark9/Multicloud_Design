export default {
  id: 'scheduling-scaling',
  learn: [
    'requests: 스케줄러가 자리를 고를 때 보는 숫자와 QoS 등급',
    '필터링과 점수 매기기로 노드가 정해지는 과정',
    'limits: CPU 스로틀링과 OOMKilled의 차이',
    'taint · toleration · affinity · topology spread로 배치 다듬기',
    'HPA가 Pod 수를 계산하는 방법과 behavior로 속도 조절하기',
    'Pending Pod와 Cluster Autoscaler · Karpenter',
  ],
  legend: [['ctrl', '스케줄링 · 제어'], ['data', '메트릭']],
  metrics: [
    { id: 'busy', label: '노드 A CPU', icon: 'cpu' },
    { id: 'rep', label: 'api Pod 수', icon: 'boxes' },
    { id: 'pend', label: 'Pending Pod', icon: 'hourglass' },
    { id: 'nodes', label: '노드 수', icon: 'server' },
    { id: 'p99', label: 'api p99 지연', icon: 'timer' },
  ],
  scene: {
    zones: {
      nA: { at: [0, 0], size: [3, 3], label: '노드 A', color: 'blue' },
      nB: { at: [3.3, 0], size: [3, 3], label: '노드 B', color: 'blue' },
      nC: { at: [0, 3.6], size: [3, 3], label: '노드 C', color: 'blue' },
      nD: { at: [3.3, 3.6], size: [3, 3], label: '노드 D (새 노드)', color: 'green' },
    },
    nodes: {
      sched: { at: [1.6, -2.2], label: '스케줄러', sub: '컨트롤 플레인', icon: 'signpost', color: 'red' },
      a1: { at: [0.8, 0.7], size: 's', label: 'batch', icon: 'box', color: 'orange' },
      a2: { at: [2.1, 0.7], size: 's', label: 'api', icon: 'box', color: 'teal' },
      rd: { at: [0.8, 2.0], size: 's', label: 'redis', icon: 'database', color: 'red' },
      dbg: { at: [2.1, 2.0], size: 's', label: 'debug', icon: 'terminal', color: 'gray' },
      b1: { at: [5.4, 0.7], size: 's', label: 'ml', icon: 'box', color: 'purple' },
      b2: { at: [4.1, 0.7], size: 's', label: 'api', icon: 'box', color: 'teal' },
      c1: { at: [0.8, 4.3], size: 's', label: 'api', icon: 'box', color: 'teal' },
      c2: { at: [2.1, 4.3], size: 's', label: 'api', icon: 'box', color: 'teal' },
      c3: { at: [0.8, 5.6], size: 's', label: 'api', icon: 'box', color: 'teal' },
      d1: { at: [4.1, 4.3], size: 's', label: 'api', icon: 'box', color: 'teal' },
      d2: { at: [5.4, 4.3], size: 's', label: 'api', icon: 'box', color: 'teal' },
      ms: { at: [-2.0, 0.4], label: 'metrics-\nserver', icon: 'gauge', color: 'slate' },
      hpa: { at: [-2.0, 3.0], label: 'HPA', sub: '오토스케일러', icon: 'scale', color: 'yellow' },
      dep: { kind: 'tile', at: [-2.0, 5.6], label: 'Deployment api', icon: 'layers', color: 'teal' },
      ca: { at: [8.0, 3.0], label: 'Cluster\nAutoscaler', icon: 'server-cog', color: 'green' },
      karp: { at: [8.0, 0.4], label: 'Karpenter', sub: 'NodePool', icon: 'sparkles', color: 'orange' },
    },
    edges: {
      e_a: { from: 'sched', to: 'a2', style: 'dashed', off: true },
      e_b: { from: 'sched', to: 'b2', off: true },
      e_m: { from: 'ms', to: 'hpa' },
      e_s: { from: 'hpa', to: 'dep' },
      e_ca: { from: 'ca', to: [6.5, 5.1], style: 'dashed' },
      e_k: { from: 'karp', to: [6.5, 4.0], style: 'dashed' },
    },
  },
  codes: {
    deploy: {
      title: 'api-deployment.yaml', lang: 'yaml',
      text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: shop/api:1.4
          resources:
            requests:        # 예약 (최소 보장)
              cpu: 500m
              memory: 256Mi
            limits:          # 넘지 못하는 상한
              cpu: "1"
              memory: 512Mi
`,
    },
  },
  steps: [
    // 1
    {
      key: '어느 노드로', kind: 'problem', title: '새 Pod는 어느 노드로 갈까요?',
      body: [
        'shop.example의 <code>api</code> Deployment를 2개에서 3개로 늘렸습니다. 새 Pod를 어느 노드에 둘지는 컨트롤 플레인의 <b>스케줄러</b>(kube-scheduler)가 정합니다.',
        '그런데 스케줄러는 노드의 <b>실제 사용량을 보지 않습니다</b>. Pod가 "이만큼 쓰겠다"고 적어 낸 예약량(<code>requests</code>)만 봅니다. 아무도 적지 않았으니 Pod가 하나뿐인 노드 A가 가장 한가해 보였고, 실제로는 CPU 92%인 그곳에 새 Pod가 놓였습니다.',
      ],
      callout: { type: 'warn', text: 'requests를 비워 두면 스케줄러는 눈을 가린 채 자리를 고릅니다. 부하가 한 노드에 몰려도 알 길이 없어요.' },
      show: ['nA', 'nB', 'nC', 'sched', 'a1', 'a2', 'b1', 'c1', 'c2', 'e_a'],
      focus: ['a2'],
      tags: [
        { at: [0, 0], text: '실제 CPU 92%', tone: 'warn', icon: 'flame', dy: -30 },
        { on: 'a2', text: '새 Pod', icon: 'plus', pos: 'right' },
        { on: 'sched', text: 'requests만 봄', icon: 'eye', pos: 'right' },
      ],
      flows: [{ path: ['sched', 'a2'], kind: 'ctrl', n: 2 }],
      metrics: { busy: ['92%', 'warn'], rep: '3', pend: '0', nodes: '3', p99: '180ms' },
      more: [
        { title: '동작 원리', body: [
          '스케줄러는 API 서버를 지켜보다가 <code>spec.nodeName</code>이 비어 있는 Pod를 큐에 넣고, 하나씩 꺼내 노드를 고른 뒤 그 결과(binding)를 API 서버에 기록합니다. 실제로 컨테이너를 띄우는 것은 그 노드의 kubelet입니다.',
          '고를 때 쓰는 정보는 노드 객체의 <b>allocatable</b>과, 그 노드에 이미 배정된 Pod들의 requests 합계입니다. 실시간 CPU 사용률은 metrics-server 쪽 정보라 기본 스케줄러는 참고하지 않아요. 그래서 requests가 0인 Pod만 사는 노드는, 실제로 불타고 있어도 "비어 있는 노드"로 보입니다.',
        ] },
        { title: '직접 해보기', body: ['Pod가 어디에 놓였는지, 스케줄러 눈에 노드가 얼마나 찼는지를 따로 봅니다.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl get pod -l app=api -o wide
NAME          READY  STATUS   NODE
api-7d9-k2x   1/1    Running  node-a
api-7d9-m4q   1/1    Running  node-c
api-7d9-r7t   1/1    Running  node-a

$ kubectl describe node node-a
Allocated resources:
  Resource  Requests    Limits
  cpu       100m (5%)   0 (0%)
  memory    70Mi (1%)   170Mi (2%)

$ kubectl top node node-a
NAME    CPU(cores)  CPU%  MEMORY%
node-a  1750m       92%   61%` } },
        { title: '출력 읽기', list: [
          '<code>describe node</code>의 Requests 5%는 kube-proxy · CNI 같은 시스템 Pod 몫뿐입니다. 스케줄러에게 노드 A는 95% 비어 있어요.',
          '<code>top node</code>의 92%가 실제 사용량입니다. 두 숫자의 차이가 크면 requests가 비었거나 너무 작게 잡힌 Pod가 있다는 신호예요.',
        ] },
      ],
    },
    // 2
    {
      key: '서로 굶김', kind: 'case', title: '사례: 같은 노드에서 서로 굶깁니다',
      body: [
        '노드 A의 <code>batch</code>는 월말 정산을 돌리며 CPU를 있는 대로 끌어다 씁니다. 같은 노드의 api Pod는 제 몫을 보장받지 못해 응답이 몇 초씩 밀립니다. 노드 C의 api는 멀쩡해서, 요청 셋 중 하나만 느린 알쏭달쏭한 장애가 됩니다.',
        '메모리는 더 거칩니다. 노드 메모리가 바닥나면 kubelet이 Pod를 <b>쫓아내는데(eviction)</b>, requests를 적지 않은 Pod가 가장 먼저 대상이 됩니다.',
      ],
      callout: { type: 'key', text: 'CPU가 모자라면 느려지고, 메모리가 모자라면 쫓겨납니다. 둘 다 requests가 없는 Pod가 가장 먼저 손해를 봐요.' },
      hide: ['e_a'],
      set: { a1: { state: 'hot' }, a2: { state: 'down', badge: 'Evicted', tone: 'bad' } },
      tags: [
        { at: [0, 0], text: '노드 CPU 100%', tone: 'bad', icon: 'flame', dy: -30 },
        { on: 'a1', text: 'CPU 독식', tone: 'bad', pos: 'left' },
        { on: 'c2', text: '여기는 정상', tone: 'ok', pos: 'bottom' },
      ],
      metrics: { busy: ['100%', 'bad'], rep: ['2 / 3', 'bad'], p99: ['2.4s', 'bad'] },
      changes: [['~', '노드 A CPU 92% → 100%'], ['-', 'A의 api: 지연 끝에 Evicted'], ['~', '노드 B · C는 여전히 한가함']],
      more: [
        { title: '동작 원리', body: [
          'CPU는 <b>압축 가능한</b> 자원입니다. 모자라면 리눅스 CFS가 각 컨테이너의 가중치(requests에서 계산)대로 시간을 나눌 뿐 누구도 죽지 않아요. requests가 없는 컨테이너는 가중치가 최솟값이라, 경합이 생기면 거의 시간을 받지 못합니다. 그래서 증상이 "에러"가 아니라 "가끔 몇 초씩 느림"으로 나타납니다.',
          '메모리는 <b>압축할 수 없는</b> 자원입니다. kubelet은 노드의 남은 메모리가 기준치(eviction threshold) 아래로 내려가면 노드에 <code>MemoryPressure</code>를 표시하고 Pod를 골라 쫓아냅니다. 순서는 대략 ① requests보다 많이 쓰고 있는 Pod, ② 우선순위(PriorityClass)가 낮은 Pod, ③ requests 대비 초과량이 큰 Pod 순이에요.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get pod api-7d9-r7t
NAME         READY  STATUS   RESTARTS
api-7d9-r7t  0/1    Evicted  0

$ kubectl describe pod api-7d9-r7t
Status:   Failed
Reason:   Evicted
Message:  The node was low on resource: memory.

$ kubectl describe node node-a | grep Pressure
  MemoryPressure  True   KubeletHasInsufficientMemory` } },
        { title: '흔한 실수', list: [
          'Evicted Pod는 지워지지 않고 <code>Failed</code> 상태로 남습니다. Deployment는 새 Pod를 만들어 개수를 맞추니, 목록에 쌓인 Evicted는 원인을 확인한 뒤 정리하면 됩니다.',
          'CPU 경합은 Evicted로 드러나지 않습니다. "노드마다 지연이 다르다"는 신호가 보이면 노드별 CPU와 그 위의 Pod들을 함께 보세요.',
        ] },
      ],
    },
    // 3
    {
      key: 'requests', kind: 'solution', title: 'requests: 스케줄러에게 하는 예약',
      body: [
        '컨테이너마다 <code>resources.requests</code>에 평소 필요한 양을 적습니다. <code>cpu: 500m</code>은 0.5코어(1000m = 1코어), <code>memory: 256Mi</code>는 256메비바이트입니다.',
        '스케줄러는 노드의 <b>할당 가능량(allocatable)</b>에서 이미 예약된 합계를 뺀 자리에 새 요청이 들어가는 노드만 고릅니다. 2 vCPU 노드도 시스템 몫을 빼면 1900m쯤이라, batch 1000m과 api 500m이 놓인 노드 A에는 400m만 남습니다.',
      ],
      callout: { type: 'tip', text: 'requests는 <b>보장되는 몫</b>이기도 합니다. 노드가 붐비면 CPU는 requests 비율대로 나뉩니다. 값은 짐작하지 말고 실제 사용량을 보고 정하세요.' },
      hide: ['nB', 'nC', 'sched', 'b1', 'c1', 'c2'],
      set: { a1: { state: null, badge: '1000m', tone: 'info' }, a2: { state: null, badge: '500m', tone: 'info' }, nA: { label: '노드 A · 1900m' } },
      tags: [{ at: [3, 3], text: '예약 1500m · 남은 400m', tone: 'accent', dy: 26 }],
      code: { ref: 'deploy', hl: [16, 17, 18, 19] },
      metrics: { busy: ['71%', 'ok'], rep: '3', p99: ['190ms', 'ok'] },
      changes: [['+', 'batch requests 1000m'], ['+', 'api requests 500m'], ['~', '노드 A 남은 자리 400m']],
      more: [
        { title: '동작 원리', body: [
          '노드의 allocatable은 <code>capacity − kube-reserved − system-reserved − eviction 기준치</code>입니다. kubelet · 컨테이너 런타임 · OS가 쓸 몫을 미리 떼어 두는 것이라, 관리형 서비스는 노드 크기에 따라 이 값을 자동으로 정해 둡니다. 큰 노드일수록 떼는 비율이 작아집니다.',
          '스케줄러가 비교하는 것은 "allocatable − 그 노드 Pod들의 requests 합계 ≥ 새 Pod의 requests"입니다. 여러 컨테이너가 있는 Pod는 컨테이너 requests의 합으로 계산해요.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl describe node node-a \\
    | grep -A3 -E '^(Capacity|Allocatable)'
Capacity:
  cpu:     2
  memory:  8053980Ki
Allocatable:
  cpu:     1930m
  memory:  7310044Ki

$ kubectl top pod -l app=api --containers
POD          NAME  CPU(cores)  MEMORY(bytes)
api-7d9-k2x  api   310m        198Mi
api-7d9-m4q  api   420m        205Mi` } },
        { title: '흔한 실수', list: [
          '<code>memory: 256m</code>은 256밀리바이트, 즉 0.256바이트입니다. 메모리는 <code>Mi</code> · <code>Gi</code>로 적으세요. <code>M</code>(10의 6제곱)과 <code>Mi</code>(2의 20제곱)도 다릅니다.',
          'requests를 넉넉히 잡을수록 안전해 보이지만, 노드가 실제로는 놀고 있는데 "자리가 없다"며 노드만 늘어납니다. 바쁜 시간대 사용량에 약간의 여유를 더한 값이 출발점입니다.',
          '네임스페이스마다 <b>LimitRange</b>로 기본값을, <b>ResourceQuota</b>로 총량을 걸어 두면 비워 둔 Pod가 생기지 않습니다.',
        ] },
      ],
    },
    // 4
    {
      key: 'QoS 등급', kind: 'concept', title: 'requests와 limits가 정하는 QoS 등급',
      body: [
        'Kubernetes는 requests · limits를 적은 모양을 보고 Pod마다 <b>QoS 등급</b>을 매깁니다. 모든 컨테이너가 CPU · 메모리 모두 requests = limits면 <b>Guaranteed</b>, 하나라도 적었지만 그 조건이 아니면 <b>Burstable</b>, 아무것도 없으면 <b>BestEffort</b>입니다.',
        '노드 메모리가 모자랄 때 누가 먼저 밀려나는지가 이 등급으로 갈립니다. 같은 노드 A에 redis, api, 디버그용 Pod를 함께 올려 비교해 봅니다.',
      ],
      callout: { type: 'key', text: '확인은 <code>kubectl get pod -o jsonpath=\'{.status.qosClass}\'</code>. 꼭 살아 있어야 하는 Pod는 Guaranteed로 두세요.' },
      show: ['nB', 'nC', 'b1', 'c1', 'c2', 'rd', 'dbg'],
      set: {
        nA: { label: '노드 A' },
        a1: { badge: null },
        a2: { badge: null },

      },
      focus: ['dbg'],
      tags: [
        { on: 'rd', text: 'Guaranteed', tone: 'ok', pos: 'left' },
        { on: 'dbg', text: 'BestEffort · 1순위', tone: 'warn', icon: 'arrow-down', pos: 'bottom' },
        { on: 'a2', text: '나머지: Burstable', tone: 'info', pos: 'right' },
      ],
      panel: { title: 'QoS 등급', icon: 'layers', rows: [['Guaranteed', 'req = lim · 가장 늦게', 'ok'], ['Burstable', 'req < lim · 중간', 'info'], ['BestEffort', '아무것도 없음 · 먼저', 'warn']] },
      changes: [['+', 'redis: requests = limits'], ['+', 'debug: 아무것도 없음'], ['~', '쫓겨나는 순서가 정해짐']],
      more: [
        { title: '동작 원리', body: [
          '등급은 Pod 안의 <b>모든 컨테이너</b>를 보고 정합니다. 컨테이너 하나라도 limits가 빠지면 Guaranteed가 아니에요. limits만 적고 requests를 비우면 requests가 limits와 같은 값으로 채워지므로 Guaranteed가 됩니다.',
          '등급은 커널의 OOM 점수에도 반영됩니다. Guaranteed 컨테이너는 노드 전체가 메모리 부족일 때 커널이 가장 나중에 고르고, BestEffort는 가장 먼저 고릅니다. Burstable은 requests를 얼마나 크게 잡았는지에 따라 그 사이에 놓입니다.',
        ] },
        { title: '설정 예시', body: ['redis처럼 한 번 죽으면 복구가 비싼 Pod는 두 값을 같게 적습니다.'], code: { title: 'redis 컨테이너', lang: 'yaml', text: `resources:
  requests: { cpu: 500m, memory: 1Gi }
  limits:   { cpu: 500m, memory: 1Gi }
# → status.qosClass: Guaranteed` } },
        { title: '실무 팁', list: [
          'QoS는 "메모리가 모자랄 때 누구를 먼저 내보내나"이고, <b>PriorityClass</b>는 "자리가 없을 때 누구를 먼저 앉히나"입니다. 우선순위가 높은 Pod가 Pending이면 스케줄러가 낮은 Pod를 밀어내고(preemption) 자리를 만듭니다.',
          'DB · 메시지 큐 · 모니터링 에이전트는 Guaranteed, 일반 웹 서버는 Burstable이 흔한 조합입니다. BestEffort는 언제 사라져도 되는 실험용으로만 쓰세요.',
        ] },
      ],
    },
    // 5
    {
      key: '필터 · 점수', kind: 'concept', title: '스케줄러는 거르고, 점수를 매깁니다',
      body: [
        'api를 4개로 늘립니다. 스케줄러는 먼저 <b>필터링</b>으로 안 되는 노드를 뺍니다. 새 Pod는 500m을 요청하는데 노드 A는 400m만 남아 탈락입니다. taint나 nodeSelector가 맞지 않는 노드도 여기서 걸러집니다.',
        '남은 노드에는 <b>점수</b>를 매깁니다. 자원이 고르게 남는지, 같은 앱의 Pod가 흩어지는지 등을 봅니다. B와 C는 남은 자리가 같지만 C에는 이미 api가 둘 있어, B가 더 높은 점수를 받습니다(그림의 점수는 예시).',
      ],
      callout: { type: 'key', text: '통과한 노드가 하나도 없으면 Pod는 <b>Pending</b>으로 남습니다. 이유는 <code>kubectl describe pod</code>의 Events에 적혀 있어요.' },
      hide: ['rd', 'dbg'],
      show: ['sched', 'b2', 'e_b'],
      focus: ['b2'],
      tags: [
        { at: [0, 0], text: '남은 400m · 탈락', tone: 'bad', icon: 'x', dy: -30 },
        { at: [5.6, -1.2], text: '남은 900m · 86점', tone: 'ok', icon: 'check' },
        { at: [-0.9, 5.0], text: '남은 900m · 71점' },
      ],
      flows: [{ path: ['sched', 'b2'], kind: 'ctrl', n: 2 }],
      metrics: { rep: '4' },
      changes: [['+', '네 번째 api Pod → 노드 B'], ['~', '노드 A는 필터링에서 탈락']],
      more: [
        { title: '동작 원리', body: [
          '스케줄러는 플러그인 묶음입니다. <b>Filter</b> 단계에서는 NodeResourcesFit(자리), TaintToleration, NodeAffinity, PodTopologySpread, VolumeBinding 같은 플러그인이 노드마다 통과 · 탈락을 냅니다. 하나라도 탈락이면 그 노드는 후보에서 빠져요.',
          '<b>Score</b> 단계에서는 플러그인마다 0–100점을 매기고 가중치를 곱해 더합니다. 기본으로 "덜 찬 노드", "CPU와 메모리가 고르게 남는 노드", "이미지가 이미 받아져 있는 노드", "같은 앱이 덜 몰린 노드"를 선호해요. 최고점 노드가 정해지면 binding을 기록합니다. 노드가 아주 많은 클러스터에서는 일부 노드만 표본으로 점수를 매겨 속도를 냅니다.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get events --field-selector \\
    involvedObject.name=api-7d9-w5n
REASON     MESSAGE
Scheduled  Successfully assigned shop/api-7d9-w5n
           to node-b` } },
        { title: '더 생각해 볼 것', list: [
          '필터는 "가능한가", 점수는 "어디가 더 나은가"입니다. 그래서 필수 조건은 필터로(required, taint), 바람은 점수로(preferred) 표현합니다.',
          '스케줄러는 한 번 놓은 Pod를 다시 옮기지 않습니다. 시간이 지나 배치가 한쪽으로 쏠리면 Pod를 새로 만들게 하거나(롤아웃), descheduler 같은 별도 도구를 씁니다.',
        ] },
      ],
    },
    // 6
    {
      key: 'limits', kind: 'concept', title: 'limits: 메모리 상한을 넘으면 죽습니다',
      body: [
        '<b>limits</b>는 컨테이너가 넘지 못하는 상한입니다. 닿았을 때 벌어지는 일은 자원마다 다릅니다. 메모리는 나눌 수 없어서, limit을 넘는 순간 커널이 프로세스를 죽이고 <code>OOMKilled</code>(종료 코드 137)가 남습니다.',
        'kubelet이 컨테이너를 다시 띄우지만 원인이 그대로면 재시작만 반복되고, 간격이 점점 길어지는 <code>CrashLoopBackOff</code>에 빠집니다. 노드 C의 api 하나가 그렇게 됐습니다.',
      ],
      callout: { type: 'warn', text: '메모리 limit은 꼭 적으세요. 없으면 누수 하나가 노드 전체 메모리를 먹고, 같은 노드의 다른 Pod까지 쫓겨나게 만듭니다.' },
      hide: ['nA', 'nB', 'sched', 'a1', 'a2', 'b1', 'b2', 'e_b'],
      set: { c2: { state: 'down', badge: 'OOMKilled', tone: 'bad' } },
      focus: ['c2'],
      code: {
        title: 'OOMKilled 확인하기', lang: 'sh', hl: [4, 8, 9],
        text: `$ kubectl get pod -l app=api
NAME         READY  STATUS     RESTARTS
api-7d9-k2x  1/1    Running    0
api-7d9-p8w  0/1    OOMKilled  3

$ kubectl describe pod api-7d9-p8w
  Last State:  Terminated
    Reason:    OOMKilled
    Exit Code: 137
  Limits:
    cpu:     1
    memory:  512Mi
`,
      },
      metrics: { rep: ['3 / 4', 'warn'] },
      more: [
        { title: '동작 원리', body: [
          '메모리 limit은 컨테이너 cgroup의 메모리 상한(<code>memory.max</code>)이 됩니다. 프로세스가 이를 넘기려 하면 커널 OOM killer가 그 cgroup 안에서 프로세스를 골라 SIGKILL을 보냅니다. 137 = 128 + 9(SIGKILL)라서 종료 코드가 137이에요.',
          '이것은 2단계의 Evicted와 다릅니다. OOMKilled는 <b>컨테이너가 자기 상한을 넘긴 것</b>이고 같은 Pod가 그 자리에서 재시작됩니다. Evicted는 <b>노드 전체가 모자라</b> kubelet이 Pod를 내보낸 것이고, 새 Pod가 다른 곳에 만들어집니다.',
        ] },
        { title: '직접 해보기', body: ['죽기 직전의 로그는 이전 컨테이너에 남아 있습니다.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl logs api-7d9-p8w --previous | tail -3
$ kubectl top pod api-7d9-p8w
NAME         CPU(cores)  MEMORY(bytes)
api-7d9-p8w  220m        497Mi` } },
        { title: '흔한 실수', list: [
          'JVM · Node.js는 런타임이 쓰는 힙 상한을 limit보다 작게 맞춰야 합니다. 예: JVM은 <code>-XX:MaxRAMPercentage=75</code>, Node.js는 <code>--max-old-space-size</code>. 힙이 limit과 같으면 힙 바깥 메모리 때문에 죽습니다.',
          '사용량이 계속 우상향하면 누수, 높지만 평평하면 limit이 작은 것입니다. 원인을 가리기 전에 limit만 올리면 같은 장애가 더 늦게 옵니다.',
          'requests를 limits보다 크게 적을 수는 없습니다. API 서버가 거절해요.',
        ] },
      ],
    },
    // 7
    {
      key: '스로틀링', kind: 'case', title: '사례: 노드는 한가한데 api가 느립니다',
      body: [
        'p99 지연이 1.8초로 튀는데 노드 CPU는 35%뿐입니다. 범인은 <b>CPU 스로틀링</b>입니다. CPU limit <code>1</code>은 "0.1초마다 CPU 시간 0.1초까지"라는 뜻이라, 스레드 4개가 동시에 일하면 25ms 만에 몫을 다 쓰고 남은 75ms를 멈춰 기다립니다.',
        '평균 사용률은 낮아도 순간 순간 상한에 부딪히는 것이죠. limit을 올리거나 없애고, 런타임의 스레드 수를 limit에 맞추면 지연이 돌아옵니다.',
      ],
      callout: { type: 'tip', text: 'requests를 정확히 적었다면 CPU limit은 넉넉히 두거나 비워 두는 팀이 많습니다. 경합이 생겨도 requests 비율만큼은 보장되니까요.' },
      set: { c2: { state: null, badge: null }, c1: { state: 'hot', badge: '스로틀링', tone: 'warn' } },
      focus: ['c1'],
      tags: [{ at: [3, 6.6], text: '노드 CPU 35%', tone: 'ok', dy: 26 }],
      code: {
        title: '스로틀링 확인하기', lang: 'sh', hl: [3, 6, 7],
        text: `$ kubectl exec api-7d9-k2x -- \\
    cat /sys/fs/cgroup/cpu.max
100000 100000
$ kubectl exec api-7d9-k2x -- \\
    cat /sys/fs/cgroup/cpu.stat
nr_periods 81240
nr_throttled 23377
throttled_usec 912004118
`,
      },
      metrics: { rep: '4', p99: ['1.8s', 'bad'] },
      changes: [['~', 'p99 190ms → 1.8s'], ['~', '노드 CPU는 35%'], ['+', '원인: CPU limit 스로틀링']],
      more: [
        { title: '동작 원리', body: [
          'CPU limit은 CFS 대역폭 제어로 구현됩니다. cgroup v2의 <code>cpu.max</code>가 "<code>할당량 주기</code>"(마이크로초) 쌍이고, 기본 주기는 100ms입니다. limit <code>1</code>은 주기마다 100ms, <code>500m</code>은 50ms예요. 이 할당량은 컨테이너의 모든 스레드가 함께 씁니다.',
          'GC · JIT · 요청 몰림처럼 짧게 여러 코어를 쓰는 순간이 할당량을 금방 소진합니다. 1분 평균 사용률 그래프에는 거의 보이지 않아서 "한가한데 느리다"는 증상이 됩니다.',
        ] },
        { title: '출력 읽기', list: [
          '<code>nr_throttled ÷ nr_periods</code>가 스로틀링된 주기의 비율입니다. 위 예시는 약 29%로, 주기 세 번 중 한 번꼴로 멈췄어요.',
          'Prometheus를 쓴다면 cAdvisor 메트릭 <code>container_cpu_cfs_throttled_periods_total</code>을 <code>container_cpu_cfs_periods_total</code>로 나눠 Pod별로 그려 보세요.',
        ] },
        { title: '해결 순서', list: [
          '① limit을 올리거나 비웁니다. ② Go는 <code>GOMAXPROCS</code>, JVM은 <code>-XX:ActiveProcessorCount</code>로 런타임이 노드 전체 코어 수가 아닌 limit에 맞춰 스레드를 쓰게 합니다. ③ requests는 실제 사용량에 맞게 유지합니다.',
          'CPU limit이 필요한 경우도 있습니다. 여러 팀이 한 노드를 나눠 쓰며 한 앱의 폭주를 막아야 할 때, 또는 Guaranteed 등급이 필요할 때예요.',
        ] },
      ],
    },
    // 8
    {
      key: 'taint', kind: 'concept', title: 'taint: 노드가 Pod를 막습니다',
      body: [
        '노드 B는 비싼 GPU 노드인데 아까 api가 들어와 자리를 차지했습니다. 노드에 <b>taint</b>(<code>gpu=true:NoSchedule</code>)를 붙이면, 이를 견딘다는 <b>toleration</b>을 가진 Pod만 새로 들어올 수 있습니다.',
        '<code>NoSchedule</code>은 이미 있는 Pod를 내쫓지 않습니다. api는 다음 롤아웃 때 다른 노드로 옮겨 갑니다. 바로 비우려면 <code>NoExecute</code>를 쓰거나 Pod를 지워 다시 만들게 합니다.',
      ],
      callout: { type: 'warn', text: 'toleration은 "들어가도 된다"일 뿐 "거기로 가라"가 아닙니다. ml Pod가 꼭 GPU 노드로 가게 하려면 다음 단계의 affinity를 함께 씁니다.' },
      show: ['nA', 'nB', 'sched', 'a1', 'a2', 'b1', 'c3'],
      set: { c1: { state: null, badge: null }, nB: { label: '노드 B · GPU', color: 'purple' }, b2: { state: 'dim', badge: '옮길 예정', tone: 'mute' } },
      tags: [
        { at: [5.6, -1.2], text: 'gpu=true:NoSchedule', tone: 'warn', icon: 'ban' },
        { on: 'b1', text: 'toleration 있음', tone: 'ok', icon: 'key', pos: 'bottom' },
      ],
      panel: { title: 'taint의 세 효과', icon: 'ban', rows: [['NoSchedule', '새 Pod 막음', 'warn'], ['PreferNoSchedule', '되도록 피함', 'info'], ['NoExecute', '있는 Pod도 내보냄', 'bad']] },
      metrics: { p99: ['200ms', 'ok'] },
      changes: [['+', '노드 B에 taint'], ['~', 'ml만 toleration을 가짐'], ['~', 'B의 api는 옮길 예정']],
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl taint nodes node-b gpu=true:NoSchedule
node/node-b tainted
$ kubectl describe node node-b | grep Taints
Taints:  gpu=true:NoSchedule
# 끝에 - 를 붙이면 taint 제거
$ kubectl taint nodes node-b gpu=true:NoSchedule-` } },
        { title: '설정 예시', body: ['ml Pod의 spec에 넣는 toleration입니다. key · value · effect가 taint와 맞아야 합니다.'], code: { title: 'ml-pod.yaml', lang: 'yaml', text: `tolerations:
  - key: gpu
    operator: Equal
    value: "true"
    effect: NoSchedule` } },
        { title: '동작 원리', body: [
          'Kubernetes도 taint를 스스로 씁니다. 노드가 응답하지 않으면 <code>node.kubernetes.io/unreachable:NoExecute</code>가 붙고, 모든 Pod에는 이를 300초 견디는 toleration(<code>tolerationSeconds</code>)이 기본으로 들어갑니다. 노드가 죽고 약 5분 뒤에야 Pod가 다른 노드로 옮겨지는 이유예요.',
          '컨트롤 플레인 노드에도 taint가 있어 일반 Pod가 올라가지 않습니다. 관리형 서비스에서는 이 노드가 아예 보이지 않습니다.',
        ] },
      ],
    },
    // 9
    {
      key: 'affinity', kind: 'concept', title: 'affinity와 분산: 골라서 보내기',
      body: [
        '반대 방향은 Pod가 노드를 고르는 <b>node affinity</b>입니다. ml은 <code>gpu=true</code> 라벨 노드만 가도록 필수 조건을 겁니다. api는 한 노드 · 한 AZ가 죽어도 버티도록 <b>topology spread</b>로 고르게 흩습니다.',
        '롤아웃으로 다시 만들어진 api Pod는 개수 차이(<code>maxSkew</code>)가 1을 넘지 않게 노드 A와 C에 나뉘어 놓입니다. C에 셋이 몰려 있던 것 중 하나가 A로 왔어요.',
      ],
      callout: { type: 'warn', text: '조건을 강제(required, DoNotSchedule)할수록 갈 곳이 줄어 Pending이 늘어납니다. 꼭 필요한 것만 강제하고 나머지는 선호로 두세요.' },
      hide: ['nB', 'b1', 'b2', 'sched', 'a1'],
      show: ['nC', 'c1', 'c2'],
      set: { c3: { at: [0.8, 2.0] } },
      focus: ['c3'],
      tags: [
        { at: [0, 0], text: 'zone a', icon: 'pin', dy: -30 },
        { at: [0, 3.6], text: 'zone b', icon: 'pin', dy: -30 },
      ],
      code: {
        title: 'api 분산 규칙', lang: 'yaml', hl: [2, 3, 4],
        text: `topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels: { app: api }
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels: { app: api }
`,
      },
      changes: [['~', 'api: 노드 C → 노드 A로 재배치'], ['+', 'zone · 노드 단위 분산 규칙'], ['+', 'ml: GPU 노드 필수 affinity']],
      more: [
        { title: '설정 예시', body: ['ml을 GPU 노드로 끌어당기는 필수 조건과, 되도록 큰 노드를 고르는 선호 조건입니다.'], code: { title: 'ml-pod.yaml', lang: 'yaml', text: `affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - { key: gpu, operator: In, values: ["true"] }
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 50
        preference:
          matchExpressions:
            - key: node.kubernetes.io/instance-type
              operator: In
              values: ["g5.2xlarge"]` } },
        { title: '동작 원리', list: [
          '이름 끝의 <b>IgnoredDuringExecution</b>은 "배치 뒤에 노드 라벨이 바뀌어도 이미 있는 Pod는 그대로 둔다"는 뜻입니다. 조건은 스케줄링 순간에만 봅니다.',
          '<code>maxSkew: 1</code>은 가장 많은 영역과 가장 적은 영역의 Pod 수 차이가 1 이하라는 뜻입니다. <code>DoNotSchedule</code>은 필터(어기면 Pending), <code>ScheduleAnyway</code>는 점수(되도록 지킴)로 동작합니다.',
          '<b>pod anti-affinity</b>로도 흩을 수 있지만, 필수로 걸면 "노드 수보다 replicas가 많으면 Pending"이 되고 큰 클러스터에서 계산이 무겁습니다. 단순 분산에는 topology spread가 낫습니다.',
        ] },
        { title: '흔한 실수', list: [
          'zone 분산을 DoNotSchedule로 걸었는데 한 zone의 노드 그룹만 꽉 차면, 다른 zone에 자리가 있어도 새 Pod가 Pending이 될 수 있습니다. 노드 오토스케일러가 zone마다 노드를 늘릴 수 있는지도 확인하세요.',
        ] },
      ],
    },
    // 10
    {
      key: 'HPA', kind: 'solution', title: 'HPA: 사용률을 보고 Pod 수를 조절',
      body: [
        '점심 무렵 트래픽이 오릅니다. <b>HPA</b>(HorizontalPodAutoscaler)는 <b>metrics-server</b>가 각 노드의 kubelet에서 모아 온 CPU 사용량을 주기적으로 확인하고, Deployment의 <code>replicas</code>를 고칩니다.',
        '기준은 <b>requests 대비 사용률</b>입니다. 목표가 50%인데 평균이 75%라면 4 × 75 ÷ 50 = 6, 즉 6개로 늘립니다.',
      ],
      callout: { type: 'key', text: 'requests가 없으면 사용률을 계산할 분모가 없어 HPA가 동작하지 않습니다. TARGETS가 <code>&lt;unknown&gt;</code>이면 requests와 metrics-server부터 확인하세요.' },
      hide: ['nA', 'nC', 'a2', 'c1', 'c2', 'c3'],
      show: ['ms', 'hpa', 'dep'],
      focus: ['hpa'],
      tags: [
        { on: 'ms', text: '평균 75%', tone: 'warn', pos: 'right' },
        { on: 'hpa', text: '4 × 75 ÷ 50 = 6', tone: 'accent', pos: 'right' },
        { on: 'dep', text: 'replicas 4 → 6', tone: 'ok', pos: 'bottom' },
      ],
      flows: [{ path: ['ms', 'hpa'], kind: 'data', n: 2 }, { path: ['hpa', 'dep'], kind: 'ctrl', delay: 1.2 }],
      code: {
        title: 'api-hpa.yaml', lang: 'yaml', hl: [10, 11, 15, 17, 18],
        text: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
`,
      },
      metrics: { busy: ['75%', 'warn'], rep: ['4 → 6', 'warn'], p99: ['320ms', 'warn'] },
      more: [
        { title: '동작 원리', body: [
          'HPA 컨트롤러는 기본 15초마다 <code>원하는 수 = ceil(현재 수 × 현재 값 ÷ 목표 값)</code>을 계산합니다. 비율이 1에서 10% 이내로만 벗어나면 움직이지 않아(허용 오차) 작은 흔들림에 반응하지 않아요. 지표를 여러 개 걸면 각각 계산해 <b>가장 큰 수</b>를 씁니다.',
          '아직 준비되지 않은 Pod나 메트릭이 비는 Pod는 계산에서 보수적으로 다룹니다. 갓 뜬 Pod의 시작 부하 때문에 과하게 늘리는 일을 줄이려는 것입니다.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get hpa api
NAME  REFERENCE       TARGETS       MINPODS MAXPODS REPLICAS
api   Deployment/api  cpu: 75%/50%  3       10      4

$ kubectl describe hpa api | grep -A4 Conditions
  AbleToScale     True   SucceededRescale
  ScalingActive   True   ValidMetricFound
  ScalingLimited  False  DesiredWithinRange` } },
        { title: '실무 팁', list: [
          'CPU가 부하를 잘 대변하지 않는 앱(I/O 대기, 큐 소비자)은 초당 요청 수나 큐 길이 같은 사용자 정의 지표를 씁니다. Prometheus Adapter나 이벤트 기반의 <b>KEDA</b>가 흔한 선택이에요.',
          'HPA를 쓰면 매니페스트의 <code>replicas</code>를 빼 두세요. 배포 때마다 <code>kubectl apply</code>가 replicas를 3으로 되돌려 순간적으로 Pod가 줄어드는 사고가 납니다.',
        ] },
      ],
    },
    // 11
    {
      key: 'behavior', kind: 'concept', title: 'behavior: 늘리고 줄이는 속도 조절',
      body: [
        '트래픽이 잦아들어도 HPA는 바로 줄이지 않습니다. 기본으로 지난 <b>5분</b> 동안 계산된 값 중 가장 큰 값을 따르는 <b>안정화 창</b>이 있어서, 잠깐 내려갔다 다시 오르는 트래픽에 Pod 수가 출렁이지 않아요.',
        '<code>behavior</code>로 이 속도를 앱에 맞춥니다. 여기서는 늘릴 때는 15초마다 두 배까지 빠르게, 줄일 때는 1분에 1개씩 천천히 줄이게 했습니다.',
      ],
      callout: { type: 'tip', text: '시작이 느린 앱(JVM 등)이라면 빨리 늘려도 준비까지 시간이 걸립니다. minReplicas를 넉넉히 두거나 예상 시간 전에 미리 늘려 두세요.' },
      set: { dep: { label: 'Deployment api · 6' } },
      focus: ['hpa'],
      tags: [
        { on: 'ms', text: '평균 30%', tone: 'ok', pos: 'right' },
        { on: 'hpa', text: '5분 지켜본 뒤 축소', tone: 'accent', pos: 'right', icon: 'clock' },
      ],
      flows: [{ path: ['ms', 'hpa'], kind: 'data', n: 2 }],
      code: {
        title: 'api-hpa.yaml (behavior)', lang: 'yaml', hl: [4, 5, 6, 7, 10, 12, 13, 14],
        text: `spec:
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 60
`,
      },
      metrics: { busy: ['30%', 'ok'], rep: '6', p99: ['190ms', 'ok'] },
      more: [
        { title: '기본값', rows: [
          ['scaleUp 안정화 창', '0초 (바로 늘림)', 'info'],
          ['scaleUp 정책', '15초마다 100% 또는 4개 중 큰 쪽', 'info'],
          ['scaleDown 안정화 창', '300초', 'warn'],
          ['scaleDown 정책', '15초마다 100%까지', 'info'],
        ] },
        { title: '동작 원리', body: [
          '안정화 창은 "그 기간 동안 계산된 추천값 중 가장 보수적인 값"을 씁니다. 줄일 때는 창 안의 최댓값을 따르니, 5분 안에 한 번이라도 6개가 필요했다면 6개를 유지합니다. policies가 여러 개면 <code>selectPolicy</code>(기본 Max)로 더 많이 바꾸는 쪽을 고릅니다.',
        ] },
        { title: '흔한 실수', list: [
          'scaleDown 안정화 창을 0으로 줄이면 비용은 아끼는 듯하지만, 짧은 트래픽 파도마다 Pod가 생겼다 사라지며 콜드 스타트 지연과 커넥션 끊김이 반복됩니다.',
          '같은 CPU 지표로 HPA와 VPA(requests를 자동 조정)를 함께 걸면 서로 싸웁니다. VPA는 추천만 받는 모드로 쓰거나 지표를 나누세요.',
        ] },
      ],
    },
    // 12
    {
      key: 'Pending', kind: 'problem', title: 'Pod는 늘렸는데 놓을 자리가 없습니다',
      body: [
        '다시 점심 피크. HPA가 replicas를 6으로 올렸지만 새 Pod 둘은 <b>Pending</b>입니다. 노드 A와 C는 남은 예약 자리가 400m뿐이고, 노드 B는 taint로 막혀 있습니다. 필터를 통과한 노드가 하나도 없는 것이죠.',
        '노드의 실제 CPU 사용률은 60%대일 수도 있습니다. 그래도 스케줄러는 <b>requests 합계</b>로 판단하니 자리가 없다고 봅니다. 그리고 HPA는 Pod 수만 바꿀 뿐, 노드를 만들지는 못합니다.',
      ],
      callout: { type: 'tip', text: 'Pending이 길어지면 <code>kubectl describe pod</code>의 Events를 보세요. <code>Insufficient cpu</code> 같은 줄이 이유를 알려 줍니다.' },
      hide: ['ms', 'dep'],
      show: ['nA', 'nB', 'nC', 'sched', 'a1', 'a2', 'b1', 'c1', 'c2', 'c3', 'd1', 'd2'],
      set: { dep: { label: 'Deployment api' }, b2: { state: null, badge: null }, d1: { badge: 'Pending', tone: 'warn' }, d2: { badge: 'Pending', tone: 'warn' } },
      focus: ['d1', 'd2'],
      tags: [
        { at: [0, 0], text: '남은 400m', tone: 'bad', dy: -30 },
        { at: [5.6, -1.2], text: 'taint로 차단', tone: 'bad', icon: 'ban' },
        { at: [0, 6.6], text: '남은 400m', tone: 'bad', dx: -20, dy: 30 },
        { on: 'hpa', text: '6개 필요', tone: 'accent' },
      ],
      metrics: { busy: ['64%', 'warn'], rep: ['4 / 6', 'warn'], pend: ['2', 'bad'], p99: ['650ms', 'warn'] },
      changes: [['~', 'replicas 4 → 6'], ['-', '새 Pod 2개가 Pending'], ['~', '세 노드 모두 필터링 탈락']],
      more: [
        { title: '출력 읽기', body: ['이유는 노드별로 세어서 한 줄에 적힙니다. 뒤의 preemption 부분은 "우선순위가 낮은 Pod를 밀어내도 소용없다"는 뜻입니다.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl describe pod api-7d9-x2c | tail -4
Events:
  Warning  FailedScheduling  default-scheduler
    0/3 nodes are available: 1 node(s) had
    untolerated taint {gpu: true}, 2 Insufficient
    cpu. preemption: 0/3 nodes are available:
    3 No preemption victims found for incoming pod.` } },
        { title: '자주 보는 이유', rows: [
          ['Insufficient cpu / memory', 'requests 합계로 자리 없음', 'warn'],
          ['untolerated taint', 'toleration 없음', 'warn'],
          ["didn't match node affinity", 'affinity · nodeSelector 불일치', 'warn'],
          ['unbound PersistentVolumeClaim', '볼륨 준비 안 됨 (다음다음 레슨)', 'info'],
          ['Too many pods', '노드당 Pod 수 한도', 'info'],
        ] },
        { title: '판단 기준', list: [
          '실제 사용률이 낮은데 Insufficient가 뜨면 먼저 requests가 과하게 잡혔는지 봅니다. 맞게 잡혀 있다면 노드를 늘려야 할 때입니다.',
          '노드당 Pod 수 한도는 클라우드 · 네트워크 플러그인 설정에 따라 다릅니다. 작은 노드를 많이 쓰면 CPU보다 이 한도에 먼저 닿기도 합니다.',
        ] },
      ],
    },
    // 13
    {
      key: '노드 늘리기', kind: 'solution', title: 'Cluster Autoscaler: 노드를 늘립니다',
      body: [
        '<b>Cluster Autoscaler</b>는 "자리가 없어 Pending인 Pod"를 발견하면 클라우드 API로 노드 그룹의 대수를 늘립니다. 새 VM이 부팅해 클러스터에 합류하기까지 보통 몇 분이 걸리고, 그 뒤 스케줄러가 Pending Pod를 그 위에 올립니다.',
        '반대로 requests 합계가 한동안 적은 노드는 Pod를 다른 곳으로 옮기고 반납합니다. 노드 수는 실사용이 아니라 <b>예약</b>을 따라 움직입니다.',
      ],
      callout: { type: 'key', text: 'HPA는 Pod 수를, Cluster Autoscaler는 노드 수를 맡습니다. 둘이 함께 있어야 트래픽이 늘 때 끝까지 늘어나요.' },
      show: ['nD', 'ca'],
      set: { d1: { state: 'ok', badge: null }, d2: { state: 'ok', badge: null } },
      focus: ['ca'],
      tags: [
        { on: 'ca', text: '노드 그룹 3 → 4', tone: 'ok', pos: 'bottom' },
        { at: [6.3, 6.6], text: '몇 분 뒤 Ready', icon: 'clock', dy: 28 },
      ],
      flows: [{ path: ['ca', [6.5, 5.1]], kind: 'ctrl', n: 2 }],
      metrics: { rep: ['6', 'ok'], pend: ['0', 'ok'], nodes: ['4', 'ok'], busy: ['64%', 'ok'], p99: ['200ms', 'ok'] },
      changes: [['+', '노드 D (자동 추가)'], ['~', 'Pending 2 → 0'], ['~', 'api Pod 6개 모두 Running']],
      more: [
        { title: '동작 원리', body: [
          'Cluster Autoscaler는 주기적으로 Pending Pod를 보고, 노드 그룹마다 "이 그룹의 노드를 하나 더하면 이 Pod가 들어가는가"를 스케줄러 규칙 그대로 <b>시뮬레이션</b>합니다. 들어갈 그룹이 여럿이면 expander 설정(가장 낭비가 적은 그룹, 우선순위 등)으로 고르고, 그룹의 최대 대수를 넘지 않게 늘립니다.',
          '줄일 때는 requests 합계가 기준(기본 50%)보다 낮은 상태가 일정 시간(기본 10분) 이어지고, 그 위 Pod를 다른 노드로 옮길 수 있을 때만 노드를 비우고 반납합니다.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl describe pod api-7d9-x2c | tail -2
  Normal  TriggeredScaleUp  cluster-autoscaler
    pod triggered scale-up: [ng-api 3->4 (max: 6)]

$ kubectl get nodes
NAME    STATUS  AGE
node-a  Ready   21d
node-d  Ready   48s` } },
        { title: '줄지 않을 때', list: [
          'PodDisruptionBudget 때문에 옮길 수 없는 Pod, 노드 로컬 저장소(emptyDir 등)를 쓰는 Pod, <code>safe-to-evict: "false"</code> 주석이 붙은 Pod가 있으면 그 노드는 반납되지 않습니다.',
          '노드 부팅 몇 분이 아깝다면 우선순위가 아주 낮은 "자리 맡기용" Pod를 미리 띄워 두는 방법(overprovisioning)이 있습니다. 진짜 Pod가 오면 밀려나면서 그 순간 노드 증설이 시작돼요.',
        ] },
      ],
    },
    // 14
    {
      key: '클라우드별', kind: 'compare', title: '노드를 늘리는 방법, 네 클라우드',
      body: [
        '노드 그룹의 대수만 바꾸는 Cluster Autoscaler와 달리, AWS에서 시작된 <b>Karpenter</b>는 노드 그룹 없이 Pending Pod의 요청에 맞는 인스턴스 종류를 직접 골라 띄웁니다. 작은 노드 여럿을 큰 노드 하나로 합치는 정리(consolidation)도 합니다.',
        '관리형 서비스는 대부분 노드 풀에 최소 · 최대 대수를 정하는 오토스케일을 제공하고, 일부는 노드 관리 자체를 맡기는 모드도 있습니다.',
      ],
      callout: { type: 'cloud', text: '최대 대수는 비용 안전장치입니다. 클라우드 계정의 vCPU 할당량이 그보다 작으면 증설이 조용히 실패하니 함께 확인하세요.' },
      hide: ['nA', 'nB', 'nC', 'sched', 'a1', 'a2', 'b1', 'c1', 'c2', 'c3', 'hpa'],
      show: ['karp'],
      set: { d1: { state: null }, d2: { state: null } },
      tags: [
        { on: 'ca', text: '그룹 대수 조절', pos: 'bottom' },
        { on: 'karp', text: '인스턴스 직접 선택', tone: 'aws', pos: 'right' },
      ],
      flows: [{ path: ['karp', [6.5, 4.0]], kind: 'ctrl', n: 2 }],
      panel: { title: '노드 오토스케일', icon: 'server-cog', rows: [
        ['AWS EKS', 'Cluster Autoscaler · Karpenter', 'aws'],
        ['Azure AKS', '노드 풀 오토스케일러', 'azure'],
        ['GCP GKE', '노드 풀 오토스케일 · Autopilot', 'gcp'],
        ['NCP NKS', '노드 풀 오토스케일 (최소·최대)', 'ncp'],
      ] },
      more: [
        { title: '클라우드별로', rows: [
          ['AWS EKS', '노드 그룹(ASG)에 Cluster Autoscaler를 직접 설치하거나 Karpenter(NodePool)를 씁니다. 노드 관리를 맡기는 EKS Auto Mode도 있습니다.', 'aws'],
          ['Azure AKS', '노드 풀마다 cluster autoscaler를 켜고 최소 · 최대를 정합니다. Karpenter 기반의 노드 자동 프로비저닝 기능도 있습니다.', 'azure'],
          ['GCP GKE', '노드 풀 오토스케일에 더해, 필요한 노드 풀을 새로 만드는 노드 자동 프로비저닝이 있습니다. Autopilot은 Pod requests만큼 과금하고 노드를 GKE가 관리합니다.', 'gcp'],
          ['NCP NKS', '노드 풀 설정에서 오토스케일을 켜고 최소 · 최대 노드 수를 정합니다.', 'ncp'],
        ] },
        { title: 'CA와 Karpenter', list: [
          'Cluster Autoscaler는 노드 그룹마다 인스턴스 종류가 정해져 있어, 다양한 Pod를 담으려면 그룹을 여러 개 만들어야 합니다.',
          'Karpenter는 NodePool에 "허용할 인스턴스 계열 · 스팟 여부 · zone"을 조건으로 적어 두면 그 안에서 가장 알맞은 것을 고릅니다. 스팟 인스턴스를 섞어 비용을 줄이기 쉽습니다.',
          '어느 쪽이든 판단 기준은 Pod의 <b>requests</b>입니다. requests가 엉터리면 노드도 엉터리로 늘어납니다.',
        ] },
      ],
    },
    // 15
    {
      key: '정리', kind: 'recap', title: '정리: requests가 모든 것의 기준입니다',
      body: [
        '스케줄러는 requests 합계로 자리를 고르고, HPA는 requests 대비 사용률로 Pod 수를 정하고, 노드 오토스케일러는 자리가 없어 Pending인 Pod를 보고 노드를 늘립니다. <b>requests를 정확히 적는 것</b>이 세 장치의 출발점입니다.',
        'limits는 사고가 번지지 않게 막는 울타리(CPU는 스로틀링, 메모리는 OOMKilled)이고, taint · affinity · topology spread는 배치를 다듬는 도구입니다. 다음 레슨에서는 이렇게 떠 있는 Pod들을 <b>멈춤 없이 새 버전으로 바꾸는</b> 방법을 봅니다.',
      ],
      hide: ['karp'],
      show: ['nA', 'nB', 'nC', 'sched', 'a1', 'a2', 'b1', 'c1', 'c2', 'c3', 'hpa'],
      focus: ['sched', 'hpa', 'ca'],
    },
  ],
  quiz: [
    {
      q: 'requests를 적지 않은 Pod들이, 실제로는 CPU가 꽉 찬 노드에 또 배치됐습니다. 가장 정확한 설명은?',
      options: [
        '스케줄러가 고장 나서 무작위로 배치했다',
        '스케줄러는 실제 사용량이 아니라 예약량(requests)으로 자리를 판단하기 때문이다',
        'limits를 적지 않아 스케줄러가 그 노드를 선호했다',
        'HPA가 그 노드를 지정해서 Pod를 만들었다',
      ],
      answer: 1, step: 1,
      why: '기본 스케줄러는 노드의 실시간 부하를 보지 않고 requests 합계로 남은 자리를 계산합니다. limits는 배치가 아니라 실행 중의 상한이고, HPA는 개수만 정할 뿐 노드를 고르지 않습니다.',
    },
    {
      q: '세 노드 중 한 노드에 놓인 api Pod만 가끔 몇 초씩 느리고, 에러나 재시작은 없습니다. 그 노드에는 requests가 없는 배치 작업이 함께 돌고 있습니다. 가장 그럴듯한 원인은?',
      options: [
        '메모리 부족으로 api가 Evicted되고 있다',
        'api의 메모리 limit이 너무 낮다',
        '네트워크 정책이 그 노드의 트래픽만 막고 있다',
        '같은 노드의 배치 작업과 CPU를 두고 경합해 api가 시간을 충분히 받지 못한다',
      ],
      answer: 3, step: 2,
      why: 'CPU는 압축 가능한 자원이라 모자라면 죽지 않고 느려집니다. 재시작도 에러도 없이 한 노드에서만 느리다면 CPU 경합이 가장 유력합니다. Evicted나 OOM이라면 Pod 상태와 재시작 횟수에 흔적이 남습니다.',
    },
    {
      q: '매니페스트에 memory: 512m 이라고 적었더니 컨테이너가 시작하자마자 죽습니다. 무엇이 잘못됐을까요?',
      options: [
        'm은 밀리 단위라 0.5바이트쯤을 뜻한다. 512Mi로 적어야 한다',
        'memory에는 단위를 붙일 수 없다',
        '512m은 512메가바이트라 노드보다 크다',
        'requests 없이 limits만 적었기 때문이다',
      ],
      answer: 0, step: 3,
      why: '수량 접미사 m은 1/1000을 뜻해서 512m은 0.512바이트입니다. 메모리는 Mi · Gi(2의 거듭제곱)나 M · G(10의 거듭제곱)로 적어야 합니다. 512Mi는 노드보다 크지 않습니다.',
    },
    {
      q: '노드 메모리가 부족해질 때 redis Pod만은 끝까지 살아남게 하고 싶습니다. 가장 알맞은 설정은?',
      options: [
        'redis에 CPU limit만 높게 준다',
        'redis의 모든 컨테이너에 CPU · 메모리 requests와 limits를 같은 값으로 적어 Guaranteed로 만든다',
        'redis의 requests를 비워 BestEffort로 둔다',
        'redis에 toleration을 추가한다',
      ],
      answer: 1, step: 4,
      why: '모든 컨테이너가 CPU · 메모리 모두 requests = limits면 Guaranteed가 되어 메모리 압박 시 가장 나중에 내보내집니다. BestEffort는 반대로 가장 먼저 밀려나고, toleration은 배치 허용일 뿐 eviction 순서와 무관합니다.',
    },
    {
      q: 'kubectl describe pod의 Events에 "0/3 nodes are available: 3 Insufficient memory"가 보입니다. 그런데 kubectl top node로는 모든 노드 메모리가 40%대입니다. 먼저 확인할 것은?',
      options: [
        'metrics-server가 고장 났는지',
        '노드의 디스크 사용량',
        '그 Pod와 노드 위 Pod들의 memory requests가 실제 사용량보다 과하게 잡혔는지',
        '노드의 taint 목록',
      ],
      answer: 2, step: 5,
      why: '필터링은 실사용이 아니라 requests 합계로 계산합니다. 실사용 40%인데 자리가 없다면 requests가 부풀려졌을 가능성이 큽니다. taint가 원인이었다면 메시지에 untolerated taint로 따로 적힙니다.',
    },
    {
      q: 'api 컨테이너가 Exit Code 137, Reason OOMKilled로 재시작을 반복하고, 메모리 사용 그래프는 시작 후 계속 우상향합니다. 옳은 판단은?',
      options: [
        '노드 메모리가 부족한 것이니 노드를 늘린다',
        'CPU limit이 낮아 GC가 늦어진 것이니 CPU limit을 올린다',
        'replicas를 늘려 Pod당 메모리를 줄인다',
        '누수 가능성이 크므로 힙 덤프 등으로 원인을 찾고, limit 상향은 임시 조치로만 쓴다',
      ],
      answer: 3, step: 6,
      why: 'OOMKilled는 컨테이너가 자기 메모리 limit을 넘었다는 뜻이고, 계속 우상향하는 그래프는 누수의 전형입니다. limit만 올리면 더 늦게 같은 장애가 납니다. 노드 부족이었다면 Evicted로 나타납니다.',
    },
    {
      q: 'api의 p99 지연이 자주 튀는데 노드 CPU는 30%대이고, cpu.stat의 nr_throttled가 nr_periods의 30%쯤 됩니다. 가장 효과적인 조치는?',
      options: [
        'CPU limit을 올리거나 없애고, 런타임 스레드 수를 limit에 맞춘다',
        'CPU requests를 낮춘다',
        '메모리 limit을 올린다',
        '노드를 더 큰 인스턴스로 바꾼다',
      ],
      answer: 0, step: 7,
      why: 'nr_throttled 비율이 높다는 것은 CFS 할당량(CPU limit)에 자주 부딪힌다는 뜻입니다. 노드에 여유가 있어도 limit이 컨테이너를 멈춰 세우므로, 노드를 키워도 그대로입니다. requests를 낮추면 오히려 경합 시 몫이 줄어듭니다.',
    },
    {
      q: 'GPU 노드에 일반 Pod가 들어오지 못하게 하고, ml Pod는 반드시 GPU 노드로만 가게 하려 합니다. 어떤 조합이 맞을까요?',
      options: [
        'ml Pod에 toleration만 준다',
        'GPU 노드에 taint를 걸고, ml Pod에 toleration과 GPU 노드를 고르는 node affinity를 함께 준다',
        'GPU 노드에 라벨만 붙이고 ml Pod에 nodeSelector를 준다',
        '일반 Pod 모두에 GPU 노드를 피하는 anti-affinity를 준다',
      ],
      answer: 1, step: 8,
      why: 'taint는 다른 Pod를 막고, toleration은 들어갈 수 있게 해 줄 뿐 끌어당기지는 않습니다. "막기"와 "끌어당기기"를 모두 하려면 taint + toleration + node affinity가 필요합니다. nodeSelector만 쓰면 일반 Pod가 GPU 노드에 들어오는 것을 막지 못합니다.',
    },
    {
      q: '노드 하나가 갑자기 꺼졌는데, 그 위 Pod들이 다른 노드에 새로 뜨기까지 약 5분이 걸렸습니다. 이 시간을 결정한 것은?',
      options: [
        'HPA의 scaleDown 안정화 창 300초',
        'Cluster Autoscaler의 축소 대기 시간',
        'unreachable taint에 대해 Pod에 기본으로 붙는 tolerationSeconds 300초',
        'kubelet의 재시작 backoff',
      ],
      answer: 2, step: 8,
      why: '노드가 응답하지 않으면 NoExecute 효과의 unreachable taint가 붙고, Pod에는 이를 300초 견디는 toleration이 기본으로 들어갑니다. 그 시간이 지나야 Pod가 쫓겨나 다른 노드에 다시 만들어집니다. HPA 안정화 창도 300초지만 Pod 수 축소에 관한 값입니다.',
    },
    {
      q: 'replicas 6인 api를 세 AZ에 고르게 두려고 zone 기준 topology spread를 DoNotSchedule로 걸었습니다. 한 AZ의 노드가 꽉 찼을 때 일어날 수 있는 일은?',
      options: [
        '규칙이 자동으로 무시되고 다른 AZ에 몰아서 놓인다',
        '기존 Pod가 다른 AZ로 자동 이동한다',
        'HPA가 replicas를 줄인다',
        '개수 차이 제한 때문에 다른 AZ에 자리가 있어도 새 Pod가 Pending이 될 수 있다',
      ],
      answer: 3, step: 9,
      why: 'DoNotSchedule은 필터로 동작해서 maxSkew를 어기는 배치를 아예 하지 않습니다. 그래서 한 AZ에 자리가 없으면 다른 AZ가 비어 있어도 Pending이 될 수 있습니다. 자동 무시는 ScheduleAnyway일 때의 동작이고, 스케줄러는 이미 놓인 Pod를 옮기지 않습니다.',
    },
    {
      q: 'HPA를 걸었는데 배포할 때마다 Pod 수가 잠깐 3개로 떨어졌다가 다시 늘어납니다. 가장 유력한 원인은?',
      options: [
        '매니페스트에 replicas: 3이 남아 있어 kubectl apply가 HPA가 정한 값을 덮어쓴다',
        'scaleUp 안정화 창이 너무 길다',
        'metrics-server가 배포 중에 멈춘다',
        'maxReplicas가 3으로 잡혀 있다',
      ],
      answer: 0, step: 10,
      why: 'HPA는 Deployment의 replicas 필드를 직접 고칩니다. 매니페스트에 replicas가 있으면 apply할 때마다 그 값으로 되돌아갑니다. HPA를 쓸 때는 매니페스트에서 replicas를 빼는 것이 원칙입니다. maxReplicas가 3이면 애초에 늘어나지 않습니다.',
    },
    {
      q: '트래픽이 30초 단위로 오르내리면서 Pod가 몇 분마다 생겼다 사라지고, 그때마다 콜드 스타트로 지연이 튑니다. 누군가 HPA behavior를 손댔다고 합니다. 먼저 볼 설정은?',
      options: [
        'scaleUp.policies의 periodSeconds',
        'scaleDown.stabilizationWindowSeconds가 0 같은 아주 작은 값으로 바뀌었는지',
        'minReplicas가 maxReplicas보다 큰지',
        'Deployment의 이미지 태그',
      ],
      answer: 1, step: 11,
      why: '축소 안정화 창(기본 300초)이 있으면 잠깐 내려간 트래픽에 바로 줄이지 않습니다. 이를 0에 가깝게 줄이면 짧은 파도마다 축소와 확대가 반복됩니다. scaleUp 정책은 늘리는 속도라 "자주 사라지는" 증상과는 거리가 멉니다.',
    },
    {
      q: 'Pending Pod가 있는데 Cluster Autoscaler가 노드를 늘리지 않습니다. 노드 그룹은 이미 최대 대수가 아닙니다. 가능한 원인으로 가장 알맞은 것은?',
      options: [
        'HPA의 목표 사용률이 너무 낮다',
        'Pod에 PodDisruptionBudget이 없다',
        'Pod의 요구(affinity · taint · 큰 requests)를 그 노드 그룹의 새 노드로도 만족할 수 없다고 시뮬레이션됐다',
        'metrics-server가 없다',
      ],
      answer: 2, step: 13,
      why: 'Cluster Autoscaler는 새 노드를 더하면 Pod가 들어갈지를 스케줄러 규칙대로 시뮬레이션합니다. 인스턴스가 너무 작거나, 필요한 라벨 · toleration이 그 그룹 노드에 없으면 늘려도 소용없다고 보고 늘리지 않습니다. 계정의 vCPU 할당량 부족도 흔한 원인입니다.',
    },
    {
      q: '인스턴스 종류가 제각각인 워크로드가 많아 노드 그룹을 열 개 넘게 관리하고 있습니다. EKS에서 이 부담을 줄이려면?',
      options: [
        'HPA의 maxReplicas를 늘린다',
        '모든 노드 그룹을 가장 큰 인스턴스 하나로 통일한다',
        'Cluster Autoscaler의 축소 기준을 낮춘다',
        'Karpenter를 써서 NodePool 조건 안에서 Pending Pod에 맞는 인스턴스를 고르게 한다',
      ],
      answer: 3, step: 14,
      why: 'Karpenter는 노드 그룹 없이 허용 조건 안에서 Pending Pod의 요구에 맞는 인스턴스를 직접 골라 띄우므로 그룹을 여럿 만들 필요가 줄어듭니다. 가장 큰 인스턴스로 통일하면 관리가 쉬워 보여도 작은 워크로드에서 낭비가 큽니다.',
    },
  ],
};
