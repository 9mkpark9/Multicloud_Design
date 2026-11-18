export default {
  id: 'managed-k8s',
  learn: [
    '관리형 쿠버네티스가 대신 운영하는 것: 컨트롤 플레인',
    '노드 그룹 · 노드 풀, Pod 네트워크 IP, 클라우드 LB · 디스크 연동',
    '워크로드 아이덴티티로 Pod에 클라우드 권한 주기',
    'EKS · AKS · GKE · NKS의 차이와 버전 업그레이드',
    'kubeconfig 컨텍스트와 클라우드 인증',
    'Helm 차트 · values · 릴리스와 롤백',
  ],
  legend: [['ctrl', 'API 호출 · 제어'], ['req', '요청'], ['data', '데이터'], ['res', '자격 증명'], ['build', '템플릿 · 값'], ['bad', '실수 · 실패']],
  metrics: [
    { id: 'ops', label: '우리가 운영', icon: 'wrench' },
    { id: 'ip', label: '남은 Pod IP', icon: 'network' },
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
      sts: { at: [-2.6, 0], label: 'STS', sub: '토큰 교환', icon: 'key-round', color: 'aws' },

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
      e_up_sts: { from: 'up', to: 'sts', style: 'dashed', bi: true },
      e_sts_iam: { from: 'sts', to: 'iamr', style: 'dashed' },
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
    // 1
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
      metrics: { ops: ['CP + 노드 + 앱', 'bad'], ip: '-', perm: '-', ver: '1.25', deploy: 'YAML 9개' },
      more: [
        { title: '직접 운영의 할 일 목록', list: [
          '<b>etcd</b>: 정기 스냅샷, 다른 곳에 보관, 실제로 복구해 보는 연습. 홀수 대(3 · 5)로 띄워 과반이 살아 있어야 동작합니다.',
          '<b>인증서</b>: kubeadm이 만든 컴포넌트 인증서는 기본 1년짜리라, 갱신하지 않으면 어느 날 API 서버가 응답하지 않습니다. 업그레이드할 때 함께 갱신되므로, 업그레이드를 미루는 팀일수록 위험합니다.',
          '<b>업그레이드</b>: 컨트롤 플레인 컴포넌트를 한 마이너씩 올리고, kubelet을 노드마다 올립니다.',
          '<b>고가용성</b>: API 서버 여러 대 앞에 로드 밸런서를 두고, 컨트롤 플레인 노드를 여러 AZ에 나눕니다.',
        ] },
        { title: '직접 해보기', body: ['직접 운영한다면 이런 명령을 정기적으로 돌리게 됩니다.'], code: { title: 'control-plane 노드', lang: 'sh', text: `$ sudo kubeadm certs check-expiration
CERTIFICATE   EXPIRES               RESIDUAL TIME
apiserver     Mar 02, 2027 04:11    104d
$ sudo ETCDCTL_API=3 etcdctl snapshot save \\
    /backup/etcd-$(date +%F).db` } },
        { title: '더 생각해 볼 것', body: [
          '직접 운영이 맞는 경우도 있습니다. 클라우드를 쓸 수 없는 사내 데이터센터, 엣지 장비, 규제 때문에 컨트롤 플레인까지 우리가 쥐어야 하는 경우예요. 그 밖에는 이 일을 맡길 수 있는지부터 따져 봅니다.',
        ] },
      ],
    },
    // 2
    {
      key: '관리형', kind: 'solution', title: '컨트롤 플레인을 클라우드에 맡깁니다',
      body: [
        '<b>관리형 쿠버네티스</b>(EKS · AKS · GKE · NKS)는 컨트롤 플레인을 클라우드 사업자가 운영합니다. API 서버를 이중화하고, etcd를 백업하고, 패치와 인증서를 챙깁니다. 우리 눈에는 <b>API 엔드포인트</b> 하나만 보여요.',
        '우리가 맡는 것은 워커 노드와 그 위의 앱입니다. 클러스터를 만드는 일도 콘솔이나 Terraform 몇 줄이면 되고, 보통 십여 분이면 끝납니다.',
      ],
      callout: { type: 'key', text: '컨트롤 플레인 VM에는 접속할 수 없고 etcd를 직접 만질 수도 없습니다. 대신 그 운영이 사업자의 책임(SLA)이 됩니다.' },
      hide: ['cm', 'etcd'],
      set: { cpz: { label: '컨트롤 플레인 (클라우드가 운영)', color: 'aws' }, api: { label: 'API', sub: '엔드포인트', color: 'aws' } },
      focus: ['api'],
      flows: [{ path: ['me', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'w2'], kind: 'ctrl', delay: 1 }],
      metrics: { ops: ['노드 + 앱', 'ok'] },
      changes: [['-', 'etcd 백업 · 인증서 · CP 패치'], ['~', '컨트롤 플레인 → 사업자 책임'], ['+', 'API 엔드포인트 하나']],
      more: [
        { title: '직접 해보기', body: ['CLI 한 줄로 클러스터를 만들 수 있지만, 실무에서는 다음 챕터의 Terraform으로 만들어 코드로 남깁니다.'], code: { title: 'terminal', lang: 'sh', text: `$ eksctl create cluster --name shop-prod \\
    --region ap-northeast-2 --nodes 3
$ az aks create -g shop-rg -n shop-dev \\
    --node-count 3 --generate-ssh-keys
$ gcloud container clusters create shop-stg \\
    --region asia-northeast3 --num-nodes 1` } },
        { title: '엔드포인트 접근', list: [
          'API 엔드포인트는 인터넷에 열린 <b>퍼블릭</b>, VPC 안에서만 닿는 <b>프라이빗</b>, 또는 둘 다로 둘 수 있습니다. 퍼블릭으로 둔다면 허용 IP 대역을 좁혀 두세요.',
          '프라이빗만 쓰면 CI 러너나 운영자 PC가 VPN · 배스천 등으로 VPC 안에 들어와야 kubectl이 닿습니다.',
        ] },
        { title: '비용과 등급', body: [
          '컨트롤 플레인 요금과 SLA는 사업자마다 다릅니다. 예를 들어 AKS는 SLA가 없는 무료 등급과 SLA가 있는 유료 등급을 고를 수 있고, EKS는 클러스터당 시간 요금이 붙습니다. 지원이 끝난 옛 버전을 계속 쓰면 추가 요금이 붙는 서비스도 있으니 업그레이드 계획과 함께 봅니다.',
        ] },
      ],
    },
    // 3
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
      more: [
        { title: '클라우드별로', rows: [
          ['EKS', '관리형 노드 그룹 · 자체 관리 노드 · Fargate · Karpenter', 'aws'],
          ['AKS', '시스템 노드 풀(필수) + 사용자 노드 풀', 'azure'],
          ['GKE', '노드 풀 · 자동 업그레이드 · 자동 복구', 'gcp'],
          ['NKS', '노드 풀 (서버 타입 · 대수 · 오토스케일)', 'ncp'],
        ] },
        { title: '설정 예시', body: ['스팟 그룹에는 taint를 걸고, 배치 Job에만 toleration과 affinity를 줍니다. 노드 그룹 라벨은 관리형 서비스가 붙여 주는 것을 씁니다.'], code: { title: 'batch-job.yaml (일부)', lang: 'yaml', text: `tolerations:
  - key: spot
    operator: Exists
    effect: NoSchedule
nodeSelector:
  eks.amazonaws.com/capacityType: SPOT` } },
        { title: '실무 팁', list: [
          '시스템 Pod(CoreDNS, CNI, CSI 컨트롤러 등)가 사는 그룹은 스팟이 아닌 안정적인 노드로 최소 2대 이상 둡니다.',
          '스팟은 인스턴스 타입을 여러 개 섞어 두면 한 타입이 모자랄 때도 노드를 얻기 쉽습니다.',
        ] },
      ],
    },
    // 4
    {
      key: 'Pod IP', kind: 'case', title: '사례: 노드는 있는데 Pod IP가 없습니다',
      body: [
        'EKS 노드 그룹을 /24 서브넷 두 개에 만들었습니다. 트래픽이 늘어 Pod가 300개를 넘자 새 Pod가 <code>ContainerCreating</code>에서 멈추고, Events에 <code>failed to assign an IP address to container</code>가 찍힙니다.',
        'EKS 기본 CNI는 Pod마다 <b>VPC 서브넷의 실제 IP</b>를 줍니다. 노드 CPU는 남았지만 서브넷 IP가 바닥난 것이죠. 더 큰 서브넷(또는 보조 CIDR)을 붙이고, IP를 묶음으로 받는 설정을 켜서 해결했습니다.',
      ],
      callout: { type: 'cloud', text: 'Azure CNI · GKE VPC 네이티브도 Pod IP를 VNet · VPC 대역에서 받습니다. 클러스터를 만들기 전에 Pod 수만큼 IP 대역을 계획하세요.' },
      hide: ['cpz', 'api'],
      set: {
        w1: { badge: 'IP 0', tone: 'bad' },
        w2: { state: 'hot', badge: 'IP 0', tone: 'bad' },
        w3: { label: 'node-3', sub: 'spot', color: 'yellow' },
      },
      focus: ['w2'],
      tags: [
        { at: [2.4, 2.8], text: 'subnet /24 × 2 소진', tone: 'bad', icon: 'network', dy: 26 },
        { on: 'w3', text: 'CPU는 남음', tone: 'ok', pos: 'right' },
      ],
      metrics: { ip: ['0개', 'bad'] },
      changes: [['-', '새 Pod: IP 할당 실패'], ['~', '원인: 서브넷 IP 소진'], ['+', '해결: 큰 서브넷 · 보조 CIDR']],
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl describe pod api-7c5b-x2c | tail -3
  Warning  FailedCreatePodSandBox  kubelet
    ... plugin type="aws-cni" failed (add):
    failed to assign an IP address to container
$ aws ec2 describe-subnets --subnet-ids subnet-0a1 \\
    --query 'Subnets[].AvailableIpAddressCount'
[ 0 ]` } },
        { title: '동작 원리', body: [
          'EKS의 VPC CNI는 노드에 보조 네트워크 인터페이스(ENI)를 붙이고 거기에 서브넷 IP를 미리 확보해 Pod에 나눠 줍니다. 그래서 Pod가 VPC 안에서 "진짜 IP"를 가져 다른 서비스와 바로 통신할 수 있지만, 서브넷 크기와 인스턴스 타입별 ENI · IP 한도가 곧 Pod 수의 한도가 됩니다. 예를 들어 m5.large의 기본 최대 Pod 수는 29개입니다.',
        ] },
        { title: '클라우드별로', rows: [
          ['EKS VPC CNI', 'Pod = VPC IP · prefix 할당 · 보조 CIDR', 'aws'],
          ['AKS', 'Azure CNI(VNet IP) 또는 Overlay(별도 대역)', 'azure'],
          ['GKE', 'VPC 네이티브: Pod용 보조 IP 범위', 'gcp'],
          ['NKS', 'VPC 서브넷 설계를 생성 전에 확인', 'ncp'],
        ] },
      ],
    },
    // 5
    {
      key: '클라우드 연동', kind: 'concept', title: 'Service와 PVC가 클라우드 자원이 됩니다',
      body: [
        '<code>type: LoadBalancer</code>인 Service를 만들면, 클러스터의 컨트롤러가 클라우드 API를 불러 <b>진짜 로드 밸런서</b>를 만들고 노드나 Pod를 대상으로 등록합니다. EKS에서는 보통 <b>AWS Load Balancer Controller</b>가 NLB · ALB를 만들어요.',
        '지난 레슨의 PVC도 같은 원리입니다. CSI 드라이버가 클라우드 디스크를 만들어 노드에 붙이죠. 쿠버네티스 객체 하나가 클라우드 리소스 하나로 번역되는 셈입니다.',
      ],
      callout: { type: 'warn', text: '클러스터를 지우기 전에 LoadBalancer Service와 PVC부터 지우세요. 정리해 줄 컨트롤러가 먼저 사라지면 LB와 디스크가 남아 요금이 나옵니다.' },
      hide: ['np1', 'np2'],
      show: ['wkz', 'lb', 'users', 'disk'],
      set: { w1: { badge: null }, w2: { state: null, badge: null }, w3: { label: 'node-3', sub: null, color: 'blue' } },
      tags: [
        { on: 'lb', text: 'Service → NLB', tone: 'accent', pos: 'right' },
        { on: 'disk', text: 'PVC → EBS', tone: 'accent', pos: 'bottom' },
      ],
      flows: [{ path: ['users', 'lb', 'w2'], kind: 'req', n: 3 }, { path: ['w3', 'disk'], kind: 'data', n: 2, delay: 0.8 }],
      metrics: { ip: ['넉넉함', 'ok'] },
      changes: [['+', 'NLB: Service를 보고 컨트롤러가 생성'], ['+', 'EBS: PVC를 보고 CSI 드라이버가 생성']],
      more: [
        { title: '설정 예시', body: ['LB의 세부 모양은 Service 주석(annotation)으로 정합니다. 주석 이름은 클라우드마다 다릅니다.'], code: { title: 'api-svc.yaml (일부)', lang: 'yaml', text: `metadata:
  annotations:
    # AWS LB Controller: NLB, Pod IP로 직접
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
spec:
  type: LoadBalancer` } },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get svc api
NAME  TYPE          EXTERNAL-IP
api   LoadBalancer  <pending>
# 잠시 뒤
api   LoadBalancer  k8s-shop-api-1a2b.elb.ap-...` } },
        { title: '흔한 실수', list: [
          'EXTERNAL-IP가 계속 <code>&lt;pending&gt;</code>이면 LB 컨트롤러가 없거나 권한이 없거나, 서브넷에 LB용 태그가 빠진 경우가 많습니다. 컨트롤러 로그를 먼저 보세요.',
          '내부용 LB가 필요하면 내부 LB 주석을 써야 합니다(AKS는 <code>azure-load-balancer-internal</code>, GKE는 <code>networking.gke.io/load-balancer-type</code>). 빠뜨리면 인터넷에 열린 LB가 생깁니다.',
        ] },
      ],
    },
    // 6
    {
      key: 'Pod 권한', kind: 'solution', title: 'Pod에게 클라우드 권한을 주는 법',
      body: [
        '업로드 Pod가 S3에 이미지를 써야 합니다. 액세스 키를 Secret에 넣으면 유출과 교체가 문제이고, <b>노드의 IAM 역할</b>에 권한을 붙이면 그 노드의 <b>모든 Pod</b>가 같은 권한을 얻습니다.',
        '답은 <b>워크로드 아이덴티티</b>입니다. 쿠버네티스 <b>ServiceAccount</b>를 클라우드 역할과 연결하면, Pod는 자기 ServiceAccount 토큰을 짧게 사는 자격 증명으로 바꿔 씁니다. 장기 키가 어디에도 남지 않아요.',
      ],
      callout: { type: 'cloud', text: 'AWS는 <b>IRSA</b>와 <b>EKS Pod Identity</b>, Azure는 <b>Entra Workload ID</b>, GCP는 <b>GKE Workload Identity Federation</b>이 같은 일을 합니다.' },
      hide: ['wkz', 'w1', 'w2', 'w3', 'lb', 'users', 'disk'],
      show: ['up', 'iamr', 's3'],
      code: { ref: 'sa', hl: [6, 7, 8, 18] },
      flows: [{ path: ['up', 'iamr'], kind: 'ctrl' }, { path: ['iamr', 'up'], kind: 'res', delay: 1 }, { path: ['up', 's3'], kind: 'data', n: 2, delay: 2 }],
      tags: [{ on: 'iamr', text: '임시 자격 증명', tone: 'ok', icon: 'clock', pos: 'top' }],
      metrics: { perm: ['Pod별 역할', 'ok'] },
      changes: [['-', 'Secret 속 액세스 키'], ['-', '노드 역할에 붙인 S3 권한'], ['+', 'ServiceAccount ↔ IAM 역할']],
      more: [
        { title: '세 방법 비교', rows: [
          ['액세스 키를 Secret에', '유출 · 교체 부담, 키가 영원히 유효', 'bad'],
          ['노드 IAM 역할', '같은 노드의 모든 Pod가 권한 공유', 'bad'],
          ['워크로드 아이덴티티', 'SA별 역할 · 짧은 임시 자격 증명', 'ok'],
        ] },
        { title: '클라우드별로', list: [
          '<b>EKS IRSA</b>: ServiceAccount에 <code>eks.amazonaws.com/role-arn</code> 주석, IAM 역할의 신뢰 정책에 클러스터 OIDC 공급자와 SA 이름. <b>EKS Pod Identity</b>는 EKS API로 "SA ↔ 역할" 연결을 만들고, 노드의 에이전트가 자격 증명을 줍니다.',
          '<b>AKS</b>: 관리 ID에 페더레이션 자격 증명을 만들고, SA에 <code>azure.workload.identity/client-id</code> 주석, Pod에 <code>azure.workload.identity/use: "true"</code> 라벨.',
          '<b>GKE</b>: Workload Identity Federation을 켜고, IAM에서 그 SA(주체)에 역할을 부여합니다.',
        ] },
        { title: '흔한 실수', list: [
          'SA에 주석을 단 뒤 Pod를 다시 만들지 않으면 예전 Pod에는 자격 증명이 주입되지 않습니다. <code>kubectl rollout restart</code>로 다시 띄우세요.',
          'Pod가 노드 역할로도 권한을 얻을 수 있으면 실수가 가려집니다. 노드 역할에는 노드에 꼭 필요한 권한만 두세요.',
        ] },
      ],
    },
    // 7
    {
      key: 'ID 교환', kind: 'concept', title: '토큰을 임시 자격 증명으로 바꾸는 과정',
      body: [
        'IRSA를 예로 따라가 봅니다. kubelet은 Pod에 클러스터가 서명한 <b>ServiceAccount 토큰</b>(JWT)을 파일로 넣어 줍니다. AWS SDK는 이 토큰을 <b>STS</b>에 보내 "이 역할을 맡겠다"고 요청합니다.',
        'STS는 토큰 서명을 클러스터의 OIDC 공급자로 확인하고, 역할의 <b>신뢰 정책</b>이 이 네임스페이스 · SA를 허용하는지 본 뒤, 한 시간 안팎으로 유효한 임시 자격 증명을 돌려줍니다.',
      ],
      callout: { type: 'warn', text: '신뢰 정책에서 SA 이름 조건(<code>sub</code>)을 빼면 클러스터의 아무 Pod나 그 역할을 맡을 수 있습니다. 조건은 꼭 네임스페이스:SA까지 좁히세요.' },
      hide: ['e_up_iam'],
      show: ['sts'],
      focus: ['sts'],
      tags: [
        { on: 'up', text: 'SA 토큰 (JWT)', icon: 'file-key', pos: 'bottom' },
        { on: 'sts', text: '서명 · 조건 확인', tone: 'ok', icon: 'shield-check', pos: 'left' },
      ],
      flows: [
        { path: ['up', 'sts'], kind: 'ctrl' },
        { path: ['sts', 'iamr'], kind: 'ctrl', delay: 0.8 },
        { path: ['sts', 'up'], kind: 'res', delay: 1.8 },
        { path: ['up', 's3'], kind: 'data', n: 2, delay: 2.6 },
      ],
      metrics: { perm: ['SA 1개 · 1시간 자격 증명', 'ok'] },
      more: [
        { title: '설정 예시', body: ['IAM 역할의 신뢰 정책입니다. OIDC 공급자 ID 부분은 클러스터마다 다릅니다.'], code: { title: 'trust-policy.json', lang: 'json', text: `{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::<계정>:oidc-provider/<OIDC>"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "<OIDC>:sub": "system:serviceaccount:shop:uploader",
      "<OIDC>:aud": "sts.amazonaws.com"
    }
  }
}` } },
        { title: '직접 확인', body: ['웹훅이 Pod에 넣어 준 환경 변수와, 실제로 맡은 역할을 봅니다.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl exec deploy/uploader -- env | grep AWS_
AWS_ROLE_ARN=arn:aws:iam::111122223333:role/shop-uploader
AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/eks...
$ kubectl exec deploy/uploader -- \\
    aws sts get-caller-identity --query Arn
"arn:aws:sts::111122223333:assumed-role/shop-uploader/..."` } },
        { title: '동작 원리', body: [
          '이 SA 토큰은 수명이 짧고 kubelet이 주기적으로 새로 발급합니다. SDK도 임시 자격 증명이 만료되기 전에 알아서 다시 교환하므로 앱 코드는 키를 다룰 일이 없습니다. Azure · GCP도 "클러스터가 서명한 토큰 → 클라우드 토큰 서비스 → 임시 자격 증명"이라는 같은 구조입니다.',
        ] },
      ],
    },
    // 8
    {
      key: '4사 비교', kind: 'compare', title: 'EKS · AKS · GKE · NKS',
      body: [
        '네 서비스 모두 컨트롤 플레인 운영, 노드 풀, LB · 디스크 연동, 클라우드 계정 연동이라는 뼈대는 같습니다. 차이는 <b>얼마나 많이 맡기느냐</b>와 주변 서비스와의 연결이에요.',
        'EKS는 기본 구성이 얇아 애드온을 골라 조립하고, AKS는 Entra ID와 맞물립니다. GKE의 <b>Autopilot</b>은 노드까지 Google이 관리하고 Pod가 요청한 자원만큼 과금합니다. NKS는 NCP의 VPC · Load Balancer · 스토리지와 연동되는 관리형 쿠버네티스예요.',
      ],
      callout: { type: 'tip', text: '맡길수록 편하지만 고를 수 있는 것은 줄어듭니다. Autopilot에서는 노드 접속이나 특권 컨테이너 같은 일이 제한돼요.' },
      hide: ['up', 'iamr', 's3', 'sts'],
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
      more: [
        { title: '항목별로', rows: [
          ['노드 관리를 맡기는 모드', 'EKS Auto Mode · Fargate / GKE Autopilot', 'info'],
          ['Pod 네트워크', 'VPC CNI / Azure CNI · Overlay / VPC 네이티브', 'info'],
          ['사람 인증', 'IAM / Entra ID / Google IAM / NCP 계정', 'info'],
          ['Pod 권한', 'IRSA · Pod Identity / Workload ID / WIF', 'info'],
          ['업그레이드', '수동 중심 / 자동 업그레이드 채널 / 릴리스 채널', 'info'],
        ] },
        { title: '고르는 기준', list: [
          '대부분의 다른 시스템이 이미 어느 클라우드에 있는지가 가장 큰 기준입니다. DB · 스토리지 · IAM과 같은 곳에 두면 네트워크 비용과 권한 설계가 단순해집니다.',
          '노드 운영 인력이 적다면 노드까지 맡기는 모드(Autopilot, EKS Auto Mode 등)를 먼저 검토합니다. 대신 DaemonSet · 특권 Pod · 특정 인스턴스 타입 같은 자유도가 줄어듭니다.',
          '국내 공공 · 규제 환경처럼 특정 사업자가 요구되는 경우에는 NKS 같은 국내 클라우드가 선택지가 됩니다.',
        ] },
      ],
    },
    // 9
    {
      key: '접속 · 인증', kind: 'concept', title: 'kubectl은 클라우드 계정으로 들어갑니다',
      body: [
        '관리형 클러스터에 접속하려면 사업자 CLI로 kubeconfig를 받습니다. 여기에는 정적 비밀번호 대신, kubectl이 실행될 때마다 <b>클라우드 CLI로 짧은 토큰을 받아 오는</b> exec 설정이 들어 있어요.',
        'API 서버는 이 토큰으로 "누구인가"(<b>인증</b>)를 클라우드 계정에 맞춰 확인하고, "무엇을 해도 되는가"(<b>인가</b>)는 쿠버네티스 RBAC로 판단합니다. 그래서 사람의 권한도 클라우드 IAM과 RBAC 두 곳에서 설계합니다.',
      ],
      callout: { type: 'key', text: '<b>컨텍스트</b>는 "어느 클러스터에, 누구로, 어느 네임스페이스로"의 묶음입니다. kubectl은 current-context로 명령을 보내요.' },
      hide: ['c_eks', 'c_aks', 'c_gke', 'c_nks'],
      show: ['me', 'kprod', 'kdev'],
      flows: [{ path: ['me', 'kprod'], kind: 'ctrl', n: 2 }],
      tags: [{ on: 'kprod', text: 'IAM 인증 → RBAC 인가', tone: 'info', icon: 'shield-check', pos: 'top' }],
      code: {
        title: '~/.kube/config (일부)', lang: 'yaml', hl: [8, 9, 10, 15, 16, 17],
        text: `clusters:
- name: shop-prod
  cluster:
    server: https://...eks.amazonaws.com
contexts:
- name: prod
  context:
    cluster: shop-prod
    user: prod-user
    namespace: shop
users:
- name: prod-user
  user:
    exec:              # 실행할 때마다 토큰 발급
      command: aws
      args: [eks, get-token,
        --cluster-name, shop-prod]
`,
      },
      metrics: { perm: ['Pod별 역할', 'ok'] },
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl auth whoami
ATTRIBUTE  VALUE
Username   arn:aws:sts::111122223333:assumed-role/dev/kim
Groups     [system:authenticated]
$ kubectl auth can-i delete deployment -n shop
no` } },
        { title: '클라우드별로', list: [
          '<b>EKS</b>: IAM 주체를 클러스터에 등록하는 <b>액세스 항목(access entry)</b>으로 쿠버네티스 권한을 연결합니다. 예전 방식인 <code>aws-auth</code> ConfigMap도 남아 있습니다.',
          '<b>AKS</b>: Entra ID 연동을 켜고 <code>kubelogin</code>으로 토큰을 받습니다. 권한은 Kubernetes RBAC 또는 Azure RBAC로 줍니다.',
          '<b>GKE</b>: <code>gke-gcloud-auth-plugin</code>이 Google 계정 토큰을 넣고, Google IAM과 RBAC가 함께 판단합니다.',
          '<b>NKS</b>: NCP 계정 인증과 연동된 kubeconfig를 받아 씁니다.',
        ] },
        { title: '흔한 실수', list: [
          '클러스터를 만든 사람의 계정만 관리자 권한을 갖는 서비스가 있습니다. 그 사람이 퇴사하면 아무도 들어가지 못하니, 팀 역할에 권한을 따로 등록해 두세요.',
        ] },
      ],
    },
    // 10
    {
      key: 'kubeconfig', kind: 'case', title: '사례: dev인 줄 알았는데 prod였다',
      body: [
        '어제 prod를 점검하며 컨텍스트를 <code>prod</code>로 바꿔 두고 그대로 퇴근했습니다. 오늘 dev를 정리한다며 <code>kubectl delete deploy --all -n shop</code>을 실행하자 prod의 Deployment가 모두 지워졌습니다.',
        'kubectl은 지금 어느 클러스터를 보고 있는지 묻지 않습니다. 클러스터가 여러 개가 되면 가장 흔하고 아픈 사고예요.',
      ],
      callout: { type: 'tip', text: '프롬프트에 현재 컨텍스트를 띄우고, 위험한 명령에는 <code>--context</code>를 명시하세요. 근본 대책은 prod에 쓰기 권한을 가진 사람을 줄이는 것입니다.' },
      set: { kprod: { state: 'hot', badge: 'current', tone: 'bad' } },
      code: { ref: 'ctx', hl: [6, 9, 12, 13] },
      flows: [{ path: ['me', 'kprod'], kind: 'bad', n: 2 }],
      tags: [{ on: 'kdev', text: '지우려던 곳', tone: 'mute', pos: 'right' }],
      more: [
        { title: '증상 → 원인 → 해결', list: [
          '증상: dev에서 실행했다고 믿은 명령의 결과가 prod 모니터링에 나타납니다.',
          '원인: <code>~/.kube/config</code>의 current-context가 prod로 남아 있었고, 사람의 계정에 prod 삭제 권한이 있었습니다.',
          '해결: Git의 매니페스트(또는 Helm 릴리스)로 다시 배포해 복구하고, 다음 항목의 습관과 권한 구조를 도입했습니다.',
        ] },
        { title: '실무 팁', list: [
          '클러스터마다 kubeconfig 파일을 나누고 <code>KUBECONFIG</code> 환경 변수로 고르면, 터미널 창마다 대상이 분명해집니다.',
          'prod 컨텍스트 이름에 눈에 띄는 표시를 넣고, 셸 프롬프트에 컨텍스트 · 네임스페이스를 보여 주는 도구를 씁니다.',
          '사람은 prod에 읽기 권한만 갖고, 변경은 CI/CD나 GitOps만 하게 하면 이 사고 자체가 불가능해집니다(CI/CD 챕터).',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl config rename-context prod PROD-shop
$ kubectl config set-context --current --namespace shop
$ export KUBECONFIG=~/.kube/dev.yaml` } },
      ],
    },
    // 11
    {
      key: '업그레이드', kind: 'concept', title: '버전 업그레이드는 피할 수 없습니다',
      body: [
        '쿠버네티스는 1년에 세 번쯤 마이너 버전이 나오고, 관리형 서비스도 버전마다 지원 기간이 있어 끝나면 강제로 올라가거나 추가 요금이 붙습니다. 순서는 <b>컨트롤 플레인 먼저</b>(한 번에 한 마이너씩), 그다음 <b>노드 그룹</b>을 새 버전 노드로 하나씩 갈아 끼웁니다.',
        '함정은 <b>제거된 API</b>입니다. 1.26에서 <code>autoscaling/v2beta2</code> HPA가 없어지자, 옛 매니페스트를 그대로 쓰던 파이프라인이 <code>no matches for kind</code> 오류로 멈췄습니다.',
      ],
      callout: { type: 'tip', text: '올리기 전에 deprecated API를 점검하고 dev부터 올리세요. PodDisruptionBudget이 있어야 노드 교체 중에도 서비스가 유지돼요.' },
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
      more: [
        { title: '순서', list: [
          '① 릴리스 노트에서 제거 · 변경되는 API와 기능을 확인하고, 매니페스트 · Helm 차트 · 애드온을 점검합니다.',
          '② 애드온(CNI, CoreDNS, kube-proxy, CSI)의 호환 버전을 확인합니다.',
          '③ 컨트롤 플레인을 한 마이너 올립니다. 건너뛸 수 없습니다.',
          '④ 노드 그룹을 교체합니다. 새 버전 노드를 추가하고, 옛 노드를 cordon · drain해 Pod를 옮긴 뒤 반납합니다(서지 업그레이드).',
          '⑤ 애드온을 새 버전에 맞게 올립니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl version
Client Version: v1.26.4
Server Version: v1.26.9-eks-...
$ kubectl get nodes
NAME    STATUS                    VERSION
node-1  Ready,SchedulingDisabled  v1.25.16
node-2  Ready                     v1.26.9` } },
        { title: '클라우드별로', list: [
          '<b>GKE</b>는 릴리스 채널을 고르면 컨트롤 플레인과 노드를 자동으로 올려 줍니다. 대신 유지보수 창과 제외 기간을 정해 시점을 조절합니다.',
          '<b>AKS</b>도 자동 업그레이드 채널을 고를 수 있고, 노드 풀마다 한 번에 추가할 노드 수(서지)를 정합니다.',
          '<b>EKS</b>는 컨트롤 플레인과 관리형 노드 그룹 업그레이드를 각각 실행하며, 콘솔의 업그레이드 인사이트가 제거될 API 사용을 알려 줍니다.',
        ] },
      ],
    },
    // 12
    {
      key: 'Helm', kind: 'solution', title: 'Helm: YAML 묶음을 패키지로',
      body: [
        '앱 하나에 Deployment · Service · Ingress · HPA · ConfigMap… YAML이 열 개 가까이 되고, dev와 prod는 replicas와 이미지 태그만 다릅니다. <b>Helm</b>은 이를 템플릿 묶음인 <b>차트(chart)</b>와 빈칸을 채우는 <b>values</b>로 나눕니다.',
        '<code>helm upgrade --install shop ./charts/shop -f values-prod.yaml</code>을 실행하면 값을 채운 결과가 설치되고, 그 설치 단위를 <b>릴리스</b>라 합니다. 바꿀 때마다 리비전이 쌓입니다.',
      ],
      callout: { type: 'tip', text: '환경 차이는 <code>values-dev.yaml</code> · <code>values-prod.yaml</code>처럼 values 파일에만 두세요. ingress-nginx나 Prometheus 같은 공용 도구도 대부분 Helm 차트로 설치합니다.' },
      hide: ['cpz', 'api', 'wkz', 'w1', 'w2', 'w3'],
      show: ['chart', 'vals', 'hb', 'rel'],
      set: { api: { badge: null }, w1: { state: null, badge: null }, w2: { state: null, badge: null }, w3: { badge: null } },
      code: { ref: 'helm', hl: [3, 8, 11, 17] },
      flows: [{ path: ['chart', 'hb'], kind: 'build' }, { path: ['vals', 'hb'], kind: 'build', delay: 0.4 }, { path: ['hb', 'rel'], kind: 'ctrl', n: 2, delay: 1.2 }],
      metrics: { deploy: ['Helm 릴리스 1개', 'ok'], ver: '1.26' },
      changes: [['+', '차트 하나 + 환경별 values'], ['~', 'YAML 9개 → 릴리스 1개'], ['+', '리비전 기록']],
      more: [
        { title: '차트의 구조', code: { title: 'charts/shop/', lang: 'text', text: `Chart.yaml          # 이름 · 차트 버전 · 앱 버전
values.yaml         # 기본값
templates/
  deployment.yaml   # {{ .Values.* }} 를 채울 틀
  service.yaml
  hpa.yaml
  _helpers.tpl      # 이름 · 라벨 공통 조각
charts/             # 의존 차트` } },
        { title: '동작 원리', list: [
          'values는 <b>차트의 values.yaml → <code>-f</code> 파일들(적은 순서대로) → <code>--set</code></b> 순으로 덮어씁니다. 같은 키라면 뒤가 이깁니다.',
          'Helm은 템플릿을 렌더링해 만든 매니페스트를 API 서버에 적용하고, 릴리스 정보(쓴 values, 렌더링 결과)를 그 네임스페이스의 Secret에 리비전별로 저장합니다.',
          '<code>helm template</code>은 클러스터에 적용하지 않고 렌더링 결과만 출력합니다. 리뷰나 GitOps 도구와 함께 쓸 때 유용합니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ helm repo add ingress-nginx \\
    https://kubernetes.github.io/ingress-nginx
$ helm upgrade --install ingress \\
    ingress-nginx/ingress-nginx \\
    -n ingress --create-namespace
$ helm template shop ./charts/shop \\
    -f values-prod.yaml | less` } },
      ],
    },
    // 13
    {
      key: '릴리스 관리', kind: 'concept', title: '릴리스 기록을 보고 되돌리기',
      body: [
        'values-prod.yaml의 오타로 리비전 8이 잘못 나갔습니다. <code>helm history</code>로 리비전을 보고 <code>helm rollback shop 7</code>을 실행하면, 7번의 렌더링 결과가 다시 적용되고 이것이 리비전 <b>9</b>로 기록됩니다.',
        '롤아웃 자체는 지난 레슨의 Deployment 롤링 업데이트가 그대로 처리합니다. Helm은 여러 리소스를 한 묶음으로 되돌려 준다는 점이 다릅니다.',
      ],
      callout: { type: 'warn', text: 'Helm으로 설치한 리소스를 <code>kubectl edit</code>로 고치면 기록과 실제가 어긋나고, 다음 upgrade가 그 수정을 덮어씁니다. 바꿀 때는 values를 고쳐 다시 upgrade하세요.' },
      set: { rel: { sub: 'REVISION 9', badge: '7로 롤백', tone: 'ok' }, vals: { state: 'dim' } },
      focus: ['rel'],
      flows: [{ path: ['hb', 'rel'], kind: 'ctrl', n: 2 }],
      code: {
        title: 'helm history · rollback', lang: 'sh', hl: [6, 8, 11],
        text: `$ helm list -n shop
NAME  REVISION  STATUS    CHART
shop  8         deployed  shop-1.3.0
$ helm history shop -n shop
REVISION  STATUS      DESCRIPTION
7         superseded  Upgrade complete
8         deployed    Upgrade complete
$ helm rollback shop 7 -n shop
Rollback was a success! Happy Helming!
$ helm history shop -n shop | tail -1
9         deployed    Rollback to 7
`,
      },
      metrics: { deploy: ['릴리스 1개 · rev 9', 'ok'] },
      changes: [['-', '리비전 8: 잘못된 values'], ['+', 'helm rollback → 리비전 9'], ['~', '여러 리소스가 한 번에 복귀']],
      more: [
        { title: '실무 팁', list: [
          '<code>helm upgrade</code>에 <code>--wait --timeout 5m</code>을 주면 리소스가 Ready가 될 때까지 기다리고, 실패하면 오류로 끝나 CI가 알아챕니다.',
          '배포 전 <code>helm diff</code> 플러그인으로 바뀔 내용을 미리 보면 리뷰가 쉬워집니다.',
          '<code>helm get values shop</code>으로 지금 릴리스에 쓰인 값을, <code>helm get manifest shop</code>으로 실제 적용된 매니페스트를 봅니다.',
        ] },
        { title: '흔한 실수', list: [
          '비밀번호를 values 파일에 그대로 적어 Git에 올리면 유출됩니다. 외부 시크릿 저장소나 암호화 도구와 함께 쓰세요(관측 · 보안 · 비용 챕터).',
          '차트의 <code>crds/</code> 폴더에 든 CRD는 처음 설치할 때만 만들어지고 upgrade로는 갱신되지 않습니다. CRD는 따로 관리하는 경우가 많습니다.',
          '롤백도 DB 스키마는 되돌리지 않습니다. 지난 레슨의 undo와 같은 한계입니다.',
        ] },
      ],
    },
    // 14
    {
      key: '정리', kind: 'recap', title: '정리: 맡길 것과 남는 것',
      body: [
        '관리형 쿠버네티스는 컨트롤 플레인을 맡기고, 우리는 노드 그룹과 앱에 집중하게 해 줍니다. Service는 클라우드 LB로, PVC는 클라우드 디스크로 번역되고, Pod 권한은 워크로드 아이덴티티로, 사람의 접속은 클라우드 계정과 RBAC로 다룹니다.',
        'Pod IP 계획, 버전 업그레이드, 컨텍스트 확인, 차트와 values 관리는 여전히 우리 몫입니다. 다음 챕터에서는 이 클러스터와 그 아래 인프라를 <b>코드</b>로 만드는 법, Terraform을 배웁니다.',
      ],
      hide: ['chart', 'vals', 'hb', 'rel'],
      show: ['cpz', 'api', 'wkz', 'w1', 'w2', 'w3', 'lb', 'users', 'disk'],
      set: { vals: { state: null }, rel: { badge: null } },
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
      answer: 2, step: 2,
      why: '관리형 서비스는 etcd · API 서버 · 인증서 · 컨트롤 플레인 패치를 맡습니다. 하지만 언제 업그레이드할지, 노드 그룹을 언제 갈아 끼울지, 우리 매니페스트가 제거된 API를 쓰고 있지 않은지는 여전히 팀의 몫입니다.',
    },
    {
      q: '자체 설치 클러스터의 API 서버가 어느 날 갑자기 인증서 오류로 응답하지 않습니다. 설치한 지 정확히 1년이 됐고 그동안 업그레이드는 한 번도 안 했습니다. 가장 유력한 원인은?',
      options: [
        'kubeadm이 만든 컴포넌트 인증서가 만료됐다',
        'etcd 디스크가 가득 찼다',
        '노드의 kubelet 버전이 너무 오래됐다',
        'kubeconfig의 컨텍스트가 바뀌었다',
      ],
      answer: 0, step: 1,
      why: 'kubeadm 인증서는 기본 1년이고 업그레이드할 때 함께 갱신됩니다. 업그레이드 없이 1년이 지나면 만료되어 API 서버가 동작하지 않습니다. 관리형 서비스로 옮기면 이 일을 사업자가 맡습니다.',
    },
    {
      q: '야간 배치 Job은 중간에 끊겨도 다시 돌리면 되고, 비용을 최대한 줄이고 싶습니다. 웹 API는 끊기면 안 됩니다. 노드 구성으로 알맞은 것은?',
      options: [
        '모든 워크로드를 스팟 노드 그룹 하나에 둔다',
        '모든 워크로드를 온디맨드 노드 그룹 하나에 둔다',
        '스팟 그룹에 taint를 걸고 배치만 toleration으로 보내고, 웹 API는 온디맨드 그룹에 둔다',
        '배치를 웹 API Pod 안의 사이드카로 돌린다',
      ],
      answer: 2, step: 3,
      why: '노드 그룹을 용도별로 나누고 taint · toleration으로 배치만 스팟에 보내면 비용과 안정성을 함께 잡을 수 있습니다. 전부 스팟이면 웹 API가 회수에 노출되고, 전부 온디맨드면 절감 기회를 놓칩니다.',
    },
    {
      q: 'EKS에서 노드 CPU · 메모리는 넉넉한데 새 Pod가 ContainerCreating에서 멈추고, Events에 failed to assign an IP address to container가 보입니다. 먼저 확인할 것은?',
      options: [
        'Pod의 CPU requests',
        '노드 그룹이 쓰는 서브넷의 남은 IP 수와 노드 타입별 Pod 수 한도',
        'HPA의 maxReplicas',
        'Service의 type',
      ],
      answer: 1, step: 4,
      why: 'EKS의 VPC CNI는 Pod마다 서브넷의 실제 IP를 주므로, 서브넷 IP나 노드의 ENI · IP 한도가 바닥나면 CPU가 남아도 Pod를 만들 수 없습니다. requests나 HPA는 이 오류와 무관합니다.',
    },
    {
      q: '실습용 클러스터를 콘솔에서 삭제했는데, 다음 달에도 로드 밸런서와 디스크 요금이 나옵니다. 가장 가능성 높은 원인은?',
      options: [
        '컨트롤 플레인 요금이 한 달 뒤에 정산된다',
        '노드 그룹이 스팟이어서 반납이 늦어졌다',
        'kubeconfig에 컨텍스트가 남아 있어서 과금된다',
        'LoadBalancer Service와 PVC가 만든 클라우드 리소스가, 정리해 줄 컨트롤러 없이 남았다',
      ],
      answer: 3, step: 5,
      why: 'LB와 디스크는 클러스터 안의 컨트롤러와 CSI 드라이버가 클라우드 API로 만든 별도 리소스입니다. 클러스터를 먼저 지우면 이를 지워 줄 주체가 사라집니다. 그래서 Service와 PVC를 먼저 지우고 클러스터를 지워야 합니다. kubeconfig 컨텍스트는 로컬 설정일 뿐입니다.',
    },
    {
      q: 'EKS의 uploader Pod만 특정 S3 버킷에 쓸 수 있게 하려 합니다. 가장 알맞은 방법은?',
      options: [
        'IAM 사용자의 액세스 키를 Secret으로 만들어 환경 변수로 넣는다',
        '노드 그룹의 IAM 역할에 그 버킷 쓰기 권한을 붙인다',
        'uploader의 ServiceAccount를 IAM 역할과 연결한다(IRSA 또는 EKS Pod Identity)',
        '컨테이너 이미지에 자격 증명 파일을 넣어 빌드한다',
      ],
      answer: 2, step: 6,
      why: '워크로드 아이덴티티는 그 ServiceAccount를 쓰는 Pod에게만, 짧게 사는 자격 증명으로 권한을 줍니다. 노드 역할은 같은 노드의 모든 Pod가 권한을 나눠 갖게 되고, 액세스 키를 Secret이나 이미지에 넣으면 유출과 교체 문제가 남습니다.',
    },
    {
      q: 'ServiceAccount에 IAM 역할 주석을 추가했는데, 기존 uploader Pod에서는 여전히 AccessDenied가 납니다. 신뢰 정책은 맞게 되어 있습니다. 먼저 할 일은?',
      options: [
        'Pod를 다시 만들어(rollout restart) 자격 증명 설정이 주입되게 한다',
        '노드 IAM 역할에 S3 권한을 추가한다',
        'S3 버킷을 퍼블릭으로 바꾼다',
        'ServiceAccount를 지우고 default를 쓴다',
      ],
      answer: 0, step: 6,
      why: '자격 증명 토큰 파일과 환경 변수는 Pod가 만들어질 때 주입됩니다. 주석을 추가하기 전에 뜬 Pod에는 들어가지 않으므로 다시 띄워야 합니다. 노드 역할에 권한을 주면 동작은 하겠지만 모든 Pod가 같은 권한을 갖게 됩니다.',
    },
    {
      q: 'IRSA 역할의 신뢰 정책에 OIDC 공급자만 적고 sub(네임스페이스:SA) 조건을 빼 두었습니다. 어떤 위험이 있을까요?',
      options: [
        'uploader Pod가 역할을 맡지 못한다',
        '자격 증명의 유효 시간이 무한대가 된다',
        'S3 요청이 느려진다',
        '그 클러스터의 아무 ServiceAccount로 실행되는 Pod나 그 역할을 맡을 수 있다',
      ],
      answer: 3, step: 7,
      why: '신뢰 정책의 sub 조건이 "어느 SA만 이 역할을 맡을 수 있는가"를 정합니다. 빠지면 같은 OIDC 공급자로 서명된 모든 SA 토큰이 통과합니다. 자격 증명은 여전히 짧게 유효하고, uploader도 역할을 맡을 수는 있습니다.',
    },
    {
      q: '노드 운영 인력이 거의 없는 작은 팀이 GCP에서 웹 서비스를 돌리려 합니다. 특권 컨테이너나 노드 접속은 필요 없습니다. 가장 알맞은 선택은?',
      options: [
        'Compute Engine VM에 kubeadm으로 직접 설치',
        'GKE Autopilot',
        'GKE Standard에 노드 풀 10개',
        'GKE 대신 EKS',
      ],
      answer: 1, step: 8,
      why: 'Autopilot은 노드까지 Google이 관리하고 Pod requests 기준으로 과금해 노드 운영 부담이 가장 적습니다. 제약(노드 접속, 특권 컨테이너)이 문제되지 않는 경우라 잘 맞습니다. 직접 설치는 정반대이고, 다른 클라우드로 옮길 이유는 없습니다.',
    },
    {
      q: '퇴사한 동료가 만든 EKS 클러스터에 아무도 kubectl로 들어가지 못합니다. 다른 사람들의 IAM 권한은 충분합니다. 무엇이 빠져 있을까요?',
      options: [
        '클러스터 쪽에 팀 IAM 역할을 등록해 쿠버네티스 권한과 연결하는 설정(액세스 항목 등)',
        '노드 그룹의 스팟 설정',
        'Helm 릴리스',
        'StorageClass의 기본값',
      ],
      answer: 0, step: 9,
      why: '클라우드 IAM 권한으로 토큰을 받을 수 있어도, 클러스터가 그 주체를 어떤 쿠버네티스 권한에 연결할지 모르면 거절됩니다. EKS에서는 액세스 항목(또는 예전의 aws-auth ConfigMap)에 팀 역할을 등록해 둬야 합니다.',
    },
    {
      q: '여러 클러스터를 다루는 운영자가 dev 정리 명령으로 prod를 지우는 사고를 냈습니다. 재발을 막는 가장 근본적인 대책은?',
      options: [
        'kubectl 대신 k9s를 쓴다',
        '모든 명령에 -n 옵션을 붙인다',
        '사람에게는 prod 읽기 권한만 주고, 변경은 CI/CD나 GitOps로만 하게 한다',
        'dev 클러스터를 없앤다',
      ],
      answer: 2, step: 10,
      why: '프롬프트 표시나 --context 습관도 도움이 되지만, 사람이 prod를 지울 권한 자체가 없다면 실수가 사고로 이어지지 않습니다. -n은 네임스페이스만 정할 뿐 클러스터는 그대로입니다.',
    },
    {
      q: 'EKS를 1.25에서 1.26으로 올린 뒤, 배포 파이프라인이 no matches for kind "HorizontalPodAutoscaler" in version "autoscaling/v2beta2" 오류로 실패합니다. 옳은 조치는?',
      options: [
        '컨트롤 플레인을 1.25로 되돌린다',
        '매니페스트의 apiVersion을 autoscaling/v2로 고치고 필드 차이를 맞춘다',
        'HPA를 지우고 replicas를 고정한다',
        '노드 그룹만 1.25로 유지한다',
      ],
      answer: 1, step: 11,
      why: '1.26에서 autoscaling/v2beta2가 제거됐으므로 매니페스트를 autoscaling/v2로 옮겨야 합니다. 관리형 컨트롤 플레인은 보통 다운그레이드를 지원하지 않고, 노드 버전은 API 서버가 받아들이는 API와 무관합니다.',
    },
    {
      q: 'dev와 prod의 차이가 replicas, 이미지 태그, 도메인뿐입니다. Helm으로 관리할 때 가장 알맞은 구조는?',
      options: [
        '환경마다 차트를 복사해 따로 고친다',
        'dev 차트로 설치한 뒤 prod에서는 kubectl edit로 값을 고친다',
        '템플릿 안에 환경 이름으로 if 분기를 가득 넣는다',
        '차트 하나에 환경별 values 파일(values-dev.yaml, values-prod.yaml)을 둔다',
      ],
      answer: 3, step: 12,
      why: '차트는 공통 구조, values는 환경 차이입니다. 차트를 복사하면 고칠 곳이 환경 수만큼 늘고, kubectl edit는 Helm 릴리스 기록과 어긋나 다음 업그레이드 때 덮어써집니다. if 분기는 차이를 템플릿 깊숙이 숨겨 리뷰를 어렵게 합니다.',
    },
    {
      q: '급하게 kubectl edit로 prod Deployment의 메모리 limit을 올렸는데, 다음 날 helm upgrade 후 다시 OOMKilled가 납니다. 왜일까요?',
      options: [
        'helm upgrade가 values로 렌더링한 매니페스트를 다시 적용해, 손으로 고친 값을 덮어썼다',
        'kubectl edit는 다음 날 자동으로 원래대로 돌아간다',
        'Helm이 리비전을 9개까지만 보관한다',
        'OOMKilled는 limit과 무관하다',
      ],
      answer: 0, step: 13,
      why: 'Helm은 values와 템플릿으로 매니페스트를 만들어 적용하므로, values에 없는 손 수정은 다음 upgrade에서 사라집니다. 변경은 values 파일을 고쳐 upgrade로 반영해야 기록과 실제가 일치합니다.',
    },
  ],
};
