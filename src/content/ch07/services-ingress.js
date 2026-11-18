export default {
  id: 'services-ingress',
  learn: [
    'Pod IP를 직접 부르면 안 되는 이유',
    'Service: 셀렉터로 고른 Pod 앞의 고정 주소',
    '엔드포인트와 클러스터 DNS 이름',
    'ClusterIP · NodePort · LoadBalancer의 관계',
    'Ingress: 호스트 · 경로로 나누는 L7 규칙',
    'Ingress 컨트롤러와 클라우드 로드 밸런서',
  ],
  legend: [['req', '요청'], ['res', '응답'], ['ctrl', 'DNS · 감시'], ['bad', '실패']],
  metrics: [
    { id: 'addr', label: '호출 주소', icon: 'link' },
    { id: 'ep', label: '엔드포인트', icon: 'list' },
    { id: 'ext', label: '외부 노출', icon: 'globe' },
    { id: 'lb', label: '클라우드 LB', icon: 'coins' },
  ],
  codes: {
    svc: {
      title: 'api-service.yaml', lang: 'yaml',
      text: `apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: shop
spec:
  type: ClusterIP      # 기본값
  selector:
    app: api           # Pod의 라벨
  ports:
    - name: http
      port: 80         # 받는 포트
      targetPort: 3000 # Pod의 포트
`,
    },
    desc: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl describe svc api
Name:       api
Namespace:  shop
Selector:   app=api
Type:       ClusterIP
IP:         10.96.14.7
Port:       http  80/TCP
TargetPort: 3000/TCP
Endpoints:  10.244.1.8:3000,10.244.2.9:3000

$ kubectl get pods -l app=api -o wide
NAME                  IP
api-5f6d8c7b9-2xkqp   10.244.1.8
api-5f6d8c7b9-9mz4t   10.244.2.9`,
    },
    dns: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl exec deploy/web -- nslookup api
Server:   10.96.0.10
Name:     api.shop.svc.cluster.local
Address:  10.96.14.7

# 같은 네임스페이스에서: 이름만
$ curl http://api/health

# 다른 네임스페이스에서: 이름.네임스페이스
$ curl http://api.shop/health

# 전체 이름
$ curl http://api.shop.svc.cluster.local`,
    },
    typo: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl exec deploy/web -- curl api
curl: (7) Failed to connect to api
  port 80: Connection refused

$ kubectl describe svc api
...
Selector:   app=api-server
Endpoints:  <none>

$ kubectl get pods --show-labels
NAME                  LABELS
api-5f6d8c7b9-2xkqp   app=api,…
api-5f6d8c7b9-9mz4t   app=api,…`,
    },
    ing: {
      title: 'shop-ingress.yaml', lang: 'yaml',
      text: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
spec:
  ingressClassName: nginx
  rules:
    - host: shop.example
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port: { number: 80 }
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port: { number: 80 }
`,
    },
  },
  scene: {
    nodes: {
      web: { at: [-0.4, -0.4], size: 's', label: 'web', sub: 'Pod', icon: 'box', color: 'blue' },
      gone: { at: [1.6, 1.6], size: 's', label: 'api', sub: 'Pod', icon: 'box', color: 'green' },
      svc: { at: [1.6, 1.6], label: 'Service', sub: 'api', icon: 'split', color: 'purple' },
      a1: { at: [2.05, -0.45], size: 's', label: 'api', sub: 'Pod', icon: 'box', color: 'green' },
      a2: { at: [3.35, -0.45], size: 's', label: 'api', sub: 'Pod', icon: 'box', color: 'green' },
      dns: { kind: 'tile', at: [0.0, -3.0], label: 'CoreDNS', icon: 'signpost', color: 'yellow' },
      eps: { kind: 'tile', at: [3.7, 2.5], label: 'EndpointSlice', icon: 'list', color: 'purple' },
      users: { kind: 'users', at: [-4.1, 4.9], label: '고객' },
      clb: { at: [-2.4, 3.2], label: '클라우드 LB', sub: '자동 생성', icon: 'cloud', color: 'orange' },
      np1: { kind: 'tile', at: [-1.6, 0.8], label: '노드 1 :30080', icon: 'door', color: 'slate' },
      np2: { kind: 'tile', at: [-0.1, 3.1], label: '노드 2 :30080', icon: 'door', color: 'slate' },
      ing: { at: [-0.9, 1.7], label: 'Ingress', sub: '컨트롤러', icon: 'signpost', color: 'yellow' },
      svcW: { at: [-0.8, -0.8], label: 'Service', sub: 'web', icon: 'split', color: 'purple' },
      wp: { at: [0.4, -2.6], size: 's', label: 'web', sub: 'Pod', icon: 'box', color: 'blue' },
    },
    edges: {
      e_wg: { from: 'web', to: 'gone', style: 'dashed', tone: 'bad' },
      e_ws: { from: 'web', to: 'svc' },
      e_s1: { from: 'svc', to: 'a1' },
      e_s2: { from: 'svc', to: 'a2' },
      e_dns: { from: 'web', to: 'dns', style: 'dashed', bi: true },
      e_eps: { from: 'svc', to: 'eps', style: 'dashed' },
      e_un1: { from: 'users', to: 'np1' },
      e_un2: { from: 'users', to: 'np2' },
      e_n1: { from: 'np1', to: 'svc' },
      e_n2: { from: 'np2', to: 'svc' },
      e_uc: { from: 'users', to: 'clb' },
      e_c1: { from: 'clb', to: 'np1' },
      e_c2: { from: 'clb', to: 'np2' },
      e_ci: { from: 'clb', to: 'ing' },
      e_is: { from: 'ing', to: 'svc' },
      e_iw: { from: 'ing', to: 'svcW' },
      e_wp: { from: 'svcW', to: 'wp' },
    },
  },
  steps: [
    {
      key: 'Pod IP', kind: 'problem', title: 'web이 적어 둔 api 주소가 사라졌습니다',
      body: [
        'shop.example의 <code>web</code>은 주문을 넣을 때 <code>api</code>를 호출합니다. 처음에는 api Pod의 IP를 설정에 적어 두었어요. 잘 되다가 api를 새 버전으로 배포한 순간 호출이 전부 실패합니다.',
        '지난 레슨에서 봤듯 Pod는 교체될 때마다 <b>새 IP</b>를 받습니다. 배포, 노드 장애, 스케일 인 때마다 주소가 바뀌고, Pod가 여러 개면 그중 누구를 불러야 할지도 문제예요.',
      ],
      callout: { type: 'key', text: '필요한 것은 Pod가 아무리 바뀌어도 <b>변하지 않는 주소 하나</b>와, 그 뒤에서 살아 있는 Pod를 골라 주는 장치입니다.' },
      show: ['web', 'gone', 'a1', 'a2'],
      set: { gone: { state: 'down' } },
      tags: [
        { on: 'web', text: '설정: 10.244.1.7', tone: 'warn' },
        { on: 'gone', text: '10.244.1.7 삭제됨', tone: 'bad', pos: 'bottom' },
        { on: 'a2', text: '새 Pod 10.244.2.9', tone: 'ok', pos: 'bottom' },
      ],
      flows: [{ path: ['web', 'gone'], kind: 'bad', n: 3 }],
      metrics: { addr: ['Pod IP 직접', 'bad'], ep: '없음', ext: '없음', lb: '0대' },
    },
    {
      key: 'Service', kind: 'solution', title: 'Service: Pod들 앞의 고정 주소',
      body: [
        '<b>Service</b>는 Pod 묶음 앞에 세우는 <b>고정 주소</b>입니다. 만들면 클러스터 안에서 통하는 가상 IP(<b>ClusterIP</b>)를 하나 받고, 이 IP는 Service를 지우기 전까지 바뀌지 않아요. 타입을 적지 않으면 ClusterIP입니다.',
        '어느 Pod로 보낼지는 <code>selector</code>가 정합니다. Deployment가 Pod에 붙인 <code>app: api</code> 라벨을 그대로 씁니다. <code>port</code>는 Service가 받는 포트, <code>targetPort</code>는 Pod의 컨테이너가 듣는 포트예요.',
      ],
      callout: { type: 'tip', text: 'Service는 Deployment와 따로 만드는 별개의 오브젝트입니다. 둘을 잇는 것은 이름이 아니라 <b>라벨</b>뿐이라, Pod가 몇 번을 교체돼도 Service는 그대로입니다.' },
      code: { ref: 'svc', hl: [2, 7, 8, 9, 12, 13] },
      hide: ['gone'],
      show: ['svc'],
      focus: ['svc'],
      tags: [{ on: 'svc', text: '10.96.14.7 고정', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['web', 'svc', 'a1'], kind: 'req', n: 2 },
        { path: ['web', 'svc', 'a2'], kind: 'req', n: 2, delay: 0.5 },
      ],
      metrics: { addr: ['ClusterIP 고정', 'ok'], ep: ['2개', 'ok'] },
      changes: [['+', 'Service api (ClusterIP)'], ['~', '호출 주소: Pod IP → Service']],
    },
    {
      key: '엔드포인트', kind: 'concept', title: '셀렉터가 고른 Pod 목록, 엔드포인트',
      body: [
        'Service 뒤에는 <b>엔드포인트</b> 목록이 있습니다. 컨트롤러가 셀렉터에 맞는 Pod의 IP를 모아 <b>EndpointSlice</b> 오브젝트에 적고, Pod가 생기고 사라질 때마다 고칩니다. 트래픽은 그중 <b>Ready</b>인 Pod로만 갑니다.',
        '각 노드의 <b>kube-proxy</b>는 이 목록을 보고 노드에 규칙(iptables 등)을 깔아 둡니다. ClusterIP로 나가는 연결은 그 규칙에 걸려 엔드포인트 중 하나로 목적지가 바뀌어요. ClusterIP는 어느 장치에도 붙어 있지 않은 <b>가상 IP</b>라서 ping이 안 되어도 정상입니다.',
      ],
      callout: { type: 'tip', text: 'Service가 이상할 때 가장 먼저 볼 곳이 이 목록입니다. <code>kubectl describe svc api</code>의 <code>Endpoints</code> 줄에 Pod IP가 보여야 합니다.' },
      code: { ref: 'desc', hl: [4, 9, 13, 14] },
      show: ['eps'],
      tags: [{ on: 'eps', text: '셀렉터에 맞는 Pod IP', tone: 'info', pos: 'bottom' }],
      flows: [
        { path: ['svc', 'eps'], kind: 'ctrl', n: 2 },
        { path: ['web', 'svc', 'a1'], kind: 'req', delay: 1.0 },
        { path: ['web', 'svc', 'a2'], kind: 'req', delay: 1.6 },
      ],
    },
    {
      key: 'DNS 이름', kind: 'concept', title: 'IP 대신 이름으로: 클러스터 DNS',
      body: [
        'ClusterIP도 숫자라 설정에 적기는 불편합니다. 클러스터에는 <b>CoreDNS</b>가 돌고 있어서, Service를 만들면 <code>서비스.네임스페이스.svc.cluster.local</code>이라는 이름이 자동으로 생깁니다. 우리 앱은 <code>shop</code> 네임스페이스에 있으니 <code>api.shop.svc.cluster.local</code>이에요.',
        'Pod의 DNS 설정에는 자기 네임스페이스가 검색 경로로 들어 있어, 같은 네임스페이스에서는 <code>api</code>만 써도 됩니다. 다른 네임스페이스의 Service는 <code>api.shop</code>처럼 네임스페이스까지 붙여 부릅니다.',
      ],
      callout: { type: 'key', text: '앱 설정에는 IP가 아니라 <b>Service 이름</b>을 적습니다. <code>API_URL=http://api</code>는 dev에서도 prod에서도 같은 값이라, 환경마다 바꿀 것이 줄어듭니다.' },
      code: { ref: 'dns', hl: [1, 3, 4, 7, 10] },
      hide: ['eps'],
      show: ['dns'],
      tags: [{ on: 'dns', text: 'api → 10.96.14.7', tone: 'ok' }],
      flows: [
        { path: ['web', 'dns'], kind: 'ctrl' },
        { path: ['dns', 'web'], kind: 'res', delay: 0.8 },
        { path: ['web', 'svc', 'a1'], kind: 'req', n: 2, delay: 1.7 },
      ],
      metrics: { addr: ['이름: api', 'ok'] },
      changes: [['~', '호출 주소: 10.96.14.7 → http://api']],
    },
    {
      key: '빈 엔드포인트', kind: 'case', title: '사례: 셀렉터 오타로 빈 엔드포인트',
      body: [
        '새로 만든 Service를 호출하면 <code>Connection refused</code>만 돌아옵니다. Pod는 전부 Running이고 Service도 <code>apply</code>에 성공했는데요. 원인은 Service의 셀렉터 <code>app: api-server</code>였습니다. Pod의 라벨은 <code>app: api</code>입니다.',
        '셀렉터에 맞는 Pod가 하나도 없어도 Service는 <b>오류 없이</b> 만들어집니다. 엔드포인트가 비어 있을 뿐이에요. 쿠버네티스는 이것이 오타인지, 아직 Pod를 띄우기 전인지 구별할 수 없습니다.',
      ],
      callout: { type: 'tip', text: '확인 순서: ① Endpoints가 비었는가 ② 셀렉터와 <code>get pods --show-labels</code>의 라벨이 같은가 ③ Pod가 Ready인가 ④ <code>targetPort</code>가 컨테이너가 듣는 포트인가.' },
      code: { ref: 'typo', hl: [3, 7, 8, 12, 13] },
      hide: ['dns', 'e_s1', 'e_s2'],
      show: ['eps'],
      set: { svc: { state: 'hot' }, eps: { state: 'down' } },
      tags: [
        { on: 'svc', text: '셀렉터 app=api-server', tone: 'bad', pos: 'left' },
        { on: 'a2', text: '라벨 app=api', tone: 'ok', pos: 'bottom' },
      ],
      flows: [{ path: ['web', 'svc'], kind: 'bad', n: 3 }],
      metrics: { ep: ['0개', 'bad'] },
      changes: [['-', '엔드포인트 2개 → 0개'], ['~', '원인: 셀렉터 ≠ Pod 라벨']],
    },
    {
      key: 'NodePort', kind: 'problem', title: '클러스터 밖에서는 ClusterIP에 못 옵니다',
      body: [
        'ClusterIP와 DNS 이름은 <b>클러스터 안에서만</b> 통합니다. 고객의 브라우저는 닿을 수 없어요. 바깥으로 여는 첫 방법은 <code>type: NodePort</code>입니다. <b>모든 노드</b>가 같은 포트(기본 범위 30000–32767) 하나를 열고, 어느 노드로 들어오든 Service의 Pod로 넘겨 줍니다.',
        '동작은 하지만 고객에게 내놓기는 어렵습니다. 주소가 <code>노드IP:30080</code> 꼴이고, 노드는 교체될 때마다 IP가 바뀌며, 노드를 인터넷에 직접 드러내야 합니다.',
      ],
      callout: { type: 'key', text: 'NodePort는 그대로 쓰기보다 <b>앞에 로드 밸런서를 세우기 위한 발판</b>입니다. 노드들의 그 포트를 로드 밸런서의 대상으로 등록하면 되니까요.' },
      hide: ['web', 'eps'],
      show: ['users', 'np1', 'np2', 'e_s1', 'e_s2'],
      set: { svc: { state: null, sub: 'NodePort' }, eps: { state: null } },
      tags: [
        { on: 'np1', text: '모든 노드에 같은 포트', tone: 'info' },
        { on: 'users', text: '노드IP:30080 ?', tone: 'warn', pos: 'bottom' },
      ],
      flows: [
        { path: ['users', 'np1', 'svc', 'a1'], kind: 'req', n: 2 },
        { path: ['users', 'np2', 'svc', 'a2'], kind: 'req', n: 2, delay: 0.6 },
      ],
      metrics: { ep: ['2개', 'ok'], ext: ['NodePort', 'warn'] },
      changes: [['+', 'type: NodePort (30080)'], ['~', '외부 접속: 불가 → 노드IP:포트']],
    },
    {
      key: 'LoadBalancer', kind: 'solution', title: 'LoadBalancer: 클라우드 LB를 앞에',
      body: [
        '<code>type: LoadBalancer</code>로 바꾸면 클러스터의 컨트롤러가 클라우드 API를 불러 <b>로드 밸런서를 만들고</b> 노드들을 대상으로 등록합니다. <code>kubectl get svc</code>의 <code>EXTERNAL-IP</code> 칸에 LB 주소가 채워지면 고객은 그 주소 하나만 알면 됩니다.',
        '세 타입은 포개져 있습니다. LoadBalancer는 NodePort를, NodePort는 ClusterIP를 포함해요. 그래서 클러스터 안에서는 여전히 <code>api</code>라는 이름으로 부를 수 있습니다.',
      ],
      callout: { type: 'cloud', text: 'AWS는 NLB, Azure는 Azure Load Balancer, GCP는 패스스루 Network LB, NCP는 Load Balancer가 생기며 대개 <b>L4</b>입니다. 그리고 Service 하나에 LB가 <b>한 대씩</b> 생겨 요금도 그만큼 붙습니다.' },
      show: ['clb'],
      hide: ['e_un1', 'e_un2'],
      set: { svc: { sub: 'LoadBalancer' } },
      focus: ['clb'],
      panel: {
        title: '세 타입은 포개져 있습니다', icon: 'layers',
        rows: [['ClusterIP', '클러스터 안 고정 IP', 'info'], ['NodePort', '+ 모든 노드의 포트', 'warn'], ['LoadBalancer', '+ 클라우드 LB', 'ok']],
      },
      tags: [{ on: 'clb', text: 'EXTERNAL-IP', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['users', 'clb', 'np1', 'svc', 'a1'], kind: 'req', n: 2 },
        { path: ['users', 'clb', 'np2', 'svc', 'a2'], kind: 'req', n: 2, delay: 0.6 },
      ],
      metrics: { ext: ['LB (L4)', 'ok'], lb: ['Service당 1대', 'warn'] },
      changes: [['+', '클라우드 LB (자동 생성)'], ['~', '고객이 아는 주소: LB 하나']],
    },
    {
      key: 'Ingress', kind: 'solution', title: 'Ingress: LB 하나로 호스트·경로 나누기',
      body: [
        '밖에 열 서비스가 web, api, admin…으로 늘면 LB도 그만큼 늘어납니다. 게다가 L4 LB는 URL을 보지 못해, <code>shop.example/api</code>는 api로 나머지는 web으로 보내는 일을 할 수 없어요.',
        '<b>Ingress</b>는 HTTP 요청의 <b>호스트와 경로</b>로 Service를 고르는 L7 규칙입니다. 입구 하나에서 여러 Service로 갈라 보내고, TLS 인증서도 여기서 한 번에 처리해요. 뒤의 Service들은 ClusterIP면 충분합니다.',
      ],
      callout: { type: 'warn', text: '경로는 그대로 전달됩니다. <code>/api/orders</code>로 온 요청은 api에도 <code>/api/orders</code>로 가요. 앱이 <code>/orders</code>만 안다면 404입니다. 앱의 경로를 맞추거나 컨트롤러의 경로 재작성 기능을 씁니다.' },
      code: { ref: 'ing', hl: [8, 11, 15, 17, 21] },
      hide: ['users', 'clb', 'np1', 'np2'],
      show: ['ing', 'svcW', 'wp'],
      set: { svc: { sub: 'api' } },
      tags: [
        { on: 'ing', text: 'shop.example', tone: 'accent', icon: 'globe', pos: 'bottom' },
        { on: 'svcW', text: '/ → web', tone: 'info' },
        { on: 'svc', text: '/api → api', tone: 'info', pos: 'bottom' },
      ],
      flows: [
        { path: ['ing', 'svc', 'a1'], kind: 'req', n: 2 },
        { path: ['ing', 'svcW', 'wp'], kind: 'req', n: 2, delay: 0.6 },
      ],
      metrics: { ext: ['Ingress (L7)', 'ok'], lb: ['1대를 함께', 'ok'] },
      changes: [['+', 'Ingress shop (경로 규칙 2개)'], ['~', 'api · web Service는 ClusterIP'], ['~', 'LB: Service당 1대 → 전체 1대']],
    },
    {
      key: '컨트롤러', kind: 'compare', title: 'Ingress는 컨트롤러가 있어야 움직입니다',
      body: [
        'Ingress 오브젝트는 규칙을 적은 문서일 뿐입니다. 실제로 트래픽을 받는 것은 <b>Ingress 컨트롤러</b>이고, 클러스터에 따로 설치해야 해요. 컨트롤러는 Ingress와 엔드포인트를 지켜보며 규칙을 실제 프록시 설정으로 옮깁니다.',
        '방식은 둘입니다. 클러스터 안에 프록시 Pod(NGINX · Traefik · Envoy 계열)를 띄우고 그 앞에 LoadBalancer Service로 클라우드 LB 한 대를 두는 방식, 그리고 컨트롤러가 클라우드의 <b>L7 로드 밸런서</b>를 직접 만들어 설정하는 방식입니다.',
      ],
      callout: { type: 'warn', text: '오래 널리 쓰인 커뮤니티 ingress-nginx는 유지보수 종료가 공지된 프로젝트입니다. 새로 고른다면 Ingress의 후속 표준인 <b>Gateway API</b>를 지원하는 구현인지 함께 보세요.' },
      show: ['users', 'clb'],
      set: { clb: { sub: '1대' } },
      focus: ['ing'],
      panel: {
        title: '클라우드의 L7 LB를 만드는 컨트롤러', icon: 'cloud',
        rows: [
          ['AWS EKS', 'LB Controller → ALB', 'aws'],
          ['Azure AKS', 'Application Gateway', 'azure'],
          ['GCP GKE', 'Application LB', 'gcp'],
          ['NCP NKS', 'ALB Ingress Controller', 'ncp'],
        ],
      },
      tags: [
        { on: 'ing', text: '규칙을 읽어 실행', tone: 'accent', pos: 'bottom' },
        { on: 'svcW', text: '/ → web', tone: 'info' },
        { on: 'svc', text: '/api → api', tone: 'info', pos: 'bottom' },
      ],
      flows: [
        { path: ['users', 'clb', 'ing', 'svc', 'a1'], kind: 'req', n: 2 },
        { path: ['users', 'clb', 'ing', 'svcW', 'wp'], kind: 'req', n: 2, delay: 0.7 },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 바깥에서 Pod까지 이어지는 길',
      body: [
        '고객의 요청은 DNS → 클라우드 LB → Ingress 컨트롤러 → <b>Service</b> → Pod 순서로 들어옵니다. Service는 라벨로 고른 Pod들 앞의 고정 주소이자 DNS 이름이고, <b>Ingress</b>는 호스트와 경로로 Service를 고르는 L7 규칙입니다.',
        '연결이 안 되면 뒤에서부터 봅니다. Pod가 Ready인가, 엔드포인트가 차 있는가, 셀렉터와 포트가 맞는가. 다음 레슨에서는 이 Pod들에 환경마다 다른 설정과 비밀값을 넣는 <b>ConfigMap과 Secret</b>을 다룹니다.',
      ],
      tags: [
        { on: 'clb', text: '① 입구 하나', pos: 'bottom' },
        { on: 'ing', text: '② 경로 규칙', pos: 'bottom' },
        { on: 'svc', text: '③ 고정 주소', pos: 'bottom' },
        { on: 'a2', text: '④ Ready인 Pod', pos: 'bottom' },
      ],
      flows: [
        { path: ['users', 'clb', 'ing', 'svc', 'a1'], kind: 'req', n: 2 },
        { path: ['users', 'clb', 'ing', 'svc', 'a2'], kind: 'req', n: 2, delay: 0.5 },
        { path: ['users', 'clb', 'ing', 'svcW', 'wp'], kind: 'req', delay: 1.0 },
      ],
    },
  ],
  quiz: [
    {
      q: 'api Service를 만들었는데 web에서 호출하면 Connection refused가 납니다. api Pod는 모두 Running · Ready입니다. 가장 먼저 확인할 것은?',
      options: [
        'kubectl describe svc api의 Endpoints가 비어 있는지, 셀렉터가 Pod 라벨과 같은지',
        'api Pod가 떠 있는 노드의 CPU 사용률',
        'CoreDNS Pod를 재시작하면 해결되는지',
        'Service를 LoadBalancer 타입으로 바꾸면 해결되는지',
      ],
      answer: 0,
      why: 'Service는 셀렉터에 맞는 Pod가 없어도 오류 없이 만들어지고, 엔드포인트만 비어 있게 됩니다. 이름이 풀려 연결을 시도했으니 DNS 문제는 아니고, 타입을 바꿔도 뒤에 Pod가 없기는 마찬가지입니다. Endpoints → 셀렉터와 라벨 → Ready → targetPort 순서로 좁혀 갑니다.',
    },
    {
      q: 'payments 네임스페이스의 Pod가 shop 네임스페이스의 api Service를 호출해야 합니다. 설정에 적을 주소로 알맞은 것은?',
      options: [
        'http://api',
        'http://api.shop',
        'api Pod 중 하나의 IP',
        'api Service의 NodePort와 노드 IP',
      ],
      answer: 1,
      why: '짧은 이름 api는 자기 네임스페이스(payments)에서 먼저 찾으므로 엉뚱한 Service이거나 없는 이름이 됩니다. 다른 네임스페이스의 Service는 api.shop(전체 이름은 api.shop.svc.cluster.local)으로 부릅니다. Pod IP는 교체될 때마다 바뀌고, 클러스터 안에서 굳이 노드 포트로 돌아갈 이유가 없습니다.',
    },
    {
      q: 'HTTP 서비스 8개를 외부에 열어야 합니다. 모두 shop.example 아래의 서로 다른 경로입니다. 가장 알맞은 구성은?',
      options: [
        '8개 모두 type: LoadBalancer로 만든다',
        '8개 모두 NodePort로 열고 노드 IP를 DNS에 등록한다',
        'Service는 ClusterIP로 두고, Ingress 하나에 경로 규칙을 적어 LB 한 대를 함께 쓴다',
        'Pod마다 공인 IP를 붙인다',
      ],
      answer: 2,
      why: 'LoadBalancer 타입은 Service마다 LB가 한 대씩 생겨 비용이 늘고, L4라서 경로로 나누지도 못합니다. Ingress는 L7에서 호스트와 경로로 갈라 주므로 입구 하나와 인증서 한 벌로 충분합니다. NodePort는 노드 IP가 바뀌고 노드를 직접 드러내야 해서 고객용 입구로는 맞지 않습니다.',
    },
    {
      q: 'Ingress YAML을 apply했고 오류도 없었는데, kubectl get ingress의 ADDRESS가 계속 비어 있고 접속도 안 됩니다. 가장 가능성 높은 원인은?',
      options: [
        'Ingress는 만들어진 뒤 24시간이 지나야 동작한다',
        '클러스터에 Ingress 컨트롤러가 없거나, ingressClassName이 설치된 컨트롤러와 맞지 않는다',
        'Service가 ClusterIP 타입이라 Ingress가 붙지 못한다',
        'Pod에 공인 IP가 없다',
      ],
      answer: 1,
      why: 'Ingress 오브젝트는 규칙일 뿐이고, 그 규칙을 읽어 프록시나 클라우드 LB를 설정하는 것은 컨트롤러입니다. 맡을 컨트롤러가 없으면 오브젝트는 저장만 되고 아무 일도 일어나지 않습니다. Ingress 뒤의 Service는 ClusterIP여도 되고, Pod에 공인 IP는 필요 없습니다.',
    },
  ],
};
