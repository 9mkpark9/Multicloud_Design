export default {
  id: 'image-pipeline',
  learn: [
    '손으로 만든 이미지가 위험한 이유',
    '커밋 → 빌드 → 스캔 → 태그 → 푸시의 흐름',
    'git SHA 태그와 latest의 함정',
    'OIDC: 장기 키 없이 클라우드에 인증하기',
    '한 번 빌드하고 환경마다 승격하기',
    'SBOM과 이미지 서명이 증명하는 것',
  ],
  legend: [['build', '이미지'], ['ctrl', '이벤트 · 토큰'], ['res', '단기 자격 증명'], ['bad', '차단 · 문제']],
  metrics: [
    { id: 'tag', label: '배포 태그', icon: 'tag' },
    { id: 'key', label: '장기 키', icon: 'key' },
    { id: 'vuln', label: '취약점 검사', icon: 'shield-alert' },
    { id: 'builds', label: '빌드 횟수', icon: 'hammer' },
  ],
  scene: {
    zones: {
      prod: { at: [5.9, -3.6], size: [2.2, 4.9], label: 'prod 클러스터', color: 'red' },
    },
    nodes: {
      dev: { kind: 'client', at: [-1.6, 3.6], label: '개발자' },
      repo: { at: [0, 2], label: 'main', sub: 'GitHub 저장소', icon: 'git', color: 'slate' },
      runner: { at: [1.7, 0.3], label: 'CI 러너', sub: '일회용 VM', icon: 'bot', color: 'teal' },
      scan: { kind: 'tile', at: [0.2, -3.8], label: 'Trivy 스캔', icon: 'scan', color: 'yellow' },
      sts: { at: [0.6, -2.2], label: 'IAM 역할', sub: 'AWS STS', icon: 'id-card', color: 'aws' },
      reg: { kind: 'cyl', at: [3.4, -1.4], label: '레지스트리', icon: 'container', color: 'orange' },
      podA: { at: [7, -2.6], label: 'Pod A', sub: ':latest', icon: 'box', color: 'blue' },
      podB: { at: [7, 0], label: 'Pod B', sub: ':latest', icon: 'box', color: 'blue' },
      eDev: { at: [6.6, -3.6], label: 'dev', sub: '클러스터', icon: 'boxes', color: 'gray' },
      eStg: { at: [6.6, -1], label: 'stg', sub: '클러스터', icon: 'boxes', color: 'blue' },
      eProd: { at: [6.6, 1.6], label: 'prod', sub: '클러스터', icon: 'boxes', color: 'red' },
      sbom: { kind: 'tile', size: 's', at: [3.2, -4.6], label: 'SBOM', icon: 'clipboard-list', color: 'olive' },
      sig: { kind: 'tile', size: 's', at: [4.9, -2.9], label: '서명', icon: 'badge', color: 'green' },
      ecr: { at: [3, 1], label: 'ECR', sub: 'AWS', icon: 'container', color: 'aws' },
      acr: { at: [4.6, -0.6], label: 'ACR', sub: 'Azure', icon: 'container', color: 'azure' },
      gar: { at: [6.2, -2.2], label: 'Artifact\nRegistry', sub: 'GCP', icon: 'container', color: 'gcp' },
      ncr: { at: [7.8, -3.8], label: 'Container\nRegistry', sub: 'NCP', icon: 'container', color: 'ncp' },
    },
    edges: {
      e_dev_reg: { from: 'dev', to: 'reg', tone: 'bad' },
      e_dev_repo: { from: 'dev', to: 'repo' },
      e_repo_run: { from: 'repo', to: 'runner' },
      e_run_reg: { from: 'runner', to: 'reg' },
      e_run_scan: { from: 'runner', to: 'scan' },
      e_scan_reg: { from: 'scan', to: 'reg' },
      e_run_sts: { from: 'runner', to: 'sts', bi: true, style: 'dashed' },
      e_reg_pa: { from: 'reg', to: 'podA' },
      e_reg_pb: { from: 'reg', to: 'podB' },
      e_reg_dev: { from: 'reg', to: 'eDev' },
      e_reg_stg: { from: 'reg', to: 'eStg' },
      e_reg_prod: { from: 'reg', to: 'eProd' },
      e_sbom: { from: 'sbom', to: 'reg', style: 'dashed', arrow: false },
      e_sig: { from: 'sig', to: 'reg', style: 'dashed', arrow: false },
    },
  },
  codes: {
    wf: {
      title: '.github/workflows/image.yml',
      lang: 'yaml',
      text: `on:
  push: { branches: [main] }
permissions:
  id-token: write   # OIDC 토큰 허용
  contents: read
env:
  IMAGE: \${{ vars.ECR_REPO }}:\${{ github.sha }}
jobs:
  image:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: \${{ vars.AWS_ROLE }}
          aws-region: ap-northeast-2
      - uses: aws-actions/amazon-ecr-login@v2
      - run: docker build -t "$IMAGE" .
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: \${{ env.IMAGE }}
          severity: CRITICAL
          exit-code: '1'
      - run: docker push "$IMAGE"
`,
    },
  },
  steps: [
    {
      key: '노트북 빌드', kind: 'problem', title: '이 이미지는 누구 노트북에서 왔나요',
      body: [
        'CI는 통과했고, 이제 배포할 컨테이너 이미지가 필요합니다. 가장 흔한 시작은 개발자가 자기 노트북에서 <code>docker build</code> 하고 <code>docker push</code> 하는 것입니다.',
        '이 이미지가 <b>어느 커밋</b>으로 만들어졌는지, 테스트를 통과한 코드가 맞는지, 커밋하지 않은 파일이 섞이지는 않았는지 아무도 보증할 수 없습니다. 푸시에 쓴 클라우드 키는 노트북에 남아 있고요.',
      ],
      callout: { type: 'warn', text: '운영에서 도는 이미지를 <b>소스 커밋까지 거슬러 올라갈 수 없다면</b>, 장애가 났을 때 무엇을 고쳐야 할지도 알 수 없습니다.' },
      show: ['dev', 'reg'],
      tags: [{ on: 'dev', text: 'docker push', icon: 'terminal' }, { on: 'reg', text: '어느 커밋?', tone: 'bad', icon: 'help' }],
      flows: [{ path: ['dev', 'reg'], kind: 'build', n: 2 }],
      metrics: { tag: ['latest', 'bad'], key: ['노트북에', 'bad'], vuln: '안 함', builds: '사람마다' },
    },
    {
      key: '파이프라인', kind: 'solution', title: '커밋이 이미지가 되는 컨베이어',
      body: [
        '이미지 만들기를 CI 뒤에 이어 붙입니다. <code>main</code>에 커밋이 들어오면 러너가 <b>빌드 → 취약점 스캔 → 태그 → 푸시</b>를 차례로 실행해요. 사람 손은 <code>git push</code>에서 끝납니다.',
        '같은 커밋, 같은 Dockerfile, 깨끗한 러너에서 만들어지니 결과를 <b>재현</b>할 수 있습니다. 레지스트리에 쓸 권한은 파이프라인만 갖고, 개발자 노트북에서는 뺍니다.',
      ],
      callout: { type: 'key', text: '이 파이프라인의 산출물은 그냥 이미지가 아니라 <b>출처를 아는 이미지</b>입니다. 어느 커밋에서, 어떤 검사를 거쳐 나왔는지가 함께 남아요.' },
      show: ['repo', 'runner'],
      hide: ['e_dev_reg'],
      focus: ['runner'],
      tags: [{ on: 'runner', text: '빌드 → 스캔 → 푸시', tone: 'ok' }],
      flows: [
        { path: ['dev', 'repo'], kind: 'build' },
        { path: ['repo', 'runner'], kind: 'ctrl', delay: 1 },
        { path: ['runner', 'reg'], kind: 'build', delay: 2 },
      ],
      metrics: { key: ['CI Secrets에', 'warn'], builds: '커밋마다' },
      changes: [['+', '이미지 파이프라인'], ['-', '노트북의 레지스트리 키'], ['~', '빌드 장소: 노트북 → 러너']],
    },
    {
      key: 'SHA 태그', kind: 'concept', title: '태그는 git SHA: 이미지 = 커밋',
      body: [
        '<code>IMAGE</code>는 레지스트리 주소 뒤에 <code>github.sha</code>, 곧 이 실행을 일으킨 <b>커밋의 SHA</b>를 태그로 붙인 이름입니다. <code>docker build</code>가 그 이름으로 이미지를 만들어요.',
        '이제 <code>shop-api:a3f9c2e</code>만 보면 어떤 소스인지 바로 압니다(실제 태그는 40자 전체이고, 여기서는 줄여 씁니다). 커밋마다 태그가 달라 <b>덮어쓸 일도 없습니다</b>.',
      ],
      callout: { type: 'tip', text: '레지스트리의 <b>태그 불변</b>(immutable) 설정까지 켜 두면 실수로 덮어쓰는 것도 막힙니다. <code>v1.4.2</code> 같은 릴리스 버전은 같은 이미지에 태그를 하나 더 붙이면 돼요.' },
      hide: ['dev'],
      code: { ref: 'wf', hl: [6, 7, 18] },
      tags: [{ on: 'repo', text: '커밋 a3f9c2e', icon: 'git-commit' }, { on: 'reg', text: ':a3f9c2e', tone: 'ok', icon: 'tag' }],
      flows: [{ path: ['repo', 'runner'], kind: 'ctrl' }, { path: ['runner', 'reg'], kind: 'build', delay: 1 }],
      metrics: { tag: ['a3f9c2e', 'ok'] },
      changes: [['~', '태그 latest → 커밋 SHA']],
    },
    {
      key: 'latest 함정', kind: 'case', title: '사례: latest로 배포했더니',
      body: [
        '어느 팀은 매니페스트에 <code>shop-api:latest</code>를 쓰고 빌드할 때마다 <code>latest</code>를 덮어썼습니다. Pod는 <b>자기가 뜰 때의</b> latest를 받으니, 월요일에 뜬 Pod와 수요일에 재시작된 Pod가 서로 다른 코드를 돌리고 있었어요.',
        '장애가 나서 <code>kubectl rollout undo</code>를 해도 소용없습니다. 이전 리비전도 똑같이 <code>latest</code>를 가리키니까요. 직전 이미지는 이름표를 잃어 찾기조차 어렵습니다.',
      ],
      callout: { type: 'warn', text: '<code>latest</code>는 버전이 아니라 <b>"마지막에 푸시된 것"</b>이라는 움직이는 이름표입니다. 매니페스트에는 불변 태그나 다이제스트(<code>@sha256:…</code>)를 쓰세요.' },
      hide: ['repo', 'runner'],
      show: ['prod', 'podA', 'podB'],
      set: { podA: { badge: '월요일 빌드' }, podB: { badge: '수요일 빌드', tone: 'bad' } },
      tags: [{ on: 'reg', text: ':latest 덮어쓰기', tone: 'bad' }],
      flows: [{ path: ['reg', 'podA'], kind: 'build' }, { path: ['reg', 'podB'], kind: 'bad', delay: 0.8 }],
      metrics: { tag: ['latest', 'bad'] },
      changes: [['-', '같은 태그, 다른 이미지'], ['-', '롤백할 대상이 없음']],
    },
    {
      key: '스캔', kind: 'concept', title: '푸시하기 전에 취약점을 스캔합니다',
      body: [
        '내 코드가 멀쩡해도 <b>베이스 이미지와 라이브러리</b>에 알려진 취약점(CVE)이 들어 있을 수 있습니다. <b>Trivy</b> 같은 스캐너는 이미지 속 OS 패키지와 의존성을 취약점 데이터베이스와 대조해요.',
        '<code>exit-code: \'1\'</code>은 <code>CRITICAL</code> 등급이 나오면 이 단계를 실패시키라는 뜻입니다. 스캔이 <b>푸시보다 앞</b>에 있으니, 걸린 이미지는 레지스트리에 올라가지 못합니다.',
      ],
      callout: { type: 'tip', text: '처음부터 모든 등급을 막으면 파이프라인이 늘 빨갛습니다. 치명적인 것부터 막고 기준을 올리세요. 취약점은 배포 뒤에도 새로 발견되니 <b>주기적 재스캔</b>도 필요합니다.' },
      hide: ['prod', 'podA', 'podB', 'e_run_reg'],
      show: ['repo', 'runner', 'scan'],
      code: { ref: 'wf', hl: [19, 20, 21, 22, 23] },
      tags: [{ on: 'scan', text: 'CRITICAL이면 실패', tone: 'bad', icon: 'shield-alert' }],
      flows: [
        { path: ['runner', 'scan'], kind: 'bad' },
        { path: ['runner', 'scan', 'reg'], kind: 'build', delay: 1.2 },
      ],
      metrics: { tag: ['a3f9c2e', 'ok'], vuln: ['푸시 전 차단', 'ok'] },
      changes: [['+', '스캔 게이트'], ['~', '취약점 검사: 안 함 → 푸시 전']],
    },
    {
      key: 'OIDC', kind: 'solution', title: 'OIDC: 저장해 둔 키 없이 인증하기',
      body: [
        '푸시하려면 클라우드 권한이 필요합니다. 액세스 키를 CI Secrets에 넣어 둬도 동작은 하지만, <b>만료되지 않는 키</b>는 로그나 악성 의존성으로 한 번 새면 계속 쓰입니다.',
        '<b>OIDC</b>를 쓰면 러너가 실행마다 GitHub에서 "나는 이 저장소의 main 브랜치 실행"이라고 적힌 <b>서명된 토큰</b>을 받습니다. 클라우드는 서명과 조건을 확인하고, 그 역할의 <b>단기 자격 증명</b>을 내줘요.',
      ],
      callout: { type: 'key', text: '저장할 비밀이 없으니 샐 것도 없습니다. 대신 역할의 신뢰 조건을 <b>좁게</b> 거세요. 조직 전체가 아니라 특정 저장소와 브랜치만 허용합니다.' },
      hide: ['scan', 'repo'],
      show: ['sts', 'e_run_reg'],
      code: { ref: 'wf', hl: [3, 4, 5, 13, 14, 15, 16] },
      tags: [{ on: 'runner', text: 'OIDC 토큰', icon: 'fingerprint', pos: 'bottom' }, { on: 'sts', text: '저장소 · 브랜치 확인', tone: 'accent' }],
      flows: [
        { path: ['runner', 'sts'], kind: 'ctrl' },
        { path: ['sts', 'runner'], kind: 'res', delay: 1.1 },
        { path: ['runner', 'reg'], kind: 'build', delay: 2.2 },
      ],
      metrics: { key: ['0개', 'ok'] },
      changes: [['-', 'CI Secrets의 액세스 키'], ['+', '실행마다 단기 자격 증명']],
    },
    {
      key: '승격', kind: 'concept', title: '한 번 빌드하고, 같은 이미지를 승격',
      body: [
        '환경마다 이미지를 다시 빌드하면 안 됩니다. 그 사이 베이스 이미지나 의존성이 바뀌면 <b>stg에서 검증한 것과 prod에 나가는 것이 다른 물건</b>이 되니까요.',
        '이미지는 <b>한 번만</b> 빌드하고, 같은 다이제스트를 dev → stg → prod로 <b>승격</b>(promote)합니다. 환경마다 달라야 하는 값은 이미지에 굽지 않고 ConfigMap·Secret으로 밖에서 넣어요.',
      ],
      callout: { type: 'key', text: '승격은 다시 만드는 것이 아니라 <b>같은 것을 다음 환경에 내보내도 좋다고 허락하는 것</b>입니다. 그래서 앞 환경의 테스트 결과가 운영까지 유효해요.' },
      hide: ['sts'],
      show: ['eDev', 'eStg', 'eProd'],
      set: { eDev: { badge: 'a3f9c2e', tone: 'ok' }, eStg: { badge: 'a3f9c2e', tone: 'ok' }, eProd: { badge: 'a3f9c2e', tone: 'ok' } },
      tags: [{ on: 'reg', text: '다이제스트 하나', icon: 'fingerprint' }],
      flows: [
        { path: ['runner', 'reg'], kind: 'build' },
        { path: ['reg', 'eDev'], kind: 'build', delay: 1 },
        { path: ['reg', 'eStg'], kind: 'build', delay: 1.8 },
        { path: ['reg', 'eProd'], kind: 'build', delay: 2.6 },
      ],
      metrics: { builds: ['1번', 'ok'] },
      changes: [['~', '환경별 재빌드 → 1번 빌드'], ['+', 'dev → stg → prod 승격']],
    },
    {
      key: 'SBOM · 서명', kind: 'concept', title: 'SBOM과 서명: 내용물과 출처의 증명',
      body: [
        '<b>SBOM</b>(Software Bill of Materials)은 이미지에 들어간 모든 패키지와 버전의 목록입니다. 새 취약점이 발표되면 "우리 이미지 중 어디에 들어 있지?"를 목록만 검색해 답할 수 있어요.',
        '<b>서명</b>은 이 이미지가 정말 우리 파이프라인에서 나왔고 그 뒤로 바뀌지 않았음을 증명합니다. <b>cosign</b> 같은 도구로 다이제스트에 서명해 레지스트리에 함께 두고, 클러스터는 <b>서명이 확인된 이미지만</b> 실행하도록 정책을 겁니다.',
      ],
      callout: { type: 'tip', text: '스캔이 "알려진 문제가 있는가"를 본다면, 서명은 "누가 만들었는가"를 봅니다. 둘 다 <b>소프트웨어 공급망 보안</b>의 기본기예요.' },
      hide: ['eDev', 'eStg'],
      show: ['sbom', 'sig'],
      set: { eProd: { badge: null } },
      tags: [{ on: 'eProd', text: '서명 검증 후 실행', tone: 'ok', icon: 'shield-check' }],
      flows: [
        { path: ['runner', 'reg'], kind: 'build' },
        { path: ['reg', 'eProd'], kind: 'build', delay: 1.2 },
      ],
      changes: [['+', 'SBOM: 구성품 목록'], ['+', '서명: 출처와 무결성']],
    },
    {
      key: '4대 클라우드', kind: 'compare', title: '네 클라우드의 레지스트리와 인증',
      body: [
        '네 클라우드 모두 관리형 레지스트리가 있고, 푸시·풀은 같은 OCI 표준을 따릅니다. 차이는 <b>CI가 어떻게 인증하느냐</b>에 있어요.',
        'AWS · Azure · GCP는 GitHub 같은 외부 OIDC 발급자를 신뢰하도록 설정해 <b>키 없이</b> 단기 토큰을 받게 할 수 있습니다. NCP Container Registry는 서브 계정의 액세스 키로 로그인하는 방식이 기본이라, 전용 서브 계정에 최소 권한만 주고 키를 주기적으로 교체합니다.',
      ],
      callout: { type: 'cloud', text: '멀티클라우드에서는 같은 다이제스트를 클라우드마다 있는 레지스트리에 <b>복제</b>해, 각 클러스터가 가까운 곳에서 받게 하기도 합니다.' },
      hide: ['sbom', 'sig', 'eProd', 'reg', 'runner'],
      show: ['ecr', 'acr', 'gar', 'ncr'],
      panel: { title: 'CI → 클라우드 인증', icon: 'key', rows: [['AWS', 'IAM OIDC 공급자 + 역할', 'aws'], ['Azure', 'Workload Identity Federation', 'azure'], ['GCP', 'Workload Identity Federation', 'gcp'], ['NCP', 'Sub Account 액세스 키', 'ncp']] },
    },
    {
      key: '정리', kind: 'recap', title: '정리: 출처를 아는 이미지만 내보냅니다',
      body: [
        '커밋이 들어오면 파이프라인이 이미지를 <b>한 번</b> 빌드하고, 스캔으로 걸러 내고, <b>git SHA</b>로 이름 붙여 OIDC 인증으로 푸시합니다. SBOM과 서명이 내용물과 출처를 증명하고요.',
        '그 결과 운영의 어떤 이미지든 커밋까지 거슬러 올라갈 수 있고, 롤백할 대상도 분명합니다. 다음 레슨에서는 이 이미지를 <b>사용자에게 안전하게 내보내는 방법</b>, 배포 전략을 다룹니다.',
      ],
      hide: ['ecr', 'acr', 'gar', 'ncr', 'e_run_reg'],
      show: ['repo', 'runner', 'scan', 'reg'],
      focus: ['reg'],
      tags: [{ on: 'reg', text: ':a3f9c2e · 서명됨', tone: 'ok', icon: 'badge', pos: 'right' }],
      flows: [
        { path: ['repo', 'runner'], kind: 'ctrl' },
        { path: ['runner', 'scan', 'reg'], kind: 'build', delay: 1 },
      ],
    },
  ],
  quiz: [
    {
      q: 'prod 매니페스트가 shop-api:latest를 가리킵니다. 장애가 나서 kubectl rollout undo를 했는데 달라진 것이 없습니다. 이유는?',
      options: ['rollout undo는 Deployment에는 쓸 수 없어서', '이전 리비전도 같은 latest 태그를 가리켜 결국 같은 이미지를 받아서', '레지스트리가 이전 이미지를 자동으로 지워서', 'readiness 프로브가 롤백을 막아서'],
      answer: 1,
      why: '롤백은 Pod 템플릿을 이전 리비전으로 되돌릴 뿐인데, 그 템플릿도 latest라면 지금의 latest를 다시 받습니다. 커밋마다 다른 불변 태그를 써야 "이전 버전"이 실제로 다른 이미지를 가리킵니다.',
    },
    {
      q: 'stg에서 테스트를 마친 뒤, prod 배포 파이프라인이 같은 커밋으로 이미지를 다시 빌드합니다. 가장 큰 위험은?',
      options: ['빌드 시간이 두 배로 든다', '레지스트리 저장 비용이 늘어난다', '베이스 이미지나 의존성이 그 사이 바뀌어, 검증하지 않은 이미지가 prod에 나간다', '태그 이름이 길어진다'],
      answer: 2,
      why: '같은 커밋이라도 빌드 시점이 다르면 내려받는 베이스 이미지와 패키지가 달라질 수 있습니다. 시간과 비용도 들지만, 핵심은 테스트한 물건과 배포한 물건이 달라진다는 점입니다. 한 번 빌드한 다이제스트를 승격하세요.',
    },
    {
      q: 'GitHub Actions에서 클라우드 레지스트리에 푸시해야 합니다. 가장 안전한 인증 방식은?',
      options: ['관리자 액세스 키를 저장소 Secrets에 넣는다', '푸시 권한만 있는 액세스 키를 Secrets에 넣고 그대로 둔다', '특정 저장소·브랜치만 신뢰하는 역할을 OIDC로 맡아 단기 자격 증명을 받는다', '개발자 개인 키를 워크플로 파일에 적는다'],
      answer: 2,
      why: 'OIDC는 저장해 둘 장기 비밀이 없고, 받은 자격 증명은 곧 만료됩니다. 최소 권한 키는 관리자 키보다 낫지만 만료가 없어 새면 계속 쓰입니다. 신뢰 조건을 저장소·브랜치로 좁히는 것까지가 한 세트입니다.',
    },
    {
      q: '석 달 전 스캔을 통과해 지금도 운영 중인 이미지가 있습니다. 이 이미지에 대해 옳은 판단은?',
      options: ['통과한 이미지는 불변이므로 계속 안전하다', '이미지는 그대로여도 새 취약점이 계속 발표되므로 주기적으로 다시 스캔해야 한다', '서명이 있으면 취약점은 신경 쓰지 않아도 된다', 'latest 태그로 바꾸면 자동으로 해결된다'],
      answer: 1,
      why: '스캔은 "그 시점에 알려진" 취약점만 봅니다. 이미지 내용은 변하지 않아도 취약점 데이터베이스는 매일 늘어납니다. 서명은 출처를 증명할 뿐이고, SBOM이 있으면 새 취약점의 영향 범위를 빨리 찾을 수 있습니다.',
    },
  ],
};
