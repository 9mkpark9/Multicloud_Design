export default {
  id: 'tf-modules',
  learn: [
    'variable · tfvars로 환경마다 다른 값만 분리',
    'locals와 output, 모듈의 입구와 출구',
    '로컬 · 레지스트리 · Git 모듈과 버전 고정',
    'for_each와 count: 주소가 키인가 순번인가',
    '환경 분리: 디렉터리, workspace, 계정',
    '모듈 버전 올리기와 terraform test',
  ],
  legend: [['data', '값 (변수 · output)'], ['ctrl', '호출 · 생성'], ['build', '내려받는 코드'], ['bad', '잘못된 apply · 교체']],
  metrics: [
    { id: 'copies', label: '코드 사본', icon: 'copy' },
    { id: 'diff', label: '환경 차이', icon: 'sliders' },
    { id: 'isol', label: '환경 격리', icon: 'shield' },
    { id: 'ver', label: '버전', icon: 'tag' },
  ],
  scene: {
    nodes: {
      r_dev: { at: [0.4, 2.2], label: 'dev/', sub: '원본', icon: 'folder', color: 'teal' },
      r_stg: { at: [2.2, 0.4], label: 'stg/', sub: '복사본', icon: 'folder', color: 'yellow' },
      r_prod: { at: [4.0, -1.4], label: 'prod/', sub: '복사본', icon: 'folder', color: 'orange' },

      cfg: { at: [2.2, 0.4], label: '구성 한 벌', sub: 'main.tf', icon: 'file-code', color: 'olive' },
      vars: { kind: 'tile', at: [0.4, 2.2], label: 'variables.tf', icon: 'variable', color: 'olive' },
      tv_dev: { kind: 'tile', at: [-2.2, -0.4], label: 'dev.tfvars', icon: 'sliders', color: 'teal' },
      tv_stg: { kind: 'tile', at: [-0.4, -2.2], label: 'stg.tfvars', icon: 'sliders', color: 'yellow' },
      tv_prod: { kind: 'tile', at: [1.4, -4.0], label: 'prod.tfvars', icon: 'sliders', color: 'orange' },
      out: { kind: 'tile', at: [4.6, 2.8], label: 'output "vpc_id"', icon: 'send', color: 'olive' },

      mod: { at: [4.6, 2.8], label: 'network', sub: '모듈', icon: 'puzzle', color: 'olive' },
      sn_a: { at: [5.5, 6.7], size: 's', label: 'app["a"]', sub: '10.0.1.0/24', icon: 'cells', color: 'green' },
      sn_b: { at: [7.0, 5.2], size: 's', label: 'app["b"]', sub: '10.0.2.0/24', icon: 'cells', color: 'green' },
      sn_c: { at: [8.5, 3.7], size: 's', label: 'app["c"]', sub: '10.0.3.0/24', icon: 'cells', color: 'green' },
      tftest: { kind: 'tile', at: [2.4, 4.8], label: 'network.tftest.hcl', icon: 'flask', color: 'teal' },

      ws_dev: { kind: 'cyl', at: [2.8, 4.6], label: 'state: dev', icon: 'file-key', color: 'slate' },
      ws_stg: { kind: 'cyl', at: [4.6, 2.8], label: 'state: stg', icon: 'file-key', color: 'slate' },
      ws_prod: { kind: 'cyl', at: [6.4, 1.0], label: 'state: prod', icon: 'file-key', color: 'slate' },

      reg: { kind: 'cyl', at: [-0.4, -2.2], label: 'Terraform Registry', icon: 'package', color: 'slate' },
    },
    edges: {
      e_vars: { from: 'vars', to: 'cfg' },
      e_tv1: { from: 'tv_dev', to: 'cfg' },
      e_tv2: { from: 'tv_stg', to: 'cfg' },
      e_tv3: { from: 'tv_prod', to: 'cfg' },
      e_out: { from: 'cfg', to: 'out' },
      e_mod: { from: 'cfg', to: 'mod', bi: true },
      e_sa: { from: 'mod', to: 'sn_a' },
      e_sb: { from: 'mod', to: 'sn_b' },
      e_sc: { from: 'mod', to: 'sn_c' },
      e_test: { from: 'tftest', to: 'mod', style: 'dashed' },
      e_r1: { from: 'r_dev', to: 'mod' },
      e_r2: { from: 'r_stg', to: 'mod' },
      e_r3: { from: 'r_prod', to: 'mod' },
      e_w1: { from: 'cfg', to: 'ws_dev' },
      e_w2: { from: 'cfg', to: 'ws_stg' },
      e_w3: { from: 'cfg', to: 'ws_prod' },
      e_reg: { from: 'reg', to: 'cfg' },
    },
  },
  codes: {
    vars: {
      title: 'variables.tf + main.tf', lang: 'hcl',
      text: `variable "env" {
  type = string
  validation {
    condition = contains(
      ["dev", "stg", "prod"], var.env
    )
    error_message = "dev, stg, prod만 됩니다."
  }
}

variable "vpc_cidr" {
  type = string # default 없음: 꼭 줘야 함
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
}
`,
    },
    tfvars: {
      title: '터미널', lang: 'sh',
      text: `$ cat dev.tfvars
env      = "dev"
vpc_cidr = "10.0.0.0/16"

$ cat prod.tfvars
env           = "prod"
vpc_cidr      = "10.2.0.0/16"
instance_type = "t3.large"

$ terraform plan -var-file=prod.tfvars
...
Plan: 3 to add, 0 to change, 0 to destroy.
`,
    },
    locals: {
      title: 'main.tf + outputs.tf', lang: 'hcl',
      text: `locals {
  name = "shop-\${var.env}"
  tags = {
    Project = "shop"
    Env     = var.env
    Managed = "terraform"
  }
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = merge(local.tags, {
    Name = local.name
  })
}

output "vpc_id" {
  description = "다른 구성이 참조할 VPC ID"
  value       = aws_vpc.main.id
}
`,
    },
    module: {
      title: 'main.tf (루트 모듈)', lang: 'hcl',
      text: `module "net" {
  source = "./modules/network"

  name = "shop-\${var.env}" # 입구: variable
  cidr = var.vpc_cidr
}

resource "aws_instance" "web" {
  ami           = var.web_ami
  instance_type = var.instance_type
  subnet_id     = module.net.subnet_ids["a"]
} # 출구: output으로 받은 값 ↑

# modules/network/
#   variables.tf   name, cidr
#   main.tf        aws_vpc, aws_subnet
#   outputs.tf     vpc_id, subnet_ids
`,
    },
    registry: {
      title: 'main.tf', lang: 'hcl',
      text: `module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = "shop-\${var.env}"
  cidr = var.vpc_cidr
  azs  = ["ap-northeast-2a",
          "ap-northeast-2c"]

  private_subnets = ["10.0.1.0/24",
                     "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24",
                     "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

# source의 세 가지 모양
#   ./modules/network      로컬 폴더
#   terraform-aws-modules/ 레지스트리
#   github.com/…?ref=v1.4  Git 태그
`,
    },
    countc: {
      title: 'main.tf + 터미널', lang: 'hcl',
      text: `variable "cidrs" {
  default = ["10.0.1.0/24", # [0] a
             "10.0.2.0/24", # [1] b ← 삭제
             "10.0.3.0/24"] # [2] c
}

resource "aws_subnet" "app" {
  count      = length(var.cidrs)
  vpc_id     = aws_vpc.main.id
  cidr_block = var.cidrs[count.index]
}

# b를 목록에서 지운 뒤 terraform plan
# aws_subnet.app[1] must be replaced
#   cidr_block = "10.0.2.0/24"
#             -> "10.0.3.0/24"
# aws_subnet.app[2] will be destroyed
# Plan: 1 to add, 0 to change, 2 to destroy.
`,
    },
    foreach: {
      title: 'modules/network/main.tf', lang: 'hcl',
      text: `variable "subnets" {
  type = map(string)
  default = {
    a = "10.0.1.0/24"
    b = "10.0.2.0/24"
    c = "10.0.3.0/24"
  }
}

resource "aws_subnet" "app" {
  for_each = var.subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value
  availability_zone = "ap-northeast-2\${each.key}"
}

output "subnet_ids" {
  value = {
    for k, s in aws_subnet.app : k => s.id
  }
}
`,
    },
    dirs: {
      title: '저장소 구조', lang: 'text',
      text: `shop-infra/
├── modules/
│   └── network/         # 공통 모듈
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── envs/
    ├── dev/
    │   ├── main.tf      # module 호출만
    │   ├── backend.tf   # key = "dev/…"
    │   └── terraform.tfvars
    ├── stg/
    │   └── …
    └── prod/
        ├── main.tf
        ├── backend.tf   # key = "prod/…"
        └── terraform.tfvars
`,
    },
    ws: {
      title: '터미널', lang: 'sh',
      text: `$ terraform workspace new prod
Created and switched to workspace "prod"!

$ terraform workspace list
  default
  dev
  stg
* prod

# 며칠 뒤, dev를 고치려던 사람이
$ terraform apply -var-file=dev.tfvars
...
Apply complete! Resources: 3 added,
0 changed, 3 destroyed.

# 선택된 workspace는 여전히 prod였습니다
`,
    },
    upgrade: {
      title: 'envs/*/main.tf', lang: 'hcl',
      text: `# envs/dev/main.tf   ① 먼저 올림
module "net" {
  source = "github.com/shop/tf-net?ref=v1.5.0"
  name   = "shop-dev"
  cidr   = "10.0.0.0/16"
}

# envs/prod/main.tf  ② dev · stg 확인 뒤
module "net" {
  source = "github.com/shop/tf-net?ref=v1.4.0"
  name   = "shop-prod"
  cidr   = "10.2.0.0/16"
}

# ref를 바꾼 폴더에서
#   terraform init -upgrade
#   terraform plan  → 차이를 PR에 첨부
`,
    },
    test: {
      title: 'tests/network.tftest.hcl', lang: 'hcl',
      text: `variables {
  name = "test"
  cidr = "10.99.0.0/16"
}

run "subnet_per_az" {
  command = plan

  assert {
    condition = length(aws_subnet.app) == 3
    error_message = "AZ마다 서브넷 하나"
  }
}

# $ terraform test
# tests/network.tftest.hcl... pass
#   run "subnet_per_az"... pass
# Success! 1 passed, 0 failed.
`,
    },
  },
  steps: [
    {
      key: '복사한 환경', kind: 'problem', title: 'dev를 복사해 prod를 만들었습니다',
      body: [
        'shop.example의 dev 환경은 <code>main.tf</code> 하나로 만들었습니다. stg와 prod가 필요해지자 가장 빠른 길을 택했어요. 폴더를 통째로 <b>복사</b>하고 CIDR과 인스턴스 크기만 고치는 거죠.',
        '석 달 뒤 세 폴더는 서로 다른 코드가 되어 있습니다. 보안 그룹 수정은 dev에만 들어갔고, 태그 규칙은 stg에서 빠졌어요. 고칠 것이 생길 때마다 세 번 고쳐야 하고, 한 번이라도 빠뜨리면 "dev에서는 됐는데 prod에서는 안 되는" 차이가 생깁니다.',
      ],
      callout: { type: 'key', text: '환경은 <b>같은 코드, 다른 값</b>이어야 합니다. 그래야 dev에서 확인한 것이 prod에서도 같다고 말할 수 있어요.' },
      show: ['r_dev', 'r_stg', 'r_prod'],
      tags: [
        { on: 'r_dev', text: '수정은 여기만', icon: 'pencil' },
        { on: 'r_stg', text: '태그 규칙 빠짐', tone: 'warn' },
        { on: 'r_prod', text: '수정 누락', tone: 'bad' },
      ],
      metrics: { copies: ['3벌', 'bad'], diff: ['코드 곳곳에', 'bad'], isol: '폴더 복사', ver: ['고정 안 함', 'warn'] },
      more: [
        { title: '직접 해보기', body: ['복사한 폴더가 얼마나 벌어졌는지는 diff 한 번이면 보입니다. 이 출력 하나하나가 "어느 쪽이 맞는가"를 사람이 판단해야 하는 숙제예요.'], code: { title: 'terminal', lang: 'sh', text: `$ diff -r dev/ prod/ --exclude=.terraform
diff -r dev/security.tf prod/security.tf
12c12
<   cidr_blocks = ["10.0.0.0/16"]
---
>   cidr_blocks = ["10.2.0.0/16", "0.0.0.0/0"]
diff -r dev/main.tf prod/main.tf
5a6,8
>   lifecycle {
>     ignore_changes = [tags]
>   }` } },
        { title: '왜 복사가 끌리는가', body: [
          '복사는 첫날 가장 빠르고, 환경마다 "조금 다르게" 하고 싶은 요구를 쉽게 들어줍니다. 문제는 그 "조금"이 의도인지 실수인지 아무도 구분하지 못하게 된다는 것이에요. 의도한 차이는 <b>값</b>으로 드러나야 하고, 코드는 하나여야 합니다.',
        ] },
        { title: '이 레슨의 순서', list: [
          '달라지는 값을 <b>variable</b>과 <b>tfvars</b>로 분리',
          '공통 코드를 <b>모듈</b>로 묶고, 남이 만든 모듈도 가져다 쓰기',
          '여러 개는 <b>for_each</b>로, count의 함정 피하기',
          '환경마다 <b>state · 권한 · 계정</b> 나누기, 모듈 버전 올리기와 테스트',
        ] },
      ],
    },
    {
      key: 'variable', kind: 'solution', title: 'variable: 달라지는 값만 밖으로',
      body: [
        '세 폴더를 비교하면 정말 달라야 하는 것은 몇 개뿐입니다. 환경 이름, CIDR, 인스턴스 크기. 이것을 <b>variable</b>(입력 변수)로 선언하고, 코드에서는 <code>var.이름</code>으로 씁니다.',
        '<code>type</code>은 잘못된 값을 plan 단계에서 걸러 주고, <code>default</code>가 있으면 생략할 수 있어요. default가 없는 변수는 <b>반드시 값을 줘야</b> 합니다. <code>validation</code>으로 허용 값을 좁혀 두면, 오타 난 환경 이름이 리소스 이름에 박히는 일을 막습니다.',
      ],
      callout: { type: 'tip', text: '모든 것을 변수로 만들지는 마세요. 환경마다 <b>정말 달라지는 값</b>만 변수이고, 나머지는 코드에 고정해야 환경들이 닮은 채로 남습니다.' },
      hide: ['r_dev', 'r_stg', 'r_prod'],
      show: ['cfg', 'vars'],
      code: { ref: 'vars', hl: [1, 2, 11, 12, 15, 16, 17, 21] },
      tags: [{ on: 'vars', text: 'env · vpc_cidr · 크기', tone: 'accent' }],
      flows: [{ path: ['vars', 'cfg'], kind: 'data', n: 3, gap: 0.5 }],
      metrics: { copies: ['1벌', 'ok'], diff: ['변수 3개', 'ok'], isol: '-' },
      changes: [['-', '폴더 사본 3벌'], ['+', '구성 1벌 + 변수 3개']],
      more: [
        { title: '타입의 종류', rows: [
          ['string · number · bool', '기본 타입', 'info'],
          ['list(string)', '순서 있는 목록', 'info'],
          ['map(string)', '키 → 값 (for_each에 좋음)', 'accent'],
          ['object({ … })', '이름 붙은 필드 묶음', 'accent'],
          ['optional(type, 기본값)', 'object 안의 생략 가능한 필드', 'mute'],
        ] },
        { title: '설정 예시', body: ['관련된 값은 object로 묶으면 호출하는 쪽이 읽기 쉽고, 빠뜨린 필드는 plan 전에 오류가 납니다.'], code: { title: 'variables.tf', lang: 'hcl', text: `variable "db" {
  type = object({
    instance_class = string
    multi_az       = optional(bool, false)
    backup_days    = optional(number, 7)
  })
  validation {
    condition     = var.db.backup_days >= 1
    error_message = "백업은 최소 1일 보관해야 합니다."
  }
}` } },
        { title: '흔한 실수', list: [
          '모든 인자를 변수로 열어 둠 → 환경마다 조금씩 다른 값이 들어가 복사본과 같은 상태로 돌아갑니다',
          '<code>description</code>을 비워 둠 → 모듈을 쓰는 사람이 변수의 단위(GB인지 MB인지)와 의미를 코드를 열어 봐야 압니다',
          'default로 운영 값을 넣어 둠 → dev에서 값을 안 주면 prod 크기의 리소스가 생깁니다. 위험한 값은 default 없이 꼭 받게 하세요',
        ] },
      ],
    },
    {
      key: 'tfvars', kind: 'concept', title: 'tfvars: 환경마다 값 파일 하나',
      body: [
        '변수의 값은 <b>.tfvars</b> 파일에 모으고 <code>-var-file=prod.tfvars</code>로 고릅니다. 이제 dev와 prod의 차이는 파일 두 개를 나란히 놓으면 전부 보여요.',
        '값을 주는 길은 여럿이고 뒤로 갈수록 우선합니다. <code>TF_VAR_이름</code> 환경 변수 → <code>terraform.tfvars</code>(자동으로 읽음) → <code>*.auto.tfvars</code> → 명령줄의 <code>-var</code> · <code>-var-file</code>.',
      ],
      callout: { type: 'warn', text: 'state가 하나인 채로 값 파일만 바꿔 apply하면, prod가 새로 생기는 것이 아니라 <b>dev가 prod 값으로 바뀝니다</b>. 환경마다 state도 따로여야 해요.' },
      hide: ['vars'],
      show: ['tv_dev', 'tv_stg', 'tv_prod'],
      code: { ref: 'tfvars', hl: [5, 6, 7, 8, 10] },
      focus: ['tv_prod'],
      tags: [{ on: 'tv_prod', text: '-var-file로 선택', tone: 'accent' }],
      flows: [{ path: ['tv_prod', 'cfg'], kind: 'data', n: 3, gap: 0.5 }],
      metrics: { diff: ['tfvars 한 파일', 'ok'], isol: ['state 하나', 'bad'] },
      more: [
        { title: '우선순위 (아래가 이김)', rows: [
          ['variable의 default', '값이 하나도 없을 때', 'mute'],
          ['TF_VAR_이름 환경 변수', 'CI · 비밀값 주입에', 'info'],
          ['terraform.tfvars', '자동으로 읽힘', 'info'],
          ['*.auto.tfvars', '자동으로 읽힘 (이름순)', 'info'],
          ['-var · -var-file', '명령줄, 적은 순서대로', 'accent'],
        ] },
        { title: '비밀값은 파일에 두지 않습니다', body: [
          'DB 비밀번호 같은 값을 <code>prod.tfvars</code>에 적어 커밋하면 저장소 히스토리에 영원히 남습니다. CI에서는 시크릿 저장소의 값을 <code>TF_VAR_db_password</code> 환경 변수로 넘기고, 변수에는 <code>sensitive = true</code>를 붙여 화면 출력을 가립니다. 더 좋은 방법은 state 레슨에서 본 것처럼 비밀이 Terraform을 아예 거치지 않게 하는 거예요.',
        ] },
        { title: '흔한 실수', list: [
          '<code>terraform.tfvars</code>에 prod 값을 두고 잊음 → 자동으로 읽히니, 다른 값 파일을 안 준 실행이 조용히 prod 값을 씁니다',
          '<code>*.auto.tfvars</code>가 여러 개라 무엇이 이기는지 헷갈림 → 환경마다 파일 하나, 명시적인 <code>-var-file</code> 하나가 가장 덜 놀랍습니다',
        ] },
      ],
    },
    {
      key: 'locals·output', kind: 'concept', title: 'locals는 안에서, output은 밖으로',
      body: [
        '<b>locals</b>는 구성 안에서만 쓰는, 이름 붙인 값입니다. <code>shop-${var.env}</code> 같은 이름 규칙이나 공통 태그를 한 번만 계산해 두고 <code>local.이름</code>으로 써요. 규칙이 바뀌면 한 곳만 고치면 됩니다.',
        '<b>output</b>은 반대로 밖에 내보내는 값입니다. apply가 끝나면 화면에 출력되고 state에 기록되어, 다른 구성이나 스크립트가 읽어 갈 수 있어요. VPC ID처럼 만들어져야 정해지는 값을 넘길 때 씁니다.',
      ],
      callout: { type: 'key', text: '함수에 빗대면 쉽습니다. <b>variable은 인자, locals는 지역 변수, output은 반환값</b>이에요. 그렇다면 함수 자체는 무엇일까요?' },
      hide: ['tv_dev', 'tv_stg', 'tv_prod'],
      show: ['out'],
      code: { ref: 'locals', hl: [1, 2, 3, 12, 13, 17, 19] },
      tags: [
        { on: 'cfg', text: 'local.name · tags', tone: 'accent' },
        { on: 'out', text: '밖에서 읽는 값', pos: 'left' },
      ],
      flows: [{ path: ['cfg', 'out'], kind: 'data', n: 2 }],
      more: [
        { title: '직접 해보기', body: ['apply 뒤 output은 명령으로 꺼내 씁니다. 스크립트에서는 <code>-raw</code>나 <code>-json</code>이 편해요.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform output
vpc_id = "vpc-0a1b2c3d4e5f67890"

$ terraform output -raw vpc_id
vpc-0a1b2c3d4e5f67890

$ terraform console
> local.name
"shop-prod"` } },
        { title: 'locals를 쓸 때와 말 때', list: [
          '같은 표현식이 <b>두 곳 이상</b>에서 반복되면 locals로 뺍니다 (이름 규칙, 공통 태그, CIDR 계산)',
          '한 번만 쓰는 값을 locals로 빼면 오히려 읽는 사람이 위아래로 오가야 합니다',
          '<code>cidrsubnet("10.0.0.0/16", 8, 1)</code> 같은 계산을 locals에 두면, 서브넷 대역 규칙이 코드 한 곳에 모입니다',
        ] },
        { title: 'output 설계', body: [
          'output은 다른 구성과의 <b>약속</b>입니다. 이름을 바꾸거나 지우면 그것을 읽던 쪽이 깨지니, API처럼 신중하게 다룹니다. 무엇이든 다 내보내기보다 다른 쪽이 정말 필요로 하는 ID와 이름만 내보내고, 비밀이 섞인 값은 <code>sensitive = true</code>를 붙입니다.',
        ] },
      ],
    },
    {
      key: '모듈', kind: 'solution', title: 'module: 폴더 하나가 함수 하나',
      body: [
        '<b>모듈</b>은 <code>.tf</code> 파일이 든 폴더입니다. 지금까지 작업한 폴더도 사실 모듈이고, <b>루트 모듈</b>이라고 불러요. 네트워크 부분을 <code>modules/network</code>로 옮기고 <code>module</code> 블록으로 <b>호출</b>하면, 그 안의 VPC와 서브넷이 한 덩어리로 만들어집니다.',
        '모듈의 variable이 <b>입구</b>, output이 <b>출구</b>입니다. 호출하는 쪽은 <code>name</code>과 <code>cidr</code>만 넘기고, 결과는 <code>module.net.vpc_id</code>처럼 받아요.',
      ],
      callout: { type: 'warn', text: '모듈을 추가하거나 source를 바꾸면 <code>terraform init</code>을 다시 실행해야 합니다. 리소스 하나를 감싸기만 하는 모듈은 만들지 마세요. 인자만 늘고 얻는 것이 없습니다.' },
      hide: ['out'],
      show: ['mod'],
      set: { cfg: { label: '루트 모듈', sub: '호출하는 쪽' } },
      code: { ref: 'module', hl: [1, 2, 4, 5, 11] },
      tags: [
        { on: 'cfg', text: 'name · cidr 넘김' },
        { on: 'mod', text: 'output: vpc_id 등', tone: 'accent', pos: 'bottom' },
      ],
      flows: [{ path: ['cfg', 'mod'], kind: 'data', n: 2 }, { path: ['mod', 'cfg'], kind: 'data', n: 2, delay: 1.6 }],
      metrics: { copies: ['1벌 + 모듈', 'ok'] },
      changes: [['+', 'modules/network (VPC · 서브넷)'], ['~', '루트: 리소스 대신 module 호출']],
      more: [
        { title: '동작 원리', body: [
          '모듈 안의 리소스는 state에서 <code>module.net.aws_vpc.this</code>처럼 <b>모듈 이름이 붙은 주소</b>를 갖습니다. 같은 모듈을 <code>module "net_a"</code>, <code>module "net_b"</code>로 두 번 부르면 주소가 달라 두 벌이 만들어져요. 모듈 안에서는 바깥의 변수나 리소스를 직접 볼 수 없고, 오직 variable로 받은 것만 씁니다. 그래서 모듈은 <b>입구와 출구만 맞으면</b> 속을 바꿔도 호출하는 쪽이 깨지지 않습니다.',
          '기존 리소스를 모듈 안으로 옮기면 주소가 바뀌어 삭제 · 생성 plan이 나옵니다. state 레슨의 <code>moved</code> 블록으로 옮겼다고 알려 주세요.',
        ] },
        { title: '좋은 모듈의 조건', list: [
          '<b>하나의 목적</b>: "네트워크", "웹 서비스 한 벌"처럼 이름 하나로 설명됨',
          '<b>좁은 입구</b>: 꼭 필요한 변수만, 나머지는 팀 규칙대로 안에서 고정',
          '<b>쓸모 있는 출구</b>: 호출하는 쪽이 다음 리소스에 바로 넣을 ID들',
          '<b>프로바이더 블록 없음</b>: 리전 · 계정은 호출하는 루트가 정하고, 모듈은 물려받습니다',
        ] },
        { title: '흔한 실수', list: [
          '모듈 안에 <code>provider</code> 블록을 둠 → 그 모듈을 지우기도, for_each로 여러 번 부르기도 어려워집니다',
          '모듈이 모듈을 깊게 부름(3단 이상) → 작은 변경이 어디까지 퍼지는지 아무도 모릅니다. 루트에서 평평하게 조합하는 편이 낫습니다',
        ] },
      ],
    },
    {
      key: '레지스트리', kind: 'concept', title: '남이 만든 모듈: 레지스트리와 Git',
      body: [
        '모듈은 직접 만들 수도, 가져다 쓸 수도 있습니다. <b>Terraform Registry</b>에는 VPC · EKS처럼 흔한 구성을 묶은 공개 모듈이 많아요. <code>source</code>에 레지스트리 주소를, <code>version</code>에 허용 범위를 적습니다.',
        '사내 모듈은 Git 저장소에 두고 <code>?ref=v1.4.0</code>처럼 <b>태그로 고정</b>해 부르는 경우가 많습니다. 어느 쪽이든 init이 <code>.terraform/modules/</code>로 내려받아요.',
      ],
      callout: { type: 'warn', text: '<code>version</code>이나 <code>ref</code>를 빼면 매번 <b>최신</b>을 받습니다. 남이 올린 새 버전이 내 plan을 바꾸지 않게, 모듈은 항상 고정합니다.' },
      show: ['reg'],
      code: { ref: 'registry', hl: [2, 3, 20, 21, 22] },
      tags: [{ on: 'reg', text: 'version = "~> 6.0"', tone: 'accent' }],
      flows: [{ path: ['reg', 'cfg'], kind: 'build', n: 2 }],
      metrics: { ver: ['모듈 고정', 'ok'] },
      changes: [['+', '레지스트리 모듈 (version 고정)'], ['+', '사내 모듈 (Git 태그 고정)']],
      more: [
        { title: 'source 모양과 고정 방법', rows: [
          ['./modules/network', '로컬 · 저장소와 같이 버전 관리', 'info'],
          ['네임스페이스/이름/프로바이더', '레지스트리 · version 인자', 'accent'],
          ['github.com/…?ref=v1.4.0', 'Git · 태그나 커밋으로', 'accent'],
          ['app.terraform.io/조직/…', '사설 레지스트리 · version', 'info'],
        ] },
        { title: '공개 모듈을 고를 때', list: [
          '내려받기 수, 최근 릴리스, 열린 이슈를 봅니다. 오래 방치된 모듈은 새 프로바이더 버전과 맞지 않을 수 있어요',
          '모듈이 만드는 리소스 목록을 <b>plan으로 직접 확인</b>합니다. VPC 모듈 하나가 NAT 게이트웨이 여러 개를 만들어 비용이 크게 나오기도 합니다(<code>single_nat_gateway</code> 같은 옵션 확인)',
          '입력 변수가 수십 개인 범용 모듈은 편하지만, 팀 규칙을 강제하려면 그 위에 얇은 사내 모듈을 하나 더 두기도 합니다',
        ] },
        { title: '흔한 실수', list: [
          'Git 모듈을 브랜치(<code>?ref=main</code>)로 부름 → 브랜치는 움직이므로 고정이 아닙니다. 태그나 커밋 해시를 씁니다',
          '모듈 source를 바꾸고 init을 안 함 → <code>Module not installed</code> 오류. 버전을 올릴 때는 <code>init -upgrade</code>',
        ] },
      ],
    },
    {
      key: 'count 사고', kind: 'case', title: '사례: 서브넷 하나 뺐더니 둘이 바뀐다',
      body: [
        '서브넷 세 개를 목록과 <code>count</code>로 만들었습니다. 쓰지 않는 b를 목록에서 지우자, plan에 <code>app[1]</code> <b>교체</b>와 <code>app[2]</code> <b>삭제</b>가 나옵니다. 지운 건 하나인데요.',
        'count의 주소는 <b>순번</b>입니다. b가 빠지면 c가 한 칸 당겨져 <code>[1]</code>이 되니, Terraform은 "[1]의 CIDR이 바뀌었다(교체)", "[2]는 사라졌다(삭제)"로 봅니다. 멀쩡한 c의 서버들이 서브넷째 흔들려요.',
      ],
      callout: { type: 'warn', text: '목록을 count로 돌리면 <b>가운데를 빼는 순간</b> 뒤가 모두 밀립니다. 항목마다 이름이 있는 것은 순번이 아니라 이름(키)으로 불러야 해요.' },
      hide: ['cfg', 'reg'],
      show: ['sn_a', 'sn_b', 'sn_c'],
      set: {
        cfg: { label: '구성 한 벌', sub: 'main.tf' },
        sn_a: { label: 'app[0]' },
        sn_b: { label: 'app[1]', state: 'hot', badge: '교체', tone: 'bad' },
        sn_c: { label: 'app[2]', state: 'down', badge: '삭제', tone: 'bad' },
      },
      code: { ref: 'countc', hl: [3, 8, 13, 16] },
      tags: [{ on: 'mod', text: 'count = 3 → 2', tone: 'warn' }],
      flows: [
        { path: ['mod', 'sn_b'], kind: 'bad' },
        { path: ['mod', 'sn_c'], kind: 'bad', delay: 0.6 },
      ],
      metrics: { diff: ['의도 1 · plan 2', 'bad'] },
      changes: [['-', '목록에서 b 하나 삭제'], ['~', 'app[1]: b → c의 CIDR로 교체'], ['-', 'app[2] 삭제']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '하나 뺐는데 교체 · 삭제가 여럿', 'bad'],
          ['원인', 'count 주소 = 순번, 뒤 항목이 당겨짐', 'warn'],
          ['즉시 대응', 'apply하지 않고 목록을 되돌림', 'info'],
          ['해결', 'for_each(키 주소)로 바꾸기', 'ok'],
          ['옮기기', 'moved로 [0] → ["a"] 이어 주기', 'ok'],
        ] },
        { title: 'count가 맞는 곳', list: [
          '<b>켜고 끄는 스위치</b>: <code>count = var.enable_bastion ? 1 : 0</code>',
          '<b>모두 똑같은 것 N개</b>: 구별할 이름이 없고, 줄일 때 끝에서부터 빠져도 상관없는 경우',
          '그 밖에 항목마다 이름 · 설정이 다르면 for_each가 기본값입니다',
        ] },
        { title: '더 생각해 볼 것', body: [
          '서브넷이 교체되면 그 안의 인스턴스 · 로드 밸런서 대상도 함께 흔들립니다. 그래서 이 사고는 plan 출력 몇 줄보다 실제 영향이 훨씬 큽니다. "가운데 항목 삭제"뿐 아니라 "가운데에 끼워 넣기"와 "정렬 순서 바꾸기"도 같은 사고를 냅니다.',
        ] },
      ],
    },
    {
      key: 'for_each', kind: 'solution', title: 'for_each: 이름(키)으로 여러 개',
      body: [
        '<b>for_each</b>에 맵을 주면 키마다 리소스가 하나씩 생깁니다. 블록 안에서는 <code>each.key</code>와 <code>each.value</code>로 꺼내 써요.',
        '주소는 <code>aws_subnet.app["a"]</code>처럼 <b>키</b>가 됩니다. 그래서 맵에서 b를 빼면 <b>b만</b> 사라지고 c는 그대로예요. 맵을 환경마다 다르게 주면 dev는 서브넷 하나, prod는 셋도 같은 코드로 됩니다.',
      ],
      callout: { type: 'tip', text: '이미 count로 만든 것을 옮길 때는 <code>moved</code> 블록으로 <code>app[0]</code> → <code>app["a"]</code>를 이어 주면 교체 없이 바뀝니다.' },
      set: {
        sn_a: { label: 'app["a"]' },
        sn_b: { label: 'app["b"]', state: 'dim', badge: null },
        sn_c: { label: 'app["c"]', state: null, badge: null },
      },
      code: { ref: 'foreach', hl: [3, 4, 5, 6, 11, 14, 15] },
      tags: [
        { on: 'mod', text: 'for_each = 맵', tone: 'accent' },
        { on: 'sn_b', text: '빼면 b만 삭제', tone: 'ok' },
      ],
      flows: [
        { path: ['mod', 'sn_a'], kind: 'ctrl' },
        { path: ['mod', 'sn_c'], kind: 'ctrl', delay: 0.8 },
      ],
      metrics: { diff: ['의도 1 · plan 1', 'ok'] },
      changes: [['~', 'count(순번) → for_each(키)'], ['+', 'moved: [0] → ["a"] 등']],
      more: [
        { title: '설정 예시', body: ['count에서 for_each로 바꿀 때, 주소를 이어 주면 plan이 <code>has moved to</code>만 보여 줍니다.'], code: { title: 'moved.tf', lang: 'hcl', text: `moved {
  from = aws_subnet.app[0]
  to   = aws_subnet.app["a"]
}
moved {
  from = aws_subnet.app[2]
  to   = aws_subnet.app["c"]
}
# app[1](b)은 정말 지울 것이므로 옮기지 않음` } },
        { title: '알아 둘 규칙', list: [
          'for_each에는 <b>map</b>이나 <b>set(string)</b>만 줄 수 있습니다. 목록은 <code>toset(var.names)</code>로 바꿔 씁니다',
          '키는 <b>plan 때 알 수 있는 값</b>이어야 합니다. 다른 리소스가 만들어진 뒤에야 정해지는 ID를 키로 쓰면 "Invalid for_each argument" 오류가 납니다',
          '<code>for_each</code>는 module 블록에도 쓸 수 있어, 환경 하나에 같은 모듈을 여러 벌 부를 때 유용합니다',
        ] },
        { title: '실무 팁', body: [
          '키는 <b>바뀌지 않을 이름</b>으로 고릅니다. 키가 바뀌면 주소가 바뀌어 교체가 일어나니까요. 가용 영역 접미사(a, b, c), 서비스 이름처럼 의미가 안정적인 것이 좋고, 설명 문구나 순번은 피합니다.',
        ] },
      ],
    },
    {
      key: '디렉터리 분리', kind: 'solution', title: '환경 분리 ① 환경마다 디렉터리',
      body: [
        '이제 환경마다 <b>state를 따로</b> 둘 차례입니다. 가장 흔한 방법은 <code>envs/dev</code> · <code>envs/stg</code> · <code>envs/prod</code>처럼 환경마다 루트 모듈을 두는 것이에요. 각 폴더에는 백엔드 설정, 값 파일, 그리고 공통 모듈을 <b>호출하는 코드만</b> 있습니다.',
        '어느 환경을 건드리는지가 <b>지금 있는 폴더</b>로 드러나고, 환경마다 백엔드와 자격 증명을 달리할 수 있습니다.',
      ],
      callout: { type: 'warn', text: '함정은 환경 폴더가 다시 <b>두꺼워지는 것</b>입니다. 급한 수정을 prod의 main.tf에 직접 넣기 시작하면 첫 단계의 복사본으로 돌아가요.' },
      hide: ['sn_a', 'sn_b', 'sn_c'],
      show: ['r_dev', 'r_stg', 'r_prod'],
      set: {
        sn_b: { state: null },
        r_dev: { label: 'envs/dev', sub: '호출 + 값' },
        r_stg: { label: 'envs/stg', sub: '호출 + 값' },
        r_prod: { label: 'envs/prod', sub: '호출 + 값' },
      },
      code: { ref: 'dirs', hl: [9, 10, 11, 15, 16, 17] },
      tags: [
        { on: 'r_dev', text: 'state: dev/…' },
        { on: 'r_stg', text: 'state: stg/…' },
        { on: 'r_prod', text: 'state: prod/…' },
      ],
      flows: [
        { path: ['r_dev', 'mod'], kind: 'ctrl' },
        { path: ['r_stg', 'mod'], kind: 'ctrl', delay: 0.3 },
        { path: ['r_prod', 'mod'], kind: 'ctrl', delay: 0.6 },
      ],
      metrics: { isol: ['폴더 · state별', 'ok'] },
      changes: [['+', 'envs/dev · stg · prod (얇은 루트)'], ['~', 'state: 1개 → 환경별 3개'], ['~', '리소스 코드는 모듈 한 곳에']],
      more: [
        { title: '환경 폴더에 두는 것', list: [
          '<code>backend.tf</code>: 환경별 state 경로 (<code>key = "prod/network/…"</code>)',
          '<code>providers.tf</code>: 환경별 리전 · 계정 · 역할',
          '<code>main.tf</code>: 공통 모듈 호출만',
          '<code>terraform.tfvars</code>: 그 환경의 값',
        ] },
        { title: '직접 해보기', body: ['환경 사이의 차이는 이제 값 파일 diff로 확인합니다. 리소스 코드의 diff가 나오면 무언가 환경 폴더에 직접 들어갔다는 신호예요.'], code: { title: 'terminal', lang: 'sh', text: `$ diff envs/dev/terraform.tfvars \\
       envs/prod/terraform.tfvars
1,2c1,3
< env      = "dev"
< vpc_cidr = "10.0.0.0/16"
---
> env           = "prod"
> vpc_cidr      = "10.2.0.0/16"
> instance_type = "t3.large"

$ cd envs/prod && terraform plan` } },
        { title: '반복이 거슬린다면', body: [
          '환경마다 <code>backend.tf</code>와 모듈 호출이 비슷하게 반복되는 것이 싫어, Terragrunt 같은 도구로 공통 부분을 한 번만 적는 팀도 있습니다. 도구가 하나 늘어나는 비용이 있으니, 환경과 구성이 많아져 반복이 실제로 사고를 낼 때 고려하세요.',
        ] },
      ],
    },
    {
      key: 'workspace', kind: 'case', title: '사례: dev인 줄 알았는데 prod였다',
      body: [
        '두 번째 방법인 <b>workspace</b>는 <b>같은 코드, 같은 백엔드</b>에 state만 여러 벌 두는 기능입니다. <code>terraform workspace select prod</code>로 바꿔 가며 쓰니, 폴더가 늘지 않아 깔끔해 보여요.',
        '그런데 지금 어느 workspace인지는 폴더 이름처럼 눈에 보이지 않습니다. 며칠 전 prod를 선택해 둔 터미널에서 dev 값 파일로 apply하면, <b>prod가 dev 값으로 바뀝니다</b>. 백엔드와 자격 증명도 함께 쓰니 권한 분리도 어렵습니다.',
      ],
      callout: { type: 'key', text: 'workspace는 같은 구성의 <b>잠깐 쓰는 복제본</b>(기능 브랜치용 테스트 환경 등)에 맞습니다. 오래가고 권한이 달라야 하는 환경은 디렉터리로 나누세요.' },
      hide: ['r_dev', 'r_stg', 'r_prod', 'mod'],
      show: ['cfg', 'ws_dev', 'ws_stg', 'ws_prod'],
      set: { cfg: { sub: '폴더 하나' }, ws_prod: { state: 'hot', badge: 'dev 값 적용', tone: 'bad' } },
      code: { ref: 'ws', hl: [8, 11, 13, 14] },
      tags: [{ on: 'cfg', text: '지금 workspace는?', tone: 'warn', icon: 'help' }],
      flows: [{ path: ['cfg', 'ws_prod'], kind: 'bad', n: 3, gap: 0.5 }],
      metrics: { isol: ['state만 따로', 'warn'] },
      changes: [['~', '선택된 workspace: prod (며칠 전)'], ['-', 'prod에 dev.tfvars로 apply']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', 'prod 인스턴스가 dev 크기로 바뀜', 'bad'],
          ['확인', 'terraform workspace show → prod', 'warn'],
          ['원인', '선택 상태가 눈에 안 보임 + 같은 권한', 'warn'],
          ['복구', 'prod.tfvars로 다시 apply (교체 확인)', 'info'],
          ['재발 방지', '장기 환경은 디렉터리 · 계정 분리', 'ok'],
        ] },
        { title: '동작 원리', body: [
          'workspace를 고르면 같은 백엔드 안에서 state 경로만 바뀝니다. S3 백엔드라면 <code>env:/prod/…</code> 같은 접두사가 붙어요. 코드 안에서는 <code>terraform.workspace</code>로 현재 이름을 읽을 수 있어서, <code>var.env</code> 대신 그 값으로 분기하기도 합니다. 그러면 값 파일을 잘못 고르는 실수는 줄지만, <b>잘못된 workspace를 고르는 실수</b>는 그대로 남습니다.',
        ] },
        { title: 'workspace가 맞는 곳', list: [
          'PR마다 잠깐 띄웠다가 지우는 미리 보기 환경',
          '같은 모듈을 여러 리전에 똑같이 펼치는 테스트',
          'CLI workspace와 HCP Terraform의 workspace는 이름만 같고 개념이 다릅니다. 후자는 폴더 · 변수 · 권한까지 따로 갖는 실행 단위라 환경 분리에 씁니다',
        ] },
      ],
    },
    {
      key: '계정 분리', kind: 'compare', title: '가장 튼튼한 벽: 환경마다 계정',
      body: [
        '디렉터리와 state를 나눠도 같은 계정 안이라면, 권한 실수 하나로 dev 작업이 prod 리소스에 닿을 수 있습니다. 그래서 많은 팀이 환경마다 <b>클라우드 계정 자체</b>를 나눕니다.',
        '환경 폴더의 provider 블록이 그 환경 계정의 역할을 쓰게 하면, dev 폴더에서 실행한 apply는 <b>prod를 볼 권한조차 없습니다</b>. 비용도 계정별로 저절로 나뉘어요.',
      ],
      callout: { type: 'cloud', text: '경계의 이름은 클라우드마다 다릅니다. AWS는 계정, Azure는 구독, GCP는 프로젝트가 기본 단위예요.' },
      hide: ['cfg', 'ws_dev', 'ws_stg', 'ws_prod'],
      show: ['r_dev', 'r_prod', 'mod'],
      set: {
        cfg: { sub: 'main.tf' },
        ws_prod: { state: null, badge: null },
        r_dev: { icon: 'building', sub: 'dev 계정' },
        r_stg: { icon: 'building', sub: 'stg 계정' },
        r_prod: { icon: 'building', sub: 'prod 계정' },
      },
      panel: {
        title: '환경 경계', icon: 'shield',
        rows: [
          ['AWS', '계정 (Organizations로 묶음)', 'aws'],
          ['Azure', '구독 · 리소스 그룹', 'azure'],
          ['GCP', '프로젝트 (폴더로 묶음)', 'gcp'],
          ['NCP', '계정 분리 · Sub Account 권한', 'ncp'],
        ],
      },
      flows: [
        { path: ['r_dev', 'mod'], kind: 'ctrl' },
        { path: ['r_prod', 'mod'], kind: 'ctrl', delay: 0.6 },
      ],
      tags: [{ on: 'r_prod', text: 'prod 역할만 접근', tone: 'ok', icon: 'lock' }],
      metrics: { isol: ['계정 · state별', 'ok'] },
      changes: [['+', '환경마다 클라우드 계정'], ['~', 'provider: 환경 계정의 역할 사용']],
      more: [
        { title: '설정 예시', body: ['환경 폴더마다 provider가 그 환경의 계정 · 구독 · 프로젝트를 가리킵니다. 모듈은 provider를 물려받기만 해요.'], code: { title: 'envs/prod/providers.tf', lang: 'hcl', text: `# AWS: prod 계정의 배포 역할을 넘겨받음
provider "aws" {
  region = "ap-northeast-2"
  assume_role {
    role_arn = "arn:aws:iam::222222222222:role/tf-deploy"
  }
}

# Azure: prod 구독
provider "azurerm" {
  features {}
  subscription_id = var.prod_subscription_id
}

# GCP: prod 프로젝트
provider "google" {
  project = "shop-prod"
  region  = "asia-northeast3"
}` } },
        { title: '나누면 얻는 것', list: [
          '<b>권한</b>: dev 자격 증명으로는 prod API를 부를 수조차 없음',
          '<b>할당량</b>: dev의 부하 테스트가 prod의 vCPU 한도를 잡아먹지 않음',
          '<b>비용</b>: 청구서가 환경별로 저절로 나뉨 (FinOps 레슨)',
          '<b>사고 반경</b>: 계정 하나가 뚫려도 다른 환경은 별개',
        ] },
        { title: '흔한 실수', list: [
          '계정은 나눴는데 CI의 배포 역할 하나가 모든 계정에 들어갈 수 있음 → 벽에 문을 하나 더 뚫은 셈입니다. 환경마다 배포 역할과 신뢰 조건을 따로 둡니다',
          '네트워크 대역을 계정마다 아무렇게나 잡음 → 나중에 계정끼리 연결할 때 대역이 겹칩니다. 대역 계획은 처음부터 함께 세웁니다',
        ] },
      ],
    },
    {
      key: '버전 올리기', kind: 'solution', title: '모듈 새 버전은 dev부터 올립니다',
      body: [
        '공통 모듈을 고쳐 <code>v1.5.0</code> 태그를 달았습니다. 환경 폴더가 모듈을 <b>태그로 고정</b>해 두었으니, 아직 어느 환경도 바뀌지 않았어요. 이제 dev의 <code>ref</code>만 올려 plan을 보고, 문제없으면 stg, 마지막에 prod 순으로 올립니다.',
        '환경마다 쓰는 모듈 버전이 코드에 적혀 있으니, "prod는 지금 어떤 버전인가"가 질문이 아니라 <b>사실</b>이 됩니다.',
      ],
      callout: { type: 'tip', text: '모듈 버전은 <b>유의적 버전</b>으로 붙입니다. 입구나 출구가 깨지는 변경은 메이저(v2.0.0)를 올려, 쓰는 쪽이 준비하고 올리게 합니다.' },
      set: {
        mod: { sub: 'v1.5.0' },
        r_dev: { icon: 'folder', sub: 'net v1.5.0' },
        r_stg: { icon: 'folder', sub: 'net v1.5.0' },
        r_prod: { icon: 'folder', sub: 'net v1.4.0' },
      },
      show: ['r_stg'],
      code: { ref: 'upgrade', hl: [3, 10, 16, 17] },
      tags: [
        { on: 'r_dev', text: '① 먼저', tone: 'ok' },
        { on: 'r_prod', text: '② 확인 후', tone: 'warn' },
      ],
      flows: [
        { path: ['mod', 'r_dev'], kind: 'build' },
        { path: ['mod', 'r_stg'], kind: 'build', delay: 0.8 },
      ],
      metrics: { ver: ['환경별 고정', 'ok'] },
      changes: [['+', '모듈 v1.5.0 태그'], ['~', 'dev · stg: v1.4.0 → v1.5.0'], ['~', 'prod: v1.4.0 유지 (다음 차례)']],
      more: [
        { title: '올리는 순서', list: [
          '① 모듈 저장소에서 변경을 PR로 리뷰하고 <code>v1.5.0</code> 태그',
          '② <code>envs/dev</code>의 ref를 올리고 <code>init -upgrade</code> → plan을 PR에 첨부',
          '③ dev에 apply, 며칠 지켜본 뒤 stg, 그다음 prod를 같은 방식으로',
          '④ 모든 환경이 올라가면 모듈 쪽의 오래된 <code>moved</code> 블록 정리',
        ] },
        { title: '유의적 버전 읽기', rows: [
          ['v1.4.0 → v1.4.1', '패치: 버그 수정, plan 변화 거의 없음', 'ok'],
          ['v1.4.0 → v1.5.0', '마이너: 기능 추가, 기존 입력 유지', 'info'],
          ['v1.x → v2.0.0', '메이저: 입력 · 출력 · 주소가 바뀔 수 있음', 'warn'],
        ] },
        { title: '흔한 실수', list: [
          '모든 환경을 한 PR에서 한 번에 올림 → dev에서 잡혔어야 할 문제가 prod에서 처음 드러납니다',
          '모듈 안에서 리소스 이름을 바꾸고 moved를 빼먹음 → 버전을 올린 모든 환경의 plan에 삭제 · 생성이 나옵니다',
          '태그를 지웠다 같은 이름으로 다시 붙임 → 같은 ref가 다른 코드를 가리키게 됩니다. 태그는 한 번 붙이면 옮기지 않습니다',
        ] },
      ],
    },
    {
      key: '모듈 테스트', kind: 'concept', title: 'terraform test: 모듈의 약속을 확인',
      body: [
        '모듈을 고칠 때마다 dev에 apply해 보는 것만으로는 느리고 불안합니다. <code>terraform test</code>는 <code>.tftest.hcl</code> 파일에 적은 <b>run 블록</b>을 실행하고, <b>assert</b> 조건으로 결과를 확인해요.',
        '<code>command = plan</code>이면 실제로 만들지 않고 계획만으로 검사하고, <code>apply</code>면 진짜로 만든 뒤 검사하고 지웁니다. 모듈 PR마다 CI에서 돌리면, 깨진 버전에 태그가 붙기 전에 잡힙니다.',
      ],
      callout: { type: 'tip', text: '테스트할 것은 모듈의 <b>약속</b>입니다. "AZ마다 서브넷 하나", "태그 필수", "출력에 subnet_ids가 있다"처럼 쓰는 쪽이 기대는 것들이요.' },
      hide: ['r_dev', 'r_stg', 'r_prod'],
      show: ['tftest', 'sn_a', 'sn_b', 'sn_c'],
      set: { mod: { sub: '모듈' } },
      code: { ref: 'test', hl: [6, 7, 9, 10, 17] },
      tags: [{ on: 'tftest', text: '1 passed', tone: 'ok', icon: 'circle-check' }],
      flows: [
        { path: ['tftest', 'mod'], kind: 'ctrl' },
        { path: ['mod', 'sn_a'], kind: 'ctrl', delay: 0.8 },
        { path: ['mod', 'sn_b'], kind: 'ctrl', delay: 1.0 },
        { path: ['mod', 'sn_c'], kind: 'ctrl', delay: 1.2 },
      ],
      metrics: { ver: ['태그 전 검증', 'ok'] },
      changes: [['+', 'tests/*.tftest.hcl'], ['+', '모듈 PR마다 terraform test']],
      more: [
        { title: '검증의 사다리', rows: [
          ['terraform fmt -check', '모양 (CI에서 1초)', 'mute'],
          ['terraform validate', '문법 · 참조 · 타입', 'info'],
          ['variable validation', '잘못된 입력 거부', 'info'],
          ['terraform test (plan)', '계획만으로 약속 확인', 'accent'],
          ['terraform test (apply)', '실제로 만들고 확인 후 삭제', 'ok'],
        ] },
        { title: '직접 해보기', body: ['모듈 폴더에서 실행합니다. 실패하면 어떤 run의 어떤 assert가 깨졌는지 알려 줘요.'], code: { title: 'terminal', lang: 'sh', text: `$ cd modules/network
$ terraform init
$ terraform test
tests/network.tftest.hcl... in progress
  run "subnet_per_az"... fail
╷
│ Error: Test assertion failed
│   on tests/network.tftest.hcl line 10:
│ AZ마다 서브넷 하나
╵
tests/network.tftest.hcl... fail
Failure! 0 passed, 1 failed.` } },
        { title: '실무 팁', list: [
          '<code>command = apply</code> 테스트는 진짜 리소스를 만들므로 비용과 시간이 듭니다. 전용 테스트 계정에서, 중요한 모듈에만 씁니다',
          '테스트 중 실패로 리소스가 남을 수 있으니, 테스트 계정은 주기적으로 비우는 장치를 둡니다',
          '외부 API 없이 빠르게 돌리고 싶다면 프로바이더를 흉내 내는 mock 기능도 있습니다',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 같은 코드, 다른 값, 따로 둔 state',
      body: [
        '달라지는 값은 <b>variable</b>과 <b>tfvars</b>로, 반복 계산은 <b>locals</b>, 내보낼 값은 <b>output</b>에 둡니다. 묶음은 <b>모듈</b>로 만들거나 레지스트리에서 가져와 버전을 고정하고, 여러 개는 키로 부르는 <b>for_each</b>로 찍어냅니다.',
        '환경은 디렉터리 · state · 계정으로 나누고, 모듈 새 버전은 dev부터 올립니다. 다음 레슨에서는 이 구조에 <b>프로바이더를 여럿</b> 얹어 네 클라우드를 한 번에 다룹니다.',
      ],
      hide: ['tftest', 'sn_a', 'sn_b', 'sn_c'],
      show: ['r_dev', 'r_stg', 'r_prod'],
      set: {
        r_dev: { sub: '호출 + 값' },
        r_stg: { sub: '호출 + 값' },
        r_prod: { sub: '호출 + 값' },
      },
      tags: [{ on: 'mod', text: '같은 코드 · 다른 값', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['r_dev', 'mod'], kind: 'ctrl' },
        { path: ['r_stg', 'mod'], kind: 'ctrl', delay: 0.3 },
        { path: ['r_prod', 'mod'], kind: 'ctrl', delay: 0.6 },
      ],
    },
  ],
  quiz: [
    {
      q: '보안 그룹 규칙 5개를 목록과 count로 만들었습니다. 목록의 두 번째 항목을 지우고 plan을 돌리면 어떻게 될까요?',
      options: [
        '두 번째 규칙 하나만 삭제 대상으로 나온다',
        '인덱스가 비어 plan이 오류로 실패한다',
        '뒤의 규칙들이 한 칸씩 당겨져 여러 개가 수정 · 교체 대상으로 나온다. 키로 구분하는 for_each로 바꾸는 것이 좋다',
        '변화가 없다. count는 늘리기만 할 수 있다',
      ],
      answer: 2,
      step: 7,
      why: 'count의 주소는 [0], [1], [2]…라는 순번입니다. 가운데를 빼면 뒤 항목들의 순번이 바뀌어, Terraform은 내용이 달라진 것으로 보고 멀쩡한 리소스까지 고치거나 교체하려 합니다. for_each는 키가 주소라서 뺀 항목만 사라집니다.',
    },
    {
      q: 'dev는 누구나, prod는 운영 담당 몇 명만 apply할 수 있어야 하는 팀입니다. 환경을 어떻게 나누는 것이 맞을까요?',
      options: [
        'workspace로 나눈다. 코드가 한 벌이라 가장 안전하다',
        '환경별 디렉터리(루트 모듈)로 나누고 백엔드와 자격 증명을 환경마다 따로, 가능하면 계정까지 나눈다',
        '한 구성에 dev와 prod 리소스를 모두 넣고 -target으로 골라 apply한다',
        'tfvars 파일만 환경별로 두고 state는 하나를 함께 쓴다',
      ],
      answer: 1,
      step: 11,
      why: 'workspace는 같은 백엔드와 같은 자격 증명을 함께 쓰므로 환경별 권한 분리가 어렵고, 지금 어느 workspace인지 착각하기 쉽습니다. 디렉터리로 나누면 환경마다 백엔드 · 역할 · 계정을 달리할 수 있어요. state 하나를 함께 쓰면 값 파일을 바꾸는 순간 한 환경이 다른 환경의 값으로 덮입니다.',
    },
    {
      q: '공개 레지스트리의 VPC 모듈을 version 없이 쓰고 있습니다. 어느 날 바꾼 것이 없는데 CI의 plan에 NAT 게이트웨이 변경이 나옵니다. 가장 먼저 의심할 것은?',
      options: [
        'init이 모듈의 새 버전을 받아 와 모듈 속 동작이 바뀌었다. version으로 고정한다',
        'AWS가 NAT 게이트웨이를 자동으로 바꿨다',
        'tfvars 파일이 손상됐다',
        'output이 너무 많아 plan이 흔들린다',
      ],
      answer: 0,
      step: 6,
      why: 'version이 없으면 init 때마다 최신 모듈을 받습니다. 남이 올린 새 버전이 기본값이나 리소스 구성을 바꾸면 내 코드가 그대로여도 plan이 달라져요. 모듈은 version이나 Git 태그로 고정하고, 올릴 때는 의도적으로 PR을 거칩니다.',
    },
    {
      q: '모듈로 만들 가치가 가장 큰 것은?',
      options: [
        '프로젝트에서 한 번만 쓰는 S3 버킷 하나',
        'aws_instance 하나를 인자 그대로 감싼 것',
        '환경마다 다른 CIDR 값 목록',
        'VPC · 서브넷 · 라우팅을 팀 규칙대로 묶은 것으로, 세 환경이 모두 쓰는 네트워크',
      ],
      answer: 3,
      step: 5,
      why: '모듈은 여러 리소스를 규칙과 함께 묶어 여러 곳에서 다시 쓸 때 값어치가 있습니다. 리소스 하나를 그대로 감싼 모듈은 인자만 한 겹 더 늘리고, 한 번만 쓰는 것은 묶을 이유가 없어요. 환경마다 다른 값은 모듈이 아니라 변수와 tfvars에 둘 것입니다.',
    },
    {
      q: 'CI에서 terraform.tfvars와 prod.auto.tfvars가 모두 있고, 명령줄에 -var-file=dev.tfvars를 줬습니다. 같은 변수가 세 파일에 모두 있다면 어떤 값이 쓰일까요?',
      options: [
        'terraform.tfvars의 값',
        'prod.auto.tfvars의 값',
        'dev.tfvars의 값 (명령줄이 가장 우선)',
        '충돌 오류로 plan이 멈춘다',
      ],
      answer: 2,
      step: 3,
      why: '값의 우선순위는 default → 환경 변수 → terraform.tfvars → *.auto.tfvars → 명령줄 -var · -var-file 순이고 뒤가 이깁니다. 그래서 dev.tfvars가 쓰여요. 오류는 나지 않으니, 자동으로 읽히는 파일에 운영 값을 두면 조용히 섞일 수 있다는 점이 위험합니다.',
    },
    {
      q: '이미 count로 만든 서브넷 3개를 for_each로 바꾸려 합니다. 운영 중이라 서브넷이 교체되면 안 됩니다. 어떻게 해야 할까요?',
      options: [
        'count를 for_each로 바꾸고 바로 apply한다',
        'for_each로 바꾸면서 moved 블록으로 app[0] → app["a"]처럼 주소를 이어 주고, plan에 교체가 없는지 확인한다',
        'state 파일에서 인덱스를 직접 키로 고친다',
        '서브넷을 모두 지우고 for_each로 새로 만든다',
      ],
      answer: 1,
      step: 8,
      why: '주소가 [0]에서 ["a"]로 바뀌면 Terraform은 삭제와 생성으로 봅니다. moved 블록으로 이동을 알려 주면 실제 리소스는 그대로 두고 state의 주소만 바뀌어요. state를 직접 고치는 것은 위험하고, 지우고 다시 만드는 것은 운영 중에 장애입니다.',
    },
    {
      q: '며칠 전 workspace를 prod로 바꿔 둔 터미널에서, dev를 고치려고 -var-file=dev.tfvars로 apply했습니다. 무슨 일이 일어났을까요?',
      options: [
        'dev workspace가 자동으로 선택되어 dev가 바뀐다',
        'Terraform이 workspace와 값 파일이 다르다며 거부한다',
        'dev와 prod가 모두 바뀐다',
        'prod state의 리소스가 dev 값으로 바뀐다',
      ],
      answer: 3,
      step: 10,
      why: 'workspace는 어느 state를 쓸지만 정하고, 값 파일과의 짝을 검사하지 않습니다. 선택된 prod state의 리소스에 dev 값이 적용돼요. 이런 착각이 workspace를 장기 환경 분리에 권하지 않는 이유이고, 디렉터리와 계정으로 나누면 폴더와 권한이 실수를 막아 줍니다.',
    },
    {
      q: '공통 network 모듈을 고쳐 새 버전을 냈습니다. 세 환경에 가장 안전하게 반영하는 방법은?',
      options: [
        '세 환경의 ref를 한 PR에서 함께 올리고 동시에 apply한다',
        '모듈을 브랜치(ref=main)로 부르게 바꿔 자동으로 따라가게 한다',
        'dev의 ref만 먼저 올려 plan과 동작을 확인한 뒤 stg, prod 순으로 올린다',
        'prod에 먼저 올려 실제 트래픽으로 검증한다',
      ],
      answer: 2,
      step: 12,
      why: '환경 폴더가 모듈을 태그로 고정해 두었기에 환경마다 다른 시점에 올릴 수 있습니다. dev에서 문제를 먼저 잡고 차례로 올리는 것이 안전해요. 브랜치로 부르면 고정이 사라져 언제 무엇이 바뀔지 모르게 되고, 한꺼번에 올리면 dev에서 잡을 문제를 prod에서 만납니다.',
    },
    {
      q: 'dev 작업자가 실수로 prod 리소스를 지울 수 있는 구조 자체를 없애고 싶습니다. 가장 확실한 방법은?',
      options: [
        '환경마다 클라우드 계정(Azure는 구독, GCP는 프로젝트)을 나누고, 환경 폴더의 provider가 그 계정의 역할만 쓰게 한다',
        'prod 리소스 이름에 prod 접두사를 붙인다',
        'workspace 이름을 더 눈에 띄게 짓는다',
        'prod.tfvars를 읽기 전용 파일로 만든다',
      ],
      answer: 0,
      step: 11,
      why: '계정이 다르면 dev 자격 증명으로는 prod API를 부를 권한 자체가 없습니다. 이름 규칙이나 workspace 이름은 사람의 주의에 기대는 방법이고, 파일 권한은 다른 값 파일로 apply하는 것을 막지 못합니다.',
    },
    {
      q: '모듈을 고친 뒤 "AZ마다 서브넷이 하나"라는 약속이 깨지지 않았는지, 실제 리소스를 만들지 않고 PR마다 확인하고 싶습니다. 가장 알맞은 방법은?',
      options: [
        'terraform fmt -check',
        'command = plan인 run과 assert를 담은 .tftest.hcl을 terraform test로 실행',
        'dev에 매번 apply해 콘솔에서 센다',
        'output을 더 많이 만든다',
      ],
      answer: 1,
      step: 13,
      why: 'terraform test는 run 블록을 실행하고 assert로 결과를 확인합니다. command = plan이면 계획만으로 검사하니 빠르고 비용이 없어요. fmt는 모양만 보고, dev apply는 느리고 수작업입니다.',
    },
    {
      q: '로컬과 CI에서 같은 커밋으로 plan을 돌렸는데 CI에서만 예상 못 한 변경이 나옵니다. 모듈은 ref 태그로 고정돼 있습니다. 다음으로 의심할 것은?',
      options: [
        '프로바이더 버전이 고정되지 않았거나 .terraform.lock.hcl이 커밋되지 않아 CI가 다른 버전을 받았다',
        'CI의 CPU가 달라 plan 계산 결과가 달라졌다',
        'variable의 default 값은 CI에서 무시된다',
        'locals는 CI에서 다르게 계산된다',
      ],
      answer: 0,
      step: 6,
      why: '모듈을 고정해도 프로바이더 버전이 다르면 기본값과 동작이 달라질 수 있습니다. 모듈은 version이나 ref로, 프로바이더는 required_providers와 lock 파일로 고정해야 어디서 실행해도 같은 plan이 나옵니다. default와 locals는 실행 환경에 따라 달라지지 않습니다.',
    },
    {
      q: 'DB 비밀번호를 prod.tfvars에 적어 커밋하자는 의견이 나왔습니다. 가장 알맞은 대안은?',
      options: [
        'prod.tfvars를 .gitignore에 넣고 각자 노트북에 보관한다',
        '비밀번호를 locals에 적는다',
        'CI가 시크릿 저장소의 값을 TF_VAR_ 환경 변수로 넘기고 변수에 sensitive를 붙이거나, 비밀을 아예 Terraform 밖에서 관리한다',
        'default 값으로 넣어 둔다',
      ],
      answer: 2,
      step: 3,
      why: '파일에 적어 커밋하면 저장소 히스토리에 영원히 남습니다. 노트북 보관은 사람마다 값이 달라지고 유출 지점이 늘어요. 시크릿 저장소에서 환경 변수로 주입하거나, 관리형 서비스가 비밀을 만들어 보관하게 하는 것이 맞습니다. locals와 default도 결국 코드에 적힌 평문입니다.',
    },
  ],
};
