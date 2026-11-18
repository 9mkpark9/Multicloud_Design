export default {
  id: 'tf-modules',
  learn: [
    'variable · tfvars로 환경마다 다른 값만 분리',
    'locals와 output의 쓰임새',
    'module: 폴더 하나를 함수처럼 호출하기',
    'for_each로 여러 개 만들기, count와의 차이',
    '환경 분리: 디렉터리와 workspace의 함정',
    '프로바이더 · 모듈 버전 고정',
  ],
  legend: [['data', '값 (변수 · output)'], ['ctrl', '호출 · 생성'], ['build', '내려받는 코드'], ['bad', '잘못된 apply']],
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
  ami           = data.aws_ami.linux.id
  instance_type = var.instance_type
  subnet_id     = module.net.subnet_ids["a"]
} # 출구: output으로 받은 값 ↑

# modules/network/
#   variables.tf   name, cidr
#   main.tf        aws_vpc, aws_subnet
#   outputs.tf     vpc_id, subnet_ids
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
    versions: {
      title: 'versions.tf + main.tf', lang: 'hcl',
      text: `terraform {
  required_version = "~> 1.12"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.2" # 6.2 이상 7.0 미만
    }
  }
}

# 레지스트리 모듈: version으로 고정
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.0.0"
}

# Git 저장소의 모듈: 태그(ref)로 고정
module "net" {
  source = "github.com/shop/tf-net?ref=v1.4.0"
}
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
    },
    {
      key: 'tfvars', kind: 'concept', title: 'tfvars: 환경마다 값 파일 하나',
      body: [
        '변수의 값은 <b>.tfvars</b> 파일에 모으고 <code>-var-file=prod.tfvars</code>로 고릅니다. 이제 dev와 prod의 차이는 파일 두 개를 나란히 놓으면 전부 보여요.',
        '값을 주는 길은 여럿이고 뒤로 갈수록 우선합니다. <code>TF_VAR_이름</code> 환경 변수 → <code>terraform.tfvars</code>(자동으로 읽음) → <code>*.auto.tfvars</code> → 명령줄의 <code>-var</code> · <code>-var-file</code>. 비밀번호 같은 값은 tfvars에 적어 커밋하지 말고 환경 변수나 시크릿 저장소에서 받으세요.',
      ],
      callout: { type: 'warn', text: 'state가 하나인 채로 값 파일만 바꿔 apply하면, prod가 새로 생기는 것이 아니라 <b>dev가 prod 값으로 바뀝니다</b>. 환경마다 state도 따로여야 해요. 조금 뒤에 다룹니다.' },
      hide: ['vars'],
      show: ['tv_dev', 'tv_stg', 'tv_prod'],
      code: { ref: 'tfvars', hl: [5, 6, 7, 8, 10] },
      focus: ['tv_prod'],
      tags: [{ on: 'tv_prod', text: '-var-file로 선택', tone: 'accent' }],
      flows: [{ path: ['tv_prod', 'cfg'], kind: 'data', n: 3, gap: 0.5 }],
      metrics: { diff: ['tfvars 한 파일', 'ok'], isol: ['state 하나', 'bad'] },
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
    },
    {
      key: '모듈', kind: 'solution', title: 'module: 폴더 하나가 함수 하나',
      body: [
        '<b>모듈</b>은 <code>.tf</code> 파일이 든 폴더입니다. 지금까지 작업한 폴더도 사실 모듈이고, <b>루트 모듈</b>이라고 불러요. 네트워크 부분을 <code>modules/network</code>로 옮기고 <code>module</code> 블록으로 <b>호출</b>하면, 그 안의 VPC와 서브넷이 한 덩어리로 만들어집니다.',
        '모듈의 variable이 <b>입구</b>, output이 <b>출구</b>입니다. 호출하는 쪽은 <code>name</code>과 <code>cidr</code>만 넘기고, 결과는 <code>module.net.vpc_id</code>처럼 받아요. 안에서 서브넷을 어떻게 나누는지는 몰라도 됩니다.',
      ],
      callout: { type: 'warn', text: '모듈을 추가하거나 source를 바꾸면 <code>terraform init</code>을 다시 실행해야 합니다. 그리고 리소스 하나를 감싸기만 하는 모듈은 만들지 마세요. 인자만 늘고 얻는 것이 없습니다.' },
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
    },
    {
      key: 'for_each', kind: 'concept', title: 'for_each: 한 블록으로 여러 개',
      body: [
        '서브넷이 가용 영역마다 하나씩 필요합니다. 블록을 세 번 쓰는 대신 <b>for_each</b>에 맵을 주면, 키마다 리소스가 하나씩 생겨요. 블록 안에서는 <code>each.key</code>와 <code>each.value</code>로 꺼내 씁니다.',
        '주소는 <code>aws_subnet.app["a"]</code>처럼 <b>키</b>가 됩니다. 그래서 맵에서 b를 빼면 b만 사라져요. 맵을 환경마다 다르게 주면 dev는 서브넷 하나, prod는 셋도 같은 코드로 됩니다.',
      ],
      callout: { type: 'warn', text: '<code>count</code>로 목록을 돌리면 주소가 <code>[0]</code> · <code>[1]</code> · <code>[2]</code>입니다. 가운데 항목을 빼면 뒤가 한 칸씩 당겨져 멀쩡한 리소스까지 교체하려 들어요. count는 켜고 끄는 스위치(<code>var.enabled ? 1 : 0</code>) 정도에만 쓰세요.' },
      hide: ['cfg'],
      show: ['sn_a', 'sn_b', 'sn_c'],
      set: { cfg: { label: '구성 한 벌', sub: 'main.tf' } },
      code: { ref: 'foreach', hl: [3, 4, 5, 6, 11, 14, 15] },
      tags: [{ on: 'mod', text: 'for_each = 맵', tone: 'accent' }],
      flows: [
        { path: ['mod', 'sn_a'], kind: 'ctrl' },
        { path: ['mod', 'sn_b'], kind: 'ctrl', delay: 0.4 },
        { path: ['mod', 'sn_c'], kind: 'ctrl', delay: 0.8 },
      ],
    },
    {
      key: '디렉터리 분리', kind: 'compare', title: '환경 분리 ① 환경마다 디렉터리',
      body: [
        '이제 환경마다 <b>state를 따로</b> 둘 차례입니다. 가장 흔한 방법은 <code>envs/dev</code> · <code>envs/stg</code> · <code>envs/prod</code>처럼 환경마다 루트 모듈을 두는 것이에요. 각 폴더에는 백엔드 설정, 값 파일, 그리고 공통 모듈을 <b>호출하는 코드만</b> 있습니다.',
        '어느 환경을 건드리는지가 <b>지금 있는 폴더</b>로 드러나고, 환경마다 백엔드와 자격 증명을 달리할 수 있습니다. prod만 모듈의 이전 버전에 머물게 하는 것도 가능해요.',
      ],
      callout: { type: 'warn', text: '함정은 환경 폴더가 다시 <b>두꺼워지는 것</b>입니다. 급한 수정을 prod의 main.tf에 직접 넣기 시작하면 첫 단계의 복사본으로 돌아가요. 리소스는 모듈에, 환경 폴더에는 호출과 값만 둡니다.' },
      hide: ['sn_a', 'sn_b', 'sn_c'],
      show: ['r_dev', 'r_stg', 'r_prod'],
      set: {
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
    },
    {
      key: 'workspace', kind: 'case', title: '사례: dev인 줄 알았는데 prod였다',
      body: [
        '두 번째 방법인 <b>workspace</b>는 <b>같은 코드, 같은 백엔드</b>에 state만 여러 벌 두는 기능입니다. <code>terraform workspace select prod</code>로 바꿔 가며 쓰니, 폴더가 늘지 않아 깔끔해 보여요.',
        '그런데 지금 어느 workspace인지는 폴더 이름처럼 눈에 보이지 않습니다. 며칠 전 prod를 선택해 둔 터미널에서 dev 값 파일로 apply하면, <b>prod가 dev 값으로 바뀝니다</b>. 백엔드와 자격 증명도 하나를 함께 쓰니 "prod는 일부만 apply할 수 있다"는 권한 분리도 어렵습니다.',
      ],
      callout: { type: 'key', text: 'workspace는 같은 구성의 <b>잠깐 쓰는 복제본</b>(기능 브랜치용 테스트 환경 등)에 맞습니다. dev · prod처럼 오래가고 권한이 달라야 하는 환경은 디렉터리로, 가능하면 클라우드 계정까지 나누세요.' },
      hide: ['r_dev', 'r_stg', 'r_prod', 'mod'],
      show: ['cfg', 'ws_dev', 'ws_stg', 'ws_prod'],
      set: { cfg: { sub: '폴더 하나' }, ws_prod: { state: 'hot', badge: 'dev 값 적용', tone: 'bad' } },
      code: { ref: 'ws', hl: [8, 11, 13, 14] },
      tags: [{ on: 'cfg', text: '지금 workspace는?', tone: 'warn', icon: 'help' }],
      flows: [{ path: ['cfg', 'ws_prod'], kind: 'bad', n: 3, gap: 0.5 }],
      metrics: { isol: ['state만 따로', 'warn'] },
      changes: [['~', '선택된 workspace: prod (며칠 전)'], ['-', 'prod에 dev.tfvars로 apply']],
    },
    {
      key: '버전 고정', kind: 'solution', title: '프로바이더와 모듈의 버전을 고정',
      body: [
        '같은 코드가 같은 결과를 내려면 <b>코드가 기대는 것들</b>도 같아야 합니다. 프로바이더의 메이저 버전이 오르면 인자 이름이나 기본값이 바뀌어요. 고정하지 않으면 새로 <code>init</code>한 CI만 다른 버전을 받아, 같은 코드로 다른 plan이 나옵니다.',
        '<code>required_providers</code>에는 허용 범위를 적습니다. <code>~> 6.2</code>는 6.2 이상 7.0 미만이에요. 실제로 고른 정확한 버전은 <code>.terraform.lock.hcl</code>이 기록합니다. 이 파일은 <b>프로바이더만</b> 기록하므로, 모듈은 <code>version</code>이나 Git 태그로 직접 고정해야 해요.',
      ],
      callout: { type: 'tip', text: '올릴 때는 <code>terraform init -upgrade</code>로 <b>의도적으로</b> 올리고, lock 파일의 변경과 plan 결과를 PR에서 함께 리뷰합니다. dev에 먼저 적용해 보는 것은 물론이고요.' },
      hide: ['ws_dev', 'ws_stg', 'ws_prod'],
      show: ['mod', 'reg'],
      set: { cfg: { sub: 'envs/prod' }, ws_prod: { state: null, badge: null }, mod: { sub: 'v1.4.0' } },
      code: { ref: 'versions', hl: [2, 7, 15, 20] },
      tags: [
        { on: 'reg', text: 'aws ~> 6.2', tone: 'accent' },
        { on: 'mod', text: '태그로 고정', tone: 'ok', icon: 'tag', pos: 'bottom' },
      ],
      flows: [{ path: ['reg', 'cfg'], kind: 'build', n: 2 }, { path: ['mod', 'cfg'], kind: 'build', delay: 1.2 }],
      metrics: { isol: ['폴더 · state별', 'ok'], ver: ['범위 + lock 파일', 'ok'] },
      changes: [['+', 'required_version · required_providers'], ['+', '모듈 version / ref 태그'], ['~', '.terraform.lock.hcl을 Git에 커밋']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 같은 코드, 다른 값, 따로 둔 state',
      body: [
        '달라지는 값은 <b>variable</b>로 빼서 <b>tfvars</b>에 모으고, 반복되는 계산은 <b>locals</b>, 내보낼 값은 <b>output</b>에 둡니다. 묶음은 <b>모듈</b>로 만들어 여러 환경이 함께 호출하고, 여러 개는 <b>for_each</b>로 찍어냅니다.',
        '환경은 디렉터리와 state로 나누고, 프로바이더와 모듈의 버전을 고정해 어디서 실행해도 같은 plan이 나오게 합니다. 지금까지는 AWS 하나였어요. 다음 레슨에서는 이 구조에 <b>프로바이더를 여럿</b> 얹어 네 클라우드를 한 번에 다룹니다.',
      ],
      hide: ['cfg', 'reg'],
      show: ['r_dev', 'r_stg', 'r_prod'],
      set: { cfg: { sub: 'main.tf' } },
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
        '뒤의 규칙들이 한 칸씩 당겨져 여러 개가 수정 · 교체 대상으로 나온다. 키로 구분하는 for_each로 바꾸는 것이 좋다',
        '인덱스가 비어 plan이 오류로 실패한다',
        '변화가 없다. count는 늘리기만 할 수 있다',
      ],
      answer: 1,
      why: 'count의 주소는 [0], [1], [2]…라는 순번입니다. 가운데를 빼면 뒤 항목들의 순번이 바뀌어, Terraform은 내용이 달라진 것으로 보고 멀쩡한 리소스까지 고치거나 교체하려 합니다. for_each는 키가 주소라서 뺀 항목만 사라집니다.',
    },
    {
      q: 'dev는 누구나, prod는 운영 담당 몇 명만 apply할 수 있어야 하는 팀입니다. 환경을 어떻게 나누는 것이 맞을까요?',
      options: [
        'workspace로 나눈다. 코드가 한 벌이라 가장 안전하다',
        '환경별 디렉터리(루트 모듈)로 나누고 백엔드와 자격 증명을 환경마다 따로 둔다',
        '한 구성에 dev와 prod 리소스를 모두 넣고 -target으로 골라 apply한다',
        'tfvars 파일만 환경별로 두고 state는 하나를 함께 쓴다',
      ],
      answer: 1,
      why: 'workspace는 같은 백엔드와 같은 자격 증명을 함께 쓰므로 환경별 권한 분리가 어렵고, 지금 어느 workspace인지 착각하기 쉽습니다. 디렉터리로 나누면 환경마다 백엔드 · 역할 · 계정을 달리할 수 있어요. state 하나를 함께 쓰면 값 파일을 바꾸는 순간 한 환경이 다른 환경의 값으로 덮입니다.',
    },
    {
      q: '로컬과 CI에서 같은 커밋으로 plan을 돌렸는데 CI에서만 예상 못 한 변경이 나옵니다. 가장 먼저 의심할 것은?',
      options: [
        '프로바이더 버전을 고정하지 않았거나 .terraform.lock.hcl을 커밋하지 않아, CI가 다른 버전을 받았다',
        'CI의 CPU가 달라 plan 계산 결과가 달라졌다',
        'variable의 default 값은 CI에서 무시된다',
        'output 블록이 너무 많아 plan이 달라졌다',
      ],
      answer: 0,
      why: '같은 코드라도 프로바이더 버전이 다르면 기본값과 동작이 달라져 plan이 달라질 수 있습니다. 버전 범위를 required_providers에 적고 lock 파일을 커밋하면 로컬과 CI가 같은 버전을 씁니다. default와 output은 실행 환경에 따라 달라지지 않습니다.',
    },
    {
      q: '모듈로 만들 가치가 가장 큰 것은?',
      options: [
        '프로젝트에서 한 번만 쓰는 S3 버킷 하나',
        'aws_instance 하나를 인자 그대로 감싼 것',
        'VPC · 서브넷 · 라우팅을 팀 규칙대로 묶은 것으로, 세 환경이 모두 쓰는 네트워크',
        '환경마다 다른 CIDR 값 목록',
      ],
      answer: 2,
      why: '모듈은 여러 리소스를 규칙과 함께 묶어 여러 곳에서 다시 쓸 때 값어치가 있습니다. 리소스 하나를 그대로 감싼 모듈은 인자만 한 겹 더 늘리고, 한 번만 쓰는 것은 묶을 이유가 없어요. 환경마다 다른 값은 모듈이 아니라 변수와 tfvars에 둘 것입니다.',
    },
  ],
};
