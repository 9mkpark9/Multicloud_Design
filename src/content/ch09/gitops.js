export default {
  id: 'gitops',
  learn: [
    'push 배포의 두 가지 문제: 밖에 둔 클러스터 키와 드리프트',
    'pull 방식: 클러스터 안의 Argo CD가 Git을 당겨 오기',
    'Application · sync · health · self-heal · prune 읽기',
    '설정 저장소 구조와 환경 사이의 승격',
    '배포 = 이미지 태그를 바꾸는 PR, 롤백 = git revert',
    'ApplicationSet으로 여러 클러스터 운영하기',
  ],
  legend: [['build', '커밋 · 이미지'], ['data', 'Git에서 당겨 오기'], ['ctrl', '적용 · sync · PR'], ['bad', '수동 변경 · 충돌']],
  metrics: [
    { id: 'cred', label: '클러스터 키', icon: 'key' },
    { id: 'drift', label: '드리프트', icon: 'shuffle' },
    { id: 'deploy', label: '배포 방법', icon: 'rocket' },
    { id: 'rb', label: '롤백', icon: 'undo' },
  ],
  scene: {
    zones: {
      k8s: { at: [3.4, -1.7], size: [2.2, 4.5], label: 'prod 클러스터', color: 'red' },
    },
    nodes: {
      dev: { kind: 'client', at: [0.6, 5], label: '개발자' },
      src: { at: [-0.2, 3.4], label: '앱 저장소', sub: 'shop-api', icon: 'git', color: 'slate' },
      git: { at: [2.5, 3.1], label: 'Git 저장소', sub: 'shop-api', icon: 'git', color: 'slate' },
      ci: { at: [-0.7, -0.7], label: 'CI', sub: '파이프라인', icon: 'bot', color: 'teal' },
      reg: { kind: 'cyl', at: [1.6, -1.2], label: '레지스트리', icon: 'container', color: 'orange' },
      argo: { at: [4.4, 1.6], label: 'Argo CD', sub: '클러스터 안', icon: 'refresh', color: 'navy' },
      app: { at: [4.4, -0.8], label: 'shop-api', sub: 'Pod × 3', icon: 'boxes', color: 'blue' },
      ops: { kind: 'client', at: [6.9, 0.4], label: '운영자' },
      hpa: { kind: 'tile', at: [6.6, -1.4], label: 'HPA', icon: 'gauge', color: 'yellow' },
      fDev: { kind: 'tile', at: [-0.2, 0.6], label: 'overlays/dev', icon: 'folder', color: 'gray' },
      fStg: { kind: 'tile', at: [1.3, -0.9], label: 'overlays/stg', icon: 'folder', color: 'blue' },
      fProd: { kind: 'tile', at: [2.8, -2.4], label: 'overlays/prod', icon: 'folder', color: 'red' },
      // the last picture: one repository, four clusters
      cA: { at: [0, 0.6], label: 'EKS', sub: 'Argo CD', icon: 'helm', color: 'aws' },
      cZ: { at: [5, 0.6], label: 'AKS', sub: 'Argo CD', icon: 'helm', color: 'azure' },
      cG: { at: [0, 5.6], label: 'GKE', sub: 'Argo CD', icon: 'helm', color: 'gcp' },
      cN: { at: [5, 5.6], label: 'NKS', sub: 'Argo CD', icon: 'helm', color: 'ncp' },
    },
    edges: {
      e_dev: { from: 'dev', to: 'git' },
      e_gc: { from: 'git', to: 'ci' },
      e_push: { from: 'ci', to: 'app', label: 'kubectl apply' },
      e_ops: { from: 'ops', to: 'app', style: 'dashed', tone: 'bad' },
      e_pull: { from: 'git', to: 'argo', bi: true },
      e_sync: { from: 'argo', to: 'app' },
      e_hpa: { from: 'hpa', to: 'app', style: 'dashed' },
      e_src_ci: { from: 'src', to: 'ci' },
      e_ci_reg: { from: 'ci', to: 'reg' },
      e_pr: { from: 'ci', to: 'git', label: 'PR', off: true },
      e_reg_app: { from: 'reg', to: 'app', style: 'dashed', arrow: false },
      e_fd: { from: 'git', to: 'fDev', style: 'dashed', arrow: false },
      e_ds: { from: 'fDev', to: 'fStg' },
      e_sp: { from: 'fStg', to: 'fProd' },
      m1: { from: 'git', to: 'cA', style: 'dashed' },
      m2: { from: 'git', to: 'cZ', style: 'dashed' },
      m3: { from: 'git', to: 'cG', style: 'dashed' },
      m4: { from: 'git', to: 'cN', style: 'dashed' },
    },
  },
  codes: {
    app: {
      title: 'application.yaml',
      lang: 'yaml',
      text: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: shop-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://git.example/shop-api
    targetRevision: main
    path: deploy/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: shop
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
`,
    },
    status: {
      title: 'terminal',
      lang: 'sh',
      text: `$ argocd app get shop-api
Name:          argocd/shop-api
Repo:          https://git.example/shop-api
Target:        main
Path:          deploy/overlays/prod
Sync Policy:   Automated (Prune)
Sync Status:   OutOfSync from main (f41c2aa)
Health Status: Progressing

KIND        NAME      STATUS     HEALTH
Service     shop-api  Synced     Healthy
ConfigMap   shop-api  Synced
Deployment  shop-api  OutOfSync  Progressing
`,
    },
    tree: {
      title: 'shop-config 저장소',
      lang: 'text',
      text: `shop-config/
├── apps/shop-api/
│   ├── base/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       ├── dev/kustomization.yaml
│       ├── stg/kustomization.yaml
│       └── prod/
│           ├── kustomization.yaml
│           └── resources-patch.yaml
└── argocd/
    ├── shop-api-dev.yaml
    ├── shop-api-stg.yaml
    └── shop-api-prod.yaml
`,
    },
    revert: {
      title: 'shop-config 저장소',
      lang: 'sh',
      text: `$ git log --oneline -3
f41c2aa shop-api: a3f9c2e 배포 (#128)
7d09e15 shop-api: replicas 3 → 4
2c8b6f0 shop-api: 9b1d4f7 배포 (#121)

$ git revert f41c2aa
[main 5e7a9d3] Revert "shop-api: a3f9c2e 배포"

$ git push origin main
# Argo CD가 변경을 감지 → 9b1d4f7로 sync
`,
    },
  },
  steps: [
    {
      key: 'push 배포', kind: 'problem', title: '파이프라인이 클러스터에 밀어 넣으면',
      body: [
        '이미지도 배포 전략도 준비됐습니다. 남은 질문은 <b>누가 클러스터에 적용하느냐</b>예요. 가장 흔한 시작은 CI 파이프라인의 마지막 단계에서 <code>kubectl apply</code>를 실행하는 <b>push 방식</b>입니다.',
        '그러려면 클러스터 밖의 CI가 <b>운영 클러스터의 자격 증명</b>(kubeconfig)을 쥐고 있어야 하고, API 서버도 CI에서 닿도록 열어야 합니다. CI는 남이 만든 액션과 의존성을 실행하는 곳이라, 여기서 키가 새면 클러스터 전체가 넘어갑니다.',
      ],
      callout: { type: 'warn', text: '또 하나. 파이프라인은 <b>돌 때만</b> 클러스터를 건드립니다. 그 사이에 클러스터가 Git과 같은지는 아무도 확인하지 않아요.' },
      show: ['dev', 'git', 'ci', 'k8s', 'app'],
      tags: [{ on: 'ci', text: 'kubeconfig 보관', tone: 'bad', icon: 'key' }],
      flows: [
        { path: ['dev', 'git'], kind: 'build' },
        { path: ['git', 'ci'], kind: 'build', delay: 1 },
        { path: ['ci', 'app'], kind: 'ctrl', n: 2, delay: 2 },
      ],
      metrics: { cred: ['CI Secrets에', 'bad'], drift: '확인 안 함', deploy: 'kubectl apply', rb: '파이프라인 재실행' },
      more: [
        { title: '설정 예시', body: ['push 방식의 전형적인 마지막 job입니다. 동작은 하지만, 이 job이 쥔 권한이 곧 운영 클러스터 전체의 권한이에요.'], code: { title: 'deploy.yml', lang: 'yaml', text: "deploy:\n  needs: image\n  runs-on: ubuntu-latest\n  steps:\n    - uses: actions/checkout@v4\n    - run: echo \"$KUBECONFIG_B64\" | base64 -d > kc\n      env:\n        KUBECONFIG_B64: ${{ secrets.PROD_KUBECONFIG }}\n    - run: kubectl --kubeconfig kc apply -k deploy/prod" } },
        { title: 'push의 약점 정리', list: [
          '<b>자격 증명</b>: 운영 클러스터의 강한 권한이 CI라는 넓은 공격 면에 놓입니다. 앞 레슨의 OIDC로 키를 없애도 "CI가 클러스터를 바꿀 수 있다"는 사실은 남아요.',
          '<b>네트워크</b>: API 서버를 CI 러너가 닿는 곳(대개 인터넷)에 열거나, 사설망 안에 self-hosted 러너를 둬야 합니다.',
          '<b>관찰</b>: 적용 후의 상태를 아무도 계속 보지 않습니다. 실패한 apply가 절반만 적용되고 끝나기도 해요.',
        ] },
        { title: '그래도 push가 맞을 때', body: ['클러스터가 하나뿐인 작은 팀, 실험용 환경, 쿠버네티스가 아닌 대상(서버리스 함수 등)에는 push가 더 단순할 수 있습니다. 중요한 것은 방식 이름보다 <b>운영 클러스터의 쓰기 권한을 어디에 두느냐</b>예요.'] },
      ],
    },
    {
      key: '드리프트', kind: 'case', title: '사례: 새벽의 kubectl edit',
      body: [
        '새벽 장애 때 운영자가 <code>kubectl edit</code>로 메모리 limit을 256Mi에서 512Mi로 올려 급한 불을 껐습니다. Git의 매니페스트는 256Mi 그대로 남았고요.',
        '2주 뒤, 상관없는 기능을 배포하면서 파이프라인이 Git의 256Mi를 다시 apply 했습니다. Pod는 또 OOM으로 죽기 시작했고, 팀은 같은 장애를 처음부터 다시 추적해야 했습니다.',
      ],
      callout: { type: 'key', text: 'Git과 실제 클러스터가 어긋난 상태가 <b>드리프트</b>입니다(8장의 Terraform에서도 봤죠). push 방식에서는 다음 배포가 덮어쓸 때까지 아무도 모릅니다.' },
      hide: ['dev'],
      show: ['ops'],
      set: { app: { badge: '실제 512Mi', tone: 'warn' } },
      tags: [
        { on: 'git', text: 'Git: 256Mi', icon: 'file-code', pos: 'bottom' },
        { on: 'ops', text: 'kubectl edit', tone: 'bad', icon: 'terminal', pos: 'left' },
      ],
      flows: [
        { path: ['ops', 'app'], kind: 'bad' },
        { path: ['git', 'ci', 'app'], kind: 'ctrl', n: 2, delay: 1.8 },
      ],
      metrics: { drift: ['2주간 모름', 'bad'] },
      changes: [['~', '클러스터만 512Mi로 바뀜'], ['-', 'Git에는 기록이 없음'], ['-', '다음 배포가 256Mi로 덮어씀']],
      more: [
        { title: '직접 해보기', body: ['드리프트는 찾으려고 해야 보입니다. Git의 매니페스트와 클러스터의 실제 상태를 비교해 봅니다.'], code: { title: 'terminal', lang: 'sh', text: '$ kubectl diff -k deploy/prod\ndiff -u -N /tmp/LIVE/apps.v1.Deployment.shop.shop-api\n         /tmp/MERGED/apps.v1.Deployment.shop.shop-api\n@@ -41,7 +41,7 @@\n           limits:\n-            memory: 512Mi\n+            memory: 256Mi' }, body: ['<code>-</code>는 지금 클러스터(LIVE), <code>+</code>는 Git대로 적용하면 될 값입니다. 이 차이가 2주 동안 아무도 모르게 있었어요.'] },
        { title: '드리프트가 생기는 길', list: [
          '장애 대응 중의 <code>kubectl edit · scale · set image</code>.',
          '콘솔이나 대시보드에서 누른 버튼.',
          '다른 도구(Helm을 손으로 실행, 다른 파이프라인)가 같은 리소스를 건드림.',
          '클러스터 안의 컨트롤러·웹훅이 필드를 덧붙임: 이것은 정상적인 차이라 무시 규칙이 필요합니다(8단계).',
        ] },
        { title: '교훈', body: ['급한 수정 자체는 잘못이 아닙니다. 문제는 그 변경이 <b>Git으로 돌아가지 않았다</b>는 것이에요. 팀은 "장애 중 수동 변경은 30분 안에 PR로 남긴다"는 규칙을 만들었지만, 사람의 규칙은 잊힙니다. 다음 단계부터 이것을 기계가 지키게 합니다.'] },
      ],
    },
    {
      key: 'pull 방식', kind: 'solution', title: 'pull: 클러스터가 Git을 당겨 옵니다',
      body: [
        '방향을 뒤집습니다. 클러스터 <b>안</b>에 <b>Argo CD</b> 같은 에이전트를 두면, 이 에이전트가 Git 저장소를 주기적으로 당겨 와(<b>pull</b>) 클러스터의 실제 상태와 비교하고, 다르면 Git에 맞춥니다. 이 운영 방식이 <b>GitOps</b>예요.',
        '클러스터 자격 증명은 밖으로 나가지 않습니다. Argo CD는 Git을 <b>읽을</b> 권한만 있으면 되고, 클러스터에는 안에서 ServiceAccount로 접근하니까요. CI는 빌드와 테스트까지만 맡고, API 서버를 CI에 열어 줄 이유도 사라집니다.',
      ],
      callout: { type: 'key', text: '7장의 컨트롤러와 같은 원리입니다. Deployment가 "Pod 3개"를 끝까지 맞추듯, Argo CD는 "<b>Git에 적힌 대로</b>"를 끝까지 맞춥니다. Git이 <b>유일한 진실</b>이 돼요.' },
      hide: ['ops', 'e_push'],
      show: ['argo'],
      set: { app: { badge: null }, ci: { sub: '빌드 · 테스트' } },
      focus: ['argo'],
      tags: [
        { on: 'ci', text: '클러스터 키 없음', tone: 'ok', icon: 'key' },
        { on: 'argo', text: 'Git과 비교 → 맞춤', tone: 'accent', icon: 'refresh', dx: -24 },
      ],
      flows: [
        { path: ['argo', 'git'], kind: 'ctrl' },
        { path: ['git', 'argo'], kind: 'data', n: 2, delay: 1 },
        { path: ['argo', 'app'], kind: 'ctrl', n: 2, delay: 2 },
      ],
      metrics: { cred: ['클러스터 안에만', 'ok'], drift: ['주기적으로 비교', 'ok'], deploy: 'Git에 커밋' },
      changes: [['+', '클러스터 안의 Argo CD'], ['-', 'CI의 kubeconfig'], ['~', '방향: push → pull']],
      more: [
        { title: 'GitOps의 네 원칙', list: [
          '<b>선언형</b>: 원하는 상태를 "무엇"으로 적습니다(매니페스트).',
          '<b>버전 관리·불변</b>: 그 선언을 Git에 두어 모든 변경이 커밋으로 남습니다.',
          '<b>자동으로 당겨 옴</b>: 에이전트가 승인된 선언을 스스로 가져갑니다.',
          '<b>계속 맞춤</b>: 한 번 적용하고 끝이 아니라, 어긋나면 계속 되돌립니다.',
        ] },
        { title: 'push vs pull', rows: [
          ['클러스터 쓰기 권한', 'push: CI · pull: 클러스터 안', 'ok'],
          ['방화벽', 'push: API 서버 열기 · pull: 밖으로만', 'ok'],
          ['드리프트', 'push: 다음 배포까지 모름 · pull: 계속 비교', 'ok'],
          ['배포 결과 확인', 'push: CI 로그 · pull: Argo CD 상태', 'info'],
        ] },
        { title: '흔한 오해', body: ['"GitOps면 CI가 필요 없다"는 틀렸습니다. 빌드·테스트·이미지 푸시는 여전히 CI의 일이고, GitOps는 그 뒤 <b>배포와 운영 상태 유지</b>를 맡습니다. 또 Argo CD도 Git 읽기 자격 증명(배포 키 등)은 필요하니, 읽기 전용으로 최소 범위만 주세요.'] },
      ],
    },
    {
      key: 'Argo 내부', kind: 'concept', title: 'Argo CD 안에서 일어나는 일',
      body: [
        'Argo CD는 몇 개의 부품으로 나뉩니다. <b>repo-server</b>는 Git을 받아 Kustomize·Helm을 <b>렌더링</b>해 최종 매니페스트를 만들고, <b>application-controller</b>가 그것을 클러스터의 실제 리소스와 <b>비교</b>해 적용합니다.',
        '비교는 기본으로 <b>몇 분마다</b> 돌고, Git에 <b>웹훅</b>을 걸면 push 직후 바로 돕니다. 화면과 CLI는 <b>argocd-server</b>가 맡아요.',
      ],
      callout: { type: 'tip', text: '"머지했는데 왜 반영이 안 되죠?"의 절반은 아직 다음 비교 주기가 안 온 것입니다. 웹훅을 걸거나 <b>Refresh</b>를 눌러 바로 비교하게 할 수 있어요.' },
      hide: ['ci'],
      set: { argo: { badge: '약 3분마다', tone: 'info' } },
      panel: { title: 'Argo CD의 부품', icon: 'settings', rows: [['repo-server', 'Git 받기 · 렌더링', 'info'], ['controller', '실제 상태와 비교 · 적용', 'accent'], ['웹훅', 'push 즉시 비교 시작', 'ok']] },
      flows: [
        { path: ['git', 'argo'], kind: 'ctrl' },
        { path: ['git', 'argo'], kind: 'data', n: 2, delay: 0.7 },
        { path: ['argo', 'app'], kind: 'ctrl', delay: 1.8 },
        { path: ['app', 'argo'], kind: 'ctrl', delay: 2.6 },
      ],
      more: [
        { title: '동작 원리', body: [
          'controller는 렌더링된 "원하는 상태"와 API 서버에서 읽은 "실제 상태"를 리소스마다 비교합니다. 실제 상태에는 API 서버가 채운 기본값과 상태 필드가 섞여 있으니, Git에 <b>적힌 필드만</b> 비교하는 식으로 차이를 계산해요. 그래서 기본값을 안 적었다고 OutOfSync가 되지는 않습니다.',
          '렌더링 결과는 커밋별로 캐시되고, 클러스터 쪽은 watch로 변화를 받아 둡니다. Git을 주기적으로 묻는 간격은 설정으로 바꿀 수 있고, 저장소가 많으면 웹훅이 Git 서버 부하도 줄여 줍니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ kubectl -n argocd get pods\nNAME                                  READY  STATUS\nargocd-application-controller-0       1/1    Running\nargocd-repo-server-6d8f9c7b5-x2kqp    1/1    Running\nargocd-server-7c9d5f6b8-p4m2n         1/1    Running\nargocd-redis-5b6c8d9f7-q8w3e          1/1    Running\n$ argocd app get shop-api --refresh   # 즉시 다시 비교' } },
        { title: '실무 팁', list: [
          'Argo CD 자신도 Git으로 관리합니다. 설치 매니페스트와 Application 목록을 저장소에 두고, 상위 Application 하나가 나머지를 만드는 <b>app of apps</b> 구성이 흔해요.',
          '<b>AppProject</b>로 "이 팀의 Application은 이 저장소에서, 이 네임스페이스에만"처럼 경계를 겁니다. <code>default</code> 프로젝트는 제한이 없으니 운영에서는 따로 만드세요.',
        ] },
      ],
    },
    {
      key: 'Application', kind: 'concept', title: 'Application: 무엇을 어디에 맞출까',
      body: [
        'Argo CD에게 할 일을 알려 주는 리소스가 <b>Application</b>입니다. <code>source</code>는 <b>어디서</b>(저장소 · 브랜치 · 경로), <code>destination</code>은 <b>어디로</b>(클러스터 · 네임스페이스)예요. <code>kubernetes.default.svc</code>는 Argo CD가 설치된 바로 그 클러스터를 뜻합니다.',
        'Argo CD는 두 가지를 계속 보여 줍니다. Git과 같은가(<b>Synced / OutOfSync</b>), 그리고 잘 돌고 있는가(<b>Healthy / Degraded</b>). Git의 내용을 클러스터에 적용해 같게 만드는 동작이 <b>sync</b>입니다.',
      ],
      callout: { type: 'tip', text: '<code>syncPolicy</code>를 빼면 차이를 표시만 하고 사람이 sync를 누르기를 기다립니다. 처음에는 수동으로 차이를 눈으로 확인하고, 익숙해지면 자동으로 넘어가세요.' },
      set: { argo: { badge: null } },
      code: { ref: 'app', hl: [8, 9, 10, 11, 12, 13, 14] },
      tags: [
        { on: 'git', text: 'source', icon: 'folder-tree', pos: 'bottom' },
        { on: 'app', text: 'destination', icon: 'target' },
        { on: 'argo', text: 'Synced · Healthy', tone: 'ok', dx: -22 },
      ],
      flows: [
        { path: ['git', 'argo'], kind: 'data', n: 2 },
        { path: ['argo', 'app'], kind: 'ctrl', n: 2, delay: 1 },
      ],
      more: [
        { title: '필드 읽기', rows: [
          ['targetRevision', '브랜치·태그·커밋 SHA', 'info'],
          ['path', '저장소 안의 폴더 (Kustomize·Helm 자동 인식)', 'info'],
          ['destination.server', '대상 API 서버 주소', 'info'],
          ['project', '권한 경계(AppProject)', 'mute'],
        ] },
        { title: '설정 예시', body: ['자주 쓰는 sync 옵션입니다. 네임스페이스가 없으면 만들고, 큰 CRD처럼 기존 apply로 다루기 어려운 리소스는 서버 측 적용을 씁니다.'], code: { title: 'application.yaml', lang: 'yaml', text: 'syncPolicy:\n  automated:\n    prune: true\n    selfHeal: true\n  syncOptions:\n    - CreateNamespace=true\n    - ServerSideApply=true\n  retry:\n    limit: 3' } },
        { title: '흔한 실수', list: [
          '<code>targetRevision: HEAD</code>로 두고 기본 브랜치를 바꾸기: 다른 브랜치를 보기 시작합니다. 운영은 브랜치 이름을 명시하세요.',
          'Application을 UI에서 손으로 만들기: 그 Application 자체가 Git에 없는 드리프트가 됩니다. Application 매니페스트도 저장소에 둡니다.',
        ] },
      ],
    },
    {
      key: '상태 읽기', kind: 'concept', title: 'Sync와 Health를 따로 읽습니다',
      body: [
        '두 상태는 다른 질문입니다. <b>Sync</b>는 "Git과 같은가", <b>Health</b>는 "잘 돌고 있는가"예요. 새 태그를 머지한 직후에는 <b>OutOfSync · Progressing</b>, 적용과 롤링이 끝나면 <b>Synced · Healthy</b>가 됩니다.',
        '<b>Synced인데 Degraded</b>라면 Git대로 적용은 됐지만 Pod가 뜨지 못한 것이고, <b>OutOfSync인데 Healthy</b>라면 잘 돌지만 Git과 다른 것, 곧 드리프트예요.',
      ],
      callout: { type: 'key', text: 'Deployment의 Health는 롤링이 끝나야 Healthy가 됩니다. 앞 레슨의 카나리·롤링 진행이 여기서 Progressing으로 보여요.' },
      set: { app: { state: 'dim', badge: 'Progressing', tone: 'info' } },
      code: { ref: 'status', hl: [7, 8, 13] },
      tags: [{ on: 'argo', text: 'OutOfSync', tone: 'warn', dx: -22 }],
      flows: [
        { path: ['git', 'argo'], kind: 'data' },
        { path: ['argo', 'app'], kind: 'ctrl', n: 2, delay: 0.8 },
      ],
      more: [
        { title: '상태 조합', rows: [
          ['Synced · Healthy', '정상', 'ok'],
          ['OutOfSync · Progressing', '배포 중', 'info'],
          ['Synced · Degraded', 'Git대로인데 실패: 이미지·설정 확인', 'bad'],
          ['OutOfSync · Healthy', '드리프트 또는 sync 꺼짐', 'warn'],
          ['Missing', 'Git에는 있는데 클러스터에 없음', 'warn'],
        ] },
        { title: '순서 정하기: 웨이브와 훅', body: [
          'sync는 리소스를 <b>웨이브</b> 번호 순으로 적용합니다(<code>argocd.argoproj.io/sync-wave</code> 주석, 낮은 번호부터). 같은 웨이브 안에서는 네임스페이스·ConfigMap 같은 기초 리소스가 먼저예요. <b>훅</b>은 sync 앞뒤에 도는 작업입니다. 앞 레슨의 DB 마이그레이션을 <code>PreSync</code> 훅 Job으로 걸면, 마이그레이션이 성공해야 새 Deployment가 적용됩니다.',
        ], code: { title: 'migrate-job.yaml', lang: 'yaml', text: 'apiVersion: batch/v1\nkind: Job\nmetadata:\n  generateName: shop-api-migrate-\n  annotations:\n    argocd.argoproj.io/hook: PreSync\n    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation' } },
        { title: '흔한 실수', body: ['Healthy만 보고 배포가 끝났다고 판단하기: Synced가 아니라면 아직 옛 버전일 수 있습니다. 배포 완료 알림은 <b>새 커밋으로 Synced이면서 Healthy</b>일 때 보내세요.'] },
      ],
    },
    {
      key: 'self-heal', kind: 'solution', title: 'self-heal: 손으로 바꾼 것은 되돌립니다',
      body: [
        '<code>automated</code>를 켜면 Git이 바뀔 때마다 알아서 sync 합니다. 여기에 <code>selfHeal: true</code>를 더하면 반대쪽도 지켜요. 누군가 <code>kubectl edit</code>로 <b>클러스터를 직접</b> 바꾸면, Argo CD가 차이를 발견하고 Git의 값으로 되돌립니다.',
        '<code>prune: true</code>는 Git에서 지운 리소스를 클러스터에서도 지웁니다. 둘 다 기본값은 꺼짐이에요. 이제 급한 수정도 <b>Git을 거쳐야</b> 남습니다. 그래서 장애 중에도 "커밋 → 머지 → sync"가 충분히 빨라야 합니다.',
      ],
      callout: { type: 'warn', text: 'prune은 강력한 만큼 위험합니다. 경로를 잘못 바꾼 커밋 하나가 리소스를 <b>통째로 지울</b> 수 있어요. 지우면 안 되는 것에는 보호 주석을 겁니다.' },
      show: ['ops'],
      set: { app: { state: null, badge: null } },
      code: { ref: 'app', hl: [15, 16, 17, 18] },
      focus: ['argo'],
      tags: [
        { on: 'ops', text: 'kubectl edit', tone: 'bad', icon: 'terminal', dx: 30 },
        { on: 'argo', text: 'Git 값으로 복구', tone: 'ok', icon: 'undo', dx: -22 },
      ],
      flows: [
        { path: ['ops', 'app'], kind: 'bad' },
        { path: ['git', 'argo'], kind: 'data', delay: 1 },
        { path: ['argo', 'app'], kind: 'ctrl', n: 2, delay: 1.8 },
      ],
      metrics: { drift: ['자동 복구', 'ok'] },
      changes: [['+', '자동 sync · selfHeal · prune'], ['~', '수동 변경: 방치 → 되돌림']],
      more: [
        { title: '동작 원리', body: [
          'controller는 리소스를 watch 하고 있어서, 누군가 바꾸면 곧 OutOfSync를 알아챕니다. selfHeal이 켜져 있으면 Git이 바뀌지 않았어도 sync를 다시 실행해 차이를 덮어써요. 연달아 되돌리는 것을 막기 위해 짧은 간격을 두고 시도합니다.',
          'prune은 "이 Application이 만든 리소스 중 이제 Git에 없는 것"만 지웁니다. Argo CD가 붙인 추적 라벨·주석으로 자기 것을 구분하므로, 다른 도구가 만든 리소스는 건드리지 않아요.',
        ] },
        { title: '설정 예시', body: ['지우면 안 되는 리소스(데이터가 든 PVC 등)에는 prune을 막는 주석을 겁니다.'], code: { title: 'pvc.yaml', lang: 'yaml', text: 'metadata:\n  name: shop-uploads\n  annotations:\n    argocd.argoproj.io/sync-options: Prune=false' } },
        { title: '장애 중 수동 조치는?', list: [
          '정말 급하면 해당 Application의 자동 sync를 <b>잠깐 끄고</b>(기록을 남기고) 손으로 고친 뒤, 같은 값을 PR로 올리고 다시 켭니다.',
          '평소에 설정 저장소의 리뷰·머지가 몇 분 안에 끝나도록 경로를 짧게 만들어 두는 것이 근본 대책입니다.',
        ] },
      ],
    },
    {
      key: '끝없는 diff', kind: 'case', title: '사례: OutOfSync가 사라지지 않습니다',
      body: [
        'self-heal을 켠 날부터 <code>shop-api</code>가 몇 분마다 OutOfSync와 Synced를 오갑니다. Pod 수도 3개와 6개 사이를 출렁여요. 매니페스트에는 <code>replicas: 3</code>, 그리고 같은 Deployment에 <b>HPA</b>가 붙어 있었습니다.',
        'HPA는 부하를 보고 6으로 늘리고, Argo CD는 Git의 3으로 되돌립니다. <b>두 컨트롤러가 같은 필드를 놓고 싸우는</b> 것이에요.',
      ],
      callout: { type: 'tip', text: '다른 컨트롤러가 관리하는 필드는 <b>Git에서 빼거나</b>, Argo CD가 그 필드를 비교하지 않도록 <code>ignoreDifferences</code>에 적습니다.' },
      hide: ['ops'],
      show: ['hpa'],
      set: { app: { state: 'hot', badge: 'Pod 3 ↔ 6', tone: 'warn' }, argo: { badge: 'OutOfSync', tone: 'warn' } },
      tags: [{ on: 'hpa', text: 'replicas → 6', tone: 'warn', pos: 'bottom' }, { on: 'git', text: 'replicas: 3', icon: 'file-code', pos: 'bottom' }],
      flows: [
        { path: ['hpa', 'app'], kind: 'ctrl', n: 2, gap: 1.6 },
        { path: ['argo', 'app'], kind: 'bad', n: 2, gap: 1.6, delay: 0.8 },
      ],
      metrics: { drift: ['서로 되돌림', 'bad'] },
      changes: [['-', 'HPA와 Argo CD가 replicas를 다툼'], ['~', '해결: Git에서 replicas 제거']],
      more: [
        { title: '증상', list: [
          'Application 이력에 몇 분 간격의 자동 sync가 끝없이 쌓입니다.',
          '<code>argocd app diff</code>에 늘 같은 필드 한 줄만 나옵니다.',
          'Pod가 늘었다 줄었다 하며 롤링이 아닌 스케일 이벤트가 반복되고, 부하 때 응답이 느려집니다.',
        ] },
        { title: '고친 방법', body: ['Deployment 매니페스트에서 <code>replicas</code>를 지우고(시작 개수는 HPA의 <code>minReplicas</code>가 정함), 이미 있는 리소스에 대해서는 비교에서 빼는 규칙을 더했습니다.'], code: { title: 'application.yaml', lang: 'yaml', text: 'spec:\n  ignoreDifferences:\n    - group: apps\n      kind: Deployment\n      jsonPointers:\n        - /spec/replicas\n  syncPolicy:\n    syncOptions:\n      - RespectIgnoreDifferences=true' } },
        { title: '같은 패턴의 다른 예', list: [
          '변형 웹훅(사이드카 주입, 기본 라벨 추가)이 매번 덧붙이는 필드.',
          '인증서 관리 도구나 오퍼레이터가 채워 넣는 Secret·CRD 필드.',
          '클라우드 컨트롤러가 Service에 붙이는 주석. 어느 경우든 "누가 이 필드의 주인인가"를 먼저 정합니다.',
        ] },
      ],
    },
    {
      key: '저장소 분리', kind: 'concept', title: '앱 저장소와 설정 저장소를 나눕니다',
      body: [
        '지금까지는 코드와 매니페스트가 한 저장소에 있었습니다. 실무에서는 둘로 나눕니다. <b>앱 저장소</b>에는 소스와 Dockerfile, <b>설정 저장소</b>에는 매니페스트와 환경별 값. Argo CD는 설정 저장소만 봅니다.',
        '이유는 셋입니다. 설정 저장소의 커밋 이력이 곧 <b>운영 변경 이력</b>이 되고, 운영 배포를 승인할 사람을 따로 정할 수 있고, replicas만 바꿀 때 앱을 다시 빌드하지 않아도 됩니다. 한 저장소에서 CI가 매니페스트를 커밋하면 그 커밋이 다시 CI를 깨우는 고리도 생겨요.',
      ],
      callout: { type: 'warn', text: 'Secret을 평문으로 넣지 마세요. base64는 암호화가 아닙니다. Git에는 <b>암호화된 값이나 참조</b>만 두고(Sealed Secrets, External Secrets), 진짜 값은 10장의 시크릿 매니저에 둡니다.' },
      hide: ['hpa', 'e_gc'],
      show: ['src', 'ci'],
      set: { app: { state: null, badge: null }, argo: { badge: null }, git: { label: '설정 저장소', sub: 'shop-config', color: 'olive' } },
      focus: ['git'],
      tags: [
        { on: 'src', text: '코드 · Dockerfile', icon: 'code' },
        { on: 'git', text: '매니페스트 · 환경별 값', tone: 'accent', icon: 'file-code', pos: 'bottom' },
      ],
      flows: [
        { path: ['src', 'ci'], kind: 'build', n: 2 },
        { path: ['git', 'argo'], kind: 'data', n: 2, delay: 0.6 },
        { path: ['argo', 'app'], kind: 'ctrl', delay: 1.6 },
      ],
      changes: [['+', '설정 저장소 shop-config'], ['~', 'Argo CD는 설정 저장소만 봄'], ['~', '코드 이력 ≠ 배포 이력']],
      more: [
        { title: '나눌 때와 합칠 때', rows: [
          ['한 저장소', '작은 팀 · 서비스 하나 · 시작하기 쉬움', 'info'],
          ['앱 / 설정 분리', '운영 승인 분리 · 깔끔한 배포 이력', 'ok'],
          ['설정 저장소 하나에 여러 앱', '플랫폼 팀이 클러스터 전체를 한눈에', 'ok'],
          ['팀마다 설정 저장소', '권한 경계가 분명 · 저장소 수 증가', 'mute'],
        ] },
        { title: '시크릿 다루기', list: [
          '<b>Sealed Secrets</b>: 클러스터의 공개 키로 암호화한 값을 Git에 두고, 클러스터 안 컨트롤러만 풀 수 있습니다.',
          '<b>External Secrets</b>: Git에는 "시크릿 매니저의 어느 항목"이라는 참조만 두고, 컨트롤러가 값을 가져와 Secret을 만듭니다.',
          '<b>SOPS</b>: 파일의 값만 KMS 키로 암호화해 두고 렌더링 때 복호화합니다.',
        ] },
        { title: '흔한 실수', body: ['CI가 앱 저장소의 <code>deploy/</code> 폴더에 태그를 커밋하게 했더니, 그 커밋이 다시 CI를 돌리고 또 커밋하는 고리가 생겼습니다. 경로 필터나 "[skip ci]"로 막을 수는 있지만, 저장소를 나누면 고리 자체가 없어집니다.'] },
      ],
    },
    {
      key: '태그 PR', kind: 'solution', title: '배포 = 이미지 태그 한 줄을 바꾸는 PR',
      body: [
        '그러면 CI가 만든 새 이미지는 어떻게 운영에 나갈까요? CI는 이미지를 푸시한 뒤, 설정 저장소에서 <b>이미지 태그 한 줄</b>을 바꾸는 <b>PR</b>을 엽니다. 리뷰하고 머지하는 것이 곧 배포 승인이에요.',
        'Argo CD가 머지를 발견해 sync 하고, 클러스터는 레지스트리에서 새 이미지를 받습니다. 앞 레슨의 롤링이나 카나리는 이 뒤에 클러스터 안에서 진행돼요. CI가 가진 권한은 <b>레지스트리 푸시와 PR 열기</b>뿐, 클러스터 권한은 없습니다.',
      ],
      callout: { type: 'tip', text: '태그는 덮어쓸 수 없는 git SHA여야 이 한 줄이 의미가 있어요. 어느 환경의 어느 파일을 바꿀지는 다음 단계의 저장소 구조가 정합니다.' },
      show: ['reg', 'e_pr'],
      panel: {
        title: 'PR #128 · shop-config', icon: 'git-pr',
        rows: [['− newTag', '9b1d4f7', 'bad'], ['+ newTag', 'a3f9c2e', 'ok'], ['리뷰 · 머지', '= 배포 승인', 'accent']],
      },
      flows: [
        { path: ['src', 'ci'], kind: 'build' },
        { path: ['ci', 'reg'], kind: 'build', delay: 1 },
        { path: ['ci', 'git'], kind: 'ctrl', delay: 1.6 },
        { path: ['git', 'argo'], kind: 'data', delay: 2.8 },
        { path: ['argo', 'app'], kind: 'ctrl', delay: 3.6 },
        { path: ['reg', 'app'], kind: 'build', delay: 4.2 },
      ],
      metrics: { cred: ['클러스터 밖 0개', 'ok'], deploy: ['PR 머지', 'ok'] },
      changes: [['+', 'CI가 여는 태그 변경 PR'], ['~', '배포 승인 = PR 머지'], ['~', 'CI 권한: 푸시 + PR뿐']],
      more: [
        { title: '설정 예시', body: ['이미지 job 뒤에 붙는 job입니다. 설정 저장소를 받아 태그를 바꾸고 PR을 엽니다. 설정 저장소에 쓸 토큰은 그 저장소에만 PR 권한이 있는 것으로.'], code: { title: 'image.yml', lang: 'yaml', text: "bump:\n  needs: image\n  runs-on: ubuntu-latest\n  steps:\n    - uses: actions/checkout@v4\n      with:\n        repository: shop/shop-config\n        token: ${{ secrets.CONFIG_REPO_TOKEN }}\n    - run: |\n        cd apps/shop-api/overlays/dev\n        kustomize edit set image \\\n          shop-api=registry.example/shop-api:${{ github.sha }}\n    - run: |\n        git switch -c bump-${{ github.sha }}\n        git commit -am \"shop-api: ${{ github.sha }} 배포\"\n        git push origin HEAD\n        gh pr create --fill" } },
        { title: '자동화 도구', list: [
          '<b>Argo CD Image Updater</b>: 레지스트리를 지켜보다 규칙에 맞는 새 태그가 나오면 설정 저장소에 직접 커밋해 줍니다. dev처럼 리뷰가 필요 없는 환경에 맞아요.',
          'Renovate 같은 의존성 갱신 봇으로 이미지 태그 PR을 열게 하는 팀도 있습니다.',
        ] },
        { title: '실무 팁', body: ['PR 본문에 앱 저장소의 변경 목록(이전 태그와 새 태그 사이의 커밋)을 자동으로 넣어 두면, 리뷰어가 "이 한 줄이 무엇을 내보내는지"를 바로 압니다. 배포 승인이 형식적인 클릭이 되지 않게 하는 장치예요.'] },
      ],
    },
    {
      key: '저장소 구조', kind: 'concept', title: 'base와 overlay: 환경은 폴더로',
      body: [
        '설정 저장소는 보통 <b>base</b>에 모든 환경이 공유하는 매니페스트를 두고, 환경마다 <b>overlay</b> 폴더에서 다른 부분만 덮어씁니다. Kustomize가 둘을 합쳐 최종 매니페스트를 만들어요.',
        'dev·stg·prod Application은 각자 자기 overlay 경로를 봅니다. 그래서 환경 사이의 차이가 <b>폴더 사이의 diff</b>로 그대로 보입니다.',
      ],
      callout: { type: 'tip', text: '환경을 <b>브랜치</b>로 나누는 방식도 있지만, 브랜치끼리 머지하다 보면 환경별 값이 섞이기 쉽습니다. 한 브랜치에 폴더로 나누는 쪽이 흔해요.' },
      hide: ['src', 'ci', 'reg', 'k8s', 'argo', 'app'],
      show: ['fDev', 'fStg', 'fProd'],
      code: { ref: 'tree', hl: [3, 4, 5, 6, 7, 8, 9, 10] },
      flows: [{ path: ['git', 'fDev'], kind: 'data' }],
      more: [
        { title: '설정 예시', body: ['prod overlay의 kustomization입니다. base를 가져와 이미지 태그와 자원 크기만 바꿉니다.'], code: { title: 'overlays/prod/kustomization.yaml', lang: 'yaml', text: 'apiVersion: kustomize.config.k8s.io/v1beta1\nkind: Kustomization\nnamespace: shop\nresources:\n  - ../../base\nimages:\n  - name: shop-api\n    newName: registry.example/shop-api\n    newTag: 9b1d4f7\npatches:\n  - path: resources-patch.yaml' } },
        { title: '직접 해보기', body: ['환경 사이에 실제로 무엇이 다른지 렌더링 결과로 비교합니다.'], code: { title: 'terminal', lang: 'sh', text: '$ diff <(kustomize build apps/shop-api/overlays/stg) \\\n       <(kustomize build apps/shop-api/overlays/prod)\n<         image: registry.example/shop-api:a3f9c2e\n>         image: registry.example/shop-api:9b1d4f7\n<             memory: 256Mi\n>             memory: 512Mi' } },
        { title: '흔한 실수', list: [
          'overlay에 base를 통째로 복사해 두기: 공통 변경을 환경마다 따로 고쳐야 하고, 곧 환경끼리 몰래 달라집니다.',
          'Helm을 쓴다면 같은 구조를 차트 하나와 환경별 <code>values-*.yaml</code>로 만듭니다. 도구보다 "공통은 한 곳, 차이는 작게"가 핵심이에요.',
        ] },
      ],
    },
    {
      key: '승격', kind: 'concept', title: '승격: 같은 태그를 다음 폴더로',
      body: [
        '앞 레슨의 "한 번 빌드, 같은 이미지 승격"이 GitOps에서는 <b>폴더 사이의 PR</b>이 됩니다. CI는 dev overlay의 태그만 자동으로 바꾸고, dev에서 검증되면 같은 태그를 stg로, 다시 prod로 옮기는 PR을 엽니다.',
        '각 PR의 리뷰어와 조건을 다르게 둘 수 있어요. dev는 자동 머지, stg는 테스트 통과, prod는 담당자 승인. <b>무엇이 언제 어디까지 갔는지</b>가 커밋 이력에 그대로 남습니다.',
      ],
      callout: { type: 'key', text: '승격 PR의 diff는 태그 한 줄이어야 합니다. 그 사이에 다른 변경이 끼면 prod는 stg에서 검증하지 않은 조합을 받게 돼요.' },
      set: { fDev: { badge: 'a3f9c2e', tone: 'ok' }, fStg: { badge: 'a3f9c2e', tone: 'ok' }, fProd: { badge: '9b1d4f7', tone: 'warn' } },
      tags: [{ on: 'fProd', text: '승인 1명 필요', tone: 'warn', icon: 'user-check', pos: 'bottom' }],
      flows: [
        { path: ['git', 'fDev'], kind: 'ctrl' },
        { path: ['fDev', 'fStg'], kind: 'ctrl', delay: 1 },
        { path: ['fStg', 'fProd'], kind: 'ctrl', delay: 2 },
      ],
      metrics: { deploy: ['폴더 승격 PR', 'ok'] },
      changes: [['+', 'dev → stg → prod 승격 PR'], ['~', '환경별 승인 조건']],
      more: [
        { title: '환경별 문턱', rows: [
          ['dev', 'CI가 자동 커밋 · 리뷰 없음', 'mute'],
          ['stg', '자동 PR · 통합 테스트 통과 시 머지', 'info'],
          ['prod', '승격 PR · CODEOWNERS 승인 필수', 'warn'],
        ] },
        { title: '직접 해보기', body: ['stg의 태그를 그대로 읽어 prod에 적는 승격 스크립트의 핵심입니다. 손으로 태그를 타이핑하지 않는 것이 요점이에요.'], code: { title: 'terminal', lang: 'sh', text: '$ TAG=$(yq \'.images[0].newTag\' \\\n    apps/shop-api/overlays/stg/kustomization.yaml)\n$ echo $TAG\na3f9c2e\n$ yq -i ".images[0].newTag = \\"$TAG\\"" \\\n    apps/shop-api/overlays/prod/kustomization.yaml\n$ git commit -am "shop-api: $TAG prod 승격"' } },
        { title: '실무 팁', list: [
          '승격 PR 생성을 자동화하면 "stg에 몇 시간 안정적이었다" 같은 조건을 기계가 확인하게 할 수 있습니다. Kargo처럼 승격만 전문으로 하는 도구도 있어요.',
          'prod overlay 파일에 CODEOWNERS를 걸어, 승인 없이는 머지되지 않게 합니다. 앞 레슨들의 브랜치 보호가 여기서 운영 변경 통제가 됩니다.',
        ] },
      ],
    },
    {
      key: '롤백', kind: 'solution', title: '롤백 = git revert',
      body: [
        '새 버전에 문제가 있습니다. 되돌리는 길도 배포와 같습니다. 문제의 커밋을 <code>git revert</code> 하면 태그가 이전 값으로 돌아가고, Argo CD가 그대로 sync 해요. 누가 언제 왜 되돌렸는지도 이력에 남습니다.',
        '급하다고 <code>kubectl rollout undo</code>를 쓰면 어떻게 될까요? Git은 여전히 새 태그를 가리키니, self-heal이 <b>문제의 버전으로 다시 맞춰</b> 버립니다. Git이 진실인 세계에서는 Git을 고쳐야 합니다.',
      ],
      callout: { type: 'warn', text: '되돌아가는 것은 <b>Git에 적힌 것</b>뿐입니다. 이미 실행된 DB 마이그레이션은 revert로 돌아오지 않아요. 앞 레슨의 expand → contract가 여전히 필요합니다.' },
      hide: ['fDev', 'fStg', 'fProd'],
      show: ['k8s', 'argo', 'app'],
      set: { app: { badge: '9b1d4f7로 복귀', tone: 'ok' } },
      code: { ref: 'revert', hl: [6, 7] },
      tags: [
        { on: 'git', text: 'git revert', icon: 'undo', pos: 'bottom' },
        { on: 'argo', text: '이전 태그로 sync', tone: 'ok', dx: -16 },
      ],
      flows: [
        { path: ['git', 'argo'], kind: 'data', n: 2 },
        { path: ['argo', 'app'], kind: 'ctrl', n: 2, delay: 1 },
      ],
      metrics: { rb: ['git revert', 'ok'] },
      changes: [['~', '롤백: 재실행 → git revert'], ['+', '되돌린 이력도 Git에']],
      more: [
        { title: '동작 원리', body: [
          '<code>git revert</code>는 이력을 지우지 않고 "반대 변경"을 새 커밋으로 더합니다. 설정 저장소의 이력은 그대로 운영의 이력이니, 지우는 <code>reset --force</code>가 아니라 더하는 revert가 맞아요. 머지 뒤 Argo CD가 새 커밋을 보고, 이전 태그로 sync하며, 클러스터 안에서는 롤링(또는 카나리)이 이전 이미지로 진행됩니다.',
        ] },
        { title: 'Argo CD의 rollback 버튼', body: ['Argo CD UI·CLI에도 이전 sync 이력으로 돌아가는 <code>argocd app rollback</code>이 있습니다. 하지만 자동 sync가 켜진 Application에서는 쓸 수 없고(Git과 바로 다시 어긋나니까), 쓰더라도 Git은 여전히 새 버전이라 결국 Git을 고쳐야 합니다. 비상시에만, 그리고 곧바로 revert PR을 따라 올리세요.'] },
        { title: '흔한 실수', list: [
          '롤백 PR도 일반 배포처럼 리뷰를 오래 기다리게 두기: 되돌리기 전용 빠른 승인 규칙(예: 당직자 1명)을 미리 정해 둡니다.',
          '문제 커밋 이후 다른 커밋이 쌓였는데 한꺼번에 되돌리기: revert는 그 커밋 하나만 정확히 빼므로, 대상 커밋을 골라서 합니다.',
        ] },
      ],
    },
    {
      key: '여러 클러스터', kind: 'compare', title: '같은 Git, 네 클라우드의 클러스터',
      body: [
        'pull 방식은 클러스터가 늘어도 그대로 통합니다. 클러스터마다 overlay를 두고, <b>ApplicationSet</b>이 등록된 클러스터 목록에서 Application을 <b>하나씩 찍어 냅니다</b>. 클러스터 추가는 등록 한 번이에요.',
        '클러스터가 어느 클라우드에 있든, 사설망 안에 숨어 있든 <b>밖으로 Git에 닿기만</b> 하면 됩니다. EKS · AKS · GKE · NKS를 한 저장소로 운영하는 그림이고, 11장에서 이것을 플릿으로 키웁니다.',
      ],
      callout: { type: 'cloud', text: '<b>Flux</b>도 같은 pull 방식이고, AKS의 GitOps(Flux) 확장이나 GKE의 Config Sync처럼 클라우드가 관리해 주는 것도 있어요.' },
      hide: ['k8s', 'argo', 'app'],
      show: ['cA', 'cZ', 'cG', 'cN'],
      set: { app: { badge: null } },
      focus: ['git'],
      tags: [
        { on: 'cA', text: 'overlays/aws', tone: 'aws' },
        { on: 'cZ', text: 'overlays/azure', tone: 'azure' },
        { on: 'cG', text: 'overlays/gcp', tone: 'gcp', pos: 'bottom' },
        { on: 'cN', text: 'overlays/ncp', tone: 'ncp', pos: 'bottom' },
      ],
      flows: [
        { path: ['git', 'cA'], kind: 'data' }, { path: ['git', 'cZ'], kind: 'data', delay: 0.3 },
        { path: ['git', 'cG'], kind: 'data', delay: 0.6 }, { path: ['git', 'cN'], kind: 'data', delay: 0.9 },
      ],
      metrics: { deploy: ['머지 → 네 곳', 'ok'] },
      more: [
        { title: '설정 예시', body: ['클러스터 생성기(generator)는 Argo CD에 등록된 클러스터 중 라벨이 맞는 것마다 Application을 하나씩 만듭니다. 클러스터의 <code>cloud</code> 라벨로 overlay 경로를 고릅니다.'], code: { title: 'applicationset.yaml', lang: 'yaml', text: `apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: shop-api
  namespace: argocd
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            env: prod
  template:
    metadata:
      name: 'shop-api-{{name}}'
    spec:
      project: shop
      source:
        repoURL: https://git.example/shop-config
        targetRevision: main
        path: 'apps/shop-api/overlays/{{metadata.labels.cloud}}'
      destination:
        server: '{{server}}'
        namespace: shop
      syncPolicy:
        automated: { prune: true, selfHeal: true }` } },
        { title: '두 가지 배치', rows: [
          ['허브형', 'Argo CD 하나가 여러 클러스터를 관리 · 한눈에', 'info'],
          ['클러스터마다', '각자 Argo CD · 허브 장애에 독립', 'info'],
          ['허브형 주의', '허브가 모든 클러스터 API 자격 증명을 가짐', 'warn'],
          ['클러스터마다 주의', '설치·업그레이드가 클러스터 수만큼', 'warn'],
        ] },
        { title: '클라우드별로', rows: [
          ['AWS EKS', 'Argo CD·Flux를 직접 설치해 운영', 'aws'],
          ['Azure AKS', 'GitOps(Flux) 클러스터 확장', 'azure'],
          ['GCP GKE', 'Config Sync', 'gcp'],
          ['NCP NKS', 'Argo CD·Flux를 Helm으로 설치', 'ncp'],
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: Git이 말하고, 클러스터가 따릅니다',
      body: [
        '세 가지가 바뀌었습니다. 방향이 <b>push에서 pull로</b> 바뀌어 클러스터 자격 증명이 밖으로 나가지 않고, <b>Git이 유일한 진실</b>이라 드리프트는 감지되고 되돌려지며, 배포와 승격은 <b>PR 머지</b>, 롤백은 <b>git revert</b>가 됐습니다.',
        '이것으로 9장, 커밋에서 운영까지의 길이 이어졌습니다. 하지만 배포했다고 끝이 아니에요. 다음 장에서는 운영 중인 시스템 안을 <b>들여다보는 법</b>, 관측부터 시작합니다.',
      ],
      hide: ['cA', 'cZ', 'cG', 'cN'],
      show: ['src', 'ci', 'reg', 'k8s', 'argo', 'app'],
      focus: ['git'],
      flows: [
        { path: ['src', 'ci'], kind: 'build' },
        { path: ['ci', 'reg'], kind: 'build', delay: 1 },
        { path: ['ci', 'git'], kind: 'ctrl', delay: 1.6 },
        { path: ['git', 'argo'], kind: 'data', delay: 2.8 },
        { path: ['argo', 'app'], kind: 'ctrl', delay: 3.6 },
      ],
      metrics: { cred: ['클러스터 밖 0개', 'ok'], drift: ['자동 복구', 'ok'], deploy: ['PR 머지', 'ok'], rb: ['git revert', 'ok'] },
    },
  ],
  quiz: [
    {
      q: 'CI에서 쓰던 서드파티 액션 하나가 악성 코드로 밝혀졌습니다. push 방식(CI가 kubectl apply)과 pull 방식(Argo CD)의 피해 범위는 어떻게 다를까요?',
      options: [
        '차이가 없다. 둘 다 CI가 클러스터에 접근한다',
        'push 방식은 CI에 있던 클러스터 자격 증명이 넘어가지만, pull 방식의 CI에는 클러스터 권한이 없고 변경은 PR 리뷰를 거쳐야 한다',
        'pull 방식이 더 위험하다. Argo CD가 클러스터 안에 있기 때문이다',
        'push 방식이 더 안전하다. 파이프라인이 돌 때만 접근하기 때문이다',
      ],
      answer: 1, step: 3,
      why: 'push 방식에서는 CI가 운영 클러스터의 자격 증명을 쥐고 있어, CI가 뚫리면 클러스터가 바로 넘어갑니다. pull 방식의 CI는 레지스트리 푸시와 PR 열기만 할 수 있고, 클러스터에 닿으려면 사람의 리뷰를 통과해야 합니다. 위험이 0은 아니지만 범위가 크게 줄어듭니다.',
    },
    {
      q: '장애 대응 중 kubectl edit로 limit을 올렸고, Git은 그대로입니다. push 방식 파이프라인을 쓰는 이 팀에 앞으로 일어날 가장 가능성 높은 일은?',
      options: ['다음 배포에서 Git의 옛 값이 다시 적용되어 같은 장애가 재발한다', '클러스터가 자동으로 Git을 수정한다', 'kubectl edit 값이 Git에 자동으로 커밋된다', '아무 일도 없다. 수동 값이 영구히 유지된다'],
      answer: 0, step: 2,
      why: 'push 방식은 배포 때만 Git을 적용하므로, 다음 배포가 아무도 모르던 차이를 덮어씁니다. 클러스터가 Git을 고치거나 자동 커밋하는 장치는 없습니다. 수동 변경은 반드시 Git으로 돌아가야 합니다.',
    },
    {
      q: '설정 저장소에 머지했는데 1–2분째 Argo CD 화면이 여전히 Synced로 옛 커밋을 보여 줍니다. 가장 먼저 의심할 것은?',
      options: ['Argo CD가 고장 났다', '머지가 실패했다', '아직 다음 비교 주기가 오지 않았다. Refresh를 누르거나 Git 웹훅을 건다', 'selfHeal이 꺼져 있다'],
      answer: 2, step: 4,
      why: 'Argo CD는 기본으로 몇 분 간격으로 Git을 확인합니다. 웹훅이 없으면 머지 직후 바로 보이지 않는 것이 정상입니다. selfHeal은 클러스터 쪽 수동 변경을 되돌리는 기능이라 Git 변경 감지와는 다릅니다.',
    },
    {
      q: '팀원이 Argo CD UI에서 Application을 손으로 만들어 운영하고 있습니다. 이 방식의 문제는?',
      options: ['UI로 만든 Application은 sync를 할 수 없다', 'Application 정의 자체가 Git에 없어 재현·리뷰·복구가 안 된다', 'UI로 만들면 자동으로 prune이 켜진다', '문제없다. Application은 Git에 둘 필요가 없다'],
      answer: 1, step: 5,
      why: 'GitOps의 원칙은 Argo CD 설정까지 포함해 원하는 상태를 Git에 두는 것입니다. UI로 만든 Application은 그 자체가 드리프트라, 클러스터를 다시 세우거나 누가 바꿨는지 추적할 때 기록이 없습니다.',
    },
    {
      q: 'Argo CD에 shop-api가 Synced · Degraded로 표시됩니다. 이 상태가 말해 주는 것은?',
      options: ['클러스터가 Git과 다르다', 'Argo CD가 Git에 접근하지 못한다', '자동 sync가 꺼져 있다', 'Git대로 적용은 됐지만 Pod가 정상적으로 돌지 못한다. 이미지나 설정을 확인해야 한다'],
      answer: 3, step: 6,
      why: 'Sync는 Git과 같은지, Health는 잘 도는지를 따로 답합니다. Synced이면서 Degraded는 Git에 적힌 것 자체에 문제가 있다는 뜻입니다. Git과 다를 때는 OutOfSync가 됩니다.',
    },
    {
      q: '장애 중에 운영자가 kubectl scale로 Pod를 3개에서 6개로 늘렸는데, 잠시 뒤 다시 3개로 돌아갔습니다. 이 클러스터는 Argo CD의 selfHeal이 켜져 있습니다. 가장 올바른 대응은?',
      options: [
        '돌아갈 때마다 kubectl scale을 다시 실행한다',
        '장애가 끝날 때까지 Argo CD를 삭제해 둔다',
        '운영자에게 클러스터 관리자 권한을 더 준다',
        '설정 저장소의 replicas를 고쳐 머지한다',
      ],
      answer: 3, step: 7,
      why: 'selfHeal은 클러스터를 Git에 적힌 대로 되돌립니다. 바꾸고 싶은 값은 Git에서 바꿔야 남습니다. 수동 명령을 반복하면 계속 되돌려지고, Argo CD를 지우면 드리프트를 막는 장치를 버리는 셈입니다.',
    },
    {
      q: '누군가 설정 저장소의 Application path를 잘못 바꾼 커밋을 머지했습니다. prune이 켜져 있다면 어떤 일이 생길 수 있고, 무엇으로 대비할까?',
      options: ['아무 일도 없다. prune은 새 리소스만 다룬다', '옛 경로의 리소스가 Git에 없다고 판단해 지워질 수 있다. 중요한 리소스에 Prune=false 주석을 걸고 path 변경은 리뷰를 거치게 한다', 'Argo CD가 자동으로 이전 경로를 복구한다', 'prune은 dev 환경에서만 동작한다'],
      answer: 1, step: 7,
      why: 'prune은 이 Application이 관리하던 리소스 중 이제 Git에 없는 것을 지웁니다. 경로를 잘못 바꾸면 전부 "없는 것"이 됩니다. 데이터를 담은 리소스는 보호 주석으로 막고, 설정 저장소의 변경은 리뷰를 거쳐야 합니다.',
    },
    {
      q: 'self-heal을 켠 뒤 HPA가 붙은 Deployment가 몇 분마다 OutOfSync와 Synced를 오가고 Pod 수가 출렁입니다. 가장 알맞은 해결은?',
      options: ['HPA를 지운다', 'self-heal을 영구히 끈다', '매니페스트에서 replicas를 빼고, 필요하면 ignoreDifferences로 그 필드를 비교에서 제외한다', '동기화 주기를 1시간으로 늘린다'],
      answer: 2, step: 8,
      why: 'HPA와 Argo CD가 같은 필드의 주인 노릇을 하며 싸우는 상황입니다. 주인을 HPA로 정하고 Git에서 그 필드를 빼면 됩니다. HPA나 self-heal을 끄면 각각 자동 확장이나 드리프트 방지를 잃고, 주기를 늘리면 싸움이 느려질 뿐입니다.',
    },
    {
      q: '앱 DB 비밀번호를 설정 저장소로 관리하려 합니다. 가장 알맞은 방법은?',
      options: [
        'Secret 매니페스트에 base64로 넣는다. 사람이 읽을 수 없으니 안전하다',
        'Git에는 암호화된 값이나 시크릿 매니저를 가리키는 참조만 두고, 클러스터 안에서 진짜 값으로 바꾼다',
        '저장소가 private이니 평문으로 넣어도 된다',
        '비밀번호만 kubectl로 직접 만들고 Git에는 아무것도 두지 않는다',
      ],
      answer: 1, step: 9,
      why: 'base64는 인코딩일 뿐 누구나 되돌릴 수 있고, private 저장소도 여러 노트북에 복제되며 이력에서 지우기 어렵습니다. 손으로 만든 Secret은 Git이 모르는 리소스라 재현도 감사도 안 됩니다. Sealed Secrets나 External Secrets처럼 Git에는 안전한 형태만 두는 방식이 GitOps와 맞습니다.',
    },
    {
      q: 'dev·stg·prod 매니페스트를 각 overlay에 통째로 복사해 두었더니, 공통 설정을 고칠 때마다 한 곳씩 빠뜨려 환경이 몰래 달라집니다. 어떻게 바꿀까?',
      options: ['환경마다 다른 저장소로 나눈다', 'prod만 Git에 두고 나머지는 손으로 관리한다', '환경을 브랜치로 나눠 매번 머지한다', '공통 매니페스트를 base에 한 번만 두고 overlay에는 환경별 차이만 남긴다'],
      answer: 3, step: 11,
      why: '공통은 한 곳에 두고 차이만 작게 남기면 공통 변경이 모든 환경에 한 번에 반영되고, 환경 간 차이는 폴더 diff로 드러납니다. 저장소나 브랜치를 나누면 같은 문제가 더 커집니다.',
    },
    {
      q: 'stg에서 검증된 a3f9c2e를 prod로 승격하는 PR에, 누군가 prod의 메모리 limit 변경도 함께 넣었습니다. 무엇이 문제인가?',
      options: ['문제없다. 한 번에 머지하면 효율적이다', 'PR이 길어져 보기 불편할 뿐이다', 'prod가 stg에서 검증하지 않은 조합을 받게 되고, 문제가 나면 원인과 롤백 대상이 섞인다', 'Argo CD가 두 변경을 동시에 적용하지 못한다'],
      answer: 2, step: 12,
      why: '승격 PR은 검증된 것을 그대로 옮기는 한 줄이어야 합니다. 다른 변경이 끼면 검증의 의미가 깨지고, revert 한 번에 두 변경이 함께 되돌아가 롤백 판단도 어려워집니다. 설정 변경은 따로 PR로 올립니다.',
    },
    {
      q: '새 버전에 버그가 있어 kubectl rollout undo로 되돌렸습니다. 몇 분 뒤 버그가 있는 버전이 다시 돌고 있습니다. 왜일까요?',
      options: [
        '설정 저장소가 여전히 새 태그를 가리켜, Argo CD가 클러스터를 Git에 맞춰 되돌려서',
        'rollout undo는 Deployment에서 동작하지 않아서',
        '레지스트리가 이전 이미지를 지워서',
        'readiness 프로브가 이전 버전을 거부해서',
      ],
      answer: 0, step: 13,
      why: 'GitOps에서 진실은 Git입니다. 클러스터만 되돌리면 그것은 드리프트이고, self-heal은 드리프트를 Git 쪽으로 고칩니다. 올바른 롤백은 설정 저장소에서 문제의 커밋을 git revert 하는 것입니다.',
    },
    {
      q: 'EKS·AKS·GKE·NKS에 prod 클러스터가 하나씩 있고 앞으로 더 늘어납니다. 클러스터가 추가될 때마다 Application을 손으로 복사하지 않으려면?',
      options: ['클러스터마다 다른 설정 저장소를 만든다', 'push 방식으로 돌아가 CI가 네 클러스터에 apply한다', 'ApplicationSet의 클러스터 생성기로 라벨이 맞는 클러스터마다 Application을 자동으로 만든다', '한 클러스터에만 배포하고 나머지는 복제 도구로 맞춘다'],
      answer: 2, step: 14,
      why: 'ApplicationSet은 템플릿 하나로 등록된 클러스터마다 Application을 찍어 내, 클러스터 추가가 등록 한 번으로 끝납니다. push로 돌아가면 CI가 네 클러스터의 자격 증명을 모두 쥐게 되어 앞의 문제가 커집니다.',
    },
  ],
};
