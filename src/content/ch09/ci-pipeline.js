export default {
  id: 'ci-pipeline',
  learn: [
    '통합 지옥: 브랜치를 오래 묵히면 생기는 일',
    'GitHub Actions 해부: on · jobs · runner · steps · matrix',
    '캐시 · 아티팩트 · 시크릿 · 환경을 구분해 쓰기',
    '브랜치 보호와 필수 체크로 main 지키기',
    '테스트 피라미드와 flaky test 다루기',
    'CI 도구를 고르는 기준',
  ],
  legend: [['build', '커밋 · 코드'], ['ctrl', '이벤트 · 실행'], ['res', '결과 통보'], ['data', '의존성 · 시크릿'], ['bad', '실패 · 거부']],
  metrics: [
    { id: 'fb', label: '문제 발견까지', icon: 'clock' },
    { id: 'merge', label: '통합 주기', icon: 'git-merge' },
    { id: 'main', label: 'main 상태', icon: 'git' },
    { id: 'pipe', label: 'CI 한 번에', icon: 'timer' },
  ],
  scene: {
    nodes: {
      devA: { kind: 'client', at: [0, 2.6], label: '개발자 A' },
      devB: { kind: 'client', at: [3.4, 4], label: '개발자 B' },
      repo: { at: [1.6, 1], label: 'main', sub: 'GitHub 저장소', icon: 'git', color: 'slate' },
      team: { kind: 'users', at: [5.4, 2], label: '팀 전체' },
      runner: { at: [3.2, -0.6], label: 'CI 러너', sub: '일회용 VM', icon: 'bot', color: 'teal' },
      cron: { kind: 'tile', size: 's', at: [-0.4, -2.0], label: 'schedule', icon: 'calendar', color: 'yellow' },
      jobL: { at: [4.0, 2.0], size: 's', label: 'lint', sub: 'job', icon: 'search', color: 'yellow' },
      jobT: { at: [4.0, -0.4], size: 's', label: 'test', sub: 'job', icon: 'flask', color: 'teal' },
      jobB: { at: [6.4, 0.8], size: 's', label: 'build', sub: 'job', icon: 'hammer', color: 'blue' },
      lint: { kind: 'tile', size: 's', at: [2.85, -0.25], label: '린트', icon: 'search', color: 'yellow' },
      test: { kind: 'tile', size: 's', at: [3.85, -1.25], label: '테스트', icon: 'flask', color: 'teal' },
      build: { kind: 'tile', size: 's', at: [4.85, -2.25], label: '빌드', icon: 'hammer', color: 'blue' },
      registry: { kind: 'cyl', at: [3.2, -3.2], label: 'npm 레지스트리', icon: 'package', color: 'gray' },
      cache: { kind: 'cyl', at: [6.2, -0.2], label: '캐시', icon: 'archive', color: 'green' },
      sec: { kind: 'tile', at: [-0.4, -2.0], label: 'Secrets', icon: 'key', color: 'purple' },
      env: { at: [6.0, -1.8], label: 'production', sub: '배포 환경', icon: 'shield-check', color: 'red' },
      pyU: { kind: 'tile', size: 'l', at: [6.0, -1.0], icon: 'flask', color: 'green' },
      pyI: { kind: 'tile', size: 'm', at: [6.0, -1.0], z: 16, icon: 'link', color: 'yellow' },
      pyE: { kind: 'tile', size: 's', at: [6.0, -1.0], z: 32, icon: 'monitor', color: 'red' },
      gha: { at: [1.6, 3.2], label: 'GitHub\nActions', icon: 'workflow', color: 'slate' },
      gl: { at: [2.6, 0.6], label: 'GitLab CI', icon: 'git-merge', color: 'orange' },
      jk: { at: [3.6, -2], label: 'Jenkins', icon: 'wrench', color: 'red' },
    },
    edges: {
      e_a: { from: 'devA', to: 'repo' },
      e_b: { from: 'devB', to: 'repo' },
      e_team: { from: 'repo', to: 'team' },
      e_run: { from: 'repo', to: 'runner', bi: true },
      e_cron: { from: 'cron', to: 'repo', style: 'dashed' },
      e_rl: { from: 'repo', to: 'jobL' },
      e_rt: { from: 'repo', to: 'jobT' },
      e_lb: { from: 'jobL', to: 'jobB', label: 'needs' },
      e_tb: { from: 'jobT', to: 'jobB' },
      e_rb: { from: 'repo', to: 'jobB', off: true },
      e_lint: { from: 'repo', to: 'lint' },
      e_lt: { from: 'lint', to: 'test' },
      e_tb2: { from: 'test', to: 'build' },
      e_reg: { from: 'registry', to: 'runner', style: 'dashed', tone: 'mute' },
      e_cache: { from: 'cache', to: 'runner', tone: 'ok' },
      e_sec: { from: 'sec', to: 'runner', style: 'dashed' },
      e_env: { from: 'runner', to: 'env' },
      e_py: { from: 'runner', to: 'pyU', style: 'dashed', tone: 'mute' },
    },
  },
  codes: {
    ci: {
      title: '.github/workflows/ci.yml',
      lang: 'yaml',
      text: `name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
`,
    },
    on: {
      title: 'ci.yml · on',
      lang: 'yaml',
      text: `on:
  push:
    branches: [main]
  pull_request:
    paths-ignore: ['docs/**']
  schedule:
    - cron: '0 18 * * *'   # UTC
  workflow_dispatch:

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true
`,
    },
    jobs: {
      title: 'ci.yml · jobs',
      lang: 'yaml',
      text: `jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
`,
    },
    matrix: {
      title: 'ci.yml · matrix',
      lang: 'yaml',
      text: `  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
`,
    },
  },
  steps: [
    {
      key: '통합 지옥', kind: 'problem', title: '며칠 묵힌 브랜치를 합치는 날',
      body: [
        '쇼핑몰 <code>shop.example</code> 팀의 두 개발자가 각자 브랜치에서 일주일 넘게 작업했습니다. 그 사이 <code>main</code>도, 서로의 코드도 계속 달라졌죠.',
        '릴리스 전날 한꺼번에 합치자 충돌이 수십 군데 터집니다. 겨우 합쳐도 빌드가 안 되고, 어느 변경이 원인인지 찾을 수가 없어요. 이것이 <b>통합 지옥</b>(integration hell)입니다.',
      ],
      callout: { type: 'key', text: '통합의 고통은 <b>묵힌 시간만큼 커집니다</b>. 변경이 클수록 충돌도, 원인 후보도 많아지니까요.' },
      show: ['devA', 'devB', 'repo'],
      set: { repo: { state: 'hot', badge: '충돌', tone: 'bad' } },
      tags: [{ on: 'devA', text: '브랜치 8일째', icon: 'git' }, { on: 'devB', text: '브랜치 6일째', icon: 'git' }],
      flows: [
        { path: ['devA', 'repo'], kind: 'build', n: 3 },
        { path: ['devB', 'repo'], kind: 'build', n: 2, delay: 0.3 },
        { path: ['devB', 'repo'], kind: 'bad', n: 2, delay: 1.2 },
      ],
      metrics: { fb: ['일주일 뒤', 'bad'], merge: '주 1회', main: ['충돌', 'bad'], pipe: '손으로' },
      more: [
        { title: '동작 원리', body: [
          'Git이 알려 주는 충돌은 <b>같은 줄</b>을 둘이 고쳤을 때뿐입니다. 더 무서운 것은 <b>의미 충돌</b>이에요. A가 함수 <code>calcPrice(item)</code>의 인자를 바꾸고, B가 다른 파일에서 그 함수를 옛 방식으로 새로 불렀다면 텍스트 충돌 없이 깔끔하게 합쳐지지만 빌드는 깨집니다.',
          '브랜치가 오래 살수록 이런 숨은 충돌의 후보가 곱으로 늘어납니다. 고칠 때도 "일주일 전 내가 왜 이렇게 짰지?"를 되살려야 하니 비용이 이중으로 들어요.',
        ] },
        { title: '직접 해보기', body: ['내 브랜치가 main과 얼마나 벌어졌는지 커밋 수로 봅니다. 왼쪽은 main에만, 오른쪽은 내 브랜치에만 있는 커밋입니다.'], code: { title: 'terminal', lang: 'sh', text: '$ git fetch origin\n$ git rev-list --left-right --count origin/main...feat/cart\n37\t12\n$ git diff --stat origin/main...feat/cart | tail -1\n 48 files changed, 2210 insertions(+), 640 deletions(-)' } },
        { title: '실무 팁', list: [
          '<b>trunk-based development</b>: 브랜치는 하루 이틀 안에 main으로 합치고, 큰 기능은 작은 PR 여러 개로 쪼갭니다.',
          '아직 켜면 안 되는 미완성 기능은 브랜치에 묵히지 말고 <b>feature flag</b>로 꺼 둔 채 합칩니다(「롤링·블루그린·카나리」에서 다룹니다).',
          'PR 하나의 변경은 리뷰어가 한 번에 읽을 수 있는 크기(대략 수백 줄 이내)로 유지하는 팀이 많습니다.',
        ] },
      ],
    },
    {
      key: '깨진 main', kind: 'problem', title: '테스트는 기억날 때만 돌립니다',
      body: [
        '빌드와 테스트를 사람이 손으로 돌리면, 바쁜 날에는 건너뜁니다. "내 PC에서는 됐어요"라는 말과 함께 깨진 코드가 <code>main</code>에 들어옵니다.',
        '<code>main</code>이 깨지면 그 위에서 일하는 <b>모두가 멈춥니다</b>. 최신 코드를 받은 사람마다 같은 오류를 만나고, 누가 언제 깨뜨렸는지부터 찾아야 하죠.',
      ],
      callout: { type: 'warn', text: '문제는 늦게 발견할수록 비쌉니다. 방금 쓴 코드는 몇 분이면 고치지만, 일주일 전 코드는 <b>기억을 되살리는 데만</b> 한참 걸려요.' },
      show: ['team'],
      set: { repo: { state: 'down', badge: '빌드 실패', tone: 'bad' } },
      tags: [{ on: 'devB', text: '테스트 생략', tone: 'bad' }],
      flows: [
        { path: ['devB', 'repo'], kind: 'bad' },
        { path: ['repo', 'team'], kind: 'bad', n: 3, delay: 1.1 },
      ],
      metrics: { main: ['깨짐', 'bad'] },
      changes: [['-', 'main 빌드 실패'], ['~', '팀 전체가 대기']],
      more: [
        { title: '"내 PC에서는 됨"의 정체', list: [
          '로컬에만 있는 <code>node_modules</code>나 전역 설치 도구: lock 파일과 다른 버전이 깔려 있어요.',
          '커밋하지 않은 파일, 내 셸에만 있는 환경 변수, <code>.env</code>.',
          'OS 차이: macOS는 파일 이름 대소문자를 기본으로 구분하지 않지만 리눅스 러너는 구분합니다. <code>import "./Cart"</code>와 <code>cart.js</code>가 로컬에선 됩니다.',
          '타임존·로캘: 로컬은 KST, 러너는 보통 UTC라 날짜 테스트가 갈립니다.',
        ] },
        { title: '직접 해보기', body: ['main을 깨뜨린 커밋을 찾을 때는 <code>git bisect</code>가 이진 탐색으로 범위를 좁혀 줍니다. 테스트 명령을 주면 자동으로 끝까지 갑니다.'], code: { title: 'terminal', lang: 'sh', text: '$ git bisect start\n$ git bisect bad HEAD\n$ git bisect good v1.8.0\n$ git bisect run npm test\n...\na41c9e2 is the first bad commit\n    장바구니 합계 계산 리팩터링\n$ git bisect reset' } },
        { title: '실무 팁', body: ['main이 깨지면 <b>먼저 되돌리고(revert), 나중에 고칩니다</b>. 원인 커밋을 <code>git revert</code>로 빼서 팀을 풀어 준 뒤, 작성자가 브랜치에서 차분히 고쳐 다시 올리는 편이 "고칠 때까지 모두 기다려"보다 훨씬 쌉니다.'] },
      ],
    },
    {
      key: 'CI', kind: 'solution', title: 'push할 때마다 기계가 검사합니다',
      body: [
        '<b>CI</b>(Continuous Integration, 지속적 통합)는 두 가지 습관입니다. 변경을 <b>작게, 자주</b> 합치고, 합칠 때마다 <b>자동으로 빌드·테스트</b>합니다.',
        '코드를 push하면 저장소가 이벤트를 내고, <b>러너</b>(runner)라는 깨끗한 일회용 머신이 코드를 받아 검사한 뒤 결과를 돌려줍니다. 사람의 기억에 기대지 않아요.',
      ],
      callout: { type: 'key', text: '몇 분 안에 결과가 오면 <b>방금 한 변경</b>이 원인이라는 걸 바로 압니다. 이 빠른 피드백이 CI의 값어치예요.' },
      hide: ['team', 'devB'],
      show: ['runner'],
      set: { repo: { state: null, badge: null } },
      focus: ['runner'],
      tags: [{ on: 'devA', text: '작게, 하루 여러 번', tone: 'ok' }, { on: 'runner', text: '매번 새 VM', icon: 'refresh', pos: 'right' }],
      flows: [
        { path: ['devA', 'repo'], kind: 'build' },
        { path: ['repo', 'runner'], kind: 'ctrl', delay: 1 },
        { path: ['runner', 'repo'], kind: 'res', delay: 2 },
        { path: ['repo', 'devA'], kind: 'res', delay: 3 },
      ],
      metrics: { fb: ['8분', 'ok'], merge: ['하루 여러 번', 'ok'], main: ['초록', 'ok'], pipe: '8분' },
      changes: [['+', 'CI 러너'], ['~', '문제 발견 일주일 → 8분'], ['~', '통합 주 1회 → 매일']],
      more: [
        { title: '동작 원리', body: [
          'push가 일어나면 GitHub은 저장소의 <code>.github/workflows/*.yml</code> 중 그 이벤트에 걸리는 워크플로를 찾아 <b>run</b>을 만들고, 그 안의 job을 대기열에 넣습니다. 비어 있는 러너가 job을 가져가 실행하고, 로그를 실시간으로 올리고, 끝나면 결과를 그 커밋의 <b>체크</b>(check run)로 기록합니다.',
          'GitHub이 빌려주는 러너는 job 하나마다 새 VM이 뜨고 끝나면 버려집니다. 지난번 빌드가 남긴 파일이 다음 빌드를 오염시키지 않으니, CI 결과가 "깨끗한 환경에서도 된다"는 증명이 됩니다.',
        ] },
        { title: '출력 읽기', body: ['터미널에서 GitHub CLI로 최근 실행을 보고, 실패한 step의 로그만 뽑아 봅니다.'], code: { title: 'terminal', lang: 'sh', text: '$ gh run list --limit 3\nSTATUS  TITLE       WORKFLOW  BRANCH     EVENT         ELAPSED\n✓       fix cart    ci        feat/cart  pull_request  2m41s\nX       pay button  ci        feat/pay   pull_request  1m12s\n✓       Merge #41   ci        main       push          3m05s\n$ gh run view --log-failed  # 실패 run을 고르면 로그 출력' } },
        { title: 'CI와 CD', list: [
          '<b>CI</b>: 합칠 때마다 빌드·테스트해 main을 늘 초록으로 유지.',
          '<b>Continuous Delivery</b>: main의 모든 커밋이 언제든 배포 가능한 결과물이 되게 하고, 실제 배포는 버튼 하나로.',
          '<b>Continuous Deployment</b>: 그 버튼마저 없애 검사를 통과하면 자동으로 운영에 나감. 이 챕터의 나머지 레슨이 이 길을 이어 갑니다.',
        ] },
      ],
    },
    {
      key: '트리거', kind: 'concept', title: 'on: 워크플로를 깨우는 이벤트',
      body: [
        '<code>on</code>은 워크플로를 <b>언제</b> 돌릴지 정합니다. <code>push</code>와 <code>pull_request</code>가 기본이고, <code>schedule</code>(cron)은 야간 검사에, <code>workflow_dispatch</code>는 버튼으로 손수 돌릴 때 씁니다.',
        '<code>concurrency</code>는 같은 브랜치에 새 push가 오면 <b>앞선 실행을 취소</b>합니다. 어차피 버려질 결과를 기다리느라 러너를 쓰지 않게요.',
      ],
      callout: { type: 'warn', text: '<code>schedule</code>의 cron은 <b>UTC</b> 기준입니다. <code>0 18 * * *</code>은 한국 시각 새벽 3시예요.' },
      hide: ['devB', 'team'],
      show: ['cron'],
      code: { ref: 'on', hl: [2, 3, 4, 5, 7, 8, 10, 11, 12] },
      tags: [{ on: 'repo', text: 'push · PR', tone: 'accent', pos: 'bottom' }, { on: 'cron', text: '매일 03:00 KST' }],
      flows: [
        { path: ['devA', 'repo'], kind: 'build' },
        { path: ['cron', 'repo'], kind: 'ctrl', delay: 0.6 },
        { path: ['repo', 'runner'], kind: 'ctrl', delay: 1.2 },
      ],
      more: [
        { title: '동작 원리', body: [
          '<code>push</code>는 올라온 커밋 그 자체를 검사합니다. <code>pull_request</code>는 다릅니다. GitHub이 PR 브랜치와 대상 브랜치를 <b>미리 합친 가상 머지 커밋</b>(<code>refs/pull/N/merge</code>)을 만들어 그것을 검사해요. 그래서 "합쳤을 때도 되는가"를 머지 전에 알 수 있습니다.',
          '<code>schedule</code>은 기본 브랜치에서만 돌고, 사용량이 몰리는 시각에는 몇 분씩 늦게 시작될 수 있습니다. 공개 저장소는 오랫동안 활동이 없으면 예약 실행이 자동으로 꺼지기도 합니다.',
        ] },
        { title: '설정 예시', body: ['<code>workflow_dispatch</code>에 입력값을 두면 Actions 화면이나 CLI에서 값을 골라 돌릴 수 있어요.'], code: { title: 'ci.yml', lang: 'yaml', text: "on:\n  workflow_dispatch:\n    inputs:\n      suite:\n        type: choice\n        options: [unit, e2e]\n        default: unit\n\n# $ gh workflow run ci.yml -f suite=e2e" } },
        { title: '흔한 실수', list: [
          '<code>paths-ignore</code>로 문서 PR에서 워크플로를 건너뛰면, 그 체크를 필수로 지정한 브랜치 보호가 영원히 기다립니다(13단계 사례).',
          '<code>pull_request_target</code>은 대상 브랜치 기준으로 <b>시크릿을 가진 채</b> 돕니다. 여기서 PR의 코드를 체크아웃해 실행하면 외부인이 시크릿을 빼 갈 수 있어요.',
          'concurrency 그룹을 너무 넓게 잡으면(예: 브랜치 구분 없이 <code>ci</code>) 다른 사람의 실행까지 취소됩니다.',
        ] },
      ],
    },
    {
      key: 'job · 러너', kind: 'concept', title: 'job은 각자 다른 러너에서 동시에',
      body: [
        '<code>jobs</code> 아래 job마다 <b>별도의 러너</b>가 붙어 기본으로 <b>동시에</b> 돕니다. 린트와 테스트를 따로 두면 둘이 나란히 돌아 전체 시간이 줄어요.',
        '순서가 필요하면 <code>needs</code>로 잇습니다. <code>build</code>는 lint와 test가 모두 성공해야 시작하고, 하나라도 실패하면 건너뜁니다. job끼리는 디스크를 공유하지 않아, 결과물은 <b>아티팩트</b>로 올려 넘깁니다.',
      ],
      callout: { type: 'tip', text: '<code>runs-on</code>은 러너를 고르는 라벨입니다. GitHub 호스트 러너(<code>ubuntu-latest</code> 등) 대신 내 VM에 <b>self-hosted 러너</b>를 둘 수도 있어요.' },
      hide: ['devA', 'cron', 'runner'],
      show: ['jobL', 'jobT', 'jobB'],
      code: { ref: 'jobs', hl: [2, 7, 12, 13, 17, 18, 19, 20] },
      tags: [{ on: 'jobB', text: 'needs: lint, test', tone: 'accent', pos: 'bottom' }],
      flows: [
        { path: ['repo', 'jobL'], kind: 'ctrl' },
        { path: ['repo', 'jobT'], kind: 'ctrl' },
        { path: ['jobL', 'jobB'], kind: 'build', delay: 1.4 },
        { path: ['jobT', 'jobB'], kind: 'build', delay: 1.4 },
      ],
      metrics: { fb: ['5분', 'ok'], pipe: '5분' },
      changes: [['+', 'job 3개로 분리'], ['~', '직렬 8분 → 병렬 5분']],
      more: [
        { title: '동작 원리', body: [
          '<code>needs</code>는 job 사이의 <b>방향 그래프</b>를 만듭니다. 앞 job이 실패하면 뒤 job은 <code>skipped</code>가 되고, 실패해도 돌아야 하는 정리 job에는 <code>if: always()</code>를 붙입니다.',
          'job 사이에 작은 값(버전 문자열 등)은 <code>outputs</code>로, 파일은 <code>upload-artifact</code> → <code>download-artifact</code>로 넘깁니다. 아티팩트는 기본으로 일정 기간(보통 90일) 보관되고 Actions 화면에서 내려받을 수도 있어요.',
        ] },
        { title: '러너 고르기', rows: [
          ['GitHub 호스트', '관리 불필요 · job마다 새 VM', 'ok'],
          ['더 큰 호스트 러너', '코어·메모리 큰 유료 옵션', 'info'],
          ['self-hosted', '사내망 접근 · 내가 패치·보안', 'warn'],
          ['쿠버네티스 위 러너', 'Pod로 러너를 늘렸다 줄임', 'info'],
        ] },
        { title: '흔한 실수', list: [
          '<b>공개 저장소에 self-hosted 러너</b>: 누구나 PR로 그 머신에서 코드를 돌릴 수 있습니다. 공개 저장소는 호스트 러너를 쓰세요.',
          '재사용되는 self-hosted 러너는 이전 job의 파일·도커 이미지가 남습니다. 가능하면 job마다 새로 뜨는(ephemeral) 방식으로.',
          'job 제한 시간 기본값은 6시간입니다. 멈춘 테스트가 러너를 붙잡지 않게 <code>timeout-minutes</code>를 job마다 짧게 주세요.',
        ] },
      ],
    },
    {
      key: '매트릭스', kind: 'concept', title: '매트릭스: 한 job을 여러 조합으로',
      body: [
        '라이브러리가 Node 20·22·24를 모두 지원해야 한다면 job을 세 번 쓸 필요가 없습니다. <code>strategy.matrix</code>에 값 목록을 주면 GitHub이 <b>조합마다 job을 하나씩</b> 펼쳐 동시에 돌립니다.',
        '값은 <code>matrix.node</code>처럼 꺼내 씁니다. 목록이 둘이면 곱만큼(OS 2 × Node 3 = 6개) 늘어나요.',
      ],
      callout: { type: 'warn', text: '기본값 <code>fail-fast: true</code>는 하나가 실패하면 <b>나머지를 취소</b>합니다. 어느 버전에서만 깨지는지 다 보고 싶다면 <code>false</code>로 둡니다.' },
      hide: ['e_lb', 'e_tb'],
      show: ['e_rb'],
      set: {
        jobL: { label: 'test', sub: 'node 20', icon: 'flask', color: 'teal' },
        jobT: { sub: 'node 22' },
        jobB: { at: [4.0, -2.8], label: 'test', sub: 'node 24', icon: 'flask', color: 'teal' },
      },
      code: { ref: 'matrix', hl: [3, 4, 5, 6, 11] },
      tags: [{ on: 'repo', text: '1 job → 3 job', tone: 'accent' }],
      flows: [
        { path: ['repo', 'jobL'], kind: 'ctrl' },
        { path: ['repo', 'jobT'], kind: 'ctrl', delay: 0.2 },
        { path: ['repo', 'jobB'], kind: 'ctrl', delay: 0.4 },
        { path: ['jobB', 'repo'], kind: 'bad', delay: 1.8 },
      ],
      more: [
        { title: '설정 예시', body: ['<code>exclude</code>로 의미 없는 조합을 빼고, <code>include</code>로 특정 조합에만 값을 더합니다.'], code: { title: 'ci.yml', lang: 'yaml', text: "strategy:\n  fail-fast: false\n  max-parallel: 4\n  matrix:\n    os: [ubuntu-latest, windows-latest]\n    node: [20, 22, 24]\n    exclude:\n      - os: windows-latest\n        node: 20\n    include:\n      - os: ubuntu-latest\n        node: 24\n        coverage: true\nruns-on: ${{ matrix.os }}" } },
        { title: '출력 읽기', body: [
          'PR 화면에는 조합마다 체크가 따로 붙고, 이름은 <code>test (ubuntu-latest, 22)</code>처럼 job 이름 뒤에 값이 괄호로 붙습니다. 브랜치 보호에서 필수 체크를 고를 때 이 이름을 그대로 써야 해서, 매트릭스 값을 바꾸면 필수 체크 목록도 같이 손봐야 합니다.',
        ] },
        { title: '실무 팁', list: [
          '조합 수만큼 러너 시간이 곱해집니다. Windows·macOS 호스트 러너는 리눅스보다 비싸게 계산되니 꼭 필요한 조합만.',
          '느린 테스트를 <b>샤드</b>로 나눌 때도 매트릭스를 씁니다: <code>shard: [1, 2, 3, 4]</code>를 주고 테스트 러너에 "4개 중 n번째"를 넘기면 시간이 거의 4분의 1로 줄어요.',
          '한 워크플로 실행에서 매트릭스가 만들 수 있는 job 수에는 상한(256개)이 있습니다.',
        ] },
      ],
    },
    {
      key: 'steps', kind: 'concept', title: '싼 검사부터: 린트 · 테스트 · 빌드',
      body: [
        '<code>steps</code>는 한 러너 안에서 위에서 아래로 실행되고, 하나라도 실패하면 job이 <b>거기서 멈춥니다</b>. <code>uses</code>는 남이 만들어 둔 액션을, <code>run</code>은 셸 명령을 실행해요.',
        '<b>린트</b>는 문법과 스타일을 몇 초 만에 검사하고, <b>테스트</b>는 동작을 확인하고, <b>빌드</b>는 배포할 결과물이 실제로 만들어지는지 봅니다. 빨리 끝나고 자주 걸리는 것을 앞에 둡니다.',
      ],
      callout: { type: 'key', text: '<b>fail fast</b>: 10초면 잡힐 오타 때문에 몇 분짜리 테스트가 끝나길 기다릴 이유가 없습니다.' },
      hide: ['jobL', 'jobT', 'jobB'],
      show: ['lint', 'test', 'build'],
      set: {
        jobL: { label: 'lint', sub: 'job', icon: 'search', color: 'yellow' },
        jobT: { sub: 'job' },
        jobB: { at: [6.4, 0.8], label: 'build', sub: 'job', icon: 'hammer', color: 'blue' },
      },
      code: { ref: 'ci', hl: [10, 11, 16, 17, 18, 19] },
      tags: [{ on: 'lint', text: '10초' }, { on: 'test', text: '2분' }, { on: 'build', text: '1분' }],
      flows: [{ path: ['repo', 'lint', 'test', 'build'], kind: 'build', n: 2, gap: 0.8 }],
      more: [
        { title: '동작 원리', body: [
          '같은 job의 step들은 <b>같은 러너, 같은 작업 폴더</b>를 씁니다. 앞 step이 만든 파일을 뒤 step이 그대로 읽을 수 있어요. 반대로 step마다 셸은 새로 뜨므로 <code>export</code>한 변수는 다음 step에 남지 않습니다. 넘기려면 <code>$GITHUB_ENV</code>나 <code>$GITHUB_OUTPUT</code> 파일에 써야 해요.',
          'step은 명령의 종료 코드가 0이 아니면 실패입니다. 실패 뒤에도 돌아야 하는 step(테스트 리포트 업로드 등)에는 <code>if: failure()</code>나 <code>if: always()</code>를 붙입니다.',
        ] },
        { title: '출력 읽기', code: { title: 'Actions 로그', lang: 'text', text: 'Run npm run lint\n> shop@1.4.0 lint\n> eslint src\n\n/src/cart/total.js\n  12:7  error  \'tax\' is assigned a value but never used\n\n✖ 1 problem (1 error, 0 warnings)\nError: Process completed with exit code 1.' }, body: ['마지막 줄의 <code>exit code 1</code>이 이 step을 실패로 만들었고, 그 아래 test·build step은 회색(건너뜀)으로 남습니다. 원인은 그 위, 도구가 찍은 첫 오류 줄에 있어요.'] },
        { title: '흔한 실수', list: [
          '<code>uses: some/action@v1</code>처럼 태그로 참조하면, 태그가 다른 커밋으로 옮겨질 때 코드가 몰래 바뀝니다. 2025년에 널리 쓰이던 서드파티 액션의 태그가 악성 커밋으로 바뀌어 여러 저장소의 시크릿이 로그로 새는 사고가 있었어요. 서드파티 액션은 <b>전체 커밋 SHA</b>로 고정하고 Dependabot으로 올리세요.',
          '<code>npm install</code> 대신 <code>npm ci</code>: lock 파일과 정확히 같은 버전을 깔고, lock과 <code>package.json</code>이 어긋나면 실패해 줍니다.',
        ] },
      ],
    },
    {
      key: '캐시', kind: 'concept', title: '캐시: 같은 것을 두 번 받지 않기',
      body: [
        '러너는 매번 빈 VM이라, 그대로 두면 <code>npm ci</code>가 실행할 때마다 의존성 수백 개를 처음부터 내려받습니다. 파이프라인 시간의 큰 몫이 여기서 나가요.',
        '<code>cache: npm</code>은 내려받은 패키지를 저장해 두었다가, <b>lock 파일이 그대로면</b> 다음 실행에서 꺼내 씁니다. lock 파일이 바뀌면 키가 달라져 새로 받습니다.',
      ],
      callout: { type: 'warn', text: '캐시는 <b>속도</b>를 위한 것이지 정확성을 위한 것이 아닙니다. 캐시가 비어 있어도 같은 결과가 나와야 하고, 그러려면 lock 파일을 꼭 커밋해야 해요.' },
      hide: ['lint', 'test', 'build'],
      show: ['runner', 'registry', 'cache'],
      code: { ref: 'ci', hl: [12, 13, 14, 15, 16] },
      tags: [{ on: 'registry', text: '매번 전부 받기', tone: 'warn' }, { on: 'cache', text: '키 = lock 파일', tone: 'ok', icon: 'key' }],
      flows: [
        { path: ['registry', 'runner'], kind: 'data', n: 5, gap: 0.3, dur: 2.2 },
        { path: ['cache', 'runner'], kind: 'data', n: 2, gap: 0.2, dur: 0.8, delay: 0.4 },
      ],
      metrics: { fb: ['3분', 'ok'], pipe: ['3분', 'ok'] },
      changes: [['+', '의존성 캐시'], ['~', 'CI 한 번에 5분 → 3분']],
      more: [
        { title: '동작 원리', body: [
          'job이 시작할 때 <b>key</b>가 정확히 같은 캐시를 찾고, 없으면 <code>restore-keys</code>의 접두어로 가장 최근 캐시를 꺼냅니다(부분 적중). job이 성공하고 정확한 키가 없었을 때만 끝에 새 캐시를 저장해요.',
          '캐시는 브랜치 범위가 있습니다. PR 브랜치는 자기 브랜치와 <b>기본 브랜치</b>의 캐시는 읽지만 옆 브랜치 것은 못 읽어요. 저장소마다 용량 한도가 있고(기본 약 10GB), 오래 쓰지 않은 캐시는 일주일쯤 지나면 지워집니다.',
        ] },
        { title: '설정 예시', body: ['setup 액션이 지원하지 않는 도구는 <code>actions/cache</code>로 직접 키를 만듭니다.'], code: { title: 'ci.yml', lang: 'yaml', text: "- uses: actions/cache@v4\n  with:\n    path: ~/.cache/pip\n    key: pip-${{ runner.os }}-${{ hashFiles('**/requirements.txt') }}\n    restore-keys: |\n      pip-${{ runner.os }}-" } },
        { title: '캐시 vs 아티팩트', rows: [
          ['캐시', '다음 실행을 빠르게 · 없어도 됨', 'info'],
          ['아티팩트', '이번 실행의 결과물 · 꼭 있어야 함', 'accent'],
          ['캐시 예', '~/.npm, pip, Gradle 의존성', 'mute'],
          ['아티팩트 예', 'dist/, 테스트 리포트, 커버리지', 'mute'],
        ] },
        { title: '흔한 실수', list: [
          '<code>node_modules</code>를 통째로 캐시하고 키에 OS·Node 버전을 안 넣으면, 다른 환경에서 빌드된 네이티브 모듈이 섞여 이상한 오류가 납니다. 기본은 <code>~/.npm</code> 같은 다운로드 캐시를 두는 것입니다.',
          '빌드 결과물을 캐시로 넘기면 비어 있을 때 다음 job이 깨집니다. 반드시 있어야 하는 파일은 아티팩트로.',
        ] },
      ],
    },
    {
      key: '시크릿 · 환경', kind: 'concept', title: '시크릿과 환경: 열쇠를 누구에게 줄까',
      body: [
        '배포 토큰 같은 비밀값은 YAML에 쓰지 않고 저장소의 <b>Secrets</b>에 넣어 <code>secrets.NAME</code>으로 꺼냅니다. 로그에 찍히면 <code>***</code>로 가려져요. 바깥 <b>fork에서 온 PR</b>에는 시크릿이 아예 넘어가지 않습니다.',
        '<b>환경</b>(environment)은 <code>production</code> 같은 배포 대상입니다. 그 환경 전용 시크릿을 두고, <b>승인자</b>가 허락해야 job이 시작되게 막을 수 있어요.',
      ],
      callout: { type: 'tip', text: '클라우드 키를 시크릿에 오래 넣어 두는 대신 <b>OIDC</b>로 잠깐 쓰는 자격 증명을 받는 방법은 다음 레슨에서 봅니다.' },
      hide: ['registry', 'cache'],
      show: ['devA', 'sec', 'env'],
      tags: [
        { on: 'devA', text: 'fork PR', tone: 'warn', icon: 'git-fork' },
        { on: 'sec', text: '로그엔 ***', icon: 'eye' },
        { on: 'env', text: '승인 1명 필요', tone: 'warn', icon: 'user-check', pos: 'bottom' },
      ],
      flows: [
        { path: ['devA', 'repo', 'runner'], kind: 'build' },
        { path: ['sec', 'runner'], kind: 'bad', delay: 1.4 },
        { path: ['sec', 'runner'], kind: 'data', delay: 3 },
        { path: ['runner', 'env'], kind: 'ctrl', delay: 3.8 },
      ],
      changes: [['+', '저장소·환경 시크릿'], ['+', 'production 승인 규칙'], ['-', 'YAML 속 토큰']],
      more: [
        { title: '동작 원리', body: [
          '시크릿은 조직·저장소·환경 세 단계에 둘 수 있고, 같은 이름이면 더 좁은 쪽(환경)이 이깁니다. 러너에는 job이 그 시크릿을 참조할 때만 전달되고, 값이 로그에 그대로 나오면 가려집니다. 하지만 base64로 바꾸거나 한 글자씩 찍으면 가림이 통하지 않으니 "가려지니까 찍어도 된다"는 생각은 금물입니다.',
          '모든 job에는 <code>GITHUB_TOKEN</code>이 자동으로 주어집니다. 그 저장소 안에서만 쓸 수 있고 job이 끝나면 만료돼요. 권한은 <code>permissions</code>로 필요한 만큼만 줍니다.',
        ] },
        { title: '설정 예시', code: { title: 'deploy.yml', lang: 'yaml', text: "permissions:\n  contents: read\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    environment: production\n    steps:\n      - uses: actions/checkout@v4\n      - run: ./deploy.sh\n        env:\n          API_TOKEN: ${{ secrets.DEPLOY_TOKEN }}" }, body: ['<code>environment: production</code>이 붙은 job은 그 환경의 보호 규칙(승인자, 대기 시간, 허용 브랜치)을 통과해야 시작하고, 그 환경의 시크릿만 받습니다.'] },
        { title: '흔한 실수', list: [
          '워크플로 최상단 권한을 넓게(쓰기 전부) 두기: 액션 하나가 오염되면 저장소에 push까지 할 수 있습니다. 기본은 읽기, job별로 필요한 것만 더하세요.',
          'fork PR에서 시크릿이 없어 실패하는 테스트를 <code>pull_request_target</code>으로 "고치기": PR 코드를 시크릿과 함께 실행하게 되어 훨씬 위험합니다.',
        ] },
      ],
    },
    {
      key: '브랜치 보호', kind: 'solution', title: 'PR 체크와 브랜치 보호',
      body: [
        'CI 결과는 <b>Pull Request</b>에 초록 체크나 빨간 ×로 붙습니다. 리뷰어는 "돌려는 보셨나요?"를 묻는 대신 코드 자체에 집중할 수 있어요.',
        '하지만 표시만으로는 빨간불에도 머지할 수 있습니다. <b>브랜치 보호 규칙</b>으로 <code>main</code>에 직접 push하는 길을 막고, <b>필수 상태 체크</b>가 통과해야만 머지 버튼이 켜지게 합니다.',
      ],
      callout: { type: 'key', text: '강제하지 않는 CI는 <b>권고</b>일 뿐입니다. 깨진 코드가 main에 못 들어오는 것은 규칙이 막아 주기 때문이에요.' },
      hide: ['sec', 'env', 'devA'],
      show: ['devB'],
      set: { repo: { badge: '보호됨', tone: 'ok' } },
      panel: { title: 'PR #42 · 머지 조건', icon: 'git-pr', rows: [['lint', '통과', 'ok'], ['test (20) · (22) · (24)', '통과', 'ok'], ['build', '통과', 'ok'], ['리뷰 승인 1명', '대기 중', 'warn']] },
      tags: [{ on: 'devB', text: '직접 push 거부 → PR로', tone: 'warn', icon: 'git-pr' }, { on: 'runner', text: '체크 통과', tone: 'ok', icon: 'check', pos: 'bottom' }],
      flows: [
        { path: ['devB', 'repo'], kind: 'bad' },
        { path: ['devB', 'repo'], kind: 'build', delay: 1.2 },
        { path: ['repo', 'runner'], kind: 'ctrl', delay: 2.2 },
        { path: ['runner', 'repo'], kind: 'res', delay: 3.2 },
      ],
      metrics: { main: ['항상 초록', 'ok'] },
      changes: [['+', 'main 브랜치 보호'], ['+', '필수 체크: lint · test · build'], ['-', 'main에 직접 push']],
      more: [
        { title: '자주 켜는 규칙', list: [
          '<b>PR 필수 + 승인 n명</b>, 새 커밋이 오면 기존 승인 무효화.',
          '<b>필수 상태 체크</b>와 "머지 전 최신 main 반영 필수": 오래된 base에서만 초록인 PR을 막습니다.',
          '<b>강제 push·삭제 금지</b>, 대화(리뷰 코멘트) 해결 필수.',
          '<b>CODEOWNERS</b>: <code>infra/</code>를 고치면 인프라 팀 승인이 꼭 필요하게.',
          '관리자도 예외 없이: 우회 권한은 소수에게만, 쓰면 기록이 남게. 요즘은 같은 규칙을 여러 브랜치에 거는 <b>ruleset</b>으로 관리하기도 합니다.',
        ] },
        { title: '머지 큐', body: [
          'PR이 많은 저장소에서 "최신 main 반영 필수"를 켜면, 한 PR이 머지될 때마다 나머지가 모두 다시 rebase하고 CI를 기다리는 줄서기가 생깁니다. <b>머지 큐</b>(merge queue)는 대기 중인 PR들을 main 위에 차례로 쌓은 임시 브랜치를 만들어 한꺼번에 검사하고, 통과하면 순서대로 합쳐 줍니다. 쓰려면 워크플로의 <code>on</code>에 <code>merge_group</code> 이벤트를 추가해야 필수 체크가 큐에서도 돕니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ git push origin main\nremote: error: GH006: Protected branch update failed\n  for refs/heads/main.\nremote: - Changes must be made through a pull request.\n$ gh pr create --fill\n$ gh pr checks\nbuild        pass  1m02s\nlint         pass  14s\ntest (22)    pass  1m48s' } },
      ],
    },
    {
      key: '테스트 피라미드', kind: 'concept', title: '테스트 피라미드: 아래는 넓고 빠르게',
      body: [
        '테스트는 층마다 속도와 비용이 다릅니다. <b>단위 테스트</b>는 함수 하나를 밀리초에, <b>통합 테스트</b>는 실제 DB·큐와 함께 초 단위로, <b>E2E</b>는 브라우저로 사용자 흐름 전체를 분 단위로 확인해요.',
        '<b>테스트 피라미드</b>는 아래층을 많이, 위층을 적게 두라는 원칙입니다. 느리고 잘 흔들리는 E2E는 핵심 흐름 몇 개만 남겨요.',
      ],
      callout: { type: 'tip', text: 'PR에서는 단위·통합 테스트를, 전체 E2E는 main 머지 뒤나 야간 <code>schedule</code>로 돌리는 식으로 <b>층마다 돌릴 시점</b>을 나눕니다.' },
      hide: ['devB', 'repo'],
      show: ['pyU', 'pyI', 'pyE'],
      set: { repo: { badge: null } },
      tags: [
        { on: 'pyE', text: 'E2E · 10개 · 8분', tone: 'bad', pos: 'top' },
        { on: 'pyI', text: '통합 · 150개 · 1분', tone: 'warn', pos: 'right' },
        { on: 'pyU', text: '단위 · 2,000개 · 40초', tone: 'ok', pos: 'bottom' },
      ],
      flows: [{ path: ['runner', 'pyU'], kind: 'ctrl', n: 3, gap: 0.5 }],
      more: [
        { title: '층별로', rows: [
          ['단위', '함수·클래스 · ms · 외부 의존 없음', 'ok'],
          ['통합', 'DB·큐·HTTP 실제로 · 초', 'warn'],
          ['E2E', '브라우저로 전체 흐름 · 분', 'bad'],
          ['계약 테스트', '서비스 사이 API 약속만 검사', 'info'],
        ] },
        { title: '설정 예시', body: ['통합 테스트에 쓸 DB는 <code>services</code>로 job 옆에 컨테이너로 띄웁니다. job이 끝나면 같이 사라져요.'], code: { title: 'ci.yml', lang: 'yaml', text: "integration:\n  runs-on: ubuntu-latest\n  services:\n    db:\n      image: postgres:16\n      env:\n        POSTGRES_PASSWORD: test\n      ports: ['5432:5432']\n      options: >-\n        --health-cmd pg_isready\n        --health-interval 5s\n  steps:\n    - uses: actions/checkout@v4\n    - run: npm ci && npm run test:int\n      env:\n        DATABASE_URL: postgres://postgres:test@localhost:5432/postgres" } },
        { title: '흔한 실수', list: [
          '<b>아이스크림 콘</b>: E2E가 대부분이고 단위 테스트가 거의 없는 거꾸로 된 모양. 느리고, 실패해도 어디가 원인인지 알기 어렵습니다.',
          '커버리지 숫자만 쫓기: 단언(assert) 없이 코드를 지나가기만 하는 테스트도 커버리지는 올라갑니다.',
        ] },
      ],
    },
    {
      key: 'flaky', kind: 'case', title: '사례: 아무도 믿지 않는 빨간불',
      body: [
        '테스트가 늘면서 파이프라인이 25분으로 불었고, 몇몇 테스트는 코드가 멀쩡해도 가끔 실패합니다(<b>flaky test</b>). 팀은 빨간불을 보면 원인을 찾는 대신 <b>"다시 실행"</b>부터 누르게 됐어요.',
        '그러다 진짜 버그가 낸 빨간불도 재실행 끝에 우연히 통과해 main에 들어갔습니다. 느리고 못 믿을 CI는 사람들에게 <b>우회하는 법</b>을 가르칩니다.',
      ],
      callout: { type: 'tip', text: '불안정한 테스트는 바로 고치거나 격리하세요. job을 <b>병렬로 쪼개고 캐시</b>를 써서, 흔히 10분 안쪽을 목표로 잡습니다.' },
      hide: ['pyU', 'pyI', 'pyE'],
      show: ['repo', 'devA'],
      set: { runner: { state: 'hot', badge: '25분', tone: 'bad' } },
      tags: [{ on: 'devA', text: '"다시 실행" 3번째', tone: 'warn', icon: 'repeat' }],
      flows: [
        { path: ['repo', 'runner'], kind: 'ctrl', n: 3, gap: 0.9 },
        { path: ['runner', 'repo'], kind: 'bad', n: 2, gap: 0.9, delay: 1 },
        { path: ['runner', 'repo'], kind: 'res', delay: 2.8 },
      ],
      metrics: { fb: ['25분 + 재실행', 'bad'], main: ['가끔 깨짐', 'warn'], pipe: ['25분', 'bad'] },
      changes: [['~', 'CI 한 번에 3분 → 25분'], ['-', '빨간불에 대한 신뢰']],
      more: [
        { title: 'flaky의 흔한 원인', list: [
          '<b>고정 대기</b>: <code>sleep(2000)</code> 뒤 결과를 확인. 러너가 느린 날엔 실패합니다. 조건이 될 때까지 기다리는 방식으로.',
          '<b>순서·공유 상태</b>: 앞 테스트가 남긴 DB 행이나 전역 변수에 기댐. 순서를 섞어 돌려 보면 드러납니다.',
          '<b>시간·타임존</b>: 자정, 월말, 러너의 UTC. 시계를 주입해 고정하세요.',
          '<b>외부 네트워크</b>: 실제 결제·지도 API 호출. 테스트에선 가짜 서버로.',
        ] },
        { title: '대응 순서', body: [
          '① 재실행 기록에서 같은 테스트가 코드 변경 없이 성공과 실패를 오간 것을 찾아 <b>flaky로 표시</b>합니다. ② 필수 체크에서 빼서 <b>격리</b>(quarantine) 목록으로 옮기되 계속 돌려 기록은 남깁니다. ③ 담당자와 기한을 붙여 고친 뒤 다시 넣어요. 격리 목록이 쌓이기만 하면 결국 그 기능은 아무도 검사하지 않는 셈이 됩니다.',
          '자동 재시도(실패하면 1–2번 더)는 당장의 소음을 줄여 주지만, 재시도로 통과한 횟수를 따로 집계하지 않으면 문제를 가릴 뿐입니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '# 실패한 job만 다시 돌리기\n$ gh run rerun 9876543101 --failed\n# 의심 테스트를 로컬에서 30번 반복\n$ for i in $(seq 30); do\n    npx jest cart.spec.js --silent || echo FAIL $i\n  done\nFAIL 7\nFAIL 22' } },
      ],
    },
    {
      key: '대기 체크', kind: 'case', title: '사례: 영원히 대기 중인 필수 체크',
      body: [
        '문서만 고친 PR의 머지 버튼이 꺼진 채 하루가 지났습니다. 체크 목록에는 <code>test</code> 옆에 <b>"Expected — Waiting for status to be reported"</b>가 떠 있어요.',
        '원인은 4단계의 <code>paths-ignore: docs/**</code>였습니다. 워크플로가 아예 <b>시작되지 않았으니</b> 결과도 오지 않고, 필수 체크는 그 결과를 끝없이 기다립니다.',
      ],
      callout: { type: 'key', text: '필수 체크는 "실패하지 않음"이 아니라 <b>"성공이 보고됨"</b>을 기다립니다. 돌지 않은 체크는 영원히 대기예요.' },
      hide: ['devA'],
      show: ['devB'],
      set: { runner: { state: 'dim', badge: '실행 안 됨', tone: 'mute' }, repo: { badge: '머지 불가', tone: 'warn' } },
      panel: { title: 'PR #57 · docs: 설치 안내 수정', icon: 'git-pr', rows: [['lint', 'Expected — 대기', 'warn'], ['test (22)', 'Expected — 대기', 'warn'], ['build', 'Expected — 대기', 'warn'], ['리뷰 승인 1명', '승인됨', 'ok']] },
      tags: [{ on: 'runner', text: 'paths-ignore로 건너뜀', tone: 'mute', pos: 'bottom' }],
      flows: [
        { path: ['devB', 'repo'], kind: 'build' },
        { path: ['repo', 'runner'], kind: 'bad', delay: 1.2 },
      ],
      metrics: { fb: ['응답 없음', 'warn'], main: ['초록 (머지 막힘)', 'warn'], pipe: '6분' },
      more: [
        { title: '같은 증상, 다른 원인', list: [
          '워크플로 단위 <code>paths</code>·<code>paths-ignore</code>·<code>branches</code> 필터로 아예 돌지 않음.',
          'job 이름을 바꿨거나 매트릭스 값을 바꿔 체크 이름이 <code>test (22)</code> → <code>test (24)</code>로 달라짐. 옛 이름을 계속 기다립니다.',
          '워크플로 파일에 YAML 문법 오류가 있어 run 자체가 만들어지지 않음(Actions 탭에 오류만 남음).',
        ] },
        { title: '해결: 모으는 job 하나만 필수로', body: [
          '필터는 워크플로가 아니라 job 안으로 옮기고(바뀐 경로를 확인해 <code>if</code>로 건너뜀), 마지막에 결과를 모으는 job을 두어 그것 <b>하나만</b> 필수로 지정합니다. <code>if</code>로 건너뛴 job은 성공과 같이 취급되어 대기에 걸리지 않고, 매트릭스나 job 이름이 바뀌어도 필수 목록은 그대로예요.',
        ], code: { title: 'ci.yml', lang: 'yaml', text: "  ci-ok:\n    if: always()\n    needs: [lint, test, build]\n    runs-on: ubuntu-latest\n    steps:\n      - name: 하나라도 실패·취소면 실패\n        if: >-\n          contains(needs.*.result, 'failure') ||\n          contains(needs.*.result, 'cancelled')\n        run: exit 1" } },
        { title: '흔한 실수', body: ['급하다고 관리자 권한으로 보호 규칙을 우회해 머지하면, 그 길이 습관이 됩니다. 우회는 기록이 남는 비상 수단으로만 두고, 막힌 원인(체크 이름·필터)을 고치세요.'] },
      ],
    },
    {
      key: '도구 비교', kind: 'compare', title: 'CI 도구: 문법은 달라도 뼈대는 같습니다',
      body: [
        '<b>GitHub Actions</b>와 <b>GitLab CI</b>는 저장소에 붙어 있어 시작이 쉽습니다. <b>Jenkins</b>는 직접 설치해 운영하는 오픈 소스로, 자유도가 큰 만큼 서버와 플러그인 관리가 내 일이 됩니다.',
        '클라우드 사업자도 자기 도구를 갖고 있고, 그 클라우드의 IAM·네트워크와 잘 맞물리는 것이 장점입니다. 어느 것이든 <b>이벤트 → 러너 → 단계 → 결과</b>라는 뼈대는 같아요.',
      ],
      callout: { type: 'cloud', text: '고를 때는 "코드가 어디 있는가"와 "러너가 어디에 닿아야 하는가"를 봅니다. 멀티클라우드라면 한 사업자에 묶이지 않는 도구가 편할 때가 많습니다.' },
      hide: ['devB', 'repo', 'runner'],
      show: ['gha', 'gl', 'jk'],
      set: { runner: { state: null, badge: null }, repo: { badge: null } },
      panel: { title: '클라우드 사업자의 CI/CD', icon: 'cloud', rows: [['AWS', 'CodePipeline · CodeBuild', 'aws'], ['Azure', 'Azure Pipelines', 'azure'], ['GCP', 'Cloud Build', 'gcp'], ['NCP', 'SourcePipeline · SourceBuild', 'ncp']] },
      tags: [{ on: 'gha', text: '저장소 내장', pos: 'bottom' }, { on: 'gl', text: '.gitlab-ci.yml', pos: 'bottom' }, { on: 'jk', text: '직접 설치 · 운영', pos: 'bottom' }],
      metrics: { fb: '-', main: '-', pipe: '-' },
      more: [
        { title: '파일과 용어', rows: [
          ['GitHub Actions', '.github/workflows/*.yml · job · runner', 'mute'],
          ['GitLab CI', '.gitlab-ci.yml · stage · job · runner', 'mute'],
          ['Jenkins', 'Jenkinsfile · stage · agent', 'mute'],
          ['AWS CodeBuild', 'buildspec.yml · phases', 'aws'],
          ['Azure Pipelines', 'azure-pipelines.yml · stage · agent', 'azure'],
          ['GCP Cloud Build', 'cloudbuild.yaml · steps', 'gcp'],
        ] },
        { title: '고르는 기준', list: [
          '<b>코드 위치</b>: GitHub이면 Actions, GitLab이면 GitLab CI가 PR·체크·권한과 가장 매끄럽게 붙습니다.',
          '<b>러너가 닿아야 할 곳</b>: 사내망 DB나 폐쇄망 클러스터에 접근해야 하면 self-hosted 러너나 그 클라우드 안의 빌드 서비스가 필요합니다.',
          '<b>자격 증명</b>: 클라우드 자체 빌드 서비스는 그 클라우드의 IAM 역할을 바로 씁니다. 외부 CI는 OIDC 연동을 따로 설정해요(다음 레슨).',
          '<b>운영 부담</b>: Jenkins는 서버·플러그인 업그레이드와 보안 패치가 모두 내 일입니다.',
        ] },
        { title: '실무 팁', body: ['멀티클라우드 팀은 흔히 <b>CI는 코드 저장소 쪽 도구 하나</b>로 통일하고, 클라우드마다 다른 부분(레지스트리 주소, 자격 증명, 배포 대상)만 job이나 환경 변수로 갈라 둡니다. 파이프라인 문법을 클라우드마다 따로 익힐 필요가 줄어들어요.'] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 작게, 자주, 자동으로',
      body: [
        'CI는 통합의 고통을 <b>잘게 쪼개 매일 치르는</b> 방법입니다. 이벤트가 워크플로를 깨우고, job은 러너에서 나란히, step은 싼 검사부터 돌며, 브랜치 보호가 그 결과를 강제해 <code>main</code>을 늘 배포 가능하게 지킵니다.',
        '파이프라인은 <b>빠르고 믿을 수 있어야</b> 의미가 있습니다. 다음 레슨에서는 검사를 통과한 커밋을 <b>컨테이너 이미지</b>로 만들어 스캔하고 레지스트리에 올리는 단계를 이어 붙입니다.',
      ],
      hide: ['gha', 'gl', 'jk'],
      show: ['devA', 'repo', 'runner'],
      set: { runner: { state: 'ok', badge: null }, repo: { badge: '보호됨', tone: 'ok' } },
      focus: ['repo', 'runner'],
      flows: [
        { path: ['devA', 'repo'], kind: 'build' },
        { path: ['repo', 'runner'], kind: 'ctrl', delay: 1 },
        { path: ['runner', 'repo'], kind: 'res', delay: 2 },
      ],
      metrics: { fb: ['6분', 'ok'], merge: ['하루 여러 번', 'ok'], main: ['항상 초록', 'ok'], pipe: ['6분', 'ok'] },
    },
  ],
  quiz: [
    {
      q: 'CI를 도입했는데도 2주짜리 기능 브랜치를 합칠 때마다 큰 충돌이 납니다. 가장 먼저 바꿔야 할 것은?',
      options: ['러너를 더 빠른 사양으로 올린다', '브랜치를 짧게 유지하고 작은 변경을 자주 main에 합친다', '테스트 개수를 줄여 파이프라인을 단축한다', '충돌이 나면 CI를 건너뛰고 머지할 수 있게 한다'],
      answer: 1, step: 1,
      why: 'CI의 절반은 도구가 아니라 습관입니다. 브랜치를 오래 묵히면 자동 검사가 있어도 통합은 여전히 한꺼번에 일어납니다. 러너 사양이나 테스트 수는 충돌의 크기와 무관합니다.',
    },
    {
      q: '오전에 main이 깨져 팀 전체가 최신 코드를 받으면 빌드가 안 됩니다. 원인 커밋은 찾았고 작성자는 오후 회의 중입니다. 가장 나은 조치는?',
      options: ['원인 커밋을 git revert로 되돌려 main을 먼저 초록으로 만든다', '작성자가 돌아올 때까지 모두 옛 커밋에서 작업한다', '깨진 테스트를 주석 처리해 빌드를 통과시킨다', '각자 로컬에서 임시 수정을 해 두고 나중에 맞춘다'],
      answer: 0, step: 2,
      why: '먼저 되돌리고 나중에 고치는 것이 팀 전체의 대기 비용을 가장 빨리 없앱니다. 테스트를 주석 처리하면 버그가 main에 남고, 각자 임시 수정은 또 다른 충돌을 만듭니다.',
    },
    {
      q: 'PR 브랜치에서는 CI가 초록이었는데, 머지 직후 main에서 빌드가 깨졌습니다. pull_request 이벤트의 CI가 원래 막아 줄 수 있었던 상황은?',
      options: ['러너 VM의 디스크가 가득 찬 경우', 'PR이 열린 뒤 main에 다른 변경이 들어와, 오래된 머지 결과로만 검사된 경우', '시크릿이 만료된 경우', 'schedule 트리거가 UTC로 돈 경우'],
      answer: 1, step: 4,
      why: 'pull_request는 PR과 대상 브랜치를 합친 가상 머지 커밋을 검사하지만, 그 뒤 main이 바뀌면 결과가 낡습니다. 그래서 "머지 전 최신 main 반영 필수"나 머지 큐를 씁니다. 디스크나 시크릿 문제는 PR에서도 똑같이 드러났을 것입니다.',
    },
    {
      q: '야간 E2E를 매일 오전 9시(KST)에 돌리려고 cron: "0 9 * * *"을 적었더니 오후 6시에 돕니다. 이유는?',
      options: ['러너 대기열이 9시간 밀려서', 'schedule은 기본 브랜치가 아닌 곳에서 돌아서', 'cron이 UTC 기준이라 한국 시각으로는 18시가 되어서', 'workflow_dispatch가 함께 있어서'],
      answer: 2, step: 4,
      why: 'GitHub Actions의 schedule은 UTC입니다. KST 9시는 UTC 0시이므로 "0 0 * * *"로 써야 합니다. 대기열 지연은 보통 몇 분 수준이지 9시간처럼 정확히 시차만큼 밀리지 않습니다.',
    },
    {
      q: 'lint와 test job을 따로 만들었더니 build job에서 dist 폴더가 없다며 배포 준비 단계가 실패합니다. dist는 test job에서 만들었습니다. 올바른 고침은?',
      options: ['test job에서 upload-artifact로 올리고 build job에서 download-artifact로 받는다', 'build job의 runs-on을 test와 같은 라벨로 맞춘다', 'needs를 빼서 두 job이 동시에 돌게 한다', 'dist를 캐시에 넣어 둔다'],
      answer: 0, step: 5,
      why: 'job마다 별도 러너라 디스크를 공유하지 않습니다. 같은 라벨이어도 다른 VM입니다. 반드시 있어야 하는 결과물은 아티팩트로 넘기고, 캐시는 없어도 되는 속도용이라 비어 있으면 다시 실패합니다.',
    },
    {
      q: '공개 오픈 소스 저장소의 CI가 느려 사무실에 남는 서버를 self-hosted 러너로 붙이려 합니다. 가장 큰 문제는?',
      options: ['self-hosted 러너는 매트릭스를 지원하지 않는다', '외부인이 PR로 그 서버에서 임의의 코드를 실행할 수 있다', 'self-hosted 러너에서는 캐시를 쓸 수 없다', 'GitHub이 self-hosted 러너 사용료를 더 비싸게 받는다'],
      answer: 1, step: 5,
      why: '공개 저장소에서는 누구나 PR을 열 수 있어, 그 워크플로가 사내 서버에서 돌면 사내망이 열립니다. 매트릭스와 캐시는 self-hosted에서도 됩니다. 공개 저장소는 호스트 러너가 기본입니다.',
    },
    {
      q: 'Node 20·22·24 매트릭스에서 20이 실패하자 22와 24가 "취소됨"으로 끝나, 다른 버전도 깨지는지 알 수 없습니다. 무엇을 바꿀까?',
      options: ['max-parallel을 1로 줄인다', 'Node 20을 매트릭스에서 뺀다', 'needs로 세 job을 순서대로 잇는다', 'strategy.fail-fast를 false로 둔다'],
      answer: 3, step: 6,
      why: 'fail-fast 기본값 true는 하나가 실패하면 나머지 조합을 취소합니다. false면 모두 끝까지 돌아 버전별 결과를 다 볼 수 있습니다. 순서대로 잇거나 병렬도를 줄이면 시간만 늘어납니다.',
    },
    {
      q: '서드파티 액션을 uses: some/deploy-action@v2로 쓰고 있습니다. 공급망 공격에 대비해 가장 효과적인 변경은?',
      options: ['@v2 대신 @main으로 최신을 따라간다', '액션을 전체 커밋 SHA로 고정하고 Dependabot으로 갱신한다', '액션이 찍는 로그를 끈다', 'continue-on-error: true를 붙인다'],
      answer: 1, step: 7,
      why: '태그와 브랜치는 다른 커밋으로 옮겨질 수 있어 몰래 바뀐 코드가 실행됩니다. 커밋 SHA는 바뀌지 않습니다. @main은 더 위험하고, 로그를 끄거나 실패를 무시하는 것은 공격을 막지 못합니다.',
    },
    {
      q: '캐시 키를 "npm-linux"로 고정해 두었더니, 의존성을 올린 뒤에도 옛 패키지가 복원되어 이상하게 동작합니다. 바른 키 설계는?',
      options: ['키에 lock 파일 해시를 넣어 lock이 바뀌면 새 캐시가 되게 한다', '캐시를 아예 끄고 매번 받는다', '키에 실행 시각을 넣어 매번 새로 만든다', 'restore-keys를 지우고 key만 둔다'],
      answer: 0, step: 8,
      why: 'lock 파일 해시를 키에 넣으면 의존성이 바뀔 때만 캐시가 갱신됩니다. 매번 새 키나 캐시 끄기는 속도를 버리는 것이고, restore-keys 문제는 키 자체가 고정된 것과 무관합니다.',
    },
    {
      q: '외부 기여자의 fork PR에서 통합 테스트가 "API_KEY가 비어 있음"으로 실패합니다. 가장 안전한 대응은?',
      options: ['워크플로를 pull_request_target으로 바꿔 시크릿을 넘긴다', '키를 YAML에 직접 적는다', '시크릿이 필요한 테스트는 fork PR에서 건너뛰고, 메인테이너가 확인한 뒤 내부 브랜치에서 돌린다', 'GITHUB_TOKEN 권한을 write-all로 올린다'],
      answer: 2, step: 9,
      why: 'fork PR에 시크릿이 없는 것은 의도된 보호입니다. pull_request_target으로 PR 코드를 시크릿과 함께 돌리면 키를 빼 갈 수 있고, YAML에 적으면 모두에게 공개됩니다. 토큰 권한은 이 문제와 상관없고 위험만 키웁니다.',
    },
    {
      q: '팀에 "빨간불이면 머지 금지" 공지를 했는데도 실패한 PR이 머지되는 일이 반복됩니다. 가장 효과적인 조치는?',
      options: ['팀 채널에 공지를 다시 올린다', '실패하면 메일 알림이 가게 한다', '실패한 job이 자동으로 세 번 재시도되게 한다', 'main에 브랜치 보호를 걸고 CI 체크를 필수로 지정한다'],
      answer: 3, step: 10,
      why: '공지와 알림은 권고라서 바쁠 때 무시됩니다. 필수 상태 체크는 통과 전까지 머지 자체를 막습니다. 자동 재시도는 불안정한 테스트를 가릴 뿐 근본 원인을 남깁니다.',
    },
    {
      q: 'PR 하나의 CI가 30분이고 그중 25분이 브라우저 E2E 400개입니다. 단위 테스트는 50개뿐입니다. 장기적으로 가장 나은 방향은?',
      options: ['E2E를 핵심 흐름 몇 개로 줄이고 로직 검사는 단위·통합 테스트로 내린다', 'E2E를 모두 지우고 단위 테스트만 둔다', '러너를 가장 큰 사양으로 올린다', 'E2E 실패는 무시하도록 continue-on-error를 붙인다'],
      answer: 0, step: 11,
      why: '거꾸로 된 피라미드(아이스크림 콘)입니다. 로직은 빠르고 원인이 분명한 아래층에서 검사하고, E2E는 핵심 흐름만 남깁니다. E2E를 다 지우면 화면과 연결의 실제 동작을 아무도 확인하지 않습니다.',
    },
    {
      q: '특정 테스트가 코드 변경 없이 열 번에 한 번꼴로 실패합니다. 오늘 할 일로 가장 알맞은 것은?',
      options: ['실패하면 자동으로 다시 돌게 해 두고 잊는다', '그 테스트를 flaky로 표시해 필수 체크에서 격리하고, 담당자와 기한을 정해 고친다', '테스트를 지운다', '빨간불이면 모두 "다시 실행"을 누르라고 안내한다'],
      answer: 1, step: 12,
      why: '격리하면 필수 체크의 신뢰를 지키면서도 계속 돌려 기록이 남고, 담당자와 기한이 있어야 실제로 고쳐집니다. 자동 재시도나 재실행 습관은 진짜 실패까지 가리고, 지우면 그 기능의 검사가 사라집니다.',
    },
    {
      q: '문서만 고친 PR에서 필수 체크 test가 "Expected — Waiting for status to be reported"로 멈춰 있습니다. 먼저 의심할 것은?',
      options: ['러너가 모두 바빠 대기열에 있다', '리뷰 승인이 부족하다', '워크플로의 paths-ignore 같은 필터 때문에 실행 자체가 되지 않았다', '캐시가 깨졌다'],
      answer: 2, step: 13,
      why: '"Expected"는 아직 아무 run도 그 이름의 결과를 보고하지 않았다는 뜻입니다. 대기열이었다면 queued 상태의 run이 보입니다. 필터를 job 안으로 옮기고 결과를 모으는 job 하나만 필수로 두면 해결됩니다.',
    },
    {
      q: '코드는 GitHub에 있고, CI가 사내 데이터센터의 폐쇄망 테스트 DB에 붙어야 합니다. 알맞은 구성은?',
      options: ['GitHub 호스트 러너에서 DB를 인터넷에 공개해 접속한다', 'GitLab으로 저장소를 옮긴다', '테스트 DB 접속을 빼고 단위 테스트만 돌린다', 'GitHub Actions를 쓰되 사내망 안에 self-hosted 러너를 두고 그 job만 그 러너에 보낸다'],
      answer: 3, step: 14,
      why: '코드 위치는 그대로 두고, 닿아야 하는 곳에 러너를 두는 것이 기준입니다. DB를 공개하는 것은 보안 사고이고, 도구를 바꿔도 러너 위치 문제는 그대로입니다. 저장소가 비공개여야 self-hosted 러너가 안전하다는 점도 함께 챙겨야 합니다.',
    },
  ],
};
