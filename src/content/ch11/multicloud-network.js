export default {
  id: 'multicloud-network',
  learn: [
    '겹치지 않는 IP 계획이 모든 것의 시작인 이유',
    '클라우드 간 Site-to-Site VPN과 BGP',
    '풀 메시의 한계와 전용선 허브(허브-스포크), 그리고 이중화',
    '조건부 전달로 사설 DNS 통합하기',
    'GSLB로 사용자를 클라우드 사이에 분산하기',
    '지연 · 암호화 · 데이터 전송 비용의 균형',
  ],
  legend: [['req', '요청'], ['res', '응답'], ['ctrl', 'BGP · DNS · 헬스 체크'], ['data', '데이터'], ['bad', '실패']],
  metrics: [
    { id: 'path', label: '클라우드 간 경로', icon: 'route' },
    { id: 'links', label: '관리할 연결', icon: 'cable' },
    { id: 'lat', label: '지연', icon: 'timer' },
    { id: 'ip', label: 'IP 대역 충돌', icon: 'hash' },
  ],
  scene: {
    zones: {
      vA: { at: [0, 1.8], size: [3, 3], label: 'AWS 10.0.0.0/16', color: 'aws' },
      vN: { at: [3.9, -2.1], size: [3, 3], label: 'NCP 10.0.0.0/16', color: 'ncp' },
    },
    nodes: {
      // close-up: one pair of clouds
      app: { at: [0.9, 3.4], label: '주문 API', icon: 'server', color: 'aws' },
      db: { kind: 'cyl', at: [6.1, -1.5], label: '공공 고객 DB', icon: 'database', color: 'ncp' },
      inet: { at: [2.1, -0.6], label: '인터넷', sub: '공인 경로', icon: 'globe', color: 'gray' },
      gwA: { at: [2.4, 2.5], size: 's', label: 'VPN', sub: '게이트웨이', icon: 'lock', color: 'aws' },
      gwN: { at: [4.9, -0.7], size: 's', label: 'VPN', sub: '게이트웨이', icon: 'lock', color: 'ncp' },
      rA: { at: [2.4, 2.5], size: 's', label: 'DNS', sub: '리졸버', icon: 'signpost', color: 'aws' },
      rN: { at: [4.9, -0.7], size: 's', label: 'DNS', sub: '리졸버', icon: 'signpost', color: 'ncp' },
      // wide view: the four networks
      cA: { at: [0, 0], label: 'AWS', sub: '10.10.0.0/16', icon: 'cloud', color: 'aws' },
      cZ: { at: [5, 0], label: 'Azure', sub: '10.20.0.0/16', icon: 'cloud', color: 'azure' },
      cG: { at: [0, 5], label: 'GCP', sub: '10.30.0.0/16', icon: 'cloud', color: 'gcp' },
      cN: { at: [5, 5], label: 'NCP', sub: '10.40.0.0/16', icon: 'cloud', color: 'ncp' },
      hub: { at: [2.5, 2.5], size: 's', label: '허브 라우터', sub: '코로케이션', icon: 'router', color: 'navy' },
      users: { kind: 'users', at: [0, 5], label: '사용자' },
      gslb: { at: [-2.5, 2.5], label: 'GSLB', sub: 'DNS 응답', icon: 'compass', color: 'purple' },
    },
    edges: {
      e_app_inet: { from: 'app', to: 'inet', tone: 'bad' },
      e_inet_db: { from: 'inet', to: 'db', tone: 'bad' },
      e_app_gw: { from: 'app', to: 'gwA' },
      e_tun: { from: 'gwA', to: 'gwN', bi: true, label: 'IPsec 터널 × 2' },
      e_gw_db: { from: 'gwN', to: 'db' },
      e_app_r: { from: 'app', to: 'rA', style: 'dashed' },
      e_fwd: { from: 'rA', to: 'rN', style: 'dashed', label: '조건부 전달' },
      m1: { from: 'cA', to: 'cZ', bi: true, off: true },
      m2: { from: 'cA', to: 'cG', bi: true, off: true },
      m3: { from: 'cZ', to: 'cN', bi: true, off: true },
      m4: { from: 'cG', to: 'cN', bi: true, off: true },
      m5: { from: 'cA', to: 'cN', bi: true, off: true },
      m6: { from: 'cG', to: 'cZ', bi: true, off: true },
      vpnb: { from: 'cA', to: 'cN', via: [[3, 0.5], [4.6, 2.1]], bi: true, off: true, style: 'dashed', label: 'VPN 백업' },
      h1: { from: 'hub', to: 'cA', bi: true },
      h2: { from: 'hub', to: 'cZ', bi: true },
      h3: { from: 'hub', to: 'cG', bi: true },
      h4: { from: 'hub', to: 'cN', bi: true },
      e_u_g: { from: 'users', to: 'gslb', style: 'dashed' },
      e_g_a: { from: 'gslb', to: 'cA', style: 'dashed', tone: 'mute' },
      e_g_z: { from: 'gslb', to: 'cZ', style: 'dashed', tone: 'mute' },
      e_u_a: { from: 'users', to: 'cA' },
      e_u_z: { from: 'users', to: 'cZ' },
    },
  },
  codes: {
    vgw: {
      title: '터미널 (AWS)', lang: 'sh',
      text: `$ Q='VpnConnections[0].VgwTelemetry'
$ aws ec2 describe-vpn-connections \\
    --query "$Q"
[
 {
  "OutsideIpAddress": "203.0.113.11",
  "Status": "UP",
  "AcceptedRouteCount": 1
 },
 {
  "OutsideIpAddress": "203.0.113.12",
  "Status": "DOWN",
  "AcceptedRouteCount": 0
 }
]`,
    },
  },
  steps: [
    {
      key: '끊어진 섬', kind: 'problem', title: '네 클라우드, 서로 닿지 않습니다',
      body: [
        '<code>shop.example</code>의 주문 API는 AWS에, 공공 고객 DB는 NCP에 있습니다. 둘이 통신해야 하는데 두 VPC는 서로를 모릅니다. 지금 갈 수 있는 길은 <b>공인 인터넷</b>뿐이에요.',
        '그러려면 DB에 공인 IP를 붙이고 방화벽을 인터넷 쪽으로 열어야 합니다. 3장에서 프라이빗 서브넷에 숨겨 둔 DB를 다시 길가에 내놓는 셈이고, 경로의 지연도 그때그때 달라집니다.',
      ],
      callout: { type: 'warn', text: '클라우드를 여러 개 쓴다고 저절로 이어지지는 않습니다. <b>사설 경로</b>는 직접 설계해야 합니다.' },
      show: ['vA', 'vN', 'app', 'db', 'inet'],
      tags: [{ on: 'db', text: '공인 IP 노출', tone: 'bad', icon: 'unlock' }],
      flows: [{ path: ['app', 'inet', 'db'], kind: 'req', n: 2 }, { path: ['db', 'inet', 'app'], kind: 'res', n: 2, delay: 2 }],
      metrics: { path: ['공인 인터넷', 'bad'], links: '0개', lat: ['들쭉날쭉', 'warn'], ip: '확인 안 함' },
      more: [
        { title: '왜 공인 경로가 문제인가', list: [
          '<b>공격 표면</b>: DB 포트가 인터넷에서 보이면 무차별 대입과 취약점 스캔의 표적이 됩니다.',
          '<b>허용 목록 관리</b>: 상대 클라우드의 나가는 IP(NAT IP)를 방화벽에 적어야 하는데, 이 IP는 바뀌기도 합니다.',
          '<b>품질</b>: 경로가 인터넷 사업자들의 사정에 달려 있어 지연과 손실이 일정하지 않습니다.',
        ] },
        { title: '그래도 공인 경로를 쓰는 경우', body: [
          '모든 클라우드 간 통신이 사설일 필요는 없습니다. 오브젝트 스토리지 API처럼 원래 인터넷에 열려 있고 <b>TLS와 강한 인증</b>으로 지키는 서비스는 공인 경로로 쓰는 일이 흔해요. 문제는 DB처럼 원래 사설망 안에 있어야 할 것을 밖으로 꺼내는 경우입니다.',
          '판단 기준은 "이 엔드포인트가 원래 인터넷에 열리도록 설계된 것인가"입니다. 아니라면 사설 경로를 만듭니다.',
        ] },
        { title: '이 레슨의 순서', body: [
          '네트워크 설계는 <b>주소 → 경로 → 이름 → 입구</b> 순서로 쌓습니다. 겹치지 않는 IP 대역을 먼저 정하고, VPN이나 전용선으로 경로를 만들고, 사설 DNS로 이름을 통합하고, 마지막으로 바깥 사용자의 입구를 GSLB로 정합니다.',
        ] },
      ],
    },
    {
      key: 'IP 겹침', kind: 'case', title: '사례: 양쪽 다 10.0.0.0/16',
      body: [
        '사설로 이으려고 양쪽 대역을 적어 보니 둘 다 <code>10.0.0.0/16</code>입니다. 팀마다 튜토리얼의 예시 값을 그대로 썼기 때문이에요. 흔한 일입니다.',
        '주문 API가 DB 주소 <code>10.0.3.15</code>로 패킷을 보내면, AWS의 라우팅 테이블은 "10.0.0.0/16은 <b>내 VPC 안</b>"이라고 답합니다. 패킷은 VPC 밖으로 나가 보지도 못합니다. NAT로 주소를 바꿔 끼우는 우회로가 있지만 설정과 디버깅이 몹시 고통스럽습니다.',
      ],
      callout: { type: 'warn', text: 'VPC의 대역은 만든 뒤에는 사실상 바꿀 수 없습니다. 고치려면 <b>새로 만들어 이사</b>해야 합니다. 그래서 IP 계획이 가장 먼저입니다.' },
      hide: ['inet'],
      set: { app: { state: 'hot' } },
      tags: [
        { on: 'app', text: '목적지 10.0.3.15', icon: 'send' },
        { on: 'db', text: '10.0.3.15', tone: 'ncp' },
        { at: [3.45, 1.35], text: '같은 대역끼리는 못 잇는다', tone: 'bad', dy: 58 },
      ],
      flows: [{ path: ['app', [2.5, 2.7], [1.6, 2.2]], kind: 'bad', n: 3, gap: 0.5 }],
      metrics: { ip: ['겹침', 'bad'] },
      changes: [['-', '두 VPC가 같은 10.0.0.0/16'], ['~', '패킷이 VPC 밖으로 못 나감'], ['~', '해결: 한쪽을 새 대역으로 재구축']],
      more: [
        { title: '동작 원리: 가장 긴 접두사', body: [
          '라우터는 목적지 주소와 <b>가장 길게 일치하는</b> 경로를 고릅니다. VPC 라우팅 테이블에는 자기 대역을 가리키는 <code>local</code> 경로가 항상 있고, 이 경로는 지우거나 덮어쓸 수 없습니다. 그래서 같은 /16을 VPN 쪽으로 보내는 경로를 추가해도 <code>local</code>이 이깁니다.',
        ] },
        { title: '출력 읽기', body: ['AWS 라우팅 테이블을 보면 원인이 바로 보입니다.'], code: { title: 'terminal', lang: 'sh', text: `$ aws ec2 describe-route-tables \\
    --query 'RouteTables[0].Routes'
- DestinationCidrBlock: 10.0.0.0/16
  GatewayId: local          # 내 VPC: 항상 이김
- DestinationCidrBlock: 0.0.0.0/0
  NatGatewayId: nat-0a1b2c...` } },
        { title: '고치는 길', list: [
          '<b>정석</b>: 계획표에서 새 대역을 받아 한쪽 VPC를 새로 만들고 워크로드를 옮깁니다.',
          '<b>임시 우회</b>: 양쪽 경계에서 주소를 다른 대역으로 바꿔 끼우는 NAT. 로그의 IP가 실제와 달라 디버깅이 어렵고, 양방향 연결이 복잡해집니다.',
          '<b>서비스 단위 노출</b>: AWS PrivateLink처럼 특정 서비스만 내보내는 방식은 대역 겹침과 무관하게 동작하지만, 클라우드를 넘는 범용 해법은 아닙니다.',
        ] },
      ],
    },
    {
      key: 'IP 계획', kind: 'solution', title: '전체 주소 공간을 먼저 나눕니다',
      body: [
        '클라우드를 잇기 전에 <b>회사 전체의 주소 계획표</b>를 만듭니다. 사무실, 클라우드, 리전마다 서로 겹치지 않는 대역을 하나씩 배정하고, 이 표를 유일한 기준으로 삼습니다. 2장에서 배운 CIDR 쪼개기를 회사 단위로 하는 거예요.',
        '세 가지를 지키세요. 클라우드마다 <b>알아보기 쉬운 블록</b>(10.10, 10.20…)을 주고, 미래의 리전과 인수합병을 위해 <b>빈 블록을 남기고</b>, Kubernetes의 Pod·Service 대역도 표에 넣습니다.',
      ],
      callout: { type: 'tip', text: '새 VPC는 콘솔이 제안하는 값이 아니라 <b>계획표에서 받은 대역</b>으로 만듭니다. Terraform 변수로 두면 리뷰에서 걸러집니다.' },
      hide: ['vA', 'vN', 'app', 'db'],
      show: ['cA', 'cZ', 'cG', 'cN'],
      set: { app: { state: null }, vA: { label: 'AWS 10.10.0.0/16' }, vN: { label: 'NCP 10.40.0.0/16' } },
      panel: {
        title: '계획표의 나머지 줄', icon: 'table',
        rows: [['사무실 · VPN 사용자', '10.0.0.0/16', 'mute'], ['예약 (새 리전 · 인수)', '10.50.0.0/16 ~', 'info'], ['Pod · Service 대역', '표에 함께 기록', 'accent']],
      },
      metrics: { ip: ['없음', 'ok'] },
      changes: [['+', '회사 전체 주소 계획표'], ['~', '클라우드마다 겹치지 않는 /16'], ['+', '미래를 위한 예약 블록']],
      more: [
        { title: '설정 예시', body: ['계획표를 코드로 두면 새 VPC가 표 밖의 값을 쓰는 순간 리뷰에서 보입니다.'], code: { title: 'ipam/main.tf', lang: 'hcl', text: `locals {
  cidr = {
    office    = "10.0.0.0/16"
    aws_seoul = "10.10.0.0/16"
    aws_dr    = "10.11.0.0/16"
    azure     = "10.20.0.0/16"
    gcp       = "10.30.0.0/16"
    ncp_gov   = "10.40.0.0/16"
    # 10.50.0.0/16 ~ 10.99.0.0/16 예약
  }
}
output "cidr" { value = local.cidr }` } },
        { title: 'Kubernetes 대역도 잊지 마세요', body: [
          '클러스터의 <b>Pod 대역</b>이 VPC 대역 안에서 나오는 방식(EKS의 기본 VPC CNI처럼)도 있고, 별도의 오버레이 대역을 쓰는 방식도 있습니다. 클러스터끼리 Pod IP로 직접 통신하게 될 가능성이 있다면 Pod · Service 대역도 클러스터마다 겹치지 않게 계획표에 적어야 해요. 다음 레슨의 멀티 클러스터 연결이 바로 이것을 요구합니다.',
        ] },
        { title: '실무 팁', list: [
          '클라우드에 /16을 통째로 주고, 그 안에서 환경(prod · stg)과 AZ별 서브넷으로 다시 나눕니다.',
          '<code>172.17.0.0/16</code>처럼 Docker 같은 도구가 기본으로 쓰는 대역은 피하세요.',
          'AWS VPC IPAM처럼 대역 배정을 관리하는 기능도 있지만, 여러 클라우드에 걸친 기준은 결국 회사의 표 하나입니다.',
        ] },
      ],
    },
    {
      key: 'IPsec 터널', kind: 'solution', title: '양쪽에 게이트웨이를 세우고 터널을 맺습니다',
      body: [
        '<b>Site-to-Site VPN</b>은 양쪽 VPC에 VPN 게이트웨이를 하나씩 두고, 인터넷 위에 <b>IPsec 암호화 터널</b>을 맺는 방식입니다. 서로 상대의 공인 IP와 사전 공유 키(PSK)를 등록하고, 암호 알고리즘을 양쪽이 똑같이 맞춰야 합니다.',
        '터널은 보통 <b>두 개</b>를 맺습니다. 사업자가 한쪽 터널의 장비를 점검하는 동안에도 다른 터널로 통신이 이어지게 하기 위해서예요.',
      ],
      callout: { type: 'tip', text: '터널이 맺어졌다고 끝이 아닙니다. 라우팅 테이블에 상대 대역으로 가는 경로가 있고, 보안 그룹이 상대 대역을 허용해야 패킷이 흐릅니다.' },
      hide: ['cA', 'cZ', 'cG', 'cN'],
      show: ['vA', 'vN', 'app', 'db', 'gwA', 'gwN'],
      focus: ['gwA', 'gwN'],
      tags: [
        { on: 'gwA', text: 'IKEv2 · PSK', tone: 'aws' },
        { on: 'gwN', text: '같은 알고리즘', tone: 'ncp' },
      ],
      flows: [{ path: ['app', 'gwA', 'gwN', 'db'], kind: 'req', n: 2 }, { path: ['db', 'gwN', 'gwA', 'app'], kind: 'res', n: 2, delay: 2.2 }],
      metrics: { path: ['IPsec VPN', 'ok'], links: '1개', lat: ['인터넷 수준', 'warn'] },
      changes: [['+', '양쪽 VPN 게이트웨이'], ['+', 'IPsec 터널 2개'], ['-', 'DB의 공인 IP']],
      more: [
        { title: '동작 원리', body: [
          'IPsec은 두 단계로 맺어집니다. 먼저 <b>IKE</b>가 양쪽을 인증하고(PSK나 인증서) 키를 합의하는 제어 채널을 만들고, 그 위에서 실제 데이터를 암호화할 <b>SA</b>(보안 연관)를 만듭니다. 양쪽의 암호 · 해시 · DH 그룹 설정이 하나라도 다르면 이 단계에서 실패합니다.',
          '암호화 헤더가 붙는 만큼 패킷이 커지므로, 큰 패킷이 조각나거나 버려지지 않도록 TCP <b>MSS를 낮추는 설정</b>을 권하는 사업자가 많습니다. "작은 요청은 되는데 큰 응답만 멈춘다"면 먼저 이것을 의심하세요.',
        ] },
        { title: '설정 예시 (AWS 쪽)', code: { title: 'vpn.tf', lang: 'hcl', text: `resource "aws_customer_gateway" "ncp" {
  bgp_asn    = 65040
  ip_address = "203.0.113.40" # NCP VPN 공인 IP
  type       = "ipsec.1"
}

resource "aws_vpn_connection" "to_ncp" {
  vpn_gateway_id      = aws_vpn_gateway.main.id
  customer_gateway_id = aws_customer_gateway.ncp.id
  type                = "ipsec.1"
  static_routes_only  = false # BGP로 경로 교환
}` } },
        { title: '흔한 실수', list: [
          '한쪽 터널만 상대 장비에 설정해서, 사업자 점검 때 통신이 끊김',
          '보안 그룹에 상대 클라우드 대역을 허용하지 않아 "터널은 UP인데 통신 불가"',
          '터널당 대역폭 한도(대개 수 Gbps 이하)를 모르고 대량 복제를 실음',
        ] },
      ],
    },
    {
      key: 'BGP', kind: 'concept', title: 'BGP: "내 뒤에 이 대역이 있다"',
      body: [
        '어느 대역이 터널 건너편에 있는지는 <b>BGP</b>로 알려 줍니다. 게이트웨이마다 <b>AS 번호</b>를 갖고, 이웃끼리 "내 뒤에 10.10.0.0/16이 있다"고 서로 광고합니다. 터널 하나가 끊기면 그 터널로 받은 경로가 빠지고, 남은 터널의 경로로 자동으로 바뀝니다.',
        '출력에서 두 터널의 상태와 받은 경로 수를 봅니다. 하나가 <code>DOWN</code>이어도 다른 하나가 <code>UP</code>이고 경로를 받고 있으면 통신은 유지됩니다.',
      ],
      callout: { type: 'cloud', text: 'AWS · Azure · GCP의 VPN은 BGP를 지원합니다(GCP HA VPN은 필수). 상대가 BGP를 못 쓰면 <b>정적 경로</b>로 맺는데, 대역이 늘 때마다 양쪽을 손으로 고쳐야 합니다.' },
      hide: ['vA', 'vN', 'app', 'db'],
      tags: [
        { on: 'gwA', text: 'AS 65010', tone: 'aws' },
        { on: 'gwN', text: 'AS 65040', tone: 'ncp' },
      ],
      code: { ref: 'vgw', hl: [7, 8, 12, 13] },
      flows: [{ path: ['gwA', 'gwN'], kind: 'ctrl', n: 2 }, { path: ['gwN', 'gwA'], kind: 'ctrl', n: 2, delay: 0.5 }],
      changes: [['+', 'BGP 세션 (터널마다)'], ['~', '경로를 손 대신 광고로'], ['~', '터널 장애 시 자동 우회']],
      more: [
        { title: '동작 원리', body: [
          'BGP 이웃은 터널 안쪽의 <b>링크 로컬 주소</b>(예: 169.254.x.x)로 세션을 맺고, 주기적으로 keepalive를 주고받습니다. 정해진 시간 동안 소식이 없으면 세션을 끊고 그 이웃에게 받은 경로를 모두 지웁니다. 이것이 자동 우회의 정체예요.',
          'AS 번호는 사설 범위(16비트 기준 <code>64512–65534</code>)에서 고르되, 클라우드마다 <b>예약해 둔 번호</b>가 있으니 피하세요. 예를 들어 Azure VPN 게이트웨이는 65515를 예약해 둡니다.',
        ] },
        { title: '출력 읽기 (GCP Cloud Router)', code: { title: 'terminal', lang: 'sh', text: `$ gcloud compute routers get-status cr-shop \\
    --region asia-northeast3
result:
  bgpPeerStatus:
  - name: peer-aws-0
    ipAddress: 169.254.10.2
    peerIpAddress: 169.254.10.1
    state: Established     # 세션 정상
    status: UP
    numLearnedRoutes: 1    # 상대 대역 1개 받음
    uptime: 3 days, 2 hours` } },
        { title: '증상으로 보는 점검 순서', list: [
          '<b>터널 DOWN</b>: 공인 IP, PSK, IKE 설정 불일치. 양쪽 로그의 협상 실패 메시지를 봅니다.',
          '<b>터널 UP · BGP 없음</b>: 링크 로컬 주소나 AS 번호가 양쪽 설정과 다름',
          '<b>BGP 정상 · 경로 0개</b>: 상대가 광고할 대역을 설정하지 않았거나 필터에 걸림',
          '<b>경로 있음 · 통신 불가</b>: 라우팅 테이블 전파, 보안 그룹, 방화벽',
        ] },
      ],
    },
    {
      key: '풀 메시', kind: 'problem', title: '네 곳을 전부 직접 이으면',
      body: [
        '같은 방법으로 네 클라우드를 모두 잇습니다. n곳을 서로 직접 이으려면 연결이 <b>n(n−1)/2</b>개 필요합니다. 4곳이면 6개, 터널로는 12개입니다. 사무실을 하나 더하면 10개가 돼요.',
        '연결마다 게이트웨이 요금, 키, BGP 세션, 모니터링이 따라붙습니다. 게다가 전부 인터넷 위라서 <b>터널당 대역폭에 한도</b>가 있고 지연이 일정하지 않습니다. 대량 데이터나 DB 복제를 싣기에는 불안합니다.',
      ],
      callout: { type: 'key', text: '풀 메시는 2–3곳까지는 쓸 만합니다. 그 이상이면 연결 수가 <b>제곱으로</b> 늘어나므로 구조를 바꿀 때입니다.' },
      hide: ['gwA', 'gwN'],
      show: ['cA', 'cZ', 'cG', 'cN', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6'],
      tags: [{ at: [2.5, 2.5], text: '연결 6개 · 터널 12개', tone: 'bad', dy: -34 }],
      flows: [{ path: ['cA', 'cN'], kind: 'data', n: 2 }, { path: ['cG', 'cZ'], kind: 'data', n: 2, delay: 0.4 }],
      metrics: { path: ['VPN 풀 메시', 'warn'], links: ['6개', 'bad'] },
      changes: [['~', '연결 1개 → 6개'], ['~', '터널 12개, BGP 세션 12개'], ['-', '대역폭 · 지연이 인터넷에 좌우']],
      more: [
        { title: '숫자로 보기', rows: [
          ['2곳', '연결 1 · 터널 2', 'ok'],
          ['3곳', '연결 3 · 터널 6', 'ok'],
          ['4곳', '연결 6 · 터널 12', 'warn'],
          ['5곳', '연결 10 · 터널 20', 'bad'],
          ['8곳', '연결 28 · 터널 56', 'bad'],
        ] },
        { title: '사업자 간 VPN의 실제 모습', body: [
          '사업자마다 터널 구성이 달라 숫자는 더 늘기도 합니다. 예를 들어 GCP HA VPN과 AWS를 높은 가용성으로 이으려면 양쪽의 두 인터페이스를 엇갈려 <b>터널 4개</b>를 맺는 구성이 문서로 안내됩니다. 연결 하나가 터널 넷이면 6개 연결은 터널 24개입니다.',
        ] },
        { title: '운영 부담은 연결 수에 비례합니다', list: [
          '키 교체 · 알고리즘 변경을 연결마다 양쪽에서',
          '터널마다 상태 경보와 대시보드',
          '새 대역을 추가하면 모든 이웃의 경로 필터를 점검',
          '장애가 나면 "어느 연결의 어느 쪽" 문제인지 찾는 시간',
        ] },
      ],
    },
    {
      key: '전용선 허브', kind: 'solution', title: '한곳에 모아서 잇습니다: 허브-스포크',
      body: [
        '<b>코로케이션</b>은 여러 클라우드의 전용선 접속점이 모여 있는 사업자 중립 데이터센터입니다. 여기에 라우터를 두거나 <b>클라우드 익스체인지</b>의 가상 라우터를 빌려, 클라우드마다 전용선을 하나씩 끌어옵니다.',
        '이 라우터가 <b>허브</b>, 클라우드가 <b>스포크</b>입니다. 연결은 n개면 되고, 허브가 BGP로 받은 경로를 나머지에게 전해 줍니다. 한 클라우드 안에서 여러 VPC를 Transit Gateway 같은 허브에 붙이는 것과 같은 생각이에요.',
      ],
      callout: { type: 'warn', text: '허브가 죽으면 전부 끊깁니다. 접속점을 <b>두 곳</b>으로 나누고, 인터넷 VPN을 <b>백업 경로</b>로 남겨 두세요.' },
      show: ['hub'],
      hide: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
      focus: ['hub'],
      panel: { title: '허브를 만드는 방법', icon: 'cable', rows: [['자체 라우터', '통제 큼 · 운영 부담', 'info'], ['익스체인지', '빠른 개통 · 구독', 'ok'], ['사업자 간 직결', '두 클라우드를 바로', 'accent']] },
      flows: [{ path: ['cA', 'hub', 'cN'], kind: 'data', n: 2 }, { path: ['cG', 'hub', 'cZ'], kind: 'data', n: 2, delay: 0.5 }],
      metrics: { path: ['전용선 허브', 'ok'], links: ['4개', 'ok'], lat: ['낮고 일정', 'ok'] },
      changes: [['+', '코로케이션의 허브 라우터'], ['~', '연결 6개 → 4개'], ['~', '경로가 인터넷 → 전용선']],
      more: [
        { title: '동작 원리', body: [
          '클라우드 사업자는 주요 코로케이션 건물에 자기 장비를 두고 있습니다. 고객은 같은 건물 안에서 <b>크로스 커넥트</b>(건물 안의 물리 케이블)로 자기 라우터를 클라우드 장비에 잇고, 그 위에 VLAN과 BGP 세션을 맺습니다. 익스체인지 사업자(Equinix Fabric, Megaport 등)는 이 물리 작업을 미리 해 두고, 포털에서 가상 연결을 주문하게 해 줍니다.',
          '두 사업자를 바로 잇는 상품도 있습니다. 예를 들어 Google의 <b>Cross-Cloud Interconnect</b>는 GCP와 다른 클라우드 사이에 전용 회선을 놓아 줍니다. 쓸 수 있는 위치와 상대 사업자는 서비스마다 다르니 확인하세요.',
        ] },
        { title: '개통에 걸리는 것', list: [
          '접속 위치 선택: 양쪽 클라우드가 모두 들어와 있는 건물인가',
          '포트 · 회선 주문, 위임장(LOA) 발급, 크로스 커넥트 작업: 수 일에서 수 주',
          'BGP · VLAN 설정과 경로 필터',
          '그동안 쓸 <b>임시 VPN</b>',
        ] },
        { title: '실무 팁', body: [
          '익스체인지 허브는 "허브 라우터"가 사업자 손에 있어서 시작이 빠르지만, 그 라우터의 경로 정책과 장애 영역을 직접 보기 어렵습니다. 반대로 자체 라우터는 장비 이중화 · 펌웨어 · 온콜까지 맡아야 합니다. 팀에 네트워크 운영 인력이 없다면 익스체인지로 시작하는 편이 현실적이에요.',
        ] },
      ],
    },
    {
      key: '허브 장애', kind: 'case', title: '사례: 허브 한 곳이 멈춘 날',
      body: [
        '코로케이션 건물의 전력 작업 중 허브 라우터가 꺼졌습니다. 네 클라우드 사이의 사설 통신이 <b>한꺼번에</b> 끊겼어요. 그나마 AWS–NCP 사이에는 예전에 맺어 둔 VPN이 남아 있어 주문 · 공공 경로만 느리게 살아났습니다.',
        '원인은 <b>단일 장애점</b>이었습니다. 연결 수를 줄이려고 모든 길을 한 건물, 한 장비에 모았고, 백업 경로는 일부에만 있었습니다.',
      ],
      callout: { type: 'key', text: '해결은 <b>서로 다른 두 접속 위치</b>에 허브를 하나씩 두고, 모든 스포크에 VPN 백업을 두는 것입니다. 평소에는 BGP 우선순위로 전용선을 타게 합니다.' },
      show: ['vpnb'],
      set: { hub: { state: 'down', badge: '전원 차단', tone: 'bad' } },
      tags: [{ on: 'cG', text: '분석 경로 끊김', tone: 'bad', icon: 'unplug', pos: 'bottom' }],
      flows: [
        { path: ['cG', 'hub'], kind: 'bad', n: 2 }, { path: ['cZ', 'hub'], kind: 'bad', n: 2, delay: 0.3 },
        { path: ['cA', [3, 0.5], [4.6, 2.1], 'cN'], kind: 'data', n: 2, delay: 1.2 },
      ],
      metrics: { path: ['일부만 VPN', 'bad'], lat: ['높고 불안정', 'bad'] },
      changes: [['-', '허브 1곳 → 사설 통신 전부 중단'], ['~', 'VPN 백업이 있던 경로만 생존'], ['+', '해결: 접속 위치 2곳 + 전 구간 VPN 백업']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '클라우드 간 API · 복제 전부 타임아웃', 'bad'],
          ['원인', '허브 라우터 1대, 건물 1곳에 집중', 'warn'],
          ['원인', 'VPN 백업이 일부 구간에만 있음', 'warn'],
          ['해결', '접속 위치 2곳 · 회선 2개 · VPN 백업', 'ok'],
        ] },
        { title: '평소엔 전용선, 장애 땐 VPN', body: [
          '같은 대역이 전용선과 VPN 양쪽에서 광고되면, 라우터는 BGP 속성으로 하나를 고릅니다. 흔히 VPN 쪽 광고에 <b>AS 경로를 덧붙여</b>(AS path prepend) 길어 보이게 하거나, 받는 쪽에서 전용선 경로의 우선순위(local preference)를 높입니다. 클라우드마다 같은 대역이면 전용선을 우선하는 규칙이 이미 정해져 있기도 하니 문서를 확인하세요.',
        ] },
        { title: '훈련', body: [
          '이중화는 끊어 봐야 압니다. 점검 창에 허브 한쪽의 BGP 세션을 일부러 내리고, 트래픽이 다른 허브나 VPN으로 넘어가는 시간과 그동안의 오류율을 재세요. 넘어가지 않는 경로가 있다면 대개 <b>경로 필터나 라우팅 테이블 전파</b> 설정이 한쪽에만 되어 있는 경우입니다.',
        ] },
      ],
    },
    {
      key: '좁게 열기', kind: 'concept', title: '길을 열되, 필요한 만큼만',
      body: [
        '허브가 생기면 모든 클라우드가 모든 클라우드에 닿습니다. 하지만 공공 존의 DB가 분석 클라우드에 닿을 이유는 없어요. <b>연결은 허용이 아닙니다</b>.',
        '허브에서는 스포크마다 <b>광고할 대역과 받을 대역</b>을 필터로 정하고, 각 클라우드에서는 라우팅 테이블과 보안 그룹으로 필요한 상대 대역 · 포트만 엽니다. NCP 공공 존은 AWS의 주문 API 대역에서 오는 DB 포트만 받습니다.',
      ],
      callout: { type: 'tip', text: '허용 규칙은 "어느 클라우드 전체"가 아니라 <b>어느 서브넷의 어느 포트</b>로 적으세요. 경계가 좁을수록 사고의 반경도 좁아집니다.' },
      hide: ['vpnb'],
      set: { hub: { state: null, badge: null } },
      tags: [
        { on: 'hub', text: '경로 필터', tone: 'accent', icon: 'funnel', pos: 'right' },
        { on: 'cN', text: 'AWS 주문 API만 허용', tone: 'ncp', pos: 'bottom' },
      ],
      flows: [{ path: ['cA', 'hub', 'cN'], kind: 'req', n: 2 }, { path: ['cG', 'hub', 'cN'], kind: 'bad', n: 2, delay: 0.8 }],
      metrics: { path: ['전용선 2곳 + VPN', 'ok'], lat: ['낮고 일정', 'ok'] },
      changes: [['+', '허브의 스포크별 경로 필터'], ['~', '보안 그룹: 서브넷 · 포트 단위'], ['-', 'GCP → 공공 DB 경로']],
      more: [
        { title: '세 겹의 문', list: [
          '<b>경로 광고</b>: 허브가 GCP에 NCP 공공 대역을 아예 광고하지 않으면, GCP는 그곳으로 가는 길을 모릅니다.',
          '<b>라우팅 테이블</b>: 각 서브넷의 테이블에 필요한 상대 대역만 넣습니다.',
          '<b>방화벽</b>: 보안 그룹 · NSG · 방화벽 규칙에서 출발지 대역과 포트를 좁힙니다.',
        ] },
        { title: '설정 예시', body: ['NCP 공공 DB 쪽에서 받을 것만 적은 규칙의 모양입니다(형식은 개념 표현).'], code: { title: 'db-acg.txt', lang: 'text', text: `# 들어오는 규칙 (공공 DB)
허용  10.10.20.0/24  TCP 5432   # AWS 주문 API 서브넷
허용  10.40.1.0/24   TCP 5432   # 같은 VPC의 앱
# 그 밖의 모든 출발지는 거부 (기본)` } },
        { title: '흔한 실수', body: [
          '처음 연결할 때 "일단 되게" 하려고 상대 클라우드 /16 전체와 모든 포트를 열고, 그대로 두는 경우입니다. 몇 달 뒤 누구도 그 규칙이 왜 있는지 모릅니다. 규칙마다 <b>설명과 담당자</b>를 남기고, 분기마다 쓰이지 않는 규칙을 흐름 로그(flow log)로 찾아 지우세요.',
        ] },
      ],
    },
    {
      key: 'DNS 통합', kind: 'concept', title: '이름으로 찾기: 조건부 전달',
      body: [
        '길은 뚫렸지만 IP를 외워서 쓸 수는 없습니다. 그런데 클라우드의 <b>프라이빗 DNS 존</b>은 자기 VPC 안에서만 답합니다. AWS에서 <code>db.ncp.shop.internal</code>을 물으면 "그런 이름 없음"이 돌아옵니다.',
        '<b>조건부 전달</b>이 이것을 풉니다. AWS 쪽 리졸버에 "<code>ncp.shop.internal</code>로 끝나는 질의는 NCP의 리졸버로 보내라"는 규칙을 답니다. 질의도 사설 경로를 타고 갑니다. 이름을 <b>클라우드별 하위 도메인</b>으로 나누면 규칙이 클라우드당 한 줄로 끝나요.',
      ],
      callout: { type: 'cloud', text: 'AWS는 Route 53 Resolver 엔드포인트, Azure는 DNS Private Resolver, GCP는 Cloud DNS의 전달 영역이 이 일을 합니다.' },
      hide: ['cA', 'cZ', 'cG', 'cN', 'hub'],
      show: ['vA', 'vN', 'app', 'db', 'rA', 'rN'],
      tags: [
        { on: 'app', text: 'db.ncp.shop.internal', icon: 'search' },
        { on: 'db', text: '10.40.3.15', tone: 'ncp' },
      ],
      flows: [
        { path: ['app', 'rA', 'rN'], kind: 'ctrl', n: 1 },
        { path: ['rN', 'rA', 'app'], kind: 'res', n: 1, delay: 1.8 },
      ],
      changes: [['+', '양쪽 DNS 리졸버 엔드포인트'], ['+', '전달 규칙: *.ncp.shop.internal'], ['~', 'IP 대신 이름으로 호출']],
      more: [
        { title: '동작 원리', body: [
          '질의는 두 종류의 엔드포인트를 지납니다. AWS 쪽 <b>아웃바운드</b> 엔드포인트가 규칙에 맞는 질의를 밖으로 보내고, NCP 쪽에서 질의를 받아 줄 <b>인바운드</b> 리졸버가 사설 IP로 답합니다. 반대 방향(NCP → AWS)도 필요하면 같은 짝을 하나 더 만듭니다.',
        ] },
        { title: '설정 예시 (AWS)', code: { title: 'dns.tf', lang: 'hcl', text: `resource "aws_route53_resolver_rule" "ncp" {
  domain_name          = "ncp.shop.internal"
  rule_type            = "FORWARD"
  resolver_endpoint_id = aws_route53_resolver_endpoint.o.id
  target_ip { ip = "10.40.0.53" } # NCP 쪽 리졸버
}

resource "aws_route53_resolver_rule_association" "a" {
  resolver_rule_id = aws_route53_resolver_rule.ncp.id
  vpc_id           = aws_vpc.main.id
}` } },
        { title: '흔한 실수', list: [
          '규칙만 만들고 VPC에 <b>연결(association)</b>하지 않음',
          '리졸버 엔드포인트의 보안 그룹이 상대 대역의 <b>53번 UDP · TCP</b>를 막음',
          'GCP 전달 영역의 질의는 Google의 특정 대역(<code>35.199.192.0/19</code>)에서 나가므로, 상대 쪽에 이 대역으로 돌아올 경로와 허용 규칙이 필요',
          '같은 이름을 양쪽에 다 만들어 어느 쪽 답이 맞는지 헷갈리게 함',
        ] },
      ],
    },
    {
      key: 'GSLB', kind: 'concept', title: '바깥 사용자는 어느 클라우드로 보낼까',
      body: [
        '지금까지는 클라우드 <b>사이</b>의 길이었습니다. 바깥 사용자는 어떨까요? 로드 밸런서는 한 클라우드 안에서만 나눠 줍니다. 클라우드 사이에서 고르는 것은 <b>GSLB</b>(글로벌 서버 로드 밸런싱)의 일입니다.',
        'GSLB는 DNS입니다. 각 클라우드의 입구를 <b>헬스 체크</b>하다가, 질의가 오면 건강한 쪽의 IP를 답합니다. 가중치·지연·지역 기준도 쓸 수 있어요. 다만 전환은 <b>TTL만큼</b> 늦고, 오래된 답을 쥐고 있는 클라이언트도 있습니다.',
      ],
      callout: { type: 'cloud', text: 'Route 53, Azure Traffic Manager, Cloud DNS 라우팅 정책, NCP Global Traffic Manager가 여기에 해당합니다. GSLB는 <b>지키려는 장애 범위 밖</b>에 두어야 합니다.' },
      hide: ['vA', 'vN', 'app', 'db', 'rA', 'rN'],
      show: ['users', 'gslb', 'cA', 'cZ'],
      set: { cA: { sub: '주 서비스', state: 'hot', badge: '헬스 체크 실패', tone: 'bad' }, cZ: { sub: 'DR 대기' } },
      tags: [{ on: 'gslb', text: 'TTL 60초', icon: 'clock' }],
      flows: [
        { path: ['gslb', 'cA'], kind: 'bad' }, { path: ['gslb', 'cZ'], kind: 'ctrl', delay: 0.3 },
        { path: ['users', 'gslb'], kind: 'ctrl', delay: 1.2 }, { path: ['users', 'cZ'], kind: 'req', n: 3, delay: 2.2 },
      ],
      metrics: { path: ['DNS로 전환', 'ok'] },
      more: [
        { title: '라우팅 방식', rows: [
          ['장애 조치(failover)', '주가 죽으면 보조로', 'ok'],
          ['가중치(weighted)', '90 : 10처럼 나눔 · 점진 이전', 'info'],
          ['지연(latency)', '사용자에게 가까운 곳', 'accent'],
          ['지역(geo)', '나라 · 대륙별로 고정', 'warn'],
        ] },
        { title: '설정 예시 (Route 53 장애 조치)', code: { title: 'gslb.tf', lang: 'hcl', text: `resource "aws_route53_record" "primary" {
  zone_id         = var.zone_id
  name            = "shop.example"
  type            = "A"
  ttl             = 60
  records         = ["198.51.100.10"] # AWS 입구
  set_identifier  = "aws"
  health_check_id = aws_route53_health_check.aws.id
  failover_routing_policy { type = "PRIMARY" }
}
# SECONDARY 레코드는 Azure 입구 IP로 하나 더` } },
        { title: '알아 둘 한계', list: [
          'TTL을 짧게 해도 일부 리졸버 · 앱은 답을 더 오래 캐시합니다. 전환은 "몇 분에 걸쳐" 일어난다고 보세요.',
          '헬스 체크는 입구만 봅니다. 입구가 200을 내도 DB가 죽어 있으면 소용이 없으니 <b>의미 있는 상태 페이지</b>를 검사 대상으로 삼습니다.',
          'GSLB가 주 클라우드 안에만 있으면 그 클라우드 장애 때 함께 멈출 수 있습니다. DNS 위임을 여러 사업자에 나누기도 합니다.',
        ] },
      ],
    },
    {
      key: '지연·전송비', kind: 'concept', title: '경계를 넘을 때마다 붙는 것',
      body: [
        '주문 API가 요청 하나를 처리하며 NCP DB를 20번 부른다고 해 봅시다. 같은 VPC 안이면 1ms 안쪽이던 왕복이, 클라우드를 넘으면 경로에 따라 <b>수 ms에서 수십 ms</b>가 됩니다. 20번이면 응답 시간 전체가 눈에 띄게 늘어요.',
        '돈도 붙습니다. 경계를 넘는 바이트는 <b>보내는 쪽에서 egress로 과금</b>되고, 응답이 크면 상대 쪽도 과금됩니다. 자주 대화하는 서비스는 같은 클라우드에 두고, 경계는 <b>호출이 드문 곳</b>에 긋습니다.',
      ],
      callout: { type: 'tip', text: '경계를 꼭 넘어야 한다면 호출을 묶고(배치), 결과를 캐시하고, 비동기 메시지로 바꾸는 방법을 먼저 검토하세요.' },
      hide: ['users', 'gslb', 'cA', 'cZ'],
      show: ['vA', 'vN', 'app', 'db', 'gwA', 'gwN'],
      set: { cA: { sub: '10.10.0.0/16', state: null, badge: null }, cZ: { sub: '10.20.0.0/16' } },
      tags: [
        { on: 'app', text: '요청당 DB 호출 20번', tone: 'warn', icon: 'repeat' },
        { on: 'gwN', text: '왕복마다 +지연', tone: 'bad', icon: 'timer' },
      ],
      flows: [{ path: ['app', 'gwA', 'gwN', 'db'], kind: 'req', n: 6, gap: 0.25 }, { path: ['db', 'gwN', 'gwA', 'app'], kind: 'res', n: 6, gap: 0.25, delay: 1.5 }],
      metrics: { lat: ['호출 수 × 왕복', 'warn'] },
      more: [
        { title: '감 잡기: 대략의 왕복 시간', body: ['경로와 사업자에 따라 다르니 직접 재는 것이 정답이고, 아래는 크기의 차이를 느끼기 위한 대략의 범위입니다.'], rows: [
          ['같은 AZ', '1ms 안쪽', 'ok'],
          ['같은 도시의 다른 클라우드', '수 ms', 'info'],
          ['서울 ↔ 도쿄', '수십 ms', 'warn'],
          ['서울 ↔ 미국 서부', '100ms 이상', 'bad'],
        ] },
        { title: '직접 재 보기', code: { title: 'terminal', lang: 'sh', text: `$ curl -s -o /dev/null -w \\
  'connect=%{time_connect} total=%{time_total}\\n' \\
  http://db-api.ncp.shop.internal/health
connect=0.004 total=0.011

$ mtr -rwc 20 10.40.3.15   # 홉별 지연 · 손실` } },
        { title: '설계로 줄이는 법', list: [
          '<b>함께 두기</b>: 서로 자주 부르는 서비스와 그 DB는 같은 클라우드 · 리전에',
          '<b>묶기</b>: N번의 작은 호출을 한 번의 묶음 호출로',
          '<b>캐시</b>: 자주 읽고 드물게 바뀌는 값은 호출하는 쪽에',
          '<b>비동기</b>: 즉시 답이 필요 없으면 큐로 넘기고 응답은 먼저',
        ] },
      ],
    },
    {
      key: 'VPN·전용선', kind: 'compare', title: 'VPN과 전용선, 네 클라우드의 이름',
      body: [
        '<b>인터넷 VPN</b>은 암호화가 기본이고 하루면 맺지만, 대역폭과 지연이 인터넷에 달려 있습니다. <b>전용선</b>은 지연이 일정하고 대역폭이 크지만, 개통에 몇 주가 걸리고 월 고정비가 있으며 <b>기본으로는 암호화되지 않습니다</b>. 필요하면 MACsec이나 IPsec을 그 위에 얹습니다.',
        '어느 길이든 나가는 데이터에는 요금이 붙습니다. 전용선 쪽 GB당 단가가 대개 더 낮아서 트래픽이 크면 고정비를 메꿉니다.',
      ],
      callout: { type: 'key', text: '작게 시작할 때는 VPN, 트래픽이 크거나 지연이 중요해지면 전용선. 그리고 전용선을 쓰더라도 <b>VPN은 백업으로</b> 남깁니다.' },
      hide: ['vA', 'vN', 'app', 'db', 'gwA', 'gwN'],
      show: ['cA', 'cZ', 'cG', 'cN', 'hub'],
      panel: { title: 'VPN · 전용선', icon: 'cable', rows: [['AWS', 'Site-to-Site VPN · Direct Connect', 'aws'], ['Azure', 'VPN Gateway · ExpressRoute', 'azure'], ['GCP', 'HA VPN · Cloud Interconnect', 'gcp'], ['NCP', 'IPsec VPN · Cloud Connect', 'ncp']] },
      flows: [{ path: ['cA', 'hub', 'cG'], kind: 'data', n: 4, gap: 0.3 }],
      metrics: { lat: ['낮고 일정', 'ok'] },
      more: [
        { title: '경로별 성격', rows: [
          ['인터넷 VPN', '암호화 기본 · 지연 변동 · 즉시 개통', 'info'],
          ['전용선', '지연 일정 · 암호화 별도 · 수 주', 'warn'],
          ['익스체인지 허브', '여러 클라우드를 한곳에서', 'ok'],
          ['어느 쪽이든', '나가는 데이터는 과금', 'bad'],
        ] },
        { title: '전용선 위의 암호화', body: [
          '전용선은 인터넷을 지나지 않을 뿐, 회선 자체가 내용을 숨겨 주지는 않습니다. 사업자들은 일부 고속 전용 포트에 <b>MACsec</b>(링크 구간 암호화)을 제공하고, 그 밖에는 전용선 위에 IPsec VPN을 다시 얹는 구성을 안내합니다. 공공 · 금융 데이터라면 애플리케이션의 <b>TLS</b>는 경로와 상관없이 유지하세요.',
        ] },
        { title: '고르는 기준', list: [
          '월 전송량이 크다: 전용선의 낮은 GB당 단가가 고정비를 넘어서는 지점을 계산',
          'DB 복제처럼 지연 변동에 민감하다: 전용선',
          '연결할 곳이 2–3곳이고 트래픽이 작다: VPN',
          '개통까지 기다릴 수 없다: VPN으로 시작하고 전용선은 병행 주문',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 주소 → 경로 → 이름 → 입구',
      body: [
        '순서가 곧 설계입니다. <b>겹치지 않는 IP 계획</b>을 먼저 세우고, VPN과 BGP로 시작해 규모가 커지면 <b>이중화한 전용선 허브</b>로 모으되 길은 필요한 만큼만 엽니다. 그 위에 <b>조건부 전달</b>로 이름을 통합하고, 바깥 입구에는 <b>GSLB</b>를 둡니다.',
        '이제 네 클라우드는 하나의 사설망처럼 통합니다. 다음 레슨에서는 이 망 위에 클라우드마다 Kubernetes 클러스터를 올리고, 넷을 한 묶음처럼 배포하는 방법을 봅니다.',
      ],
      focus: ['hub'],
      flows: [{ path: ['cA', 'hub', 'cN'], kind: 'req', n: 2 }, { path: ['cN', 'hub', 'cA'], kind: 'res', n: 2, delay: 1.6 }],
    },
  ],
  quiz: [
    {
      q: '새 클라우드에 첫 VPC를 만들려는데 콘솔이 10.0.0.0/16을 제안합니다. 회사는 이미 다른 클라우드 두 곳을 쓰고 있습니다. 가장 좋은 행동은?',
      options: [
        '기본값이니 그대로 만든다. 충돌하면 나중에 NAT로 해결한다',
        '회사의 주소 계획표에서 아직 안 쓴 대역을 배정받아 그 값으로 만든다',
        '충돌을 피하려고 공인 IP 대역을 VPC 대역으로 쓴다',
        '최대한 작은 /28로 만들어 충돌 확률을 줄인다',
      ],
      answer: 1, step: 3,
      why: 'VPC 대역은 만든 뒤 사실상 바꿀 수 없고, 겹치면 사설로 이을 수 없습니다. NAT 우회는 가능하지만 운영이 매우 어렵습니다. 공인 대역을 사설로 쓰면 그 대역의 실제 인터넷 주소에 닿지 못하고, /28은 금방 모자랍니다.',
    },
    {
      q: 'VPN을 맺은 뒤 AWS의 앱이 NCP의 10.0.3.15로 보낸 패킷이 터널로 가지 않습니다. 양쪽 VPC는 모두 10.0.0.0/16입니다. VPN 쪽 경로를 더 구체적으로 추가하면 해결될까?',
      options: [
        '그렇다. 더 구체적인 경로가 항상 이긴다',
        '아니다. VPC의 local 경로는 지우거나 덮을 수 없어 내 VPC 대역 안의 주소는 밖으로 나가지 않는다',
        '그렇다. BGP를 켜면 자동으로 해결된다',
        '아니다. VPN은 원래 사설 IP를 지원하지 않는다',
      ],
      answer: 1, step: 2,
      why: '대역이 겹치면 목적지가 내 VPC 안의 주소로 해석되고, 그 local 경로는 바꿀 수 없습니다. 근본 해결은 한쪽을 겹치지 않는 대역으로 다시 만드는 것입니다. BGP는 경로를 광고할 뿐 겹침을 풀지 못합니다.',
    },
    {
      q: 'AWS 콘솔에서 VPN 연결의 두 터널 중 하나가 DOWN, 하나가 UP이고 UP 쪽의 받은 경로 수가 1입니다. 지금 상태에 대한 올바른 판단은?',
      options: [
        '통신이 완전히 끊겼으니 즉시 장애를 선언한다',
        '통신은 남은 터널로 유지되고 있으니, 이중화가 깨진 상태로 보고 DOWN 터널의 원인을 찾는다',
        'UP 터널을 일부러 내려 두 터널 상태를 맞춘다',
        '받은 경로 수가 1이면 BGP가 고장 난 것이다',
      ],
      answer: 1, step: 5,
      why: 'BGP는 끊긴 터널의 경로를 빼고 남은 터널로 보냅니다. 서비스는 돌지만 다음 장애에는 대비가 없으므로 원인을 찾아야 합니다. 상대가 대역 하나를 광고한다면 받은 경로 1개는 정상입니다.',
    },
    {
      q: '터널은 UP이고 BGP 세션도 Established인데 받은 경로가 0개입니다. 먼저 확인할 곳은?',
      options: [
        '상대 쪽이 광고할 대역을 설정했는지, 경로 필터에 걸리지 않았는지',
        '사전 공유 키(PSK)',
        '양쪽 게이트웨이의 공인 IP',
        'DNS 전달 규칙',
      ],
      answer: 0, step: 5,
      why: 'PSK와 공인 IP가 틀리면 터널부터 맺어지지 않습니다. 세션은 정상인데 경로가 없다면 광고 설정이나 필터 문제입니다. DNS는 경로가 생긴 다음의 이야기입니다.',
    },
    {
      q: '클라우드 4곳과 사무실 1곳을 전부 서로 직접 VPN으로 이으려 합니다. 가장 큰 문제는?',
      options: [
        'VPN은 암호화되지 않아서 위험하다',
        'BGP는 두 곳 사이에서만 쓸 수 있다',
        '사무실은 클라우드와 VPN을 맺을 수 없다',
        '연결이 10개로 늘고, 연결마다 터널·키·BGP·모니터링을 관리해야 한다',
      ],
      answer: 3, step: 6,
      why: '풀 메시의 연결 수는 n(n−1)/2라서 5곳이면 10개입니다. 이 규모에서는 허브-스포크가 낫습니다. IPsec VPN은 암호화가 기본이고, BGP는 여러 이웃과 동시에 맺을 수 있습니다.',
    },
    {
      q: '전용선 허브를 한 코로케이션 건물에 두었더니, 그 건물의 정전으로 클라우드 간 통신이 전부 멈췄습니다. 재발을 막는 설계는?',
      options: [
        '허브 라우터를 더 비싼 모델로 바꾼다',
        '전용선을 없애고 모든 연결을 풀 메시 VPN으로 되돌린다',
        '서로 다른 접속 위치 두 곳에 허브를 두고, 모든 스포크에 VPN 백업을 두며 평소엔 BGP 우선순위로 전용선을 탄다',
        '정전이 드무니 그대로 둔다',
      ],
      answer: 2, step: 8,
      why: '문제는 장비 성능이 아니라 단일 장애점입니다. 위치를 나누고 백업 경로를 모든 구간에 두어야 합니다. 풀 메시로 돌아가면 연결 수와 대역폭 문제가 다시 생깁니다.',
    },
    {
      q: '허브로 네 클라우드를 이은 뒤, GCP의 분석 VM에서 NCP 공공 DB 포트로 접속이 됩니다. 요구상 이 경로는 필요 없습니다. 가장 알맞은 조치는?',
      options: [
        '허브의 경로 필터와 NCP 쪽 방화벽에서 필요한 출발지 서브넷 · 포트만 허용하고 GCP 경로는 막는다',
        'DB 비밀번호를 길게 바꾼다',
        '허브를 없앤다',
        '분석팀에 접속하지 말라고 공지한다',
      ],
      answer: 0, step: 9,
      why: '연결은 허용이 아닙니다. 경로 광고, 라우팅 테이블, 방화벽 세 겹에서 필요한 것만 열어야 합니다. 비밀번호나 공지는 사람에게 기대는 방법이고, 허브를 없애면 필요한 경로까지 잃습니다.',
    },
    {
      q: 'AWS의 앱이 NCP의 DB에 IP로는 접속되는데 db.ncp.shop.internal이라는 이름으로는 실패합니다. 가장 가능성 높은 원인은?',
      options: [
        'VPN 터널이 끊어졌다',
        '보안 그룹이 DB 포트를 막고 있다',
        'DB의 디스크가 가득 찼다',
        'AWS 쪽 리졸버에 ncp.shop.internal을 NCP로 넘기는 조건부 전달 규칙이 없거나 VPC에 연결되지 않았다',
      ],
      answer: 3, step: 10,
      why: 'IP로 접속된다는 것은 경로와 방화벽이 정상이라는 뜻입니다. 남는 것은 이름 풀이입니다. 프라이빗 DNS 존은 자기 VPC 안에서만 답하므로, 다른 클라우드의 이름은 전달 규칙이 있고 그 규칙이 VPC에 연결되어 있어야 풀립니다.',
    },
    {
      q: 'GSLB의 장애 조치 레코드를 설정했는데, 주 클라우드 장애 때 일부 사용자는 30분 넘게 계속 실패했습니다. 가장 먼저 의심할 것은?',
      options: [
        '보조 클라우드의 CPU 크기',
        '레코드의 TTL이 길거나, 클라이언트 · 리졸버가 예전 답을 오래 캐시함',
        'BGP AS 번호',
        'IPsec 암호 알고리즘',
      ],
      answer: 1, step: 11,
      why: 'GSLB는 DNS라서 전환이 TTL과 캐시만큼 늦습니다. 전환용 레코드는 TTL을 짧게 두고, 그래도 일부 클라이언트는 늦게 넘어온다고 계획합니다. BGP와 IPsec은 클라우드 사이의 사설 경로 이야기입니다.',
    },
    {
      q: '주문 API를 AWS에 두고 그 DB만 다른 클라우드로 옮겼더니 응답 시간이 크게 늘었습니다. 요청당 DB 호출이 20번입니다. 가장 효과적인 첫 조치는?',
      options: [
        'VPN 터널을 하나 더 맺는다',
        'DB 서버의 사양을 높인다',
        '앱과 DB를 같은 클라우드에 두거나, 호출을 묶고 캐시해서 경계를 넘는 왕복 수를 줄인다',
        'GSLB의 TTL을 줄인다',
      ],
      answer: 2, step: 12,
      why: '늘어난 시간은 DB 처리가 아니라 호출 수 × 클라우드 간 왕복입니다. 터널을 늘려도 왕복 지연은 그대로이고, GSLB는 바깥 사용자의 입구만 다룹니다.',
    },
    {
      q: '인터넷 VPN을 전용선으로 바꾸면서 "사설 회선이니 암호화는 이제 필요 없다"는 의견이 나왔습니다. 올바른 판단은?',
      options: [
        '맞다. 전용선은 물리적으로 분리되어 있어 암호화가 필요 없다',
        '전용선에서는 암호화 프로토콜이 동작하지 않는다',
        '전용선은 항상 VPN보다 느리므로 바꾸지 않는 것이 낫다',
        '전용선은 기본으로 암호화되지 않으므로, 규정이나 민감도에 따라 MACsec · IPsec · TLS를 유지한다',
      ],
      answer: 3, step: 13,
      why: '전용선은 인터넷을 지나지 않을 뿐, 회선 자체가 암호화를 해 주지는 않습니다. 공공·금융 데이터라면 구간 암호화나 애플리케이션 수준의 TLS를 그대로 유지해야 합니다. 전용선의 지연은 대개 더 낮고 일정합니다.',
    },
    {
      q: '두 클라우드를 이어야 하는데 전용선 개통까지 6주가 걸립니다. 서비스 출시는 2주 뒤입니다. 가장 현실적인 계획은?',
      options: [
        '출시를 6주 미룬다',
        'IPsec VPN으로 먼저 잇고 전용선은 병행 주문하며, 개통 후에는 VPN을 백업으로 남긴다',
        '전용선이 올 때까지 DB에 공인 IP를 붙여 인터넷으로 잇는다',
        '두 클라우드 사이 통신을 포기한다',
      ],
      answer: 1, step: 13,
      why: 'VPN은 하루면 맺을 수 있어 개통 공백을 메우기에 알맞고, 전용선이 온 뒤에는 그대로 백업 경로가 됩니다. DB를 인터넷에 내놓는 것은 이 레슨이 처음 피하려 한 상황입니다.',
    },
  ],
};
