export default {
  id: 'k8s-storage',
  learn: [
    '컨테이너에 쓴 데이터가 사라지는 이유와 emptyDir',
    'PV · PVC · StorageClass와 CSI 드라이버의 동적 프로비저닝',
    '접근 모드(RWO · RWX)와 AZ에 묶이는 블록 디스크',
    'StatefulSet의 고정 이름과 volumeClaimTemplates, 볼륨 확장',
    'reclaim policy와 VolumeSnapshot 백업',
    '운영 DB를 어디에 둘지 판단하기',
  ],
  legend: [['req', '요청'], ['data', '데이터 쓰기'], ['ctrl', '제어 · API'], ['build', '디스크 · 스냅샷 생성'], ['bad', '실패 · 삭제']],
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
      snap: { kind: 'cyl', at: [4.8, -2.4], label: 'Snapshot', icon: 'copy', color: 'teal' },

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
      e_k3_ebs: { from: 'k3', to: 'ebs', off: true },
      e_d0: { from: 'db0', to: 'd0' },
      e_d1: { from: 'db1', to: 'd1' },
      e_db0_pvc: { from: 'db0', to: 'pvc' },
      e_pv_snap: { from: 'pv', to: 'snap', style: 'dashed' },
      e_snap_pvc: { from: 'snap', to: 'pvc', style: 'dashed', label: 'dataSource' },
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
    // 1
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
      more: [
        { title: '동작 원리', body: [
          '컨테이너 파일 시스템은 읽기 전용 이미지 레이어들 위에 얇은 쓰기 레이어를 겹친 것입니다(overlayfs). 이 쓰기 레이어는 노드 디스크의 컨테이너 런타임 디렉터리에 있고, 컨테이너가 지워지면 런타임이 함께 지웁니다. kubelet이 컨테이너를 재시작할 때도 <b>새 컨테이너</b>를 만들기 때문에 이전 쓰기 레이어는 쓰이지 않아요.',
          '쓰기 레이어와 emptyDir는 노드의 <b>임시 저장소(ephemeral storage)</b>를 씁니다. 너무 많이 쓰면 노드 디스크가 차서 kubelet이 Pod를 쫓아내니, 로그와 임시 파일이 많은 앱은 <code>ephemeral-storage</code> requests · limits도 적습니다.',
        ] },
        { title: '직접 해보기', body: ['컨테이너만 재시작해도 파일이 사라지는지 확인해 봅니다.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl exec postgres -- touch /tmp/hello
$ kubectl exec postgres -- kill 1
$ kubectl get pod postgres
NAME      READY  STATUS   RESTARTS
postgres  1/1    Running  1
$ kubectl exec postgres -- ls /tmp/hello
ls: cannot access '/tmp/hello': No such file` } },
        { title: '흔한 실수', list: [
          '<code>hostPath</code>로 노드 디렉터리를 붙이면 재시작에는 남지만, Pod가 다른 노드로 가면 데이터가 없습니다. 노드 보안에도 위험해 일반 앱에는 쓰지 않습니다.',
        ] },
      ],
    },
    // 2
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
      more: [
        { title: '설정 예시', body: ['크기 제한과 메모리 기반 emptyDir입니다.'], code: { title: 'volumes', lang: 'yaml', text: `volumes:
  - name: cache
    emptyDir:
      sizeLimit: 2Gi       # 넘으면 Pod 퇴거
  - name: scratch
    emptyDir:
      medium: Memory       # tmpfs (RAM)
      sizeLimit: 256Mi` } },
        { title: '동작 원리', list: [
          '기본 emptyDir는 노드 디스크의 kubelet 디렉터리 아래에 만들어집니다. 노드 디스크가 느리면 emptyDir도 느립니다.',
          '<code>medium: Memory</code>는 RAM 위의 tmpfs라 빠르지만, 쓴 만큼 <b>컨테이너 메모리 사용량</b>으로 계산됩니다. 메모리 limit을 넘으면 지난 레슨의 OOMKilled가 납니다.',
          '<code>sizeLimit</code>을 넘기면 kubelet이 Pod를 퇴거시킵니다. 로그가 무한히 쌓이는 사이드카 구성에서 노드 디스크를 지키는 안전장치예요.',
        ] },
        { title: '비슷한 임시 볼륨', body: [
          'ConfigMap · Secret을 파일로 붙이는 볼륨도 Pod와 수명을 같이하는 임시 볼륨입니다. 영구 저장이 필요할 때만 다음 단계의 PVC를 씁니다.',
        ] },
      ],
    },
    // 3
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
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get pvc pg-data
NAME     STATUS  VOLUME        CAPACITY  ACCESS MODES
pg-data  Bound   pvc-3f2a9c1e  20Gi      RWO

$ kubectl get pv pvc-3f2a9c1e
NAME          CAPACITY  RECLAIM  STATUS  CLAIM
pvc-3f2a9c1e  20Gi      Delete   Bound   shop/pg-data` } },
        { title: '동작 원리', list: [
          'PV와 PVC는 <b>1:1</b>로 묶입니다. 묶인 PV는 다른 PVC가 쓸 수 없고, PVC가 요청한 것보다 큰 PV가 묶이면 남는 용량도 그 PVC의 것이 됩니다.',
          'PV는 네임스페이스가 없는 클러스터 자원이고, PVC는 네임스페이스에 속합니다. 그래서 앱 팀은 PVC만, 플랫폼 팀은 PV · StorageClass를 다루는 식으로 역할이 나뉩니다.',
          'Pod가 쓰고 있는 PVC를 지우면 바로 사라지지 않고 <code>Terminating</code>에 머뭅니다. 보호용 finalizer가 Pod가 사라질 때까지 삭제를 미뤄요.',
        ] },
        { title: '정적 프로비저닝', body: [
          '이미 있는 디스크(예: 옛 VM에서 떼어 낸 볼륨)를 쓰려면 관리자가 그 디스크 ID를 적은 PV를 직접 만들고, PVC가 그 PV를 이름으로 지정하게 합니다. 대부분은 다음 단계의 동적 프로비저닝을 씁니다.',
        ] },
      ],
    },
    // 4
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
      more: [
        { title: '동작 원리', body: [
          'CSI 드라이버는 두 부분입니다. <b>컨트롤러</b>(Deployment)는 클라우드 API를 불러 디스크를 만들고(provision), 노드에 붙이고(attach), 늘리고(resize), 스냅샷을 찍습니다. <b>노드 플러그인</b>(DaemonSet)은 각 노드에서 붙은 디스크를 포맷하고 컨테이너 경로에 마운트합니다.',
          '순서는 "PVC 생성 → 디스크 생성 · PV 생성 → Pod가 노드에 배치 → 디스크를 그 노드에 attach → 마운트 → 컨테이너 시작"입니다. 어느 단계에서 멈췄는지에 따라 증상이 PVC Pending, Pod ContainerCreating으로 갈립니다.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get storageclass
NAME           PROVISIONER       RECLAIMPOLICY
gp3 (default)  ebs.csi.aws.com   Delete
$ kubectl get volumeattachment
NAME       ATTACHER          PV            NODE    ATTACHED
csi-8a1..  ebs.csi.aws.com   pvc-3f2a9c1e  node-1  true` } },
        { title: '흔한 실수', list: [
          'StorageClass의 parameters는 만든 뒤 고칠 수 없습니다. 디스크 종류를 바꾸려면 새 StorageClass를 만들고, 새 PVC로 데이터를 옮깁니다.',
          '기본 StorageClass가 둘 이상이거나 하나도 없으면, storageClassName을 비운 PVC가 엉뚱한 곳으로 가거나 Pending에 머뭅니다.',
        ] },
      ],
    },
    // 5
    {
      key: 'PVC Pending', kind: 'case', title: '사례: PVC가 Pending에서 움직이지 않음',
      body: [
        '새로 만든 EKS 클러스터에 같은 매니페스트를 올렸더니 PVC가 몇 분째 <code>Pending</code>이고, Pod도 따라서 Pending입니다. Events에는 "외부 프로비저너가 볼륨을 만들기를 기다리는 중"이라는 말만 반복됩니다.',
        '원인은 EBS CSI 드라이버 컨트롤러에 <b>AWS API 권한</b>(IAM 역할)이 없었던 것입니다. 드라이버는 떠 있지만 볼륨 생성 요청이 거절되고 있었어요. 권한을 연결하자 몇 초 만에 <code>Bound</code>가 됩니다.',
      ],
      callout: { type: 'tip', text: '<code>WaitForFirstConsumer</code>에서는 Pod가 배치되기 전까지 PVC가 Pending인 것이 <b>정상</b>입니다. 메시지가 "waiting for first consumer"인지 먼저 보세요.' },
      hide: ['pv'],
      set: { csi: { state: 'down', badge: '권한 없음', tone: 'bad' } },
      focus: ['csi'],
      flows: [{ path: ['pvc', 'csi'], kind: 'ctrl', n: 2 }, { path: ['csi', 'pvc'], kind: 'bad', delay: 1.4 }],
      code: {
        title: 'kubectl describe pvc pg-data', lang: 'sh', hl: [3, 4, 6, 7],
        text: `Status:  Pending
Events:
  Normal   ExternalProvisioning
    waiting for a volume to be created by
    the external provisioner "ebs.csi.aws.com"
  Warning  ProvisioningFailed
    rpc error: ... UnauthorizedOperation:
    You are not authorized to perform
    this operation.
`,
      },
      metrics: { pvc: ['Pending', 'bad'], disk: ['0개', 'bad'], pod: ['Pending', 'bad'] },
      changes: [['-', 'PVC Pending, 디스크 안 생김'], ['~', '원인: 드라이버의 클라우드 권한 없음'], ['+', 'IAM 역할 연결 → Bound']],
      more: [
        { title: '원인별 메시지', rows: [
          ['waiting for first consumer', 'WFFC: Pod 배치 전 정상 상태', 'ok'],
          ['waiting ... external provisioner (계속)', '드라이버 미설치 · 멈춤', 'warn'],
          ['ProvisioningFailed · Unauthorized', '드라이버의 클라우드 권한 없음', 'bad'],
          ['storageclass ... not found', 'StorageClass 이름 오타', 'bad'],
          ['no persistent volumes available', '기본 StorageClass 없음 · 정적 PV 없음', 'warn'],
        ] },
        { title: '확인 순서', code: { title: 'terminal', lang: 'sh', text: `# 1) 드라이버가 떠 있나
$ kubectl get pods -n kube-system \\
    -l app.kubernetes.io/name=aws-ebs-csi-driver
# 2) 컨트롤러 로그에 거절이 찍혔나
$ kubectl logs -n kube-system \\
    deploy/ebs-csi-controller -c ebs-plugin | tail
# 3) StorageClass 이름 · 기본값
$ kubectl get sc` } },
        { title: '클라우드별로', body: [
          'EKS는 EBS CSI 드라이버를 애드온으로 따로 설치하고, 그 컨트롤러 서비스 계정에 IAM 역할을 연결해야 합니다(다음 레슨의 워크로드 아이덴티티). AKS · GKE는 디스크 CSI 드라이버가 기본으로 켜져 나오는 경우가 많아 이 사고가 덜 납니다.',
        ] },
      ],
    },
    // 6
    {
      key: 'RWO 함정', kind: 'case', title: '사례: Pod를 3개로 늘리자 하나가 멈춤',
      body: [
        '상품 이미지를 저장하려고 api Deployment에 PVC 하나를 붙이고 replicas를 3으로 늘렸습니다. node-1의 두 Pod는 떴는데, node-2에 놓인 Pod는 <code>ContainerCreating</code>에서 멈추고 Events에 <code>Multi-Attach error</code>가 찍힙니다.',
        '원인은 <b>접근 모드</b>입니다. EBS 같은 블록 디스크는 <code>ReadWriteOnce</code>(RWO), 즉 <b>한 번에 한 노드</b>에만 붙습니다.',
      ],
      callout: { type: 'warn', text: 'RWO는 "Pod 하나"가 아니라 "노드 하나"입니다. 같은 노드의 Pod끼리는 붙어서 테스트에선 멀쩡해 보여요.' },
      hide: ['pvc', 'csi'],
      show: ['n1', 'n2', 'p1', 'p1b', 'p2', 'pv'],
      set: { csi: { state: null, badge: null }, pv: { label: 'EBS (RWO)' }, p2: { state: 'down', badge: 'Multi-Attach', tone: 'bad' } },
      tags: [{ on: 'p1', text: '같은 노드: 마운트됨', tone: 'ok', pos: 'left' }, { on: 'pv', text: '한 노드에만 붙음', tone: 'warn', pos: 'right' }],
      flows: [{ path: ['p1b', 'pv'], kind: 'data', n: 2 }, { path: ['p2', 'pv'], kind: 'bad', n: 2, delay: 0.8 }],
      metrics: { data: ['유지', 'ok'], pvc: ['Bound', 'ok'], disk: '1개', pod: ['ContainerCreating', 'bad'] },
      changes: [['~', 'replicas 1 → 3'], ['-', 'node-2의 Pod: 디스크를 못 붙임'], ['~', 'node-1의 Pod 둘은 정상']],
      more: [
        { title: '출력 읽기', code: { title: 'kubectl describe pod api-3', lang: 'sh', text: `Events:
  Warning  FailedAttachVolume  attachdetach-controller
    Multi-Attach error for volume "pvc-7b1c..."
    Volume is already used by pod(s) api-1, api-2` } },
        { title: '왜 이렇게 설계됐나', body: [
          '블록 디스크는 컴퓨터에 꽂는 디스크와 같습니다. ext4 · xfs 같은 파일 시스템은 한 컴퓨터가 혼자 쓴다고 가정하므로, 두 노드가 동시에 마운트해 쓰면 파일 시스템이 깨집니다. 그래서 클라우드와 쿠버네티스가 모두 "한 노드"로 막아 둡니다.',
        ] },
        { title: '흔한 실수', list: [
          'Deployment에 RWO PVC를 붙이고 롤링 업데이트를 하면, 새 Pod가 다른 노드에 놓일 때 옛 Pod가 디스크를 놓지 않아 롤아웃이 멈춥니다. 이런 앱은 Recreate 전략이나 StatefulSet이 맞습니다.',
          '노드가 갑자기 죽으면 디스크가 그 노드에 붙은 것으로 남아, 새 Pod가 붙이기까지 몇 분이 걸릴 수 있습니다.',
        ] },
      ],
    },
    // 7
    {
      key: '접근 모드', kind: 'solution', title: '여럿이 함께 쓰려면 RWX 파일 스토리지',
      body: [
        '여러 노드의 Pod가 같은 파일을 읽고 쓰려면 <code>ReadWriteMany</code>(RWX)를 지원하는 <b>파일 스토리지</b>(NFS 계열)가 필요합니다. AWS라면 EFS CSI 드라이버의 StorageClass로 PVC를 만들면 세 Pod가 모두 같은 디렉터리를 붙입니다.',
        '다만 파일 스토리지는 블록 디스크보다 지연이 크고, 같은 파일을 동시에 고치는 일은 여전히 앱이 조율해야 합니다. 업로드 파일이라면 오브젝트 스토리지가 더 나은 경우도 많아요.',
      ],
      callout: { type: 'key', text: 'Pod 하나만 쓰게 엄격히 막으려면 <code>ReadWriteOncePod</code>를 씁니다. 같은 노드의 두 번째 Pod도 거절돼요.' },
      set: { pv: { label: 'EFS (RWX)', color: 'aws' }, p2: { state: null, badge: null }, e_p2_pv: { style: null, tone: 'ok' } },
      tags: [{ on: 'pv', text: '여러 노드가 함께 마운트', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['p1b', 'pv'], kind: 'data', n: 2 }, { path: ['p2', 'pv'], kind: 'data', n: 2, delay: 0.8 }],
      metrics: { pod: ['Running 3/3', 'ok'] },
      changes: [['~', 'EBS → EFS (RWX)'], ['~', 'api-3도 마운트 성공'], ['+', '세 Pod가 같은 디렉터리 공유']],
      more: [
        { title: '네 가지 접근 모드', rows: [
          ['RWO · ReadWriteOnce', '한 노드가 읽기 · 쓰기', 'info'],
          ['RWOP · ReadWriteOncePod', '한 Pod만 읽기 · 쓰기', 'info'],
          ['ROX · ReadOnlyMany', '여러 노드가 읽기만', 'info'],
          ['RWX · ReadWriteMany', '여러 노드가 읽기 · 쓰기', 'ok'],
        ] },
        { title: '판단 기준', rows: [
          ['DB · 큐 · 검색 엔진', '블록 디스크 RWO (Pod마다)', 'accent'],
          ['여러 Pod가 같은 설정 · 자산', 'RWX 파일 스토리지', 'ok'],
          ['사용자 업로드 · 대용량 파일', '오브젝트 스토리지 (S3 등)', 'ok'],
          ['캐시 · 임시 작업', 'emptyDir', 'info'],
        ] },
        { title: '동작 원리', body: [
          'PVC의 <code>accessModes</code>는 "이 능력이 있는 볼륨을 달라"는 요청일 뿐, 디스크의 성질을 바꾸지 않습니다. EBS StorageClass에 RWX를 적으면 드라이버가 지원하지 않는다며 프로비저닝이 실패합니다. 접근 모드는 StorageClass(드라이버)와 짝이 맞아야 해요.',
        ] },
        { title: '흔한 실수', list: [
          'DB 데이터 디렉터리를 NFS 계열 RWX에 두면 성능이 떨어지고, 일부 DB는 파일 잠금이 제대로 동작하지 않아 손상될 수 있습니다. DB에는 블록 디스크를 쓰세요.',
          'RWX라고 여러 Pod가 같은 파일에 동시에 써도 안전한 것은 아닙니다. 쓰기 충돌은 앱이 피해야 합니다.',
        ] },
      ],
    },
    // 8
    {
      key: 'AZ 제약', kind: 'problem', title: '디스크가 있는 AZ에 자리가 없다면',
      body: [
        '블록 디스크는 <b>한 AZ 안에서만</b> 붙습니다. StorageClass가 <code>Immediate</code>이면 PVC를 만드는 순간 디스크가 생기는데, 그때는 Pod가 어디로 갈지 모릅니다. 디스크는 AZ-a에, 자리가 남은 노드는 AZ-c에 있으면 Pod는 <code>Pending</code>입니다.',
        '노드가 죽어도 같습니다. Pod는 디스크를 따라 <b>같은 AZ의 노드로만</b> 옮겨 갈 수 있어요. AZ가 통째로 멈추면 데이터도 거기 묶입니다.',
      ],
      callout: { type: 'key', text: 'Events에는 <code>volume node affinity conflict</code>가 찍힙니다. PV에 "이 AZ의 노드에서만"이라는 조건이 붙어 있다는 뜻이에요.' },
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
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl describe pod db | grep -A2 Warning
  Warning  FailedScheduling  0/3 nodes are
  available: 1 Insufficient cpu, 2 node(s) had
  volume node affinity conflict.

$ kubectl get pv pvc-91d0 -o yaml | grep -A6 nodeAffinity
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: topology.kubernetes.io/zone
          values: [ap-northeast-2a]` } },
        { title: '동작 원리', body: [
          'CSI 드라이버는 디스크를 만들면서 PV에 <code>nodeAffinity</code>로 그 디스크의 존을 적어 둡니다. 스케줄러의 볼륨 필터는 이 조건을 만족하지 않는 노드를 탈락시키므로, 다른 AZ에 자리가 아무리 많아도 Pod는 그쪽으로 가지 못합니다.',
        ] },
        { title: '더 생각해 볼 것', list: [
          '노드 오토스케일러가 <b>그 AZ에</b> 노드를 늘릴 수 있어야 합니다. 노드 그룹 하나가 여러 AZ에 걸쳐 있으면 엉뚱한 AZ에 노드가 생길 수 있어, 상태 있는 워크로드용 노드 그룹은 AZ마다 나누기도 합니다.',
          'AZ 장애를 견뎌야 하는 데이터라면 디스크 하나로는 부족합니다. DB 복제로 다른 AZ에 사본을 두거나, 존 간 복제 디스크 · 관리형 DB를 검토합니다.',
        ] },
      ],
    },
    // 9
    {
      key: 'WFFC', kind: 'solution', title: '노드를 먼저 고르고, 디스크는 그 AZ에',
      body: [
        'StorageClass를 <code>volumeBindingMode: WaitForFirstConsumer</code>로 두면 순서가 바뀝니다. PVC는 Pod가 생길 때까지 기다리고, 스케줄러가 CPU · 메모리 · affinity를 보고 노드를 먼저 고른 뒤, 디스크는 <b>그 노드의 AZ</b>에 만들어집니다.',
        '새 DB를 이 방식으로 다시 만들자 자리가 있는 node-3(AZ-c)이 골라지고, 디스크도 AZ-c에 생겨 바로 붙습니다.',
      ],
      callout: { type: 'tip', text: '앞서 본 gp3 StorageClass에 이 줄을 넣어 둔 이유입니다. 블록 디스크용 StorageClass라면 거의 항상 WaitForFirstConsumer가 맞아요.' },
      hide: ['e_k1_ebs'],
      show: ['e_k3_ebs'],
      set: {
        ebs: { at: [3.4, 1.8], label: 'EBS · AZ-c' },
        dbp: { badge: null, state: 'ok' },
        e_q_k3: { style: null, tone: 'ok' },
        e_q_k1: { tone: 'mute' },
      },
      focus: ['ebs'],
      tags: [{ on: 'k3', text: '스케줄러가 먼저 고름', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['dbp', 'k3'], kind: 'ctrl' }, { path: ['k3', 'ebs'], kind: 'data', n: 2, delay: 1 }],
      metrics: { pod: ['Running', 'ok'], pvc: ['Bound', 'ok'], disk: '1개 · AZ-c' },
      changes: [['~', 'Immediate → WaitForFirstConsumer'], ['+', '디스크가 Pod의 AZ에 생성'], ['~', 'Pending → Running']],
      more: [
        { title: '동작 원리', list: [
          '① PVC가 만들어져도 <code>Pending</code>(waiting for first consumer)으로 대기합니다.',
          '② 그 PVC를 쓰는 Pod가 생기면 스케줄러가 볼륨의 제약(가능한 존)까지 고려해 노드를 고르고, PVC에 "선택된 노드" 주석을 남깁니다.',
          '③ CSI 드라이버가 그 노드의 존에 디스크를 만들고, PV가 묶이고, attach · mount가 이어집니다.',
        ] },
        { title: '설정 예시', body: ['특정 존에서만 디스크를 만들게 제한할 수도 있습니다.'], code: { title: 'storageclass.yaml', lang: 'yaml', text: `volumeBindingMode: WaitForFirstConsumer
allowedTopologies:
  - matchLabelExpressions:
      - key: topology.kubernetes.io/zone
        values:
          - ap-northeast-2a
          - ap-northeast-2c` } },
        { title: '흔한 실수', list: [
          'WFFC는 <b>처음 만들 때</b>만 도와줍니다. 한 번 AZ-c에 생긴 디스크는 계속 AZ-c에 있으니, 이후에는 Pod도 AZ-c에만 갈 수 있습니다.',
          'Pod에 <code>nodeName</code>을 직접 적으면 스케줄러를 건너뛰어 WFFC가 제대로 동작하지 않습니다. 노드 지정은 nodeSelector · affinity로 하세요.',
        ] },
      ],
    },
    // 10
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
      more: [
        { title: '동작 원리', list: [
          '기본 <code>podManagementPolicy: OrderedReady</code>는 db-0이 Ready가 돼야 db-1을 만들고, 줄일 때는 큰 번호부터 지웁니다. 순서가 필요 없는 앱은 <code>Parallel</code>로 한꺼번에 띄울 수 있습니다.',
          '업데이트도 큰 번호부터 하나씩 진행됩니다. <code>updateStrategy.rollingUpdate.partition: 1</code>을 주면 1번 이상만 새 버전으로 바꿔, 일부만 먼저 올려 보는 데 씁니다.',
          '헤드리스 Service(<code>clusterIP: None</code>)는 가상 IP 없이 Pod마다 DNS 레코드를 만듭니다. 복제본이 "주 서버는 db-0.db"처럼 서로를 이름으로 찾을 수 있어요.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get pod,pvc -l app=db
NAME        READY  STATUS
pod/db-0    1/1    Running
pod/db-1    1/1    Running
NAME                 STATUS  CAPACITY
pvc/data-db-0        Bound   20Gi
pvc/data-db-1        Bound   20Gi
$ kubectl exec db-1 -- getent hosts db-0.db
10.0.1.37  db-0.db.shop-db.svc.cluster.local` } },
        { title: '실무 팁', body: [
          'StatefulSet을 줄이거나 지워도 PVC는 기본적으로 남습니다. 최근 버전에서는 <code>persistentVolumeClaimRetentionPolicy</code>로 삭제 · 축소 시 PVC를 지울지 정할 수 있지만, 운영 DB라면 기본값(남김)이 안전합니다.',
        ] },
      ],
    },
    // 11
    {
      key: '볼륨 확장', kind: 'concept', title: '디스크가 차면: PVC 크기 늘리기',
      body: [
        '주문이 쌓여 <code>data-db-0</code>이 90%를 넘었습니다. StorageClass에 <code>allowVolumeExpansion: true</code>가 있으면 PVC의 <code>storage</code> 값만 20Gi → 50Gi로 고치면 됩니다. CSI 드라이버가 클라우드 디스크를 키우고, 노드 플러그인이 파일 시스템까지 늘립니다.',
        '대부분의 드라이버는 Pod를 멈추지 않고 늘립니다. 반대로 <b>줄이기는 지원되지 않습니다</b>. 줄이려면 작은 PVC를 새로 만들어 데이터를 옮겨야 해요.',
      ],
      callout: { type: 'warn', text: 'StatefulSet의 <code>volumeClaimTemplates</code>는 고칠 수 없습니다. 이미 만들어진 PVC를 하나씩 늘리고, 템플릿은 StatefulSet을 다시 만들어 맞춥니다.' },
      set: { d0: { badge: '20 → 50Gi', tone: 'ok' } },
      focus: ['d0'],
      code: {
        title: 'PVC 늘리기', lang: 'sh', hl: [1, 2, 6],
        text: `$ kubectl patch pvc data-db-0 -p \\
  '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'
persistentvolumeclaim/data-db-0 patched

$ kubectl get pvc data-db-0
NAME       STATUS  CAPACITY
data-db-0  Bound   50Gi

$ kubectl exec db-0 -- df -h /var/lib/postgresql/data
Size  Used  Avail  Use%
49G   18G   31G    37%
`,
      },
      metrics: { disk: ['2개 · 50Gi + 20Gi', 'ok'] },
      changes: [['~', 'data-db-0: 20Gi → 50Gi'], ['~', '사용률 90% → 37%'], ['~', 'Pod 재시작 없음']],
      more: [
        { title: '동작 원리', list: [
          '① PVC의 요청 용량이 늘면 CSI 컨트롤러(resizer)가 클라우드 API로 디스크 크기를 바꿉니다.',
          '② 노드 플러그인이 마운트된 파일 시스템을 늘립니다. 이 단계가 끝나야 PVC의 CAPACITY가 새 값으로 바뀝니다.',
          '③ 진행 중에는 PVC 조건에 <code>Resizing</code>이나 파일 시스템 확장 대기 같은 상태가 보입니다. <code>kubectl describe pvc</code>로 확인하세요.',
        ] },
        { title: '흔한 실수', list: [
          'StorageClass에 <code>allowVolumeExpansion</code>이 없으면 PVC 수정이 거절됩니다. 미리 켜 두세요.',
          '클라우드 디스크는 한 번 변경한 뒤 다음 변경까지 기다려야 하는 경우가 있습니다(EBS는 수 시간). 처음부터 넉넉히 늘리세요.',
          '디스크가 100% 차면 DB가 멈추거나 손상될 수 있습니다. 사용률 경보는 80% 근처에 겁니다.',
        ] },
      ],
    },
    // 12
    {
      key: 'reclaim', kind: 'case', title: '사례: 네임스페이스와 함께 지워진 DB',
      body: [
        '테스트용이라 여긴 <code>shop-db</code> 네임스페이스를 지웠더니, 그 안의 PVC가 지워지면서 PV와 <b>EBS 볼륨까지</b> 사라졌습니다. 동적으로 만든 PV의 <b>reclaim policy</b>는 StorageClass를 따라 보통 <code>Delete</code>라서, PVC가 없어지면 디스크도 지웁니다.',
        '<code>Retain</code>이면 PVC가 지워져도 PV와 디스크가 남아, 사람이 확인하고 다시 붙이거나 지울 수 있습니다.',
      ],
      callout: { type: 'tip', text: 'Retain은 실수를 막아 줄 뿐 백업이 아닙니다. 중요한 볼륨은 다음 단계의 스냅샷으로 따로 백업하세요.' },
      hide: ['db1', 'd0', 'd1'],
      show: ['ns', 'pvc', 'pv'],
      set: {
        db0: { state: 'down' }, pvc: { label: 'PVC data-db-0', state: 'down' },
        pv: { label: 'EBS 50Gi', color: 'purple', state: 'down', badge: '삭제됨', tone: 'bad' },
      },
      code: { ref: 'reclaim', hl: [3, 5, 9, 12, 13] },
      flows: [{ path: ['pvc', 'pv'], kind: 'bad', n: 2 }],
      metrics: { data: ['사라짐', 'bad'], pvc: ['삭제됨', 'bad'], disk: ['0개', 'bad'], pod: '-' },
      more: [
        { title: 'PV의 생애', rows: [
          ['Available', '아직 PVC에 묶이지 않음', 'info'],
          ['Bound', 'PVC에 묶여 사용 중', 'ok'],
          ['Released', 'PVC는 지워졌고 Retain으로 남음', 'warn'],
          ['Failed', '자동 회수 실패', 'bad'],
        ] },
        { title: 'Retain으로 남은 디스크 다시 쓰기', body: ['Released PV는 이전 PVC 기록(claimRef)이 남아 있어 바로 묶이지 않습니다. 기록을 지우면 Available이 되고, 새 PVC가 이름으로 지정해 다시 붙일 수 있어요.'], code: { title: 'terminal', lang: 'sh', text: `$ kubectl patch pv pvc-3f2a9c1e --type json \\
  -p '[{"op":"remove","path":"/spec/claimRef"}]'
$ kubectl get pv pvc-3f2a9c1e
NAME          STATUS     CLAIM
pvc-3f2a9c1e  Available` } },
        { title: '실무 팁', list: [
          '운영 데이터용으로는 <code>reclaimPolicy: Retain</code>인 StorageClass를 따로 만들어 쓰는 팀이 많습니다. 대신 지운 PVC의 디스크가 쌓이니 주기적으로 정리합니다.',
          '네임스페이스 삭제 권한은 RBAC로 좁히세요. 지우는 명령 하나가 그 안의 PVC 전부를 지웁니다.',
        ] },
      ],
    },
    // 13
    {
      key: '스냅샷', kind: 'solution', title: 'VolumeSnapshot으로 백업하고 되살리기',
      body: [
        '사고 뒤 팀은 매일 밤 <b>VolumeSnapshot</b>을 찍기로 했습니다. CSI 드라이버가 클라우드 디스크 스냅샷을 만들고, 쿠버네티스 객체로 기록합니다. 클라우드 스냅샷은 보통 바뀐 부분만 저장하는 증분 방식이에요.',
        '되살릴 때는 새 PVC의 <code>dataSource</code>에 스냅샷을 적습니다. 스냅샷 내용을 담은 새 디스크가 만들어져 Pod에 붙습니다.',
      ],
      callout: { type: 'warn', text: '디스크 스냅샷은 "전원을 갑자기 끈" 상태와 같습니다. DB는 자체 백업(pg_dump, WAL 보관)이나 쓰기 멈춤과 함께 써야 일관성이 보장돼요.' },
      hide: ['ns'],
      show: ['snap'],
      set: {
        db0: { state: null }, pvc: { label: 'PVC 복원본', state: null },
        pv: { label: 'EBS 50Gi', state: null, badge: null },
      },
      focus: ['snap'],
      flows: [{ path: ['pv', 'snap'], kind: 'build', n: 2 }, { path: ['snap', 'pvc'], kind: 'data', delay: 1.6 }],
      code: {
        title: 'snapshot.yaml', lang: 'yaml', hl: [5, 6, 16, 17, 18],
        text: `apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata: { name: db-0-nightly }
spec:
  volumeSnapshotClassName: ebs-snap
  source:
    persistentVolumeClaimName: data-db-0
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: data-db-0-restore }
spec:
  accessModes: [ReadWriteOnce]
  storageClassName: gp3
  resources: { requests: { storage: 50Gi } }
  dataSource:
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
    name: db-0-nightly
`,
      },
      metrics: { data: ['스냅샷에서 복원', 'ok'], pvc: ['Bound', 'ok'], disk: '1개 + 스냅샷', pod: 'Running' },
      changes: [['+', '매일 밤 VolumeSnapshot'], ['+', 'dataSource로 새 PVC 복원'], ['~', '데이터 손실 범위: 하루 이내']],
      more: [
        { title: '동작 원리', list: [
          '세 객체가 짝을 이룹니다. <b>VolumeSnapshotClass</b>(어느 드라이버로, 삭제 정책은), <b>VolumeSnapshot</b>(이 PVC를 찍어 달라는 요청), <b>VolumeSnapshotContent</b>(실제 클라우드 스냅샷). PVC · StorageClass · PV와 같은 구조예요.',
          '이 API는 스냅샷 CRD와 스냅샷 컨트롤러가 설치돼 있어야 동작합니다. 관리형 서비스에 따라 기본 제공이거나 애드온으로 설치합니다.',
          '복원한 PVC는 원본과 같은 존에 만들어질 필요가 없어, 다른 AZ로 데이터를 옮기는 수단으로도 씁니다.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: `$ kubectl get volumesnapshot
NAME          READYTOUSE  SOURCEPVC  RESTORESIZE
db-0-nightly  true        data-db-0  50Gi` } },
        { title: '실무 팁', list: [
          '스냅샷은 보통 같은 리전에 저장됩니다. 리전 장애까지 대비하려면 다른 리전으로 복사하세요. RTO · RPO와 DR 전략은 관측 · 보안 · 비용 챕터의 백업 레슨에서 다룹니다.',
          'Velero 같은 도구는 쿠버네티스 객체(매니페스트)와 볼륨 스냅샷을 함께 백업해, 네임스페이스 통째 복구를 쉽게 합니다.',
          '복원 연습을 하지 않은 백업은 백업이 아닙니다. 분기마다 실제로 되살려 보세요.',
        ] },
      ],
    },
    // 14
    {
      key: '4사 비교', kind: 'compare', title: '네 클라우드의 블록 · 파일 스토리지',
      body: [
        '개념은 같고 CSI 드라이버와 디스크 이름만 다릅니다. 블록 디스크는 어디서나 <b>한 존에 묶인 RWO</b>이고, 여러 노드가 함께 쓰는 RWX는 NFS 계열 파일 스토리지로 따로 만듭니다.',
        'AKS · GKE · NKS는 기본 StorageClass가 깔려 나오고, EKS는 EBS CSI 드라이버를 애드온으로 설치하고 StorageClass를 직접 정하는 경우가 많습니다. 어느 쪽이든 <code>reclaimPolicy</code>와 <code>volumeBindingMode</code>부터 확인하세요.',
      ],
      callout: { type: 'cloud', text: 'Azure의 ZRS 디스크나 GCP의 리전 영구 디스크처럼 여러 존에 복제되는 블록 디스크도 있지만, 비용과 쓰기 지연이 늘어납니다.' },
      hide: ['db0', 'pvc', 'pv', 'snap'],
      show: ['c_aws', 'c_az', 'c_gcp', 'c_ncp'],
      set: { pvc: { label: 'PVC pg-data' } },
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
      more: [
        { title: 'CSI 드라이버 이름', rows: [
          ['AWS', 'ebs.csi.aws.com · efs.csi.aws.com', 'aws'],
          ['Azure', 'disk.csi.azure.com · file.csi.azure.com', 'azure'],
          ['GCP', 'pd.csi.storage.gke.io · Filestore CSI', 'gcp'],
          ['NCP', 'NKS가 제공하는 블록 스토리지 CSI · NAS', 'ncp'],
        ] },
        { title: '클라우드별로', list: [
          '<b>EKS</b>: EBS · EFS CSI 드라이버를 애드온으로 설치하고, 드라이버에 IAM 권한을 연결합니다. 옛 클러스터의 gp2 StorageClass보다 gp3 StorageClass를 직접 만들어 기본으로 두는 경우가 많습니다.',
          '<b>AKS</b>: Azure Disk · Azure Files CSI 드라이버와 여러 StorageClass(<code>managed-csi</code>, <code>azurefile-csi</code> 등)가 기본으로 들어 있습니다.',
          '<b>GKE</b>: Persistent Disk CSI 드라이버가 기본이고 <code>standard-rwo</code> 같은 StorageClass가 준비돼 있습니다. Filestore는 따로 켭니다.',
          '<b>NKS</b>: 블록 스토리지용 기본 StorageClass가 제공되고, 공유가 필요하면 NAS를 씁니다. 이름과 옵션은 콘솔 · 문서에서 확인하세요.',
        ] },
      ],
    },
    // 15
    {
      key: '정리', kind: 'recap', title: '정리: 데이터는 Pod 바깥에 둡니다',
      body: [
        'PVC로 요청하면 StorageClass와 CSI 드라이버가 클라우드 디스크를 만들고, StatefulSet은 Pod마다 이름과 디스크를 고정합니다. 블록 디스크는 <b>한 노드 · 한 AZ</b>에 묶이고, reclaim policy가 <code>Delete</code>일 수 있으며, 스냅샷 없이는 백업이 아니라는 것을 기억하세요.',
        '그래도 운영 DB는 가능하면 <b>관리형 DB</b>(RDS, Cloud SQL 등)에 맡기세요. 백업 · 복제 · 장애 조치 · 업그레이드를 클러스터 안에서 직접 돌리는 일은 생각보다 무겁습니다. 다음 레슨에서는 클러스터 자체를 맡기는 관리형 쿠버네티스를 봅니다.',
      ],
      hide: ['c_aws', 'c_az', 'c_gcp', 'c_ncp'],
      show: ['db0', 'db1', 'd0', 'd1'],
      set: { d0: { badge: null } },
      panel: {
        title: '어떤 데이터를 어디에', icon: 'list',
        rows: [
          ['Pod 동안만 필요', 'emptyDir', 'info'],
          ['Pod 하나의 영구 데이터', 'PVC (RWO) + 스냅샷', 'accent'],
          ['여러 Pod가 공유', 'RWX 파일 스토리지', 'accent'],
          ['운영 DB', '관리형 DB 먼저 검토', 'warn'],
        ],
      },
      focus: ['d0', 'd1'],
    },
  ],
  quiz: [
    {
      q: 'postgres 컨테이너가 OOM으로 한 번 재시작했을 뿐인데 데이터가 비었습니다. 볼륨은 붙이지 않았습니다. 이유는?',
      options: [
        '재시작하면 PVC가 자동으로 초기화된다',
        'kubelet이 재시작 시 새 컨테이너를 만들어, 이전 쓰기 레이어의 파일은 쓰이지 않는다',
        'OOM이 나면 노드 디스크가 포맷된다',
        'postgres 이미지가 매번 데이터를 지우도록 만들어졌다',
      ],
      answer: 1, step: 1,
      why: '컨테이너가 쓴 파일은 그 컨테이너의 쓰기 레이어에 있고, 재시작은 새 컨테이너를 만듭니다. 그래서 볼륨 없이 쓴 데이터는 재시작만으로도 사라집니다. PVC는 붙이지 않았으니 해당하지 않습니다.',
    },
    {
      q: '사이드카와 메인 컨테이너가 임시 파일을 주고받는데, 파일이 아주 많아 노드 디스크가 찰까 걱정입니다. 알맞은 설정은?',
      options: [
        'emptyDir에 sizeLimit을 걸고, ephemeral-storage requests · limits를 적는다',
        'hostPath로 노드의 /tmp를 붙인다',
        'RWX PVC를 만든다',
        'emptyDir에 medium: Memory만 지정하고 메모리 limit은 비운다',
      ],
      answer: 0, step: 2,
      why: '같은 Pod 안의 임시 공유에는 emptyDir가 맞고, sizeLimit과 ephemeral-storage 설정이 노드 디스크를 지킵니다. hostPath는 노드에 흔적을 남기고 보안에 위험하며, Memory 매체에 limit이 없으면 노드 메모리를 위협합니다.',
    },
    {
      q: 'EKS 새 클러스터에서 PVC가 계속 Pending이고, Events에 ProvisioningFailed ... UnauthorizedOperation이 보입니다. 먼저 할 일은?',
      options: [
        'PVC 크기를 줄인다',
        'StorageClass를 WaitForFirstConsumer로 바꾼다',
        'EBS CSI 드라이버 컨트롤러가 쓰는 서비스 계정에 볼륨 생성 권한이 있는 IAM 역할을 연결한다',
        'Pod의 requests를 늘린다',
      ],
      answer: 2, step: 5,
      why: 'UnauthorizedOperation은 드라이버가 클라우드 API를 부를 권한이 없다는 뜻입니다. 권한을 연결해야 디스크가 만들어집니다. WaitForFirstConsumer는 배치 순서의 문제이고, 크기나 requests는 권한과 무관합니다.',
    },
    {
      q: 'StorageClass가 WaitForFirstConsumer인데 PVC가 Pending이고, 메시지는 "waiting for first consumer to be created before binding"입니다. 그 PVC를 쓰는 Pod는 아직 만들지 않았습니다. 옳은 판단은?',
      options: [
        'CSI 드라이버가 고장 났으니 다시 설치한다',
        '정상 상태다. Pod가 만들어져 배치되면 그때 디스크가 생기고 Bound가 된다',
        'reclaimPolicy를 Retain으로 바꿔야 한다',
        'PVC를 지우고 PV를 직접 만들어야 한다',
      ],
      answer: 1, step: 5,
      why: 'WaitForFirstConsumer는 Pod가 노드에 배치될 때까지 디스크 생성을 미룹니다. 소비자가 없는 동안의 Pending은 설계된 동작입니다. 드라이버 고장이라면 ProvisioningFailed 같은 다른 메시지가 보입니다.',
    },
    {
      q: 'EBS PVC 하나를 붙인 Deployment를 replicas 3으로 늘렸습니다. 같은 노드의 두 Pod는 Running, 다른 노드의 Pod는 ContainerCreating이고 Multi-Attach error가 보입니다. 원인은?',
      options: [
        'ReadWriteOnce는 한 노드에만 붙으므로, 다른 노드의 Pod가 같은 디스크를 붙이지 못했다',
        'PVC 용량이 세 Pod에 모자란다',
        '다른 노드에 CSI 노드 플러그인이 없다',
        'ReadWriteOnce는 Pod 하나만 허용하므로 세 Pod 모두 실패해야 하는데 버그다',
      ],
      answer: 0, step: 6,
      why: 'RWO는 "한 노드"에서의 읽기 · 쓰기입니다. 같은 노드의 Pod는 함께 붙을 수 있지만 다른 노드는 거절됩니다. Pod 하나로 제한하는 것은 ReadWriteOncePod이고, 용량은 붙는지 여부와 무관합니다.',
    },
    {
      q: '여러 노드에 흩어진 웹 Pod들이 같은 정적 자산 디렉터리를 읽고 써야 합니다. 어떤 저장소가 맞을까요?',
      options: [
        'EBS PVC에 accessModes: [ReadWriteMany]만 적는다',
        'Pod마다 emptyDir를 붙인다',
        'StatefulSet의 volumeClaimTemplates를 쓴다',
        'EFS · Azure Files 같은 RWX 파일 스토리지 StorageClass로 PVC를 만든다',
      ],
      answer: 3, step: 7,
      why: '여러 노드가 같은 파일을 공유하려면 RWX를 지원하는 파일 스토리지가 필요합니다. 접근 모드는 드라이버가 지원해야 하므로 EBS에 RWX만 적으면 프로비저닝이 실패합니다. volumeClaimTemplates는 Pod마다 따로 디스크를 주므로 공유가 아닙니다.',
    },
    {
      q: '새 DB Pod가 "volume node affinity conflict"로 Pending입니다. 다른 AZ의 노드에는 자리가 넉넉하고, StorageClass는 Immediate입니다. 앞으로 같은 일을 막는 설정은?',
      options: [
        'reclaimPolicy를 Retain으로 바꾼다',
        'StorageClass의 volumeBindingMode를 WaitForFirstConsumer로 바꾼다',
        'PVC의 accessModes를 ReadWriteOncePod로 바꾼다',
        'Pod의 CPU requests를 0으로 만든다',
      ],
      answer: 1, step: 9,
      why: 'Immediate는 Pod가 어디로 갈지 모르는 채 디스크의 AZ를 먼저 정합니다. WaitForFirstConsumer는 스케줄러가 노드를 고른 뒤 그 AZ에 디스크를 만들게 합니다. reclaimPolicy는 삭제 시 동작, ReadWriteOncePod는 공유 범위일 뿐입니다.',
    },
    {
      q: 'AZ-a에 디스크가 있는 StatefulSet Pod가, AZ-a 노드들이 꽉 차서 Pending입니다. 노드 오토스케일러는 있는데 엉뚱하게 AZ-c에 노드를 늘렸습니다. 근본 대책으로 알맞은 것은?',
      options: [
        'PVC를 지우고 다시 만든다',
        'Pod의 toleration을 지운다',
        '상태 있는 워크로드용 노드 그룹을 AZ별로 나눠, 필요한 AZ에 노드를 늘릴 수 있게 한다',
        'HPA의 maxReplicas를 늘린다',
      ],
      answer: 2, step: 8,
      why: '블록 디스크는 AZ에 묶이므로 Pod는 그 AZ의 노드에만 갈 수 있습니다. 노드 그룹이 AZ별로 나뉘어 있어야 오토스케일러가 정확히 그 AZ에 노드를 늘릴 수 있습니다. PVC를 다시 만들면 데이터를 잃습니다.',
    },
    {
      q: '3노드 DB 클러스터를 StatefulSet으로 운영합니다. db-1이 노드 장애로 다른 노드에 다시 떴습니다. 무엇이 유지될까요?',
      options: [
        'Pod 이름 db-1과 자기 PVC data-db-1, 그리고 db-1.db 같은 DNS 이름',
        '무작위 새 이름과 새 빈 디스크',
        '같은 Pod IP 주소',
        'db-0의 디스크를 함께 쓰게 된다',
      ],
      answer: 0, step: 10,
      why: 'StatefulSet은 순번 이름과 Pod별 PVC를 고정하므로, 다시 뜬 db-1은 같은 이름으로 자기 디스크를 다시 붙이고 헤드리스 Service DNS 이름도 그대로입니다. Pod IP는 바뀔 수 있어서 이름으로 찾아야 합니다.',
    },
    {
      q: 'StatefulSet의 디스크를 20Gi에서 50Gi로 늘리려 합니다. volumeClaimTemplates의 값을 고치자 API가 거절했습니다. 옳은 방법은?',
      options: [
        'StatefulSet을 지우고 PVC도 지운 뒤 다시 만든다',
        '각 PVC의 storage 요청을 직접 50Gi로 늘리고, 템플릿은 StatefulSet을 다시 만들 때 맞춘다',
        'PV의 capacity 필드를 직접 50Gi로 고친다',
        'StorageClass의 parameters를 수정한다',
      ],
      answer: 1, step: 11,
      why: 'volumeClaimTemplates는 수정할 수 없으므로, allowVolumeExpansion이 켜진 상태에서 이미 만들어진 PVC를 하나씩 늘립니다. PVC를 지우면 데이터가 사라질 수 있고, PV를 직접 고쳐도 실제 디스크는 커지지 않습니다.',
    },
    {
      q: '네임스페이스를 지웠다가 운영 볼륨까지 잃을 뻔했습니다. 같은 실수를 줄이려면 무엇을 바꿔야 할까요?',
      options: [
        'PVC의 accessModes를 RWX로 바꾼다',
        'volumeBindingMode를 Immediate로 바꾼다',
        'StatefulSet 대신 Deployment를 쓴다',
        '운영용 StorageClass의 reclaimPolicy를 Retain으로 두고, 네임스페이스 삭제 권한을 좁힌다',
      ],
      answer: 3, step: 12,
      why: 'reclaim policy가 Delete면 PVC 삭제가 디스크 삭제로 이어집니다. Retain이면 디스크가 Released로 남아 되살릴 수 있고, RBAC로 삭제 권한을 좁히면 실수 자체가 줄어듭니다. 접근 모드나 바인딩 모드는 삭제 동작과 무관합니다.',
    },
    {
      q: 'PVC를 매일 VolumeSnapshot으로 찍고 있습니다. 운영 PostgreSQL을 이 스냅샷만으로 백업한다고 할 때 가장 큰 위험은?',
      options: [
        '스냅샷은 쓰는 중인 DB의 일관성을 보장하지 않아, 복원 시 복구 작업이 필요하거나 일부가 깨질 수 있다',
        '스냅샷은 PVC 크기의 두 배 비용이 든다',
        '스냅샷은 다른 AZ에서 복원할 수 없다',
        '스냅샷을 찍는 동안 Pod가 반드시 재시작된다',
      ],
      answer: 0, step: 13,
      why: '디스크 스냅샷은 갑자기 전원을 끈 것과 같은 상태라, DB 자체 백업이나 쓰기 멈춤과 함께 써야 일관성이 보장됩니다. 클라우드 스냅샷은 대개 증분 저장이고, 복원한 PVC는 다른 AZ에 만들 수도 있습니다.',
    },
    {
      q: 'AKS에서 여러 Pod가 공유할 볼륨이 필요하고, GKE에서는 DB용 블록 디스크가 필요합니다. 각각 알맞은 조합은?',
      options: [
        'AKS: Azure Disk, GKE: Filestore',
        'AKS: Azure Files, GKE: Persistent Disk',
        'AKS: Azure Disk, GKE: Persistent Disk',
        'AKS: Azure Files, GKE: Filestore',
      ],
      answer: 1, step: 14,
      why: '공유(RWX)에는 파일 스토리지인 Azure Files, DB용 블록 디스크(RWO)에는 Persistent Disk가 맞습니다. Azure Disk와 Persistent Disk는 블록 디스크라 여러 노드 공유가 안 되고, Filestore는 파일 스토리지라 DB 데이터에는 알맞지 않습니다.',
    },
  ],
};
