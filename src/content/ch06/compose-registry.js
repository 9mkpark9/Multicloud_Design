export default {
  id: 'compose-registry',
  learn: [
    'compose.yaml: 여러 컨테이너를 한 파일로 선언',
    'depends_on과 healthcheck로 준비 순서 맞추기',
    '.env · 프로필로 환경과 선택 서비스 다루기',
    '레지스트리로 이미지를 push · pull, 태그는 git SHA',
    'digest 고정과 레지스트리 캐시 · 인증',
    '4대 클라우드의 컨테이너 레지스트리',
  ],
  legend: [['ctrl', '명령 · 설정'], ['req', '요청'], ['res', '응답'], ['build', '이미지 push · pull'], ['bad', '실패']],
  metrics: [
    { id: 'cmd', label: '띄우는 명령', icon: 'terminal' },
    { id: 'boot', label: '기동 순서', icon: 'steps' },
    { id: 'cfg', label: '설정 값', icon: 'variable' },
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
    envs: {
      title: '.env · compose.yaml', lang: 'yaml',
      text: `# .env  (Git에 넣지 않는다)
DB_PASSWORD=change-me
WEB_PORT=8080

# compose.yaml
services:
  web:
    build: .
    ports:
      - "\${WEB_PORT:-8080}:3000"
    env_file: ./web.env
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: \${DB_PASSWORD:?필요}`,
    },
    profiles: {
      title: 'compose.yaml', lang: 'yaml',
      text: `services:
  # web · db · cache는 그대로
  adminer:
    image: adminer:4
    profiles: ["debug"]
    ports:
      - "127.0.0.1:8081:8080"
    depends_on: [db]

# 평소:   docker compose up -d
# 디버깅: docker compose --profile debug up -d`,
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
    digest: {
      title: '터미널', lang: 'sh',
      text: `$ docker push $IMG:a3f9c21
a3f9c21: digest: sha256:7d1e…c40

$ docker buildx imagetools inspect \\
    $IMG:a3f9c21 | grep Digest
Digest:    sha256:7d1e…c40

# 운영 compose.yaml: 태그는 읽기용,
# 실제로 받는 기준은 digest
#   image: …/web:a3f9c21@sha256:7d1e…`,
    },
    ratelimit: {
      title: '서버의 터미널', lang: 'sh',
      text: `$ docker compose pull
db Error response from daemon:
  toomanyrequests: You have reached
  your pull rate limit.

# 해결 1: 인증한 계정으로 받기
$ docker login -u shop-ci
# 해결 2: 우리 레지스트리를 캐시로
# → reg.example.com/hub/postgres:16`,
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
      envf: { kind: 'tile', at: [-1.5, 0.9], label: '.env', icon: 'file-key', color: 'yellow' },
      web: { at: [2.0, 2.0], label: 'web', sub: '주문 API', icon: 'container', color: 'blue' },
      db: { kind: 'cyl', at: [3.5, 0.5], label: 'db (postgres)', icon: 'database', color: 'purple' },
      cache: { kind: 'cyl', at: [0.5, 3.5], label: 'cache (redis)', icon: 'zap', color: 'orange' },
      adm: { at: [3.5, 4.4], size: 's', label: 'adminer', sub: 'debug 전용', icon: 'table', color: 'gray' },
      reg: { kind: 'cyl', at: [0.3, -3.3], label: '레지스트리', icon: 'archive', color: 'green' },
      srv: { at: [2.1, -5.1], label: '운영 서버', sub: 'pull · run', icon: 'server', color: 'slate' },
      hub: { kind: 'cyl', at: [4.5, -2.7], label: 'Docker Hub', icon: 'globe', color: 'blue' },
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
      e_ef: { from: 'envf', to: 'file', style: 'dashed' },
      e_wd: { from: 'web', to: 'db', label: '5432' },
      e_wc: { from: 'web', to: 'cache', label: '6379' },
      e_ad: { from: 'adm', to: 'db', style: 'dashed' },
      e_push: { from: 'dev', to: 'reg', label: 'push' },
      e_pull: { from: 'reg', to: 'srv', label: 'pull' },
      e_hs: { from: 'hub', to: 'srv', tone: 'bad', style: 'dashed' },
      e_hr: { from: 'hub', to: 'reg', style: 'dashed', label: '캐시', off: true },
    },
  },
  steps: [
    {
      key: '긴 명령', kind: 'problem', title: '컨테이너 셋을 띄우는 명령 여섯 개',
      body: [
        'shop.example의 주문 API(<code>web</code>)에 PostgreSQL(<code>db</code>)과 Redis 캐시(<code>cache</code>)가 붙었습니다. 지난 레슨에서 배운 대로 네트워크와 볼륨을 만들고 <code>docker run</code>을 세 번 칩니다.',
        '옵션 하나를 빠뜨려도 오류 없이 다르게 뜹니다. <code>--network</code>를 잊으면 이름으로 못 찾고, <code>-v</code>를 잊으면 데이터가 익명 볼륨으로 가요. 띄우는 순서는 누군가의 기억 속에 있습니다.',
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
      metrics: { cmd: ['6개', 'warn'], boot: ['사람의 기억', 'warn'], cfg: ['명령에 직접', 'warn'], where: '내 PC', tag: ['latest', 'warn'] },
      more: [
        { title: '무엇이 문제인가', list: [
          '<b>재현성</b>: 같은 README를 따라 쳐도 옵션 하나, 이미지 태그 하나가 달라지면 다른 환경이 됩니다.',
          '<b>리뷰 불가</b>: 셸 기록에만 남은 설정은 코드 리뷰도, 변경 이력도 없습니다.',
          '<b>비밀 노출</b>: <code>-e POSTGRES_PASSWORD=secret</code>는 셸 기록(<code>~/.bash_history</code>)과 <code>docker inspect</code> 출력에 그대로 남습니다.',
          '<b>정리</b>: 지울 때도 무엇을 만들었는지 기억해 하나씩 지워야 합니다.',
        ] },
        { title: '직접 해보기', body: ['지금 떠 있는 컨테이너가 어떤 옵션으로 떴는지는 나중에 <code>docker inspect</code>로만 거꾸로 알아낼 수 있습니다. 이 출력을 사람이 다시 명령으로 옮기다 보면 실수가 생기기 쉬워요.'],
          code: { title: 'terminal', lang: 'sh', text: '$ docker inspect web -f \\\n  \'{{.HostConfig.NetworkMode}} {{.Config.Env}}\'\nshopnet [DB_HOST=db REDIS_HOST=cache …]' } },
        { title: '더 생각해 볼 것', body: ['이 레슨의 앞부분은 "한 호스트에서 여러 컨테이너를 파일로 띄우기"(Compose), 뒷부분은 "만든 이미지를 다른 곳으로 나르기"(레지스트리)입니다. 둘을 합치면 "어느 서버에서나 같은 구성으로 같은 이미지를 띄우기"가 됩니다.'] },
      ],
    },
    {
      key: 'compose.yaml', kind: 'solution', title: '실행 구성을 compose.yaml 한 장에',
      body: [
        '<b>Docker Compose</b>는 여러 컨테이너의 실행 구성을 <code>compose.yaml</code> 한 파일에 적고 한꺼번에 다루는 도구입니다. 컨테이너 하나하나가 <code>services</code> 아래의 <b>서비스</b>가 되고, <code>docker run</code>의 옵션이 키로 옮겨 옵니다.',
        '<code>image</code>는 받아 쓸 이미지, <code>build: .</code>는 이 폴더의 Dockerfile로 빌드하라는 뜻입니다. <code>-p</code>는 <code>ports</code>, <code>-e</code>는 <code>environment</code>, <code>-v</code>는 <code>volumes</code>가 됐어요. 이 파일은 Git에 들어가 코드처럼 리뷰됩니다.',
      ],
      callout: { type: 'tip', text: '비밀번호는 파일에 적지 않습니다. <code>${DB_PASSWORD}</code>는 셸 환경 변수나 같은 폴더의 <code>.env</code> 파일에서 채워집니다(6단계).' },
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
      more: [
        { title: '옵션이 옮겨 가는 곳', rows: [
          ['--name', '서비스 이름 (web · db · cache)', 'info'],
          ['--network', '자동 생성 · networks:', 'info'],
          ['-p 8080:3000', 'ports: ["8080:3000"]', 'info'],
          ['-e KEY=VAL', 'environment: · env_file:', 'info'],
          ['-v pgdata:/…', 'volumes: + 최상위 volumes:', 'info'],
          ['--restart', 'restart: unless-stopped', 'info'],
        ] },
        { title: '흔한 실수', list: [
          '파일 맨 위의 <code>version: "3.8"</code>은 지금의 Compose(v2)에서는 쓰이지 않습니다. 있어도 경고만 나니 지워도 됩니다.',
          '최상위 <code>volumes:</code>에 이름을 선언하지 않고 서비스에서 <code>pgdata:</code>를 쓰면 오류가 납니다. 반대로 <code>./data:/…</code>처럼 경로로 쓰면 볼륨이 아니라 bind mount입니다.',
          'YAML은 들여쓰기가 문법입니다. 탭 대신 스페이스를 쓰고, <code>"8080:3000"</code>처럼 포트는 따옴표로 감싸는 습관이 안전합니다.',
        ] },
        { title: '실무 팁', body: ['<code>docker compose config</code>는 변수를 모두 채우고 기본값을 붙인 <b>최종 구성</b>을 출력합니다. "왜 이렇게 떴지?"가 궁금할 때 가장 먼저 쳐 볼 명령이고, CI에서 파일 문법 검사로도 씁니다.'] },
      ],
    },
    {
      key: 'up · down', kind: 'concept', title: 'up 한 줄이 만들어 주는 것들',
      body: [
        '<code>docker compose up -d</code> 한 줄이면 Compose가 프로젝트 전용 <b>네트워크</b>(<code>shop_default</code>)를 만들고 모든 서비스를 연결합니다. <b>서비스 이름이 곧 주소</b>라 <code>DB_HOST: db</code>가 그대로 통해요.',
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
      more: [
        { title: '자주 쓰는 명령', rows: [
          ['up -d', '만들고 · 바뀐 것만 다시 만들고 · 시작', 'ok'],
          ['up -d --build', '이미지를 다시 빌드한 뒤 up', 'info'],
          ['ps · logs -f web', '상태 · 로그 보기', 'info'],
          ['exec db psql -U postgres', '실행 중인 서비스에 명령', 'info'],
          ['stop · start', '지우지 않고 멈추기 · 다시 켜기', 'info'],
          ['down (-v)', '지우기 (볼륨까지)', 'warn'],
        ] },
        { title: '출력 읽기', body: [
          '<code>shop-db-1</code>의 마지막 <code>1</code>은 서비스의 복제 번호입니다. <code>docker compose up -d --scale web=3</code>처럼 늘리면 <code>-2</code>, <code>-3</code>이 생겨요. 단 <code>ports: "8080:3000"</code>처럼 호스트 포트를 고정한 서비스는 하나만 그 포트를 쓸 수 있어 늘리지 못합니다.',
          '같은 폴더 이름의 프로젝트가 두 개면 이름이 겹쳐 서로의 컨테이너를 덮어쓸 수 있습니다. <code>name: shop</code>을 파일 맨 위에 두거나 <code>-p</code>로 프로젝트 이름을 고정하세요.',
        ] },
      ],
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
      more: [
        { title: '증상에서 원인까지', code: { title: 'terminal', lang: 'sh', text: '$ docker compose ps -a\nNAME          STATUS\nshop-db-1     Up 3 seconds\nshop-web-1    Exited (1) 2 seconds ago\n\n$ docker compose logs db | tail -3\ndb-1  | initdb: … creating subdirectories\ndb-1  | … database system is ready to accept connections\n\n$ docker compose logs web | tail -1\nweb-1 | Error: connect ECONNREFUSED 172.19.0.2:5432' } },
        { title: '출력 읽기', body: [
          'db 로그를 보면 <code>initdb</code>로 데이터 디렉터리를 만드는 동안 web이 먼저 접속을 시도했습니다. 이름(db → 172.19.0.2)은 잘 풀렸으니 네트워크 문제가 아니라 <b>타이밍</b> 문제예요. 볼륨이 빈 새 환경에서 처음 띄울 때 가장 잘 드러납니다.',
        ] },
        { title: '흔한 실수', list: [
          '<code>command: sh -c "sleep 10 && node server.js"</code>처럼 기다리게 하는 것. 느린 PC나 CI에서는 10초도 모자라고, 빠른 곳에서는 시간 낭비입니다.',
          '<code>restart: always</code>만으로 버티기. 몇 번 죽었다 살아나며 결국 붙기는 하지만, 로그가 오류로 가득 차 진짜 문제를 가립니다.',
        ] },
      ],
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
      more: [
        { title: '출력 읽기', code: { title: 'terminal', lang: 'sh', text: '$ docker compose up -d --wait\n ✔ Container shop-db-1     Healthy\n ✔ Container shop-cache-1  Started\n ✔ Container shop-web-1    Started\n\n$ docker compose ps\nNAME        STATUS\nshop-db-1   Up 20 seconds (healthy)\nshop-web-1  Up 9 seconds' } },
        { title: '설정 값 고르기', list: [
          '<code>interval</code>(검사 간격) × <code>retries</code>(연속 실패 허용)가 "unhealthy로 판정되기까지의 시간"입니다. 위 예시는 약 25초.',
          '<code>start_period</code>를 주면 기동 초반의 실패는 세지 않습니다. 첫 기동이 오래 걸리는 앱(마이그레이션, JVM)에 씁니다.',
          '검사 명령은 <b>이미지 안에 있는 도구</b>여야 합니다. 작은 이미지에는 <code>curl</code>이 없을 수 있어요.',
          '<code>condition: service_completed_successfully</code>는 마이그레이션처럼 "한 번 돌고 성공해야 하는" 작업을 기다릴 때 씁니다.',
        ] },
        { title: '더 생각해 볼 것', body: ['<code>--wait</code>는 서비스가 running · healthy가 될 때까지 기다렸다 끝나므로, CI에서 통합 테스트 전에 쓰기 좋습니다. 쿠버네티스에서는 같은 생각이 readiness · liveness 프로브로 이어집니다(7장).'] },
      ],
    },
    {
      key: '.env', kind: 'concept', title: '환경마다 다른 값은 .env로',
      body: [
        '포트, 비밀번호처럼 환경마다 다른 값은 파일에 직접 적지 않고 <code>${변수}</code>로 비워 둡니다. Compose는 셸의 환경 변수와 같은 폴더의 <code>.env</code> 파일에서 값을 채워요.',
        '<code>${WEB_PORT:-8080}</code>은 값이 없으면 8080, <code>${DB_PASSWORD:?필요}</code>는 값이 없으면 <b>오류를 내고 멈춥니다</b>. 빈 비밀번호로 DB가 뜨는 일을 막아 줍니다.',
      ],
      callout: { type: 'warn', text: '<code>.env</code>는 <code>.gitignore</code>에 넣고, 어떤 변수가 필요한지는 값을 비운 <code>.env.example</code>을 커밋해 알려 줍니다.' },
      code: { ref: 'envs', hl: [2, 3, 10, 11, 15] },
      hide: ['net', 'db', 'cache'],
      show: ['envf'],
      tags: [{ on: 'envf', text: 'Git 제외', tone: 'warn', icon: 'ban', pos: 'bottom' }],
      flows: [{ path: ['envf', 'file'], kind: 'ctrl' }, { path: ['file', 'web'], kind: 'ctrl', delay: 0.8 }],
      metrics: { cfg: ['.env · 변수', 'ok'] },
      changes: [['+', '.env (Git 제외)'], ['~', '하드코딩 → ${변수}'], ['+', '필수 값은 :? 로 검사']],
      more: [
        { title: '두 가지 .env를 구분하기', list: [
          '<b>프로젝트 폴더의 <code>.env</code></b>: compose.yaml 안의 <code>${…}</code>를 <b>채우는</b> 데 쓰입니다. 컨테이너에 자동으로 들어가지 않아요.',
          '<b><code>env_file: ./web.env</code></b>: 파일의 모든 줄을 그 <b>컨테이너의 환경 변수</b>로 넣습니다.',
          '같은 변수가 셸 환경에도 있으면 셸의 값이 <code>.env</code>보다 우선합니다. <code>--env-file</code>로 다른 파일을 지정할 수도 있어요.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker compose config | grep -A2 ports\n    ports:\n      - published: "8080"\n        target: 3000\n\n$ mv .env .env.bak && docker compose up -d\nerror while interpolating services.db.environment\n  .POSTGRES_PASSWORD: required variable\n  DB_PASSWORD is missing a value: 필요' } },
        { title: '개발 · 운영 나누기', body: ['<code>compose.override.yaml</code>이 같은 폴더에 있으면 Compose가 자동으로 겹쳐 읽습니다. 개발용 bind mount나 디버그 포트는 override에, 운영용 차이는 <code>-f compose.yaml -f compose.prod.yaml</code>처럼 명시적으로 겹칩니다. 비밀번호 자체는 운영에서 시크릿 관리 서비스로 옮기는 것이 좋습니다(10장).'] },
      ],
    },
    {
      key: '프로필', kind: 'concept', title: '프로필: 필요할 때만 뜨는 서비스',
      body: [
        'DB를 들여다보는 관리 도구(adminer)는 디버깅할 때만 필요합니다. 서비스에 <code>profiles: ["debug"]</code>를 붙이면 평소 <code>up</code>에서는 뜨지 않아요.',
        '<code>docker compose --profile debug up -d</code>처럼 프로필을 켤 때만 함께 뜹니다. 프로필이 없는 서비스는 언제나 뜨니, 파일 하나로 "기본 구성 + 선택 도구"를 함께 관리할 수 있습니다.',
      ],
      callout: { type: 'tip', text: '관리 도구의 포트는 <code>127.0.0.1:8081:8080</code>처럼 호스트 안에만 엽니다. 디버그용이라도 바깥에 열면 그대로 공격 표면입니다.' },
      code: { ref: 'profiles', hl: [5, 7, 10, 11] },
      hide: ['envf'],
      show: ['net', 'db', 'cache', 'adm'],
      tags: [{ on: 'adm', text: '--profile debug', tone: 'info', icon: 'flag', pos: 'right' }],
      flows: [{ path: ['adm', 'db'], kind: 'req', n: 2 }],
      changes: [['+', 'adminer (profile: debug)'], ['~', '평소 up에는 뜨지 않음']],
      more: [
        { title: '어디에 쓰나', list: [
          '<b>디버그 도구</b>: adminer, pgAdmin, 메일 확인용 가짜 SMTP 서버.',
          '<b>테스트</b>: 통합 테스트를 돌리는 일회성 서비스(<code>profiles: ["test"]</code>).',
          '<b>무거운 선택 구성</b>: 모니터링 스택처럼 가끔만 필요한 것.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker compose up -d\n$ docker compose ps --format \'{{.Service}}\'\ncache\ndb\nweb\n\n$ COMPOSE_PROFILES=debug docker compose up -d\n$ docker compose ps --format \'{{.Service}}\'\nadminer\ncache\ndb\nweb' } },
        { title: '흔한 실수', body: ['프로필이 붙은 서비스를 프로필 없는 서비스가 <code>depends_on</code>으로 기다리게 하면 기본 <code>up</code>이 꼬입니다. 의존 방향은 "선택 서비스 → 기본 서비스"로 두세요. 또 <code>down</code>도 같은 프로필을 켜고 해야 그 서비스까지 정리됩니다.'] },
      ],
    },
    {
      key: '레지스트리', kind: 'solution', title: '한 번 빌드해 레지스트리로 나릅니다',
      body: [
        '이제 서버에 올릴 차례입니다. 서버에서 <code>build: .</code>를 다시 돌리면 될까요? 서버에 소스와 빌드 도구를 둬야 하고, 무엇보다 그렇게 나온 이미지는 내가 <b>테스트한 그 이미지가 아닙니다</b>.',
        '이미지는 <b>한 번만 빌드</b>해 <b>레지스트리</b>(이미지 저장소)에 <code>push</code>하고, 서버는 <code>pull</code>만 합니다. 이미지 이름은 <code>레지스트리 주소/저장소:태그</code> 꼴이라, 이름이 곧 어디서 받을지를 말해 줘요. 주소를 생략하면 Docker Hub입니다.',
      ],
      callout: { type: 'tip', text: '서버의 compose.yaml에는 <code>build:</code> 대신 레지스트리 주소가 붙은 <code>image:</code>를 적습니다. 개발용 파일과 운영용 파일이 갈리는 첫 지점이에요.' },
      code: { ref: 'ship', hl: [2, 3, 4, 5, 8, 9] },
      hide: ['file', 'net', 'web', 'db', 'cache', 'adm'],
      show: ['dev', 'reg', 'srv'],
      set: { web: { state: null }, db: { state: null } },
      tags: [
        { on: 'dev', text: '빌드는 한 번', tone: 'info', icon: 'hammer' },
        { on: 'srv', text: '소스 없이 pull만', tone: 'ok' },
      ],
      flows: [{ path: ['dev', 'reg'], kind: 'build', n: 2 }, { path: ['reg', 'srv'], kind: 'build', n: 2, delay: 1.5 }],
      metrics: { where: ['레지스트리', 'ok'], tag: ['1.0', 'warn'] },
      changes: [['+', '레지스트리에 push'], ['~', '서버: build → pull'], ['-', '서버의 소스 · 빌드 도구']],
      more: [
        { title: '이미지 이름 읽기', rows: [
          ['postgres:16', '= docker.io/library/postgres:16', 'mute'],
          ['reg.example.com', '레지스트리 주소 (호스트[:포트])', 'info'],
          ['shop/web', '저장소 (네임스페이스/이름)', 'info'],
          [':1.0', '태그 (생략하면 latest)', 'warn'],
          ['@sha256:…', 'digest (불변, 10단계)', 'ok'],
        ] },
        { title: '동작 원리', body: [
          '레지스트리는 HTTP API(OCI Distribution)로 레이어(blob)와 매니페스트를 주고받는 서버입니다. push는 레지스트리에 없는 레이어만 올린 뒤 매니페스트를 올리고, pull은 매니페스트를 받아 없는 레이어만 내려받아요. 이미지 레이어 레슨에서 본 "Layer already exists"가 여기서 나옵니다.',
        ] },
        { title: '흔한 실수', list: [
          '<code>docker push shop-web</code>처럼 주소 없이 올리면 Docker Hub의 내 계정으로 가려 합니다. 회사 이미지가 공개 저장소로 갈 뻔한 사고가 이렇게 생깁니다.',
          '빌드는 Apple Silicon Mac, 서버는 x86인 경우 <code>docker buildx build --platform linux/amd64</code>로 서버에 맞는 이미지를 올립니다.',
        ] },
      ],
    },
    {
      key: '태그 전략', kind: 'concept', title: '태그는 빌드마다 유일하게: git SHA',
      body: [
        '<code>1.0</code>이라고 붙였지만, 버그를 고쳐 다시 빌드하면 또 <code>1.0</code>으로 올리고 싶어집니다. 태그는 옮겨 붙일 수 있는 이름표라서, 그 순간 서버마다 "1.0"의 내용이 달라져요.',
        '그래서 빌드마다 <b>유일한</b> 태그를 붙입니다. 가장 흔한 선택이 <b>git 커밋 SHA</b>예요. 떠 있는 이미지의 태그만 보면 어느 커밋인지 알 수 있고, 롤백은 이전 SHA로 다시 <code>up</code>하는 것입니다.',
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
      more: [
        { title: '여러 태그를 함께 붙이기', body: ['한 이미지에 이름표를 여러 개 붙일 수 있습니다. 배포 기준은 불변 태그(SHA), 사람이 읽는 이름은 버전, 둘러보기용은 움직이는 태그로 역할을 나눕니다.'],
          code: { title: 'terminal', lang: 'sh', text: '$ docker build -t $IMG:a3f9c21 .\n$ docker tag $IMG:a3f9c21 $IMG:1.4.2   # 릴리스 버전\n$ docker tag $IMG:a3f9c21 $IMG:main    # 움직이는 태그\n$ docker push --all-tags $IMG' } },
        { title: '태그 종류별 역할', rows: [
          ['a3f9c21 (git SHA)', '불변 · 배포와 롤백의 기준', 'ok'],
          ['1.4.2 (SemVer)', '불변 · 사람이 읽는 릴리스', 'ok'],
          ['main · latest', '가변 · 배포에 쓰지 않기', 'warn'],
        ] },
        { title: '실무 팁', list: [
          '짧은 SHA(7자)는 저장소가 커지면 겹칠 수 있어, CI에서는 더 긴 SHA나 빌드 번호를 함께 쓰기도 합니다.',
          '작업 트리에 커밋하지 않은 변경이 있는 상태로 빌드하면 SHA가 이미지 내용을 대표하지 못합니다. 이미지는 CI가 깨끗한 체크아웃에서 빌드하게 합니다(9장).',
          '태그가 쌓이면 저장 비용이 늘어납니다. 레지스트리의 수명 주기(정리) 정책으로 오래되고 배포되지 않은 태그를 지웁니다.',
        ] },
      ],
    },
    {
      key: 'digest 고정', kind: 'concept', title: '배포는 digest로 고정합니다',
      body: [
        '유일한 태그도 누군가 덮어쓸 수 있다면 완전히 믿을 수는 없습니다. push가 끝나면 레지스트리가 그 이미지의 <b>digest</b>를 알려 주는데, 이것은 내용에서 계산한 값이라 절대 바뀌지 않아요.',
        '운영 설정에 <code>web:a3f9c21@sha256:7d1e…</code>처럼 digest를 함께 적으면, 태그는 사람이 읽는 용도가 되고 실제로 받는 이미지는 digest가 정합니다. "테스트한 그 이미지"가 바이트 단위로 보장됩니다.',
      ],
      callout: { type: 'tip', text: '태그와 digest를 함께 적으면 <b>digest가 우선</b>합니다. 태그가 다른 이미지로 옮겨져도 서버는 원래 이미지를 받습니다.' },
      code: { ref: 'digest', hl: [2, 6, 10] },
      tags: [
        { on: 'reg', text: 'sha256:7d1e…', tone: 'info', icon: 'fingerprint', pos: 'bottom' },
        { on: 'srv', text: 'digest로 pull', tone: 'ok', icon: 'lock' },
      ],
      flows: [{ path: ['reg', 'srv'], kind: 'build', n: 2 }],
      metrics: { tag: ['SHA + digest', 'ok'] },
      changes: [['+', 'image: …@sha256:…'], ['~', '태그 = 읽기용, digest = 기준']],
      more: [
        { title: '실행 중인 것 확인하기', code: { title: 'terminal (서버)', lang: 'sh', text: '$ docker compose images\nCONTAINER   REPOSITORY             TAG       IMAGE ID\nshop-web-1  reg.example.com/shop/web  a3f9c21  0c4b…\n\n$ docker image inspect reg.example.com/shop/web:a3f9c21 \\\n    -f \'{{index .RepoDigests 0}}\'\nreg.example.com/shop/web@sha256:7d1e…c40' } },
        { title: '언제 digest까지 쓰나', list: [
          '<b>운영 배포</b>: 태그 불변 설정이 없거나, 여러 팀이 같은 레지스트리를 쓸 때.',
          '<b>베이스 이미지</b>: <code>FROM node:20-slim@sha256:…</code>로 빌드 재현성을 높일 때(이미지 레이어 레슨).',
          '<b>감사</b>: "어제 14시에 무엇이 돌았나"를 정확히 남겨야 할 때. 배포 기록에 digest를 함께 저장합니다.',
        ] },
        { title: '흔한 실수', body: ['digest는 사람이 읽기 어렵고 수정하다 한 글자만 틀려도 pull이 실패합니다. 손으로 적지 말고 CI가 push 결과에서 꺼내 배포 설정에 넣게 합니다. 여러 CPU용 이미지라면 인덱스의 digest를 적어야 각 서버가 자기 아키텍처 이미지를 고릅니다.'] },
      ],
    },
    {
      key: 'pull 한도', kind: 'case', title: '사례: 배포 중 Docker Hub가 거절합니다',
      body: [
        '서버 열 대가 동시에 <code>docker compose pull</code>을 했더니 일부가 <code>toomanyrequests: You have reached your pull rate limit</code>로 실패했습니다. web은 우리 레지스트리에서 받지만 <code>postgres:16</code>, <code>redis:7</code>은 <b>Docker Hub</b>에서 받고 있었어요.',
        'Docker Hub는 익명 pull에 시간당 한도를 둡니다. 같은 공인 IP(NAT 게이트웨이)로 나가는 서버들이 한도를 함께 써 버린 것입니다.',
      ],
      callout: { type: 'tip', text: '공개 이미지도 <b>우리 레지스트리를 거쳐</b> 받습니다. 클라우드 레지스트리의 pull-through 캐시를 쓰거나 필요한 이미지를 복사해 두면, 한도와 외부 장애 모두에서 자유로워집니다.' },
      code: { ref: 'ratelimit', hl: [2, 3, 4, 9] },
      hide: ['dev'],
      show: ['hub', 'e_hr'],
      set: { srv: { state: 'hot' } },
      tags: [
        { on: 'hub', text: 'toomanyrequests', tone: 'bad', icon: 'ban', pos: 'right' },
        { on: 'reg', text: 'pull-through 캐시', tone: 'ok', icon: 'copy', pos: 'bottom' },
      ],
      flows: [{ path: ['hub', 'srv'], kind: 'bad', n: 2 }, { path: ['hub', 'reg', 'srv'], kind: 'build', delay: 1.4 }],
      metrics: { where: ['외부 의존 → 캐시', 'warn'] },
      changes: [['-', 'Docker Hub 익명 pull 실패'], ['+', '우리 레지스트리를 캐시로']],
      more: [
        { title: '클라우드별 캐시 기능', rows: [
          ['AWS', 'ECR pull through cache 규칙', 'aws'],
          ['Azure', 'ACR 아티팩트 캐시 (cache rule)', 'azure'],
          ['GCP', 'Artifact Registry 원격 저장소', 'gcp'],
          ['NCP', '필요한 이미지를 Container Registry로 복사', 'ncp'],
        ] },
        { title: '해결책 고르기', list: [
          '<b>당장</b>: 서버에서 Docker Hub 계정으로 로그인하면 한도가 늘어납니다. 개인 계정 대신 조직용 읽기 전용 토큰을 씁니다.',
          '<b>근본</b>: 공개 이미지를 우리 레지스트리로 미러링하고, compose.yaml의 <code>image:</code>를 우리 주소로 바꿉니다. 같은 리전에서 받으니 빨라지기도 해요.',
          '<b>덤</b>: 우리 레지스트리에 들어온 공개 이미지도 스캔 대상이 됩니다.',
        ] },
        { title: '더 생각해 볼 것', body: ['한도 수치와 조건은 Docker Hub 정책에 따라 바뀌어 왔습니다. 숫자를 외우기보다 "외부 공개 레지스트리는 언제든 느려지거나 막힐 수 있는 의존성"으로 보고 설계하는 편이 안전합니다.'] },
      ],
    },
    {
      key: '로그인', kind: 'case', title: '사례: 서버에 남은 관리자 로그인',
      body: [
        '회사 이미지는 아무나 받으면 안 되니 <b>프라이빗 레지스트리</b>에 둡니다. 새 서버에서 <code>pull</code>이 <code>unauthorized</code>로 실패하자, 급한 마음에 담당자가 자기 계정으로 <code>docker login</code>을 해 두었습니다.',
        '<code>docker login</code>은 자격 증명을 <code>~/.docker/config.json</code>에 저장합니다. credential helper가 없으면 <b>base64로 인코딩</b>만 한 채로요. 암호화가 아니라서 서버에 들어온 누구나 되돌려 읽을 수 있고, 그 계정은 push도 삭제도 할 수 있었습니다.',
      ],
      callout: { type: 'tip', text: '서버에는 <b>pull 전용</b>이고 <b>수명이 짧은</b> 토큰만 둡니다. 클라우드에서는 VM에 붙인 역할(IAM)로 그때그때 토큰을 받아, 서버에 비밀번호가 남지 않게 합니다.' },
      code: { ref: 'login', hl: [3, 4, 14, 15] },
      hide: ['hub', 'e_hr'],
      set: { srv: { state: 'hot' } },
      tags: [
        { on: 'reg', text: '프라이빗', icon: 'lock', pos: 'bottom' },
        { on: 'srv', text: 'config.json에 계정', tone: 'bad', icon: 'key' },
      ],
      flows: [{ path: ['srv', 'reg'], kind: 'req' }, { path: ['reg', 'srv'], kind: 'bad', n: 2, delay: 1.1 }],
      metrics: { where: ['프라이빗', 'ok'] },
      changes: [['-', '서버에 남은 개인 계정 로그인'], ['+', 'pull 전용 · 단기 토큰']],
      more: [
        { title: '출력 읽기', body: [
          '<code>auth</code> 값은 <code>사용자:비밀번호</code>를 base64로 바꾼 것뿐입니다. <code>echo ZGVwbG95… | base64 -d</code> 한 줄이면 원래 값이 나와요. 그래서 이 파일은 비밀번호 파일과 같게 다뤄야 합니다.',
        ] },
        { title: 'credential helper', body: ['자격 증명을 파일 대신 OS 키체인이나 클라우드 인증으로 처리하는 도우미입니다. 클라우드용 helper는 그때그때 IAM으로 짧은 토큰을 받아 오므로 파일에 비밀이 남지 않습니다.'],
          code: { title: '~/.docker/config.json', lang: 'json', text: '{\n  "credHelpers": {\n    "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com":\n      "ecr-login",\n    "asia-northeast3-docker.pkg.dev": "gcloud"\n  }\n}' } },
        { title: '흔한 실수', list: [
          '<code>docker login -p 비밀번호</code>: 셸 기록과 프로세스 목록에 남습니다. 항상 <code>--password-stdin</code>을 씁니다.',
          'CI와 서버가 같은 계정을 쓰는 것: CI는 push, 서버는 pull만 필요합니다. 권한을 나눠야 유출 시 피해가 작습니다.',
        ] },
      ],
    },
    {
      key: '4대 클라우드', kind: 'compare', title: '네 클라우드의 컨테이너 레지스트리',
      body: [
        '클라우드마다 관리형 레지스트리가 있고, 그 클라우드의 <b>IAM과 이어진다</b>는 점이 핵심입니다. 같은 클라우드의 VM이나 쿠버네티스 노드는 역할만 붙이면 비밀번호 없이 pull합니다.',
        '차이는 쓰는 방식에 있어요. <b>ECR</b>은 보통 저장소를 먼저 만들고 IAM으로 12시간짜리 토큰을 받습니다. <b>ACR</b>은 Entra ID로, <b>Artifact Registry</b>는 gcloud 자격 증명으로 로그인해요. <b>NCP Container Registry</b>는 이미지를 Object Storage 버킷에 두고 API 인증키로 로그인합니다.',
      ],
      callout: { type: 'cloud', text: '실행할 곳과 <b>같은 클라우드 · 같은 리전</b>의 레지스트리가 기본 선택입니다. pull이 빠르고 리전 밖으로 나가는 전송 요금도 줄어듭니다.' },
      hide: ['reg', 'srv'],
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
      more: [
        { title: '로그인 명령', code: { title: 'terminal', lang: 'sh', text: '# AWS ECR\n$ aws ecr get-login-password --region ap-northeast-2 \\\n  | docker login --username AWS --password-stdin \\\n    123456789012.dkr.ecr.ap-northeast-2.amazonaws.com\n\n# Azure ACR\n$ az acr login --name shopreg      # shopreg.azurecr.io\n\n# GCP Artifact Registry\n$ gcloud auth configure-docker \\\n    asia-northeast3-docker.pkg.dev\n\n# NCP Container Registry\n# 콘솔의 엔드포인트 + Access Key ID / Secret Key\n$ docker login <레지스트리 엔드포인트>' } },
        { title: '이미지 주소 모양', rows: [
          ['ECR', '<계정>.dkr.ecr.<리전>.amazonaws.com/web', 'aws'],
          ['ACR', '<이름>.azurecr.io/shop/web', 'azure'],
          ['Artifact Registry', '<리전>-docker.pkg.dev/<프로젝트>/<저장소>/web', 'gcp'],
          ['NCP', '<레지스트리 엔드포인트>/web', 'ncp'],
        ] },
        { title: '고를 때 볼 것', list: [
          '태그 불변 설정, 수명 주기(오래된 이미지 정리) 정책, 이미지 스캔, 다른 리전 복제를 지원하는지와 그 과금을 확인합니다.',
          '여러 클라우드에서 같은 이미지를 쓴다면 한 곳에서 빌드해 각 클라우드 레지스트리로 <b>복제</b>하고, 각 클러스터는 자기 클라우드의 레지스트리에서 받는 구조가 흔합니다(11장).',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 파일로 띄우고, 레지스트리로 나르기',
      body: [
        '<b>Compose</b>는 여러 컨테이너의 실행 구성을 한 파일에 선언합니다. 서비스 이름이 주소가 되고, 순서는 <code>healthcheck</code>로, 환경별 값은 <code>.env</code>로, 선택 도구는 프로필로 다룹니다.',
        '이미지는 한 번 빌드해 <b>레지스트리</b>로 나르고, 태그는 git SHA, 배포는 digest로 고정합니다. 서버에는 pull 전용 단기 자격만 둡니다. 서버가 여러 대가 되고 죽은 컨테이너를 알아서 되살려야 한다면? 다음 챕터의 쿠버네티스가 그 답입니다.',
      ],
      hide: ['ecr', 'acr', 'gar', 'ncr'],
      show: ['dev', 'net', 'web', 'db', 'cache', 'reg', 'srv'],
      tags: [
        { on: 'web', text: 'compose up 한 줄', icon: 'terminal', pos: 'bottom' },
        { on: 'srv', text: 'web:a3f9c21@sha256', tone: 'ok', icon: 'tag' },
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
      options: ['web의 시작 명령 앞에 sleep 10을 넣는다', 'services에서 db를 web보다 위에 적는다', 'web에 ports를 하나 더 열어 준다', 'db에 healthcheck를 두고 depends_on에 condition: service_healthy를 쓴다'],
      answer: 3,
      step: 5,
      why: '짧은 depends_on은 컨테이너의 시작 순서만 정하고, DB가 연결을 받을 준비가 됐는지는 보지 않습니다. healthcheck와 service_healthy 조건이 준비됨을 기다리게 합니다. sleep은 환경마다 필요한 시간이 달라 언젠가 다시 깨지고, YAML에 적은 순서는 기동 순서와 관계가 없습니다.',
    },
    {
      q: '테스트를 마친 web 이미지를 운영 서버에 올리려 합니다. 가장 알맞은 방법은?',
      options: ['서버에서 git pull을 받고 docker compose up --build로 다시 빌드한다', '서버의 compose.yaml에 image: shop-web:latest라고 적어 둔다', '빌드한 이미지를 레지스트리에 push하고, 서버는 그 태그를 pull해서 실행한다', '컨테이너 안에 들어가 바뀐 소스 파일만 복사해 넣는다'],
      answer: 2,
      step: 8,
      why: '서버에서 다시 빌드하면 테스트한 것과 다른 이미지가 나올 수 있고, 서버에 소스와 빌드 도구가 있어야 합니다. 한 번 빌드한 이미지를 레지스트리로 옮겨야 테스트한 것과 실행하는 것이 같습니다. latest는 어느 빌드인지 알 수 없고, 컨테이너 안을 고친 것은 다시 만들면 사라집니다.',
    },
    {
      q: '배포 후 장애가 나서 어제 버전으로 되돌리려는데, 레지스트리에는 덮어쓴 1.0과 latest 태그뿐입니다. 다음부터 무엇을 바꿔야 할까요?',
      options: ['빌드마다 git 커밋 SHA 같은 유일한 태그를 붙이고, 올린 태그는 덮어쓰지 않는다', 'latest 대신 stable이라는 태그를 쓴다', '레지스트리를 하나 더 만들어 양쪽에 올린다', '배포 전에 서버의 이미지를 docker save로 보관한다'],
      answer: 0,
      step: 9,
      why: '태그는 옮겨 붙일 수 있는 이름표라, 덮어쓰면 이전 이미지를 가리키는 이름이 사라집니다. 빌드마다 유일한 태그를 쓰면 어제의 이미지가 그 태그 그대로 남아 롤백이 태그 한 줄 바꾸기가 됩니다. stable도 움직이는 태그이고, 레지스트리를 늘려도 이름은 그대로 덮입니다.',
    },
    {
      q: '운영 서버가 프라이빗 레지스트리에서 이미지를 받아야 합니다. 서버에 어떤 자격을 두는 것이 가장 알맞을까요?',
      options: ['관리자 계정으로 docker login을 한 번 해 둔다', 'pull만 할 수 있는 수명이 짧은 토큰이나, VM에 붙인 역할로 받는 임시 자격', '레지스트리를 공개로 바꿔 로그인이 필요 없게 한다', '비밀번호를 이미지 안의 환경 변수로 넣어 둔다'],
      answer: 1,
      step: 12,
      why: 'docker login의 자격 증명은 기본적으로 config.json에 base64로만 저장되어, 서버가 뚫리면 그대로 읽힙니다. 그래서 권한은 pull로, 수명은 짧게 둡니다. 관리자 계정은 push와 삭제까지 할 수 있고, 공개 레지스트리는 회사 코드를 모두에게 내주며, 이미지에 넣은 비밀은 이미지를 받는 모든 곳에 퍼집니다.',
    },
    {
      q: '팀원이 습관처럼 docker compose down -v로 정리합니다. 개발 DB 데이터가 매번 사라진다는 불만이 나옵니다. 이유는?',
      options: ['-v가 컨테이너뿐 아니라 이름 있는 볼륨까지 지우기 때문', '-v가 verbose 출력이라 아무 영향이 없다', 'down은 항상 볼륨을 지우기 때문', 'Compose가 네트워크를 다시 만들 때 데이터를 지우기 때문'],
      answer: 0,
      step: 3,
      why: 'down은 컨테이너와 네트워크만 지우고 이름 있는 볼륨은 남기지만, -v를 붙이면 볼륨까지 삭제합니다. 데이터를 유지하려면 down만 쓰거나 stop을 씁니다.',
    },
    {
      q: '같은 서버에서 폴더 이름이 둘 다 app인 서로 다른 Compose 프로젝트를 띄웠더니 한쪽 컨테이너가 다른 쪽으로 바뀌어 버렸습니다. 가장 알맞은 조치는?',
      options: ['서비스 이름을 모두 다르게 바꾼다', '두 프로젝트에 서로 다른 프로젝트 이름(name: 또는 -p)을 지정한다', '하나를 --network host로 띄운다', 'docker compose down -v 후 다시 띄운다'],
      answer: 1,
      step: 3,
      why: '프로젝트 이름은 따로 정하지 않으면 폴더 이름이라, 같은 이름의 프로젝트는 같은 컨테이너 · 네트워크 이름을 씁니다. 파일의 name이나 -p로 프로젝트 이름을 분리하면 충돌이 사라집니다.',
    },
    {
      q: 'compose.yaml에 POSTGRES_PASSWORD: ${DB_PASSWORD}로 적었는데, CI에서 .env 없이 실행하자 DB가 빈 비밀번호로 떠 버렸습니다. 재발을 막는 가장 간단한 방법은?',
      options: ['.env를 Git에 커밋한다', '${DB_PASSWORD:?필요}처럼 값이 없으면 오류를 내게 한다', '비밀번호를 compose.yaml에 직접 적는다', 'healthcheck를 추가한다'],
      answer: 1,
      step: 6,
      why: ':? 형식은 변수가 비어 있으면 Compose가 오류를 내고 멈춥니다. .env를 커밋하거나 파일에 직접 적으면 비밀이 Git에 남고, healthcheck는 비밀번호 유무와 관계가 없습니다.',
    },
    {
      q: '디버깅할 때만 DB 관리 도구(adminer)를 띄우고 싶습니다. 평소 docker compose up에는 뜨지 않게 하려면?',
      options: ['adminer 서비스에 profiles: ["debug"]를 붙이고 필요할 때 --profile debug로 띄운다', '별도의 compose 프로젝트로 만들어 같은 네트워크에 연결하지 않는다', 'adminer에 restart: no를 준다', 'adminer를 depends_on으로 web에 걸어 둔다'],
      answer: 0,
      step: 7,
      why: '프로필이 붙은 서비스는 그 프로필을 켤 때만 시작됩니다. 별도 프로젝트로 두면 네트워크가 달라 DB 이름을 찾지 못하고, restart: no는 처음 up에서 뜨는 것을 막지 못하며, web이 의존하게 하면 오히려 항상 뜹니다.',
    },
    {
      q: '태그 불변 설정이 없는 공용 레지스트리를 여러 팀이 씁니다. 운영 서버가 반드시 테스트한 바로 그 이미지를 받게 하려면?',
      options: ['태그 이름을 길게 짓는다', 'latest를 쓰지 않는다', '레지스트리를 매일 백업한다', 'image에 digest(@sha256:…)를 함께 적어 배포한다'],
      answer: 3,
      step: 10,
      why: 'digest는 이미지 내용에서 계산되어 바뀌지 않고, 태그와 함께 적으면 digest가 우선합니다. 누군가 태그를 덮어써도 서버는 원래 이미지를 받습니다. 태그 이름 규칙만으로는 덮어쓰기를 막지 못합니다.',
    },
    {
      q: '배포 중 여러 서버가 postgres:16을 받다가 toomanyrequests 오류로 실패했습니다. 근본적인 대책으로 가장 알맞은 것은?',
      options: ['실패한 서버에서 몇 분 뒤 다시 시도한다', '서버마다 공인 IP를 따로 준다', '공개 이미지를 우리(클라우드) 레지스트리의 캐시나 미러를 거쳐 받도록 바꾼다', 'postgres 대신 latest 태그를 쓴다'],
      answer: 2,
      step: 11,
      why: 'Docker Hub의 익명 pull 한도는 같은 IP로 나가는 서버들이 함께 씁니다. pull-through 캐시나 미러를 쓰면 외부 한도와 장애에서 벗어나고, 같은 리전에서 받아 빨라집니다. 재시도는 임시방편이고, 태그를 바꿔도 한도는 그대로입니다.',
    },
    {
      q: '서버의 ~/.docker/config.json에 "auth": "ZGVwbG95…" 값이 있습니다. 이 값에 대한 설명으로 옳은 것은?',
      options: ['강력하게 암호화된 값이라 안전하다', '사용자:비밀번호를 base64로 인코딩한 것이라 쉽게 되돌릴 수 있다', '1회용 토큰이라 이미 만료됐다', '레지스트리의 공개키다'],
      answer: 1,
      step: 12,
      why: 'credential helper가 없으면 docker login은 자격 증명을 base64로만 바꿔 저장합니다. 암호화가 아니므로 비밀번호 파일처럼 다루고, pull 전용 단기 토큰이나 클라우드 credential helper를 씁니다.',
    },
    {
      q: 'GKE에서 돌릴 서비스의 이미지를 어디에 두는 것이 기본 선택일까요?',
      options: ['같은 리전의 Artifact Registry', 'Docker Hub 공개 저장소', '다른 클라우드의 ECR', '개발자 PC의 로컬 이미지'],
      answer: 0,
      step: 13,
      why: '같은 클라우드 · 같은 리전의 레지스트리는 IAM으로 비밀번호 없이 pull할 수 있고, 빠르며 리전 간 전송 요금도 줄어듭니다. 공개 저장소는 회사 코드를 노출하고 pull 한도가 있으며, 다른 클라우드의 레지스트리는 인증과 전송 비용이 더해집니다.',
    },
  ],
};
