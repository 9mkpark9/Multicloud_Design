export default {
  id: 'tf-workflow',
  learn: [
    'HCL 블록과 provider · 버전 제약 · init',
    'resource · data, 참조가 만드는 의존성 그래프',
    'plan 출력의 + / ~ / -/+ / +/- / - 읽는 법',
    'apply가 실패하면: 롤백 없는 재실행',
    'lifecycle로 교체와 삭제 다스리기',
    'destroy가 실제로 하는 일',
  ],
  legend: [['ctrl', 'API 호출'], ['res', '조회 결과'], ['build', '플러그인 · 파일'], ['data', '참조되는 값'], ['bad', '삭제 · 실패']],
  metrics: [
    { id: 'cmd', label: '지금 명령', icon: 'terminal' },
    { id: 'prov', label: '프로바이더', icon: 'plug' },
    { id: 'plan', label: '계획', icon: 'clipboard-list' },
    { id: 'real', label: '실제 리소스', icon: 'boxes' },
  ],
  scene: {
    zones: {
      vpc: { at: [6.5, -1.2], size: [4.4, 3.9], label: 'VPC 10.0.0.0/16', color: 'purple' },
      subnet: { at: [6.8, -0.9], size: [3.8, 3.0], label: '서브넷 10.0.1.0/24', color: 'green' },
    },
    nodes: {
      dev: { kind: 'client', at: [0.2, 3.8], label: '개발자' },
      file: { kind: 'tile', at: [2, 2], label: 'main.tf', icon: 'file-code', color: 'olive' },
      tf: { at: [3.8, 0.2], label: 'Terraform', sub: 'CLI', icon: 'terminal', color: 'olive' },
      prov: { at: [5.6, -1.6], size: 's', label: 'provider', sub: 'aws 플러그인', icon: 'plug', color: 'orange' },
      api: { at: [7.4, -3.4], label: 'AWS API', icon: 'cloud', color: 'aws' },
      reg: { kind: 'cyl', at: [3.4, -3.8], label: 'Terraform Registry', icon: 'package', color: 'slate' },
      lockf: { kind: 'tile', at: [2.0, 2.0], label: 'lock 파일', icon: 'lock', color: 'slate' },
      ami: { kind: 'tile', at: [9.2, -1.6], label: 'AMI (이미 있음)', icon: 'image', color: 'gray' },
      web: { at: [7.7, 0.9], label: 'EC2', sub: 'web', icon: 'server', color: 'orange' },
      web2: { at: [9.5, -0.5], label: 'EC2', sub: 'web (새것)', icon: 'server', color: 'orange' },
      b_logs: { kind: 'cyl', at: [9.8, -3.4], label: 'shop-logs', icon: 'archive', color: 'green' },
      b_assets: { kind: 'cyl', at: [7.4, -5.8], label: 'shop-assets', icon: 'archive', color: 'red' },

      g_vpc: { at: [0.2, 3.8], label: 'VPC', sub: 'aws_vpc.main', icon: 'network', color: 'purple' },
      g_sub: { at: [2, 2], label: '서브넷', sub: 'aws_subnet', icon: 'cells', color: 'green' },
      g_web: { at: [3.8, 0.2], label: '인스턴스', sub: 'aws_instance', icon: 'server', color: 'orange' },
      g_ami: { at: [1.2, -2.4], label: 'AMI 조회', sub: 'data', icon: 'search', color: 'gray' },
    },
    edges: {
      e_dev_file: { from: 'dev', to: 'file' },
      e_file_tf: { from: 'file', to: 'tf' },
      e_tf_prov: { from: 'tf', to: 'prov' },
      e_prov_api: { from: 'prov', to: 'api' },
      e_tf_reg: { from: 'tf', to: 'reg', style: 'dashed' },
      e_reg_prov: { from: 'reg', to: 'prov' },
      e_tf_lock: { from: 'tf', to: 'lockf', style: 'dashed' },
      e_api_ami: { from: 'api', to: 'ami', style: 'dashed' },
      e_api_web: { from: 'api', to: 'web' },
      e_api_web2: { from: 'api', to: 'web2' },
      e_api_logs: { from: 'api', to: 'b_logs' },
      e_api_assets: { from: 'api', to: 'b_assets' },
      e_g1: { from: 'g_vpc', to: 'g_sub' },
      e_g2: { from: 'g_sub', to: 'g_web' },
      e_g3: { from: 'g_ami', to: 'g_web' },
    },
  },
  codes: {
    main: {
      title: 'main.tf', lang: 'hcl',
      text: `provider "aws" {
  region = "ap-northeast-2"
}

data "aws_ami" "linux" {
  most_recent = true
  owners      = ["amazon"]
  name_regex  = "^al2023-ami-2023.*-x86_64$"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}
resource "aws_subnet" "app" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}
resource "aws_instance" "web" {
  ami           = data.aws_ami.linux.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.app.id
}
`,
    },
    versions: {
      title: 'versions.tf', lang: 'hcl',
      text: `terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# 버전 제약 읽는 법
#   = 6.2.0    정확히 이 버전만
#   >= 6.0     6.0 이상 전부 (7, 8도)
#   ~> 6.0     6.x 전부, 7.0 미만
#   ~> 6.2.0   6.2.x 만, 6.3 미만
`,
    },
    init: {
      title: '터미널', lang: 'sh',
      text: `$ terraform init

Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching
  "~> 6.0"...
- Installing hashicorp/aws v6.2.0...
- Installed hashicorp/aws v6.2.0
  (signed by HashiCorp)

Terraform has created a lock file
.terraform.lock.hcl to record the provider
selections it made above.

Terraform has been successfully initialized!
`,
    },
    plan: {
      title: '터미널', lang: 'sh',
      text: `$ terraform plan

# aws_instance.web will be created
+ resource "aws_instance" "web" {
    + ami           = "ami-0f1e2d3c4b5a69788"
    + instance_type = "t3.micro"
    + subnet_id     = (known after apply)
  }

# aws_subnet.app will be created
+ resource "aws_subnet" "app" {
    + cidr_block = "10.0.1.0/24"
    + vpc_id     = (known after apply)
  }

# aws_vpc.main will be created
+ resource "aws_vpc" "main" {
    + cidr_block = "10.0.0.0/16"
    + id         = (known after apply)
  }

Plan: 3 to add, 0 to change, 0 to destroy.
`,
    },
    apply: {
      title: '터미널', lang: 'sh',
      text: `$ terraform apply

Plan: 3 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  Enter a value: yes

aws_vpc.main: Creating...
aws_vpc.main: Creation complete after 2s
  [id=vpc-0a1b2c3d4e5f67890]
aws_subnet.app: Creating...
aws_subnet.app: Creation complete after 1s
  [id=subnet-0b2c3d4e5f6a78901]
aws_instance.web: Creating...
aws_instance.web: Creation complete after 13s
  [id=i-0c3d4e5f6a7b89012]

Apply complete! Resources: 3 added,
0 changed, 0 destroyed.
`,
    },
    fail: {
      title: '터미널', lang: 'sh',
      text: `$ terraform apply
...
aws_s3_bucket.logs: Creating...
aws_s3_bucket.logs: Creation complete
  after 1s [id=shop-logs-7f3a]
aws_s3_bucket.assets: Creating...

Error: creating S3 Bucket (shop-assets):
  operation error S3: CreateBucket,
  StatusCode: 409, BucketAlreadyExists

  with aws_s3_bucket.assets,
  on storage.tf line 5, in resource
  "aws_s3_bucket" "assets":
`,
    },
    change: {
      title: '터미널', lang: 'sh',
      text: `$ terraform plan

# aws_vpc.main will be updated in-place
~ resource "aws_vpc" "main" {
      id   = "vpc-0a1b2c3d4e5f67890"
    ~ tags = {
        + "Name" = "shop"
      }
  }

# aws_instance.web must be replaced
-/+ resource "aws_instance" "web" {
    ~ ami = "ami-0f1e…" -> "ami-07aa…"
          # forces replacement
    ~ id  = "i-0c3d…" -> (known after apply)
  }

Plan: 1 to add, 1 to change, 1 to destroy.
`,
    },
    life: {
      title: 'main.tf', lang: 'hcl',
      text: `resource "aws_instance" "web" {
  ami           = var.web_ami # 고정값
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.app.id

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [tags["Scan"]]
  }
}

resource "aws_db_instance" "shop" {
  # ... 엔진 · 크기 · 비밀번호 생략
  deletion_protection = true

  lifecycle {
    prevent_destroy = true
  }
}
`,
    },
    destroy: {
      title: '터미널', lang: 'sh',
      text: `$ terraform destroy

# aws_instance.web will be destroyed
- resource "aws_instance" "web" {
    - instance_type = "t3.micro" -> null
    ...
  }

Plan: 0 to add, 0 to change, 5 to destroy.

aws_s3_bucket.logs: Destroying...
...
aws_instance.web: Destroying...
aws_instance.web: Destruction complete after 41s
aws_subnet.app: Destroying...
aws_subnet.app: Destruction complete after 1s
aws_vpc.main: Destroying...
aws_vpc.main: Destruction complete after 1s

Destroy complete! Resources: 5 destroyed.
`,
    },
  },
  steps: [
    {
      key: 'main.tf', kind: 'problem', title: '이 파일은 어떻게 VPC가 될까요',
      body: [
        '지난 레슨에서 인프라를 선언형 코드로 적기로 했습니다. 왼쪽이 오늘 끝까지 따라갈 <code>main.tf</code>입니다. VPC 하나, 서브넷 하나, 서버 한 대가 전부예요.',
        '<b>Terraform</b>은 이런 <code>.tf</code> 파일을 읽어 실제 인프라로 만드는 명령줄 도구입니다. 문법은 <b>HCL</b>이고, 파일은 <code>종류 "라벨" { 인자 = 값 }</code> 모양의 <b>블록</b>으로 이루어집니다. 그런데 텍스트 파일이 어떻게 AWS 안의 VPC가 될까요?',
      ],
      callout: { type: 'key', text: '같은 폴더의 <code>.tf</code> 파일은 전부 합쳐서 한 구성으로 읽습니다. 파일을 나누는 것은 사람을 위한 정리일 뿐이에요.' },
      show: ['dev', 'file', 'tf'],
      code: { ref: 'main' },
      flows: [{ path: ['dev', 'file'], kind: 'build' }, { path: ['file', 'tf'], kind: 'build', delay: 1 }],
      metrics: { cmd: '편집', prov: ['미설치', 'warn'], plan: '-', real: '0개' },
      more: [
        { title: 'HCL 블록 해부', rows: [
          ['resource', '블록 종류 (무엇을 선언하나)', 'info'],
          ['"aws_vpc"', '첫 라벨: 리소스 종류', 'info'],
          ['"main"', '둘째 라벨: 이 코드 안의 이름', 'info'],
          ['cidr_block = "…"', '인자: 이름 = 표현식', 'accent'],
          ['aws_vpc.main.id', '참조: 다른 블록의 속성', 'accent'],
        ] },
        { title: '파일을 나누는 관례', body: [
          '한 폴더의 <code>.tf</code>는 모두 합쳐지므로 파일 이름은 자유지만, 팀마다 흔히 쓰는 모양이 있습니다. <code>versions.tf</code>(Terraform · 프로바이더 버전), <code>providers.tf</code>, <code>main.tf</code>(리소스), <code>variables.tf</code>, <code>outputs.tf</code>. 리소스가 많아지면 <code>network.tf</code>, <code>compute.tf</code>처럼 주제별로 나눕니다.',
          '하위 폴더는 합쳐지지 <b>않습니다</b>. 하위 폴더는 별도의 모듈이 되며, 모듈 레슨에서 다룹니다.',
        ] },
        { title: '직접 해보기', body: ['코드를 쓰고 나면 실행 전에 모양과 문법부터 확인합니다. 둘 다 클라우드를 건드리지 않아요.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform fmt        # 들여쓰기 · 정렬 자동 정리
main.tf
$ terraform validate   # 문법 · 참조 · 타입 검사
Success! The configuration is valid.` } },
      ],
    },
    {
      key: 'provider', kind: 'concept', title: 'provider: 클라우드와 통역하는 플러그인',
      body: [
        'Terraform 본체는 AWS를 모릅니다. VPC를 만드는 API가 무엇인지, 어떤 인자가 필요한지는 <b>프로바이더(provider)</b>라는 플러그인이 압니다. 본체는 계획을 세우고, 프로바이더가 실제 API를 호출해요.',
        '<code>provider "aws"</code> 블록은 그 플러그인의 설정입니다. 여기서는 리전을 서울(<code>ap-northeast-2</code>)로 정했습니다. 이 구성의 AWS 리소스는 모두 이 리전에 만들어집니다.',
      ],
      callout: { type: 'tip', text: '액세스 키는 이 블록에 적지 않습니다. 프로바이더가 환경 변수나 AWS CLI에 저장해 둔 자격 증명을 알아서 찾아 써요.' },
      hide: ['dev', 'file'],
      show: ['prov', 'api'],
      focus: ['prov'],
      code: { ref: 'main', hl: [1, 2, 3] },
      flows: [{ path: ['tf', 'prov', 'api'], kind: 'ctrl', n: 2 }],
      tags: [{ on: 'prov', text: 'API 호출 담당', tone: 'accent', pos: 'bottom' }],
      more: [
        { title: '동작 원리', body: [
          '프로바이더는 Terraform과 <b>별개의 실행 파일</b>입니다. Terraform은 plan · apply 때 프로바이더 프로세스를 띄우고 RPC로 대화해요. "이 리소스의 스키마는?", "이 속성을 바꾸면 교체가 필요한가?", "이걸 만들어 줘." 그래서 AWS에 새 서비스가 나와도 Terraform 본체는 그대로이고, 프로바이더 새 버전만 나오면 쓸 수 있습니다.',
          '자격 증명은 프로바이더가 정해진 순서로 찾습니다. AWS라면 환경 변수(<code>AWS_ACCESS_KEY_ID</code>, <code>AWS_PROFILE</code>) → 공유 설정 파일(<code>~/.aws/config</code>, SSO 로그인 포함) → 실행 위치의 역할(EC2 인스턴스 역할, CI의 OIDC 역할) 순이에요.',
        ] },
        { title: '설정 예시', body: ['모든 리소스에 같은 태그를 붙이는 <code>default_tags</code>는 비용 추적에 특히 유용합니다.'], code: { title: 'providers.tf', lang: 'hcl', text: `provider "aws" {
  region = "ap-northeast-2"

  default_tags {
    tags = {
      Project = "shop"
      Managed = "terraform"
    }
  }
}` } },
        { title: '클라우드별로', rows: [
          ['AWS (aws)', 'region', 'aws'],
          ['Azure (azurerm)', 'features {} · subscription_id', 'azure'],
          ['GCP (google)', 'project · region', 'gcp'],
          ['NCP (ncloud)', 'region · API 인증키', 'ncp'],
        ] },
      ],
    },
    {
      key: '버전 제약', kind: 'concept', title: '어떤 버전을 쓸지 먼저 적습니다',
      body: [
        '프로바이더도 소프트웨어라 계속 새 버전이 나오고, <b>메이저 버전</b>이 오르면 인자 이름이나 기본값이 바뀝니다. 그래서 <code>terraform</code> 블록의 <b>required_providers</b>에 출처(<code>source</code>)와 <b>허용 범위</b>(<code>version</code>)를 적습니다.',
        '<code>~> 6.0</code>은 "6.x는 받되 7.0은 안 된다"는 뜻이에요. <code>required_version</code>은 Terraform 본체의 버전 범위입니다.',
      ],
      callout: { type: 'warn', text: '범위를 안 적으면 init은 <b>그때의 최신</b>을 받습니다. 몇 달 뒤 새로 init한 동료는 다른 메이저 버전으로 같은 코드를 돌리게 돼요.' },
      code: { ref: 'versions', hl: [4, 5, 6, 7, 15] },
      tags: [{ on: 'prov', text: 'version = "~> 6.0"', tone: 'accent', pos: 'bottom' }],
      flows: [{ path: ['tf', 'prov'], kind: 'build' }],
      more: [
        { title: '동작 원리', body: [
          '<code>source = "hashicorp/aws"</code>는 <code>registry.terraform.io/hashicorp/aws</code>의 줄임말입니다. <b>호스트/네임스페이스/종류</b>의 세 부분이고, 호스트를 생략하면 공개 Terraform Registry를 뜻해요. NCP처럼 사업자가 직접 관리하는 프로바이더는 네임스페이스가 다릅니다(<code>NaverCloudPlatform/ncloud</code>).',
          '<code>~></code>(비관적 제약)는 <b>가장 오른쪽 자리만</b> 올라가게 허용합니다. <code>~> 6.0</code>은 6.1, 6.9는 되지만 7.0은 안 되고, <code>~> 6.2.0</code>은 6.2.x 패치만 받습니다.',
        ] },
        { title: '실무 팁', list: [
          '루트 구성에서는 <code>~> 메이저.마이너</code> 정도로 범위를 좁히고, 정확한 버전은 lock 파일(다음 단계)에 맡깁니다',
          '여러 곳에서 쓰는 모듈은 반대로 <code>>= 6.0</code>처럼 <b>최소 버전만</b> 적어, 호출하는 쪽이 범위를 좁히게 둡니다',
          '<code>required_version</code>을 적어 두면 너무 오래된 Terraform으로 실행할 때 처음부터 명확한 오류로 멈춥니다',
        ] },
        { title: '흔한 실수', list: [
          '<code>version = ">= 5.0"</code>만 적음 → 7.0이 나오면 그대로 받아 plan이 갑자기 달라집니다',
          '<code>required_providers</code>를 빼먹음 → 프로바이더 이름만으로 추측하는데, <code>hashicorp</code>가 아닌 프로바이더는 찾지 못해 init이 실패합니다',
        ] },
      ],
    },
    {
      key: 'init', kind: 'concept', title: 'terraform init: 프로바이더 내려받기',
      body: [
        '프로바이더는 Terraform에 들어 있지 않습니다. 작업 폴더에서 맨 처음 <code>terraform init</code>을 실행하면, 범위에 맞는 프로바이더를 <b>Terraform Registry</b>에서 내려받아 <code>.terraform/</code> 폴더에 넣습니다.',
        '이때 고른 버전과 체크섬이 <code>.terraform.lock.hcl</code>에 기록됩니다. 이 파일을 Git에 커밋해 두면 동료와 CI가 똑같은 버전을 쓰게 돼요. init은 클라우드에 아직 아무 일도 하지 않습니다.',
      ],
      callout: { type: 'tip', text: '<code>init</code>은 여러 번 실행해도 안전합니다. 프로바이더 · 모듈 · 백엔드 설정을 바꿨을 때 다시 실행하면 돼요.' },
      hide: ['api'],
      show: ['reg', 'lockf'],
      code: { ref: 'init', hl: [5, 6, 7, 11, 12] },
      flows: [{ path: ['tf', 'reg'], kind: 'ctrl' }, { path: ['reg', 'prov'], kind: 'build', n: 2, delay: 1.2 }, { path: ['tf', 'lockf'], kind: 'build', delay: 2.4 }],
      metrics: { cmd: 'init', prov: ['설치됨', 'ok'] },
      changes: [['+', '.terraform/ 안에 aws 프로바이더'], ['+', '.terraform.lock.hcl (버전 기록)']],
      more: [
        { title: 'init이 하는 일 세 가지', list: [
          '<b>프로바이더</b>: 범위에 맞는 버전을 골라 <code>.terraform/providers/</code>에 설치',
          '<b>모듈</b>: <code>module</code> 블록의 source를 <code>.terraform/modules/</code>로 내려받기',
          '<b>백엔드</b>: state를 어디에 둘지 연결 (state 레슨에서 봅니다)',
        ] },
        { title: '출력 읽기', body: ['lock 파일에는 고른 버전, 그 버전을 고를 때의 범위, 그리고 내려받은 파일이 바뀌지 않았음을 확인할 체크섬이 들어 있습니다.'], code: { title: '.terraform.lock.hcl', lang: 'hcl', text: `provider "registry.terraform.io/hashicorp/aws" {
  version     = "6.2.0"
  constraints = "~> 6.0"
  hashes = [
    "h1:3fQ…=",
    "zh:0a1b…",
    # 플랫폼별 체크섬이 이어집니다
  ]
}` } },
        { title: '실무 팁', list: [
          '<code>.terraform/</code>는 <b>커밋하지 않고</b>(용량 큰 바이너리), <code>.terraform.lock.hcl</code>은 <b>커밋합니다</b>',
          '노트북은 macOS, CI는 Linux라면 lock 파일에 두 플랫폼의 체크섬이 모두 있어야 합니다. <code>terraform providers lock -platform=linux_amd64 -platform=darwin_arm64</code>로 함께 기록해요',
          '범위 안에서 새 버전으로 올리려면 <code>terraform init -upgrade</code>. 올라간 lock 파일은 PR에서 리뷰합니다',
        ] },
      ],
    },
    {
      key: 'resource·data', kind: 'concept', title: 'resource는 만들 것, data는 읽을 것',
      body: [
        '<b>resource</b> 블록은 Terraform이 <b>만들고 관리할</b> 대상입니다. <code>resource "aws_vpc" "main"</code>에서 <code>aws_vpc</code>는 프로바이더가 정한 리소스 종류, <code>main</code>은 이 코드 안에서 부르는 이름이에요. 둘을 합친 <code>aws_vpc.main</code>이 주소가 됩니다.',
        '<b>data</b> 블록은 <b>이미 있는 것을 읽기만</b> 합니다. 여기서는 Amazon이 배포하는 Amazon Linux 2023 이미지 가운데 가장 최신 AMI의 ID를 조회해요. 만들지도 지우지도 않습니다.',
      ],
      callout: { type: 'key', text: '판단 기준은 <b>수명을 누가 쥐는가</b>입니다. 이 코드가 책임지면 resource, 남이 관리하는 것을 참조만 하면 data.' },
      hide: ['reg', 'lockf'],
      show: ['api', 'ami'],
      code: { ref: 'main', hl: [5, 6, 7, 8, 9, 11, 12, 13] },
      flows: [{ path: ['tf', 'prov', 'api', 'ami'], kind: 'ctrl' }, { path: ['ami', 'api', 'prov', 'tf'], kind: 'res', delay: 1.8 }],
      tags: [{ on: 'ami', text: 'data: 읽기만', tone: 'info', pos: 'bottom' }],
      more: [
        { title: '주소 읽는 법', rows: [
          ['aws_vpc.main', 'resource의 주소', 'accent'],
          ['aws_vpc.main.id', '그 리소스의 속성', 'accent'],
          ['data.aws_ami.linux', 'data의 주소 (data. 접두사)', 'info'],
          ['aws_instance.web[0]', 'count로 만든 것의 하나', 'mute'],
        ] },
        { title: '직접 해보기', body: ['<code>terraform console</code>에서 표현식을 바로 계산해 볼 수 있습니다. data 조회 결과를 확인할 때 편해요.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform console
> data.aws_ami.linux.id
"ami-0f1e2d3c4b5a69788"
> data.aws_ami.linux.name
"al2023-ami-2023.6.20250101.0-kernel-6.1-x86_64"
> upper("shop")
"SHOP"` } },
        { title: '모든 블록에 붙는 메타 인자', body: [
          'resource에는 프로바이더가 정한 인자 말고도 Terraform이 공통으로 제공하는 <b>메타 인자</b>가 있습니다. <code>count</code> · <code>for_each</code>(여러 개 만들기, 모듈 레슨), <code>depends_on</code>(숨은 순서, 다음 단계), <code>provider</code>(다른 리전 · 계정, 멀티 프로바이더 레슨), <code>lifecycle</code>(교체 · 삭제 규칙, 뒤의 단계). 이름이 모든 리소스에서 같으니 한 번 익히면 어느 클라우드에서나 씁니다.',
        ] },
      ],
    },
    {
      key: '의존성 그래프', kind: 'concept', title: '참조가 곧 생성 순서입니다',
      body: [
        '서브넷의 <code>vpc_id = aws_vpc.main.id</code>를 보세요. 다른 리소스의 속성을 가리키는 이런 <b>참조</b>는 값을 전달하면서 동시에 <b>의존 관계</b>를 선언합니다. VPC의 ID는 만들어져야 생기니, VPC가 먼저여야 하죠.',
        'Terraform은 모든 참조를 모아 <b>의존성 그래프</b>를 그리고 그 순서대로 만듭니다. 그래서 파일 안에서 블록을 적은 순서는 상관없어요. 서로 의존하지 않는 리소스는 동시에 만들어 시간을 줄입니다.',
      ],
      callout: { type: 'tip', text: '참조가 없는데도 순서가 필요할 때만 <code>depends_on</code>을 씁니다. 대부분은 참조만으로 충분해요.' },
      hide: ['tf', 'prov', 'api', 'ami'],
      show: ['g_vpc', 'g_sub', 'g_web', 'g_ami'],
      code: { ref: 'main', hl: [15, 19, 21] },
      flows: [{ path: ['g_vpc', 'g_sub'], kind: 'data' }, { path: ['g_sub', 'g_web'], kind: 'data', delay: 0.9 }, { path: ['g_ami', 'g_web'], kind: 'data', delay: 0.9 }],
      tags: [
        { on: 'g_vpc', text: '① 먼저', tone: 'accent', pos: 'bottom' },
        { on: 'g_sub', text: '② 다음', tone: 'accent', pos: 'bottom' },
        { on: 'g_web', text: '③ 마지막', tone: 'accent', pos: 'bottom' },
      ],
      more: [
        { title: '동작 원리', body: [
          '그래프의 노드는 리소스 · data · 변수 · output이고, 화살표는 참조입니다. Terraform은 이 그래프를 <b>위상 정렬</b>해서, 앞선 노드가 끝난 것부터 동시에 최대 10개(<code>-parallelism</code> 기본값)씩 처리합니다. 순환 참조(A가 B를, B가 A를 참조)가 있으면 <code>Cycle</code> 오류로 plan이 멈춰요.',
          '삭제는 그래프를 <b>거꾸로</b> 탑니다. 의존하는 쪽(인스턴스)을 먼저 지워야 의존받는 쪽(서브넷)을 지울 수 있으니까요.',
        ] },
        { title: '직접 해보기', body: ['그래프를 그림으로 뽑아 볼 수 있습니다(Graphviz 필요).'], code: { title: 'terminal', lang: 'sh', text: `$ terraform graph | dot -Tsvg > graph.svg
$ terraform graph | grep -- '->' | head -3
  "aws_instance.web" -> "aws_subnet.app"
  "aws_instance.web" -> "data.aws_ami.linux"
  "aws_subnet.app" -> "aws_vpc.main"` } },
        { title: 'depends_on이 필요한 경우', body: [
          '참조로 드러나지 않는 순서만 직접 적습니다. 예를 들어 인스턴스 안의 앱이 부팅하자마자 S3를 읽는데, 그 권한을 주는 IAM 정책은 인스턴스가 직접 참조하지 않습니다. 이때 인스턴스에 <code>depends_on = [aws_iam_role_policy.read_s3]</code>를 적어 정책이 먼저 붙게 합니다. 남용하면 그래프가 직렬이 되어 느려지고, data 블록의 조회가 apply 때로 미뤄져 plan에 <code>(known after apply)</code>가 늘어납니다.',
        ] },
      ],
    },
    {
      key: 'plan', kind: 'solution', title: 'terraform plan: 바꾸기 전에 차이 보기',
      body: [
        '<code>terraform plan</code>은 <b>코드가 원하는 모습</b>과 <b>지금 있는 것</b>을 비교해, 무엇을 할지 계획만 세웁니다. 조회 API만 호출하고 아무것도 바꾸지 않아요. 지금은 아무것도 없으니 세 리소스 모두 <code>+</code>(생성)입니다.',
        '<code>(known after apply)</code>는 만들어 봐야 아는 값입니다. VPC의 ID가 아직 없으니 서브넷의 <code>vpc_id</code>도 미정이에요. 마지막 줄 <code>Plan: 3 to add …</code>가 전체 요약입니다.',
      ],
      callout: { type: 'key', text: 'plan은 인프라의 <b>diff</b>입니다. 코드 리뷰에서 diff를 읽듯, apply 전에 plan을 읽는 것이 Terraform 작업의 중심이에요.' },
      hide: ['g_vpc', 'g_sub', 'g_web', 'g_ami'],
      show: ['tf', 'prov', 'api'],
      code: { ref: 'plan', hl: [3, 4, 22] },
      flows: [{ path: ['tf', 'prov', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'prov', 'tf'], kind: 'res', n: 2, delay: 1.6 }],
      tags: [{ on: 'api', text: '조회만 · 변경 없음', tone: 'info' }],
      metrics: { cmd: 'plan', plan: ['+3', 'ok'] },
      more: [
        { title: 'plan 안에서 일어나는 일', list: [
          '① <b>refresh</b>: 이미 관리 중인 리소스를 API로 다시 조회해 최신 모습을 얻습니다',
          '② data 블록을 조회합니다 (값이 미정이면 apply로 미룸)',
          '③ 코드가 원하는 모습과 비교해 리소스마다 생성 · 수정 · 교체 · 삭제를 정합니다',
          '④ 사람이 읽을 출력과 요약 줄을 냅니다',
        ] },
        { title: '저장한 계획', body: ['plan과 apply 사이에 코드나 실제가 바뀌면, apply는 다시 계산한 <b>다른 계획</b>을 실행할 수 있습니다. 리뷰한 그 계획을 그대로 실행하려면 파일로 저장합니다.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform plan -out=tfplan
Saved the plan to: tfplan
$ terraform show tfplan        # 사람이 읽기
$ terraform show -json tfplan  # 정책 검사 도구용
$ terraform apply tfplan       # 묻지 않고 그대로 실행` } },
        { title: '실무 팁', list: [
          '<code>-detailed-exitcode</code>를 붙이면 종료 코드가 0(변경 없음) · 1(오류) · 2(변경 있음)로 나뉘어, 스크립트와 CI에서 판단하기 좋습니다',
          '<code>-target</code>으로 일부만 계획할 수 있지만 그래프의 나머지를 무시하므로 장애 복구 같은 예외 상황에만 씁니다',
        ] },
      ],
    },
    {
      key: 'apply', kind: 'solution', title: 'terraform apply: 계획을 실행합니다',
      body: [
        '<code>terraform apply</code>는 계획을 다시 보여 주고 <code>yes</code>를 입력받은 뒤 실행합니다. 출력의 순서를 보세요. 그래프대로 <b>VPC → 서브넷 → 인스턴스</b>입니다.',
        '리소스가 만들어질 때마다 실제 ID(<code>vpc-0a1b…</code>)가 정해지고, 그 값이 다음 리소스의 인자로 흘러 들어갑니다. Terraform은 자기가 만든 것들의 ID를 <b>state</b> 파일에 적어 두는데, 다음 레슨의 주제예요.',
      ],
      callout: { type: 'tip', text: '<code>yes</code> 외의 입력은 모두 취소입니다. <code>y</code>도 안 돼요. 실수로 엔터를 쳐서 적용되는 일을 막으려는 설계입니다.' },
      show: ['vpc', 'subnet', 'web'],
      set: { vpc: { label: '① VPC 10.0.0.0/16' }, subnet: { label: '② 서브넷 10.0.1.0/24' } },
      code: { ref: 'apply', hl: [8, 11, 14] },
      flows: [{ path: ['tf', 'prov', 'api', 'web'], kind: 'ctrl', n: 3, gap: 0.6 }],
      tags: [{ on: 'web', text: '③ 인스턴스', tone: 'ok' }],
      metrics: { cmd: 'apply', plan: ['적용 완료', 'ok'], real: ['3개', 'ok'] },
      changes: [['+', 'VPC (vpc-0a1b…)'], ['+', '서브넷: VPC의 ID를 받아 생성'], ['+', 'EC2 인스턴스: 서브넷 ID를 받아 생성']],
      more: [
        { title: '출력 읽기', list: [
          '<code>Creating...</code> → <code>Creation complete after 13s [id=…]</code>: 리소스마다 시작과 끝, 걸린 시간, 실제 ID가 찍힙니다',
          '<code>Still creating... [10s elapsed]</code>가 길게 이어지면 클라우드 쪽이 느린 것입니다. DB나 로드 밸런서는 몇 분씩 걸리기도 해요',
          '마지막 <code>Apply complete! Resources: 3 added</code>의 숫자가 plan의 요약과 같은지 확인합니다',
        ] },
        { title: 'CI에서 apply할 때', body: [
          '사람이 없는 CI에서는 <code>-auto-approve</code>로 확인을 건너뜁니다. 이때 <b>방금 다시 계산한 계획</b>이 아니라, PR에서 리뷰한 <b>저장된 계획 파일</b>을 apply하는 것이 안전해요. 저장된 계획을 만든 뒤 state가 바뀌었다면 Terraform은 <code>Saved plan is stale</code> 오류로 거부하므로, 리뷰하지 않은 변경이 끼어들 수 없습니다.',
        ] },
        { title: '흔한 실수', list: [
          '노트북에서 apply하다 터미널을 닫음 → 진행 중이던 리소스가 기록되지 않거나 잠금이 남을 수 있습니다(state 레슨). 오래 걸리는 apply는 CI에서 돌립니다',
          'apply 직후 콘솔에서 바로 값을 고침 → 다음 plan이 그 변경을 되돌리려 합니다',
        ] },
      ],
    },
    {
      key: '기호 읽기', kind: 'concept', title: '다시 plan: No changes와 다섯 기호',
      body: [
        'apply 직후 plan을 한 번 더 돌리면 <code>No changes. Your infrastructure matches the configuration.</code>이 나옵니다. 코드와 실제가 같다는 뜻이고, 선언형이 약속한 <b>멱등성</b>이 바로 이것이에요.',
        '변경이 있을 때는 리소스마다 기호가 붙습니다. 오른쪽 표의 다섯 가지만 알면 어떤 plan이든 읽을 수 있어요. 특히 <b>삭제가 들어간 기호</b>는 반드시 이유를 확인합니다.',
      ],
      callout: { type: 'key', text: '요약 줄의 <code>to destroy</code>가 0이 아니라면, 그 숫자가 <b>어디서 왔는지</b> 찾기 전에는 apply하지 않습니다.' },
      hide: ['tf'],
      set: { vpc: { label: 'VPC 10.0.0.0/16' }, subnet: { label: '서브넷 10.0.1.0/24' } },
      tags: [{ on: 'api', text: 'No changes', tone: 'ok', icon: 'circle-check' }],
      flows: [{ path: ['prov', 'api'], kind: 'ctrl' }, { path: ['api', 'prov'], kind: 'res', delay: 1.4 }],
      panel: {
        title: 'plan 기호', icon: 'list',
        rows: [
          ['+  create', '새로 만든다', 'ok'],
          ['~  update in-place', '제자리에서 고친다', 'info'],
          ['-/+  replace', '지운 뒤 새로 만든다', 'bad'],
          ['+/-  replace', '새로 만든 뒤 지운다', 'warn'],
          ['-  destroy', '지운다', 'bad'],
          ['<=  read', 'data를 apply 때 읽는다', 'mute'],
        ],
      },
      metrics: { cmd: 'plan', plan: ['No changes', 'ok'] },
      more: [
        { title: '출력 읽기', body: ['변경이 없을 때의 plan입니다. 관리 중인 리소스를 하나씩 다시 조회(Refreshing)하고 나서 결론을 냅니다.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform plan -detailed-exitcode
aws_vpc.main: Refreshing state...
  [id=vpc-0a1b2c3d4e5f67890]
aws_subnet.app: Refreshing state...
aws_instance.web: Refreshing state...

No changes. Your infrastructure matches the
configuration.
$ echo $?
0` } },
        { title: '기호 안쪽의 표시', list: [
          '속성 줄의 <code>~ a -> b</code>는 그 속성이 a에서 b로 바뀐다는 뜻, <code>-> null</code>은 값이 사라진다는 뜻입니다',
          '<code># forces replacement</code>가 붙은 속성이 교체의 원인입니다. 교체 하나에 원인이 여럿일 수도 있어요',
          '<code>(sensitive value)</code>는 값을 가린 것일 뿐 바뀐다는 사실은 그대로입니다',
          '<code>Note: Objects have changed outside of Terraform</code>은 코드 밖에서 바뀐 것을 refresh가 발견했다는 신호입니다(드리프트, state 레슨)',
        ] },
        { title: '실무 팁', body: [
          'No changes는 "아무 일도 없다"는 확인이면서 <b>건강 검진</b>이기도 합니다. 운영 구성에 매일 plan을 돌려 종료 코드가 2(변경 있음)면 알림을 보내면, 누군가 콘솔로 바꾼 것을 며칠 안에 알게 됩니다.',
        ] },
      ],
    },
    {
      key: 'apply 실패', kind: 'case', title: '사례: apply가 중간에 실패했다',
      body: [
        '로그용 버킷 <code>shop-logs</code>와 정적 파일용 버킷 <code>shop-assets</code>를 추가해 apply했습니다. logs는 만들어졌는데 assets에서 <code>BucketAlreadyExists</code>로 멈춥니다. S3 버킷 이름은 <b>전 세계에서 유일</b>해야 하는데, 누군가 이미 쓰고 있었어요.',
        'Terraform은 <b>롤백하지 않습니다</b>. logs는 그대로 남아 state에 기록돼요. 이름을 고쳐 다시 apply하면 이미 있는 logs는 건너뛰고 assets만 만듭니다.',
      ],
      callout: { type: 'tip', text: '실패한 apply의 정답은 대개 "원인을 고치고 한 번 더"입니다. 손으로 지우고 처음부터 하려 들면 오히려 기록과 실제가 어긋나요.' },
      hide: ['vpc', 'subnet', 'web'],
      show: ['b_logs', 'b_assets'],
      set: { b_assets: { state: 'down', badge: '409 실패', tone: 'bad' } },
      code: { ref: 'fail', hl: [3, 4, 9, 10] },
      tags: [{ on: 'b_logs', text: '생성됨 · 기록됨', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['prov', 'api', 'b_logs'], kind: 'ctrl' },
        { path: ['api', 'b_assets'], kind: 'bad', delay: 1.6 },
      ],
      metrics: { cmd: 'apply', plan: ['1 / 2 성공', 'bad'], real: ['4개', 'warn'] },
      changes: [['+', 'shop-logs 버킷 (남아 있음)'], ['-', 'shop-assets: 이름 충돌로 실패'], ['~', '롤백 없음 → 고쳐서 재실행']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', 'Error: … 409, BucketAlreadyExists', 'bad'],
          ['상태', 'logs는 생성 · 기록, assets는 없음', 'warn'],
          ['원인', 'S3 버킷 이름은 전역에서 유일', 'warn'],
          ['해결', '이름에 접미사를 붙여 다시 apply', 'ok'],
          ['결과', 'plan: 1 to add (assets만)', 'ok'],
        ] },
        { title: '동작 원리', body: [
          'Terraform은 리소스 하나가 끝날 때마다 결과를 state에 기록합니다. 그래서 실패 지점까지 만든 것은 "내가 만든 것"으로 남고, 다음 실행은 차이만 메웁니다. 리소스가 <b>만들어지긴 했는데 그 뒤 단계에서 실패</b>하면(예: 생성 후 설정 단계), 그 리소스는 <b>tainted</b>(오염됨)로 표시되고 다음 plan에서 교체 대상(<code>-/+</code>)으로 나옵니다.',
          'CloudFormation처럼 실패 시 자동 롤백하는 도구와 가장 크게 다른 점입니다. 롤백이 없는 대신 "고쳐서 다시"가 언제나 통해요.',
        ] },
        { title: '흔한 실수', list: [
          '실패했다고 콘솔에서 logs 버킷을 손으로 지움 → state에는 남아 있어, 다음 plan이 "없어졌으니 다시 만들겠다"고 나옵니다',
          '이름 충돌을 피하려고 매번 무작위 이름을 쓰면 교체 때마다 이름이 바뀝니다. 계정 ID나 환경 이름처럼 <b>예측 가능한 접미사</b>가 낫습니다',
        ] },
      ],
    },
    {
      key: '교체 주의', kind: 'case', title: '사례: 태그 한 줄 고쳤는데 서버가 교체된다',
      body: [
        '몇 주 뒤, VPC에 <code>Name</code> 태그를 붙이려고 한 줄을 고쳤습니다. plan에는 예상대로 <code>~</code>(제자리 수정)가 있어요. 그런데 그 아래에 <code>-/+</code>가 하나 더 있습니다. <b>지우고 새로 만든다</b>는 뜻이에요.',
        '원인은 <code>most_recent = true</code>입니다. 그사이 새 AMI가 나와 data 조회 결과가 바뀌었고, AMI는 인스턴스를 교체해야만 바꿀 수 있는 속성(<code># forces replacement</code>)이에요. 요약 줄만 보고 <code>yes</code>를 누르면 서버와 그 디스크의 데이터가 사라집니다.',
      ],
      callout: { type: 'warn', text: '<code>-/+</code>와 <code>-</code>는 반드시 이유를 확인하세요. 운영에서는 AMI ID를 고정하고, <code>plan -out</code>으로 저장한 계획을 그대로 apply 합니다.' },
      hide: ['b_logs', 'b_assets'],
      show: ['tf', 'vpc', 'subnet', 'web'],
      set: { b_assets: { state: null, badge: null }, web: { state: 'hot', badge: '-/+ 교체', tone: 'bad' } },
      code: { ref: 'change', hl: [11, 12, 13, 14] },
      flows: [{ path: ['tf', 'prov', 'api'], kind: 'ctrl' }, { path: ['api', 'prov', 'tf'], kind: 'res', delay: 1.6 }],
      metrics: { cmd: 'plan', plan: ['~1, -/+1', 'bad'], real: '5개' },
      changes: [['~', 'VPC: 태그만 제자리 수정'], ['-', '인스턴스: 삭제 후 새로 생성 예정']],
      more: [
        { title: '왜 교체가 되는가', body: [
          '클라우드 API에는 <b>만든 뒤에는 못 바꾸는 속성</b>이 있습니다. 인스턴스의 AMI와 서브넷, 서브넷의 CIDR과 가용 영역, DB의 일부 엔진 설정 같은 것이죠. 프로바이더는 이런 속성을 "바뀌면 교체"로 표시해 두고, plan은 그 속성 옆에 <code># forces replacement</code>를 붙입니다.',
          '교체되면 새 리소스는 <b>새 ID와 새 IP</b>를 받고, 인스턴스의 로컬 디스크 데이터는 사라집니다. 그 ID를 참조하던 다른 리소스(DNS 레코드, 대상 그룹 등)도 연쇄로 바뀌어요.',
        ] },
        { title: '해결 방법들', list: [
          'AMI를 <code>most_recent</code> 조회 대신 <b>변수로 고정</b>하고, 바꿀 때는 의도적으로 PR을 올립니다',
          '정말로 무시해야 할 속성이라면 <code>lifecycle { ignore_changes = [ami] }</code> (다음 단계)',
          '반대로 일부러 교체하고 싶을 때는 <code>terraform apply -replace=aws_instance.web</code>',
        ] },
        { title: '실무 팁', body: [
          'PR 리뷰에서 plan을 읽을 때 요약 줄만 보지 말고 <code>must be replaced</code>와 <code>will be destroyed</code>를 검색하세요. 정책 검사 도구로 "운영 DB의 삭제 · 교체가 들어간 plan은 자동 거부" 같은 규칙을 걸어 두는 팀도 많습니다.',
        ] },
      ],
    },
    {
      key: 'lifecycle', kind: 'solution', title: 'lifecycle: 교체와 삭제에 규칙을 겁니다',
      body: [
        '교체를 피할 수 없다면 <b>순서</b>라도 바꿉니다. <code>create_before_destroy = true</code>면 새 인스턴스를 <b>먼저 만든 뒤</b> 옛것을 지워 끊김을 줄여요. plan의 기호도 <code>+/-</code>로 바뀝니다.',
        '<code>prevent_destroy</code>는 삭제가 들어간 plan을 오류로 멈추고, <code>ignore_changes</code>는 다른 도구가 바꾸는 속성을 비교에서 뺍니다.',
      ],
      callout: { type: 'warn', text: '<code>prevent_destroy</code>는 블록이 <b>코드에 있을 때만</b> 지켜 줍니다. 블록째 지우면 보호도 사라지니, DB는 클라우드 쪽 삭제 보호(<code>deletion_protection</code>)도 함께 켭니다.' },
      show: ['web2'],
      set: { web: { state: 'dim', badge: null } },
      code: { ref: 'life', hl: [6, 7, 8, 14, 17] },
      tags: [
        { on: 'web2', text: '① 먼저 생성', tone: 'ok' },
        { on: 'web', text: '② 그다음 삭제', tone: 'bad', pos: 'bottom' },
      ],
      flows: [
        { path: ['tf', 'prov', 'api', 'web2'], kind: 'ctrl', n: 2 },
        { path: ['api', 'web'], kind: 'bad', delay: 2.4 },
      ],
      metrics: { plan: ['+/- 1', 'warn'] },
      changes: [['+', 'create_before_destroy'], ['+', 'prevent_destroy · deletion_protection'], ['~', '교체 순서: 삭제 먼저 → 생성 먼저']],
      more: [
        { title: '네 가지 설정', rows: [
          ['create_before_destroy', '새것 먼저, 옛것 나중 (+/-)', 'ok'],
          ['prevent_destroy', '삭제가 든 plan을 오류로 중단', 'bad'],
          ['ignore_changes', '지정한 속성의 차이를 무시', 'info'],
          ['replace_triggered_by', '다른 것이 바뀌면 함께 교체', 'warn'],
        ] },
        { title: '흔한 실수', list: [
          '<code>create_before_destroy</code>인데 이름이 고정된 리소스(로드 밸런서 이름 등) → 새것을 먼저 만들다 "이름이 이미 있다"로 실패합니다. 이름에 접두사(<code>name_prefix</code>)를 쓰는 식으로 풉니다',
          '<code>ignore_changes = all</code>로 드리프트를 덮어 버림 → 코드가 더는 실제를 설명하지 못합니다. 오토스케일링이 바꾸는 대수, 외부 스캐너가 붙이는 태그처럼 <b>정말 남이 관리하는 속성</b>만 적습니다',
          '<code>prevent_destroy</code>만 믿음 → 코드 리팩터링 중 블록이 사라지면 아무 보호도 없습니다',
        ] },
        { title: '출력 읽기', body: ['prevent_destroy가 걸린 리소스를 지우는 plan은 이렇게 멈춥니다.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform plan

Error: Instance cannot be destroyed

  on main.tf line 12:
  12: resource "aws_db_instance" "shop" {

Resource aws_db_instance.shop has
lifecycle.prevent_destroy set, but the plan
calls for this resource to be destroyed.` } },
      ],
    },
    {
      key: 'destroy', kind: 'concept', title: 'terraform destroy: 만든 것을 전부 지웁니다',
      body: [
        '<code>terraform destroy</code>는 이 구성이 관리하는 리소스를 전부 삭제합니다. plan의 기호는 <code>-</code>, 순서는 생성의 <b>반대</b>예요. 인스턴스가 남아 있으면 서브넷을 지울 수 없으니 인스턴스 → 서브넷 → VPC 순입니다.',
        '실습 환경을 깨끗이 치워 과금을 멈출 때 유용합니다. 콘솔에서 하나씩 찾아 지우다 빠뜨릴 일이 없어요. 물론 운영 환경에서는 가장 위험한 명령이기도 합니다.',
      ],
      callout: { type: 'warn', text: 'destroy는 <b>이 구성의 state에 있는 것만</b> 지웁니다. 콘솔에서 따로 만든 리소스는 남아서 계속 과금돼요.' },
      hide: ['web'],
      set: { vpc: { label: '③ VPC 10.0.0.0/16' }, subnet: { label: '② 서브넷 10.0.1.0/24' }, web2: { state: 'down' } },
      code: { ref: 'destroy', hl: [3, 4, 9, 13, 15, 17, 20] },
      flows: [{ path: ['tf', 'prov', 'api', 'web2'], kind: 'bad', n: 3, gap: 0.6 }],
      tags: [{ on: 'web2', text: '① 먼저 삭제', tone: 'bad' }],
      metrics: { cmd: 'destroy', plan: ['-5', 'bad'], real: '0개' },
      changes: [['-', '인스턴스 → 서브넷 → VPC 순으로 삭제'], ['~', '과금 중지']],
      more: [
        { title: '직접 해보기', body: ['지우기 전에 무엇이 지워질지 먼저 봅니다. destroy도 결국 "모든 리소스가 없어야 한다"는 plan이에요.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform plan -destroy      # 미리 보기만
Plan: 0 to add, 0 to change, 5 to destroy.

$ terraform state list         # 관리 대상 목록
aws_instance.web
aws_s3_bucket.assets
aws_s3_bucket.logs
aws_subnet.app
aws_vpc.main

$ terraform destroy` } },
        { title: '지워지지 않을 때', list: [
          '버킷에 객체가 남아 있으면 S3가 삭제를 거부합니다. 실습용이라면 <code>force_destroy = true</code>를 미리 켜 두고, 운영 버킷에는 켜지 않습니다',
          'Terraform 밖에서 만든 것이 의존하고 있으면(예: 콘솔로 만든 ENI가 서브넷을 쓰는 중) 서브넷 삭제가 실패합니다',
          '<code>prevent_destroy</code>나 클라우드의 삭제 보호가 켜진 리소스는 먼저 그 설정을 코드에서 풀고 apply해야 합니다',
        ] },
        { title: '실무 팁', body: [
          '운영 환경의 파이프라인에는 destroy를 <b>아예 넣지 않는</b> 팀이 많습니다. 리소스를 없애야 할 때는 코드에서 블록을 지우는 PR을 올려, 삭제도 다른 변경처럼 plan 리뷰를 거치게 해요. 실습 · 기능 브랜치용 임시 환경은 반대로 매일 밤 destroy해 비용을 아낍니다.',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 쓰고, 계획을 읽고, 적용합니다',
      body: [
        '<code>provider</code>가 클라우드 API와 통역하고, 버전 범위와 lock 파일이 모두에게 같은 프로바이더를 줍니다. <code>resource</code>는 만들 것, <code>data</code>는 읽을 것이고, 참조가 그래프를 만들어 순서를 정합니다.',
        '작업 순서는 <code>init</code> → 코드 수정 → <code>plan</code>(기호 읽기) → <code>apply</code>. 실패하면 고쳐서 다시, 교체와 삭제는 <code>lifecycle</code>로 다스립니다. 그런데 Terraform은 무엇이 "자기 것"인지 어떻게 기억할까요? 다음 레슨의 <b>state</b>입니다.',
      ],
      hide: ['vpc', 'subnet', 'web2'],
      show: ['file'],
      set: { web2: { state: null }, vpc: { label: 'VPC 10.0.0.0/16' }, subnet: { label: '서브넷 10.0.1.0/24' } },
      flows: [{ path: ['file', 'tf', 'prov', 'api'], kind: 'ctrl', n: 2 }],
      panel: {
        title: '네 가지 명령', icon: 'terminal',
        rows: [
          ['terraform init', '프로바이더 내려받기', 'info'],
          ['terraform plan', '차이 계산 (읽기만)', 'accent'],
          ['terraform apply', '계획 실행', 'ok'],
          ['terraform destroy', '전부 삭제', 'bad'],
        ],
      },
      metrics: { cmd: '-', plan: '-' },
    },
  ],
  quiz: [
    {
      q: 'main.tf에서 aws_instance 블록을 aws_vpc 블록보다 위에 적었습니다. apply 하면 어떻게 될까요?',
      options: [
        '인스턴스를 먼저 만들려다 실패한다',
        '문법 오류로 plan부터 실패한다',
        '참조로 계산한 의존성 순서대로 VPC부터 만들어진다',
        '위에서부터 만들되, 실패하면 자동으로 순서를 바꿔 재시도한다',
      ],
      answer: 2,
      step: 6,
      why: 'Terraform은 블록이 적힌 순서가 아니라 참조(aws_subnet.app.id 등)로 만든 의존성 그래프를 따릅니다. 선언형 코드에서 파일 안의 순서는 의미가 없어요. 재시도로 순서를 맞추는 것이 아니라 처음부터 올바른 순서를 계산합니다.',
    },
    {
      q: 'plan 출력에 "-/+ resource … # forces replacement"가 보입니다. 가장 알맞은 대응은?',
      options: [
        '제자리 수정이므로 그대로 apply 한다',
        '어떤 속성이 교체를 일으켰는지 확인하고, 데이터 · IP · 중단 시간 영향을 따져 본 뒤 결정한다',
        '-/+는 추가와 삭제가 상쇄된다는 뜻이니 무시한다',
        'terraform init을 다시 실행하면 사라진다',
      ],
      answer: 1,
      step: 11,
      why: '-/+는 리소스를 지우고 새로 만든다는 뜻입니다. 제자리 수정은 ~예요. 교체되면 ID와 IP가 바뀌고 디스크의 데이터가 사라질 수 있으니, 어떤 인자가 원인인지 보고 의도한 변경인지 판단해야 합니다.',
    },
    {
      q: '보안팀이 만들어 관리하는 기존 VPC 안에, 우리 팀 서브넷을 Terraform으로 추가하려 합니다. 어떻게 적는 것이 맞을까요?',
      options: [
        'VPC와 서브넷 모두 resource로 적는다',
        'VPC와 서브넷 모두 data로 적는다',
        'VPC ID를 provider 블록에 적는다',
        'VPC는 data로 조회하고, 서브넷만 resource로 적는다',
      ],
      answer: 3,
      step: 5,
      why: '우리 코드가 수명을 책임지는 것만 resource입니다. 남이 관리하는 VPC를 resource로 적으면 같은 VPC를 하나 더 만들려 하거나, destroy 때 지우려 들 수 있어요. data는 읽기만 하므로 안전하게 ID를 참조할 수 있습니다.',
    },
    {
      q: 'apply 도중 버킷 두 개 가운데 하나는 만들어지고, 다른 하나는 이름 충돌로 실패했습니다. 가장 알맞은 다음 행동은?',
      options: [
        '이름을 고친 뒤 다시 apply한다. 이미 만든 버킷은 건너뛰고 실패한 것만 만든다',
        'Terraform이 자동으로 롤백할 때까지 기다린다',
        '콘솔에서 만들어진 버킷을 지운 뒤 처음부터 apply한다',
        'state 파일을 지우고 다시 시작한다',
      ],
      answer: 0,
      step: 10,
      why: 'Terraform은 실패해도 롤백하지 않고, 성공한 리소스는 state에 기록해 둡니다. 원인을 고쳐 다시 실행하면 차이만 메웁니다. 콘솔에서 손으로 지우면 기록과 실제가 어긋나 다음 plan이 그것을 다시 만들려 하고, state를 지우면 모든 연결을 잃습니다.',
    },
    {
      q: '팀원이 몇 달 만에 새 노트북에서 terraform init을 했더니, 다른 사람과 같은 코드인데 plan 결과가 다릅니다. versions.tf에는 version = ">= 5.0"만 있습니다. 가장 알맞은 조치는?',
      options: [
        'Terraform을 다시 설치한다',
        '버전 범위를 ~> 메이저.마이너처럼 좁히고 .terraform.lock.hcl을 Git에 커밋해 모두가 같은 버전을 쓰게 한다',
        'required_providers 블록을 지워 기본값을 쓰게 한다',
        '.terraform 폴더를 Git에 커밋한다',
      ],
      answer: 1,
      step: 4,
      why: '>= 5.0은 새 메이저 버전까지 허용하므로 init 시점마다 다른 버전을 받을 수 있습니다. 범위를 좁히고, 실제로 고른 정확한 버전과 체크섬이 담긴 lock 파일을 커밋하면 모두 같은 버전을 씁니다. .terraform 폴더는 용량이 큰 바이너리라 커밋하지 않습니다.',
    },
    {
      q: 'version = "~> 6.2.0"으로 적었습니다. 다음 중 init이 고를 수 있는 버전은?',
      options: ['6.2.7', '6.3.0', '7.0.0', '6.1.9'],
      answer: 0,
      step: 3,
      why: '~>는 가장 오른쪽 자리만 올라가게 허용합니다. ~> 6.2.0은 6.2.x 패치만 허용하므로 6.2.7은 되지만 6.3.0은 안 됩니다. 6.3.0까지 받으려면 ~> 6.2로 적어야 하고, 6.1.9는 최소 버전보다 낮습니다.',
    },
    {
      q: 'CI에서 PR 때 plan을 리뷰하고, 병합 후 apply합니다. 리뷰와 apply 사이에 다른 변경이 끼어들지 않게 하려면?',
      options: [
        'apply에 -auto-approve만 붙인다',
        'apply 직전에 plan을 한 번 더 돌린다',
        'plan -out으로 저장한 계획 파일을 apply한다. state가 그사이 바뀌었으면 Terraform이 거부한다',
        '-target으로 리뷰한 리소스만 지정한다',
      ],
      answer: 2,
      step: 8,
      why: '저장한 계획 파일을 apply하면 리뷰한 바로 그 계획만 실행되고, 그사이 state가 바뀌었으면 Saved plan is stale로 거부됩니다. -auto-approve만 쓰면 apply 시점에 다시 계산한, 리뷰하지 않은 계획이 실행될 수 있어요. -target은 그래프의 일부를 무시하는 예외용 옵션입니다.',
    },
    {
      q: 'apply 직후 plan을 다시 돌렸는데 No changes가 아니라 몇몇 속성의 변경이 계속 나옵니다. 코드는 그대로입니다. 가장 먼저 의심할 것은?',
      options: [
        'Terraform이 멱등하지 않다',
        'apply가 실패했는데 성공으로 표시됐다',
        'lock 파일이 손상됐다',
        'apply 이후 Terraform 밖에서 누군가 또는 다른 도구가 그 속성을 바꾸고 있다',
      ],
      answer: 3,
      step: 9,
      why: '코드가 같은데 plan이 계속 차이를 낸다면 실제 쪽이 바뀌고 있다는 뜻입니다. 콘솔 수정, 외부 스캐너가 붙이는 태그, 오토스케일링 같은 것이죠. 원인을 확인해 코드를 맞추거나, 정말 남이 관리하는 속성이면 ignore_changes로 비교에서 뺍니다.',
    },
    {
      q: '웹 서버 인스턴스가 교체될 때 잠깐이라도 서비스가 끊기지 않게 하고 싶습니다. 어떤 설정이 맞을까요?',
      options: [
        'lifecycle { prevent_destroy = true }',
        'lifecycle { create_before_destroy = true }',
        'lifecycle { ignore_changes = all }',
        'depends_on = [aws_vpc.main]',
      ],
      answer: 1,
      step: 12,
      why: 'create_before_destroy는 새 리소스를 먼저 만든 뒤 옛것을 지우므로 끊김이 줄어듭니다(plan 기호 +/-). prevent_destroy는 교체 자체를 오류로 막을 뿐이고, ignore_changes = all은 모든 차이를 무시해 코드가 실제를 설명하지 못하게 만듭니다.',
    },
    {
      q: '운영 DB를 실수로 지우지 못하게 lifecycle에 prevent_destroy를 걸었습니다. 그래도 남는 위험과 보완책은?',
      options: [
        '위험 없음. prevent_destroy는 클라우드 쪽에서도 삭제를 막는다',
        'destroy 명령에만 적용되므로 apply는 별도로 막아야 한다',
        '리팩터링 중 블록째 지우면 보호도 사라진다. 클라우드의 삭제 보호(deletion_protection)도 함께 켠다',
        'plan 단계에서는 작동하지 않으므로 apply 전에는 알 수 없다',
      ],
      answer: 2,
      step: 12,
      why: 'prevent_destroy는 코드에 있는 lifecycle 설정이라, 블록이 코드에서 사라지면 보호도 함께 사라집니다. 클라우드 API의 삭제 보호는 Terraform과 무관하게 동작하므로 이중 안전장치가 됩니다. prevent_destroy는 plan 단계에서 삭제가 든 계획을 오류로 멈춥니다.',
    },
    {
      q: '실습 계정에서 terraform destroy를 했는데 다음 달에도 요금이 나옵니다. 가장 그럴듯한 원인은?',
      options: [
        'destroy는 state에 있는 리소스만 지우므로, 콘솔에서 따로 만든 리소스가 남아 있다',
        'destroy는 실제로 삭제하지 않고 중지만 한다',
        'destroy가 리소스를 역순으로 지우다 하나를 빠뜨렸다',
        '프로바이더 버전이 오래돼서 삭제가 반영되지 않았다',
      ],
      answer: 0,
      step: 13,
      why: 'destroy는 이 구성이 기록한 리소스만 다룹니다. 콘솔이나 다른 구성으로 만든 것은 Terraform이 모르니 남아서 과금돼요. destroy는 실제 삭제이고, 역순은 의존 관계를 지키기 위한 순서일 뿐 빠뜨리는 것이 아닙니다.',
    },
    {
      q: '앱이 부팅하자마자 S3를 읽어야 하는데, 가끔 권한 오류로 시작에 실패합니다. 인스턴스는 IAM 정책 리소스를 직접 참조하지 않습니다. 어떻게 고칠까요?',
      options: [
        'parallelism을 1로 낮춘다',
        '인스턴스에 depends_on으로 그 IAM 정책 리소스를 지정해 정책이 먼저 붙게 한다',
        'apply를 두 번 실행한다',
        'IAM 정책을 data 블록으로 바꾼다',
      ],
      answer: 1,
      step: 6,
      why: '참조가 없으면 Terraform은 두 리소스를 동시에 만들 수 있어, 인스턴스가 먼저 떠서 권한 없이 시작할 수 있습니다. 참조로 드러나지 않는 순서는 depends_on으로 직접 적습니다. parallelism을 낮추면 우연히 순서가 맞을 수는 있어도 보장되지 않고, data는 남이 만든 것을 읽을 때 씁니다.',
    },
    {
      q: '동료가 CI에서는 init이 체크섬 오류로 실패하는데 자기 macOS 노트북에서는 잘 된다고 합니다. lock 파일은 그 노트북에서 만들었습니다. 가장 알맞은 조치는?',
      options: [
        'lock 파일을 지우고 CI에서 새로 만든다',
        '.terraform 폴더를 CI에 복사한다',
        'CI에서 -lock=false로 실행한다',
        'terraform providers lock으로 Linux와 macOS 플랫폼의 체크섬을 함께 기록해 커밋한다',
      ],
      answer: 3,
      step: 4,
      why: 'lock 파일의 체크섬은 플랫폼별 패키지마다 다릅니다. macOS에서만 만든 lock 파일에는 Linux용 체크섬이 없을 수 있어요. providers lock에 여러 플랫폼을 지정해 기록하면 해결됩니다. lock 파일을 지우면 버전 고정이 사라지고, -lock=false는 state 잠금 옵션이라 이 문제와 무관합니다.',
    },
  ],
};
