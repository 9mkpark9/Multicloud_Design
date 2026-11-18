export default {
  id: 'iam',
  learn: [
    '루트 계정은 잠그고, 사람마다 MFA',
    '사용자 · 그룹 · 정책: 권한을 묶는 방법',
    '정책 JSON 읽기: Effect · Action · Resource',
    '역할과 임시 자격 증명, 서비스에 역할 붙이기',
    '최소 권한으로 사고 반경 줄이기',
    '4대 클라우드의 권한 모델 비교',
  ],
  legend: [['req', '요청'], ['ctrl', '역할 전환 · 자격 증명'], ['bad', '거부 · 유출']],
  metrics: [
    { id: 'blast', label: '사고 반경', icon: 'target' },
    { id: 'keys', label: '장기 액세스 키', icon: 'key' },
    { id: 'mfa', label: 'MFA', icon: 'fingerprint' },
    { id: 'life', label: '자격 증명 수명', icon: 'timer' },
  ],
  codes: {
    policy: {
      title: 'collector-policy.json', lang: 'json',
      text: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/items"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": [
        "arn:aws:sns:*:*:alerts"
      ]
    }
  ]
}`,
    },
  },
  scene: {
    nodes: {
      team: { kind: 'users', at: [0, 2.6], label: '팀원 모두' },
      root: { at: [2.6, 0.4], label: '루트 사용자', sub: '계정 주인', icon: 'key', color: 'red' },
      rootkey: { kind: 'tile', at: [3.0, 3.4], label: '루트 액세스 키', icon: 'file-key', color: 'red' },
      kim: { kind: 'client', at: [0, 2.6], label: '김 (개발)' },
      lee: { kind: 'client', at: [3.0, 3.4], label: '이 (개발)' },
      grp: { at: [2.6, 0.4], label: 'developers', sub: 'IAM 그룹', icon: 'users', color: 'blue' },
      gpol: { kind: 'tile', at: [4.8, -1.6], label: '개발자 정책', icon: 'scroll', color: 'yellow' },
      pol: { kind: 'tile', at: [2.6, 0.4], label: 'collector-policy', icon: 'scroll', color: 'yellow' },
      items: { kind: 'cyl', at: [4.8, -1.6], label: 'items 테이블', icon: 'table', color: 'blue' },
      topic: { kind: 'tile', at: [3.0, 3.4], label: 'alerts 토픽', icon: 'megaphone', color: 'red' },
      cust: { kind: 'cyl', at: [7.6, 1.2], label: 'customers 테이블', icon: 'table', color: 'gray' },
      fn: { at: [0, 2.6], label: 'Lambda', sub: '수집 함수', icon: 'zap', color: 'aws' },
      role: { at: [2.6, 0.4], label: 'IAM 역할', sub: '함수 실행 역할', icon: 'id-card', color: 'yellow' },
      ops: { kind: 'client', at: [3.0, 3.4], label: '운영자 (역할 전환)' },
      gh: { kind: 'tile', at: [2.6, 0.4], label: 'GitHub (공개)', icon: 'git', color: 'gray' },
      thief: { kind: 'client', at: [6.2, 0.8], label: '키 수집 봇' },
      mine: { at: [4.8, -1.6], label: 'EC2 × 40', sub: '코인 채굴', icon: 'server', color: 'red' },
    },
    edges: {
      e_root: { from: 'team', to: 'root' },
      e_rk: { from: 'root', to: 'rootkey', style: 'dashed', tone: 'bad' },
      e_kg: { from: 'kim', to: 'grp' },
      e_lg: { from: 'lee', to: 'grp' },
      e_gp: { from: 'grp', to: 'gpol', style: 'dashed', label: '연결' },
      e_pi: { from: 'pol', to: 'items', tone: 'ok' },
      e_pc: { from: 'pol', to: 'cust', style: 'dashed', tone: 'bad', label: '기본 거부' },
      e_fr: { from: 'fn', to: 'role' },
      e_or: { from: 'ops', to: 'role' },
      e_ri: { from: 'role', to: 'items' },
      e_rt: { from: 'role', to: 'topic' },
      e_rc: { from: 'role', to: 'cust', style: 'dashed', tone: 'bad', label: '거부' },
      e_kgh: { from: 'kim', to: 'gh' },
      e_gt: { from: 'gh', to: 'thief', tone: 'bad' },
      e_tm: { from: 'thief', to: 'mine', tone: 'bad' },
    },
  },
  steps: [
    {
      key: '루트 공유', kind: 'problem', title: '팀 전체가 루트로 로그인합니다',
      body: [
        '계정을 만들 때 쓴 이메일과 비밀번호로 들어가는 것이 <b>루트 사용자</b>입니다. 결제·계정 해지까지 <b>모든 것</b>을 할 수 있고, IAM 정책으로 제한할 수도 없어요. 그런데 팀 다섯 명이 이 비밀번호를 공유하고, 스크립트에는 루트 액세스 키가 들어 있습니다.',
        '누가 무엇을 지웠는지 기록으로 구분되지 않고, 한 명이 퇴사하면 비밀번호를 모두 바꿔야 합니다. 키가 새면 계정 전체가 넘어갑니다.',
      ],
      callout: { type: 'key', text: '루트에는 강한 비밀번호와 <b>MFA</b>를 걸고, 루트 액세스 키는 만들지 않습니다. 루트로만 할 수 있는 몇 가지 작업 말고는 쓰지 않아요.' },
      show: ['team', 'root', 'rootkey'],
      set: { root: { state: 'hot' } },
      tags: [{ on: 'root', text: '모든 권한 · 제한 불가', tone: 'bad', pos: 'right' }, { on: 'rootkey', text: 'deploy.sh 안에', tone: 'bad', icon: 'file-code', pos: 'right' }],
      flows: [{ path: ['team', 'root'], kind: 'req', n: 3 }],
      metrics: { blast: ['계정 전체', 'bad'], keys: ['루트 키 1개', 'bad'], mfa: ['없음', 'bad'], life: ['만료 없음', 'bad'] },
    },
    {
      key: '사용자 · 그룹', kind: 'solution', title: '사람마다 신원, 권한은 그룹에',
      body: [
        '<b>IAM</b>(Identity and Access Management)은 "누가 무엇을 할 수 있나"를 정하는 서비스입니다. 사람마다 <b>사용자</b>를 따로 만들고 MFA를 켜면, 모든 작업이 그 사람 이름으로 기록됩니다.',
        '권한을 사람마다 붙이면 금방 엉킵니다. 직무별 <b>그룹</b>을 만들어 권한 문서인 <b>정책</b>을 그룹에 붙이고, 사람은 그룹에 넣고 뺍니다. 입사·퇴사·이동이 그룹 변경 한 번으로 끝나요.',
      ],
      callout: { type: 'tip', text: '사람이 많아지면 IAM 사용자 대신 회사 계정으로 로그인하는 <b>IAM Identity Center</b>(SSO)를 권장합니다. ID 연합은 마지막 챕터에서 다룹니다.' },
      hide: ['team', 'root', 'rootkey'],
      show: ['kim', 'lee', 'grp', 'gpol'],
      tags: [{ on: 'grp', text: '멤버 모두 MFA', tone: 'ok', icon: 'fingerprint', pos: 'top' }],
      flows: [{ path: ['kim', 'grp'], kind: 'req' }, { path: ['lee', 'grp'], kind: 'req', delay: 0.4 }, { path: ['grp', 'gpol'], kind: 'ctrl', delay: 1.2 }],
      metrics: { blast: ['그룹 권한만큼', 'warn'], keys: ['루트 키 0개', 'ok'], mfa: ['루트 · 사람 모두', 'ok'] },
      changes: [['-', '루트 공유 · 루트 키'], ['+', '사람마다 IAM 사용자 + MFA'], ['+', '권한은 그룹에 정책으로']],
    },
    {
      key: '정책 JSON', kind: 'concept', title: '정책 읽기: 누가 아니라 무엇을',
      body: [
        '<b>정책</b>은 JSON 문서입니다. 문장(Statement)마다 <code>Effect</code>(허용·거부), <code>Action</code>(어떤 API), <code>Resource</code>(어떤 대상, ARN)를 씁니다. 이 정책은 지난 레슨의 함수가 쓸 것으로, <code>items</code> 테이블 읽기·쓰기와 <code>alerts</code> 토픽 발행만 허용합니다.',
        '적히지 않은 것은 모두 <b>기본 거부</b>입니다. 그리고 어디서든 명시적 <code>Deny</code>가 하나라도 있으면 허용보다 우선합니다.',
      ],
      callout: { type: 'warn', text: '<code>"Action": "*"</code>, <code>"Resource": "*"</code>는 빠르게 동작하게 만들지만, 사고가 나면 그만큼 넓게 번집니다.' },
      hide: ['kim', 'lee', 'grp', 'gpol'],
      show: ['pol', 'items', 'cust'],
      tags: [{ on: 'items', text: 'Get · Put 허용', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['pol', 'items'], kind: 'req', n: 2 }, { path: ['pol', 'cust'], kind: 'bad', delay: 0.8 }],
      code: { ref: 'policy', hl: [5, 6, 7, 8, 9, 10, 11, 12] },
      metrics: { blast: ['테이블 1 · 토픽 1', 'ok'] },
    },
    {
      key: '역할', kind: 'concept', title: '역할: 잠깐 빌려 쓰는 신분',
      body: [
        '<b>역할(role)</b>은 비밀번호도 장기 키도 없는 신원입니다. <b>신뢰 정책</b>에 적힌 주체만 이 역할을 <b>맡을(assume)</b> 수 있고, 맡으면 STS가 몇 시간 안에 만료되는 <b>임시 자격 증명</b>을 내줍니다.',
        '맡는 쪽은 다양합니다. Lambda 같은 AWS 서비스, 다른 계정의 사용자, 평소엔 읽기 권한만 쓰다 운영 작업 때만 역할을 전환하는 사람. 권한은 역할에 붙인 정책이 정합니다.',
      ],
      callout: { type: 'key', text: '임시 자격 증명은 새도 곧 쓸모가 없어집니다. "오래 사는 키를 줄인다"가 IAM 설계의 큰 방향입니다.' },
      hide: ['pol', 'items', 'cust'],
      show: ['fn', 'role', 'ops'],
      focus: ['role'],
      tags: [{ on: 'role', text: '신뢰: Lambda 서비스', icon: 'shield-check', pos: 'right' }, { on: 'ops', text: '필요할 때만 전환', pos: 'right' }],
      flows: [{ path: ['fn', 'role'], kind: 'ctrl' }, { path: ['role', 'fn'], kind: 'res', delay: 1 }, { path: ['ops', 'role'], kind: 'ctrl', delay: 1.6 }],
      metrics: { life: ['보통 1시간', 'ok'] },
      changes: [['+', '역할: 장기 키 없는 신원'], ['+', '신뢰 정책: 누가 맡을 수 있나'], ['~', '자격 증명은 몇 시간 뒤 만료']],
    },
    {
      key: '역할 붙이기', kind: 'solution', title: '코드에 키 대신, 서비스에 역할',
      body: [
        'Lambda에는 <b>실행 역할</b>을, EC2에는 <b>인스턴스 프로파일</b>로 역할을 붙입니다. 그러면 SDK가 실행 환경에서 임시 자격 증명을 알아서 받아 오고, 만료되기 전에 갱신까지 합니다.',
        '코드와 환경 변수에 <code>AWS_ACCESS_KEY_ID</code>를 넣을 이유가 사라집니다. 함수는 역할에 붙은 <code>collector-policy</code>만큼, 즉 <code>items</code> 테이블과 <code>alerts</code> 토픽만 건드릴 수 있습니다.',
      ],
      callout: { type: 'tip', text: 'GitHub Actions 같은 클라우드 밖의 CI도 <b>OIDC</b>로 역할을 맡게 하면 저장소 시크릿에 장기 키를 둘 필요가 없습니다.' },
      hide: ['ops'],
      show: ['items', 'topic'],
      tags: [{ on: 'fn', text: '코드에 키 없음', tone: 'ok', icon: 'check', pos: 'left' }],
      flows: [{ path: ['fn', 'role', 'items'], kind: 'req', n: 2 }, { path: ['fn', 'role', 'topic'], kind: 'req', n: 2, delay: 0.5 }],
      metrics: { keys: ['코드 안 0개', 'ok'] },
      changes: [['+', 'Lambda 실행 역할'], ['-', '코드 · 환경 변수의 액세스 키']],
    },
    {
      key: '키 유출', kind: 'case', title: '사례: GitHub에 올라간 액세스 키',
      body: [
        '로컬 테스트용으로 관리자 권한 사용자의 <b>액세스 키</b>를 설정 파일에 적었고, 그 파일이 공개 저장소에 푸시됐습니다. 공개 저장소를 훑는 봇이 몇 분 만에 키를 찾아, 여러 리전에 채굴용 인스턴스를 수십 대 띄웠습니다.',
        '대응은 즉시 <b>키 비활성화·삭제</b>, CloudTrail로 그 키가 한 일 확인, 만들어진 리소스 정리입니다. 커밋을 지워도 소용없어요. 이미 복사된 키는 폐기하는 수밖에 없습니다.',
      ],
      callout: { type: 'warn', text: '근본 대책은 장기 키를 <b>만들지 않는 것</b>입니다. 사람은 SSO와 임시 자격 증명, 워크로드는 역할로. 꼭 필요한 키라면 권한을 좁히고 주기적으로 교체합니다.' },
      hide: ['fn', 'role', 'items', 'topic'],
      show: ['kim', 'gh', 'thief', 'mine'],
      set: { mine: { state: 'hot' } },
      tags: [{ on: 'gh', text: 'config.ini에 키', tone: 'bad', icon: 'file-key', pos: 'bottom' }, { on: 'thief', text: '몇 분 만에 발견', tone: 'bad', pos: 'right' }],
      flows: [{ path: ['kim', 'gh'], kind: 'req' }, { path: ['gh', 'thief'], kind: 'bad', delay: 1 }, { path: ['thief', 'mine'], kind: 'bad', n: 3, delay: 1.8 }],
      metrics: { blast: ['계정 전체 (관리자)', 'bad'], keys: ['1개 유출', 'bad'], life: ['만료 없음', 'bad'] },
    },
    {
      key: '최소 권한', kind: 'concept', title: '최소 권한: 새도 덜 아프게',
      body: [
        '사고는 언젠가 납니다. 함수 코드에 취약점이 있어 공격자가 그 함수의 권한을 쓰게 됐다고 해 봅시다. 역할에 관리자 정책이 붙어 있었다면 계정 전체가 위험하지만, <b>최소 권한</b>으로 좁혀 두었다면 <code>items</code> 테이블과 <code>alerts</code> 토픽이 전부입니다.',
        '처음부터 완벽하게 좁히기는 어렵습니다. 좁게 시작해 거부 오류를 보며 넓히고, 사용하지 않는 권한은 마지막 사용 기록이나 IAM Access Analyzer로 찾아 걷어 냅니다.',
      ],
      callout: { type: 'key', text: '최소 권한은 사고를 막는 장치가 아니라 <b>사고 반경</b>을 줄이는 장치입니다. 서비스마다 역할을 따로 두는 것도 같은 이유예요.' },
      hide: ['kim', 'gh', 'thief', 'mine'],
      show: ['fn', 'role', 'items', 'topic', 'cust'],
      set: { fn: { state: 'hot', badge: '취약점' } },
      tags: [{ on: 'cust', text: '권한 없음', tone: 'ok', icon: 'lock', pos: 'right' }],
      flows: [{ path: ['fn', 'role', 'items'], kind: 'req' }, { path: ['fn', 'role', 'cust'], kind: 'bad', n: 2, delay: 0.6 }],
      metrics: { blast: ['테이블 1 · 토픽 1', 'ok'], keys: ['0개', 'ok'], life: ['1시간', 'ok'] },
    },
    {
      key: '4대 클라우드', kind: 'compare', title: '네 클라우드의 권한 모델',
      body: [
        'Azure는 <b>Entra ID</b>가 신원을, <b>RBAC</b>가 권한을 맡습니다. 권한 하나가 "주체 · 역할 · 범위"의 묶음이고, 워크로드는 관리 ID를 씁니다. GCP는 리소스 계층(조직·폴더·프로젝트)에 주체와 역할을 바인딩하고 아래로 상속하며, 워크로드는 서비스 계정을 씁니다.',
        'NCP는 <b>Sub Account</b>로 메인 계정 아래 서브 계정과 그룹을 만들고 정책을 부여합니다. 모델은 달라도 질문은 같아요. 누가, 무엇을, 어디에.',
      ],
      callout: { type: 'cloud', text: '"역할"이라는 말이 클라우드마다 다릅니다. AWS의 역할은 맡는 신원이고, Azure·GCP의 역할은 권한 묶음입니다.' },
      hide: ['cust'],
      set: { fn: { state: null, badge: null } },
      panel: {
        title: '권한 모델', icon: 'shield',
        rows: [['AWS', 'IAM 사용자 · 그룹 · 역할 · 정책', 'aws'], ['Azure', 'Entra ID + RBAC (주체·역할·범위)', 'azure'], ['GCP', 'IAM 바인딩 · 서비스 계정', 'gcp'], ['NCP', 'Sub Account (서브 계정 · 정책)', 'ncp']],
      },
      flows: [{ path: ['fn', 'role', 'items'], kind: 'req' }, { path: ['fn', 'role', 'topic'], kind: 'req', delay: 0.5 }],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 오래 사는 키를 줄이고, 좁게 주기',
      body: [
        '루트는 잠그고 MFA, 사람은 각자의 신원으로 그룹을 통해 권한을 받습니다. 정책은 <code>Effect</code> · <code>Action</code> · <code>Resource</code>로 읽고, 적히지 않은 것은 거부됩니다.',
        '워크로드에는 키 대신 <b>역할</b>을 붙여 임시 자격 증명을 쓰고, 권한은 <b>최소</b>로. 다음 챕터에서는 지금까지 AWS 이름으로 본 것들을 네 클라우드의 지도로 펼쳐 봅니다.',
      ],
      focus: ['role'],
      tags: [{ on: 'role', text: '임시 자격 증명', tone: 'ok', icon: 'timer', pos: 'top' }],
      flows: [{ path: ['fn', 'role'], kind: 'ctrl' }, { path: ['role', 'items'], kind: 'req', delay: 1 }, { path: ['role', 'topic'], kind: 'req', delay: 1.3 }],
    },
  ],
  quiz: [
    {
      q: 'EC2에서 도는 앱이 S3 버킷 하나를 읽어야 합니다. 가장 알맞은 방법은?',
      options: ['관리자 사용자의 액세스 키를 앱 설정 파일에 넣는다', '그 버킷 읽기만 허용하는 정책을 붙인 역할을 인스턴스 프로파일로 EC2에 붙인다', '루트 액세스 키를 환경 변수로 넣는다', '버킷을 공개 읽기로 바꾼다'],
      answer: 1,
      why: '역할을 붙이면 SDK가 임시 자격 증명을 자동으로 받아 갱신하므로 코드에 키가 없습니다. 정책을 그 버킷 읽기로 좁히면 사고 반경도 작습니다. 키를 파일·환경 변수에 두면 유출 표면이 생기고, 공개 버킷은 모두에게 엽니다.',
    },
    {
      q: '한 정책은 s3:*를 허용하고, 같은 사용자에게 붙은 다른 정책은 s3:DeleteObject를 명시적으로 거부합니다. 이 사용자가 객체를 지우려 하면?',
      options: ['허용된다: 허용 정책이 더 넓으니까', '거부된다: 명시적 거부가 허용보다 우선하니까', '나중에 붙인 정책이 이긴다', '루트가 승인해야 한다'],
      answer: 1,
      why: 'AWS 정책 평가에서 명시적 Deny는 어떤 Allow보다 우선합니다. 아무 언급이 없으면 기본 거부이고, 허용이 있어야만 통과합니다. 붙인 순서는 결과에 영향을 주지 않습니다.',
    },
    {
      q: '공개 저장소에 액세스 키를 푸시한 것을 30분 뒤에 알았습니다. 가장 먼저 할 일은?',
      options: ['커밋을 지우고 강제 푸시한다', '저장소를 비공개로 바꾼다', '그 키를 즉시 비활성화·삭제하고, CloudTrail로 키가 한 일을 확인한다', '키의 권한을 읽기 전용으로 바꾼다'],
      answer: 2,
      why: '공개된 키는 이미 복사됐다고 봐야 합니다. 커밋 삭제나 비공개 전환은 복사본을 없애지 못합니다. 키를 폐기하고, 그 사이 무슨 일이 있었는지 기록으로 확인해 만들어진 리소스를 정리하는 것이 먼저입니다.',
    },
    {
      q: 'Azure와 GCP의 문서에서 "역할(role)"이라는 말을 만났습니다. AWS 경험으로 오해하기 쉬운 점은?',
      options: ['Azure·GCP의 역할도 맡아서 쓰는 신원이다', 'Azure·GCP의 역할은 권한의 묶음이고, 주체에게 범위와 함께 부여한다', 'Azure·GCP에는 역할이 없다', 'Azure·GCP의 역할은 루트 계정만 쓸 수 있다'],
      answer: 1,
      why: 'AWS의 역할은 맡아서 임시 자격 증명을 받는 신원입니다. Azure RBAC와 GCP IAM의 역할은 권한 목록이고, "누구에게 · 어떤 역할을 · 어느 범위에서"로 할당합니다. 워크로드 신원은 각각 관리 ID와 서비스 계정이 맡습니다.',
    },
  ],
};
