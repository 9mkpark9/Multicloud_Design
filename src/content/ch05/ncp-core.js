export default {
  id: 'ncp-core',
  learn: [
    '국내 KR 리전과 두 존(KR-1 · KR-2)',
    '민간 · 공공기관용 · 금융: 따로 운영되는 클라우드',
    'VPC · 서브넷(Public/Private) · ACG, 그리고 Classic 함정',
    '핵심 서비스의 자리와 Sub Account',
    'ncloud CLI · API 인증키 · Terraform 프로바이더',
  ],
  legend: [['req', '요청'], ['ctrl', 'API 호출 · 권한'], ['res', '응답'], ['bad', '실패 · 차단']],
  metrics: [
    { id: 'site', label: '사이트', icon: 'building' },
    { id: 'zone', label: '존', icon: 'pin' },
    { id: 'plat', label: '플랫폼', icon: 'layers' },
    { id: 'key', label: 'API 인증키', icon: 'key' },
  ],
  codes: {
    cli: {
      title: '터미널', lang: 'sh',
      text: `$ ncloud configure
# Access Key · Secret Key · API URL 입력

$ ncloud vserver getRegionList
$ ncloud vserver getZoneList --regionCode KR
$ ncloud vserver getServerInstanceList \\
    --regionCode KR
$ ncloud vpc getSubnetList --regionCode KR

# Object Storage는 S3 호환: aws CLI로
$ aws s3 ls --endpoint-url \\
    https://kr.object.ncloudstorage.com`,
    },
    tf: {
      title: 'main.tf', lang: 'hcl',
      text: `terraform {
  required_providers {
    ncloud = {
      source = "NaverCloudPlatform/ncloud"
    }
  }
}

# 키는 환경 변수로:
# NCLOUD_ACCESS_KEY, NCLOUD_SECRET_KEY
provider "ncloud" {
  region      = "KR"
  site        = "public"  # gov · fin
  support_vpc = true
}

resource "ncloud_vpc" "shop" {
  name            = "shop-vpc"
  ipv4_cidr_block = "10.0.0.0/16"
}`,
    },
  },
  scene: {
    zones: {
      kr: { at: [2.8, -2.6], size: [6.4, 3.9], label: 'KR 리전', color: 'ncp' },
      kr1: { at: [3.1, -2.3], size: [2.8, 2.9], label: 'KR-1', color: 'teal' },
      kr2: { at: [6.1, -2.3], size: [2.8, 2.9], label: 'KR-2', color: 'teal' },
      vpc: { at: [2.4, -2.4], size: [6.4, 3.7], label: 'VPC shop-vpc', color: 'purple' },
      sn_pub: { at: [2.7, -2.1], size: [2.8, 2.8], label: 'Public (KR-1)', color: 'green' },
      sn_priv: { at: [5.7, -2.1], size: [2.8, 2.8], label: 'Private (KR-1)', color: 'blue' },
    },
    nodes: {
      // 문제 · 리전
      gov: { kind: 'users', at: [0, 2.6], label: '공공기관 고객' },
      rfp: { kind: 'tile', at: [2.8, 0.2], label: '제안요청서', icon: 'clipboard-list', color: 'sand' },
      srv1: { at: [4.5, -0.9], label: 'Server', sub: '주문 API', icon: 'server', color: 'ncp' },
      srv2: { at: [7.5, -0.9], label: 'Server', sub: '주문 API', icon: 'server', color: 'ncp' },
      // 사이트
      s_pub: { at: [2.6, 1.4], label: '민간', sub: '일반 기업', icon: 'store', color: 'ncp' },
      s_gov: { at: [4.6, -0.6], label: '공공기관용', sub: '별도 사이트', icon: 'building', color: 'navy' },
      s_fin: { at: [6.6, -2.6], label: '금융', sub: '별도 사이트', icon: 'bank', color: 'yellow' },
      // VPC
      user: { kind: 'client', at: [0.2, 3.2], label: '사용자' },
      web: { at: [4.1, -0.7], label: '웹 서버', sub: '공인 IP', icon: 'server', color: 'ncp' },
      db: { kind: 'cyl', at: [7.1, -0.7], label: 'DB 서버', icon: 'database', color: 'purple' },
      // 서비스 지도
      n_srv: { at: [0, 0], label: 'Server', sub: '가상 서버', icon: 'server', color: 'ncp' },
      n_lb: { at: [0, -2.6], label: 'Load\nBalancer', sub: 'ALB · NLB', icon: 'split', color: 'ncp' },
      n_nks: { at: [0, -5.2], label: 'NKS', sub: '쿠버네티스', icon: 'helm', color: 'ncp' },
      n_fn: { at: [0, -7.8], label: 'Cloud\nFunctions', sub: '서버리스 함수', icon: 'zap', color: 'ncp' },
      n_obj: { at: [2.6, 0], label: 'Object\nStorage', sub: 'S3 호환', icon: 'archive', color: 'green' },
      n_db: { at: [2.6, -2.6], label: 'Cloud DB', sub: 'MySQL 등', icon: 'database', color: 'purple' },
      n_cr: { at: [2.6, -5.2], label: 'Container\nRegistry', sub: '이미지 저장', icon: 'package', color: 'teal' },
      n_ci: { at: [2.6, -7.8], label: 'Cloud\nInsight', sub: '지표 · 알람', icon: 'activity', color: 'yellow' },
      // Sub Account
      dev: { kind: 'client', at: [0, 2.6], label: '개발자 (서브 계정)' },
      sa: { at: [2.6, 0.4], label: 'Sub Account', sub: '정책 확인', icon: 'user-cog', color: 'ncp' },
      res: { at: [5.0, -1.6], label: 'Server · NKS', sub: '허용된 것만', icon: 'server', color: 'ncp' },
      main: { at: [3.0, 3.4], label: '메인 계정', sub: '모든 권한', icon: 'key', color: 'red' },
      // Classic 함정
      classic: { at: [5.0, -1.6], label: 'Server', sub: 'Classic', icon: 'server', color: 'gray' },
      vsrv: { at: [5.6, 1.4], label: 'Server', sub: 'VPC', icon: 'server', color: 'ncp' },
      // CLI · Terraform
      term: { kind: 'client', at: [0, 2.6], label: '터미널 (ncloud)' },
      api: { at: [2.6, 0.4], label: 'NCP API', sub: '서명 확인', icon: 'plug', color: 'ncp' },
      tf: { kind: 'tile', at: [0, 2.6], label: 'main.tf', icon: 'file-code', color: 'olive' },
      nvpc: { at: [5.0, -1.6], label: 'VPC', sub: 'shop-vpc', icon: 'network', color: 'purple' },
    },
    edges: {
      e_g1: { from: 'gov', to: 'srv1' },
      e_g2: { from: 'gov', to: 'srv2' },
      e_grfp: { from: 'gov', to: 'rfp', style: 'dashed' },
      e_uw: { from: 'user', to: 'web' },
      e_wd: { from: 'web', to: 'db', label: 'ACG: 3306' },
      e_ds: { from: 'dev', to: 'sa' },
      e_sr: { from: 'sa', to: 'res' },
      e_ms: { from: 'main', to: 'sa', style: 'dashed', label: '생성 · 정책' },
      e_dc: { from: 'dev', to: 'classic', tone: 'bad', style: 'dashed' },
      e_dv: { from: 'dev', to: 'vsrv', tone: 'ok' },
      e_ta: { from: 'term', to: 'api' },
      e_fa: { from: 'tf', to: 'api' },
      e_av: { from: 'api', to: 'nvpc' },
    },
  },
  steps: [
    {
      key: '공공 고객', kind: 'problem', title: '공공기관 고객의 첫 질문',
      body: [
        'shop.example이 공공기관에 납품을 시작합니다. 제안요청서의 첫 조건은 이렇습니다. 데이터는 <b>국내</b>에 둘 것, 그리고 공공기관이 쓸 수 있도록 <b>보안 인증</b>을 받은 클라우드일 것.',
        '국내 공공 시장에서는 클라우드 보안 인증(<b>CSAP</b>) 같은 조건이 자주 붙고, 금융권에도 별도의 규정이 있습니다. 이런 요구에 맞춰 일찍부터 준비해 온 국내 사업자가 <b>네이버 클라우드 플랫폼(NCP)</b>입니다.',
      ],
      callout: { type: 'key', text: 'NCP를 고르는 이유는 대개 기능보다 <b>위치와 규제</b>입니다. 그래서 멀티클라우드에서 "국내 규제 데이터 담당"으로 자주 등장합니다.' },
      show: ['gov', 'rfp'],
      tags: [{ on: 'rfp', text: '데이터는 국내에', icon: 'pin', pos: 'right' }, { on: 'rfp', text: '보안 인증 클라우드', icon: 'shield-check', pos: 'top' }],
      flows: [{ path: ['gov', 'rfp'], kind: 'req', n: 2 }],
      metrics: { site: '미정', zone: '—', plat: '—', key: '—' },
    },
    {
      key: '리전 · 존', kind: 'concept', title: 'KR 리전과 두 개의 존',
      body: [
        'NCP의 국내 리전 코드는 <code>KR</code>이고, 그 안에 물리적으로 떨어진 <b>존</b> <code>KR-1</code>과 <code>KR-2</code>가 있습니다. AWS의 AZ와 같은 자리예요. 미국·싱가포르·일본·독일 등 해외 리전도 있지만 쓸 수 있는 서비스는 리전마다 다릅니다.',
        '고가용성의 기본은 같습니다. 서버를 두 존에 나눠 두고 로드 밸런서로 묶으면, 존 하나가 멈춰도 서비스가 이어집니다.',
      ],
      callout: { type: 'cloud', text: '같은 서울이라도 이름 짓는 방식이 다릅니다. AWS <code>ap-northeast-2a</code>, GCP <code>asia-northeast3-a</code>, NCP <code>KR-1</code>.' },
      hide: ['rfp'],
      show: ['kr', 'kr1', 'kr2', 'srv1', 'srv2'],
      tags: [{ on: 'srv2', text: '존이 달라 함께 안 멈춤', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['gov', 'srv1'], kind: 'req', n: 2 }, { path: ['gov', 'srv2'], kind: 'req', n: 2, delay: 0.4 }],
      metrics: { zone: ['KR-1 + KR-2', 'ok'] },
    },
    {
      key: '공공 · 금융', kind: 'concept', title: '민간 · 공공 · 금융은 따로 운영됩니다',
      body: [
        'NCP는 일반 기업용 <b>민간</b> 클라우드와 별도로, <b>공공기관용</b>과 <b>금융</b> 클라우드를 분리된 환경으로 운영합니다. 각각 웹사이트·콘솔·계약이 따로이고, 해당 분야의 인증과 규정에 맞춰 관리됩니다.',
        '서비스 이름은 대부분 같지만, 제공되는 서비스와 출시 시점은 환경마다 다를 수 있습니다. 설계 전에 우리 고객이 어느 쪽인지, 그 환경에 필요한 서비스가 있는지부터 확인하세요.',
      ],
      callout: { type: 'warn', text: '민간에서 만든 계정과 리소스가 공공·금융 환경으로 그대로 옮겨지지는 않습니다. 도구 설정에서도 어느 환경인지 지정합니다(Terraform의 <code>site</code>).' },
      hide: ['gov', 'kr', 'kr1', 'kr2', 'srv1', 'srv2'],
      show: ['s_pub', 's_gov', 's_fin'],
      focus: ['s_gov'],
      tags: [{ on: 's_gov', text: '공공 인증 대응', tone: 'ok', icon: 'shield-check', pos: 'top' }, { on: 's_fin', text: '금융 규정 대응', icon: 'bank', pos: 'top' }],
      metrics: { site: ['공공기관용', 'ok'] },
      changes: [['+', '고객에 맞는 환경 선택'], ['~', '환경마다 콘솔 · 계약이 따로']],
    },
    {
      key: 'VPC · ACG', kind: 'concept', title: 'VPC와 서브넷, 그리고 ACG',
      body: [
        'NCP의 <b>VPC</b>는 리전 범위이고, <b>서브넷</b>은 존 하나에 속합니다. 서브넷을 만들 때 <b>Public</b>인지 <b>Private</b>인지 고르는 것이 특징이에요. 공인 IP를 붙일 서버는 Public 서브넷에, DB는 Private 서브넷에 둡니다.',
        '서버(의 네트워크 인터페이스)에는 <b>ACG</b>가 붙습니다. 허용 규칙만 쓰는 stateful 방화벽으로 AWS의 보안 그룹과 같은 자리이고, 서브넷에는 NACL을 겹으로 둘 수 있습니다.',
      ],
      callout: { type: 'tip', text: 'Private 서브넷의 서버가 패키지를 받으려면 NAT Gateway를 거쳐 나갑니다. 구조는 AWS에서 배운 것과 거의 같습니다.' },
      hide: ['s_pub', 's_gov', 's_fin'],
      show: ['vpc', 'sn_pub', 'sn_priv', 'user', 'web', 'db'],
      tags: [{ on: 'web', text: 'ACG: 443만', icon: 'shield', pos: 'top' }, { on: 'db', text: '공인 IP 없음', tone: 'ok', icon: 'lock', pos: 'right' }],
      flows: [{ path: ['user', 'web', 'db'], kind: 'req', n: 2 }, { path: ['db', 'web', 'user'], kind: 'res', n: 2, delay: 1.8 }],
      metrics: { plat: ['VPC', 'ok'] },
    },
    {
      key: '서비스 지도', kind: 'concept', title: '핵심 서비스 여덟 개의 자리',
      body: [
        '가상 서버는 <b>Server</b>, 앞단은 <b>Load Balancer</b>(ALB · NLB), 쿠버네티스는 <b>NKS</b>(Ncloud Kubernetes Service), 함수는 <b>Cloud Functions</b>입니다. 데이터는 <b>Object Storage</b>와 엔진별 <b>Cloud DB</b>(for MySQL · PostgreSQL 등)가 맡아요.',
        '이미지는 <b>Container Registry</b>, 지표와 알람은 <b>Cloud Insight</b>가 받습니다. AWS 지도와 거의 한 칸씩 맞지만, 메시지 큐처럼 딱 맞는 대응이 없는 칸도 있습니다.',
      ],
      callout: { type: 'tip', text: 'Object Storage는 <b>S3 호환 API</b>를 제공합니다. S3용 CLI와 SDK를 엔드포인트만 바꿔 쓸 수 있어, 옮길 때 가장 부담이 적은 서비스입니다.' },
      hide: ['vpc', 'sn_pub', 'sn_priv', 'user', 'web', 'db'],
      show: ['n_srv', 'n_lb', 'n_nks', 'n_fn', 'n_obj', 'n_db', 'n_cr', 'n_ci'],
      tags: [{ on: 'n_obj', text: 'S3 호환', tone: 'ok', pos: 'right' }],
    },
    {
      key: 'Sub Account', kind: 'concept', title: 'Sub Account: NCP의 IAM',
      body: [
        '가입한 계정은 <b>메인 계정</b>으로, AWS의 루트처럼 모든 권한을 가집니다. 팀원은 <b>Sub Account</b>에서 <b>서브 계정</b>을 만들어 주고, 그룹과 정책으로 필요한 서비스 권한만 부여합니다. 서브 계정에도 MFA를 켤 수 있어요.',
        '콘솔 접속과 API 접근도 서브 계정마다 따로 허용합니다. 스크립트와 Terraform이 쓸 API 인증키도 메인 계정이 아니라, 권한을 좁힌 서브 계정의 키를 씁니다.',
      ],
      callout: { type: 'warn', text: '메인 계정의 API 인증키는 루트 액세스 키와 같습니다. 새면 계정 전체가 넘어가니, 만들었다면 쓰지 않고 정리하세요.' },
      hide: ['n_srv', 'n_lb', 'n_nks', 'n_fn', 'n_obj', 'n_db', 'n_cr', 'n_ci'],
      show: ['dev', 'sa', 'res', 'main'],
      set: { main: { state: 'dim' } },
      focus: ['sa'],
      tags: [{ on: 'main', text: '잠가 두기 · MFA', icon: 'lock', pos: 'right' }, { on: 'res', text: '정책에 있는 것만', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['dev', 'sa', 'res'], kind: 'ctrl', n: 2 }],
      metrics: { key: ['서브 계정 키', 'ok'] },
      changes: [['+', '서브 계정 + 그룹 + 정책'], ['-', '메인 계정 키 사용'], ['~', '콘솔 · API 접근을 계정마다']],
    },
    {
      key: 'Classic 함정', kind: 'case', title: '사례: 블로그대로 했는데 안 보입니다',
      body: [
        '오래된 블로그 글을 따라 서버를 만들었는데, 만든 VPC에서 그 서버가 보이지 않고 ACG도 붙일 수 없습니다. 글이 <b>Classic</b> 환경 기준이었기 때문입니다. NCP에는 VPC 이전의 Classic 환경이 있었고, 둘은 서버 상품과 API가 따로입니다.',
        '콘솔에서는 플랫폼이 <b>VPC</b>로 선택돼 있는지, CLI에서는 VPC용 <code>vserver</code> 명령인지, 문서에서는 VPC 환경 문서인지 확인하세요.',
      ],
      callout: { type: 'tip', text: '새로 만드는 구성은 VPC 환경으로 통일합니다. 자료를 볼 때 "Classic"이라는 말이 보이면 일단 멈추세요.' },
      hide: ['sa', 'res', 'main'],
      show: ['classic', 'vsrv'],
      set: { classic: { state: 'hot' } },
      tags: [{ on: 'classic', text: 'VPC에 안 보임', tone: 'bad', pos: 'right' }, { on: 'vsrv', text: 'VPC 환경으로', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['dev', 'classic'], kind: 'bad' }, { path: ['dev', 'vsrv'], kind: 'req', n: 2, delay: 1.2 }],
      metrics: { plat: ['Classic → VPC', 'warn'] },
      changes: [['-', 'Classic 서버'], ['+', 'VPC 환경 서버'], ['~', 'CLI는 vserver 명령']],
    },
    {
      key: 'ncloud CLI', kind: 'concept', title: 'ncloud CLI와 API 인증키',
      body: [
        '<code>ncloud</code> CLI는 <code>ncloud configure</code>로 <b>Access Key</b>와 <b>Secret Key</b>를 등록해 씁니다. 요청은 Secret Key로 만든 서명을 붙여 보내고, NCP API가 그 서명을 확인합니다.',
        '명령은 <code>ncloud &lt;서비스&gt; &lt;API 이름&gt;</code> 모양이고, 리전을 <code>--regionCode</code>로 명령마다 지정합니다. Object Storage는 S3 호환이라 <code>aws</code> CLI에 엔드포인트만 바꿔 씁니다.',
      ],
      callout: { type: 'warn', text: '<code>--endpoint-url</code>을 빼먹으면 aws CLI는 AWS로 요청을 보냅니다. 별칭이나 프로파일로 묶어 두세요.' },
      hide: ['dev', 'classic', 'vsrv'],
      show: ['term', 'api'],
      flows: [{ path: ['term', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'term'], kind: 'res', n: 2, delay: 1.4 }],
      code: { ref: 'cli', hl: [1, 5, 6, 7] },
    },
    {
      key: 'Terraform', kind: 'concept', title: 'Terraform: ncloud 프로바이더',
      body: [
        'NCP에는 CloudFormation 같은 자체 IaC 도구 대신, 공식 Terraform 프로바이더 <code>NaverCloudPlatform/ncloud</code>가 있습니다. 다른 클라우드와 같은 Terraform 문법과 워크플로를 그대로 씁니다.',
        '프로바이더에는 리전(<code>KR</code>)과 사이트(민간·공공·금융)를 지정하고, 키는 코드가 아니라 환경 변수로 넘깁니다. 리소스 이름은 <code>ncloud_vpc</code>, <code>ncloud_subnet</code>처럼 <code>ncloud_</code>로 시작합니다.',
      ],
      hide: ['term'],
      show: ['tf', 'nvpc'],
      flows: [{ path: ['tf', 'api', 'nvpc'], kind: 'ctrl', n: 2 }],
      code: { ref: 'tf', hl: [4, 9, 10, 12, 13, 14] },
      metrics: { site: ['site = "public"', 'ok'] },
    },
    {
      key: '정리', kind: 'recap', title: '정리: 국내 · 규제 · 익숙한 구조',
      body: [
        'NCP는 국내 <code>KR</code> 리전의 두 존, 그리고 따로 운영되는 <b>공공기관용 · 금융</b> 환경이 강점입니다. 네트워크는 VPC · 존 단위 서브넷 · ACG로 AWS와 닮았고, Classic 환경 자료만 조심하면 됩니다.',
        '권한은 Sub Account, 자동화는 <code>ncloud</code> CLI와 Terraform. 다음 레슨에서는 네 클라우드의 지도를 겹쳐 <b>같은 역할, 다른 이름</b>을 한 번에 번역합니다.',
      ],
      hide: ['tf', 'api', 'nvpc'],
      show: ['vpc', 'sn_pub', 'sn_priv', 'user', 'web', 'db'],
      focus: ['web', 'db'],
      flows: [{ path: ['user', 'web', 'db'], kind: 'req', n: 2 }],
    },
  ],
  quiz: [
    {
      q: '공공기관 고객의 시스템을 NCP에 올리려 합니다. 설계 전에 가장 먼저 확인할 것은?',
      options: ['민간 환경에서 가장 싼 서버 사양', '고객이 요구하는 환경(공공기관용)과, 그 환경에서 필요한 서비스가 제공되는지', 'AWS와 같은 서비스 이름이 있는지', '해외 리전의 가격'],
      answer: 1,
      why: 'NCP의 공공기관용·금융 환경은 민간과 따로 운영되고, 제공 서비스가 다를 수 있습니다. 고객의 규제 조건이 환경을 정하고, 그 환경에서 쓸 수 있는 서비스가 설계의 범위를 정합니다.',
    },
    {
      q: 'NCP에서 DB 서버를 인터넷에서 직접 접근할 수 없게 두려 합니다. 알맞은 구성은?',
      options: ['Public 서브넷에 두고 공인 IP를 붙인다', 'Private 서브넷에 두고, ACG로 웹 서버에서 오는 DB 포트만 허용한다', 'Classic 환경에 만든다', '서브넷 없이 VPC에 바로 둔다'],
      answer: 1,
      why: 'NCP는 서브넷을 만들 때 Public/Private를 고릅니다. DB는 Private 서브넷에 두고, 서버에 붙는 ACG로 필요한 출발지와 포트만 엽니다. AWS의 프라이빗 서브넷 + 보안 그룹 패턴과 같습니다.',
    },
    {
      q: 'Terraform으로 NCP 리소스를 만들 때 쓸 API 인증키로 가장 알맞은 것은?',
      options: ['메인 계정의 인증키를 main.tf에 적는다', '필요한 정책만 준 서브 계정의 인증키를 환경 변수로 넘긴다', '팀원 모두가 같은 메인 계정 키를 나눠 쓴다', '키 없이 콘솔 비밀번호를 프로바이더에 넣는다'],
      answer: 1,
      why: '메인 계정 키는 루트 키와 같아 새면 계정 전체가 위험합니다. 권한을 좁힌 서브 계정의 키를 쓰고, 코드가 아니라 환경 변수(NCLOUD_ACCESS_KEY 등)로 넘겨야 저장소에 남지 않습니다.',
    },
    {
      q: '블로그를 따라 NCP CLI로 서버를 만들었는데, 콘솔의 VPC 화면에서 보이지 않습니다. 가장 먼저 의심할 것은?',
      options: ['리전이 해외로 지정됐다', '자료가 Classic 환경 기준이라 VPC가 아닌 Classic 서버를 만들었다', 'ACG가 없어서 숨겨졌다', 'Object Storage 엔드포인트를 빠뜨렸다'],
      answer: 1,
      why: 'NCP에는 Classic과 VPC 두 환경이 있고 서버 상품과 API가 다릅니다. VPC 서버는 vserver 명령으로 만듭니다. 리전 문제라면 리전을 바꿔 보면 보이고, ACG는 서버를 숨기지 않습니다.',
    },
  ],
};
