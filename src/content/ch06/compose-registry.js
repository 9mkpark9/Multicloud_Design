export default {
  id: 'compose-registry',
  learn: [
    'compose.yaml: 여러 컨테이너를 한 파일로 선언',
    'Compose가 만들어 주는 네트워크와 서비스 이름',
    'depends_on과 healthcheck로 준비 순서 맞추기',
    '레지스트리로 이미지를 push · pull',
    '태그 전략: 빌드마다 유일한 git SHA',
    '프라이빗 레지스트리 인증과 4대 클라우드',
  ],
  legend: [['ctrl', '명령'], ['req', '요청'], ['res', '응답'], ['build', '이미지 push · pull'], ['bad', '실패']],
  metrics: [
    { id: 'cmd', label: '띄우는 명령', icon: 'terminal' },
    { id: 'boot', label: '기동 순서', icon: 'steps' },
    { id: 'where', label: '이미지 위치', icon: 'archive' },
    { id: 'tag', label: '배포 태그', icon: 'tag' },
  ],
  codes: {
    manual: {
      title: '터미널', lang: 'sh',
      text: `$ docker network create shopnet
$ docker volume create pgdata
$ docker run -d --name db \\
    --network shopnet \\
    -v pgdata:/var/lib/postgresql/data \\
    -e POSTGRES_PASSWORD=secret \\
    postgres:16
$ docker run -d --name cache \\
    --network shopnet redis:7
$ docker build -t shop-web .
$ docker run -d --name web \\
    --network shopnet -p 8080:3000 \\
    -e DB_HOST=db -e REDIS_HOST=cache \\
    shop-web`,
    },
    compose: {
      title: 'compose.yaml', lang: 'yaml',
      text: `services:
  web:
    build: .
    ports:
      - "8080:3000"
    environment:
      DB_HOST: db
      REDIS_HOST: cache
    depends_on:
      - db
      - cache
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
  cache:
    image: redis:7

volumes:
  pgdata:
`,
    },
    up: {
      title: '터미널', lang: 'sh',
      text: `$ docker compose up -d
[+] Running 5/5
 ✔ Network shop_default    Created
 ✔ Volume "shop_pgdata"    Created
 ✔ Container shop-db-1     Started
 ✔ Container shop-cache-1  Started
 ✔ Container shop-web-1    Started

$ docker compose ps
$ docker compose logs -f web

# 컨테이너 · 네트워크 삭제 (볼륨은 남음)
$ docker compose down
# 볼륨까지 삭제: 데이터가 사라짐
$ docker compose down -v`,
    },
    healthy: {
      title: 'compose.yaml', lang: 'yaml',
      text: `services:
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    # ports · environment는 그대로
  db:
    image: postgres:16
    healthcheck:
      test: pg_isready -U postgres
      interval: 5s
      timeout: 3s
      retries: 5
    # environment · volumes는 그대로
  cache:
    image: redis:7
`,
    },
    ship: {
      title: '터미널', lang: 'sh',
      text: `# 내 PC: 이름 앞에 레지스트리 주소를 붙인다
$ docker tag shop-web \\
    reg.example.com/shop/web:1.0
$ docker push \\
    reg.example.com/shop/web:1.0

# 서버: 소스 없이, 받아서 실행만
$ docker pull \\
    reg.example.com/shop/web:1.0

# 서버의 compose.yaml
#   web:
#     image: reg.example.com/shop/web:1.0`,
    },
    tagging: {
      title: '터미널', lang: 'sh',
      text: `$ git rev-parse --short HEAD
a3f9c21
$ IMG=reg.example.com/shop/web

$ docker build -t $IMG:a3f9c21 .
$ docker push $IMG:a3f9c21

# 서버의 compose.yaml
#   image: …/shop/web:\${TAG}
$ TAG=a3f9c21 docker compose up -d

# 롤백 = 이전 커밋의 태그로 다시 up
$ TAG=71be0d4 docker compose up -d`,
    },
    login: {
      title: '서버의 터미널', lang: 'sh',
      text: `$ docker pull \\
    reg.example.com/shop/web:a3f9c21
Error response from daemon:
  unauthorized: authentication required

# 토큰은 인자가 아니라 표준 입력으로
$ echo "$REG_TOKEN" | docker login \\
    reg.example.com -u deploy-bot \\
    --password-stdin
Login Succeeded

# 로그인 정보가 남는 곳
$ cat ~/.docker/config.json
{ "auths": { "reg.example.com":
    { "auth": "ZGVwbG95LWJvdDp…" } } }`,
    },
  },
  scene: {
    zones: {
      net: { at: [-0.1, -0.2], size: [4.2, 5.6], label: 'shop_default 네트워크', color: 'teal' },
    },
    nodes: {
      dev: { kind: 'client', at: [-1.5, -1.5], label: '개발자' },
      file: { kind: 'tile', at: [-1.5, -1.5], label: 'compose.yaml', icon: 'file-code', color: 'teal' },
      web: { at: [2.0, 2.0], label: 'web', sub: '주문 API', icon: 'container', color: 'blue' },
      db: { kind: 'cyl', at: [3.5, 0.5], label: 'db (postgres)', icon: 'database', color: 'purple' },
      cache: { kind: 'cyl', at: [0.5, 3.5], label: 'cache (redis)', icon: 'zap', color: 'orange' },
      reg: { kind: 'cyl', at: [0.3, -3.3], label: '레지스트리', icon: 'archive', color: 'green' },
      srv: { at: [2.1, -5.1], label: '운영 서버', sub: 'pull · run', icon: 'server', color: 'slate' },
      ecr: { at: [-0.4, 4.4], label: 'ECR', sub: 'AWS', icon: 'archive', color: 'aws' },
      acr: { at: [1.2, 2.8], label: 'ACR', sub: 'Azure', icon: 'archive', color: 'azure' },
      gar: { at: [2.8, 1.2], label: 'Artifact\nRegistry', sub: 'GCP', icon: 'archive', color: 'gcp' },
      ncr: { at: [4.4, -0.4], label: 'Container\nRegistry', sub: 'NCP', icon: 'archive', color: 'ncp' },
    },
    edges: {
      e_dw: { from: 'dev', to: 'web', style: 'dashed' },
      e_dd: { from: 'dev', to: 'db', style: 'dashed' },
      e_dc: { from: 'dev', to: 'cache', style: 'dashed' },
      e_fw: { from: 'file', to: 'web', style: 'dashed' },
      e_fd: { from: 'file', to: 'db', style: 'dashed' },
      e_fc: { from: 'file', to: 'cache', style: 'dashed' },
      e_wd: { from: 'web', to: 'db', label: '5432' },
      e_wc: { from: 'web', to: 'cache', label: '6379' },
      e_push: { from: 'dev', to: 'reg', label: 'push' },
      e_pull: { from: 'reg', to: 'srv', label: 'pull' },
    },
  },
  steps: [
    {
      key: '긴 명령', kind: 'problem', title: '컨테이너 셋을 띄우는 명령 여섯 개',
      body: [
        'shop.example의 주문 API(<code>web</code>)에 PostgreSQL(<code>db</code>)과 Redis 캐시(<code>cache</code>)가 붙었습니다. 지난 레슨에서 배운 대로 네트워크와 볼륨을 만들고 <code>docker run</code>을 세 번 칩니다.',
        '옵션 하나를 빠뜨려도 오류 없이 다르게 뜹니다. <code>--network</code>를 잊으면 이름으로 못 찾고, <code>-v</code>를 잊으면 데이터가 익명 볼륨으로 가요. 새 팀원은 README를 따라 치다 한 줄을 놓치고, 띄우는 순서는 누군가의 기억 속에 있습니다.',
      ],
      callout: { type: 'key', text: '실행 방법이 <b>명령의 나열</b>로만 있으면 사람마다, 날마다 결과가 달라집니다. Dockerfile이 이미지를 파일로 적었듯 <b>실행 구성</b>도 파일로 적어야 합니다.' },
      code: { ref: 'manual', hl: [3, 4, 5, 6, 7, 11, 12, 13, 14] },
      show: ['dev', 'web', 'db', 'cache'],
      tags: [{ on: 'dev', text: '명령 6개, 순서는 기억', tone: 'warn' }],
      flows: [
        { path: ['dev', 'db'], kind: 'ctrl' },
        { path: ['dev', 'cache'], kind: 'ctrl', delay: 0.7 },
        { path: ['dev', 'web'], kind: 'ctrl', delay: 1.4 },
      ],
      metrics: { cmd: ['6개', 'warn'], boot: ['사람의 기억', 'warn'], where: '내 PC', tag: ['latest', 'warn'] },
    },
    {
      key: 'compose.yaml', kind: 'solution', title: '실행 구성을 compose.yaml 한 장에',
      body: [
        '<b>Docker Compose</b>는 여러 컨테이너의 실행 구성을 <code>compose.yaml</code> 한 파일에 적고 한꺼번에 다루는 도구입니다. 컨테이너 하나하나가 <code>services</code> 아래의 <b>서비스</b>가 되고, <code>docker run</code>의 옵션이 키로 옮겨 옵니다.',
        '<code>image</code>는 받아 쓸 이미지, <code>build: .</code>는 이 폴더의 Dockerfile로 빌드하라는 뜻입니다. <code>-p</code>는 <code>ports</code>, <code>-e</code>는 <code>environment</code>, <code>-v</code>는 <code>volumes</code>가 됐어요. 이 파일은 Git에 들어가 코드처럼 리뷰됩니다.',
      ],
      callout: { type: 'tip', text: '비밀번호는 파일에 적지 않습니다. <code>${DB_PASSWORD}</code>는 셸 환경 변수나 같은 폴더의 <code>.env</code> 파일에서 채워지니, <code>.env</code>는 <code>.gitignore</code>에 넣으세요.' },
      code: { ref: 'compose', hl: [1, 2, 3, 12, 13, 18, 19] },
      hide: ['dev'],
      show: ['file'],
      tags: [
        { on: 'web', text: 'build: .', tone: 'info' },
        { on: 'db', text: 'image: postgres:16', pos: 'bottom' },
        { on: 'cache', text: 'image: redis:7', pos: 'bottom' },
      ],
      metrics: { boot: 'depends_on' },
      changes: [['+', 'compose.yaml: 서비스 3개 선언'], ['~', 'docker run 옵션 → YAML 키'], ['-', 'README의 명령 목록']],
    },
    {
      key: 'up · down', kind: 'concept', title: 'up 한 줄이 만들어 주는 것들',
      body: [
        '<code>docker compose up -d</code> 한 줄이면 Compose가 파일을 읽고 필요한 것을 만듭니다. 먼저 프로젝트 전용 <b>네트워크</b>(<code>shop_default</code>)를 만들어 모든 서비스를 연결하므로 <b>서비스 이름이 곧 주소</b>가 됩니다. <code>DB_HOST: db</code>가 그대로 통하는 이유예요.',
        '이름 앞의 <code>shop</code>은 <b>프로젝트 이름</b>이고, 따로 정하지 않으면 폴더 이름입니다. 파일을 고친 뒤 다시 <code>up</code>하면 바뀐 서비스만 새로 만듭니다. 명령이 아니라 <b>원하는 상태</b>를 적은 파일이기 때문입니다.',
      ],
      callout: { type: 'warn', text: '<code>down</code>은 컨테이너와 네트워크를 지우고 이름 있는 볼륨은 남깁니다. <code>down -v</code>는 볼륨까지 지워요. DB 데이터가 든 환경에서 습관처럼 붙이면 안 되는 옵션입니다.' },
      code: { ref: 'up', hl: [1, 3, 4, 13, 15] },
      show: ['net'],
      tags: [
        { on: 'file', text: 'up -d 한 줄', tone: 'ok', icon: 'terminal' },
        { on: 'db', text: '주소 = 이름 db', tone: 'ok', pos: 'bottom' },
      ],
      flows: [
        { path: ['file', 'db'], kind: 'ctrl' },
        { path: ['file', 'cache'], kind: 'ctrl', delay: 0.3 },
        { path: ['file', 'web'], kind: 'ctrl', delay: 0.6 },
        { path: ['web', 'db'], kind: 'req', delay: 1.8 },
        { path: ['web', 'cache'], kind: 'req', delay: 2.0 },
      ],
      metrics: { cmd: ['1개', 'ok'] },
      changes: [['+', '네트워크 shop_default (자동)'], ['+', '볼륨 shop_pgdata'], ['~', '명령 6개 → 1개']],
    },
    {
      key: '먼저 뜬 web', kind: 'case', title: '사례: 순서는 맞는데 web이 죽습니다',
      body: [
        '새 팀원이 <code>up</code>을 했더니 web이 바로 죽었습니다. 로그에는 <code>ECONNREFUSED</code>. 파일에는 분명히 <code>depends_on</code>에 db가 있고, 실제로 db 컨테이너가 web보다 먼저 시작됐는데도요.',
        '<code>depends_on</code>의 짧은 형식은 <b>컨테이너를 시작하는 순서</b>만 정합니다. PostgreSQL은 프로세스가 뜬 뒤에도 데이터 디렉터리를 초기화하고 연결을 받기까지 몇 초가 걸려요. "시작됨"과 <b>"준비됨"</b>은 다릅니다.',
      ],
      callout: { type: 'key', text: '내 PC에서는 볼륨이 이미 초기화돼 있어 DB가 금방 준비됐을 뿐입니다. 순서 문제는 이렇게 숨어 있다가 <b>새 환경</b>에서 터집니다.' },
      code: { ref: 'compose', hl: [9, 10, 11] },
      set: {
        web: { state: 'down', badge: 'Exited (1)', tone: 'bad' },
        db: { state: 'hot' },
      },
      tags: [
        { on: 'db', text: '시작됨 ≠ 준비됨', tone: 'warn', pos: 'bottom' },
      ],
      flows: [{ path: ['web', 'db'], kind: 'bad', n: 3 }],
      metrics: { boot: ['시작 순서만', 'bad'] },
      changes: [['-', 'web: DB 연결 실패로 종료'], ['~', 'depends_on은 시작 순서만 보장']],
    },
    {
      key: 'healthcheck', kind: 'solution', title: 'healthcheck: 준비됐는지 직접 묻기',
      body: [
        '<b>healthcheck</b>는 컨테이너 안에서 주기적으로 실행해 "지금 일할 수 있는가"를 확인하는 명령입니다. <code>pg_isready</code>가 성공하면 db의 상태가 <code>starting</code>에서 <code>healthy</code>로 바뀝니다.',
        '<code>depends_on</code>을 긴 형식으로 쓰고 <code>condition: service_healthy</code>를 붙이면, Compose는 db가 healthy가 된 뒤에야 web을 시작합니다. cache처럼 금방 뜨는 것은 <code>service_started</code>로 충분해요.',
      ],
      callout: { type: 'warn', text: 'healthcheck가 풀어 주는 것은 <b>처음 띄울 때</b>의 순서뿐입니다. 운영 중에 DB가 재시작되면 web은 또 끊겨요. 앱에 <b>연결 재시도</b>가 있어야 한다는 사실은 그대로입니다.' },
      code: { ref: 'healthy', hl: [4, 5, 6, 12, 13, 14, 15, 16] },
      set: {
        web: { state: 'ok', badge: null },
        db: { state: 'ok' },
      },
      tags: [
        { on: 'db', text: 'healthy', tone: 'ok', icon: 'check', pos: 'bottom' },
        { on: 'web', text: 'healthy 뒤에 시작', tone: 'ok' },
      ],
      flows: [
        { path: ['file', 'db'], kind: 'ctrl' },
        { path: ['file', 'web'], kind: 'ctrl', delay: 1.5 },
        { path: ['web', 'db'], kind: 'req', delay: 2.4 },
        { path: ['db', 'web'], kind: 'res', delay: 3.3 },
      ],
      metrics: { boot: ['healthy 후 시작', 'ok'] },
      changes: [['+', 'db에 healthcheck'], ['~', 'depends_on: service_healthy']],
    },
    {
      key: '레지스트리', kind: 'solution', title: '한 번 빌드해 레지스트리로 나릅니다',
      body: [
        '이제 서버에 올릴 차례입니다. 서버에서 <code>build: .</code>를 다시 돌리면 될까요? 서버에 소스와 빌드 도구를 둬야 하고, 무엇보다 그렇게 나온 이미지는 내가 <b>테스트한 그 이미지가 아닙니다</b>.',
        '이미지는 <b>한 번만 빌드</b>해 <b>레지스트리</b>(이미지 저장소)에 <code>push</code>하고, 서버는 <code>pull</code>만 합니다. 이미지 이름은 <code>레지스트리 주소/저장소:태그</code> 꼴이라, 이름이 곧 어디서 받을지를 말해 줘요. 주소를 생략하면 Docker Hub입니다.',
      ],
      callout: { type: 'tip', text: '서버의 compose.yaml에는 <code>build:</code> 대신 레지스트리 주소가 붙은 <code>image:</code>를 적습니다. 개발용 파일과 운영용 파일이 갈리는 첫 지점이에요.' },
      code: { ref: 'ship', hl: [2, 3, 4, 5, 8, 9] },
      hide: ['file', 'net', 'web', 'db', 'cache'],
      show: ['dev', 'reg', 'srv'],
      set: { web: { state: null }, db: { state: null } },
      tags: [
        { on: 'dev', text: '빌드는 한 번', tone: 'info', icon: 'hammer' },
        { on: 'srv', text: '소스 없이 pull만', tone: 'ok' },
      ],
      flows: [{ path: ['dev', 'reg'], kind: 'build', n: 2 }, { path: ['reg', 'srv'], kind: 'build', n: 2, delay: 1.5 }],
      metrics: { where: ['레지스트리', 'ok'], tag: ['1.0', 'warn'] },
      changes: [['+', '레지스트리에 push'], ['~', '서버: build → pull'], ['-', '서버의 소스 · 빌드 도구']],
    },
    {
      key: '태그 전략', kind: 'concept', title: '태그는 빌드마다 유일하게: git SHA',
      body: [
        '<code>1.0</code>이라고 붙였지만, 버그를 고쳐 다시 빌드하면 또 <code>1.0</code>으로 올리고 싶어집니다. 태그는 옮겨 붙일 수 있는 이름표라서, 그 순간 서버마다 "1.0"의 내용이 달라져요. <code>latest</code>에서 본 함정과 같습니다.',
        '그래서 빌드마다 <b>유일한</b> 태그를 붙입니다. 가장 흔한 선택이 <b>git 커밋 SHA</b>예요. 떠 있는 이미지의 태그만 보면 어느 커밋인지 알 수 있고, 롤백은 이전 SHA로 다시 <code>up</code>하는 것입니다. 사람이 읽을 버전(<code>1.4.2</code>)은 같은 이미지에 덧붙이면 됩니다.',
      ],
      callout: { type: 'key', text: '원칙은 <b>한번 올린 태그는 다시 쓰지 않는다</b>입니다. 레지스트리의 태그 불변(immutable) 설정으로 덮어쓰기를 아예 막을 수 있습니다.' },
      code: { ref: 'tagging', hl: [1, 2, 5, 6, 10, 13] },
      tags: [
        { on: 'reg', text: 'web:a3f9c21', tone: 'accent', icon: 'tag', pos: 'bottom' },
        { on: 'srv', text: '커밋 a3f9c21 실행 중', tone: 'ok' },
      ],
      flows: [{ path: ['dev', 'reg'], kind: 'build' }, { path: ['reg', 'srv'], kind: 'build', delay: 1.3 }],
      metrics: { tag: ['git SHA', 'ok'] },
      changes: [['~', '태그 1.0 → a3f9c21 (커밋 SHA)'], ['+', '롤백 = 이전 SHA로 up']],
    },
    {
      key: '로그인', kind: 'case', title: '사례: 서버에 남은 관리자 로그인',
      body: [
        '회사 이미지는 아무나 받으면 안 되니 <b>프라이빗 레지스트리</b>에 둡니다. 새 서버에서 <code>pull</code>이 <code>unauthorized</code>로 실패하자, 급한 마음에 담당자가 자기 계정으로 <code>docker login</code>을 해 두었습니다.',
        '<code>docker login</code>은 자격 증명을 <code>~/.docker/config.json</code>에 저장합니다. credential helper가 없으면 <b>base64로 인코딩</b>만 한 채로요. 암호화가 아니라서 서버에 들어온 누구나 되돌려 읽을 수 있고, 그 계정은 push도 삭제도 할 수 있었습니다.',
      ],
      callout: { type: 'tip', text: '서버에는 <b>pull 전용</b>이고 <b>수명이 짧은</b> 토큰만 둡니다. 클라우드에서는 VM에 붙인 역할(IAM)로 그때그때 토큰을 받아, 서버에 비밀번호가 남지 않게 합니다.' },
      code: { ref: 'login', hl: [3, 4, 14, 15] },
      set: { srv: { state: 'hot' } },
      tags: [
        { on: 'reg', text: '프라이빗', icon: 'lock', pos: 'bottom' },
        { on: 'srv', text: 'config.json에 계정', tone: 'bad', icon: 'key' },
      ],
      flows: [{ path: ['srv', 'reg'], kind: 'req' }, { path: ['reg', 'srv'], kind: 'bad', n: 2, delay: 1.1 }],
      metrics: { where: ['프라이빗', 'ok'] },
      changes: [['-', '서버에 남은 개인 계정 로그인'], ['+', 'pull 전용 · 단기 토큰']],
    },
    {
      key: '4대 클라우드', kind: 'compare', title: '네 클라우드의 컨테이너 레지스트리',
      body: [
        '클라우드마다 관리형 레지스트리가 있고, 그 클라우드의 <b>IAM과 이어진다</b>는 점이 핵심입니다. 같은 클라우드의 VM이나 쿠버네티스 노드는 역할만 붙이면 비밀번호 없이 pull합니다.',
        '차이는 쓰는 방식에 있어요. <b>ECR</b>은 보통 이미지마다 저장소를 먼저 만들고 IAM으로 12시간짜리 토큰을 받습니다. <b>ACR</b>은 Entra ID로, <b>Artifact Registry</b>는 gcloud 자격 증명으로 로그인해요. <b>NCP Container Registry</b>는 이미지를 Object Storage 버킷에 두고 API 인증키로 로그인합니다.',
      ],
      callout: { type: 'cloud', text: '실행할 곳과 <b>같은 클라우드 · 같은 리전</b>의 레지스트리가 기본 선택입니다. pull이 빠르고 리전 밖으로 나가는 전송 요금도 줄어듭니다.' },
      hide: ['dev', 'reg', 'srv'],
      show: ['ecr', 'acr', 'gar', 'ncr'],
      set: { srv: { state: null } },
      panel: {
        title: '레지스트리에 로그인하는 방법', icon: 'key',
        rows: [
          ['AWS · ECR', 'IAM → 12시간 토큰', 'aws'],
          ['Azure · ACR', 'Entra ID · az acr login', 'azure'],
          ['GCP · Artifact Registry', 'gcloud 자격 증명', 'gcp'],
          ['NCP · Container Registry', 'API 인증키', 'ncp'],
        ],
      },
      tags: [
        { on: 'ecr', text: '저장소를 먼저 생성', tone: 'aws', pos: 'bottom' },
        { on: 'acr', text: 'AKS에 연결(attach)', tone: 'azure', pos: 'bottom' },
        { on: 'gar', text: 'gcr.io의 후속', tone: 'gcp', pos: 'bottom' },
        { on: 'ncr', text: 'Object Storage에 저장', tone: 'ncp', pos: 'bottom' },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 파일로 띄우고, 레지스트리로 나르기',
      body: [
        '<b>Compose</b>는 여러 컨테이너의 실행 구성을 한 파일에 선언합니다. 네트워크를 만들어 서비스 이름을 주소로 쓰게 해 주고, 준비 순서는 <code>healthcheck</code>와 <code>service_healthy</code>로 맞춥니다.',
        '이미지는 한 번 빌드해 <b>레지스트리</b>로 나르고, 태그는 git SHA처럼 유일하게, 서버에는 pull 전용 단기 자격만 둡니다. 다만 Compose는 <b>호스트 한 대</b>의 도구예요. 서버가 여러 대가 되고 죽은 컨테이너를 알아서 되살려야 한다면? 다음 챕터의 쿠버네티스가 그 답입니다.',
      ],
      hide: ['ecr', 'acr', 'gar', 'ncr'],
      show: ['dev', 'net', 'web', 'db', 'cache', 'reg', 'srv'],
      tags: [
        { on: 'web', text: 'compose up 한 줄', icon: 'terminal', pos: 'bottom' },
        { on: 'srv', text: 'web:a3f9c21', tone: 'ok', icon: 'tag' },
      ],
      flows: [
        { path: ['dev', 'web'], kind: 'ctrl' },
        { path: ['web', 'db'], kind: 'req', delay: 0.9 },
        { path: ['dev', 'reg'], kind: 'build', delay: 0.4 },
        { path: ['reg', 'srv'], kind: 'build', delay: 1.6 },
      ],
    },
  ],
  quiz: [
    {
      q: 'compose.yaml의 web에 depends_on: [db]를 적었습니다. 내 PC에서는 잘 뜨는데, 새 팀원의 PC에서는 web이 DB 연결 실패로 종료됩니다. 가장 알맞은 조치는?',
      options: [
        'web의 시작 명령 앞에 sleep 10을 넣는다',
        'db에 healthcheck를 두고 depends_on에 condition: service_healthy를 쓴다',
        'services에서 db를 web보다 위에 적는다',
        'web에 ports를 하나 더 열어 준다',
      ],
      answer: 1,
      why: '짧은 depends_on은 컨테이너의 시작 순서만 정하고, DB가 연결을 받을 준비가 됐는지는 보지 않습니다. healthcheck와 service_healthy 조건이 "준비됨"을 기다리게 합니다. sleep은 환경마다 필요한 시간이 달라 언젠가 다시 깨지고, YAML에 적은 순서는 기동 순서와 관계가 없습니다. 운영 중 재시작에 대비해 앱의 재시도도 함께 필요합니다.',
    },
    {
      q: '테스트를 마친 web 이미지를 운영 서버에 올리려 합니다. 가장 알맞은 방법은?',
      options: [
        '서버에서 git pull을 받고 docker compose up --build로 다시 빌드한다',
        '빌드한 이미지를 레지스트리에 push하고, 서버는 그 태그를 pull해서 실행한다',
        '서버의 compose.yaml에 image: shop-web:latest라고 적어 둔다',
        '컨테이너 안에 들어가 바뀐 소스 파일만 복사해 넣는다',
      ],
      answer: 1,
      why: '서버에서 다시 빌드하면 테스트한 것과 다른 이미지가 나올 수 있고, 서버에 소스와 빌드 도구가 있어야 합니다. 한 번 빌드한 이미지를 레지스트리로 옮겨야 테스트한 것과 실행하는 것이 같습니다. latest는 어느 빌드인지 알 수 없고, 컨테이너 안을 고친 것은 컨테이너를 다시 만들면 사라집니다.',
    },
    {
      q: '배포 후 장애가 나서 "어제 버전"으로 되돌리려는데, 레지스트리에는 덮어쓴 1.0과 latest 태그뿐입니다. 다음부터 무엇을 바꿔야 할까요?',
      options: [
        '빌드마다 git 커밋 SHA 같은 유일한 태그를 붙이고, 올린 태그는 덮어쓰지 않는다',
        'latest 대신 stable이라는 태그를 쓴다',
        '레지스트리를 하나 더 만들어 양쪽에 올린다',
        '배포 전에 서버의 이미지를 docker save로 보관한다',
      ],
      answer: 0,
      why: '태그는 옮겨 붙일 수 있는 이름표라, 덮어쓰면 이전 이미지를 가리키는 이름이 사라집니다. 빌드마다 유일한 태그를 쓰면 어제의 이미지가 그 태그 그대로 남아 있어 롤백이 태그 한 줄 바꾸기가 됩니다. stable도 움직이는 태그이기는 마찬가지이고, 레지스트리를 늘려도 이름이 가리키는 대상은 그대로 덮입니다.',
    },
    {
      q: '운영 서버가 프라이빗 레지스트리에서 이미지를 받아야 합니다. 서버에 어떤 자격을 두는 것이 가장 알맞을까요?',
      options: [
        '관리자 계정으로 docker login을 한 번 해 둔다',
        '레지스트리를 공개로 바꿔 로그인이 필요 없게 한다',
        'pull만 할 수 있는 수명이 짧은 토큰이나, VM에 붙인 역할로 받는 임시 자격',
        '비밀번호를 이미지 안의 환경 변수로 넣어 둔다',
      ],
      answer: 2,
      why: 'docker login의 자격 증명은 기본적으로 config.json에 base64로만 저장되어, 서버가 뚫리면 그대로 읽힙니다. 그래서 유출돼도 피해가 작도록 권한은 pull로, 수명은 짧게 둡니다. 관리자 계정은 push와 삭제까지 할 수 있고, 공개 레지스트리는 회사 코드를 모두에게 내주는 셈이며, 이미지에 넣은 비밀은 이미지를 받는 모든 곳에 퍼집니다.',
    },
  ],
};
