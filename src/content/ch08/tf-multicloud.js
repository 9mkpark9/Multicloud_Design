export default {
  id: 'tf-multicloud',
  learn: [
    'required_providers: 한 구성에 프로바이더 넷',
    'alias로 같은 프로바이더를 리전 · 계정별로 나누기',
    'Terraform은 사업자 차이를 없애 주지 않는다',
    '클라우드를 잇는 리소스를 참조로 한 plan에',
    '키 없는 인증(OIDC)과 사업자 · 환경별 state',
  ],
  legend: [['ctrl', 'API 호출'], ['data', '참조되는 값'], ['res', '임시 자격 증명'], ['sync', 'VPN 터널'], ['bad', '실패']],
  metrics: [
    { id: 'tools', label: '작업 도구', icon: 'terminal' },
    { id: 'prov', label: '프로바이더', icon: 'plug' },
    { id: 'keys', label: '자격 증명', icon: 'key' },
    { id: 'blast', label: '변경 범위', icon: 'target' },
  ],
  scene: {
    nodes: {
      dev: { kind: 'client', at: [4, 0], label: '개발자' },
      tf: { at: [4, 0], label: 'Terraform', sub: '구성 하나', icon: 'terminal', color: 'olive' },
      mod: { at: [4, 0], label: 'network', sub: '공통 모듈', icon: 'puzzle', color: 'olive' },
      gcp: { at: [1.4, 0], label: 'GCP', sub: '분석', icon: 'cloud', color: 'gcp' },
      aws: { at: [4, -2.6], label: 'AWS', sub: '서비스 (서울)', icon: 'cloud', color: 'aws' },
      ncp: { at: [4, 2.6], label: 'NCP', sub: '공공 고객', icon: 'cloud', color: 'ncp' },
      azure: { at: [6.6, 0], label: 'Azure', sub: '사내 계정', icon: 'cloud', color: 'azure' },
      tokyo: { at: [6.6, -2.6], label: 'AWS', sub: '도쿄 리전', icon: 'cloud', color: 'aws' },
      audit: { at: [1.4, -2.6], label: 'AWS', sub: '감사 계정', icon: 'cloud', color: 'aws' },
      st_gcp: { kind: 'cyl', at: [1.4, 2.6], label: 'gcp/prod', icon: 'file-key', color: 'slate' },
      st_aws: { kind: 'cyl', at: [6.6, -2.6], label: 'aws/prod', icon: 'file-key', color: 'slate' },
      st_link: { kind: 'cyl', at: [4, 0], label: 'vpn/prod', icon: 'file-key', color: 'slate' },
    },
    edges: {
      e_c_aws: { from: 'dev', to: 'aws', style: 'dashed' },
      e_c_gcp: { from: 'dev', to: 'gcp', style: 'dashed' },
      e_c_ncp: { from: 'dev', to: 'ncp', style: 'dashed' },
      e_c_azure: { from: 'dev', to: 'azure', style: 'dashed' },
      e_t_aws: { from: 'tf', to: 'aws' },
      e_t_gcp: { from: 'tf', to: 'gcp' },
      e_t_ncp: { from: 'tf', to: 'ncp' },
      e_t_azure: { from: 'tf', to: 'azure' },
      e_t_tokyo: { from: 'tf', to: 'tokyo' },
      e_t_audit: { from: 'tf', to: 'audit' },
      e_vpn: { from: 'gcp', to: 'aws', via: [[1.7, -2.3]], bi: true, label: 'IPsec', off: true },
      e_m_aws: { from: 'mod', to: 'aws' },
      e_m_gcp: { from: 'mod', to: 'gcp' },
      e_s_aws: { from: 'aws', to: 'st_aws', style: 'dashed' },
      e_s_gcp: { from: 'gcp', to: 'st_gcp', style: 'dashed' },
      e_l_aws: { from: 'st_aws', to: 'st_link', style: 'dashed', label: 'output' },
      e_l_gcp: { from: 'st_gcp', to: 'st_link', style: 'dashed', label: 'output' },
    },
  },
  codes: {
    alias: {
      title: 'providers.tf', lang: 'hcl',
      text: `provider "aws" {
  region = "ap-northeast-2" # 기본: 서울
}

provider "aws" {
  alias  = "tokyo"
  region = "ap-northeast-1"
}

provider "aws" {
  alias  = "audit"
  region = "ap-northeast-2"
  assume_role {
    role_arn = var.audit_role_arn
  }
}

resource "aws_s3_bucket" "backup" {
  provider = aws.tokyo
  bucket   = "shop-backup-tokyo"
}
`,
    },
    diff: {
      title: 'network.tf', lang: 'hcl',
      text: `# 같은 "사설망"도 사업자마다 모양이 다릅니다
resource "aws_vpc" "svc" {
  cidr_block = "10.10.0.0/16"
}

resource "google_compute_network" "ana" {
  name                    = "ana"
  auto_create_subnetworks = false
}
resource "google_compute_subnetwork" "seoul" {
  name          = "ana-seoul"
  network       = google_compute_network.ana.id
  region        = "asia-northeast3"
  ip_cidr_range = "10.30.0.0/20"
}

resource "ncloud_vpc" "pub" {
  name            = "pub"
  ipv4_cidr_block = "10.40.0.0/16"
}
`,
    },
    vpn: {
      title: 'vpn.tf', lang: 'hcl',
      text: `# GCP 게이트웨이: 만들어져야 공인 IP가 생김
resource "google_compute_ha_vpn_gateway" "gw" {
  name    = "to-aws"
  region  = "asia-northeast3"
  network = google_compute_network.ana.id
}

# AWS는 그 IP를 "상대편 게이트웨이"로 등록
resource "aws_customer_gateway" "gcp" {
  type       = "ipsec.1"
  bgp_asn    = 65010
  ip_address = (
    google_compute_ha_vpn_gateway.gw
    .vpn_interfaces[0].ip_address
  )
}

resource "aws_vpn_connection" "to_gcp" {
  type                = "ipsec.1"
  vpn_gateway_id      = aws_vpn_gateway.vgw.id
  customer_gateway_id = aws_customer_gateway.gcp.id
}
`,
    },
    mod: {
      title: 'main.tf', lang: 'hcl',
      text: `# 속은 다르게, 입구와 출구는 같게
module "net_aws" {
  source = "./modules/network-aws"
  name   = "svc"
  cidr   = "10.10.0.0/16"
}

module "net_gcp" {
  source = "./modules/network-gcp"
  name   = "ana"
  cidr   = "10.30.0.0/16"
}

# 둘 다 같은 이름의 output을 냅니다
output "network_ids" {
  value = {
    aws = module.net_aws.network_id
    gcp = module.net_gcp.network_id
  }
}
`,
    },
    port: {
      title: '터미널', lang: 'sh',
      text: `$ terraform plan

Error: Invalid resource type

  on main.tf line 2:
   2: resource "azurerm_vpc" "svc" {

The provider hashicorp/azurerm does not
support resource type "azurerm_vpc".

# 이름을 azurerm_virtual_network로 고치면
$ terraform plan

Error: Missing required argument

The argument "resource_group_name" is
required, but no definition was found.
`,
    },
  },
  steps: [
    {
      key: '콘솔 넷', kind: 'problem', title: '클라우드가 넷이면 콘솔도 넷입니다',
      body: [
        'shop.example은 서비스를 AWS에, 분석을 GCP에, 사내 계정을 Azure에, 공공 고객 데이터를 NCP에 둡니다. 클라우드마다 콘솔 · CLI · 로그인 방법이 다르고, 지금까지 짠 Terraform 코드는 AWS 하나만 알아요.',
        '가장 까다로운 건 둘을 <b>잇는</b> 일입니다. AWS와 GCP를 VPN으로 이으려면 한쪽 게이트웨이의 공인 IP를 복사해 다른 쪽 콘솔에 붙여 넣고, 반대 방향도 해야 해요. 한 글자만 틀려도 터널은 올라오지 않고, 누가 무엇을 바꿨는지는 어디에도 남지 않습니다.',
      ],
      callout: { type: 'warn', text: '<b>사람이 값을 옮겨 적는 곳</b>이 장애가 나는 곳입니다. 클라우드 사이의 연결일수록 더 그래요.' },
      show: ['dev', 'gcp', 'aws', 'ncp', 'azure'],
      tags: [
        { on: 'aws', text: '공인 IP 복사', icon: 'copy' },
        { on: 'gcp', text: '손으로 붙여넣기', tone: 'warn', icon: 'keyboard' },
      ],
      flows: [
        { path: ['dev', 'ncp'], kind: 'ctrl' },
        { path: ['dev', 'azure'], kind: 'ctrl', delay: 0.4 },
        { path: ['aws', 'dev', 'gcp'], kind: 'data', delay: 0.9 },
      ],
      metrics: { tools: ['콘솔 · CLI 4개', 'bad'], prov: '0개', keys: ['장기 키 4벌', 'warn'], blast: ['추적 불가', 'bad'] },
    },
    {
      key: 'provider 넷', kind: 'solution', title: '한 구성에 프로바이더 넷',
      body: [
        'Terraform 본체는 어느 클라우드도 모릅니다. API를 아는 건 <b>프로바이더</b>예요. 그러니 프로바이더를 넷 쓰면 한 구성으로 네 클라우드를 다룰 수 있습니다. <code>terraform</code> 블록의 <b>required_providers</b>에 이름과 출처(source)를 적으면 돼요.',
        '<code>terraform init</code>이 넷을 모두 내려받고, plan과 apply는 <b>하나의 의존성 그래프</b>로 돕니다. 네 개의 콘솔 대신 문법 하나, 명령 하나, 리뷰 한 번이 됩니다.',
      ],
      callout: { type: 'tip', text: 'NCP 프로바이더는 HashiCorp가 아니라 네이버 클라우드가 관리해서 출처가 <code>NaverCloudPlatform/ncloud</code>입니다. 버전은 지난 레슨처럼 프로바이더마다 고정하세요.' },
      hide: ['dev'],
      show: ['tf'],
      tags: [
        { on: 'aws', text: 'hashicorp/aws', tone: 'aws' },
        { on: 'gcp', text: 'hashicorp/google', tone: 'gcp' },
        { on: 'ncp', text: 'NaverCloudPlatform', tone: 'ncp', pos: 'bottom' },
        { on: 'azure', text: 'hashicorp/azurerm', tone: 'azure', pos: 'bottom' },
      ],
      focus: ['tf'],
      flows: [
        { path: ['tf', 'aws'], kind: 'ctrl' },
        { path: ['tf', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['tf', 'ncp'], kind: 'ctrl', delay: 0.6 },
        { path: ['tf', 'gcp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { tools: ['Terraform 하나', 'ok'], prov: ['4개', 'ok'], blast: '구성 하나' },
      changes: [['+', 'required_providers에 넷'], ['~', '콘솔 4개 → plan · apply 하나']],
    },
    {
      key: 'alias', kind: 'concept', title: 'alias: 같은 프로바이더를 여러 벌',
      body: [
        '프로바이더 설정 하나는 <b>리전 하나, 계정 하나</b>에 묶입니다. 백업을 도쿄 리전에도 두거나 감사 로그를 다른 AWS 계정에 쌓으려면, 같은 <code>aws</code> 프로바이더를 한 벌 더 설정하고 <b>alias</b>(별칭)를 붙입니다.',
        'alias가 없는 블록이 기본값이고, 다른 벌을 쓸 리소스는 <code>provider = aws.tokyo</code>로 직접 고릅니다. 다른 계정은 <code>assume_role</code>로 그 계정의 역할을 넘겨받아요.',
      ],
      callout: { type: 'warn', text: '<code>provider</code>를 빠뜨리면 오류 없이 <b>기본 리전 · 기본 계정</b>에 만들어집니다. 리뷰할 때 리소스마다 어느 벌을 쓰는지 확인하세요.' },
      hide: ['gcp', 'ncp', 'azure'],
      show: ['tokyo', 'audit'],
      set: { aws: { sub: '서울 · 기본' } },
      code: { ref: 'alias', hl: [6, 11, 14, 19] },
      tags: [
        { on: 'tokyo', text: 'aws.tokyo', tone: 'accent' },
        { on: 'audit', text: 'aws.audit', tone: 'accent' },
      ],
      flows: [
        { path: ['tf', 'aws'], kind: 'ctrl' },
        { path: ['tf', 'tokyo'], kind: 'ctrl', delay: 0.5 },
        { path: ['tf', 'audit'], kind: 'ctrl', delay: 1 },
      ],
      metrics: { prov: ['4개 + alias 2', 'ok'] },
    },
    {
      key: '차이는 그대로', kind: 'concept', title: 'Terraform은 차이를 없애 주지 않습니다',
      body: [
        'Terraform이 통일해 주는 것은 <b>작업 방식</b>입니다. HCL 문법, plan과 apply, 의존성 그래프는 어디서나 같아요. 하지만 리소스는 프로바이더가 정의하니 <b>사업자마다 종류도 인자도 다릅니다</b>.',
        '같은 사설망도 AWS는 <code>aws_vpc</code>에 대역을 주고, GCP의 VPC는 글로벌이라 대역 없이 <b>리전별 서브넷</b>에 줍니다. NCP는 <code>ncloud_vpc</code>, Azure는 리소스 그룹 안의 <code>azurerm_virtual_network</code>예요. 이름만이 아니라 <b>모델</b>이 다릅니다.',
      ],
      callout: { type: 'key', text: '멀티클라우드를 배우는 비용은 문법이 아니라 <b>각 클라우드의 모델</b>에 있습니다. Terraform은 그 모델을 숨기지 않고 그대로 드러내요.' },
      hide: ['tokyo', 'audit'],
      show: ['gcp', 'ncp'],
      set: { aws: { sub: '서비스 (서울)' } },
      code: { ref: 'diff', hl: [3, 8, 14, 19] },
      tags: [
        { on: 'aws', text: 'VPC에 대역' },
        { on: 'gcp', text: '대역은 서브넷에', tone: 'gcp' },
        { on: 'ncp', text: 'ncloud_vpc', pos: 'bottom' },
      ],
      flows: [
        { path: ['tf', 'aws'], kind: 'ctrl' },
        { path: ['tf', 'gcp'], kind: 'ctrl', delay: 0.4 },
        { path: ['tf', 'ncp'], kind: 'ctrl', delay: 0.8 },
      ],
    },
    {
      key: '한 plan', kind: 'solution', title: '두 클라우드를 잇는 것도 한 plan으로',
      body: [
        '멀티 프로바이더의 진짜 힘은 <b>클라우드 사이의 참조</b>입니다. GCP의 HA VPN 게이트웨이는 만들어져야 공인 IP가 생기고, AWS의 customer gateway에는 바로 그 IP가 필요해요. AWS 리소스가 GCP 리소스의 속성을 참조하면, 콘솔 사이에서 옮겨 적던 값이 그래프를 따라 흐릅니다.',
        'Terraform은 이 참조로 순서를 계산합니다. 반대 방향, 곧 AWS 터널의 IP와 사전 공유 키를 GCP 쪽 터널에 넘기는 것도 같은 방식으로 적어요.',
      ],
      callout: { type: 'warn', text: '사전 공유 키 같은 비밀값은 <b>state에 그대로</b> 남습니다. state 레슨에서 본 원격 백엔드의 암호화와 접근 제어가 여기서 꼭 필요해요.' },
      hide: ['ncp'],
      show: ['e_vpn'],
      set: { aws: { sub: 'VPN 게이트웨이' }, gcp: { sub: 'HA VPN' } },
      code: { ref: 'vpn', hl: [2, 12, 13, 14] },
      tags: [{ on: 'tf', text: '참조로 값 전달', tone: 'accent', icon: 'link', pos: 'bottom' }],
      flows: [
        { path: ['gcp', 'tf'], kind: 'data' },
        { path: ['tf', 'aws'], kind: 'data', delay: 1 },
        { path: ['gcp', [1.7, -2.3], 'aws'], kind: 'sync', n: 3, delay: 2.2 },
      ],
      metrics: { blast: ['두 클라우드 함께', 'warn'] },
      changes: [['+', 'GCP · AWS VPN 리소스가 한 그래프에'], ['-', '콘솔 사이 복사 · 붙여넣기']],
    },
    {
      key: '어디서나?', kind: 'case', title: '사례: "Terraform이니까 Azure로 옮기면 되죠"',
      body: [
        'AWS 비용이 부담되자 누군가 말합니다. "Terraform으로 짰으니 프로바이더만 바꾸면 Azure에서도 돌잖아요." <code>aws_</code>를 <code>azurerm_</code>으로 바꿔 plan을 돌리자 첫 리소스부터 오류입니다.',
        '이름을 고쳐도 끝이 아닙니다. Azure 네트워크에는 리소스 그룹과 위치가 필요하고, VM 크기 · 이미지 · 로드 밸런서 · 권한 모델이 모두 달라요. 결국 <b>옮기는 게 아니라 다시 설계</b>하는 일이고, 코드보다 데이터 이전과 운영 절차가 더 큰 일입니다.',
      ],
      callout: { type: 'key', text: 'Terraform이 옮겨 주는 것은 <b>워크플로와 팀의 습관</b>이지 인프라가 아닙니다. "코드 하나로 어디서나 돈다"는 오해예요.' },
      hide: ['gcp'],
      show: ['azure'],
      set: { aws: { sub: '서비스 (서울)' }, gcp: { sub: '분석' }, azure: { state: 'hot', badge: 'plan 실패', tone: 'bad' } },
      code: { ref: 'port', hl: [3, 8, 9, 14] },
      flows: [{ path: ['tf', 'azure'], kind: 'bad', n: 3, gap: 0.5 }],
      metrics: { tools: ['다시 설계', 'warn'] },
      changes: [['-', '리소스 종류가 없음'], ['-', '필수 인자 · 모델이 다름']],
    },
    {
      key: '모듈', kind: 'solution', title: '같은 모양은 모듈로 직접 만듭니다',
      body: [
        '여러 클라우드에 같은 모양이 필요하다면 그 추상화는 <b>내가 만듭니다</b>. 사업자별 모듈(<code>network-aws</code>, <code>network-gcp</code>)을 두고, 속은 각자의 리소스로 짜되 <b>입구(variable)와 출구(output)의 이름</b>을 맞춥니다.',
        '부르는 쪽은 이름과 대역만 넘기고, 결과도 같은 이름 <code>network_id</code>로 받습니다. 이름 규칙 · 태그 · 대역 계획 같은 팀의 규칙은 모듈 안에 한 번만 적어요.',
      ],
      callout: { type: 'warn', text: '모든 차이를 감추는 "만능 모듈"은 <b>최소 공통분모</b>가 됩니다. 각 클라우드의 좋은 기능을 못 쓰게 되니, 정말 같은 부분만 감싸고 차이는 변수로 열어 두세요.' },
      hide: ['tf', 'azure', 'e_vpn'],
      show: ['mod', 'gcp'],
      set: { azure: { state: null, badge: null } },
      code: { ref: 'mod', hl: [4, 5, 10, 11, 17, 18] },
      tags: [
        { on: 'aws', text: 'network-aws', tone: 'aws' },
        { on: 'gcp', text: 'network-gcp', tone: 'gcp' },
      ],
      flows: [
        { path: ['mod', 'aws'], kind: 'ctrl' },
        { path: ['mod', 'gcp'], kind: 'ctrl', delay: 0.5 },
      ],
      metrics: { tools: ['모듈 + 사업자별 속', 'ok'] },
    },
    {
      key: '키 없는 인증', kind: 'compare', title: '자격 증명은 코드 밖에, 가능하면 키 없이',
      body: [
        '프로바이더 블록에는 키를 적지 않습니다. 노트북에서는 각 CLI의 로그인 정보나 환경 변수를 프로바이더가 알아서 읽어요. 문제는 CI입니다. 장기 키 네 벌을 시크릿에 쌓아 두면 하나만 새도 그 클라우드가 열립니다.',
        '그래서 CI는 <b>OIDC 연합</b>을 씁니다. CI가 발급받은 짧은 토큰을 각 클라우드가 검증하고, <b>수명이 짧은 임시 자격 증명</b>으로 바꿔 줘요. 연합을 쓸 수 없는 곳만 권한을 좁힌 키를 두고 주기적으로 교체합니다.',
      ],
      callout: { type: 'cloud', text: '이미지 파이프라인 레슨의 OIDC와 같은 원리입니다. 클라우드마다 <b>신뢰를 등록하는 곳</b>의 이름만 다릅니다.' },
      hide: ['mod'],
      show: ['tf', 'azure', 'ncp'],
      set: { tf: { sub: 'CI 러너에서' } },
      tags: [
        { on: 'aws', text: 'OIDC 공급자 + 역할', tone: 'aws' },
        { on: 'gcp', text: 'Workload Identity', tone: 'gcp' },
        { on: 'ncp', text: 'API 인증키', tone: 'ncp', pos: 'bottom' },
        { on: 'azure', text: '페더레이션 자격 증명', tone: 'azure', pos: 'bottom' },
      ],
      flows: [
        { path: ['tf', 'aws'], kind: 'ctrl' },
        { path: ['tf', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['tf', 'gcp'], kind: 'ctrl', delay: 0.6 },
        { path: ['aws', 'tf'], kind: 'res', delay: 1.5 },
        { path: ['azure', 'tf'], kind: 'res', delay: 1.8 },
        { path: ['gcp', 'tf'], kind: 'res', delay: 2.1 },
      ],
      metrics: { keys: ['단기 토큰', 'ok'] },
      changes: [['-', 'CI 시크릿의 장기 키'], ['+', '클라우드마다 OIDC 신뢰 등록']],
    },
    {
      key: 'state 나누기', kind: 'concept', title: 'state는 사업자 · 환경별로 나눕니다',
      body: [
        '네 클라우드를 state 하나에 담으면 plan마다 네 사업자의 API를 모두 부르고, <b>잠금도 하나</b>라 누가 apply하는 동안 모두 기다립니다. 한 사업자의 인증이 만료되면 나머지 셋의 plan까지 멈추고, 실수 하나가 네 클라우드에 닿아요.',
        '그래서 운영에서는 <b>사업자 × 환경</b>마다 state를 나눕니다. 둘을 잇는 VPN은 별도 스택이 되어 양쪽의 <b>output만 읽어</b> 옵니다. 하나로 묶는 건 작은 구성이나 실습까지예요.',
      ],
      callout: { type: 'tip', text: '다른 state의 값은 <code>terraform_remote_state</code>나 data 블록으로 읽습니다. 스택 사이에 순서가 생기니 네트워크 → 연결 → 앱처럼 <b>아래층부터</b> apply하세요.' },
      hide: ['tf', 'azure', 'ncp'],
      show: ['st_gcp', 'st_aws', 'st_link', 'e_vpn'],
      set: { aws: { sub: '서비스 (서울)' }, gcp: { sub: '분석' }, tf: { sub: '구성 하나' } },
      tags: [{ on: 'st_link', text: 'output만 읽기', icon: 'eye', pos: 'bottom' }],
      flows: [
        { path: ['aws', 'st_aws'], kind: 'data' },
        { path: ['gcp', 'st_gcp'], kind: 'data', delay: 0.3 },
        { path: ['st_aws', 'st_link'], kind: 'data', delay: 1.2 },
        { path: ['st_gcp', 'st_link'], kind: 'data', delay: 1.4 },
      ],
      metrics: { blast: ['스택 하나', 'ok'] },
      changes: [['~', 'state 1개 → 사업자 · 환경별'], ['+', 'VPN 연결 스택 (output 참조)'], ['~', '잠금 · 장애가 스택 안에 갇힘']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 워크플로는 하나, 클라우드는 넷',
      body: [
        '<code>required_providers</code>에 프로바이더를 넷 적으면 한 구성이 네 클라우드를 다루고, <b>alias</b>로 리전과 계정을 나눕니다. 리소스의 차이는 그대로이니, 같은 모양이 필요하면 <b>모듈</b>로 직접 감쌉니다.',
        '클라우드를 잇는 리소스는 참조로 한 그래프에 두고, 인증은 코드 밖에서 OIDC로, state는 사업자 · 환경별로 나눕니다. 다음 챕터에서는 이런 변경을 사람 손 대신 <b>CI/CD 파이프라인</b>이 적용하게 만듭니다.',
      ],
      hide: ['st_gcp', 'st_aws', 'st_link'],
      show: ['tf', 'azure', 'ncp'],
      focus: ['tf'],
      flows: [
        { path: ['tf', 'aws'], kind: 'ctrl' },
        { path: ['tf', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['tf', 'ncp'], kind: 'ctrl', delay: 0.6 },
        { path: ['tf', 'gcp'], kind: 'ctrl', delay: 0.9 },
        { path: ['gcp', [1.7, -2.3], 'aws'], kind: 'sync', n: 2, delay: 1.6 },
      ],
    },
  ],
  quiz: [
    {
      q: '같은 AWS 계정의 서울과 도쿄 리전에 버킷을 하나씩 만들려 합니다. 가장 알맞은 방법은?',
      options: [
        'provider "aws" 블록 하나에 region을 두 개 적는다',
        'alias를 붙인 두 번째 aws 프로바이더를 두고, 도쿄 버킷에 provider = aws.tokyo를 지정한다',
        'AWS_REGION 환경 변수를 바꿔 가며 같은 구성으로 apply를 두 번 한다',
        'required_providers에 aws를 두 번 적는다',
      ],
      answer: 1,
      why: '프로바이더 설정 하나는 리전 하나에 묶이고, 여러 벌이 필요하면 alias로 구분합니다. 환경 변수를 바꿔 두 번 apply해도 같은 state에는 버킷 주소가 하나뿐이라 버킷이 둘 생기지 않고, 두 apply가 서로를 덮어쓰려 합니다. required_providers는 어떤 플러그인을 쓸지 정할 뿐 리전과 무관합니다.',
    },
    {
      q: 'AWS용으로 잘 짠 Terraform 코드를 GCP로 옮기자는 제안이 나왔습니다. 가장 정확한 예상은?',
      options: [
        'provider 블록만 google로 바꾸면 그대로 동작한다',
        '리소스 종류 이름만 일괄 치환하면 된다',
        '리소스 종류 · 인자 · 네트워크 모델이 달라 사실상 다시 설계해야 하고, 옮겨 가는 것은 워크플로와 팀의 관행이다',
        'Terraform의 변환 기능으로 자동 이전할 수 있다',
      ],
      answer: 2,
      why: '리소스는 프로바이더가 정의하므로 사업자마다 다릅니다. GCP의 VPC는 글로벌이고 대역은 서브넷에 있는 것처럼 모델 자체가 달라, 이름을 바꾸는 정도로는 끝나지 않습니다. Terraform에 그런 자동 변환 기능은 없습니다. 옮겨 가는 것은 HCL, plan 리뷰, 모듈 구조 같은 작업 방식입니다.',
    },
    {
      q: '네 클라우드를 state 하나로 관리하던 중 Azure 자격 증명이 만료됐습니다. 무슨 일이 생기고, 어떻게 바꾸는 게 좋을까요?',
      options: [
        'Azure 리소스만 plan에서 빠지고 나머지는 정상 진행된다',
        '구성 전체의 plan이 실패해 다른 클라우드 작업도 막힌다. 사업자 · 환경별로 state를 나눈다',
        'Terraform이 Azure 리소스를 삭제 대상으로 표시한다',
        '아무 일도 없다. 자격 증명은 apply 때만 쓰인다',
      ],
      answer: 1,
      why: 'plan도 기존 리소스를 조회하느라 모든 프로바이더의 API를 부르므로, 한 곳의 인증 실패가 구성 전체를 멈춥니다. 조회에 실패했다고 삭제 계획을 세우지는 않습니다. state를 사업자 · 환경별로 나누면 장애와 잠금이 그 스택 안에 머뭅니다.',
    },
    {
      q: 'AWS customer gateway에 GCP HA VPN 게이트웨이의 공인 IP를 넣어야 합니다. 가장 좋은 방법은?',
      options: [
        'GCP 콘솔에서 IP를 확인해 ip_address에 문자열로 적는다',
        '같은 구성에서 GCP 리소스의 속성을 참조하거나, 나눈 스택이라면 그쪽 output을 읽는다',
        'apply를 두 번 실행하면 Terraform이 알아서 채운다',
        'AWS와 GCP 리소스는 한 구성에 둘 수 없으니 스크립트로 옮긴다',
      ],
      answer: 1,
      why: '참조로 적으면 Terraform이 GCP 게이트웨이를 먼저 만들고 그 값을 넘기는 순서를 계산하며, 게이트웨이가 다시 만들어져 IP가 바뀌어도 따라갑니다. 문자열로 적으면 콘솔 복사와 다를 바 없고, IP가 바뀌는 순간 조용히 끊깁니다. 서로 다른 프로바이더의 리소스도 한 구성에 함께 둘 수 있습니다.',
    },
  ],
};
