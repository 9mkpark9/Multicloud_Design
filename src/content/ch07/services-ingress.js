export default {
  id: 'services-ingress',
  learn: [
    'Pod IP를 직접 부르면 안 되는 이유와 Service',
    'EndpointSlice · kube-proxy: 가상 IP가 Pod로 바뀌는 곳',
    '클러스터 DNS 이름과 흔한 연결 장애',
    'ClusterIP · NodePort · LoadBalancer의 관계',
    'Ingress · 컨트롤러 · TLS: 호스트와 경로로 나누기',
    'Gateway API: Ingress의 다음 표준',
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
Name:        api
Namespace:   shop
Selector:    app=api
Type:        ClusterIP
IP:          10.96.14.7
Port:        http  80/TCP
TargetPort:  3000/TCP
Endpoints:   10.244.1.8:3000,
             10.244.2.9:3000

$ kubectl get pods -l app=api -o wide
NAME                  IP
api-5f6d8c7b9-2xkqp   10.244.1.8
api-5f6d8c7b9-9mz4t   10.244.2.9`,
    },
    dns: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl exec deploy/web -- \\
    nslookup api
Server:   10.96.0.10
Name:     api.shop.svc.cluster.local
Address:  10.96.14.7

# 같은 네임스페이스에서: 이름만
$ curl http://api/health

# 다른 네임스페이스에서: 이름.네임스페이스
$ curl http://api.shop/health

# 전체 이름
$ curl api.shop.svc.cluster.local`,
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
    ns503: {
      title: '터미널', lang: 'sh',
      text: `$ curl -s -o /dev/null \\
    -w '%{http_code}' \\
    https://shop.example/api/health
503

$ kubectl describe ingress shop -n web
Rules:
  Host          Path  Backends
  shop.example
    /api  api:80 (<error: endpoints
          "api" not found>)

$ kubectl get svc -A | grep ' api '
shop   api   ClusterIP   10.96.14.7`,
    },
  },
  scene: {
    nodes: {
      web: { at: [-0.4, -0.4], size: 's', label: 'web', sub: 'Pod', icon: 'box', color: 'blue' },
      gone: { at: [1.6, 1.6], size: 's', label: 'api', sub: 'Pod', icon: 'box', color: 'green' },
      svc: { at: [1.6, 1.6], label: 'Service', sub: 'api', icon: 'split', color: 'purple' },
      a1: { at: [2.05, -0.45], size: 's', label: 'api', sub: 'Pod', icon: 'box', color: 'green' },
      a2: { at: [3.35, -0.45], size: 's', label: 'api', sub: 'Pod', icon: 'box', color: 'green' },
      a3: { at: [4.65, -0.45], size: 's', label: 'api', sub: 'Pod', icon: 'box', color: 'green' },
      dns: { kind: 'tile', at: [0.0, -3.0], label: 'CoreDNS', icon: 'signpost', color: 'yellow' },
      eps: { kind: 'tile', at: [3.7, 2.5], label: 'EndpointSlice', icon: 'list', color: 'purple' },
      kp: { kind: 'tile', at: [1.4, 4.4], label: 'kube-proxy', icon: 'shuffle', color: 'slate' },
      users: { kind: 'users', at: [-4.1, 4.9], label: '고객' },
      clb: { at: [-2.4, 3.2], label: '클라우드 LB', sub: '자동 생성', icon: 'cloud', color: 'orange' },
      np1: { kind: 'tile', at: [-1.6, 0.8], label: '노드 1 :30080', icon: 'door', color: 'slate' },
      np2: { kind: 'tile', at: [-0.1, 3.1], label: '노드 2 :30080', icon: 'door', color: 'slate' },
      ing: { at: [-0.9, 1.7], label: 'Ingress', sub: '컨트롤러', icon: 'signpost', color: 'yellow' },
      cert: { kind: 'tile', at: [-4.6, -0.4], label: 'TLS Secret', icon: 'lock', color: 'orange' },
      rt: { kind: 'tile', at: [1.2, 3.9], label: 'HTTPRoute', icon: 'route', color: 'teal' },
      svcW: { at: [-0.8, -0.8], label: 'Service', sub: 'web', icon: 'split', color: 'purple' },
      wp: { at: [0.4, -2.6], size: 's', label: 'web', sub: 'Pod', icon: 'box', color: 'blue' },
    },
    edges: {
      e_wg: { from: 'web', to: 'gone', style: 'dashed', tone: 'bad' },
      e_ws: { from: 'web', to: 'svc' },
      e_s1: { from: 'svc', to: 'a1' },
      e_s2: { from: 'svc', to: 'a2' },
      e_s3: { from: 'svc', to: 'a3' },
      e_dns: { from: 'web', to: 'dns', style: 'dashed', bi: true },
      e_eps: { from: 'svc', to: 'eps', style: 'dashed' },
      e_kp: { from: 'eps', to: 'kp', style: 'dashed' },
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
      e_cert: { from: 'cert', to: 'ing', style: 'dashed' },
      e_rt: { from: 'rt', to: 'ing', style: 'dashed' },
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
      more: [
        {
          title: '왜 IP가 바뀌나',
          body: [
            'Pod IP는 노드마다 나눠 준 Pod 대역(예: 노드 1은 <code>10.244.1.0/24</code>)에서 CNI 플러그인이 그때그때 꺼내 줍니다. Pod가 지워지면 IP는 반납되고, 새 Pod는 어느 노드에 놓이느냐에 따라 전혀 다른 대역의 IP를 받아요. 반납된 IP가 다른 앱의 Pod에 다시 쓰일 수도 있어서, 옛 IP로 보낸 요청이 엉뚱한 앱에 닿는 일도 생깁니다.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pods -l app=api -o wide
NAME                  IP          NODE
api-5f6d8c7b9-2xkqp   10.244.1.7  worker-1

$ kubectl rollout restart deploy/api
$ kubectl get pods -l app=api -o wide
NAME                  IP          NODE
api-6b8f9d7c4-k8w2z   10.244.2.9  worker-2`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            'Pod IP를 ConfigMap이나 환경 변수에 적어 둡니다. 다음 배포 때 조용히 깨집니다.',
            'Pod 하나를 고정하려고 replicas를 1로 둡니다. 그래도 교체되면 IP는 바뀌고, 장애 대비도 사라집니다.',
            '여러 Pod 중 하나를 골라 부르는 로직을 앱이 직접 짭니다. 살아 있는 Pod 목록을 따라가는 일은 클러스터가 대신해 줍니다.',
          ],
        },
      ],
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
      more: [
        {
          title: '설정 예시',
          body: ['<code>targetPort</code>에는 숫자 대신 컨테이너 포트의 <b>이름</b>을 쓸 수 있습니다. 그러면 새 버전에서 앱 포트가 바뀌어도 Service는 고칠 필요가 없어요.'],
          code: {
            title: 'Deployment와 Service (일부)', lang: 'yaml',
            text: `# Deployment의 컨테이너
ports:
  - name: http
    containerPort: 3000
---
# Service
spec:
  selector:
    app: api
  ports:
    - name: http
      port: 80
      targetPort: http     # 포트 이름으로`,
          },
        },
        {
          title: '기본값과 한도',
          list: [
            'ClusterIP는 클러스터를 만들 때 정한 Service 대역(kubeadm 기본 <code>10.96.0.0/16</code>대)에서 나옵니다. Pod 대역, VPC 대역과 겹치면 안 돼요.',
            '포트를 여러 개 열 수 있고, 둘 이상이면 각각 <code>name</code>이 필요합니다.',
            '기본 프로토콜은 TCP입니다. UDP · SCTP는 <code>protocol</code>로 지정합니다.',
            '<code>sessionAffinity: ClientIP</code>를 주면 같은 클라이언트 IP를 같은 Pod로 보냅니다. 기본값은 None이에요.',
          ],
        },
        {
          title: '빠르게 만들기',
          body: ['시험 삼아 만들 때는 <code>kubectl expose deploy api --port=80 --target-port=3000</code>이 Deployment의 라벨을 셀렉터로 가져와 Service를 만들어 줍니다. 운영용은 YAML로 남겨 두세요.'],
        },
      ],
    },
    {
      key: '엔드포인트', kind: 'concept', title: '셀렉터가 고른 Pod 목록, 엔드포인트',
      body: [
        'Service 뒤에는 <b>엔드포인트</b> 목록이 있습니다. 컨트롤러가 셀렉터에 맞는 Pod의 IP를 모아 <b>EndpointSlice</b> 오브젝트에 적고, Pod가 생기고 사라질 때마다 고칩니다. 트래픽은 그중 <b>Ready</b>인 Pod로만 갑니다.',
        'Pod가 Running이어도 준비가 안 됐으면(readiness 실패) 목록에서 "준비 안 됨"으로 표시되어 트래픽을 받지 않아요.',
      ],
      callout: { type: 'tip', text: 'Service가 이상할 때 가장 먼저 볼 곳이 이 목록입니다. <code>kubectl describe svc api</code>의 <code>Endpoints</code> 줄에 Pod IP가 보여야 합니다.' },
      code: { ref: 'desc', hl: [4, 6, 9, 10] },
      show: ['eps'],
      tags: [{ on: 'eps', text: '셀렉터에 맞는 Pod IP', tone: 'info', pos: 'bottom' }],
      flows: [
        { path: ['svc', 'eps'], kind: 'ctrl', n: 2 },
        { path: ['web', 'svc', 'a1'], kind: 'req', delay: 1.0 },
        { path: ['web', 'svc', 'a2'], kind: 'req', delay: 1.6 },
      ],
      more: [
        {
          title: '동작 원리',
          body: [
            'EndpointSlice 컨트롤러가 Service와 Pod를 지켜보다가, 셀렉터에 맞는 Pod마다 IP · 포트 · 노드 이름과 <b>상태</b>(ready, serving, terminating)를 적습니다. Slice 하나에는 기본 100개까지 들어가고, 넘으면 Slice를 나눠요. 큰 Service에서 Pod 하나가 바뀔 때 목록 전체를 다시 보내지 않으려는 설계입니다.',
            '예전의 <code>Endpoints</code> 오브젝트는 하나에 모든 주소를 담았고, 최근 버전에서 사용 중단(deprecated)이 예고됐습니다. 새로 만드는 도구와 스크립트는 EndpointSlice를 보세요.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get endpointslice -n shop \\
    -l kubernetes.io/service-name=api
NAME       ADDRESSTYPE  PORTS  ENDPOINTS
api-7xq2c  IPv4         3000   10.244.1.8,10.244.2.9

$ kubectl get endpointslice api-7xq2c -o yaml
endpoints:
  - addresses: ["10.244.1.8"]
    conditions: { ready: true }
    nodeName: worker-1
  - addresses: ["10.244.3.4"]
    conditions: { ready: false }   # 준비 중`,
          },
        },
        {
          title: '셀렉터 없는 Service',
          body: ['셀렉터를 비워 두면 컨트롤러가 목록을 만들지 않으므로, EndpointSlice를 직접 만들어 클러스터 밖의 DB 주소 같은 것을 넣을 수 있습니다. 클러스터 안의 앱은 여전히 Service 이름으로 부르면 돼요. 외부 이름을 그대로 가리키려면 <code>type: ExternalName</code>도 있습니다.'],
        },
      ],
    },
    {
      key: 'kube-proxy', kind: 'concept', title: 'kube-proxy: 가상 IP가 Pod로 바뀌는 곳',
      body: [
        'ClusterIP는 어느 장치에도 붙어 있지 않은 <b>가상 IP</b>입니다. 실제로 길을 바꾸는 것은 노드마다 도는 <b>kube-proxy</b>예요. EndpointSlice를 지켜보다가 노드의 커널에 "10.96.14.7:80으로 가는 패킷은 이 Pod들 중 하나로" 라는 규칙(iptables 등)을 깔아 둡니다.',
        'web이 보낸 패킷은 web의 노드를 떠나기 전에 이 규칙에 걸려 목적지가 Pod IP로 바뀝니다. 중간에 프록시 서버를 거치지 않아요.',
      ],
      callout: { type: 'warn', text: '규칙은 포트까지 정해 둔 것이라 ClusterIP에 <code>ping</code>은 응답하지 않는 것이 정상입니다. 시험은 <code>curl</code>처럼 실제 포트로 하세요.' },
      show: ['kp'],
      focus: ['kp'],
      tags: [
        { on: 'kp', text: '노드에 규칙 설치', tone: 'info', pos: 'left' },
        { on: 'svc', text: '가상 IP', tone: 'mute', pos: 'left' },
      ],
      flows: [
        { path: ['eps', 'kp'], kind: 'ctrl', n: 2 },
        { path: ['web', 'svc', 'a1'], kind: 'req', delay: 1.0 },
        { path: ['web', 'svc', 'a2'], kind: 'req', delay: 1.6 },
      ],
      metrics: { ep: ['2개 · 규칙 반영', 'ok'] },
      more: [
        {
          title: '동작 원리',
          body: [
            '기본 모드인 <b>iptables</b>에서는 Service마다 규칙 묶음이 생기고, 엔드포인트마다 확률을 나눠 <b>무작위로</b> 하나를 고릅니다. 고른 뒤에는 커널의 연결 추적(conntrack)이 기억해서, 같은 연결의 패킷은 계속 같은 Pod로 가요. 즉 <b>요청 단위가 아니라 연결 단위</b>로 나눕니다.',
            '다른 모드로 IPVS(라운드 로빈 등 알고리즘 선택), 최근 버전의 nftables가 있고, Cilium 같은 CNI는 eBPF로 kube-proxy 없이 같은 일을 합니다. 어느 쪽이든 Service의 동작은 같아요.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['노드에서 iptables 모드의 규칙을 엿볼 수 있습니다(출력 일부).'],
          code: {
            title: 'worker-1 노드', lang: 'sh',
            text: `$ sudo iptables -t nat -L KUBE-SERVICES -n | grep 10.96.14.7
KUBE-SVC-XQ2…  tcp  0.0.0.0/0  10.96.14.7  tcp dpt:80

$ sudo iptables -t nat -L KUBE-SVC-XQ2… -n
KUBE-SEP-A1…  statistic mode random probability 0.5
KUBE-SEP-B2…  /* 나머지 */`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '"ping이 안 되니 Service가 고장"이라고 판단합니다. 가상 IP라 ICMP는 처리하지 않습니다.',
            '엔드포인트가 0개인 Service로 연결하면 kube-proxy가 거절 규칙을 깔아 둬서 바로 <code>Connection refused</code>가 납니다. 시간 초과가 아니라 즉시 거절이라면 엔드포인트부터 보세요.',
            'kube-proxy Pod가 죽은 노드에서는 새 Service나 바뀐 엔드포인트가 반영되지 않습니다. 특정 노드의 Pod만 Service 호출이 실패하면 그 노드의 kube-proxy를 확인합니다.',
          ],
        },
      ],
    },
    {
      key: 'DNS 이름', kind: 'concept', title: 'IP 대신 이름으로: 클러스터 DNS',
      body: [
        'ClusterIP도 숫자라 설정에 적기는 불편합니다. 클러스터에는 <b>CoreDNS</b>가 돌고 있어서, Service를 만들면 <code>서비스.네임스페이스.svc.cluster.local</code>이라는 이름이 자동으로 생깁니다. 우리 앱은 <code>shop</code> 네임스페이스에 있으니 <code>api.shop.svc.cluster.local</code>이에요.',
        '같은 네임스페이스에서는 <code>api</code>만 써도 되고, 다른 네임스페이스의 Service는 <code>api.shop</code>처럼 네임스페이스까지 붙여 부릅니다.',
      ],
      callout: { type: 'key', text: '앱 설정에는 IP가 아니라 <b>Service 이름</b>을 적습니다. <code>API_URL=http://api</code>는 dev에서도 prod에서도 같은 값이라, 환경마다 바꿀 것이 줄어듭니다.' },
      code: { ref: 'dns', hl: [1, 2, 4, 5, 8, 11] },
      hide: ['eps', 'kp'],
      show: ['dns'],
      tags: [{ on: 'dns', text: 'api → 10.96.14.7', tone: 'ok' }],
      flows: [
        { path: ['web', 'dns'], kind: 'ctrl' },
        { path: ['dns', 'web'], kind: 'res', delay: 0.8 },
        { path: ['web', 'svc', 'a1'], kind: 'req', n: 2, delay: 1.7 },
      ],
      metrics: { addr: ['이름: api', 'ok'] },
      changes: [['~', '호출 주소: 10.96.14.7 → http://api']],
      more: [
        {
          title: '동작 원리',
          body: [
            'kubelet은 Pod를 만들 때 <code>/etc/resolv.conf</code>에 CoreDNS의 Service IP와 <b>검색 경로</b>를 넣어 둡니다. <code>api</code>라고만 물으면 검색 경로를 차례로 붙여 <code>api.shop.svc.cluster.local</code>을 찾아요. 짧은 이름이 자기 네임스페이스에서 먼저 풀리는 이유입니다.',
            '<code>ndots:5</code>는 "점이 5개 미만인 이름은 검색 경로부터 붙여 본다"는 뜻입니다. 그래서 <code>pay.example.com</code> 같은 외부 이름도 클러스터 안 이름을 몇 번 헛되이 물어본 뒤에야 풀립니다.',
          ],
        },
        {
          title: '출력 읽기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl exec deploy/web -- cat /etc/resolv.conf
search shop.svc.cluster.local svc.cluster.local
       cluster.local
nameserver 10.96.0.10
options ndots:5`,
          },
        },
        {
          title: '실무 팁',
          list: [
            '외부 API를 자주 부르는 앱은 이름 끝에 점을 붙이거나(<code>pay.example.com.</code>), Pod의 <code>dnsConfig</code>에서 ndots를 낮춰 불필요한 조회를 줄입니다.',
            '이름이 안 풀리면 <code>kubectl get pods -n kube-system -l k8s-app=kube-dns</code>로 CoreDNS가 살아 있는지 보고, 디버깅용 Pod에서 <code>nslookup</code>으로 시험합니다.',
            'DNS 조회는 Service를 바꿀 때 캐시 때문에 늦게 반영될 수 있습니다. Service를 지웠다 다시 만들면 ClusterIP가 바뀌니, 이름은 그대로여도 잠깐 옛 IP가 쓰일 수 있어요.',
          ],
        },
      ],
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
      more: [
        {
          title: '증상으로 좁히기',
          rows: [
            ['이름이 안 풀림', 'Service 이름 · 네임스페이스 · CoreDNS', 'warn'],
            ['즉시 Connection refused', '엔드포인트 0개 (셀렉터 · Ready)', 'bad'],
            ['엔드포인트는 있는데 refused', 'targetPort가 앱 포트와 다름', 'bad'],
            ['시간 초과', 'NetworkPolicy 차단 · 노드 간 통신', 'warn'],
            ['가끔만 실패', 'Ready인데 실제로는 아픈 Pod 하나', 'warn'],
          ],
        },
        {
          title: '직접 해보기',
          body: ['Service를 건너뛰고 Pod에 직접 붙어 보면 문제를 반으로 가를 수 있습니다. Pod로는 되는데 Service로 안 되면 셀렉터 · 포트 쪽, Pod로도 안 되면 앱 쪽이에요.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `# Pod에 직접 (앱이 듣는지)
$ kubectl port-forward pod/api-5f6d8c7b9-2xkqp 3000
$ curl localhost:3000/health
ok

# Service로 (셀렉터 · 포트가 맞는지)
$ kubectl port-forward svc/api 8080:80
$ curl localhost:8080/health`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '앱이 <code>127.0.0.1</code>에서만 듣고 있어 Pod IP로 오는 연결을 받지 못합니다. 컨테이너 안의 서버는 <code>0.0.0.0</code>에서 들어야 해요.',
            'Deployment의 라벨을 바꾸면서 Service의 셀렉터는 그대로 둡니다. 배포 직후 엔드포인트가 0이 됩니다.',
          ],
        },
      ],
    },
    {
      key: '연결 쏠림', kind: 'case', title: '사례: Pod를 늘렸는데 하나만 바쁘다',
      body: [
        'api를 gRPC로 바꾼 뒤 부하가 늘어 Pod를 3개로 늘렸습니다. 그런데 처음 있던 Pod만 CPU가 가득이고, 새 Pod 둘은 놀고 있어요.',
        'kube-proxy는 <b>연결이 맺어질 때</b> Pod를 고릅니다. gRPC(HTTP/2)는 연결 하나를 오래 열어 두고 그 위로 모든 요청을 보내므로, web이 처음 맺은 연결이 계속 첫 Pod로만 갑니다. 새 Pod는 새 연결이 생길 때까지 몫이 없어요.',
      ],
      callout: { type: 'tip', text: '해결은 요청 단위로 나누는 것입니다. 클라이언트가 Pod 목록을 받아 직접 나누거나(headless Service), 요청을 이해하는 L7 프록시를 앞에 두거나, 서버가 연결을 주기적으로 끊게 합니다.' },
      show: ['e_s1', 'e_s2', 'a3'],
      hide: ['eps'],
      set: {
        svc: { state: null }, eps: { state: null },
        a1: { state: 'hot', badge: 'CPU 95%', tone: 'bad' },
      },
      tags: [
        { on: 'a2', text: '거의 유휴', tone: 'mute', pos: 'bottom' },
        { on: 'a3', text: '거의 유휴', tone: 'mute', pos: 'bottom' },
        { on: 'web', text: '연결 1개를 계속 사용', tone: 'warn', pos: 'left' },
      ],
      flows: [{ path: ['web', 'svc', 'a1'], kind: 'req', n: 5, gap: 0.4 }],
      metrics: { ep: ['3개 · 쏠림', 'warn'] },
      changes: [['+', 'api Pod 2개 추가'], ['~', '부하는 여전히 첫 Pod에']],
      more: [
        {
          title: '동작 원리',
          body: [
            'HTTP/1.1 클라이언트는 보통 연결을 여러 개 만들고 자주 새로 맺어서 Pod 사이에 대략 고르게 퍼집니다. HTTP/2와 gRPC는 연결 하나에 수많은 요청을 겹쳐 보내도록(멀티플렉싱) 설계돼, 클라이언트 Pod가 몇 개 안 되면 연결도 몇 개뿐입니다. 연결 단위로 나누는 kube-proxy로는 몇 개의 연결이 몇 개의 Pod에 묶일 뿐이에요.',
          ],
        },
        {
          title: '해결 방법',
          list: [
            '<b>Headless Service</b>(<code>clusterIP: None</code>): DNS가 가상 IP 대신 Ready인 Pod IP들을 돌려줍니다. gRPC 클라이언트의 round_robin 정책과 함께 쓰면 클라이언트가 Pod마다 연결을 맺고 요청을 나눠요.',
            '<b>L7 프록시 · 서비스 메시</b>: Envoy 같은 프록시가 요청 단위로 나눕니다. 앱 코드는 그대로 둘 수 있어요.',
            '<b>서버 쪽 연결 수명</b>: gRPC 서버의 최대 연결 수명 설정으로 연결을 주기적으로 끊게 하면, 다시 맺을 때 새 Pod도 선택됩니다.',
          ],
        },
        {
          title: '설정 예시',
          code: {
            title: 'headless service', lang: 'yaml',
            text: `apiVersion: v1
kind: Service
metadata:
  name: api-headless
spec:
  clusterIP: None        # 가상 IP 없음
  selector:
    app: api
  ports:
    - port: 50051
# nslookup api-headless → Pod IP 3개`,
          },
        },
      ],
    },
    {
      key: 'NodePort', kind: 'problem', title: '클러스터 밖에서는 ClusterIP에 못 옵니다',
      body: [
        'ClusterIP와 DNS 이름은 <b>클러스터 안에서만</b> 통합니다. 고객의 브라우저는 닿을 수 없어요. 바깥으로 여는 첫 방법은 <code>type: NodePort</code>입니다. <b>모든 노드</b>가 같은 포트(기본 범위 30000–32767) 하나를 열고, 어느 노드로 들어오든 Service의 Pod로 넘겨 줍니다.',
        '동작은 하지만 고객에게 내놓기는 어렵습니다. 주소가 <code>노드IP:30080</code> 꼴이고, 노드는 교체될 때마다 IP가 바뀌며, 노드를 인터넷에 직접 드러내야 합니다.',
      ],
      callout: { type: 'key', text: 'NodePort는 그대로 쓰기보다 <b>앞에 로드 밸런서를 세우기 위한 발판</b>입니다. 노드들의 그 포트를 로드 밸런서의 대상으로 등록하면 되니까요.' },
      hide: ['web', 'a3'],
      show: ['users', 'np1', 'np2'],
      set: { svc: { sub: 'NodePort' }, a1: { state: null, badge: null } },
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
      more: [
        {
          title: '설정 예시',
          body: ['<code>nodePort</code>를 비우면 범위 안에서 자동으로 고릅니다. 직접 정하면 다른 Service와 겹치지 않게 관리해야 해요.'],
          code: {
            title: 'nodeport', lang: 'yaml',
            text: `spec:
  type: NodePort
  selector:
    app: api
  ports:
    - port: 80          # ClusterIP 포트 (여전히 있음)
      targetPort: 3000  # Pod 포트
      nodePort: 30080   # 모든 노드에 열리는 포트`,
          },
        },
        {
          title: '출력 읽기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get svc api
NAME  TYPE      CLUSTER-IP   PORT(S)
api   NodePort  10.96.14.7   80:30080/TCP`,
          },
        },
        {
          title: '언제 쓰나',
          list: [
            '로컬 클러스터나 실습에서 잠깐 밖에서 붙어 볼 때.',
            '직접 관리하는 외부 로드 밸런서(온프레미스 장비 등)가 노드 포트를 대상으로 삼을 때.',
            '클라우드에서는 노드의 보안 그룹 · 방화벽에 30000번대 포트를 열어야 닿습니다. 열려 있지 않으면 시간 초과가 납니다.',
          ],
        },
      ],
    },
    {
      key: 'LoadBalancer', kind: 'solution', title: 'LoadBalancer: 클라우드 LB를 앞에',
      body: [
        '<code>type: LoadBalancer</code>로 바꾸면 클라우드 컨트롤러가 클라우드 API를 불러 <b>로드 밸런서를 만들고</b> 노드(또는 Pod)를 대상으로 등록합니다. <code>kubectl get svc</code>의 <code>EXTERNAL-IP</code> 칸이 채워지면 고객은 그 주소 하나만 알면 됩니다.',
        '세 타입은 포개져 있습니다. LoadBalancer는 NodePort를, NodePort는 ClusterIP를 포함해요. 클러스터 안에서는 여전히 <code>api</code>로 부릅니다.',
      ],
      callout: { type: 'cloud', text: '네 클라우드 모두 대개 <b>L4</b> 로드 밸런서가 생깁니다. 그리고 Service 하나에 LB가 <b>한 대씩</b> 생겨 요금도 그만큼 붙습니다.' },
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
      more: [
        {
          title: '클라우드별로',
          rows: [
            ['AWS', 'NLB (AWS Load Balancer Controller 사용 시)', 'aws'],
            ['Azure', 'Azure Load Balancer', 'azure'],
            ['GCP', '패스스루 Network LB', 'gcp'],
            ['NCP', 'Load Balancer', 'ncp'],
          ],
        },
        {
          title: '내부용 LB와 원래 IP',
          body: [
            '인터넷이 아니라 VPC 안이나 피어링된 네트워크에만 열고 싶으면 <b>내부 LB</b>를 만듭니다. 방법은 어노테이션이고 사업자마다 다르니 문서를 확인하세요(예: Azure는 <code>service.beta.kubernetes.io/azure-load-balancer-internal: "true"</code>).',
            '<code>externalTrafficPolicy</code> 기본값 <code>Cluster</code>는 아무 노드로 들어와도 다른 노드의 Pod로 넘기는 대신 출발지 IP를 노드 IP로 바꿉니다. <code>Local</code>로 두면 Pod가 있는 노드만 받아 <b>고객의 원래 IP</b>가 보존되지만, Pod가 고르게 퍼져 있지 않으면 부하가 치우칩니다.',
          ],
        },
        {
          title: '출력 읽기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get svc api
NAME  TYPE          EXTERNAL-IP       PORT(S)
api   LoadBalancer  <pending>         80:30080/TCP

# 잠시 뒤
api   LoadBalancer  a1b2….elb.amazonaws.com  80:30080/TCP`,
          },
        },
        {
          title: '흔한 실수',
          body: ['<code>EXTERNAL-IP</code>가 계속 <code>&lt;pending&gt;</code>이면 LB를 만들 컨트롤러가 없거나(로컬 클러스터), 서브넷 태그 · 권한 · 할당량 문제로 실패한 것입니다. <code>kubectl describe svc</code>의 이벤트에 클라우드 API 오류가 남아요.'],
        },
      ],
    },
    {
      key: 'Ingress', kind: 'solution', title: 'Ingress: LB 하나로 호스트·경로 나누기',
      body: [
        '밖에 열 서비스가 web, api, admin…으로 늘면 LB도 그만큼 늘어납니다. 게다가 L4 LB는 URL을 보지 못해, <code>shop.example/api</code>는 api로 나머지는 web으로 보내는 일을 할 수 없어요.',
        '<b>Ingress</b>는 HTTP 요청의 <b>호스트와 경로</b>로 Service를 고르는 L7 규칙입니다. 입구 하나에서 여러 Service로 갈라 보내고, 뒤의 Service들은 ClusterIP면 충분합니다.',
      ],
      callout: { type: 'warn', text: '경로는 그대로 전달됩니다. <code>/api/orders</code>로 온 요청은 api에도 <code>/api/orders</code>로 가요. 앱이 <code>/orders</code>만 안다면 404입니다. 앱의 경로를 맞추거나 컨트롤러의 경로 재작성 기능을 씁니다.' },
      code: { ref: 'ing', hl: [6, 8, 11, 12, 15, 17] },
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
      more: [
        {
          title: '경로 매칭 규칙',
          list: [
            '<code>pathType: Prefix</code>: 경로를 <code>/</code> 단위로 잘라 앞부분이 같으면 맞습니다. <code>/api</code>는 <code>/api/orders</code>와 맞지만 <code>/apiv2</code>와는 맞지 않아요.',
            '<code>pathType: Exact</code>: 글자 그대로 같아야 합니다.',
            '<code>ImplementationSpecific</code>: 컨트롤러마다 해석이 다릅니다. 이식성을 원하면 피하세요.',
            '여러 규칙이 맞으면 <b>더 긴 경로</b>가 이깁니다. 그래서 <code>/</code>는 나머지 전부를 받는 기본 규칙이 됩니다.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get ingress shop
NAME  CLASS  HOSTS         ADDRESS        PORTS
shop  nginx  shop.example  203.0.113.10   80

# DNS 등록 전에는 Host 헤더로 시험
$ curl -H 'Host: shop.example' \\
    http://203.0.113.10/api/health
ok`,
          },
        },
        {
          title: '더 생각해 볼 것',
          body: ['Ingress 규격 자체는 호스트 · 경로 · TLS 정도만 정의합니다. 리다이렉트, 경로 재작성, 요청 크기 제한, 타임아웃 같은 것은 컨트롤러마다 다른 <b>어노테이션</b>으로 설정해요. 그래서 컨트롤러를 바꾸면 어노테이션을 모두 옮겨 적어야 하고, 이것이 Gateway API가 나온 이유 중 하나입니다.'],
        },
      ],
    },
    {
      key: '컨트롤러', kind: 'compare', title: 'Ingress는 컨트롤러가 있어야 움직입니다',
      body: [
        'Ingress 오브젝트는 규칙을 적은 문서일 뿐입니다. 실제로 트래픽을 받는 것은 <b>Ingress 컨트롤러</b>이고, 클러스터에 따로 설치해야 해요. 컨트롤러는 Ingress와 엔드포인트를 지켜보며 규칙을 실제 프록시 설정으로 옮깁니다.',
        '방식은 둘입니다. 클러스터 안에 프록시 Pod(NGINX · Traefik · Envoy 계열)를 띄우고 앞에 LB 한 대를 두는 방식, 그리고 컨트롤러가 클라우드의 <b>L7 로드 밸런서</b>를 직접 만들어 설정하는 방식입니다.',
      ],
      callout: { type: 'warn', text: '오래 널리 쓰인 커뮤니티 ingress-nginx는 유지보수 종료가 공지된 프로젝트입니다. 새로 고른다면 후속 표준인 <b>Gateway API</b>를 지원하는지 함께 보세요.' },
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
      more: [
        {
          title: '두 방식 비교',
          rows: [
            ['클러스터 안 프록시', '어디서나 같은 동작 · 기능 풍부', 'ok'],
            ['', '프록시 Pod의 확장 · 업그레이드는 우리 몫', 'warn'],
            ['클라우드 L7 LB', '운영 부담 적음 · WAF · 인증서 연동', 'ok'],
            ['', '클라우드마다 어노테이션 · 기능이 다름', 'warn'],
          ],
        },
        {
          title: '동작 원리',
          body: [
            '클라우드 L7 방식에서는 LB가 노드 포트를 거치지 않고 <b>Pod IP로 바로</b> 보내도록 구성할 수 있습니다(예: ALB의 IP 대상, GKE의 컨테이너 네이티브 부하 분산). 한 번 덜 거쳐 지연이 줄고, LB의 헬스 체크가 Pod 단위로 이뤄져요.',
            '어느 컨트롤러가 어떤 Ingress를 맡을지는 <code>IngressClass</code>로 정합니다. Ingress의 <code>ingressClassName</code>이 비어 있으면 기본 클래스(<code>ingressclass.kubernetes.io/is-default-class</code> 어노테이션)가 맡고, 기본도 없으면 아무도 맡지 않습니다.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get ingressclass
NAME   CONTROLLER                     AGE
alb    ingress.k8s.aws/alb            40d
nginx  k8s.io/ingress-nginx           90d`,
          },
        },
      ],
    },
    {
      key: 'TLS', kind: 'concept', title: 'HTTPS는 입구에서 한 번에',
      body: [
        '고객과는 HTTPS로 통신해야 합니다. Ingress의 <code>tls</code> 항목에 호스트와 인증서를 담은 <b>TLS Secret</b>을 적으면, 컨트롤러가 입구에서 암호화를 풀고(TLS 종료) 뒤의 Service로는 HTTP로 넘깁니다.',
        'Service마다 인증서를 따로 들고 있을 필요가 없어서 관리할 곳이 한 군데로 줄어요.',
      ],
      callout: { type: 'tip', text: '인증서 만료는 흔한 장애 원인입니다. <b>cert-manager</b>로 자동 발급 · 갱신하거나, 클라우드 L7 LB라면 사업자의 관리형 인증서를 연결하세요.' },
      show: ['cert'],
      tags: [
        { on: 'cert', text: 'shop-tls', tone: 'accent', icon: 'lock', pos: 'left' },
        { on: 'clb', text: 'HTTPS :443', tone: 'ok', pos: 'bottom' },
      ],
      flows: [
        { path: ['cert', 'ing'], kind: 'ctrl' },
        { path: ['users', 'clb', 'ing', 'svc', 'a1'], kind: 'req', n: 2, delay: 0.6 },
      ],
      metrics: { ext: ['HTTPS (L7)', 'ok'] },
      changes: [['+', 'TLS Secret shop-tls'], ['~', '고객 ↔ 입구: HTTPS']],
      more: [
        {
          title: '설정 예시',
          code: {
            title: 'shop-ingress.yaml (일부)', lang: 'yaml',
            text: `metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts: [shop.example]
      secretName: shop-tls    # 인증서가 담길 Secret
  rules:
    - host: shop.example
      # ... 경로 규칙은 그대로`,
          },
        },
        {
          title: '동작 원리',
          body: [
            'TLS Secret은 <code>type: kubernetes.io/tls</code>이고 <code>tls.crt</code>(인증서 체인)와 <code>tls.key</code>(개인 키) 두 키를 가집니다. Ingress와 <b>같은 네임스페이스</b>에 있어야 해요. cert-manager는 위 어노테이션을 보고 인증 기관(예: Let\'s Encrypt)에 발급을 요청해 이 Secret을 만들고, 만료 전에 알아서 갱신합니다.',
            '클라우드 L7 LB를 쓰면 인증서를 클라우드의 인증서 서비스에 두고 어노테이션으로 연결하는 방식도 흔합니다. 이때 개인 키는 클러스터에 들어오지 않아요.',
          ],
        },
        {
          title: '흔한 실수',
          list: [
            'Secret 이름 오타나 다른 네임스페이스의 Secret을 가리켜, 컨트롤러가 자체 서명된 기본 인증서를 내보냅니다. 브라우저에 인증서 경고가 뜨면 이것부터 보세요.',
            '<code>hosts</code>와 <code>rules.host</code>가 달라 TLS가 그 호스트에 적용되지 않습니다.',
            '입구 뒤의 구간도 암호화해야 하는 규정이 있다면 TLS 종료만으로는 부족합니다. 백엔드까지 HTTPS로 보내는 설정이나 서비스 메시의 mTLS를 검토합니다.',
          ],
        },
      ],
    },
    {
      key: '503 응답', kind: 'case', title: '사례: Ingress는 있는데 503이 돌아온다',
      body: [
        '새로 연 <code>/api</code> 경로가 503만 돌려줍니다. api Pod도 Service도 멀쩡해요. <code>describe ingress</code>를 보니 백엔드 칸에 <code>endpoints "api" not found</code>가 찍혀 있습니다.',
        'Ingress를 <code>web</code> 네임스페이스에 만들었기 때문이었어요. Ingress의 백엔드는 <b>같은 네임스페이스의 Service</b>만 가리킬 수 있어서, web 안에서 없는 <code>api</code>를 찾고 있었습니다.',
      ],
      callout: { type: 'tip', text: '해결: api용 Ingress를 <code>shop</code> 네임스페이스에 따로 만듭니다. 같은 호스트의 규칙이 여러 Ingress에 나뉘어 있어도 컨트롤러가 합쳐 줘요.' },
      code: { ref: 'ns503', hl: [4, 6, 10, 11, 14] },
      hide: ['users', 'svcW', 'wp', 'cert', 'a1', 'a2'],
      set: { svc: { state: 'dim' }, ing: { state: 'hot' } },
      tags: [
        { on: 'ing', text: 'ns: web', tone: 'warn', pos: 'bottom' },
        { on: 'svc', text: 'ns: shop', tone: 'info', pos: 'bottom' },
      ],
      flows: [
        { path: ['clb', 'ing'], kind: 'req', n: 2 },
        { path: ['ing', 'clb'], kind: 'bad', n: 2, delay: 0.8 },
      ],
      metrics: { ep: ['찾지 못함', 'bad'], ext: ['503', 'bad'] },
      changes: [['-', '다른 네임스페이스의 Service 참조'], ['~', '해결: Service와 같은 곳에 Ingress']],
      more: [
        {
          title: '상태 코드로 좁히기',
          rows: [
            ['404', '호스트 · 경로 규칙이 안 맞음, 또는 앱의 경로', 'warn'],
            ['503', '백엔드 Service · 엔드포인트가 없음', 'bad'],
            ['502', '엔드포인트는 있으나 Pod가 연결을 끊거나 이상 응답', 'bad'],
            ['504', 'Pod가 시간 안에 응답하지 않음', 'warn'],
          ],
        },
        {
          title: '확인 순서',
          list: [
            '<code>kubectl describe ingress</code>의 Rules에서 백엔드 칸에 오류가 없는지, 그리고 이벤트에 컨트롤러가 남긴 경고가 없는지 봅니다.',
            '가리키는 Service가 <b>같은 네임스페이스</b>에 있는지, 포트 번호나 이름이 Service의 <code>port</code>와 맞는지 확인합니다(<code>targetPort</code>가 아닙니다).',
            '그 Service의 엔드포인트가 차 있는지, 앞의 빈 엔드포인트 사례처럼 확인합니다.',
            '컨트롤러 Pod의 로그를 봅니다. 요청이 컨트롤러까지 왔는지, 어느 백엔드로 보냈는지 남아요.',
          ],
        },
        {
          title: '더 생각해 볼 것',
          body: ['한 팀이 입구를, 여러 팀이 각자 네임스페이스에서 경로를 맡는 구조는 Ingress로는 표현이 어색합니다. 다음 단계의 Gateway API는 이 역할 분리를 처음부터 염두에 두고 설계됐고, 다른 네임스페이스를 가리키려면 대상 쪽이 명시적으로 허락하게 합니다.'],
        },
      ],
    },
    {
      key: 'Gateway API', kind: 'concept', title: 'Gateway API: 역할을 나눈 다음 표준',
      body: [
        '<b>Gateway API</b>는 Ingress의 후속으로 만들어진 표준입니다. 입구를 <code>Gateway</code>(어떤 주소 · 포트 · 인증서로 받을지)와 <code>HTTPRoute</code>(어떤 호스트 · 경로를 어느 Service로)로 나눠, 플랫폼 팀과 앱 팀이 각자 맡을 수 있게 했어요.',
        '헤더로 고르기, 가중치로 나누기(카나리)처럼 Ingress에서는 어노테이션에 기대던 기능이 <b>규격 안에</b> 들어 있어 컨트롤러를 바꿔도 같은 YAML이 통합니다.',
      ],
      callout: { type: 'cloud', text: 'Gateway API는 쿠버네티스 본체가 아니라 별도로 설치하는 CRD입니다. GKE · AKS(Application Gateway for Containers) 등 여러 사업자와 오픈소스 컨트롤러가 지원합니다.' },
      show: ['users', 'rt', 'svcW'],
      set: {
        svc: { state: null }, ing: { state: null, label: 'Gateway', sub: '플랫폼 팀' },
      },
      panel: {
        title: '세 가지 오브젝트', icon: 'layers',
        rows: [
          ['GatewayClass', '어느 컨트롤러 · 인프라 담당', 'mute'],
          ['Gateway', '주소 · 포트 · TLS · 플랫폼 팀', 'info'],
          ['HTTPRoute', '호스트 · 경로 → Service · 앱 팀', 'ok'],
        ],
      },
      tags: [{ on: 'rt', text: 'api 팀이 관리', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['rt', 'ing'], kind: 'ctrl' },
        { path: ['users', 'clb', 'ing', 'svc'], kind: 'req', n: 2, delay: 0.6 },
        { path: ['users', 'clb', 'ing', 'svcW'], kind: 'req', delay: 1.2 },
      ],
      metrics: { ep: ['2개', 'ok'], ext: ['Gateway (L7)', 'ok'] },
      more: [
        {
          title: '설정 예시',
          body: ['api 팀은 자기 네임스페이스에 HTTPRoute만 둡니다. 90:10으로 새 버전에 나눠 보내는 것도 규격 안에서 됩니다.'],
          code: {
            title: 'api-route.yaml', lang: 'yaml',
            text: `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api
  namespace: shop
spec:
  parentRefs:
    - name: public          # 플랫폼 팀의 Gateway
      namespace: infra
  hostnames: [shop.example]
  rules:
    - matches:
        - path: { type: PathPrefix, value: /api }
      backendRefs:
        - { name: api, port: 80, weight: 90 }
        - { name: api-v2, port: 80, weight: 10 }`,
          },
        },
        {
          title: 'Ingress와 비교',
          rows: [
            ['역할 분리', 'Gateway와 Route를 다른 팀 · 네임스페이스가', 'ok'],
            ['가중치 · 헤더 매칭', '어노테이션이 아니라 규격 필드', 'ok'],
            ['프로토콜', 'HTTP 외에 gRPC 등 Route 종류', 'ok'],
            ['성숙도', 'Ingress보다 새롭고 구현마다 지원 범위 차이', 'warn'],
          ],
        },
        {
          title: '실무 팁',
          list: [
            '이미 Ingress로 잘 돌고 있다면 급히 옮길 필요는 없습니다. 새 클러스터나 컨트롤러를 바꿀 때가 좋은 기회예요.',
            'Gateway의 <code>allowedRoutes</code>로 어느 네임스페이스의 Route를 받을지 정하고, 다른 네임스페이스의 Service를 가리키려면 대상 쪽에 <code>ReferenceGrant</code>를 둡니다.',
          ],
        },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 바깥에서 Pod까지 이어지는 길',
      body: [
        '고객의 요청은 DNS → 클라우드 LB → Ingress(또는 Gateway) → <b>Service</b> → Pod 순서로 들어옵니다. Service는 라벨로 고른 Pod들 앞의 고정 주소이자 DNS 이름이고, kube-proxy가 노드에서 가상 IP를 Pod로 바꿉니다.',
        '연결이 안 되면 뒤에서부터 봅니다. Pod가 Ready인가, 엔드포인트가 차 있는가, 셀렉터와 포트가 맞는가. 다음 레슨에서는 이 Pod들에 환경마다 다른 설정과 비밀값을 넣는 <b>ConfigMap과 Secret</b>을 다룹니다.',
      ],
      hide: ['rt'],
      show: ['a1', 'a2', 'wp'],
      set: { ing: { label: 'Ingress', sub: '컨트롤러' } },
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
      metrics: { ep: ['2개', 'ok'], ext: ['Ingress (L7)', 'ok'], lb: ['1대를 함께', 'ok'] },
    },
  ],
  quiz: [
    {
      q: 'api Service를 만들었는데 web에서 호출하면 즉시 Connection refused가 납니다. api Pod는 모두 Running · Ready입니다. 가장 먼저 확인할 것은?',
      options: [
        'kubectl describe svc api의 Endpoints가 비어 있는지, 셀렉터가 Pod 라벨과 같은지',
        'api Pod가 떠 있는 노드의 CPU 사용률',
        'CoreDNS Pod를 재시작하면 해결되는지',
        'Service를 LoadBalancer 타입으로 바꾸면 해결되는지',
      ],
      answer: 0,
      step: 6,
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
      step: 5,
      why: '짧은 이름 api는 자기 네임스페이스(payments)의 검색 경로부터 붙여 찾으므로 엉뚱한 Service이거나 없는 이름이 됩니다. 다른 네임스페이스의 Service는 api.shop(전체 이름은 api.shop.svc.cluster.local)으로 부릅니다. Pod IP는 교체될 때마다 바뀌고, 클러스터 안에서 굳이 노드 포트로 돌아갈 이유가 없습니다.',
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
      step: 10,
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
      step: 11,
      why: 'Ingress 오브젝트는 규칙일 뿐이고, 그 규칙을 읽어 프록시나 클라우드 LB를 설정하는 것은 컨트롤러입니다. 맡을 컨트롤러가 없으면 오브젝트는 저장만 되고 아무 일도 일어나지 않습니다. Ingress 뒤의 Service는 ClusterIP여도 되고, Pod에 공인 IP는 필요 없습니다.',
    },
    {
      q: '신입 동료가 "api Service의 ClusterIP로 ping을 보냈는데 응답이 없으니 Service가 고장 났다"고 합니다. 가장 알맞은 답은?',
      options: [
        'kube-proxy를 모든 노드에서 재시작해야 한다',
        'ClusterIP 대역이 잘못 설정된 것이니 클러스터를 다시 만든다',
        'Service를 지웠다가 다시 만들면 ping이 된다',
        'ClusterIP는 포트 단위 규칙으로만 처리되는 가상 IP라 ping은 원래 응답하지 않는다. curl로 실제 포트를 시험한다',
      ],
      answer: 3,
      step: 4,
      why: 'ClusterIP는 어느 인터페이스에도 붙어 있지 않고, kube-proxy가 "이 IP의 이 포트로 가는 패킷"만 Pod로 바꾸는 규칙을 깔아 둔 것입니다. ICMP는 그 대상이 아니므로 ping 실패는 정상입니다. 재시작이나 재생성은 아무것도 바꾸지 않습니다.',
    },
    {
      q: 'gRPC로 통신하는 api를 1개에서 4개로 늘렸는데, 처음 Pod만 바쁘고 나머지 3개는 거의 놀고 있습니다. 가장 알맞은 조치는?',
      options: [
        'Pod를 더 늘려 8개로 만든다',
        '요청 단위로 나누도록 바꾼다. headless Service와 클라이언트 쪽 분산, 또는 L7 프록시(메시)를 쓰거나 서버가 연결을 주기적으로 끊게 한다',
        'Service를 NodePort로 바꾼다',
        'sessionAffinity: ClientIP를 켠다',
      ],
      answer: 1,
      step: 7,
      why: 'kube-proxy는 연결이 맺어질 때 Pod를 고르는데, gRPC는 연결 하나를 오래 쓰며 그 위로 모든 요청을 보냅니다. Pod를 늘리거나 타입을 바꿔도 기존 연결은 그대로입니다. sessionAffinity는 오히려 같은 클라이언트를 한 Pod에 묶습니다.',
    },
    {
      q: '새 api Pod가 Running인데 READY가 0/1입니다. 이 Pod로는 트래픽이 들어오지 않습니다. 어떻게 이해해야 할까요?',
      options: [
        'EndpointSlice에 준비 안 됨(ready: false)으로 올라 있어 Service가 트래픽을 보내지 않는 정상 동작이다. 준비 검사가 왜 실패하는지 본다',
        'Service의 셀렉터가 틀렸다',
        'kube-proxy가 고장 났다',
        'CoreDNS가 이 Pod의 이름을 모른다',
      ],
      answer: 0,
      step: 3,
      why: 'Service 트래픽은 Ready인 엔드포인트로만 갑니다. 준비가 안 된 Pod는 목록에 남되 준비 안 됨으로 표시되어, 시작 중이거나 아픈 Pod에 요청이 가지 않게 합니다. 셀렉터가 틀렸다면 아예 목록에 없고, DNS는 Pod가 아니라 Service 이름을 풉니다.',
    },
    {
      q: '외부 결제 API(pay.example.com)를 부르는 Pod에서 DNS 조회가 느리고, CoreDNS 로그에 pay.example.com.shop.svc.cluster.local 같은 없는 이름 조회가 가득합니다. 원인과 조치는?',
      options: [
        'CoreDNS 복제본이 부족하니 늘리기만 하면 된다',
        '결제 API의 DNS 서버가 느리다',
        'ndots:5 때문에 검색 경로를 먼저 붙여 보는 것이다. 이름 끝에 점을 붙이거나 Pod의 dnsConfig에서 ndots를 낮춘다',
        'Service의 ClusterIP가 바뀌었다',
      ],
      answer: 2,
      step: 5,
      why: 'Pod의 resolv.conf는 점이 5개 미만인 이름에 검색 경로를 차례로 붙여 먼저 물어봅니다. 그래서 외부 이름 하나에 헛된 조회가 여러 번 생깁니다. 완전한 이름(끝에 점)을 쓰거나 ndots를 낮추면 바로 외부 조회로 갑니다. CoreDNS를 늘리는 것은 증상만 덜어 줍니다.',
    },
    {
      q: 'LoadBalancer Service 뒤의 앱 로그에 고객 IP 대신 노드 IP만 찍힙니다. 고객의 원래 IP가 필요할 때 검토할 설정은?',
      options: [
        'type을 ClusterIP로 바꾼다',
        'sessionAffinity를 켠다',
        'Service의 port를 바꾼다',
        'externalTrafficPolicy: Local로 두어 Pod가 있는 노드만 받게 하고, Pod 분산을 함께 확인한다',
      ],
      answer: 3,
      step: 9,
      why: '기본값 Cluster는 다른 노드의 Pod로 넘기면서 출발지를 노드 IP로 바꿉니다. Local은 Pod가 있는 노드에서만 받아 원래 IP를 지키지만, Pod가 노드에 고르게 퍼져 있지 않으면 부하가 치우칩니다. L7 입구를 쓴다면 X-Forwarded-For 헤더로 받는 방법도 있습니다.',
    },
    {
      q: 'Ingress를 web 네임스페이스에 만들고 /api 경로를 shop 네임스페이스의 api Service로 보내려 했는데 503이 납니다. 가장 알맞은 해결은?',
      options: [
        'api Service와 같은 shop 네임스페이스에 /api용 Ingress를 따로 만든다',
        'Ingress의 port를 targetPort 값으로 바꾼다',
        'api Service를 LoadBalancer로 바꾼다',
        'Ingress 컨트롤러를 재시작한다',
      ],
      answer: 0,
      step: 13,
      why: 'Ingress 백엔드는 같은 네임스페이스의 Service만 가리킵니다. 그래서 web 안에서 없는 api를 찾아 엔드포인트가 없다고 503을 냅니다. Service와 같은 네임스페이스에 Ingress를 두면 컨트롤러가 같은 호스트의 규칙을 합쳐 줍니다. 백엔드 port는 Service의 port를 적는 것이 맞습니다.',
    },
    {
      q: '지난달 shop.example의 인증서가 만료돼 30분간 접속 장애가 났습니다. 재발을 막는 가장 알맞은 방법은?',
      options: [
        '인증서를 Pod마다 넣어 둔다',
        'cert-manager로 자동 발급 · 갱신하거나, 클라우드 L7 LB의 관리형 인증서를 연결한다',
        '인증서 유효 기간을 10년짜리로 직접 만든다',
        'HTTPS를 끄고 HTTP로만 운영한다',
      ],
      answer: 1,
      step: 12,
      why: '사람이 달력을 보고 갱신하는 방식은 언젠가 놓칩니다. cert-manager나 사업자의 관리형 인증서는 만료 전에 자동으로 갱신합니다. Pod마다 인증서를 넣으면 관리할 곳만 늘고, 공인 인증서는 긴 기간으로 발급받을 수 없으며, HTTP는 선택지가 아닙니다.',
    },
    {
      q: '플랫폼 팀은 공용 입구(주소 · 인증서)만 관리하고, 각 앱 팀이 자기 네임스페이스에서 경로와 10% 카나리 비율을 직접 정하게 하고 싶습니다. 가장 알맞은 선택은?',
      options: [
        '앱 팀마다 LoadBalancer Service를 하나씩 준다',
        'NodePort를 팀별로 나눠 준다',
        'Gateway API: 플랫폼 팀이 Gateway를, 앱 팀이 HTTPRoute를 두고 weight로 비율을 정한다',
        '하나의 Ingress를 모든 팀이 함께 편집한다',
      ],
      answer: 2,
      step: 14,
      why: 'Gateway API는 Gateway와 Route를 나눠 서로 다른 팀과 네임스페이스가 맡도록 설계됐고, 가중치 분배도 규격 필드로 지원합니다. 팀마다 LB를 주면 비용과 입구가 늘고, 한 Ingress를 함께 편집하면 권한을 나눌 수 없으며 카나리는 컨트롤러별 어노테이션에 기대야 합니다.',
    },
    {
      q: '클라우드에서 type: LoadBalancer Service를 만들었는데 EXTERNAL-IP가 10분째 <pending>입니다. 다음에 볼 곳은?',
      options: [
        'Pod의 로그',
        'CoreDNS 설정',
        'kubectl describe svc의 이벤트: LB를 만들 컨트롤러가 있는지, 클라우드 API 오류(권한 · 서브넷 · 할당량)가 있는지',
        'kube-proxy 모드',
      ],
      answer: 2,
      step: 9,
      why: 'EXTERNAL-IP는 클라우드 컨트롤러가 LB를 만들어 주소를 받아야 채워집니다. 만들 주체가 없거나 클라우드 API 호출이 실패하면 pending에 머물고, 그 이유는 Service의 이벤트에 남습니다. Pod나 DNS, kube-proxy는 LB 생성과 관계없습니다.',
    },
  ],
};
