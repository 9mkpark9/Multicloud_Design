export default {
  id: 'docker-network-volume',
  learn: [
    '컨테이너 안의 localhost는 자기 자신',
    'bridge 네트워크와 이름으로 찾는 내장 DNS',
    '-p 포트 매핑: 입구 하나만 바깥에',
    '볼륨: 컨테이너를 지워도 남는 데이터',
    'bind mount와 볼륨을 고르는 기준',
    '볼륨은 백업이 아니다',
  ],
  legend: [['req', '요청'], ['res', '응답'], ['ctrl', 'DNS 조회'], ['data', '데이터 · 백업'], ['bad', '실패 · 유실']],
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
      user: { kind: 'client', at: [-2.6, 4.6], label: '브라우저' },
      port: { kind: 'tile', at: [-1.1, 3.1], label: '호스트 :8080', icon: 'door', color: 'orange' },
      old: { kind: 'cyl', at: [5.1, 1.9], label: '익명 볼륨 #1', icon: 'hard-drive', color: 'gray' },
      vol: { kind: 'cyl', at: [4.1, -2.1], label: '익명 볼륨 #2', icon: 'hard-drive', color: 'gray' },
      bind: { kind: 'tile', at: [0.6, 3.6], label: './src (호스트 폴더)', icon: 'folder', color: 'sand' },
      bk: { kind: 'cyl', at: [1.1, 0.9], label: '오브젝트 스토리지', icon: 'archive', color: 'green' },
    },
    edges: {
      e_ad: { from: 'api', to: 'db', label: '5432' },
      e_direct: { from: 'user', to: 'api', style: 'dashed', tone: 'bad', off: true },
      e_up: { from: 'user', to: 'port' },
      e_pa: { from: 'port', to: 'api', label: '→ 3000' },
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
    },
    {
      key: '밖에서 접속', kind: 'problem', title: '브라우저에서는 열리지 않습니다',
      body: [
        '이제 브라우저로 <code>localhost:3000</code>에 접속해 봅니다. 응답이 없습니다. API의 3000번 포트는 shopnet 안에서만 보이고, 호스트 바깥에서 들어오는 길은 없기 때문입니다.',
        'Dockerfile의 <code>EXPOSE 3000</code>은 "이 포트를 쓴다"는 메모일 뿐 포트를 열지 않는다는 것, 앞 레슨에서 봤죠. 바깥과 잇는 일은 컨테이너를 <b>실행할 때</b> 정합니다.',
      ],
      callout: { type: 'key', text: 'bridge 네트워크는 <b>안에서 밖으로</b>(인터넷 접속)는 기본으로 되지만, <b>밖에서 안으로</b>는 열어 주기 전까지 막혀 있습니다.' },
      show: ['user', 'e_direct'],
      tags: [{ on: 'user', text: ':3000 응답 없음', tone: 'bad', pos: 'bottom' }],
      flows: [{ path: ['user', 'api'], kind: 'bad', n: 2 }],
      metrics: { port: ['막힘', 'bad'] },
    },
    {
      key: '-p 매핑', kind: 'solution', title: '-p로 호스트 포트를 컨테이너에 잇기',
      body: [
        '<code>-p 8080:3000</code>은 "호스트의 8080번으로 온 연결을 이 컨테이너의 3000번으로 넘겨라"입니다. 왼쪽이 호스트, 오른쪽이 컨테이너 포트예요. 이제 <code>localhost:8080</code>이 열립니다.',
        '바깥에 열 것은 <b>입구 하나</b>뿐입니다. DB는 같은 네트워크의 API만 쓰면 되니 <code>-p</code>를 주지 않습니다.',
      ],
      callout: { type: 'warn', text: '<code>-p 5432:5432</code>는 호스트의 <b>모든 인터페이스</b>에 포트를 엽니다. Docker가 iptables 규칙을 직접 넣어서 ufw 같은 호스트 방화벽을 우회할 수 있어요. 클라우드 VM의 DB가 이렇게 인터넷에 열리는 사고가 흔합니다.' },
      code: { ref: 'port', hl: [2, 4, 9, 10, 11] },
      hide: ['e_direct', 'net', 'db'],
      show: ['port'],
      tags: [{ on: 'port', text: '호스트 8080 → 3000', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['user', 'port', 'api'], kind: 'req', n: 2 }, { path: ['api', 'port', 'user'], kind: 'res', n: 2, delay: 1.6 }],
      metrics: { port: ['8080 → 3000', 'ok'] },
      changes: [['+', '-p 8080:3000'], ['-', 'DB 포트 공개']],
    },
    {
      key: '사라진 주문', kind: 'case', title: '사례: DB를 교체했더니 주문이 0건',
      body: [
        'PostgreSQL 패치 버전을 올리려고 <code>docker rm -f db</code>로 지우고 새 이미지로 다시 띄웠습니다. 주문 테이블이 비어 있었습니다. 컨테이너를 지우면 그 안의 데이터도 함께 사라진다는 이미지 레슨의 그 함정이에요.',
        '조금 더 복잡한 점도 있습니다. 공식 postgres 이미지는 데이터 디렉터리를 <b>익명 볼륨</b>에 둡니다. 옛 데이터는 디스크 어딘가에 남았을 수 있지만, 새 컨테이너는 새 익명 볼륨을 받아 빈 DB로 시작합니다.',
      ],
      callout: { type: 'warn', text: '이름 없는 볼륨은 누구도 다시 찾지 않고 디스크만 차지하다가, 정리 명령에 지워집니다. <b>데이터의 위치를 직접 이름 붙여 정하지 않으면</b> 사실상 잃은 것입니다.' },
      code: { ref: 'lost', hl: [1, 7, 8] },
      hide: ['user', 'port', 'api'],
      show: ['db', 'old', 'vol', 'e_old'],
      set: { old: { state: 'dim' } },
      tags: [
        { on: 'old', text: '옛 주문 · 주인 없음', tone: 'bad', pos: 'right' },
        { on: 'vol', text: '빈 DB', tone: 'warn', pos: 'right' },
      ],
      flows: [{ path: ['db', 'vol'], kind: 'data', n: 2 }],
      metrics: { data: ['0건', 'bad'] },
      changes: [['-', '컨테이너 교체로 주문 데이터 유실'], ['~', '익명 볼륨 #1은 고아로 남음']],
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
    },
    {
      key: 'bind mount', kind: 'compare', title: 'bind mount: 호스트 폴더를 그대로',
      body: [
        '<b>bind mount</b>는 호스트의 특정 경로를 컨테이너 안에 그대로 보여 줍니다. <code>-v "$(pwd)/src:/app/src"</code>로 소스 폴더를 연결하면 내 PC에서 고친 코드가 바로 컨테이너에 보여서, 개발할 때 편합니다.',
        '대신 호스트의 경로와 파일 권한(UID)에 묶이고, Mac·Windows의 Docker Desktop에서는 파일 공유를 거쳐 느릴 수 있어요. 운영 데이터는 볼륨, 개발용 소스와 설정 파일은 bind mount가 기본 선택입니다.',
      ],
      callout: { type: 'tip', text: '<code>-v</code>의 왼쪽이 <code>/</code>로 시작하는 경로면 bind mount, 이름이면 볼륨입니다. 헷갈리면 <code>--mount type=bind,...</code>처럼 종류를 적는 형식을 쓰세요. 설정 파일에는 <code>:ro</code>(읽기 전용)를 붙입니다.' },
      show: ['net', 'api', 'bind'],
      panel: {
        title: '데이터를 어디에 둘까', icon: 'hard-drive',
        rows: [['볼륨', 'Docker가 관리 · DB 데이터', 'ok'], ['bind mount', '호스트 경로 · 소스 · 설정', 'info'], ['tmpfs', '메모리 · 임시 파일', 'mute'], ['쓰기 레이어', '컨테이너와 함께 삭제', 'bad']],
      },
      tags: [{ on: 'bind', text: '고치면 바로 반영', tone: 'info', icon: 'pencil', pos: 'left' }],
      flows: [{ path: ['bind', 'api'], kind: 'data', n: 2 }, { path: ['db', 'vol'], kind: 'data', delay: 0.8 }],
    },
    {
      key: '볼륨의 한계', kind: 'concept', title: '볼륨은 그 호스트에 묶여 있습니다',
      body: [
        '볼륨은 컨테이너보다 오래 살지만 <b>호스트 디스크</b>보다 오래 살지는 못합니다. VM이 망가지거나 디스크가 꽉 차면 함께 위험하고, 다른 서버의 컨테이너는 이 볼륨을 볼 수 없어요.',
        '그래서 볼륨은 백업이 아닙니다. <code>pg_dump</code> 같은 DB 도구로 정기적으로 덤프해 오브젝트 스토리지처럼 <b>호스트 밖</b>에 두고, 복원도 연습합니다. 클라우드 운영 환경이라면 DB를 관리형 서비스에 맡기는 편이 대개 낫습니다.',
      ],
      callout: { type: 'cloud', text: '여러 서버에 걸친 저장소 문제는 쿠버네티스의 PV·PVC가 클라우드 디스크와 연결해 풉니다. 7장에서 이어집니다.' },
      code: { ref: 'backup', hl: [2, 3, 5, 6] },
      hide: ['net', 'api', 'bind'],
      show: ['bk'],
      tags: [{ on: 'bk', text: '호스트 밖 사본', tone: 'ok', icon: 'archive', pos: 'bottom' }],
      flows: [{ path: ['vol', 'db'], kind: 'data' }, { path: ['db', 'bk'], kind: 'data', n: 2, delay: 0.8 }],
      metrics: { data: ['볼륨 + 백업', 'ok'] },
      changes: [['+', '매일 pg_dump → 오브젝트 스토리지'], ['+', '정기 복원 연습']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 이름으로 잇고, 밖에 남기기',
      body: [
        '<b>네트워크</b>: 컨테이너의 <code>localhost</code>는 자기 자신입니다. 사용자 정의 네트워크에 함께 두면 이름으로 찾고, 바깥에는 <code>-p</code>로 입구 하나만 엽니다.',
        '<b>데이터</b>: 남아야 하는 것은 이름 있는 볼륨에, 개발용 소스는 bind mount로. 볼륨도 호스트에 묶이니 백업은 밖에 둡니다. 다음 레슨에서는 지금까지 친 긴 명령들을 <b>Compose</b> 파일 하나로 바꿉니다.',
      ],
      hide: ['bk'],
      show: ['net', 'api', 'port'],
      flows: [
        { path: ['port', 'api'], kind: 'req' }, { path: ['api', 'db'], kind: 'req', delay: 0.9 },
        { path: ['db', 'vol'], kind: 'data', delay: 1.6 },
      ],
    },
  ],
  quiz: [
    {
      q: 'API 컨테이너의 DB_HOST를 localhost로 두었더니 같은 호스트의 DB 컨테이너에 연결되지 않습니다. 이유는?',
      options: ['DB 컨테이너에 -p 5432:5432를 주지 않아서', '컨테이너마다 네트워크 namespace가 따로라 localhost가 API 컨테이너 자신을 가리켜서', 'Dockerfile에 EXPOSE 5432가 없어서', 'bridge 네트워크는 TCP를 지원하지 않아서'],
      answer: 1,
      why: '컨테이너 안의 localhost는 그 컨테이너 자신입니다. 같은 사용자 정의 네트워크에 두고 이름(db)으로 접속해야 합니다. -p는 호스트 바깥에서 들어오는 길을 여는 것이라 컨테이너끼리의 통신과는 상관이 없고, EXPOSE는 메모일 뿐입니다.',
    },
    {
      q: '클라우드 VM에서 돌리는 DB 컨테이너를 내 노트북의 DB 도구로 잠깐 들여다보고 싶습니다. 가장 안전한 방법은?',
      options: ['-p 5432:5432로 열고 ufw로 5432를 막는다', '-p 127.0.0.1:5432:5432로 VM 안에만 열고 SSH 터널로 접속한다', '--network host로 띄운다', '보안 그룹에서 5432를 0.0.0.0/0에 연다'],
      answer: 1,
      why: '127.0.0.1에만 바인딩하면 VM 바깥에서는 닿지 않고, SSH 터널로 나만 들어갑니다. Docker가 넣는 iptables 규칙은 ufw를 우회할 수 있어 첫 번째는 믿을 수 없고, host 네트워크와 0.0.0.0/0 개방은 DB를 더 넓게 노출합니다.',
    },
    {
      q: 'postgres:16.4 컨테이너를 16.6으로 바꾸려 합니다. -v pgdata:/var/lib/postgresql/data로 띄워 둔 상태라면 올바른 방법은?',
      options: ['docker rm -v db로 볼륨까지 지우고 새로 띄운다', '컨테이너만 지우고, 같은 -v pgdata:... 옵션으로 16.6 이미지를 띄운다', 'docker commit으로 컨테이너를 이미지로 저장한 뒤 버전을 올린다', '볼륨 옵션 없이 띄우면 익명 볼륨이 이전 데이터를 찾아 연결한다'],
      answer: 1,
      why: '데이터는 이름 있는 볼륨에 있으니 컨테이너는 버리고 같은 볼륨을 다시 꽂으면 됩니다. 익명 볼륨은 새 컨테이너마다 새로 생겨 이전 데이터를 찾지 않습니다. 같은 메이저 버전 안이라 데이터 형식도 그대로입니다.',
    },
    {
      q: '개발 중에는 소스 수정이 컨테이너에 바로 반영되면 좋겠고, DB 데이터는 컨테이너를 바꿔도 남아야 합니다. 알맞은 조합은?',
      options: ['소스와 DB 모두 bind mount', '소스는 bind mount, DB 데이터는 이름 있는 볼륨', '소스는 볼륨, DB 데이터는 쓰기 레이어', '둘 다 이미지에 넣고 매번 다시 빌드'],
      answer: 1,
      why: 'bind mount는 호스트의 소스 폴더를 그대로 보여 줘서 개발에 맞고, 볼륨은 Docker가 관리하며 컨테이너와 수명이 분리되어 DB 데이터에 맞습니다. 쓰기 레이어는 컨테이너를 지우면 함께 사라집니다.',
    },
  ],
};
