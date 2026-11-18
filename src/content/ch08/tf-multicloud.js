export default {
  id: 'tf-multicloud',
  learn: [
    'required_providers: 한 구성에 프로바이더 넷',
    'alias와 모듈에 프로바이더 넘기기',
    'Terraform이 추상화하지 않는 것들',
    '클라우드를 잇는 리소스를 참조로 한 plan에',
    '인증: 노트북의 로그인, CI의 OIDC',
    '사업자 · 환경별로 나눈 state',
  ],
  legend: [['ctrl', 'API 호출'], ['data', '참조되는 값'], ['res', '자격 증명'], ['sync', 'VPN 터널'], ['bad', '실패']],
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
      e_m_tokyo: { from: 'mod', to: 'tokyo' },
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
    pass: {
      title: 'main.tf', lang: 'hcl',
      text: `# 같은 백업 모듈을 서울과 도쿄에 한 벌씩
module "backup_seoul" {
  source = "./modules/backup"
  name   = "shop-backup-seoul"
}

module "backup_tokyo" {
  source = "./modules/backup"
  name   = "shop-backup-tokyo"

  providers = {
    aws = aws.tokyo # 모듈 안의 aws = 도쿄
  }
}

# modules/backup 안에는 provider 블록이
# 없습니다. 부르는 쪽이 넘겨줍니다.
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
    ping: {
      title: '터미널', lang: 'sh',
      text: `$ terraform apply
...
Apply complete! Resources: 9 added,
0 changed, 0 destroyed.

# 콘솔: 터널 두 개 모두 UP
# GCP의 분석 VM에서 AWS 서버로
$ ping -c 3 10.10.1.25
PING 10.10.1.25 (10.10.1.25) 56(84) bytes
--- 10.10.1.25 ping statistics ---
3 packets transmitted, 0 received,
100% packet loss, time 2041ms
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
        '가장 까다로운 건 둘을 <b>잇는</b> 일입니다. AWS와 GCP를 VPN으로 이으려면 한쪽 게이트웨이의 공인 IP를 복사해 다른 쪽 콘솔에 붙여 넣고, 반대 방향도 해야 해요. 한 글자만 틀려도 터널은 올라오지 않습니다.',
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
      more: [
        { title: '왜 멀티클라우드인가 (짧게)', body: [
          '이 레슨은 "왜 여러 클라우드를 쓰는가"보다 "쓰기로 했다면 어떻게 한 방식으로 다루는가"에 집중합니다. 규제, 인수합병, 특정 서비스의 강점, 고객 요구 같은 이유와 그 비용은 마지막 챕터의 첫 레슨에서 다룹니다.',
          '여기서 중요한 사실 하나: 클라우드가 늘면 <b>사람의 수작업이 곱으로</b> 늡니다. 콘솔 넷 × 환경 셋이면 같은 변경을 열두 번 해야 할 수도 있어요.',
        ] },
        { title: '콘솔로 이을 때 생기는 일', list: [
          '양쪽에 같은 값을 따로 적어야 합니다: 공인 IP, 사전 공유 키, BGP ASN, 상대 대역',
          '한쪽 게이트웨이를 다시 만들면 IP가 바뀌는데, 다른 쪽 콘솔은 그 사실을 모릅니다. 터널이 조용히 끊겨요',
          '네 클라우드의 감사 로그는 서로 따로라, "누가 이 연결을 바꿨나"를 찾으려면 네 곳을 뒤져야 합니다',
        ] },
        { title: '이 레슨의 순서', list: [
          '프로바이더 넷을 한 구성에, 인증은 코드 밖에서',
          'alias와 모듈로 리전 · 계정 나누기',
          '사업자 차이는 그대로라는 사실과, 클라우드를 잇는 참조',
          '실패 사례 둘, 그리고 CI 인증과 state 나누기',
        ] },
      ],
    },
    {
      key: 'provider 넷', kind: 'solution', title: '한 구성에 프로바이더 넷',
      body: [
        'Terraform 본체는 어느 클라우드도 모릅니다. API를 아는 건 <b>프로바이더</b>예요. 그러니 프로바이더를 넷 쓰면 한 구성으로 네 클라우드를 다룰 수 있습니다. <code>terraform</code> 블록의 <b>required_providers</b>에 이름과 출처(source)를 적으면 돼요.',
        '<code>terraform init</code>이 넷을 모두 내려받고, plan과 apply는 <b>하나의 의존성 그래프</b>로 돕니다. 네 개의 콘솔 대신 문법 하나, 명령 하나, 리뷰 한 번이 됩니다.',
      ],
      callout: { type: 'tip', text: 'NCP 프로바이더는 네이버 클라우드가 관리해서 출처가 <code>NaverCloudPlatform/ncloud</code>입니다. 버전은 프로바이더마다 따로 고정하세요.' },
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
      more: [
        { title: '설정 예시', body: ['버전 범위는 예시입니다. 실제로는 쓰는 시점의 메이저 버전에 맞춰 고정하고, lock 파일을 커밋합니다.'], code: { title: 'versions.tf', lang: 'hcl', text: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    ncloud = {
      source  = "NaverCloudPlatform/ncloud"
      version = "~> 3.0"
    }
  }
}` } },
        { title: '프로바이더마다 필요한 설정', rows: [
          ['aws', 'region', 'aws'],
          ['azurerm', 'features {} · subscription_id', 'azure'],
          ['google', 'project · region', 'gcp'],
          ['ncloud', 'region · (VPC 환경 지정)', 'ncp'],
        ] },
        { title: '흔한 실수', list: [
          '<code>required_providers</code>에 ncloud를 빼먹음 → Terraform이 <code>hashicorp/ncloud</code>를 찾다가 init이 실패합니다',
          'azurerm에서 빈 <code>features {}</code> 블록을 빼먹음 → 비어 있어도 반드시 있어야 하는 블록이라 오류가 납니다',
          '프로바이더 넷의 버전을 한꺼번에 올림 → 무엇 때문에 plan이 바뀌었는지 가려내기 어렵습니다. 하나씩 올립니다',
        ] },
      ],
    },
    {
      key: '로컬 인증', kind: 'concept', title: '인증은 코드 밖에서, 클라우드마다 따로',
      body: [
        '프로바이더 블록에는 키를 적지 않습니다. 각 프로바이더가 <b>정해진 순서로</b> 자격 증명을 찾아요. 노트북에서는 보통 각 클라우드 CLI로 로그인해 두면 프로바이더가 그 정보를 그대로 씁니다.',
        '네 클라우드면 로그인도 넷입니다. 하나라도 만료되면 plan은 그 클라우드의 리소스를 조회하지 못해 <b>전체가 멈춰요</b>.',
      ],
      callout: { type: 'warn', text: '서비스 계정 키 파일이나 액세스 키를 장기간 노트북에 두는 것은 피합니다. 가능한 곳은 SSO처럼 <b>짧게 사는 로그인</b>을 씁니다.' },
      tags: [
        { on: 'aws', text: 'aws sso login', tone: 'aws' },
        { on: 'gcp', text: 'gcloud ADC', tone: 'gcp' },
        { on: 'ncp', text: 'NCLOUD_ACCESS_KEY', tone: 'ncp', pos: 'bottom' },
        { on: 'azure', text: 'az login', tone: 'azure', pos: 'bottom' },
      ],
      flows: [
        { path: ['aws', 'tf'], kind: 'res' },
        { path: ['azure', 'tf'], kind: 'res', delay: 0.3 },
        { path: ['gcp', 'tf'], kind: 'res', delay: 0.6 },
        { path: ['ncp', 'tf'], kind: 'res', delay: 0.9 },
      ],
      metrics: { keys: ['로그인 4벌', 'warn'] },
      more: [
        { title: '직접 해보기', body: ['노트북에서 네 클라우드에 로그인해 두는 예입니다. NCP는 API 인증키를 환경 변수로 줍니다.'], code: { title: 'terminal', lang: 'sh', text: `$ aws sso login --profile shop-prod
$ export AWS_PROFILE=shop-prod

$ az login
$ export ARM_SUBSCRIPTION_ID=<구독 ID>

$ gcloud auth application-default login

$ export NCLOUD_ACCESS_KEY=<인증키 ID>
$ export NCLOUD_SECRET_KEY=<비밀 키>

$ terraform plan` } },
        { title: '프로바이더가 찾는 순서 (요약)', rows: [
          ['aws', '환경 변수 → 프로필 · SSO → 실행 역할', 'aws'],
          ['azurerm', 'ARM_* 환경 변수 · OIDC → Azure CLI', 'azure'],
          ['google', '환경 변수 → ADC (gcloud 로그인)', 'gcp'],
          ['ncloud', '블록 인자 → NCLOUD_* 환경 변수', 'ncp'],
        ] },
        { title: '흔한 실수', list: [
          '<code>AWS_PROFILE</code>이 dev를 가리키는 터미널에서 prod 폴더를 plan → 프로바이더는 폴더가 아니라 자격 증명을 따릅니다. prod 폴더의 provider에 <code>assume_role</code>로 대상 계정을 명시하면 이런 착각이 오류로 드러납니다',
          '비밀 키를 <code>.tfvars</code>나 provider 블록에 적어 커밋 → 키를 즉시 폐기하고 새로 발급해야 합니다. Git 히스토리에서 지우는 것만으로는 부족해요',
        ] },
      ],
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
      more: [
        { title: '동작 원리', body: [
          'Terraform은 리소스 종류 이름의 앞부분(<code>aws_</code>, <code>google_</code>)으로 어느 프로바이더인지 고르고, 그중 <b>alias 없는 설정</b>을 기본으로 씁니다. alias를 붙인 설정은 리소스가 <code>provider</code> 메타 인자로 직접 가리킬 때만 쓰여요. 설정이 여러 벌이어도 내려받는 플러그인은 하나이고, 실행할 때 설정마다 따로 인증합니다.',
          'state에는 리소스마다 어느 프로바이더 설정으로 만들었는지가 기록됩니다. 그래서 리소스가 아직 있는데 그 alias 설정을 코드에서 지우면 plan이 "그 설정을 찾을 수 없다"는 오류로 멈춥니다. 리소스를 먼저 옮기거나 지운 뒤에 설정을 지웁니다.',
        ] },
        { title: 'alias가 필요한 흔한 경우', list: [
          '<b>다른 리전</b>: 재해 복구용 복제, 리전 간 버킷 복제',
          '<b>특정 리전에만 있는 것</b>: CloudFront용 ACM 인증서는 <code>us-east-1</code>에 만들어야 합니다',
          '<b>다른 계정</b>: 감사 · 로그 계정, 공유 네트워크 계정, DNS를 가진 계정',
          '<b>같은 클라우드의 다른 구독 · 프로젝트</b>: azurerm의 subscription_id, google의 project를 다르게',
        ] },
        { title: '흔한 실수', list: [
          '리전 간 복제를 설정하면서 대상 버킷에 <code>provider</code>를 빼먹음 → 대상이 원본과 같은 리전에 생겨 복제의 의미가 사라집니다',
          'alias 이름을 리전 코드(<code>apne1</code>)로 지었다가 리전을 바꿈 → 이름과 실제가 어긋납니다. 역할(<code>dr</code>, <code>audit</code>)로 짓는 편이 오래갑니다',
        ] },
      ],
    },
    {
      key: '모듈에 전달', kind: 'concept', title: '모듈에는 프로바이더를 넘겨줍니다',
      body: [
        '같은 백업 모듈을 서울과 도쿄에 한 벌씩 두고 싶습니다. 모듈 안에는 provider 블록이 없으니, 기본으로는 루트의 <b>기본 aws</b>를 물려받아요. 도쿄 쪽은 <code>providers = { aws = aws.tokyo }</code>로 <b>넘겨줍니다</b>.',
        '모듈 입장에서는 그냥 <code>aws</code>입니다. 어느 리전인지는 <b>부르는 쪽이 결정</b>하니, 같은 모듈 코드가 어느 리전 · 계정에서든 그대로 쓰여요.',
      ],
      callout: { type: 'key', text: '모듈 안에 provider 블록을 두지 않는 이유가 이것입니다. 두면 리전이 모듈에 박혀서 넘겨줄 수가 없어요.' },
      hide: ['tf', 'audit'],
      show: ['mod'],
      set: { mod: { label: 'backup', sub: '모듈' }, aws: { sub: '서울' } },
      code: { ref: 'pass', hl: [7, 11, 12, 13] },
      tags: [
        { on: 'tokyo', text: 'aws = aws.tokyo', tone: 'accent' },
        { on: 'aws', text: '기본 aws 물려받음' },
      ],
      flows: [
        { path: ['mod', 'aws'], kind: 'ctrl' },
        { path: ['mod', 'tokyo'], kind: 'ctrl', delay: 0.6 },
      ],
      metrics: { prov: ['모듈에 전달', 'ok'] },
      changes: [['+', 'module "backup_tokyo" { providers = … }'], ['~', '같은 모듈 코드, 리전은 호출부가 결정']],
      more: [
        { title: '설정 예시', body: ['한 모듈이 <b>두 벌</b>을 함께 써야 할 때(원본과 복제본)는 모듈이 받을 별칭을 <code>configuration_aliases</code>로 선언합니다.'], code: { title: 'modules/replica/versions.tf', lang: 'hcl', text: `terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.primary, aws.dr]
    }
  }
}

