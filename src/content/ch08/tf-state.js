export default {
  id: 'tf-state',
  learn: [
    'state: 코드의 주소와 실제 리소스를 잇는 기억',
    '원격 백엔드와 잠금, 클라우드별 저장소',
    'state 안의 비밀값 다루기',
    '드리프트 감지와 import',
    'moved · removed로 주소 바꾸고 관리에서 빼기',
    'state를 나눠 사고 반경 줄이기',
  ],
  legend: [['ctrl', 'API 호출'], ['res', '조회 결과'], ['data', 'state 읽기 · 쓰기'], ['build', '코드'], ['bad', '실패 · 덮어쓰기']],
  metrics: [
    { id: 'where', label: 'state 위치', icon: 'save' },
    { id: 'lock', label: '잠금', icon: 'lock' },
    { id: 'sync', label: 'state와 실제', icon: 'link' },
    { id: 'blast', label: '사고 반경', icon: 'target' },
  ],
  scene: {
    nodes: {
      file: { kind: 'tile', at: [-0.2, 0.6], label: 'main.tf', icon: 'file-code', color: 'olive' },
      tf: { at: [2.4, 0.6], label: 'Terraform', sub: 'CLI', icon: 'terminal', color: 'olive' },
      aws: { at: [2.4, -2.0], label: 'AWS', sub: '실제 리소스', icon: 'cloud', color: 'aws' },
      state: { kind: 'tile', at: [5.0, 0.6], label: 'terraform.tfstate', icon: 'file-text', color: 'slate' },
      s3: { kind: 'cyl', at: [5.0, 0.6], label: 'S3 버킷 (state)', icon: 'file-key', color: 'slate' },
      a: { kind: 'client', at: [2.4, 0.6], label: '민지' },
      b: { kind: 'client', at: [5.0, 3.2], label: '준호' },
      ops: { kind: 'client', at: [2.4, -4.6], label: '콘솔 사용자' },
      be_aws: { kind: 'cyl', at: [2.4, -2.0], label: 'S3', icon: 'archive', color: 'aws' },
      be_az: { kind: 'cyl', at: [5.0, 0.6], label: 'Blob Storage', icon: 'archive', color: 'azure' },
      be_gcp: { kind: 'cyl', at: [2.4, 3.2], label: 'Cloud Storage', icon: 'archive', color: 'gcp' },
      be_ncp: { kind: 'cyl', at: [4.6, 3.4], label: 'Object Storage', icon: 'archive', color: 'ncp' },
      k_net: { at: [0.4, 2.6], label: 'network', sub: 'VPC · 서브넷', icon: 'network', color: 'purple' },
      k_app: { at: [2.4, 0.6], label: 'app', sub: '서버 · LB', icon: 'server', color: 'orange' },
      k_db: { at: [4.4, -1.4], label: 'data', sub: 'DB · 버킷', icon: 'database', color: 'blue' },
    },
    edges: {
      e_file_tf: { from: 'file', to: 'tf' },
      e_tf_aws: { from: 'tf', to: 'aws' },
      e_tf_state: { from: 'tf', to: 'state', bi: true },
      e_tf_s3: { from: 'tf', to: 's3', bi: true },
      e_a_s3: { from: 'a', to: 's3', bi: true },
      e_b_s3: { from: 'b', to: 's3', bi: true },
      e_ops_aws: { from: 'ops', to: 'aws', style: 'dashed' },
      e_be1: { from: 'tf', to: 'be_aws', bi: true },
      e_be2: { from: 'tf', to: 'be_az', bi: true },
      e_be3: { from: 'tf', to: 'be_gcp', bi: true },
      e_be4: { from: 'tf', to: 'be_ncp', bi: true },
      e_net_app: { from: 'k_net', to: 'k_app', style: 'dashed', label: 'output' },
      e_db_app: { from: 'k_db', to: 'k_app', style: 'dashed', label: 'output' },
    },
  },
  codes: {
    tfstate: {
      title: 'terraform.tfstate', lang: 'json',
      text: `{
  "version": 4,
  "serial": 3,
  "lineage": "8f2c1d7e-…",
  "resources": [
    {
      "mode": "managed",
      "type": "aws_vpc",
      "name": "main",
      "instances": [
        {
          "attributes": {
            "id": "vpc-0a1b2c3d4e5f67890",
            "cidr_block": "10.0.0.0/16"
          }
        }
      ]
    }
  ]
}
`,
    },
    list: {
      title: '터미널', lang: 'sh',
      text: `$ terraform state list
data.aws_ami.linux
aws_instance.web
aws_subnet.app
aws_vpc.main

$ terraform state show aws_vpc.main
# aws_vpc.main:
resource "aws_vpc" "main" {
    arn        = "arn:aws:ec2:…:vpc/vpc-0a1b…"
    cidr_block = "10.0.0.0/16"
    id         = "vpc-0a1b2c3d4e5f67890"
    tags       = {}
    ...
}
`,
    },
    gone: {
      title: '터미널', lang: 'sh',
      text: `$ rm terraform.tfstate       # 실수로 삭제
$ terraform plan

# aws_instance.web will be created
+ resource "aws_instance" "web" {
    + instance_type = "t3.micro"
    ...
  }

# aws_subnet.app will be created
...
# aws_vpc.main will be created
...

Plan: 3 to add, 0 to change, 0 to destroy.
`,
    },
    backend: {
      title: 'backend.tf', lang: 'hcl',
      text: `terraform {
  backend "s3" {
    bucket       = "shop-tfstate"
    key          = "prod/terraform.tfstate"
    region       = "ap-northeast-2"
    encrypt      = true
    use_lockfile = true # 잠금: 조금 뒤에
  }
}

# 백엔드를 바꾼 뒤에는
#   terraform init -migrate-state
`,
    },
    lock: {
      title: '준호의 터미널', lang: 'sh',
      text: `$ terraform apply

Error: Error acquiring the state lock

Lock Info:
  ID:        6f1c2a9e-3b7d-4c55-…
  Path:      shop-tfstate/prod/…
  Operation: OperationTypeApply
  Who:       minji@laptop
  Created:   2026-03-02 05:14:09 UTC

Terraform acquires a state lock to protect
the state from being written by multiple
users at the same time. Please resolve the
issue above and try again.
`,
    },
    secret: {
      title: 'tfstate (RDS 부분)', lang: 'json',
      text: `{
  "mode": "managed",
  "type": "aws_db_instance",
  "name": "shop",
  "instances": [
    {
      "attributes": {
        "identifier": "shop-prod",
        "engine": "postgres",
        "username": "shop_admin",
        "password": "N7!qv2-Lx9#shop"
      }
    }
  ]
}
`,
    },
    drift: {
      title: '터미널', lang: 'sh',
      text: `$ terraform plan

aws_instance.web: Refreshing state...
  [id=i-0c3d4e5f6a7b89012]

# aws_instance.web will be updated in-place
~ resource "aws_instance" "web" {
      id            = "i-0c3d4e5f6a7b89012"
    ~ instance_type = "t3.large" -> "t3.micro"
  }

Plan: 0 to add, 1 to change, 0 to destroy.
`,
    },
    imp: {
      title: 'imports.tf', lang: 'hcl',
      text: `# 콘솔로 만든 버킷을 state로 들여옵니다
import {
  to = aws_s3_bucket.uploads
  id = "shop-uploads"
}

resource "aws_s3_bucket" "uploads" {
  bucket = "shop-uploads"
}

# terraform plan의 결과
#   aws_s3_bucket.uploads will be imported
#   Plan: 1 to import, 0 to add,
#         0 to change, 0 to destroy.
`,
    },
    rename: {
      title: '터미널', lang: 'sh',
      text: `$ git diff --stat
 main.tf | 2 +-    # "web" → "app" 이름만
$ terraform plan

# aws_instance.web will be destroyed
# (because aws_instance.web is not in
#  configuration)
- resource "aws_instance" "web" { ... }

# aws_instance.app will be created
+ resource "aws_instance" "app" { ... }

Plan: 1 to add, 0 to change, 1 to destroy.
`,
    },
    moved: {
      title: 'moved.tf', lang: 'hcl',
      text: `# 이름을 web → app 으로 바꿨다면
moved {
  from = aws_instance.web
  to   = aws_instance.app
}

# 모듈 안으로 옮겼다면
moved {
  from = aws_vpc.main
  to   = module.net.aws_vpc.this
}

# terraform plan의 결과
#   aws_instance.web has moved to
#     aws_instance.app
#   Plan: 0 to add, 0 to change,
#         0 to destroy.
`,
    },
  },
  steps: [
    {
      key: '기억', kind: 'problem', title: 'Terraform은 무엇으로 기억할까요',
      body: [
        '지난 레슨에서 apply로 VPC · 서브넷 · 인스턴스를 만들었고, 다시 plan을 돌리면 <code>No changes</code>가 나왔습니다. 그런데 AWS에는 <code>aws_vpc.main</code>이라는 이름이 없어요. AWS가 아는 것은 <code>vpc-0a1b…</code> 같은 ID뿐입니다.',
        '둘을 이어 주는 것이 <b>state</b>입니다. apply가 끝날 때마다 Terraform은 <b>코드의 주소 ↔ 실제 리소스의 ID와 속성</b>을 JSON 파일 <code>terraform.tfstate</code>에 적어 둡니다. 다음 plan은 이 ID로 실제 리소스를 조회해 코드와 비교해요.',
      ],
      callout: { type: 'key', text: 'state는 Terraform의 <b>기억</b>입니다. 계정 안의 수많은 VPC 가운데 어느 것이 내 것인지 알려 주는 유일한 근거예요.' },
      show: ['file', 'tf', 'state', 'aws'],
      code: { ref: 'tfstate', hl: [8, 9, 13] },
      tags: [
        { on: 'state', text: '주소 ↔ 실제 ID', tone: 'accent' },
        { on: 'aws', text: 'vpc-0a1b…' },
      ],
      flows: [
        { path: ['tf', 'aws'], kind: 'ctrl' },
        { path: ['aws', 'tf'], kind: 'res', delay: 1.2 },
        { path: ['tf', 'state'], kind: 'data', delay: 2.4 },
      ],
      metrics: { where: ['노트북 (로컬)', 'warn'], lock: '없음', sync: ['일치', 'ok'], blast: '구성 전체' },
      more: [
        { title: '왜 state가 필요한가', body: [
          '태그나 이름으로 찾으면 되지 않을까요? 많은 리소스는 태그가 없거나, 이름이 유일하지 않거나, 이름 자체가 없습니다. 같은 태그를 단 리소스가 다른 팀 것일 수도 있고요. Terraform은 추측하지 않고 <b>자기가 만든 것의 ID를 직접 적어 두는</b> 쪽을 택했습니다.',
          'state는 성능에도 쓰입니다. 리소스끼리의 의존 관계와 마지막으로 본 속성이 들어 있어서, 코드에서 블록이 사라졌을 때 "무엇을 어떤 순서로 지워야 하는지"를 코드 없이도 알 수 있어요.',
        ] },
        { title: '세 가지를 구분하세요', rows: [
          ['코드 (.tf)', '원하는 모습', 'accent'],
          ['state', '마지막으로 기록한 모습 + ID', 'info'],
          ['실제 (클라우드)', '지금 있는 모습', 'ok'],
        ] },
        { title: '흔한 실수', list: [
          'state를 <b>텍스트 에디터로 직접 고침</b> → JSON 한 글자만 틀려도 전체를 못 읽고, 의존 정보가 어긋나 엉뚱한 삭제가 생길 수 있습니다. 반드시 <code>terraform state</code> 하위 명령이나 moved · import 블록을 씁니다',
          '<code>.gitignore</code>에 <code>*.tfstate</code>를 빼먹어 커밋됨 → 뒤에서 볼 비밀값 문제가 함께 따라옵니다',
        ] },
      ],
    },
    {
      key: '들여다보기', kind: 'concept', title: 'state를 안전하게 들여다보는 법',
      body: [
        'state는 직접 열지 않고 명령으로 봅니다. <code>terraform state list</code>는 관리 중인 주소 목록, <code>terraform state show 주소</code>는 그 리소스의 기록된 속성을 보여 줘요.',
        '파일 머리의 <code>serial</code>은 쓸 때마다 1씩 오르는 번호이고, <code>lineage</code>는 이 state가 처음 만들어질 때 받은 고유 ID입니다. Terraform은 이 둘로 <b>낡은 state나 다른 state로 덮어쓰는 것</b>을 막습니다.',
      ],
      callout: { type: 'tip', text: '어떤 리소스가 Terraform 관리 대상인지 헷갈리면 <code>state list</code>부터 보세요. 목록에 없으면 이 구성은 그 리소스를 모릅니다.' },
      hide: ['file'],
      set: { state: { badge: 'serial 3' } },
      code: { ref: 'list', hl: [1, 7, 11] },
      tags: [{ on: 'tf', text: 'state list · show', tone: 'accent', pos: 'bottom' }],
      flows: [{ path: ['state', 'tf'], kind: 'data', n: 2 }],
      more: [
        { title: '직접 해보기', body: ['원격 백엔드에 있는 state도 같은 명령으로 봅니다. 통째로 받아 보려면 <code>pull</code>, 구조적으로 뽑으려면 JSON 출력이 편해요.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform state pull | jq '.serial, .lineage'
3
"8f2c1d7e-…"

$ terraform show -json | jq -r \\
    '.values.root_module.resources[].address'
aws_instance.web
aws_subnet.app
aws_vpc.main` } },
        { title: '안에 들어 있는 것', list: [
          '<b>resources</b>: 주소(종류 · 이름 · 인덱스)마다 실제 ID와 모든 속성',
          '<b>dependencies</b>: 리소스마다 무엇에 의존하는지 (삭제 순서 계산용)',
          '<b>outputs</b>: output 값 (다른 구성이 읽어 가는 값)',
          '<b>serial · lineage</b>: 덮어쓰기 사고를 막는 일련번호와 계보',
        ] },
        { title: '고칠 때 쓰는 명령', rows: [
          ['state mv', '주소 바꾸기 (moved 블록 권장)', 'info'],
          ['state rm', '관리에서만 빼기 (removed 블록 권장)', 'warn'],
          ['import', '이미 있는 것 들여오기 (블록 권장)', 'ok'],
          ['state push', '통째로 덮어쓰기 (최후의 수단)', 'bad'],
        ] },
      ],
    },
    {
      key: 'state 삭제', kind: 'case', title: '사례: state 파일을 지웠더니',
      body: [
        '기본 설정에서 state는 <b>작업 폴더의 파일</b>입니다. 폴더를 정리하다 지워졌거나, 새 노트북에 코드만 다시 받았다고 해 봅시다. plan을 돌리면 <code>3 to add</code>가 나옵니다. 기억이 없으니 Terraform에게는 <b>아무것도 만든 적 없는</b> 상태예요.',
        '그대로 apply하면 VPC와 서버가 <b>한 벌 더</b> 생깁니다. 먼저 만든 것들은 아무도 관리하지 않는 채로 남아 요금만 나가요. 이름이 유일해야 하는 리소스라면 "이미 있다"는 오류로 중간에 멈춥니다.',
      ],
      callout: { type: 'warn', text: 'AWS의 리소스는 멀쩡합니다. 잃은 것은 <b>연결</b>이에요. 로컬에는 직전 상태인 <code>terraform.tfstate.backup</code>이 남지만, 그것마저 없으면 하나씩 다시 연결(import)해야 합니다.' },
      set: { state: { state: 'down', badge: '삭제됨', tone: 'bad' } },
      code: { ref: 'gone', hl: [1, 4, 15] },
      tags: [
        { on: 'aws', text: '리소스는 그대로' },
        { on: 'tf', text: '기억 없음 → 3 to add', tone: 'bad', pos: 'left' },
      ],
      flows: [{ path: ['tf', 'state'], kind: 'bad' }, { path: ['tf', 'aws'], kind: 'ctrl', n: 3, gap: 0.5, delay: 1.2 }],
      metrics: { where: ['없음', 'bad'], sync: ['연결 끊김', 'bad'] },
      changes: [['-', 'terraform.tfstate'], ['~', 'plan: No changes → 3 to add'], ['-', '기존 리소스: 관리 밖에 남음']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '바꾼 게 없는데 plan이 전부 +', 'bad'],
          ['확인', 'terraform state list가 비어 있음', 'warn'],
          ['원인', 'state 파일 유실 · 다른 폴더에서 실행', 'warn'],
          ['복구 1', '.backup 또는 버킷의 이전 버전 복원', 'ok'],
          ['복구 2', '없으면 import로 하나씩 재연결', 'ok'],
        ] },
        { title: '비슷한 함정', list: [
          '<b>다른 폴더에서 실행</b>: 같은 코드를 다른 경로에 받아 plan하면 그 폴더에는 state가 없어 똑같이 전부 <code>+</code>가 나옵니다',
          '<b>백엔드 설정 누락</b>: 원격 백엔드를 쓰던 구성에서 <code>backend</code> 블록을 지우고 init하면 빈 로컬 state로 시작합니다',
          '<b>workspace 착각</b>: 다른 workspace를 선택해 둔 채 plan하면 그 workspace의 (빈) state를 봅니다 (모듈 레슨)',
        ] },
        { title: '실무 팁', body: [
          '"전부 +"인 plan은 거의 항상 <b>기억을 못 찾은 것</b>이지 진짜로 새로 만들 상황이 아닙니다. 운영 구성에서 이런 plan이 보이면 apply하지 말고 먼저 백엔드와 작업 폴더부터 확인하세요. 무엇보다 처음부터 state를 노트북에 두지 않는 것이 해법이고, 그게 다음 단계입니다.',
        ] },
      ],
    },
    {
      key: '원격 백엔드', kind: 'solution', title: '원격 백엔드: state를 공유 저장소에',
      body: [
        'state를 어디에 둘지는 <b>백엔드(backend)</b>가 정합니다. 기본은 로컬 파일이고, <code>backend "s3"</code>를 적으면 S3 버킷에 둬요. <code>terraform init -migrate-state</code>가 기존 로컬 state를 옮겨 줍니다.',
        '이제 state는 노트북과 무관합니다. 동료도 CI도 같은 state를 읽으니, 누가 실행해도 같은 기억에서 출발해요. 버킷의 <b>버전 관리</b>를 켜 두면 state가 깨지거나 지워져도 이전 버전으로 돌아갈 수 있습니다.',
      ],
      callout: { type: 'tip', text: 'state 버킷 자체는 이 구성 밖에서 만듭니다. 자기 state를 담을 버킷을 같은 구성으로 만들면, 그 버킷을 지우는 순간 기억도 함께 사라져요.' },
      hide: ['state'],
      show: ['s3'],
      set: { state: { state: null, badge: null } },
      code: { ref: 'backend', hl: [2, 3, 4, 5, 6] },
      tags: [{ on: 's3', text: '버전 관리 · 암호화', tone: 'ok', icon: 'shield-check', pos: 'right' }],
      flows: [{ path: ['tf', 's3'], kind: 'data', n: 2 }, { path: ['tf', 'aws'], kind: 'ctrl', delay: 1.4 }],
      metrics: { where: ['S3 버킷', 'ok'], sync: ['일치', 'ok'] },
      changes: [['+', 'backend "s3" 블록'], ['~', 'state: 노트북 → S3 버킷'], ['+', '버킷 버전 관리 · 암호화']],
      more: [
        { title: '동작 원리', body: [
          '원격 백엔드를 쓰면 Terraform은 실행할 때마다 state를 <b>내려받아 메모리에서</b> 쓰고, 바뀌면 다시 올립니다. 작업 폴더에는 state 파일이 남지 않아요. <code>key</code>는 버킷 안의 경로라서, 한 버킷에 여러 구성의 state를 <code>prod/network/…</code>, <code>prod/app/…</code>처럼 나눠 담을 수 있습니다.',
          '<code>backend</code> 블록에는 <b>변수를 쓸 수 없습니다</b>. 백엔드는 변수를 계산하기 전, init 단계에서 정해지기 때문이에요. 환경마다 다른 값은 <code>terraform init -backend-config=prod.s3.tfbackend</code>처럼 파일로 넘깁니다.',
        ] },
        { title: '버킷 준비 체크리스트', list: [
          '<b>버전 관리</b> 켜기: 덮어쓰기 · 삭제 사고 때 이전 serial로 복원',
          '<b>암호화</b> 켜기: 기본 암호화 + 필요하면 KMS 키',
          '<b>퍼블릭 접근 차단</b>과 접근 정책: 읽을 수 있는 역할을 좁게',
          '<b>삭제 보호</b>: 버킷을 지우려면 별도 승인이 필요하게',
        ] },
        { title: '직접 해보기', body: ['로컬 state를 원격으로 옮길 때 Terraform이 묻는 질문입니다.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform init -migrate-state
Initializing the backend...
Do you want to copy existing state to the
new backend?
  Enter a value: yes

Successfully configured the backend "s3"!
$ rm terraform.tfstate*   # 옮긴 뒤 로컬 사본 정리` } },
      ],
    },
    {
      key: '동시 apply', kind: 'case', title: '사례: 두 사람이 동시에 apply 했다',
      body: [
        '민지와 준호가 같은 시각에 각자 apply를 시작했습니다. 둘 다 <b>같은 시점의 state</b>를 읽고 출발해요. 민지는 서브넷을 추가하고, 준호는 인스턴스 크기를 바꿉니다.',
        '민지의 apply가 먼저 끝나 state에 새 서브넷이 기록됩니다. 잠시 뒤 준호의 apply가 <b>자기가 읽었던 state</b>에 변경을 얹어 그대로 써요. 민지의 서브넷 기록은 덮여 사라집니다. 서브넷은 실제로 있는데 Terraform은 모르니, 다음 plan은 그것을 또 만들려다 CIDR이 겹쳐 실패합니다.',
      ],
      callout: { type: 'warn', text: '공유하는 순간 <b>동시에 쓰는 문제</b>가 생깁니다. 원격에 두는 것만으로는 부족합니다.' },
      hide: ['tf', 'aws'],
      show: ['a', 'b'],
      set: { s3: { state: 'hot' } },
      tags: [
        { on: 'a', text: '서브넷 추가' },
        { on: 'b', text: '인스턴스 크기 변경', pos: 'left' },
        { on: 's3', text: '나중에 쓴 쪽이 덮어씀', tone: 'bad', pos: 'right' },
      ],
      flows: [
        { path: ['s3', 'a'], kind: 'data' }, { path: ['s3', 'b'], kind: 'data', delay: 0.2 },
        { path: ['a', 's3'], kind: 'data', delay: 1.6 },
        { path: ['b', 's3'], kind: 'bad', delay: 2.8 },
      ],
      metrics: { lock: ['없음', 'bad'], sync: ['서브넷 누락', 'bad'] },
      changes: [['+', '민지: 서브넷을 state에 기록'], ['-', '준호의 쓰기가 그 기록을 덮음'], ['~', '실제와 state가 어긋남']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', 'plan이 이미 있는 서브넷을 또 생성', 'bad'],
          ['apply 결과', 'CIDR 충돌 오류로 실패', 'bad'],
          ['원인', '잠금 없이 동시 apply → 기록 덮어씀', 'warn'],
          ['복구', '서브넷을 import로 다시 연결', 'ok'],
          ['재발 방지', '잠금 켜기 + apply는 CI 한 곳에서', 'ok'],
        ] },
        { title: 'Git으로 공유해도 같습니다', body: [
          'state를 Git에 커밋해 공유하는 팀도 같은 문제를 겪습니다. pull을 잊은 사람은 낡은 state로 apply하고, 두 사람이 각자 apply한 뒤 커밋하면 병합 충돌이 state JSON 안에서 일어나요. Git에는 "지금 누가 쓰는 중"이라는 개념이 없습니다. 게다가 다음 단계에서 볼 비밀값이 저장소 히스토리에 영원히 남습니다.',
        ] },
        { title: '더 생각해 볼 것', list: [
          '<code>serial</code> 검사는 낡은 state를 <b>통째로 push</b>하는 것은 막아 주지만, 각자 읽고 각자 쓰는 경쟁까지 막지는 못합니다',
          '사람이 늘수록 경쟁은 확률이 아니라 일정입니다. 배포가 몰리는 금요일 오후가 대표적이에요',
        ] },
      ],
    },
    {
      key: '잠금', kind: 'solution', title: '잠금: 한 번에 한 사람만 씁니다',
      body: [
        '백엔드의 <b>잠금(lock)</b>이 이 문제를 막습니다. plan이나 apply는 시작할 때 state에 잠금을 걸고, 끝나면 풉니다. 그사이 다른 사람이 실행하면 왼쪽 오류로 멈춰요. <code>Lock Info</code>의 <code>Who</code>를 보면 누가 쓰는 중인지 알 수 있습니다.',
        'S3 백엔드는 <code>use_lockfile = true</code>로 버킷 안에 잠금 파일을 만듭니다. 예전 구성은 DynamoDB 테이블을 따로 뒀어요. 실행이 비정상 종료되어 잠금만 남았다면 <code>terraform force-unlock</code>으로 풉니다.',
      ],
      callout: { type: 'warn', text: '<code>force-unlock</code>과 <code>-lock=false</code>는 <b>정말 아무도 실행 중이 아닐 때만</b> 씁니다. 근본 해법은 CI 한 곳에서만 차례로 apply하는 것이에요.' },
      set: {
        s3: { state: null },
        a: { badge: 'apply 중', tone: 'ok' },
        b: { badge: '대기', tone: 'warn' },
      },
      code: { ref: 'lock', hl: [3, 9] },
      tags: [{ on: 's3', text: '잠금: 민지', tone: 'ok', icon: 'lock' }],
      flows: [{ path: ['a', 's3'], kind: 'data', n: 2 }, { path: ['b', 's3'], kind: 'bad', delay: 1 }],
      metrics: { lock: ['켜짐', 'ok'], sync: ['일치', 'ok'] },
      changes: [['+', 'use_lockfile = true'], ['~', '동시 apply: 덮어쓰기 → 대기']],
      more: [
        { title: '동작 원리', body: [
          '잠금 파일 방식은 "그 경로에 파일이 <b>없을 때만</b> 써라"는 조건부 쓰기를 이용합니다. 두 사람이 동시에 잠금 파일을 만들려 해도 저장소가 한 명만 성공시켜요. 성공한 쪽은 잠금 정보(ID, 누가, 언제, 무슨 작업)를 그 파일에 적고, 작업이 끝나면 지웁니다.',
          '잠금은 plan에도 걸립니다. 읽기만 하는 plan도 refresh 결과를 기록할 수 있기 때문이에요. 기다리게 하고 싶다면 <code>-lock-timeout=5m</code>처럼 재시도 시간을 줍니다.',
        ] },
        { title: '남은 잠금 풀기', body: ['노트북이 꺼지거나 CI 작업이 강제 종료되면 잠금만 남습니다. 먼저 그 작업이 정말 끝났는지 확인한 뒤 Lock ID로 풉니다.'], code: { title: 'terminal', lang: 'sh', text: `# 1) Who · Created를 보고 그 작업이 죽었는지 확인
# 2) 죽은 게 확실할 때만
$ terraform force-unlock 6f1c2a9e-3b7d-4c55-…
Do you really want to force-unlock?
  Enter a value: yes
Terraform state has been successfully unlocked!` } },
        { title: '흔한 실수', list: [
          '잠금 오류가 귀찮아 CI 스크립트에 <code>-lock=false</code>를 넣음 → 사례의 덮어쓰기가 다시 가능해집니다',
          'DynamoDB 잠금 설정을 그대로 둔 채 새 방식으로 옮기면서 둘 다 빼먹음 → 이전 설정은 새 Terraform 버전에서 경고가 나니, 옮길 때 <code>use_lockfile</code>을 확인합니다',
        ] },
      ],
    },
    {
      key: '클라우드별', kind: 'compare', title: '백엔드는 클라우드마다 저장소가 다릅니다',
      body: [
        '원격 백엔드의 조건은 같습니다. <b>공유 저장, 잠금, 암호화, 버전 관리</b>. 저장소만 클라우드마다 달라요. Azure는 Blob Storage(<code>azurerm</code>), GCP는 Cloud Storage(<code>gcs</code>) 백엔드를 쓰고, 둘 다 잠금을 기본으로 제공합니다.',
        'NCP Object Storage는 S3 호환 API를 제공해, <code>s3</code> 백엔드에 엔드포인트를 바꿔 쓰는 방식이 흔합니다.',
      ],
      callout: { type: 'cloud', text: '직접 운영하기 싫다면 HCP Terraform 같은 서비스가 저장 · 잠금 · 실행 이력을 한꺼번에 맡아 줍니다.' },
      hide: ['a', 'b', 's3'],
      show: ['tf', 'be_aws', 'be_az', 'be_gcp', 'be_ncp'],
      set: { a: { badge: null }, b: { badge: null } },
      flows: [
        { path: ['tf', 'be_aws'], kind: 'data' },
        { path: ['tf', 'be_az'], kind: 'data', delay: 0.3 },
        { path: ['tf', 'be_gcp'], kind: 'data', delay: 0.6 },
        { path: ['tf', 'be_ncp'], kind: 'data', delay: 0.9 },
      ],
      panel: {
        title: '백엔드와 잠금', icon: 'save',
        rows: [
          ['AWS · s3', 'use_lockfile 잠금', 'aws'],
          ['Azure · azurerm', 'Blob lease로 잠금', 'azure'],
          ['GCP · gcs', '잠금 기본 제공', 'gcp'],
          ['NCP · s3 호환', '엔드포인트 지정', 'ncp'],
        ],
      },
      metrics: { where: ['클라우드 저장소', 'ok'], lock: ['켜짐', 'ok'] },
      more: [
        { title: '설정 예시', body: ['Azure와 GCP의 백엔드 블록입니다. 모양은 다르지만 "어느 저장소의 어느 경로"를 정한다는 점은 같아요.'], code: { title: 'backend.tf (둘 중 하나)', lang: 'hcl', text: `# Azure: 스토리지 계정의 컨테이너
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "shoptfstate"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

# GCP: 버킷과 경로 접두사
terraform {
  backend "gcs" {
    bucket = "shop-tfstate"
    prefix = "prod"
  }
}` } },
        { title: '고르는 기준', list: [
          '<b>state를 어느 클라우드에 둘지</b>는 리소스가 어디 있는지와 따로 정해도 됩니다. 멀티클라우드라면 한 곳에 모으는 팀이 많아요',
          'S3 호환 저장소를 쓸 때는 조건부 쓰기(잠금 파일)를 지원하는지 먼저 확인합니다. 지원하지 않으면 잠금 없는 백엔드가 됩니다',
          'state 저장소의 접근 권한은 <b>prod 리소스 권한만큼</b> 엄격해야 합니다. 다음 단계에서 그 이유를 봅니다',
        ] },
        { title: '흔한 실수', list: [
          'Azure 스토리지 계정 이름은 전역에서 유일하고 소문자 · 숫자만 됩니다. 예시 이름 그대로 쓰면 이미 있다는 오류가 납니다',
          'GCS 버킷의 객체 버전 관리를 켜지 않음 → state가 덮어써졌을 때 되돌릴 이전 버전이 없습니다',
        ] },
      ],
    },
    {
      key: '민감 정보', kind: 'concept', title: 'state에는 비밀번호가 그대로 있습니다',
      body: [
        'state는 리소스의 <b>모든 속성</b>을 기록합니다. DB를 만들면서 넘긴 비밀번호, 생성된 액세스 키, 인증서의 개인 키도 들어가요. <b>평문</b>으로요.',
        '변수에 <code>sensitive = true</code>를 붙이면 plan과 출력 화면에서는 <code>(sensitive value)</code>로 가려지지만, state 안의 값은 그대로입니다. 그래서 state는 <b>비밀 문서처럼</b> 다룹니다. Git에 올리지 않고, 저장소는 암호화하며, 읽을 수 있는 사람과 역할을 좁힙니다.',
      ],
      callout: { type: 'tip', text: '가장 좋은 것은 비밀을 state에 넣지 않는 것입니다. RDS가 비밀번호를 직접 만들어 Secrets Manager에 두게 하거나(<code>manage_master_user_password</code>), write-only 인자를 쓰세요.' },
      hide: ['be_aws', 'be_az', 'be_gcp', 'be_ncp'],
      show: ['s3', 'aws'],
      code: { ref: 'secret', hl: [10, 11] },
      tags: [
        { on: 's3', text: 'password가 평문', tone: 'bad', icon: 'eye', pos: 'right' },
        { on: 'aws', text: 'RDS 생성' },
      ],
      flows: [{ path: ['tf', 'aws'], kind: 'ctrl' }, { path: ['tf', 's3'], kind: 'data', delay: 1.2 }],
      metrics: { where: ['S3 · 암호화', 'ok'] },
      more: [
        { title: '가리기 vs 빼기', rows: [
          ['sensitive = true', '화면에서만 가림, state엔 평문', 'warn'],
          ['manage_master_user_password', 'RDS가 만들고 시크릿 저장소에 보관', 'ok'],
          ['write-only 인자 (…_wo)', '전달만 하고 state에 안 남김', 'ok'],
          ['data로 시크릿 읽기', '읽은 값은 state에 남음', 'warn'],
        ] },
        { title: '설정 예시', body: ['DB 비밀번호를 코드도 state도 거치지 않게 하는 방법입니다. 비밀번호는 Secrets Manager에서 꺼내 씁니다.'], code: { title: 'db.tf', lang: 'hcl', text: `resource "aws_db_instance" "shop" {
  identifier     = "shop-prod"
  engine         = "postgres"
  instance_class = "db.t3.medium"
  username       = "shop_admin"

  # 비밀번호를 RDS가 만들어 Secrets Manager에 저장
  manage_master_user_password = true
}

output "db_secret_arn" {
  value = (
    aws_db_instance.shop.master_user_secret[0].secret_arn
  )
}` } },
        { title: '흔한 실수', list: [
          '<code>terraform output -json</code>은 sensitive output도 평문으로 보여 줍니다. CI 로그에 그대로 찍지 않도록 주의합니다',
          'state를 읽을 수 있는 권한 = 그 안의 모든 비밀을 읽을 수 있는 권한입니다. "읽기 전용이니 괜찮다"는 판단은 state에는 통하지 않아요',
        ] },
      ],
    },
    {
      key: '드리프트', kind: 'solution', title: '드리프트: plan이 차이를 잡아냅니다',
      body: [
        '장애 대응 중 누군가 콘솔에서 인스턴스를 <code>t3.large</code>로 키웠습니다. 코드와 state는 여전히 <code>t3.micro</code>예요. 이렇게 실제가 코드에서 벗어난 것을 <b>드리프트(drift)</b>라고 합니다.',
        'plan은 먼저 state에 적힌 ID로 실제 리소스를 <b>다시 조회</b>(refresh)합니다. 그래서 차이를 발견하고 "코드대로 <code>t3.micro</code>로 되돌리겠다"고 알려 줘요. 콘솔의 변경이 옳았다면 <b>코드를 고쳐</b> 맞추고, 아니라면 apply로 되돌립니다.',
      ],
      callout: { type: 'warn', text: '읽지 않고 apply하면 서버가 다시 작아져 장애가 재발합니다. 그리고 plan은 <b>state에 있는 리소스만</b> 조회해요. 콘솔에서 새로 만든 리소스는 보이지 않습니다.' },
      show: ['ops'],
      set: { aws: { badge: 't3.large', tone: 'warn' } },
      code: { ref: 'drift', hl: [6, 9] },
      tags: [
        { on: 'ops', text: '콘솔에서 크기 변경', tone: 'warn' },
        { on: 'tf', text: '코드는 t3.micro', pos: 'bottom', dx: -46 },
      ],
      flows: [
        { path: ['ops', 'aws'], kind: 'ctrl' },
        { path: ['tf', 'aws'], kind: 'ctrl', delay: 1.3 },
        { path: ['aws', 'tf'], kind: 'res', delay: 2.5 },
      ],
      metrics: { sync: ['드리프트 1건', 'warn'] },
      changes: [['~', '실제: t3.micro → t3.large (콘솔)'], ['~', 'plan: t3.large → t3.micro 제안']],
      more: [
        { title: '세 가지 선택지', rows: [
          ['변경이 옳다', '코드를 t3.large로 고쳐 PR', 'ok'],
          ['변경이 틀렸다', '그대로 apply해 코드대로 되돌림', 'info'],
          ['남이 관리하는 값', 'lifecycle ignore_changes', 'warn'],
        ] },
        { title: '직접 해보기', body: ['리소스는 건드리지 않고 <b>state만</b> 실제에 맞춰 갱신하는 모드가 있습니다. 무엇이 바뀌었는지 확인할 때 유용해요.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform plan -refresh-only

Note: Objects have changed outside of Terraform

  # aws_instance.web has changed
  ~ resource "aws_instance" "web" {
      ~ instance_type = "t3.micro" -> "t3.large"
    }

$ terraform apply -refresh-only   # state만 갱신` } },
        { title: '실무 팁', list: [
          '<code>-refresh-only</code>로 state를 맞춰도 <b>코드는 여전히 t3.micro</b>입니다. 다음 일반 plan은 또 되돌리자고 하니, 결국 코드를 고치거나 되돌리는 결정이 필요합니다',
          '운영 구성에 하루 한 번 <code>plan -detailed-exitcode</code>를 돌려 드리프트를 알림으로 받으면, 콘솔 수정이 몇 달씩 묻히지 않습니다',
          '콘솔에서 새로 만든 리소스는 plan에 안 보이므로, 태그 정책이나 클라우드의 구성 감사 서비스로 "Terraform 태그가 없는 리소스"를 따로 찾습니다',
        ] },
      ],
    },
    {
      key: 'import', kind: 'solution', title: 'import: 이미 있는 것을 state로',
      body: [
        '콘솔로 만든 업로드용 버킷 <code>shop-uploads</code>가 있습니다. Terraform은 이 버킷을 모르니, <code>resource</code> 블록만 적고 apply하면 같은 이름으로 새로 만들려다 실패해요.',
        '<b>import 블록</b>에 "이 주소(<code>to</code>)는 저 실제 리소스(<code>id</code>)"라고 적으면, 다음 apply가 버킷을 건드리지 않고 <b>state에 연결만</b> 합니다. plan에 <code>1 to import</code>로 나타나니 리뷰도 할 수 있어요. 그 뒤 plan이 <code>No changes</code>가 될 때까지 코드를 실제 설정에 맞춥니다.',
      ],
      callout: { type: 'tip', text: '<code>terraform plan -generate-config-out=파일</code>은 resource 블록의 초안까지 써 줍니다.' },
      hide: ['ops'],
      show: ['file'],
      set: { aws: { badge: null } },
      code: { ref: 'imp', hl: [2, 3, 4, 5] },
      tags: [
        { on: 'aws', text: 'shop-uploads 버킷' },
        { on: 's3', text: '연결만 기록', tone: 'accent', pos: 'right' },
      ],
      flows: [
        { path: ['file', 'tf'], kind: 'build' },
        { path: ['tf', 'aws'], kind: 'ctrl', delay: 0.9 },
        { path: ['aws', 'tf'], kind: 'res', delay: 1.9 },
        { path: ['tf', 's3'], kind: 'data', delay: 2.9 },
      ],
      metrics: { sync: ['버킷까지 일치', 'ok'] },
      changes: [['+', 'import 블록과 resource 블록'], ['~', '버킷은 그대로, state에 연결만']],
      more: [
        { title: '직접 해보기', body: ['resource 블록 없이 import 블록만 두고 초안을 생성합니다. 생성된 코드는 그대로 쓰지 말고, 기본값과 불필요한 속성을 정리한 뒤 커밋해요.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform plan -generate-config-out=generated.tf
...
aws_s3_bucket.uploads: Preparing import...
  [id=shop-uploads]
Plan: 1 to import, 0 to add, 0 to change,
      0 to destroy.

$ terraform apply      # state에 연결
$ terraform plan       # No changes가 목표` } },
        { title: 'id는 리소스마다 다릅니다', list: [
          'S3 버킷은 버킷 이름, EC2 인스턴스는 <code>i-…</code> ID, IAM 역할은 역할 이름처럼 리소스마다 import에 쓰는 값이 다릅니다. 프로바이더 문서의 각 리소스 맨 아래 <b>Import</b> 절에 나와 있어요',
          'Azure 리소스는 대개 <code>/subscriptions/…/resourceGroups/…</code>로 시작하는 전체 리소스 ID를 씁니다',
        ] },
        { title: '흔한 실수', list: [
          '같은 리소스를 <b>두 구성</b>에 import함 → 두 state가 같은 리소스를 서로 고치려 들고, 한쪽의 destroy가 다른 쪽 리소스를 지웁니다',
          'import 직후 plan의 <code>~</code>를 확인하지 않고 apply → 코드가 실제와 다른 부분이 그대로 실제에 덮어씌워집니다',
          '예전 방식의 <code>terraform import</code> 명령은 plan 없이 바로 state를 바꿉니다. 리뷰가 가능한 import 블록을 권합니다',
        ] },
      ],
    },
    {
      key: '이름 변경', kind: 'case', title: '사례: 이름만 바꿨는데 삭제와 생성이',
      body: [
        '코드를 정리하며 <code>aws_instance.web</code>을 <code>aws_instance.app</code>으로 이름만 바꿨습니다. plan을 보니 <code>1 to add, 1 to destroy</code>예요. 실제 서버는 그대로인데 왜일까요?',
        'state의 기억은 <b>주소</b> 기준입니다. Terraform에게는 "<code>web</code>은 코드에서 사라졌고(삭제), <code>app</code>은 새로 생겼다(생성)"로 보여요. 그대로 apply하면 멀쩡한 서버를 지우고 새로 만듭니다. 리소스를 모듈 안으로 옮길 때도 똑같습니다.',
      ],
      callout: { type: 'warn', text: '리팩터링 PR의 plan에 <code>destroy</code>가 보이면, 대개 실제를 바꾸려는 게 아니라 <b>주소가 바뀐 것</b>입니다.' },
      set: { aws: { state: 'hot', badge: '-1 · +1 계획', tone: 'bad' } },
      code: { ref: 'rename', hl: [2, 5, 6, 10, 13] },
      tags: [{ on: 'file', text: 'web → app', icon: 'pencil' }],
      flows: [{ path: ['file', 'tf'], kind: 'build' }, { path: ['tf', 'aws'], kind: 'bad', delay: 1.2 }],
      metrics: { sync: ['주소 불일치', 'bad'] },
      changes: [['~', '코드: web → app (이름만)'], ['-', 'plan: 서버 삭제 후 재생성']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '리팩터링 PR인데 destroy가 나옴', 'bad'],
          ['확인', '삭제 · 생성 대상이 같은 종류 한 쌍', 'warn'],
          ['원인', 'state의 주소와 코드의 주소가 다름', 'warn'],
          ['해결', 'moved 블록으로 주소 이동을 알림', 'ok'],
        ] },
        { title: '주소가 바뀌는 경우들', list: [
          'resource의 이름(둘째 라벨)을 바꿈',
          '리소스를 <code>module</code> 안으로 옮기거나 모듈 이름을 바꿈 → 주소가 <code>module.net.aws_vpc.this</code>처럼 바뀜',
          '<code>count</code>를 <code>for_each</code>로 바꿈 → <code>[0]</code>이 <code>["a"]</code>가 됨 (모듈 레슨)',
          '리소스 종류 자체를 바꾸는 것(예: 프로바이더가 새 리소스 종류로 분리)은 moved로 안 되는 경우도 있어, 프로바이더의 이전 안내를 따릅니다',
        ] },
        { title: '실무 팁', body: [
          '리팩터링은 <b>"plan이 No changes"</b>를 완료 기준으로 삼습니다. 코드 모양만 바꾸는 PR이 실제 인프라를 바꾸면 안 되니까요. 정책 검사로 "리팩터링 라벨이 붙은 PR의 plan에 destroy가 있으면 실패" 같은 규칙을 거는 팀도 있습니다.',
        ] },
      ],
    },
    {
      key: 'moved', kind: 'solution', title: 'moved · removed: state를 코드로 고칩니다',
      body: [
        '<b>moved 블록</b>은 "이 주소는 저 주소로 옮겨졌다"를 코드로 알립니다. plan은 <code>has moved to</code>만 보여 주고, 실제 리소스는 건드리지 않아요. PR로 리뷰되고, 다른 환경에서도 같은 코드로 똑같이 옮겨집니다.',
        '반대로 리소스를 지우지 않고 <b>관리에서만 빼려면</b> <b>removed 블록</b>에 <code>destroy = false</code>를 적습니다.',
      ],
      callout: { type: 'tip', text: '예전에는 사람이 환경마다 <code>terraform state mv</code>를 손으로 실행했습니다. 블록은 그 작업을 <b>리뷰 가능한 코드</b>로 바꿔요.' },
      set: { aws: { state: null, badge: null } },
      code: { ref: 'moved', hl: [2, 3, 4, 8, 9, 10, 13, 15] },
      tags: [
        { on: 's3', text: '주소만 바뀜', tone: 'ok', pos: 'right' },
        { on: 'aws', text: '서버는 그대로', tone: 'ok' },
      ],
      flows: [{ path: ['file', 'tf'], kind: 'build' }, { path: ['tf', 's3'], kind: 'data', delay: 1.2 }],
      metrics: { sync: ['일치', 'ok'] },
      changes: [['+', 'moved 블록'], ['~', 'plan: 1 add · 1 destroy → 0'], ['~', 'state 주소: web → app']],
      more: [
        { title: '설정 예시', body: ['버킷을 Terraform 관리에서 빼되, 실제 버킷은 남깁니다. 다른 팀에 넘길 때 쓰는 방식이에요.'], code: { title: 'removed.tf', lang: 'hcl', text: `# resource "aws_s3_bucket" "legacy" 블록은 지우고
removed {
  from = aws_s3_bucket.legacy

  lifecycle {
    destroy = false   # 실제 버킷은 남긴다
  }
}

# plan 결과
#   aws_s3_bucket.legacy will no longer be
#   managed by Terraform` } },
        { title: '블록 vs 명령', rows: [
          ['moved 블록', 'state mv의 코드 버전', 'ok'],
          ['removed 블록', 'state rm의 코드 버전', 'ok'],
          ['import 블록', 'terraform import의 코드 버전', 'ok'],
          ['공통 장점', 'plan으로 리뷰 · 환경마다 자동 적용', 'accent'],
        ] },
        { title: '실무 팁', list: [
          'moved 블록은 모든 환경이 그 변경을 apply한 뒤 지워도 됩니다. 다만 여러 사람이 쓰는 <b>공유 모듈</b>이라면, 늦게 버전을 올리는 사용자를 위해 오래 남겨 둡니다',
          '연쇄 이동(a → b → c)도 moved 블록을 이어서 적으면 따라갑니다',
          '<code>removed</code>로 뺀 리소스는 이제 어떤 state에도 없으니, 누가 관리하는지 기록해 두지 않으면 "주인 없는 리소스"가 됩니다',
        ] },
      ],
    },
    {
      key: 'state 나누기', kind: 'concept', title: 'state를 나눠 사고 반경을 줄입니다',
      body: [
        '모든 것을 state 하나에 담으면 plan은 수백 개 리소스를 매번 조회하느라 느려지고, 잠금 하나를 온 팀이 기다립니다. 무엇보다 앱 설정 한 줄을 고치려던 apply가 <b>VPC와 DB까지 닿을 수</b> 있어요. 실수가 미치는 범위, <b>사고 반경(blast radius)</b>이 전체입니다.',
        '그래서 <b>바뀌는 빈도와 위험도</b>가 다른 것끼리 나눕니다. 드물게 바뀌는 네트워크, 조심스러운 데이터, 자주 바뀌는 앱. 앱 구성은 네트워크 구성의 <b>output</b>을 읽어 서브넷 ID를 받습니다.',
      ],
      callout: { type: 'tip', text: '너무 잘게 쪼개면 구성 사이의 순서와 참조를 관리하는 것이 일이 됩니다. <b>함께 바뀌는 것은 함께</b>, 따로 바뀌는 것은 따로 두세요.' },
      hide: ['file', 'tf', 'aws', 's3'],
      show: ['k_net', 'k_app', 'k_db'],
      tags: [
        { on: 'k_net', text: 'prod/network', pos: 'bottom' },
        { on: 'k_app', text: 'prod/app', pos: 'bottom' },
        { on: 'k_db', text: 'prod/data', pos: 'bottom' },
        { on: 'k_app', text: '실수해도 여기까지', tone: 'ok', icon: 'shield-check' },
      ],
      flows: [{ path: ['k_net', 'k_app'], kind: 'data' }, { path: ['k_db', 'k_app'], kind: 'data', delay: 0.5 }],
      panel: {
        title: 'state를 나누는 기준', icon: 'split',
        rows: [
          ['network', '드물게 · 영향 큼', 'info'],
          ['data', '조심스럽게 · 삭제 보호', 'warn'],
          ['app', '자주 · 영향 작음', 'ok'],
        ],
      },
      metrics: { where: ['S3 · key별로', 'ok'], blast: ['구성 하나', 'ok'] },
      changes: [['~', 'state 1개 → 구성 · 환경별'], ['~', '잠금과 실수가 한 구성 안에'], ['+', 'output으로 값 전달']],
      more: [
        { title: '설정 예시', body: ['app 구성이 network 구성의 output을 읽는 방법입니다. 읽는 쪽은 network state의 <b>output만</b> 볼 수 있어요.'], code: { title: 'envs/prod/app/network.tf', lang: 'hcl', text: `data "terraform_remote_state" "net" {
  backend = "s3"
  config = {
    bucket = "shop-tfstate"
    key    = "prod/network/terraform.tfstate"
    region = "ap-northeast-2"
  }
}

resource "aws_instance" "web" {
  # ...
  subnet_id = data.terraform_remote_state.net
    .outputs.app_subnet_ids["a"]
}` } },
        { title: '값을 넘기는 다른 방법', list: [
          '<code>terraform_remote_state</code>는 간단하지만, 읽는 쪽에 network state 전체를 읽을 권한이 필요합니다(그 안의 비밀까지)',
          '대안: network 구성이 SSM Parameter Store 같은 곳에 값을 써 두고, app 구성은 data 블록으로 그 값만 읽기',
          '대안: 태그로 조회하는 data 블록(<code>aws_subnets</code> + filter). 느슨하지만 태그 규칙이 지켜져야 합니다',
        ] },
        { title: '이미 하나인 state를 나누려면', body: [
          '새 구성을 만들고, 옮길 리소스를 새 구성 쪽에 <b>import 블록</b>으로 들여온 뒤, 옛 구성에서는 <b>removed 블록</b>(<code>destroy = false</code>)으로 빼는 것이 가장 안전한 순서입니다. 두 plan이 모두 "실제 변경 없음"인지 확인하고 차례로 apply해요. 중간에 두 state가 같은 리소스를 함께 들고 있는 순간이 없도록 하는 것이 핵심입니다.',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: state는 기억이자 비밀 문서',
      body: [
        'state는 코드의 주소와 실제 리소스를 잇는 <b>기억</b>입니다. 잃으면 연결이 끊기니 <b>원격 백엔드</b>에 두고, 동시에 쓰지 못하게 <b>잠금</b>을 걸고, 비밀값이 들어 있으니 암호화하고 접근을 좁힙니다.',
        'plan은 실제를 다시 조회해 <b>드리프트</b>를 알려 주고, <b>import · moved · removed</b> 블록은 state를 리뷰 가능한 코드로 고칩니다. state를 나누면 사고 반경이 줄어요. 다음 레슨에서는 <b>변수와 모듈</b>로 같은 코드를 여러 환경에 씁니다.',
      ],
      hide: ['k_net', 'k_app', 'k_db'],
      show: ['file', 'tf', 's3', 'aws'],
      flows: [
        { path: ['file', 'tf'], kind: 'build' },
        { path: ['tf', 's3'], kind: 'data', delay: 0.9 },
        { path: ['tf', 'aws'], kind: 'ctrl', delay: 1.8 },
      ],
      tags: [
        { on: 's3', text: '잠금 · 암호화 · 버전', tone: 'ok', icon: 'lock', pos: 'right' },
        { on: 'aws', text: 'plan이 다시 조회' },
      ],
      metrics: { sync: ['일치', 'ok'] },
    },
  ],
  quiz: [
    {
      q: '로컬 state 파일을 잃어버렸고 백업도 없습니다. AWS의 리소스는 그대로 있습니다. 가장 알맞은 복구 방법은?',
      options: [
        '그대로 apply하면 Terraform이 기존 리소스를 찾아 다시 연결한다',
        'terraform init을 다시 실행하면 state가 재생성된다',
        'import로 기존 리소스를 코드의 주소에 하나씩 다시 연결한다',
        '콘솔에서 리소스를 모두 지우고 apply로 처음부터 다시 만든다',
      ],
      answer: 2,
      step: 3,
      why: 'state가 없으면 Terraform은 아무것도 만든 적이 없다고 보고 전부 새로 만들려 합니다. 이름이나 태그로 알아서 찾아 주지 않아요. 실제 리소스를 건드리지 않고 연결만 되살리는 방법이 import입니다. init은 프로바이더와 백엔드를 준비할 뿐이고, 전부 지우고 다시 만드는 것은 운영 중인 서비스에서는 장애와 데이터 손실입니다.',
    },
    {
      q: 'apply를 실행하자 "Error acquiring the state lock"이 나왔고, Lock Info의 Who는 동료입니다. 먼저 할 일은?',
      options: [
        '동료의 작업이 진행 중인지 확인하고, 끝나기를 기다린다',
        'terraform force-unlock으로 잠금을 바로 푼다',
        '-lock=false 옵션을 붙여 다시 실행한다',
        'state를 로컬로 내려받아 따로 작업한 뒤 올린다',
      ],
      answer: 0,
      step: 6,
      why: '잠금은 동시에 쓰는 것을 막으려고 정상 동작한 것입니다. 실행 중인 작업이 있는데 force-unlock이나 -lock=false로 밀고 들어가면 두 apply가 서로의 기록을 덮어씁니다. 강제로 푸는 것은 실행이 죽어 잠금만 남았다고 확인했을 때뿐이에요. state를 따로 복사해 작업하는 것은 잠금을 우회하는 또 다른 방법일 뿐입니다.',
    },
    {
      q: '코드를 바꾸지 않았는데 plan에 instance_type = "t3.large" -> "t3.micro"가 나옵니다. 가장 알맞은 해석과 대응은?',
      options: [
        'Terraform의 버그이므로 무시하고 apply한다',
        'state가 손상된 것이니 state 파일을 지우고 다시 만든다',
        '프로바이더 버전이 바뀐 탓이니 init을 다시 실행한다',
        '누군가 Terraform 밖에서 크기를 키운 드리프트다. 그 변경이 필요한지 확인해 코드에 반영하거나 되돌린다',
      ],
      answer: 3,
      step: 9,
      why: 'plan은 실제 리소스를 다시 조회하므로, 실제(t3.large)가 코드(t3.micro)와 다르면 코드 쪽으로 되돌리는 변경을 제안합니다. 누가 왜 키웠는지 모른 채 apply하면 서버가 다시 작아져요. 변경이 옳았다면 코드를 t3.large로 고쳐 No changes를 만들어야 합니다. state를 지우면 문제가 드리프트 하나에서 전체 연결 유실로 커집니다.',
    },
    {
      q: '팀원이 "state 파일을 코드와 함께 Git에 커밋해 공유하자"고 제안합니다. 가장 알맞은 답은?',
      options: [
        '좋은 방법이다. 변경 이력까지 남는다',
        'state는 바이너리 파일이라 Git에 저장할 수 없다',
        'state에는 비밀값이 평문으로 들어 있고 Git에는 잠금이 없다. 잠금과 암호화가 되는 원격 백엔드에 둔다',
        '.terraform.lock.hcl과 내용이 같으므로 그 파일만 커밋하면 된다',
      ],
      answer: 2,
      step: 5,
      why: 'state는 JSON 텍스트라 커밋은 되지만, DB 비밀번호 같은 값이 그대로 저장소 히스토리에 남고, pull을 잊은 사람이 낡은 state로 apply하거나 두 사람이 동시에 apply하는 것을 막을 수 없습니다. .terraform.lock.hcl은 프로바이더 버전을 기록하는 전혀 다른 파일이며, 이름의 lock도 state 잠금과 무관합니다.',
    },
    {
      q: '리팩터링으로 aws_instance.web의 이름을 app으로 바꿨더니 plan에 1 to add, 1 to destroy가 나옵니다. 운영 서버를 건드리지 않으려면?',
      options: [
        'moved 블록에 from = aws_instance.web, to = aws_instance.app을 적고 plan이 0 변경인지 확인한다',
        '그대로 apply한다. 같은 설정이라 순식간에 다시 만들어진다',
        '이름을 원래대로 되돌리는 것 말고는 방법이 없다',
        'state 파일을 열어 "web"을 "app"으로 직접 고친다',
      ],
      answer: 0,
      step: 12,
      why: 'state는 주소로 기억하므로 이름을 바꾸면 삭제와 생성으로 보입니다. moved 블록은 주소 이동만 기록해 실제 리소스를 건드리지 않고, PR로 리뷰되며 모든 환경에 똑같이 적용됩니다. 그대로 apply하면 서버가 교체되어 IP와 디스크 데이터가 바뀌고, state 파일을 직접 고치면 JSON 손상과 의존 정보 불일치 위험이 큽니다.',
    },
    {
      q: '더는 Terraform으로 관리하지 않고 다른 팀에 넘길 버킷이 있습니다. 버킷은 지우면 안 됩니다. 가장 알맞은 방법은?',
      options: [
        'resource 블록을 지우고 apply한다',
        'resource 블록을 지우고 removed 블록에 lifecycle { destroy = false }를 적는다',
        'prevent_destroy를 걸고 블록을 지운다',
        '버킷에 deletion 태그를 붙인다',
      ],
      answer: 1,
      step: 12,
      why: '블록만 지우면 선언형 규칙대로 삭제 계획이 나옵니다. removed 블록과 destroy = false는 state에서만 빼고 실제 버킷은 남깁니다. prevent_destroy는 블록과 함께 사라지므로 보호가 되지 않고, 태그는 Terraform의 동작과 무관합니다.',
    },
    {
      q: '콘솔로 만든 지 2년 된 S3 버킷을 Terraform 관리로 가져오려 합니다. 리뷰 가능한 방식으로 하려면?',
      options: [
        'resource 블록만 적고 apply한다',
        'terraform import 명령을 운영 노트북에서 바로 실행한다',
        '버킷을 지우고 Terraform으로 새로 만든다',
        'import 블록과 resource 블록을 PR로 올리고, plan의 1 to import와 남은 차이를 확인한 뒤 No changes가 될 때까지 코드를 맞춘다',
      ],
      answer: 3,
      step: 10,
      why: 'import 블록은 plan에 1 to import로 나타나 PR에서 리뷰할 수 있고, 다른 사람도 같은 코드로 재현할 수 있습니다. resource 블록만 적으면 같은 이름으로 새로 만들려다 실패하고, import 명령은 리뷰 없이 바로 state를 바꿉니다. 지우고 새로 만드는 것은 데이터 손실입니다.',
    },
    {
      q: 'DB 비밀번호 변수에 sensitive = true를 붙였습니다. 보안 담당자가 "이제 state도 안전하냐"고 묻습니다. 정확한 답은?',
      options: [
        '그렇다. sensitive 값은 state에 암호화되어 저장된다',
        '아니다. 화면 출력만 가려질 뿐 state에는 평문으로 남는다. 저장소 암호화와 접근 제한, 또는 state에 남기지 않는 방식이 필요하다',
        '그렇다. sensitive 값은 state에 아예 기록되지 않는다',
        'sensitive는 output에만 쓸 수 있어 변수에는 효과가 없다',
      ],
      answer: 1,
      step: 8,
      why: 'sensitive는 plan과 출력에서 값을 가리는 표시일 뿐, state에는 리소스 속성이 평문으로 기록됩니다. 그래서 state 저장소를 암호화하고 접근을 좁히며, 가능하면 manage_master_user_password나 write-only 인자처럼 비밀이 state에 남지 않는 방식을 씁니다.',
    },
    {
      q: '한 구성에 VPC · DB · 앱 서버 300개 리소스가 있습니다. 앱 설정 한 줄 바꾸는 plan에 5분이 걸리고, 앱 팀의 실수가 DB까지 닿을까 걱정입니다. 가장 알맞은 개선은?',
      options: [
        '매번 -target으로 앱 리소스만 지정해 plan한다',
        'parallelism을 높여 plan을 빠르게 한다',
        '바뀌는 빈도와 위험도에 따라 network · data · app 구성으로 state를 나누고, 값은 output으로 전달한다',
        'state를 로컬로 내려받아 plan한다',
      ],
      answer: 2,
      step: 13,
      why: 'state를 나누면 plan이 조회할 리소스가 줄고, 잠금과 실수의 범위(사고 반경)가 한 구성 안에 머뭅니다. -target은 그래프 일부를 무시하는 예외용이라 일상 작업에 쓰면 의존 관계를 놓칩니다. parallelism은 속도만 조금 바꿀 뿐 사고 반경은 그대로입니다.',
    },
    {
      q: 'backend "s3" 블록의 key에 var.env를 넣어 환경마다 다른 경로를 쓰려 했더니 init이 실패합니다. 어떻게 해야 할까요?',
      options: [
        '백엔드는 init 때 변수 계산 전에 정해지므로 변수를 쓸 수 없다. -backend-config 파일로 환경별 값을 넘기거나 환경별 폴더에 backend 설정을 둔다',
        'locals로 감싸면 된다',
        'TF_VAR_env 환경 변수를 설정하면 된다',
        'init -upgrade로 실행하면 된다',
      ],
      answer: 0,
      step: 4,
      why: 'backend 블록은 init 단계에서 해석되며 변수나 locals를 쓸 수 없습니다. 환경마다 다른 값은 -backend-config로 파일이나 키=값을 넘기거나, 환경별 디렉터리마다 백엔드 설정을 따로 두는 것이 일반적입니다. TF_VAR나 locals는 백엔드에 적용되지 않습니다.',
    },
    {
      q: 'GCP 프로젝트의 리소스를 Terraform으로 관리하려 합니다. state 저장과 잠금을 GCP 안에서 해결하려면 어떤 백엔드가 맞을까요?',
      options: [
        'azurerm 백엔드',
        'local 백엔드에 공유 디스크',
        'Git 저장소',
        'gcs 백엔드 (Cloud Storage 버킷, 객체 버전 관리 켜기)',
      ],
      answer: 3,
      step: 7,
      why: 'gcs 백엔드는 Cloud Storage 버킷에 state를 두고 잠금도 기본으로 제공합니다. 객체 버전 관리를 켜 두면 덮어쓰기 사고 때 이전 버전으로 되돌릴 수 있어요. 공유 디스크의 로컬 파일이나 Git은 잠금과 암호화를 보장하지 못합니다.',
    },
    {
      q: 'CI 작업이 apply 도중 강제 종료됐고, 이후 모든 plan이 잠금 오류로 멈춥니다. Lock Info의 Who는 그 CI 작업입니다. 올바른 순서는?',
      options: [
        'CI 스크립트에 -lock=false를 영구히 추가한다',
        '그 CI 작업이 정말 끝났는지 확인한 뒤 Lock ID로 force-unlock하고, plan으로 state와 실제를 점검한다',
        'state 버킷을 지우고 다시 만든다',
        '잠금은 시간이 지나면 저절로 풀리니 하루 기다린다',
      ],
      answer: 1,
      step: 6,
      why: '비정상 종료로 남은 잠금은 실행 중인 작업이 없음을 확인한 뒤 force-unlock으로 풉니다. 중간에 끊긴 apply는 일부만 반영됐을 수 있으니 바로 plan으로 상태를 점검해요. -lock=false를 영구히 넣으면 동시 apply 사고가 다시 가능해지고, state 버킷을 지우면 기억 자체를 잃습니다.',
    },
    {
      q: '누군가 콘솔에서 새 보안 그룹을 만들었습니다. 다음 terraform plan은 이것을 어떻게 다룰까요?',
      options: [
        '삭제 대상으로 표시한다',
        '드리프트로 표시하고 코드에 추가하라고 알린다',
        '아무것도 표시하지 않는다. plan은 state에 있는 리소스만 조회하기 때문이다',
        'import 대상으로 자동 등록한다',
      ],
      answer: 2,
      step: 9,
      why: 'plan의 refresh는 state에 기록된 리소스만 ID로 다시 조회합니다. state에 없는 리소스는 Terraform이 존재조차 모르므로 아무 표시도 없어요. 그래서 관리 밖 리소스는 태그 정책이나 클라우드의 구성 감사 서비스로 따로 찾아야 합니다.',
    },
  ],
};
