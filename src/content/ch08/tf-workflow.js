export default {
  id: 'tf-workflow',
  learn: [
    'provider · resource · data 블록이 하는 일',
    'terraform init: 프로바이더를 내려받는 단계',
    '참조가 만드는 의존성 그래프와 생성 순서',
    'plan 출력의 + / ~ / -/+ / - 읽는 법',
    'apply와 destroy가 실제로 하는 일',
  ],
  legend: [['ctrl', 'API 호출'], ['res', '조회 결과'], ['build', '플러그인 · 파일'], ['data', '참조되는 값'], ['bad', '삭제']],
  metrics: [
    { id: 'cmd', label: '지금 명령', icon: 'terminal' },
    { id: 'prov', label: '프로바이더', icon: 'plug' },
    { id: 'plan', label: '계획', icon: 'clipboard-list' },
    { id: 'real', label: '실제 리소스', icon: 'boxes' },
  ],
  scene: {
    zones: {
      vpc: { at: [6.4, -0.8], size: [4.1, 3.9], label: 'VPC 10.0.0.0/16', color: 'purple' },
      subnet: { at: [7, -0.5], size: [3.2, 2.8], label: '서브넷 10.0.1.0/24', color: 'green' },
    },
    nodes: {
      dev: { kind: 'client', at: [0.2, 3.8], label: '개발자' },
      file: { kind: 'tile', at: [2, 2], label: 'main.tf', icon: 'file-code', color: 'olive' },
      tf: { at: [3.8, 0.2], label: 'Terraform', sub: 'CLI', icon: 'terminal', color: 'olive' },
      prov: { at: [5.6, -1.6], size: 's', label: 'provider', sub: 'aws 플러그인', icon: 'plug', color: 'orange' },
      api: { at: [7.4, -3.4], label: 'AWS API', icon: 'cloud', color: 'aws' },
      reg: { kind: 'cyl', at: [3.4, -3.8], label: 'Terraform Registry', icon: 'package', color: 'slate' },
      ami: { kind: 'tile', at: [9.2, -1.6], label: 'AMI (이미 있음)', icon: 'image', color: 'gray' },
      web: { at: [8.6, 0.6], label: 'EC2', sub: 'web', icon: 'server', color: 'orange' },

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
      e_api_ami: { from: 'api', to: 'ami', style: 'dashed' },
      e_api_web: { from: 'api', to: 'web' },
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
    init: {
      title: '터미널', lang: 'sh',
      text: `$ terraform init

Initializing the backend...
Initializing provider plugins...
- Finding latest version of hashicorp/aws...
- Installing hashicorp/aws v6.2.0...
- Installed hashicorp/aws v6.2.0

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
    destroy: {
      title: '터미널', lang: 'sh',
      text: `$ terraform destroy

# aws_instance.web will be destroyed
- resource "aws_instance" "web" {
    - instance_type = "t3.micro" -> null
    ...
  }

Plan: 0 to add, 0 to change, 3 to destroy.

aws_instance.web: Destroying...
aws_instance.web: Destruction complete after 41s
aws_subnet.app: Destroying...
aws_subnet.app: Destruction complete after 1s
aws_vpc.main: Destroying...
aws_vpc.main: Destruction complete after 1s

Destroy complete! Resources: 3 destroyed.
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
    },
    {
      key: 'init', kind: 'concept', title: 'terraform init: 프로바이더 내려받기',
      body: [
        '프로바이더는 Terraform에 들어 있지 않습니다. 작업 폴더에서 맨 처음 <code>terraform init</code>을 실행하면, 코드가 쓰는 프로바이더를 <b>Terraform Registry</b>에서 내려받아 <code>.terraform/</code> 폴더에 넣습니다.',
        '이때 고른 버전과 체크섬이 <code>.terraform.lock.hcl</code>에 기록됩니다. 이 파일을 Git에 커밋해 두면 동료와 CI가 똑같은 버전을 쓰게 돼요. init은 클라우드에 아직 아무 일도 하지 않습니다.',
      ],
      callout: { type: 'tip', text: '<code>init</code>은 여러 번 실행해도 안전합니다. 프로바이더 · 모듈 · 백엔드 설정을 바꿨을 때 다시 실행하면 돼요.' },
      hide: ['api'],
      show: ['reg'],
      code: { ref: 'init', hl: [5, 6, 7] },
      flows: [{ path: ['tf', 'reg'], kind: 'ctrl' }, { path: ['reg', 'prov'], kind: 'build', n: 2, delay: 1.2 }],
      metrics: { cmd: 'init', prov: ['설치됨', 'ok'] },
      changes: [['+', '.terraform/ 안에 aws 프로바이더'], ['+', '.terraform.lock.hcl (버전 기록)']],
    },
    {
      key: 'resource·data', kind: 'concept', title: 'resource는 만들 것, data는 읽을 것',
      body: [
        '<b>resource</b> 블록은 Terraform이 <b>만들고 관리할</b> 대상입니다. <code>resource "aws_vpc" "main"</code>에서 <code>aws_vpc</code>는 프로바이더가 정한 리소스 종류, <code>main</code>은 이 코드 안에서 부르는 이름이에요. 둘을 합친 <code>aws_vpc.main</code>이 주소가 됩니다.',
        '<b>data</b> 블록은 <b>이미 있는 것을 읽기만</b> 합니다. 여기서는 Amazon이 배포하는 Amazon Linux 2023 이미지 가운데 가장 최신 AMI의 ID를 조회해요. 만들지도 지우지도 않습니다.',
      ],
      callout: { type: 'key', text: '판단 기준은 <b>수명을 누가 쥐는가</b>입니다. 이 코드가 책임지면 resource, 남이 관리하는 것을 참조만 하면 data.' },
      hide: ['reg'],
      show: ['api', 'ami'],
      code: { ref: 'main', hl: [5, 6, 7, 8, 9, 11, 12, 13] },
      flows: [{ path: ['tf', 'prov', 'api', 'ami'], kind: 'ctrl' }, { path: ['ami', 'api', 'prov', 'tf'], kind: 'res', delay: 1.8 }],
      tags: [{ on: 'ami', text: 'data: 읽기만', tone: 'info', pos: 'bottom' }],
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
    },
    {
      key: 'apply', kind: 'solution', title: 'terraform apply: 계획을 실행합니다',
      body: [
        '<code>terraform apply</code>는 계획을 다시 보여 주고 <code>yes</code>를 입력받은 뒤 실행합니다. 출력의 순서를 보세요. 그래프대로 <b>VPC → 서브넷 → 인스턴스</b>입니다.',
        '리소스가 만들어질 때마다 실제 ID(<code>vpc-0a1b…</code>)가 정해지고, 그 값이 다음 리소스의 인자로 흘러 들어갑니다. Terraform은 자기가 만든 것들의 ID를 <b>state</b> 파일에 적어 두는데, 다음 레슨의 주제예요.',
      ],
      callout: { type: 'tip', text: '바로 한 번 더 <code>plan</code>을 돌리면 <code>No changes</code>가 나옵니다. 코드와 실제가 같다는 뜻이고, 선언형이 약속한 멱등성이 바로 이것입니다.' },
      show: ['vpc', 'subnet', 'web'],
      set: { vpc: { label: '① VPC 10.0.0.0/16' }, subnet: { label: '② 서브넷 10.0.1.0/24' } },
      code: { ref: 'apply', hl: [8, 11, 14] },
      flows: [{ path: ['tf', 'prov', 'api', 'web'], kind: 'ctrl', n: 3, gap: 0.6 }],
      tags: [{ on: 'web', text: '③ 인스턴스', tone: 'ok' }],
      metrics: { cmd: 'apply', plan: ['적용 완료', 'ok'], real: ['3개', 'ok'] },
      changes: [['+', 'VPC (vpc-0a1b…)'], ['+', '서브넷: VPC의 ID를 받아 생성'], ['+', 'EC2 인스턴스: 서브넷 ID를 받아 생성']],
    },
    {
      key: '교체 주의', kind: 'case', title: '사례: 태그 한 줄 고쳤는데 서버가 교체된다',
      body: [
        '몇 주 뒤, VPC에 <code>Name</code> 태그를 붙이려고 한 줄을 고쳤습니다. plan에는 예상대로 <code>~</code>(제자리 수정)가 있어요. 그런데 그 아래에 <code>-/+</code>가 하나 더 있습니다. <b>지우고 새로 만든다</b>는 뜻이에요.',
        '원인은 <code>most_recent = true</code>입니다. 그사이 새 AMI가 나와 data 조회 결과가 바뀌었고, AMI는 인스턴스를 교체해야만 바꿀 수 있는 속성(<code># forces replacement</code>)이에요. 요약 줄만 보고 <code>yes</code>를 누르면 서버와 그 디스크의 데이터가 사라집니다.',
      ],
      callout: { type: 'warn', text: '<code>-/+</code>와 <code>-</code>는 반드시 이유를 확인하세요. 운영에서는 AMI ID를 고정하고, <code>plan -out</code>으로 저장한 계획을 그대로 apply 합니다.' },
      set: { vpc: { label: 'VPC 10.0.0.0/16' }, subnet: { label: '서브넷 10.0.1.0/24' }, web: { state: 'hot', badge: '-/+ 교체', tone: 'bad' } },
      code: { ref: 'change', hl: [11, 12, 13, 14] },
      flows: [{ path: ['tf', 'prov', 'api'], kind: 'ctrl' }, { path: ['api', 'prov', 'tf'], kind: 'res', delay: 1.6 }],
      metrics: { cmd: 'plan', plan: ['~1, -/+1', 'bad'] },
      changes: [['~', 'VPC: 태그만 제자리 수정'], ['-', '인스턴스: 삭제 후 새로 생성 예정']],
    },
    {
      key: 'destroy', kind: 'concept', title: 'terraform destroy: 만든 것을 전부 지웁니다',
      body: [
        '<code>terraform destroy</code>는 이 구성이 관리하는 리소스를 전부 삭제합니다. plan의 기호는 <code>-</code>, 순서는 생성의 <b>반대</b>예요. 인스턴스가 남아 있으면 서브넷을 지울 수 없으니 인스턴스 → 서브넷 → VPC 순입니다.',
        '실습 환경을 깨끗이 치워 과금을 멈출 때 유용합니다. 콘솔에서 하나씩 찾아 지우다 빠뜨릴 일이 없어요. 물론 운영 환경에서는 가장 위험한 명령이기도 합니다.',
      ],
      callout: { type: 'warn', text: '지우면 안 되는 리소스에는 <code>lifecycle { prevent_destroy = true }</code>를 걸어 두세요. 삭제가 포함된 plan이 오류로 멈춥니다.' },
      set: { vpc: { label: '③ VPC 10.0.0.0/16' }, subnet: { label: '② 서브넷 10.0.1.0/24' }, web: { state: 'down', badge: null } },
      code: { ref: 'destroy', hl: [3, 4, 11, 13, 15] },
      flows: [{ path: ['tf', 'prov', 'api', 'web'], kind: 'bad', n: 3, gap: 0.6 }],
      tags: [{ on: 'web', text: '① 먼저 삭제', tone: 'bad' }],
      metrics: { cmd: 'destroy', plan: ['-3', 'bad'], real: '0개' },
      changes: [['-', '인스턴스 → 서브넷 → VPC 순으로 삭제'], ['~', '과금 중지']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 쓰고, 계획을 읽고, 적용합니다',
      body: [
        '<code>provider</code>가 클라우드 API와 통역하고, <code>resource</code>는 만들 것, <code>data</code>는 읽을 것을 선언합니다. 참조가 의존성 그래프를 만들고, 그래프가 생성과 삭제의 순서를 정합니다.',
        '작업 순서는 <code>init</code>(처음 한 번) → 코드 수정 → <code>plan</code>(읽기) → <code>apply</code>입니다. 그런데 Terraform은 어떤 VPC가 "자기가 만든 것"인지 어떻게 기억할까요? 다음 레슨에서 그 기억, <b>state</b>를 봅니다.',
      ],
      hide: ['vpc', 'subnet', 'web'],
      show: ['file'],
      set: { web: { state: null }, vpc: { label: 'VPC 10.0.0.0/16' }, subnet: { label: '서브넷 10.0.1.0/24' } },
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
      why: '-/+는 리소스를 지우고 새로 만든다는 뜻입니다. 제자리 수정은 ~예요. 교체되면 ID와 IP가 바뀌고 디스크의 데이터가 사라질 수 있으니, 어떤 인자가 원인인지 보고 의도한 변경인지 판단해야 합니다.',
    },
    {
      q: '보안팀이 만들어 관리하는 기존 VPC 안에, 우리 팀 서브넷을 Terraform으로 추가하려 합니다. 어떻게 적는 것이 맞을까요?',
      options: [
        'VPC와 서브넷 모두 resource로 적는다',
        'VPC는 data로 조회하고, 서브넷만 resource로 적는다',
        'VPC와 서브넷 모두 data로 적는다',
        'VPC ID를 provider 블록에 적는다',
      ],
      answer: 1,
      why: '우리 코드가 수명을 책임지는 것만 resource입니다. 남이 관리하는 VPC를 resource로 적으면 같은 VPC를 하나 더 만들려 하거나, destroy 때 지우려 들 수 있어요. data는 읽기만 하므로 안전하게 ID를 참조할 수 있습니다.',
    },
    {
      q: 'apply 도중 VPC와 서브넷은 만들어졌는데 인스턴스 생성이 권한 오류로 실패했습니다. 다음에 일어나는 일은?',
      options: [
        'Terraform이 VPC와 서브넷을 자동으로 지워 원래대로 되돌린다',
        '만들어진 것은 그대로 남는다. 원인을 고치고 다시 apply 하면 남은 인스턴스만 만든다',
        '전부 지우고 처음부터 다시 해야 한다',
        '다음 apply에서 VPC와 서브넷이 하나씩 더 생긴다',
      ],
      answer: 1,
      why: 'Terraform은 실패해도 자동으로 롤백하지 않습니다. 이미 만든 리소스는 기록해 두므로, 문제를 고친 뒤 다시 실행하면 차이(아직 없는 인스턴스)만 메웁니다. 선언형과 멱등성 덕분에 "고쳐서 한 번 더"가 안전한 복구 방법이 됩니다.',
    },
  ],
};
