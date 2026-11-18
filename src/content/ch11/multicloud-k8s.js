export default {
  id: 'multicloud-k8s',
  learn: [
    '클라우드마다 다른 클러스터, 공통분모는 Kubernetes API',
    'kubeconfig 컨텍스트와 그 위험',
    'Argo CD ApplicationSet으로 플릿에 한 번에 배포하기',
    '클러스터별 차이를 overlay · values로 흡수하기',
    '멀티 클러스터 연결과 수명 관리 도구의 역할',
    '관측을 한 화면으로 모으기',
  ],
  legend: [['ctrl', 'kubectl · 동기화'], ['req', '요청'], ['data', '메트릭 · 로그'], ['bad', '실패']],
  metrics: [
    { id: 'ver', label: '앱 버전', icon: 'tag' },
    { id: 'how', label: '배포 방법', icon: 'rocket' },
    { id: 'yaml', label: '매니페스트', icon: 'file-code' },
    { id: 'dash', label: '대시보드', icon: 'chart-line' },
  ],
  scene: {
    nodes: {
      dev: { kind: 'client', at: [0, 0], label: '엔지니어' },
      git: { kind: 'cyl', at: [-2.4, 1.2], label: 'Git 저장소', icon: 'git', color: 'slate' },
      argo: { at: [0, 0], label: 'Argo CD', sub: '관리 클러스터', icon: 'refresh', color: 'navy' },
      users: { kind: 'users', at: [-2.4, 1.2], label: '사용자' },
      glb: { at: [0, 0], label: 'GSLB', sub: '글로벌 입구', icon: 'compass', color: 'purple' },
      mgmt: { at: [0, 0], label: '관리 계층', sub: '생성 · 업그레이드', icon: 'settings', color: 'olive' },
      eks: { at: [0.8, 4.4], size: 's', label: 'EKS', sub: 'AWS', icon: 'helm', color: 'aws' },
      aks: { at: [2, 3.2], size: 's', label: 'AKS', sub: 'Azure', icon: 'helm', color: 'azure' },
      gke: { at: [3.2, 2], size: 's', label: 'GKE', sub: 'GCP', icon: 'helm', color: 'gcp' },
      nks: { at: [4.4, 0.8], size: 's', label: 'NKS', sub: 'NCP', icon: 'helm', color: 'ncp' },
      obs: { at: [5.4, 5.4], label: 'Grafana', sub: '중앙 관측', icon: 'chart-line', color: 'yellow' },
    },
    edges: {
      d1: { from: 'dev', to: 'eks' },
      d2: { from: 'dev', to: 'aks' },
      d3: { from: 'dev', to: 'gke' },
      d4: { from: 'dev', to: 'nks' },
      e_git: { from: 'git', to: 'argo' },
      a1: { from: 'argo', to: 'eks' },
      a2: { from: 'argo', to: 'aks' },
      a3: { from: 'argo', to: 'gke' },
      a4: { from: 'argo', to: 'nks' },
      e_u_glb: { from: 'users', to: 'glb' },
      g1: { from: 'glb', to: 'eks' },
      g2: { from: 'glb', to: 'aks', style: 'dashed', tone: 'mute' },
      mesh: { from: 'eks', to: 'aks', via: [[2.5, 4.9]], bi: true, tone: 'accent', label: 'mTLS' },
      c1: { from: 'mgmt', to: 'eks', style: 'dashed' },
      c2: { from: 'mgmt', to: 'aks', style: 'dashed' },
      c3: { from: 'mgmt', to: 'gke', style: 'dashed' },
      c4: { from: 'mgmt', to: 'nks', style: 'dashed' },
      o1: { from: 'eks', to: 'obs' },
      o2: { from: 'aks', to: 'obs' },
      o3: { from: 'gke', to: 'obs' },
      o4: { from: 'nks', to: 'obs' },
    },
  },
  codes: {
    ctx: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl config get-contexts
CURRENT  NAME      CLUSTER
*        eks-prod  eks-prod
         aks-dr    aks-dr
         gke-data  gke-data
         nks-gov   nks-gov

$ kubectl config use-context nks-gov
Switched to context "nks-gov".

$ kubectl --context eks-prod get nodes`,
    },
    appset: {
      title: 'applicationset.yaml', lang: 'yaml',
      text: `apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: shop
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            fleet: shop
  template:
    metadata:
      name: 'shop-{{name}}'
    spec:
      project: default
      source:
        repoURL: https://git.example/shop.git
        path: 'overlays/{{name}}'
      destination:
        server: '{{server}}'
        namespace: shop`,
    },
    overlay: {
      title: 'overlays/aks-dr/', lang: 'yaml',
      text: `# overlays/aks-dr/kustomization.yaml
resources:
  - ../../base
patches:
  - path: pvc-class.yaml
  - path: service-lb.yaml
---
# overlays/aks-dr/pvc-class.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shop-data
spec:
  storageClassName: managed-csi`,
    },
  },
  steps: [
    {
      key: '클러스터 넷', kind: 'problem', title: '클러스터가 넷이면 배포도 네 번',
      body: [
        '네 클라우드를 이은 망 위에 클러스터를 하나씩 올렸습니다. AWS의 EKS는 글로벌 서비스, Azure의 AKS는 DR 대기, GCP의 GKE는 분석 배치, NCP의 NKS는 공공 서비스를 맡습니다.',
        '배포는 엔지니어가 클러스터마다 <code>kubectl apply</code>를 돌립니다. 손으로 네 번 하다 보니 한 곳을 빼먹거나 순서가 꼬이고, 어느새 클러스터마다 <b>다른 버전</b>이 돌고 있습니다. 넷이 스무 개가 되면 사람 손으로는 감당할 수 없어요.',
      ],
      callout: { type: 'key', text: '여러 클러스터를 하나하나가 아니라 <b>한 묶음</b>으로 다루는 것을 플릿(fleet) 관리라고 합니다. 이 레슨의 목표입니다.' },
      show: ['dev', 'eks', 'aks', 'gke', 'nks'],
      set: {
        eks: { badge: 'v1.4' }, aks: { badge: 'v1.2', tone: 'bad' }, gke: { badge: 'v1.4' }, nks: { badge: 'v1.3', tone: 'warn' },
      },
      tags: [
        { on: 'eks', text: '글로벌 서비스', tone: 'aws', pos: 'bottom' },
        { on: 'aks', text: 'DR 대기', tone: 'azure', pos: 'bottom' },
        { on: 'gke', text: '분석 배치', tone: 'gcp', pos: 'bottom' },
        { on: 'nks', text: '공공 서비스', tone: 'ncp', pos: 'bottom' },
      ],
      flows: [
        { path: ['dev', 'eks'], kind: 'ctrl' }, { path: ['dev', 'gke'], kind: 'ctrl', delay: 0.6 },
        { path: ['dev', 'nks'], kind: 'ctrl', delay: 1.2 }, { path: ['dev', 'aks'], kind: 'bad', delay: 1.8 },
      ],
      metrics: { ver: ['제각각', 'bad'], how: 'kubectl × 4', yaml: '1벌', dash: '4개' },
    },
    {
      key: '공통 API', kind: 'concept', title: '공통분모는 Kubernetes API',
      body: [
        '네 서비스는 만든 회사도 콘솔도 다르지만, 우리가 말을 거는 상대는 똑같은 <b>Kubernetes API</b>입니다. Deployment, Service, ConfigMap의 YAML은 어디서나 같은 뜻이에요. 관리형 서비스들은 적합성(conformance) 인증으로 이 호환을 확인받습니다.',
        '그래서 멀티클라우드에서 Kubernetes는 <b>공통 층</b>이 됩니다. VM, 네트워크, 디스크 같은 클라우드별 차이는 클러스터 아래로 내려가고, 앱 팀은 그 위에서 한 가지 방식으로 일합니다.',
      ],
      callout: { type: 'warn', text: '"같다"는 것은 API까지입니다. 스토리지, 로드 밸런서, 권한 연동처럼 <b>클라우드와 맞닿는 부분</b>은 다릅니다. 곧 부딪힙니다.' },
      tags: [{ on: 'dev', text: '같은 YAML · 같은 kubectl', icon: 'file-code' }],
      flows: [
        { path: ['dev', 'eks'], kind: 'ctrl' }, { path: ['dev', 'aks'], kind: 'ctrl', delay: 0.2 },
        { path: ['dev', 'gke'], kind: 'ctrl', delay: 0.4 }, { path: ['dev', 'nks'], kind: 'ctrl', delay: 0.6 },
      ],
    },
    {
      key: '컨텍스트', kind: 'concept', title: 'kubeconfig: 지금 누구에게 말하는 중인가',
      body: [
        '<code>kubectl</code>이 어느 클러스터에 말을 걸지는 <b>kubeconfig</b> 파일이 정합니다. 클러스터 주소, 인증 방법, 그리고 둘을 묶은 <b>컨텍스트</b>가 들어 있어요. 네 클러스터를 한 파일에 등록하고 <code>use-context</code>로 바꿔 가며 씁니다.',
        '편리하지만 위험합니다. 현재 컨텍스트는 눈에 보이지 않아서, 다른 클러스터인 줄 알고 친 <code>delete</code>가 운영 클러스터로 날아가는 사고가 흔합니다.',
      ],
      callout: { type: 'tip', text: '스크립트에는 <code>--context</code>를 항상 적고, 셸 프롬프트에 현재 컨텍스트를 띄워 두세요. 더 근본적인 답은 사람이 운영 클러스터에 <b>직접 apply하지 않는 것</b>입니다.' },
      focus: ['eks'],
      set: { eks: { badge: '* 현재' }, aks: { badge: null }, gke: { badge: null }, nks: { badge: null } },
      code: { ref: 'ctx', hl: [3, 8, 11] },
      flows: [{ path: ['dev', 'eks'], kind: 'ctrl', n: 2 }],
    },
    {
      key: '플릿 GitOps', kind: 'solution', title: 'Git 하나가 네 클러스터를 움직입니다',
      body: [
        '9장의 GitOps를 플릿으로 넓힙니다. 관리용 클러스터에 <b>Argo CD</b>를 두고 네 클러스터를 등록합니다. 사람은 Git에 머지만 하고, Argo CD가 각 클러스터를 Git의 상태로 맞춥니다.',
        '<b>ApplicationSet</b>은 Application을 찍어 내는 틀입니다. 클러스터 제너레이터가 <code>fleet: shop</code> 라벨이 붙은 클러스터마다 하나씩 만들어 주니, 다섯 번째 클러스터는 라벨만 붙이면 같은 앱이 깔립니다.',
      ],
      callout: { type: 'warn', text: '이 구조에서는 Argo CD가 모든 클러스터의 API에 닿아야 하고, 그 자격 증명이 한곳에 모입니다. 관리 클러스터를 <b>가장 엄격하게</b> 지키세요.' },
      hide: ['dev'],
      show: ['git', 'argo'],
      set: { eks: { badge: 'v1.5', tone: 'ok' }, aks: { badge: 'v1.5', tone: 'ok' }, gke: { badge: 'v1.5', tone: 'ok' }, nks: { badge: 'v1.5', tone: 'ok' } },
      code: { ref: 'appset', hl: [7, 8, 9, 10, 13, 18] },
      flows: [
        { path: ['git', 'argo'], kind: 'ctrl' },
        { path: ['argo', 'eks'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'aks'], kind: 'ctrl', delay: 1 },
        { path: ['argo', 'gke'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'nks'], kind: 'ctrl', delay: 1 },
      ],
      metrics: { ver: ['4곳 동일', 'ok'], how: ['Git 머지 1번', 'ok'] },
      changes: [['+', 'Argo CD (관리 클러스터)'], ['+', 'ApplicationSet: 클러스터당 앱 1개'], ['~', 'kubectl × 4 → Git 머지 1번']],
    },
    {
      key: 'PVC Pending', kind: 'case', title: '사례: EKS에선 되는데 AKS에선 Pending',
      body: [
        '같은 매니페스트가 네 곳에 배포됐는데 AKS에서만 Pod가 뜨지 않습니다. PVC가 <code>Pending</code>입니다. 매니페스트에 <code>storageClassName: gp3</code>라고 적혀 있었는데, 그 이름의 <b>StorageClass</b>는 EKS에만 만들어져 있었던 거예요.',
        '클라우드와 맞닿는 곳은 전부 이렇습니다. 디스크를 만드는 StorageClass, 바깥 트래픽을 받는 <b>Ingress 클래스</b>, 로드 밸런서의 성격을 정하는 <b>Service 애너테이션</b>이 클라우드마다 다릅니다.',
      ],
      callout: { type: 'key', text: '차이는 없어지지 않습니다. 할 수 있는 일은 차이를 <b>한곳에 모아 눈에 보이게</b> 하는 것입니다.' },
      hide: ['git'],
      set: { eks: { badge: null }, gke: { badge: null }, nks: { badge: null }, aks: { state: 'hot', badge: 'PVC Pending', tone: 'bad' } },
      panel: {
        title: '클라우드와 맞닿는 부분', icon: 'puzzle',
        rows: [['EKS', 'EBS CSI · ALB 컨트롤러', 'aws'], ['AKS', 'managed-csi · App Gateway', 'azure'], ['GKE', 'standard-rwo · GCE Ingress', 'gcp'], ['NKS', '블록 스토리지 CSI · 전용 LB', 'ncp']],
      },
      flows: [
        { path: ['argo', 'eks'], kind: 'ctrl' }, { path: ['argo', 'gke'], kind: 'ctrl' },
        { path: ['argo', 'nks'], kind: 'ctrl' }, { path: ['argo', 'aks'], kind: 'bad' },
      ],
      metrics: { yaml: ['차이 미반영', 'bad'] },
      changes: [['-', 'AKS: PVC Pending'], ['~', '원인: 없는 StorageClass 이름'], ['~', 'Ingress · LB 애너테이션도 같은 문제']],
    },
    {
      key: 'overlay', kind: 'solution', title: '공통은 base에, 차이는 overlay에',
      body: [
        '<b>Kustomize</b>는 공통 매니페스트를 <code>base</code>에 두고, 클러스터마다 다른 부분만 <code>overlays/</code> 아래에 패치로 적습니다. ApplicationSet의 <code>path</code>가 클러스터 이름으로 overlay를 고르니, 클러스터는 저마다 자기 것을 받아 갑니다.',
        '<b>Helm</b>이라면 같은 차트에 <code>values-aks.yaml</code>처럼 클러스터별 값 파일을 두는 것이 같은 역할을 합니다. 어느 쪽이든 원칙은 하나, <b>복사하지 말고 차이만 적기</b>입니다.',
      ],
      callout: { type: 'tip', text: 'overlay가 두꺼워지면 신호입니다. 그 차이가 정말 클라우드 때문인지, 환경이 <b>제각각으로 자란 것</b>인지 리뷰하세요.' },
      show: ['git'],
      set: { aks: { state: 'ok', badge: 'Bound', tone: 'ok' } },
      focus: ['aks'],
      code: { ref: 'overlay', hl: [5, 6, 14] },
      flows: [{ path: ['git', 'argo'], kind: 'ctrl' }, { path: ['argo', 'aks'], kind: 'ctrl', n: 2, delay: 1 }],
      metrics: { yaml: ['base 1 + overlay 4', 'ok'] },
      changes: [['+', 'base: 공통 매니페스트'], ['+', 'overlays: 클러스터별 패치'], ['~', 'AKS PVC: Pending → Bound']],
    },
    {
      key: '서비스 연결', kind: 'concept', title: '클러스터를 넘나드는 트래픽 (개요)',
      body: [
        '방향이 둘입니다. 바깥 사용자의 요청(north-south)은 앞 레슨의 <b>GSLB나 글로벌 로드 밸런서</b>가 클러스터 사이에서 나눕니다. 평소에는 EKS로, 장애 때는 AKS로 보내는 식이에요.',
        '클러스터 안의 서비스가 다른 클러스터의 서비스를 부르는 것(east-west)은 <b>서비스 메시</b>의 영역입니다. Istio, Linkerd, Cilium Cluster Mesh 같은 도구가 클러스터 너머의 서비스를 찾아 주고, <b>mTLS</b>로 암호화하고, 한쪽이 죽으면 다른 쪽으로 돌립니다.',
      ],
      callout: { type: 'warn', text: '멀티 클러스터 메시는 강력한 만큼 운영이 어렵습니다. 클러스터 간 호출이 몇 개뿐이라면 <b>내부 로드 밸런서와 사설 DNS</b>로 충분한지부터 따져 보세요.' },
      hide: ['git', 'argo'],
      show: ['users', 'glb'],
      set: { aks: { state: null, badge: null } },
      tags: [{ on: 'glb', text: 'north-south', tone: 'accent', pos: 'right' }, { at: [2.5, 4.9], text: 'east-west', tone: 'accent', dy: 30 }],
      flows: [
        { path: ['users', 'glb', 'eks'], kind: 'req', n: 2 },
        { path: ['eks', [2.5, 4.9], 'aks'], kind: 'req', n: 1, delay: 1.6 },
      ],
    },
    {
      key: '수명 관리', kind: 'concept', title: '클러스터 자체도 만들고 올려야 합니다',
      body: [
        '앱만이 아니라 <b>클러스터 자체</b>도 관리 대상입니다. Kubernetes는 한 해에 세 번쯤 새 버전이 나오고 관리형 서비스는 오래된 버전의 지원을 끊으니, 네 곳을 계속 업그레이드해야 합니다. 한 곳에서 먼저 올려 보고 차례로 넓히세요.',
        '도구는 이름과 역할만 알아 둡니다. <b>Cluster API</b>는 클러스터를 Kubernetes 객체로 선언해 관리 클러스터가 만들고 고치게 합니다. <b>Azure Arc</b>와 Google의 <b>Anthos</b> 계열은 다른 클라우드의 클러스터까지 자기 콘솔에 등록해 정책과 구성을 한 화면에서 다루는 관리 계층입니다.',
      ],
      callout: { type: 'key', text: '플릿의 버전 차이를 <b>작게</b> 유지하세요. 벌어질수록 같은 매니페스트가 클러스터마다 다르게 동작합니다.' },
      hide: ['users', 'glb'],
      show: ['mgmt'],
      set: { eks: { badge: '1.33' }, aks: { badge: '1.33' }, gke: { badge: '1.34', tone: 'ok' }, nks: { badge: '1.32', tone: 'warn' } },
      panel: {
        title: '도구와 역할', icon: 'wrench',
        rows: [['Terraform', '클러스터 · 주변 인프라 생성', 'info'], ['Cluster API', '클러스터를 K8s 객체로 선언', 'accent'], ['Azure Arc', '외부 클러스터를 Azure에 등록', 'azure'], ['Anthos (GKE 플릿)', '여러 클라우드를 한 화면에', 'gcp']],
      },
      flows: [{ path: ['mgmt', 'gke'], kind: 'ctrl' }, { path: ['mgmt', 'eks'], kind: 'ctrl', delay: 1 }, { path: ['mgmt', 'aks'], kind: 'ctrl', delay: 1.3 }, { path: ['mgmt', 'nks'], kind: 'ctrl', delay: 1.6 }],
    },
    {
      key: '관측 통합', kind: 'concept', title: '대시보드도 하나로 모읍니다',
      body: [
        '클러스터마다 모니터링이 따로면 장애 때 화면 네 개를 번갈아 봐야 합니다. 10장의 스택을 플릿으로 넓힙니다. 각 클러스터에는 <b>수집기</b>(Prometheus 에이전트나 OpenTelemetry Collector)만 두고, 메트릭·로그·트레이스를 <b>중앙 저장소</b>로 보냅니다.',
        '핵심은 모든 신호에 <code>cluster</code>와 <code>cloud</code> <b>라벨</b>을 붙이는 것입니다. 그래야 한 대시보드에서 "NKS만 느리다"를 바로 가려낼 수 있습니다.',
      ],
      callout: { type: 'warn', text: '관측 데이터도 클라우드 경계를 넘으면 <b>전송 비용</b>이 붙습니다. 로그는 보내기 전에 걸러 내고, 메트릭은 필요한 것만 보내세요.' },
      hide: ['mgmt'],
      show: ['obs'],
      set: { eks: { badge: null }, aks: { badge: null }, gke: { badge: null }, nks: { badge: null } },
      focus: ['obs'],
      tags: [{ on: 'nks', text: 'cluster=nks-gov', icon: 'tag' }, { on: 'eks', text: 'cluster=eks-prod', icon: 'tag' }],
      flows: [
        { path: ['eks', 'obs'], kind: 'data', n: 2 }, { path: ['aks', 'obs'], kind: 'data', n: 2, delay: 0.2 },
        { path: ['gke', 'obs'], kind: 'data', n: 2, delay: 0.4 }, { path: ['nks', 'obs'], kind: 'data', n: 2, delay: 0.6 },
      ],
      metrics: { dash: ['1개', 'ok'] },
      changes: [['+', '클러스터마다 수집기'], ['+', '중앙 저장소 + Grafana'], ['~', '대시보드 4개 → 1개']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 넷을 하나처럼 다루는 네 가지',
      body: [
        '공통분모는 <b>Kubernetes API</b>, 배포는 <b>Git과 ApplicationSet</b>, 차이는 <b>overlay</b>, 눈은 <b>중앙 관측</b>. 이 넷이 있으면 클러스터가 넷이든 스물이든 같은 방식으로 다룰 수 있습니다. 메시와 수명 관리 도구는 필요가 분명해질 때 얹습니다.',
        '아직 두 가지가 비어 있습니다. 사람과 워크로드는 네 클라우드에 <b>무슨 자격으로</b> 들어가는가, 그리고 <b>데이터</b>는 어디에 두는가. 다음 레슨의 주제입니다.',
      ],
      show: ['argo'],
      focus: ['argo', 'obs'],
      flows: [
        { path: ['argo', 'eks'], kind: 'ctrl' }, { path: ['argo', 'aks'], kind: 'ctrl' }, { path: ['argo', 'gke'], kind: 'ctrl' }, { path: ['argo', 'nks'], kind: 'ctrl' },
        { path: ['eks', 'obs'], kind: 'data', delay: 1.4 }, { path: ['nks', 'obs'], kind: 'data', delay: 1.4 },
      ],
    },
  ],
  quiz: [
    {
      q: '클러스터 4개에 배포할 때마다 엔지니어가 kubectl을 네 번 돌립니다. 다음 달에 다섯 번째 클러스터가 추가됩니다. 가장 효과적인 개선은?',
      options: [
        '네 번 돌리는 명령을 셸 스크립트 하나로 묶는다',
        'Git을 기준으로 삼고, ApplicationSet의 클러스터 제너레이터로 등록된 클러스터마다 앱을 만들게 한다',
        '클러스터를 하나로 합쳐서 배포를 한 번으로 줄인다',
        '배포 담당자를 클러스터마다 한 명씩 둔다',
      ],
      answer: 1,
      why: 'ApplicationSet은 클러스터가 늘어도 라벨만 붙이면 같은 앱이 깔리고, 누가 손댄 것도 Git 상태로 되돌려 줍니다. 스크립트는 횟수만 줄일 뿐 드리프트를 못 잡습니다. 클러스터를 합치면 규제와 장애 격리라는, 나눈 이유가 사라집니다.',
    },
    {
      q: '같은 Deployment와 PVC를 네 클러스터에 배포했는데 한 곳에서만 Pod가 Pending입니다. 가장 먼저 확인할 것은?',
      options: [
        '컨테이너 이미지의 크기',
        'PVC가 가리키는 StorageClass 이름이 그 클러스터에 실제로 있는지',
        'Git 저장소의 브랜치 이름',
        '그 클라우드의 리전 개수',
      ],
      answer: 1,
      why: 'Kubernetes API는 같아도 StorageClass는 클라우드마다 다릅니다. 없는 이름을 가리키면 PVC가 Pending에 머물고 Pod도 뜨지 못합니다. kubectl describe pvc로 바로 확인할 수 있습니다.',
    },
    {
      q: '클러스터마다 LB 애너테이션과 StorageClass만 다릅니다. 매니페스트를 관리하는 가장 좋은 방법은?',
      options: [
        '클러스터마다 매니페스트 전체를 복사해 네 벌을 따로 고친다',
        '공통은 base에 두고, 클러스터별 차이만 overlay(또는 values 파일)에 적는다',
        '차이가 나는 리소스는 Git에 넣지 않고 콘솔에서 손으로 만든다',
        '모든 클라우드에서 통하는 설정만 쓰고 나머지 기능은 포기한다',
      ],
      answer: 1,
      why: '네 벌 복사는 공통 부분을 고칠 때마다 네 번 고쳐야 하고 결국 어긋납니다. 손으로 만든 리소스는 GitOps가 관리하지 못합니다. 차이만 따로 적으면 무엇이 왜 다른지 한눈에 보입니다.',
    },
    {
      q: '운영 클러스터에 실수로 kubectl delete를 날리는 사고를 막는 가장 근본적인 방법은?',
      options: [
        '컨텍스트 이름을 더 길게 짓는다',
        '운영 변경은 Git과 파이프라인으로만 하고, 사람의 운영 클러스터 권한은 읽기 위주로 줄인다',
        'kubeconfig 파일을 매일 새로 내려받는다',
        '모든 명령 앞에 sudo를 붙인다',
      ],
      answer: 1,
      why: '--context 명시나 프롬프트 표시는 도움이 되지만 사람의 주의력에 기대는 방법입니다. 사람이 직접 쓰기 권한을 갖지 않으면 잘못된 컨텍스트로 명령을 쳐도 거부됩니다.',
    },
  ],
};
