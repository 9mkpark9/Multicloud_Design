export default {
  id: 'docker-network-volume',
  learn: [
    '컨테이너 안의 localhost는 자기 자신',
    '사용자 정의 bridge와 이름으로 찾는 내장 DNS',
    '-p 포트 매핑: 입구 하나만, 필요한 곳에만',
    '볼륨: 컨테이너를 지워도 남는 데이터',
    'bind mount와 볼륨을 고르는 기준',
    '볼륨은 백업이 아니다: 호스트 밖 사본',
  ],
  legend: [['req', '요청'], ['res', '응답'], ['ctrl', 'DNS 조회'], ['data', '데이터 · 백업'], ['bad', '실패 · 공격 · 유실']],
  metrics: [
    { id: 'conn', label: 'API → DB', icon: 'link' },
    { id: 'port', label: '외부 접속', icon: 'globe' },
    { id: 'data', label: '주문 데이터', icon: 'database' },
  ],
  codes: {
    first: {
      title: '터미널', lang: 'sh',
      text: `$ docker run -d --name db \\
    -e POSTGRES_PASSWORD=secret postgres:16
$ docker run -d --name api \\
    -e DB_HOST=localhost order-api:1.0

$ docker logs api
Error: connect ECONNREFUSED 127.0.0.1:5432`,
    },
    net: {
      title: '터미널', lang: 'sh',
      text: `$ docker network create shopnet

$ docker run -d --name db --network shopnet \\
    -e POSTGRES_PASSWORD=secret postgres:16
$ docker run -d --name api --network shopnet \\
    -e DB_HOST=db order-api:1.0

$ docker exec api getent hosts db
172.18.0.2      db`,
    },
    dns: {
      title: '터미널', lang: 'sh',
      text: `$ docker run -d --name batch \\
    -e DB_HOST=db settle-batch:2.0
$ docker logs batch
Error: getaddrinfo ENOTFOUND db

$ docker inspect batch \\
    | grep -A1 '"Networks"'
  "Networks": {
    "bridge": {   # 기본 bridge

$ docker network connect shopnet batch
$ docker exec batch getent hosts db
172.18.0.2      db`,
    },
    port: {
      title: '터미널', lang: 'sh',
      text: `$ docker run -d --name api --network shopnet \\
    -p 8080:3000 -e DB_HOST=db order-api:1.0

$ docker port api
3000/tcp -> 0.0.0.0:8080
$ curl localhost:8080/health
ok

# DB는 publish하지 않는다
# 꼭 필요하면 내 PC에만:
#   -p 127.0.0.1:5432:5432`,
    },
    exposed: {
      title: '터미널 (클라우드 VM)', lang: 'sh',
      text: `$ docker run -d --name db -p 5432:5432 \\
    -e POSTGRES_PASSWORD=secret postgres:16
$ sudo ufw status | grep 5432
5432         DENY        Anywhere
$ sudo ss -lntp | grep 5432
LISTEN 0.0.0.0:5432  users:(("docker-proxy"…

# 외부에서 → 접속됨 (ufw를 거치지 않음)
$ docker logs db | grep -c "authentication"
18342`,
    },
    lost: {
      title: '터미널', lang: 'sh',
      text: `$ docker rm -f db
$ docker run -d --name db --network shopnet \\
    -e POSTGRES_PASSWORD=secret postgres:16

$ docker volume ls
DRIVER    VOLUME NAME
local     3f9a1c…e2   # 옛 데이터, 주인 없음
local     b72d04…9c   # 새 db가 쓰는 빈 볼륨`,
    },
    vol: {
      title: '터미널', lang: 'sh',
      text: `$ docker volume create pgdata
$ docker run -d --name db --network shopnet \\
    -v pgdata:/var/lib/postgresql/data \\
    -e POSTGRES_PASSWORD=secret postgres:16

# 패치 버전으로 교체: 컨테이너만 바꾼다
$ docker rm -f db
$ docker run -d --name db --network shopnet \\
    -v pgdata:/var/lib/postgresql/data \\
    -e POSTGRES_PASSWORD=secret postgres:16.6

$ docker volume ls
DRIVER    VOLUME NAME
local     pgdata`,
    },
    backup: {
      title: '터미널', lang: 'sh',
      text: `# 매일 새벽: 덤프를 떠서 호스트 밖으로
$ docker exec db pg_dump -U postgres \\
    -Fc shop > shop-20261118.dump

$ aws s3 cp shop-20261118.dump \\
    s3://shop-backup/db/

# 복원 연습도 정기적으로
$ docker exec -i db pg_restore \\
    -U postgres -d shop_test \\
    < shop-20261118.dump`,
    },
  },
  scene: {
    zones: {
      net: { at: [0.1, -1.5], size: [3.4, 3.9], label: 'bridge (기본 네트워크)', color: 'blue' },
    },
    nodes: {
      api: { at: [1, 1], label: 'api', sub: 'order-api', icon: 'container', color: 'blue' },
      db: { kind: 'cyl', at: [2.6, -0.6], label: 'db (postgres)', icon: 'database', color: 'purple' },
      batch: { at: [0.6, -3.2], label: 'batch', sub: '기본 bridge', icon: 'container', color: 'gray' },
      user: { kind: 'client', at: [-2.6, 4.6], label: '브라우저' },
      port: { kind: 'tile', at: [-1.1, 3.1], label: '호스트 :8080', icon: 'door', color: 'orange' },
      dbport: { kind: 'tile', at: [4.4, -2.4], label: '호스트 :5432', icon: 'door', color: 'red' },
      atk: { kind: 'users', at: [6.2, -4.2], label: '인터넷 스캐너' },
      old: { kind: 'cyl', at: [5.1, 1.9], label: '익명 볼륨 #1', icon: 'hard-drive', color: 'gray' },
      vol: { kind: 'cyl', at: [4.1, -2.1], label: '익명 볼륨 #2', icon: 'hard-drive', color: 'gray' },
      bind: { kind: 'tile', at: [0.6, 3.6], label: './src (호스트 폴더)', icon: 'folder', color: 'sand' },
      bk: { kind: 'cyl', at: [1.1, 0.9], label: '오브젝트 스토리지', icon: 'archive', color: 'green' },
    },
    edges: {
      e_ad: { from: 'api', to: 'db', label: '5432' },
      e_bd: { from: 'batch', to: 'db', style: 'dashed', tone: 'bad', off: true },
      e_direct: { from: 'user', to: 'api', style: 'dashed', tone: 'bad', off: true },
      e_host: { from: 'user', to: 'api', tone: 'ok', label: ':3000', off: true },
      e_up: { from: 'user', to: 'port' },
      e_pa: { from: 'port', to: 'api', label: '→ 3000' },
      e_atk: { from: 'atk', to: 'dbport', tone: 'bad' },
      e_dbp: { from: 'dbport', to: 'db' },
      e_old: { from: 'db', to: 'old', style: 'dashed', tone: 'bad', off: true },
      e_vol: { from: 'db', to: 'vol' },
      e_bind: { from: 'bind', to: 'api', style: 'dashed' },
      e_bk: { from: 'db', to: 'bk', style: 'dashed' },
    },
  },
  steps: [
    {
      key: 'localhost', kind: 'problem', title: 'API가 DB를 찾지 못합니다',
      body: [
        '주문 API와 PostgreSQL을 각각 컨테이너로 띄웠습니다. 내 PC에서 개발하던 대로 API의 DB 주소를 <code>localhost:5432</code>로 두었더니 연결이 거부됩니다.',
        '컨테이너는 저마다 <b>네트워크 namespace</b>를 가집니다. 자기만의 네트워크 장치·IP·포트 공간이 있어서, 컨테이너 안의 <code>localhost</code>는 호스트도 DB도 아닌 <b>그 컨테이너 자신</b>이에요.',
      ],
      callout: { type: 'key', text: '컨테이너 둘은 "한 컴퓨터의 두 프로그램"이 아니라 <b>"같은 스위치에 꽂힌 두 컴퓨터"</b>처럼 생각하세요.' },
      code: { ref: 'first', hl: [4, 7] },
      show: ['net', 'api', 'db'],
      hide: ['e_ad'],
      tags: [{ on: 'api', text: 'localhost = 나 자신', tone: 'bad', icon: 'x', pos: 'left' }],
      flows: [{ path: ['api', [1.8, 0.2]], kind: 'bad', n: 2 }],
      metrics: { conn: ['연결 거부', 'bad'], port: '없음', data: ['컨테이너 안', 'warn'] },
      more: [
        { title: '직접 해보기', body: ['api 컨테이너의 네트워크 namespace 안에서 무엇이 보이는지 확인해 봅니다. 5432를 듣는 프로세스가 아예 없어요.'],
          code: { title: 'terminal', lang: 'sh', text: '$ docker exec api cat /etc/hosts\n127.0.0.1   localhost\n172.17.0.3  5c1d2e3f4a5b\n\n$ docker exec api sh -c \'nc -zv localhost 5432\'\nnc: localhost (127.0.0.1:5432): Connection refused' } },
        { title: '출력 읽기', body: [
          '<code>/etc/hosts</code>의 <code>172.17.0.3</code>이 이 컨테이너 자신의 IP, 그 옆이 컨테이너 ID로 된 호스트 이름입니다. <code>localhost</code>(127.0.0.1)는 이 namespace 안의 루프백 장치라, 같은 namespace에서 5432를 듣는 프로세스가 있을 때만 연결됩니다. DB는 다른 namespace에 있으니 여기서는 보이지 않아요.',
        ] },
        { title: '흔한 실수', list: [
          '개발 PC의 <code>.env</code>(<code>DB_HOST=localhost</code>)를 그대로 이미지에 넣는 것. 주소는 환경마다 다르니 실행할 때 주입합니다.',
          'Docker Desktop에서 호스트 PC의 서비스에 닿고 싶다면 <code>host.docker.internal</code>이라는 특별한 이름을 씁니다. 컨테이너끼리 통신할 때 쓰는 이름은 아닙니다.', '반대로 앱이 컨테이너 안에서 <code>127.0.0.1</code>에만 바인딩하면, 이번엔 바깥(다른 컨테이너 · 호스트)에서 그 앱에 닿지 못합니다. 서버 앱은 컨테이너 안에서 <code>0.0.0.0</code>으로 듣게 합니다.',
        ] },
      ],
    },
    {
      key: 'bridge', kind: 'concept', title: '기본 bridge: IP로는 닿습니다',
      body: [
        'Docker는 따로 정하지 않으면 컨테이너를 기본 <b>bridge</b> 네트워크에 연결합니다. 호스트 안의 가상 스위치(<code>docker0</code>)이고, 컨테이너마다 <code>172.17.0.x</code> 같은 사설 IP를 받습니다.',
        '그래서 DB 컨테이너의 IP를 알아내 적으면 연결은 됩니다. 문제는 그 IP가 고정이 아니라는 점이에요. DB 컨테이너를 다시 만들면 다른 IP를 받을 수 있고, 기본 bridge에서는 컨테이너 <b>이름</b>으로 찾을 수도 없습니다.',
      ],
      callout: { type: 'warn', text: 'IP를 설정에 박아 두면 DB 컨테이너를 교체하는 순간 끊깁니다. 서버에서 IP 대신 DNS 이름을 쓰는 것과 같은 이유예요.' },
      show: ['e_ad'],
      tags: [
        { on: 'api', text: '172.17.0.3', pos: 'left' },
        { on: 'db', text: '172.17.0.2', tone: 'warn', pos: 'right' },
      ],
      flows: [{ path: ['api', 'db'], kind: 'req', n: 2 }, { path: ['db', 'api'], kind: 'res', n: 2, delay: 1.4 }],
      metrics: { conn: ['IP로 연결', 'warn'] },
      changes: [['+', 'DB_HOST=172.17.0.2'], ['~', '연결은 되지만 IP가 바뀌면 끊김']],
      more: [
        { title: '동작 원리', body: [
          '컨테이너마다 가상 이더넷 케이블(<b>veth</b> 쌍) 한 줄이 생겨, 한쪽 끝은 컨테이너 안의 <code>eth0</code>, 다른 끝은 호스트의 <code>docker0</code> 브리지에 꽂힙니다. 같은 브리지에 꽂힌 컨테이너끼리는 스위치처럼 바로 통신해요.',
          '밖으로 나갈 때는 호스트가 출발지 주소를 자기 IP로 바꿔 주는 NAT(masquerade)를 거칩니다. 그래서 컨테이너에서 인터넷 접속은 기본으로 됩니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker network ls\nNETWORK ID     NAME     DRIVER    SCOPE\n1a2b3c4d5e6f   bridge   bridge    local\n7a8b9c0d1e2f   host     host      local\n3e4f5a6b7c8d   none     null      local\n\n$ docker inspect db \\\n  -f \'{{.NetworkSettings.IPAddress}}\'\n172.17.0.2' } },
        { title: '더 생각해 볼 것', body: ['기본 bridge는 하위 호환 때문에 남아 있는 부분이 많습니다. 예전에는 <code>--link</code> 옵션으로 이름을 이어 줬지만 지금은 권장하지 않아요. 새로 만드는 구성은 다음 단계의 사용자 정의 네트워크를 기본으로 씁니다.'] },
        { title: '흔한 실수', list: ['컨테이너 서브넷(172.17.0.0/16 등)이 회사 VPN이나 VPC 대역과 겹치면, 그 대역으로 가는 트래픽이 컨테이너 쪽으로 빠져 사라집니다. Docker 데몬 설정에서 기본 대역을 바꿀 수 있어요.', '<code>docker inspect</code>로 찾은 IP를 설정 파일에 적어 두는 것. 재생성할 때마다 바뀔 수 있는 값입니다.'] },
      ],
    },
    {
      key: '이름으로', kind: 'solution', title: '사용자 정의 네트워크와 내장 DNS',
      body: [
        '<code>docker network create shopnet</code>으로 네트워크를 직접 만들고 두 컨테이너를 연결합니다. <b>사용자 정의 bridge</b>에서는 Docker의 <b>내장 DNS</b>가 컨테이너 이름을 IP로 풀어 줘요.',
        'API 설정은 <code>DB_HOST=db</code>면 됩니다. DB를 다시 만들어 IP가 바뀌어도 이름은 그대로라 연결이 이어집니다. 다른 네트워크의 컨테이너끼리는 닿지 않으니, 네트워크는 <b>격리 단위</b>이기도 합니다.',
      ],
      callout: { type: 'tip', text: '다음 레슨의 Docker Compose는 이런 네트워크를 자동으로 만들어 줍니다. 서비스 이름이 곧 주소가 돼요.' },
      code: { ref: 'net', hl: [1, 3, 6, 8, 9] },
      set: { net: { label: 'shopnet (사용자 정의)', color: 'teal' } },
      tags: [
        { on: 'api', text: '내장 DNS에 "db"?', icon: 'signpost' },
        { on: 'db', text: 'db → 172.18.0.2', tone: 'ok' },
      ],
      flows: [{ path: ['api', 'db'], kind: 'ctrl' }, { path: ['api', 'db'], kind: 'req', n: 2, delay: 1.2 }],
      metrics: { conn: ['이름 db로', 'ok'] },
      changes: [['+', '사용자 정의 네트워크 shopnet'], ['~', 'DB_HOST: IP → db']],
      more: [
        { title: '동작 원리', body: [
          '사용자 정의 네트워크의 컨테이너는 <code>/etc/resolv.conf</code>에 <code>127.0.0.11</code>이라는 DNS 서버가 적힙니다. Docker 엔진이 이 주소에서 듣다가, 같은 네트워크에 있는 컨테이너 이름이나 별칭이면 IP로 답하고 나머지는 호스트의 DNS로 넘깁니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker exec api cat /etc/resolv.conf\nnameserver 127.0.0.11\n\n# 이름 하나를 더 붙이기 (별칭)\n$ docker network connect --alias postgres \\\n    shopnet db\n$ docker exec api getent hosts postgres\n172.18.0.2      postgres' } },
        { title: '실무 팁', list: [
          '네트워크를 용도별로 나누세요. 예: 바깥과 닿는 <code>front</code>(웹 · API)와 DB가 있는 <code>back</code>. API만 두 네트워크에 모두 연결하면 웹 컨테이너는 DB에 닿을 수 없습니다.',
          '같은 별칭을 여러 컨테이너에 붙이면 DNS가 여러 IP를 돌려줍니다. 간단한 분산에 쓰이지만, 제대로 된 로드밸런싱은 아닙니다.',
          '<code>docker network inspect shopnet</code>으로 어떤 컨테이너가 연결돼 있는지, 서브넷이 무엇인지 확인합니다. 회사 VPN 대역과 겹치면 서브넷을 직접 지정해 만듭니다.', '<code>docker network create --internal back</code>으로 만든 네트워크는 바깥(인터넷)으로 나가는 길이 없습니다. DB처럼 외부 접속이 필요 없는 컨테이너만 두는 망에 씁니다.',
        ] },
      ],
    },
    {
      key: '이름 실패', kind: 'case', title: '사례: 새 배치 컨테이너만 db를 못 찾습니다',
      body: [
        '정산 배치를 새로 띄웠더니 <code>ENOTFOUND db</code>로 바로 죽었습니다. api는 같은 <code>db</code>라는 이름으로 잘 접속하고 있었어요.',
        '배치를 띄울 때 <code>--network</code>를 빼먹어 <b>기본 bridge</b>에 붙은 것이 원인이었습니다. 이름 풀이는 <b>같은 사용자 정의 네트워크 안에서만</b> 됩니다. <code>docker network connect shopnet batch</code>로 이어 주자 바로 풀렸습니다.',
      ],
      callout: { type: 'tip', text: '이름이 안 풀리면 먼저 "둘이 <b>같은 네트워크</b>에 있나?"를 봅니다. 다음은 이름 철자, 그다음이 DB 쪽 상태입니다.' },
      code: { ref: 'dns', hl: [4, 8, 10, 12] },
      show: ['batch', 'e_bd'],
      hide: ['api'],
      set: { batch: { state: 'down' } },
      tags: [{ on: 'batch', text: 'ENOTFOUND db', tone: 'bad', icon: 'x', pos: 'right' }],
      flows: [{ path: ['batch', 'db'], kind: 'bad', n: 2 }],
      changes: [['-', 'batch: 기본 bridge (이름 풀이 없음)'], ['+', 'network connect shopnet']],
      more: [
        { title: '점검 순서', list: [
          '<b>같은 네트워크인가</b>: <code>docker inspect</code>로 각 컨테이너의 네트워크 이름을 비교합니다.',
          '<b>이름이 풀리나</b>: <code>docker exec batch getent hosts db</code>. 아무것도 안 나오면 DNS 단계에서 막힌 것입니다.',
          '<b>포트가 열려 있나</b>: 이름은 풀리는데 연결이 거부되면 DB가 아직 준비 중이거나 다른 포트를 듣는 것입니다.',
        ] },
        { title: '출력 읽기', body: [
          '<code>ENOTFOUND</code>(또는 <code>Name or service not known</code>)는 <b>이름 풀이</b> 실패, <code>ECONNREFUSED</code>는 이름은 풀렸는데 <b>그 포트에서 아무도 안 받는</b> 것, 응답 없이 시간이 지나는 <code>ETIMEDOUT</code>은 경로가 막힌 것입니다. 오류 이름만 구분해도 어디를 볼지 절반은 정해져요.',
        ] },
        { title: '흔한 실수', body: ['Compose 프로젝트 두 개(예: 쇼핑몰과 정산)를 따로 띄우면 각자 자기 네트워크를 만들어 서로의 서비스 이름을 모릅니다. 공유할 네트워크를 미리 만들고 양쪽 파일에서 <code>external</code> 네트워크로 연결합니다. 서비스 이름, 별칭, 컨테이너 이름이 섞여 쓰이면서 철자가 미묘하게 다른 경우도 흔합니다.'] },
      ],
    },
    {
      key: '밖에서 접속', kind: 'problem', title: '브라우저에서는 열리지 않습니다',
      body: [
        '이제 브라우저로 <code>localhost:3000</code>에 접속해 봅니다. 응답이 없습니다. API의 3000번 포트는 shopnet 안에서만 보이고, 호스트 바깥에서 들어오는 길은 없기 때문입니다.',
        'Dockerfile의 <code>EXPOSE 3000</code>은 "이 포트를 쓴다"는 메모일 뿐 포트를 열지 않는다는 것, 앞 레슨에서 봤죠. 바깥과 잇는 일은 컨테이너를 <b>실행할 때</b> 정합니다.',
      ],
      callout: { type: 'key', text: 'bridge 네트워크는 <b>안에서 밖으로</b>(인터넷 접속)는 기본으로 되지만, <b>밖에서 안으로</b>는 열어 주기 전까지 막혀 있습니다.' },
      hide: ['batch', 'e_bd'],
      show: ['api', 'user', 'e_direct'],
      set: { batch: { state: null } },
      tags: [{ on: 'user', text: ':3000 응답 없음', tone: 'bad', pos: 'bottom' }],
      flows: [{ path: ['user', 'api'], kind: 'bad', n: 2 }],
      metrics: { port: ['막힘', 'bad'] },
      more: [
        { title: '왜 막혀 있나', body: [
          '컨테이너의 IP(<code>172.18.0.x</code>)는 호스트 안에서만 의미가 있는 사설 주소입니다. 바깥 PC나 인터넷은 이 주소로 가는 길을 모릅니다. 호스트 자신의 셸에서는 컨테이너 IP로 바로 접속이 되기도 해서(Linux), "서버에서 curl은 되는데 밖에서는 안 된다"는 혼란이 자주 생깁니다. 이 기본값은 실수로 서비스를 노출하지 않게 해 주는 안전장치이기도 합니다.',
        ] },
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker port api\n                       # 아무것도 없음\n$ docker inspect api \\\n  -f \'{{json .Config.ExposedPorts}}\'\n{"3000/tcp":{}}        # EXPOSE의 메모만 있음' } },
        { title: '출력 읽기', body: ['<code>docker port</code>가 비어 있으면 호스트 쪽으로 열린 포트가 하나도 없다는 뜻입니다. <code>ExposedPorts</code>는 이미지에 적힌 메모라서, <code>-P</code>(대문자) 옵션이 이 목록을 보고 임의의 호스트 포트를 열어 줄 때만 쓰입니다.'] },
        { title: '실무 팁', list: ['접속이 안 되면 바깥에서 안쪽으로 한 칸씩 봅니다. 브라우저 → 호스트 포트(<code>docker port</code>) → 컨테이너 안에서 <code>curl localhost:3000</code> 순서로 확인하면 어느 칸에서 막혔는지 바로 나옵니다.', '클라우드 VM이라면 VM 바깥의 보안 그룹 · 방화벽 규칙까지가 밖에서 안으로 오는 길입니다. Docker 설정이 맞아도 여기서 막히면 응답이 없습니다.'] },
      ],
    },
    {
      key: '-p 매핑', kind: 'solution', title: '-p로 호스트 포트를 컨테이너에 잇기',
      body: [
        '<code>-p 8080:3000</code>은 "호스트의 8080번으로 온 연결을 이 컨테이너의 3000번으로 넘겨라"입니다. 왼쪽이 호스트, 오른쪽이 컨테이너 포트예요. 이제 <code>localhost:8080</code>이 열립니다.',
        '바깥에 열 것은 <b>입구 하나</b>뿐입니다. DB는 같은 네트워크의 API만 쓰면 되니 <code>-p</code>를 주지 않습니다.',
      ],
      callout: { type: 'tip', text: '<code>-p 127.0.0.1:8080:3000</code>처럼 앞에 주소를 붙이면 그 인터페이스에만 열립니다. 주소를 생략하면 <b>모든 인터페이스</b>(0.0.0.0)입니다.' },
      code: { ref: 'port', hl: [2, 4, 9, 10, 11] },
      hide: ['e_direct', 'net', 'db'],
      show: ['port'],
      tags: [{ on: 'port', text: '호스트 8080 → 3000', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['user', 'port', 'api'], kind: 'req', n: 2 }, { path: ['api', 'port', 'user'], kind: 'res', n: 2, delay: 1.6 }],
      metrics: { port: ['8080 → 3000', 'ok'] },
      changes: [['+', '-p 8080:3000'], ['-', 'DB 포트 공개']],
      more: [
        { title: '동작 원리', body: [
          'Docker는 <code>-p</code>를 보면 호스트의 iptables(nat 테이블)에 "8080으로 오면 172.18.0.3:3000으로 목적지를 바꿔라"(DNAT) 규칙을 넣습니다. 일부 경로를 위해 <code>docker-proxy</code>라는 작은 프로세스가 그 포트를 듣기도 해요. 그래서 <code>ss -lntp</code>에 docker-proxy가 보입니다.',
        ] },
        { title: '쓰는 모양', rows: [
          ['-p 8080:3000', '모든 인터페이스의 8080', 'warn'],
          ['-p 127.0.0.1:8080:3000', '호스트 안에서만', 'ok'],
          ['-p 3000', '호스트 포트는 임의로', 'info'],
          ['-p 53:53/udp', 'UDP 포트', 'info'],
        ] },
        { title: '흔한 실수', list: [
          '<code>Bind for 0.0.0.0:8080 failed: port is already allocated</code>: 같은 호스트 포트를 다른 컨테이너(또는 프로세스)가 쓰고 있습니다. 컨테이너 포트는 같아도 되지만 <b>호스트 포트</b>는 하나만 차지할 수 있어요.',
          '앱이 컨테이너 안에서 <code>127.0.0.1:3000</code>에만 바인딩하면 매핑이 있어도 연결이 안 됩니다. 컨테이너 안의 앱은 <code>0.0.0.0</code>에서 들어야 합니다.',
          '운영 서버에서는 앱 컨테이너도 직접 열기보다 앞에 리버스 프록시나 클라우드 로드밸런서를 두고, 그 뒤로만 잇는 경우가 많습니다.',
        ] },
      ],
    },
    {
      key: 'DB 노출', kind: 'case', title: '사례: 방화벽을 켰는데 DB가 열려 있었습니다',
      body: [
        '클라우드 VM에서 개발 편의로 DB를 <code>-p 5432:5432</code>로 띄웠습니다. <code>ufw</code>에서 5432를 막았으니 안전하다고 생각했는데, 며칠 뒤 DB 로그에 인터넷 스캐너의 로그인 시도가 수만 건 쌓여 있었습니다.',
        'Docker가 넣는 포트 매핑 규칙은 패킷이 ufw의 INPUT 규칙에 닿기 <b>전에</b> 목적지를 바꿔, 컨테이너로 <b>전달</b>합니다. 호스트 방화벽을 지나지 않는 길이 생긴 거예요.',
      ],
      callout: { type: 'warn', text: 'DB 포트는 publish하지 않습니다. 필요하면 <code>127.0.0.1</code>에만 열고 SSH 터널로 접속하고, 클라우드의 <b>보안 그룹 · 방화벽 규칙</b>에서도 막아 이중으로 지킵니다.' },
      code: { ref: 'exposed', hl: [1, 4, 6, 10] },
      hide: ['user', 'port', 'api'],
      show: ['db', 'dbport', 'atk'],
      set: { db: { state: 'hot' } },
      tags: [{ on: 'dbport', text: 'ufw 우회', tone: 'bad', icon: 'unlock', pos: 'bottom' }],
      flows: [{ path: ['atk', 'dbport', 'db'], kind: 'bad', n: 3 }],
      metrics: { port: ['5432도 열림', 'bad'] },
      changes: [['-', 'DB가 인터넷에 노출'], ['~', '호스트 방화벽(ufw)은 무력']],
      more: [
        { title: '동작 원리', body: [
          '포트 매핑은 nat 테이블의 PREROUTING 단계에서 목적지를 컨테이너 IP로 바꿉니다. 그 순간 패킷은 "호스트로 들어오는 것"(INPUT)이 아니라 "컨테이너로 지나가는 것"(FORWARD)이 되고, ufw가 기본으로 관리하는 INPUT 규칙은 적용되지 않아요. Docker는 사용자 규칙을 넣으라고 <code>DOCKER-USER</code> 체인을 따로 둡니다.',
        ] },
        { title: '해결책 고르기', list: [
          '<b>가장 좋음</b>: DB는 publish하지 않고 같은 네트워크의 앱만 접근합니다.',
          '<b>잠깐 들여다볼 때</b>: <code>-p 127.0.0.1:5432:5432</code> + <code>ssh -L 5432:localhost:5432 vm</code>로 내 PC에서만.',
          '<b>바깥 방어선</b>: 클라우드 보안 그룹(AWS) · NSG(Azure) · 방화벽 규칙(GCP) · ACG(NCP)에서 필요한 포트만 허용합니다. 이건 VM 밖에서 막으니 Docker 규칙과 무관하게 동작해요.', '<b>DOCKER-USER 체인</b>: 호스트에서 꼭 막아야 한다면 Docker가 사용자 규칙용으로 남겨 둔 이 체인에 규칙을 넣습니다. ufw 설정만으로는 부족합니다.',
        ] },
        { title: '점검 명령', code: { title: 'terminal', lang: 'sh', text: '# 모든 인터페이스에 열린 포트 찾기\n$ docker ps --format \'{{.Names}}\\t{{.Ports}}\' \\\n    | grep 0.0.0.0\ndb    0.0.0.0:5432->5432/tcp   # ← 위험' } },
      ],
    },
    {
      key: '다른 모드', kind: 'concept', title: 'bridge 말고도: host와 none',
      body: [
        '<code>--network host</code>는 network namespace를 만들지 않고 <b>호스트의 네트워크를 그대로</b> 씁니다. 앱이 3000을 열면 곧 호스트의 3000이라 <code>-p</code>가 필요 없고, NAT를 거치지 않아 조금 빠릅니다.',
        '대신 포트 충돌을 직접 피해야 하고 네트워크 격리가 사라집니다. 반대로 <code>--network none</code>은 루프백만 남겨, 네트워크가 필요 없는 일괄 작업을 완전히 끊어 둡니다.',
      ],
      callout: { type: 'tip', text: '기본값은 사용자 정의 bridge입니다. host 모드는 성능이 정말 중요하거나 호스트 네트워크를 다뤄야 하는 도구(모니터링 에이전트 등)에만 씁니다.' },
      hide: ['db', 'dbport', 'atk'],
      show: ['user', 'api', 'e_host'],
      set: { db: { state: null }, api: { sub: 'host 모드' } },
      tags: [{ on: 'api', text: '앱 :3000 = 호스트 :3000', tone: 'info', pos: 'right' }],
      flows: [{ path: ['user', 'api'], kind: 'req', n: 2 }, { path: ['api', 'user'], kind: 'res', n: 2, delay: 1.4 }],
      panel: {
        title: '네트워크 드라이버', icon: 'network',
        rows: [['bridge', '기본 · 호스트 안 가상 스위치', 'ok'], ['host', '호스트 네트워크 공유', 'warn'], ['none', '네트워크 없음', 'mute'], ['overlay', '여러 호스트 (Swarm)', 'info'], ['macvlan', 'LAN에 직접 MAC 부여', 'info']],
      },
      metrics: { port: ['host 모드 :3000', 'warn'] },
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker run -d --name api2 --network host \\\n    order-api:1.0\n$ ss -lntp | grep 3000      # 호스트에서\nLISTEN 0.0.0.0:3000  users:(("node",pid=5512…\n\n$ docker run --rm --network none alpine ip addr\n1: lo: <LOOPBACK,UP> …     # 루프백만' } },
        { title: '주의할 점', list: [
          'host 모드에서는 <code>-p</code>가 무시됩니다. 컨테이너 두 개가 같은 포트를 쓰면 두 번째는 시작하지 못해요.',
          '앱이 <code>0.0.0.0</code>에서 들으면 호스트의 <b>모든 인터페이스</b>에 그대로 열립니다. 클라우드 보안 그룹이 마지막 방어선이 됩니다.',
          'host 모드는 Linux 호스트를 전제로 설계되었습니다. Docker Desktop(Mac · Windows)에서는 동작 방식이 다르거나 제한될 수 있으니 확인하고 쓰세요.',
        ] },
        { title: '여러 호스트로 가면', body: ['overlay 드라이버는 여러 호스트의 컨테이너를 한 네트워크처럼 잇습니다(Docker Swarm). 실무에서 여러 서버의 컨테이너 네트워크는 대개 쿠버네티스의 CNI가 맡아요. 7장 Service 레슨에서 이어집니다.'] },
        { title: '실무 팁', list: ['쿠버네티스에서는 같은 일을 <code>hostNetwork: true</code>로 합니다. 노드 모니터링 에이전트 같은 일부 시스템 Pod만 쓰는 설정이에요.', '<code>--network container:api</code>는 다른 컨테이너의 network namespace를 함께 씁니다. 디버그 도구 컨테이너를 앱에 붙여 같은 <code>localhost</code>를 보게 할 때 유용합니다.'] },
      ],
    },
    {
      key: '사라진 주문', kind: 'case', title: '사례: DB를 교체했더니 주문이 0건',
      body: [
        'PostgreSQL 패치 버전을 올리려고 <code>docker rm -f db</code>로 지우고 새 이미지로 다시 띄웠습니다. 주문 테이블이 비어 있었습니다. 컨테이너를 지우면 그 안의 데이터도 함께 사라진다는 이미지 레슨의 그 함정이에요.',
        '조금 더 복잡한 점도 있습니다. 공식 postgres 이미지는 데이터 디렉터리를 <b>익명 볼륨</b>에 둡니다. 옛 데이터는 디스크 어딘가에 남았을 수 있지만, 새 컨테이너는 새 익명 볼륨을 받아 빈 DB로 시작합니다.',
      ],
      callout: { type: 'warn', text: '이름 없는 볼륨은 누구도 다시 찾지 않고 디스크만 차지하다가, 정리 명령에 지워집니다. <b>데이터의 위치를 직접 이름 붙여 정하지 않으면</b> 사실상 잃은 것입니다.' },
      code: { ref: 'lost', hl: [1, 7, 8] },
      hide: ['user', 'api', 'e_host'],
      show: ['db', 'old', 'vol', 'e_old'],
      set: { old: { state: 'dim' }, api: { sub: 'order-api' } },
      tags: [
        { on: 'old', text: '옛 주문 · 주인 없음', tone: 'bad', pos: 'right' },
        { on: 'vol', text: '빈 DB', tone: 'warn', pos: 'right' },
      ],
      flows: [{ path: ['db', 'vol'], kind: 'data', n: 2 }],
      metrics: { port: ['8080 → 3000', 'ok'], data: ['0건', 'bad'] },
      changes: [['-', '컨테이너 교체로 주문 데이터 유실'], ['~', '익명 볼륨 #1은 고아로 남음']],
      more: [
        { title: '왜 익명 볼륨이 생기나', body: [
          'postgres 이미지의 Dockerfile에는 데이터 경로에 <code>VOLUME</code> 명령이 있습니다. 실행할 때 그 경로에 아무것도 연결하지 않으면 Docker가 임의 이름의 볼륨을 자동으로 만들어 붙여요. 컨테이너가 바뀔 때마다 새 볼륨이 생기니, 데이터는 남아도 <b>다시 찾아 붙일 이름</b>이 없습니다.',
        ] },
        { title: '살려 볼 수 있을까', code: { title: 'terminal', lang: 'sh', text: '# 고아 볼륨이 아직 있다면 내용 확인\n$ docker run --rm -v 3f9a1c…e2:/d alpine \\\n    ls /d\nPG_VERSION  base  global  pg_wal …\n\n# 이름 있는 볼륨처럼 다시 붙여 띄우기\n$ docker run -d --name db-old \\\n    -v 3f9a1c…e2:/var/lib/postgresql/data \\\n    -e POSTGRES_PASSWORD=secret postgres:16' } },
        { title: '흔한 실수', list: [
          '<code>docker rm -v</code>와 <code>docker compose down -v</code>는 익명(또는 해당) 볼륨까지 지웁니다. 이때는 정말로 데이터가 사라져요.',
          '<code>docker volume prune</code>은 쓰이지 않는 볼륨을 지웁니다. 최근 Docker는 기본으로 익명 볼륨만 대상으로 하지만, <code>-a</code>를 붙이면 이름 있는 볼륨도 지웁니다.',
        ] },
        { title: '실무 팁', list: ['운영 DB 컨테이너를 건드리기 전에는 덤프부터 뜹니다. 오늘 같은 사고도 덤프 하나가 있었다면 몇 분 만에 끝났을 일입니다.', '이미지에 VOLUME이 선언돼 있는지는 <code>docker image inspect postgres:16 -f \'{{json .Config.Volumes}}\'</code>로 확인합니다. 데이터를 다루는 공식 이미지는 대부분 선언돼 있습니다.'] },
      ],
    },
    {
      key: '볼륨', kind: 'solution', title: '이름 있는 볼륨에 데이터를 둡니다',
      body: [
        '<b>볼륨</b>은 Docker가 관리하는 컨테이너 밖의 저장 공간입니다. <code>-v pgdata:/var/lib/postgresql/data</code>처럼 <b>이름</b>을 붙여 연결하면, 컨테이너를 지우고 새 이미지로 다시 만들어도 같은 볼륨을 다시 꽂을 수 있어요.',
        '컨테이너는 버리는 것, 볼륨은 남기는 것으로 역할이 나뉩니다. 볼륨은 직접 지우기 전까지 남고, 파일은 호스트의 Docker 데이터 디렉터리(Linux 기본값 <code>/var/lib/docker/volumes</code>) 아래에 있습니다.',
      ],
      callout: { type: 'tip', text: '같은 메이저 버전 안의 교체(16.x → 16.y)는 이렇게 됩니다. 메이저 버전을 올릴 때는 데이터 형식이 달라 <code>pg_upgrade</code>나 덤프·복원이 따로 필요해요.' },
      code: { ref: 'vol', hl: [1, 3, 7, 8, 10, 14] },
      hide: ['old', 'e_old'],
      set: { vol: { label: 'pgdata', color: 'teal' } },
      focus: ['vol'],
      tags: [{ on: 'vol', text: '컨테이너를 지워도 남음', tone: 'ok', icon: 'check', pos: 'right' }],
      flows: [{ path: ['db', 'vol'], kind: 'data', n: 3 }],
      metrics: { data: ['pgdata 볼륨', 'ok'] },
      changes: [['+', '이름 있는 볼륨 pgdata'], ['~', '컨테이너 교체 후에도 주문 유지']],
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: '$ docker volume inspect pgdata\n[{\n  "Driver": "local",\n  "Mountpoint": "/var/lib/docker/volumes/pgdata/_data",\n  "Name": "pgdata"\n}]\n\n# 같은 뜻, 더 명시적인 형식\n$ docker run -d --name db \\\n  --mount type=volume,src=pgdata,\\\ndst=/var/lib/postgresql/data \\\n  -e POSTGRES_PASSWORD=secret postgres:16' } },
        { title: '알아 두면 좋은 동작', list: [
          '<b>빈</b> 이름 있는 볼륨을 이미지에 파일이 있는 경로에 붙이면, Docker가 이미지의 파일을 볼륨으로 먼저 복사해 줍니다. 이미 내용이 있는 볼륨이면 볼륨의 내용이 보여요.',
          '볼륨 하나를 여러 컨테이너에 붙일 수 있습니다. 다만 DB처럼 파일을 독점해야 하는 프로그램 두 개가 같은 데이터 디렉터리를 쓰면 데이터가 망가집니다.',
          '<code>-v pgdata:/path:ro</code>처럼 읽기 전용으로도 붙일 수 있습니다.', '볼륨 드라이버 옵션으로 NFS 같은 네트워크 스토리지에 볼륨을 둘 수도 있습니다. 다만 DB 데이터를 네트워크 파일시스템에 두는 것은 성능 · 잠금 문제로 신중해야 합니다.',
        ] },
        { title: '실무 팁', body: ['컨테이너를 교체하기 전에는 늘 "이 컨테이너의 데이터는 어느 볼륨에 있나?"를 <code>docker inspect db -f \'{{json .Mounts}}\'</code>로 확인하는 습관을 들이세요. <code>Name</code>이 긴 해시라면 익명 볼륨입니다. 볼륨 이름은 <code>shop-pgdata</code>처럼 용도가 드러나게 지어야, 나중에 정리할 때 지워도 되는지 판단할 수 있습니다.'] },
      ],
    },
    {
      key: 'bind mount', kind: 'concept', title: 'bind mount: 호스트 폴더를 그대로',
      body: [
        '<b>bind mount</b>는 호스트의 특정 경로를 컨테이너 안에 그대로 보여 줍니다. <code>-v "$(pwd)/src:/app/src"</code>로 소스 폴더를 연결하면 내 PC에서 고친 코드가 바로 컨테이너에 보여서, 개발할 때 편합니다.',
        '대신 호스트의 경로와 파일 권한(UID)에 묶이고, Mac·Windows의 Docker Desktop에서는 파일 공유를 거쳐 느릴 수 있어요. 운영 데이터는 볼륨, 개발용 소스와 설정 파일은 bind mount가 기본 선택입니다.',
      ],
      callout: { type: 'tip', text: '<code>-v</code>의 왼쪽이 <code>/</code>로 시작하는 경로면 bind mount, 이름이면 볼륨입니다. 헷갈리면 <code>--mount type=bind,...</code>처럼 종류를 적는 형식을 쓰세요. 설정 파일에는 <code>:ro</code>(읽기 전용)를 붙입니다.' },
      show: ['api', 'bind'],
      panel: {
        title: '데이터를 어디에 둘까', icon: 'hard-drive',
        rows: [['볼륨', 'Docker가 관리 · DB 데이터', 'ok'], ['bind mount', '호스트 경로 · 소스 · 설정', 'info'], ['tmpfs', '메모리 · 임시 파일', 'mute'], ['쓰기 레이어', '컨테이너와 함께 삭제', 'bad']],
      },
      tags: [{ on: 'bind', text: '고치면 바로 반영', tone: 'info', icon: 'pencil', pos: 'left' }],
      flows: [{ path: ['bind', 'api'], kind: 'data', n: 2 }, { path: ['db', 'vol'], kind: 'data', delay: 0.8 }],
      more: [
        { title: '설정 예시', code: { title: 'terminal', lang: 'sh', text: '# 개발: 소스는 bind, 설정은 읽기 전용 bind\n$ docker run -d --name api --network shopnet \\\n    -v "$(pwd)/src:/app/src" \\\n    -v "$(pwd)/nginx.conf:/etc/nginx.conf:ro" \\\n    --tmpfs /tmp:size=64m \\\n    -p 8080:3000 order-api:dev' } },
        { title: '흔한 실수', list: [
          '<b>이미지 파일이 가려짐</b>: bind mount는 컨테이너 경로에 원래 있던 파일을 덮어 가립니다. <code>/app</code> 전체를 bind하면 이미지 안에 설치한 <code>node_modules</code>가 안 보여 "모듈을 찾을 수 없음"이 납니다.',
          '<b>권한</b>: Linux에서 컨테이너가 root로 만든 파일은 호스트에서도 root 소유가 됩니다. 반대로 non-root 컨테이너는 호스트 폴더에 쓰지 못할 수 있어요. UID를 맞추거나 <code>--user $(id -u)</code>로 띄웁니다.',
          '<b>오타</b>: 호스트 경로가 없으면 <code>-v</code>는 빈 폴더를 새로 만들어 버려, 오류 없이 빈 설정으로 뜹니다. <code>--mount type=bind</code>는 경로가 없으면 오류를 내 줍니다.',
        ] },
        { title: '더 생각해 볼 것', body: ['bind mount는 호스트 경로에 묶이므로 "어느 서버에서나 같은 동작"이라는 컨테이너의 장점을 일부 내줍니다. 운영에서 설정 파일을 넣어야 한다면 이미지에 넣거나, 쿠버네티스라면 ConfigMap으로 주입하는 편이 이식성이 좋습니다(7장). 개발 중 자동 재시작이 필요하면 nodemon 같은 도구를 컨테이너 안에서 돌려 bind된 파일 변경을 감지하게 합니다.'] },
      ],
    },
    {
      key: '볼륨의 한계', kind: 'concept', title: '볼륨은 그 호스트에 묶여 있습니다',
      body: [
        '볼륨은 컨테이너보다 오래 살지만 <b>호스트 디스크</b>보다 오래 살지는 못합니다. VM이 망가지거나 디스크가 꽉 차면 함께 위험하고, 다른 서버의 컨테이너는 이 볼륨을 볼 수 없어요.',
        '그래서 볼륨은 백업이 아닙니다. <code>pg_dump</code> 같은 DB 도구로 정기적으로 덤프해 오브젝트 스토리지처럼 <b>호스트 밖</b>에 두고, 복원도 연습합니다.',
      ],
      callout: { type: 'warn', text: '실행 중인 DB의 볼륨 폴더를 <code>tar</code>로 복사하면 쓰는 도중의 파일이 섞여 <b>깨진 백업</b>이 될 수 있습니다. DB는 DB의 백업 도구로 뜹니다.' },
      code: { ref: 'backup', hl: [2, 3, 5, 6] },
      hide: ['net', 'api', 'bind'],
      show: ['bk'],
      tags: [{ on: 'bk', text: '호스트 밖 사본', tone: 'ok', icon: 'archive', pos: 'bottom' }],
      flows: [{ path: ['vol', 'db'], kind: 'data' }, { path: ['db', 'bk'], kind: 'data', n: 2, delay: 0.8 }],
      metrics: { data: ['볼륨 + 백업', 'ok'] },
      changes: [['+', '매일 pg_dump → 오브젝트 스토리지'], ['+', '정기 복원 연습']],
      more: [
        { title: '파일 단위 백업은 언제', body: [
          'DB가 아닌 볼륨(업로드 파일, 설정)은 볼륨을 붙인 임시 컨테이너로 tar를 떠도 됩니다. DB라면 컨테이너를 멈춘 상태에서만 이 방법이 안전합니다.',
        ], code: { title: 'terminal', lang: 'sh', text: '$ docker run --rm \\\n    -v uploads:/data:ro -v "$(pwd)":/backup \\\n    alpine tar czf /backup/uploads.tgz -C /data .' } },
        { title: '백업이 백업이려면', list: [
          '<b>다른 곳</b>: 같은 디스크 · 같은 VM에 둔 사본은 함께 사라집니다. 다른 서비스(오브젝트 스토리지), 가능하면 다른 리전에 둡니다.',
          '<b>자동</b>: cron이나 스케줄러로 매일 돌고, 실패하면 알림이 와야 합니다.',
          '<b>복원 시험</b>: 실제로 다른 DB에 복원해 행 수를 확인해 본 백업만 믿습니다.',
          '얼마나 자주 뜰지는 "몇 시간치까지 잃어도 되나(RPO)"로 정합니다(10장 백업과 재해 복구).',
        ] },
        { title: '실무 팁', list: ['덤프 파일 이름에 날짜와 DB 이름을 넣고, 오브젝트 스토리지의 수명 주기 규칙으로 오래된 덤프를 자동 정리하거나 저렴한 등급으로 옮깁니다.', '덤프에도 고객 데이터가 들어 있습니다. 버킷은 비공개로, 가능하면 암호화하고 접근 권한을 백업 담당 역할로 좁힙니다.', '덤프와 복원에 걸리는 시간을 재 두면, 장애 때 "몇 분 안에 돌아올 수 있나"에 숫자로 답할 수 있습니다.'] },
      ],
    },
    {
      key: '클라우드에서', kind: 'compare', title: '클라우드 VM에서 데이터가 사는 곳',
      body: [
        '클라우드 VM 위의 Docker 볼륨은 결국 VM에 붙은 <b>블록 스토리지</b>(가상 디스크) 위의 폴더입니다. 디스크 <b>스냅샷</b>을 정기적으로 뜨면 VM이 사라져도 디스크를 되살릴 수 있어요.',
        '덤프는 <b>오브젝트 스토리지</b>로 보내고, 운영 DB는 백업 · 복제 · 패치를 대신해 주는 <b>관리형 DB</b>에 맡기는 것이 대개 낫습니다. 컨테이너 DB는 개발과 테스트에 잘 맞습니다.',
      ],
      callout: { type: 'cloud', text: '여러 서버에 걸친 저장소 문제는 쿠버네티스의 PV·PVC가 클라우드 디스크와 연결해 풉니다. 7장에서 이어집니다.' },
      set: { vol: { label: 'pgdata (VM 디스크)' } },
      panel: {
        title: '블록 · 오브젝트 · 관리형 DB', icon: 'database',
        rows: [
          ['AWS', 'EBS · S3 · RDS', 'aws'],
          ['Azure', 'Managed Disk · Blob · Azure DB', 'azure'],
          ['GCP', 'Persistent Disk · GCS · Cloud SQL', 'gcp'],
          ['NCP', 'Block · Object Storage · Cloud DB', 'ncp'],
        ],
      },
      tags: [{ on: 'vol', text: '디스크 스냅샷', tone: 'info', icon: 'save', pos: 'right' }],
      flows: [{ path: ['db', 'vol'], kind: 'data' }, { path: ['db', 'bk'], kind: 'data', delay: 0.8 }],
      metrics: { data: ['볼륨 · 스냅샷 · 덤프', 'ok'] },
      more: [
        { title: '세 가지 저장소의 역할', rows: [
          ['블록 스토리지', 'VM 디스크 · 볼륨이 실제로 놓이는 곳', 'info'],
          ['스냅샷', '디스크 통째 복사 · 빠른 복구', 'info'],
          ['오브젝트 스토리지', '덤프 · 업로드 파일 · 다른 리전 복제', 'ok'],
          ['관리형 DB', '자동 백업 · 시점 복구 · 복제', 'ok'],
        ] },
        { title: '실무 판단', list: [
          '블록 스토리지는 보통 <b>하나의 가용 영역</b>에 묶여, 같은 영역의 VM에만 붙습니다. 영역 장애에 대비하려면 스냅샷이나 덤프를 영역 · 리전 밖으로 보냅니다.',
          '스냅샷은 디스크 단위라 "어제 그 테이블 하나"를 되살리기엔 무겁습니다. 논리 덤프와 함께 씁니다.',
          '관리형 DB를 쓰면 이 레슨의 DB 컨테이너와 볼륨 걱정은 대부분 사업자 몫이 됩니다. 대신 비용과 버전 선택의 자유를 일부 내줍니다.',
        ] },
        { title: '흔한 실수', list: ['스냅샷만 믿고 복원을 한 번도 해 보지 않은 것. 스냅샷으로 디스크를 만들어 VM에 붙이고 DB가 실제로 뜨는지까지 확인해야 합니다.', '실행 중인 DB 디스크의 스냅샷은 전원이 갑자기 꺼진 상태와 비슷합니다. DB는 대개 복구하지만, 중요한 데이터라면 논리 덤프나 관리형 DB 백업을 함께 둡니다.'] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 이름으로 잇고, 밖에 남기기',
      body: [
        '<b>네트워크</b>: 컨테이너의 <code>localhost</code>는 자기 자신입니다. 사용자 정의 네트워크에 함께 두면 이름으로 찾고, 바깥에는 <code>-p</code>로 입구 하나만 엽니다. DB 포트는 열지 않고, 클라우드 방화벽으로 한 번 더 막습니다.',
        '<b>데이터</b>: 남아야 하는 것은 이름 있는 볼륨에, 개발용 소스는 bind mount로. 볼륨도 호스트에 묶이니 백업은 밖에 둡니다. 다음 레슨에서는 지금까지 친 긴 명령들을 <b>Compose</b> 파일 하나로 바꿉니다.',
      ],
      hide: ['bk'],
      show: ['net', 'api', 'port'],
      set: { vol: { label: 'pgdata' } },
      flows: [
        { path: ['port', 'api'], kind: 'req' }, { path: ['api', 'db'], kind: 'req', delay: 0.9 },
        { path: ['db', 'vol'], kind: 'data', delay: 1.6 },
      ],
    },
  ],
  quiz: [
    {
      q: 'API 컨테이너의 DB_HOST를 localhost로 두었더니 같은 호스트의 DB 컨테이너에 연결되지 않습니다. 이유는?',
      options: ['DB 컨테이너에 -p 5432:5432를 주지 않아서', 'Dockerfile에 EXPOSE 5432가 없어서', '컨테이너마다 네트워크 namespace가 따로라 localhost가 API 컨테이너 자신을 가리켜서', 'bridge 네트워크는 TCP를 지원하지 않아서'],
      answer: 2,
      step: 1,
      why: '컨테이너 안의 localhost는 그 컨테이너 자신입니다. 같은 사용자 정의 네트워크에 두고 이름(db)으로 접속해야 합니다. -p는 호스트 바깥에서 들어오는 길을 여는 것이라 컨테이너끼리의 통신과는 상관이 없고, EXPOSE는 메모일 뿐입니다.',
    },
    {
      q: '클라우드 VM에서 돌리는 DB 컨테이너를 내 노트북의 DB 도구로 잠깐 들여다보고 싶습니다. 가장 안전한 방법은?',
      options: ['-p 127.0.0.1:5432:5432로 VM 안에만 열고 SSH 터널로 접속한다', '-p 5432:5432로 열고 ufw로 5432를 막는다', '--network host로 띄운다', '보안 그룹에서 5432를 0.0.0.0/0에 연다'],
      answer: 0,
      step: 7,
      why: '127.0.0.1에만 바인딩하면 VM 바깥에서는 닿지 않고, SSH 터널로 나만 들어갑니다. Docker가 넣는 포트 매핑 규칙은 ufw를 우회할 수 있어 두 번째는 믿을 수 없고, host 네트워크와 0.0.0.0/0 개방은 DB를 더 넓게 노출합니다.',
    },
    {
      q: 'postgres:16.4 컨테이너를 16.6으로 바꾸려 합니다. -v pgdata:/var/lib/postgresql/data로 띄워 둔 상태라면 올바른 방법은?',
      options: ['docker rm -v db로 볼륨까지 지우고 새로 띄운다', 'docker commit으로 컨테이너를 이미지로 저장한 뒤 버전을 올린다', '볼륨 옵션 없이 띄우면 익명 볼륨이 이전 데이터를 찾아 연결한다', '컨테이너만 지우고, 같은 -v pgdata:... 옵션으로 16.6 이미지를 띄운다'],
      answer: 3,
      step: 10,
      why: '데이터는 이름 있는 볼륨에 있으니 컨테이너는 버리고 같은 볼륨을 다시 꽂으면 됩니다. 익명 볼륨은 새 컨테이너마다 새로 생겨 이전 데이터를 찾지 않습니다. 같은 메이저 버전 안이라 데이터 형식도 그대로입니다.',
    },
    {
      q: '개발 중에는 소스 수정이 컨테이너에 바로 반영되면 좋겠고, DB 데이터는 컨테이너를 바꿔도 남아야 합니다. 알맞은 조합은?',
      options: ['소스와 DB 모두 bind mount', '소스는 볼륨, DB 데이터는 쓰기 레이어', '소스는 bind mount, DB 데이터는 이름 있는 볼륨', '둘 다 이미지에 넣고 매번 다시 빌드'],
      answer: 2,
      step: 11,
      why: 'bind mount는 호스트의 소스 폴더를 그대로 보여 줘서 개발에 맞고, 볼륨은 Docker가 관리하며 컨테이너와 수명이 분리되어 DB 데이터에 맞습니다. 쓰기 레이어는 컨테이너를 지우면 함께 사라집니다.',
    },
    {
      q: '새로 띄운 batch 컨테이너만 getaddrinfo ENOTFOUND db 오류를 냅니다. api 컨테이너는 db에 잘 접속합니다. 먼저 확인할 것은?',
      options: ['batch가 api · db와 같은 사용자 정의 네트워크에 연결돼 있는지', 'db 컨테이너의 메모리 사용량', 'batch 이미지의 크기', 'db에 -p 5432:5432가 있는지'],
      answer: 0,
      step: 4,
      why: 'ENOTFOUND는 이름 풀이 실패입니다. 내장 DNS는 같은 사용자 정의 네트워크 안에서만 이름을 풀어 주므로, --network를 빠뜨려 기본 bridge에 붙은 경우가 가장 흔합니다. 포트 publish는 컨테이너끼리의 통신과 무관합니다.',
    },
    {
      q: '이름은 풀리는데 ECONNREFUSED가 납니다. 가장 그럴듯한 원인은?',
      options: ['두 컨테이너가 서로 다른 네트워크에 있다', '대상 컨테이너에서 그 포트를 듣는 프로세스가 없거나 아직 준비 중이다', 'DNS 서버 127.0.0.11이 꺼졌다', '호스트 방화벽이 막고 있다'],
      answer: 1,
      step: 4,
      why: '이름이 풀렸다면 네트워크와 DNS는 통과한 것입니다. 연결 거부는 그 IP의 해당 포트에서 아무도 연결을 받지 않는다는 뜻이라, 프로세스가 아직 시작 중이거나 다른 포트 · 127.0.0.1에만 바인딩한 경우를 봅니다. 방화벽이 막으면 보통 타임아웃이 납니다.',
    },
    {
      q: 'docker run -p 8080:3000으로 띄웠는데 외부에서 연결이 안 됩니다. docker port에는 3000/tcp -> 0.0.0.0:8080이 보입니다. 다음으로 확인할 것은?',
      options: ['Dockerfile에 EXPOSE 3000이 있는지', '컨테이너를 --privileged로 바꿀지', '이미지를 다시 빌드할지', '컨테이너 안의 앱이 127.0.0.1이 아닌 0.0.0.0에서 듣고 있는지, 클라우드 보안 그룹이 8080을 허용하는지'],
      answer: 3,
      step: 6,
      why: '매핑은 정상입니다. 앱이 컨테이너 안의 127.0.0.1에만 바인딩하면 전달된 연결을 받지 못하고, VM 밖의 보안 그룹이 막으면 패킷이 VM까지 오지 않습니다. EXPOSE는 메모일 뿐이라 결과에 영향이 없습니다.',
    },
    {
      q: 'ufw에서 5432를 막았는데 -p 5432:5432로 띄운 DB 컨테이너에 인터넷에서 접속이 됩니다. 이유로 가장 정확한 것은?',
      options: ['ufw가 꺼져 있었다', 'Docker의 포트 매핑 규칙이 패킷을 컨테이너로 전달(FORWARD)해 ufw의 INPUT 규칙을 거치지 않는다', 'PostgreSQL이 자체 방화벽을 끈다', 'bridge 네트워크가 모든 포트를 자동으로 연다'],
      answer: 1,
      step: 7,
      why: 'DNAT로 목적지가 컨테이너 IP로 바뀌면 패킷은 호스트로 들어오는 INPUT이 아니라 FORWARD 경로를 탑니다. 그래서 INPUT만 다루는 ufw 규칙이 적용되지 않습니다. DB는 publish하지 않거나 127.0.0.1에만 열고, 클라우드 보안 그룹으로도 막습니다.',
    },
    {
      q: '호스트의 네트워크 인터페이스와 포트를 직접 관찰해야 하는 모니터링 에이전트를 컨테이너로 돌립니다. 알맞은 네트워크 설정은?',
      options: ['--network host', '--network none', '기본 bridge + -p 모든 포트', '사용자 정의 bridge + 별칭'],
      answer: 0,
      step: 8,
      why: 'host 모드는 network namespace를 만들지 않아 호스트의 인터페이스와 포트를 그대로 봅니다. 격리가 사라지니 이런 도구에만 씁니다. none은 네트워크를 끊고, bridge는 컨테이너 자신의 가상 인터페이스만 보입니다.',
    },
    {
      q: 'docker rm -f db 후 같은 명령(볼륨 옵션 없음)으로 postgres를 다시 띄웠더니 DB가 비어 있습니다. docker volume ls에 긴 해시 이름의 볼륨이 두 개 있습니다. 무슨 일이 일어난 것일까요?',
      options: ['Docker가 데이터를 압축해 숨겼다', 'postgres 이미지의 버그로 데이터가 삭제됐다', '이미지의 VOLUME 선언 때문에 컨테이너마다 새 익명 볼륨이 생겼고, 옛 데이터는 첫 번째 익명 볼륨에 남아 있을 수 있다', '쓰기 레이어가 새 컨테이너로 옮겨졌다'],
      answer: 2,
      step: 9,
      why: '이름을 붙이지 않으면 Docker가 데이터 경로에 임의 이름의 볼륨을 만들어, 새 컨테이너는 빈 볼륨을 받습니다. 옛 익명 볼륨이 지워지지 않았다면 내용을 확인해 다시 붙일 수 있습니다. 앞으로는 이름 있는 볼륨을 씁니다.',
    },
    {
      q: '운영 중인 PostgreSQL 컨테이너의 백업 방법으로 가장 알맞은 것은?',
      options: ['볼륨 폴더를 실행 중에 tar로 압축해 같은 디스크에 둔다', '컨테이너를 docker commit해 이미지로 보관한다', '볼륨이 있으니 별도 백업은 필요 없다', 'pg_dump로 정기적으로 덤프해 오브젝트 스토리지 같은 호스트 밖에 두고, 복원을 연습한다'],
      answer: 3,
      step: 12,
      why: '실행 중 파일 복사는 일관성이 깨질 수 있고, 같은 디스크의 사본은 디스크와 함께 사라집니다. commit은 볼륨의 데이터를 담지 않습니다. DB 도구로 덤프해 밖에 두고 실제로 복원해 본 백업만 믿을 수 있습니다.',
    },
    {
      q: '설정 파일을 -v ./config.yaml:/app/config.yaml로 붙였는데, 앱이 빈 설정으로 시작합니다. 호스트에서 보니 config.yaml이라는 빈 폴더가 생겨 있습니다. 원인은?',
      options: ['호스트 경로가 실행 위치 기준으로 존재하지 않아 -v가 빈 폴더를 만들었다', '볼륨 드라이버가 파일을 지원하지 않는다', 'tmpfs로 마운트됐다', '컨테이너가 root로 실행됐다'],
      answer: 0,
      step: 11,
      why: '-v의 bind mount는 호스트 경로가 없으면 오류 대신 빈 디렉터리를 만들어 붙입니다. 경로를 확인하고, --mount type=bind를 쓰면 경로가 없을 때 오류로 알려 줍니다. 설정 파일은 :ro로 붙이는 것도 잊지 마세요.',
    },
    {
      q: '클라우드 VM 한 대에서 Docker로 운영 DB를 돌리고 있습니다. VM의 가용 영역 장애에도 데이터를 지키려면 무엇을 우선 검토해야 할까요?',
      options: ['볼륨을 하나 더 만든다', '컨테이너 재시작 정책을 always로 바꾼다', '덤프 · 스냅샷을 영역 밖(가능하면 다른 리전)의 오브젝트 스토리지로 보내거나, 관리형 DB로 옮긴다', '이미지를 더 작게 만든다'],
      answer: 2,
      step: 13,
      why: '볼륨과 블록 스토리지는 보통 그 VM과 같은 가용 영역에 묶입니다. 영역 장애에 대비하려면 사본을 영역 밖에 두거나, 백업과 복제를 해 주는 관리형 DB를 씁니다. 같은 VM 안의 볼륨을 늘리거나 재시작 정책을 바꿔도 영역 장애는 막지 못합니다.',
    },
  ],
};
