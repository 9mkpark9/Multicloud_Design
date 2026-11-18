export default {
  id: 'scheduling-scaling',
  learn: [
    'requests: 스케줄러가 자리를 고를 때 보는 숫자',
    '필터링과 점수 매기기로 노드가 정해지는 과정',
    'limits: CPU 스로틀링과 OOMKilled의 차이',
    'taint · toleration · affinity로 배치 다듬기',
    'HPA가 Pod 수를 계산하는 방법',
    'Pending Pod와 Cluster Autoscaler',
  ],
  legend: [['ctrl', '스케줄링 · 제어'], ['data', '메트릭']],
  metrics: [
    { id: 'busy', label: '노드 A CPU', icon: 'cpu' },
    { id: 'rep', label: 'api Pod 수', icon: 'boxes' },
    { id: 'pend', label: 'Pending Pod', icon: 'hourglass' },
    { id: 'nodes', label: '노드 수', icon: 'server' },
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
    },
    edges: {
      e_a: { from: 'sched', to: 'a2', style: 'dashed', off: true },
      e_b: { from: 'sched', to: 'b2', off: true },
      e_m: { from: 'ms', to: 'hpa' },
      e_s: { from: 'hpa', to: 'dep' },
      e_ca: { from: 'ca', to: [6.5, 5.1], style: 'dashed' },
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
      metrics: { busy: ['92%', 'warn'], rep: '3', pend: '0', nodes: '3' },
    },
    {
      key: '서로 굶김', kind: 'case', title: '사례: 같은 노드에서 서로 굶깁니다',
      body: [
        '노드 A의 <code>batch</code>는 월말 정산을 돌리며 CPU를 있는 대로 끌어다 씁니다. 같은 노드의 api Pod는 제 몫을 보장받지 못해 응답이 몇 초씩 밀립니다. 노드 C의 api는 멀쩡해서, 요청 셋 중 하나만 느린 알쏭달쏭한 장애가 됩니다.',
        '메모리는 더 거칩니다. 노드 메모리가 바닥나면 kubelet이 Pod를 <b>쫓아내는데(eviction)</b>, requests를 적지 않은 Pod가 가장 먼저 대상이 됩니다.',
      ],
      callout: { type: 'key', text: 'requests도 limits도 없는 Pod는 <b>BestEffort</b> 등급입니다. 자리가 남을 때만 쓰고, 모자라면 가장 먼저 밀려나요.' },
      hide: ['e_a'],
      set: { a1: { state: 'hot' }, a2: { state: 'down', badge: 'Evicted', tone: 'bad' } },
      tags: [
        { at: [0, 0], text: '노드 CPU 100%', tone: 'bad', icon: 'flame', dy: -30 },
        { on: 'a1', text: 'CPU 독식', tone: 'bad', pos: 'left' },
        { on: 'c2', text: '여기는 정상', tone: 'ok', pos: 'bottom' },
      ],
      metrics: { busy: ['100%', 'bad'], rep: ['2 / 3', 'bad'] },
      changes: [['~', '노드 A CPU 92% → 100%'], ['-', 'A의 api: 지연 끝에 Evicted'], ['~', '노드 B · C는 여전히 한가함']],
    },
    {
      key: 'requests', kind: 'solution', title: 'requests: 스케줄러에게 하는 예약',
      body: [
        '컨테이너마다 <code>resources.requests</code>에 평소 필요한 양을 적습니다. <code>cpu: 500m</code>은 0.5코어(1000m = 1코어), <code>memory: 256Mi</code>는 256메비바이트입니다.',
        '스케줄러는 노드의 <b>할당 가능량(allocatable)</b>에서 이미 예약된 합계를 뺀 자리에 새 요청이 들어가는 노드만 고릅니다. 2 vCPU 노드도 시스템 몫을 빼면 1900m쯤이라, batch 1000m과 api 500m이 놓인 노드 A에는 400m만 남습니다.',
      ],
      callout: { type: 'tip', text: 'requests는 <b>보장되는 몫</b>이기도 합니다. 노드가 붐비면 CPU는 requests 비율대로 나뉩니다. 값은 짐작하지 말고 <code>kubectl top pod</code>로 실제 사용량을 보고 정하세요.' },
      hide: ['nB', 'nC', 'sched', 'b1', 'c1', 'c2'],
      set: { a1: { state: null, badge: '1000m', tone: 'info' }, a2: { state: null, badge: '500m', tone: 'info' }, nA: { label: '노드 A · 1900m' } },
      tags: [{ at: [3, 3], text: '예약 1500m · 남은 400m', tone: 'accent', dy: 26 }],
      code: { ref: 'deploy', hl: [16, 17, 18, 19] },
      metrics: { busy: ['71%', 'ok'], rep: '3' },
      changes: [['+', 'batch requests 1000m'], ['+', 'api requests 500m'], ['~', '노드 A 남은 자리 400m']],
    },
    {
      key: '필터 · 점수', kind: 'concept', title: '스케줄러는 거르고, 점수를 매깁니다',
      body: [
        'api를 4개로 늘립니다. 스케줄러는 먼저 <b>필터링</b>으로 안 되는 노드를 뺍니다. 새 Pod는 500m을 요청하는데 노드 A는 400m만 남아 탈락입니다. taint나 nodeSelector가 맞지 않는 노드도 여기서 걸러집니다.',
        '남은 노드에는 <b>점수</b>를 매깁니다. 자원이 고르게 남는지, 같은 앱의 Pod가 흩어지는지 등을 봅니다. B와 C는 남은 자리가 같지만 C에는 이미 api가 둘 있어, B가 더 높은 점수를 받습니다(그림의 점수는 예시).',
      ],
      callout: { type: 'key', text: '통과한 노드가 하나도 없으면 Pod는 <b>Pending</b>으로 남습니다. 이유는 <code>kubectl describe pod</code>의 Events에 적혀 있어요.' },
      show: ['nB', 'nC', 'sched', 'b1', 'b2', 'c1', 'c2', 'e_b'],
      set: { a1: { badge: null }, a2: { badge: null }, nA: { label: '노드 A' } },
      focus: ['b2'],
      tags: [
        { at: [0, 0], text: '남은 400m · 탈락', tone: 'bad', icon: 'x', dy: -30 },
        { at: [5.6, -1.2], text: '남은 900m · 86점', tone: 'ok', icon: 'check' },
        { at: [-0.9, 5.0], text: '남은 900m · 71점' },
      ],
      flows: [{ path: ['sched', 'b2'], kind: 'ctrl', n: 2 }],
      metrics: { rep: '4' },
      changes: [['+', '네 번째 api Pod → 노드 B'], ['~', '노드 A는 필터링에서 탈락']],
    },
    {
      key: 'limits', kind: 'concept', title: 'limits: 넘으면 느려지거나 죽습니다',
      body: [
        '<b>limits</b>는 컨테이너가 넘지 못하는 상한입니다. 닿았을 때 벌어지는 일은 자원마다 다릅니다. CPU는 나눠 쓸 수 있어서, 상한에 닿으면 커널이 컨테이너를 잠깐씩 멈춰 세웁니다. 이것이 <b>CPU 스로틀링</b>이고, 죽지는 않지만 응답이 느려집니다.',
        '메모리는 나눌 수 없습니다. limit을 넘는 순간 커널이 프로세스를 죽이고 <code>OOMKilled</code>(종료 코드 137)가 남습니다. kubelet이 다시 띄우지만 원인이 그대로면 재시작만 반복됩니다.',
      ],
      callout: { type: 'warn', text: '메모리 limit은 꼭 적으세요. CPU limit은 너무 낮으면 노드가 한가해도 느려지므로, requests만 정확히 적고 limit은 넉넉히 두는 팀이 많습니다.' },
      hide: ['nA', 'nB', 'sched', 'a1', 'a2', 'b1', 'b2', 'e_b'],
      set: { c1: { state: 'hot', badge: '스로틀링', tone: 'warn' }, c2: { state: 'down', badge: 'OOMKilled', tone: 'bad' } },
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
    },
    {
      key: 'taint·affinity', kind: 'concept', title: '오지 못하게 막기, 골라서 보내기',
      body: [
        '노드 B는 비싼 GPU 노드인데 방금 api가 들어와 자리를 차지했습니다. 노드에 <b>taint</b>(<code>gpu=true:NoSchedule</code>)를 붙이면, 이를 견딘다는 <b>toleration</b>을 가진 Pod만 새로 들어올 수 있습니다. api는 다시 배포될 때 노드 C로 갑니다.',
        'toleration은 "들어가도 된다"일 뿐 "거기로 가라"가 아닙니다. 특정 노드로 끌어당기려면 <b>nodeSelector</b>나 <b>node affinity</b>를, 같은 앱의 Pod를 여러 노드 · AZ에 흩으려면 <b>pod anti-affinity</b>나 topology spread를 씁니다.',
      ],
      callout: { type: 'warn', text: '조건을 강제(required)할수록 갈 수 있는 노드가 줄어 Pending이 늘어납니다. 꼭 필요한 것만 강제하고 나머지는 선호(preferred)로 두세요.' },
      show: ['nA', 'nB', 'sched', 'a1', 'a2', 'b1', 'c3'],
      set: { c1: { state: null, badge: null }, c2: { state: null, badge: null }, nB: { label: '노드 B · GPU', color: 'purple' } },
      tags: [
        { at: [5.6, -1.2], text: 'gpu=true:NoSchedule', tone: 'warn', icon: 'ban' },
        { on: 'b1', text: 'toleration 있음', tone: 'ok', icon: 'key', pos: 'bottom' },
        { on: 'c3', text: 'B에서 옮겨 옴', pos: 'bottom', dx: 48 },
      ],
      panel: { title: '배치를 다듬는 도구', icon: 'sliders', rows: [['taint · toleration', '노드가 Pod를 막음', 'warn'], ['node affinity', 'Pod가 노드를 고름', 'info'], ['pod anti-affinity', '같은 앱을 흩음', 'accent']] },
      metrics: { rep: '4' },
      changes: [['+', '노드 B에 taint'], ['~', 'api Pod: 노드 B → C'], ['~', 'ml만 toleration을 가짐']],
    },
    {
      key: 'HPA', kind: 'solution', title: 'HPA: 사용률을 보고 Pod 수를 조절',
      body: [
        '점심 무렵 트래픽이 오릅니다. <b>HPA</b>(HorizontalPodAutoscaler)는 <b>metrics-server</b>가 각 노드의 kubelet에서 모아 온 CPU 사용량을 주기적으로 확인하고, Deployment의 <code>replicas</code>를 고칩니다.',
        '기준은 <b>requests 대비 사용률</b>입니다. 목표가 50%인데 평균이 75%라면 4 × 75 ÷ 50 = 6, 즉 6개로 늘립니다. 줄일 때는 출렁임을 막으려고 몇 분 지켜본 뒤에 줄입니다.',
      ],
      callout: { type: 'key', text: 'requests가 없으면 사용률을 계산할 분모가 없어 HPA가 동작하지 않습니다. <code>kubectl get hpa</code>의 TARGETS가 <code>&lt;unknown&gt;</code>이면 requests와 metrics-server부터 확인하세요.' },
      hide: ['nA', 'nB', 'nC', 'sched', 'a1', 'a2', 'b1', 'c1', 'c2', 'c3'],
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
      metrics: { rep: ['4 → 6', 'warn'] },
    },
    {
      key: 'Pending', kind: 'problem', title: 'Pod는 늘렸는데 놓을 자리가 없습니다',
      body: [
        'HPA가 replicas를 6으로 올렸지만 새 Pod 둘은 <b>Pending</b>입니다. 노드 A와 C는 남은 예약 자리가 400m뿐이고, 노드 B는 taint로 막혀 있습니다. 필터를 통과한 노드가 하나도 없는 것이죠.',
        '눈여겨볼 점이 있습니다. 노드의 실제 CPU 사용률은 60%대일 수도 있습니다. 그래도 스케줄러는 <b>requests 합계</b>로 판단하니 자리가 없다고 봅니다. 그리고 HPA는 Pod 수만 바꿀 뿐, 노드를 만들지는 못합니다.',
      ],
      callout: { type: 'tip', text: 'Pending이 길어지면 <code>kubectl describe pod</code>를 보세요. <code>0/3 nodes are available: Insufficient cpu</code> 같은 줄이 이유를 알려 줍니다.' },
      hide: ['ms', 'dep'],
      show: ['nA', 'nB', 'nC', 'sched', 'a1', 'a2', 'b1', 'c1', 'c2', 'c3', 'd1', 'd2'],
      set: { d1: { badge: 'Pending', tone: 'warn' }, d2: { badge: 'Pending', tone: 'warn' } },
      focus: ['d1', 'd2'],
      tags: [
        { at: [0, 0], text: '남은 400m', tone: 'bad', dy: -30 },
        { at: [5.6, -1.2], text: 'taint로 차단', tone: 'bad', icon: 'ban' },
        { at: [0, 6.6], text: '남은 400m', tone: 'bad', dx: -20, dy: 30 },
        { on: 'hpa', text: '6개 필요', tone: 'accent' },
      ],
      metrics: { rep: ['4 / 6', 'warn'], pend: ['2', 'bad'] },
      changes: [['~', 'replicas 4 → 6'], ['-', '새 Pod 2개가 Pending'], ['~', '세 노드 모두 필터링 탈락']],
    },
    {
      key: '노드 늘리기', kind: 'solution', title: 'Cluster Autoscaler: 노드를 늘립니다',
      body: [
        '<b>Cluster Autoscaler</b>는 "자리가 없어 Pending인 Pod"를 발견하면 클라우드 API로 노드 그룹의 대수를 늘립니다. 새 VM이 부팅해 클러스터에 합류하기까지 보통 몇 분이 걸리고, 그 뒤 스케줄러가 Pending Pod를 그 위에 올립니다.',
        '반대로 예약이 한동안 적은 노드는 Pod를 다른 곳으로 옮기고 반납합니다. AWS에서 시작된 <b>Karpenter</b>는 노드 그룹 없이, Pending Pod의 요청에 맞는 크기의 인스턴스를 직접 골라 띄웁니다.',
      ],
      callout: { type: 'cloud', text: 'EKS는 Cluster Autoscaler나 Karpenter를 주로 쓰고, AKS · GKE · NKS는 노드 풀에서 오토스케일(최소 · 최대 대수)을 켜는 방식입니다.' },
      show: ['nD', 'ca'],
      set: { d1: { state: 'ok', badge: null }, d2: { state: 'ok', badge: null } },
      focus: ['ca'],
      tags: [
        { on: 'ca', text: '노드 그룹 3 → 4', tone: 'ok', pos: 'bottom' },
        { at: [6.3, 6.6], text: '몇 분 뒤 Ready', icon: 'clock', dy: 28 },
      ],
      flows: [{ path: ['ca', [6.5, 5.1]], kind: 'ctrl', n: 2 }],
      metrics: { rep: ['6', 'ok'], pend: ['0', 'ok'], nodes: ['4', 'ok'], busy: ['68%', 'ok'] },
      changes: [['+', '노드 D (자동 추가)'], ['~', 'Pending 2 → 0'], ['~', 'api Pod 6개 모두 Running']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: requests가 모든 것의 기준입니다',
      body: [
        '스케줄러는 requests 합계로 자리를 고르고, HPA는 requests 대비 사용률로 Pod 수를 정하고, Cluster Autoscaler는 자리가 없어 Pending인 Pod를 보고 노드를 늘립니다. <b>requests를 정확히 적는 것</b>이 세 장치의 출발점입니다.',
        'limits는 사고가 번지지 않게 막는 울타리(CPU는 스로틀링, 메모리는 OOMKilled)이고, taint와 affinity는 배치를 다듬는 도구입니다. 다음 레슨에서는 이렇게 떠 있는 Pod들을 <b>멈춤 없이 새 버전으로 바꾸는</b> 방법을 봅니다.',
      ],
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
      answer: 1,
      why: '기본 스케줄러는 노드의 실시간 부하를 보지 않고 requests 합계로 남은 자리를 계산합니다. limits는 배치가 아니라 실행 중의 상한이고, HPA는 개수만 정할 뿐 노드를 고르지 않습니다.',
    },
    {
      q: 'api Pod가 며칠에 한 번씩 OOMKilled(종료 코드 137)로 재시작합니다. 가장 먼저 할 일은?',
      options: [
        'CPU limit을 두 배로 올린다',
        'replicas를 늘려 부하를 나눈다',
        '메모리 사용 추이를 보고 누수인지, limit이 실제 필요량보다 낮은지 가린다',
        '노드를 더 큰 인스턴스로 바꾼다',
      ],
      answer: 2,
      why: 'OOMKilled는 컨테이너가 메모리 limit을 넘었다는 뜻입니다. 계속 우상향하면 누수이고, 높지만 평평하면 limit이 낮은 것입니다. CPU limit은 무관하고, replicas나 노드 크기는 컨테이너 하나의 상한을 바꾸지 못합니다.',
    },
    {
      q: 'HPA를 만들었는데 kubectl get hpa의 TARGETS가 <unknown>/50%로 나오고 Pod 수가 변하지 않습니다. 가장 먼저 의심할 것은?',
      options: [
        'maxReplicas가 너무 작다',
        'Cluster Autoscaler가 설치되지 않았다',
        'Deployment에 CPU requests가 없거나 metrics-server가 동작하지 않는다',
        'Pod에 toleration이 없다',
      ],
      answer: 2,
      why: 'CPU 사용률은 "사용량 ÷ requests"라서 requests가 없으면 계산할 수 없고, 사용량 자체는 metrics-server가 제공합니다. maxReplicas는 상한일 뿐이고, Cluster Autoscaler와 toleration은 Pod를 어디에 놓느냐의 문제입니다.',
    },
    {
      q: 'HPA가 replicas를 6으로 올렸는데 Pod 2개가 Pending입니다. 노드들의 실제 CPU 사용률은 40%입니다. 옳은 판단은?',
      options: [
        '사용률이 40%이니 곧 스케줄될 것이므로 기다린다',
        'requests 합계 기준으로 자리가 없는 것이니, 노드를 늘리거나 과하게 잡힌 requests를 조정한다',
        'HPA의 목표 사용률을 낮춘다',
        'Pending Pod를 삭제하면 다른 노드로 간다',
      ],
      answer: 1,
      why: '스케줄러는 실제 사용률이 아니라 requests 합계로 판단합니다. Cluster Autoscaler로 노드를 늘리거나, 실제보다 크게 잡힌 requests를 줄여야 합니다. 목표 사용률을 낮추면 Pod를 더 만들려 해서 Pending만 늘어납니다.',
    },
  ],
};
