export default {
  id: 'k8s-architecture',
  learn: [
    '컨테이너가 많아지면 사람이 못 따라가는 이유',
    '컨트롤 플레인: API 서버 · etcd · 스케줄러 · 컨트롤러',
    '워커 노드: kubelet · 컨테이너 런타임 · kube-proxy',
    '선언한 상태와 조정 루프(reconcile)',
    'kubectl apply 한 번이 클러스터 안에서 흘러가는 길',
  ],
  legend: [['ctrl', '명령 · 감시'], ['data', '저장'], ['res', '응답'], ['bad', '끊김']],
  metrics: [
    { id: 'want', label: '선언한 상태', icon: 'file-code' },
    { id: 'have', label: '실제 상태', icon: 'boxes' },
    { id: 'heal', label: '장애 복구', icon: 'heart-pulse' },
  ],
  scene: {
    zones: {
      cp: { at: [-1.4, -4.2], size: [4.6, 4.4], label: '컨트롤 플레인', color: 'red' },
      w1: { at: [0.9, 0.5], size: [4.7, 4.6], label: '워커 노드 1', color: 'blue' },
      w2: { at: [6.0, -1.0], size: [2.8, 3.3], label: '워커 노드 2', color: 'blue' },
    },
    nodes: {
      dev: { kind: 'client', at: [-1.2, 2.0], label: '개발자 · kubectl' },
      api: { at: [2.1, -1.1], label: 'API 서버', sub: 'apiserver', icon: 'server-cog', color: 'red' },
      cm: { at: [-0.4, -1.1], label: '컨트롤러\n매니저', icon: 'refresh', color: 'red' },
      etcd: { kind: 'cyl', at: [-0.4, -3.5], label: 'etcd', icon: 'database', color: 'purple' },
      sched: { at: [2.1, -3.5], label: '스케줄러', sub: 'scheduler', icon: 'signpost', color: 'red' },
      kl1: { kind: 'tile', at: [1.3, 1.2], label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
      rt1: { kind: 'tile', at: [5.0, 1.3], label: 'containerd', icon: 'container', color: 'slate' },
      px1: { kind: 'tile', at: [4.6, 3.9], label: 'kube-proxy', icon: 'shuffle', color: 'slate' },
      p1: { at: [2.6, 3.7], size: 's', label: 'api', icon: 'box', color: 'teal' },
      p2: { at: [3.7, 2.6], size: 's', label: 'api', icon: 'box', color: 'teal' },
      p3: { at: [4.8, 1.5], size: 's', label: 'api', icon: 'box', color: 'teal' },
      kl2: { kind: 'tile', at: [6.6, 0.1], label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
      q1: { at: [8.1, -0.3], size: 's', label: 'api', icon: 'box', color: 'teal' },
    },
    edges: {
      e_ssh: { from: 'dev', to: 'kl1', style: 'dashed', label: 'ssh', off: true },
      e_dev: { from: 'dev', to: 'api' },
      e_etcd: { from: 'api', to: 'etcd', bi: true },
      e_cm: { from: 'cm', to: 'api', bi: true },
      e_sch: { from: 'sched', to: 'api', bi: true },
      e_k1: { from: 'api', to: 'kl1', bi: true },
      e_k2: { from: 'api', to: 'kl2', bi: true },
      e_rt: { from: 'kl1', to: 'rt1' },
      e_r2: { from: 'rt1', to: 'p2' },
      e_q1: { from: 'kl2', to: 'q1' },
    },
  },
  steps: [
    {
      key: '손으로 운영', kind: 'problem', title: '컨테이너 30개를 손으로 돌리면',
      body: [
        'shop.example이 커져서 컨테이너가 서버 5대에 30개가 됐습니다. 배포할 때마다 서버에 ssh로 들어가 <code>docker run</code>을 치고, 어디에 무엇이 떠 있는지는 엔지니어의 메모와 기억이 압니다.',
        '새벽 3시에 컨테이너 하나가 죽으면, 누군가 알람에 깨어 빈 서버를 찾아 다시 띄울 때까지 그 자리는 비어 있습니다. 서버 한 대가 통째로 꺼지면 그 위의 컨테이너 전부가 그렇게 됩니다.',
      ],
      callout: { type: 'key', text: '필요한 것은 "무엇이 몇 개 떠 있어야 하는가"를 기억하고, 어긋나면 사람 대신 맞춰 주는 시스템입니다. 이것을 <b>오케스트레이션</b>이라고 합니다.' },
      show: ['dev', 'w1', 'w2', 'kl1', 'kl2', 'p1', 'p2', 'q1', 'e_ssh'],
      set: {
        w1: { label: '서버 1' }, w2: { label: '서버 2' },
        kl1: { label: 'Docker', icon: 'container', color: 'blue' },
        kl2: { label: 'Docker', icon: 'container', color: 'blue' },
        q1: { state: 'down' },
      },
      tags: [
        { on: 'q1', text: '죽은 채 방치', tone: 'bad', icon: 'x' },
        { on: 'dev', text: '서버마다 docker run', pos: 'bottom' },
      ],
      flows: [{ path: ['dev', 'kl1'], kind: 'ctrl', n: 2 }],
      metrics: { want: ['메모와 기억', 'warn'], have: ['29 / 30', 'bad'], heal: ['사람이 깰 때', 'bad'] },
    },
    {
      key: '클러스터', kind: 'concept', title: '클러스터는 두 부분으로 나뉩니다',
      body: [
        '<b>쿠버네티스</b>는 여러 서버를 묶어 하나의 <b>클러스터</b>로 다룹니다. 두뇌인 <b>컨트롤 플레인</b>은 무엇이 어떻게 떠 있어야 하는지 기록하고 결정합니다. 실제 컨테이너는 <b>워커 노드</b>에서 돕니다.',
        '이제 서버에 ssh로 들어가지 않습니다. 원하는 상태를 YAML로 적어 <code>kubectl apply</code>로 건네면, 어느 노드에 띄울지도, 죽으면 다시 띄우는 일도 클러스터가 맡습니다.',
      ],
      callout: { type: 'tip', text: '노드마다 있는 <b>kubelet</b>이 컨트롤 플레인의 결정을 받아 자기 노드에서 컨테이너를 실행합니다. 부품을 하나씩 열어 봅시다.' },
      show: ['cp', 'api'],
      hide: ['e_ssh'],
      set: {
        w1: { label: '워커 노드 1' }, w2: { label: '워커 노드 2' },
        kl1: { label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
        kl2: { label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
        q1: { state: null },
      },
      tags: [{ on: 'dev', text: '원하는 상태를 선언', icon: 'file-code', pos: 'bottom' }],
      flows: [
        { path: ['dev', 'api'], kind: 'ctrl' },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 0.9 },
        { path: ['api', 'kl2'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { want: 'api ×3', have: ['3 / 3', 'ok'] },
      changes: [['+', '컨트롤 플레인: 결정하는 곳'], ['~', '서버 → 워커 노드'], ['-', '서버마다 ssh 접속']],
    },
    {
      key: 'API 서버', kind: 'concept', title: '모든 길은 API 서버로 통합니다',
      body: [
        '<b>API 서버</b>(kube-apiserver)는 클러스터의 유일한 입구입니다. <code>kubectl</code>의 HTTPS 요청은 <b>인증</b>(누구인가) → <b>인가</b>(RBAC: 해도 되는가) → <b>어드미션</b>(규칙 검사 · 기본값 채우기)을 통과해야 저장됩니다.',
        '스케줄러, 컨트롤러, kubelet도 서로 직접 말하지 않고 모두 API 서버로 읽고 씁니다. 그래서 이 한 곳에서 클러스터의 모든 변경을 검사하고 기록할 수 있습니다.',
      ],
      callout: { type: 'tip', text: '직접 설치한 클러스터에서는 컨트롤 플레인 부품도 <code>kube-system</code>의 Pod로 보입니다. 관리형 쿠버네티스에서는 사업자가 운영해서 보이지 않아요.' },
      hide: ['cp', 'w1', 'w2', 'kl1', 'kl2', 'p1', 'p2', 'q1'],
      focus: ['api'],
      flows: [{ path: ['dev', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'dev'], kind: 'res', n: 2, delay: 1 }],
      code: {
        title: '클러스터 들여다보기', lang: 'sh', hl: [1, 7],
        text: `$ kubectl get nodes
NAME       STATUS   ROLES
cp-1       Ready    control-plane
worker-1   Ready    <none>
worker-2   Ready    <none>

$ kubectl get pods -n kube-system
NAME                           READY
etcd-cp-1                      1/1
kube-apiserver-cp-1            1/1
kube-controller-manager-cp-1   1/1
kube-scheduler-cp-1            1/1
kube-proxy-7xk2p               1/1
kube-proxy-q9d4m               1/1
kube-proxy-z5h8r               1/1
coredns-5d78c9869d-4kq2x       1/1
coredns-5d78c9869d-v7m9s       1/1
`,
      },
    },
    {
      key: 'etcd', kind: 'concept', title: 'etcd: 클러스터의 유일한 기억',
      body: [
        '<b>etcd</b>는 클러스터의 모든 오브젝트(Deployment, Pod, Service, Secret…)를 담는 분산 키-값 저장소입니다. etcd에 직접 접근하는 것은 API 서버뿐이고, 다른 부품은 API 서버를 거쳐 읽습니다.',
        'etcd는 여러 대가 <b>과반수</b>의 동의(Raft 합의)로 값을 정합니다. 그래서 3대면 1대, 5대면 2대가 죽어도 버팁니다. 4대로 늘려도 견디는 수는 3대와 같아서 홀수로 둡니다.',
      ],
      callout: { type: 'warn', text: 'etcd를 잃으면 클러스터는 무엇을 띄워야 했는지 잊습니다. 직접 운영한다면 etcd 스냅샷 백업은 필수입니다.' },
      show: ['cp', 'etcd'],
      hide: ['dev'],
      focus: ['etcd'],
      flows: [{ path: ['api', 'etcd'], kind: 'data', n: 2 }, { path: ['etcd', 'api'], kind: 'data', delay: 1.2 }],
      panel: { title: 'etcd는 몇 대로?', icon: 'database', rows: [['1대', '장애 허용 0대', 'bad'], ['3대', '1대까지 버팀', 'ok'], ['4대', '여전히 1대까지', 'warn'], ['5대', '2대까지 버팀', 'ok']] },
    },
    {
      key: '스케줄러', kind: 'concept', title: '스케줄러와 컨트롤러 매니저',
      body: [
        '<b>스케줄러</b>는 아직 노드가 정해지지 않은 Pod를 지켜보다가, 노드들의 남은 자원과 제약을 따져 하나를 골라 API 서버에 적어 둡니다. 컨테이너를 직접 띄우지는 않아요. 고르는 기준은 스케줄링 레슨에서 봅니다.',
        '<b>컨트롤러 매니저</b>는 여러 <b>컨트롤러</b>를 한 프로세스로 묶은 것입니다. Deployment · ReplicaSet · Node · Job 컨트롤러가 각자 맡은 오브젝트를 지켜보며, 모자란 것은 만들고 남는 것은 지웁니다.',
      ],
      callout: { type: 'key', text: '둘 다 API 서버를 <b>지켜보고(watch)</b> 결과를 API 서버에 쓸 뿐입니다. 서로 직접 호출하지 않으니, 하나가 잠시 멈췄다 돌아와도 이어서 일합니다.' },
      show: ['sched', 'cm'],
      tags: [
        { on: 'sched', text: '노드 고르기', icon: 'signpost', pos: 'right' },
        { on: 'cm', text: '개수 맞추기', icon: 'refresh', pos: 'left' },
      ],
      flows: [
        { path: ['api', 'sched'], kind: 'ctrl' }, { path: ['sched', 'api'], kind: 'ctrl', delay: 0.9 },
        { path: ['api', 'cm'], kind: 'ctrl', delay: 0.4 }, { path: ['cm', 'api'], kind: 'ctrl', delay: 1.3 },
      ],
    },
    {
      key: '조정 루프', kind: 'concept', title: '원하는 상태와 실제 상태를 맞추는 루프',
      body: [
        '오브젝트에는 두 칸이 있습니다. 내가 쓰는 <code>spec</code>은 <b>원하는 상태</b>, 클러스터가 쓰는 <code>status</code>는 <b>실제 상태</b>입니다. 컨트롤러는 둘을 비교해 차이를 메우는 일을 끝없이 되풀이합니다. 이것이 <b>조정 루프</b>(reconcile)입니다.',
        '"하나 더 띄워라"라는 명령이 아니라 "3개여야 한다"는 상태를 맡겼기 때문에, 중간에 이벤트를 놓쳐도 다음 비교에서 다시 맞춥니다.',
      ],
      callout: { type: 'warn', text: '그래서 손으로 고친 값도, YAML에 적힌 필드라면 다음 <code>apply</code>가 YAML대로 되돌립니다. 진실은 저장소의 YAML에 두세요.' },
      hide: ['cp', 'sched'],
      focus: ['cm'],
      tags: [{ on: 'cm', text: '관찰 → 비교 → 조치', icon: 'repeat', pos: 'left' }],
      flows: [{ path: ['api', 'cm'], kind: 'ctrl', n: 3, gap: 1.2 }, { path: ['cm', 'api'], kind: 'ctrl', n: 3, gap: 1.2, delay: 0.6 }],
      code: {
        title: 'deploy/api 조회', lang: 'yaml', hl: [5, 6, 8, 9, 10],
        text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:              # 원하는 상태 (내가)
  replicas: 3
  # selector · template 생략
status:            # 실제 상태 (클러스터가)
  replicas: 3
  readyReplicas: 2   # 1개 부족
`,
      },
      metrics: { have: ['2 / 3', 'warn'] },
    },
    {
      key: '워커 노드', kind: 'concept', title: '워커 노드: 실제로 일하는 곳',
      body: [
        '노드마다 <b>kubelet</b>이 하나씩 돕니다. API 서버에서 자기 노드에 배정된 Pod를 보고, <b>컨테이너 런타임</b>에 이미지를 받아 실행하라고 맡긴 뒤, 상태를 API 서버에 계속 보고합니다.',
        '런타임은 containerd나 CRI-O 같은 CRI 구현입니다. 1.24부터 Docker 엔진을 직접 쓰는 길(dockershim)은 사라졌지만, Docker로 빌드한 이미지는 표준(OCI) 형식이라 그대로 돕니다.',
      ],
      callout: { type: 'tip', text: '<b>kube-proxy</b>는 Service 주소로 온 트래픽이 Pod에 닿도록 노드에 규칙을 깔아 둡니다. Service 레슨에서 다시 만납니다.' },
      hide: ['etcd', 'cm'],
      show: ['cp', 'w1', 'kl1', 'rt1', 'px1', 'p1', 'p2'],
      focus: ['kl1'],
      tags: [
        { on: 'kl1', text: '실행하고 보고', icon: 'heart-pulse', pos: 'left' },
        { on: 'px1', text: 'Service 규칙', pos: 'bottom' },
      ],
      flows: [
        { path: ['api', 'kl1'], kind: 'ctrl' },
        { path: ['kl1', 'rt1'], kind: 'ctrl', delay: 0.8 },
        { path: ['rt1', 'p2'], kind: 'ctrl', delay: 1.4 },
        { path: ['kl1', 'api'], kind: 'res', delay: 2.2 },
      ],
      metrics: { have: ['3 / 3', 'ok'] },
    },
    {
      key: 'apply 여정', kind: 'solution', title: 'kubectl apply 한 번이 흘러가는 길',
      body: [
        '<code>kubectl apply -f api.yaml</code>을 치면 ① API 서버가 검사하고 etcd에 저장합니다. ② 컨트롤러가 이를 보고 Pod 3개를 만듭니다(아직 노드 없음). ③ 스케줄러가 Pod마다 노드를 정합니다. ④ 그 노드의 kubelet이 런타임으로 컨테이너를 띄웁니다.',
        '모든 화살표가 API 서버를 거칩니다. 각 부품은 자기 일만 하고 결과를 API 서버에 적으며, 다음 부품은 그것을 지켜보다 이어받습니다.',
      ],
      callout: { type: 'tip', text: '<code>kubectl get events</code>에 이 순서(Scheduled → Pulling → Started)가 남습니다. Pod가 안 뜰 때 어느 단계에서 멈췄는지 찾는 첫 단서예요.' },
      show: ['dev', 'etcd', 'cm', 'sched'],
      hide: ['px1'],
      set: { p1: { state: 'ok' }, p2: { state: 'ok' } },
      tags: [
        { on: 'api', text: '① 검사 · 저장', tone: 'accent', pos: 'bottom' },
        { on: 'cm', text: '② Pod 생성', tone: 'accent', pos: 'left' },
        { on: 'sched', text: '③ 노드 배정', tone: 'accent', pos: 'right' },
        { on: 'kl1', text: '④ 실행', tone: 'accent', pos: 'left' },
      ],
      flows: [
        { path: ['dev', 'api'], kind: 'ctrl' },
        { path: ['api', 'etcd'], kind: 'data', delay: 0.8 },
        { path: ['api', 'cm'], kind: 'ctrl', delay: 1.5 }, { path: ['cm', 'api'], kind: 'ctrl', delay: 2.2 },
        { path: ['api', 'sched'], kind: 'ctrl', delay: 2.9 }, { path: ['sched', 'api'], kind: 'ctrl', delay: 3.6 },
        { path: ['api', 'kl1', 'rt1', 'p2'], kind: 'ctrl', delay: 4.3 },
      ],
      metrics: { want: 'api ×3', have: ['0 → 3', 'ok'] },
    },
    {
      key: '노드 장애', kind: 'case', title: '사례: 워커 노드 하나가 꺼졌습니다',
      body: [
        '워커 노드 2의 전원이 나갔습니다. kubelet의 하트비트가 끊기고 수십 초 뒤 노드는 <code>NotReady</code>가 됩니다. 기본 설정에서는 몇 분(약 5분) 더 기다린 뒤 그 노드의 Pod를 지우고, ReplicaSet 컨트롤러가 모자란 만큼 새로 만들며, 스케줄러가 살아 있는 노드를 고릅니다.',
        '아무도 깨지 않았습니다. 다만 복구는 분 단위라서, 노드 하나가 죽어도 버틸 만큼 Pod를 여러 노드에 나눠 두는 것이 먼저입니다.',
      ],
      callout: { type: 'warn', text: '컨트롤 플레인이 멈추면 반대입니다. 이미 뜬 Pod는 계속 돌지만, 배포도 복구도 멈춥니다. 운영 클러스터는 컨트롤 플레인을 여러 대로 두거나 관리형을 씁니다.' },
      show: ['w2', 'kl2', 'q1', 'p3'],
      hide: ['dev', 'etcd', 'rt1'],
      set: { kl2: { state: 'down', badge: 'NotReady', tone: 'bad' }, q1: { state: 'down' }, p3: { state: 'ok' } },
      tags: [
        { on: 'q1', text: '노드와 함께 사라짐', tone: 'bad', pos: 'bottom' },
        { on: 'p3', text: '대신 새로 생성', tone: 'ok', pos: 'bottom' },
      ],
      flows: [
        { path: ['kl2', 'api'], kind: 'bad' },
        { path: ['cm', 'api'], kind: 'ctrl', delay: 0.9 },
        { path: ['sched', 'api'], kind: 'ctrl', delay: 1.6 },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 2.3 },
      ],
      metrics: { have: ['2 → 3', 'warn'], heal: ['자동 · 몇 분', 'ok'] },
      changes: [['-', '워커 노드 2와 그 위의 Pod'], ['+', '노드 1에 대체 Pod'], ['~', '사람의 개입 없음']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 선언하면 클러스터가 맞춥니다',
      body: [
        '컨트롤 플레인의 <b>API 서버</b>는 유일한 입구, <b>etcd</b>는 유일한 기억입니다. <b>스케줄러</b>는 자리를 정하고 <b>컨트롤러</b>는 개수를 맞춥니다. 워커 노드의 <b>kubelet</b>은 런타임으로 컨테이너를 띄우고 상태를 보고합니다.',
        '모든 부품이 원하는 상태와 실제 상태를 비교해 차이를 메우는 조정 루프를 돕니다. 다음 레슨에서는 우리가 선언하는 첫 오브젝트, Pod와 Deployment를 열어 봅니다.',
      ],
      show: ['etcd'],
      hide: ['w2', 'kl2', 'q1'],
      set: { kl2: { state: null, badge: null } },
      flows: [
        { path: ['api', 'cm'], kind: 'ctrl', n: 2, gap: 1.2 }, { path: ['cm', 'api'], kind: 'ctrl', n: 2, gap: 1.2, delay: 0.6 },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 0.3 },
      ],
      metrics: { have: ['3 / 3', 'ok'] },
    },
  ],
  quiz: [
    {
      q: '자체 구축한 클러스터의 컨트롤 플레인이 30분 동안 통째로 멈췄습니다. 그동안 일어나는 일로 가장 맞는 것은?',
      options: [
        '모든 Pod가 즉시 멈춰 서비스가 중단된다',
        '이미 실행 중인 Pod는 계속 요청을 처리하지만, 배포 · 스케일 · 장애 복구는 일어나지 않는다',
        '워커 노드의 kubelet 중 하나가 컨트롤 플레인 역할을 넘겨받는다',
        'etcd의 데이터가 지워져 컨트롤 플레인이 돌아오면 모두 다시 배포해야 한다',
      ],
      answer: 1,
      why: '컨테이너를 실제로 돌리는 것은 워커 노드의 kubelet과 런타임이라 이미 뜬 Pod는 계속 동작합니다. 하지만 결정하고 맞추는 쪽이 멈췄으니 그동안 죽은 Pod는 되살아나지 않습니다. kubelet이 역할을 넘겨받는 기능은 없고, etcd 데이터는 멈춘다고 지워지지 않습니다.',
    },
    {
      q: 'kubectl apply는 성공했는데 새 Pod가 계속 Pending이고, kubectl get events에 Scheduled 기록이 없습니다. 어느 부품의 단계에서 멈춘 것일까요?',
      options: [
        '컨테이너 런타임: 이미지를 받지 못하고 있다',
        'etcd: 오브젝트가 저장되지 않았다',
        '스케줄러: 조건을 만족하는 노드를 찾지 못했다',
        'kubelet: 컨테이너를 시작하다 실패했다',
      ],
      answer: 2,
      why: 'Pod가 만들어졌다는 것은 API 서버와 etcd, 컨트롤러까지는 지났다는 뜻입니다. 노드 배정(Scheduled)이 없으니 스케줄러 단계입니다. 런타임이나 kubelet 문제라면 노드가 정해진 뒤 ContainerCreating · ImagePullBackOff 같은 상태로 보입니다.',
    },
    {
      q: 'etcd 3대를 운영하던 팀이 "더 튼튼하게" 4대로 늘리자고 합니다. 가장 알맞은 판단은?',
      options: [
        '좋다. 4대면 2대가 죽어도 버틴다',
        '이득이 없다. 과반수가 3이 되어 버티는 대수는 여전히 1대다. 늘리려면 5대로',
        '짝수여야 투표가 동점이 나지 않아 더 안정적이다',
        'etcd는 대수와 무관하게 1대만 살아 있으면 동작한다',
      ],
      answer: 1,
      why: 'etcd는 과반수가 살아 있어야 씁니다. 3대의 과반수는 2(1대 장애 허용), 4대의 과반수는 3(여전히 1대)입니다. 대수만 늘고 버티는 힘은 같으니 홀수로 둡니다. 짝수는 오히려 반반으로 갈라질 위험이 있습니다.',
    },
    {
      q: '장애 대응 중 누군가 kubectl scale로 api를 3개에서 6개로 늘렸습니다. 한 시간 뒤 CI가 replicas: 3이 적힌 YAML을 다시 apply했습니다. 결과는?',
      options: [
        '마지막 명령이 이기므로 6개가 유지된다',
        '두 값이 더해져 9개가 된다',
        '값이 충돌해 apply가 오류로 실패한다',
        'YAML의 3이 원하는 상태가 되어 컨트롤러가 3개로 줄인다',
      ],
      answer: 3,
      why: 'apply는 YAML에 적힌 필드를 원하는 상태로 기록하고, 컨트롤러는 그 상태에 맞춥니다. 손으로 바꾼 값은 다음 apply에 사라집니다. 바꾼 내용을 지키려면 YAML(Git)을 고쳐야 합니다. HPA를 쓸 때 YAML에서 replicas를 빼는 것도 같은 이유입니다.',
    },
  ],
};
