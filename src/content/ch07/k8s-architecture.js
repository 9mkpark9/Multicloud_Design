export default {
  id: 'k8s-architecture',
  learn: [
    '컨테이너가 많아지면 사람이 못 따라가는 이유',
    '컨트롤 플레인: API 서버 · etcd · 스케줄러 · 컨트롤러',
    'watch와 조정 루프: 선언한 상태를 맞추는 방식',
    '워커 노드: kubelet · 컨테이너 런타임 · kube-proxy',
    'kubectl apply 한 번의 여정과 events로 흔적 읽기',
    '관리형 컨트롤 플레인과 흔한 장애 사례',
  ],
  legend: [['ctrl', '명령 · 감시'], ['data', '저장'], ['res', '응답'], ['bad', '끊김 · 거절']],
  metrics: [
    { id: 'want', label: '선언한 상태', icon: 'file-code' },
    { id: 'have', label: '실제 상태', icon: 'boxes' },
    { id: 'heal', label: '장애 복구', icon: 'heart-pulse' },
    { id: 'gate', label: '변경 경로', icon: 'route' },
  ],
  scene: {
    zones: {
      cp: { at: [-1.4, -4.2], size: [4.6, 4.4], label: '컨트롤 플레인', color: 'red' },
      w1: { at: [0.9, 0.5], size: [4.7, 4.6], label: '워커 노드 1', color: 'blue' },
      w2: { at: [6.0, -1.0], size: [2.8, 3.3], label: '워커 노드 2', color: 'blue' },
    },
    nodes: {
      dev: { kind: 'client', at: [-1.2, 2.0], label: '개발자 · kubectl' },
      api: { at: [2.1, -1.1], label: 'API 서버', sub: 'apiserver', icon: 'server-cog', color: 'red' },
      cm: { at: [-0.4, -1.1], label: '컨트롤러\n매니저', icon: 'refresh', color: 'red' },
      etcd: { kind: 'cyl', at: [-0.4, -3.5], label: 'etcd', icon: 'database', color: 'purple' },
      sched: { at: [2.1, -3.5], label: '스케줄러', sub: 'scheduler', icon: 'signpost', color: 'red' },
      hook: { at: [2.1, 1.3], label: '어드미션\n웹훅', icon: 'shield', color: 'orange' },
      kl1: { kind: 'tile', at: [1.3, 1.2], label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
      rt1: { kind: 'tile', at: [5.0, 1.3], label: 'containerd', icon: 'container', color: 'slate' },
      px1: { kind: 'tile', at: [4.6, 3.9], label: 'kube-proxy', icon: 'shuffle', color: 'slate' },
      p1: { at: [2.6, 3.7], size: 's', label: 'api', icon: 'box', color: 'teal' },
      p2: { at: [3.7, 2.6], size: 's', label: 'api', icon: 'box', color: 'teal' },
      p3: { at: [4.8, 1.5], size: 's', label: 'api', icon: 'box', color: 'teal' },
      kl2: { kind: 'tile', at: [6.6, 0.1], label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
      q1: { at: [8.1, -0.3], size: 's', label: 'api', icon: 'box', color: 'teal' },
    },
    edges: {
      e_ssh: { from: 'dev', to: 'kl1', style: 'dashed', label: 'ssh', off: true },
      e_dev: { from: 'dev', to: 'api' },
      e_etcd: { from: 'api', to: 'etcd', bi: true },
      e_cm: { from: 'cm', to: 'api', bi: true },
      e_sch: { from: 'sched', to: 'api', bi: true },
      e_hook: { from: 'api', to: 'hook', style: 'dashed' },
      e_k1: { from: 'api', to: 'kl1', bi: true },
      e_k2: { from: 'api', to: 'kl2', bi: true },
      e_rt: { from: 'kl1', to: 'rt1' },
      e_r2: { from: 'rt1', to: 'p2' },
      e_q1: { from: 'kl2', to: 'q1' },
    },
  },
  steps: [
    {
      key: '손으로 운영', kind: 'problem', title: '컨테이너 30개를 손으로 돌리면',
      body: [
        'shop.example이 커져서 컨테이너가 서버 5대에 30개가 됐습니다. 배포할 때마다 서버에 ssh로 들어가 <code>docker run</code>을 치고, 어디에 무엇이 떠 있는지는 엔지니어의 메모와 기억이 압니다.',
        '새벽 3시에 컨테이너 하나가 죽으면, 누군가 알람에 깨어 빈 서버를 찾아 다시 띄울 때까지 그 자리는 비어 있습니다. 서버 한 대가 통째로 꺼지면 그 위의 컨테이너 전부가 그렇게 됩니다.',
      ],
      callout: { type: 'key', text: '필요한 것은 "무엇이 몇 개 떠 있어야 하는가"를 기억하고, 어긋나면 사람 대신 맞춰 주는 시스템입니다. 이것을 <b>오케스트레이션</b>이라고 합니다.' },
      show: ['dev', 'w1', 'w2', 'kl1', 'kl2', 'p1', 'p2', 'q1', 'e_ssh'],
      set: {
        w1: { label: '서버 1' }, w2: { label: '서버 2' },
        kl1: { label: 'Docker', icon: 'container', color: 'blue' },
        kl2: { label: 'Docker', icon: 'container', color: 'blue' },
        q1: { state: 'down' },
      },
      tags: [
        { on: 'q1', text: '죽은 채 방치', tone: 'bad', icon: 'x' },
        { on: 'dev', text: '서버마다 docker run', pos: 'bottom' },
      ],
      flows: [{ path: ['dev', 'kl1'], kind: 'ctrl', n: 2 }],
      metrics: { want: ['메모와 기억', 'warn'], have: ['29 / 30', 'bad'], heal: ['사람이 깰 때', 'bad'], gate: ['서버마다 ssh', 'bad'] },
      more: [
        {
          title: '명령형 운영의 한계',
          body: [
            '<code>docker run</code>은 "지금 이것을 실행하라"는 <b>명령</b>입니다. 명령은 실행되고 나면 끝이라, 그 컨테이너가 나중에 죽어도 아무도 다시 실행하지 않아요. "api는 3개여야 한다"는 의도는 사람 머릿속에만 있습니다.',
            '서버가 늘수록 문제는 곱으로 커집니다. 어느 서버에 자원이 남았는지, 같은 앱이 한 서버에 몰려 있지는 않은지, 새 버전을 몇 개까지 바꿨는지를 모두 사람이 추적해야 하니까요. 실수 한 번이 장애가 되고, 그 상태를 아는 사람이 휴가 중이면 복구도 늦어집니다.',
          ],
        },
        {
          title: '오케스트레이터가 맡는 일',
          list: [
            '<b>배치</b>: 자원이 남은 서버를 골라 컨테이너를 놓습니다.',
            '<b>자가 복구</b>: 죽은 컨테이너, 사라진 서버의 컨테이너를 다시 띄웁니다.',
            '<b>확장</b>: 개수를 늘리고 줄입니다. 부하에 따라 자동으로도 합니다.',
            '<b>서비스 연결</b>: 계속 바뀌는 컨테이너들 앞에 고정된 이름과 주소를 둡니다.',
            '<b>배포</b>: 새 버전으로 조금씩 바꾸고, 문제가 있으면 되돌립니다.',
          ],
        },
        {
          title: '더 생각해 볼 것',
          body: [
            '쿠버네티스는 Google이 내부 시스템(Borg)을 운영한 경험을 바탕으로 2014년에 공개했고, 지금은 CNCF가 관리하는 오픈소스입니다. 그래서 AWS · Azure · GCP · NCP 어디서나 같은 API로 다룰 수 있어요. 이 레슨에서 배우는 구조는 어느 클라우드의 관리형 쿠버네티스에서도 똑같습니다.',
          ],
        },
      ],
    },
    {
      key: '클러스터', kind: 'concept', title: '클러스터는 두 부분으로 나뉩니다',
      body: [
        '<b>쿠버네티스</b>는 여러 서버를 묶어 하나의 <b>클러스터</b>로 다룹니다. 두뇌인 <b>컨트롤 플레인</b>은 무엇이 어떻게 떠 있어야 하는지 기록하고 결정합니다. 실제 컨테이너는 <b>워커 노드</b>에서 돕니다.',
        '이제 서버에 ssh로 들어가지 않습니다. 원하는 상태를 YAML로 적어 <code>kubectl apply</code>로 건네면, 어느 노드에 띄울지도, 죽으면 다시 띄우는 일도 클러스터가 맡습니다.',
      ],
      callout: { type: 'tip', text: '노드마다 있는 <b>kubelet</b>이 컨트롤 플레인의 결정을 받아 자기 노드에서 컨테이너를 실행합니다. 부품을 하나씩 열어 봅시다.' },
      show: ['cp', 'api'],
      hide: ['e_ssh'],
      set: {
        w1: { label: '워커 노드 1' }, w2: { label: '워커 노드 2' },
        kl1: { label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
        kl2: { label: 'kubelet', icon: 'heart-pulse', color: 'slate' },
        q1: { state: null },
      },
      tags: [{ on: 'dev', text: '원하는 상태를 선언', icon: 'file-code', pos: 'bottom' }],
      flows: [
        { path: ['dev', 'api'], kind: 'ctrl' },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 0.9 },
        { path: ['api', 'kl2'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { want: 'api ×3', have: ['3 / 3', 'ok'], gate: ['API 서버 하나', 'ok'] },
      changes: [['+', '컨트롤 플레인: 결정하는 곳'], ['~', '서버 → 워커 노드'], ['-', '서버마다 ssh 접속']],
      more: [
        {
          title: '동작 원리',
          body: [
            '컨트롤 플레인도 결국 서버(노드) 위에서 도는 프로그램들입니다. 직접 설치한 클러스터에서는 보통 컨트롤 플레인 전용 노드를 두고, 일반 Pod가 그 노드에 놓이지 않도록 <code>node-role.kubernetes.io/control-plane:NoSchedule</code> 같은 <b>taint</b>(접근 금지 표시)를 붙여 둡니다.',
            '<code>kubectl</code>은 내 컴퓨터의 <code>~/.kube/config</code>(kubeconfig)를 읽어 어느 클러스터의 API 서버에, 어떤 자격 증명으로 접속할지 정합니다. 클러스터 주소, 사용자, 그 둘을 묶은 <b>context</b>가 이 파일에 들어 있어요.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['지금 어느 클러스터를 보고 있는지, 노드가 몇 대인지 확인합니다.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl config current-context
dev-cluster

$ kubectl cluster-info
Kubernetes control plane is running at
  https://10.0.0.10:6443

$ kubectl get nodes -o wide
NAME      STATUS  ROLES          VERSION  INTERNAL-IP
cp-1      Ready   control-plane  v1.31.2  10.0.0.10
worker-1  Ready   <none>         v1.31.2  10.0.1.11
worker-2  Ready   <none>         v1.31.2  10.0.1.12`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            'dev와 prod의 context가 한 kubeconfig에 함께 있을 때, 확인 없이 <code>apply</code>해서 운영 클러스터를 바꿉니다. 명령 전에 <code>current-context</code>를 보거나 셸 프롬프트에 context를 띄워 두세요.',
            '<code>ROLES</code>가 <code>&lt;none&gt;</code>이면 고장이 아닙니다. 워커 노드에는 역할 라벨이 없을 뿐이에요.',
            '<code>STATUS</code>가 <code>NotReady</code>인 노드에는 새 Pod가 배정되지 않습니다. 노드 장애 사례에서 다시 봅니다.',
          ],
        },
      ],
    },
    {
      key: 'API 서버', kind: 'concept', title: '모든 길은 API 서버로 통합니다',
      body: [
        '<b>API 서버</b>(kube-apiserver)는 클러스터의 유일한 입구입니다. <code>kubectl</code>의 HTTPS 요청은 <b>인증</b>(누구인가) → <b>인가</b>(RBAC: 해도 되는가) → <b>어드미션</b>(규칙 검사 · 기본값 채우기)을 통과해야 저장됩니다.',
        '스케줄러, 컨트롤러, kubelet도 서로 직접 말하지 않고 모두 API 서버로 읽고 씁니다. 그래서 이 한 곳에서 클러스터의 모든 변경을 검사하고 기록할 수 있습니다.',
      ],
      callout: { type: 'tip', text: '직접 설치한 클러스터에서는 컨트롤 플레인 부품도 <code>kube-system</code>의 Pod로 보입니다. 관리형 쿠버네티스에서는 사업자가 운영해서 보이지 않아요.' },
      hide: ['cp', 'w1', 'w2', 'kl1', 'kl2', 'p1', 'p2', 'q1'],
      focus: ['api'],
      flows: [{ path: ['dev', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'dev'], kind: 'res', n: 2, delay: 1 }],
      code: {
        title: '클러스터 들여다보기', lang: 'sh', hl: [1, 7],
        text: `$ kubectl get nodes
NAME       STATUS   ROLES
cp-1       Ready    control-plane
worker-1   Ready    <none>
worker-2   Ready    <none>

$ kubectl get pods -n kube-system
NAME                           READY
etcd-cp-1                      1/1
kube-apiserver-cp-1            1/1
kube-controller-manager-cp-1   1/1
kube-scheduler-cp-1            1/1
kube-proxy-7xk2p               1/1
kube-proxy-q9d4m               1/1
kube-proxy-z5h8r               1/1
coredns-5d78c9869d-4kq2x       1/1
coredns-5d78c9869d-v7m9s       1/1
`,
      },
      more: [
        {
          title: '동작 원리',
          body: [
            '요청 하나는 이 순서로 처리됩니다. ① <b>인증</b>: 클라이언트 인증서, 토큰, OIDC 등으로 "누구인가"를 확인합니다. Pod 안의 프로그램은 ServiceAccount 토큰을 씁니다. ② <b>인가</b>: RBAC의 Role · ClusterRole과 바인딩을 보고 "이 사용자가 이 네임스페이스의 이 리소스에 이 동작을 해도 되는가"를 판단합니다.',
            '③ <b>변경 어드미션</b>이 기본값을 채우거나 필드를 고치고, ④ 스키마 검증 뒤 ⑤ <b>검증 어드미션</b>이 정책 위반을 거절합니다. 모두 통과해야 etcd에 저장되고 응답이 돌아갑니다. 어느 단계에서 거절됐는지는 오류 메시지가 알려 줘요. 인증 실패는 <code>Unauthorized</code>(401), 인가 실패는 <code>Forbidden</code>(403)입니다.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['권한을 미리 물어보고, 저장하지 않은 채 전체 검사만 돌려 봅니다.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl auth can-i create deployments -n shop
yes
$ kubectl auth can-i get secrets -n shop \\
    --as system:serviceaccount:shop:default
no

# 어드미션까지 거치지만 etcd에는 저장하지 않음
$ kubectl apply -f api.yaml --dry-run=server
deployment.apps/api created (server dry run)`,
          },
        },
        {
          title: '실무 팁',
          list: [
            'API 서버는 상태를 갖지 않아 여러 대를 나란히 띄우고 앞에 로드 밸런서를 둘 수 있습니다. 상태는 모두 etcd에 있어요.',
            '<b>감사 로그</b>(audit log)를 켜면 누가 언제 무엇을 바꿨는지 API 서버에 기록이 남습니다. 사고 조사의 출발점입니다.',
            '<code>--dry-run=client</code>는 내 컴퓨터에서 형식만 봅니다. 어드미션 정책에 걸리는지까지 보려면 <code>server</code>를 쓰세요.',
          ],
        },
      ],
    },
    {
      key: 'etcd', kind: 'concept', title: 'etcd: 클러스터의 유일한 기억',
      body: [
        '<b>etcd</b>는 클러스터의 모든 오브젝트(Deployment, Pod, Service, Secret…)를 담는 분산 키-값 저장소입니다. etcd에 직접 접근하는 것은 API 서버뿐이고, 다른 부품은 API 서버를 거쳐 읽습니다.',
        'etcd는 여러 대가 <b>과반수</b>의 동의(Raft 합의)로 값을 정합니다. 그래서 3대면 1대, 5대면 2대가 죽어도 버팁니다. 4대로 늘려도 견디는 수는 3대와 같아서 홀수로 둡니다.',
      ],
      callout: { type: 'warn', text: 'etcd를 잃으면 클러스터는 무엇을 띄워야 했는지 잊습니다. 직접 운영한다면 etcd 스냅샷 백업은 필수입니다.' },
      show: ['cp', 'etcd'],
      hide: ['dev'],
      focus: ['etcd'],
      flows: [{ path: ['api', 'etcd'], kind: 'data', n: 2 }, { path: ['etcd', 'api'], kind: 'data', delay: 1.2 }],
      panel: { title: 'etcd는 몇 대로?', icon: 'database', rows: [['1대', '장애 허용 0대', 'bad'], ['3대', '1대까지 버팀', 'ok'], ['4대', '여전히 1대까지', 'warn'], ['5대', '2대까지 버팀', 'ok']] },
      more: [
        {
          title: '동작 원리',
          body: [
            'etcd 멤버 중 하나가 <b>리더</b>가 되어 모든 쓰기를 받습니다. 리더는 변경을 다른 멤버에게 복제하고, 과반수가 디스크에 기록했다고 답해야 그 쓰기를 확정해요. 리더가 죽으면 남은 멤버가 투표로 새 리더를 뽑습니다. 과반수가 모이지 않으면 읽기 전용에 가까운 상태가 되어 클러스터 변경이 멈춥니다.',
            '오브젝트는 <code>/registry/pods/shop/api-…</code> 같은 키로 저장됩니다. 모든 쓰기에 번호(revision)가 붙고, API 서버는 이 번호를 <code>resourceVersion</code>으로 내보내 변경 감시(watch)에 씁니다.',
          ],
        },
        {
          title: '기본값과 한도',
          list: [
            '요청 하나의 크기에 상한(기본 약 1.5MiB)이 있어서, ConfigMap · Secret 같은 오브젝트 하나는 1MiB까지로 제한됩니다.',
            '저장 공간 할당량은 기본 2GB입니다. 넘으면 경보가 켜지고 쓰기를 거부하므로, 오래된 기록을 정리하는 압축(compaction)과 조각 모음이 필요합니다.',
            '디스크 쓰기 지연과 멤버 사이 네트워크 지연에 민감합니다. 빠른 SSD에, 멤버끼리 가까운 곳에 둡니다.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['직접 설치한 클러스터의 컨트롤 플레인 노드에서 스냅샷을 뜹니다(인증서 경로는 kubeadm 기본값).'],
          code: {
            title: 'cp-1 노드', lang: 'sh',
            text: `$ sudo etcdctl snapshot save /backup/etcd.db \\
    --endpoints=https://127.0.0.1:2379 \\
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
    --cert=/etc/kubernetes/pki/etcd/server.crt \\
    --key=/etc/kubernetes/pki/etcd/server.key
Snapshot saved at /backup/etcd.db`,
          },
        },
        {
          title: '관리형이라면',
          body: ['EKS · AKS · GKE · NKS에서는 사업자가 etcd를 운영하고 백업하며, 사용자는 etcd에 접근할 수 없습니다. 대신 매니페스트를 Git에 두고, 필요하면 오브젝트 단위 백업 도구(예: Velero)를 씁니다.'],
        },
      ],
    },
    {
      key: 'watch', kind: 'concept', title: '부품들은 API 서버를 지켜봅니다',
      body: [
        '스케줄러, 컨트롤러, kubelet은 "바뀐 것 있나요?"를 주기적으로 묻지 않습니다. API 서버에 <b>watch</b>를 열어 두고, 처음에 목록을 한 번 받은 뒤로는 <b>바뀐 것만 이벤트로</b>(추가 · 수정 · 삭제) 받아요.',
        '받은 내용은 각자 메모리 캐시에 두고 읽습니다. 그래서 수천 개의 Pod가 있어도 API 서버와 etcd의 부담이 크지 않고, 누가 무엇을 쓰면 관심 있는 부품이 곧바로 알아챕니다.',
      ],
      callout: { type: 'key', text: '부품끼리 직접 호출하지 않아도 일이 이어지는 비결입니다. 한쪽은 API 서버에 <b>쓰고</b>, 다른 쪽은 그것을 <b>지켜보다</b> 이어받습니다.' },
      hide: ['etcd'],
      show: ['sched', 'cm', 'w1', 'kl1', 'w2', 'kl2'],
      tags: [
        { on: 'sched', text: '새 Pod 감시', icon: 'eye', pos: 'right' },
        { on: 'cm', text: 'Deployment 감시', icon: 'eye', pos: 'left' },
        { on: 'kl1', text: '내 노드의 Pod', icon: 'eye', pos: 'left' },
      ],
      flows: [
        { path: ['api', 'sched'], kind: 'ctrl', n: 2, gap: 1.2 },
        { path: ['api', 'cm'], kind: 'ctrl', n: 2, gap: 1.2, delay: 0.3 },
        { path: ['api', 'kl1'], kind: 'ctrl', n: 2, gap: 1.2, delay: 0.6 },
        { path: ['api', 'kl2'], kind: 'ctrl', n: 2, gap: 1.2, delay: 0.9 },
      ],
      metrics: { gate: ['쓰기 → watch', 'ok'] },
      more: [
        {
          title: '동작 원리',
          body: [
            '부품들은 <b>informer</b>라는 공통 구조를 씁니다. 시작할 때 <b>list</b>로 전체 목록과 그 시점의 <code>resourceVersion</code>을 받고, 그 번호부터 <b>watch</b>를 엽니다. 이후 도착하는 이벤트로 로컬 캐시를 고치고, 처리할 오브젝트의 이름을 작업 큐에 넣어요.',
            '연결이 끊기면 마지막으로 본 번호부터 다시 watch합니다. 그 번호가 너무 오래돼 API 서버가 기록을 갖고 있지 않으면 <code>410 Gone</code>을 돌려주고, 부품은 처음부터 다시 list합니다. 그래서 잠시 끊겨도 결국 같은 상태를 보게 됩니다.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['<code>-w</code>(watch)를 붙이면 kubectl도 같은 방식으로 변경을 받아 한 줄씩 찍습니다. 다른 터미널에서 <code>apply</code>해 보세요.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pods -n shop -w
NAME                  READY  STATUS             AGE
api-5f6d8c7b9-2xkqp   0/1    Pending            0s
api-5f6d8c7b9-2xkqp   0/1    Pending            0s
api-5f6d8c7b9-2xkqp   0/1    ContainerCreating  0s
api-5f6d8c7b9-2xkqp   1/1    Running            3s`,
          },
        },
        {
          title: '출력 읽기',
          body: ['같은 Pending이 두 번 찍힌 것은 오류가 아닙니다. 첫 줄은 컨트롤러가 Pod를 <b>만든</b> 이벤트, 둘째 줄은 스케줄러가 노드를 <b>적어 넣은</b> 수정 이벤트예요. 이어서 kubelet이 상태를 바꿀 때마다 줄이 늘어납니다. 한 오브젝트를 여러 부품이 차례로 고쳐 쓰는 모습이 그대로 보입니다.'],
        },
      ],
    },
    {
      key: '스케줄러', kind: 'concept', title: '스케줄러: Pod의 자리를 정합니다',
      body: [
        '<b>스케줄러</b>는 아직 노드가 정해지지 않은 Pod를 지켜봅니다. 노드마다 남은 자원과 제약을 따져 <b>걸러 내고</b>(filter), 남은 후보에 <b>점수를 매겨</b>(score) 하나를 고른 뒤, Pod의 <code>spec.nodeName</code>에 그 노드를 적어 넣어요.',
        '컨테이너를 직접 띄우지는 않습니다. 이름을 적는 것까지가 스케줄러의 일이고, 실행은 그 노드의 kubelet이 이어받습니다.',
      ],
      callout: { type: 'tip', text: '고르는 기준(requests, 어피니티, taint 등)과 노드가 모자랄 때 늘리는 방법은 <b>스케줄링과 오토스케일링</b> 레슨에서 자세히 봅니다.' },
      show: ['p3'],
      focus: ['sched'],
      tags: [
        { on: 'sched', text: '걸러 내기 → 점수', icon: 'signpost', pos: 'right' },
        { on: 'p3', text: 'nodeName: worker-1', tone: 'accent', pos: 'bottom' },
      ],
      flows: [
        { path: ['api', 'sched'], kind: 'ctrl' },
        { path: ['sched', 'api'], kind: 'ctrl', delay: 0.9 },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 1.8 },
      ],
      more: [
        {
          title: '동작 원리',
          body: [
            '스케줄러는 대기열에서 Pod를 하나씩 꺼냅니다. <b>걸러 내기</b>에서는 요청한 CPU · 메모리를 받을 수 없는 노드, 붙은 taint를 견디지 못하는 노드, <code>nodeSelector</code>가 맞지 않는 노드를 뺍니다. <b>점수 매기기</b>에서는 자원이 고르게 쓰이는지, 같은 앱이 한 노드에 몰리지 않는지 등을 따져 가장 높은 노드를 고릅니다.',
            '결정은 Pod의 <code>binding</code>이라는 하위 리소스에 쓰는 것으로 끝납니다. 맞는 노드가 하나도 없으면 Pod는 <code>Pending</code>으로 남고, 스케줄러가 이유를 이벤트로 남긴 뒤 상황이 바뀌면 다시 시도합니다.',
          ],
        },
        {
          title: '출력 읽기',
          body: ['자리를 못 찾은 Pod의 <code>describe</code> 맨 아래입니다(메시지 줄바꿈은 편집).'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl describe pod api-5f6d8c7b9-hw7c8
Status:  Pending
Node:    <none>
Events:
  Type     Reason            From
  Warning  FailedScheduling  default-scheduler
    0/3 nodes are available: 1 node(s) had
    untolerated taint {node-role.kubernetes.io/
    control-plane: }, 2 Insufficient memory.`,
          },
        },
        {
          title: '읽는 법',
          list: [
            '<code>0/3</code>은 전체 3대 중 조건을 통과한 노드가 0대라는 뜻이고, 뒤에 노드별로 걸린 이유가 이어집니다.',
            '<code>Insufficient memory</code>면 Pod의 메모리 요청이 너무 크거나 노드가 꽉 찬 것입니다. 노드를 늘리거나 요청을 고칩니다.',
            '<code>untolerated taint</code>는 그 노드가 일부러 막아 둔 것입니다. 컨트롤 플레인 노드라면 정상이에요.',
          ],
        },
      ],
    },
    {
      key: '컨트롤러', kind: 'concept', title: '컨트롤러 매니저: 개수를 맞추는 일꾼들',
      body: [
        '<b>컨트롤러 매니저</b>(kube-controller-manager)는 여러 <b>컨트롤러</b>를 한 프로세스로 묶은 것입니다. Deployment · ReplicaSet · Node · Job · EndpointSlice 컨트롤러가 각자 맡은 종류의 오브젝트를 지켜보며, 모자란 것은 만들고 남는 것은 지웁니다.',
        '컨트롤러는 사슬처럼 이어집니다. Deployment 컨트롤러가 ReplicaSet을 만들면, ReplicaSet 컨트롤러가 그것을 보고 Pod를 만들어요.',
      ],
      callout: { type: 'cloud', text: '클라우드에는 <b>cloud-controller-manager</b>가 하나 더 있습니다. 클라우드 API를 불러 로드 밸런서를 만들고, 사라진 VM의 노드를 정리하는 일을 맡아요.' },
      show: ['p1', 'p2'],
      focus: ['cm'],
      tags: [
        { on: 'cm', text: 'Deployment → RS → Pod', icon: 'refresh', pos: 'left' },
        { on: 'p1', text: '주인: ReplicaSet', tone: 'info', pos: 'bottom' },
      ],
      flows: [
        { path: ['api', 'cm'], kind: 'ctrl' },
        { path: ['cm', 'api'], kind: 'ctrl', delay: 0.8 },
        { path: ['cm', 'api'], kind: 'ctrl', delay: 1.4 },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 2.2 },
      ],
      metrics: { want: 'api ×3', have: ['3 / 3', 'ok'] },
      more: [
        {
          title: '동작 원리',
          body: [
            '컨트롤러가 만든 오브젝트에는 <code>metadata.ownerReferences</code>로 "주인"이 적힙니다. Pod의 주인은 ReplicaSet, ReplicaSet의 주인은 Deployment예요. <b>가비지 컬렉터</b>는 주인이 사라진 오브젝트를 찾아 지웁니다. <code>kubectl delete deploy api</code> 한 번에 ReplicaSet과 Pod가 따라 사라지는 이유입니다.',
            '컨트롤 플레인을 여러 대로 둘 때 컨트롤러 매니저와 스케줄러도 여러 개 뜨지만, 실제로 일하는 것은 <b>리더 하나</b>입니다. <code>kube-system</code>의 Lease 오브젝트로 리더를 정하고, 리더가 멈추면 다른 하나가 이어받아요.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['Pod에서 출발해 주인을 거슬러 올라가 봅니다.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pod api-5f6d8c7b9-2xkqp -o \\
  jsonpath='{.metadata.ownerReferences[0].name}'
api-5f6d8c7b9

$ kubectl get rs api-5f6d8c7b9 -o \\
  jsonpath='{.metadata.ownerReferences[0].name}'
api

$ kubectl get lease -n kube-system
NAME                      HOLDER
kube-controller-manager   cp-2_7f3c…
kube-scheduler            cp-1_a91d…`,
          },
        },
        {
          title: '더 생각해 볼 것',
          body: ['같은 패턴은 클러스터 밖으로도 넓힐 수 있습니다. 새 오브젝트 종류(CRD)를 정의하고 그것을 지켜보는 컨트롤러를 직접 띄우면 <b>오퍼레이터</b>가 됩니다. 뒤에서 만날 Ingress 컨트롤러, External Secrets Operator, Argo CD가 모두 이렇게 동작해요.'],
        },
      ],
    },
    {
      key: '조정 루프', kind: 'concept', title: '원하는 상태와 실제 상태를 맞추는 루프',
      body: [
        '오브젝트에는 두 칸이 있습니다. 내가 쓰는 <code>spec</code>은 <b>원하는 상태</b>, 클러스터가 쓰는 <code>status</code>는 <b>실제 상태</b>입니다. 컨트롤러는 둘을 비교해 차이를 메우는 일을 끝없이 되풀이합니다. 이것이 <b>조정 루프</b>(reconcile)입니다.',
        '"하나 더 띄워라"라는 명령이 아니라 "3개여야 한다"는 상태를 맡겼기 때문에, 중간에 이벤트를 놓쳐도 다음 비교에서 다시 맞춥니다.',
      ],
      callout: { type: 'warn', text: '그래서 손으로 고친 값도, YAML에 적힌 필드라면 다음 <code>apply</code>가 YAML대로 되돌립니다. 진실은 저장소의 YAML에 두세요.' },
      hide: ['cp', 'sched', 'w1', 'kl1', 'w2', 'kl2', 'p1', 'p2', 'p3'],
      show: ['etcd'],
      focus: ['cm'],
      tags: [{ on: 'cm', text: '관찰 → 비교 → 조치', icon: 'repeat', pos: 'left' }],
      flows: [{ path: ['api', 'cm'], kind: 'ctrl', n: 3, gap: 1.2 }, { path: ['cm', 'api'], kind: 'ctrl', n: 3, gap: 1.2, delay: 0.6 }],
      code: {
        title: 'deploy/api 조회', lang: 'yaml', hl: [5, 6, 8, 9, 10],
        text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:              # 원하는 상태 (내가)
  replicas: 3
  # selector · template 생략
status:            # 실제 상태 (클러스터가)
  replicas: 3
  readyReplicas: 2   # 1개 부족
`,
      },
      metrics: { have: ['2 / 3', 'warn'] },
      more: [
        {
          title: '동작 원리',
          body: [
            '조정 루프는 <b>레벨 기반</b>(level-triggered)입니다. "Pod 하나가 죽었다"는 사건에 반응하는 것이 아니라, 깨어날 때마다 지금 상태 전체를 보고 "3개여야 하는데 2개다"를 계산해요. 그래서 이벤트가 두 번 와도 Pod를 두 개 더 만들지 않고, 놓쳐도 다음 비교에서 바로잡습니다.',
            '조치가 실패하면 컨트롤러는 그 오브젝트를 큐에 다시 넣고, 점점 간격을 늘려 재시도합니다. 문제가 풀리는 순간 저절로 맞춰지는 이유예요.',
          ],
        },
        {
          title: '출력 읽기',
          body: ['<code>generation</code>은 spec이 바뀐 횟수, <code>observedGeneration</code>은 컨트롤러가 마지막으로 처리한 spec의 번호입니다. 두 값이 다르면 컨트롤러가 아직 최신 spec을 따라잡지 못한 것이에요.'],
          code: {
            title: 'kubectl get deploy api -o yaml (일부)', lang: 'yaml',
            text: `metadata:
  generation: 7
status:
  observedGeneration: 7
  replicas: 3
  readyReplicas: 2
  conditions:
    - type: Available
      status: "True"
    - type: Progressing
      status: "True"
      reason: NewReplicaSetAvailable`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '장애 중 <code>kubectl edit</code>로 고친 값을 YAML에 옮기지 않아, 다음 배포 때 문제가 되살아납니다.',
            'ReplicaSet이 관리하는 Pod 하나를 직접 고칩니다. 그 Pod가 교체되면 새 Pod는 template대로 뜹니다.',
            'GitOps 도구를 쓰는 클러스터에서는 손으로 바꾼 값을 도구가 몇 분 안에 Git 내용대로 되돌립니다. GitOps 레슨에서 다시 봅니다.',
          ],
        },
      ],
    },
    {
      key: '워커 노드', kind: 'concept', title: '워커 노드: 실제로 일하는 곳',
      body: [
        '노드마다 <b>kubelet</b>이 하나씩 돕니다. API 서버에서 자기 노드에 배정된 Pod를 보고, <b>컨테이너 런타임</b>에 이미지를 받아 실행하라고 맡긴 뒤, 상태를 API 서버에 계속 보고합니다.',
        '런타임은 containerd나 CRI-O 같은 CRI 구현입니다. 1.24부터 Docker 엔진을 직접 쓰는 길(dockershim)은 사라졌지만, Docker로 빌드한 이미지는 표준(OCI) 형식이라 그대로 돕니다.',
      ],
      callout: { type: 'tip', text: '<b>kube-proxy</b>는 Service 주소로 온 트래픽이 Pod에 닿도록 노드에 규칙을 깔아 둡니다. Service 레슨에서 다시 만납니다.' },
      hide: ['etcd', 'cm'],
      show: ['cp', 'w1', 'kl1', 'rt1', 'px1', 'p1', 'p2'],
      focus: ['kl1'],
      tags: [
        { on: 'kl1', text: '실행하고 보고', icon: 'heart-pulse', pos: 'left' },
        { on: 'px1', text: 'Service 규칙', pos: 'bottom' },
      ],
      flows: [
        { path: ['api', 'kl1'], kind: 'ctrl' },
        { path: ['kl1', 'rt1'], kind: 'ctrl', delay: 0.8 },
        { path: ['rt1', 'p2'], kind: 'ctrl', delay: 1.4 },
        { path: ['kl1', 'api'], kind: 'res', delay: 2.2 },
      ],
      metrics: { have: ['3 / 3', 'ok'] },
      more: [
        {
          title: '동작 원리',
          body: [
            'kubelet은 CRI(gRPC 인터페이스)로 containerd에 "이 Pod의 샌드박스를 만들고, 이 이미지로 컨테이너를 띄워라"라고 요청합니다. containerd는 이미지를 받고, runc 같은 저수준 런타임이 리눅스 namespace와 cgroup으로 격리된 프로세스를 만들어요. Pod의 IP는 <b>CNI 플러그인</b>(예: Calico, Cilium, 클라우드의 VPC CNI)이 붙여 줍니다.',
            'kubelet은 약 10초마다 <code>kube-node-lease</code> 네임스페이스의 Lease를 갱신해 "살아 있다"고 알리고, 노드 상태와 Pod 상태도 따로 보고합니다. 갱신이 끊기면 컨트롤 플레인이 노드를 NotReady로 바꿉니다.',
          ],
        },
        {
          title: '직접 해보기',
          body: ['노드에 들어가 보면 docker 대신 <code>crictl</code>로 컨테이너를 봅니다.'],
          code: {
            title: 'worker-1 노드', lang: 'sh',
            text: `$ docker ps
docker: command not found

$ sudo crictl ps
CONTAINER      IMAGE         STATE    NAME
3f1c0a9d2b7e1  shop/api:1.4  Running  api
9ab27c4d10f3e  kube-proxy    Running  kube-proxy

$ kubectl get lease -n kube-node-lease
NAME       HOLDER     AGE
worker-1   worker-1   30d
worker-2   worker-2   30d`,
          },
        },
        {
          title: '실무 팁',
          list: [
            'kubelet은 노드의 systemd 서비스라 Pod 목록에 보이지 않습니다. kubelet 로그는 노드에서 <code>journalctl -u kubelet</code>으로 봅니다.',
            'kube-proxy는 보통 DaemonSet으로 노드마다 하나씩 뜹니다. 일부 CNI(예: Cilium)는 kube-proxy 없이 그 역할을 대신하기도 해요.',
            '노드의 디스크가 차면 kubelet이 이미지를 지우고, 그래도 모자라면 Pod를 내보냅니다(eviction). 노드 디스크도 모니터링 대상입니다.',
          ],
        },
      ],
    },
    {
      key: 'apply 여정', kind: 'solution', title: 'kubectl apply 한 번이 흘러가는 길',
      body: [
        '<code>kubectl apply -f api.yaml</code>을 치면 ① API 서버가 검사하고 etcd에 저장합니다. ② 컨트롤러가 이를 보고 Pod 3개를 만듭니다(아직 노드 없음). ③ 스케줄러가 Pod마다 노드를 정합니다. ④ 그 노드의 kubelet이 런타임으로 컨테이너를 띄웁니다.',
        '모든 화살표가 API 서버를 거칩니다. 각 부품은 자기 일만 하고 결과를 API 서버에 적으며, 다음 부품은 그것을 지켜보다 이어받습니다.',
      ],
      callout: { type: 'tip', text: '어느 부품이 무엇을 적었는지가 남기 때문에, Pod가 안 뜰 때 <b>어느 단계에서 멈췄는지</b>를 거꾸로 짚어 갈 수 있습니다.' },
      show: ['dev', 'etcd', 'cm', 'sched'],
      hide: ['px1'],
      set: { p1: { state: 'ok' }, p2: { state: 'ok' } },
      tags: [
        { on: 'api', text: '① 검사 · 저장', tone: 'accent', pos: 'bottom' },
        { on: 'cm', text: '② Pod 생성', tone: 'accent', pos: 'left' },
        { on: 'sched', text: '③ 노드 배정', tone: 'accent', pos: 'right' },
        { on: 'kl1', text: '④ 실행', tone: 'accent', pos: 'left' },
      ],
      flows: [
        { path: ['dev', 'api'], kind: 'ctrl' },
        { path: ['api', 'etcd'], kind: 'data', delay: 0.8 },
        { path: ['api', 'cm'], kind: 'ctrl', delay: 1.5 }, { path: ['cm', 'api'], kind: 'ctrl', delay: 2.2 },
        { path: ['api', 'sched'], kind: 'ctrl', delay: 2.9 }, { path: ['sched', 'api'], kind: 'ctrl', delay: 3.6 },
        { path: ['api', 'kl1', 'rt1', 'p2'], kind: 'ctrl', delay: 4.3 },
      ],
      metrics: { want: 'api ×3', have: ['0 → 3', 'ok'] },
      more: [
        {
          title: '누가 무엇을 적나',
          rows: [
            ['① kubectl', 'Deployment 오브젝트를 저장', 'info'],
            ['② Deployment 컨트롤러', 'ReplicaSet 생성', 'info'],
            ['③ ReplicaSet 컨트롤러', 'Pod 3개 생성 (노드 없음)', 'info'],
            ['④ 스케줄러', '각 Pod의 nodeName', 'accent'],
            ['⑤ kubelet', '컨테이너 실행 · Pod status', 'ok'],
          ],
        },
        {
          title: '멈춘 곳 찾기',
          list: [
            '<b>apply가 오류</b>: 인증 · 인가 · 어드미션 단계입니다. 메시지에 Forbidden이나 웹훅 이름이 나옵니다.',
            '<b>ReplicaSet은 있는데 Pod가 없음</b>: ReplicaSet의 이벤트에 <code>FailedCreate</code>가 있는지 봅니다. ResourceQuota 초과나 어드미션 거절이 흔해요.',
            '<b>Pod가 Pending, 노드 없음</b>: 스케줄러 단계입니다. <code>FailedScheduling</code> 이유를 읽습니다.',
            '<b>노드는 정해졌는데 ContainerCreating · ImagePullBackOff</b>: kubelet · 런타임 단계입니다. 이미지 이름, 레지스트리 인증, 볼륨 마운트를 봅니다.',
            '<b>Running이었다가 CrashLoopBackOff</b>: 쿠버네티스는 제 일을 다 했고, 앱이 시작하자마자 죽는 것입니다. 로그를 봅니다.',
          ],
        },
        {
          title: '더 생각해 볼 것',
          body: ['보통 이 모든 과정은 몇 초 안에 끝나고, 대부분의 시간은 이미지를 받는 데 씁니다. 이미지가 크거나 노드에 처음 받는 이미지라면 Pulling 단계가 길어져요.'],
        },
      ],
    },
    {
      key: '이벤트 읽기', kind: 'concept', title: 'describe와 events로 흔적 읽기',
      body: [
        '각 부품은 한 일을 <b>Event</b> 오브젝트로 남깁니다. <code>kubectl describe pod</code> 맨 아래의 Events 표가 그것이에요. <code>From</code> 칸이 누가 했는지, <code>Reason</code> 칸이 무엇을 했는지 말해 줍니다.',
        'Scheduled → Pulling → Pulled → Created → Started로 이어지면 정상입니다. 흐름이 끊긴 자리에 나오는 <code>Warning</code> 줄이 원인을 가리켜요.',
      ],
      callout: { type: 'warn', text: '이벤트는 기본 설정에서 <b>약 1시간</b> 뒤 지워집니다. 어제 장애의 흔적은 이벤트에 없으니, 로그와 모니터링에 따로 남겨야 합니다.' },
      hide: ['cp', 'etcd', 'cm', 'sched', 'w1', 'p1'],
      set: { p1: { state: null }, p2: { state: null } },
      code: {
        title: '터미널 (요약)', lang: 'sh', hl: [1, 6, 7, 10],
        text: `$ kubectl describe pod api-…-2xkqp
Node:     worker-1/10.0.1.11
Status:   Running
Events:
  Type    Reason     From
  Normal  Scheduled  default-scheduler
  Normal  Pulling    kubelet
  Normal  Pulled     kubelet
  Normal  Created    kubelet
  Normal  Started    kubelet`,
      },
      tags: [
        { on: 'api', text: 'Event 기록', icon: 'list', pos: 'bottom' },
        { on: 'kl1', text: 'Pulling → Started', pos: 'top' },
      ],
      flows: [
        { path: ['kl1', 'api'], kind: 'res', n: 2 },
        { path: ['dev', 'api'], kind: 'ctrl', delay: 1.2 },
        { path: ['api', 'dev'], kind: 'res', delay: 2 },
      ],
      more: [
        {
          title: '자주 보는 Warning',
          rows: [
            ['FailedScheduling', '스케줄러 · 맞는 노드 없음', 'warn'],
            ['FailedCreate', '컨트롤러 · 쿼터 · 어드미션', 'warn'],
            ['Failed + BackOff', 'kubelet · 이미지 받기 실패', 'bad'],
            ['FailedMount', 'kubelet · 볼륨 · Secret 없음', 'bad'],
            ['Unhealthy', 'kubelet · 프로브 실패', 'warn'],
            ['BackOff (재시작)', '앱이 시작 후 바로 종료', 'bad'],
          ],
        },
        {
          title: '직접 해보기',
          body: ['네임스페이스 전체를 시간 순으로, 또는 경고만 모아 봅니다. <code>Age</code> 칸의 <code>x5 over 3m</code>은 같은 이벤트가 3분 동안 다섯 번 반복됐다는 뜻이에요.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get events -n shop \\
    --sort-by=.lastTimestamp

$ kubectl get events -n shop \\
    --field-selector type=Warning
LAST SEEN  TYPE     REASON   OBJECT
12s        Warning  BackOff  pod/api-7c9d8f6b5-k2m4x
  Back-off restarting failed container api`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '이벤트만 보고 앱 문제를 찾으려 합니다. CrashLoopBackOff의 이벤트는 "재시작했다"는 사실뿐이에요. 원인은 <code>kubectl logs --previous</code>로 직전에 죽은 컨테이너의 로그에서 찾습니다.',
            'Pod 이벤트만 봅니다. Pod가 아예 없다면 ReplicaSet이나 Deployment를 <code>describe</code>해야 이벤트가 보입니다.',
          ],
        },
      ],
    },
    {
      key: '노드 장애', kind: 'case', title: '사례: 워커 노드 하나가 꺼졌습니다',
      body: [
        '워커 노드 2의 전원이 나갔습니다. kubelet의 하트비트가 끊기고 수십 초 뒤 노드는 <code>NotReady</code>가 됩니다. 기본 설정에서는 몇 분(약 5분) 더 기다린 뒤 그 노드의 Pod를 지우고, ReplicaSet 컨트롤러가 모자란 만큼 새로 만들며, 스케줄러가 살아 있는 노드를 고릅니다.',
        '아무도 깨지 않았습니다. 다만 복구는 분 단위라서, 노드 하나가 죽어도 버틸 만큼 Pod를 여러 노드에 나눠 두는 것이 먼저입니다.',
      ],
      callout: { type: 'warn', text: '컨트롤 플레인이 멈추면 반대입니다. 이미 뜬 Pod는 계속 돌지만, 배포도 복구도 멈춥니다. 운영 클러스터는 컨트롤 플레인을 여러 대로 두거나 관리형을 씁니다.' },
      show: ['cp', 'cm', 'sched', 'w1', 'p1', 'w2', 'kl2', 'q1', 'p3'],
      hide: ['dev', 'rt1'],
      set: { kl2: { state: 'down', badge: 'NotReady', tone: 'bad' }, q1: { state: 'down' }, p3: { state: 'ok' } },
      tags: [
        { on: 'q1', text: '노드와 함께 사라짐', tone: 'bad', pos: 'bottom' },
        { on: 'p3', text: '대신 새로 생성', tone: 'ok', pos: 'bottom' },
      ],
      flows: [
        { path: ['kl2', 'api'], kind: 'bad' },
        { path: ['cm', 'api'], kind: 'ctrl', delay: 0.9 },
        { path: ['sched', 'api'], kind: 'ctrl', delay: 1.6 },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 2.3 },
      ],
      metrics: { have: ['2 → 3', 'warn'], heal: ['자동 · 몇 분', 'ok'] },
      changes: [['-', '워커 노드 2와 그 위의 Pod'], ['+', '노드 1에 대체 Pod'], ['~', '사람의 개입 없음']],
      more: [
        {
          title: '동작 원리',
          body: [
            'Lease 갱신이 끊기고 유예 시간이 지나면 노드 컨트롤러가 노드의 Ready 조건을 <code>Unknown</code>으로 바꾸고 <code>node.kubernetes.io/unreachable</code> taint를 붙입니다. Pod에는 이 taint를 기본 <b>300초</b> 동안 견디는 toleration이 자동으로 들어가 있어서, 5분이 지나야 Pod가 내보내집니다.',
            '이 기다림은 일부러 둔 것입니다. 네트워크가 잠깐 흔들렸을 뿐인데 Pod를 바로 옮기면 더 큰 혼란이 생기니까요. 더 빨리 옮기고 싶은 앱은 Pod 스펙에서 <code>tolerationSeconds</code>를 줄일 수 있지만, 일시적 끊김에도 옮겨 다니게 됩니다.',
          ],
        },
        {
          title: '출력 읽기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get nodes
NAME       STATUS     ROLES    AGE
worker-1   Ready      <none>   30d
worker-2   NotReady   <none>   30d

$ kubectl describe node worker-2
Taints:  node.kubernetes.io/unreachable:NoExecute
Conditions:
  Type   Status   Reason
  Ready  Unknown  NodeStatusUnknown
         Kubelet stopped posting node status.`,
          },
        },
        {
          title: '실무 팁',
          list: [
            'replicas가 2 이상이어도 모두 한 노드에 있으면 소용없습니다. 여러 노드 · 여러 가용 영역에 나눠 두는 설정은 스케줄링 레슨에서 다룹니다.',
            '노드 업그레이드처럼 <b>계획된</b> 교체는 <code>kubectl drain</code>으로 Pod를 먼저 옮깁니다. 5분을 기다릴 필요가 없어요.',
            '꺼진 노드의 Pod는 한동안 <code>Terminating</code>으로 보일 수 있습니다. kubelet이 응답하지 않아 삭제 확인을 받지 못한 것이고, 대체 Pod는 이미 다른 노드에서 돕니다.',
          ],
        },
      ],
    },
    {
      key: '웹훅 장애', kind: 'case', title: '사례: 모든 배포가 웹훅에서 막혔다',
      body: [
        '어느 아침 모든 <code>kubectl apply</code>가 <code>failed calling webhook</code> 오류로 실패합니다. 클러스터에는 Pod 생성을 검사하는 정책 도구가 <b>어드미션 웹훅</b>으로 붙어 있는데, 그 도구의 Pod가 밤사이 노드와 함께 사라졌어요.',
        '웹훅의 <code>failurePolicy: Fail</code>은 "검사할 수 없으면 거절"입니다. 그래서 웹훅 Pod를 다시 띄울 Pod 생성마저 막힐 수 있습니다.',
      ],
      callout: { type: 'tip', text: '웹훅은 여러 개로 띄우고, <code>kube-system</code>과 웹훅 자신의 네임스페이스는 검사에서 빼 둡니다. 급할 때는 웹훅 설정을 잠시 지우는 것이 탈출구입니다.' },
      hide: ['cp', 'cm', 'sched', 'w1', 'kl1', 'p1', 'p2', 'w2', 'kl2', 'q1', 'p3'],
      show: ['dev', 'hook'],
      set: { kl2: { state: null, badge: null }, q1: { state: null }, p3: { state: null }, hook: { state: 'down' } },
      code: {
        title: '터미널', lang: 'sh', hl: [3, 4, 5, 9],
        text: `$ kubectl apply -f api.yaml
Error from server (InternalError):
Internal error occurred: failed
calling webhook "validate.policy.io":
Post "https://policy-svc.policy.svc
:443/validate": connection refused

$ kubectl get pods -n policy
No resources found in policy namespace.

$ kubectl get \\
    validatingwebhookconfigurations
NAME           WEBHOOKS  AGE
policy-config  1         90d`,
      },
      tags: [{ on: 'hook', text: '응답 없음', tone: 'bad', pos: 'bottom' }],
      flows: [
        { path: ['dev', 'api'], kind: 'ctrl' },
        { path: ['api', 'hook'], kind: 'bad', delay: 0.8 },
        { path: ['api', 'dev'], kind: 'bad', delay: 1.8 },
      ],
      metrics: { gate: ['웹훅에서 막힘', 'bad'] },
      changes: [['-', '정책 웹훅 Pod (노드와 함께)'], ['~', '모든 생성 · 수정 요청 거절']],
      more: [
        {
          title: '동작 원리',
          body: [
            'API 서버는 어드미션 단계에서 등록된 웹훅을 HTTPS로 부릅니다. 변경(mutating) 웹훅이 먼저, 검증(validating) 웹훅이 나중이에요. 웹훅 주소는 보통 클러스터 안의 Service이고, 응답을 기다리는 시간(<code>timeoutSeconds</code>)은 기본 10초입니다.',
            '웹훅 설정의 <code>rules</code>에 맞는 요청은 모두 웹훅을 거칩니다. 범위를 "모든 네임스페이스의 Pod 생성"으로 넓게 잡으면, 웹훅이 죽는 순간 클러스터 전체의 Pod 생성이 멈춥니다. 노드 장애로 Pod를 다시 만들어야 하는 바로 그때도요.',
          ],
        },
        {
          title: '예방 설정',
          code: {
            title: 'webhook 설정 (일부)', lang: 'yaml',
            text: `webhooks:
  - name: validate.policy.io
    failurePolicy: Fail
    timeoutSeconds: 5
    namespaceSelector:
      matchExpressions:
        - key: kubernetes.io/metadata.name
          operator: NotIn
          values: ["kube-system", "policy"]`,
          },
        },
        {
          title: '해결 순서',
          list: [
            '오류 메시지에 나온 웹훅 이름과 Service를 확인합니다.',
            '그 네임스페이스의 Pod와 엔드포인트를 봅니다. 웹훅 자신의 네임스페이스가 검사에서 빠져 있다면 Pod를 다시 띄울 수 있습니다.',
            '빠져 있지 않아 막혔다면 <code>kubectl delete validatingwebhookconfiguration policy-config</code>로 잠시 풀고, 도구를 복구한 뒤 설정을 다시 적용합니다. 그동안은 정책 검사가 없다는 점을 팀에 알리세요.',
            '보안 정책처럼 꼭 지켜야 하면 <code>Fail</code> + 여러 복제본, 있으면 좋은 기본값 주입이라면 <code>Ignore</code>를 고려합니다.',
          ],
        },
      ],
    },
    {
      key: '관리형 비교', kind: 'compare', title: '컨트롤 플레인은 누가 운영하나',
      body: [
        '직접 설치하면 컨트롤 플레인 노드, etcd 백업, 인증서 갱신, 버전 업그레이드가 모두 우리 몫입니다. <b>관리형 쿠버네티스</b>에서는 사업자가 이 부분을 운영하고, 우리는 API 서버 주소(엔드포인트)만 받아요.',
        '그래서 관리형에서는 <code>kube-system</code>에 apiserver · etcd Pod가 보이지 않습니다. 대신 컨트롤 플레인 로그를 클라우드 로그 서비스로 보내는 설정이 있어요.',
      ],
      callout: { type: 'cloud', text: '워커 노드와 그 위의 워크로드, RBAC, 매니페스트는 여전히 우리 것입니다. 네 서비스의 자세한 차이는 <b>관리형 쿠버네티스</b> 레슨에서 봅니다.' },
      hide: ['dev', 'hook'],
      show: ['cp', 'etcd', 'cm', 'sched', 'w1', 'kl1', 'p1', 'p2'],
      set: {
        cp: { label: '사업자가 운영' },
        api: { state: 'dim' }, etcd: { state: 'dim' }, cm: { state: 'dim' }, sched: { state: 'dim' },
      },
      panel: {
        title: '관리형 컨트롤 플레인', icon: 'cloud',
        rows: [
          ['AWS', 'EKS · 로그 → CloudWatch', 'aws'],
          ['Azure', 'AKS · 로그 → Azure Monitor', 'azure'],
          ['GCP', 'GKE · 로그 → Cloud Logging', 'gcp'],
          ['NCP', 'NKS · 사업자가 운영', 'ncp'],
        ],
      },
      tags: [{ on: 'kl1', text: '노드는 우리 몫', tone: 'accent', pos: 'left' }],
      flows: [{ path: ['api', 'kl1'], kind: 'ctrl', n: 2 }],
      metrics: { gate: ['API 엔드포인트', 'ok'], heal: ['컨트롤 플레인도', 'ok'] },
      more: [
        {
          title: '클러스터별로',
          rows: [
            ['AWS EKS', 'API · audit · scheduler 등 골라서 CloudWatch Logs로', 'aws'],
            ['Azure AKS', '진단 설정으로 kube-apiserver · kube-audit 로그 수집', 'azure'],
            ['GCP GKE', 'API 서버 · 스케줄러 · 컨트롤러 로그를 Cloud Logging으로', 'gcp'],
            ['NCP NKS', '컨트롤 플레인은 사업자, 워커 노드는 사용자가 관리', 'ncp'],
          ],
        },
        {
          title: '직접 해보기',
          body: ['관리형 클러스터의 <code>kube-system</code>에는 노드마다 도는 부품과 애드온만 보입니다(예: EKS).'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pods -n kube-system
NAME                       READY
aws-node-8x2lq             2/2
coredns-6b9575c64c-4kq2x   1/1
coredns-6b9575c64c-v7m9s   1/1
kube-proxy-7xk2p           1/1
# apiserver · etcd · scheduler는 없음`,
          },
        },
        {
          title: '여전히 우리 몫',
          list: [
            '<b>업그레이드 시점</b>: 사업자가 새 버전을 제공해도 언제 올릴지는 대개 우리가 정하고, 지원 기간이 끝나기 전에 올려야 합니다.',
            '<b>워커 노드</b>: OS 패치와 노드 교체. 관리형 노드 그룹이나 노드 풀이 이 일을 많이 덜어 줍니다.',
            '<b>권한과 백업</b>: 누가 클러스터에 접근하는지(RBAC, 클라우드 IAM 연동)와 매니페스트(Git)는 우리가 지킵니다.',
          ],
        },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 선언하면 클러스터가 맞춥니다',
      body: [
        '컨트롤 플레인의 <b>API 서버</b>는 유일한 입구, <b>etcd</b>는 유일한 기억입니다. <b>스케줄러</b>는 자리를 정하고 <b>컨트롤러</b>는 개수를 맞춥니다. 워커 노드의 <b>kubelet</b>은 런타임으로 컨테이너를 띄우고 상태를 보고합니다.',
        '모든 부품이 API 서버를 지켜보며 원하는 상태와 실제 상태의 차이를 메웁니다. 막히면 events로 멈춘 단계를 찾으세요. 다음 레슨에서는 우리가 선언하는 첫 오브젝트, Pod와 Deployment를 열어 봅니다.',
      ],
      set: {
        cp: { label: '컨트롤 플레인' },
        api: { state: null }, etcd: { state: null }, cm: { state: null }, sched: { state: null },
      },
      tags: [
        { on: 'etcd', text: '유일한 기억', icon: 'database', pos: 'left' },
        { on: 'sched', text: '자리 정하기', pos: 'right' },
        { on: 'kl1', text: '실행 · 보고', pos: 'left' },
      ],
      flows: [
        { path: ['api', 'cm'], kind: 'ctrl', n: 2, gap: 1.2 }, { path: ['cm', 'api'], kind: 'ctrl', n: 2, gap: 1.2, delay: 0.6 },
        { path: ['api', 'kl1'], kind: 'ctrl', delay: 0.3 },
      ],
      metrics: { have: ['3 / 3', 'ok'], gate: ['API 서버 하나', 'ok'] },
    },
  ],
  quiz: [
    {
      q: '자체 구축한 클러스터의 컨트롤 플레인이 30분 동안 통째로 멈췄습니다. 그동안 일어나는 일로 가장 맞는 것은?',
      options: [
        '모든 Pod가 즉시 멈춰 서비스가 중단된다',
        '이미 실행 중인 Pod는 계속 요청을 처리하지만, 배포 · 스케일 · 장애 복구는 일어나지 않는다',
        '워커 노드의 kubelet 중 하나가 컨트롤 플레인 역할을 넘겨받는다',
        'etcd의 데이터가 지워져 컨트롤 플레인이 돌아오면 모두 다시 배포해야 한다',
      ],
      answer: 1,
      step: 12,
      why: '컨테이너를 실제로 돌리는 것은 워커 노드의 kubelet과 런타임이라 이미 뜬 Pod는 계속 동작합니다. 하지만 결정하고 맞추는 쪽이 멈췄으니 그동안 죽은 Pod는 되살아나지 않습니다. kubelet이 역할을 넘겨받는 기능은 없고, etcd 데이터는 멈춘다고 지워지지 않습니다.',
    },
    {
      q: 'kubectl apply는 성공했는데 새 Pod가 계속 Pending이고, describe의 Node 칸이 <none>입니다. 어느 부품의 단계에서 멈춘 것일까요?',
      options: [
        '컨테이너 런타임: 이미지를 받지 못하고 있다',
        'etcd: 오브젝트가 저장되지 않았다',
        '스케줄러: 조건을 만족하는 노드를 찾지 못했다',
        'kubelet: 컨테이너를 시작하다 실패했다',
      ],
      answer: 2,
      step: 6,
      why: 'Pod가 만들어졌다는 것은 API 서버와 etcd, 컨트롤러까지는 지났다는 뜻입니다. 노드가 비어 있으니 스케줄러 단계이고, 이벤트의 FailedScheduling 메시지가 이유를 알려 줍니다. 런타임이나 kubelet 문제라면 노드가 정해진 뒤 ContainerCreating · ImagePullBackOff 같은 상태로 보입니다.',
    },
    {
      q: 'etcd 3대를 운영하던 팀이 "더 튼튼하게" 4대로 늘리자고 합니다. 가장 알맞은 판단은?',
      options: [
        '좋다. 4대면 2대가 죽어도 버틴다',
        '이득이 없다. 과반수가 3이 되어 버티는 대수는 여전히 1대다. 늘리려면 5대로',
        '짝수여야 투표가 동점이 나지 않아 더 안정적이다',
        'etcd는 대수와 무관하게 1대만 살아 있으면 동작한다',
      ],
      answer: 1,
      step: 4,
      why: 'etcd는 과반수가 살아 있어야 씁니다. 3대의 과반수는 2(1대 장애 허용), 4대의 과반수는 3(여전히 1대)입니다. 대수만 늘고 버티는 힘은 같으니 홀수로 둡니다. 짝수는 오히려 반반으로 갈라질 위험이 있습니다.',
    },
    {
      q: '장애 대응 중 누군가 kubectl scale로 api를 3개에서 6개로 늘렸습니다. 한 시간 뒤 CI가 replicas: 3이 적힌 YAML을 다시 apply했습니다. 결과는?',
      options: [
        '마지막 명령이 이기므로 6개가 유지된다',
        '두 값이 더해져 9개가 된다',
        '값이 충돌해 apply가 오류로 실패한다',
        'YAML의 3이 원하는 상태가 되어 컨트롤러가 3개로 줄인다',
      ],
      answer: 3,
      step: 8,
      why: 'apply는 YAML에 적힌 필드를 원하는 상태로 기록하고, 컨트롤러는 그 상태에 맞춥니다. 손으로 바꾼 값은 다음 apply에 사라집니다. 바꾼 내용을 지키려면 YAML(Git)을 고쳐야 합니다. HPA를 쓸 때 YAML에서 replicas를 빼는 것도 같은 이유입니다.',
    },
    {
      q: 'CI의 배포가 "deployments.apps is forbidden: User system:serviceaccount:ci:deployer cannot create resource deployments in namespace shop" 오류로 실패합니다. 어느 단계에서 거절된 것이고, 무엇을 고쳐야 할까요?',
      options: [
        '인가(RBAC) 단계: ci:deployer에 shop 네임스페이스의 Deployment 생성 권한을 주는 Role과 RoleBinding이 필요하다',
        '인증 단계: ServiceAccount 토큰이 만료되었으니 새로 발급한다',
        '어드미션 단계: 정책 웹훅이 이미지 태그를 거절했다',
        'etcd 단계: 저장 공간이 가득 찼다',
      ],
      answer: 0,
      step: 3,
      why: '메시지에 사용자 이름이 정확히 찍혔다는 것은 인증은 통과했다는 뜻이고, forbidden(403)은 "누구인지는 알지만 그 일은 허락되지 않았다"는 인가 단계의 거절입니다. 토큰 문제라면 Unauthorized(401), 웹훅 거절이라면 웹훅 이름이 메시지에 나옵니다.',
    },
    {
      q: '아침부터 모든 네임스페이스의 Pod 생성이 "failed calling webhook ... connection refused"로 실패합니다. 가장 먼저 할 일은?',
      options: [
        'API 서버를 재시작한다',
        '모든 Deployment를 지우고 다시 apply한다',
        '오류에 나온 웹훅의 Service와 Pod가 살아 있는지 확인하고, 복구할 수 없으면 웹훅 설정을 잠시 제거한다',
        'etcd 스냅샷으로 어제 상태로 되돌린다',
      ],
      answer: 2,
      step: 13,
      why: 'API 서버는 정상이고, 어드미션 단계에서 부르는 웹훅이 응답하지 않아 failurePolicy: Fail 규칙대로 거절하는 상황입니다. 원인인 웹훅을 살리거나, 그 웹훅 자신의 Pod조차 막혔다면 설정을 잠시 지워 탈출합니다. 재시작이나 재배포, etcd 복원은 웹훅이 죽어 있는 한 같은 오류를 냅니다.',
    },
    {
      q: '팀이 직접 만든 컨트롤러가 1초마다 API 서버에 전체 Pod 목록을 요청합니다. 클러스터가 커지자 API 서버 부하가 크게 올랐습니다. 가장 알맞은 개선은?',
      options: [
        '요청 간격을 0.1초로 줄여 응답을 더 빨리 받는다',
        'API 서버를 거치지 않고 etcd를 직접 읽는다',
        '컨트롤러를 노드마다 하나씩 띄워 부하를 나눈다',
        '한 번 list한 뒤 watch로 변경만 받고, 로컬 캐시(informer)에서 읽도록 바꾼다',
      ],
      answer: 3,
      step: 5,
      why: '쿠버네티스 부품들은 list 한 번과 watch로 바뀐 것만 받아 캐시에 두기 때문에 규모가 커져도 버팁니다. 폴링을 더 자주 하거나 복제본을 늘리면 부하만 늘어납니다. etcd에 직접 접근하는 것은 API 서버뿐이어야 인증 · 인가 · 검사를 우회하지 않습니다.',
    },
    {
      q: 'Pod 이벤트가 Scheduled, Pulling까지 나온 뒤 Warning Failed(ErrImagePull)와 BackOff가 반복됩니다. 무엇부터 확인할까요?',
      options: [
        '이미지 이름과 태그가 맞는지, 비공개 레지스트리라면 인증 정보(imagePullSecrets 등)가 있는지',
        '노드의 CPU가 부족한지',
        '앱의 로그에 예외가 있는지',
        'Service의 셀렉터가 맞는지',
      ],
      answer: 0,
      step: 11,
      why: 'Scheduled가 있으니 스케줄러는 지났고, kubelet이 이미지를 받는 단계에서 실패하고 있습니다. 오타가 난 태그나 레지스트리 인증 누락이 가장 흔한 원인입니다. 컨테이너가 시작조차 못 했으니 앱 로그는 없고, Service는 Pod 실행과 무관합니다.',
    },
    {
      q: '어제 밤 api Pod가 여러 번 재시작된 원인을 오늘 아침 kubectl get events로 찾으려는데 관련 기록이 전혀 없습니다. 가장 그럴듯한 이유는?',
      options: [
        '재시작은 이벤트로 남지 않는다',
        '이벤트는 기본적으로 약 1시간 뒤 지워지므로 이미 사라졌다. 로그와 모니터링 기록에서 찾아야 한다',
        'kubectl get events는 Warning을 보여 주지 않는다',
        '네임스페이스를 지정하면 이벤트가 보이지 않는다',
      ],
      answer: 1,
      step: 11,
      why: 'Event는 오래 보관하는 기록이 아니라 최근 상황을 보여 주는 오브젝트라 기본 설정에서 약 1시간 뒤 정리됩니다. 지난 장애를 조사하려면 이벤트를 수집해 두는 모니터링이나 로그 시스템이 필요합니다. 재시작은 BackOff 같은 이벤트로 남고, get events는 Warning도 보여 줍니다.',
    },
    {
      q: '워커 노드에 ssh로 들어가 docker ps를 쳤더니 명령이 없다고 나옵니다. kubectl로는 그 노드에 Pod가 잘 돌고 있습니다. 어떻게 이해해야 할까요?',
      options: [
        '노드가 고장 나 컨테이너가 실제로는 돌지 않는다',
        'kubelet이 꺼져 있어 컨테이너가 보이지 않는다',
        '노드의 런타임이 containerd 같은 CRI 구현이라 docker가 없어도 정상이다. crictl로 컨테이너를 본다',
        'Pod는 컨트롤 플레인에서 돌기 때문에 워커 노드에는 없다',
      ],
      answer: 2,
      step: 9,
      why: '쿠버네티스 1.24부터 Docker 엔진을 직접 쓰는 길이 사라졌고, 대부분의 노드는 containerd나 CRI-O로 컨테이너를 돌립니다. Docker로 빌드한 이미지는 OCI 표준이라 그대로 실행됩니다. 노드에서 컨테이너를 보려면 crictl을 씁니다.',
    },
    {
      q: 'replicas: 2인 결제 서비스의 Pod 둘이 모두 같은 노드에 있었고, 그 노드가 꺼지자 약 5분 동안 결제가 멈췄습니다. 재발을 막는 데 가장 효과적인 것은?',
      options: [
        'Pod를 서로 다른 노드(가능하면 다른 가용 영역)에 나눠 두도록 설정한다',
        'replicas를 2에서 4로 늘리기만 한다',
        'kubelet의 하트비트 간격을 1초로 줄인다',
        '노드가 꺼지면 사람이 바로 Pod를 지우도록 알람을 건다',
      ],
      answer: 0,
      step: 12,
      why: '자가 복구는 분 단위라서, 노드 하나가 죽어도 남은 복제본이 요청을 받을 수 있게 처음부터 나눠 두는 것이 핵심입니다. 개수만 늘려도 한 노드에 몰리면 같은 일이 생기고, 하트비트를 줄여도 대체 Pod가 뜨는 시간은 남습니다. 사람이 개입하는 것은 오케스트레이션을 쓰는 이유와 반대입니다.',
    },
    {
      q: '관리형 클러스터(EKS · AKS · GKE · NKS 중 하나)에서 kube-system을 봤더니 kube-apiserver와 etcd Pod가 없습니다. 어떻게 판단해야 할까요?',
      options: [
        '컨트롤 플레인이 설치되지 않아 클러스터가 동작하지 않는다',
        '권한이 부족해 숨겨져 있으니 관리자 권한으로 다시 본다',
        'etcd가 없으니 오브젝트가 저장되지 않는다',
        '정상이다. 사업자가 컨트롤 플레인을 따로 운영하며, 필요한 로그는 클라우드 로그 서비스로 받는다',
      ],
      answer: 3,
      step: 14,
      why: '관리형 쿠버네티스는 컨트롤 플레인을 사용자 클러스터 밖에서 운영하고 API 엔드포인트만 내줍니다. 그래서 kube-system에는 kube-proxy, CoreDNS, CNI 같은 노드 쪽 부품과 애드온만 보입니다. 컨트롤 플레인 로그가 필요하면 각 클라우드의 로그 서비스로 보내도록 설정합니다.',
    },
    {
      q: 'kubectl delete deployment api를 했더니 ReplicaSet과 Pod까지 모두 사라졌습니다. 이것이 가능한 이유는?',
      options: [
        'kubectl이 이름이 api로 시작하는 모든 오브젝트를 지운다',
        'ReplicaSet과 Pod의 ownerReferences에 주인이 적혀 있어, 가비지 컬렉터가 주인이 사라진 오브젝트를 정리한다',
        '스케줄러가 노드 배정을 취소하면서 Pod를 지운다',
        'etcd가 같은 네임스페이스의 오브젝트를 함께 지운다',
      ],
      answer: 1,
      step: 7,
      why: '컨트롤러가 만든 오브젝트에는 주인이 기록되고, 주인이 지워지면 가비지 컬렉터가 딸린 오브젝트를 연쇄로 지웁니다. 이름이 비슷하다고 지워지는 것이 아니며, 스케줄러나 etcd는 삭제를 결정하지 않습니다.',
    },
    {
      q: '개발용 매니페스트를 적용했는데, 알고 보니 운영 클러스터에 들어갔습니다. 이런 사고를 막는 가장 직접적인 습관은?',
      options: [
        'kubectl을 다시 설치한다',
        '매니페스트에서 namespace를 지운다',
        'apply 전에 kubectl config current-context로 대상 클러스터를 확인하고, 프롬프트에 context를 띄워 둔다',
        '운영 클러스터의 API 서버를 꺼 둔다',
      ],
      answer: 2,
      step: 2,
      why: 'kubectl은 kubeconfig의 현재 context가 가리키는 클러스터로 요청을 보냅니다. 여러 클러스터를 다루면 context를 확인하는 습관과 눈에 보이는 표시가 가장 확실한 예방입니다. 운영 쪽은 RBAC으로 쓰기 권한을 좁히는 것도 함께 합니다.',
    },
  ],
};
