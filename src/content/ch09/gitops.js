export default {
  id: 'gitops',
  learn: [
    'push 배포의 두 가지 문제: 밖에 둔 클러스터 키와 드리프트',
    'pull 방식: 클러스터 안의 Argo CD가 Git을 당겨 오기',
    'Application과 sync, 그리고 self-heal',
    '앱 저장소와 설정 저장소를 나누는 이유',
    '배포 = 이미지 태그를 바꾸는 PR, 롤백 = git revert',
    '같은 Git으로 여러 클러스터 운영하기',
  ],
  legend: [['build', '커밋 · 이미지'], ['data', 'Git에서 당겨 오기'], ['ctrl', '적용 · sync · PR'], ['bad', '수동 변경']],
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
      e_src_ci: { from: 'src', to: 'ci' },
      e_ci_reg: { from: 'ci', to: 'reg' },
      e_pr: { from: 'ci', to: 'git', label: 'PR', off: true },
      e_reg_app: { from: 'reg', to: 'app', style: 'dashed', arrow: false },
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
    },
    {
      key: 'Application', kind: 'concept', title: 'Application: 무엇을 어디에 맞출까',
      body: [
        'Argo CD에게 할 일을 알려 주는 리소스가 <b>Application</b>입니다. <code>source</code>는 <b>어디서</b>(저장소 · 브랜치 · 경로), <code>destination</code>은 <b>어디로</b>(클러스터 · 네임스페이스)예요. <code>kubernetes.default.svc</code>는 Argo CD가 설치된 바로 그 클러스터를 뜻합니다.',
        'Argo CD는 두 가지를 계속 보여 줍니다. Git과 같은가(<b>Synced / OutOfSync</b>), 그리고 잘 돌고 있는가(<b>Healthy / Degraded</b>). Git의 내용을 클러스터에 적용해 같게 만드는 동작이 <b>sync</b>입니다.',
      ],
      callout: { type: 'tip', text: '<code>syncPolicy</code>를 빼면 차이를 표시만 하고 사람이 sync를 누르기를 기다립니다. 처음에는 수동으로 차이를 눈으로 확인하고, 익숙해지면 자동으로 넘어가세요.' },
      hide: ['ci'],
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
    },
    {
      key: 'self-heal', kind: 'solution', title: 'self-heal: 손으로 바꾼 것은 되돌립니다',
      body: [
        '<code>automated</code>를 켜면 Git이 바뀔 때마다 알아서 sync 합니다. 여기에 <code>selfHeal: true</code>를 더하면 반대쪽도 지켜요. 누군가 <code>kubectl edit</code>로 <b>클러스터를 직접</b> 바꾸면, Argo CD가 차이를 발견하고 Git의 값으로 되돌립니다.',
        '<code>prune: true</code>는 Git에서 지운 리소스를 클러스터에서도 지웁니다. 둘 다 기본값은 꺼짐이에요. 이제 급한 수정도 <b>Git을 거쳐야</b> 남습니다. 그래서 장애 중에도 "커밋 → 머지 → sync"가 충분히 빨라야 합니다.',
      ],
      callout: { type: 'warn', text: 'HPA가 바꾸는 <code>replicas</code>처럼 <b>다른 컨트롤러가 관리하는 필드</b>는 매니페스트에서 빼세요. Git에 적어 두면 Argo CD와 HPA가 서로 되돌리며 싸웁니다.' },
      show: ['ops'],
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
    },
    {
      key: '저장소 분리', kind: 'concept', title: '앱 저장소와 설정 저장소를 나눕니다',
      body: [
        '지금까지는 코드와 매니페스트가 한 저장소에 있었습니다. 실무에서는 둘로 나눕니다. <b>앱 저장소</b>에는 소스와 Dockerfile, <b>설정 저장소</b>에는 매니페스트와 환경별 값. Argo CD는 설정 저장소만 봅니다.',
        '이유는 셋입니다. 설정 저장소의 커밋 이력이 곧 <b>운영 변경 이력</b>이 되고, 운영 배포를 승인할 사람을 따로 정할 수 있고, replicas만 바꿀 때 앱을 다시 빌드하지 않아도 됩니다. 한 저장소에서 CI가 매니페스트를 커밋하면 그 커밋이 다시 CI를 깨우는 고리도 생겨요.',
      ],
      callout: { type: 'warn', text: 'Secret을 평문으로 넣지 마세요. base64는 암호화가 아닙니다. Git에는 <b>암호화된 값이나 참조</b>만 두고(Sealed Secrets, External Secrets), 진짜 값은 10장의 시크릿 매니저에 둡니다.' },
      hide: ['ops', 'e_gc'],
      show: ['src', 'ci'],
      set: { git: { label: '설정 저장소', sub: 'shop-config', color: 'olive' } },
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
    },
    {
      key: '태그 PR', kind: 'solution', title: '배포 = 이미지 태그 한 줄을 바꾸는 PR',
      body: [
        '그러면 CI가 만든 새 이미지는 어떻게 운영에 나갈까요? CI는 이미지를 푸시한 뒤, 설정 저장소에서 <b>이미지 태그 한 줄</b>을 바꾸는 <b>PR</b>을 엽니다. 리뷰하고 머지하는 것이 곧 배포 승인이에요.',
        'Argo CD가 머지를 발견해 sync 하고, 클러스터는 레지스트리에서 새 이미지를 받습니다. 앞 레슨의 롤링이나 카나리는 이 뒤에 클러스터 안에서 진행돼요. CI가 가진 권한은 <b>레지스트리 푸시와 PR 열기</b>뿐, 클러스터 권한은 없습니다.',
      ],
      callout: { type: 'tip', text: 'dev는 PR 없이 자동 커밋, prod는 리뷰를 거친 머지처럼 <b>환경마다 문턱</b>을 다르게 둘 수 있습니다. 태그는 덮어쓸 수 없는 git SHA여야 이 한 줄이 의미가 있어요.' },
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
    },
    {
      key: '롤백', kind: 'solution', title: '롤백 = git revert',
      body: [
        '새 버전에 문제가 있습니다. 되돌리는 길도 배포와 같습니다. 문제의 커밋을 <code>git revert</code> 하면 태그가 이전 값으로 돌아가고, Argo CD가 그대로 sync 해요. 누가 언제 왜 되돌렸는지도 이력에 남습니다.',
        '급하다고 <code>kubectl rollout undo</code>를 쓰면 어떻게 될까요? Git은 여전히 새 태그를 가리키니, self-heal이 <b>문제의 버전으로 다시 맞춰</b> 버립니다. Git이 진실인 세계에서는 Git을 고쳐야 합니다.',
      ],
      callout: { type: 'warn', text: '되돌아가는 것은 <b>Git에 적힌 것</b>뿐입니다. 이미 실행된 DB 마이그레이션은 revert로 돌아오지 않아요. 앞 레슨의 expand → contract가 여전히 필요합니다.' },
      hide: ['src', 'ci', 'reg'],
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
    },
    {
      key: '여러 클러스터', kind: 'concept', title: '같은 Git, 여러 클러스터',
      body: [
        'pull 방식은 클러스터가 늘어도 그대로 통합니다. 설정 저장소에 클러스터마다 폴더(overlay)를 두고, 각 클러스터의 Argo CD가 <b>자기 폴더</b>를 당겨 오게 하면 돼요. 클러스터 추가는 폴더 하나와 Application 하나입니다.',
        '클러스터가 어느 클라우드에 있든, 사설망 안에 숨어 있든 상관없습니다. <b>밖으로 Git에 닿기만</b> 하면 되니까요. EKS · AKS · GKE · NKS를 한 저장소로 운영하는 그림이고, 11장에서 이것을 플릿으로 키웁니다.',
      ],
      callout: { type: 'cloud', text: 'Argo CD만 있는 것은 아닙니다. <b>Flux</b>도 같은 pull 방식이고, AKS의 GitOps(Flux) 확장이나 GKE의 Config Sync처럼 클라우드가 관리해 주는 것도 있어요.' },
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
    },
    {
      key: '정리', kind: 'recap', title: '정리: Git이 말하고, 클러스터가 따릅니다',
      body: [
        '세 가지가 바뀌었습니다. 방향이 <b>push에서 pull로</b> 바뀌어 클러스터 자격 증명이 밖으로 나가지 않고, <b>Git이 유일한 진실</b>이라 드리프트는 감지되고 되돌려지며, 배포는 <b>PR 머지</b>, 롤백은 <b>git revert</b>가 됐습니다.',
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
      q: '장애 중에 운영자가 kubectl scale로 Pod를 3개에서 6개로 늘렸는데, 잠시 뒤 다시 3개로 돌아갔습니다. 이 클러스터는 Argo CD의 selfHeal이 켜져 있습니다. 가장 올바른 대응은?',
      options: [
        '돌아갈 때마다 kubectl scale을 다시 실행한다',
        '장애가 끝날 때까지 Argo CD를 삭제해 둔다',
        '설정 저장소의 replicas를 고쳐 머지한다. 평소 HPA가 관리한다면 replicas를 매니페스트에서 뺀다',
        '운영자에게 클러스터 관리자 권한을 더 준다',
      ],
      answer: 2,
      why: 'selfHeal은 클러스터를 Git에 적힌 대로 되돌립니다. 바꾸고 싶은 값은 Git에서 바꿔야 남습니다. 수동 명령을 반복하면 계속 되돌려지고, Argo CD를 지우면 드리프트를 막는 장치를 버리는 셈입니다. HPA가 조절하는 필드는 Git에 적지 않아야 둘이 싸우지 않습니다.',
    },
    {
      q: 'CI에서 쓰던 서드파티 액션 하나가 악성 코드로 밝혀졌습니다. push 방식(CI가 kubectl apply)과 pull 방식(Argo CD)의 피해 범위는 어떻게 다를까요?',
      options: [
        '차이가 없다. 둘 다 CI가 클러스터에 접근한다',
        'push 방식은 CI에 있던 클러스터 자격 증명이 넘어가지만, pull 방식의 CI에는 클러스터 권한이 없고 변경은 PR 리뷰를 거쳐야 한다',
        'pull 방식이 더 위험하다. Argo CD가 클러스터 안에 있기 때문이다',
        'push 방식이 더 안전하다. 파이프라인이 돌 때만 접근하기 때문이다',
      ],
      answer: 1,
      why: 'push 방식에서는 CI가 운영 클러스터의 자격 증명을 쥐고 있어, CI가 뚫리면 클러스터가 바로 넘어갑니다. pull 방식의 CI는 레지스트리 푸시와 PR 열기만 할 수 있고, 클러스터에 닿으려면 사람의 리뷰를 통과해야 합니다. 위험이 0은 아니지만 범위가 크게 줄어듭니다.',
    },
    {
      q: '새 버전에 버그가 있어 kubectl rollout undo로 되돌렸습니다. 몇 분 뒤 버그가 있는 버전이 다시 돌고 있습니다. 왜일까요?',
      options: [
        'rollout undo는 Deployment에서 동작하지 않아서',
        '레지스트리가 이전 이미지를 지워서',
        'readiness 프로브가 이전 버전을 거부해서',
        '설정 저장소가 여전히 새 태그를 가리켜, Argo CD가 클러스터를 Git에 맞춰 되돌려서',
      ],
      answer: 3,
      why: 'GitOps에서 진실은 Git입니다. 클러스터만 되돌리면 그것은 드리프트이고, self-heal은 드리프트를 Git 쪽으로 고칩니다. 올바른 롤백은 설정 저장소에서 문제의 커밋을 git revert 하는 것입니다. 그러면 되돌린 이력도 함께 남습니다.',
    },
    {
      q: '앱이 쓰는 DB 비밀번호를 설정 저장소로 관리하려 합니다. 가장 알맞은 방법은?',
      options: [
        'Git에는 암호화된 값이나 시크릿 매니저를 가리키는 참조만 두고, 클러스터 안에서 진짜 값으로 바꾼다',
        'Secret 매니페스트에 base64로 넣는다. 사람이 읽을 수 없으니 안전하다',
        '저장소가 private이니 평문으로 넣어도 된다',
        '비밀번호만 kubectl로 직접 만들고 Git에는 아무것도 두지 않는다',
      ],
      answer: 0,
      why: 'base64는 인코딩일 뿐 누구나 되돌릴 수 있고, private 저장소도 여러 노트북에 복제되며 이력에서 지우기 어렵습니다. 손으로 만든 Secret은 Git이 모르는 리소스라 재현도 감사도 안 됩니다. Sealed Secrets나 External Secrets처럼 Git에는 안전한 형태만 두는 방식이 GitOps와 맞습니다.',
    },
  ],
};
