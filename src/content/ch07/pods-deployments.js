export default {
  id: 'pods-deployments',
  learn: [
    'Pod: 컨테이너를 묶어 IP 하나를 주는 최소 단위',
    'Pod의 수명: phase · 재시작 · CrashLoopBackOff',
    'Pod는 일회용: 직접 만들면 복구되지 않는 이유',
    'ReplicaSet과 라벨 · 셀렉터로 개수 지키기',
    'Deployment: template이 바뀌면 ReplicaSet을 교체',
    'get · describe · events로 세 겹을 읽는 법',
  ],
  legend: [['ctrl', '생성 · 감시'], ['req', '요청'], ['res', '상태 보고'], ['bad', '삭제 · 종료 · 실패']],
  metrics: [
    { id: 'want', label: '선언한 개수', icon: 'file-code' },
    { id: 'have', label: '실행 중 Pod', icon: 'boxes' },
    { id: 'heal', label: 'Pod 복구', icon: 'heart-pulse' },
    { id: 'ver', label: '이미지 버전', icon: 'tag' },
  ],
  codes: {
    pod: {
      title: 'pod.yaml', lang: 'yaml',
      text: `apiVersion: v1
kind: Pod
metadata:
  name: api
  labels:
    app: api
spec:
  containers:
    - name: api
      image: shop/api:1.4
      ports:
        - containerPort: 3000
`,
    },
    crash: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl get pod api
NAME  READY  STATUS           RESTARTS
api   0/1    CrashLoopBackOff 6

$ kubectl logs api --previous
Error: DB_HOST is not set
    at loadConfig (config.js:12)

$ kubectl describe pod api
Last State:  Terminated
  Reason:    Error
  Exit Code: 1`,
    },
    bare: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl apply -f pod.yaml
pod/api created
$ kubectl get pods -o wide
NAME  STATUS   IP          NODE
api   Running  10.244.1.7  worker-1

# 며칠 뒤: worker-1이 새 노드로 교체됨
$ kubectl get pods
No resources found in default namespace.`,
    },
    rs: {
      title: 'replicaset.yaml', lang: 'yaml',
      text: `apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: api
spec:
  replicas: 3          # 지킬 개수
  selector:
    matchLabels:
      app: api         # 세는 대상
  template:            # Pod의 틀
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: shop/api:1.4
          ports:
            - containerPort: 3000
`,
    },
    heal: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl delete pod api-x2k4q
pod "api-x2k4q" deleted

$ kubectl get pods -o wide
NAME       STATUS   AGE  IP
api-8hw5n  Running  12m  10.244.1.8
api-tq9zc  Running  12m  10.244.2.5
api-m4v7d  Running  4s   10.244.2.9`,
    },
    deploy: {
      title: 'deployment.yaml', lang: 'yaml',
      text: `apiVersion: apps/v1
kind: Deployment       # 이 줄만 다르다
metadata:
  name: api
spec:
  replicas: 3          # 지킬 개수
  selector:
    matchLabels:
      app: api         # 세는 대상
  template:            # Pod의 틀
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: shop/api:1.5
          ports:
            - containerPort: 3000
`,
    },
    tree: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl get deploy,rs,pods
NAME                  READY  UP-TO-DATE
deployment.apps/api   3/3    3

NAME                           DESIRED
replicaset.apps/api-5f6d8c7b9  3
replicaset.apps/api-7c9d8f6b5  0

NAME                     READY  STATUS
pod/api-5f6d8c7b9-2xkqp  1/1    Running
pod/api-5f6d8c7b9-9mz4t  1/1    Running
pod/api-5f6d8c7b9-hw7c8  1/1    Running`,
    },
    quota: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl get deploy api -n stg
NAME  READY  UP-TO-DATE  AVAILABLE
api   0/3    0           0

$ kubectl get pods -n stg
No resources found in stg namespace.

