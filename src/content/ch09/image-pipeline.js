export default {
  id: 'image-pipeline',
  learn: [
    '손으로 만든 이미지가 위험한 이유',
    '커밋 → 빌드 → 스캔 → 태그 → 푸시의 흐름과 빌드 캐시',
    'git SHA 태그, 다이제스트, 그리고 latest의 함정',
    '취약점 스캔을 게이트로 운영하기',
    'OIDC: 장기 키 없이 클라우드에 인증하기',
    '한 번 빌드해 승격하기, SBOM과 서명',
  ],
  legend: [['build', '이미지'], ['ctrl', '이벤트 · 토큰'], ['res', '단기 자격 증명'], ['data', '캐시 레이어'], ['bad', '차단 · 문제']],
  metrics: [
    { id: 'tag', label: '배포 태그', icon: 'tag' },
    { id: 'key', label: '장기 키', icon: 'key' },
    { id: 'vuln', label: '취약점 검사', icon: 'shield-alert' },
    { id: 'builds', label: '빌드 횟수', icon: 'hammer' },
    { id: 'btime', label: '이미지 빌드', icon: 'timer' },
  ],
  scene: {
    zones: {
      prod: { at: [5.9, -3.6], size: [2.2, 4.9], label: 'prod 클러스터', color: 'red' },
    },
    nodes: {
      dev: { kind: 'client', at: [-1.6, 3.6], label: '개발자' },
      repo: { at: [0, 2], label: 'main', sub: 'GitHub 저장소', icon: 'git', color: 'slate' },
      runner: { at: [1.7, 0.3], label: 'CI 러너', sub: '일회용 VM', icon: 'bot', color: 'teal' },
      bcache: { kind: 'cyl', at: [-0.6, -2.2], label: '빌드 캐시', icon: 'layers', color: 'green' },
      scan: { kind: 'tile', at: [0.2, -3.8], label: 'Trivy 스캔', icon: 'scan', color: 'yellow' },
      sts: { at: [0.6, -2.2], label: 'IAM 역할', sub: 'AWS STS', icon: 'id-card', color: 'aws' },
      idp: { at: [4.1, 0.3], label: 'GitHub', sub: 'OIDC 발급자', icon: 'fingerprint', color: 'slate' },
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
      e_bc: { from: 'bcache', to: 'runner', bi: true, tone: 'ok' },
      e_run_scan: { from: 'runner', to: 'scan' },
      e_scan_reg: { from: 'scan', to: 'reg' },
      e_run_sts: { from: 'runner', to: 'sts', bi: true, style: 'dashed' },
      e_idp: { from: 'runner', to: 'idp', bi: true, style: 'dashed' },
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
    build: {
      title: 'image.yml · buildx',
      lang: 'yaml',
      text: `- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    context: .
    load: true      # 스캔하려고 러너에 적재
    tags: \${{ env.IMAGE }}
    labels: |
      org.opencontainers.image.revision=\${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
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
      metrics: { tag: ['latest', 'bad'], key: ['노트북에', 'bad'], vuln: '안 함', builds: '사람마다', btime: '제각각' },
      more: [
        { title: '무엇이 섞여 들어가나', list: [
          '커밋하지 않은 수정, 로컬의 <code>.env</code>, 테스트용 인증서: <code>.dockerignore</code>가 허술하면 빌드 컨텍스트째로 이미지에 들어갑니다.',
          '노트북의 CPU 아키텍처: Apple Silicon에서 만든 <code>arm64</code> 이미지를 <code>amd64</code> 노드가 받으면 <code>exec format error</code>로 뜨지 못합니다.',
          '캐시된 오래된 베이스 이미지: <code>FROM node:22</code>가 가리키는 실제 이미지는 노트북마다 받은 시점이 달라 다릅니다.',
        ] },
        { title: '직접 해보기', body: ['레지스트리에 있는 이미지가 어디서 왔는지 단서를 찾아봅니다. 손으로 만든 이미지에는 보통 출처 라벨이 없습니다.'], code: { title: 'terminal', lang: 'sh', text: '$ docker pull reg.example/shop-api:latest\n$ docker inspect reg.example/shop-api:latest \\\n    --format \'{{json .Config.Labels}}\'\n{}\n$ docker inspect reg.example/shop-api:latest \\\n    --format \'{{.Architecture}} {{.Created}}\'\narm64 2026-11-14T23:41:07Z' } },
        { title: '실무 팁', body: ['레지스트리 <b>쓰기 권한</b>은 파이프라인 역할 하나에만 주고, 사람에게는 읽기만 줍니다. 그래야 "레지스트리에 있는 이미지는 모두 파이프라인을 거쳤다"는 문장이 참이 됩니다.'] },
      ],
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
      metrics: { key: ['CI Secrets에', 'warn'], builds: '커밋마다', btime: '7분' },
      changes: [['+', '이미지 파이프라인'], ['-', '노트북의 레지스트리 키'], ['~', '빌드 장소: 노트북 → 러너']],
      more: [
        { title: '어디에 이어 붙일까', body: [
          '흔한 구성은 두 갈래입니다. PR에서는 앞 레슨의 CI(린트·테스트)와 함께 이미지를 <b>빌드와 스캔까지만</b> 해서 Dockerfile이 깨지지 않았는지 봅니다. <code>main</code>에 머지된 뒤에만 <b>푸시</b>까지 가요. PR마다 푸시하면 레지스트리가 검증되지 않은 이미지로 가득 차고, fork PR에는 푸시 권한도 없습니다.',
        ] },
        { title: '단계별 실패 의미', rows: [
          ['빌드 실패', 'Dockerfile·의존성 문제 · 커밋 작성자', 'bad'],
          ['스캔 실패', '베이스·라이브러리 취약점 · 갱신 필요', 'warn'],
          ['인증 실패', '역할·신뢰 조건 문제 · 플랫폼 팀', 'warn'],
          ['푸시 실패', '저장소 없음·태그 불변 충돌·권한', 'mute'],
        ] },
        { title: '실무 팁', list: [
          '이미지 job은 CI job에 <code>needs</code>로 묶어, 테스트가 실패한 커밋은 이미지가 되지 않게 합니다.',
          '<code>docker/metadata-action</code>은 커밋 SHA·브랜치·버전 태그와 OCI 라벨을 규칙대로 만들어 줘, 태그 규칙을 저장소마다 손으로 짜지 않아도 됩니다.',
        ] },
      ],
    },
    {
      key: '러너 빌드', kind: 'concept', title: '빈 러너에서도 레이어 캐시 살리기',
      body: [
        '러너는 매번 빈 VM이라 <code>docker build</code>가 레이어 캐시를 하나도 못 씁니다. <code>npm ci</code> 레이어까지 매번 처음부터 다시 만들어 7분이 걸려요.',
        '<b>Buildx</b>는 레이어 캐시를 <b>밖에 저장</b>했다가 다음 빌드에서 꺼내 씁니다. <code>type=gha</code>는 Actions 캐시에, <code>type=registry</code>는 레지스트리의 별도 태그에 둡니다.',
      ],
      callout: { type: 'tip', text: '캐시가 잘 맞으려면 Dockerfile에서 <b>잘 안 바뀌는 것을 위에</b> 둬야 합니다. 원리는 ch06 「이미지와 레이어」에서 봤어요.' },
      hide: ['dev'],
      show: ['bcache'],
      code: { ref: 'build', hl: [1, 2, 9, 10] },
      tags: [{ on: 'bcache', text: 'mode=max', tone: 'ok', icon: 'layers' }],
      flows: [
        { path: ['repo', 'runner'], kind: 'ctrl' },
        { path: ['bcache', 'runner'], kind: 'data', n: 3, gap: 0.3, delay: 0.6 },
        { path: ['runner', 'bcache'], kind: 'data', delay: 2.2 },
        { path: ['runner', 'reg'], kind: 'build', delay: 2.6 },
      ],
      metrics: { btime: ['2분', 'ok'] },
      changes: [['+', 'Buildx 원격 캐시'], ['~', '이미지 빌드 7분 → 2분']],
      more: [
        { title: '동작 원리', body: [
          'Buildx(BuildKit)는 Dockerfile 명령마다 입력(앞 레이어, 명령 문자열, 복사한 파일의 내용)으로 캐시 키를 만듭니다. <code>cache-from</code>에서 같은 키의 레이어를 찾으면 실행하지 않고 가져와요. <code>mode=max</code>는 최종 이미지에 안 들어가는 멀티스테이지 중간 단계까지 저장하고, 기본값 <code>min</code>은 최종 레이어만 저장합니다.',
          '<code>type=gha</code>는 앞 레슨의 Actions 캐시를 쓰므로 저장소 캐시 용량 한도를 함께 씁니다. 이미지가 크면 레지스트리 캐시가 더 안정적이에요.',
        ] },
        { title: '출력 읽기', code: { title: 'Actions 로그', lang: 'text', text: '#5 [deps 2/3] COPY package*.json ./\n#5 CACHED\n#6 [deps 3/3] RUN npm ci --omit=dev\n#6 CACHED\n#8 [build 2/2] RUN npm run build\n#8 DONE 41.2s\n#11 exporting cache to GitHub Actions Cache\n#11 DONE 6.3s' }, body: ['<code>CACHED</code>는 그 레이어를 캐시에서 가져왔다는 뜻입니다. 소스만 바뀐 커밋이면 의존성 레이어는 CACHED, 빌드 레이어만 다시 돕니다.'] },
        { title: '흔한 실수', list: [
          '<code>COPY . .</code>를 <code>npm ci</code>보다 위에 두기: 소스 한 줄만 바뀌어도 의존성 설치부터 다시 돕니다.',
          '여러 플랫폼(<code>linux/amd64,linux/arm64</code>)을 에뮬레이션으로 빌드하면 몇 배 느립니다. 필요한 플랫폼만, 가능하면 해당 아키텍처 러너에서.',
          '<code>.dockerignore</code>가 없어 <code>.git</code>·<code>node_modules</code>까지 컨텍스트로 올라가면 캐시 키가 매번 달라집니다.',
        ] },
      ],
    },
    {
      key: 'SHA 태그', kind: 'concept', title: '태그는 git SHA: 이미지 = 커밋',
      body: [
        '<code>IMAGE</code>는 레지스트리 주소 뒤에 <code>github.sha</code>, 곧 이 실행을 일으킨 <b>커밋의 SHA</b>를 태그로 붙인 이름입니다. <code>docker build</code>가 그 이름으로 이미지를 만들어요.',
        '이제 <code>shop-api:a3f9c2e</code>만 보면 어떤 소스인지 바로 압니다(실제 태그는 40자 전체이고, 여기서는 줄여 씁니다). 커밋마다 태그가 달라 <b>덮어쓸 일도 없습니다</b>.',
      ],
      callout: { type: 'tip', text: '레지스트리의 <b>태그 불변</b>(immutable) 설정까지 켜 두면 실수로 덮어쓰는 것도 막힙니다. <code>v1.4.2</code> 같은 릴리스 버전은 같은 이미지에 태그를 하나 더 붙이면 돼요.' },
      hide: ['bcache'],
      code: { ref: 'wf', hl: [6, 7, 18] },
      tags: [{ on: 'repo', text: '커밋 a3f9c2e', icon: 'git-commit' }, { on: 'reg', text: ':a3f9c2e', tone: 'ok', icon: 'tag' }],
      flows: [{ path: ['repo', 'runner'], kind: 'ctrl' }, { path: ['runner', 'reg'], kind: 'build', delay: 1 }],
      metrics: { tag: ['a3f9c2e', 'ok'] },
      changes: [['~', '태그 latest → 커밋 SHA']],
      more: [
        { title: '태그 규칙 예시', rows: [
          [':a3f9c2e…', '모든 main 커밋 · 불변', 'ok'],
          [':v1.4.2', '릴리스 태그를 달 때 같은 이미지에 추가', 'info'],
          [':pr-57', 'PR 미리보기용 · 덮어써도 됨', 'mute'],
          [':latest', '배포 매니페스트에는 쓰지 않음', 'bad'],
        ] },
        { title: '직접 해보기', body: ['배포된 태그에서 커밋으로, 커밋에서 변경 내용으로 거슬러 올라갑니다.'], code: { title: 'terminal', lang: 'sh', text: '$ kubectl get deploy shop-api \\\n    -o jsonpath=\'{..image}\'\n123.dkr.ecr.ap-northeast-2.amazonaws.com/shop-api:a3f9c2e1b7…\n$ git show --stat a3f9c2e\ncommit a3f9c2e1b7…\n    장바구니 쿠폰 중복 적용 수정\n src/cart/coupon.js | 14 ++++++++----' } },
        { title: '실무 팁', list: [
          '짧은 SHA(7자)는 사람이 읽기 좋지만 저장소가 커지면 겹칠 수 있어, 태그에는 40자 전체를 쓰고 화면에서만 줄여 보는 팀이 많습니다.',
          '커밋마다 이미지가 쌓이니 레지스트리 <b>수명 주기 정책</b>(예: 최근 n개만 유지, PR 태그는 며칠 뒤 삭제)을 둡니다. 운영에서 도는 이미지가 지워지지 않도록 규칙을 확인하세요.',
        ] },
      ],
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
      more: [
        { title: '증상', list: [
          '같은 Deployment의 Pod끼리 응답이 다릅니다. 로그 형식이나 버전 엔드포인트가 Pod마다 달라요.',
          '노드가 바뀌거나 Pod가 재시작될 때만 버그가 "생겼다 사라졌다" 합니다.',
          '<code>kubectl describe pod</code>의 <code>Image ID</code>(다이제스트)가 Pod마다 다릅니다. 이름은 같은데 내용이 다르다는 결정적 증거입니다.',
        ] },
        { title: '동작 원리', body: [
          '쿠버네티스는 태그가 <code>latest</code>이거나 태그가 없으면 <code>imagePullPolicy</code> 기본값을 <code>Always</code>로 둡니다. Pod가 뜰 때마다 레지스트리에 그 시점의 latest를 물어보는 거예요. 다른 태그는 기본이 <code>IfNotPresent</code>라, 노드에 같은 이름의 옛 이미지가 남아 있으면 그것을 씁니다. 어느 쪽이든 <b>움직이는 태그</b>를 쓰는 한 Pod마다 다른 이미지를 돌릴 수 있어요.',
        ] },
        { title: '고친 방법', body: ['매니페스트를 커밋 SHA 태그로 바꾸고, 레지스트리의 태그 불변 설정을 켜서 같은 태그를 다시 푸시하면 거부되게 했습니다. <code>latest</code>는 로컬 개발용으로만 남겼어요.'] },
      ],
    },
    {
      key: '다이제스트', kind: 'solution', title: '다이제스트로 내용까지 못 박기',
      body: [
        '태그는 결국 <b>이름표</b>라서, 불변 설정이 없으면 누군가 옮길 수 있습니다. <b>다이제스트</b>(<code>sha256:9f2c…</code>)는 이미지 내용으로 계산한 해시라, 한 비트만 달라도 값이 바뀝니다.',
        '매니페스트에 <code>shop-api:a3f9c2e@sha256:9f2c…</code>처럼 다이제스트를 함께 쓰면 쿠버네티스는 <b>다이제스트로</b> 받습니다. 이제 두 Pod는 반드시 같은 바이트를 돌립니다.',
      ],
      callout: { type: 'key', text: '태그는 사람이 읽으라고, 다이제스트는 기계가 확인하라고 있습니다. 서명과 승격도 다이제스트를 대상으로 합니다.' },
      set: {
        podA: { sub: ':a3f9c2e', badge: 'sha256:9f2c', tone: 'ok' },
        podB: { sub: ':a3f9c2e', badge: 'sha256:9f2c', tone: 'ok' },
      },
      tags: [{ on: 'reg', text: '내용 = 해시', tone: 'ok', icon: 'fingerprint' }],
      flows: [{ path: ['reg', 'podA'], kind: 'build' }, { path: ['reg', 'podB'], kind: 'build', delay: 0.4 }],
      metrics: { tag: ['SHA + 다이제스트', 'ok'] },
      changes: [['~', '태그만 → 태그@다이제스트'], ['+', 'Pod 간 이미지 일치 보장']],
      more: [
        { title: '직접 해보기', body: ['푸시할 때 레지스트리가 다이제스트를 돌려주고, 나중에도 태그로 조회할 수 있습니다.'], code: { title: 'terminal', lang: 'sh', text: '$ docker push $REG/shop-api:a3f9c2e\na3f9c2e: digest: sha256:9f2c41d0…e7 size: 1789\n$ docker buildx imagetools inspect \\\n    $REG/shop-api:a3f9c2e | head -3\nName:      $REG/shop-api:a3f9c2e\nMediaType: application/vnd.oci.image.index.v1+json\nDigest:    sha256:9f2c41d0…e7' } },
        { title: '설정 예시', body: ['<code>docker/build-push-action</code>은 <code>digest</code>를 출력값으로 내줍니다. 다음 job이 그 값을 받아 매니페스트에 적으면 됩니다.'], code: { title: 'image.yml', lang: 'yaml', text: "- id: push\n  uses: docker/build-push-action@v6\n  with:\n    push: true\n    tags: ${{ env.IMAGE }}\n- run: echo \"digest=${{ steps.push.outputs.digest }}\"" } },
        { title: '흔한 실수', list: [
          '멀티 플랫폼 이미지의 다이제스트는 <b>인덱스</b>(플랫폼 목록)의 다이제스트입니다. 노드에서 보이는 플랫폼별 다이제스트와 달라 보여도 정상이에요. 매니페스트에는 인덱스 다이제스트를 씁니다.',
          '같은 소스를 다시 빌드하면 타임스탬프 등이 달라져 다이제스트도 대개 달라집니다. 다이제스트는 "같은 빌드 결과"의 증명이지 "같은 소스"의 증명이 아닙니다.',
        ] },
      ],
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
      more: [
        { title: '동작 원리', body: [
          '스캐너는 이미지 레이어를 풀어 OS 패키지 목록(<code>/var/lib/dpkg</code>, <code>apk</code> DB 등)과 언어별 lock 파일·설치된 모듈을 찾습니다. 그 이름과 버전을 배포판 보안 공지와 공개 취약점 데이터베이스에 대조해, 영향받는 버전 범위에 들면 보고해요.',
          '그래서 <b>무엇이 설치됐는지 알 수 없는 것</b>(소스에서 직접 컴파일해 복사한 바이너리 등)은 잘 잡지 못합니다. 작은 베이스 이미지(slim, distroless)는 검사 대상 자체를 줄여 결과도 깔끔해집니다.',
        ] },
        { title: '어디서 스캔하나', rows: [
          ['PR · 빌드 직후', '푸시 전 게이트 · 빠른 피드백', 'ok'],
          ['레지스트리', '푸시 시·주기적 재스캔', 'info'],
          ['클러스터', '지금 도는 이미지 기준 보고', 'info'],
          ['소스 의존성', 'lock 파일 검사 · Dependabot 등', 'mute'],
        ] },
        { title: '흔한 실수', list: [
          '<code>exit-code</code>를 안 줘서 스캔은 돌지만 결과와 상관없이 늘 통과: 로그에만 남는 경고는 아무도 읽지 않습니다.',
          '스캔을 푸시 <b>뒤</b>에 둬서, 실패해도 이미 레지스트리에 이미지가 올라가 있는 경우.',
        ] },
      ],
    },
    {
      key: '결과 읽기', kind: 'concept', title: '스캔 결과 읽기와 예외 다루기',
      body: [
        '스캔이 빨갛게 끝났습니다. 표에서 볼 것은 세 가지예요. <b>어느 패키지</b>가, <b>어떤 등급</b>이고, <b>고친 버전</b>(Fixed Version)이 있는가.',
        'OS 패키지 취약점은 대개 <b>베이스 이미지를 새 버전으로</b> 올리면 사라집니다. 고친 버전이 아직 없거나 우리 코드에 영향이 없다고 판단되면, 이유와 <b>만료일</b>을 적은 예외로 넘깁니다.',
      ],
      callout: { type: 'warn', text: '예외 목록에 만료일이 없으면 "잠깐만"이 영원이 됩니다. 기한이 지나면 다시 빨개지게 하세요.' },
      hide: ['repo'],
      set: { scan: { state: 'hot', badge: 'CRITICAL 1', tone: 'bad' } },
      panel: { title: 'trivy image shop-api:a3f9c2e', icon: 'scan', rows: [['libssl3 (debian)', 'CRITICAL · 수정판 있음', 'bad'], ['lodash (npm)', 'HIGH · 수정판 있음', 'warn'], ['zlib1g (debian)', 'LOW · 수정판 없음', 'mute'], ['조치', '베이스 이미지 갱신 → 재빌드', 'ok']] },
      flows: [
        { path: ['runner', 'scan'], kind: 'build' },
        { path: ['scan', 'runner'], kind: 'bad', delay: 1.2 },
      ],
      metrics: { vuln: ['CRITICAL 1 → 실패', 'bad'] },
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: '$ trivy image --severity HIGH,CRITICAL \\\n    --ignore-unfixed $IMAGE\nshop-api:a3f9c2e (debian 12.7)\nTotal: 1 (HIGH: 0, CRITICAL: 1)\n Library  Severity  Installed   Fixed\n libssl3  CRITICAL  3.0.14-1~  3.0.15-1~\n\nNode.js (node-pkg)\nTotal: 1 (HIGH: 1, CRITICAL: 0)\n lodash   HIGH      4.17.20     4.17.21' }, body: ['<code>--ignore-unfixed</code>는 고친 버전이 아직 없는 항목을 빼 줍니다. 지금 할 수 있는 조치가 있는 것만 게이트로 삼는 흔한 설정이에요. 표의 Installed와 Fixed를 보면 무엇을 올려야 하는지 바로 보입니다.'] },
        { title: '고치는 순서', list: [
          '베이스 이미지 태그를 최신 패치로 올리고 재빌드: OS 패키지 문제 대부분이 여기서 끝납니다. 베이스 갱신 PR을 자동으로 열어 주는 도구(Dependabot, Renovate)를 걸어 두면 편합니다.',
          '언어 의존성은 lock 파일에서 해당 패키지를 올립니다. 간접 의존성이면 상위 패키지 갱신이나 강제 버전 지정(overrides)이 필요해요.',
          '정말 영향이 없으면 예외 파일에 CVE 번호와 이유, 만료일을 적고 리뷰를 받습니다. Trivy는 <code>.trivyignore</code>에 만료일을 함께 적는 형식을 지원합니다.',
        ] },
        { title: '실무 팁', body: ['등급은 일반적인 심각도일 뿐, <b>우리 환경에서의 위험</b>과는 다릅니다. 인터넷에 노출되는 서비스의 HIGH가 내부 배치 작업의 CRITICAL보다 급할 수 있어요. 게이트 기준은 단순하게 두고, 예외 판단에서 이런 맥락을 따집니다.'] },
      ],
    },
    {
      key: 'OIDC', kind: 'solution', title: 'OIDC: 저장해 둔 키 없이 인증하기',
      body: [
        '푸시하려면 클라우드 권한이 필요합니다. 액세스 키를 CI Secrets에 넣어 둬도 동작은 하지만, <b>만료되지 않는 키</b>는 로그나 악성 의존성으로 한 번 새면 계속 쓰입니다.',
        '<b>OIDC</b>를 쓰면 러너가 실행마다 GitHub에서 "나는 이 저장소의 main 브랜치 실행"이라고 적힌 <b>서명된 토큰</b>을 받습니다. 클라우드는 서명과 조건을 확인하고, 그 역할의 <b>단기 자격 증명</b>을 내줘요.',
      ],
      callout: { type: 'key', text: '저장할 비밀이 없으니 샐 것도 없습니다. 대신 역할의 신뢰 조건을 <b>좁게</b> 거세요. 조직 전체가 아니라 특정 저장소와 브랜치만 허용합니다.' },
      hide: ['scan'],
      show: ['sts', 'e_run_reg'],
      set: { scan: { state: null, badge: null } },
      code: { ref: 'wf', hl: [3, 4, 5, 13, 14, 15, 16] },
      tags: [{ on: 'runner', text: 'OIDC 토큰', icon: 'fingerprint', pos: 'bottom' }, { on: 'sts', text: '저장소 · 브랜치 확인', tone: 'accent' }],
      flows: [
        { path: ['runner', 'sts'], kind: 'ctrl' },
        { path: ['sts', 'runner'], kind: 'res', delay: 1.1 },
        { path: ['runner', 'reg'], kind: 'build', delay: 2.2 },
      ],
      metrics: { key: ['0개', 'ok'], vuln: ['통과', 'ok'] },
      changes: [['-', 'CI Secrets의 액세스 키'], ['+', '실행마다 단기 자격 증명']],
      more: [
        { title: '장기 키 vs OIDC', rows: [
          ['수명', '키: 지울 때까지 · OIDC: 보통 1시간 안팎', 'info'],
          ['보관', '키: Secrets에 저장 · OIDC: 저장 없음', 'ok'],
          ['교체', '키: 사람이 주기적으로 · OIDC: 필요 없음', 'ok'],
          ['범위', '키: 어디서든 사용 · OIDC: 조건에 맞는 실행만', 'ok'],
        ] },
        { title: '동작 원리', body: [
          '<code>permissions: id-token: write</code>가 있으면 러너는 job 안에서 GitHub의 토큰 발급 엔드포인트를 부를 수 있습니다. 받은 JWT를 액션이 클라우드 STS에 내밀고(AWS라면 <code>AssumeRoleWithWebIdentity</code>), STS는 GitHub의 공개 키로 서명을 확인한 뒤 역할의 신뢰 정책 조건과 토큰 내용을 비교해요. 통과하면 만료 시각이 박힌 임시 키를 돌려줍니다.',
          '클라우드 쪽에는 미리 한 번만 "GitHub을 OIDC 발급자로 신뢰한다"(AWS의 IAM OIDC 공급자)를 등록해 둡니다.',
        ] },
        { title: '흔한 실수', list: [
          '<code>permissions</code> 블록을 쓰면서 <code>id-token: write</code>를 빼먹기: 명시하지 않은 권한은 없음이 되어 토큰을 요청하지 못합니다.',
          '역할에 <code>AdministratorAccess</code>를 붙이기: 키가 없어졌을 뿐 권한 범위는 그대로입니다. 푸시 역할에는 해당 레지스트리 저장소에 대한 푸시 권한만.',
        ] },
      ],
    },
    {
      key: '신뢰 조건', kind: 'concept', title: '토큰 안에 무엇이 적혀 있나',
      body: [
        '러너가 받는 OIDC 토큰은 서명된 JSON 꾸러미(JWT)입니다. 그 안의 <b>클레임</b>이 이 실행의 신원이에요. <code>iss</code>는 발급자, <code>aud</code>는 받을 쪽, <code>sub</code>는 "어느 저장소의 어떤 실행인지"입니다.',
        '클라우드의 역할은 이 클레임에 <b>조건</b>을 겁니다. <code>sub</code>가 정확히 <code>repo:shop/api:ref:refs/heads/main</code>일 때만 허락하면, 다른 저장소나 PR 브랜치는 같은 역할을 못 씁니다.',
      ],
      callout: { type: 'warn', text: '조건 없이 발급자만 신뢰하면 <b>GitHub의 아무 저장소</b>나 내 역할을 맡을 수 있습니다. <code>sub</code> 조건은 선택이 아니라 필수예요.' },
      hide: ['reg'],
      show: ['idp'],
      panel: { title: 'OIDC 토큰의 클레임', icon: 'fingerprint', rows: [['iss', 'token.actions.githubusercontent.com', 'mute'], ['aud', 'sts.amazonaws.com', 'info'], ['sub', 'repo:shop/api:ref:refs/heads/main', 'accent'], ['exp', '발급 후 몇 분', 'mute']] },
      tags: [{ on: 'idp', text: 'JWT 서명', icon: 'key' }],
      flows: [
        { path: ['runner', 'idp'], kind: 'ctrl' },
        { path: ['idp', 'runner'], kind: 'ctrl', delay: 0.9 },
        { path: ['runner', 'sts'], kind: 'ctrl', delay: 1.8 },
        { path: ['sts', 'runner'], kind: 'res', delay: 2.7 },
      ],
      more: [
        { title: '설정 예시', body: ['AWS 역할의 신뢰 정책을 Terraform으로 쓴 모습입니다. <code>aud</code>와 <code>sub</code> 두 조건을 모두 겁니다.'], code: { title: 'oidc.tf', lang: 'hcl', text: `locals {
  gh = "token.actions.githubusercontent.com"
}
data "aws_iam_policy_document" "gha" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "\${local.gh}:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "\${local.gh}:sub"
      values   = ["repo:shop/api:ref:refs/heads/main"]
    }
  }
}` } },
        { title: 'sub의 모양', rows: [
          ['main에 push', 'repo:shop/api:ref:refs/heads/main', 'mute'],
          ['environment 사용', 'repo:shop/api:environment:production', 'mute'],
          ['pull_request', 'repo:shop/api:pull_request', 'mute'],
          ['태그 push', 'repo:shop/api:ref:refs/tags/v1.4.2', 'mute'],
        ] },
        { title: '실무 팁', body: ['job에 <code>environment</code>를 쓰면 <code>sub</code>가 브랜치 대신 환경 이름으로 바뀝니다. 운영 배포 역할은 <code>environment:production</code>만 신뢰하게 하면, 앞 레슨의 환경 승인 규칙을 통과한 실행만 운영 권한을 얻어요. 와일드카드(<code>repo:shop/*</code>)는 꼭 필요할 때만 씁니다.'] },
      ],
    },
    {
      key: 'OIDC 실패', kind: 'case', title: '사례: 어제까지 되던 인증이 거부됩니다',
      body: [
        '배포 job에 <code>environment: production</code>을 추가한 날부터 푸시가 실패합니다. 로그에는 <code>Not authorized to perform sts:AssumeRoleWithWebIdentity</code>가 찍혀요.',
        '원인은 <code>sub</code>였습니다. environment를 쓰자 토큰의 <code>sub</code>가 <code>…:environment:production</code>으로 바뀌었는데, 역할은 여전히 <code>…:ref:refs/heads/main</code>만 기다리고 있었죠.',
      ],
      callout: { type: 'tip', text: '인증 오류가 나면 <b>토큰의 실제 클레임</b>과 <b>신뢰 정책의 조건</b>을 나란히 놓고 한 글자씩 비교하는 것이 가장 빠릅니다.' },
      hide: ['idp'],
      show: ['reg'],
      set: { sts: { state: 'down', badge: 'AccessDenied', tone: 'bad' } },
      tags: [{ on: 'runner', text: '토큰: …production', tone: 'bad', pos: 'bottom' }, { on: 'sts', text: '정책: …heads/main', tone: 'mute', pos: 'left' }],
      flows: [
        { path: ['runner', 'sts'], kind: 'ctrl' },
        { path: ['sts', 'runner'], kind: 'bad', delay: 1.1 },
      ],
      metrics: { key: ['0개 (푸시 실패)', 'bad'] },
      more: [
        { title: '같은 증상, 다른 원인', list: [
          '<code>id-token: write</code> 권한 누락: STS까지 가지도 못하고 토큰 요청 단계에서 실패합니다.',
          '<code>aud</code> 불일치: 액션이 기본으로 넣는 받는 쪽 값과 정책 조건이 다름.',
          'OIDC 공급자 미등록이나 다른 계정의 역할 ARN: 역할 ARN의 계정 번호부터 확인하세요.',
          'PR에서 돌린 실행: <code>sub</code>가 <code>pull_request</code>라 main 조건에 걸립니다. 의도된 차단일 수 있어요.',
        ] },
        { title: '직접 해보기', body: ['디버깅할 때만 잠깐, 토큰을 받아 클레임을 찍어 봅니다(서명 부분은 찍지 않고, 끝나면 이 step을 지웁니다).'], code: { title: 'debug step', lang: 'sh', text: '$ TOKEN=$(curl -sH "Authorization: bearer \\\n    $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \\\n    "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com" \\\n    | jq -r .value)\n$ echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null \\\n    | jq \'{sub, aud, ref, environment}\'\n{ "sub": "repo:shop/api:environment:production",\n  "aud": "sts.amazonaws.com", "ref": "refs/heads/main",\n  "environment": "production" }' } },
        { title: '고친 방법', body: ['운영 배포 역할의 <code>sub</code> 조건을 <code>environment:production</code>으로 바꿨습니다. 오히려 더 안전해졌어요. 이제 production 환경의 승인 규칙을 통과한 job만 이 역할을 맡을 수 있습니다. 클라우드 쪽 감사 로그(AWS CloudTrail 등)에도 거부 이벤트와 그 이유가 남으니 함께 봅니다.'] },
      ],
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
      set: { sts: { state: null, badge: null }, eDev: { badge: 'a3f9c2e', tone: 'ok' }, eStg: { badge: 'a3f9c2e', tone: 'ok' }, eProd: { badge: 'a3f9c2e', tone: 'ok' } },
      tags: [{ on: 'reg', text: '다이제스트 하나', icon: 'fingerprint' }],
      flows: [
        { path: ['runner', 'reg'], kind: 'build' },
        { path: ['reg', 'eDev'], kind: 'build', delay: 1 },
        { path: ['reg', 'eStg'], kind: 'build', delay: 1.8 },
        { path: ['reg', 'eProd'], kind: 'build', delay: 2.6 },
      ],
      metrics: { key: ['0개', 'ok'], builds: ['1번', 'ok'] },
      changes: [['~', '환경별 재빌드 → 1번 빌드'], ['+', 'dev → stg → prod 승격']],
      more: [
        { title: '승격의 두 가지 모양', rows: [
          ['태그 승격', '같은 다이제스트에 :stg, :prod 태그 추가', 'info'],
          ['레지스트리 승격', 'dev 레지스트리 → prod 레지스트리로 복사', 'info'],
          ['GitOps 승격', '환경 폴더의 이미지 값만 바꾸는 PR', 'accent'],
        ] },
        { title: '직접 해보기', body: ['다시 빌드하지 않고 같은 다이제스트를 다른 레지스트리로 옮깁니다. 복사 뒤 다이제스트가 같은지 꼭 확인하세요.'], code: { title: 'terminal', lang: 'sh', text: '$ crane copy \\\n    $DEV_REG/shop-api@sha256:9f2c41d0…e7 \\\n    $PROD_REG/shop-api:a3f9c2e\n$ crane digest $PROD_REG/shop-api:a3f9c2e\nsha256:9f2c41d0…e7' } },
        { title: '흔한 실수', list: [
          '빌드 인자로 <code>API_URL=https://stg…</code>를 이미지에 구워 넣기: 환경마다 이미지가 달라져 승격이 불가능해집니다. 설정은 실행 시점에 주입(ch07 「ConfigMap과 Secret」).',
          '실제로 어느 이미지가 어느 환경에 있는지를 기록하지 않기: 승격 이력은 Git(다음다음 레슨의 GitOps)이나 배포 도구에 남겨야 감사할 수 있습니다.',
        ] },
      ],
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
      more: [
        { title: '직접 해보기', body: ['SBOM을 만들어 이미지에 증명(attestation)으로 붙이고, 키 없이(keyless) 서명합니다. keyless 서명은 앞에서 본 OIDC 토큰으로 "이 워크플로가 서명했다"는 짧은 수명의 인증서를 받아 씁니다.'], code: { title: 'image.yml의 run', lang: 'sh', text: '$ syft $IMAGE@$DIGEST -o spdx-json > sbom.json\n$ cosign sign --yes $IMAGE@$DIGEST\n$ cosign attest --yes --type spdxjson \\\n    --predicate sbom.json $IMAGE@$DIGEST\n# 검증 (클러스터 정책이 하는 일과 같음)\n$ cosign verify $IMAGE@$DIGEST \\\n  --certificate-oidc-issuer \\\n    https://token.actions.githubusercontent.com \\\n  --certificate-identity-regexp \\\n    \'^https://github.com/shop/api/\'' } },
        { title: '무엇을 증명하나', rows: [
          ['스캔', '알려진 취약점이 기준 이하', 'info'],
          ['SBOM', '무엇이 들어 있는지', 'info'],
          ['서명', '누가 만들었고 바뀌지 않았는지', 'ok'],
          ['출처 증명(provenance)', '어느 커밋·워크플로에서 빌드됐는지', 'ok'],
        ] },
        { title: '실무 팁', list: [
          '서명은 반드시 <b>다이제스트</b>에 합니다. 태그에 서명하면 태그가 옮겨질 때 의미가 없어져요.',
          '클러스터에서는 Kyverno나 Sigstore policy-controller 같은 어드미션 정책으로 "우리 저장소 워크플로가 서명한 이미지만"을 강제합니다. 처음엔 경고 모드로 켜서 걸리는 것을 확인한 뒤 차단으로 바꾸세요.',
        ] },
      ],
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
      more: [
        { title: 'GitHub Actions 쪽 설정', rows: [
          ['AWS', 'configure-aws-credentials · role-to-assume', 'aws'],
          ['Azure', 'azure/login · client-id · tenant-id', 'azure'],
          ['GCP', 'google-github-actions/auth · 공급자 · SA', 'gcp'],
          ['NCP', '서브 계정 키를 Secrets에 · docker login', 'ncp'],
        ] },
        { title: '클라우드별로', list: [
          '<b>AWS ECR</b>: 저장소마다 태그 불변 설정과 수명 주기 정책을 둡니다. 푸시 시 스캔을 켤 수 있어요.',
          '<b>Azure ACR</b>: 앱 등록이나 사용자 할당 관리 ID에 <b>페더레이션 자격 증명</b>을 추가하고, 그 ID에 레지스트리 푸시 역할을 줍니다. 태그 잠금도 지원합니다.',
          '<b>GCP Artifact Registry</b>: Workload Identity 풀과 공급자를 만들고, 저장소·브랜치 조건을 공급자에 겁니다. 서비스 계정을 거치거나 풀의 주체에 직접 권한을 줄 수 있어요.',
          '<b>NCP Container Registry</b>: 레지스트리 전용 서브 계정을 만들어 그 키로만 로그인하고, 키 교체 주기를 운영 절차에 넣습니다.',
        ] },
        { title: '실무 팁', body: ['멀티클라우드라면 이미지는 <b>한 곳에서 한 번</b> 빌드하고, 다이제스트를 유지한 채 각 클라우드 레지스트리로 복사합니다. 클러스터는 같은 클라우드 안의 레지스트리에서 받으므로 네트워크 비용과 지연이 줄고, 한 레지스트리가 장애여도 다른 클라우드는 영향을 덜 받습니다.'] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 출처를 아는 이미지만 내보냅니다',
      body: [
        '커밋이 들어오면 파이프라인이 캐시를 살려 이미지를 <b>한 번</b> 빌드하고, 스캔으로 걸러 내고, <b>git SHA</b>와 다이제스트로 못 박아 OIDC 인증으로 푸시합니다. SBOM과 서명이 내용물과 출처를 증명하고요.',
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
      metrics: { tag: ['SHA + 다이제스트', 'ok'], key: ['0개', 'ok'], vuln: ['푸시 전 차단', 'ok'], builds: ['1번', 'ok'], btime: ['2분', 'ok'] },
    },
  ],
  quiz: [
    {
      q: '레지스트리에 있는 이미지 하나가 어느 커밋에서 왔는지 아무도 모릅니다. 앞으로 이런 일을 막는 가장 근본적인 조치는?',
      options: ['이미지 이름에 날짜를 붙이게 한다', '레지스트리 쓰기 권한을 파이프라인 역할에만 주고 커밋 SHA로 태그하게 한다', '푸시한 사람이 위키에 기록하게 한다', '이미지 크기를 줄인다'],
      answer: 1, step: 1,
      why: '사람이 푸시할 수 있는 한 출처 불명 이미지는 다시 생깁니다. 쓰기 권한을 파이프라인에만 주고 커밋 SHA로 태그하면 모든 이미지가 커밋과 연결됩니다. 날짜나 위키 기록은 사람의 습관에 기대는 방법입니다.',
    },
    {
      q: '이미지 빌드가 매번 7분 걸리고, 로그를 보면 소스 한 줄만 바꿔도 npm ci 레이어가 다시 돕니다. 먼저 확인할 것은?',
      options: ['러너를 더 큰 사양으로 바꿨는지', '레지스트리 리전이 가까운지', 'Buildx 원격 캐시를 설정했고, Dockerfile에서 COPY . . 가 의존성 설치보다 아래에 있는지', '스캔 단계가 너무 오래 걸리는지'],
      answer: 2, step: 3,
      why: '빈 러너에는 레이어 캐시가 없으니 외부 캐시가 필요하고, 캐시가 있어도 소스 전체 복사가 의존성 설치보다 위에 있으면 매번 무효화됩니다. 사양이나 리전은 캐시 적중과 무관합니다.',
    },
    {
      q: 'prod 매니페스트가 shop-api:latest를 가리킵니다. 장애가 나서 kubectl rollout undo를 했는데 달라진 것이 없습니다. 이유는?',
      options: ['rollout undo는 Deployment에는 쓸 수 없어서', '레지스트리가 이전 이미지를 자동으로 지워서', 'readiness 프로브가 롤백을 막아서', '이전 리비전도 같은 latest 태그를 가리켜 결국 같은 이미지를 받아서'],
      answer: 3, step: 5,
      why: '롤백은 Pod 템플릿을 이전 리비전으로 되돌릴 뿐인데, 그 템플릿도 latest라면 지금의 latest를 다시 받습니다. 커밋마다 다른 불변 태그를 써야 "이전 버전"이 실제로 다른 이미지를 가리킵니다.',
    },
    {
      q: '같은 Deployment의 Pod 3개 중 하나만 이상하게 동작합니다. 셋 다 이미지 이름은 shop-api:v2로 같습니다. 무엇을 확인하면 원인을 가장 빨리 좁힐 수 있을까?',
      options: ['각 Pod의 Image ID(다이제스트)가 같은지', 'Pod의 이름 순서', 'Service의 포트 번호', '네임스페이스의 라벨'],
      answer: 0, step: 6,
      why: '태그가 같아도 그 사이 다른 이미지가 같은 태그로 푸시됐다면 Pod마다 실제 내용이 다릅니다. 다이제스트는 내용의 해시라 이 차이를 바로 드러냅니다. 매니페스트에 다이제스트를 고정하면 재발도 막을 수 있습니다.',
    },
    {
      q: '스캔 단계에 Trivy를 넣었는데, CRITICAL이 나와도 파이프라인이 늘 초록입니다. 가장 가능성 높은 원인은?',
      options: ['Trivy 데이터베이스가 최신이 아니라서', 'exit-code를 지정하지 않아 결과와 상관없이 성공으로 끝나서', '러너가 리눅스라서', '이미지에 태그가 없어서'],
      answer: 1, step: 7,
      why: '스캐너는 기본적으로 결과를 출력만 하고 0으로 끝납니다. 기준 이상이 나오면 실패하도록 exit-code를 줘야 게이트가 됩니다. 데이터베이스가 낡았다면 CRITICAL 자체가 안 나왔을 것입니다.',
    },
    {
      q: '스캔 결과 debian 베이스의 libssl3에 CRITICAL이 있고 Fixed Version이 적혀 있습니다. 가장 먼저 할 조치는?',
      options: ['.trivyignore에 만료일 없이 추가한다', '스캔 기준을 HIGH 이상에서 아예 끈다', '해당 라이브러리를 앱 코드에서 지운다', '베이스 이미지를 최신 패치 버전으로 올려 다시 빌드한다'],
      answer: 3, step: 8,
      why: 'OS 패키지 취약점에 고친 버전이 있으면 베이스 이미지 갱신으로 대부분 해결됩니다. 예외는 고칠 수 없거나 영향이 없을 때 이유와 만료일을 붙여 쓰는 것이고, 게이트를 끄는 것은 문제를 숨길 뿐입니다.',
    },
    {
      q: 'GitHub Actions에서 클라우드 레지스트리에 푸시해야 합니다. 가장 안전한 인증 방식은?',
      options: ['특정 저장소·브랜치만 신뢰하는 역할을 OIDC로 맡아 단기 자격 증명을 받는다', '관리자 액세스 키를 저장소 Secrets에 넣는다', '푸시 권한만 있는 액세스 키를 Secrets에 넣고 그대로 둔다', '개발자 개인 키를 워크플로 파일에 적는다'],
      answer: 0, step: 9,
      why: 'OIDC는 저장해 둘 장기 비밀이 없고, 받은 자격 증명은 곧 만료됩니다. 최소 권한 키는 관리자 키보다 낫지만 만료가 없어 새면 계속 쓰입니다. 신뢰 조건을 저장소·브랜치로 좁히는 것까지가 한 세트입니다.',
    },
    {
      q: 'OIDC 역할의 신뢰 정책에 발급자(token.actions.githubusercontent.com)만 지정하고 sub 조건은 비워 두었습니다. 어떤 위험이 있나?',
      options: ['토큰 수명이 길어진다', '우리 저장소의 PR만 막힌다', 'GitHub의 다른 저장소 워크플로도 이 역할을 맡을 수 있다', '레지스트리 저장 용량이 늘어난다'],
      answer: 2, step: 10,
      why: '발급자는 GitHub 전체에 하나라, 조건이 없으면 누구의 저장소에서 나온 토큰이든 서명은 유효합니다. sub로 저장소와 브랜치(또는 환경)를 좁혀야 합니다. 토큰 수명이나 용량과는 관계없습니다.',
    },
    {
      q: '배포 job에 environment: production을 추가하자 Not authorized to perform sts:AssumeRoleWithWebIdentity 오류가 납니다. 먼저 의심할 것은?',
      options: ['토큰의 sub가 environment 형식으로 바뀌어 신뢰 정책의 브랜치 조건과 맞지 않는다', 'ECR 저장소가 삭제됐다', 'Trivy가 이미지를 차단했다', '러너의 디스크가 가득 찼다'],
      answer: 0, step: 11,
      why: 'environment를 쓰면 sub가 repo:소유자/저장소:environment:이름 형식이 됩니다. 정책이 ref:refs/heads/main만 허용하면 거부됩니다. 오류가 AssumeRole 단계에서 났으니 레지스트리나 스캔, 디스크는 아직 관여하지 않았습니다.',
    },
    {
      q: 'dev·stg·prod 배포 파이프라인이 환경마다 docker build를 따로 돌리고, 빌드 인자로 API 주소를 넣습니다. 가장 먼저 바꿀 것은?',
      options: ['빌드를 더 빠른 러너에서 돌린다', '세 빌드를 동시에 돌린다', '이미지는 한 번만 빌드하고 API 주소는 실행 시점에 ConfigMap으로 주입해 같은 다이제스트를 승격한다', 'prod만 다시 빌드하고 dev·stg는 latest를 쓴다'],
      answer: 2, step: 12,
      why: '환경마다 빌드하면 stg에서 검증한 바이트와 prod의 바이트가 다릅니다. 환경 값을 이미지 밖으로 빼야 같은 이미지를 승격할 수 있습니다. 속도나 병렬화는 이 문제를 해결하지 못합니다.',
    },
    {
      q: '어제 널리 쓰이는 압축 라이브러리의 심각한 취약점이 발표됐습니다. 운영 중인 이미지 200개 중 영향받는 것을 가장 빨리 찾는 방법은?',
      options: ['200개 이미지를 모두 다시 빌드한다', '빌드 때 만들어 둔 SBOM에서 해당 패키지와 버전을 검색한다', '개발자들에게 메일로 물어본다', '서명을 다시 검증한다'],
      answer: 1, step: 13,
      why: 'SBOM은 이미지별 구성품 목록이라 검색만으로 영향 범위를 찾습니다. 재빌드는 무엇이 영향받았는지 알려 주지 않고, 서명은 출처를 증명할 뿐 내용물 목록이 아닙니다.',
    },
    {
      q: '클러스터가 "우리 파이프라인에서 만든 이미지만" 실행하게 하고 싶습니다. 알맞은 조합은?',
      options: ['태그에 서명하고, 사람이 배포 전에 눈으로 확인한다', '다이제스트에 cosign으로 서명하고, 클러스터 어드미션 정책이 서명자를 검증하게 한다', '레지스트리를 비공개로 만든다', 'latest 태그 사용을 금지한다'],
      answer: 1, step: 13,
      why: '서명은 다이제스트에 해야 태그가 옮겨져도 의미가 유지되고, 어드미션 정책이 실행 시점에 강제해야 예외가 없습니다. 비공개 레지스트리나 태그 규칙은 누가 만들었는지를 증명하지 못합니다.',
    },
    {
      q: 'GitHub Actions에서 AWS·Azure·GCP·NCP 네 레지스트리로 같은 이미지를 푸시합니다. 키 관리 부담을 가장 줄이는 구성은?',
      options: ['네 클라우드 모두 장기 액세스 키를 Secrets에 넣는다', '각 클라우드에서 따로 빌드한다', 'NCP만 쓰고 나머지는 포기한다', 'AWS·Azure·GCP는 OIDC 페더레이션으로 인증하고, NCP는 전용 서브 계정의 최소 권한 키를 주기적으로 교체한다'],
      answer: 3, step: 14,
      why: 'OIDC 페더레이션을 지원하는 곳은 장기 키를 없애고, 그렇지 않은 곳만 최소 권한 키를 엄격히 관리하는 것이 현실적인 최선입니다. 클라우드마다 따로 빌드하면 다이제스트가 달라져 승격의 의미가 사라집니다.',
    },
  ],
};
