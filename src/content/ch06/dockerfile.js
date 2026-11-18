export default {
  id: 'dockerfile',
  learn: [
    'Dockerfile 명령: FROM · COPY · RUN · CMD',
    '캐시를 살리는 순서와 빌드 출력 읽기',
    '.dockerignore로 비밀과 군더더기 막기',
    '멀티스테이지 빌드와 베이스 이미지 고르기',
    '이미지 스캔, non-root USER, 종료 신호',
  ],
  legend: [['build', '빌드 · 복사'], ['ctrl', '검사 · 신호'], ['bad', '들어가면 안 되는 것 · 강제 종료']],
  metrics: [
    { id: 'size', label: '이미지 크기', icon: 'hard-drive' },
    { id: 'rebuild', label: '재빌드 시간', icon: 'timer' },
    { id: 'ctx', label: '빌드 컨텍스트', icon: 'folder' },
    { id: 'cve', label: '심각 취약점', icon: 'shield-alert' },
    { id: 'user', label: '실행 사용자', icon: 'user' },
  ],
  codes: {
    naive: {
      title: 'Dockerfile', lang: 'dockerfile',
      text: `FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
`,
    },
    ordered: {
      title: 'Dockerfile', lang: 'dockerfile',
      text: `FROM node:20
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
`,
    },
    multi: {
      title: 'Dockerfile', lang: 'dockerfile',
      text: `# 1단계: 빌드 (도구가 다 있는 큰 이미지)
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2단계: 실행 (결과물만 담는 작은 이미지)
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
`,
    },
    buildlog: {
      title: 'terminal', lang: 'sh',
      text: `$ docker build -t shop-api:dev .
 => [internal] load build context  0.1s
 => => transferring context: 2.1MB
 => CACHED [2/6] WORKDIR /app
 => CACHED [3/6] COPY package*.json ./
 => CACHED [4/6] RUN npm ci
 => [5/6] COPY . .                  0.2s
 => [6/6] RUN npm run build         8.4s
 => exporting to image              0.6s`,
    },
    signal: {
      title: 'Dockerfile', lang: 'dockerfile',
      text: `# 나쁨: 셸 형식 → /bin/sh -c 가 PID 1
#       신호가 앱까지 전달되지 않는다
CMD npm start

# 좋음: exec 형식 → node가 PID 1
CMD ["node", "dist/server.js"]

# 신호 처리가 어려운 앱은
# docker run --init 사용`,
    },
  },
  scene: {
    nodes: {
      ctx: { kind: 'tile', at: [0.2, 1.8], label: '내 소스 폴더', icon: 'folder', color: 'sand' },
      junk: { kind: 'tile', at: [2.4, 4], label: '.env · .git', sub: 'node_modules', icon: 'file-key', color: 'red' },
      // 첫 Dockerfile이 만드는 탑
      n1: { kind: 'tile', at: [2.2, -0.2], z: 0, icon: 'hard-drive', color: 'slate' },
      n2: { kind: 'tile', at: [2.2, -0.2], z: 28, icon: 'copy', color: 'blue' },
      n3: { kind: 'tile', at: [2.2, -0.2], z: 56, icon: 'boxes', color: 'yellow' },
      n4: { kind: 'tile', at: [2.2, -0.2], z: 84, icon: 'hammer', color: 'purple' },
      // 순서를 바꾼 탑 (= 멀티스테이지의 빌드 단계)
      v1: { kind: 'tile', at: [2.2, -0.2], z: 0, icon: 'hard-drive', color: 'slate' },
      v2: { kind: 'tile', at: [2.2, -0.2], z: 28, icon: 'file-text', color: 'teal' },
      v3: { kind: 'tile', at: [2.2, -0.2], z: 56, icon: 'boxes', color: 'yellow' },
      v4: { kind: 'tile', at: [2.2, -0.2], z: 84, icon: 'copy', color: 'blue' },
      v5: { kind: 'tile', at: [2.2, -0.2], z: 112, icon: 'hammer', color: 'purple' },
      // 실행 단계 = 최종 이미지
      r1: { kind: 'tile', at: [4, -2], z: 0, icon: 'hard-drive', color: 'gray' },
      r2: { kind: 'tile', at: [4, -2], z: 28, icon: 'boxes', color: 'yellow' },
      r3: { kind: 'tile', at: [4, -2], z: 56, icon: 'package-check', color: 'green' },
      scan: { at: [6.4, -4.4], label: '스캐너', sub: 'Trivy 등', icon: 'scan', color: 'navy' },
      app: { at: [5.8, -3.8], label: '앱 프로세스', sub: '사용자: node', icon: 'play', color: 'green' },
      ops: { kind: 'client', at: [8.2, -1.4], label: 'docker stop' },
      // 베이스 이미지 비교
      bFull: { kind: 'tile', at: [1, 1], label: 'node:20', sub: '약 1.1 GB', icon: 'hard-drive', color: 'slate' },
      bSlim: { kind: 'tile', at: [2.8, -0.8], label: 'node:20-slim', sub: '약 200 MB', icon: 'hard-drive', color: 'green' },
      bAlp: { kind: 'tile', at: [4.6, -2.6], label: 'node:20-alpine', sub: '약 140 MB', icon: 'hard-drive', color: 'teal' },
    },
    edges: {
      e_cn: { from: 'ctx', to: 'n1' },
      e_cv: { from: 'ctx', to: 'v1' },
      e_junk: { from: 'junk', to: 'ctx', style: 'dashed', tone: 'bad' },
      e_from: { from: 'v1', to: 'r1' },
      e_scan: { from: 'r1', to: 'scan', style: 'dashed' },
      e_run: { from: 'r1', to: 'app' },
      e_stop: { from: 'ops', to: 'app', style: 'dashed' },
    },
  },
  steps: [
    {
      key: '첫 Dockerfile', kind: 'problem', title: '일단 돌아가는 Dockerfile',
      body: [
        '주문 API를 이미지로 만들려고 7줄짜리 <b>Dockerfile</b>을 썼습니다. 돌아가긴 하는데 이미지는 1.1 GB, 코드 한 줄을 고칠 때마다 빌드에 3분, 앱은 root로 돕니다. 한 줄씩 읽으며 고쳐 봅시다.',
        '<code>FROM</code>은 출발점인 <b>베이스 이미지</b>를 정합니다. <code>node:20</code>은 Debian에 Node와 각종 빌드 도구까지 담은 큰 이미지예요. <code>WORKDIR</code>는 이후 명령이 실행될 디렉터리를 정합니다.',
      ],
      callout: { type: 'key', text: 'Dockerfile은 이미지를 만드는 <b>레시피</b>입니다. 위에서 아래로 한 줄씩 실행되고, 파일을 바꾸는 줄마다 결과가 레이어로 쌓입니다.' },
      code: { ref: 'naive', hl: [1, 2] },
      show: ['ctx', 'n1'],
      tags: [{ on: 'n1', text: 'FROM node:20', pos: 'right' }],
      metrics: { size: ['1.1 GB', 'warn'], rebuild: '약 3분', ctx: '약 400 MB', cve: ['모름', 'warn'], user: ['root', 'warn'] },
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '# 마지막 . 은 "이 폴더를 빌드 컨텍스트로"\n$ docker build -t shop-api:dev .\n$ docker images shop-api\nREPOSITORY  TAG  IMAGE ID      SIZE\nshop-api    dev  3b1e0c9a7f21  1.12GB\n$ docker run --rm -p 3000:3000 shop-api:dev' } },
        { title: 'FROM과 WORKDIR의 요령', list: [
          '<code>FROM node</code>처럼 태그를 생략하면 <code>latest</code>입니다. 메이저 버전(<code>node:20</code>)이나 더 구체적인 버전(<code>node:20.11-slim</code>)을 적어 언제 빌드해도 비슷한 결과가 나오게 합니다.',
          '<code>WORKDIR</code>는 폴더가 없으면 만들어 줍니다. <code>RUN cd /app</code>은 그 줄에서만 효과가 있으니 쓰지 마세요.',
          '파일 첫 줄의 <code># syntax=docker/dockerfile:1</code>은 최신 Dockerfile 문법(캐시 · 비밀 마운트 등)을 쓰겠다는 선언입니다.', '<code>docker build -f docker/Dockerfile .</code>처럼 Dockerfile 위치와 빌드 컨텍스트(<code>.</code>)는 따로 정할 수 있습니다. 컨텍스트는 COPY가 볼 수 있는 범위예요.',
        ] },
        { title: '이 레슨의 목표', body: ['끝까지 고치면 이미지는 약 250 MB, 코드 수정 뒤 재빌드는 20초 안팎, 실행 사용자는 일반 사용자가 됩니다. 각 단계에서 숫자 타일이 어떻게 변하는지 함께 보세요. 숫자 자체는 프로젝트와 버전마다 다르니 직접 재는 것이 중요합니다. 베이스 이미지는 출처가 분명한 공식 이미지나 회사가 관리하는 이미지에서 고르세요. 이름이 비슷한 낯선 이미지는 악성일 수 있습니다.'] },
      ],
    },
    {
      key: 'COPY·RUN·CMD', kind: 'concept', title: '줄마다 레이어가 한 장씩',
      body: [
        '<code>COPY . .</code>는 내 폴더(<b>빌드 컨텍스트</b>)의 파일을 이미지 안으로 복사합니다. <code>RUN</code>은 <b>빌드할 때</b> 명령을 실행하고 그 결과를 레이어로 남깁니다.',
        '<code>CMD</code>는 다릅니다. 빌드 때는 아무것도 실행하지 않고, <b>컨테이너가 시작될 때</b> 실행할 명령을 적어 둘 뿐이에요. <code>EXPOSE</code>도 "이 포트를 쓴다"는 메모일 뿐 실제로 포트를 열지는 않습니다.',
      ],
      callout: { type: 'tip', text: '<code>RUN</code>은 이미지를 만드는 시점, <code>CMD</code>는 컨테이너를 띄우는 시점입니다. 둘을 헷갈리면 "빌드는 됐는데 실행이 안 돼요"가 시작됩니다.' },
      code: { ref: 'naive', hl: [3, 4, 5, 7] },
      show: ['n2', 'n3', 'n4'],
      tags: [
        { on: 'n4', text: 'RUN npm run build', tone: 'accent', pos: 'right' },
        { on: 'n3', text: 'RUN npm install', tone: 'warn', pos: 'right' },
        { on: 'n2', text: 'COPY . .', tone: 'info', pos: 'right' },
        { on: 'n1', text: 'FROM node:20', pos: 'right' },
      ],
      flows: [{ path: ['ctx', 'n1'], kind: 'build', n: 3 }],
      changes: [['+', 'COPY · RUN마다 레이어 1장'], ['~', 'CMD · EXPOSE는 메모 (레이어 없음)']],
      more: [
        { title: '나머지 명령들', rows: [
          ['ENV', '이미지와 컨테이너에 남는 환경 변수', 'info'],
          ['ARG', '빌드할 때만 쓰는 인자 (비밀 금지)', 'warn'],
          ['ENTRYPOINT', '고정 실행 파일, CMD는 그 인자', 'info'],
          ['ADD', 'URL · tar 자동 해제. 보통은 COPY', 'mute'],
          ['LABEL', '버전 · 소스 주소 같은 메타데이터', 'mute'],
          ['HEALTHCHECK', '상태 확인 명령 (Compose 레슨)', 'mute'],
        ] },
        { title: 'ENTRYPOINT와 CMD', body: [
          '둘 다 있으면 <code>ENTRYPOINT</code>가 실행 파일, <code>CMD</code>가 기본 인자가 됩니다. <code>docker run 이미지 인자…</code>로 준 값은 CMD를 덮어써요. 그래서 "항상 이 프로그램, 옵션은 바꿀 수 있게"라면 <code>ENTRYPOINT ["node"]</code> + <code>CMD ["dist/server.js"]</code>처럼 나눕니다. 대부분의 웹 앱은 CMD 하나면 충분합니다.',
        ] },
        { title: '흔한 실수', list: [
          '<code>ADD</code>는 로컬 tar 파일을 <b>자동으로 풀어</b> 버립니다. 의도한 게 아니라면 <code>COPY</code>를 쓰세요.',
          '<code>ARG</code>로 넘긴 값도 history에 기록될 수 있습니다. 토큰을 넘기면 안 됩니다.', '<code>EXPOSE</code>를 지워도 앱은 똑같이 동작합니다. 문서 역할이니 남겨 두되, 실제 포트는 실행할 때(<code>-p</code>) 엽니다(다음 레슨).',
        ] },
      ],
    },
    {
      key: '느린 재빌드', kind: 'problem', title: '한 줄 고칠 때마다 npm install',
      body: [
        '코드 한 줄을 고치고 다시 빌드합니다. Docker는 위에서부터 캐시를 확인하다가 <code>COPY . .</code>에서 멈춥니다. 복사할 파일이 달라졌으니 이 레이어는 새로 만들어야 해요.',
        '문제는 그다음입니다. 한 줄의 캐시가 깨지면 <b>그 뒤의 줄은 전부 다시 실행</b>됩니다. 의존성은 그대로인데 <code>npm install</code>이 매번 처음부터 돌고, 3분이 사라집니다.',
      ],
      callout: { type: 'key', text: '캐시 규칙은 단순합니다. <b>바뀐 줄부터 끝까지 다시 실행</b>. 그러니 잘 안 바뀌는 것은 위로, 자주 바뀌는 것은 아래로 보내야 합니다.' },
      code: { ref: 'naive', hl: [3, 4] },
      set: { n2: { state: 'hot' }, n3: { state: 'hot' }, n4: { state: 'hot' } },
      tags: [
        { on: 'n4', text: '다시 빌드', tone: 'bad', pos: 'right' },
        { on: 'n3', text: '다시 npm install', tone: 'bad', pos: 'right' },
        { on: 'n2', text: '코드 수정 → 변경', tone: 'warn', pos: 'right' },
        { on: 'n1', text: '캐시', tone: 'ok', icon: 'check', pos: 'right' },
      ],
      flows: [{ path: ['ctx', 'n1'], kind: 'build' }],
      metrics: { rebuild: ['약 3분', 'bad'] },
      more: [
        { title: '캐시 판단 다시 보기', list: [
          '<code>COPY</code>는 복사할 파일들의 <b>내용</b>을 봅니다. 폴더 안 아무 파일(README, 테스트, 로그)이나 바뀌어도 <code>COPY . .</code>의 캐시는 깨집니다.',
          '<code>RUN</code>은 <b>명령 문자열</b>만 봅니다. 같은 문자열이면 인터넷의 패키지가 새로 나와도 캐시를 씁니다.', '캐시는 빌드를 돌린 <b>그 머신</b>에 쌓입니다. 동료 PC나 새 CI 러너에서는 처음부터 다시 빌드할 수 있어요.',
        ] },
        { title: '흔한 실수', body: [
          '<code>RUN apt-get update</code>와 <code>RUN apt-get install -y curl</code>을 두 줄로 나누면, update 줄은 캐시에 갇혀 몇 달 전 목록을 쓰고 install은 존재하지 않는 버전을 찾다가 실패할 수 있습니다. 항상 한 줄로 묶습니다.',
        ], code: { title: 'Dockerfile', lang: 'dockerfile', text: 'RUN apt-get update \\\n && apt-get install -y --no-install-recommends curl \\\n && rm -rf /var/lib/apt/lists/*' } },
        { title: '--no-cache는 언제', body: ['캐시를 완전히 끄는 <code>docker build --no-cache</code>는 "베이스 이미지와 패키지를 최신 보안 패치로 새로 받고 싶을 때" 정기 빌드에서 씁니다. 느린 빌드를 고치는 방법이 아닙니다. 베이스까지 새로 받으려면 <code>--pull</code>도 함께 줍니다.'] },
      ],
    },
    {
      key: '순서 바꾸기', kind: 'solution', title: '의존성 파일만 먼저 COPY합니다',
      body: [
        '의존성 목록인 <code>package.json</code>과 <code>package-lock.json</code>만 먼저 복사하고 <code>npm ci</code>를 돌립니다. 나머지 소스는 그 뒤에 복사해요.',
        '이제 코드를 고쳐도 3–4행의 입력은 그대로라 캐시가 살아 있습니다. 다시 실행되는 것은 5행부터예요. 의존성을 실제로 바꿨을 때만 <code>npm ci</code>가 다시 돕니다.',
      ],
      callout: { type: 'tip', text: '<code>npm ci</code>는 lock 파일에 적힌 버전 그대로 설치하므로, 언제 빌드해도 결과가 같아야 하는 이미지에 알맞습니다.' },
      code: { ref: 'ordered', hl: [3, 4, 5] },
      hide: ['n1', 'n2', 'n3', 'n4'],
      show: ['v1', 'v2', 'v3', 'v4', 'v5'],
      set: { v4: { state: 'hot' }, v5: { state: 'hot' } },
      tags: [
        { on: 'v5', text: '다시 빌드', tone: 'warn', pos: 'right' },
        { on: 'v4', text: 'COPY . . → 변경', tone: 'warn', pos: 'right' },
        { on: 'v3', text: 'npm ci → 캐시', tone: 'ok', icon: 'check', pos: 'right' },
        { on: 'v2', text: 'package*.json 먼저', tone: 'ok', pos: 'right' },
      ],
      flows: [{ path: ['ctx', 'v1'], kind: 'build' }],
      metrics: { rebuild: ['약 20초', 'ok'] },
      changes: [['+', 'package*.json을 먼저 COPY'], ['~', 'npm install → npm ci'], ['~', '재빌드 3분 → 20초']],
      more: [
        { title: '다른 언어에서도 같은 요령', code: { title: 'Dockerfile', lang: 'dockerfile', text: '# Python\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\n\n# Go\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\n\n# Java (Maven)\nCOPY pom.xml .\nRUN mvn -q dependency:go-offline\nCOPY src ./src' } },
        { title: 'npm ci vs npm install', list: [
          '<code>npm install</code>은 <code>package.json</code>의 범위(<code>^1.2.0</code>) 안에서 새 버전을 고르고 lock 파일을 고칠 수 있습니다. 빌드할 때마다 결과가 달라질 수 있어요.',
          '<code>npm ci</code>는 lock 파일과 <code>package.json</code>이 맞지 않으면 <b>실패</b>합니다. 이미지에는 이 엄격함이 장점입니다.',
          'lock 파일이 Git에 없다면 이 요령 전체가 흔들립니다. lock 파일은 반드시 커밋합니다.',
        ] },
        { title: '흔한 실수', list: ['<code>package.json</code>만 복사하고 lock 파일을 빼먹으면 <code>npm ci</code>가 실패합니다. 두 파일을 함께 복사하세요.', '여러 패키지가 든 저장소(monorepo)에서는 각 패키지의 의존성 파일을 모두 먼저 복사해야 해서 줄이 길어집니다. 이때는 캐시 마운트(다음 다음 단계)를 함께 씁니다.', '의존성 설치 뒤 <code>COPY . .</code>가 로컬 <code>node_modules</code>로 덮어쓰지 않게 <code>.dockerignore</code>가 꼭 필요합니다(다음 단계).'] },
      ],
    },
    {
      key: '.dockerignore', kind: 'case', title: '사례: COPY . . 가 쓸어 담은 것들',
      body: [
        '<code>COPY . .</code>는 폴더의 <b>모든 것</b>을 복사합니다. 내 PC의 <code>node_modules</code>, <code>.git</code> 기록, DB 비밀번호가 든 <code>.env</code>까지요. 한 팀은 이렇게 만든 이미지를 공개 레지스트리에 올렸다가 비밀번호를 전부 바꿔야 했습니다.',
        '맥에서 설치한 <code>node_modules</code>가 이미지 안의 Linux용 모듈을 덮어써서 "빌드는 되는데 실행하면 죽는" 일도 흔합니다. <code>.dockerignore</code>에 적은 경로는 빌드 컨텍스트에서 아예 빠집니다.',
      ],
      callout: { type: 'warn', text: '<code>.dockerignore</code>는 <code>.gitignore</code>와 별개 파일입니다. Dockerfile을 만들 때 함께 만드세요. 로그나 문서가 바뀔 때마다 캐시가 깨지는 일도 막아 줍니다.' },
      code: { title: '.dockerignore', lang: 'text', text: 'node_modules\n.git\n.env\n.env.*\ndist\n*.log\nDockerfile\nREADME.md\n', hl: [1, 2, 3, 4] },
      show: ['junk'],
      set: { v4: { state: null }, v5: { state: null }, junk: { state: 'down' } },
      tags: [
        { on: 'ctx', text: '400 MB → 2 MB', tone: 'ok', icon: 'folder' },
        { on: 'junk', text: '컨텍스트에서 제외', tone: 'ok', icon: 'ban', pos: 'right' },
      ],
      flows: [{ path: ['junk', 'ctx'], kind: 'bad', n: 2 }, { path: ['ctx', 'v1'], kind: 'build', delay: 0.6 }],
      metrics: { ctx: ['약 2 MB', 'ok'] },
      changes: [['+', '.dockerignore'], ['-', '이미지 속 .env · .git'], ['~', '컨텍스트 400 MB → 2 MB']],
      more: [
        { title: '동작 원리', body: [
          '<code>docker build .</code>는 먼저 폴더 전체를 <b>빌드 컨텍스트</b>로 묶어 빌더에 넘깁니다. 원격 빌더나 CI라면 이 묶음이 네트워크를 탑니다. <code>.dockerignore</code>는 그 묶음을 만들 때 적용되므로, 거기 적힌 파일은 Dockerfile이 무엇을 하든 이미지에 들어갈 수 없습니다.',
        ] },
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: '# 전\n => [internal] load build context   41.3s\n => => transferring context: 412.7MB\n# 후\n => [internal] load build context    0.1s\n => => transferring context: 2.1MB' } },
        { title: '설정 요령', list: [
          '<code>!</code>로 예외를 둘 수 있습니다. <code>*.md</code> 다음 줄에 <code>!README.md</code>를 쓰면 README만 남아요.',
          '반대로 "필요한 것만 허용"하려면 <code>*</code>로 전부 막고 <code>!src</code>, <code>!package*.json</code>처럼 열어 주는 방식도 있습니다.', '빌드 출력의 <code>transferring context</code> 크기를 보면 컨텍스트가 큰지 바로 압니다. 수백 MB라면 대개 <code>node_modules</code>나 <code>.git</code>이 들어간 것입니다.',
          '이미 이미지에 들어간 비밀은 <code>.dockerignore</code>로 되돌릴 수 없습니다. 그 비밀은 폐기하고 새로 발급합니다(이미지 레이어 레슨).',
        ] },
      ],
    },
    {
      key: '빌드 출력', kind: 'concept', title: '빌드 출력 읽기와 캐시 마운트',
      body: [
        'BuildKit의 빌드 출력에서 <code>CACHED</code>가 붙은 줄은 캐시를 쓴 것이고, 시간이 찍힌 줄은 실제로 실행된 것입니다. 첫 실행 줄이 곧 <b>캐시가 깨진 지점</b>이에요.',
        '의존성이 바뀌어 <code>npm ci</code>가 다시 돌 때도 처음부터 내려받을 필요는 없습니다. <b>캐시 마운트</b>로 npm의 다운로드 캐시를 빌드 사이에 보관하면, 이미지에 남기지 않고 재사용합니다.',
      ],
      callout: { type: 'tip', text: '<code>RUN --mount=type=cache,target=/root/.npm npm ci</code>. 마운트한 폴더는 그 RUN 동안만 보이고 레이어에는 들어가지 않습니다.' },
      code: { ref: 'buildlog', hl: [4, 5, 6, 7] },
      hide: ['junk'],
      set: { junk: { state: null } },
      tags: [
        { on: 'v3', text: 'CACHED', tone: 'ok', icon: 'check', pos: 'right' },
        { on: 'v4', text: '여기서부터 실행', tone: 'warn', pos: 'right' },
      ],
      flows: [{ path: ['ctx', 'v1'], kind: 'build' }],
      metrics: { rebuild: ['약 10초', 'ok'] },
      changes: [['+', 'npm 다운로드 캐시 마운트'], ['~', '의존성 변경 시에도 빠르게']],
      more: [
        { title: '설정 예시', code: { title: 'Dockerfile', lang: 'dockerfile', text: '# syntax=docker/dockerfile:1\nFROM node:20 AS build\nWORKDIR /app\nCOPY package.json package-lock.json ./\nRUN --mount=type=cache,target=/root/.npm \\\n    npm ci\nCOPY . .\nRUN npm run build' } },
        { title: '출력 더 보기', list: [
          '<code>--progress=plain</code>을 주면 각 줄의 실제 출력(설치 로그 등)이 접히지 않고 다 나옵니다. 빌드 실패 원인을 볼 때 유용해요.',
          '<code>[2/6]</code>처럼 번호가 붙는 것은 단계 안의 명령 순서입니다. 멀티스테이지에서는 <code>[build 3/5]</code>처럼 단계 이름이 앞에 붙습니다.',
          '캐시 마운트는 <b>그 빌더</b>에만 남습니다. 매번 새 러너를 쓰는 CI에서는 효과가 적고, 레이어 캐시를 레지스트리에 내보내는 방법을 함께 씁니다(9장).',
        ] },
        { title: '언어별 캐시 경로', rows: [['npm', '/root/.npm', 'info'], ['pip', '/root/.cache/pip', 'info'], ['Go', '/root/.cache/go-build', 'info'], ['Maven', '/root/.m2', 'info']] },
        { title: '비밀도 마운트로', body: ['같은 방식으로 사설 레지스트리 토큰 같은 비밀을 넘깁니다. <code>RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci</code>로 쓰고 <code>docker build --secret id=npmrc,src=$HOME/.npmrc .</code>로 빌드하면, 토큰은 그 RUN 동안만 보이고 어떤 레이어에도 남지 않습니다. <code>ARG</code> · <code>ENV</code>로 넘기는 것과의 결정적인 차이예요.'] },
      ],
    },
    {
      key: '불필요한 짐', kind: 'problem', title: '실행에 필요 없는 것이 1 GB',
      body: [
        '빌드는 빨라졌지만 이미지는 여전히 1.1 GB입니다. 안을 보면 컴파일러와 빌드 도구, TypeScript·테스트 도구 같은 <b>개발용 의존성</b>, 소스 코드 원본이 들어 있어요.',
        '운영에서 앱을 실행하는 데 필요한 것은 빌드 결과물 <code>dist/</code>와 운영용 의존성뿐입니다. 나머지는 pull을 느리게 하고, 취약점 스캔에 걸릴 패키지 수만 늘립니다.',
      ],
      callout: { type: 'key', text: '<b>빌드에 필요한 것</b>과 <b>실행에 필요한 것</b>은 다릅니다. 한 이미지에 둘 다 담을 이유가 없습니다.' },
      code: { ref: 'ordered', hl: [1, 4, 5] },
      tags: [
        { on: 'v4', text: '소스 원본', tone: 'warn', pos: 'right' },
        { on: 'v3', text: '개발용 의존성 포함', tone: 'warn', pos: 'right' },
        { on: 'v1', text: '컴파일러 · 빌드 도구', tone: 'bad', pos: 'right' },
      ],
      metrics: { size: ['1.1 GB', 'bad'] },
      more: [
        { title: '직접 확인하기', code: { title: 'terminal', lang: 'sh', text: '$ docker run --rm shop-api:dev \\\n    sh -c \'which gcc make python3; du -sh node_modules\'\n/usr/bin/gcc\n/usr/bin/make\n/usr/bin/python3\n412M    node_modules\n\n$ npm ls --omit=dev --depth=0 | wc -l\n23        # 운영에 필요한 직접 의존성' } },
        { title: '왜 문제인가', list: [
          '<b>크기</b>: pull이 느려지고, 새 노드에서 컨테이너가 늦게 뜹니다.',
          '<b>공격 표면</b>: 침입자에게 컴파일러, 패키지 관리자, 셸 도구는 그대로 쓸 수 있는 연장입니다.',
          '<b>스캔 소음</b>: 실행에 쓰지도 않는 패키지의 취약점이 보고서를 채워, 정말 고쳐야 할 것이 묻힙니다.',
        ] },
        { title: '더 생각해 볼 것', body: ['"빌드한 뒤 RUN에서 도구를 지우면 되지 않을까?"라고 생각할 수 있습니다. 하지만 이전 레슨에서 봤듯 지운 파일은 아래 레이어에 남아 크기가 줄지 않습니다. 그래서 아예 <b>새 탑을 쌓는</b> 방법이 필요합니다. 빌드 단계와 실행 단계를 나누면 단계마다 베이스도 따로 고를 수 있습니다.'] },
      ],
    },
    {
      key: '멀티스테이지', kind: 'solution', title: '멀티스테이지: 짓는 곳과 사는 곳을 분리',
      body: [
        '<code>FROM</code>을 두 번 씁니다. 첫 단계(<code>AS build</code>)는 큰 이미지에서 마음껏 설치하고 빌드합니다. 둘째 단계는 작은 베이스에서 새로 시작해 <code>COPY --from=build</code>로 <b>결과물만</b> 가져옵니다.',
        '최종 이미지가 되는 것은 <b>마지막 단계뿐</b>입니다. 빌드 단계의 컴파일러와 소스는 이미지에 남지 않아요. Go나 Java처럼 컴파일하는 언어에서는 효과가 더 큽니다.',
      ],
      callout: { type: 'tip', text: '실행 단계에서는 <code>npm ci --omit=dev</code>로 운영용 의존성만 설치했습니다. 여기서도 lock 파일을 먼저 복사해 캐시를 살렸어요.' },
      code: { ref: 'multi', hl: [2, 10, 14, 15] },
      hide: ['ctx'],
      show: ['r1', 'r2', 'r3'],
      set: { v1: { state: 'dim' }, v2: { state: 'dim' }, v3: { state: 'dim' }, v4: { state: 'dim' }, v5: { state: 'dim' } },
      tags: [
        { on: 'v5', text: '빌드 단계', tone: 'mute' },
        { on: 'r3', text: 'dist만 복사', tone: 'ok', pos: 'right' },
        { on: 'r2', text: '운영 의존성만', tone: 'ok', pos: 'right' },
        { on: 'r1', text: 'node:20-slim', pos: 'right' },
      ],
      flows: [{ path: ['v1', 'r1'], kind: 'build', n: 2 }],
      metrics: { size: ['약 250 MB', 'ok'] },
      changes: [['+', '실행 단계 (FROM node:20-slim)'], ['-', '컴파일러 · 개발 의존성 · 소스'], ['~', '1.1 GB → 약 250 MB']],
      more: [
        { title: 'Go라면 더 극적으로', code: { title: 'Dockerfile', lang: 'dockerfile', text: 'FROM golang:1.22 AS build\nWORKDIR /src\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 go build -o /out/api ./cmd/api\n\nFROM gcr.io/distroless/static-debian12\nCOPY --from=build /out/api /api\nUSER nonroot\nENTRYPOINT ["/api"]' } },
        { title: '알아 두면 좋은 기능', list: [
          '<code>docker build --target build .</code>로 중간 단계까지만 빌드할 수 있습니다. 테스트 단계를 따로 두고 CI에서 그 단계만 돌리는 식으로 씁니다.',
          'BuildKit은 마지막 단계에 필요 없는 단계는 건너뜁니다. 서로 의존하지 않는 단계는 동시에 빌드해요.',
          '<code>COPY --from</code>에는 단계 이름뿐 아니라 다른 이미지 이름도 쓸 수 있습니다(예: 다른 이미지에서 실행 파일 하나만 가져오기).',
        ] },
        { title: '흔한 실수', body: ['실행 단계에서 빠뜨린 파일 때문에 컨테이너가 시작하자마자 죽는 경우가 많습니다(<code>Cannot find module</code>). 빌드 결과물이 런타임에 읽는 파일(템플릿, 마이그레이션, 정적 파일)도 함께 <code>COPY --from</code> 했는지 확인하세요.'] },
      ],
    },
    {
      key: '베이스 고르기', kind: 'concept', title: '작은 베이스 이미지 고르기',
      body: [
        '같은 Node 20이라도 베이스에 따라 크기가 크게 다릅니다. <code>node:20</code>은 도구가 다 들어 있어 빌드 단계에 좋고, <code>-slim</code>은 실행에 필요한 것만 남긴 Debian입니다.',
        '<code>-alpine</code>은 더 작지만 C 라이브러리가 glibc가 아닌 <b>musl</b>이라 네이티브 모듈이 가끔 다르게 동작합니다. 셸조차 없는 distroless 계열은 가장 단출하지만, 컨테이너에 들어가 디버깅하기가 어렵습니다.',
      ],
      callout: { type: 'key', text: '작을수록 pull이 빠르고 취약점이 줄지만 <b>호환성과 디버깅 편의</b>를 내줍니다. 잘 모르겠다면 <code>-slim</code>에서 시작하고, 크기 숫자는 버전마다 다르니 직접 재 보세요.' },
      code: { ref: 'multi', hl: [10] },
      hide: ['v1', 'v2', 'v3', 'v4', 'v5', 'r1', 'r2', 'r3'],
      show: ['bFull', 'bSlim', 'bAlp'],
      focus: ['bSlim'],
      tags: [
        { on: 'bFull', text: '빌드 단계용', tone: 'mute' },
        { on: 'bSlim', text: '무난한 기본값', tone: 'ok', icon: 'check' },
        { on: 'bAlp', text: 'musl 호환성 주의', tone: 'warn' },
      ],
      more: [
        { title: '네 가지 선택지', rows: [
          ['node:20', '빌드 도구 포함 · 빌드 단계', 'mute'],
          ['node:20-slim', 'Debian 최소 · 기본 추천', 'ok'],
          ['node:20-alpine', 'musl · 더 작음 · 호환성 확인', 'warn'],
          ['distroless', '셸 없음 · 가장 작고 단단', 'info'],
        ] },
        { title: 'musl에서 생기는 일', body: [
          '<code>bcrypt</code>, <code>sharp</code>처럼 C로 된 네이티브 모듈은 glibc용으로 미리 빌드된 바이너리를 받으려다 실패하고, 소스에서 컴파일하려고 빌드 도구를 찾기도 합니다. DNS 해석 방식 등 작은 동작 차이로 운영에서만 나는 문제도 보고됩니다. Alpine을 쓰려면 같은 Alpine 이미지에서 빌드 · 테스트까지 하세요.',
        ] },
        { title: '셸 없는 이미지 디버깅', body: ['distroless 컨테이너에는 <code>sh</code>가 없어 <code>docker exec</code>로 들어갈 수 없습니다. 도구가 든 컨테이너를 같은 namespace에 붙여 들여다봅니다.'],
          code: { title: 'terminal', lang: 'sh', text: '$ docker run --rm -it \\\n    --pid container:api --network container:api \\\n    busybox sh\n/ # ps\n/ # wget -qO- localhost:3000/health' } },
      ],
    },
    {
      key: '이미지 스캔', kind: 'compare', title: '이미지 스캔: 알려진 취약점 찾기',
      body: [
        '이미지 속 OS 패키지와 라이브러리에는 공개된 취약점(<b>CVE</b>)이 계속 발견됩니다. <b>스캐너</b>는 이미지의 패키지 목록을 취약점 데이터베이스와 대조해, 무엇을 몇 버전으로 올리면 되는지 알려 줍니다.',
        '오픈소스 Trivy 같은 도구로 CI에서 검사할 수도 있고, 각 클라우드의 레지스트리에도 스캔 기능이 있습니다. 베이스를 작게 바꾼 것만으로 보고되는 취약점 수가 크게 줄어요.',
      ],
      callout: { type: 'cloud', text: '레지스트리 스캔은 <b>올린 뒤</b>에도 새 CVE가 나오면 다시 알려 줄 수 있습니다. CI 스캔은 <b>올리기 전</b>에 막습니다. 둘은 함께 씁니다.' },
      hide: ['bFull', 'bSlim', 'bAlp'],
      show: ['r1', 'r2', 'r3', 'scan'],
      focus: ['scan'],
      tags: [{ on: 'scan', text: 'CRITICAL 4 → 0', tone: 'ok', icon: 'shield-check', pos: 'bottom' }],
      flows: [{ path: ['r1', 'scan'], kind: 'ctrl', n: 2 }],
      panel: {
        title: '레지스트리의 이미지 스캔', icon: 'scan',
        rows: [
          ['AWS', 'ECR 이미지 스캔 (Inspector)', 'aws'],
          ['Azure', 'Defender for Containers', 'azure'],
          ['GCP', 'Artifact Analysis', 'gcp'],
          ['NCP', 'CI에서 오픈소스 스캐너 병행', 'ncp'],
        ],
      },
      metrics: { cve: ['CRITICAL 0', 'ok'] },
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ trivy image --severity HIGH,CRITICAL \\\n    shop-api:dev\nshop-api:dev (debian 12.5)\nTotal: 31 (HIGH: 27, CRITICAL: 4)\n\n$ trivy image --severity HIGH,CRITICAL \\\n    --ignore-unfixed --exit-code 1 shop-api:1.0\nshop-api:1.0 (debian 12.5)\nTotal: 0 (HIGH: 0, CRITICAL: 0)' } },
        { title: '출력 읽기', list: [
          '결과 표의 <b>Installed Version</b>과 <b>Fixed Version</b>을 보세요. 고친 버전이 있으면 베이스를 올리거나 패키지를 갱신하면 됩니다.',
          '<code>--ignore-unfixed</code>는 아직 고친 버전이 없는 항목을 빼서, 지금 할 수 있는 일에 집중하게 합니다.',
          '<code>--exit-code 1</code>을 주면 기준을 넘을 때 명령이 실패해 CI가 멈춥니다.',
        ] },
        { title: '실무 팁', body: [
          '스캔은 한 번이 아니라 <b>주기</b>입니다. 코드를 안 바꿔도 베이스 이미지는 패치되니, 정기적으로 <code>--pull</code>로 다시 빌드해 새 베이스를 받습니다. 스캔 · 서명 · SBOM을 파이프라인에 넣는 방법은 9장 이미지 파이프라인 레슨에서 이어집니다.',
          '클라우드별 스캔 기능의 이름과 과금 방식은 자주 바뀝니다. 켜기 전에 각 콘솔의 현재 설명을 확인하세요.',
        ] },
      ],
    },
    {
      key: 'root 금지', kind: 'case', title: '사례: root로 도는 앱',
      body: [
        '<code>USER</code>를 적지 않으면 컨테이너 안의 프로세스는 <b>root</b>로 실행됩니다. 어느 서비스는 앱의 원격 코드 실행 취약점이 뚫렸는데, 공격자가 root였던 탓에 마운트된 설정 파일을 바꾸고 도구를 설치해 피해를 키웠습니다.',
        '<code>USER node</code> 한 줄이면 그 뒤의 명령과 컨테이너 프로세스가 일반 사용자로 내려갑니다. Node 공식 이미지에는 <code>node</code> 사용자가 미리 만들어져 있어요.',
      ],
      callout: { type: 'tip', text: '일반 사용자는 1024 아래 포트를 열 수 없습니다. 앱은 3000 · 8080처럼 높은 포트에서 듣고, 바깥의 80 · 443은 포트 매핑이나 로드밸런서가 맡깁니다.' },
      code: { ref: 'multi', hl: [16, 17] },
      hide: ['scan'],
      show: ['app'],
      focus: ['app'],
      tags: [
        { on: 'r3', text: 'USER node', tone: 'ok', icon: 'user', pos: 'left' },
        { on: 'app', text: 'root 아님 → 피해 축소', tone: 'ok', icon: 'shield-check' },
      ],
      flows: [{ path: ['r1', 'app'], kind: 'build' }],
      metrics: { user: ['node', 'ok'] },
      changes: [['+', 'USER node'], ['~', '실행 사용자 root → node']],
      more: [
        { title: '직접 확인하기', code: { title: 'terminal', lang: 'sh', text: '$ docker run --rm shop-api:1.0 id\nuid=1000(node) gid=1000(node) groups=1000(node)\n\n$ docker image inspect shop-api:1.0 \\\n    -f \'{{.Config.User}}\'\nnode' } },
        { title: '흔한 실수', list: [
          '<code>USER</code> 뒤에 <code>COPY</code>한 파일도 소유자는 root입니다. 앱이 써야 하는 폴더라면 <code>COPY --chown=node:node</code>로 복사하거나 미리 권한을 줍니다.',
          '패키지 설치(<code>apt-get</code>, <code>npm ci</code>)는 root가 필요하니, <code>USER</code>는 설치가 끝난 <b>뒤쪽</b>에 둡니다.',
          '공식 이미지에 일반 사용자가 없다면 <code>RUN useradd -r -u 10001 app</code>처럼 만들고 <b>숫자 UID</b>로 지정합니다. 쿠버네티스의 <code>runAsNonRoot</code> 검사는 숫자로 확인하기 쉽습니다.',
        ] },
        { title: '더 생각해 볼 것', body: ['이미지에서 non-root로 정해 두는 것과, 실행할 때 <code>--user</code> · <code>--cap-drop</code>을 거는 것은 서로를 보완합니다. 앞 레슨(컨테이너 vs VM)의 실행 옵션과 함께 쓰세요.'] },
      ],
    },
    {
      key: '종료 신호', kind: 'case', title: '사례: 배포할 때마다 요청이 끊깁니다',
      body: [
        '배포 때마다 <code>docker stop</code>이 꼭 10초씩 걸리고, 그 순간 처리 중이던 주문 요청이 끊겼습니다. Docker는 먼저 <b>SIGTERM</b>으로 정리할 시간을 주고, 10초 안에 끝나지 않으면 <b>SIGKILL</b>로 강제 종료합니다.',
        '원인은 <code>CMD npm start</code> 같은 셸 형식이었어요. PID 1이 된 셸이 신호를 앱에 넘기지 않아, 앱은 정리할 기회도 없이 10초 뒤 죽었습니다.',
      ],
      callout: { type: 'key', text: '<code>CMD</code>는 <b>exec 형식</b>(배열)으로 쓰고, 앱은 SIGTERM을 받으면 새 요청을 멈추고 진행 중인 것을 마친 뒤 종료하게 만듭니다.' },
      code: { ref: 'signal', hl: [3, 6, 9] },
      show: ['ops'],
      set: { app: { state: 'hot', sub: 'PID 1: sh' } },
      focus: ['app'],
      tags: [{ on: 'app', text: '10초 뒤 SIGKILL', tone: 'bad', icon: 'x' }],
      flows: [{ path: ['ops', 'app'], kind: 'ctrl' }, { path: ['ops', 'app'], kind: 'bad', delay: 1.6 }],
      changes: [['~', 'CMD 셸 형식 → exec 형식'], ['+', 'SIGTERM 처리 (graceful shutdown)']],
      more: [
        { title: '증상에서 원인까지', code: { title: 'terminal', lang: 'sh', text: '$ time docker stop api\napi\nreal    0m10.4s          # ← 기본 유예 10초를 꽉 채움\n\n$ docker inspect api -f \'{{.State.ExitCode}}\'\n137                      # SIGKILL로 끝남\n\n$ docker exec api ps\nPID   COMMAND\n  1   /bin/sh -c npm start' } },
        { title: '동작 원리', body: [
          '컨테이너의 PID 1은 특별합니다. 커널은 PID 1이 <b>직접 처리기를 등록하지 않은 신호</b>를 무시합니다. 그래서 exec 형식으로 node가 PID 1이 돼도, 코드에 SIGTERM 처리가 없으면 여전히 10초를 기다립니다. 처리기를 두거나 <code>docker run --init</code>(작은 init이 PID 1이 되어 신호를 전달)을 씁니다.',
        ] },
        { title: '앱 쪽 처리 예시', code: { title: 'server.js', lang: 'text', text: 'process.on(\'SIGTERM\', () => {\n  // 새 연결은 받지 않고, 처리 중인 요청은 마친다\n  server.close(() => process.exit(0));\n});' } },
        { title: '실무 팁', list: ['정상 처리되면 <code>docker stop</code>이 1초 안팎에 끝나고 종료 코드는 0(또는 SIGTERM에 의한 143)입니다.', '정리에 10초보다 오래 걸리는 앱은 <code>docker stop -t 30</code>처럼 유예 시간을 늘립니다. 쿠버네티스의 롤링 업데이트에서도 똑같이 중요합니다(7장).'] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 빠르게, 작게, 안전하게',
      body: [
        '<b>빠르게</b>: 잘 안 바뀌는 것을 위로. 의존성 파일을 먼저 복사하고, 캐시 마운트로 설치를 재사용합니다. <b>작게</b>: 멀티스테이지로 결과물만 담고, 작은 베이스를 고릅니다.',
        '<b>안전하게</b>: <code>.dockerignore</code>로 비밀을 막고, 스캔하고, <code>USER</code>로 root를 벗어나고, exec 형식 CMD로 신호를 받습니다. 다음 레슨에서는 컨테이너끼리 통신하고 데이터를 남기는 법을 봅니다.',
      ],
      code: { ref: 'multi' },
      hide: ['ops'],
      set: { app: { state: 'ok', sub: '사용자: node' } },
      tags: [{ on: 'r3', text: '약 250 MB', tone: 'ok', pos: 'left' }],
    },
  ],
  quiz: [
    {
      q: 'Python 앱의 Dockerfile이 "COPY . ." 다음에 "RUN pip install -r requirements.txt" 순서입니다. 코드만 고쳐도 매번 pip install이 다시 돕니다. 어떻게 고칠까요?',
      options: ['RUN pip install을 CMD로 바꾼다', '베이스 이미지를 더 작은 것으로 바꾼다', 'requirements.txt만 먼저 COPY하고 pip install을 한 뒤, 나머지를 COPY한다', 'docker build에 --no-cache 옵션을 준다'],
      answer: 2,
      step: 4,
      why: '캐시는 바뀐 줄부터 끝까지 깨집니다. 의존성 목록만 먼저 복사하면 코드를 고쳐도 설치 레이어의 캐시가 유지됩니다. CMD로 옮기면 컨테이너를 띄울 때마다 설치하게 되고, --no-cache는 캐시를 아예 끄는 옵션입니다.',
    },
    {
      q: '멀티스테이지 Dockerfile을 빌드했습니다. 최종 이미지에 들어가는 것은?',
      options: ['모든 단계의 레이어 전부', '마지막 단계의 레이어와, COPY --from으로 가져온 파일', '첫 번째 FROM 단계의 레이어', '각 단계에서 크기가 가장 작은 레이어들'],
      answer: 1,
      step: 8,
      why: '최종 이미지는 마지막 단계만으로 만들어집니다. 앞 단계는 빌드를 위한 작업장일 뿐이고, COPY --from으로 명시적으로 가져온 파일만 넘어옵니다. 그래서 컴파일러와 소스가 이미지에서 빠집니다.',
    },
    {
      q: '.env 파일이 이미지에 들어가지 않게 하는 가장 확실한 방법은?',
      options: ['.dockerignore에 .env를 적는다', 'COPY . . 다음 줄에 RUN rm .env를 추가한다', '이미지를 프라이빗 레지스트리에만 올린다', 'EXPOSE를 지운다'],
      answer: 0,
      step: 5,
      why: '.dockerignore에 적으면 파일이 빌드 컨텍스트에 아예 들어오지 않습니다. RUN rm은 가림막 레이어만 추가할 뿐 COPY가 만든 레이어에 파일이 남고, 프라이빗 레지스트리도 이미지를 받을 수 있는 모든 사람에게 비밀을 노출합니다.',
    },
    {
      q: 'Dockerfile 마지막 줄을 CMD 대신 "RUN node dist/server.js"로 썼습니다. 무슨 일이 생길까요?',
      options: ['컨테이너가 두 배 빨리 시작한다', '이미지 크기가 절반으로 준다', '아무 차이도 없다', 'docker build가 서버를 실행한 채 끝나지 않는다'],
      answer: 3,
      step: 2,
      why: 'RUN은 빌드할 때 실행됩니다. 서버는 스스로 끝나지 않으므로 빌드가 그 줄에서 멈춰 있게 됩니다. 컨테이너가 시작될 때 실행할 명령은 CMD(또는 ENTRYPOINT)에 적습니다.',
    },
    {
      q: '빌드 출력에서 [3/6]까지는 CACHED이고 [4/6] RUN npm ci부터 시간이 찍힙니다. 코드만 고쳤는데 이렇다면 가장 먼저 의심할 것은?',
      options: ['Docker 데몬의 메모리 부족', '3번째 줄의 COPY가 package*.json 외에 자주 바뀌는 파일까지 복사하고 있다', '베이스 이미지가 너무 크다', 'npm 레지스트리 장애'],
      answer: 1,
      step: 6,
      why: '첫 번째로 실행된 줄의 바로 앞 COPY가 캐시를 깼다는 뜻입니다. npm ci 직전 COPY에 소스 파일이 섞여 있으면 코드를 고칠 때마다 설치가 다시 돕니다. 의존성 파일만 복사하도록 고칩니다.',
    },
    {
      q: 'RUN apt-get update와 RUN apt-get install -y curl을 두 줄로 나눠 썼더니, 몇 달 뒤 빌드에서 install이 패키지를 찾지 못하고 실패합니다. 원인은?',
      options: ['update 줄이 캐시에 남아 오래된 패키지 목록을 쓰기 때문', 'curl 패키지가 삭제됐기 때문', '두 RUN이 서로 다른 사용자로 실행되기 때문', 'apt-get은 Docker에서 지원되지 않기 때문'],
      answer: 0,
      step: 3,
      why: 'RUN의 캐시는 명령 문자열만 봅니다. update 줄은 문자열이 같으니 캐시에서 몇 달 전 목록을 가져오고, install은 그 목록에 있던 사라진 버전을 찾다 실패합니다. update와 install을 한 RUN에 묶어야 합니다.',
    },
    {
      q: '팀이 node:20-alpine으로 베이스를 바꿨더니 bcrypt 모듈이 설치 중 실패합니다. 가장 알맞은 판단은?',
      options: ['Alpine은 Node를 지원하지 않으니 절대 쓰면 안 된다', 'Docker를 재설치한다', 'musl과 glibc 차이 때문일 수 있으니, slim으로 돌아가거나 Alpine에서 빌드 도구로 컴파일 · 테스트까지 한다', 'USER root를 추가한다'],
      answer: 2,
      step: 9,
      why: 'Alpine은 musl을 써서 glibc용 미리 빌드된 네이티브 바이너리가 맞지 않을 수 있습니다. 호환성을 확인할 여력이 없으면 slim이 무난하고, Alpine을 고집하면 같은 Alpine에서 빌드와 테스트를 해야 합니다. 권한 문제는 아닙니다.',
    },
    {
      q: 'CI에서 이미지 스캔이 CRITICAL 4건을 보고했고, 모두 베이스 OS 패키지이며 Fixed Version이 있습니다. 먼저 할 일은?',
      options: ['스캐너를 끈다', '앱 코드를 다시 작성한다', '컨테이너를 --privileged로 실행해 패치를 적용한다', '베이스 이미지를 최신 패치 버전으로 --pull 받아 다시 빌드한다'],
      answer: 3,
      step: 10,
      why: '고친 버전이 있는 OS 패키지 취약점은 대개 베이스 이미지를 새로 받아 다시 빌드하면 해결됩니다. 그래도 남으면 더 작은 베이스를 검토합니다. 실행 중인 컨테이너를 고치는 것은 다음 배포에서 사라지고, 스캐너를 끄는 것은 문제를 숨길 뿐입니다.',
    },
    {
      q: '레지스트리 스캔을 켜 두었는데, CI에서도 스캔해야 하는 이유로 가장 알맞은 것은?',
      options: ['레지스트리 스캔은 이미 올라간 뒤에 보므로, 올리기 전에 기준 미달 이미지를 막으려면 CI 스캔이 필요하다', '레지스트리 스캔은 OS 패키지를 보지 못하기 때문', 'CI 스캔이 있으면 레지스트리 스캔이 자동으로 꺼지기 때문', '이미지 크기를 줄이기 위해'],
      answer: 0,
      step: 10,
      why: 'CI 스캔은 문제가 있는 이미지가 레지스트리에 올라가 배포되기 전에 멈추고, 레지스트리 스캔은 올라간 뒤 새로 발견된 CVE를 알려 줍니다. 서로 다른 시점을 지키므로 함께 씁니다.',
    },
    {
      q: 'USER node를 추가했더니 앱이 /app/uploads에 파일을 쓰다 EACCES 오류로 실패합니다. 알맞은 해결은?',
      options: ['USER를 지우고 root로 되돌린다', '해당 폴더를 COPY --chown=node:node 등으로 node 사용자에게 쓰기 권한을 준다', '--privileged로 실행한다', 'chmod 777 /를 RUN한다'],
      answer: 1,
      step: 11,
      why: 'COPY한 파일과 폴더는 기본으로 root 소유입니다. 앱이 써야 하는 경로만 node 소유로 바꾸면 non-root를 유지할 수 있습니다. root로 돌아가거나 권한을 전부 여는 것은 USER를 쓴 이유를 없앱니다. 남아야 하는 업로드라면 볼륨이나 오브젝트 스토리지에 두는 것이 더 낫습니다.',
    },
    {
      q: 'docker stop이 항상 10초 걸리고 종료 코드가 137입니다. CMD는 셸 형식(CMD npm start)입니다. 가장 알맞은 조치는?',
      options: ['docker stop -t 0으로 바로 죽인다', '이미지를 더 작게 만든다', 'exec 형식 CMD로 앱이 PID 1이 되게 하고, 앱에서 SIGTERM을 처리하게 한다(필요하면 --init)', 'EXPOSE를 추가한다'],
      answer: 2,
      step: 12,
      why: '셸이 PID 1이면 SIGTERM이 앱에 전달되지 않아 10초 뒤 SIGKILL(137)로 끝납니다. exec 형식으로 바꾸고 SIGTERM 처리기를 두면 진행 중인 요청을 마치고 바로 종료합니다. 유예를 0으로 줄이면 요청이 더 확실하게 끊깁니다.',
    },
    {
      q: '빌드에 사설 npm 레지스트리 토큰이 필요합니다. 이미지에 토큰이 남지 않는 방법은?',
      options: ['ARG NPM_TOKEN으로 넘긴다', 'ENV NPM_TOKEN으로 넘기고 마지막에 unset한다', '.npmrc를 COPY하고 다음 줄에서 rm한다', 'RUN --mount=type=secret으로 .npmrc를 그 RUN 동안만 마운트한다'],
      answer: 3,
      step: 6,
      why: 'BuildKit의 secret 마운트는 그 RUN 동안만 파일을 보여 주고 레이어에 남기지 않습니다. ARG와 ENV는 이미지 설정이나 history에 남을 수 있고, COPY 후 rm은 가림막일 뿐이라 아래 레이어에 토큰이 남습니다.',
    },
  ],
};
