export default {
  id: 'tf-state',
  learn: [
    'state: 코드의 주소와 실제 리소스를 잇는 기억',
    '로컬 state의 위험과 원격 백엔드',
    '잠금으로 동시 apply 막기',
    'state 안의 비밀값 다루기',
    '드리프트 감지와 import',
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
    use_lockfile = true # 잠금: 다음 단계에서
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
  },
  steps: [
    {
      key: '기억', kind: 'problem', title: 'Terraform은 무엇으로 기억할까요',
      body: [
        '지난 레슨에서 apply로 VPC · 서브넷 · 인스턴스를 만들었고, 다시 plan을 돌리면 <code>No changes</code>가 나왔습니다. 그런데 AWS에는 <code>aws_vpc.main</code>이라는 이름이 없어요. AWS가 아는 것은 <code>vpc-0a1b…</code> 같은 ID뿐입니다.',
        '둘을 이어 주는 것이 <b>state</b>입니다. apply가 끝날 때마다 Terraform은 <b>코드의 주소 ↔ 실제 리소스의 ID와 속성</b>을 JSON 파일 <code>terraform.tfstate</code>에 적어 둡니다. 다음 plan은 이 ID로 실제 리소스를 조회해 코드와 비교해요.',
      ],
      callout: { type: 'key', text: 'state는 Terraform의 <b>기억</b>입니다. 계정 안의 수많은 VPC 가운데 어느 것이 내 것인지 알려 주는 유일한 근거예요. 직접 고치지 말고 <code>terraform state list</code> · <code>show</code>로 들여다보세요.' },
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
    },
    {
      key: 'state 삭제', kind: 'case', title: '사례: state 파일을 지웠더니',
      body: [
        '기본 설정에서 state는 <b>작업 폴더의 파일</b>입니다. 폴더를 정리하다 지워졌거나, 새 노트북에 코드만 다시 받았다고 해 봅시다. plan을 돌리면 <code>3 to add</code>가 나옵니다. 기억이 없으니 Terraform에게는 <b>아무것도 만든 적 없는</b> 상태예요.',
        '그대로 apply하면 VPC와 서버가 <b>한 벌 더</b> 생깁니다. 먼저 만든 것들은 아무도 관리하지 않는 채로 남아 요금만 나가요. 이름이 유일해야 하는 리소스라면 "이미 있다"는 오류로 중간에 멈춥니다.',
      ],
      callout: { type: 'warn', text: 'AWS의 리소스는 멀쩡합니다. 잃은 것은 <b>연결</b>이에요. 로컬에는 직전 상태인 <code>terraform.tfstate.backup</code>이 남지만, 그것마저 없으면 리소스를 하나씩 다시 연결(import)해야 합니다.' },
      hide: ['file'],
      set: { state: { state: 'down', badge: '삭제됨', tone: 'bad' } },
      code: { ref: 'gone', hl: [1, 4, 15] },
      tags: [
        { on: 'aws', text: '리소스는 그대로' },
        { on: 'tf', text: '기억 없음 → 3 to add', tone: 'bad', pos: 'left' },
      ],
      flows: [{ path: ['tf', 'state'], kind: 'bad' }, { path: ['tf', 'aws'], kind: 'ctrl', n: 3, gap: 0.5, delay: 1.2 }],
      metrics: { where: ['없음', 'bad'], sync: ['연결 끊김', 'bad'] },
      changes: [['-', 'terraform.tfstate'], ['~', 'plan: No changes → 3 to add'], ['-', '기존 리소스: 관리 밖에 남음']],
    },
    {
      key: '원격 백엔드', kind: 'solution', title: '원격 백엔드: state를 공유 저장소에',
      body: [
        'state를 어디에 둘지는 <b>백엔드(backend)</b>가 정합니다. 기본은 로컬 파일이고, <code>backend "s3"</code>를 적으면 S3 버킷에 둬요. <code>terraform init -migrate-state</code>가 기존 로컬 state를 옮겨 줍니다.',
        '이제 state는 노트북과 무관합니다. 동료도 CI도 같은 state를 읽으니, 누가 실행해도 같은 기억에서 출발해요. 버킷의 <b>버전 관리</b>를 켜 두면 state가 깨지거나 지워져도 이전 버전으로 돌아갈 수 있습니다.',
      ],
      callout: { type: 'cloud', text: 'Azure는 Blob Storage(<code>azurerm</code>), GCP는 Cloud Storage(<code>gcs</code>) 백엔드를 씁니다. 직접 운영하기 싫다면 HCP Terraform 같은 서비스가 저장 · 잠금 · 실행을 맡아 줘요.' },
      hide: ['state'],
      show: ['s3'],
      set: { state: { state: null, badge: null } },
      code: { ref: 'backend', hl: [2, 3, 4, 5, 6] },
      tags: [{ on: 's3', text: '버전 관리 · 암호화', tone: 'ok', icon: 'shield-check', pos: 'right' }],
      flows: [{ path: ['tf', 's3'], kind: 'data', n: 2 }, { path: ['tf', 'aws'], kind: 'ctrl', delay: 1.4 }],
      metrics: { where: ['S3 버킷', 'ok'], sync: ['일치', 'ok'] },
      changes: [['+', 'backend "s3" 블록'], ['~', 'state: 노트북 → S3 버킷'], ['+', '버킷 버전 관리 · 암호화']],
    },
    {
      key: '동시 apply', kind: 'case', title: '사례: 두 사람이 동시에 apply 했다',
      body: [
        '민지와 준호가 같은 시각에 각자 apply를 시작했습니다. 둘 다 <b>같은 시점의 state</b>를 읽고 출발해요. 민지는 서브넷을 추가하고, 준호는 인스턴스 크기를 바꿉니다.',
        '민지의 apply가 먼저 끝나 state에 새 서브넷이 기록됩니다. 잠시 뒤 준호의 apply가 <b>자기가 읽었던 state</b>에 변경을 얹어 그대로 써요. 민지의 서브넷 기록은 덮여 사라집니다. 서브넷은 AWS에 실제로 있는데 Terraform은 모르니, 다음 plan은 그것을 또 만들려다 CIDR이 겹쳐 실패합니다.',
      ],
      callout: { type: 'warn', text: '공유하는 순간 <b>동시에 쓰는 문제</b>가 생깁니다. state를 Git에 올려 공유하는 방식도 같은 이유로 깨져요. 원격에 두는 것만으로는 부족합니다.' },
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
    },
    {
      key: '잠금', kind: 'solution', title: '잠금: 한 번에 한 사람만 씁니다',
      body: [
        '백엔드의 <b>잠금(lock)</b>이 이 문제를 막습니다. plan이나 apply는 시작할 때 state에 잠금을 걸고, 끝나면 풉니다. 그사이 다른 사람이 실행하면 왼쪽 오류로 멈춰요. <code>Lock Info</code>의 <code>Who</code>를 보면 누가 쓰는 중인지 알 수 있습니다.',
        'S3 백엔드는 <code>use_lockfile = true</code>로 버킷 안에 잠금 파일을 만듭니다. 예전 구성은 DynamoDB 테이블을 따로 뒀어요. 실행이 비정상 종료되어 잠금만 남았다면 <code>terraform force-unlock</code>으로 풉니다.',
      ],
      callout: { type: 'warn', text: '<code>force-unlock</code>과 <code>-lock=false</code>는 <b>정말 아무도 실행 중이 아닐 때만</b> 씁니다. 근본 해법은 사람이 노트북에서 apply하지 않고, CI 한 곳에서만 차례로 apply하는 것이에요.' },
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
    },
    {
      key: '민감 정보', kind: 'concept', title: 'state에는 비밀번호가 그대로 있습니다',
      body: [
        'state는 리소스의 <b>모든 속성</b>을 기록합니다. DB를 만들면서 넘긴 비밀번호, 생성된 액세스 키, 인증서의 개인 키도 들어가요. <b>평문</b>으로요.',
        '변수에 <code>sensitive = true</code>를 붙이면 plan과 출력 화면에서는 <code>(sensitive value)</code>로 가려지지만, state 안의 값은 그대로입니다. 그래서 state는 <b>비밀 문서처럼</b> 다룹니다. Git에 올리지 않고, 버킷은 암호화하며, 읽을 수 있는 사람과 역할을 좁힙니다.',
      ],
      callout: { type: 'tip', text: '가장 좋은 것은 비밀을 state에 넣지 않는 것입니다. RDS가 비밀번호를 직접 만들어 Secrets Manager에 두게 하거나(<code>manage_master_user_password</code>), 최신 Terraform의 write-only 인자를 쓰면 state에 남지 않아요.' },
      hide: ['a', 'b'],
      show: ['tf', 'aws'],
      set: { a: { badge: null }, b: { badge: null } },
      code: { ref: 'secret', hl: [10, 11] },
      tags: [
        { on: 's3', text: 'password가 평문', tone: 'bad', icon: 'eye', pos: 'right' },
        { on: 'aws', text: 'RDS 생성' },
      ],
      flows: [{ path: ['tf', 'aws'], kind: 'ctrl' }, { path: ['tf', 's3'], kind: 'data', delay: 1.2 }],
      metrics: { where: ['S3 · 암호화', 'ok'] },
    },
    {
      key: '드리프트', kind: 'solution', title: '드리프트: plan이 차이를 잡아냅니다',
      body: [
        '장애 대응 중 누군가 콘솔에서 인스턴스를 <code>t3.large</code>로 키웠습니다. 코드와 state는 여전히 <code>t3.micro</code>예요. 이렇게 실제가 코드에서 벗어난 것을 <b>드리프트(drift)</b>라고 합니다.',
        'plan은 먼저 state에 적힌 ID로 실제 리소스를 <b>다시 조회</b>(refresh)합니다. 그래서 차이를 발견하고 "코드대로 <code>t3.micro</code>로 되돌리겠다"고 알려 줘요. 여기서 판단이 필요합니다. 콘솔의 변경이 옳았다면 <b>코드를 고쳐</b> 맞추고, 아니라면 apply로 되돌립니다.',
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
    },
    {
      key: 'import', kind: 'solution', title: 'import: 이미 있는 것을 state로',
      body: [
        '콘솔로 만든 업로드용 버킷 <code>shop-uploads</code>가 있습니다. Terraform은 이 버킷을 모르니, <code>resource</code> 블록만 적고 apply하면 같은 이름으로 새로 만들려다 실패해요.',
        '<b>import 블록</b>에 "이 주소(<code>to</code>)는 저 실제 리소스(<code>id</code>)"라고 적으면, 다음 apply가 버킷을 건드리지 않고 <b>state에 연결만</b> 합니다. plan에 <code>1 to import</code>로 나타나니 리뷰도 할 수 있어요. 그 뒤 plan이 <code>No changes</code>가 될 때까지 코드를 실제 설정에 맞춥니다.',
      ],
      callout: { type: 'tip', text: '<code>terraform plan -generate-config-out=파일</code>은 resource 블록의 초안까지 써 줍니다. 반대로 지우지 않고 관리에서만 빼려면 <code>removed</code> 블록이나 <code>terraform state rm</code>을 써요.' },
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
    },
    {
      key: 'state 나누기', kind: 'concept', title: 'state를 나눠 사고 반경을 줄입니다',
      body: [
        '모든 것을 state 하나에 담으면 plan은 수백 개 리소스를 매번 조회하느라 느려지고, 잠금 하나를 온 팀이 기다립니다. 무엇보다 앱 설정 한 줄을 고치려던 apply가 <b>VPC와 DB까지 닿을 수</b> 있어요. 실수가 미치는 범위, <b>사고 반경(blast radius)</b>이 전체입니다.',
        '그래서 <b>바뀌는 빈도와 위험도</b>가 다른 것끼리 나눕니다. 드물게 바뀌는 네트워크, 조심스러운 데이터, 자주 바뀌는 앱. 환경(dev · prod)도 따로예요. 앱 구성은 네트워크 구성의 <b>output</b>을 읽어 서브넷 ID를 받습니다.',
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
    },
    {
      key: '정리', kind: 'recap', title: '정리: state는 기억이자 비밀 문서',
      body: [
        'state는 코드의 주소와 실제 리소스를 잇는 <b>기억</b>입니다. 잃으면 연결이 끊기니 <b>원격 백엔드</b>에 두고, 동시에 쓰지 못하게 <b>잠금</b>을 걸고, 비밀값이 들어 있으니 암호화하고 접근을 좁힙니다.',
        'plan은 실제를 다시 조회해 <b>드리프트</b>를 알려 주고, <b>import</b>는 이미 있는 리소스를 들여옵니다. state를 나누면 사고 반경이 줄어요. 그런데 dev · stg · prod마다 코드를 복사해 둘 수는 없겠죠. 다음 레슨에서 <b>변수와 모듈</b>로 같은 코드를 여러 환경에 씁니다.',
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
        'import로 기존 리소스를 코드의 주소에 하나씩 다시 연결한다',
        'terraform init을 다시 실행하면 state가 재생성된다',
        '콘솔에서 리소스를 모두 지우고 apply로 처음부터 다시 만든다',
      ],
      answer: 1,
      why: 'state가 없으면 Terraform은 아무것도 만든 적이 없다고 보고 전부 새로 만들려 합니다. 이름이나 태그로 알아서 찾아 주지 않아요. 실제 리소스를 건드리지 않고 연결만 되살리는 방법이 import입니다. init은 프로바이더와 백엔드를 준비할 뿐이고, 전부 지우고 다시 만드는 것은 운영 중인 서비스에서는 장애와 데이터 손실입니다.',
    },
    {
      q: 'apply를 실행하자 "Error acquiring the state lock"이 나왔고, Lock Info의 Who는 동료입니다. 먼저 할 일은?',
      options: [
        'terraform force-unlock으로 잠금을 바로 푼다',
        '-lock=false 옵션을 붙여 다시 실행한다',
        '동료의 작업이 진행 중인지 확인하고, 끝나기를 기다린다',
        'state를 로컬로 내려받아 따로 작업한 뒤 올린다',
      ],
      answer: 2,
      why: '잠금은 동시에 쓰는 것을 막으려고 정상 동작한 것입니다. 실행 중인 작업이 있는데 force-unlock이나 -lock=false로 밀고 들어가면 두 apply가 서로의 기록을 덮어씁니다. 강제로 푸는 것은 실행이 죽어 잠금만 남았다고 확인했을 때뿐이에요. state를 따로 복사해 작업하는 것은 잠금을 우회하는 또 다른 방법일 뿐입니다.',
    },
    {
      q: '코드를 바꾸지 않았는데 plan에 instance_type = "t3.large" -> "t3.micro"가 나옵니다. 가장 알맞은 해석과 대응은?',
      options: [
        'Terraform의 버그이므로 무시하고 apply한다',
        '누군가 Terraform 밖에서 크기를 키운 드리프트다. 그 변경이 필요한지 확인해 코드에 반영하거나 되돌린다',
        'state가 손상된 것이니 state 파일을 지우고 다시 만든다',
        '프로바이더 버전이 바뀐 탓이니 init을 다시 실행한다',
      ],
      answer: 1,
      why: 'plan은 실제 리소스를 다시 조회하므로, 실제(t3.large)가 코드(t3.micro)와 다르면 코드 쪽으로 되돌리는 변경을 제안합니다. 누가 왜 키웠는지 모른 채 apply하면 서버가 다시 작아져요. 변경이 옳았다면 코드를 t3.large로 고쳐 No changes를 만들어야 합니다. state를 지우면 문제가 드리프트 하나에서 전체 연결 유실로 커집니다.',
    },
    {
      q: '팀원이 "state 파일을 코드와 함께 Git에 커밋해 공유하자"고 제안합니다. 가장 알맞은 답은?',
      options: [
        '좋은 방법이다. 변경 이력까지 남는다',
        'state에는 비밀값이 평문으로 들어 있고 Git에는 잠금이 없다. 잠금과 암호화가 되는 원격 백엔드에 둔다',
        'state는 바이너리 파일이라 Git에 저장할 수 없다',
        '.terraform.lock.hcl과 내용이 같으므로 그 파일만 커밋하면 된다',
      ],
      answer: 1,
      why: 'state는 JSON 텍스트라 커밋은 되지만, DB 비밀번호 같은 값이 그대로 저장소 히스토리에 남고, pull을 잊은 사람이 낡은 state로 apply하거나 두 사람이 동시에 apply하는 것을 막을 수 없습니다. .terraform.lock.hcl은 프로바이더 버전을 기록하는 전혀 다른 파일이며, 이름의 lock도 state 잠금과 무관합니다.',
    },
  ],
};
