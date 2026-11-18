export default {
  id: 'managed-k8s',
  learn: [
    '관리형 쿠버네티스가 대신 운영하는 것: 컨트롤 플레인',
    '노드 그룹 · 노드 풀로 워커를 나누는 방법',
    'LoadBalancer Service · PVC가 클라우드 자원이 되는 과정',
    '워크로드 아이덴티티로 Pod에 클라우드 권한 주기',
    'EKS · AKS · GKE · NKS의 차이와 버전 업그레이드',
    'kubeconfig 컨텍스트와 Helm 차트 · values · 릴리스',
  ],
  legend: [['ctrl', 'API 호출 · 제어'], ['req', '요청'], ['data', '데이터'], ['res', '자격 증명'], ['bad', '실수 · 실패']],
  metrics: [
    { id: 'ops', label: '우리가 운영', icon: 'wrench' },
    { id: 'perm', label: 'Pod 클라우드 권한', icon: 'key' },
    { id: 'ver', label: 'K8s 버전', icon: 'tag' },
    { id: 'deploy', label: '배포 단위', icon: 'package' },
  ],
  scene: {
    zones: {
      cpz: { at: [0, -3.0], size: [7.4, 2.6], label: '컨트롤 플레인 (직접 운영)', color: 'red', labelPos: 'back' },
      wkz: { at: [0, 0.2], size: [7.4, 2.6], label: '워커 노드', color: 'blue' },
      np1: { at: [0, 0.2], size: [4.8, 2.6], label: '노드 그룹 general', color: 'blue' },
      np2: { at: [5.0, 0.2], size: [2.4, 2.6], label: 'spot', color: 'yellow' },
    },
    nodes: {
      me: { kind: 'client', at: [-2.6, -1.8], label: '운영자' },
      api: { at: [1.2, -1.8], label: 'API 서버', icon: 'server-cog', color: 'red' },
      cm: { at: [3.6, -1.8], label: '컨트롤러', sub: '+ 스케줄러', icon: 'cloud-cog', color: 'red' },
      etcd: { kind: 'cyl', at: [6.0, -1.8], label: 'etcd', icon: 'database', color: 'red' },
      w1: { at: [1.2, 1.3], label: 'node-1', icon: 'server', color: 'blue' },
      w2: { at: [3.6, 1.3], label: 'node-2', icon: 'server', color: 'blue' },
      w3: { at: [6.0, 1.3], label: 'node-3', icon: 'server', color: 'blue' },
      lb: { at: [3.6, 4.6], label: 'NLB', sub: '자동 생성', icon: 'split', color: 'aws' },
      users: { kind: 'users', at: [3.6, 7.0], label: '고객' },
      disk: { kind: 'cyl', at: [8.6, 1.3], label: 'EBS 볼륨', icon: 'hard-drive', color: 'aws' },

      up: { at: [0, 0], label: 'uploader', sub: 'Pod', icon: 'upload', color: 'teal' },
      iamr: { at: [0, -2.6], label: 'IAM 역할', sub: 'shop-uploader', icon: 'id-card', color: 'aws' },
      s3: { kind: 'cyl', at: [2.6, 0], label: 'S3 버킷', icon: 'archive', color: 'aws' },

      c_eks: { at: [0, 0], label: 'EKS', sub: 'AWS', icon: 'cloud', color: 'aws' },
      c_aks: { at: [1.6, -1.6], label: 'AKS', sub: 'Azure', icon: 'cloud', color: 'azure' },
      c_gke: { at: [3.2, -3.2], label: 'GKE', sub: 'Google Cloud', icon: 'cloud', color: 'gcp' },
      c_nks: { at: [4.8, -4.8], label: 'NKS', sub: 'NAVER Cloud', icon: 'cloud', color: 'ncp' },

      kprod: { at: [0.4, -3.8], label: 'shop-prod', sub: 'EKS', icon: 'helm', color: 'aws' },
      kdev: { at: [1.6, -1.2], label: 'shop-dev', sub: 'AKS', icon: 'helm', color: 'azure' },

      chart: { kind: 'tile', at: [0.8, 1.8], label: 'chart shop', icon: 'package', color: 'olive' },
      vals: { kind: 'tile', at: [3.6, 2.6], label: 'values-prod', icon: 'sliders', color: 'yellow' },
      hb: { at: [2.6, 0], label: 'helm', sub: 'upgrade', icon: 'helm', color: 'navy' },
      rel: { at: [4.2, -1.6], label: '릴리스 shop', sub: 'REVISION 7', icon: 'layers', color: 'teal' },
    },
    edges: {
      e_me_api: { from: 'me', to: 'api' },
      e_api_w: { from: 'api', to: 'w2', style: 'dashed' },
      e_u_lb: { from: 'users', to: 'lb' },
      e_lb_w2: { from: 'lb', to: 'w2' },
      e_w3_disk: { from: 'w3', to: 'disk' },
      e_up_iam: { from: 'up', to: 'iamr', style: 'dashed', bi: true },
      e_up_s3: { from: 'up', to: 's3' },
      e_me_prod: { from: 'me', to: 'kprod' },
      e_me_dev: { from: 'me', to: 'kdev', style: 'dashed' },
      e_chart: { from: 'chart', to: 'hb' },
      e_vals: { from: 'vals', to: 'hb' },
      e_rel: { from: 'hb', to: 'rel' },
    },
  },
  codes: {
    sa: {
      title: 'uploader.yaml', lang: 'yaml',
      text: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: uploader
  namespace: shop
  annotations:   # IRSA: 이 SA가 맡을 IAM 역할
    eks.amazonaws.com/role-arn: >-
      arn:aws:iam::111122223333:role/shop-uploader
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: uploader, namespace: shop }
spec:
  selector: { matchLabels: { app: uploader } }
  template:
    metadata: { labels: { app: uploader } }
    spec:
      serviceAccountName: uploader
      containers:
        - name: uploader
          image: shop/uploader:1.0
`,
    },
    ctx: {
      title: '터미널', lang: 'sh',
      text: `$ aws eks update-kubeconfig --name shop-prod \\
    --region ap-northeast-2 --alias prod
$ az aks get-credentials -g shop-rg -n shop-dev

$ kubectl config get-contexts
CURRENT   NAME       CLUSTER
*         prod       arn:aws:eks:…:cluster/shop-prod
          shop-dev   shop-dev

$ kubectl delete deploy --all -n shop   # 앗, prod

# 습관: 컨텍스트를 바꾸고, 확인하고, 명시하기
$ kubectl config use-context shop-dev
$ kubectl config current-context
shop-dev
$ kubectl --context prod get nodes
`,
    },
    helm: {
      title: 'charts/shop', lang: 'yaml',
      text: `# templates/deployment.yaml (일부)
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: api
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
---
# values.yaml (기본값)
replicaCount: 1
image:
  repository: shop/api
  tag: "1.4.2"
---
# values-prod.yaml (prod만 덮어씀)
replicaCount: 6
`,
    },
  },
  steps: [
    {
      key: '직접 운영', kind: 'problem', title: '클러스터를 직접 세우면 생기는 일',
      body: [
        'shop.example이 VM들 위에 <code>kubeadm</code>으로 쿠버네티스를 직접 설치했습니다. 컨트롤 플레인에는 API 서버 · 컨트롤러 · 스케줄러 · etcd가, 워커 노드에는 앱 Pod가 돕니다. 처음 띄우는 것은 하루면 됩니다.',
        '문제는 그다음입니다. etcd 백업과 복구 연습, 기본 1년이면 만료되는 인증서 갱신, 몇 달마다 나오는 새 버전 업그레이드, 컨트롤 플레인 장애 대응까지 모두 우리 몫입니다.',
      ],
      callout: { type: 'warn', text: 'etcd를 잃으면 클러스터의 모든 선언(Deployment, Service, Secret…)을 잃습니다. 직접 운영한다면 etcd 백업이 가장 먼저예요.' },
      show: ['cpz', 'wkz', 'me', 'api', 'cm', 'etcd', 'w1', 'w2', 'w3'],
      tags: [
        { on: 'etcd', text: '백업 · 복구', tone: 'warn', icon: 'save' },
        { on: 'api', text: '인증서 갱신', tone: 'warn', icon: 'key' },
        { on: 'me', text: '업그레이드도 직접', tone: 'bad', pos: 'bottom' },
      ],
      flows: [{ path: ['me', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'w2'], kind: 'ctrl', delay: 1 }],
      metrics: { ops: ['CP + 노드 + 앱', 'bad'], perm: '-', ver: '1.25', deploy: 'YAML 9개' },
    },
    {
      key: '관리형', kind: 'solution', title: '컨트롤 플레인을 클라우드에 맡깁니다',
      body: [
        '<b>관리형 쿠버네티스</b>(EKS · AKS · GKE · NKS)는 컨트롤 플레인을 클라우드 사업자가 운영합니다. API 서버를 이중화하고, etcd를 백업하고, 패치와 인증서를 챙깁니다. 우리 눈에는 <b>API 엔드포인트</b> 하나만 보여요.',
        '우리가 맡는 것은 워커 노드와 그 위의 앱입니다. 클러스터를 만드는 일도 콘솔이나 Terraform 몇 줄이면 되고, 보통 십여 분이면 끝납니다.',
      ],
      callout: { type: 'key', text: '컨트롤 플레인 VM에는 접속할 수 없고 etcd를 직접 만질 수도 없습니다. 대신 그 운영이 사업자의 책임(SLA)이 됩니다. 컨트롤 플레인 요금은 사업자와 등급마다 달라요.' },
      hide: ['cm', 'etcd'],
      set: { cpz: { label: '컨트롤 플레인 (클라우드가 운영)', color: 'aws' }, api: { label: 'API', sub: '엔드포인트', color: 'aws' } },
      focus: ['api'],
      flows: [{ path: ['me', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'w2'], kind: 'ctrl', delay: 1 }],
      metrics: { ops: ['노드 + 앱', 'ok'] },
      changes: [['-', 'etcd 백업 · 인증서 · CP 패치'], ['~', '컨트롤 플레인 → 사업자 책임'], ['+', 'API 엔드포인트 하나']],
    },
    {
      key: '노드 풀', kind: 'concept', title: '노드 그룹: 같은 모양의 VM 묶음',
      body: [
        '워커 노드는 <b>노드 그룹</b>(AKS · GKE · NKS에서는 <b>노드 풀</b>) 단위로 다룹니다. 인스턴스 타입 · 디스크 · 라벨이 같은 VM 묶음이고, 뒤에서는 클라우드의 오토스케일링 그룹이 대수를 맞춥니다. Cluster Autoscaler가 늘리고 줄이는 것도 이 그룹이에요.',
        '용도가 다르면 그룹을 나눕니다. 평소 트래픽은 일반 그룹, 중단돼도 되는 배치는 싼 <b>스팟</b> 그룹, GPU 작업은 taint를 건 GPU 그룹처럼요.',
      ],
      callout: { type: 'tip', text: '스팟 노드는 사업자가 언제든 회수할 수 있습니다. 상태가 없고 다시 시작해도 되는 Pod만 그쪽으로 보내세요.' },
      hide: ['wkz', 'me', 'e_api_w'],
      show: ['np1', 'np2'],
      set: { w3: { label: 'node-3', sub: 'spot', color: 'yellow' } },
      tags: [
        { at: [2.4, 2.8], text: 'm6i.large × 2~6', icon: 'server', dy: 26 },
        { on: 'w3', text: '회수될 수 있음', tone: 'warn', pos: 'right' },
      ],
      metrics: { ops: '노드 그룹 + 앱' },
      changes: [['+', '일반 노드 그룹 (최소 2 · 최대 6)'], ['+', '스팟 노드 그룹 (배치용)']],
    },
    {
      key: '클라우드 연동', kind: 'concept', title: 'Service와 PVC가 클라우드 자원이 됩니다',
      body: [
        '<code>type: LoadBalancer</code>인 Service를 만들면, 클러스터의 컨트롤러가 클라우드 API를 불러 <b>진짜 로드 밸런서</b>를 만들고 노드나 Pod를 대상으로 등록합니다. EKS에서는 보통 <b>AWS Load Balancer Controller</b>가 NLB · ALB를 만들어요.',
        '지난 레슨의 PVC도 같은 원리입니다. CSI 드라이버가 클라우드 디스크를 만들어 노드에 붙이죠. 쿠버네티스 객체 하나가 클라우드 리소스 하나로 번역되는 셈입니다.',
      ],
      callout: { type: 'warn', text: '클러스터를 지우기 전에 LoadBalancer Service와 PVC부터 지우세요. 클러스터만 지우면 정리해 줄 컨트롤러가 사라져, LB와 디스크가 남아 요금이 계속 나올 수 있어요.' },
      hide: ['np1', 'np2', 'cpz', 'api'],
      show: ['wkz', 'lb', 'users', 'disk'],
      set: { w3: { label: 'node-3', sub: null, color: 'blue' } },
      tags: [
        { on: 'lb', text: 'Service → NLB', tone: 'accent', pos: 'right' },
        { on: 'disk', text: 'PVC → EBS', tone: 'accent', pos: 'bottom' },
      ],
      flows: [{ path: ['users', 'lb', 'w2'], kind: 'req', n: 3 }, { path: ['w3', 'disk'], kind: 'data', n: 2, delay: 0.8 }],
      changes: [['+', 'NLB: Service를 보고 컨트롤러가 생성'], ['+', 'EBS: PVC를 보고 CSI 드라이버가 생성']],
    },
    {
      key: 'Pod 권한', kind: 'solution', title: 'Pod에게 클라우드 권한을 주는 법',
      body: [
        '업로드 Pod가 S3에 이미지를 써야 합니다. 액세스 키를 Secret에 넣으면 유출과 교체가 문제이고, <b>노드의 IAM 역할</b>에 권한을 붙이면 그 노드의 <b>모든 Pod</b>가 같은 권한을 얻습니다.',
        '답은 <b>워크로드 아이덴티티</b>입니다. 쿠버네티스 <b>ServiceAccount</b>를 클라우드 역할과 연결하면, Pod는 자기 ServiceAccount 토큰을 짧게 사는 자격 증명으로 바꿔 씁니다. 장기 키가 어디에도 남지 않아요.',
      ],
      callout: { type: 'cloud', text: 'AWS는 <b>IRSA</b>(OIDC 기반)와 <b>EKS Pod Identity</b>, Azure는 <b>Entra Workload ID</b>, GCP는 <b>GKE Workload Identity Federation</b>이 같은 일을 합니다.' },
      hide: ['wkz', 'w1', 'w2', 'w3', 'lb', 'users', 'disk'],
      show: ['up', 'iamr', 's3'],
      code: { ref: 'sa', hl: [6, 7, 8, 18] },
      flows: [{ path: ['up', 'iamr'], kind: 'ctrl' }, { path: ['iamr', 'up'], kind: 'res', delay: 1 }, { path: ['up', 's3'], kind: 'data', n: 2, delay: 2 }],
      tags: [{ on: 'iamr', text: '임시 자격 증명', tone: 'ok', icon: 'clock', pos: 'top' }],
      metrics: { perm: ['Pod별 역할', 'ok'] },
      changes: [['-', 'Secret 속 액세스 키'], ['-', '노드 역할에 붙인 S3 권한'], ['+', 'ServiceAccount ↔ IAM 역할']],
    },
    {
      key: '4사 비교', kind: 'compare', title: 'EKS · AKS · GKE · NKS',
      body: [
        '네 서비스 모두 컨트롤 플레인 운영, 노드 풀, LB · 디스크 연동, 워크로드 아이덴티티라는 뼈대는 같습니다. 차이는 <b>얼마나 많이 맡기느냐</b>와 주변 서비스와의 연결이에요.',
        'EKS는 기본 구성이 얇아 애드온을 골라 조립하고, AKS는 Entra ID와 맞물립니다. GKE의 <b>Autopilot</b>은 노드까지 Google이 관리하고 Pod가 요청한 자원만큼 과금합니다. NKS는 NCP의 VPC · Load Balancer · 스토리지와 연동되는 관리형 쿠버네티스예요.',
      ],
      callout: { type: 'tip', text: '맡길수록 편하지만 고를 수 있는 것은 줄어듭니다. Autopilot에서는 노드 접속이나 특권 컨테이너 같은 일이 제한돼요.' },
      hide: ['up', 'iamr', 's3'],
      show: ['c_eks', 'c_aks', 'c_gke', 'c_nks'],
      panel: {
        title: '같은 뼈대, 다른 강조점', icon: 'helm',
        rows: [
          ['EKS', '애드온을 골라 조립', 'aws'],
          ['AKS', 'Entra ID · Azure 연동', 'azure'],
          ['GKE', 'Standard / Autopilot', 'gcp'],
          ['NKS', 'NCP VPC · LB · 스토리지', 'ncp'],
        ],
      },
      focus: ['c_gke'],
      tags: [{ on: 'c_gke', text: 'Autopilot: 노드도 관리', tone: 'gcp', pos: 'bottom' }],
    },
    {
      key: 'kubeconfig', kind: 'case', title: '사례: dev인 줄 알았는데 prod였다',
      body: [
        '관리형 클러스터에 접속하려면 사업자 CLI로 자격 증명을 받아 <code>~/.kube/config</code>에 <b>컨텍스트</b>로 추가합니다. 컨텍스트는 "어느 클러스터에, 누구로, 어느 네임스페이스로"의 묶음이고, kubectl은 <b>current-context</b>로 명령을 보냅니다.',
        '어제 prod를 점검하고 그대로 둔 채, dev를 정리한다며 <code>kubectl delete</code>를 실행하면 prod가 지워집니다. 클러스터가 여러 개가 되면 흔히 나는 사고예요.',
      ],
      callout: { type: 'tip', text: '프롬프트에 현재 컨텍스트를 띄우고, 위험한 명령에는 <code>--context</code>를 명시하세요. 근본 대책은 prod에 쓰기 권한을 가진 사람을 줄이는 것입니다.' },
      hide: ['c_eks', 'c_aks', 'c_gke', 'c_nks'],
      show: ['me', 'kprod', 'kdev'],
      set: { kprod: { state: 'hot', badge: 'current', tone: 'bad' } },
      code: { ref: 'ctx', hl: [6, 9, 12, 13] },
      flows: [{ path: ['me', 'kprod'], kind: 'bad', n: 2 }],
      tags: [{ on: 'kdev', text: '지우려던 곳', tone: 'mute', pos: 'right' }],
    },
    {
      key: '업그레이드', kind: 'concept', title: '버전 업그레이드는 피할 수 없습니다',
      body: [
        '쿠버네티스는 1년에 세 번쯤 마이너 버전이 나오고, 관리형 서비스도 버전마다 지원 기간이 있어 끝나면 강제로 올라가거나 추가 요금이 붙습니다. 순서는 <b>컨트롤 플레인 먼저</b>(한 번에 한 마이너씩), 그다음 <b>노드 그룹</b>을 새 버전 노드로 하나씩 갈아 끼웁니다.',
        '함정은 <b>제거된 API</b>입니다. 1.26에서 <code>autoscaling/v2beta2</code> HPA가 없어지자, 옛 매니페스트를 그대로 쓰던 파이프라인이 <code>no matches for kind</code> 오류로 멈췄습니다.',
      ],
      callout: { type: 'tip', text: '올리기 전에 deprecated API 점검 도구나 콘솔의 업그레이드 인사이트로 확인하고, dev부터 올리세요. PodDisruptionBudget이 있어야 노드 교체 중에도 서비스가 유지돼요.' },
      hide: ['me', 'kprod', 'kdev'],
      show: ['cpz', 'api', 'wkz', 'w1', 'w2', 'w3', 'e_api_w'],
      set: {
        kprod: { state: null, badge: null },
        api: { badge: 'v1.26', tone: 'ok' },
        w1: { state: 'dim', badge: 'v1.25 · drain', tone: 'warn' },
        w2: { state: 'ok', badge: 'v1.26', tone: 'ok' },
        w3: { badge: 'v1.25', tone: 'mute' },
      },
      flows: [{ path: ['api', 'w2'], kind: 'ctrl', n: 2 }],
      tags: [{ at: [8.8, -1.4], text: 'v2beta2 HPA 제거', tone: 'bad', icon: 'ban' }],
      metrics: { ver: ['1.25 → 1.26', 'warn'] },
      changes: [['~', '컨트롤 플레인 1.25 → 1.26'], ['~', '노드: 새 노드 추가 → 옛 노드 drain'], ['-', 'autoscaling/v2beta2 매니페스트 실패']],
    },
    {
      key: 'Helm', kind: 'solution', title: 'Helm: YAML 묶음을 패키지로',
      body: [
        '앱 하나에 Deployment · Service · Ingress · HPA · ConfigMap… YAML이 열 개 가까이 되고, dev와 prod는 replicas와 이미지 태그만 다릅니다. <b>Helm</b>은 이를 템플릿 묶음인 <b>차트(chart)</b>와 빈칸을 채우는 <b>values</b>로 나눕니다.',
        '<code>helm upgrade --install shop ./charts/shop -f values-prod.yaml</code>을 실행하면 값을 채운 결과가 설치되고, 그 설치 단위를 <b>릴리스</b>라 합니다. 바꿀 때마다 리비전이 쌓여 <code>helm rollback</code>으로 되돌릴 수 있어요.',
      ],
      callout: { type: 'tip', text: '환경 차이는 <code>values-dev.yaml</code> · <code>values-prod.yaml</code>처럼 values 파일에만 두세요. ingress-nginx나 Prometheus 같은 공용 도구도 대부분 Helm 차트로 설치합니다.' },
      hide: ['cpz', 'api', 'wkz', 'w1', 'w2', 'w3'],
      show: ['chart', 'vals', 'hb', 'rel'],
      set: { api: { badge: null }, w1: { state: null, badge: null }, w2: { state: null, badge: null }, w3: { badge: null } },
      code: { ref: 'helm', hl: [3, 8, 11, 17] },
      flows: [{ path: ['chart', 'hb'], kind: 'build' }, { path: ['vals', 'hb'], kind: 'build', delay: 0.4 }, { path: ['hb', 'rel'], kind: 'ctrl', n: 2, delay: 1.2 }],
      metrics: { deploy: ['Helm 릴리스 1개', 'ok'], ver: '1.26' },
      changes: [['+', '차트 하나 + 환경별 values'], ['~', 'YAML 9개 → 릴리스 1개'], ['+', '리비전 기록 · rollback']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 맡길 것과 남는 것',
      body: [
        '관리형 쿠버네티스는 컨트롤 플레인을 맡기고, 우리는 노드 그룹과 앱에 집중하게 해 줍니다. Service는 클라우드 LB로, PVC는 클라우드 디스크로 번역되고, Pod의 권한은 ServiceAccount와 클라우드 역할을 잇는 워크로드 아이덴티티로 줍니다.',
        '버전 업그레이드, 컨텍스트 확인, 차트와 values 관리는 여전히 우리 몫입니다. 다음 챕터에서는 이 클러스터와 그 아래 인프라를 콘솔이 아니라 <b>코드</b>로 만드는 법, Terraform을 배웁니다.',
      ],
      hide: ['chart', 'vals', 'hb', 'rel'],
      show: ['cpz', 'api', 'wkz', 'w1', 'w2', 'w3', 'lb', 'users', 'disk'],
      focus: ['api'],
      flows: [{ path: ['users', 'lb', 'w2'], kind: 'req', n: 2 }, { path: ['api', 'w2'], kind: 'ctrl', delay: 1 }],
      tags: [{ on: 'api', text: '사업자 운영', tone: 'aws' }, { on: 'w1', text: '우리 운영', tone: 'accent', pos: 'left' }],
      metrics: { ops: ['노드 그룹 + 앱', 'ok'] },
    },
  ],
  quiz: [
    {
      q: '자체 설치 클러스터를 EKS로 옮겼습니다. 옮긴 뒤에도 여전히 팀이 챙겨야 하는 일은?',
      options: [
        'etcd 스냅샷 백업과 복구 연습',
        'API 서버 이중화와 인증서 갱신',
        '노드 그룹 업그레이드 시점과, 매니페스트가 새 버전의 API를 쓰는지 점검하기',
        '컨트롤 플레인 VM의 OS 패치',
      ],
      answer: 2,
      why: '관리형 서비스는 etcd · API 서버 · 인증서 · 컨트롤 플레인 패치를 맡습니다. 하지만 언제 업그레이드할지, 노드 그룹을 언제 갈아 끼울지, 우리 매니페스트가 제거된 API를 쓰고 있지 않은지는 여전히 팀의 몫입니다.',
    },
    {
      q: 'EKS의 uploader Pod만 특정 S3 버킷에 쓸 수 있게 하려 합니다. 가장 알맞은 방법은?',
      options: [
        'IAM 사용자의 액세스 키를 Secret으로 만들어 환경 변수로 넣는다',
        '노드 그룹의 IAM 역할에 그 버킷 쓰기 권한을 붙인다',
        'uploader의 ServiceAccount를 IAM 역할과 연결한다(IRSA 또는 EKS Pod Identity)',
        '컨테이너 이미지에 자격 증명 파일을 넣어 빌드한다',
      ],
      answer: 2,
      why: '워크로드 아이덴티티는 그 ServiceAccount를 쓰는 Pod에게만, 짧게 사는 자격 증명으로 권한을 줍니다. 노드 역할은 같은 노드의 모든 Pod가 권한을 나눠 갖게 되고, 액세스 키를 Secret이나 이미지에 넣으면 유출과 교체 문제가 남습니다.',
    },
    {
      q: '실습용 클러스터를 콘솔에서 삭제했는데, 다음 달에도 로드 밸런서와 디스크 요금이 나옵니다. 가장 가능성 높은 원인은?',
      options: [
        '컨트롤 플레인 요금이 한 달 뒤에 정산된다',
        'LoadBalancer Service와 PVC가 만든 클라우드 리소스가, 정리해 줄 컨트롤러 없이 남았다',
        '노드 그룹이 스팟이어서 반납이 늦어졌다',
        'kubeconfig에 컨텍스트가 남아 있어서 과금된다',
      ],
      answer: 1,
      why: 'LB와 디스크는 클러스터 안의 컨트롤러와 CSI 드라이버가 클라우드 API로 만든 별도 리소스입니다. 클러스터를 먼저 지우면 이를 지워 줄 주체가 사라집니다. 그래서 Service와 PVC를 먼저 지우고 클러스터를 지워야 합니다. kubeconfig 컨텍스트는 로컬 설정일 뿐입니다.',
    },
    {
      q: 'dev와 prod의 차이가 replicas, 이미지 태그, 도메인뿐입니다. Helm으로 관리할 때 가장 알맞은 구조는?',
      options: [
        '환경마다 차트를 복사해 따로 고친다',
        '차트 하나에 환경별 values 파일(values-dev.yaml, values-prod.yaml)을 둔다',
        'dev 차트로 설치한 뒤 prod에서는 kubectl edit로 값을 고친다',
        '템플릿 안에 환경 이름으로 if 분기를 가득 넣는다',
      ],
      answer: 1,
      why: '차트는 공통 구조, values는 환경 차이입니다. 차트를 복사하면 고칠 곳이 환경 수만큼 늘고, kubectl edit는 Helm 릴리스 기록과 어긋나 다음 업그레이드 때 덮어써집니다. if 분기는 차이를 템플릿 깊숙이 숨겨 리뷰를 어렵게 합니다.',
    },
  ],
};
