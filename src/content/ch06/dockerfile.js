export default {
  id: 'dockerfile',
  learn: [
    'Dockerfile 명령: FROM · COPY · RUN · CMD',
    '캐시를 살리는 순서: 의존성 파일 먼저',
    '.dockerignore로 비밀과 군더더기 막기',
    '멀티스테이지 빌드로 결과물만 담기',
    '작은 베이스 이미지와 non-root USER',
  ],
  legend: [['build', '빌드 · 복사'], ['bad', '들어가면 안 되는 것']],
  metrics: [
    { id: 'size', label: '이미지 크기', icon: 'hard-drive' },
    { id: 'rebuild', label: '재빌드 시간', icon: 'timer' },
    { id: 'ctx', label: '빌드 컨텍스트', icon: 'folder' },
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
      app: { at: [5.8, -3.8], label: '앱 프로세스', sub: '사용자: node', icon: 'play', color: 'green' },
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
      e_run: { from: 'r1', to: 'app' },
    },
  },
  steps: [
    {
      key: '첫 Dockerfile', kind: 'problem', title: '일단 돌아가는 Dockerfile',
      body: [
        '주문 API를 이미지로 만들려고 7줄짜리 <b>Dockerfile</b>을 썼습니다. 돌아가긴 하는데 이미지는 1.1 GB, 코드 한 줄을 고칠 때마다 빌드에 3분, 앱은 root로 돕니다. 한 줄씩 읽으며 고쳐 봅시다.',
        '<code>FROM</code>은 출발점인 <b>베이스 이미지</b>를 정합니다. <code>node:20</code>은 Debian에 Node와 각종 빌드 도구까지 담은 큰 이미지예요. <code>WORKDIR</code>는 이후 명령이 실행될 디렉터리를 정합니다.',
      ],
      callout: { type: 'key', text: 'Dockerfile은 이미지를 만드는 <b>레시피</b>입니다. 위에서 아래로 한 줄씩 실행되고, 줄마다 결과가 레이어로 쌓입니다.' },
      code: { ref: 'naive', hl: [1, 2] },
      show: ['ctx', 'n1'],
      tags: [{ on: 'n1', text: 'FROM node:20', pos: 'right' }],
      metrics: { size: ['1.1 GB', 'warn'], rebuild: '약 3분', ctx: '약 400 MB', user: ['root', 'warn'] },
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
    },
    {
      key: '순서 바꾸기', kind: 'solution', title: '의존성 파일만 먼저 COPY합니다',
      body: [
        '의존성 목록인 <code>package.json</code>과 <code>package-lock.json</code>만 먼저 복사하고 <code>npm ci</code>를 돌립니다. 나머지 소스는 그 뒤에 복사해요.',
        '이제 코드를 고쳐도 3–4행의 입력은 그대로라 캐시가 살아 있습니다. 다시 실행되는 것은 5행부터예요. 의존성을 실제로 바꿨을 때만 <code>npm ci</code>가 다시 돕니다.',
      ],
      callout: { type: 'tip', text: '<code>npm ci</code>는 lock 파일에 적힌 버전 그대로 설치하므로, 언제 빌드해도 결과가 같아야 하는 이미지에 알맞습니다. pip의 <code>requirements.txt</code>, Maven의 <code>pom.xml</code>도 같은 요령으로 먼저 복사합니다.' },
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
    },
    {
      key: '.dockerignore', kind: 'case', title: '사례: COPY . . 가 쓸어 담은 것들',
      body: [
        '<code>COPY . .</code>는 폴더의 <b>모든 것</b>을 복사합니다. 내 PC의 <code>node_modules</code>, <code>.git</code> 기록, DB 비밀번호가 든 <code>.env</code>까지요. 한 팀은 이렇게 만든 이미지를 공개 레지스트리에 올렸다가 비밀번호를 전부 바꿔야 했습니다.',
        '맥에서 설치한 <code>node_modules</code>가 이미지 안의 Linux용 모듈을 덮어써서 "빌드는 되는데 실행하면 죽는" 일도 흔합니다. <code>.dockerignore</code>에 적은 경로는 빌드 컨텍스트에서 아예 빠집니다.',
      ],
      callout: { type: 'warn', text: '<code>.dockerignore</code>는 <code>.gitignore</code>와 별개 파일입니다. Dockerfile을 만들 때 함께 만드세요. 로그나 문서가 바뀔 때마다 캐시가 깨지는 일도 막아 줍니다.' },
      code: { title: '.dockerignore', lang: 'text', text: 'node_modules\n.git\n.env\ndist\n*.log\nDockerfile\nREADME.md\n', hl: [1, 2, 3] },
      show: ['junk'],
      set: { v4: { state: null }, v5: { state: null }, junk: { state: 'down' } },
      tags: [
        { on: 'ctx', text: '400 MB → 2 MB', tone: 'ok', icon: 'folder' },
        { on: 'junk', text: '컨텍스트에서 제외', tone: 'ok', icon: 'ban', pos: 'right' },
      ],
      flows: [{ path: ['junk', 'ctx'], kind: 'bad', n: 2 }, { path: ['ctx', 'v1'], kind: 'build', delay: 0.6 }],
      metrics: { ctx: ['약 2 MB', 'ok'] },
      changes: [['+', '.dockerignore'], ['-', '이미지 속 .env · .git'], ['~', '컨텍스트 400 MB → 2 MB']],
    },
    {
      key: '불필요한 짐', kind: 'problem', title: '실행에 필요 없는 것이 1 GB',
      body: [
        '빌드는 빨라졌지만 이미지는 여전히 1.1 GB입니다. 안을 보면 컴파일러와 빌드 도구, TypeScript·테스트 도구 같은 <b>개발용 의존성</b>, 소스 코드 원본이 들어 있어요.',
        '운영에서 앱을 실행하는 데 필요한 것은 빌드 결과물 <code>dist/</code>와 운영용 의존성뿐입니다. 나머지는 pull을 느리게 하고, 취약점 스캔에 걸릴 패키지 수만 늘립니다.',
      ],
      callout: { type: 'key', text: '<b>빌드에 필요한 것</b>과 <b>실행에 필요한 것</b>은 다릅니다. 한 이미지에 둘 다 담을 이유가 없습니다.' },
      code: { ref: 'ordered', hl: [1, 4, 5] },
      hide: ['junk'],
      tags: [
        { on: 'v4', text: '소스 원본', tone: 'warn', pos: 'right' },
        { on: 'v3', text: '개발용 의존성 포함', tone: 'warn', pos: 'right' },
        { on: 'v1', text: '컴파일러 · 빌드 도구', tone: 'bad', pos: 'right' },
      ],
      metrics: { size: ['1.1 GB', 'bad'] },
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
    },
    {
      key: '베이스 고르기', kind: 'compare', title: '작은 베이스 이미지 고르기',
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
    },
    {
      key: 'root 금지', kind: 'case', title: '사례: root로 도는 앱',
      body: [
        '<code>USER</code>를 적지 않으면 컨테이너 안의 프로세스는 <b>root</b>로 실행됩니다. 어느 서비스는 앱의 원격 코드 실행 취약점이 뚫렸는데, 공격자가 root였던 탓에 마운트된 설정 파일을 바꾸고 도구를 설치해 피해를 키웠습니다.',
        '<code>USER node</code> 한 줄이면 그 뒤의 명령과 컨테이너 프로세스가 일반 사용자로 내려갑니다. Node 공식 이미지에는 <code>node</code> 사용자가 미리 만들어져 있어요.',
      ],
      callout: { type: 'tip', text: '<code>CMD</code>는 <code>["node", "dist/server.js"]</code>처럼 배열(exec 형식)로 쓰세요. 앱이 종료 신호(SIGTERM)를 직접 받아, <code>docker stop</code> 때 처리 중인 요청을 마무리하고 끝낼 수 있습니다.' },
      code: { ref: 'multi', hl: [16, 18] },
      hide: ['bFull', 'bSlim', 'bAlp'],
      show: ['r1', 'r2', 'r3', 'app'],
      focus: ['app'],
      tags: [
        { on: 'r3', text: 'USER node', tone: 'ok', icon: 'user', pos: 'left' },
        { on: 'app', text: 'root 아님 → 피해 축소', tone: 'ok', icon: 'shield-check' },
      ],
      flows: [{ path: ['r1', 'app'], kind: 'build' }],
      metrics: { user: ['node', 'ok'] },
      changes: [['+', 'USER node'], ['~', '실행 사용자 root → node'], ['~', 'CMD를 exec 형식으로']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 빠르게, 작게, 안전하게',
      body: [
        '<b>빠르게</b>: 잘 안 바뀌는 것을 위로. 의존성 파일을 먼저 복사해 캐시를 살립니다. <b>작게</b>: 멀티스테이지로 결과물만 담고, 작은 베이스를 고릅니다.',
        '<b>안전하게</b>: <code>.dockerignore</code>로 비밀과 군더더기를 막고, <code>USER</code>로 root를 벗어납니다. 이미지는 준비됐습니다. 다음 레슨에서는 컨테이너끼리 통신하고 데이터를 남기는 법을 봅니다.',
      ],
      code: { ref: 'multi' },
      tags: [{ on: 'r3', text: '약 250 MB', tone: 'ok', pos: 'left' }],
    },
  ],
  quiz: [
    {
      q: 'Python 앱의 Dockerfile이 "COPY . ." 다음에 "RUN pip install -r requirements.txt" 순서입니다. 코드만 고쳐도 매번 pip install이 다시 돕니다. 어떻게 고칠까요?',
      options: ['RUN pip install을 CMD로 바꾼다', 'requirements.txt만 먼저 COPY하고 pip install을 한 뒤, 나머지를 COPY한다', '베이스 이미지를 더 작은 것으로 바꾼다', 'docker build에 --no-cache 옵션을 준다'],
      answer: 1,
      why: '캐시는 바뀐 줄부터 끝까지 깨집니다. 의존성 목록만 먼저 복사하면 코드를 고쳐도 설치 레이어의 캐시가 유지됩니다. CMD로 옮기면 컨테이너를 띄울 때마다 설치하게 되고, --no-cache는 캐시를 아예 끄는 옵션입니다.',
    },
    {
      q: '멀티스테이지 Dockerfile을 빌드했습니다. 최종 이미지에 들어가는 것은?',
      options: ['모든 단계의 레이어 전부', '첫 번째 FROM 단계의 레이어', '마지막 단계의 레이어와, COPY --from으로 가져온 파일', '각 단계에서 크기가 가장 작은 레이어들'],
      answer: 2,
      why: '최종 이미지는 마지막 단계만으로 만들어집니다. 앞 단계는 빌드를 위한 작업장일 뿐이고, COPY --from으로 명시적으로 가져온 파일만 넘어옵니다. 그래서 컴파일러와 소스가 이미지에서 빠집니다.',
    },
    {
      q: '.env 파일이 이미지에 들어가지 않게 하는 가장 확실한 방법은?',
      options: ['COPY . . 다음 줄에 RUN rm .env를 추가한다', '.dockerignore에 .env를 적는다', '이미지를 프라이빗 레지스트리에만 올린다', 'EXPOSE를 지운다'],
      answer: 1,
      why: '.dockerignore에 적으면 파일이 빌드 컨텍스트에 아예 들어오지 않습니다. RUN rm은 가림막 레이어만 추가할 뿐 COPY가 만든 레이어에 파일이 남고, 프라이빗 레지스트리도 이미지를 받을 수 있는 모든 사람에게 비밀을 노출합니다.',
    },
    {
      q: 'Dockerfile 마지막 줄을 CMD 대신 "RUN node dist/server.js"로 썼습니다. 무슨 일이 생길까요?',
      options: ['컨테이너가 두 배 빨리 시작한다', 'docker build가 서버를 실행한 채 끝나지 않는다', '이미지 크기가 절반으로 준다', '아무 차이도 없다'],
      answer: 1,
      why: 'RUN은 빌드할 때 실행됩니다. 서버는 스스로 끝나지 않으므로 빌드가 그 줄에서 멈춰 있게 됩니다. 컨테이너가 시작될 때 실행할 명령은 CMD(또는 ENTRYPOINT)에 적습니다.',
    },
  ],
};
