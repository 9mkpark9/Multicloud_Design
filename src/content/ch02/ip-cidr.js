export default {
  id: 'ip-cidr',
  learn: [
    '공인 IP와 사설 IP(RFC 1918)의 차이',
    'CIDR 읽기: /16은 65,536개, /24는 256개',
    '대역을 서브넷으로 쪼개는 법과 예약 주소',
    '대역이 겹치면 연결이 막히는 이유',
    '처음부터 세우는 IP 대역 계획',
  ],
  legend: [['req', '요청'], ['data', '내부 통신'], ['sync', '클라우드 간 연결'], ['bad', '막힘']],
  metrics: [
    { id: 'range', label: '보고 있는 대역', icon: 'network' },
    { id: 'count', label: '주소 개수', icon: 'hash' },
    { id: 'free', label: '쓸 수 있는 주소', icon: 'check' },
    { id: 'clash', label: '대역 충돌', icon: 'warn' },
  ],
  scene: {
    zones: {
      vpc: { at: [0, -1], size: [5.6, 4.4], label: 'VPC 10.0.0.0/16', color: 'purple' },
      sn_a: { at: [0.25, -0.75], size: [2.4, 3.5], label: '10.0.1.0/24', color: 'green' },
      sn_b: { at: [2.95, -0.75], size: [2.4, 3.5], label: '10.0.2.0/24', color: 'blue' },
      vnet: { at: [6.3, -1], size: [3, 4.4], label: 'VNet 10.0.0.0/16', color: 'azure' },
    },
    nodes: {
      web: { at: [1.45, 1], label: '웹 서버', sub: '10.0.1.25', icon: 'server', color: 'blue' },
      db: { kind: 'cyl', at: [4.15, 1], label: 'DB 10.0.2.30', icon: 'database', color: 'purple' },
      eks: { at: [4.15, 1], label: 'EKS 노드', sub: 'Pod 40개', icon: 'container', color: 'orange' },
      net: { at: [1.45, 5.6], size: 's', label: '인터넷', icon: 'globe', color: 'gray' },
      home: { kind: 'client', at: [4.2, 5.6], label: '우리 집 PC' },
      az_vm: { at: [7.8, 1], label: 'VM', sub: '10.0.1.25', icon: 'server', color: 'azure' },
      // 대역 계획
      c_aws: { at: [1.2, -0.2], label: 'AWS', sub: '10.0.0.0/16', icon: 'cloud', color: 'aws' },
      c_azure: { at: [3.8, -0.2], label: 'Azure', sub: '10.1.0.0/16', icon: 'cloud', color: 'azure' },
      c_gcp: { at: [1.2, 2.4], label: 'GCP', sub: '10.2.0.0/16', icon: 'cloud', color: 'gcp' },
      c_ncp: { at: [3.8, 2.4], label: 'NCP', sub: '10.3.0.0/16', icon: 'cloud', color: 'ncp' },
      office: { at: [1.2, 5], label: '사무실', sub: '172.16.0.0/16', icon: 'building', color: 'sand' },
    },
    edges: {
      e_net_web: { from: 'net', to: 'web' },
      e_home_net: { from: 'home', to: 'net' },
      e_wd: { from: 'web', to: 'db', style: 'dashed' },
      e_we: { from: 'web', to: 'eks', style: 'dashed' },
      e_peer: { from: 'web', to: 'az_vm', bi: true, tone: 'bad', label: 'Peering' },
      e_aw_az: { from: 'c_aws', to: 'c_azure', bi: true, style: 'dashed' },
      e_az_nc: { from: 'c_azure', to: 'c_ncp', bi: true, style: 'dashed' },
      e_nc_gc: { from: 'c_ncp', to: 'c_gcp', bi: true, style: 'dashed' },
      e_gc_aw: { from: 'c_gcp', to: 'c_aws', bi: true, style: 'dashed' },
      e_off: { from: 'office', to: 'c_gcp', bi: true, style: 'dashed' },
    },
  },
  steps: [
    {
      key: '주소 두 개', kind: 'problem', title: '서버의 IP가 두 개인 것 같습니다',
      body: [
        '콘솔은 웹 서버의 IP가 <code>203.0.113.10</code>이라는데, SSH로 들어가 <code>ip addr</code>을 쳐 보면 <code>10.0.1.25</code>만 보입니다. 어느 쪽이 진짜일까요? 둘 다 진짜이고, 역할이 다릅니다.',
        'VPC를 만들 때 입력란의 <code>10.0.0.0/16</code>도 뜻을 모른 채 넘겼습니다. 이 숫자는 나중에 바꾸기가 거의 불가능하고, 잘못 고르면 1년 뒤 다른 네트워크와 이어야 할 때 터집니다.',
      ],
      callout: { type: 'key', text: '이번 레슨의 질문은 둘입니다. <b>주소에는 어떤 종류가 있나</b>, 그리고 <b>내 네트워크에 주소를 몇 개, 어디서부터 줄 것인가</b>.' },
      show: ['net', 'web'],
      tags: [{ on: 'net', text: '203.0.113.10으로 접속', icon: 'globe', pos: 'left' }, { on: 'web', text: 'ip addr → 10.0.1.25', icon: 'terminal' }],
      flows: [{ path: ['net', 'web'], kind: 'req', n: 3 }],
      metrics: { range: '?', count: '?', free: '?', clash: '모름' },
    },
    {
      key: '공인 · 사설', kind: 'concept', title: '공인 IP와 사설 IP',
      body: [
        '<b>공인 IP</b>는 인터넷 전체에서 하나뿐인 주소로, 통신사나 클라우드가 나눠 줍니다. <b>사설 IP</b>는 RFC 1918이 정한 세 대역으로, 인터넷 라우터가 전달하지 않으니 어느 회사·집이든 내부에서 마음껏 다시 씁니다. 우리 집 PC의 <code>192.168.0.10</code>은 옆집에도 있어요.',
        '밖으로 나갈 때는 공유기가 사설 주소를 공인 주소로 바꿔 줍니다(<b>NAT</b>). 클라우드 VM도 같습니다. OS는 사설 IP만 알고, 공인 IP는 VPC 경계에서 1:1로 바뀝니다.',
      ],
      show: ['home'],
      tags: [{ on: 'home', text: '192.168.0.10', icon: 'home', pos: 'bottom' }, { on: 'web', text: '사설 10.0.1.25', icon: 'lock' }],
      flows: [{ path: ['home', 'net'], kind: 'req', n: 2 }, { path: ['net', 'web'], kind: 'req', n: 2, delay: 1 }],
      panel: {
        title: '사설 대역 (RFC 1918)', icon: 'lock',
        rows: [['10.0.0.0/8', '약 1,677만 개', 'accent'], ['172.16.0.0/12', '약 105만 개', 'info'], ['192.168.0.0/16', '65,536개 · 가정용', 'warn'], ['그 밖의 대부분', '공인 (인터넷에서 유일)', 'mute']],
      },
      metrics: { range: '10.0.0.0/8', count: '16,777,216' },
      changes: [['+', '공인 IP: 인터넷용, 유일'], ['+', '사설 IP: 내부용, 재사용']],
    },
    {
      key: 'CIDR', kind: 'concept', title: 'CIDR: 슬래시 뒤 숫자 읽기',
      body: [
        'IPv4 주소는 32비트를 8비트씩 네 칸으로 끊어 적은 것입니다. <b>CIDR</b> 표기 <code>10.0.0.0/16</code>의 <code>/16</code>은 "앞의 16비트는 고정"이라는 뜻이에요. 남은 16비트는 자유롭게 쓸 수 있으니 주소는 2<sup>16</sup> = <b>65,536개</b>입니다.',
        '공식은 <b>2<sup>(32 − n)</sup></b>. <code>/24</code>는 256개, <code>/28</code>은 16개입니다. 숫자가 <b>클수록 대역은 작아지고</b>, 1이 줄 때마다 두 배가 됩니다.',
      ],
      callout: { type: 'tip', text: '/8 · /16 · /24처럼 8의 배수면 칸 단위로 끊겨 읽기 쉽습니다. <code>10.0.0.0/16</code>은 "10.0.x.x 전부"예요.' },
      hide: ['home', 'net'],
      show: ['vpc'],
      focus: ['web'],
      code: {
        title: 'CIDR 계산', lang: 'text', hl: [1, 4, 7],
        text: `10.0.0.0/16
00001010.00000000 | 00000000.00000000
  앞 16비트 고정    |  뒤 16비트 자유
→ 2^16 = 65,536개  (10.0.x.x 전부)

10.0.1.0/24
00001010.00000000.00000001 | 00000000
→ 2^8 = 256개  (10.0.1.0 ~ 10.0.1.255)

/28 → 2^4 = 16개
/32 → 1개 (주소 딱 하나)`,
      },
      metrics: { range: '10.0.0.0/16', count: '65,536' },
    },
    {
      key: '서브넷', kind: 'concept', title: '큰 대역을 서브넷으로 쪼갭니다',
      body: [
        'VPC의 <code>/16</code>을 통째로 쓰지 않고 작은 <b>서브넷</b>으로 나눕니다. <code>/24</code>로 자르면 256개짜리 서브넷이 256개 나와요. <code>10.0.1.0/24</code>는 <code>10.0.1.0</code>부터 <code>10.0.1.255</code>까지입니다.',
        '서브넷은 VPC 범위 안에 있어야 하고 서로 겹치면 안 됩니다. 셋째 칸에 규칙을 두면(1은 웹, 2는 DB) 주소만 보고도 어디 있는 서버인지 압니다.',
      ],
      callout: { type: 'key', text: '퍼블릭·프라이빗 서브넷과 라우팅은 3장 「VPC와 서브넷」에서 다룹니다. 여기서는 <b>주소를 나누는 산수</b>만 봅니다.' },
      show: ['sn_a', 'sn_b', 'db'],
      tags: [{ on: 'db', text: '10.0.2.x = DB', icon: 'database' }],
      flows: [{ path: ['web', 'db'], kind: 'data', n: 2 }],
      panel: {
        title: '/16 쪼개기 계산표', icon: 'table',
        rows: [['/16 × 1', '65,536개', 'accent'], ['/17 × 2', '32,768개씩', 'mute'], ['/20 × 16', '4,096개씩', 'info'], ['/24 × 256', '256개씩', 'ok'], ['/28 × 4,096', '16개씩', 'warn']],
      },
      metrics: { range: '10.0.1.0/24', count: '256', free: '256?' },
      changes: [['+', '서브넷 10.0.1.0/24 (웹)'], ['+', '서브넷 10.0.2.0/24 (DB)']],
    },
    {
      key: '예약 주소', kind: 'concept', title: '256개를 다 쓸 수는 없습니다',
      body: [
        '클라우드는 서브넷마다 주소 몇 개를 자기 몫으로 떼어 둡니다. AWS는 <b>앞의 4개와 마지막 1개</b>, 모두 5개를 예약합니다. 그래서 <code>/24</code>에서 실제로 쓸 수 있는 주소는 <b>251개</b>, <code>/28</code>이면 11개뿐입니다.',
        '서브넷이 작을수록 예약분의 비중이 커집니다. 서버가 몇 대 안 된다고 <code>/28</code>로 잡으면 금세 모자랍니다.',
      ],
      callout: { type: 'cloud', text: 'Azure도 서브넷마다 5개, GCP는 서브넷 기본 범위에서 4개를 예약합니다. 숫자는 달라도 "전부 쓸 수는 없다"는 점은 같아요.' },
      hide: ['vpc', 'sn_b', 'db'],
      focus: ['web'],
      panel: {
        title: 'AWS 서브넷 10.0.1.0/24', icon: 'list',
        rows: [['10.0.1.0', '네트워크 주소', 'mute'], ['10.0.1.1', 'VPC 라우터', 'mute'], ['10.0.1.2', 'DNS', 'mute'], ['10.0.1.3', '예비 (향후용)', 'mute'], ['10.0.1.255', '브로드캐스트', 'mute'], ['10.0.1.4 – .254', '사용 가능 251개', 'ok']],
      },
      metrics: { free: ['251', 'ok'] },
      changes: [['-', '예약 5개 (AWS)'], ['~', '256 → 251개']],
    },
    {
      key: 'IP 고갈', kind: 'case', title: '사례: 서브넷이 작아 Pod가 못 뜹니다',
      body: [
        '쿠버네티스 노드를 <code>/26</code>(64개, 사용 가능 59개) 서브넷에 올렸습니다. 그런데 EKS의 기본 네트워크 플러그인은 <b>Pod마다 VPC의 IP를 하나씩</b> 주고, 노드는 IP를 미리 확보해 두기까지 합니다. 노드 몇 대에 Pod 수십 개면 주소가 바닥나고, 새 Pod는 IP를 못 받아 뜨지 못합니다.',
        '오토스케일링으로 늘어나는 VM, 로드 밸런서도 서브넷 IP를 씁니다. 게다가 AWS는 만든 서브넷의 크기를 바꿀 수 없어서, 새 서브넷을 만들어 옮겨야 합니다.',
      ],
      callout: { type: 'key', text: '사설 주소에는 요금이 없습니다. 넉넉하게 잡는 비용은 거의 0이고, 모자라는 비용은 큽니다.' },
      show: ['vpc', 'sn_b', 'eks'],
      set: { sn_b: { label: '10.0.2.0/26' }, eks: { state: 'hot', badge: 'IP 0개 남음', tone: 'bad' } },
      tags: [{ on: 'eks', text: 'Pod Pending', tone: 'bad', icon: 'clock', pos: 'right' }],
      flows: [{ path: ['web', 'eks'], kind: 'bad', n: 3, gap: 0.4 }],
      metrics: { range: '10.0.2.0/26', count: '64', free: ['0', 'bad'] },
      changes: [['~', '/26: 사용 가능 59개'], ['-', 'Pod에 줄 IP 없음'], ['+', '해결: 큰 서브넷 새로 만들어 이전']],
    },
    {
      key: '대역 충돌', kind: 'case', title: '사례: 두 네트워크가 같은 대역을 씁니다',
      body: [
        '1년 뒤, Azure를 쓰는 팀과 네트워크를 이어야 합니다. 그런데 피어링이 거절됩니다. 양쪽 모두 콘솔이 제안한 값을 그대로 받아 <code>10.0.0.0/16</code>이었고, <code>10.0.1.25</code>라는 서버도 양쪽에 하나씩 있습니다.',
        '라우터에게 <code>10.0.1.25</code>로 가는 길은 "내 VPC 안"뿐이라 상대 쪽 경로를 넣을 수 없습니다. 피어링·VPN·전용선이 모두 같은 이유로 막혀요. 대역을 바꾸려면 안의 서버·DB·LB를 사실상 다시 만들어야 합니다.',
      ],
      callout: { type: 'warn', text: 'NAT로 주소를 바꿔 우회할 수는 있지만, 복잡하고 장애 추적이 괴로운 임시방편입니다.' },
      hide: ['eks', 'sn_b'],
      show: ['vnet', 'az_vm'],
      set: { sn_b: { label: '10.0.2.0/24' } },
      focus: ['az_vm'],
      tags: [{ on: 'az_vm', text: '같은 10.0.1.25', tone: 'bad', icon: 'copy' }, { on: 'web', text: '어느 10.0.1.25?', tone: 'warn' }],
      flows: [{ path: ['web', 'az_vm'], kind: 'bad', n: 3, gap: 0.5 }],
      metrics: { range: '10.0.0.0/16 × 2', count: '65,536', free: '—', clash: ['겹침', 'bad'] },
      changes: [['-', '피어링 · VPN 불가'], ['~', '해결하려면 한쪽을 재구축']],
    },
    {
      key: '대역 계획', kind: 'solution', title: '처음부터 대역을 계획합니다',
      body: [
        '<b>IP 대역 계획</b>은 첫 VPC를 만들기 전에 합니다. 회사 전체가 쓸 큰 덩어리(예: <code>10.0.0.0/8</code>)를 정하고, 클라우드·리전·환경마다 겹치지 않는 <code>/16</code>을 나눠 준 뒤, 한 장의 대장(<b>IPAM</b>)에 기록합니다.',
        '서브넷은 <code>/20</code>~<code>/24</code>처럼 여유 있게, VPC 안에도 빈자리를 남깁니다. 지금 이을 계획이 없어도 겹치지 않게 해 두면, 언젠가 이어야 할 때 아무것도 다시 만들 필요가 없어요.',
      ],
      callout: { type: 'tip', text: '가정용 공유기가 흔히 쓰는 <code>192.168.0.0/24</code> 근처는 피하세요. VPN으로 접속한 직원의 집 네트워크와 겹칩니다.' },
      hide: ['vpc', 'sn_a', 'vnet', 'web', 'az_vm'],
      show: ['c_aws', 'c_azure', 'c_gcp', 'c_ncp', 'office'],
      flows: [
        { path: ['c_aws', 'c_azure'], kind: 'sync', n: 2 }, { path: ['c_gcp', 'c_ncp'], kind: 'sync', n: 2, delay: 0.5 },
        { path: ['office', 'c_gcp'], kind: 'sync', n: 2, delay: 1 },
      ],
      panel: {
        title: 'shop.example IP 대역 계획 (예)', icon: 'map',
        rows: [['AWS 서울 · 운영', '10.0.0.0/16', 'aws'], ['Azure · 운영', '10.1.0.0/16', 'azure'], ['GCP · 분석', '10.2.0.0/16', 'gcp'], ['NCP · 공공', '10.3.0.0/16', 'ncp'], ['사무실 · VPN', '172.16.0.0/16', 'info'], ['예비 (새 리전 · 환경)', '10.4.0.0/16 ~', 'mute']],
      },
      metrics: { range: '10.0~10.3 /16', count: '65,536 × 4', free: '넉넉함', clash: ['없음', 'ok'] },
      changes: [['+', '클라우드별 /16 배정'], ['+', 'IPAM 대장에 기록'], ['~', '충돌 → 없음']],
    },
    {
      key: '4대 클라우드', kind: 'compare', title: '대역을 거는 위치가 다릅니다',
      body: [
        'AWS·Azure·NCP는 VPC(Azure는 VNet) 전체에 대역을 정하고 그 안을 서브넷으로 나눕니다. AWS는 나중에 <b>보조 CIDR</b>을 붙여 넓힐 수 있고, Azure VNet은 주소 공간을 여러 개 가질 수 있어요.',
        'GCP의 VPC는 글로벌이라 VPC 자체에는 대역이 없고, <b>리전별 서브넷</b>마다 대역을 줍니다. <b>자동 모드</b> VPC는 리전마다 서브넷을 미리 만드는데, 모든 자동 모드 VPC가 같은 <code>10.128.0.0/9</code> 범위를 써서 서로 겹칩니다.',
      ],
      callout: { type: 'cloud', text: '운영용 GCP VPC는 <b>커스텀 모드</b>로 만들어 대역을 직접 정하세요. 자동 모드 VPC끼리는 피어링할 수 없습니다.' },
      hide: ['office'],
      panel: {
        title: '대역은 어디에 거나', icon: 'cloud',
        rows: [['AWS', 'VPC 대역 + 보조 CIDR', 'aws'], ['Azure', 'VNet 주소 공간 (여러 개)', 'azure'], ['GCP', '서브넷마다 대역 (리전별)', 'gcp'], ['NCP', 'VPC 대역 → 서브넷 분할', 'ncp']],
      },
      tags: [{ on: 'c_gcp', text: '자동 모드 주의', tone: 'warn', icon: 'warn', pos: 'bottom' }],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 넉넉하게, 겹치지 않게, 기록하며',
      body: [
        '공인 IP는 인터넷에서 유일하고, 사설 IP(<code>10/8</code> · <code>172.16/12</code> · <code>192.168/16</code>)는 내부에서 재사용합니다. <code>/n</code>은 2<sup>(32 − n)</sup>개이고, 클라우드는 서브넷마다 몇 개를 예약합니다.',
        '대역은 한 번 정하면 바꾸기 어렵습니다. 처음부터 넉넉하게, 겹치지 않게 나누고 대장에 적으세요. 다음 레슨에서는 이 주소 위에서 프로그램을 찾아가는 <b>포트</b>와, 연결을 암호화하는 <b>TLS</b>를 봅니다.',
      ],
      show: ['office'],
      tags: [
        { on: 'c_aws', text: '3장 · VPC와 서브넷', icon: 'network' },
        { on: 'office', text: '3장 · VPN · 피어링', icon: 'link', pos: 'left' },
      ],
      flows: [{ path: ['c_aws', 'c_azure'], kind: 'sync' }, { path: ['office', 'c_gcp'], kind: 'sync', delay: 0.6 }],
    },
  ],
  quiz: [
    {
      q: '우리 AWS VPC는 10.0.0.0/16입니다. 인수한 회사의 Azure VNet도 10.0.0.0/16이라면, 두 네트워크를 피어링으로 이으려 할 때 어떻게 될까요?',
      options: ['바로 연결된다. 서로 다른 클라우드라 상관없다', '대역이 겹쳐 연결할 수 없다. 한쪽 대역을 바꾸거나 NAT로 우회해야 한다', '서브넷 번호만 다르면 연결된다', '두 쪽 서버에 공인 IP를 붙이면 피어링이 된다'],
      answer: 1,
      why: '라우팅은 목적지 대역으로 길을 고릅니다. 같은 대역이 양쪽에 있으면 "상대 쪽"으로 가는 경로를 만들 수 없어서 피어링·VPN 모두 막힙니다. 클라우드가 달라도 마찬가지이고, 공인 IP는 인터넷 경유일 뿐 사설 연결의 해법이 아닙니다.',
    },
    {
      q: 'AWS에서 10.0.1.0/24 서브넷을 만들었습니다. 서버에 줄 수 있는 IP는 최대 몇 개일까요?',
      options: ['256개', '254개', '251개', '250개'],
      answer: 2,
      why: '/24는 2^8 = 256개이고, AWS는 서브넷마다 앞의 4개(네트워크·라우터·DNS·예비)와 마지막 1개를 예약합니다. 254개는 네트워크·브로드캐스트만 빼는 전통적인 계산이라 클라우드에서는 맞지 않습니다.',
    },
    {
      q: 'EKS 클러스터용 서브넷 크기를 정하려 합니다. 지금은 노드 3대면 충분합니다. 가장 좋은 판단은?',
      options: ['/28로 작게 시작하고, 모자라면 서브넷 크기를 늘린다', '/20 정도로 넉넉하게 잡는다. Pod도 VPC IP를 쓰고 서브넷 크기는 나중에 못 바꾼다', '10.0.0.0/8 전체를 서브넷 하나로 준다', '공인 IP 대역을 서브넷으로 쓴다'],
      answer: 1,
      why: 'EKS 기본 구성에서는 Pod마다 VPC IP를 쓰고, AWS 서브넷은 만든 뒤 크기를 바꿀 수 없습니다. 그래서 여유 있게 잡는 것이 안전합니다. 다만 /8 전체를 한 서브넷에 주면 다른 VPC·서브넷에 줄 대역이 사라지니 지나칩니다.',
    },
    {
      q: 'VPC가 10.0.0.0/16일 때, 이 VPC 안에 만들 수 없는 서브넷은?',
      options: ['10.0.1.0/24', '10.0.128.0/17', '10.1.0.0/24', '10.0.255.0/24'],
      answer: 2,
      why: '10.0.0.0/16은 10.0.0.0부터 10.0.255.255까지입니다. 10.1.0.0/24는 둘째 칸이 1이라 범위 밖입니다. 10.0.128.0/17은 VPC의 뒤쪽 절반으로, 범위 안에 있습니다.',
    },
  ],
};
