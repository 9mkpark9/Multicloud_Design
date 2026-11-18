export default {
  id: 'ports-tls',
  learn: [
    '포트: 한 서버 안에서 프로그램을 가리키는 번호',
    'TCP 3-way 핸드셰이크와 연결 실패를 읽는 법',
    'HTTP 평문의 위험과 TLS가 주는 세 가지',
    '인증서와 CA 체인을 브라우저가 검증하는 방법',
    'TLS 종료: 인증서를 로드 밸런서 한 곳에',
    '인증서 만료 사고와 관리형 인증서',
  ],
  legend: [['req', '요청'], ['res', '응답'], ['ctrl', '핸드셰이크 · 검증'], ['data', '암호화된 데이터'], ['bad', '도청 · 실패']],
  metrics: [
    { id: 'port', label: '목적지 포트', icon: 'door' },
    { id: 'rt', label: '데이터 전 왕복', icon: 'repeat' },
    { id: 'enc', label: '전송 구간', icon: 'lock' },
    { id: 'cert', label: '인증서', icon: 'file-key' },
  ],
  scene: {
    zones: {
      host: { at: [2.5, -1.5], size: [7.0, 2.5], label: '서버 203.0.113.10', color: 'green' },
    },
    nodes: {
      user: { kind: 'client', at: [6.0, 4.4], label: '사용자 브라우저' },
      // 서버 한 대 안의 프로그램들
      sshd: { at: [3.6, -0.4], label: 'sshd', sub: '원격 접속', icon: 'terminal', color: 'slate' },
      nginx: { at: [6.0, -0.4], label: 'nginx', sub: '웹 서버', icon: 'server', color: 'green' },
      mysql: { at: [8.4, -0.4], label: 'MySQL', sub: 'DB', icon: 'database', color: 'purple' },
      // 길목
      hop: { at: [6.0, 2.0], size: 's', label: '공용 Wi-Fi', icon: 'wifi', color: 'gray' },
      eve: { kind: 'client', at: [8.4, 2.0], label: '엿보는 사람' },
      // 인증서 체인
      leaf: { kind: 'tile', at: [8.4, -0.4], label: '서버 인증서', icon: 'file-key', color: 'green' },
      inter: { kind: 'tile', at: [8.4, 2.0], label: '중간 CA', icon: 'badge', color: 'yellow' },
      root: { kind: 'tile', at: [8.4, 4.4], label: '루트 CA', icon: 'shield-check', color: 'orange' },
      // TLS 종료
      lb: { at: [6.0, 2.0], label: 'Load\nBalancer', icon: 'split', color: 'orange' },
      w1: { at: [4.8, -0.6], label: '웹 서버 1', sub: 'nginx', icon: 'server', color: 'green' },
      w2: { at: [7.2, -0.6], label: '웹 서버 2', sub: 'nginx', icon: 'server', color: 'green' },
      acm: { at: [8.6, 2.0], label: 'ACM', sub: '발급 · 갱신', icon: 'file-key', color: 'aws' },
      dnsrec: { kind: 'tile', at: [8.6, 4.4], label: 'DNS 검증 레코드', icon: 'tag', color: 'blue' },
    },
    edges: {
      e_door: { from: 'user', to: [6.0, 1.25], off: true },
      e_us: { from: 'user', to: 'sshd', off: true },
      e_un: { from: 'user', to: 'nginx', off: true },
      e_um: { from: 'user', to: 'mysql', off: true },
      e_uh: { from: 'user', to: 'hop' },
      e_hn: { from: 'hop', to: 'nginx' },
      e_he: { from: 'hop', to: 'eve', style: 'dashed', tone: 'bad' },
      e_nl: { from: 'nginx', to: 'leaf', label: '제시' },
      e_il: { from: 'inter', to: 'leaf', label: '서명' },
      e_ri: { from: 'root', to: 'inter', label: '서명' },
      e_ru: { from: 'root', to: 'user', style: 'dashed', label: '미리 설치' },
      e_ul: { from: 'user', to: 'lb', label: 'HTTPS' },
      e_l1: { from: 'lb', to: 'w1', label: 'HTTP' },
      e_l2: { from: 'lb', to: 'w2', label: 'HTTP' },
      e_al: { from: 'acm', to: 'lb', style: 'dashed' },
      e_ad: { from: 'acm', to: 'dnsrec', style: 'dashed' },
    },
  },
  steps: [
    {
      key: '주소만으론', kind: 'problem', title: 'IP 주소는 서버 문 앞까지만',
      body: [
        '앞 레슨에서 IP 주소로 서버를 찾아가는 법을 봤습니다. 그런데 <code>shop.example</code>의 서버 <code>203.0.113.10</code> 한 대에는 프로그램이 여럿 돌고 있습니다. 관리용 <code>sshd</code>, 웹 서버 <code>nginx</code>, 그리고 <code>MySQL</code>.',
        '패킷이 이 주소에 도착했습니다. 누구에게 넘겨야 할까요? IP 주소는 건물 주소와 같아서 건물 앞까지만 데려다 줍니다. 몇 호실인지가 빠져 있어요.',
      ],
      callout: { type: 'key', text: '이 레슨은 연결 하나를 끝까지 따라갑니다. <b>어느 프로그램</b>인지(포트), <b>어떻게 잇는지</b>(TCP), <b>어떻게 믿고 숨기는지</b>(TLS).' },
      show: ['user', 'host', 'sshd', 'nginx', 'mysql', 'e_door'],
      tags: [{ at: [6.0, 1.25], text: '어느 프로그램에게?', tone: 'warn', icon: 'help', dx: -112, dy: 6 }],
      flows: [{ path: ['user', [6.0, 1.25]], kind: 'req', n: 3, gap: 0.5 }],
      metrics: { port: ['?', 'warn'], rt: '—', enc: '—', cert: '—' },
    },
    {
      key: '포트', kind: 'concept', title: '포트: 프로그램마다 번호 하나',
      body: [
        '<b>포트</b>는 한 서버 안에서 프로그램을 가리키는 0–65535 사이의 번호입니다. 프로그램이 "나는 80번에서 기다린다"고 OS에 등록하면(<b>listen</b>), OS는 목적지 포트가 80인 패킷을 그 프로그램에 넘깁니다.',
        '자주 쓰는 서비스는 번호가 약속돼 있습니다. 주소창에 포트를 안 적어도 <code>http://</code>는 80, <code>https://</code>는 443으로 가는 이유예요. 보내는 쪽도 포트를 씁니다. OS가 빈 번호를 임시로 골라 주고, 응답은 그 번호로 돌아옵니다.',
      ],
      callout: { type: 'tip', text: '번호는 약속일 뿐 강제가 아닙니다. 실제로 무엇이 어디서 듣는지는 앞에서 본 <code>ss -tlnp</code>로 확인하세요. 3306 · 5432 · 6379 같은 DB 포트는 인터넷에 열 이유가 없습니다.' },
      show: ['e_us', 'e_un', 'e_um'],
      hide: ['e_door'],
      panel: {
        title: '자주 만나는 포트', icon: 'hash',
        rows: [['22', 'SSH · 원격 접속', 'info'], ['80', 'HTTP · 평문 웹', 'warn'], ['443', 'HTTPS · 암호화 웹', 'ok'], ['3306', 'MySQL', 'mute'], ['5432', 'PostgreSQL', 'mute'], ['6379', 'Redis', 'mute']],
      },
      tags: [
        { on: 'sshd', text: ':22' }, { on: 'nginx', text: ':80', tone: 'ok' }, { on: 'mysql', text: ':3306' },
        { on: 'user', text: '출발지 포트 51514', pos: 'bottom' },
      ],
      flows: [
        { path: ['user', 'nginx'], kind: 'req', n: 2 }, { path: ['nginx', 'user'], kind: 'res', n: 2, delay: 1.5 },
        { path: ['user', 'sshd'], kind: 'ctrl', delay: 0.5 },
      ],
      metrics: { port: ['80', 'ok'] },
      changes: [['+', '목적지 포트 80 → nginx'], ['+', '출발지 포트는 OS가 임시로 배정'], ['~', '연결 = IP 2개 + 포트 2개']],
    },
    {
      key: '3-way', kind: 'concept', title: 'TCP: 보내기 전에 세 번 주고받습니다',
      body: [
        '<b>TCP</b>는 데이터를 보내기 전에 연결부터 맺습니다. 클라이언트가 <code>SYN</code>(연결하자)을 보내고, 서버가 <code>SYN-ACK</code>(좋다, 나도)으로 답하고, 클라이언트가 <code>ACK</code>(확인)를 보냅니다. <b>3-way 핸드셰이크</b>입니다.',
        '이때 양쪽은 데이터에 붙일 <b>순서 번호</b>의 시작값을 주고받습니다. 덕분에 TCP는 사라진 조각을 다시 보내고 뒤섞인 조각을 순서대로 맞춥니다. 이 절차 없이 그냥 던지는 <b>UDP</b>는 빠른 대신 도착도 순서도 보장하지 않습니다.',
      ],
      callout: { type: 'key', text: '연결 실패는 메시지로 구분하세요. <b>refused</b>는 서버가 즉시 거절한 것, 즉 그 포트에 듣는 프로그램이 없습니다. <b>timed out</b>은 SYN에 답이 없는 것, 즉 가는 길의 방화벽이나 경로 문제입니다.' },
      hide: ['e_us', 'e_um'],
      set: { sshd: { state: 'dim' }, mysql: { state: 'dim' } },
      focus: ['nginx'],
      panel: {
        title: '3-way 핸드셰이크', icon: 'repeat',
        rows: [['① SYN', '클라이언트 → 서버', 'info'], ['② SYN-ACK', '서버 → 클라이언트', 'accent'], ['③ ACK', '클라이언트 → 서버', 'info']],
      },
      tags: [{ on: 'nginx', text: 'LISTEN :80', icon: 'door' }],
      flows: [
        { path: ['user', 'nginx'], kind: 'ctrl' }, { path: ['nginx', 'user'], kind: 'ctrl', delay: 1.2 }, { path: ['user', 'nginx'], kind: 'ctrl', delay: 2.4 },
        { path: ['user', 'nginx'], kind: 'req', n: 2, delay: 3.6 },
      ],
      metrics: { rt: 'TCP 1왕복' },
      changes: [['+', 'TCP 연결 (SYN → SYN-ACK → ACK)'], ['~', '순서와 재전송은 TCP가 책임']],
    },
    {
      key: '평문 HTTP', kind: 'problem', title: 'HTTP는 지나가는 길에서 다 보입니다',
      body: [
        '연결은 됐습니다. 그런데 80번의 <b>HTTP</b>는 내용을 <b>평문</b> 그대로 보냅니다. 패킷은 카페 Wi-Fi와 통신사 장비 같은 남의 장비를 여러 대 거쳐 가고, 그 길목에 있는 누구든 로그인 비밀번호와 세션 쿠키를 읽을 수 있습니다.',
        '읽기만 하는 것도 아닙니다. 중간에서 내용을 바꿔치기할 수 있고, 아예 가짜 서버가 <code>shop.example</code>인 척 답해도 브라우저는 구별할 방법이 없습니다.',
      ],
      callout: { type: 'key', text: '필요한 것은 세 가지입니다. 남이 못 읽게(<b>기밀성</b>), 못 바꾸게(<b>무결성</b>), 상대가 진짜인지 확인(<b>인증</b>). 이 셋을 함께 주는 것이 <b>TLS</b>입니다.' },
      show: ['hop', 'eve'],
      hide: ['e_un'],
      set: { eve: { state: 'hot' } },
      tags: [{ on: 'eve', text: 'pw=1234 읽힘', tone: 'bad', icon: 'eye', pos: 'bottom' }, { on: 'hop', text: '남의 장비', pos: 'left' }],
      flows: [
        { path: ['user', 'hop', 'nginx'], kind: 'req', n: 2 },
        { path: ['hop', 'eve'], kind: 'bad', n: 2, delay: 0.9 },
      ],
      metrics: { enc: ['평문', 'bad'] },
    },
    {
      key: 'TLS 핸드셰이크', kind: 'solution', title: 'TLS 핸드셰이크: 확인하고, 키를 맞춥니다',
      body: [
        '<b>HTTPS</b>는 HTTP를 <b>TLS</b>로 감싼 것이고 443번 포트를 씁니다. TCP 연결 직후 브라우저가 <code>ClientHello</code>로 접속할 도메인 이름(<b>SNI</b>)과 지원하는 암호 방식을 보내면, 서버는 <code>ServerHello</code>와 함께 <b>인증서</b>를 내밀고 그 짝인 개인키를 가졌음을 서명으로 증명합니다.',
        '동시에 양쪽은 키 교환으로 같은 <b>세션 키</b>를 계산해 냅니다. 키 자체는 회선 위를 지나가지 않습니다. 이후의 모든 데이터는 이 키로 암호화됩니다.',
      ],
      callout: { type: 'tip', text: 'TLS 1.3은 이 과정을 <b>1왕복</b>에 끝냅니다(1.2는 2왕복). 느린 공개키 연산은 핸드셰이크에만 쓰고, 실제 데이터는 빠른 대칭키로 암호화합니다.' },
      set: { eve: { state: null } },
      focus: ['nginx'],
      panel: {
        title: 'TLS 1.3 핸드셰이크', icon: 'lock',
        rows: [['① ClientHello', 'SNI · 암호 방식 · 키 재료', 'info'], ['② ServerHello', '인증서 · 서명 · 키 재료', 'accent'], ['③ 그다음부터', '세션 키로 암호화', 'ok']],
      },
      tags: [{ on: 'eve', text: '암호문만 보임', tone: 'ok', icon: 'lock', pos: 'bottom' }, { on: 'nginx', text: ':443', tone: 'ok' }],
      flows: [
        { path: ['user', 'hop', 'nginx'], kind: 'ctrl' }, { path: ['nginx', 'hop', 'user'], kind: 'ctrl', delay: 1.6 },
        { path: ['user', 'hop', 'nginx'], kind: 'data', n: 3, delay: 3.2 },
      ],
      metrics: { port: ['443', 'ok'], rt: 'TCP 1 + TLS 1', enc: ['암호화', 'ok'], cert: ['제시됨', 'warn'] },
      changes: [['+', '443번 HTTPS (TLS 1.3)'], ['~', '길목에서는 암호문만 보임'], ['~', '데이터 전 왕복 1 → 2']],
    },
    {
      key: '인증서 · CA', kind: 'concept', title: '인증서는 누가 보증하나: CA 체인',
      body: [
        '<b>인증서</b>는 "이 공개키는 <code>shop.example</code>의 것"이라는 문서에 <b>CA</b>(인증 기관)가 서명한 것입니다. 도메인 이름, 공개키, 유효 기간이 들어 있어요. 서버 인증서는 <b>중간 CA</b>가 서명하고, 중간 CA의 인증서는 <b>루트 CA</b>가 서명합니다.',
        '루트 CA의 인증서는 브라우저와 OS의 <b>신뢰 저장소</b>에 미리 들어 있습니다. 브라우저는 서명을 따라 올라가 아는 루트에 닿는지, 접속한 이름이 인증서와 같은지, 유효 기간 안인지 봅니다. 하나라도 틀리면 경고를 띄웁니다.',
      ],
      callout: { type: 'warn', text: '서버는 <b>중간 인증서까지 함께</b> 보내야 합니다. 빠뜨리면 브라우저에서는 되는데 <code>curl</code>이나 앱에서만 실패하곤 합니다. 인증서의 짝인 <b>개인키</b>는 서버 밖으로 나가면 안 됩니다.' },
      hide: ['host', 'sshd', 'mysql', 'hop', 'eve'],
      show: ['leaf', 'inter', 'root', 'e_un'],
      panel: {
        title: '브라우저가 확인하는 것', icon: 'shield-check',
        rows: [['서명', '아는 루트 CA까지 이어지는가', 'ok'], ['이름', '접속한 도메인과 같은가', 'ok'], ['기간', '유효 기간 안인가', 'ok']],
      },
      tags: [{ on: 'leaf', text: 'shop.example · 1년', icon: 'calendar' }],
      flows: [
        { path: ['nginx', 'user'], kind: 'ctrl', n: 2 },
        { path: ['leaf', 'inter', 'root', 'user'], kind: 'ctrl', n: 2, delay: 1.6 },
      ],
      metrics: { cert: ['검증됨 · 1년', 'ok'] },
    },
    {
      key: 'TLS 종료', kind: 'solution', title: 'HTTPS를 어디서 끝낼까',
      body: [
        '서버가 두 대로 늘면 인증서와 개인키도 두 벌이 됩니다. 서버마다 복사하고, 갱신할 때마다 전부 바꿔야 하죠. 그래서 보통 서버들 앞의 <b>로드 밸런서</b>에 인증서를 붙이고 거기서 TLS를 풉니다. 이것이 <b>TLS 종료</b>입니다.',
        'LB 뒤 구간은 사설망 안의 HTTP로 보내거나, 규정상 필요하면 다시 암호화합니다. 우리 팀은 1년짜리 인증서를 사서 LB에 올려 두었습니다. 이제 챙길 인증서는 한 장입니다.',
      ],
      callout: { type: 'warn', text: '한 곳에 모으면 관리가 쉬워지지만, 그 한 곳이 틀리면 <b>전부</b> 틀립니다. 로드 밸런서 자체는 3장에서 자세히 다룹니다.' },
      hide: ['nginx', 'leaf', 'inter', 'root'],
      show: ['lb', 'w1', 'w2'],
      set: { lb: { badge: '인증서 1장', tone: 'ok' } },
      focus: ['lb'],
      panel: {
        title: '어디서 TLS를 풀까', icon: 'split',
        rows: [['LB에서 종료', '인증서 한 곳 · 뒤는 HTTP', 'ok'], ['종료 후 재암호화', '뒤 구간도 TLS', 'info'], ['패스스루', '서버가 직접 · 인증서 여러 벌', 'warn']],
      },
      flows: [
        { path: ['user', 'lb', 'w1'], kind: 'data', n: 2 }, { path: ['user', 'lb', 'w2'], kind: 'data', n: 2, delay: 0.5 },
      ],
      metrics: { cert: ['LB에 1장 · 수동', 'warn'] },
      changes: [['+', '로드 밸런서에서 TLS 종료'], ['-', '서버마다 깔던 인증서와 개인키'], ['~', '갱신은 아직 사람이']],
    },
    {
      key: '인증서 만료', kind: 'case', title: '사례: 인증서 만료로 사이트가 멈췄습니다',
      body: [
        '1년 뒤 어느 아침, 모든 고객의 브라우저가 "연결이 비공개로 설정되어 있지 않습니다" 경고를 띄웁니다. 모바일 앱과 결제 연동은 경고도 없이 연결을 끊습니다. 인증서의 유효 기간이 지난 것입니다. 발급한 담당자는 퇴사했고, 갱신 안내 메일은 그 사람 주소로 가고 있었습니다.',
        '더 나쁜 것은 <b>대시보드가 전부 초록색</b>이었다는 점입니다. 서버 CPU는 정상이고, LB의 헬스 체크는 뒤쪽 HTTP로 가니 인증서와 무관하게 통과합니다.',
      ],
      callout: { type: 'warn', text: '만료는 날짜가 정해진 장애입니다. 인증서 <b>만료일을 지표로</b> 모니터링하고(예: 30일 전 알람), 바깥에서 실제 HTTPS로 접속해 보는 점검을 두세요.' },
      set: { lb: { state: 'down', badge: '인증서 만료', tone: 'bad' }, w1: { state: 'ok' }, w2: { state: 'ok' } },
      tags: [
        { on: 'user', text: 'ERR_CERT_DATE_INVALID', tone: 'bad', pos: 'bottom' },
        { on: 'w2', text: '헬스 체크 통과', tone: 'ok', pos: 'right' },
      ],
      flows: [
        { path: ['user', 'lb'], kind: 'bad', n: 3, gap: 0.45 },
        { path: ['lb', 'w1'], kind: 'ctrl', delay: 0.4 }, { path: ['lb', 'w2'], kind: 'ctrl', delay: 0.4 },
      ],
      metrics: { cert: ['만료', 'bad'], enc: ['연결 거부', 'bad'] },
      changes: [['-', '인증서 유효 기간 종료'], ['-', '브라우저 경고 · 앱 연결 실패'], ['~', '서버와 헬스 체크는 정상으로 보임']],
    },
    {
      key: '관리형 인증서', kind: 'solution', title: '갱신을 사람에게 맡기지 않습니다',
      body: [
        '클라우드의 <b>관리형 인증서</b>를 씁니다. AWS라면 <b>ACM</b>에서 인증서를 요청하고, DNS에 검증용 레코드를 넣어 도메인 소유를 증명합니다. 발급된 인증서를 LB에 연결해 두면 만료 전에 <b>알아서 갱신</b>되고, 개인키를 사람이 만질 일도 없습니다.',
        '클라우드 밖의 서버라면 <b>Let\'s Encrypt</b> 같은 무료 CA와 <code>certbot</code> 같은 자동화 도구로 같은 효과를 냅니다. 유효 기간이 짧은 인증서를 자동으로 자주 갱신하는 것이 요즘의 기본입니다.',
      ],
      callout: { type: 'warn', text: '자동 갱신도 실패합니다. 흔한 원인은 누군가 DNS의 <b>검증용 레코드를 지운 것</b>입니다. 그래서 만료 알람은 그대로 둡니다.' },
      show: ['acm', 'dnsrec'],
      set: { lb: { state: null, badge: '자동 갱신', tone: 'ok' }, w1: { state: null }, w2: { state: null } },
      focus: ['acm'],
      panel: {
        title: '인증서 관리 서비스', icon: 'cloud',
        rows: [['AWS', 'Certificate Manager (ACM)', 'aws'], ['Azure', 'Key Vault · 관리형 인증서', 'azure'], ['GCP', 'Certificate Manager', 'gcp'], ['NCP', 'Certificate Manager', 'ncp']],
      },
      flows: [
        { path: ['acm', 'dnsrec'], kind: 'ctrl' }, { path: ['acm', 'lb'], kind: 'ctrl', n: 2, delay: 1.1 },
        { path: ['user', 'lb', 'w1'], kind: 'data', n: 2, delay: 2.2 },
      ],
      metrics: { cert: ['자동 갱신', 'ok'], enc: ['암호화', 'ok'] },
      changes: [['+', '관리형 인증서 (DNS 검증)'], ['+', '만료 30일 전 알람'], ['-', '수동 갱신과 담당자 메일']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 포트로 찾고, TCP로 잇고, TLS로 믿기',
      body: [
        'IP가 서버를 찾는다면 <b>포트</b>는 그 안의 프로그램을 찾습니다. <b>TCP</b>는 3-way 핸드셰이크로 연결을 맺어 순서와 도착을 책임지고, <b>TLS</b>는 인증서로 상대를 확인한 뒤 세션 키로 암호화합니다. 연결이 안 되면 refused인지 timeout인지부터 구분하세요.',
        '인증서는 LB 한 곳에 모으고, 갱신은 관리형 서비스에 맡기고, 만료일은 알람으로 지킵니다. 이것으로 네트워크 기초를 마쳤습니다. 다음 장에서는 클라우드 안에 내 네트워크를 직접 짓습니다. <b>VPC와 서브넷</b>부터입니다.',
      ],
      hide: ['acm', 'dnsrec'],
      focus: ['lb'],
      tags: [{ on: 'lb', text: ':443', tone: 'ok', pos: 'left' }],
      flows: [
        { path: ['user', 'lb', 'w1'], kind: 'data', n: 2 }, { path: ['user', 'lb', 'w2'], kind: 'data', n: 2, delay: 0.5 },
      ],
    },
  ],
  quiz: [
    {
      q: '새로 띄운 서버에 curl을 보냈더니 한참 멈춰 있다가 Connection timed out이 납니다. 가장 먼저 의심할 것은?',
      options: ['nginx 프로세스가 죽어 있다', '방화벽(보안 그룹)이 그 포트를 막고 있거나 서버까지 가는 경로가 없다', '인증서가 만료됐다', '서버가 UDP만 받는다'],
      answer: 1,
      why: '듣는 프로그램이 없으면 서버가 곧바로 거절해 refused가 납니다. 답이 아예 없는 timeout은 패킷이 가는 길에서 버려졌다는 뜻입니다. 인증서 문제는 TCP 연결이 맺어진 뒤 TLS 단계에서야 드러납니다.',
    },
    {
      q: '카페 Wi-Fi에서 HTTPS로 쇼핑몰에 로그인했습니다. Wi-Fi 운영자가 알 수 없는 것은?',
      options: ['접속한 서버의 IP 주소', '접속한 도메인 이름', '요청에 담긴 비밀번호와 쿠키', '주고받은 데이터의 대략적인 양'],
      answer: 2,
      why: 'TLS는 내용을 암호화하지만 IP 주소와 포트는 그대로 보이고, 도메인 이름도 핸드셰이크의 SNI에 보통 평문으로 실립니다. 가려지는 것은 URL 경로, 헤더, 본문 같은 HTTP 내용입니다.',
    },
    {
      q: '브라우저에서는 잘 열리는 사이트가 curl과 모바일 앱에서만 인증서 오류를 냅니다. 가장 가능성이 큰 원인은?',
      options: ['서버가 중간 인증서를 함께 보내지 않는다', '443 포트가 방화벽에 막혀 있다', '서버의 개인키가 유출됐다', '서버가 TLS 1.3만 지원한다'],
      answer: 0,
      why: '브라우저는 빠진 중간 인증서를 스스로 찾아 메우기도 하지만, curl이나 앱은 서버가 보낸 체인만으로 검증합니다. 포트가 막혔다면 브라우저에서도 열리지 않고, 키 유출은 오류로 드러나지 않습니다.',
    },
    {
      q: '인증서 만료 장애를 다시 겪지 않으려 합니다. 가장 알맞은 조합은?',
      options: ['유효 기간이 가장 긴 인증서를 사서 교체 횟수를 줄인다', '담당자 캘린더에 갱신 일정을 등록한다', '관리형 인증서로 자동 갱신하고, 만료일 알람과 외부 HTTPS 점검을 함께 둔다', 'LB의 헬스 체크 주기를 짧게 한다'],
      answer: 2,
      why: '사람의 기억에 기대는 방법은 담당자가 바뀌면 무너집니다. 자동 갱신이 기본이고, 그 자동화가 실패할 때를 대비해 알람과 외부 점검을 둡니다. 헬스 체크는 LB 뒤쪽을 보므로 인증서 만료를 잡지 못합니다.',
    },
  ],
};
