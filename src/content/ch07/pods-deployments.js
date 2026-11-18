export default {
  id: 'pods-deployments',
  learn: [
    'Pod: 컨테이너를 묶어 IP 하나를 주는 최소 단위',
    'Pod는 일회용: 직접 만들면 복구되지 않는 이유',
    'ReplicaSet: 개수를 지키는 컨트롤러',
    '라벨과 셀렉터로 "내 Pod"를 찾는 방식',
    'Deployment: template이 바뀌면 ReplicaSet을 교체',
    'Deployment YAML을 겹을 따라 읽는 법',
  ],
  legend: [['ctrl', '생성 · 감시'], ['req', '요청'], ['bad', '삭제 · 종료']],
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
  },
  scene: {
    zones: {
      pod: { at: [1.3, 3.2], size: [3.4, 4.4], label: 'Pod · 10.244.1.7', color: 'teal', labelPos: 'back' },
    },
    nodes: {
      dev: { kind: 'client', at: [-0.6, 5.6], label: '개발자 · kubectl' },
      c_api: { kind: 'tile', at: [2.1, 6.3], label: 'api 컨테이너', icon: 'container', color: 'blue' },
      c_side: { kind: 'tile', at: [3.9, 4.5], label: '로그 수집기', sub: '사이드카', icon: 'scroll', color: 'slate' },
      // 옛 ReplicaSet (이미지 1.4)과 그 Pod
      rs: { at: [0.8, 4.0], label: 'ReplicaSet', sub: 'api', icon: 'copy', color: 'yellow' },
      p4: { at: [0.5, 8.1], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      p1: { at: [1.6, 7.0], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      p2: { at: [2.7, 5.9], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      p3: { at: [3.8, 4.8], size: 's', label: 'Pod', sub: 'api:1.4', icon: 'box', color: 'blue' },
      // Deployment와 새 ReplicaSet (이미지 1.5)
      dep: { at: [2.2, -2.2], label: 'Deployment', sub: 'api', icon: 'layers', color: 'teal' },
      rs2: { at: [4.6, 0.2], label: 'ReplicaSet', sub: '이미지 1.5', icon: 'copy', color: 'yellow' },
      n1: { at: [5.4, 3.2], size: 's', label: 'Pod', sub: 'api:1.5', icon: 'box', color: 'green' },
      n2: { at: [6.5, 2.1], size: 's', label: 'Pod', sub: 'api:1.5', icon: 'box', color: 'green' },
      n3: { at: [7.6, 1.0], size: 's', label: 'Pod', sub: 'api:1.5', icon: 'box', color: 'green' },
    },
    edges: {
      e_apply: { from: 'dev', to: 'c_api', style: 'dashed' },
      e_local: { from: 'c_side', to: 'c_api' },
      e_bare: { from: 'dev', to: 'p2', style: 'dashed' },
      e_r1: { from: 'rs', to: 'p1' },
      e_r2: { from: 'rs', to: 'p2' },
      e_r3: { from: 'rs', to: 'p3' },
      e_r4: { from: 'rs', to: 'p4' },
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
    },
    {
      key: '맨몸 Pod', kind: 'case', title: '사례: 직접 만든 Pod는 돌아오지 않습니다',
      body: [
        '한 팀이 <code>pod.yaml</code>로 만든 Pod 하나로 서비스를 열었습니다. 며칠 뒤 클러스터 업그레이드로 노드가 교체되자 Pod가 사라졌고, 아침까지 아무도 몰랐습니다.',
        '컨테이너 프로세스가 죽는 정도라면 그 노드의 kubelet이 같은 Pod 안에서 다시 시작합니다(<code>restartPolicy</code> 기본값 Always). 하지만 Pod가 지워지거나 노드가 사라지면 다릅니다. Pod는 <b>일회용</b>이고, 직접 만든 Pod를 다시 만들어 줄 주체는 클러스터 어디에도 없습니다.',
      ],
      callout: { type: 'key', text: '빠진 것은 "이 Pod가 <b>몇 개 있어야 한다</b>"는 선언입니다. 지난 레슨의 조정 루프는 선언된 상태가 있어야 돕니다. Pod를 직접 만드는 것은 잠깐의 디버깅 때뿐입니다.' },
      code: { ref: 'bare', hl: [1, 5, 9] },
      hide: ['pod', 'c_api', 'c_side'],
      show: ['dev', 'p2'],
      set: { p2: { state: 'down' } },
      tags: [{ on: 'p2', text: '다시 만들 주체 없음', tone: 'bad', pos: 'bottom' }],
      flows: [{ path: ['dev', 'p2'], kind: 'bad', n: 2 }],
      metrics: { have: ['0', 'bad'], heal: ['아무도 안 함', 'bad'] },
      changes: [['-', '노드 교체와 함께 Pod 삭제'], ['~', '선언한 개수가 없어 복구도 없음']],
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
    },
    {
      key: '라벨 · 셀렉터', kind: 'concept', title: '라벨과 셀렉터: "내 Pod"를 찾는 법',
      body: [
        'ReplicaSet은 자기 Pod를 어떻게 알아볼까요? Pod에는 <code>app: api</code> 같은 <b>라벨</b>(키-값 이름표)이 붙고, ReplicaSet은 <b>셀렉터</b>로 "이 라벨을 가진 Pod"를 고릅니다. 이름이나 IP가 아니라 라벨로 묶이는 느슨한 관계예요.',
        '그래서 <code>selector.matchLabels</code>와 <code>template</code>의 <code>labels</code>는 반드시 맞아야 합니다. 어긋나면 API 서버가 오브젝트를 거부합니다.',
      ],
      callout: { type: 'tip', text: '말썽인 Pod에서 라벨을 떼면 ReplicaSet은 그 Pod를 세지 않고 새 Pod를 하나 만듭니다. 떼어 낸 Pod는 그대로 남아 차분히 조사할 수 있어요. 다음 레슨의 Service도 같은 방식으로 Pod를 찾습니다.' },
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
    },
    {
      key: 'Deployment', kind: 'solution', title: 'Deployment: 버전을 바꾸는 셋째 겹',
      body: [
        '이미지를 1.5로 올리려고 ReplicaSet의 template을 고쳐도, 이미 떠 있는 Pod는 그대로입니다. ReplicaSet은 <b>개수</b>만 볼 뿐, 떠 있는 Pod가 template과 같은지는 따지지 않아요.',
        '<b>Deployment</b>는 ReplicaSet을 관리하는 한 겹 위의 오브젝트입니다. template이 바뀌면 <b>새 ReplicaSet</b>을 만들어 조금씩 늘리고, 옛 ReplicaSet은 그만큼 줄입니다. 옛것은 0개인 채로 남겨 두었다가 되돌릴 때 씁니다.',
      ],
      callout: { type: 'tip', text: '그래서 실무에서는 ReplicaSet도 직접 만들지 않고 <b>Deployment만</b> 씁니다. 교체 속도를 정하고 무중단으로 만드는 방법은 롤링 업데이트 레슨에서 다룹니다.' },
      hide: ['p3', 'p4'],
      show: ['dep', 'rs2', 'n1', 'n2', 'n3'],
      set: {
        rs: { sub: '이미지 1.4' },
        p1: { state: 'down' }, p4: { state: null },
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
    },
    {
      key: '정리', kind: 'recap', title: '정리: 세 겹은 저마다 한 가지 일을 합니다',
      body: [
        '<b>Pod</b>는 컨테이너를 묶어 IP 하나를 주는 일회용 단위, <b>ReplicaSet</b>은 라벨로 Pod를 세어 개수를 지키는 겹, <b>Deployment</b>는 template이 바뀔 때 ReplicaSet을 갈아 끼우는 겹입니다. 우리는 Deployment만 선언하고 나머지는 컨트롤러가 만듭니다.',
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
      why: '노드가 비워지면 그 위의 Pod는 지워집니다. Deployment와 ReplicaSet에는 "몇 개 있어야 한다"는 선언이 있어 컨트롤러가 다른 노드에 새로 만들지만, 직접 만든 Pod는 다시 만들어 줄 주체가 없습니다. replicas가 1이어도 선언이 있으니 복구됩니다(교체되는 동안 잠깐 비는 것은 별개의 문제입니다).',
    },
    {
      q: 'replicas: 3인 Deployment의 Pod 하나에서 app=api 라벨을 지웠습니다. 잠시 뒤의 상태는?',
      options: [
        '라벨이 없는 Pod가 즉시 삭제되어 2개가 된다',
        '아무 변화 없이 3개가 유지된다',
        '라벨이 있는 Pod 3개와 라벨을 뗀 Pod 1개, 모두 4개가 돈다',
        'Deployment가 오류 상태가 되어 모든 Pod가 재시작된다',
      ],
      answer: 2,
      why: 'ReplicaSet은 셀렉터에 맞는 Pod만 셉니다. 라벨을 뗀 Pod는 더 이상 세는 대상이 아니므로 2개로 보이고, 새 Pod를 하나 만들어 3개를 채웁니다. 떼어 낸 Pod는 지워지지 않고 관리 밖에서 계속 돕니다. 문제 Pod를 트래픽과 관리에서 빼내 조사할 때 쓰는 방법이고, 조사가 끝나면 직접 지워야 합니다.',
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
      why: 'Pod가 되살아나는 것은 고장이 아니라 ReplicaSet이 선언된 개수를 지키는 것입니다. 바꿔야 하는 것은 선언입니다. Deployment를 지우면 그 아래 ReplicaSet과 Pod가 함께 정리되고, replicas를 0으로 두면 오브젝트는 남긴 채 Pod만 없앱니다. 강제 삭제나 재부팅은 같은 Pod를 다른 곳에 다시 만들게 할 뿐입니다.',
    },
  ],
};