$ kubectl describe rs -n stg
Events:
  Warning  FailedCreate
  pods "api-5f6d8c7b9-…" is
  forbidden: exceeded quota:
  stg-quota, requested:
  requests.cpu=500m, used:
  requests.cpu=2, limited:
  requests.cpu=2`,
    },
  },
  scene: {
    zones: {
      pod: { at: [1.3, 3.2], size: [3.4, 4.4], label: 'Pod · 10.244.1.7', color: 'teal', labelPos: 'back' },
    },
    nodes: {
      dev: { kind: 'client', at: [-0.6, 5.6], label: '개발자 · kubectl' },
      kl: { kind: 'tile', at: [5.2, 7.0], label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
      c_api: { kind: 'tile', at: [2.1, 6.3], label: 'api 컨테이너', icon: 'container', color: 'blue' },
      c_side: { kind: 'tile', at: [3.9, 4.5], label: '로그 수집기', sub: '사이드카', icon: 'scroll', color: 'slate' },
      // 옛 ReplicaSet (이미지 1.4)과 그 Pod
      rs: { at: [0.8, 4.0], label: 'ReplicaSet', sub: 'api', icon: 'copy', color: 'yellow' },
      p4: { at: [0.5, 8.1], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      p1: { at: [1.6, 7.0], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      p2: { at: [2.7, 5.9], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      p3: { at: [3.8, 4.8], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      p5: { at: [4.9, 3.7], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      // Deployment와 새 ReplicaSet (이미지 1.5)
      dep: { at: [2.2, -2.2], label: 'Deployment', sub: 'api', icon: 'layers', color: 'teal' },
      rs2: { at: [4.6, 0.2], label: 'ReplicaSet', sub: '이미지 1.5', icon: 'copy', color: 'yellow' },
      n1: { at: [5.4, 3.2], size: 's', label: 'Pod', sub: 'api:1.5', icon: 'box', color: 'green' },
      n2: { at: [6.5, 2.1], size: 's', label: 'Pod', sub: 'api:1.5', icon: 'box', color: 'green' },
      n3: { at: [7.6, 1.0], size: 's', label: 'Pod', sub: 'api:1.5', icon: 'box', color: 'green' },
    },
    edges: {
      e_apply: { from: 'dev', to: 'c_api', style: 'dashed' },
      e_kl: { from: 'kl', to: 'c_api', bi: true },
      e_local: { from: 'c_side', to: 'c_api' },
      e_bare: { from: 'dev', to: 'p2', style: 'dashed' },
      e_r1: { from: 'rs', to: 'p1' },
      e_r2: { from: 'rs', to: 'p2' },
      e_r3: { from: 'rs', to: 'p3' },
      e_r4: { from: 'rs', to: 'p4' },
      e_r5: { from: 'rs', to: 'p5' },
      e_d1: { from: 'dep', to: 'rs' },
      e_d2: { from: 'dep', to: 'rs2' },
      e_n1: { from: 'rs2', to: 'n1' },
      e_n2: { from: 'rs2', to: 'n2' },
      e_n3: { from: 'rs2', to: 'n3' },
    },
  },
  steps: [
    {
      key: 'Pod', kind: 'problem', title: 'Pod: 컨테이너를 감싸는 첫 겹',
      body: [
        'api 이미지를 클러스터에 올릴 차례입니다. 그런데 쿠버네티스에는 "컨테이너"라는 오브젝트가 없습니다. 만들고, 노드에 배치하고, 지우는 가장 작은 단위는 <b>Pod</b>입니다.',
        'Pod는 <b>하나 이상의 컨테이너를 묶은 포장</b>입니다. 스케줄러는 Pod 단위로 노드를 고르고, Pod마다 클러스터 안에서 통하는 <b>자기 IP</b>를 하나 받습니다. 대부분의 Pod에는 컨테이너가 하나만 들어 있어요.',
      ],
      callout: { type: 'key', text: '컨테이너를 왜 한 겹 더 쌀까요? 네트워크와 저장소를 <b>함께 쓰고</b>, 함께 뜨고 함께 사라지는 단위가 필요하기 때문입니다. 다음 단계에서 Pod 안을 봅니다.' },
      code: { ref: 'pod', hl: [2, 8, 9, 10] },
      show: ['dev', 'pod', 'c_api'],
      tags: [{ on: 'dev', text: 'kubectl apply', icon: 'terminal' }],
      flows: [{ path: ['dev', 'c_api'], kind: 'ctrl', n: 2 }],
      metrics: { want: ['선언 없음', 'warn'], have: '1', heal: '—', ver: '1.4' },
      more: [
        {
          title: '매니페스트 읽기',
          list: [
            '<code>apiVersion: v1</code>: Pod는 가장 기본인 core 그룹에 속합니다. Deployment는 <code>apps/v1</code>이에요.',
            '<code>metadata</code>: 이름, 네임스페이스, 라벨처럼 "이것이 무엇인가"를 적습니다.',
            '<code>spec.containers</code>: 목록입니다. 컨테이너마다 이름, 이미지, 열어 둘 포트를 적어요.',
            '<code>containerPort</code>는 정보용 표시입니다. 적지 않아도 컨테이너가 듣는 포트로는 연결이 됩니다. 그래도 적어 두면 읽는 사람과 도구가 알 수 있어요.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['필드 설명은 클러스터에 물어볼 수 있고, 잠깐 시험할 Pod는 한 줄로 만들 수 있습니다.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl explain pod.spec.containers.ports
FIELD: ports <[]ContainerPort>
DESCRIPTION:
    List of ports to expose from the container...

$ kubectl run tmp --image=busybox:1.36 \\
    --rm -it --restart=Never -- sh
/ # wget -qO- http://10.244.1.7:3000/health
ok`,
          },
        },
        {
          title: '실무 팁',
          body: ['이미지는 <code>latest</code> 대신 <code>1.4</code>처럼 버전 태그나 다이제스트로 고정하세요. 같은 매니페스트가 언제 어디서 실행돼도 같은 이미지를 받아야, 노드마다 다른 버전이 도는 일이 생기지 않습니다.'],
        },
      ],
    },
    {
      key: '한 Pod 안', kind: 'concept', title: '한 Pod의 컨테이너는 IP를 함께 씁니다',
      body: [
        'Pod 안의 컨테이너들은 <b>네트워크 namespace를 공유</b>합니다. IP도 포트 공간도 하나라서 서로를 <code>localhost</code>로 부릅니다. 볼륨도 Pod에 선언해 여러 컨테이너가 함께 마운트할 수 있어요. 파일시스템과 프로세스는 컨테이너마다 따로입니다.',
        '그래서 본체 옆에 로그 수집기나 프록시 같은 보조 컨테이너를 붙이는 <b>사이드카</b> 구성이 가능합니다. 둘은 언제나 같은 노드에서 함께 뜨고 함께 사라집니다.',
      ],
      callout: { type: 'warn', text: 'api와 DB를 한 Pod에 넣지 마세요. Pod는 <b>통째로 복제되는 단위</b>라 api를 3개로 늘리면 DB도 3개가 됩니다. "늘 붙어 다녀야 하는가"가 한 Pod에 넣는 기준입니다.' },
      hide: ['dev'],
      show: ['c_side'],
      panel: {
        title: 'Pod 안에서 함께 쓰는 것', icon: 'box',
        rows: [['IP · 포트 공간', '함께', 'ok'], ['볼륨', '마운트하면 함께', 'ok'], ['노드 · 수명', '함께', 'ok'], ['파일시스템 · 프로세스', '따로', 'mute']],
      },
      tags: [
        { on: 'c_api', text: ':3000에서 대기', tone: 'info' },
        { on: 'c_side', text: 'localhost:3000 호출', tone: 'ok', pos: 'right', dx: 6, dy: 20 },
      ],
      flows: [{ path: ['c_side', 'c_api'], kind: 'req', n: 2 }],
      more: [
        {
          title: '동작 원리',
          body: [
            'Pod가 뜨면 런타임은 먼저 작은 <b>샌드박스</b>(흔히 pause 컨테이너)를 만들어 네트워크 namespace를 잡아 둡니다. 그 뒤 앱 컨테이너들이 이 namespace에 들어가요. 그래서 컨테이너 하나가 재시작돼도 Pod의 IP는 그대로입니다.',
            '같은 포트 공간을 쓰므로 두 컨테이너가 같은 포트를 들으면 충돌합니다. 사이드카는 다른 포트를 써야 해요.',
          ],
        },
        {
          title: '설정 예시',
          body: ['로그 파일을 사이드카와 나눠 쓰는 Pod입니다. <code>emptyDir</code>는 Pod와 수명이 같은 임시 볼륨이에요.'],
          code: {
            title: 'pod 일부', lang: 'yaml',
            text: `spec:
  volumes:
    - name: logs
      emptyDir: {}
  containers:
    - name: api
      image: shop/api:1.4
      volumeMounts:
        - { name: logs, mountPath: /var/log/api }
    - name: log-shipper
      image: fluent/fluent-bit:3.0
      volumeMounts:
        - { name: logs, mountPath: /logs }`,
          },
        },
        {
          title: '한 Pod에 넣을까, 나눌까',
          list: [
            '<b>함께</b>: 로그 수집기, 서비스 메시 프록시, 설정 파일을 받아 오는 보조 프로그램처럼 본체 없이는 의미 없는 것.',
            '<b>따로</b>: DB, 캐시, 다른 팀의 서비스처럼 개수 · 배포 주기 · 수명이 다른 것.',
            '본체가 뜨기 전에 한 번만 할 일(DB 마이그레이션 확인 등)은 <b>init 컨테이너</b>에 둡니다. 끝까지 성공해야 앱 컨테이너가 시작돼요.',
          ],
        },
      ],
    },
    {
      key: 'Pod 수명', kind: 'concept', title: 'Pod의 수명: phase와 컨테이너 상태',
      body: [
        'Pod에는 큰 단계를 나타내는 <b>phase</b>가 있습니다. 승인됐지만 아직 실행 전이면 <code>Pending</code>, 컨테이너가 하나라도 돌면 <code>Running</code>, 모두 끝나면 <code>Succeeded</code>나 <code>Failed</code>입니다.',
        '노드의 <b>kubelet</b>이 컨테이너마다 <code>Waiting</code> · <code>Running</code> · <code>Terminated</code> 상태를 관찰해 API 서버에 보고하고, phase는 그것을 요약한 값이에요.',
      ],
      callout: { type: 'tip', text: '<code>kubectl get pods</code>의 STATUS 칸은 phase 그대로가 아닙니다. <code>ContainerCreating</code>, <code>CrashLoopBackOff</code>처럼 <b>더 구체적인 이유</b>를 보여 줍니다.' },
      show: ['kl'],
      set: { c_api: { badge: 'Running', tone: 'ok' } },
      panel: {
        title: 'Pod phase', icon: 'activity',
        rows: [
          ['Pending', '승인됨 · 아직 실행 전', 'warn'],
          ['Running', '하나 이상 실행 중', 'ok'],
          ['Succeeded', '모두 정상 종료', 'info'],
          ['Failed', '하나 이상 실패로 종료', 'bad'],
          ['Unknown', '노드와 연락이 끊김', 'mute'],
        ],
      },
      tags: [{ on: 'kl', text: 'status 보고', tone: 'info', pos: 'bottom' }],
      flows: [
        { path: ['kl', 'c_api'], kind: 'ctrl' },
        { path: ['c_api', 'kl'], kind: 'res', n: 2, delay: 0.8 },
      ],
      more: [
        {
          title: '흐름으로 보기',
          body: [
            'Pod가 만들어지면 <code>Pending</code>입니다. 노드 배정을 기다리는 동안도, 노드가 정해져 이미지를 받는 동안도 Pending이에요. 컨테이너가 시작되면 <code>Running</code>이 되고, 웹 서버처럼 끝나지 않는 앱은 여기 머뭅니다.',
            '배치 작업처럼 끝나는 컨테이너는 모두 종료 코드 0이면 <code>Succeeded</code>, 하나라도 실패로 끝나고 다시 시작하지 않으면 <code>Failed</code>가 됩니다. Running이어도 앱이 요청을 받을 준비가 됐다는 뜻은 아닙니다. 그건 READY 칸과 프로브가 말해 주고, 롤링 업데이트 레슨에서 다룹니다.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pod api -o jsonpath='{.status.phase}'
Running

$ kubectl get pod api -o jsonpath=\\
'{.status.containerStatuses[0].state}'
{"running":{"startedAt":"2026-11-18T01:02:03Z"}}

$ kubectl get pods
NAME   READY  STATUS             RESTARTS
api    1/1    Running            0
job-1  0/1    Completed          0
web    0/1    ContainerCreating  0`,
          },
        },
        {
          title: '출력 읽기',
          list: [
            '<code>READY 1/1</code>: 컨테이너 1개 중 1개가 준비됨. 사이드카가 있으면 <code>2/2</code>처럼 보입니다.',
            '<code>Completed</code>: phase가 Succeeded인 Pod를 kubectl이 이렇게 보여 줍니다.',
            '<code>ContainerCreating</code>: phase는 Pending이고, 노드에서 이미지 받기나 볼륨 연결을 하는 중입니다. 오래 머물면 describe의 이벤트를 봅니다.',
            '<code>Terminating</code>: 삭제 요청을 받아 종료 신호(SIGTERM)를 보내고 기다리는 중입니다. 기본 유예 시간은 30초예요.',
          ],
        },
      ],
    },
    {
      key: '재시작 반복', kind: 'case', title: '사례: STATUS가 CrashLoopBackOff',
      body: [
        '새 api Pod가 <code>CrashLoopBackOff</code>를 보이고 RESTARTS가 계속 늘어납니다. 컨테이너가 시작하자마자 종료되고, kubelet은 <code>restartPolicy: Always</code>(기본값)에 따라 같은 Pod 안에서 다시 시작하는데, 실패할 때마다 <b>기다리는 간격을 늘리는</b> 중이에요.',
        '쿠버네티스는 제 일을 다 했습니다. 원인은 앱 쪽이라 <code>logs --previous</code>로 직전에 죽은 컨테이너의 로그를 봅니다. 여기서는 <code>DB_HOST</code> 환경 변수가 빠져 있었어요.',
      ],
      callout: { type: 'tip', text: '<code>--previous</code>가 없으면 지금 막 다시 뜬 컨테이너의 로그(대개 비어 있음)를 봅니다. 종료 코드도 단서입니다. 1은 앱 오류, 137은 강제 종료(메모리 초과가 흔함)예요.' },
      code: { ref: 'crash', hl: [3, 5, 6, 11, 12] },
      hide: ['c_side'],
      set: { c_api: { state: 'down', badge: '재시작 6회', tone: 'bad' } },
      tags: [{ on: 'kl', text: '10초 → 20초 → …', tone: 'warn', pos: 'bottom' }],
      flows: [
        { path: ['kl', 'c_api'], kind: 'ctrl', n: 3, gap: 1.2 },
        { path: ['c_api', 'kl'], kind: 'bad', n: 3, gap: 1.2, delay: 0.6 },
      ],
      metrics: { have: ['0 / 1 Ready', 'bad'], heal: ['재시작 반복', 'warn'] },
      changes: [['~', 'RESTARTS 0 → 6'], ['~', '재시작 간격: 점점 길게'], ['-', '원인: 빠진 환경 변수']],
      more: [
        {
          title: '동작 원리',
          body: [
            '컨테이너가 끝나면 kubelet은 <code>restartPolicy</code>를 봅니다. <code>Always</code>는 항상, <code>OnFailure</code>는 실패했을 때만, <code>Never</code>는 다시 시작하지 않아요. Deployment가 만드는 Pod는 Always만 쓸 수 있습니다.',
            '연달아 실패하면 재시작 사이의 대기 시간이 10초, 20초, 40초…로 두 배씩 늘어 최대 5분까지 갑니다. 그 기다리는 상태가 <b>CrashLoopBackOff</b>예요. 한동안(약 10분) 문제없이 돌면 대기 시간이 처음으로 돌아갑니다. Pod 자체는 그대로라 이름과 IP도 바뀌지 않습니다.',
          ],
        },
        {
          title: '종료 코드로 좁히기',
          rows: [
            ['Exit 1 · Error', '앱이 스스로 종료: 로그 확인', 'bad'],
            ['Exit 137 · OOMKilled', '메모리 한도 초과로 강제 종료', 'bad'],
            ['Exit 143', 'SIGTERM으로 종료 (정상 종료 과정)', 'info'],
            ['Exit 0 · Completed', '정상 종료인데 웹 서버라면 이상', 'warn'],
          ],
        },
        {
          title: '흔한 원인',
          list: [
            '필요한 환경 변수 · 설정 파일 · Secret이 없음 (ConfigMap과 Secret 레슨).',
            '시작할 때 DB에 접속하다 실패하고 바로 종료함. 재시도 로직이 없는 앱에서 흔합니다.',
            '이미지의 실행 명령이 잘못돼 곧바로 끝남. 포그라운드로 계속 도는 프로세스가 컨테이너의 주 프로세스여야 합니다.',
            '메모리 한도가 너무 낮아 OOMKilled. 한도 설정은 스케줄링 레슨에서 봅니다.',
          ],
        },
      ],
    },
    {
      key: '맨몸 Pod', kind: 'case', title: '사례: 직접 만든 Pod는 돌아오지 않습니다',
      body: [
        '한 팀이 <code>pod.yaml</code>로 만든 Pod 하나로 서비스를 열었습니다. 며칠 뒤 클러스터 업그레이드로 노드가 교체되자 Pod가 사라졌고, 아침까지 아무도 몰랐습니다.',
        '컨테이너 프로세스가 죽는 정도라면 방금 본 것처럼 kubelet이 같은 Pod 안에서 다시 시작합니다. 하지만 Pod가 지워지거나 노드가 사라지면 다릅니다. Pod는 <b>일회용</b>이고, 직접 만든 Pod를 다시 만들어 줄 주체는 클러스터 어디에도 없습니다.',
      ],
      callout: { type: 'key', text: '빠진 것은 "이 Pod가 <b>몇 개 있어야 한다</b>"는 선언입니다. 조정 루프는 선언된 상태가 있어야 돕니다. Pod를 직접 만드는 것은 잠깐의 디버깅 때뿐입니다.' },
      code: { ref: 'bare', hl: [1, 5, 9] },
      hide: ['pod', 'c_api', 'kl'],
      show: ['dev', 'p2'],
      set: { c_api: { state: null, badge: null }, p2: { state: 'down' } },
      tags: [{ on: 'p2', text: '다시 만들 주체 없음', tone: 'bad', pos: 'bottom' }],
      flows: [{ path: ['dev', 'p2'], kind: 'bad', n: 2 }],
      metrics: { have: ['0', 'bad'], heal: ['아무도 안 함', 'bad'] },
      changes: [['-', '노드 교체와 함께 Pod 삭제'], ['~', '선언한 개수가 없어 복구도 없음']],
      more: [
        {
          title: '두 가지 복구를 구별하기',
          rows: [
            ['컨테이너가 죽음', 'kubelet이 같은 Pod에서 재시작', 'ok'],
            ['Pod가 지워짐', '컨트롤러가 있어야 새로 만듦', 'warn'],
            ['노드가 사라짐', '컨트롤러가 다른 노드에 새로 만듦', 'warn'],
            ['맨몸 Pod', '어느 경우에도 새로 만들 주체 없음', 'bad'],
          ],
        },
        {
          title: '동작 원리',
          body: [
            'Pod는 한 번 노드에 배정되면 그 노드에 묶입니다. 노드가 사라지면 Pod를 "옮기는" 기능은 없고, 오직 <b>새 Pod를 다른 곳에 만드는</b> 길만 있어요. 그 일을 하는 것이 ReplicaSet · StatefulSet · DaemonSet · Job 같은 워크로드 컨트롤러입니다.',
            '노드를 비우는 <code>kubectl drain</code>도 맨몸 Pod를 만나면 기본적으로 멈추고 경고합니다. 지우면 돌아오지 않기 때문이에요. <code>--force</code>를 붙여야 지우고 진행합니다.',
          ],
        },
        {
          title: '그럼 언제 쓰나',
          list: [
            '네트워크나 DNS를 확인하려고 잠깐 띄우는 디버깅용 Pod(<code>kubectl run --rm -it</code>).',
            '그 밖에는 목적에 맞는 컨트롤러를 씁니다. 늘 떠 있는 앱은 Deployment, 데이터를 가진 앱은 StatefulSet, 노드마다 하나는 DaemonSet, 끝나는 작업은 Job입니다.',
          ],
        },
      ],
    },
    {
      key: 'ReplicaSet', kind: 'solution', title: 'ReplicaSet: 개수를 지키는 둘째 겹',
      body: [
        '<b>ReplicaSet</b>은 "이런 Pod가 <b>N개</b> 있어야 한다"는 선언입니다. <code>replicas</code>에 개수를, <code>template</code>에 Pod를 찍어낼 틀을 적습니다. template 아래는 앞의 pod.yaml과 같은 내용이에요.',
        'ReplicaSet 컨트롤러는 조건에 맞는 Pod를 세어 보고, 모자라면 template으로 새로 만들고 남으면 지웁니다. 사람이 Pod를 만드는 일은 끝났습니다. 우리는 개수만 선언합니다.',
      ],
      callout: { type: 'tip', text: 'Pod 이름은 <code>api-x2k4q</code>처럼 뒤에 무작위 글자가 붙습니다. 이름도 IP도 매번 달라지니 Pod 하나하나를 기억하려 하지 마세요.' },
      code: { ref: 'rs', hl: [2, 6, 10, 14, 15, 16, 17] },
      hide: ['dev'],
      show: ['rs', 'p1', 'p3'],
      set: { p2: { state: null } },
      tags: [{ on: 'rs', text: 'replicas: 3', tone: 'accent' }],
      flows: [
        { path: ['rs', 'p1'], kind: 'ctrl' },
        { path: ['rs', 'p2'], kind: 'ctrl', delay: 0.3 },
        { path: ['rs', 'p3'], kind: 'ctrl', delay: 0.6 },
      ],
      metrics: { want: 'replicas: 3', have: ['3 / 3', 'ok'], heal: ['자동', 'ok'] },
      changes: [['+', 'ReplicaSet api (replicas: 3)'], ['~', 'Pod 생성: 사람 → 컨트롤러']],
      more: [
        {
          title: '동작 원리',
          body: [
            'ReplicaSet 컨트롤러가 세는 것은 "셀렉터에 맞고, 아직 지워지는 중이 아닌 Pod"입니다. 모자라면 한 번에 여러 개를 만들고, 남으면 지울 Pod를 고릅니다. 이때 아직 준비되지 않은 Pod나 막 생긴 Pod를 먼저 지우는 식으로 서비스에 덜 영향이 가게 고릅니다.',
            '만들어진 Pod의 이름은 ReplicaSet 이름 뒤에 무작위 다섯 글자를 붙인 것이고, <code>ownerReferences</code>에 이 ReplicaSet이 주인으로 적힙니다.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl apply -f replicaset.yaml
replicaset.apps/api created

$ kubectl get rs api
NAME  DESIRED  CURRENT  READY  AGE
api   3        3        3      40s

$ kubectl scale rs api --replicas=5
$ kubectl get rs api
NAME  DESIRED  CURRENT  READY  AGE
api   5        5        3      55s`,
          },
        },
        {
          title: '출력 읽기',
          list: [
            '<code>DESIRED</code>: 선언한 개수(spec.replicas).',
            '<code>CURRENT</code>: 지금 만들어져 있는 Pod 수. 늘린 직후에는 금방 DESIRED와 같아집니다.',
            '<code>READY</code>: 그중 준비된 Pod 수. 컨테이너 시작이 끝날 때까지 뒤처지고, 세 숫자가 모두 같아지면 끝난 것이에요.',
          ],
        },
      ],
    },
    {
      key: '라벨 · 셀렉터', kind: 'concept', title: '라벨과 셀렉터: "내 Pod"를 찾는 법',
      body: [
        'ReplicaSet은 자기 Pod를 어떻게 알아볼까요? Pod에는 <code>app: api</code> 같은 <b>라벨</b>(키-값 이름표)이 붙고, ReplicaSet은 <b>셀렉터</b>로 "이 라벨을 가진 Pod"를 고릅니다. 이름이나 IP가 아니라 라벨로 묶이는 느슨한 관계예요.',
        '그래서 <code>selector.matchLabels</code>와 <code>template</code>의 <code>labels</code>는 반드시 맞아야 합니다. 어긋나면 API 서버가 오브젝트를 거부합니다.',
      ],
      callout: { type: 'tip', text: '다음 레슨의 Service도 똑같이 라벨 셀렉터로 Pod를 찾습니다. 라벨은 쿠버네티스에서 오브젝트를 잇는 <b>거의 유일한 끈</b>입니다.' },
      code: { ref: 'rs', hl: [7, 8, 9, 12, 13] },
      tags: [
        { on: 'rs', text: 'selector: app=api', tone: 'accent' },
        { on: 'p1', text: 'app=api', tone: 'ok', pos: 'bottom' },
        { on: 'p2', text: 'app=api', tone: 'ok', pos: 'bottom' },
        { on: 'p3', text: 'app=api', tone: 'ok', pos: 'bottom' },
      ],
      flows: [
        { path: ['rs', 'p1'], kind: 'ctrl' },
        { path: ['rs', 'p2'], kind: 'ctrl', delay: 0.2 },
        { path: ['rs', 'p3'], kind: 'ctrl', delay: 0.4 },
      ],
      more: [
        {
          title: '셀렉터의 두 가지 꼴',
          body: ['<code>matchLabels</code>는 "이 값과 같은가", <code>matchExpressions</code>는 "이 값들 중 하나인가 · 아닌가 · 키가 있는가"를 묻습니다. 둘을 함께 쓰면 모두 만족해야 해요.'],
          code: {
            title: 'selector 예시', lang: 'yaml',
            text: `selector:
  matchLabels:
    app: api
  matchExpressions:
    - key: tier
      operator: In          # In · NotIn · Exists
      values: [backend, worker]`,
          },
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pods --show-labels
NAME       STATUS   LABELS
api-8hw5n  Running  app=api,pod-template-hash=…
web-q2x9d  Running  app=web,pod-template-hash=…

$ kubectl get pods -l app=api
$ kubectl get pods -l 'app in (api,web)'
$ kubectl get pods -L app,version`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '라벨 값의 오타 하나로 셀렉터가 아무것도 고르지 못합니다. 오류 없이 "0개"가 될 뿐이라 알아채기 어려워요.',
            '셀렉터에 맞는 맨몸 Pod가 이미 있으면 ReplicaSet이 그것을 <b>자기 것으로 입양</b>해 셉니다. 개수가 넘치면 그중 하나를 지울 수도 있어요.',
            '키와 값은 각각 63자까지입니다. 팀 공통으로 <code>app.kubernetes.io/name</code>, <code>app.kubernetes.io/version</code> 같은 권장 라벨을 쓰면 도구들이 알아봅니다.',
          ],
        },
      ],
    },
    {
      key: '자가 복구', kind: 'solution', title: 'Pod를 지워도 다시 세 개가 됩니다',
      body: [
        'Pod 하나를 일부러 지워 봅니다. ReplicaSet 컨트롤러는 셀렉터에 맞는 Pod가 2개뿐인 것을 보고 곧바로 template으로 새 Pod를 만듭니다. 몇 초 뒤에는 다시 3개입니다.',
        '새 Pod는 죽은 Pod를 고친 것이 아니라 <b>처음부터 새로 만든 것</b>입니다. 이름도 IP도 다르고, 다른 노드에 놓일 수도 있어요. 노드가 통째로 죽었을 때 대체 Pod가 생기는 것도 같은 원리입니다.',
      ],
      callout: { type: 'warn', text: '컨테이너 안에 써 둔 파일은 Pod와 함께 사라집니다. 그리고 IP가 이렇게 바뀌니 다른 앱이 Pod IP를 직접 부르면 안 됩니다. 이 문제는 다음 레슨의 Service가 풉니다.' },
      code: { ref: 'heal', hl: [1, 2, 8] },
      show: ['p4'],
      set: { p3: { state: 'down' }, p4: { state: 'ok' } },
      tags: [
        { on: 'p3', text: '삭제됨', tone: 'bad', pos: 'bottom' },
        { on: 'p4', text: '새 이름 · 새 IP', tone: 'ok', pos: 'bottom' },
      ],
      flows: [{ path: ['rs', 'p3'], kind: 'bad' }, { path: ['rs', 'p4'], kind: 'ctrl', n: 2, delay: 0.9 }],
      metrics: { have: ['2 → 3', 'ok'], heal: ['자동 · 몇 초', 'ok'] },
      changes: [['-', 'api-x2k4q (10.244.1.7)'], ['+', 'api-m4v7d (10.244.2.9)']],
      more: [
        {
          title: '출력 읽기',
          body: ['<code>-w</code>로 지켜보면 지우는 Pod와 새 Pod가 겹쳐 보입니다. 옛 Pod가 종료 유예 시간 동안 <code>Terminating</code>인 사이에 새 Pod는 이미 만들어져요. 컨트롤러는 지워지는 중인 Pod를 세지 않기 때문입니다.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pods -w
NAME       READY  STATUS             AGE
api-x2k4q  1/1    Terminating        12m
api-m4v7d  0/1    Pending            0s
api-m4v7d  0/1    ContainerCreating  0s
api-m4v7d  1/1    Running            3s
api-x2k4q  0/1    Terminating        12m`,
          },
        },
        {
          title: '실무 팁',
          list: [
            '"Pod를 지워서 재시작"은 흔히 쓰는 방법이지만, Deployment라면 <code>kubectl rollout restart</code>가 한 번에 하나씩 차례로 바꿔 줘서 더 안전합니다.',
            '자가 복구는 같은 문제도 되살립니다. 설정이 잘못된 Pod는 새로 만들어도 또 실패해요. 그럴 땐 지우기보다 원인을 고칩니다.',
            '데이터를 남겨야 하는 앱은 Pod 밖의 저장소가 필요합니다. PV · PVC 레슨에서 다룹니다.',
          ],
        },
      ],
    },
    {
      key: 'Pod 격리', kind: 'solution', title: '라벨을 떼어 Pod를 격리하기',
      body: [
        '한 Pod만 이상하게 느립니다. 지우면 증거도 사라지죠. 대신 그 Pod의 <code>app=api</code> 라벨을 떼면 ReplicaSet은 더 이상 그 Pod를 세지 않고, 모자란 하나를 <b>새로 만듭니다</b>.',
        '떼어 낸 Pod는 지워지지 않고 그대로 돕니다. Service도 라벨로 Pod를 고르니 트래픽도 끊겨, 서비스에 영향 없이 차분히 들여다볼 수 있어요.',
      ],
      callout: { type: 'warn', text: '격리한 Pod는 이제 어떤 컨트롤러도 관리하지 않습니다. 조사가 끝나면 <b>직접 지워야</b> 자원이 새지 않아요.' },
      hide: ['p3', 'e_r1'],
      show: ['p5'],
      set: { p4: { state: null }, p1: { state: 'dim', sub: '격리됨' }, p5: { state: 'ok' } },
      tags: [
        { on: 'p1', text: 'app 라벨 뗌', tone: 'warn', pos: 'bottom' },
        { on: 'p5', text: '빈자리 채움', tone: 'ok', pos: 'bottom' },
      ],
      flows: [{ path: ['rs', 'p5'], kind: 'ctrl', n: 2 }],
      metrics: { have: ['3 + 1 격리', 'ok'] },
      changes: [['-', 'api-8hw5n: 관리 · 트래픽에서 빠짐'], ['+', 'api-r7k2p 새로 생성']],
      more: [
        {
          title: '동작 원리',
          body: [
            '라벨을 떼면 ReplicaSet 컨트롤러는 그 Pod가 셀렉터에 더 이상 맞지 않는 것을 보고 <code>ownerReferences</code>에서 자신을 지웁니다(관계 해제). 이제 그 Pod는 주인 없는 맨몸 Pod가 되고, 컨트롤러는 3개를 맞추려 새 Pod를 만듭니다.',
            '반대로 라벨을 다시 붙이면 ReplicaSet이 그 Pod를 다시 입양합니다. 그러면 4개가 되어 하나를 지우게 돼요.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['키 뒤에 <code>-</code>를 붙이면 라벨을 지웁니다. <code>-L app</code>으로 보면 APP 칸이 빈 Pod가 격리된 것이에요.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl label pod api-8hw5n app-
pod/api-8hw5n unlabeled

$ kubectl get pods -L app
NAME       STATUS   APP
api-8hw5n  Running
api-tq9zc  Running  api
api-m4v7d  Running  api
api-r7k2p  Running  api`,
          },
        },
        {
          title: '조사할 것',
          list: [
            '<code>kubectl exec -it api-8hw5n -- sh</code>로 들어가 프로세스, 연결, 디스크를 봅니다.',
            '<code>kubectl logs api-8hw5n</code>, <code>kubectl describe pod api-8hw5n</code>으로 재시작 이력과 이벤트를 봅니다.',
            '어느 노드에 있었는지(<code>-o wide</code>)도 기록하세요. 특정 노드에서만 생기는 문제일 수 있습니다.',
            '끝나면 <code>kubectl delete pod api-8hw5n</code>.',
          ],
        },
        {
          title: '흔한 실수',
          body: ['Deployment가 관리하는 Pod라면 <code>app</code> 대신 <code>pod-template-hash</code>를 떼도 ReplicaSet 셀렉터에서 빠집니다. 하지만 Service 셀렉터는 보통 <code>app</code>만 보므로 트래픽은 계속 들어와요. 트래픽까지 빼려면 Service가 쓰는 라벨을 떼야 합니다.'],
        },
      ],
    },
    {
      key: 'Deployment', kind: 'solution', title: 'Deployment: 버전을 바꾸는 셋째 겹',
      body: [
        '이미지를 1.5로 올리려고 ReplicaSet의 template을 고쳐도, 이미 떠 있는 Pod는 그대로입니다. ReplicaSet은 <b>개수</b>만 볼 뿐, 떠 있는 Pod가 template과 같은지는 따지지 않아요.',
        '<b>Deployment</b>는 ReplicaSet을 관리하는 한 겹 위의 오브젝트입니다. template이 바뀌면 <b>새 ReplicaSet</b>을 만들어 조금씩 늘리고, 옛 ReplicaSet은 그만큼 줄입니다. 옛것은 0개인 채로 남겨 두었다가 되돌릴 때 씁니다.',
      ],
      callout: { type: 'tip', text: '그래서 실무에서는 ReplicaSet도 직접 만들지 않고 <b>Deployment만</b> 씁니다. 교체 속도를 정하고 무중단으로 만드는 방법은 롤링 업데이트 레슨에서 다룹니다.' },
      hide: ['p4', 'p5'],
      show: ['e_r1', 'dep', 'rs2', 'n1', 'n2', 'n3'],
      set: {
        rs: { sub: '이미지 1.4' },
        p1: { state: 'down', sub: 'api:1.4' }, p5: { state: null },
        n1: { state: 'ok' }, n2: { state: 'ok' },
      },
      tags: [
        { on: 'dep', text: 'image 1.4 → 1.5', tone: 'accent', icon: 'pencil' },
        { on: 'rs', text: '3 → 0으로 줄이는 중', tone: 'warn' },
        { on: 'n3', text: '시작 중', tone: 'info', pos: 'bottom' },
        { on: 'p1', text: '종료 중', tone: 'bad', pos: 'bottom' },
      ],
      flows: [
        { path: ['dep', 'rs2'], kind: 'ctrl' },
        { path: ['rs2', 'n3'], kind: 'ctrl', delay: 0.8 },
        { path: ['dep', 'rs'], kind: 'ctrl', delay: 1.5 },
        { path: ['rs', 'p1'], kind: 'bad', delay: 2.3 },
      ],
      metrics: { ver: ['1.4 → 1.5', 'warn'], have: ['3 / 3', 'ok'] },
      changes: [['+', 'Deployment api'], ['+', '새 ReplicaSet (이미지 1.5)'], ['~', '옛 ReplicaSet: 3 → 0, 지우지 않음']],
      more: [
        {
          title: '동작 원리',
          body: [
            'Deployment 컨트롤러는 Pod template의 해시를 계산해 <code>pod-template-hash</code> 라벨로 붙입니다. template이 바뀌면 해시가 달라지고, 그 해시를 가진 ReplicaSet이 없으면 새로 만들어요. 그리고 새 ReplicaSet의 replicas는 올리고 옛것은 내립니다.',
            '되돌릴 때는 옛 template과 해시가 같은 ReplicaSet이 이미 있으니 그것을 다시 늘리면 됩니다. 남겨 두는 옛 ReplicaSet의 수는 <code>revisionHistoryLimit</code>(기본 10)이 정해요.',
          ],
        },
        {
          title: '무엇이 새 ReplicaSet을 만드나',
          rows: [
            ['image · env · 포트 변경', 'template 변경 → 새 RS', 'warn'],
            ['template의 라벨 · 어노테이션', 'template 변경 → 새 RS', 'warn'],
            ['replicas만 변경', '같은 RS의 개수만', 'ok'],
            ['Deployment 자체의 라벨', 'template 밖 → 변화 없음', 'mute'],
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl set image deploy/api api=shop/api:1.5
deployment.apps/api image updated

$ kubectl get rs -l app=api
NAME           DESIRED  CURRENT  READY
api-5f6d8c7b9  2        2        2
api-7c9d8f6b5  2        2        1`,
          },
        },
      ],
    },
    {
      key: 'YAML 읽기', kind: 'concept', title: 'Deployment YAML 한 장에 세 겹이',
      body: [
        'Deployment YAML은 앞의 ReplicaSet과 <code>kind</code> 한 줄만 다릅니다. 겹을 따라 읽으세요. 맨 바깥 <code>metadata.name</code>이 Deployment의 이름, <code>replicas</code>와 <code>selector</code>는 ReplicaSet에 넘겨질 개수와 조건, <code>template</code> 아래가 Pod입니다.',
        '<code>template</code> 안의 <code>image</code>를 고쳐 다시 <code>apply</code>하면 새 ReplicaSet이 생깁니다. <code>replicas</code>만 고치면 ReplicaSet은 그대로이고 Pod 수만 달라져요.',
      ],
      callout: { type: 'warn', text: '<code>selector</code>는 만든 뒤에 <b>바꿀 수 없습니다</b>. 다른 Deployment와 셀렉터가 겹치면 컨트롤러끼리 충돌해 예상 밖으로 동작할 수 있어요. 라벨은 앱마다 겹치지 않게 처음에 정하세요.' },
      code: { ref: 'deploy', hl: [2, 6, 9, 10, 17] },
      hide: ['rs', 'p1', 'p2'],
      set: { n3: { state: 'ok' }, p1: { state: null } },
      tags: [
        { on: 'dep', text: 'kind · name', pos: 'right' },
        { on: 'rs2', text: 'replicas · selector', pos: 'right' },
        { on: 'n2', text: 'template', pos: 'bottom' },
      ],
      flows: [
        { path: ['dep', 'rs2'], kind: 'ctrl' },
        { path: ['rs2', 'n1'], kind: 'ctrl', delay: 0.8 },
        { path: ['rs2', 'n2'], kind: 'ctrl', delay: 1.0 },
        { path: ['rs2', 'n3'], kind: 'ctrl', delay: 1.2 },
      ],
      metrics: { ver: ['1.5', 'ok'] },
      more: [
        {
          title: '실무에서 더 붙는 것',
          body: ['실제 운영 매니페스트의 Pod template에는 보통 아래가 더 들어갑니다. 각각 뒤의 레슨에서 다뤄요.'],
          list: [
            '<code>resources.requests · limits</code>: 자리 잡기와 상한 (스케줄링 레슨)',
            '<code>readinessProbe · livenessProbe</code>, <code>strategy</code>: 무중단 교체 (롤링 업데이트 레슨)',
            '<code>env · envFrom · volumes</code>: 설정과 비밀값 주입 (ConfigMap과 Secret 레슨)',
          ],
        },
        {
          title: '직접 해보기',
          body: ['적용하기 전에 무엇이 바뀌는지 미리 봅니다. 클러스터의 현재 상태와 파일을 비교해 줘요.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl diff -f deployment.yaml
-          image: shop/api:1.4
+          image: shop/api:1.5

$ kubectl apply -f deployment.yaml
deployment.apps/api configured`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '셀렉터를 바꾸려다 <code>field is immutable</code> 오류를 만납니다. 새 이름의 Deployment를 만들고 옮겨 가야 해요.',
            'template의 라벨에서 셀렉터가 쓰는 키를 지워 <code>selector does not match template labels</code>로 거부됩니다.',
            '들여쓰기를 한 칸 틀려 <code>image</code>가 엉뚱한 곳에 들어갑니다. <code>kubectl apply --dry-run=server</code>로 미리 검사하세요.',
          ],
        },
      ],
    },
    {
      key: '세 겹 보기', kind: 'concept', title: 'kubectl로 세 겹을 한눈에',
      body: [
        '<code>kubectl get deploy,rs,pods</code>로 세 겹이 한 화면에 보입니다. 이름이 계보를 말해 줘요. <code>api-5f6d8c7b9-2xkqp</code>는 Deployment <code>api</code>가 만든 ReplicaSet <code>api-5f6d8c7b9</code>의 Pod입니다. 가운데 글자는 Pod template의 해시라서 template이 바뀌면 달라집니다.',
        '0개짜리 옛 ReplicaSet이 남아 있는 것도 보입니다. 지우지 마세요. 되돌릴 때 쓰는 기록입니다.',
      ],
      callout: { type: 'warn', text: '장애 중에는 <code>kubectl exec</code>로 Pod 안을 고치고 싶어집니다. 하지만 그 Pod는 언제든 교체되고, 새 Pod는 template대로 뜹니다. 고칠 곳은 언제나 <b>Deployment의 YAML</b>입니다.' },
      code: { ref: 'tree', hl: [3, 6, 7, 10] },
      tags: [
        { on: 'rs2', text: 'api-5f6d8c7b9', pos: 'right' },
        { on: 'n2', text: 'api-5f6d8c7b9-2xkqp', pos: 'bottom' },
      ],
      flows: [{ path: ['dep', 'rs2'], kind: 'ctrl' }, { path: ['rs2', 'n2'], kind: 'ctrl', delay: 0.8 }],
      more: [
        {
          title: '출력 읽기',
          list: [
            'Deployment의 <code>READY 3/3</code>: 준비된 Pod / 원하는 수.',
            '<code>UP-TO-DATE</code>: 최신 template으로 만들어진 Pod 수. 교체 중이면 READY보다 작을 수 있습니다.',
            '<code>AVAILABLE</code>: 준비된 뒤 최소 대기 시간까지 버틴 Pod 수. 서비스에 실제로 쓸 수 있는 수예요.',
            'ReplicaSet의 <code>DESIRED</code>가 0이면 보관 중인 옛 버전, 0보다 크면 지금 쓰는 버전입니다.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['describe는 사람이 읽기 좋은 요약과 이벤트를, <code>-o yaml</code>은 저장된 오브젝트 전체를 보여 줍니다.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl describe deploy api
Replicas:  3 desired | 3 updated | 3 total
           | 3 available | 0 unavailable
OldReplicaSets:  <none>
NewReplicaSet:   api-5f6d8c7b9 (3/3 replicas created)
Events:
  Normal  ScalingReplicaSet  deployment-controller
    Scaled up replica set api-5f6d8c7b9 to 3
    Scaled down replica set api-7c9d8f6b5 to 0`,
          },
        },
        {
          title: '실무 팁',
          body: ['Deployment의 이벤트에는 "어느 ReplicaSet을 몇 개로" 바꿨는지만 남습니다. Pod가 왜 안 뜨는지는 한 겹 아래(ReplicaSet), 또 한 겹 아래(Pod)의 이벤트에서 찾습니다. 문제가 보이는 곳에서 <b>한 겹씩 내려가며</b> describe하는 습관을 들이세요.'],
        },
      ],
    },
    {
      key: '쿼터 초과', kind: 'case', title: '사례: READY 0/3인데 Pod가 하나도 없다',
      body: [
        '스테이징 네임스페이스에 같은 Deployment를 적용했더니 <code>READY 0/3</code>입니다. 그런데 <code>get pods</code>는 비어 있어요. Pending인 Pod조차 없습니다.',
        'Pod가 아예 없다면 한 겹 위인 ReplicaSet을 봅니다. 이벤트에 <code>FailedCreate</code>와 <b>ResourceQuota</b>(네임스페이스별 자원 상한) 초과가 찍혀 있어요. API 서버가 Pod 생성 요청을 거절한 것입니다.',
      ],
      callout: { type: 'tip', text: '쿼터를 늘리거나, Pod의 요청량을 줄이거나, 쓰지 않는 워크로드를 정리합니다. 쿼터를 정하는 쪽은 보통 플랫폼 팀이니 함께 확인하세요.' },
      code: { ref: 'quota', hl: [3, 6, 9, 11, 12] },
      hide: ['n1', 'n3'],
      set: { rs2: { state: 'hot', sub: 'stg' }, n2: { state: 'down' } },
      tags: [
        { on: 'rs2', text: 'FailedCreate', tone: 'bad', pos: 'right' },
        { on: 'n2', text: '만들지 못함', tone: 'bad', pos: 'bottom' },
      ],
      flows: [
        { path: ['dep', 'rs2'], kind: 'ctrl' },
        { path: ['rs2', 'n2'], kind: 'bad', n: 3, delay: 0.8 },
      ],
      metrics: { have: ['0 / 3', 'bad'], heal: ['쿼터에 막힘', 'bad'] },
      changes: [['-', 'Pod 생성 요청 거절 (쿼터 초과)'], ['~', '찾을 곳: Pod가 아니라 ReplicaSet']],
      more: [
        {
          title: '동작 원리',
          body: [
            'ResourceQuota는 어드미션 단계에서 검사됩니다. 새 Pod의 요청량을 더하면 네임스페이스의 상한을 넘을 때, API 서버는 Pod를 저장하지 않고 <code>forbidden</code>으로 거절해요. Pod가 저장되지 않았으니 Pod 목록에도, Pod 이벤트에도 흔적이 없습니다. 실패를 겪은 주체인 <b>ReplicaSet 컨트롤러</b>가 자기 이벤트에 남깁니다.',
            '컨트롤러는 계속 재시도하므로, 쿼터에 여유가 생기면 따로 손대지 않아도 Pod가 만들어집니다.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl describe quota -n stg
Name:          stg-quota
Resource       Used  Hard
--------       ----  ----
pods           6     20
requests.cpu   2     2
requests.memory 3Gi  4Gi`,
          },
        },
        {
          title: '비슷한 FailedCreate',
          list: [
            '<code>failed quota: … must specify requests.cpu</code>: 쿼터가 있는 네임스페이스에서는 Pod가 요청량을 꼭 적어야 합니다.',
            '어드미션 정책 거절(예: 특권 컨테이너 금지, 허용되지 않은 레지스트리): 메시지에 정책 이름이 나옵니다.',
            '<code>serviceaccount "…" not found</code>: template이 가리키는 ServiceAccount를 먼저 만들어야 합니다.',
          ],
        },
      ],
    },
    {
      key: '클라우드별', kind: 'compare', title: '같은 YAML, 네 클라우드의 실행 방식',
      body: [
        'Deployment YAML은 어느 관리형 쿠버네티스에서도 그대로 동작합니다. 다른 것은 Pod가 <b>올라가는 자리</b>예요. 기본은 내가 고른 VM을 묶은 <b>노드 풀</b>(노드 그룹)이고, 일부 사업자는 노드를 아예 숨기는 방식도 줍니다.',
        '노드를 숨기는 방식에서는 Pod 단위로 자원을 쓰고 요금을 냅니다. 대신 노드에 붙는 기능(DaemonSet 등)이 제한될 수 있어요.',
      ],
      callout: { type: 'cloud', text: '어느 쪽이든 Pod · ReplicaSet · Deployment의 동작은 이 레슨 그대로입니다. 네 서비스의 차이는 관리형 쿠버네티스 레슨에서 자세히 봅니다.' },
      hide: [],
      show: ['n1', 'n3'],
      set: { rs2: { state: null, sub: '이미지 1.5' }, n2: { state: 'ok' }, n1: { state: null }, n3: { state: null } },
      panel: {
        title: 'Pod가 올라가는 자리', icon: 'cloud',
        rows: [
          ['AWS EKS', '노드 그룹 · Fargate', 'aws'],
          ['Azure AKS', '노드 풀 · 가상 노드', 'azure'],
          ['GCP GKE', '노드 풀 · Autopilot', 'gcp'],
          ['NCP NKS', '노드 풀', 'ncp'],
        ],
      },
      flows: [
        { path: ['dep', 'rs2'], kind: 'ctrl' },
        { path: ['rs2', 'n1'], kind: 'ctrl', delay: 0.8 },
        { path: ['rs2', 'n2'], kind: 'ctrl', delay: 1.0 },
        { path: ['rs2', 'n3'], kind: 'ctrl', delay: 1.2 },
      ],
      metrics: { have: ['3 / 3', 'ok'], heal: ['자동', 'ok'] },
      more: [
        {
          title: '클라우드별로',
          rows: [
            ['AWS EKS', '관리형 노드 그룹(EC2), Fargate는 Pod마다 격리된 실행 환경', 'aws'],
            ['Azure AKS', '노드 풀(VM 스케일 세트), 가상 노드는 Container Instances 위', 'azure'],
            ['GCP GKE', 'Standard는 노드 풀, Autopilot은 노드를 Google이 관리', 'gcp'],
            ['NCP NKS', '노드 풀의 Server 위에서 Pod 실행', 'ncp'],
          ],
        },
        {
          title: '판단 기준',
          list: [
            '<b>노드 풀</b>: 노드 종류(CPU · 메모리 · GPU)를 고르고 DaemonSet, 노드 튜닝을 자유롭게 씁니다. 대신 노드 크기와 수를 관리해야 해요.',
            '<b>노드를 숨기는 방식</b>: 노드 관리가 없고 Pod 요청량만큼 씁니다. 대신 특권 컨테이너, 일부 DaemonSet, 특정 볼륨 같은 기능이 제한될 수 있으니 문서를 확인하세요.',
            '두 방식을 한 클러스터에 섞어 쓰는 구성도 흔합니다.',
          ],
        },
        {
          title: '더 생각해 볼 것',
          body: ['Pod의 IP를 어디서 받는지도 클라우드마다 다릅니다. 예를 들어 EKS의 기본 CNI는 Pod에 VPC 서브넷의 IP를 직접 주고, GKE의 VPC 네이티브 클러스터는 별칭 IP 범위를 씁니다. 서브넷 크기를 정할 때 Pod 수까지 고려해야 하는 이유예요.'],
        },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 세 겹은 저마다 한 가지 일을 합니다',
      body: [
        '<b>Pod</b>는 컨테이너를 묶어 IP 하나를 주는 일회용 단위, <b>ReplicaSet</b>은 라벨로 Pod를 세어 개수를 지키는 겹, <b>Deployment</b>는 template이 바뀔 때 ReplicaSet을 갈아 끼우는 겹입니다. 막히면 get → describe → 한 겹 아래로 내려가며 이벤트를 읽습니다.',
        '문제가 하나 남았습니다. Pod는 교체될 때마다 IP가 바뀝니다. 그러면 web은 api를 어느 주소로 불러야 할까요? 다음 레슨에서 Pod들 앞에 고정 주소를 세우는 <b>Service</b>를 봅니다.',
      ],
      show: ['rs'],
      set: { rs: { state: 'dim', sub: '0개 · 보관' } },
      tags: [
        { on: 'dep', text: '우리가 선언하는 것', tone: 'accent' },
        { on: 'n2', text: '교체될 때마다 새 IP', tone: 'warn', pos: 'bottom' },
      ],
      flows: [
        { path: ['dep', 'rs2'], kind: 'ctrl' },
        { path: ['rs2', 'n1'], kind: 'ctrl', delay: 0.8 },
        { path: ['rs2', 'n2'], kind: 'ctrl', delay: 1.0 },
        { path: ['rs2', 'n3'], kind: 'ctrl', delay: 1.2 },
      ],
    },
  ],
  quiz: [
    {
      q: '관리형 클러스터가 노드를 새 버전으로 하나씩 교체했습니다. 다음 중 교체가 끝난 뒤 다시 떠 있지 않은 것은?',
      options: [
        'replicas: 1인 Deployment의 Pod',
        'pod.yaml을 apply해서 직접 만든 Pod',
        'ReplicaSet이 만든 Pod',
        'replicas: 3인 Deployment의 Pod 가운데 그 노드에 있던 것',
      ],
      answer: 1,
      step: 5,
      why: '노드가 비워지면 그 위의 Pod는 지워집니다. Deployment와 ReplicaSet에는 "몇 개 있어야 한다"는 선언이 있어 컨트롤러가 다른 노드에 새로 만들지만, 직접 만든 Pod는 다시 만들어 줄 주체가 없습니다. replicas가 1이어도 선언이 있으니 복구됩니다(교체되는 동안 잠깐 비는 것은 별개의 문제입니다).',
    },
    {
      q: 'replicas: 3인 Deployment의 Pod 하나에서 app=api 라벨을 지웠습니다(셀렉터는 app=api). 잠시 뒤의 상태는?',
      options: [
        '라벨이 없는 Pod가 즉시 삭제되어 2개가 된다',
        '아무 변화 없이 3개가 유지된다',
        '라벨이 있는 Pod 3개와 라벨을 뗀 Pod 1개, 모두 4개가 돈다',
        'Deployment가 오류 상태가 되어 모든 Pod가 재시작된다',
      ],
      answer: 2,
      step: 9,
      why: 'ReplicaSet은 셀렉터에 맞는 Pod만 셉니다. 라벨을 뗀 Pod는 더 이상 세는 대상이 아니므로 2개로 보이고, 새 Pod를 하나 만들어 3개를 채웁니다. 떼어 낸 Pod는 지워지지 않고 관리 밖에서 계속 돕니다. 조사가 끝나면 직접 지워야 합니다.',
    },
    {
      q: '동료가 "api 컨테이너와 PostgreSQL 컨테이너를 한 Pod에 넣으면 localhost로 통신해서 빠르고 간단하다"고 제안합니다. 가장 알맞은 판단은?',
      options: [
        '좋다. 한 Pod의 컨테이너는 IP를 공유하니 설정이 줄어든다',
        '좋다. Pod 수가 줄어 노드 자원을 아낀다',
        '나쁘다. 한 Pod에는 컨테이너를 하나만 넣을 수 있다',
        '나쁘다. Pod는 통째로 복제 · 교체되는 단위라, api를 늘리면 DB도 늘고 api를 배포할 때마다 DB도 재시작된다',
      ],
      answer: 3,
      step: 2,
      why: '한 Pod에 넣는 기준은 "늘 함께 뜨고 함께 사라져도 되는가"입니다. api와 DB는 개수도, 교체 주기도, 데이터의 수명도 다릅니다. 한 Pod에 여러 컨테이너를 넣는 것 자체는 가능하며, 로그 수집기 같은 사이드카가 그 예입니다.',
    },
    {
      q: '잘못 배포한 앱을 내리려고 kubectl delete pod로 Pod를 지웠는데, 몇 초 뒤 같은 Pod가 새 이름으로 또 떠 있습니다. 이 앱을 정말 내리려면?',
      options: [
        'Pod가 다시 뜨기 전에 더 빨리 반복해서 지운다',
        'kubectl delete pod에 --force 옵션을 붙인다',
        'Pod를 만든 Deployment를 지우거나 replicas를 0으로 바꾼다',
        'Pod가 떠 있는 노드를 재부팅한다',
      ],
      answer: 2,
      step: 8,
      why: 'Pod가 되살아나는 것은 고장이 아니라 ReplicaSet이 선언된 개수를 지키는 것입니다. 바꿔야 하는 것은 선언입니다. Deployment를 지우면 그 아래 ReplicaSet과 Pod가 함께 정리되고, replicas를 0으로 두면 오브젝트는 남긴 채 Pod만 없앱니다. 강제 삭제나 재부팅은 같은 Pod를 다른 곳에 다시 만들게 할 뿐입니다.',
    },
    {
      q: 'Pod가 CrashLoopBackOff이고 RESTARTS가 계속 늘어납니다. kubectl logs를 쳤더니 아무것도 나오지 않습니다. 다음에 할 일로 가장 알맞은 것은?',
      options: [
        'kubectl logs --previous로 직전에 종료된 컨테이너의 로그를 보고, describe에서 종료 코드를 확인한다',
        'Pod를 지워서 새로 만들면 해결된다',
        '노드를 재부팅한다',
        'replicas를 늘려 정상 Pod가 생길 때까지 기다린다',
      ],
      answer: 0,
      step: 4,
      why: 'CrashLoopBackOff에서는 컨테이너가 막 다시 시작됐거나 대기 중이라 현재 로그가 비어 있는 경우가 많습니다. --previous로 죽기 직전의 로그를, describe의 Last State로 종료 코드와 이유를 봅니다. 지우거나 늘려도 같은 template으로 뜨니 같은 이유로 또 죽습니다.',
    },
    {
      q: 'describe pod의 Last State가 "Terminated, Reason: OOMKilled, Exit Code: 137"입니다. 무엇을 의심해야 할까요?',
      options: [
        '이미지를 받지 못했다',
        '컨테이너가 메모리 한도를 넘어 강제 종료됐다. 한도나 앱의 메모리 사용을 본다',
        '스케줄러가 노드를 찾지 못했다',
        '앱이 정상적으로 일을 마치고 종료했다',
      ],
      answer: 1,
      step: 4,
      why: '137은 SIGKILL로 강제 종료됐다는 뜻이고, Reason이 OOMKilled이면 메모리 한도 초과입니다. 이미지 문제나 스케줄링 문제라면 컨테이너가 시작조차 하지 않으니 Terminated 기록이 없고, 정상 종료라면 종료 코드가 0입니다.',
    },
    {
      q: 'kubectl get pods의 STATUS가 몇 분째 ContainerCreating입니다. 이 Pod의 phase와 다음 행동으로 맞는 것은?',
      options: [
        'phase는 Running이다. 앱 로그를 본다',
        'phase는 Failed다. Pod를 지운다',
        'phase는 Pending이고 노드에서 이미지 받기나 볼륨 연결 중이다. describe의 이벤트를 본다',
        'phase는 Unknown이다. 노드를 교체한다',
      ],
      answer: 2,
      step: 3,
      why: '컨테이너가 하나도 시작되지 않았으므로 phase는 Pending입니다. STATUS 칸은 그 안의 더 구체적인 이유를 보여 줄 뿐입니다. 노드에서 무엇에 막혔는지(이미지, 볼륨, Secret 마운트)는 describe의 이벤트에 남습니다. 앱이 아직 시작되지 않았으니 앱 로그는 없습니다.',
    },
    {
      q: '한 api Pod만 응답이 느립니다. 원인을 조사하고 싶지만 그동안 서비스 품질은 지키고 싶습니다. 가장 알맞은 방법은?',
      options: [
        '그 Pod의 Service · ReplicaSet용 라벨을 떼어 트래픽과 관리에서 빼고, 남겨 둔 채 조사한다',
        '그 Pod를 바로 지운다',
        'Deployment의 replicas를 0으로 줄였다가 다시 올린다',
        '그 Pod에 exec로 들어가 설정을 고친다',
      ],
      answer: 0,
      step: 9,
      why: '라벨을 떼면 ReplicaSet은 빈자리를 새 Pod로 채우고, Service도 그 Pod를 고르지 않아 트래픽이 끊깁니다. 문제 Pod는 그대로 남아 조사할 수 있습니다. 지우면 증거가 사라지고, replicas를 0으로 줄이면 서비스가 멈추며, exec로 고친 내용은 교체되면 사라집니다.',
    },
    {
      q: 'Deployment의 replicas만 3에서 5로 고쳐 apply했습니다. ReplicaSet은 어떻게 될까요?',
      options: [
        '새 ReplicaSet이 만들어지고 옛것은 0이 된다',
        '기존 ReplicaSet이 그대로 쓰이고 DESIRED만 5가 된다',
        'ReplicaSet이 두 개가 되어 각각 5개씩 만든다',
        'Deployment가 다시 만들어진다',
      ],
      answer: 1,
      step: 11,
      why: '새 ReplicaSet은 Pod template이 바뀔 때만 생깁니다. replicas는 template 밖의 필드라 기존 ReplicaSet의 개수만 바뀝니다. 이미지나 환경 변수처럼 template 안을 고쳐야 새 ReplicaSet과 교체가 일어납니다.',
    },
    {
      q: 'Deployment의 selector를 app=api에서 app.kubernetes.io/name=api로 바꾸려고 apply했더니 field is immutable 오류가 납니다. 어떻게 해야 할까요?',
      options: [
        '--force를 붙여 다시 apply하면 된다',
        'ReplicaSet의 셀렉터만 직접 고친다',
        '오류는 무시해도 다음 apply에 반영된다',
        '새 셀렉터를 가진 새 Deployment를 만들어 옮겨 가고, 옛 Deployment를 정리한다',
      ],
      answer: 3,
      step: 11,
      why: 'apps/v1의 Deployment 셀렉터는 만든 뒤 바꿀 수 없습니다. 바꾸면 기존 Pod와의 관계가 끊겨 엉뚱한 Pod를 셀 수 있기 때문입니다. 새 이름(또는 지우고 다시 만들기)으로 옮겨 가야 하고, 그래서 라벨 체계는 처음에 정해 두는 것이 좋습니다.',
    },
    {
      q: 'kubectl get deploy api가 READY 0/3인데 kubectl get pods에는 api Pod가 하나도 없습니다. 가장 먼저 볼 곳은?',
      options: [
        '노드의 kubelet 로그',
        'api 컨테이너의 로그',
        'Deployment가 만든 ReplicaSet의 describe 이벤트(FailedCreate 등)',
        'CoreDNS 설정',
      ],
      answer: 2,
      step: 13,
      why: 'Pod가 아예 없다는 것은 생성 요청 자체가 거절됐다는 뜻입니다. 그 실패는 Pod를 만들려던 ReplicaSet 컨트롤러가 자기 이벤트에 남깁니다. ResourceQuota 초과나 어드미션 거절이 흔합니다. Pod가 없으니 kubelet이나 컨테이너 로그에는 아무것도 없습니다.',
    },
    {
      q: '장애 중 kubectl get rs에 DESIRED 0인 ReplicaSet이 여러 개 보입니다. 동료가 "쓸모없으니 지우자"고 합니다. 가장 알맞은 판단은?',
      options: [
        '남겨 둔다. 옛 버전의 template 기록이라 되돌릴 때 쓰이고, 보관 수는 revisionHistoryLimit으로 조절한다',
        '모두 지운다. 0개라 아무 역할이 없다',
        '모두 replicas를 1로 올려 예비로 둔다',
        'Deployment를 지우고 다시 만들어 정리한다',
      ],
      answer: 0,
      step: 12,
      why: 'Deployment는 template이 바뀔 때마다 새 ReplicaSet을 만들고 옛것을 0으로 줄여 남겨 둡니다. 되돌리기는 이 옛 ReplicaSet을 다시 늘리는 것입니다. 너무 많이 쌓이는 것이 걱정이면 revisionHistoryLimit을 줄입니다.',
    },
    {
      q: '노드 관리를 줄이고 싶어 GKE Autopilot이나 EKS Fargate 같은 방식을 검토합니다. 함께 확인해야 할 점으로 가장 알맞은 것은?',
      options: [
        'Deployment 대신 다른 오브젝트를 써야 한다',
        '노드에 붙는 기능(일부 DaemonSet, 특권 컨테이너 등)이 제한될 수 있으니 우리 워크로드가 그런 기능에 기대는지',
        'Pod가 IP를 받지 못한다',
        'ReplicaSet의 자가 복구가 동작하지 않는다',
      ],
      answer: 1,
      step: 14,
      why: '노드를 숨기는 방식에서도 Pod · ReplicaSet · Deployment는 똑같이 동작합니다. 차이는 노드 수준 기능입니다. 노드마다 에이전트를 까는 DaemonSet이나 특권이 필요한 컨테이너가 있으면 제한에 걸릴 수 있으므로 사업자 문서를 확인합니다.',
    },
  ],
};