# 모듈 안: provider = aws.dr 로 사용
# 루트에서 부를 때
#   providers = {
#     aws.primary = aws
#     aws.dr      = aws.tokyo
#   }` } },
        { title: '알아 둘 규칙', list: [
          '<code>providers</code>를 주지 않으면 모듈은 같은 이름의 <b>기본 설정</b>을 물려받습니다. alias 설정은 자동으로 넘어가지 않아요',
          '모듈 안에 provider 블록이 있으면 그 모듈에 <code>for_each</code> · <code>count</code>를 쓸 수 없고, 모듈을 지우기도 까다로워집니다',
          '모듈의 <code>required_providers</code>에는 최소 버전만 적고, 정확한 범위는 루트가 정합니다',
        ] },
        { title: '실무 팁', body: [
          '리전마다 같은 구성을 깔 때 "모듈 × 리전별 provider" 조합은 아주 흔한 모양입니다. 다만 리전 수가 많아지면 루트에 provider와 module 블록이 리전 수만큼 늘어나는데, provider는 for_each로 만들 수 없기 때문이에요. 리전이 많다면 리전마다 별도 루트(디렉터리)로 나누는 편이 관리하기 쉽습니다.',
        ] },
      ],
    },
    {
      key: '차이는 그대로', kind: 'concept', title: 'Terraform은 차이를 없애 주지 않습니다',
      body: [
        'Terraform이 통일해 주는 것은 <b>작업 방식</b>입니다. HCL 문법, plan과 apply, 의존성 그래프는 어디서나 같아요. 하지만 리소스는 프로바이더가 정의하니 <b>사업자마다 종류도 인자도 다릅니다</b>.',
        '같은 사설망도 AWS는 <code>aws_vpc</code>에 대역을 주고, GCP의 VPC는 글로벌이라 대역 없이 <b>리전별 서브넷</b>에 줍니다. NCP는 <code>ncloud_vpc</code>, Azure는 리소스 그룹 안의 <code>azurerm_virtual_network</code>예요. 이름만이 아니라 <b>모델</b>이 다릅니다.',
      ],
      callout: { type: 'key', text: '멀티클라우드를 배우는 비용은 문법이 아니라 <b>각 클라우드의 모델</b>에 있습니다. Terraform은 그 모델을 숨기지 않고 그대로 드러내요.' },
      hide: ['mod', 'tokyo'],
      show: ['tf', 'gcp', 'ncp'],
      set: { aws: { sub: '서비스 (서울)' }, mod: { label: 'network', sub: '공통 모듈' } },
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
      more: [
        { title: '같은 일, 다른 리소스', rows: [
          ['사설망', 'aws_vpc · azurerm_virtual_network', 'info'],
          ['', 'google_compute_network · ncloud_vpc', 'info'],
          ['서브넷 범위', 'AWS: AZ 하나 · GCP · Azure: 리전', 'warn'],
          ['방화벽', '보안 그룹 · NSG · VPC 방화벽 규칙', 'info'],
          ['묶음 단위', 'Azure만 리소스 그룹이 필수', 'warn'],
        ] },
        { title: '모델 차이가 코드에 미치는 영향', list: [
          'AWS의 서브넷은 <b>가용 영역 하나</b>에 묶이므로 AZ마다 서브넷을 만들지만, GCP와 Azure의 서브넷은 리전 전체에 걸칩니다. "AZ마다 서브넷 셋"이라는 모듈은 GCP로 옮기면 의미가 없어요',
          'GCP의 방화벽 규칙은 VPC 네트워크에 붙고 태그 · 서비스 계정으로 대상을 고르지만, AWS 보안 그룹은 네트워크 인터페이스에 붙습니다',
          'Azure는 거의 모든 리소스가 <code>resource_group_name</code>과 <code>location</code>을 요구합니다',
        ] },
        { title: '더 생각해 볼 것', body: [
          '"클라우드 중립 IaC"를 내세우는 도구나 모듈도 결국 어딘가에서 이 차이를 처리합니다. 숨긴 만큼 각 클라우드의 고유 기능은 쓰기 어려워져요. 어디까지 감추고 어디서 드러낼지는 도구가 아니라 <b>팀이 정하는 설계</b>입니다.',
        ] },
      ],
    },
    {
      key: '한 plan', kind: 'solution', title: '두 클라우드를 잇는 것도 한 plan으로',
      body: [
        '멀티 프로바이더의 진짜 힘은 <b>클라우드 사이의 참조</b>입니다. GCP의 HA VPN 게이트웨이는 만들어져야 공인 IP가 생기고, AWS의 customer gateway에는 바로 그 IP가 필요해요. AWS 리소스가 GCP 리소스의 속성을 참조하면, 콘솔 사이에서 옮겨 적던 값이 그래프를 따라 흐릅니다.',
        'Terraform은 이 참조로 순서를 계산합니다. 반대 방향, 곧 AWS 터널의 IP와 사전 공유 키를 GCP 쪽에 넘기는 것도 같은 방식으로 적어요.',
      ],
      callout: { type: 'warn', text: '사전 공유 키 같은 비밀값은 <b>state에 그대로</b> 남습니다. 원격 백엔드의 암호화와 접근 제어가 여기서 꼭 필요해요.' },
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
      more: [
        { title: '전체 그림', body: ['실제 AWS ↔ GCP HA VPN은 리소스가 꽤 많습니다. 양쪽이 서로의 값을 주고받는 지점이 여러 군데라, 참조로 잇는 효과가 큽니다.'], rows: [
          ['GCP', 'HA VPN 게이트웨이 → 공인 IP 2개', 'gcp'],
          ['AWS', 'customer gateway ← GCP IP', 'aws'],
          ['AWS', 'VPN 연결 → 터널 IP · 사전 공유 키', 'aws'],
          ['GCP', '외부 VPN 게이트웨이 ← AWS 터널 IP', 'gcp'],
          ['GCP', 'Cloud Router · BGP 피어 ← AWS ASN', 'gcp'],
        ] },
        { title: '출력 읽기', list: [
          'plan에서 <code>ip_address = (known after apply)</code>는 정상입니다. GCP 게이트웨이가 아직 없어서 IP를 모르니까요',
          'apply 출력에서 GCP 게이트웨이 <code>Creation complete</code> 뒤에야 AWS customer gateway의 <code>Creating...</code>가 나옵니다. 그래프가 순서를 지킨 것이에요',
          '게이트웨이가 교체되면 참조하던 AWS 쪽도 함께 <code>-/+</code>로 나옵니다. 콘솔이었다면 조용히 끊겼을 연결이 plan에 드러나는 것입니다',
        ] },
        { title: '실무 팁', body: [
          '양쪽 대역(<code>10.10.0.0/16</code>, <code>10.30.0.0/16</code>)이 겹치지 않아야 VPN이 의미가 있습니다. 대역 계획을 locals나 공통 변수 파일 한 곳에 모아 두면 두 클라우드 코드가 같은 표를 보게 됩니다. 네트워크 설계 자체는 멀티클라우드 네트워크 레슨에서 깊게 다룹니다.',
        ] },
      ],
    },
    {
      key: '터널은 UP', kind: 'case', title: '사례: apply는 성공, 터널도 UP, 통신은 불가',
      body: [
        'VPN 리소스가 모두 만들어지고 콘솔에서 터널 두 개가 UP입니다. 그런데 GCP의 분석 VM에서 AWS 서버로 ping이 하나도 가지 않아요.',
        '원인은 <b>터널 다음 단계</b>에 있었습니다. AWS 라우팅 테이블에 VPN 경로 전파가 꺼져 있었고, GCP 방화벽은 기본적으로 들어오는 트래픽을 막는데 AWS 대역을 허용하는 규칙이 없었어요. 둘 다 <b>코드에 없던 리소스</b>입니다.',
      ],
      callout: { type: 'key', text: '<code>Apply complete!</code>는 "적은 대로 만들었다"는 뜻이지 "동작한다"는 뜻이 아닙니다. 경로 · 방화벽까지 코드에 넣고, 연결 확인을 파이프라인에 둡니다.' },
      set: { aws: { state: 'hot', badge: '경로 없음', tone: 'bad' }, gcp: { badge: '인그레스 차단', tone: 'bad' } },
      code: { ref: 'ping', hl: [7, 8, 10, 11] },
      flows: [{ path: ['gcp', [1.7, -2.3], 'aws'], kind: 'bad', n: 3 }],
      metrics: { blast: ['연결 실패', 'bad'] },
      changes: [['+', 'aws_vpn_gateway_route_propagation'], ['+', 'google_compute_firewall (AWS 대역 허용)'], ['+', 'AWS 보안 그룹: GCP 대역 허용']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '터널 UP인데 ping 100% 손실', 'bad'],
          ['확인 1', 'AWS 라우팅 테이블에 10.30.0.0/16 없음', 'warn'],
          ['확인 2', 'GCP 방화벽에 10.10.0.0/16 허용 없음', 'warn'],
          ['해결', '경로 전파 · 방화벽 규칙을 코드로', 'ok'],
          ['재발 방지', 'apply 뒤 연결 확인 단계 자동화', 'ok'],
        ] },
        { title: '설정 예시', body: ['빠져 있던 두 조각입니다. 같은 구성에 넣어 VPN과 함께 리뷰되게 합니다.'], code: { title: 'vpn-routing.tf', lang: 'hcl', text: `# AWS: VPN으로 배운 경로를 라우팅 테이블에 반영
resource "aws_vpn_gateway_route_propagation" "gcp" {
  vpn_gateway_id = aws_vpn_gateway.vgw.id
  route_table_id = aws_route_table.private.id
}

# GCP: AWS 대역에서 들어오는 트래픽 허용
resource "google_compute_firewall" "from_aws" {
  name          = "allow-from-aws"
  network       = google_compute_network.ana.id
  direction     = "INGRESS"
  source_ranges = ["10.10.0.0/16"]

  allow {
    protocol = "tcp"
    ports    = ["443", "5432"]
  }
  allow {
    protocol = "icmp"
  }
}` } },
        { title: '더 생각해 볼 것', list: [
          '두 클라우드의 <b>기본 동작</b>이 다릅니다. GCP VPC는 들어오는 트래픽을 기본 차단하고, AWS 보안 그룹도 인바운드는 기본 차단이며, 경로 전파는 따로 켜야 합니다. Terraform은 이 기본값을 대신 정해 주지 않습니다',
          'BGP ASN이 양쪽 설정에서 어긋나면 터널은 UP이어도 BGP 세션이 맺어지지 않아 경로가 오가지 않습니다. ASN도 한 곳(locals)에서 참조하게 합니다',
        ] },
      ],
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
      set: { aws: { state: null, badge: null, sub: '서비스 (서울)' }, gcp: { sub: '분석', badge: null }, azure: { state: 'hot', badge: 'plan 실패', tone: 'bad' } },
      code: { ref: 'port', hl: [3, 8, 9, 14] },
      flows: [{ path: ['tf', 'azure'], kind: 'bad', n: 3, gap: 0.5 }],
      metrics: { tools: ['다시 설계', 'warn'], blast: '구성 하나' },
      changes: [['-', '리소스 종류가 없음'], ['-', '필수 인자 · 모델이 다름']],
      more: [
        { title: '실제로 옮겨야 하는 것', list: [
          '<b>네트워크 설계</b>: 리소스 그룹, VNet과 서브넷 범위, NSG 규칙',
          '<b>컴퓨트</b>: VM 크기 이름과 성능, 이미지, 디스크 종류',
          '<b>ID와 권한</b>: IAM 정책 → Azure RBAC 역할 할당, 관리 ID',
          '<b>데이터</b>: DB 덤프 · 복제, 객체 저장소 이전, 그동안의 쓰기 처리',
          '<b>운영</b>: 모니터링, 알림, 백업, 런북',
        ] },
        { title: '그래도 Terraform이라 쉬운 것', body: [
          '팀이 이미 HCL, plan 리뷰, state 관리, 모듈 구조, CI 파이프라인에 익숙하다는 것은 큰 자산입니다. 새 클라우드도 같은 저장소 구조와 같은 리뷰 절차로 시작할 수 있어요. <b>무엇을</b> 만들지는 새로 배우되, <b>어떻게</b> 만들고 바꾸는지는 그대로 가져갑니다.',
        ] },
        { title: '흔한 실수', list: [
          '"나중에 옮길 수 있게" 모든 것을 최소 공통분모로만 짬 → 지금의 클라우드에서도 좋은 기능을 못 쓰고, 정작 옮길 때는 데이터와 운영이 발목을 잡습니다',
          '이전 비용을 코드 줄 수로 어림함 → 실제 비용의 대부분은 데이터 이전, 테스트, 이중 운영 기간에서 나옵니다',
        ] },
      ],
    },
    {
      key: '모듈', kind: 'solution', title: '같은 모양은 모듈로 직접 만듭니다',
      body: [
        '여러 클라우드에 같은 모양이 필요하다면 그 추상화는 <b>내가 만듭니다</b>. 사업자별 모듈(<code>network-aws</code>, <code>network-gcp</code>)을 두고, 속은 각자의 리소스로 짜되 <b>입구(variable)와 출구(output)의 이름</b>을 맞춥니다.',
        '부르는 쪽은 이름과 대역만 넘기고, 결과도 같은 이름 <code>network_id</code>로 받습니다. 이름 규칙 · 태그 · 대역 계획 같은 팀의 규칙은 모듈 안에 한 번만 적어요.',
      ],
      callout: { type: 'warn', text: '모든 차이를 감추는 "만능 모듈"은 <b>최소 공통분모</b>가 됩니다. 정말 같은 부분만 감싸고 차이는 변수로 열어 두세요.' },
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
      more: [
        { title: '맞출 것과 열어 둘 것', rows: [
          ['맞춘다', '입력: name · cidr · tags', 'ok'],
          ['맞춘다', '출력: network_id · subnet_ids', 'ok'],
          ['맞춘다', '이름 규칙 · 필수 태그 · 대역 표', 'ok'],
          ['열어 둔다', 'AWS의 AZ 수, GCP의 리전 목록', 'info'],
          ['열어 둔다', '사업자 고유 기능 (흐름 로그 등)', 'info'],
        ] },
        { title: '태그와 라벨도 다릅니다', body: [
          '"모든 리소스에 Project 태그"라는 규칙도 클라우드마다 이름과 제약이 다릅니다. AWS와 Azure는 <b>태그</b>(대소문자 섞인 키 가능), GCP는 <b>라벨</b>(소문자 · 숫자 · <code>_</code> · <code>-</code>만)이에요. 공통 모듈의 locals에서 클라우드별로 변환해 넣으면 규칙은 하나로 유지됩니다.',
        ] },
        { title: '실무 팁', list: [
          '처음부터 공통 인터페이스를 설계하지 말고, 두 클라우드에서 <b>실제로 반복된 것</b>이 보일 때 맞춥니다',
          '출력 이름을 맞춰 두면 상위 구성(앱, 모니터링)이 클라우드를 몰라도 되는 범위가 넓어집니다',
        ] },
      ],
    },
    {
      key: '키 없는 인증', kind: 'compare', title: 'CI는 키 없이: OIDC 연합',
      body: [
        '노트북은 사람의 로그인을 쓰지만, CI에는 사람이 없습니다. 장기 키 네 벌을 CI 시크릿에 쌓아 두면 하나만 새도 그 클라우드가 열려요.',
        '그래서 CI는 <b>OIDC 연합</b>을 씁니다. CI가 발급받은 짧은 토큰을 각 클라우드가 검증하고, <b>수명이 짧은 임시 자격 증명</b>으로 바꿔 줘요. 연합을 쓸 수 없는 곳만 권한을 좁힌 키를 두고 주기적으로 교체합니다.',
      ],
      callout: { type: 'cloud', text: '원리는 같고, 클라우드마다 <b>신뢰를 등록하는 곳</b>의 이름만 다릅니다.' },
      hide: ['mod'],
      show: ['tf', 'azure', 'ncp'],
      set: { tf: { sub: 'CI 러너에서' } },
      tags: [
        { on: 'aws', text: 'OIDC 공급자 + 역할', tone: 'aws' },
        { on: 'gcp', text: 'Workload Identity', tone: 'gcp' },
        { on: 'ncp', text: 'API 인증키 (좁게)', tone: 'ncp', pos: 'bottom' },
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
      more: [
        { title: '클라우드별로', rows: [
          ['AWS', 'IAM OIDC 공급자 + 역할 신뢰 정책', 'aws'],
          ['Azure', '앱 등록 · 관리 ID의 페더레이션 자격 증명', 'azure'],
          ['GCP', 'Workload Identity 풀 · 공급자', 'gcp'],
          ['NCP', '권한을 좁힌 Sub Account의 API 인증키', 'ncp'],
        ] },
        { title: '동작 원리', body: [
          'CI 플랫폼은 작업마다 "이 토큰은 어느 저장소의 어느 브랜치 작업이 받았다"는 내용을 담은 짧은 OIDC 토큰을 발급합니다. 클라우드는 미리 등록한 신뢰 조건(발급자, 저장소, 브랜치나 환경)과 토큰을 대조해, 맞으면 정해진 역할의 임시 자격 증명을 내줘요. Terraform 프로바이더는 환경 변수로 그 자격 증명을 받아 씁니다.',
          '핵심은 <b>신뢰 조건을 좁게</b> 거는 것입니다. "이 저장소의 main 브랜치, prod 환경 작업만 prod 역할"처럼요. 조건을 저장소 단위로만 걸면 아무 브랜치의 작업이나 prod 권한을 받을 수 있습니다.',
        ] },
        { title: '흔한 실수', list: [
          '신뢰 조건에 와일드카드를 넓게 씀 → 포크나 다른 브랜치의 작업이 운영 역할을 받습니다',
          'plan용과 apply용 역할을 하나로 씀 → PR의 plan 단계는 <b>읽기 권한</b>만, 병합 후 apply만 쓰기 권한을 받게 나눕니다',
          'OIDC로 바꾼 뒤 예전 장기 키를 시크릿에 그대로 둠 → 쓰지 않는 키부터 폐기합니다',
        ] },
      ],
    },
    {
      key: 'state 나누기', kind: 'concept', title: 'state는 사업자 · 환경별로 나눕니다',
      body: [
        '네 클라우드를 state 하나에 담으면 plan마다 네 사업자의 API를 모두 부르고, <b>잠금도 하나</b>라 누가 apply하는 동안 모두 기다립니다. 한 사업자의 인증이 만료되면 나머지 셋의 plan까지 멈추고, 실수 하나가 네 클라우드에 닿아요.',
        '그래서 운영에서는 <b>사업자 × 환경</b>마다 state를 나눕니다. 둘을 잇는 VPN은 별도 스택이 되어 양쪽의 <b>output만 읽어</b> 옵니다.',
      ],
      callout: { type: 'tip', text: '스택 사이에 순서가 생기니 네트워크 → 연결 → 앱처럼 <b>아래층부터</b> apply하세요.' },
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
      more: [
        { title: '저장소 구조 예시', body: ['사업자와 환경, 층(네트워크 · 연결 · 앱)으로 루트를 나눕니다. 각 폴더가 자기 state를 가져요.'], code: { title: 'shop-infra/', lang: 'text', text: `stacks/
├── aws/prod/network/     state: aws/prod/network
├── gcp/prod/network/     state: gcp/prod/network
├── links/prod/aws-gcp/   state: vpn/prod
│     └── data "terraform_remote_state" × 2
├── aws/prod/app/
└── gcp/prod/analytics/
modules/
├── network-aws/
└── network-gcp/` } },
        { title: '나눌 때의 판단', list: [
          '<b>함께 바뀌는 것은 함께</b>: VPN 양쪽 리소스는 서로의 값을 주고받으므로 한 스택(links)에 둡니다',
          '<b>권한이 다른 것은 따로</b>: 네트워크 팀만 바꾸는 것과 앱 팀이 매일 바꾸는 것',
          '<b>인증 범위</b>: 한 스택이 쓰는 프로바이더가 적을수록 인증 실패의 영향이 작아집니다',
        ] },
        { title: '흔한 실수', list: [
          'links 스택이 상대 스택의 state를 읽는데, 상대가 output 이름을 바꿈 → links의 plan이 깨집니다. 스택 사이의 output은 API처럼 다룹니다',
          '아래층(network)을 고친 뒤 위층(links, app)의 plan을 안 돌려 봄 → 바뀐 ID를 위층이 모른 채로 남습니다. 파이프라인이 의존 순서대로 plan을 돌리게 합니다',
        ] },
      ],
    },
    {
      key: '안 되는 것', kind: 'concept', title: 'Terraform이 대신해 주지 않는 것들',
      body: [
        '정리하기 전에 경계를 분명히 합시다. Terraform은 각 클라우드의 API를 <b>그대로</b> 부를 뿐, 그 위의 규칙을 통일하지 않습니다. 권한 모델, 리전 이름, 할당량, 기본 방화벽 동작, 가격은 클라우드마다 다르고 그 차이는 그대로 남아요.',
        '그래서 멀티클라우드 팀에는 Terraform 실력과 함께 <b>클라우드별 모델을 아는 사람</b>이 필요합니다. 도구는 그 지식을 같은 절차로 적용하게 해 줄 뿐이에요.',
      ],
      callout: { type: 'key', text: '같은 것: 문법 · plan · state · 모듈 · 리뷰. 다른 것: <b>리소스 모델 · 권한 · 기본값 · 한도 · 비용</b>.' },
      hide: ['st_gcp', 'st_aws', 'st_link', 'e_vpn'],
      show: ['tf', 'azure', 'ncp'],
      set: { gcp: { at: [6.6, 2.6] } },
      panel: {
        title: '추상화되지 않는 것', icon: 'split',
        rows: [
          ['권한 모델', 'IAM 정책 · RBAC · IAM 바인딩', 'warn'],
          ['리전 이름', '서울 리전도 이름이 넷', 'info'],
          ['할당량 · 한도', '계정 · 구독 · 프로젝트마다', 'warn'],
          ['기본 동작', '방화벽 · 경로 · 암호화 기본값', 'warn'],
          ['비용', '같은 크기도 가격 모델이 다름', 'info'],
        ],
      },
      flows: [
        { path: ['tf', 'aws'], kind: 'ctrl' },
        { path: ['tf', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['tf', 'ncp'], kind: 'ctrl', delay: 0.6 },
        { path: ['tf', 'gcp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { tools: ['도구 하나 · 모델 넷', 'info'] },
      more: [
        { title: '서울 리전, 네 가지 이름', rows: [
          ['AWS', 'ap-northeast-2', 'aws'],
          ['Azure', 'koreacentral', 'azure'],
          ['GCP', 'asia-northeast3', 'gcp'],
          ['NCP', 'KR', 'ncp'],
        ] },
        { title: '자주 부딪히는 차이', list: [
          '<b>할당량</b>: plan은 통과했는데 apply에서 vCPU · IP 한도로 실패. 한도는 클라우드 콘솔이나 지원 요청으로 올리며, Terraform이 미리 알려 주지 않습니다',
          '<b>최종 일관성</b>: 방금 만든 IAM 역할을 다른 리소스가 바로 못 찾는 일이 있어, 프로바이더가 재시도하거나 잠시 기다려야 합니다',
          '<b>API 속도 제한</b>: 리소스가 많은 apply는 속도 제한에 걸려 느려집니다. <code>-parallelism</code>을 낮추는 것이 도움이 되기도 해요',
          '<b>삭제 의미</b>: 어떤 리소스는 삭제 후에도 일정 기간 이름을 재사용할 수 없습니다',
        ] },
        { title: '더 생각해 볼 것', body: [
          '이 챕터에서 Terraform으로 다룬 것은 "인프라를 어떻게 선언하고 바꾸는가"입니다. 그 변경을 누가, 언제, 어떤 검사를 거쳐 적용하는지는 다음 챕터의 CI/CD가, 클라우드 사이의 네트워크 · ID · 데이터 설계는 마지막 챕터가 이어서 다룹니다.',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 워크플로는 하나, 클라우드는 넷',
      body: [
        '<code>required_providers</code>에 프로바이더를 넷 적으면 한 구성이 네 클라우드를 다루고, <b>alias</b>와 모듈의 <code>providers</code>로 리전과 계정을 나눕니다. 리소스 모델 · 권한 · 기본값의 차이는 그대로이니, 같은 모양이 필요하면 <b>모듈</b>로 직접 감쌉니다.',
        '클라우드를 잇는 값은 참조로 흐르게 하고, 인증은 코드 밖에서 CI는 OIDC로, state는 사업자 · 환경별로 나눕니다. 다음 챕터에서는 이런 변경을 <b>CI/CD 파이프라인</b>이 적용하게 만듭니다.',
      ],
      show: ['e_vpn'],
      set: { gcp: { at: [1.4, 0] } },
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
      step: 4,
      why: '프로바이더 설정 하나는 리전 하나에 묶이고, 여러 벌이 필요하면 alias로 구분합니다. 환경 변수를 바꿔 두 번 apply해도 같은 state에는 버킷 주소가 하나뿐이라 버킷이 둘 생기지 않고, 두 apply가 서로를 덮어쓰려 합니다. required_providers는 어떤 플러그인을 쓸지 정할 뿐 리전과 무관합니다.',
    },
    {
      q: 'AWS용으로 잘 짠 Terraform 코드를 GCP로 옮기자는 제안이 나왔습니다. 가장 정확한 예상은?',
      options: [
        'provider 블록만 google로 바꾸면 그대로 동작한다',
        '리소스 종류 이름만 일괄 치환하면 된다',
        'Terraform의 변환 기능으로 자동 이전할 수 있다',
        '리소스 종류 · 인자 · 네트워크 모델이 달라 사실상 다시 설계해야 하고, 옮겨 가는 것은 워크플로와 팀의 관행이다',
      ],
      answer: 3,
      step: 9,
      why: '리소스는 프로바이더가 정의하므로 사업자마다 다릅니다. GCP의 VPC는 글로벌이고 대역은 서브넷에 있는 것처럼 모델 자체가 달라, 이름을 바꾸는 정도로는 끝나지 않습니다. Terraform에 그런 자동 변환 기능은 없습니다. 옮겨 가는 것은 HCL, plan 리뷰, 모듈 구조 같은 작업 방식입니다.',
    },
    {
      q: '네 클라우드를 state 하나로 관리하던 중 Azure 자격 증명이 만료됐습니다. 무슨 일이 생기고, 어떻게 바꾸는 게 좋을까요?',
      options: [
        'Azure 리소스만 plan에서 빠지고 나머지는 정상 진행된다',
        'Terraform이 Azure 리소스를 삭제 대상으로 표시한다',
        '구성 전체의 plan이 실패해 다른 클라우드 작업도 막힌다. 사업자 · 환경별로 state를 나눈다',
        '아무 일도 없다. 자격 증명은 apply 때만 쓰인다',
      ],
      answer: 2,
      step: 12,
      why: 'plan도 기존 리소스를 조회하느라 모든 프로바이더의 API를 부르므로, 한 곳의 인증 실패가 구성 전체를 멈춥니다. 조회에 실패했다고 삭제 계획을 세우지는 않습니다. state를 사업자 · 환경별로 나누면 장애와 잠금이 그 스택 안에 머뭅니다.',
    },
    {
      q: 'AWS customer gateway에 GCP HA VPN 게이트웨이의 공인 IP를 넣어야 합니다. 가장 좋은 방법은?',
      options: [
        '같은 구성에서 GCP 리소스의 속성을 참조하거나, 나눈 스택이라면 그쪽 output을 읽는다',
        'GCP 콘솔에서 IP를 확인해 ip_address에 문자열로 적는다',
        'apply를 두 번 실행하면 Terraform이 알아서 채운다',
        'AWS와 GCP 리소스는 한 구성에 둘 수 없으니 스크립트로 옮긴다',
      ],
      answer: 0,
      step: 7,
      why: '참조로 적으면 Terraform이 GCP 게이트웨이를 먼저 만들고 그 값을 넘기는 순서를 계산하며, 게이트웨이가 다시 만들어져 IP가 바뀌어도 따라갑니다. 문자열로 적으면 콘솔 복사와 다를 바 없고, IP가 바뀌는 순간 조용히 끊깁니다. 서로 다른 프로바이더의 리소스도 한 구성에 함께 둘 수 있습니다.',
    },
    {
      q: 'VPN apply는 성공했고 터널도 UP인데, GCP VM에서 AWS 서버로 통신이 안 됩니다. 먼저 확인할 것은?',
      options: [
        'Terraform 버전을 올린다',
        'AWS 라우팅 테이블에 GCP 대역 경로가 있는지(경로 전파), GCP 방화벽과 AWS 보안 그룹이 상대 대역을 허용하는지',
        'VPN 연결을 지우고 다시 만든다',
        'state를 새로고침한다',
      ],
      answer: 1,
      step: 8,
      why: '터널이 UP이면 암호화된 통로는 열린 것이고, 남은 것은 경로와 방화벽입니다. AWS는 VPN 경로 전파를 켜야 라우팅 테이블에 상대 대역이 들어가고, GCP 방화벽과 AWS 보안 그룹은 인바운드를 기본 차단합니다. 다시 만들거나 Terraform 버전을 올려도 빠진 리소스는 생기지 않습니다.',
    },
    {
      q: '같은 백업 모듈을 서울과 도쿄에 한 벌씩 만들려 합니다. 모듈 안에는 provider 블록이 없습니다. 도쿄 쪽은 어떻게 부를까요?',
      options: [
        '모듈 안에 provider "aws" { region = "ap-northeast-1" }를 추가한다',
        '도쿄용 모듈 폴더를 복사해 리전만 바꾼다',
        '모듈 블록에 region = "ap-northeast-1" 인자를 준다',
        '모듈 블록에 providers = { aws = aws.tokyo }를 넘긴다',
      ],
      answer: 3,
      step: 5,
      why: '모듈은 부르는 쪽이 넘겨준 프로바이더 설정을 씁니다. providers로 aws.tokyo를 넘기면 같은 모듈 코드가 도쿄에 만들어져요. 모듈 안에 provider 블록을 두면 리전이 박혀 재사용과 for_each가 어려워지고, 폴더 복사는 복사본 문제를 다시 만듭니다. region은 모듈이 그런 변수를 선언하지 않았다면 받을 수 없는 인자입니다.',
    },
    {
      q: 'CI에서 네 클라우드에 apply합니다. 현재 장기 액세스 키 네 벌이 CI 시크릿에 있습니다. 가장 먼저 바꿀 것은?',
      options: [
        '키를 더 긴 무작위 문자열로 바꾼다',
        '키를 tfvars 파일로 옮긴다',
        '지원되는 클라우드는 OIDC 연합으로 임시 자격 증명을 받게 하고, 신뢰 조건을 저장소 · 브랜치 · 환경으로 좁힌다',
        '키를 provider 블록에 직접 적어 관리 지점을 하나로 모은다',
      ],
      answer: 2,
      step: 11,
      why: 'OIDC 연합은 작업마다 짧게 사는 자격 증명을 받으므로 새도 피해가 짧고, 보관할 장기 키가 없습니다. 신뢰 조건을 좁혀야 다른 브랜치나 포크가 운영 권한을 받지 못합니다. 키를 파일이나 코드에 적는 것은 유출 위험을 키우고, 길이를 늘려도 장기 키라는 문제는 그대로입니다.',
    },
    {
      q: 'prod 폴더에서 plan을 돌렸는데 dev 계정의 리소스를 조회하고 있었습니다. 터미널의 AWS_PROFILE이 dev였습니다. 구조적으로 막으려면?',
      options: [
        'prod 폴더의 provider에 assume_role로 prod 계정의 역할을 명시해, 다른 계정의 자격 증명으로는 실패하게 한다',
        'AWS_PROFILE을 매번 확인하라고 공지한다',
        'prod 폴더 이름을 대문자로 바꾼다',
        'dev 계정을 지운다',
      ],
      answer: 0,
      step: 3,
      why: '프로바이더는 폴더가 아니라 찾은 자격 증명을 따릅니다. prod 폴더가 prod 계정의 역할을 명시적으로 넘겨받게 하면, 엉뚱한 프로필에서 실행해도 역할을 받지 못해 오류로 드러납니다. 공지나 이름 규칙은 사람의 주의에 기대는 방법입니다.',
    },
    {
      q: '팀이 "모든 클라우드의 차이를 감추는 만능 network 모듈"을 만들자고 합니다. 가장 알맞은 조언은?',
      options: [
        '좋다. 차이를 모두 감추면 클라우드를 자유롭게 바꿀 수 있다',
        '정말 같은 부분(입력 · 출력 이름, 이름 규칙, 태그)만 맞추고, 사업자 고유 기능과 차이는 변수로 열어 둔다',
        '모듈은 한 클라우드에서만 쓸 수 있으니 불가능하다',
        '네 클라우드를 한 리소스 종류로 합쳐 주는 프로바이더를 찾는다',
      ],
      answer: 1,
      step: 10,
      why: '모든 차이를 감추면 최소 공통분모가 되어 각 클라우드의 좋은 기능을 쓸 수 없게 됩니다. 사업자별 모듈의 속은 다르게 두고 입구와 출구만 맞추면, 상위 구성은 단순해지면서도 고유 기능은 살릴 수 있어요. 클라우드를 자유롭게 바꾸는 데는 데이터와 운영이 더 큰 장벽입니다.',
    },
    {
      q: 'AWS · GCP VPN을 사업자별 스택으로 나눴습니다. VPN 연결 리소스는 어디에 두는 것이 좋을까요?',
      options: [
        'AWS 스택과 GCP 스택에 반씩 나눠 두고, 값은 사람이 옮긴다',
        'AWS 스택에 전부 두고 GCP 값은 문자열로 적는다',
        '두 스택이 같은 리소스를 함께 관리하게 import한다',
        '별도의 연결 스택을 두고, 양쪽 네트워크 스택의 output을 읽어 VPN 양쪽 리소스를 함께 관리한다',
      ],
      answer: 3,
      step: 12,
      why: 'VPN 양쪽은 서로의 값을 주고받으므로 함께 바뀌어야 하고, 한 스택에 두면 참조로 이을 수 있습니다. 네트워크 스택의 output만 읽으면 의존 방향도 분명해요. 반씩 나누면 다시 사람이 값을 옮기게 되고, 두 state가 같은 리소스를 관리하면 서로의 변경을 덮어씁니다.',
    },
    {
      q: '멀티클라우드 apply에서 plan은 통과했는데, apply 중 GCP 쪽만 "할당량 초과" 오류로 실패했습니다. 이 상황에 대한 올바른 이해는?',
      options: [
        '할당량은 클라우드마다 따로 관리되며 Terraform이 plan에서 미리 검사하지 않는다. 한도를 올리거나 요청을 줄인 뒤 다시 apply한다',
        'Terraform 버그이므로 프로바이더를 바꾼다',
        'plan이 통과했으니 실제로는 만들어졌다',
        'AWS 쪽 리소스도 모두 자동으로 롤백된다',
      ],
      answer: 0,
      step: 13,
      why: '할당량과 한도는 각 클라우드의 계정 · 구독 · 프로젝트 규칙이라 Terraform이 추상화하거나 plan에서 검사하지 않습니다. 실패한 리소스만 남고 성공한 것은 state에 기록되며, 롤백은 없습니다. 원인을 고친 뒤 다시 apply하면 차이만 메웁니다.',
    },
    {
      q: 'NCP 리소스를 같은 구성에 추가했더니 init이 "hashicorp/ncloud를 찾을 수 없다"며 실패합니다. 원인과 해결은?',
      options: [
        'NCP는 Terraform을 지원하지 않는다',
        'required_providers에 ncloud의 source를 NaverCloudPlatform/ncloud로 적지 않아 기본 네임스페이스로 찾았다. 출처를 명시한다',
        'init -upgrade로 실행하면 된다',
        'NCLOUD_ACCESS_KEY를 설정하지 않아서다',
      ],
      answer: 1,
      step: 2,
      why: 'required_providers에 출처가 없으면 Terraform은 hashicorp 네임스페이스로 추측합니다. NCP 프로바이더는 네이버 클라우드가 관리해 NaverCloudPlatform/ncloud가 출처예요. 인증키는 init이 아니라 plan · apply 때 쓰이므로 이 오류와 무관합니다.',
    },
  ],
};
