export default {
  id: 'ci-pipeline',
  learn: [
    '통합 지옥: 브랜치를 오래 묵히면 생기는 일',
    'CI의 핵심: push마다 자동으로 빌드·테스트',
    'GitHub Actions 워크플로 읽기: on · jobs · steps',
    '싼 검사부터 돌리고, 캐시로 줄이기',
    'PR 체크와 브랜치 보호로 main 지키기',
    'CI 도구를 고르는 기준',
  ],
  legend: [['build', '커밋 · 코드'], ['ctrl', '이벤트 · 실행'], ['res', '결과 통보'], ['data', '의존성 패키지'], ['bad', '실패 · 거부']],
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
      lint: { kind: 'tile', size: 's', at: [2.85, -0.25], label: '린트', icon: 'search', color: 'yellow' },
      test: { kind: 'tile', size: 's', at: [3.85, -1.25], label: '테스트', icon: 'flask', color: 'teal' },
      build: { kind: 'tile', size: 's', at: [4.85, -2.25], label: '빌드', icon: 'hammer', color: 'blue' },
      registry: { kind: 'cyl', at: [3.2, -3.2], label: 'npm 레지스트리', icon: 'package', color: 'gray' },
      cache: { kind: 'cyl', at: [6.2, -0.2], label: '캐시', icon: 'archive', color: 'green' },
      gha: { at: [1.6, 3.2], label: 'GitHub\nActions', icon: 'workflow', color: 'slate' },
      gl: { at: [2.6, 0.6], label: 'GitLab CI', icon: 'git-merge', color: 'orange' },
      jk: { at: [3.6, -2], label: 'Jenkins', icon: 'wrench', color: 'red' },
    },
    edges: {
      e_a: { from: 'devA', to: 'repo' },
      e_b: { from: 'devB', to: 'repo' },
      e_team: { from: 'repo', to: 'team' },
      e_run: { from: 'repo', to: 'runner', bi: true },
      e_lint: { from: 'repo', to: 'lint' },
      e_lt: { from: 'lint', to: 'test' },
      e_tb: { from: 'test', to: 'build' },
      e_reg: { from: 'registry', to: 'runner', style: 'dashed', tone: 'mute' },
      e_cache: { from: 'cache', to: 'runner', tone: 'ok' },
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
    },
    {
      key: 'on · jobs', kind: 'concept', title: '워크플로: 언제, 어디서 돌릴까',
      body: [
        '<b>GitHub Actions</b>는 저장소의 <code>.github/workflows/</code>에 둔 YAML을 읽습니다. <code>on</code>은 <b>언제</b> 실행할지예요. 여기서는 <code>main</code>에 push될 때와, PR이 열리거나 갱신될 때입니다.',
        '<code>jobs</code>는 할 일의 묶음이고, <code>runs-on</code>은 그 job을 돌릴 <b>러너</b>를 고릅니다. <code>ubuntu-latest</code>는 GitHub이 빌려주는 리눅스 VM으로, job이 끝나면 버려집니다.',
      ],
      callout: { type: 'tip', text: 'job이 여러 개면 기본적으로 <b>서로 다른 러너에서 동시에</b> 돕니다. 순서가 필요하면 <code>needs</code>로 잇습니다.' },
      code: { ref: 'ci', hl: [2, 3, 4, 5, 7, 8, 9] },
      tags: [{ on: 'repo', text: 'on: push · PR', tone: 'accent' }, { on: 'runner', text: 'runs-on', tone: 'accent' }],
      flows: [{ path: ['devA', 'repo'], kind: 'build' }, { path: ['repo', 'runner'], kind: 'ctrl', delay: 1 }],
    },
    {
      key: 'steps', kind: 'concept', title: '싼 검사부터: 린트 · 테스트 · 빌드',
      body: [
        '<code>steps</code>는 위에서 아래로 실행되고, 하나라도 실패하면 job이 <b>거기서 멈춥니다</b>. <code>uses</code>는 남이 만들어 둔 액션을, <code>run</code>은 셸 명령을 실행해요.',
        '<b>린트</b>는 문법과 스타일을 몇 초 만에 검사하고, <b>테스트</b>는 동작을 확인하고, <b>빌드</b>는 배포할 결과물이 실제로 만들어지는지 봅니다. 빨리 끝나고 자주 걸리는 것을 앞에 둡니다.',
      ],
      callout: { type: 'key', text: '<b>fail fast</b>: 10초면 잡힐 오타 때문에 몇 분짜리 테스트가 끝나길 기다릴 이유가 없습니다.' },
      hide: ['devA', 'runner'],
      show: ['lint', 'test', 'build'],
      code: { ref: 'ci', hl: [10, 11, 16, 17, 18, 19] },
      tags: [{ on: 'lint', text: '10초' }, { on: 'test', text: '2분' }, { on: 'build', text: '1분' }],
      flows: [{ path: ['repo', 'lint', 'test', 'build'], kind: 'build', n: 2, gap: 0.8 }],
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
      changes: [['+', '의존성 캐시'], ['~', 'CI 한 번에 8분 → 3분']],
    },
    {
      key: 'PR 체크', kind: 'solution', title: 'PR 체크와 브랜치 보호',
      body: [
        'CI 결과는 <b>Pull Request</b>에 초록 체크나 빨간 ×로 붙습니다. 리뷰어는 "돌려는 보셨나요?"를 묻는 대신 코드 자체에 집중할 수 있어요.',
        '하지만 표시만으로는 빨간불에도 머지할 수 있습니다. <b>브랜치 보호 규칙</b>으로 <code>main</code>에 직접 push하는 길을 막고, <b>필수 상태 체크</b>가 통과해야만 머지 버튼이 켜지게 합니다.',
      ],
      callout: { type: 'key', text: '강제하지 않는 CI는 <b>권고</b>일 뿐입니다. 깨진 코드가 main에 못 들어오는 것은 규칙이 막아 주기 때문이에요.' },
      hide: ['registry', 'cache'],
      show: ['devB'],
      set: { repo: { badge: '보호됨', tone: 'ok' } },
      panel: { title: 'PR #42 · 머지 조건', icon: 'git-pr', rows: [['lint', '통과', 'ok'], ['test', '통과', 'ok'], ['build', '통과', 'ok'], ['리뷰 승인 1명', '대기 중', 'warn']] },
      tags: [{ on: 'devB', text: '직접 push 거부 → PR로', tone: 'warn', icon: 'git-pr' }, { on: 'runner', text: '체크 3개 통과', tone: 'ok', icon: 'check', pos: 'bottom' }],
      flows: [
        { path: ['devB', 'repo'], kind: 'bad' },
        { path: ['devB', 'repo'], kind: 'build', delay: 1.2 },
        { path: ['repo', 'runner'], kind: 'ctrl', delay: 2.2 },
        { path: ['runner', 'repo'], kind: 'res', delay: 3.2 },
      ],
      metrics: { main: ['항상 초록', 'ok'] },
      changes: [['+', 'main 브랜치 보호'], ['+', '필수 체크: lint · test · build'], ['-', 'main에 직접 push']],
    },
    {
      key: '못 믿을 CI', kind: 'case', title: '사례: 아무도 믿지 않는 빨간불',
      body: [
        '테스트가 늘면서 파이프라인이 25분으로 불었고, 몇몇 테스트는 코드가 멀쩡해도 가끔 실패합니다(<b>flaky test</b>). 팀은 빨간불을 보면 원인을 찾는 대신 <b>"다시 실행"</b>부터 누르게 됐어요.',
        '그러다 진짜 버그가 낸 빨간불도 재실행 끝에 우연히 통과해 main에 들어갔습니다. 느리고 못 믿을 CI는 사람들에게 <b>우회하는 법</b>을 가르칩니다.',
      ],
      callout: { type: 'tip', text: '불안정한 테스트는 바로 고치거나 격리하세요. job을 <b>병렬로 쪼개고 캐시</b>를 써서, 흔히 10분 안쪽을 목표로 잡습니다.' },
      hide: ['devB'],
      show: ['devA'],
      set: { runner: { state: 'hot', badge: '25분', tone: 'bad' }, repo: { badge: null } },
      tags: [{ on: 'devA', text: '"다시 실행" 3번째', tone: 'warn', icon: 'repeat' }],
      flows: [
        { path: ['repo', 'runner'], kind: 'ctrl', n: 3, gap: 0.9 },
        { path: ['runner', 'repo'], kind: 'bad', n: 2, gap: 0.9, delay: 1 },
        { path: ['runner', 'repo'], kind: 'res', delay: 2.8 },
      ],
      metrics: { fb: ['25분 + 재실행', 'bad'], main: ['가끔 깨짐', 'warn'], pipe: ['25분', 'bad'] },
      changes: [['~', 'CI 한 번에 3분 → 25분'], ['-', '빨간불에 대한 신뢰']],
    },
    {
      key: '도구 비교', kind: 'compare', title: 'CI 도구: 문법은 달라도 뼈대는 같습니다',
      body: [
        '<b>GitHub Actions</b>와 <b>GitLab CI</b>는 저장소에 붙어 있어 시작이 쉽습니다. <b>Jenkins</b>는 직접 설치해 운영하는 오픈 소스로, 자유도가 큰 만큼 서버와 플러그인 관리가 내 일이 됩니다.',
        '클라우드 사업자도 자기 도구를 갖고 있고, 그 클라우드의 IAM·네트워크와 잘 맞물리는 것이 장점입니다. 어느 것이든 <b>이벤트 → 러너 → 단계 → 결과</b>라는 뼈대는 같아요.',
      ],
      callout: { type: 'cloud', text: '고를 때는 "코드가 어디 있는가"와 "러너가 어디에 닿아야 하는가"를 봅니다. 멀티클라우드라면 한 사업자에 묶이지 않는 도구가 편할 때가 많습니다.' },
      hide: ['devA', 'repo', 'runner'],
      show: ['gha', 'gl', 'jk'],
      set: { runner: { state: null, badge: null } },
      panel: { title: '클라우드 사업자의 CI/CD', icon: 'cloud', rows: [['AWS', 'CodePipeline · CodeBuild', 'aws'], ['Azure', 'Azure Pipelines', 'azure'], ['GCP', 'Cloud Build', 'gcp'], ['NCP', 'SourcePipeline · SourceBuild', 'ncp']] },
      tags: [{ on: 'gha', text: '저장소 내장', pos: 'bottom' }, { on: 'gl', text: '.gitlab-ci.yml', pos: 'bottom' }, { on: 'jk', text: '직접 설치 · 운영', pos: 'bottom' }],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 작게, 자주, 자동으로',
      body: [
        'CI는 통합의 고통을 <b>잘게 쪼개 매일 치르는</b> 방법입니다. push마다 러너가 린트·테스트·빌드를 돌리고, 브랜치 보호가 그 결과를 강제해 <code>main</code>을 늘 배포할 수 있는 상태로 지킵니다.',
        '파이프라인은 <b>빠르고 믿을 수 있어야</b> 의미가 있습니다. 다음 레슨에서는 검사를 통과한 커밋을 <b>컨테이너 이미지</b>로 만들어 레지스트리에 올리는 단계를 이어 붙입니다.',
      ],
      hide: ['gha', 'gl', 'jk'],
      show: ['devA', 'repo', 'runner'],
      set: { runner: { state: 'ok' }, repo: { badge: '보호됨', tone: 'ok' } },
      focus: ['repo', 'runner'],
      flows: [
        { path: ['devA', 'repo'], kind: 'build' },
        { path: ['repo', 'runner'], kind: 'ctrl', delay: 1 },
        { path: ['runner', 'repo'], kind: 'res', delay: 2 },
      ],
      metrics: { fb: ['6분', 'ok'], main: ['항상 초록', 'ok'], pipe: ['6분', 'ok'] },
    },
  ],
  quiz: [
    {
      q: 'CI를 도입했는데도 2주짜리 기능 브랜치를 합칠 때마다 큰 충돌이 납니다. 가장 먼저 바꿔야 할 것은?',
      options: ['러너를 더 빠른 사양으로 올린다', '브랜치를 짧게 유지하고 작은 변경을 자주 main에 합친다', '테스트 개수를 줄여 파이프라인을 단축한다', '충돌이 나면 CI를 건너뛰고 머지할 수 있게 한다'],
      answer: 1,
      why: 'CI의 절반은 도구가 아니라 습관입니다. 브랜치를 오래 묵히면 자동 검사가 있어도 통합은 여전히 한꺼번에 일어납니다. 러너 사양이나 테스트 수는 충돌의 크기와 무관합니다.',
    },
    {
      q: '린트(10초), 단위 테스트(2분), 통합 테스트(12분)가 있습니다. 린트를 맨 앞에 두는 이유로 가장 알맞은 것은?',
      options: ['린트가 가장 중요한 검사라서', '뒤 단계가 린트 결과 파일을 필요로 해서', '싸고 자주 걸리는 검사가 먼저 실패해야 피드백이 빨라서', 'GitHub Actions가 린트를 첫 단계로 요구해서'],
      answer: 2,
      why: '단계는 순서대로 돌고 실패하면 멈춥니다. 10초 만에 잡힐 문제를 14분 뒤에 알 이유가 없죠. 중요도나 도구의 요구 때문이 아니라 피드백 시간을 줄이려는 배치입니다.',
    },
    {
      q: 'PR에 빨간 ×가 떠 있는데도 머지되는 일이 반복됩니다. 가장 효과적인 조치는?',
      options: ['팀 채널에 "빨간불엔 머지 금지"를 공지한다', '실패하면 메일 알림이 가게 한다', 'main에 브랜치 보호를 걸고 CI 체크를 필수로 지정한다', '실패한 job이 자동으로 세 번 재시도되게 한다'],
      answer: 2,
      why: '공지와 알림은 권고라서 바쁠 때 무시됩니다. 필수 상태 체크는 통과 전까지 머지 자체를 막습니다. 자동 재시도는 불안정한 테스트를 가릴 뿐 근본 원인을 남깁니다.',
    },
    {
      q: '가끔 이유 없이 실패하는 테스트가 있어 팀이 "다시 실행"에 익숙해졌습니다. 가장 큰 위험은?',
      options: ['러너 사용료가 조금 늘어난다', '진짜 버그가 낸 실패도 우연한 실패로 여겨져 지나간다', '캐시가 자주 무효화된다', 'PR 화면이 지저분해진다'],
      answer: 1,
      why: '빨간불이 "아마 또 그 테스트겠지"가 되는 순간 CI는 신호 역할을 잃습니다. 비용이나 보기 불편함은 부차적입니다. 불안정한 테스트는 고치거나 격리해 신뢰를 되찾아야 합니다.',
    },
  ],
};
