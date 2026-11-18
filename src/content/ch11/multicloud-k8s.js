export default {
  id: 'multicloud-k8s',
  learn: [
    '클라우드마다 다른 클러스터, 공통분모는 Kubernetes API',
    'kubeconfig 컨텍스트와 그 위험',
    'Argo CD ApplicationSet으로 플릿에 한 번에 배포하기',
    '클러스터별 차이를 Kustomize overlay · Helm values로 흡수하기',
    '클러스터를 넘는 서비스 연결과 수명 관리 도구의 역할',
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
      mgmt: { at: [0, 0], label: '관리 계층', sub: '생성·업그레이드', icon: 'settings', color: 'olive' },
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
      mesh: { from: 'eks', to: 'aks', via: [[2.5, 4.9]], bi: true, tone: 'accent', label: 'mTLS', off: true },
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
    cluster: {
      title: 'clusters/nks-gov.yaml', lang: 'yaml',
      text: `apiVersion: v1
kind: Secret
metadata:
  name: nks-gov
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: cluster
    fleet: shop
    cloud: ncp
stringData:
  name: nks-gov
  server: https://nks-gov.example:6443
  config: '{...}'  # 인증 정보 (JSON)`,
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
    pvc: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl --context aks-dr -n shop \\
    describe pvc shop-data
Name:          shop-data
Status:        Pending
StorageClass:  gp3
Events:
  Type     Reason
  Warning  ProvisioningFailed
    storageclass.storage.k8s.io
    "gp3" not found`,
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
    helm: {
      title: 'Helm으로 같은 일', lang: 'yaml',
      text: `# ApplicationSet template의 source
source:
  repoURL: <같은 Git 저장소>
  path: charts/shop
  helm:
    valueFiles:
      - values.yaml
      - 'values-{{name}}.yaml'
---
# charts/shop/values-aks-dr.yaml
storageClass: managed-csi
lbInternal: true  # 차트가 번역
replicas: 2        # DR은 작게 대기`,
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
      more: [
        { title: '왜 클러스터를 하나로 합치지 않나', body: [
          '클러스터 하나에 다 올리면 배포는 한 번이지만, 그 클러스터가 여러 클라우드에 걸칠 수는 없습니다. 컨트롤 플레인과 노드 사이에는 짧은 지연과 안정적인 연결이 필요해서, 클러스터는 보통 <b>한 리전 안</b>에 둡니다.',
          '게다가 이 클러스터들은 나뉜 이유가 있습니다. 공공 서비스는 인증 범위 안에, DR은 장애 반경 밖에 있어야 해요. 그래서 멀티클라우드에서는 <b>클러스터 여러 개를 한 묶음처럼</b> 다루는 쪽으로 갑니다.',
        ] },
        { title: '드리프트의 증상', list: [
          '같은 버그가 한 클러스터에서만 재현됨',
          'DR로 넘겼더니 몇 달 전 버전이 떠 있음',
          '"누가 언제 무엇을 바꿨는지" 기록이 셸 히스토리에만 있음',
        ] },
        { title: '클러스터를 셀 때의 기준', body: [
          '클러스터 수는 <b>격리가 필요한 경계</b>로 정합니다. 클라우드 · 리전 · 규제 영역 · 환경(prod와 dev)이 대표적이에요. 팀마다 클러스터를 주는 것은 네임스페이스와 RBAC로 풀리는지 먼저 보세요. 클러스터는 하나 늘 때마다 업그레이드와 애드온 관리가 한 벌씩 늘어납니다.',
        ] },
      ],
    },
    {
      key: '공통 API', kind: 'concept', title: '공통분모는 Kubernetes API',
      body: [
        '네 서비스는 만든 회사도 콘솔도 다르지만, 우리가 말을 거는 상대는 똑같은 <b>Kubernetes API</b>입니다. Deployment, Service, ConfigMap의 YAML은 어디서나 같은 뜻이에요. 관리형 서비스들은 적합성(conformance) 인증으로 이 호환을 확인받습니다.',
        '그래서 멀티클라우드에서 Kubernetes는 <b>공통 층</b>이 됩니다. VM, 네트워크, 디스크 같은 클라우드별 차이는 클러스터 아래로 내려가고, 앱 팀은 그 위에서 한 가지 방식으로 일합니다.',
      ],
      callout: { type: 'warn', text: '"같다"는 것은 API까지입니다. 스토리지, 로드 밸런서, 권한 연동처럼 <b>클라우드와 맞닿는 부분</b>은 다릅니다. 곧 부딪힙니다.' },
      tags: [{ on: 'dev', text: '같은 YAML · kubectl', icon: 'file-code' }],
      flows: [
        { path: ['dev', 'eks'], kind: 'ctrl' }, { path: ['dev', 'aks'], kind: 'ctrl', delay: 0.2 },
        { path: ['dev', 'gke'], kind: 'ctrl', delay: 0.4 }, { path: ['dev', 'nks'], kind: 'ctrl', delay: 0.6 },
      ],
      more: [
        { title: '적합성 인증이 보장하는 것', body: [
          'CNCF의 <b>Certified Kubernetes</b> 프로그램은 배포판이 공통 API 동작 테스트를 통과했는지 확인합니다. 덕분에 표준 리소스(Deployment, Service, Job 등)의 의미는 어디서나 같아요. 보장하지 않는 것은 그 아래의 <b>구현</b>입니다. 어떤 CSI 드라이버, 어떤 CNI, 어떤 로드 밸런서가 붙는지는 클라우드가 정합니다.',
        ] },
        { title: '공통 층과 클라우드 층', rows: [
          ['공통', 'Deployment · Service · ConfigMap · RBAC', 'ok'],
          ['공통', 'HPA · Job · NetworkPolicy(지원 시)', 'ok'],
          ['클라우드별', 'StorageClass · LB 애너테이션 · Ingress 클래스', 'warn'],
          ['클라우드별', '노드 이미지 · 오토스케일러 · Pod 신원 연동', 'warn'],
        ] },
        { title: '버전도 공통분모입니다', body: [
          'API는 버전이 오르며 바뀝니다. 예전 버전에서 쓰던 API가 새 버전에서 빠지기도 해요. 그래서 플릿 안의 클러스터 버전 차이가 크면 <b>같은 매니페스트가 한 곳에서만 거부</b>됩니다. 공통분모를 유지하려면 버전도 가깝게 맞춰야 합니다. 뒤의 수명 관리 단계에서 다시 봅니다.',
        ] },
      ],
    },
    {
      key: '컨텍스트', kind: 'concept', title: 'kubeconfig: 지금 누구에게 말하는 중인가',
      body: [
        '<code>kubectl</code>이 어느 클러스터에 말을 걸지는 <b>kubeconfig</b> 파일이 정합니다. 클러스터 주소, 인증 방법, 그리고 둘을 묶은 <b>컨텍스트</b>가 들어 있어요. 네 클러스터를 한 파일에 등록하고 <code>use-context</code>로 바꿔 가며 씁니다.',
        '출력의 <code>*</code>가 현재 컨텍스트입니다. 명령에 <code>--context</code>를 붙이면 현재 컨텍스트와 상관없이 그 클러스터로 갑니다.',
      ],
      callout: { type: 'tip', text: '스크립트에는 <code>--context</code>를 항상 적고, 셸 프롬프트에 현재 컨텍스트를 띄워 두세요.' },
      focus: ['eks'],
      set: { eks: { badge: '* 현재' }, aks: { badge: null }, gke: { badge: null }, nks: { badge: null } },
      code: { ref: 'ctx', hl: [3, 8, 11] },
      flows: [{ path: ['dev', 'eks'], kind: 'ctrl', n: 2 }],
      more: [
        { title: '클라우드별로 kubeconfig 받기', rows: [
          ['AWS', 'aws eks update-kubeconfig --name …', 'aws'],
          ['Azure', 'az aks get-credentials -g … -n …', 'azure'],
          ['GCP', 'gcloud container clusters get-credentials', 'gcp'],
          ['NCP', 'ncp-iam-authenticator로 생성', 'ncp'],
        ] },
        { title: '동작 원리', body: [
          '위 명령들은 kubeconfig에 정적인 비밀번호를 적는 대신, kubectl이 실행될 때마다 <b>클라우드 CLI를 불러 짧게 사는 토큰</b>을 받아 오도록(exec 플러그인) 설정합니다. 그래서 클라우드 CLI의 로그인이 풀리면 kubectl도 인증에 실패합니다. "어제는 됐는데 오늘은 Unauthorized"라면 먼저 클라우드 로그인을 확인하세요.',
        ] },
        { title: '실무 팁', list: [
          '<code>KUBECONFIG</code> 환경 변수에 파일 여러 개를 콜론으로 이어 합칠 수 있습니다. 운영 클러스터는 <b>별도 파일</b>로 두고 필요할 때만 켜는 방법도 있어요.',
          '<code>kubectl config current-context</code>를 프롬프트에 보여 주는 도구(kube-ps1 등)나 컨텍스트 전환 도구(kubectx)를 쓰면 실수가 줄어듭니다.',
          '컨텍스트 이름은 <code>클러스터-환경</code>처럼 한눈에 운영인지 보이게 짓습니다.',
        ] },
      ],
    },
    {
      key: '잘못된 대상', kind: 'case', title: '사례: dev인 줄 알고 지운 운영 앱',
      body: [
        '한 엔지니어가 개발 클러스터를 정리하려고 <code>kubectl delete -f k8s/</code>를 쳤습니다. 그런데 현재 컨텍스트는 한 시간 전에 장애를 보느라 바꿔 둔 <code>eks-prod</code>였어요. 운영 Deployment가 사라지고 글로벌 서비스가 멈췄습니다.',
        '원인은 사람이 아니라 구조입니다. 운영 클러스터에 <b>쓰기 권한을 가진 사람</b>이 있었고, 현재 컨텍스트는 눈에 보이지 않았습니다.',
      ],
      callout: { type: 'key', text: '근본 해결은 사람이 운영 클러스터에 <b>직접 apply · delete하지 않는 것</b>입니다. 변경은 Git으로만, 사람의 권한은 읽기 위주로. 다음 단계의 GitOps가 그 구조입니다.' },
      set: { eks: { state: 'hot', badge: 'Pod 0개', tone: 'bad' } },
      tags: [{ on: 'dev', text: 'dev인 줄 알았던 prod', tone: 'bad', icon: 'warn' }],
      flows: [{ path: ['dev', 'eks'], kind: 'bad', n: 3, gap: 0.4 }],
      metrics: { ver: ['운영 중단', 'bad'] },
      changes: [['-', '운영 Deployment 삭제'], ['~', '원인: 보이지 않는 현재 컨텍스트'], ['~', '원인: 사람의 운영 쓰기 권한']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '글로벌 서비스 5xx · Pod 0개', 'bad'],
          ['원인', '현재 컨텍스트가 eks-prod였음', 'warn'],
          ['원인', '사람에게 운영 클러스터 쓰기 권한', 'warn'],
          ['복구', 'Git의 매니페스트로 다시 적용', 'info'],
          ['재발 방지', '변경은 GitOps로만 · 사람은 읽기', 'ok'],
        ] },
        { title: '사람의 권한을 줄이는 법', body: [
          '운영 클러스터에서 사람에게는 <code>view</code> 같은 읽기 역할만 주고, 쓰기는 배포 도구의 서비스 계정만 갖게 합니다. 장애 때 꼭 필요한 쓰기는 <b>짧게 빌려 쓰는 권한</b>(승인 후 몇 시간)으로 내주고 기록을 남깁니다. 클라우드 쪽 IAM 역할과 클러스터 RBAC를 함께 봐야 해요.',
        ] },
        { title: '그 밖의 안전장치', list: [
          '스크립트 · 런북의 모든 명령에 <code>--context</code> 명시',
          '셸 프롬프트에 현재 컨텍스트와 네임스페이스 표시',
          'GitOps의 자동 복구(self-heal)가 켜져 있으면, 지워진 리소스도 Git 상태로 곧 되돌아옵니다',
        ] },
      ],
    },
    {
      key: '플릿 GitOps', kind: 'solution', title: 'Argo CD에 클러스터를 등록합니다',
      body: [
        '9장의 GitOps를 플릿으로 넓힙니다. 관리용 클러스터에 <b>Argo CD</b>를 두고 네 클러스터를 등록합니다. 사람은 Git에 머지만 하고, Argo CD가 각 클러스터를 Git의 상태로 맞춥니다.',
        '등록된 클러스터는 Argo CD 안에서 <b>라벨이 붙은 Secret</b>입니다. 주소와 자격 증명, 그리고 <code>fleet: shop</code> · <code>cloud: ncp</code> 같은 라벨이 들어 있어요. 이 라벨이 다음 단계에서 배포 대상을 고르는 기준이 됩니다.',
      ],
      callout: { type: 'warn', text: 'Argo CD가 모든 클러스터의 API에 닿아야 하고, 그 자격 증명이 한곳에 모입니다. 관리 클러스터를 <b>가장 엄격하게</b> 지키세요.' },
      hide: ['dev'],
      show: ['git', 'argo'],
      set: { eks: { state: null, badge: null } },
      code: { ref: 'cluster', hl: [7, 8, 9, 12] },
      flows: [
        { path: ['git', 'argo'], kind: 'ctrl' },
        { path: ['argo', 'eks'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'aks'], kind: 'ctrl', delay: 1 },
        { path: ['argo', 'gke'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'nks'], kind: 'ctrl', delay: 1 },
      ],
      metrics: { ver: ['복구됨', 'warn'], how: ['Git 머지', 'ok'] },
      changes: [['+', 'Argo CD (관리 클러스터)'], ['+', '클러스터 4개 등록 · 라벨'], ['~', 'kubectl × 4 → Git 머지']],
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ argocd cluster add nks-gov \\
    --label fleet=shop --label cloud=ncp
$ argocd cluster list
SERVER                         NAME      STATUS
https://kubernetes.default.svc in-cluster Successful
https://eks-prod.example       eks-prod  Successful
https://nks-gov.example:6443   nks-gov   Successful` } },
        { title: '자격 증명은 짧게', body: [
          '예시처럼 장기 토큰을 Secret에 넣는 방법은 가장 단순하지만 가장 위험합니다. Argo CD는 EKS에 대해 <b>IAM 역할로 토큰을 받아 오는</b> 설정(awsAuthConfig)을 지원하고, 다른 클라우드도 exec 플러그인 방식으로 짧게 사는 토큰을 쓸 수 있습니다. ID와 데이터 레슨의 워크로드 아이덴티티 연합과 같은 생각이에요.',
        ] },
        { title: '구조 고르기: 중앙형과 분산형', rows: [
          ['중앙 Argo CD 하나', '한 화면 · 자격 증명 집중', 'warn'],
          ['클러스터마다 Argo CD', '안쪽에서 Git을 당김 · 화면 분산', 'info'],
          ['혼합', '규제 클러스터만 따로', 'ok'],
        ] },
      ],
    },
    {
      key: 'AppSet', kind: 'solution', title: 'ApplicationSet: 클러스터마다 앱 하나씩',
      body: [
        '<b>ApplicationSet</b>은 Application을 찍어 내는 틀입니다. 클러스터 제너레이터가 <code>fleet: shop</code> 라벨이 붙은 클러스터마다 Application을 하나씩 만들고, <code>{{name}}</code>과 <code>{{server}}</code>에 각 클러스터의 값을 채웁니다.',
        '머지 한 번에 네 곳이 같은 버전이 되고, 다섯 번째 클러스터는 <b>라벨만 붙이면</b> 같은 앱이 깔립니다. 누가 클러스터에서 손으로 바꾼 것도 Git 상태로 되돌아옵니다.',
      ],
      callout: { type: 'tip', text: '네 곳에 동시에 내보내면 문제도 동시에 퍼집니다. DR · 분석 클러스터에 먼저 내보내고 운영으로 넓히는 <b>순서</b>를 두세요.' },
      set: { eks: { badge: 'v1.5', tone: 'ok' }, aks: { badge: 'v1.5', tone: 'ok' }, gke: { badge: 'v1.5', tone: 'ok' }, nks: { badge: 'v1.5', tone: 'ok' } },
      code: { ref: 'appset', hl: [7, 8, 9, 10, 13, 18] },
      flows: [
        { path: ['git', 'argo'], kind: 'ctrl' },
        { path: ['argo', 'eks'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'aks'], kind: 'ctrl', delay: 1 },
        { path: ['argo', 'gke'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'nks'], kind: 'ctrl', delay: 1 },
      ],
      metrics: { ver: ['4곳 동일', 'ok'], how: ['Git 머지 1번', 'ok'] },
      changes: [['+', 'ApplicationSet: 클러스터당 앱 1개'], ['~', '버전 제각각 → 4곳 v1.5'], ['+', '새 클러스터는 라벨만']],
      more: [
        { title: '제너레이터 종류', rows: [
          ['clusters', '등록된 클러스터 · 라벨로 선택', 'ok'],
          ['git', '저장소의 폴더 · 파일마다', 'info'],
          ['list', '직접 적은 목록마다', 'mute'],
          ['matrix', '두 제너레이터의 조합', 'accent'],
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ argocd app list -o name
argocd/shop-eks-prod
argocd/shop-aks-dr
argocd/shop-gke-data
argocd/shop-nks-gov
$ argocd app get shop-aks-dr | grep -E 'Sync|Health'
Sync Status:   Synced to main (3f2a9c1)
Health Status: Healthy` } },
        { title: '순서대로 내보내기', body: [
          'ApplicationSet에는 라벨 그룹별로 차례로 동기화하는 <b>점진 동기화</b> 기능이 있지만 아직 실험 단계로 안내됩니다. 많이 쓰는 대안은 브랜치나 태그로 단계를 나누는 것이에요. 예를 들어 DR · 분석 overlay는 새 이미지 태그를 먼저 받고, 하루 문제가 없으면 운영 overlay의 태그를 올리는 PR을 머지합니다. 9장의 카나리를 클러스터 단위로 하는 셈입니다.',
        ] },
      ],
    },
    {
      key: 'PVC Pending', kind: 'case', title: '사례: EKS에선 되는데 AKS에선 Pending',
      body: [
        '같은 매니페스트가 네 곳에 배포됐는데 AKS에서만 Pod가 뜨지 않습니다. PVC가 <code>Pending</code>입니다. 매니페스트에 <code>storageClassName: gp3</code>라고 적혀 있었는데, 그 이름의 <b>StorageClass</b>는 EKS에만 만들어져 있었던 거예요.',
        '이벤트가 원인을 그대로 말해 줍니다. 클라우드와 맞닿는 곳은 전부 이렇습니다. 디스크를 만드는 StorageClass, 바깥 트래픽을 받는 Ingress 클래스, 로드 밸런서의 성격을 정하는 Service 애너테이션이 클라우드마다 다릅니다.',
      ],
      callout: { type: 'key', text: '차이는 없어지지 않습니다. 할 수 있는 일은 차이를 <b>한곳에 모아 눈에 보이게</b> 하는 것입니다.' },
      hide: ['git'],
      set: { eks: { badge: null }, gke: { badge: null }, nks: { badge: null }, aks: { state: 'hot', badge: 'PVC Pending', tone: 'bad' } },
      code: { ref: 'pvc', hl: [4, 5, 8, 9, 10] },
      flows: [
        { path: ['argo', 'eks'], kind: 'ctrl' }, { path: ['argo', 'gke'], kind: 'ctrl' },
        { path: ['argo', 'nks'], kind: 'ctrl' }, { path: ['argo', 'aks'], kind: 'bad' },
      ],
      metrics: { yaml: ['차이 미반영', 'bad'] },
      changes: [['-', 'AKS: PVC Pending'], ['~', '원인: 없는 StorageClass 이름'], ['~', 'Ingress · LB 애너테이션도 같은 문제']],
      more: [
        { title: '점검 순서', code: { title: 'terminal', lang: 'sh', text: `$ kubectl --context aks-dr get storageclass
NAME                    PROVISIONER
azurefile-csi           file.csi.azure.com
managed-csi (default)   disk.csi.azure.com
managed-csi-premium     disk.csi.azure.com
$ kubectl --context aks-dr -n shop get events \\
    --field-selector reason=ProvisioningFailed` } },
        { title: '빠른 해결과 바른 해결', list: [
          '<b>빠른 해결</b>: AKS에 <code>gp3</code>라는 이름의 StorageClass를 만들어 이름을 맞춥니다. 당장은 뜨지만, 이름과 실제 디스크가 다른 혼란을 남깁니다.',
          '<b>바른 해결</b>: 공통 매니페스트에서는 StorageClass를 비워 기본값을 쓰거나, 클러스터별 값으로 빼서 overlay · values에 적습니다.',
        ] },
        { title: '흔한 실수', body: [
          'Pod가 Pending이면 노드 자원부터 의심하기 쉽습니다. <code>kubectl describe pod</code>의 이벤트에 "unbound PersistentVolumeClaims"가 보이면 원인은 노드가 아니라 <b>PVC</b>예요. 이벤트를 위에서 아래로 끝까지 읽는 습관이 진단 시간을 크게 줄입니다.',
        ] },
      ],
    },
    {
      key: 'overlay', kind: 'solution', title: '공통은 base에, 차이는 overlay에',
      body: [
        '<b>Kustomize</b>는 공통 매니페스트를 <code>base</code>에 두고, 클러스터마다 다른 부분만 <code>overlays/</code> 아래에 패치로 적습니다. ApplicationSet의 <code>path</code>가 클러스터 이름으로 overlay를 고르니, 클러스터는 저마다 자기 것을 받아 갑니다.',
        'AKS overlay에는 StorageClass를 <code>managed-csi</code>로 바꾸는 패치와 내부 로드 밸런서 애너테이션 패치가 들어갑니다. 원칙은 하나, <b>복사하지 말고 차이만 적기</b>입니다.',
      ],
      callout: { type: 'tip', text: 'overlay가 두꺼워지면 신호입니다. 그 차이가 정말 클라우드 때문인지, 환경이 <b>제각각으로 자란 것</b>인지 리뷰하세요.' },
      show: ['git'],
      set: { aks: { state: 'ok', badge: 'Bound', tone: 'ok' } },
      focus: ['aks'],
      code: { ref: 'overlay', hl: [5, 6, 14] },
      flows: [{ path: ['git', 'argo'], kind: 'ctrl' }, { path: ['argo', 'aks'], kind: 'ctrl', n: 2, delay: 1 }],
      metrics: { yaml: ['base 1 + overlay 4', 'ok'] },
      changes: [['+', 'base: 공통 매니페스트'], ['+', 'overlays: 클러스터별 패치'], ['~', 'AKS PVC: Pending → Bound']],
      more: [
        { title: '저장소 구조', code: { title: 'shop/', lang: 'text', text: `shop/
├─ base/
│  ├─ deployment.yaml
│  ├─ service.yaml
│  ├─ pvc.yaml          # storageClassName 없음
│  └─ kustomization.yaml
└─ overlays/
   ├─ eks-prod/         # gp3 · ALB 애너테이션
   ├─ aks-dr/           # managed-csi · 내부 LB
   ├─ gke-data/         # standard-rwo
   └─ nks-gov/          # NCP CSI · 공공 레지스트리` } },
        { title: '직접 해보기', body: [
          '머지하기 전에 클러스터별 결과를 렌더링해서 비교하면 overlay의 실수를 리뷰에서 잡을 수 있습니다. CI에서 overlay마다 렌더링하고 스키마 검사를 돌려 두세요.',
        ], code: { title: 'terminal', lang: 'sh', text: `$ kubectl kustomize overlays/aks-dr > /tmp/aks.yaml
$ kubectl kustomize overlays/eks-prod > /tmp/eks.yaml
$ diff /tmp/eks.yaml /tmp/aks.yaml
<   storageClassName: gp3
>   storageClassName: managed-csi` } },
      ],
    },
    {
      key: 'Helm values', kind: 'concept', title: 'Helm이라면: 값 파일로 차이를',
      body: [
        '앱이 <b>Helm 차트</b>로 되어 있다면 같은 일을 값 파일로 합니다. 공통 <code>values.yaml</code> 위에 <code>values-aks-dr.yaml</code>처럼 클러스터별 파일을 겹치고, ApplicationSet의 <code>valueFiles</code>가 클러스터 이름으로 파일을 고릅니다.',
        '좋은 차트는 클라우드별 애너테이션을 직접 받지 않고 <code>lbInternal: true</code> 같은 <b>의미 있는 값</b>을 받아, 차트 안에서 클라우드에 맞는 애너테이션으로 번역합니다.',
      ],
      callout: { type: 'key', text: 'Kustomize냐 Helm이냐보다 중요한 것은 <b>차이가 한곳에 모여 있는가</b>입니다. 한 저장소 안에서는 한 방식으로 통일하세요.' },
      set: { aks: { state: null, badge: null } },
      code: { ref: 'helm', hl: [6, 7, 8, 11, 12] },
      flows: [
        { path: ['git', 'argo'], kind: 'ctrl' },
        { path: ['argo', 'eks'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'aks'], kind: 'ctrl', delay: 1 },
        { path: ['argo', 'gke'], kind: 'ctrl', delay: 1 }, { path: ['argo', 'nks'], kind: 'ctrl', delay: 1 },
      ],
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ helm template shop charts/shop \\
    -f charts/shop/values.yaml \\
    -f charts/shop/values-aks-dr.yaml \\
  | grep -A2 'kind: Service'
# 뒤에 오는 -f가 앞의 값을 덮어씁니다` } },
        { title: '차트 안에서 번역하기', body: [
          '차트의 템플릿에서 <code>cloud</code> 값과 <code>lbInternal</code>을 보고 애너테이션을 고르면, 앱 팀은 클라우드별 애너테이션 이름을 외울 필요가 없습니다. 예를 들어 Azure는 <code>service.beta.kubernetes.io/azure-load-balancer-internal</code>, GKE는 <code>networking.gke.io/load-balancer-type</code>처럼 클라우드마다 키가 다릅니다.',
        ] },
        { title: '고르는 기준', rows: [
          ['Kustomize', '우리 앱 · 원본 YAML 그대로 · 패치', 'info'],
          ['Helm', '배포판 차트 · 값으로 변형 · 버전 관리', 'accent'],
          ['함께', '외부 차트 + Kustomize로 마지막 패치', 'ok'],
        ] },
      ],
    },
    {
      key: '클라우드별', kind: 'compare', title: '네 클러스터가 다르게 하는 일',
      body: [
        'overlay에 들어갈 차이를 미리 알아 두면 사고가 줄어듭니다. 대표적인 것이 <b>디스크</b>(StorageClass), <b>바깥 입구</b>(로드 밸런서 · Ingress), <b>Pod의 클라우드 신원</b>(Pod가 클라우드 API를 부를 때의 권한)입니다.',
        '이름만 다른 것이 아니라 기본값과 기능도 다릅니다. 기본 StorageClass가 있는지, 내부 LB를 어떻게 만드는지, 업그레이드 주기가 어떤지 클러스터마다 표로 정리해 두세요.',
      ],
      callout: { type: 'cloud', text: '정확한 이름과 기본값은 버전에 따라 바뀝니다. 표는 <b>각 클러스터에서 직접 조회한 결과</b>로 채우세요.' },
      hide: ['git', 'argo'],
      tags: [
        { on: 'eks', text: 'gp3 (직접 생성)', tone: 'aws', pos: 'bottom' },
        { on: 'aks', text: 'managed-csi', tone: 'azure', pos: 'bottom' },
        { on: 'gke', text: 'standard-rwo', tone: 'gcp', pos: 'bottom' },
        { on: 'nks', text: 'NCP 블록 CSI', tone: 'ncp', pos: 'bottom' },
      ],
      panel: {
        title: '클라우드와 맞닿는 부분', icon: 'puzzle',
        rows: [['EKS', 'EBS CSI · LB Controller · Pod Identity', 'aws'], ['AKS', 'managed-csi · 내부 LB 애너테이션', 'azure'], ['GKE', 'standard-rwo · GKE Ingress', 'gcp'], ['NKS', 'NCP 블록 스토리지 CSI · NCP LB', 'ncp']],
      },
      more: [
        { title: 'Pod의 클라우드 신원', rows: [
          ['EKS', 'IRSA 또는 EKS Pod Identity', 'aws'],
          ['AKS', 'Microsoft Entra Workload ID', 'azure'],
          ['GKE', 'Workload Identity Federation for GKE', 'gcp'],
          ['NKS', '지원 방식을 문서로 확인', 'ncp'],
        ] },
        { title: '내부 로드 밸런서 애너테이션', code: { title: 'service 애너테이션 (클라우드별)', lang: 'text', text: `# 긴 키는 화면 폭 때문에 나눠 적음 (실제로는 한 줄)
# AKS
service.beta.kubernetes.io/
  azure-load-balancer-internal: "true"
# GKE
networking.gke.io/load-balancer-type: "Internal"
# EKS (AWS Load Balancer Controller)
service.beta.kubernetes.io/
  aws-load-balancer-scheme: internal` } },
        { title: '흔한 실수', list: [
          '"기본 StorageClass가 당연히 있겠지": 클러스터에 따라 기본 표시가 없거나 다른 것이 기본입니다. <code>kubectl get sc</code>의 <code>(default)</code>를 확인하세요.',
          '애너테이션 오타는 오류 없이 <b>무시</b>되고, 의도와 다른 공인 LB가 만들어지기도 합니다.',
        ] },
      ],
    },
    {
      key: '서비스 연결', kind: 'concept', title: '클러스터를 넘나드는 트래픽 (개요)',
      body: [
        '방향이 둘입니다. 바깥 사용자의 요청(north-south)은 앞 레슨의 <b>GSLB나 글로벌 로드 밸런서</b>가 클러스터 사이에서 나눕니다. 평소에는 EKS로, 장애 때는 AKS로 보내는 식이에요.',
        '클러스터 안의 서비스가 다른 클러스터의 서비스를 부르는 것(east-west)은 <b>서비스 메시</b>나 멀티 클러스터 서비스의 영역입니다. 다른 클러스터의 서비스를 찾아 주고, <b>mTLS</b>로 암호화하고, 한쪽이 죽으면 다른 쪽으로 돌립니다.',
      ],
      callout: { type: 'warn', text: '멀티 클러스터 메시는 강력한 만큼 운영이 어렵습니다. 클러스터 간 호출이 몇 개뿐이라면 <b>내부 로드 밸런서와 사설 DNS</b>로 충분한지부터 따져 보세요.' },
      show: ['users', 'glb', 'mesh'],
      set: { eks: { badge: null }, aks: { badge: null }, gke: { badge: null }, nks: { badge: null } },
      tags: [{ on: 'glb', text: 'north-south', tone: 'accent', pos: 'right' }, { at: [2.5, 4.9], text: 'east-west', tone: 'accent', dy: 30 }],
      flows: [
        { path: ['users', 'glb', 'eks'], kind: 'req', n: 2 },
        { path: ['eks', [2.5, 4.9], 'aks'], kind: 'req', n: 1, delay: 1.6 },
      ],
      more: [
        { title: '가벼운 것부터 무거운 것까지', rows: [
          ['내부 LB + 사설 DNS', '몇 개의 호출 · 가장 단순', 'ok'],
          ['Multi-Cluster Services API', 'ServiceExport · clusterset.local', 'info'],
          ['Cilium Cluster Mesh', 'CNI 수준의 클러스터 연결', 'accent'],
          ['Istio · Linkerd 멀티 클러스터', 'mTLS · 장애 우회 · 정책', 'warn'],
        ] },
        { title: '전제 조건', list: [
          '클러스터 사이의 <b>사설 경로</b>(앞 레슨의 VPN · 전용선)',
          'Pod끼리 직접 통신하는 방식이라면 <b>Pod 대역이 겹치지 않을 것</b>(IP 계획표)',
          '양쪽이 믿는 <b>공통 루트 인증서</b>(메시의 mTLS)',
          '클라우드 간 호출의 지연 · 전송비를 감당할 이유',
        ] },
        { title: '더 생각해 볼 것', body: [
          'east-west 호출이 많다면 먼저 "왜 이 두 서비스가 다른 클러스터에 있나"를 물어보세요. 규제나 장애 격리 같은 이유가 없다면 같은 클러스터로 모으는 것이 메시를 도입하는 것보다 쌉니다. 메시는 <b>나눌 이유가 있는 것</b>을 안전하게 잇는 도구입니다.',
        ] },
      ],
    },
    {
      key: '수명 관리', kind: 'concept', title: '클러스터 자체도 만들고 올려야 합니다',
      body: [
        '앱만이 아니라 <b>클러스터 자체</b>도 관리 대상입니다. Kubernetes는 한 해에 세 번쯤 새 버전이 나오고 관리형 서비스는 오래된 버전의 지원을 끊으니, 네 곳을 계속 업그레이드해야 합니다. 한 곳에서 먼저 올려 보고 차례로 넓히세요.',
        '도구는 이름과 역할만 알아 둡니다. <b>Cluster API</b>는 클러스터를 Kubernetes 객체로 선언해 관리 클러스터가 만들고 고치게 합니다. <b>Azure Arc</b>와 <b>GKE 플릿</b>(옛 Anthos) 같은 관리 계층은 다른 클라우드의 클러스터까지 등록해 정책과 구성을 한 화면에서 다룹니다.',
      ],
      callout: { type: 'key', text: '플릿의 버전 차이를 <b>작게</b> 유지하세요. 벌어질수록 같은 매니페스트가 클러스터마다 다르게 동작합니다.' },
      hide: ['users', 'glb', 'mesh'],
      show: ['mgmt'],
      set: { eks: { badge: '1.33' }, aks: { badge: '1.33' }, gke: { badge: '1.34', tone: 'ok' }, nks: { badge: '1.32', tone: 'warn' } },
      flows: [{ path: ['mgmt', 'gke'], kind: 'ctrl' }, { path: ['mgmt', 'eks'], kind: 'ctrl', delay: 1 }, { path: ['mgmt', 'aks'], kind: 'ctrl', delay: 1.3 }, { path: ['mgmt', 'nks'], kind: 'ctrl', delay: 1.6 }],
      more: [
        { title: '도구와 역할', rows: [
          ['Terraform', '클러스터 · 주변 인프라 생성', 'info'],
          ['Cluster API', '클러스터를 K8s 객체로 선언', 'accent'],
          ['Azure Arc · Fleet Manager', '외부 클러스터 등록 · 플릿 배포', 'azure'],
          ['GKE 플릿 (옛 Anthos)', '여러 클라우드를 한 화면에', 'gcp'],
        ] },
        { title: '업그레이드 한 바퀴', list: [
          '새 버전에서 <b>빠지는 API</b>를 쓰는 매니페스트가 있는지 검사(예: pluto 같은 도구, 릴리스 노트)',
          '애드온(CNI · CSI · Ingress 컨트롤러)의 호환 버전 확인',
          '분석 · DR처럼 영향이 작은 클러스터부터 컨트롤 플레인 → 노드 순으로',
          '며칠 지켜본 뒤 운영 클러스터로',
        ] },
        { title: '지원 기간은 클라우드마다', body: [
          '관리형 서비스는 각자 지원하는 버전 목록과 종료 일정을 공개합니다. 표준 지원이 끝난 버전에 <b>추가 요금을 받고 지원을 연장</b>하는 서비스도 있고, 일정 시점에 자동으로 올려 버리는 서비스도 있어요. 네 클라우드의 일정을 한 달력에 모아 두세요.',
        ] },
        { title: '실무 팁', body: [
          '클러스터를 업그레이드하는 대신 <b>새 버전 클러스터를 옆에 만들고</b> 트래픽을 옮기는 방법(blue-green 클러스터)도 있습니다. Terraform과 ApplicationSet이 갖춰져 있으면 새 클러스터에 라벨만 붙여 같은 앱을 깔 수 있어서 현실적인 선택이 됩니다.',
        ] },
      ],
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
      more: [
        { title: '설정 예시', body: ['Prometheus 에이전트 모드에서 클러스터 라벨을 붙여 중앙으로 보내는 모양입니다.'], code: { title: 'prometheus.yml (nks-gov)', lang: 'yaml', text: `global:
  external_labels:
    cluster: nks-gov
    cloud: ncp
remote_write:
  - url: https://metrics.shop.internal/api/v1/push
    write_relabel_configs:
      - source_labels: [__name__]
        regex: 'apiserver_request_duration.*'
        action: drop          # 비싼 고카디널리티 제외` } },
        { title: '중앙 저장소', body: [
          'Prometheus 하나에 플릿 전체를 모으기는 어려워서, 여러 곳에서 받은 메트릭을 오래 보관하고 함께 질의하는 저장소(Thanos, Mimir 등)나 관리형 Prometheus 서비스를 씁니다. 로그와 트레이스도 OpenTelemetry Collector로 같은 라벨을 붙여 보냅니다.',
        ] },
        { title: '규제 영역의 관측', body: [
          '공공 클러스터의 로그에는 개인정보가 섞일 수 있습니다. 로그는 <b>그 영역 안에</b> 두고, 바깥 중앙 저장소로는 메트릭과 집계된 지표만 보내는 식으로 나누세요. 캡스톤에서 이 경계를 플랫폼 설계에 넣습니다.',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 넷을 하나처럼 다루는 네 가지',
      body: [
        '공통분모는 <b>Kubernetes API</b>, 배포는 <b>Git과 ApplicationSet</b>, 차이는 <b>overlay · values</b>, 눈은 <b>중앙 관측</b>. 이 넷이 있으면 클러스터가 넷이든 스물이든 같은 방식으로 다룰 수 있습니다. 메시와 수명 관리 도구는 필요가 분명해질 때 얹습니다.',
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
      answer: 1, step: 6,
      why: 'ApplicationSet은 클러스터가 늘어도 라벨만 붙이면 같은 앱이 깔리고, 누가 손댄 것도 Git 상태로 되돌려 줍니다. 스크립트는 횟수만 줄일 뿐 드리프트를 못 잡습니다. 클러스터를 합치면 규제와 장애 격리라는, 나눈 이유가 사라집니다.',
    },
    {
      q: '공공 서비스용 클러스터와 글로벌 서비스용 클러스터를 하나로 합치자는 제안이 나왔습니다. 가장 큰 문제는?',
      options: [
        'Kubernetes는 클러스터 하나에 Pod를 100개까지만 띄울 수 있다',
        '공공 데이터를 다루는 워크로드가 인증 범위 밖의 클러스터에 놓이고, 한 클러스터는 여러 클라우드에 걸칠 수 없다',
        '두 클러스터의 이미지 레지스트리가 같아진다',
        'kubectl 명령이 길어진다',
      ],
      answer: 1, step: 1,
      why: '클러스터는 보통 한 리전 안에 두고, 나눈 데에는 규제 · 장애 격리 같은 이유가 있습니다. 합치면 그 이유가 사라집니다. 플릿 관리는 클러스터를 합치는 대신 여러 클러스터를 한 묶음처럼 다루는 방법입니다.',
    },
    {
      q: 'kubectl이 어제까지 잘 되다가 오늘 모든 EKS 명령에 Unauthorized가 납니다. kubeconfig는 aws eks update-kubeconfig로 만들었습니다. 먼저 확인할 것은?',
      options: [
        'AWS CLI의 로그인(자격 증명)이 만료되었는지',
        'Pod의 메모리 한도',
        'Argo CD의 동기화 상태',
        'StorageClass 이름',
      ],
      answer: 0, step: 3,
      why: '이렇게 만든 kubeconfig는 kubectl을 실행할 때마다 클라우드 CLI로 짧은 토큰을 받아 옵니다. CLI 로그인이 풀리면 토큰을 못 받아 인증이 실패합니다. 나머지는 인증 이후의 문제입니다.',
    },
    {
      q: '운영 클러스터에 실수로 kubectl delete를 날리는 사고를 막는 가장 근본적인 방법은?',
      options: [
        '컨텍스트 이름을 더 길게 짓는다',
        'kubeconfig 파일을 매일 새로 내려받는다',
        '운영 변경은 Git과 파이프라인으로만 하고, 사람의 운영 클러스터 권한은 읽기 위주로 줄인다',
        '모든 명령 앞에 sudo를 붙인다',
      ],
      answer: 2, step: 4,
      why: '--context 명시나 프롬프트 표시는 도움이 되지만 사람의 주의력에 기대는 방법입니다. 사람이 직접 쓰기 권한을 갖지 않으면 잘못된 컨텍스트로 명령을 쳐도 거부됩니다.',
    },
    {
      q: '중앙 Argo CD에 클러스터 네 개를 등록하면서 각 클러스터의 cluster-admin 장기 토큰을 Secret으로 넣었습니다. 보안 검토에서 가장 먼저 지적될 것은?',
      options: [
        'Secret 이름이 너무 짧다',
        '관리 클러스터 하나가 뚫리면 네 클러스터의 영구 관리자 권한이 함께 새므로, 짧게 사는 토큰과 최소 권한으로 바꾸고 관리 클러스터를 엄격히 지켜야 한다',
        '라벨을 너무 많이 붙였다',
        '클러스터를 네 개나 등록했다',
      ],
      answer: 1, step: 5,
      why: '중앙형 GitOps는 자격 증명이 한곳에 모이는 구조입니다. IAM 역할 · exec 플러그인으로 짧게 사는 토큰을 쓰고, 필요한 만큼의 권한만 주며, 관리 클러스터 접근을 가장 엄격하게 막아야 합니다.',
    },
    {
      q: 'ApplicationSet으로 새 버전을 네 클러스터에 동시에 내보냈더니 버그가 네 곳에서 동시에 터졌습니다. 다음부터 어떻게 할까?',
      options: [
        'ApplicationSet을 버리고 kubectl로 돌아간다',
        '버그가 없도록 테스트를 하지 않는다',
        '네 클러스터를 하나로 합친다',
        'DR · 분석 클러스터의 overlay에 새 버전을 먼저 반영하고, 문제가 없으면 운영 overlay를 올리는 순서를 둔다',
      ],
      answer: 3, step: 6,
      why: '한 번에 모두 바꾸면 문제도 한 번에 퍼집니다. 영향이 작은 클러스터부터 차례로 넓히면 클러스터 단위의 카나리가 됩니다. kubectl로 돌아가면 드리프트 문제가 다시 생깁니다.',
    },
    {
      q: '같은 Deployment와 PVC를 네 클러스터에 배포했는데 한 곳에서만 Pod가 Pending입니다. 가장 먼저 확인할 것은?',
      options: [
        '컨테이너 이미지의 크기',
        'Git 저장소의 브랜치 이름',
        'PVC가 가리키는 StorageClass 이름이 그 클러스터에 실제로 있는지',
        '그 클라우드의 리전 개수',
      ],
      answer: 2, step: 7,
      why: 'Kubernetes API는 같아도 StorageClass는 클라우드마다 다릅니다. 없는 이름을 가리키면 PVC가 Pending에 머물고 Pod도 뜨지 못합니다. kubectl describe pvc의 이벤트에 not found가 바로 보입니다.',
    },
    {
      q: '클러스터마다 LB 애너테이션과 StorageClass만 다릅니다. 매니페스트를 관리하는 가장 좋은 방법은?',
      options: [
        '공통은 base에 두고, 클러스터별 차이만 overlay(또는 values 파일)에 적는다',
        '클러스터마다 매니페스트 전체를 복사해 네 벌을 따로 고친다',
        '차이가 나는 리소스는 Git에 넣지 않고 콘솔에서 손으로 만든다',
        '모든 클라우드에서 통하는 설정만 쓰고 나머지 기능은 포기한다',
      ],
      answer: 0, step: 8,
      why: '네 벌 복사는 공통 부분을 고칠 때마다 네 번 고쳐야 하고 결국 어긋납니다. 손으로 만든 리소스는 GitOps가 관리하지 못합니다. 차이만 따로 적으면 무엇이 왜 다른지 한눈에 보입니다.',
    },
    {
      q: '외부에서 받은 Helm 차트를 네 클러스터에 배포하는데, AKS에서만 내부 LB가 필요합니다. 차트를 포크해 고치기 전에 해 볼 방법은?',
      options: [
        'AKS 클러스터만 kubectl edit로 고친다',
        '클러스터별 values 파일에 차트가 받는 값(예: 서비스 애너테이션)을 적고, ApplicationSet의 valueFiles로 골라 넣는다',
        '모든 클러스터에 내부 LB를 쓴다',
        '차트를 쓰지 않고 YAML을 손으로 다시 쓴다',
      ],
      answer: 1, step: 9,
      why: '대부분의 차트는 서비스 애너테이션 같은 값을 받습니다. 클러스터별 값 파일로 차이를 적으면 포크 없이 차이가 한곳에 모입니다. kubectl edit는 Git에 남지 않아 다음 동기화 때 되돌아갑니다.',
    },
    {
      q: 'AKS에 내부 LB용 애너테이션을 적었는데 공인 IP의 LB가 만들어졌습니다. 오류 메시지는 없었습니다. 가장 가능성 높은 원인은?',
      options: [
        'Kubernetes가 내부 LB를 지원하지 않는다',
        'AKS는 LB를 만들 수 없다',
        '애너테이션 키나 값에 오타가 있거나 다른 클라우드용 키를 적어, 무시되고 기본(공인) LB가 만들어졌다',
        'Pod가 너무 많다',
      ],
      answer: 2, step: 10,
      why: '알 수 없는 애너테이션은 오류 없이 무시됩니다. 클라우드마다 키가 달라서 다른 클라우드의 키를 복사하면 같은 일이 생깁니다. 렌더링 결과를 리뷰하고, 생성된 LB의 종류를 배포 후 검사하세요.',
    },
    {
      q: 'EKS의 주문 서비스가 AKS의 재고 서비스를 하루 몇백 번 부릅니다. 둘 다 규제 때문에 클러스터를 나눠야 합니다. 첫 구현으로 가장 알맞은 것은?',
      options: [
        '멀티 클러스터 서비스 메시를 바로 도입한다',
        '재고 서비스를 공인 인터넷에 열고 IP로 부른다',
        '두 클러스터를 하나로 합친다',
        '재고 서비스를 내부 로드 밸런서로 내놓고, 사설 DNS 이름으로 부르며 TLS로 암호화한다',
      ],
      answer: 3, step: 11,
      why: '호출이 적고 경로가 몇 개뿐이라면 내부 LB와 사설 DNS가 가장 단순합니다. 메시는 운영 부담이 커서 필요가 분명할 때 얹습니다. 공인 노출과 클러스터 합치기는 요구를 어깁니다.',
    },
    {
      q: '플릿의 클러스터 버전이 1.32부터 1.34까지 벌어져 있습니다. 같은 매니페스트가 한 클러스터에서만 "no matches for kind"로 거부됩니다. 무엇을 해야 할까?',
      options: [
        '해당 API가 버전 차이로 빠졌거나 아직 없는지 확인하고, 업그레이드 계획으로 버전 차이를 좁힌다',
        '그 클러스터에서만 매니페스트를 지운다',
        'Argo CD를 재시작한다',
        '노드를 더 추가한다',
      ],
      answer: 0, step: 12,
      why: 'API는 버전에 따라 생기고 빠집니다. 버전 차이가 크면 같은 매니페스트가 다르게 동작하므로, 빠지는 API를 점검하고 영향이 작은 클러스터부터 차례로 올려 차이를 좁혀야 합니다.',
    },
    {
      q: '중앙 Grafana에서 "응답이 느리다"는 경보가 왔는데 어느 클러스터 문제인지 가려낼 수 없습니다. 무엇이 빠졌을까?',
      options: [
        'Grafana 대시보드의 색',
        '메트릭 · 로그 · 트레이스에 cluster · cloud 같은 출처 라벨',
        '각 클러스터의 노드 수',
        'Git 커밋 메시지',
      ],
      answer: 1, step: 13,
      why: '여러 클러스터의 신호를 한곳에 모을 때는 출처를 가리는 라벨이 필수입니다. Prometheus의 external_labels나 수집기 설정으로 모든 신호에 붙여 두면 한 대시보드에서 클러스터별로 나눠 볼 수 있습니다.',
    },
  ],
};
