export default {
  id: 'k8s-storage',
  learn: [
    '컨테이너에 쓴 데이터가 사라지는 이유와 emptyDir',
    'PV · PVC: 저장소를 요청하고 묶는 방식',
    'StorageClass와 CSI 드라이버의 동적 프로비저닝',
    '접근 모드(RWO · RWX)와 AZ에 묶이는 블록 디스크',
    'StatefulSet의 고정 이름과 volumeClaimTemplates',
    'reclaim policy, 그리고 운영 DB를 어디에 둘지',
  ],
  legend: [['req', '요청'], ['data', '데이터 쓰기'], ['ctrl', '제어 · API'], ['build', '디스크 생성'], ['bad', '실패 · 삭제']],
  metrics: [
    { id: 'data', label: '주문 데이터', icon: 'database' },
    { id: 'pvc', label: 'PVC 상태', icon: 'clipboard' },
    { id: 'disk', label: '클라우드 디스크', icon: 'hard-drive' },
    { id: 'pod', label: 'Pod 상태', icon: 'box' },
  ],
  scene: {
    zones: {
      podz: { at: [-0.6, -2.3], size: [4.4, 4.9], label: 'Pod web', color: 'teal' },
      n1: { at: [-0.6, -2.8], size: [3.2, 2.6], label: 'node-1', color: 'blue' },
      n2: { at: [-0.6, 0.4], size: [3.2, 2.6], label: 'node-2', color: 'blue' },
      za: { at: [-0.6, -2.8], size: [5.2, 2.6], label: 'AZ-a', color: 'purple' },
      zc: { at: [-0.6, 0.6], size: [5.2, 2.6], label: 'AZ-c', color: 'purple' },
      ns: { at: [-1.0, -1.2], size: [4.4, 2.4], label: 'ns shop-db', color: 'slate' },
    },
    nodes: {
      api: { at: [-2.4, 0], label: 'api', sub: 'Deployment', icon: 'boxes', color: 'teal' },
      db: { at: [0, 0], label: 'postgres', sub: 'Pod', icon: 'database', color: 'blue' },
      wl: { kind: 'tile', at: [2.4, 0], label: '쓰기 레이어', icon: 'layers', color: 'gray' },

      cweb: { at: [0, 1.6], size: 's', label: 'web', icon: 'box', color: 'teal' },
      ed: { kind: 'tile', at: [1.6, 0], label: 'emptyDir', icon: 'folder', color: 'yellow' },
      clog: { at: [3.2, -1.6], size: 's', label: 'log-agent', icon: 'scroll', color: 'slate' },

      pvc: { kind: 'tile', at: [2.4, 0], label: 'PVC pg-data', icon: 'clipboard', color: 'yellow' },
      pv: { kind: 'cyl', at: [4.8, 0], label: 'PV 20Gi', icon: 'hard-drive', color: 'purple' },
      csi: { at: [2.4, -2.4], label: 'EBS CSI', sub: '드라이버', icon: 'plug', color: 'aws' },

      p1: { at: [0.2, -1.7], size: 's', label: 'api-1', icon: 'box', color: 'teal' },
      p1b: { at: [1.5, -1.7], size: 's', label: 'api-2', icon: 'box', color: 'teal' },
      p2: { at: [0.8, 1.5], size: 's', label: 'api-3', icon: 'box', color: 'teal' },

      k1: { at: [0.8, -1.6], label: 'node-1', sub: 'CPU 부족', icon: 'server', color: 'blue' },
      ebs: { kind: 'cyl', at: [3.4, -1.6], label: 'EBS 20Gi', icon: 'hard-drive', color: 'aws' },
      k3: { at: [0.8, 1.8], label: 'node-3', sub: '자리 있음', icon: 'server', color: 'blue' },
      dbp: { at: [-3.0, 0.2], size: 's', label: 'db', icon: 'database', color: 'blue' },

      db0: { at: [0, 0], label: 'db-0', sub: 'StatefulSet', icon: 'database', color: 'blue' },
      db1: { at: [0, 2.4], label: 'db-1', sub: 'StatefulSet', icon: 'database', color: 'blue' },
      d0: { kind: 'cyl', at: [2.4, 0], label: 'data-db-0', icon: 'hard-drive', color: 'purple' },
      d1: { kind: 'cyl', at: [2.4, 2.4], label: 'data-db-1', icon: 'hard-drive', color: 'purple' },

      c_aws: { at: [0, 0.6], label: 'EBS', sub: 'gp3 · RWO', icon: 'hard-drive', color: 'aws' },
      c_az: { at: [1.6, -1.0], label: 'Azure Disk', sub: 'managed-csi', icon: 'hard-drive', color: 'azure' },
      c_gcp: { at: [3.2, -2.6], label: 'Persistent\nDisk', sub: 'pd-balanced', icon: 'hard-drive', color: 'gcp' },
      c_ncp: { at: [4.8, -4.2], label: '블록\n스토리지', sub: 'NKS', icon: 'hard-drive', color: 'ncp' },
    },
    edges: {
      e_api_db: { from: 'api', to: 'db' },
      e_db_wl: { from: 'db', to: 'wl', style: 'dashed' },
      e_web_ed: { from: 'cweb', to: 'ed' },
      e_ed_log: { from: 'ed', to: 'clog' },
      e_db_pvc: { from: 'db', to: 'pvc' },
      e_pvc_pv: { from: 'pvc', to: 'pv', bi: true, label: 'Bound' },
      e_pvc_csi: { from: 'pvc', to: 'csi', style: 'dashed', label: 'gp3' },
      e_csi_pv: { from: 'csi', to: 'pv' },
      e_p1b_pv: { from: 'p1b', to: 'pv' },
      e_p2_pv: { from: 'p2', to: 'pv', style: 'dashed', tone: 'bad' },
      e_q_k1: { from: 'dbp', to: 'k1', style: 'dashed', tone: 'bad' },
      e_q_k3: { from: 'dbp', to: 'k3', style: 'dashed', tone: 'bad' },
      e_k1_ebs: { from: 'k1', to: 'ebs', style: 'dashed', tone: 'mute' },
      e_d0: { from: 'db0', to: 'd0' },
      e_d1: { from: 'db1', to: 'd1' },
      e_db0_pvc: { from: 'db0', to: 'pvc' },
    },
  },
  codes: {
    empty: {
      title: 'web-pod.yaml', lang: 'yaml',
      text: `apiVersion: v1
kind: Pod
metadata: { name: web }
spec:
  containers:
    - name: web
      image: shop/web:2.1
      volumeMounts:
        - { name: logs, mountPath: /var/log/app }
    - name: log-agent
      image: fluent/fluent-bit:3.0
      volumeMounts:
        - { name: logs, mountPath: /logs, readOnly: true }
  volumes:
    - name: logs
      emptyDir: {}      # Pod와 함께 생기고 함께 지워짐
`,
    },
    pvc: {
      title: 'postgres.yaml', lang: 'yaml',
      text: `apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: pg-data }
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: gp3
  resources: { requests: { storage: 20Gi } }
---
apiVersion: v1
kind: Pod
metadata: { name: postgres }
spec:
  containers:
    - name: postgres
      image: postgres:16
      envFrom: [{ secretRef: { name: pg-secret } }]
      volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
          subPath: pgdata   # 디스크의 lost+found 피하기
  volumes:
    - name: data
      persistentVolumeClaim: { claimName: pg-data }
`,
    },
    sc: {
      title: 'storageclass.yaml', lang: 'yaml',
      text: `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: ebs.csi.aws.com  # 만드는 드라이버
parameters:
  type: gp3
  encrypted: "true"
reclaimPolicy: Delete  # PVC 삭제 시 디스크도
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
`,
    },
    sts: {
      title: 'db-statefulset.yaml', lang: 'yaml',
      text: `apiVersion: apps/v1
kind: StatefulSet
metadata: { name: db }
spec:
  serviceName: db        # 헤드리스 Service 이름
  replicas: 2
  selector: { matchLabels: { app: db } }
  template:
    metadata: { labels: { app: db } }
    spec:
      containers:
        - name: postgres
          image: postgres:16
          envFrom: [{ secretRef: { name: pg-secret } }]
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
              subPath: pgdata
  volumeClaimTemplates:      # Pod마다 PVC를 하나씩
    - metadata: { name: data }
      spec:
        accessModes: [ReadWriteOnce]
        storageClassName: gp3
        resources: { requests: { storage: 20Gi } }
`,
    },
    reclaim: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl get pv
NAME          CAPACITY  ACCESS MODES  RECLAIM POLICY
pvc-3f2a9c1e  20Gi      RWO           Delete

$ kubectl delete namespace shop-db
namespace "shop-db" deleted

$ kubectl get pv
No resources found

# 중요한 볼륨은 미리 Retain으로 바꿔 둡니다
$ kubectl patch pv pvc-3f2a9c1e -p \\
  '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'
`,
    },
  },
  steps: [
    {
      key: '사라진 주문', kind: 'problem', title: 'Pod가 다시 뜨자 주문이 사라졌습니다',
      body: [
        'shop.example이 주문 DB를 postgres Pod 하나로 띄웠습니다. 데이터는 컨테이너 안의 <code>/var/lib/postgresql/data</code>에 쌓입니다. 그런데 노드 점검으로 Pod가 다른 노드에 새로 만들어지자 주문 테이블이 텅 비었습니다.',
        '컨테이너가 쓴 파일은 이미지 위의 <b>쓰기 레이어</b>에 있고, 이 레이어는 컨테이너와 함께 버려집니다. Pod는 언제든 지워지고 새로 뜨는 <b>일회용</b>이니, 남아야 할 데이터는 Pod 바깥에 둬야 합니다.',
      ],
      callout: { type: 'warn', text: 'Pod 안에서 컨테이너가 재시작만 해도 새 컨테이너가 만들어져 쓰기 레이어는 비어 있습니다. 상태는 <b>볼륨</b>에 둬야 해요.' },
      show: ['api', 'db', 'wl'],
      set: { db: { badge: '새로 뜬 Pod', tone: 'warn' }, wl: { state: 'down' } },
      tags: [{ on: 'wl', text: '컨테이너와 함께 삭제', tone: 'bad', icon: 'x', pos: 'right' }],
      flows: [{ path: ['api', 'db'], kind: 'req', n: 2 }, { path: ['db', 'wl'], kind: 'data', n: 2, delay: 1 }],
      metrics: { data: ['사라짐', 'bad'], pvc: '-', disk: '0개', pod: 'Running' },
    },
    {
      key: 'emptyDir', kind: 'concept', title: 'emptyDir: Pod와 수명이 같은 볼륨',
      body: [
        '<b>볼륨</b>은 컨테이너 바깥의 저장 공간을 컨테이너 안의 경로에 붙인 것입니다. 가장 단순한 <b>emptyDir</b>는 Pod가 노드에 놓일 때 빈 디렉터리로 생기고, 같은 Pod의 컨테이너들이 함께 씁니다. 여기서는 web이 쓴 로그를 log-agent가 읽어 갑니다.',
        'emptyDir는 컨테이너가 재시작해도 남지만, <b>Pod가 지워지면 함께 지워집니다</b>. 노드가 죽거나 Pod가 다른 노드로 옮겨 가도 마찬가지예요.',
      ],
      callout: { type: 'tip', text: '캐시, 임시 파일, 사이드카와 파일 주고받기에 알맞습니다. DB 데이터처럼 남아야 하는 것에는 맞지 않아요.' },
      hide: ['api', 'db', 'wl'],
      show: ['podz', 'cweb', 'ed', 'clog'],
      code: { ref: 'empty', hl: [9, 13, 15, 16] },
      tags: [{ on: 'ed', text: 'Pod 삭제 = 함께 삭제', tone: 'warn', pos: 'bottom' }],
      flows: [{ path: ['cweb', 'ed'], kind: 'data', n: 2 }, { path: ['ed', 'clog'], kind: 'data', n: 2, delay: 1 }],
      metrics: { data: ['Pod 수명까지', 'warn'] },
    },
    {
      key: 'PV · PVC', kind: 'solution', title: 'PVC로 요청하고, PV로 받습니다',
      body: [
        'Pod보다 오래 사는 저장소는 두 객체로 나눠 다룹니다. <b>PV</b>(PersistentVolume)는 실제 디스크 하나를 나타내는 클러스터 자원이고, <b>PVC</b>(PersistentVolumeClaim)는 "20Gi, 한 노드에서 읽기 · 쓰기"처럼 필요한 것을 적은 <b>요청서</b>입니다.',
        '조건이 맞는 PV가 PVC에 묶이면(<code>Bound</code>) Pod는 PVC 이름만 가리킵니다. Pod가 지워져도 PVC와 PV는 남고, 새 Pod가 같은 PVC를 붙이면 데이터가 그대로 있어요.',
      ],
      callout: { type: 'key', text: 'Pod는 디스크가 EBS인지 NFS인지 모릅니다. PVC라는 한 겹이 앱과 스토리지를 떼어 놓아요.' },
      hide: ['podz', 'cweb', 'ed', 'clog'],
      show: ['db', 'pvc', 'pv'],
      set: { db: { badge: null } },
      code: { ref: 'pvc', hl: [5, 7, 21, 22, 23] },
      flows: [{ path: ['db', 'pvc', 'pv'], kind: 'data', n: 2 }],
      metrics: { data: ['유지', 'ok'], pvc: ['Bound', 'ok'], disk: '1개' },
      changes: [['+', 'PVC pg-data (20Gi, RWO)'], ['+', 'PV: 실제 디스크'], ['~', 'Pod를 다시 만들어도 데이터 유지']],
    },
    {
      key: 'StorageClass', kind: 'concept', title: '동적 프로비저닝: 디스크가 저절로 생깁니다',
      body: [
        'PV를 관리자가 미리 하나씩 만들어 두면 느리고 낭비가 큽니다. PVC에 <code>storageClassName</code>만 적으면, 그 <b>StorageClass</b>에 적힌 대로 디스크를 그때 만들어 줍니다. 이것이 <b>동적 프로비저닝</b>입니다.',
        '실제로 디스크를 만드는 것은 <b>CSI 드라이버</b>입니다. EKS라면 EBS CSI 드라이버가 새 PVC를 보고 AWS API로 gp3 볼륨을 만든 뒤, 그 볼륨을 가리키는 PV를 만들어 PVC와 묶어요.',
      ],
      callout: { type: 'tip', text: '<b>CSI</b>(Container Storage Interface)는 스토리지를 쿠버네티스에 붙이는 표준 플러그인 규격입니다. 기본 StorageClass는 <code>kubectl get storageclass</code>에 <code>(default)</code>로 표시돼요.' },
      hide: ['db'],
      show: ['csi'],
      set: { pv: { label: 'PV = EBS gp3' } },
      focus: ['csi'],
      code: { ref: 'sc', hl: [5, 6, 7] },
      flows: [{ path: ['pvc', 'csi'], kind: 'ctrl' }, { path: ['csi', 'pv'], kind: 'build', delay: 1.4 }, { path: ['pv', 'pvc'], kind: 'ctrl', delay: 2.4 }],
      metrics: { disk: ['1개 · 자동 생성', 'ok'] },
      changes: [['+', 'StorageClass gp3'], ['+', 'CSI 드라이버가 EBS 볼륨 생성'], ['~', 'PV는 사람이 아니라 드라이버가 만듦']],
    },
    {
      key: 'RWO 함정', kind: 'case', title: '사례: Pod를 3개로 늘리자 하나가 멈춤',
      body: [
        '상품 이미지를 저장하려고 api Deployment에 PVC 하나를 붙이고 replicas를 3으로 늘렸습니다. node-1의 두 Pod는 떴는데, node-2에 놓인 Pod는 <code>ContainerCreating</code>에서 멈추고 Events에 <code>Multi-Attach error</code>가 찍힙니다.',
        '원인은 <b>접근 모드</b>입니다. EBS 같은 블록 디스크는 <code>ReadWriteOnce</code>(RWO), 즉 <b>한 번에 한 노드</b>에만 붙습니다. 여러 노드의 Pod가 같은 파일을 쓰려면 <code>ReadWriteMany</code>(RWX)를 지원하는 파일 스토리지가 필요해요.',
      ],
      callout: { type: 'warn', text: 'RWO는 "Pod 하나"가 아니라 "노드 하나"입니다. 같은 노드의 Pod끼리는 붙어서 테스트에선 멀쩡해 보여요. Pod 하나로 제한하려면 <code>ReadWriteOncePod</code>를 씁니다.' },
      hide: ['pvc', 'csi'],
      show: ['n1', 'n2', 'p1', 'p1b', 'p2'],
      set: { pv: { label: 'EBS (RWO)' }, p2: { state: 'down', badge: 'Multi-Attach', tone: 'bad' } },
      tags: [{ on: 'p1', text: '같은 노드: 마운트됨', tone: 'ok', pos: 'left' }, { on: 'pv', text: '한 노드에만 붙음', tone: 'warn', pos: 'right' }],
      flows: [{ path: ['p1b', 'pv'], kind: 'data', n: 2 }, { path: ['p2', 'pv'], kind: 'bad', n: 2, delay: 0.8 }],
      metrics: { pod: ['ContainerCreating', 'bad'] },
      changes: [['~', 'replicas 1 → 3'], ['-', 'node-2의 Pod: 디스크를 못 붙임'], ['~', '해결: RWX 파일 스토리지 또는 Pod마다 PVC']],
    },
    {
      key: 'AZ 제약', kind: 'problem', title: '디스크가 있는 AZ에 자리가 없다면',
      body: [
        '블록 디스크는 <b>한 AZ 안에서만</b> 붙습니다. StorageClass가 <code>Immediate</code>이면 PVC를 만드는 순간 디스크가 생기는데, 그때는 Pod가 어디로 갈지 모릅니다. 디스크는 AZ-a에, 자리가 남은 노드는 AZ-c에 있으면 Pod는 <code>Pending</code>입니다.',
        '노드가 죽어도 같습니다. Pod는 디스크를 따라 <b>같은 AZ의 노드로만</b> 옮겨 갈 수 있어요. AZ가 통째로 멈추면 데이터도 거기 묶입니다.',
      ],
      callout: { type: 'key', text: '<code>volumeBindingMode: WaitForFirstConsumer</code>로 두면 스케줄러가 노드를 먼저 고르고, 디스크는 그 노드의 AZ에 만들어집니다. 앞의 StorageClass에 넣어 둔 줄이에요.' },
      hide: ['n1', 'n2', 'p1', 'p1b', 'p2', 'pv'],
      show: ['za', 'zc', 'k1', 'ebs', 'k3', 'dbp'],
      set: { dbp: { badge: 'Pending', tone: 'warn' } },
      focus: ['dbp'],
      tags: [
        { on: 'k1', text: 'CPU 부족', tone: 'bad', pos: 'top' },
        { on: 'k3', text: '디스크와 AZ 다름', tone: 'bad', pos: 'bottom' },
        { on: 'ebs', text: 'PVC 만들 때 생성', pos: 'right' },
      ],
      flows: [{ path: ['dbp', 'k1'], kind: 'bad' }, { path: ['dbp', 'k3'], kind: 'bad', delay: 0.9 }],
      metrics: { pod: ['Pending', 'bad'], disk: '1개 · AZ-a' },
      changes: [['-', 'AZ-a: 디스크는 있지만 자리가 없음'], ['-', 'AZ-c: 자리는 있지만 디스크를 못 붙임']],
    },
    {
      key: 'StatefulSet', kind: 'solution', title: 'StatefulSet: 이름과 디스크가 따라갑니다',
      body: [
        'Deployment의 Pod는 이름이 무작위이고 모두 같은 PVC를 나눠 씁니다. <b>StatefulSet</b>은 Pod에 <code>db-0</code>, <code>db-1</code>처럼 <b>고정된 이름</b>을 주고 0번부터 <b>순서대로</b> 띄웁니다.',
        '<code>volumeClaimTemplates</code>는 Pod마다 PVC를 따로 찍어 냅니다(<code>data-db-0</code>, <code>data-db-1</code>). <code>db-1</code>이 죽으면 같은 이름으로 다시 떠서 <b>자기 디스크</b>를 다시 붙여요. 헤드리스 Service로 <code>db-0.db</code> 같은 고정 DNS 이름도 생깁니다.',
      ],
      callout: { type: 'warn', text: 'StatefulSet은 이름과 디스크를 지켜 줄 뿐, 복제 · 장애 조치 · 백업은 하지 않습니다. 그건 DB 소프트웨어나 오퍼레이터의 몫이에요.' },
      hide: ['za', 'zc', 'k1', 'ebs', 'k3', 'dbp'],
      show: ['db0', 'db1', 'd0', 'd1'],
      code: { ref: 'sts', hl: [5, 19, 20, 22] },
      flows: [{ path: ['db0', 'd0'], kind: 'data', n: 2 }, { path: ['db1', 'd1'], kind: 'data', n: 2, delay: 0.6 }],
      tags: [{ on: 'db1', text: '죽어도 같은 이름으로', icon: 'refresh', pos: 'bottom' }],
      metrics: { pod: ['Running 2/2', 'ok'], pvc: ['Bound × 2', 'ok'], disk: '2개 (Pod마다)' },
      changes: [['+', 'db-0 · db-1: 고정 이름, 순서대로 기동'], ['+', 'PVC data-db-0 · data-db-1']],
    },
    {
      key: 'reclaim', kind: 'case', title: '사례: 네임스페이스와 함께 지워진 DB',
      body: [
        '테스트용이라 여긴 <code>shop-db</code> 네임스페이스를 지웠더니, 그 안의 PVC가 지워지면서 PV와 <b>EBS 볼륨까지</b> 사라졌습니다. 동적으로 만든 PV의 <b>reclaim policy</b>는 StorageClass를 따라 보통 <code>Delete</code>라서, PVC가 없어지면 디스크도 지웁니다.',
        '<code>Retain</code>이면 PVC가 지워져도 PV와 디스크가 남아, 사람이 확인하고 다시 붙이거나 지울 수 있습니다. 참고로 StatefulSet을 지우거나 줄이는 것만으로는 PVC가 기본적으로 남아요.',
      ],
      callout: { type: 'tip', text: 'Retain은 실수를 막아 줄 뿐 백업이 아닙니다. 중요한 볼륨은 <b>VolumeSnapshot</b>이나 클라우드 스냅샷으로 따로 백업하세요.' },
      hide: ['db1', 'd0', 'd1'],
      show: ['ns', 'pvc', 'pv'],
      set: {
        db0: { state: 'down' }, pvc: { label: 'PVC data-db-0', state: 'down' },
        pv: { label: 'EBS 20Gi', state: 'down', badge: '삭제됨', tone: 'bad' },
      },
      code: { ref: 'reclaim', hl: [3, 5, 9, 12, 13] },
      flows: [{ path: ['pvc', 'pv'], kind: 'bad', n: 2 }],
      metrics: { data: ['사라짐', 'bad'], pvc: ['삭제됨', 'bad'], disk: ['0개', 'bad'], pod: '-' },
    },
    {
      key: '4사 비교', kind: 'compare', title: '네 클라우드의 블록 · 파일 스토리지',
      body: [
        '개념은 같고 CSI 드라이버와 디스크 이름만 다릅니다. 블록 디스크는 어디서나 <b>한 존에 묶인 RWO</b>이고, 여러 노드가 함께 쓰는 RWX는 NFS 계열 파일 스토리지로 따로 만듭니다.',
        'AKS · GKE · NKS는 기본 StorageClass가 깔려 나오고, EKS는 EBS CSI 드라이버를 애드온으로 설치하고 StorageClass를 직접 정하는 경우가 많습니다. 어느 쪽이든 <code>reclaimPolicy</code>와 <code>volumeBindingMode</code>부터 확인하세요.',
      ],
      callout: { type: 'cloud', text: 'Azure의 ZRS 디스크나 GCP의 리전 영구 디스크처럼 여러 존에 복제되는 블록 디스크도 있지만, 비용과 쓰기 지연이 늘어납니다.' },
      hide: ['ns', 'db0', 'pvc', 'pv'],
      show: ['c_aws', 'c_az', 'c_gcp', 'c_ncp'],
      set: { db0: { state: null }, pvc: { state: null }, pv: { state: null, badge: null } },
      panel: {
        title: '블록 디스크 · RWX 파일 스토리지', icon: 'hard-drive',
        rows: [
          ['AWS (EKS)', 'EBS · EFS', 'aws'],
          ['Azure (AKS)', 'Azure Disk · Azure Files', 'azure'],
          ['GCP (GKE)', 'Persistent Disk · Filestore', 'gcp'],
          ['NCP (NKS)', '블록 스토리지 · NAS', 'ncp'],
        ],
      },
      metrics: { data: ['유지', 'ok'], pvc: 'Bound', disk: '1개', pod: 'Running' },
    },
    {
      key: '정리', kind: 'recap', title: '정리: 데이터는 Pod 바깥에 둡니다',
      body: [
        'PVC로 요청하면 StorageClass와 CSI 드라이버가 클라우드 디스크를 만들고, StatefulSet은 Pod마다 이름과 디스크를 고정합니다. 블록 디스크는 <b>한 노드 · 한 AZ</b>에 묶이고, reclaim policy가 <code>Delete</code>일 수 있다는 것을 기억하세요.',
        '그래도 운영 DB는 가능하면 <b>관리형 DB</b>(RDS, Cloud SQL 등)에 맡기세요. 백업 · 복제 · 장애 조치 · 업그레이드를 클러스터 안에서 직접 돌리는 일은 생각보다 무겁습니다. 다음 레슨에서는 클러스터 자체를 맡기는 관리형 쿠버네티스를 봅니다.',
      ],
      hide: ['c_aws', 'c_az', 'c_gcp', 'c_ncp'],
      show: ['db0', 'db1', 'd0', 'd1'],
      panel: {
        title: '어떤 데이터를 어디에', icon: 'list',
        rows: [
          ['Pod 동안만 필요', 'emptyDir', 'info'],
          ['Pod 하나의 영구 데이터', 'PVC (RWO)', 'accent'],
          ['여러 Pod가 공유', 'RWX 파일 스토리지', 'accent'],
          ['운영 DB', '관리형 DB 먼저 검토', 'warn'],
        ],
      },
      focus: ['d0', 'd1'],
    },
  ],
  quiz: [
    {
      q: 'api Deployment(replicas 3)의 Pod들이 업로드 파일을 같은 디렉터리에서 함께 읽고 써야 합니다. 지금은 EBS PVC 하나를 붙였더니 일부 Pod가 Multi-Attach 오류로 멈춥니다. 가장 알맞은 해결은?',
      options: [
        'PVC의 accessModes를 ReadWriteMany로만 바꾸고 EBS StorageClass는 그대로 둔다',
        'RWX를 지원하는 파일 스토리지(EFS 같은 NFS 계열) StorageClass로 PVC를 만든다',
        'nodeSelector로 세 Pod를 모두 한 노드에 몰아넣는다',
        'PVC 크기를 늘려 세 Pod가 나눠 쓸 공간을 만든다',
      ],
      answer: 1,
      why: '블록 디스크는 한 번에 한 노드에만 붙는 RWO라서, 여러 노드가 공유하려면 RWX를 지원하는 파일 스토리지가 필요합니다. EBS에 RWX만 적으면 드라이버가 지원하지 않아 PVC가 만들어지지 않고, 한 노드에 몰면 돌아는 가지만 그 노드가 죽으면 전부 멈춥니다. 크기는 접근 모드와 무관합니다.',
    },
    {
      q: 'StorageClass가 Immediate 모드인 클러스터에서, 새 DB Pod가 "volume node affinity conflict"로 Pending입니다. 다른 AZ의 노드에는 자리가 넉넉합니다. 앞으로 같은 일을 막는 설정은?',
      options: [
        'StorageClass의 volumeBindingMode를 WaitForFirstConsumer로 바꾼다',
        'reclaimPolicy를 Retain으로 바꾼다',
        'PVC의 accessModes를 ReadWriteOncePod로 바꾼다',
        'Pod의 CPU requests를 0으로 만든다',
      ],
      answer: 0,
      why: 'Immediate는 Pod가 어디로 갈지 모르는 채 디스크의 AZ를 먼저 정합니다. WaitForFirstConsumer는 스케줄러가 노드를 고른 뒤 그 AZ에 디스크를 만들게 합니다. reclaimPolicy는 삭제 시 동작, ReadWriteOncePod는 공유 범위일 뿐이고, requests를 없애면 배치 판단만 망가집니다.',
    },
    {
      q: '동료가 "kubectl delete pvc만 했는데 EBS 볼륨까지 사라졌다"고 합니다. 가장 정확한 설명은?',
      options: [
        'PVC를 지우면 쿠버네티스는 항상 디스크를 지운다',
        'EBS CSI 드라이버의 버그다',
        '그 PV의 reclaim policy가 Delete였다. 동적 프로비저닝은 보통 StorageClass의 Delete를 따른다',
        'StatefulSet이 PVC 삭제를 감지해 디스크를 지웠다',
      ],
      answer: 2,
      why: 'PVC가 지워졌을 때 디스크를 어떻게 할지는 PV의 reclaim policy가 정합니다. Delete면 디스크도 지우고 Retain이면 남깁니다. 항상 지우는 것은 아니고, StatefulSet은 오히려 기본적으로 PVC를 남겨 둡니다.',
    },
    {
      q: '팀이 운영 PostgreSQL을 StatefulSet + PVC로 클러스터 안에 올리려 합니다. 가장 먼저 따져야 할 것은?',
      options: [
        'StatefulSet이 복제와 장애 조치를 해 주니 따로 준비할 것은 없다',
        '백업 · 복제 · 장애 조치 · 업그레이드를 누가 어떻게 운영할지. 부담이 크면 관리형 DB를 쓴다',
        'Deployment가 더 단순하니 Deployment로 바꾼다',
        'emptyDir가 더 빠르니 emptyDir로 바꾼다',
      ],
      answer: 1,
      why: 'StatefulSet은 고정 이름과 Pod별 디스크를 줄 뿐, DB 운영 작업은 해 주지 않습니다. 그 일을 감당할 사람과 도구(오퍼레이터 등)가 없다면 관리형 DB가 더 안전합니다. Deployment는 Pod별 디스크를 못 주고, emptyDir는 Pod와 함께 사라집니다.',
    },
  ],
};
