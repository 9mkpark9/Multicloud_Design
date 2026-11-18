export default {
  id: 'image-layers',
  learn: [
    '이미지가 레이어로 나뉘어 있는 이유와 읽는 법',
    'OverlayFS로 겹쳐 보기, "지워도 남는" 파일',
    '레이어 공유와 캐시: 바뀐 층만 빌드 · 전송',
    '태그 vs digest, 그리고 latest의 함정',
    '쓰기 레이어와 copy-on-write',
    '디스크 정리와 컨테이너 데이터의 수명',
  ],
  legend: [['build', '빌드'], ['data', '레이어 전송'], ['ctrl', '태그가 가리킴'], ['bad', '유출 · 낭비']],
  metrics: [
    { id: 'xfer', label: '배포 전송량', icon: 'upload' },
    { id: 'disk', label: '디스크 사용', icon: 'hard-drive' },
    { id: 'ver', label: '버전 이름', icon: 'tag' },
    { id: 'data', label: '앱 데이터', icon: 'save' },
  ],
  codes: {
    history: {
      title: 'terminal', lang: 'sh',
      text: `$ docker image history shop-api:1.4 \\
    --format '{{.Size}}\\t{{.CreatedBy}}'
0B      CMD ["node" "dist/server.js"]
5.2MB   COPY . . # buildkit
201MB   RUN npm ci # buildkit
0B      WORKDIR /app
98MB    RUN … (Node 20 설치)
0B      ENV NODE_VERSION=20.11.1
690MB   … (OS 베이스 레이어들)`,
    },
  },
  scene: {
    zones: {
      img1: { at: [1.7, -1.3], size: [2.6, 2.8], label: 'shop-api 이미지', color: 'blue' },
      img2: { at: [4.7, -4.3], size: [2.6, 2.8], label: 'pay-api 이미지', color: 'purple' },
    },
    nodes: {
      dev: { kind: 'client', at: [1, 2], label: '개발자' },
      blob: { kind: 'tile', at: [3, 0], label: '이미지 1 GB', icon: 'package', color: 'gray' },
      reg: { kind: 'cyl', at: [5, -2], label: '레지스트리', icon: 'archive', color: 'teal' },
      srv: { at: [7, -4], label: '서버', sub: '× 10대', icon: 'server', color: 'sand' },
      // shop-api 이미지의 레이어 탑 (아래 → 위)
      t1: { kind: 'tile', at: [3, 0], z: 0, icon: 'hard-drive', color: 'slate' },
      t2: { kind: 'tile', at: [3, 0], z: 28, icon: 'hexagon', color: 'green' },
      t3: { kind: 'tile', at: [3, 0], z: 56, icon: 'boxes', color: 'yellow' },
      t4: { kind: 'tile', at: [3, 0], z: 84, icon: 'file-code', color: 'blue' },
      t5: { kind: 'tile', at: [3, 0], z: 112, icon: 'ban', color: 'red' },
      view: { at: [6.2, -3.2], label: '합쳐진 뷰', sub: '.env 안 보임', icon: 'eye', color: 'teal' },
      leak: { kind: 'tile', at: [6, -1.4], label: '.env 꺼냄', icon: 'file-key', color: 'red' },
      // pay-api 이미지: 아래 두 층은 shop-api와 같다
      u1: { kind: 'tile', at: [6, -3], z: 0, icon: 'hard-drive', color: 'slate' },
      u2: { kind: 'tile', at: [6, -3], z: 28, icon: 'hexagon', color: 'green' },
      u3: { kind: 'tile', at: [6, -3], z: 56, icon: 'boxes', color: 'purple' },
      u4: { kind: 'tile', at: [6, -3], z: 84, icon: 'file-code', color: 'red' },
      // CI 서버의 디스크
      ci: { at: [3, 0], label: 'CI 서버', sub: '빌드 하루 300번', icon: 'server-cog', color: 'slate' },
      dang: { kind: 'tile', at: [5.6, -1.6], label: '<none> × 300', icon: 'layers', color: 'gray' },
      bcache: { kind: 'tile', at: [3.4, 2.6], label: '빌드 캐시 40 GB', icon: 'archive', color: 'gray' },
      // 태그와 digest
      tg14: { kind: 'tile', at: [0.3, 0.3], label: 'shop-api:1.4', icon: 'tag', color: 'sand' },
      tgl: { kind: 'tile', at: [2.3, 2.3], label: 'shop-api:latest', icon: 'tag', color: 'yellow' },
      tg15: { kind: 'tile', at: [4.3, 4.3], label: 'shop-api:1.5', icon: 'tag', color: 'sand' },
      imgA: { at: [3.1, -0.5], label: '이미지', sub: 'sha256:9f2c…', icon: 'layers', color: 'blue' },
      imgB: { at: [5.1, 1.5], label: '새 이미지', sub: 'sha256:41d7…', icon: 'layers', color: 'purple' },
      srvA: { at: [5, -2.4], label: '서버 A', sub: 'latest를 pull', icon: 'server', color: 'sand' },
      srvB: { at: [7, -0.4], label: '서버 B', sub: '오늘 pull', icon: 'server', color: 'sand' },
      // 컨테이너의 쓰기 레이어
      w1: { kind: 'tile', at: [3, 0], z: 112, icon: 'pencil', color: 'orange' },
      w2: { kind: 'tile', at: [4.8, -3.2], label: '컨테이너 2', sub: '쓰기 레이어', icon: 'pencil', color: 'orange' },
      w3: { kind: 'tile', at: [6.6, -1.4], label: '컨테이너 3', sub: '쓰기 레이어', icon: 'pencil', color: 'orange' },
    },
    edges: {
      e_b: { from: 'dev', to: 'blob' },
      e_bp: { from: 'blob', to: 'reg' },
      e_tp: { from: 't1', to: 'reg' },
      e_pull: { from: 'reg', to: 'srv' },
      e_view: { from: 't1', to: 'view' },
      e_leak: { from: 't1', to: 'leak', style: 'dashed', tone: 'bad' },
      e_share: { from: 't1', to: 'u1', bi: true, style: 'dashed', tone: 'ok', label: '공유' },
      e_dang: { from: 'ci', to: 'dang', style: 'dashed' },
      e_bc: { from: 'ci', to: 'bcache', style: 'dashed' },
      e_t14: { from: 'tg14', to: 'imgA' },
      e_la: { from: 'tgl', to: 'imgA' },
      e_lb: { from: 'tgl', to: 'imgB', off: true },
      e_t15: { from: 'tg15', to: 'imgB' },
      e_sa: { from: 'imgA', to: 'srvA' },
      e_sb: { from: 'imgB', to: 'srvB' },
      e_w2: { from: 'w2', to: 't1', style: 'dashed' },
      e_w3: { from: 'w3', to: 't1', style: 'dashed' },
    },
  },
  steps: [
    {
      key: '통짜 이미지', kind: 'problem', title: '한 줄 고쳤는데 1 GB를 다시 보냅니다',
      body: [
        '주문 API를 이미지로 만들었더니 약 1 GB입니다. OS 파일, Node 런타임, 라이브러리, 그리고 우리 코드 몇 MB가 들어 있어요.',
        '이미지가 통짜 파일 하나라면, 코드 한 줄을 고칠 때마다 1 GB를 통째로 다시 만들고, 이미지 저장소(<b>레지스트리</b>)에 올리고, 서버 10대가 각각 내려받아야 합니다. 바뀐 것은 몇 KB인데요.',
      ],
      callout: { type: 'key', text: '실제 Docker 이미지는 통짜가 아닙니다. <b>바뀐 부분만</b> 다시 만들고 옮길 수 있도록 여러 겹으로 나뉘어 있습니다.' },
      show: ['dev', 'blob', 'reg', 'srv'],
      tags: [
        { on: 'blob', text: '코드 1줄 수정', icon: 'pencil' },
        { on: 'reg', text: '1 GB 업로드', tone: 'bad', icon: 'upload' },
        { on: 'srv', text: '1 GB × 10대', tone: 'bad', icon: 'download' },
      ],
      flows: [
        { path: ['dev', 'blob'], kind: 'build' },
        { path: ['blob', 'reg'], kind: 'data', n: 5, gap: 0.22, delay: 0.8 },
        { path: ['reg', 'srv'], kind: 'data', n: 5, gap: 0.22, delay: 2 },
      ],
      metrics: { xfer: ['1 GB', 'bad'], disk: '이미지당 1 GB', ver: ':latest', data: '컨테이너 안' },
      more: [
        { title: '숫자로 보면', body: [
          '1 GB 이미지를 서버 10대에 배포하면 레지스트리에서 10 GB가 나갑니다. 하루 다섯 번 배포하면 50 GB예요. 레지스트리가 다른 리전이나 다른 클라우드에 있으면 이 전송량이 그대로 데이터 전송 요금이 됩니다.',
          '시간도 문제입니다. 서버가 새로 뜰 때(오토스케일링) 이미지를 다 받아야 컨테이너가 시작되니, 이미지 크기가 곧 <b>확장 속도</b>가 됩니다.',
        ] },
        { title: '이미지 안에는 무엇이', list: [
          '<b>OS 사용자 공간</b>: <code>/bin</code>, <code>/lib</code>, 패키지 관리자, CA 인증서. 커널은 없습니다(이전 레슨).',
          '<b>언어 런타임</b>: Node, Python, JVM.',
          '<b>의존성</b>: <code>node_modules</code>, <code>site-packages</code>.',
          '<b>우리 코드</b>와 실행 방법을 적은 <b>설정</b>(시작 명령, 환경 변수, 작업 디렉터리).',
        ] },
        { title: '더 생각해 볼 것', body: ['네 덩어리 중 자주 바뀌는 것은 맨 마지막 하나뿐입니다. 그렇다면 자주 바뀌지 않는 것을 따로 떼어 한 번만 옮기면 되지 않을까요? 이것이 레이어의 발상입니다. Git이 파일을 내용의 해시로 저장하고 바뀐 것만 주고받는 것과 닮았는데, 실제로 레이어도 내용의 해시로 이름이 붙습니다(레이어 공유 단계).'] },
      ],
    },
    {
      key: '레이어 탑', kind: 'solution', title: '이미지는 읽기 전용 레이어의 탑',
      body: [
        '이미지는 <b>레이어</b>를 차곡차곡 쌓은 탑입니다. 레이어 하나는 "바로 아래 상태에서 <b>달라진 파일들</b>"만 담은 묶음이에요. 맨 아래 OS 파일 위에 런타임, 그 위에 의존성, 맨 위에 우리 코드가 올라갑니다.',
        'Dockerfile에서 파일을 바꾸는 명령(<code>RUN</code>·<code>COPY</code>·<code>ADD</code>) 하나가 레이어 하나를 만듭니다. 한번 만들어진 레이어는 <b>읽기 전용</b>이라 다시는 바뀌지 않습니다.',
      ],
      callout: { type: 'tip', text: '레이어는 실제로 <b>tar 압축 파일</b>입니다. 그 레이어에서 추가 · 변경된 파일과 "지워짐" 표시가 들어 있어요.' },
      hide: ['dev', 'blob', 'reg', 'srv'],
      show: ['img1', 't1', 't2', 't3', 't4'],
      tags: [
        { on: 't4', text: '앱 코드 · 5 MB', tone: 'info', pos: 'right' },
        { on: 't3', text: '의존성 · 200 MB', tone: 'warn', pos: 'right' },
        { on: 't2', text: 'Node 20 · 100 MB', tone: 'ok', pos: 'right' },
        { on: 't1', text: 'OS 베이스 · 700 MB', pos: 'right' },
      ],
      changes: [['~', '통짜 1 GB → 레이어 4장'], ['+', '레이어 = 달라진 파일 묶음'], ['+', '모든 레이어는 읽기 전용']],
      more: [
        { title: '동작 원리', body: [
          '빌드는 명령마다 "직전 상태의 파일시스템에서 명령을 실행하고, 그 결과 <b>달라진 파일만</b> 묶어 새 레이어로 저장"하는 과정의 반복입니다. 이미지는 그 레이어 목록과, 시작 명령 · 환경 변수 같은 <b>설정(config)</b>을 적은 작은 JSON으로 이루어져요.',
          '<code>ENV</code>, <code>WORKDIR</code>, <code>CMD</code>, <code>EXPOSE</code>처럼 파일을 바꾸지 않는 명령은 설정만 고칩니다. 그래서 크기 0 B의 기록으로 남습니다. 레이어가 지나치게 많으면 겹쳐 보기에 부담이 생기고 저장소 드라이버마다 한도도 있지만, 보통의 Dockerfile에서는 걱정할 수준이 아닙니다. 줄 수를 억지로 줄이기보다 읽기 쉽게 쓰는 편이 낫습니다.',
        ] },
        { title: '레이어를 만드는 습관', list: [
          '같은 <code>RUN</code> 안에서 내려받고 · 풀고 · 지우면 중간 파일이 레이어에 남지 않습니다. 줄을 나누면 다운로드한 압축 파일이 아래 레이어에 그대로 남아요.',
          '<code>apt-get install</code> 뒤에는 같은 줄에서 <code>rm -rf /var/lib/apt/lists/*</code>로 패키지 목록을 지웁니다.',
          '레이어 수 자체보다 <b>레이어마다 무엇이 들어가는지</b>가 크기를 결정합니다.',
        ] },
        { title: '설정 예시', code: { title: 'Dockerfile', lang: 'dockerfile', text: '# 나쁨: tar.gz가 첫 레이어에 남는다\nRUN curl -LO https://example.com/tool.tar.gz\nRUN tar xzf tool.tar.gz && rm tool.tar.gz\n\n# 좋음: 한 레이어 안에서 받고 지운다\nRUN curl -LO https://example.com/tool.tar.gz \\\n && tar xzf tool.tar.gz \\\n && rm tool.tar.gz' } },
      ],
    },
    {
      key: '탑 읽기', kind: 'concept', title: 'history로 탑을 한 층씩 읽기',
      body: [
        '<code>docker image history</code>는 탑을 <b>위에서부터</b> 한 층씩, 그 층을 만든 명령과 크기로 보여 줍니다. 이미지가 왜 큰지 알고 싶을 때 가장 먼저 칠 명령이에요.',
        '이 이미지의 1 GB 중 690 MB가 OS 베이스입니다. 우리 코드는 5 MB뿐이에요. 크기를 줄이려면 <b>베이스와 의존성</b>을 봐야 한다는 뜻입니다.',
      ],
      callout: { type: 'tip', text: '<code>0B</code>짜리 줄은 파일을 바꾸지 않은 설정 기록입니다. <code>&lt;missing&gt;</code>은 다른 곳(베이스 이미지)에서 빌드된 층이라는 뜻일 뿐, 오류가 아닙니다.' },
      code: { ref: 'history', hl: [3, 4, 5, 9] },
      tags: [
        { on: 't4', text: '5.2 MB', tone: 'info', pos: 'right' },
        { on: 't1', text: '690 MB', tone: 'warn', pos: 'right' },
      ],
      metrics: { disk: ['1 GB 중 OS 690 MB', 'warn'] },
      more: [
        { title: '더 자세히 보기', code: { title: 'terminal', lang: 'sh', text: '$ docker image inspect shop-api:1.4 \\\n    -f \'{{json .RootFS.Layers}}\'\n["sha256:7c6b…","sha256:1f0e…",\n "sha256:a04d…","sha256:5e88…"]\n\n$ docker image inspect shop-api:1.4 \\\n    -f \'{{.Config.Cmd}} {{.Config.User}}\'\n[node dist/server.js]' } },
        { title: '출력 읽기', body: [
          '<code>RootFS.Layers</code>는 아래에서 위 순서의 레이어 목록입니다. 여기 찍히는 값은 <b>압축을 푼</b> 레이어의 해시(diff ID)이고, 레지스트리에 올라가는 것은 <b>압축된</b> 레이어의 해시라 두 값이 다릅니다. 같은 레이어를 두 이름으로 부른다고 생각하면 됩니다.',
          '<code>Config.User</code>가 비어 있으면 root로 실행된다는 뜻입니다. 이미지를 받아 쓰기 전에 확인해 볼 만한 값이에요.',
        ] },
        { title: '실무 팁', list: [
          '<code>dive</code> 같은 오픈소스 도구를 쓰면 레이어마다 어떤 파일이 추가 · 삭제됐는지 트리로 보고, 낭비된 공간을 찾아 줍니다.',
          '<code>--no-trunc</code>를 붙이면 잘린 명령 전체를 볼 수 있습니다.',
        ] },
        { title: '흔한 실수', list: ['<code>docker images</code>의 SIZE는 압축을 푼 크기, 레지스트리 화면의 크기는 압축된 크기라 숫자가 다릅니다. 둘을 섞어 비교하면 "줄었다 · 늘었다"를 잘못 판단합니다.', '크기 0B인 줄을 지워 이미지를 줄이려는 시도는 효과가 없습니다. 크기는 파일을 바꾼 줄에서만 생깁니다.', '<code>&lt;missing&gt;</code> 줄들(베이스)이 대부분이라면, 우리 Dockerfile보다 베이스를 바꾸는 것이 훨씬 효과가 큽니다(다음 레슨).'] },
      ],
    },
    {
      key: '겹쳐 보기', kind: 'concept', title: '겹쳐서 하나의 파일시스템처럼',
      body: [
        '컨테이너가 뜰 때 Docker는 레이어들을 겹쳐서 <b>하나의 디렉터리 트리</b>처럼 보여 줍니다(유니언 파일시스템, Linux에서는 <b>OverlayFS</b>). 같은 경로의 파일이 여러 층에 있으면 <b>위층이 아래층을 가립니다</b>.',
        '삭제도 마찬가지예요. 위층에서 파일을 지우면 "이 파일은 없는 셈 치라"는 <b>가림막</b>(whiteout)이 한 겹 더 쌓일 뿐, 아래층의 파일은 그대로 남습니다.',
      ],
      callout: { type: 'key', text: '컨테이너가 보는 것은 <b>합쳐진 뷰</b>입니다. 레이어 자체는 하나도 바뀌지 않아요.' },
      show: ['t5', 'view'],
      tags: [
        { on: 't5', text: 'rm .env → 가림막', tone: 'mute', icon: 'ban', pos: 'right' },
        { on: 'view', text: '/app/.env 없음', tone: 'info', icon: 'eye' },
      ],
      flows: [{ path: ['t1', 'view'], kind: 'data', n: 2 }],
      metrics: { disk: '1 GB' },
      changes: [['+', '삭제 레이어 한 장 (가림막)'], ['+', '합쳐진 뷰 = 컨테이너의 /']],
      more: [
        { title: '동작 원리', body: [
          'OverlayFS는 읽기 전용 디렉터리 여러 개(<code>lowerdir</code>)와 쓰기용 디렉터리 하나(<code>upperdir</code>)를 겹쳐 <code>merged</code>라는 하나의 디렉터리로 보여 주는 커널 기능입니다. 이미지 레이어들이 lowerdir, 컨테이너의 쓰기 레이어가 upperdir, 컨테이너의 <code>/</code>가 merged예요.',
          '파일을 찾을 때는 위에서부터 내려가며 처음 만나는 것을 씁니다. 위층에 가림막이 있으면 거기서 "없음"으로 끝나요.',
        ] },
        { title: '직접 해보기', body: ['overlay2 스토리지 드라이버를 쓰는 Linux 호스트라면, 컨테이너가 어떤 디렉터리를 겹쳐 쓰는지 볼 수 있습니다(Docker Desktop의 최신 설정처럼 containerd 이미지 저장소를 쓰면 출력이 다를 수 있어요).'],
          code: { title: 'terminal', lang: 'sh', text: '$ docker inspect web \\\n    -f \'{{json .GraphDriver.Data}}\' | jq\n{\n  "LowerDir": "/var/lib/docker/overlay2/…/diff:…",\n  "UpperDir": "/var/lib/docker/overlay2/9a1…/diff",\n  "MergedDir": "/var/lib/docker/overlay2/9a1…/merged"\n}' } },
        { title: '가림막의 모양', body: ['레이어 tar 파일 안에서 가림막은 <code>.wh.</code>로 시작하는 빈 파일입니다. <code>/app/.env</code>를 지웠다면 <code>app/.wh..env</code>가 들어가요. 디렉터리 전체를 비울 때는 <code>.wh..wh..opq</code> 표시를 씁니다. 그래서 레이어 검사 도구에서 "삭제"는 파일이 사라진 것이 아니라 가림막 파일이 하나 더 생긴 것으로 나타납니다.'] },
      ],
    },
    {
      key: '남은 비밀', kind: 'case', title: '사례: 지운 .env가 이미지에서 나왔습니다',
      body: [
        '어느 팀은 빌드 중 사설 패키지를 받으려고 토큰이 든 <code>.env</code>를 <code>COPY</code>하고, 다음 줄에서 <code>rm</code> 했습니다. 컨테이너 안에서는 안 보이니 안심했죠. 몇 달 뒤 이미지를 받은 외주 업체가 레이어를 풀어 토큰을 그대로 읽었습니다.',
        'COPY가 만든 레이어에 파일이 그대로 있었던 겁니다. 가림막은 <b>보이지 않게</b> 할 뿐 <b>지우지</b> 않습니다.',
      ],
      callout: { type: 'warn', text: '해결은 셋입니다. 유출된 토큰은 <b>즉시 폐기</b>하고, <code>.dockerignore</code>로 비밀을 컨텍스트에서 빼고, 빌드에 필요한 비밀은 레이어에 남지 않는 <b>BuildKit secret</b>으로 넘깁니다.' },
      hide: ['view'],
      show: ['leak'],
      set: { t4: { state: 'hot' } },
      tags: [
        { on: 't4', text: '.env는 여기 그대로', tone: 'bad', icon: 'file-key', pos: 'left' },
        { on: 'leak', text: 'docker save + tar', tone: 'bad', icon: 'unlock', pos: 'right' },
      ],
      flows: [{ path: ['t1', 'leak'], kind: 'bad', n: 2 }],
      changes: [['-', '토큰 유출 (레이어에 남음)'], ['~', 'rm = 가림막일 뿐']],
      more: [
        { title: '어떻게 꺼내지나', code: { title: 'terminal', lang: 'sh', text: '$ docker save shop-api:1.4 -o shop.tar\n$ mkdir x && tar -xf shop.tar -C x\n$ for l in x/blobs/sha256/*; do\n    tar -tzf "$l" 2>/dev/null \\\n      | grep -q "app/.env" && echo "$l"\n  done\nx/blobs/sha256/5e88…' } },
        { title: '출력 읽기', body: [
          '이미지를 받을 수 있는 사람은 누구나 모든 레이어를 받습니다. <code>docker save</code>는 그 레이어들을 tar로 꺼낼 뿐이고, 어느 레이어에 <code>.env</code>가 있는지 찾는 데 1분이면 충분해요. 프라이빗 레지스트리도 "받을 수 있는 사람"의 범위를 줄일 뿐입니다. 이미지를 넘겨받은 협력사, 퇴사자의 PC, 백업 사본까지 모두 같은 위험을 집니다.',
        ] },
        { title: '고친 Dockerfile', code: { title: 'Dockerfile', lang: 'dockerfile', text: '# syntax=docker/dockerfile:1\nFROM node:20-slim\nWORKDIR /app\nCOPY package*.json ./\n# 비밀은 이 RUN 동안만 파일로 보이고 레이어에 남지 않는다\nRUN --mount=type=secret,id=npmrc,target=/root/.npmrc \\\n    npm ci\n\n# 빌드: docker build --secret id=npmrc,src=$HOME/.npmrc .' } },
        { title: '흔한 실수', list: ['<code>ARG TOKEN</code>이나 <code>ENV TOKEN</code>으로 넘기는 것도 위험합니다. 값이 이미지 설정이나 history에 기록될 수 있어요.', '스캐너(Trivy 등)의 시크릿 검사로 레이어 속 키를 찾는 단계를 CI에 넣어 두면, 실수를 레지스트리에 올리기 전에 잡습니다(9장).', '<code>.git</code> 폴더도 같은 문제를 만듭니다. 지운 줄 알았던 비밀이 Git 기록에 남아 있고, <code>.git</code>째 이미지에 들어가면 기록까지 함께 퍼집니다.', 'CI 로그에 빌드 출력이 남는다면, <code>--build-arg</code>로 넘긴 값이 로그에 찍히지 않는지도 확인합니다. 스캐너가 찾아 줘도 이미 퍼진 뒤라면 늦으니, 비밀은 넣지 않는 것이 유일한 예방입니다.'] },
      ],
    },
    {
      key: '레이어 공유', kind: 'concept', title: '같은 레이어는 한 번만 저장합니다',
      body: [
        '레이어의 이름은 내용을 해시한 값(<b>digest</b>)입니다. 내용이 같으면 이름도 같으니, 어느 이미지에 속해 있든 <b>같은 레이어</b>로 취급됩니다.',
        '결제 API도 같은 베이스 이미지에서 시작했다면 OS와 Node 레이어는 주문 API와 완전히 같습니다. 디스크에는 한 벌만 저장되고 두 이미지가 함께 가리킵니다.',
      ],
      callout: { type: 'key', text: '그래서 팀의 이미지들이 <b>같은 베이스 이미지</b>를 쓰면 디스크와 전송량이 함께 줄어듭니다. 서비스마다 제각각인 베이스는 그 이점을 버리는 셈이에요.' },
      hide: ['t5', 'leak'],
      show: ['img2', 'u1', 'u2', 'u3', 'u4'],
      set: { t4: { state: null } },
      tags: [
        { on: 'u4', text: '결제 코드', tone: 'bad', pos: 'right' },
        { on: 'u3', text: '결제 의존성', tone: 'accent', pos: 'right' },
        { on: 'u2', text: '같은 Node 20', tone: 'ok', icon: 'check', pos: 'right' },
        { on: 'u1', text: '같은 OS 베이스', tone: 'ok', icon: 'check', pos: 'right' },
      ],
      metrics: { disk: ['2개에 1.2 GB', 'ok'] },
      changes: [['+', 'pay-api 이미지'], ['~', '디스크: 2 GB → 1.2 GB']],
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker system df -v | head -6\nREPOSITORY  TAG  SIZE    SHARED SIZE  UNIQUE SIZE\nshop-api    1.4  1GB     790MB        205MB\npay-api     2.1  1.01GB  790MB        215MB' } },
        { title: '출력 읽기', body: [
          '<code>SIZE</code>만 더하면 2 GB처럼 보이지만, <code>SHARED SIZE</code> 790 MB는 두 이미지가 함께 가리키는 레이어입니다. 실제 디스크 사용은 공유분 한 번 + 각자의 <code>UNIQUE SIZE</code>예요. <code>docker images</code>의 SIZE 합계로 디스크를 계산하면 크게 부풀려집니다.',
        ] },
        { title: '실무 팁', list: [
          '공유는 레이어 내용이 <b>바이트 단위로 같을 때만</b> 일어납니다. <code>node:20</code>과 <code>node:20-slim</code>은 이름이 비슷해도 레이어를 거의 공유하지 않아요.',
          '베이스 태그가 움직이면(예: 새 패치 버전) 어제 빌드한 이미지와 오늘 빌드한 이미지의 베이스가 갈립니다. 팀 공통 베이스를 정하고, 정기적으로 함께 올리는 편이 공유와 보안 패치 모두에 좋습니다.', '레지스트리 쪽에서도 공유가 일어납니다. 같은 레지스트리의 다른 저장소에 이미 있는 레이어는 다시 올리지 않고 연결만 하기도 해요(push 출력의 <code>Mounted from</code>).', '노드에 자주 쓰는 베이스 이미지를 미리 받아 두면 새 서비스를 배포할 때 받을 양이 줄어듭니다. 반대로 베이스를 바꾸는 시점에는 공유가 깨져 한 번은 전부 받아야 합니다.',
        ] },
      ],
    },
    {
      key: '레이어 캐시', kind: 'solution', title: '바뀐 층만 만들고, 바뀐 층만 옮깁니다',
      body: [
        '이제 코드 한 줄을 고치면 맨 위 레이어만 달라집니다. 빌드는 아래 세 층을 <b>캐시</b>에서 그대로 가져오고, 5 MB짜리 맨 위층만 새로 만듭니다.',
        '<code>docker push</code>와 <code>pull</code>도 레이어 단위입니다. 레지스트리와 서버는 digest를 비교해 이미 가진 레이어는 건너뛰고, 없는 것만 주고받습니다.',
      ],
      callout: { type: 'warn', text: '단, 중간 레이어가 바뀌면 <b>그 위의 레이어는 전부 다시</b> 만들어집니다. 그래서 Dockerfile에서 명령의 순서가 중요한데, 이것이 다음 레슨의 주제입니다.' },
      hide: ['img2', 'u1', 'u2', 'u3', 'u4'],
      show: ['reg', 'srv'],
      set: { t4: { state: 'hot' } },
      tags: [
        { on: 't4', text: '새로 빌드 · 5 MB', tone: 'warn', icon: 'hammer', pos: 'left' },
        { on: 't3', text: '캐시', tone: 'ok', icon: 'check', pos: 'left' },
        { on: 't2', text: '캐시', tone: 'ok', icon: 'check', pos: 'left' },
        { on: 't1', text: '캐시', tone: 'ok', icon: 'check', pos: 'left' },
        { on: 'reg', text: '없는 층만 받음', tone: 'ok' },
      ],
      flows: [{ path: ['t1', 'reg'], kind: 'data' }, { path: ['reg', 'srv'], kind: 'data', delay: 1.1 }],
      metrics: { xfer: ['5 MB', 'ok'] },
      changes: [['~', '전송량 1 GB → 5 MB'], ['~', '아래 3층은 캐시 재사용']],
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: '$ docker push reg.example.com/shop/api:1.5\n5e88d1a2b3c4: Pushed\na04d9e8f7a6b: Layer already exists\n1f0e2d3c4b5a: Layer already exists\n7c6b5a4d3e2f: Layer already exists\n1.5: digest: sha256:41d7… size: 1574\n\n$ docker pull reg.example.com/shop/api:1.5\n7c6b5a4d3e2f: Already exists\n…\n5e88d1a2b3c4: Pull complete' } },
        { title: '캐시가 맞는지 판단하는 법', list: [
          '<code>RUN</code>: 직전 레이어가 같고 <b>명령 문자열</b>이 같으면 캐시를 씁니다. 명령이 인터넷에서 무엇을 받아 오는지는 보지 않아요. 그래서 <code>apt-get update</code>가 캐시에 갇혀 오래된 목록을 쓰는 일이 생깁니다.',
          '<code>COPY</code>·<code>ADD</code>: 복사할 파일들의 <b>내용 체크섬</b>을 봅니다. 파일 수정 시각만 바뀐 것은 영향이 없습니다.',
          '한 줄이라도 캐시가 깨지면 그 아래 줄은 모두 다시 실행됩니다.',
        ] },
        { title: '실무 팁', body: ['CI 러너는 매번 새 VM이라 로컬 캐시가 없는 경우가 많습니다. BuildKit의 <code>--cache-from</code> · <code>--cache-to</code>로 캐시를 레지스트리에 저장해 두면 새 러너에서도 아래 층을 재사용합니다(9장 이미지 파이프라인).'] },
        { title: '흔한 실수', list: ['캐시가 너무 잘 돼서 패키지가 몇 달째 그대로인 경우가 있습니다. 정기 빌드에서는 <code>--pull</code>과 <code>--no-cache</code>로 베이스와 패키지를 새로 받습니다.', '빌드 시각이나 랜덤 값을 파일에 쓰는 명령이 앞쪽에 있으면, 그 아래 레이어는 매번 새로 만들어지고 digest도 매번 달라집니다. 이런 명령은 맨 뒤로 보냅니다.'] },
      ],
    },
    {
      key: '빠른 pull', kind: 'compare', title: '클라우드는 큰 이미지를 어떻게 빨리 받나',
      body: [
        '레이어 캐시는 이미 레이어를 가진 서버에서만 통합니다. 오토스케일링으로 막 뜬 <b>새 노드</b>는 디스크가 비어 있어 1 GB를 전부 받아야 컨테이너가 시작돼요.',
        '그래서 클라우드들은 레이어를 다 받기 전에 필요한 파일부터 읽어 컨테이너를 먼저 띄우는 <b>지연 로딩</b>(lazy loading)을 제공합니다. 그래도 가장 확실한 대책은 이미지를 작게 만드는 것입니다.',
      ],
      callout: { type: 'cloud', text: '어느 클라우드든 <b>같은 리전의 레지스트리</b>에서 받는 것이 기본입니다. 리전을 건너는 pull은 느리고 전송 요금도 붙습니다.' },
      set: { t4: { state: null }, srv: { sub: '새 노드', state: 'hot' } },
      tags: [{ on: 'srv', text: '전부 받아야 시작', tone: 'warn', icon: 'hourglass' }],
      flows: [{ path: ['reg', 'srv'], kind: 'data', n: 5, gap: 0.22 }],
      panel: {
        title: '큰 이미지 pull을 줄이는 기능', icon: 'download',
        rows: [
          ['AWS', 'SOCI 지연 로딩 (ECS · Fargate)', 'aws'],
          ['Azure', 'ACR 아티팩트 스트리밍 (AKS)', 'azure'],
          ['GCP', 'GKE 이미지 스트리밍', 'gcp'],
          ['NCP', '같은 리전 Container Registry', 'ncp'],
        ],
      },
      metrics: { xfer: ['새 노드는 1 GB', 'warn'] },
      more: [
        { title: '동작 원리', body: [
          '보통의 pull은 레이어 압축 파일을 끝까지 받고, 풀고, 겹친 뒤에야 컨테이너를 시작합니다. 지연 로딩은 레이어 안 파일의 위치를 적은 <b>색인</b>을 미리 만들어 두고, 컨테이너가 실제로 여는 파일만 그때그때 원격에서 읽어 옵니다. 앱이 시작할 때 이미지의 일부만 읽는 경우가 많아서 시작 시간이 크게 줄 수 있어요.',
        ] },
        { title: '클라우드별로', list: [
          '<b>AWS</b>: SOCI(Seekable OCI) 색인을 이미지 옆에 만들어 두면 ECS · Fargate가 지연 로딩합니다.',
          '<b>Azure</b>: ACR의 아티팩트 스트리밍을 켜면 AKS 노드가 스트리밍으로 이미지를 씁니다.',
          '<b>GCP</b>: GKE 이미지 스트리밍은 Artifact Registry의 이미지에 대해 동작합니다.',
          '<b>NCP</b>: 기능 이름보다 기본기가 우선입니다. NKS와 같은 리전에 Container Registry를 두고 이미지를 작게 유지하세요.',
        ] },
        { title: '실무 판단', body: ['지원 조건(리전, 노드 종류, 레지스트리)이 서비스마다 다르고 자주 바뀌니 도입 전에 각 문서를 확인하세요. 이미지 크기를 1 GB에서 200 MB로 줄이는 것은 어느 클라우드에서나, 기능 없이도 통합니다.'] },
      ],
    },
    {
      key: '디스크 가득', kind: 'case', title: '사례: CI 서버의 디스크가 가득 찼습니다',
      body: [
        '하루 수백 번 이미지를 빌드하는 CI 서버에서 어느 날 모든 빌드가 <code>no space left on device</code>로 실패했습니다. 디스크 200 GB가 꽉 차 있었어요.',
        '같은 태그로 새로 빌드할 때마다 이름표를 잃은 옛 이미지(<code>&lt;none&gt;</code>, dangling)가 남고, 빌드 캐시도 계속 쌓입니다. 레이어는 불변이라 <b>누가 지우기 전에는 사라지지 않습니다</b>.',
      ],
      callout: { type: 'tip', text: '<code>docker system df</code>로 무엇이 차지하는지 먼저 보고, <code>image prune</code> · <code>builder prune</code>을 정기 작업으로 돌립니다. 운영 서버라면 볼륨까지 지우는 옵션은 피합니다.' },
      hide: ['img1', 't1', 't2', 't3', 't4', 'reg', 'srv'],
      show: ['ci', 'dang', 'bcache'],
      set: { srv: { state: null, sub: '× 10대' }, ci: { state: 'hot', badge: '디스크 100%', tone: 'bad' } },
      tags: [
        { on: 'dang', text: '이름 잃은 옛 이미지', tone: 'warn', pos: 'right' },
        { on: 'bcache', text: '계속 쌓이는 캐시', tone: 'warn', pos: 'right' },
      ],
      flows: [{ path: ['ci', 'dang'], kind: 'bad', n: 2 }, { path: ['ci', 'bcache'], kind: 'bad', n: 2, delay: 0.5 }],
      metrics: { disk: ['CI 200 GB 가득', 'bad'] },
      changes: [['-', '모든 빌드 실패'], ['~', 'dangling 이미지 · 빌드 캐시 누적']],
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: '$ docker system df\nTYPE           TOTAL  ACTIVE  SIZE     RECLAIMABLE\nImages         412    6       131GB    127GB (96%)\nContainers     9      6       1.2GB    310MB\nLocal Volumes  14     3       8.4GB    6.1GB\nBuild Cache    2381   0       52GB     52GB' } },
        { title: '정리 명령', code: { title: 'terminal', lang: 'sh', text: '# 이름 잃은(<none>) 이미지만\n$ docker image prune -f\n# 컨테이너가 쓰지 않는 이미지 중 3일 지난 것\n$ docker image prune -a -f --filter "until=72h"\n# 빌드 캐시\n$ docker builder prune -f --filter "until=72h"' } },
        { title: '흔한 실수', list: [
          '<code>docker system prune --volumes</code>를 운영 서버에서 습관처럼 치면, 멈춰 있는 컨테이너의 볼륨 데이터까지 사라질 수 있습니다.',
          '<code>-a</code>로 전부 지우면 다음 빌드가 캐시 없이 처음부터 돌아 느려집니다. 기간 필터로 최근 것은 남기세요.', 'CI 서버는 디스크 사용률 기준으로 알림을 걸고, 정리 작업은 빌드가 적은 시간에 정기적으로 돌립니다.', '매번 새 VM에서 빌드하는 관리형 CI 러너를 쓰면 디스크 문제 자체가 사라지는 대신, 캐시를 레지스트리에 보관해야 빌드가 빨라집니다.',
          'Docker 데이터 디렉터리(<code>/var/lib/docker</code>)를 OS와 같은 작은 디스크에 두지 말고, 별도 디스크와 사용률 알림을 둡니다.', '운영 서버에도 배포가 쌓이면 옛 버전 이미지가 남습니다. 롤백에 필요한 최근 몇 개만 남기고 정리합니다. Docker Desktop을 쓰는 개발 PC도 같은 이유로 수십 GB를 차지하곤 합니다.', '<code>RECLAIMABLE</code>은 지금 지워도 되는 양의 추정치입니다. 실행 중인 컨테이너가 쓰는 이미지는 prune으로 지워지지 않습니다.',
        ] },
      ],
    },
    {
      key: '태그와 digest', kind: 'concept', title: '태그는 이름표, digest는 지문',
      body: [
        '이미지 전체에도 digest가 있습니다. <code>sha256:9f2c…</code>처럼 내용에서 계산한 <b>지문</b>이라, 같은 digest는 언제 어디서 받아도 같은 이미지입니다.',
        '<b>태그</b>는 그 digest에 사람이 붙인 <b>이름표</b>입니다. 이름표는 떼어서 다른 이미지에 다시 붙일 수 있어요. 태그를 생략하면 Docker는 <code>latest</code>라는 태그를 쓴 것으로 볼 뿐, "가장 최신"을 찾아 주지는 않습니다.',
      ],
      callout: { type: 'key', text: '<b>digest는 불변, 태그는 가변</b>입니다. <code>latest</code>는 특별한 기능이 아니라 기본값으로 쓰이는 태그 이름일 뿐입니다.' },
      hide: ['ci', 'dang', 'bcache'],
      show: ['tg14', 'tgl', 'imgA', 'srvA'],
      set: { ci: { state: null, badge: null } },
      focus: ['imgA'],
      tags: [{ on: 'imgA', text: 'digest = 내용의 지문', tone: 'info', icon: 'fingerprint' }, { on: 'tgl', text: '옮겨 붙일 수 있음', tone: 'warn', pos: 'left' }],
      flows: [{ path: ['tg14', 'imgA'], kind: 'ctrl' }, { path: ['tgl', 'imgA'], kind: 'ctrl', delay: 0.3 }, { path: ['imgA', 'srvA'], kind: 'data', delay: 1.2 }],
      metrics: { ver: '태그 → digest', disk: '정리 후 40 GB' },
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker images --digests shop-api\nREPOSITORY  TAG     DIGEST             SIZE\nshop-api    1.4     sha256:9f2c…e1a0   1GB\nshop-api    latest  sha256:9f2c…e1a0   1GB\n\n# 태그 대신 digest로 받기 · 실행하기\n$ docker pull \\\n  reg.example.com/shop/api@sha256:9f2c…e1a0' } },
        { title: 'digest의 정체', body: [
          '이미지의 digest는 레이어 목록과 설정을 적은 작은 JSON 문서인 <b>매니페스트</b>의 해시입니다. 레이어 하나라도 바뀌면 매니페스트가 바뀌고 digest도 바뀌어요. 그래서 digest로 받으면 "그때 그 이미지"가 보장됩니다.',
          '<code>node:20</code>처럼 여러 CPU용 이미지를 묶은 태그는 <b>이미지 인덱스</b>를 가리킵니다. 인덱스의 digest와 amd64용 매니페스트의 digest가 다르니, 비교할 때는 같은 종류끼리 봐야 합니다.',
        ] },
        { title: '실무 팁', list: ['<code>1.4</code>, <code>1.4.2</code>, <code>latest</code>처럼 여러 태그가 같은 digest를 가리키는 것은 정상입니다.', '공식 이미지의 <code>node:20</code> 태그는 패치 버전이 나올 때마다 새 이미지로 옮겨 갑니다. 재현이 중요한 곳에서는 <code>FROM node:20@sha256:…</code>처럼 digest로 고정하고, 갱신은 도구(Dependabot · Renovate 등)에 맡깁니다.', '쿠버네티스 매니페스트나 compose 파일에도 digest를 적을 수 있습니다. 배포 도구가 태그를 digest로 바꿔 기록해 두면 "어제 무엇이 돌았나"에 정확히 답할 수 있어요.'] },
      ],
    },
    {
      key: 'latest의 함정', kind: 'case', title: '사례: 같은 latest, 다른 이미지',
      body: [
        '운영 서버 두 대가 모두 <code>shop-api:latest</code>를 실행합니다. 서버 A는 지난달에, 새로 추가한 서버 B는 오늘 pull했어요. 그사이 <code>latest</code> 이름표는 새 빌드로 옮겨 갔습니다.',
        '같은 설정인데 두 서버가 <b>서로 다른 코드</b>를 돌립니다. 버그가 한쪽에서만 나고, "어제 버전으로 롤백"하려 해도 어제의 latest가 무엇이었는지 알 길이 없습니다.',
      ],
      callout: { type: 'tip', text: '운영에서는 <code>shop-api:1.5.0</code>이나 git 커밋 SHA처럼 <b>다시 붙이지 않는 태그</b>를 쓰고, 꼭 고정할 곳은 <code>이미지@sha256:…</code>로 digest를 지정합니다.' },
      show: ['imgB', 'tg15', 'srvB', 'e_lb'],
      hide: ['e_la'],
      set: { srvA: { sub: '지난달 pull' }, srvB: { state: 'hot' } },
      tags: [
        { on: 'srvA', text: 'latest = 9f2c…', pos: 'right' },
        { on: 'srvB', text: 'latest = 41d7…', tone: 'bad', pos: 'right' },
      ],
      flows: [{ path: ['tgl', 'imgB'], kind: 'ctrl', n: 2 }, { path: ['imgB', 'srvB'], kind: 'data', delay: 1.1 }],
      metrics: { ver: ['latest = 제각각', 'bad'] },
      changes: [['~', 'latest: 9f2c… → 41d7…'], ['-', '서버 A · B가 같은 버전이라는 보장'], ['-', '롤백할 기준']],
      more: [
        { title: '증상에서 원인까지', code: { title: 'terminal (각 서버에서)', lang: 'sh', text: '$ docker inspect api \\\n    -f \'{{.Image}}\'\nsha256:3b1e…        # 서버 A\nsha256:c94f…        # 서버 B  ← 다르다\n\n$ docker image inspect shop-api:latest \\\n    -f \'{{index .RepoDigests 0}}\'\nshop-api@sha256:41d7…' } },
        { title: '출력 읽기', body: [
          '<code>.Image</code>는 로컬 이미지 ID(설정 JSON의 해시), <code>RepoDigests</code>는 레지스트리의 digest입니다. 종류는 달라도 두 서버에서 <b>같은 종류의 값을 비교</b>하면 같은 이미지인지 바로 드러나요. 장애 대응의 첫 질문은 "모든 서버가 같은 digest인가?"입니다.',
        ] },
        { title: '재발 방지', list: [
          '배포 설정에는 유일한 태그(버전 · 커밋 SHA)를 적고, 한번 올린 태그는 다시 쓰지 않습니다(다음 다음 레슨의 태그 전략).',
          '레지스트리의 <b>태그 불변</b> 설정을 켜면 같은 태그로 덮어쓰는 push가 거부됩니다.',
          '<code>latest</code>는 "로컬에서 대충 최신을 받아 볼 때" 정도로만 씁니다.', '모든 서버가 같은 digest를 돌리는지 주기적으로 확인하는 점검이나 대시보드를 두면, 이런 차이를 장애 전에 발견합니다.',
        ] },
        { title: '흔한 실수', list: ['"롤백했다"고 생각했는데 같은 latest를 다시 pull해 새 이미지가 그대로 뜨는 경우가 있습니다. 롤백 대상은 반드시 이전 이미지의 고유 태그나 digest로 지정합니다.', '자동 업데이트 도구나 재시작 스크립트가 몰래 새 latest를 받아 버리는 일도 있습니다. 운영에서는 "언제 무엇을 받을지"를 배포 도구만 결정하게 합니다.'] },
      ],
    },
    {
      key: '쓰기 레이어', kind: 'concept', title: '컨테이너 = 이미지 + 얇은 쓰기 레이어',
      body: [
        '이미지는 읽기 전용인데 컨테이너 안에서는 파일을 만들고 고칠 수 있습니다. 컨테이너를 시작할 때 Docker가 탑 맨 위에 <b>쓰기 레이어</b>를 한 장 얹어 주기 때문입니다.',
        '아래층 파일을 고치려 하면 그 파일을 쓰기 레이어로 <b>복사한 다음</b> 고칩니다(<b>copy-on-write</b>). 같은 이미지로 컨테이너를 100개 띄워도 이미지는 한 벌이고 얇은 쓰기 레이어만 100장 생깁니다.',
      ],
      callout: { type: 'key', text: '컨테이너가 순식간에 뜨는 또 하나의 이유입니다. 1 GB를 복사하는 것이 아니라 빈 레이어 한 장만 얹으면 되니까요.' },
      hide: ['tg14', 'tgl', 'tg15', 'imgA', 'imgB', 'srvA', 'srvB'],
      show: ['img1', 't1', 't2', 't3', 't4', 'w1', 'w2', 'w3'],
      set: { srvB: { state: null } },
      tags: [
        { on: 'w1', text: '컨테이너 1 쓰기 레이어', tone: 'warn', icon: 'pencil', pos: 'left' },
        { on: 't3', text: '이미지: 읽기 전용', icon: 'lock', pos: 'left' },
      ],
      metrics: { ver: ['버전 태그 · digest', 'ok'], data: ['쓰기 레이어', 'warn'] },
      changes: [['+', '컨테이너마다 쓰기 레이어 1장'], ['~', '이미지 레이어는 모두가 공유']],
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker exec web sh -c \\\n    \'echo hi > /tmp/a; rm /app/README.md\'\n$ docker diff web\nA /tmp/a\nD /app/README.md\n\n$ docker ps -s --format \'{{.Names}} {{.Size}}\'\nweb  12.3kB (virtual 1GB)' } },
        { title: '출력 읽기', body: [
          '<code>docker diff</code>는 쓰기 레이어의 내용입니다. <code>A</code>는 추가, <code>C</code>는 변경, <code>D</code>는 삭제(가림막)예요. <code>docker ps -s</code>의 앞 숫자가 쓰기 레이어 크기, <code>virtual</code>은 이미지까지 더한 크기입니다. 컨테이너 100개의 디스크 사용은 1 GB + 앞 숫자 100개의 합입니다.',
        ] },
        { title: '흔한 실수', list: [
          'copy-on-write는 <b>파일 전체</b>를 복사합니다. 이미지 안의 큰 파일(예: DB 데이터 파일)을 조금씩 고치는 작업은 첫 쓰기마다 통째 복사가 일어나 느립니다. 쓰기가 많은 데이터는 볼륨에 둡니다.',
          '<code>docker commit</code>으로 쓰기 레이어를 이미지로 굳히는 것은 피하세요. 무엇이 들어갔는지 아무도 모르는 이미지가 됩니다. 바꿀 것은 Dockerfile에 적고 다시 빌드합니다.', '로그를 컨테이너 안 파일로 쓰면 쓰기 레이어가 계속 커져 호스트 디스크를 채웁니다. 표준 출력으로 내보내고, Docker 로그 드라이버에 크기 · 회전 설정(<code>max-size</code>)을 둡니다.', '쓰기 레이어는 컨테이너를 멈춰도(stop) 남아 있다가, 지울 때(rm) 함께 사라집니다(다음 단계).',
        ] },
      ],
    },
    {
      key: '사라진 데이터', kind: 'case', title: '사례: 컨테이너를 지우니 사진도 사라졌습니다',
      body: [
        '리뷰 사진을 컨테이너 안 <code>/app/uploads</code>에 저장하던 서비스가 있었습니다. 새 버전을 배포하면서 옛 컨테이너를 <code>docker rm</code>으로 지우고 새 이미지로 다시 띄웠더니, 그동안 쌓인 사진이 전부 사라졌습니다.',
        '사진은 그 컨테이너의 쓰기 레이어에만 있었고, 쓰기 레이어는 <b>컨테이너와 수명이 같습니다</b>. 새 컨테이너는 언제나 이미지 그대로의 깨끗한 상태에서 시작합니다.',
      ],
      callout: { type: 'warn', text: '컨테이너는 <b>언제든 버리고 새로 만드는 것</b>으로 다뤄야 합니다. 남아야 하는 데이터는 컨테이너 밖 <b>볼륨</b>에 둡니다. 볼륨은 네 번째 레슨에서 다룹니다.' },
      hide: ['w2', 'w3'],
      set: { w1: { state: 'down' } },
      focus: ['w1'],
      tags: [
        { on: 'w1', text: 'docker rm → 함께 삭제', tone: 'bad', icon: 'x', pos: 'right' },
        { on: 'w1', text: '리뷰 사진 3,000장', tone: 'bad', icon: 'image', pos: 'left' },
        { on: 't1', text: '이미지는 그대로', tone: 'ok', pos: 'right' },
      ],
      metrics: { data: ['삭제됨', 'bad'] },
      changes: [['-', '컨테이너 1의 쓰기 레이어'], ['-', '그 안의 업로드 파일 전부']],
      more: [
        { title: '수명 정리', rows: [
          ['docker stop · start', '쓰기 레이어 유지', 'ok'],
          ['docker restart', '쓰기 레이어 유지', 'ok'],
          ['docker rm', '쓰기 레이어 삭제', 'bad'],
          ['새 이미지로 교체', '새 컨테이너 = 빈 쓰기 레이어', 'bad'],
        ] },
        { title: '미리 알아채는 법', body: [
          '배포 전에 <code>docker diff</code>로 쓰기 레이어에 무엇이 쌓이는지 보면, "로그 · 업로드 · 캐시가 컨테이너 안에 쌓이고 있다"는 신호를 미리 잡을 수 있습니다. <code>--read-only</code>로 띄워 보는 것도 좋은 시험이에요. 어디에 쓰려 하는지 오류로 바로 드러납니다. 쿠버네티스에서는 Pod가 다른 노드로 옮겨질 때마다 새 컨테이너가 되므로, 이 원칙이 더 엄격하게 적용됩니다.',
        ] },
        { title: '어디에 둘까', list: [
          '<b>사용자 업로드</b>: 클라우드라면 오브젝트 스토리지(S3 · Blob Storage · Cloud Storage · NCP Object Storage)가 가장 흔한 답입니다. 서버가 여러 대여도 함께 볼 수 있어요.',
          '<b>DB 데이터</b>: 이름 있는 볼륨, 운영에서는 관리형 DB.',
          '<b>로그</b>: 파일 대신 표준 출력(stdout)으로 내보내 수집기에 맡깁니다.',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 아래는 공유하고, 위만 바뀝니다',
      body: [
        '이미지는 읽기 전용 레이어의 탑이고, 레이어는 내용의 해시로 식별됩니다. 그래서 같은 레이어는 공유되고, 빌드·push·pull은 바뀐 층만 처리합니다. 지운 파일도 아래층에 남으니 비밀은 처음부터 넣지 않고, 쌓이는 이미지는 주기적으로 정리합니다.',
        '태그는 움직이는 이름표, digest는 불변의 지문입니다. 컨테이너는 얇은 쓰기 레이어이고, 지우면 함께 사라집니다. 다음 레슨에서는 이 탑을 쌓는 설계도, <b>Dockerfile</b>을 한 줄씩 따라갑니다.',
      ],
      set: { w1: { state: null } },
      tags: [
        { on: 'w1', text: '쓰기 레이어: 지우면 끝', tone: 'warn', pos: 'right' },
        { on: 't3', text: '읽기 전용 · 공유 · 캐시', tone: 'ok', pos: 'right' },
      ],
      metrics: { data: '볼륨으로 (4강)' },
    },
  ],
  quiz: [
    {
      q: 'Dockerfile에서 COPY로 비밀키 파일을 넣고, 바로 다음 RUN에서 그 파일을 삭제했습니다. 완성된 이미지는 어떤 상태일까요?',
      options: ['삭제했으므로 이미지 어디에도 남지 않는다', '이미지 크기가 줄어들면서 해당 레이어가 통째로 사라진다', '컨테이너 안에서는 안 보이지만, 아래 레이어에 남아 있어 꺼낼 수 있다', '레지스트리에 push할 때 자동으로 걸러진다'],
      answer: 2,
      step: 5,
      why: '레이어는 읽기 전용이라 위층의 삭제는 가림막만 추가합니다. 파일은 COPY가 만든 레이어에 그대로 남고 이미지 크기도 줄지 않습니다. 비밀은 처음부터 이미지에 넣지 말고, 빌드에 필요하면 BuildKit secret으로 넘깁니다.',
    },
    {
      q: '사설 패키지 토큰이 든 이미지를 이미 외부에 공유했다는 사실을 알았습니다. 가장 먼저 할 일은?',
      options: ['토큰을 즉시 폐기(교체)한다', 'Dockerfile에 RUN rm을 추가해 다시 빌드한다', '레지스트리에서 해당 태그만 지운다', '이미지를 압축해 크기를 줄인다'],
      answer: 0,
      step: 5,
      why: '이미 받아 간 사람의 손에는 레이어가 남아 있으므로, 이미지를 고치거나 지워도 유출된 토큰은 되돌릴 수 없습니다. 토큰을 폐기하는 것이 먼저이고, 그다음 .dockerignore와 BuildKit secret으로 재발을 막습니다.',
    },
    {
      q: '서버 두 대가 모두 shop-api:latest를 실행하는데 서버 B에서만 버그가 납니다. 가장 먼저 확인할 것은?',
      options: ['서버 B의 CPU와 메모리 사양', '두 서버가 실행 중인 이미지의 digest가 같은지', '서버 B의 Docker를 재설치할지', 'Dockerfile을 처음부터 다시 빌드할지'],
      answer: 1,
      step: 11,
      why: '태그는 움직이는 이름표라 pull한 시점에 따라 같은 latest가 다른 이미지를 가리킬 수 있습니다. digest를 비교하면 두 서버가 정말 같은 이미지를 돌리는지 바로 알 수 있습니다.',
    },
    {
      q: '1 GB 이미지 하나로 컨테이너 50개를 띄웠습니다. 디스크는 대략 얼마나 쓰일까요?',
      options: ['50 GB: 컨테이너마다 이미지를 복사한다', '0 GB: 컨테이너는 메모리에서만 돈다', '25 GB: 절반은 압축된다', '1 GB + 컨테이너마다 바꾼 파일만큼'],
      answer: 3,
      step: 12,
      why: '이미지 레이어는 읽기 전용이라 모든 컨테이너가 함께 씁니다. 컨테이너마다 생기는 것은 얇은 쓰기 레이어뿐이고, 그 안에는 그 컨테이너가 만들거나 고친 파일만 들어갑니다.',
    },
    {
      q: '팀의 서비스 20개가 저마다 다른 베이스 이미지를 씁니다. 서버의 디스크와 pull 시간을 줄이는 데 가장 효과적인 것은?',
      options: ['모든 이미지에 latest 태그를 붙인다', '컨테이너를 지우지 않고 계속 재사용한다', '서비스들이 같은 베이스 이미지(같은 버전)를 쓰도록 맞춘다', '이미지를 하나의 통짜 파일로 합친다'],
      answer: 2,
      step: 6,
      why: '내용이 같은 레이어는 digest가 같아 한 번만 저장·전송됩니다. 베이스를 맞추면 아래쪽 큰 레이어가 20개 서비스에 공유됩니다. 태그 이름이나 컨테이너 재사용은 레이어 공유와 관계가 없습니다.',
    },
    {
      q: '이미지가 1.2 GB로 너무 큽니다. 무엇이 크기를 차지하는지 가장 먼저 확인하는 방법은?',
      options: ['docker image history로 레이어별 명령과 크기를 본다', 'docker ps로 실행 중인 컨테이너 수를 센다', 'docker logs로 앱 로그를 본다', '이미지를 레지스트리에 올려 크기를 다시 잰다'],
      answer: 0,
      step: 3,
      why: 'history는 레이어마다 어떤 명령이 몇 MB를 만들었는지 보여 줍니다. 대개 베이스 이미지와 의존성 설치 층이 크고, 거기서 줄일 곳이 보입니다. 컨테이너 수나 로그는 이미지 크기와 무관합니다.',
    },
    {
      q: 'RUN curl로 500 MB 압축 파일을 받고, 다음 줄 RUN에서 풀고 압축 파일을 지웠습니다. 이미지가 예상보다 500 MB 큽니다. 어떻게 고칠까요?',
      options: ['docker image prune을 실행한다', '받기 · 풀기 · 지우기를 하나의 RUN 안에서 처리한다', 'rm 대신 mv로 옮긴다', '빌드에 --no-cache를 준다'],
      answer: 1,
      step: 2,
      why: '첫 RUN이 만든 레이어에 압축 파일이 그대로 남고, 다음 줄의 삭제는 가림막일 뿐입니다. 한 RUN 안에서 처리하면 압축 파일이 어떤 레이어에도 남지 않습니다. prune은 이미 만들어진 이미지 속 레이어를 줄이지 못합니다.',
    },
    {
      q: '코드 한 줄을 고쳐 push했더니 "Layer already exists"가 세 줄, "Pushed"가 한 줄 나왔습니다. 무슨 뜻일까요?',
      options: ['push가 일부 실패해 다시 해야 한다', '레지스트리가 이미지를 압축했다', '레지스트리가 이미 가진 레이어는 건너뛰고, 바뀐 레이어 하나만 올렸다', '태그가 이미 존재해서 덮어쓰기를 거부했다'],
      answer: 2,
      step: 7,
      why: 'push는 레이어 digest를 비교해 없는 것만 올립니다. 아래 세 층은 이미 있으니 건너뛰고, 바뀐 맨 위 층만 Pushed가 됩니다. 실패나 덮어쓰기 거부라면 오류 메시지가 따로 나옵니다.',
    },
    {
      q: 'CI 서버의 빌드가 no space left on device로 실패합니다. 먼저 할 일로 가장 알맞은 것은?',
      options: ['docker system df로 이미지 · 빌드 캐시 · 볼륨 중 무엇이 차지하는지 확인한다', '즉시 docker system prune --volumes -a로 전부 지운다', '디스크를 두 배로 늘리고 끝낸다', 'Docker를 다시 설치한다'],
      answer: 0,
      step: 9,
      why: '무엇이 공간을 쓰는지 먼저 봐야 맞는 정리 명령을 고를 수 있습니다. 대개 이름 잃은 이미지와 빌드 캐시이고, 기간 필터를 둔 prune을 정기 작업으로 돌립니다. 볼륨까지 지우는 명령은 데이터를 잃을 수 있고, 디스크만 늘리면 결국 다시 찹니다.',
    },
    {
      q: '오토스케일링으로 새로 뜬 노드에서만 컨테이너 시작이 1분 넘게 걸립니다. 원인과 대책으로 가장 알맞은 것은?',
      options: ['새 노드는 CPU가 느리므로 더 큰 인스턴스를 쓴다', '레이어 캐시가 없는 새 노드는 이미지를 전부 받아야 하므로, 이미지를 줄이고 같은 리전 레지스트리 · 지연 로딩을 쓴다', 'latest 태그를 쓰면 캐시가 생긴다', '컨테이너에 쓰기 레이어를 미리 만들어 둔다'],
      answer: 1,
      step: 8,
      why: '기존 노드는 레이어를 이미 가져 빠르지만 새 노드는 빈 디스크에서 전부 받습니다. 이미지 크기를 줄이는 것이 가장 확실하고, 같은 리전 레지스트리와 클라우드의 지연 로딩 기능이 도움이 됩니다. 태그 이름이나 쓰기 레이어는 pull 시간과 무관합니다.',
    },
    {
      q: '사용자가 올린 사진을 컨테이너의 /app/uploads에 저장하고 있습니다. 새 버전 배포 전에 바꿔야 할 것은?',
      options: ['docker restart로만 배포해 쓰기 레이어를 유지한다', 'docker commit으로 컨테이너를 이미지로 저장한 뒤 배포한다', '업로드는 볼륨이나 오브젝트 스토리지처럼 컨테이너 밖에 저장한다', '이미지를 더 크게 만들어 공간을 확보한다'],
      answer: 2,
      step: 13,
      why: '쓰기 레이어는 컨테이너와 수명이 같아, 새 이미지로 교체하는 순간 사라집니다. restart만으로는 새 버전을 배포할 수 없고, commit은 무엇이 들어갔는지 모르는 이미지를 만듭니다. 남아야 하는 데이터는 처음부터 컨테이너 밖에 둡니다.',
    },
    {
      q: 'Dockerfile이 FROM node:20으로 시작합니다. 석 달 전과 오늘 같은 Dockerfile로 빌드한 이미지의 베이스가 다를 수 있는 이유는?',
      options: ['node:20 태그가 새 패치 버전이 나올 때마다 다른 이미지로 옮겨 가기 때문', 'Docker가 빌드할 때마다 베이스를 무작위로 고르기 때문', '레이어 해시가 빌드 시각에 따라 바뀌기 때문', '레지스트리가 오래된 레이어를 자동 압축하기 때문'],
      answer: 0,
      step: 10,
      why: '태그는 가변 이름표라 공식 이미지의 node:20은 패치 릴리스마다 새 digest를 가리킵니다. 재현이 중요하면 FROM node:20@sha256:…처럼 digest로 고정하고 갱신은 도구로 관리합니다.',
    },
  ],
};
