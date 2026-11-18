export default {
  id: 'multicloud-identity-data',
  learn: [
    '하나의 IdP로 모든 클라우드에 SSO 연합하기 (SAML · OIDC, 그룹 → 역할)',
    '비상 계정과 SCIM으로 연합을 안전하게 운영하기',
    '워크로드 아이덴티티 연합: 장기 키 없이 다른 클라우드 호출',
    '데이터 중력과 "데이터는 한 곳에, 계산은 가까이"',
    '데이터 레지던시: 원본 · 백업 · 로그가 모두 어디에 있나',
    '동기 · 비동기 복제와 일관성',
  ],
  legend: [['ctrl', '로그인 · 토큰'], ['req', 'API 호출 · 쓰기'], ['data', '데이터'], ['sync', '복제'], ['bad', '유출 · 실패']],
  metrics: [
    { id: 'accts', label: '관리할 계정', icon: 'user-cog' },
    { id: 'keys', label: '장기 액세스 키', icon: 'key' },
    { id: 'xfer', label: '클라우드 간 전송', icon: 'truck' },
    { id: 'rpo', label: '복제 RPO', icon: 'history' },
  ],
  scene: {
    zones: {
      // workload identity: a GKE job reads an AWS bucket
      zG: { at: [0, 1.8], size: [3, 3], label: 'GCP · GKE', color: 'gcp' },
      zA: { at: [3.6, -2.6], size: [3.6, 3.8], label: 'AWS', color: 'aws' },
      // data
      dA: { at: [3, -2.8], size: [3.6, 4.4], label: 'AWS', color: 'aws' },
      dG: { at: [-0.6, 1.6], size: [3, 3.4], label: 'GCP', color: 'gcp' },
      dZ: { at: [-0.6, 1.6], size: [3, 3.4], label: 'Azure (DR)', color: 'azure' },
      rK: { at: [3, -2.8], size: [4.2, 4.8], label: 'NCP 공공 존 (국내)', color: 'ncp' },
    },
    nodes: {
      // people
      staff: { kind: 'users', at: [-2.4, 0.6], label: '엔지니어 5명' },
      idp: { at: [2.5, 2.5], label: 'Entra ID', sub: '사내 IdP', icon: 'id-card', color: 'azure' },
      aws: { at: [0, 0], label: 'AWS', sub: 'IAM 사용자', icon: 'cloud', color: 'aws' },
      azure: { at: [5, 0], label: 'Azure', sub: 'Entra 계정', icon: 'cloud', color: 'azure' },
      gcp: { at: [0, 5], label: 'GCP', sub: 'Google 계정', icon: 'cloud', color: 'gcp' },
      ncp: { at: [5, 5], label: 'NCP', sub: 'Sub Account', icon: 'cloud', color: 'ncp' },
      vault: { kind: 'tile', at: [1.8, -1.8], label: '비상 계정 금고', icon: 'lock', color: 'slate' },
      // workloads
      pod: { at: [1.2, 3.2], label: '분석 배치', sub: 'GKE Pod', icon: 'box', color: 'gcp' },
      sts: { at: [4.4, -1.8], size: 's', label: 'STS', sub: '임시 자격', icon: 'key-round', color: 'aws' },
      s3: { kind: 'cyl', at: [6.4, -0.4], label: '주문 로그 (S3)', icon: 'archive', color: 'aws' },
      git: { kind: 'cyl', at: [-2, 2], label: 'Git 저장소', icon: 'git', color: 'slate' },
      att: { kind: 'client', at: [2.4, -2.6], label: '외부 공격자' },
      // data
      lake: { kind: 'cyl', at: [5.8, -1.8], label: '주문 데이터 50TB', icon: 'database', color: 'aws' },
      bq: { at: [0.6, 3.4], label: 'BigQuery', sub: '분석', icon: 'chart-bar', color: 'gcp' },
      etl: { at: [3.8, 0.2], label: '집계 작업', sub: '데이터 곁에서', icon: 'workflow', color: 'aws' },
      pubdb: { kind: 'cyl', at: [3.9, -1.8], label: '공공 고객 DB', icon: 'database', color: 'ncp' },
      pbk: { kind: 'tile', at: [6.3, -1.8], label: '백업 사본', icon: 'save', color: 'ncp' },
      plog: { kind: 'tile', at: [6.3, 0.4], label: '감사 로그', icon: 'file-text', color: 'ncp' },
      app: { at: [3.8, 0.2], label: '주문 API', icon: 'server', color: 'aws' },
      db: { kind: 'cyl', at: [5.8, -1.8], label: '주문 DB', icon: 'database', color: 'aws' },
      rep: { kind: 'cyl', at: [0.6, 3.4], label: 'DR 복제본', icon: 'database', color: 'azure' },
    },
    edges: {
      d1: { from: 'staff', to: 'aws', style: 'dashed' },
      d2: { from: 'staff', to: 'azure', style: 'dashed' },
      d3: { from: 'staff', to: 'gcp', style: 'dashed' },
      d4: { from: 'staff', to: 'ncp', style: 'dashed' },
      e_si: { from: 'staff', to: 'idp' },
      f1: { from: 'idp', to: 'aws' },
      f2: { from: 'idp', to: 'azure' },
      f3: { from: 'idp', to: 'gcp' },
      f4: { from: 'idp', to: 'ncp' },
      e_sv: { from: 'staff', to: 'vault', style: 'dashed', off: true },
      e_va: { from: 'vault', to: 'aws', style: 'dashed', tone: 'accent', off: true },
      e_ps: { from: 'pod', to: 's3' },
      e_leak: { from: 'pod', to: 'git', style: 'dashed', tone: 'bad' },
      e_grab: { from: 'git', to: 'att', tone: 'bad' },
      e_att: { from: 'att', to: 's3', tone: 'bad' },
      e_tok: { from: 'pod', to: 'sts', bi: true, label: '토큰 교환' },
      e_ss: { from: 'sts', to: 's3', style: 'dashed', tone: 'mute', arrow: false },
      e_lb: { from: 'lake', to: 'bq', tone: 'bad', label: 'egress' },
      e_le: { from: 'lake', to: 'etl' },
      e_eb: { from: 'etl', to: 'bq', tone: 'ok', label: '결과만' },
      e_pb: { from: 'pubdb', to: 'pbk', style: 'dashed' },
      e_pl: { from: 'pubdb', to: 'plog', style: 'dashed' },
      e_pq: { from: 'pubdb', to: 'bq', style: 'dashed', tone: 'bad', label: '원본 반출 금지' },
      e_ad: { from: 'app', to: 'db' },
      e_rep: { from: 'db', to: 'rep', via: [[4.6, 2.4]], style: 'dashed', label: '복제' },
      e_ar: { from: 'app', to: 'rep', style: 'dashed', tone: 'bad', label: '재고 읽기', off: true },
    },
  },
  codes: {
    claims: {
      title: 'OIDC 토큰 클레임', lang: 'text',
      text: `iss     IdP(Entra ID) 테넌트 주소
sub     사용자의 고유 ID
aud     토큰을 받을 앱(클라우드)의 ID
exp     만료 시각 (발급 후 약 1시간)
email   kim@shop.example
groups  ["shop-dev"]

# SAML이면 같은 내용이 XML 어설션의
# <Subject> · <Attribute>에 들어가고
# IdP의 인증서로 서명됩니다`,
    },
    trust: {
      title: 'trust-policy.json', lang: 'json',
      text: `{
  "Effect": "Allow",
  "Principal": {
    "Federated": "accounts.google.com"
  },
  "Action":
    "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "accounts.google.com:sub":
        "109876543210987654321"
    }
  }
}`,
    },
  },
  steps: [
    {
      key: '계정 네 벌', kind: 'problem', title: '클라우드마다 계정이 따로입니다',
      body: [
        '<code>shop.example</code>의 엔지니어 5명은 네 클라우드에 계정이 하나씩 있습니다. AWS의 IAM 사용자, Azure 계정, Google 계정, NCP의 Sub Account. 사람마다 비밀번호와 MFA가 네 벌이고, 노트북에는 CLI용 <b>장기 액세스 키</b>가 저장되어 있어요.',
        '가장 아픈 날은 누가 퇴사하는 날입니다. 네 곳을 전부 찾아 지워야 하는데, 한 곳이라도 빠뜨리면 그 계정과 키는 <b>주인 없이 살아 있습니다</b>.',
      ],
      callout: { type: 'warn', text: '잊힌 계정과 오래된 키는 침해 사고의 흔한 입구입니다. 계정이 늘수록 "누가 어디에 들어갈 수 있나"에 답하기 어려워집니다.' },
      show: ['staff', 'aws', 'azure', 'gcp', 'ncp'],
      set: { ncp: { badge: '퇴사자 계정', tone: 'bad' } },
      tags: [{ on: 'staff', text: '비밀번호 · MFA × 4', icon: 'key' }],
      flows: [
        { path: ['staff', 'aws'], kind: 'ctrl' }, { path: ['staff', 'azure'], kind: 'ctrl', delay: 0.4 },
        { path: ['staff', 'gcp'], kind: 'ctrl', delay: 0.8 }, { path: ['staff', 'ncp'], kind: 'ctrl', delay: 1.2 },
      ],
      metrics: { accts: ['20개', 'bad'], keys: ['노트북마다', 'warn'], xfer: '—', rpo: '—' },
      more: [
        { title: '직접 해보기: 오래된 키 찾기', body: ['AWS에서는 자격 증명 보고서로 사용자별 키의 나이와 마지막 사용일을 한 번에 볼 수 있습니다.'], code: { title: 'terminal', lang: 'sh', text: `$ aws iam generate-credential-report
$ aws iam get-credential-report \\
    --query Content --output text | base64 -d \\
  | cut -d, -f1,9,11 | column -t -s,
user        access_key_1_active  access_key_1_last_used_date
kim         true                 2026-11-17T09:12:00+00:00
lee-left    true                 2026-03-02T01:40:00+00:00` } },
        { title: '계정이 흩어져 있을 때 생기는 일', list: [
          '퇴사 · 부서 이동 처리가 클라우드마다 따로라 <b>누락</b>이 생김',
          'MFA 정책이 클라우드마다 달라 가장 약한 곳이 기준이 됨',
          '감사 때 "누가 어디에 접근할 수 있나" 목록을 손으로 모아야 함',
          '노트북 분실 = 네 클라우드의 장기 키 분실',
        ] },
        { title: '목표 상태', body: [
          '사람의 계정은 <b>한 곳</b>(IdP)에만 있고, 클라우드에는 사람의 비밀번호와 장기 키가 하나도 없는 상태입니다. 클라우드는 IdP를 믿고 짧게 사는 세션만 내줍니다. 다음 단계부터 그 구조를 만듭니다.',
        ] },
      ],
    },
    {
      key: 'SSO 연합', kind: 'solution', title: '로그인은 한 곳에서, 클라우드는 믿기만',
      body: [
        '사람의 신원은 <b>IdP</b>(Identity Provider) 한 곳에만 둡니다. 회사가 이미 쓰는 Entra ID가 그 원장이에요. 각 클라우드는 "이 IdP가 서명한 증명이면 믿는다"고 설정합니다. 이것이 <b>ID 연합(federation)</b>입니다.',
        '엔지니어는 IdP에서 MFA와 함께 한 번 로그인하고, 클라우드는 증명의 서명을 확인한 뒤 <b>몇 시간짜리 세션</b>을 내줍니다. 클라우드 쪽에는 비밀번호가 없습니다.',
      ],
      callout: { type: 'key', text: '퇴사 처리는 IdP에서 한 번 끄면 끝입니다. 사용자와 그룹을 클라우드로 자동 동기화할 때는 <b>SCIM</b> 표준을 씁니다.' },
      show: ['idp'],
      hide: ['d1', 'd2', 'd3', 'd4'],
      set: { aws: { sub: 'SSO 세션' }, azure: { sub: 'SSO 세션' }, gcp: { sub: 'SSO 세션' }, ncp: { sub: 'SSO 세션', badge: null } },
      focus: ['idp'],
      tags: [{ on: 'idp', text: 'MFA 한 번', tone: 'ok', icon: 'fingerprint', pos: 'right' }],
      flows: [
        { path: ['staff', 'idp'], kind: 'ctrl' },
        { path: ['idp', 'aws'], kind: 'ctrl', delay: 1 }, { path: ['idp', 'azure'], kind: 'ctrl', delay: 1 },
        { path: ['idp', 'gcp'], kind: 'ctrl', delay: 1 }, { path: ['idp', 'ncp'], kind: 'ctrl', delay: 1 },
      ],
      metrics: { accts: ['5개 (IdP)', 'ok'] },
      changes: [['+', 'Entra ID: 유일한 사용자 원장'], ['~', '클라우드는 IdP의 서명을 신뢰'], ['~', '계정 20개 → 5개']],
      more: [
        { title: '동작 원리', body: [
          '연합은 <b>서명</b>으로 성립합니다. 설정할 때 클라우드에 IdP의 공개 인증서(또는 메타데이터 URL)를 등록해 두면, 로그인할 때 IdP가 개인 키로 서명한 증명을 클라우드가 그 인증서로 검증합니다. 비밀번호는 IdP 밖으로 나가지 않아요.',
          '클라우드가 내주는 세션은 짧게 삽니다(예: AWS IAM Identity Center의 권한 세트는 1시간부터 최대 12시간까지 설정). 끝나면 다시 IdP를 거치니, IdP에서 계정을 끄면 다음 로그인부터 막힙니다.',
        ] },
        { title: 'SCIM이 하는 일', body: [
          '연합은 "로그인할 때" 신원을 확인하지만, 클라우드에 미리 사용자와 그룹이 있어야 권한을 매길 수 있는 서비스가 있습니다. <b>SCIM</b>은 IdP가 사용자 · 그룹의 생성 · 변경 · 삭제를 클라우드에 자동으로 밀어 주는 표준 API입니다. 퇴사자를 IdP에서 지우면 클라우드 쪽 사용자도 곧 사라집니다.',
        ] },
        { title: '흔한 실수', list: [
          'SSO를 켜 놓고 예전 IAM 사용자와 키를 <b>지우지 않음</b>. 연합 옆에 뒷문이 남습니다.',
          '인증서 만료일을 놓쳐 어느 날 아침 모두가 로그인 실패',
          'MFA를 클라우드 쪽에만 걸고 IdP에는 안 검',
        ] },
      ],
    },
    {
      key: 'SAML·OIDC', kind: 'concept', title: '증명의 두 형식: SAML과 OIDC',
      body: [
        '증명의 형식은 둘입니다. <b>SAML 2.0</b>은 서명된 XML 어설션으로, 콘솔 SSO에 오래 쓰여 온 기업 표준입니다. <b>OIDC</b>는 OAuth 2.0 위의 서명된 JSON 토큰(JWT)으로, 앱과 CLI, 그리고 워크로드에 흔합니다.',
        '둘 다 "누구인지"와 "어느 그룹인지"를 <b>클레임</b>으로 담습니다. 토큰을 디코딩하면 발급자(<code>iss</code>), 주체(<code>sub</code>), 받는 쪽(<code>aud</code>), 만료(<code>exp</code>), 그룹이 보입니다.',
      ],
      callout: { type: 'tip', text: '연합 문제를 디버깅할 때는 <b>토큰 안의 클레임</b>부터 보세요. 그룹이 빠졌거나 aud가 다르면 클라우드는 거절합니다.' },
      hide: ['staff', 'azure', 'gcp', 'ncp'],
      set: { aws: { sub: '클레임 확인' } },
      code: { ref: 'claims', hl: [1, 2, 3, 6] },
      flows: [{ path: ['idp', 'aws'], kind: 'ctrl', n: 2 }],
      more: [
        { title: '두 형식 비교', rows: [
          ['SAML 2.0', 'XML · 브라우저 리다이렉트 · 콘솔 SSO', 'info'],
          ['OIDC', 'JSON(JWT) · 앱 · CLI · 워크로드', 'accent'],
          ['공통', 'IdP 서명 · 클레임 · 짧은 유효기간', 'ok'],
        ] },
        { title: '로그인 한 번의 흐름', list: [
          '사용자가 클라우드 콘솔에 접속하면 IdP로 보내집니다(리다이렉트).',
          'IdP에서 비밀번호와 MFA로 인증합니다.',
          'IdP가 서명한 어설션 · 토큰을 들고 클라우드로 돌아갑니다.',
          '클라우드는 서명 · 받는 쪽 · 만료를 검증하고, 그룹 클레임으로 역할을 골라 세션을 만듭니다.',
        ] },
        { title: '흔한 실패와 원인', list: [
          '"Invalid audience": 클라우드에 등록한 앱 ID와 토큰의 <code>aud</code>가 다름',
          '"Expired": 서버 시각이 틀어져 있거나 토큰이 이미 만료됨',
          '로그인은 되는데 권한이 없음: 그룹 클레임이 토큰에 <b>안 실림</b>(IdP 쪽 클레임 설정) 또는 그룹 이름이 매핑과 다름',
          '그룹이 아주 많은 사용자는 토큰에 그룹이 다 담기지 않을 수 있어, IdP마다 대체 방식이 있습니다',
        ] },
      ],
    },
    {
      key: '그룹 → 역할', kind: 'compare', title: '그룹을 역할에, 네 클라우드에서',
      body: [
        '클라우드는 그룹을 역할에 매핑합니다. <code>shop-dev</code> 그룹이면 AWS에서는 개발 계정의 개발자 권한, GCP에서는 분석 프로젝트의 읽기 권한을 받는 식이에요. 4장의 최소 권한을 사람 대신 <b>그룹 단위</b>로 적는 겁니다.',
        '받는 곳의 이름은 클라우드마다 다릅니다. Azure는 Entra ID가 곧 자기 원장이라 따로 연합할 필요가 없고, 나머지는 각자의 연합 기능에 Entra ID를 IdP로 등록합니다.',
      ],
      callout: { type: 'cloud', text: 'NCP는 지원하는 외부 IdP 연동 방식과 범위를 문서로 확인해 맞추세요. 연동이 어렵다면 Sub Account를 최소로 두고 <b>주기적으로 IdP와 대조</b>합니다.' },
      show: ['azure', 'gcp', 'ncp'],
      set: { aws: { sub: '역할 매핑' }, azure: { sub: 'Azure RBAC' }, gcp: { sub: '역할 매핑' }, ncp: { sub: '연동 확인' } },
      tags: [{ on: 'idp', text: 'groups: shop-dev', icon: 'users', pos: 'left', dx: 30 }],
      panel: {
        title: '클라우드가 받는 곳', icon: 'id-card',
        rows: [['AWS', 'IAM Identity Center', 'aws'], ['Azure', 'Entra ID (같은 원장)', 'azure'], ['GCP', 'Workforce Identity 연합', 'gcp'], ['NCP', 'Sub Account · 연동 방식 확인', 'ncp']],
      },
      flows: [{ path: ['idp', 'aws'], kind: 'ctrl' }, { path: ['idp', 'gcp'], kind: 'ctrl', delay: 0.5 }, { path: ['idp', 'ncp'], kind: 'ctrl', delay: 1 }],
      metrics: { keys: ['앱에만 남음', 'warn'] },
      changes: [['~', '권한은 사람이 아니라 그룹에'], ['-', '사람의 장기 키 (CLI도 SSO로)'], ['+', '그룹 → 역할 매핑표']],
      more: [
        { title: '매핑표 예시', rows: [
          ['shop-dev', 'AWS dev 계정 개발자 · GCP 분석 읽기', 'info'],
          ['shop-ops', 'AWS prod 운영 · AKS 읽기', 'warn'],
          ['gov-ops', 'NCP 공공 존 운영 (별도 승인)', 'ncp'],
          ['auditors', '네 클라우드 읽기 전용', 'mute'],
        ] },
        { title: 'CLI도 SSO로', code: { title: 'terminal', lang: 'sh', text: `$ aws configure sso       # 처음 한 번
$ aws sso login --profile shop-dev
$ aws sts get-caller-identity --profile shop-dev
"Arn": "arn:aws:sts::111122223333:assumed-role/
        AWSReservedSSO_Developer_ab12/kim@shop.example"
$ gcloud auth login      # Workforce 연합이면 IdP로 이동
$ az login` } },
        { title: '실무 팁', body: [
          '권한 변경은 클라우드 콘솔이 아니라 <b>그룹 소속 변경</b>으로 합니다. 그러면 "누가 어디에 접근하나"의 답이 IdP의 그룹 목록 하나로 모입니다. 매핑 자체(그룹 → 역할)는 Terraform으로 코드화해 리뷰를 거치게 하세요.',
        ] },
      ],
    },
    {
      key: '비상 계정', kind: 'concept', title: 'IdP가 멈추면: 비상 계정',
      body: [
        '연합의 약점은 <b>IdP 의존</b>입니다. IdP가 장애로 멈추거나 연합 인증서가 만료되면 아무도 클라우드에 들어가지 못합니다. 하필 그때 복구 작업이 필요할 수 있어요.',
        '그래서 클라우드마다 SSO를 거치지 않는 <b>비상 계정(break-glass)</b>을 하나씩 둡니다. 강한 MFA를 걸고, 자격 증명은 금고에 봉인하며, 이 계정이 로그인하면 <b>즉시 경보</b>가 울리게 합니다.',
      ],
      callout: { type: 'warn', text: '비상 계정은 평소에 쓰지 않지만, <b>분기마다 꺼내 로그인해 보는 훈련</b>을 하세요. 막상 필요할 때 MFA 장치를 찾지 못하는 일이 흔합니다.' },
      show: ['staff', 'vault', 'e_sv', 'e_va'],
      set: { idp: { state: 'down', badge: 'IdP 장애', tone: 'bad' } },
      focus: ['vault'],
      tags: [{ on: 'vault', text: '사용 즉시 경보', tone: 'warn', icon: 'bell', pos: 'right' }],
      flows: [{ path: ['staff', 'idp'], kind: 'bad', n: 2 }, { path: ['staff', 'vault', 'aws'], kind: 'ctrl', delay: 1.2 }],
      metrics: { accts: ['5개 + 비상 4개', 'ok'] },
      changes: [['+', '클라우드마다 비상 계정 1개'], ['+', '금고 보관 · 강한 MFA'], ['+', '로그인 즉시 경보']],
      more: [
        { title: '비상 계정 체크리스트', list: [
          '클라우드마다 1–2개, 사람 이름이 아닌 <b>역할 이름</b>으로',
          '하드웨어 보안 키 같은 강한 MFA, 비밀번호와 MFA 장치는 <b>다른 사람이 나눠</b> 보관',
          '로그인 · API 호출이 일어나면 보안 채널로 즉시 알림',
          '사용 후에는 비밀번호를 바꾸고 무엇을 했는지 기록',
        ] },
        { title: '경보 예시 (AWS)', body: ['CloudTrail의 콘솔 로그인 이벤트를 EventBridge 규칙으로 잡아 알림을 보냅니다.'], code: { title: 'eventbridge-rule.json', lang: 'json', text: `{
  "source": ["aws.signin"],
  "detail-type": ["AWS Console Sign In via CloudTrail"],
  "detail": {
    "userIdentity": {
      "userName": ["breakglass-admin"]
    }
  }
}` } },
        { title: '흔한 실수', body: [
          '비상 계정을 "편해서" 평소 작업에 쓰기 시작하는 경우입니다. 경보가 매일 울리면 아무도 보지 않게 되고, 진짜 침입도 묻힙니다. 비상 계정의 사용은 <b>사건</b>으로 다루세요.',
        ] },
      ],
    },
    {
      key: '키 유출', kind: 'case', title: '사례: Git에 올라간 액세스 키',
      body: [
        '사람은 정리됐지만 <b>워크로드</b>가 남았습니다. GKE의 분석 배치가 AWS S3의 주문 로그를 읽어야 했고, 가장 빠른 방법은 IAM 사용자의 액세스 키를 만들어 Kubernetes Secret에 넣는 것이었어요.',
        '몇 달 뒤 누군가 디버깅하며 키가 든 파일을 Git에 커밋했고, 저장소가 노출되자 자동 스캐너가 키를 주워 S3를 내려받았습니다. 장기 키는 <b>만료가 없고</b>, 누가 쓰는지 가려낼 수도 없습니다.',
      ],
      callout: { type: 'key', text: '근본 원인은 사람의 실수가 아니라 <b>오래 살고 어디서나 통하는 비밀</b>이 존재했다는 것입니다. 없앨 수 있다면 없애는 것이 답입니다.' },
      hide: ['staff', 'idp', 'aws', 'azure', 'gcp', 'ncp', 'vault', 'e_sv', 'e_va'],
      show: ['zG', 'zA', 'pod', 's3', 'git', 'att'],
      set: { idp: { state: null, badge: null }, pod: { badge: '키 내장', tone: 'warn' }, s3: { state: 'hot' } },
      flows: [
        { path: ['pod', 's3'], kind: 'req', n: 2 },
        { path: ['pod', 'git'], kind: 'bad', delay: 1 }, { path: ['git', 'att'], kind: 'bad', delay: 1.8 },
        { path: ['att', 's3'], kind: 'req', delay: 2.6 }, { path: ['s3', 'att'], kind: 'bad', n: 3, delay: 3.4 },
      ],
      metrics: { keys: ['유출 1건', 'bad'] },
      changes: [['-', 'Secret 속 장기 키가 Git으로'], ['-', '외부에서 S3 데이터 반출'], ['~', '만료 없음 · 사용자 구분 불가']],
      more: [
        { title: '증상 → 원인 → 대응', rows: [
          ['증상', '낯선 IP의 대량 GetObject · 청구서 급증', 'bad'],
          ['원인', 'Secret의 장기 키가 Git에 커밋됨', 'warn'],
          ['즉시', '키 비활성화 → 삭제 · 접근 로그 조사', 'info'],
          ['재발 방지', '장기 키 제거 · 토큰 교환으로 전환', 'ok'],
        ] },
        { title: '사고 직후 할 일', code: { title: 'terminal', lang: 'sh', text: `# 1) 키부터 끈다 (삭제보다 먼저: 조사용으로 남김)
$ aws iam update-access-key --user-name gke-batch \\
    --access-key-id AKIAEXAMPLE123 --status Inactive
# 2) 그 키로 무엇을 했는지 본다
$ aws cloudtrail lookup-events --lookup-attributes \\
    AttributeKey=AccessKeyId,AttributeValue=AKIAEXAMPLE123` } },
        { title: '흔한 착각', list: [
          '"커밋을 지우면 된다": 이미 복제 · 캐시된 저장소와 스캐너에는 남아 있습니다. 키는 <b>무효화</b>해야 합니다.',
          '"90일마다 교체하면 안전하다": 교체 주기 안에서는 여전히 통합니다. 위험을 줄일 뿐 없애지 못합니다.',
          'S3의 데이터 이벤트 로깅이 꺼져 있으면 무엇을 가져갔는지조차 알 수 없습니다.',
        ] },
      ],
    },
    {
      key: '토큰 교환', kind: 'solution', title: '키 대신 신원을 교환합니다',
      body: [
        '<b>워크로드 아이덴티티 연합</b>은 사람의 SSO와 같은 생각입니다. Pod는 이미 자기 플랫폼이 준 신원이 있어요. GKE에서는 연결된 서비스 계정으로 <b>Google이 서명한 OIDC 토큰</b>을 받을 수 있습니다.',
        '이 토큰을 AWS <b>STS</b>에 내밀면(<code>AssumeRoleWithWebIdentity</code>), STS가 서명과 조건을 확인하고 기본 1시간짜리 <b>임시 자격 증명</b>을 줍니다. 저장해 둔 비밀이 없으니 샐 것도 없고, 토큰이 새도 곧 만료됩니다.',
      ],
      callout: { type: 'cloud', text: 'Azure는 워크로드 ID 페더레이션(페더레이션 자격 증명), GCP는 Workload Identity Federation(풀 · 공급자)으로 같은 일을 합니다. 9장의 GitHub Actions OIDC 배포도 같은 원리예요.' },
      hide: ['git', 'att'],
      show: ['sts'],
      set: { pod: { badge: null }, s3: { state: null } },
      tags: [{ on: 'pod', text: 'OIDC 토큰', tone: 'gcp', icon: 'id-card' }, { on: 'sts', text: '임시 키 · 1시간', tone: 'aws', icon: 'timer' }],
      flows: [
        { path: ['pod', 'sts'], kind: 'ctrl' }, { path: ['sts', 'pod'], kind: 'ctrl', delay: 1.2 },
        { path: ['pod', 's3'], kind: 'req', delay: 2.4 }, { path: ['s3', 'pod'], kind: 'data', n: 2, delay: 3.4 },
      ],
      metrics: { keys: ['0개', 'ok'] },
      changes: [['-', 'Secret 속 장기 키'], ['+', 'OIDC 토큰 → STS → 임시 자격'], ['~', '자격 수명: 무기한 → 1시간']],
      more: [
        { title: '직접 해보기', body: ['Pod 안에서 Google 토큰을 받아 STS와 바꾸는 과정을 손으로 따라가면 이렇습니다. 실제로는 AWS SDK가 토큰 파일 경로와 역할 ARN을 환경 변수로 받아 자동으로 합니다.'], code: { title: 'pod 안에서', lang: 'sh', text: `$ TOKEN=$(curl -s -H 'Metadata-Flavor: Google' \\
  "http://metadata.google.internal/computeMetadata/\\
v1/instance/service-accounts/default/identity\\
?audience=sts.amazonaws.com")
$ aws sts assume-role-with-web-identity \\
    --role-arn arn:aws:iam::111122223333:role/gke-reader \\
    --role-session-name batch-1 \\
    --web-identity-token "$TOKEN"
"Expiration": "2026-11-18T10:12:00Z"` } },
        { title: '방향마다 쓰는 기능', rows: [
          ['GCP → AWS', 'Google 토큰 → STS 웹 ID 역할', 'aws'],
          ['AWS → GCP', 'AWS 자격 → GCP Workload Identity 풀', 'gcp'],
          ['어디서든 → Azure', '페더레이션 자격 증명 (발급자 · 주체)', 'azure'],
          ['CI → 클라우드', 'CI의 OIDC 토큰 → 각 클라우드 역할', 'ok'],
        ] },
      ],
    },
    {
      key: '신뢰 정책', kind: 'concept', title: '무엇을 믿을지 좁게 적습니다',
      body: [
        '연합의 핵심은 "누구의 토큰이면 받아 줄까"입니다. AWS에서는 역할의 <b>신뢰 정책</b>에 적어요. <code>Principal</code>은 토큰을 발급한 곳, <code>Condition</code>은 토큰 안의 값입니다.',
        '여기서는 Google이 발급한 토큰 가운데 <code>sub</code>가 <b>우리 서비스 계정의 고유 ID</b>인 것만 받습니다. 그리고 역할의 권한 정책은 버킷 하나의 읽기만 허용합니다.',
      ],
      callout: { type: 'warn', text: '흔한 실수는 Condition을 비우는 것입니다. 발급자만 믿으면 <b>그 발급자가 토큰을 주는 모든 주체</b>를 믿는 셈이에요. Google 계정이라면 사실상 아무나입니다.' },
      hide: ['zG', 'pod'],
      focus: ['sts'],
      code: { ref: 'trust', hl: [3, 4, 5, 8, 9, 10, 11] },
      tags: [{ on: 's3', text: '읽기만 허용', tone: 'ok', icon: 'eye', pos: 'right' }],
      more: [
        { title: '두 정책의 역할', rows: [
          ['신뢰 정책', '누가 이 역할을 맡을 수 있나', 'info'],
          ['권한 정책', '맡은 뒤 무엇을 할 수 있나', 'accent'],
        ] },
        { title: '권한 정책 예시', code: { title: 'permissions.json', lang: 'json', text: `{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:ListBucket"],
  "Resource": [
    "arn:aws:s3:::shop-order-logs",
    "arn:aws:s3:::shop-order-logs/*"
  ]
}` } },
        { title: '조건을 좁히는 법', list: [
          'Google 토큰이면 <code>sub</code>(서비스 계정의 숫자 ID)로 주체를 고정합니다. 이메일보다 고유 ID가 안전합니다(같은 이름으로 다시 만들어도 ID는 다름).',
          'GitHub Actions 같은 CI 토큰이면 저장소 · 브랜치 · 환경이 들어 있는 <code>sub</code>를 조건으로 겁니다.',
          '<code>aud</code>도 함께 확인하면 다른 용도로 발급된 토큰을 재사용하는 것을 막습니다.',
        ] },
      ],
    },
    {
      key: '데이터 중력', kind: 'problem', title: '50TB는 쉽게 움직이지 않습니다',
      body: [
        '분석팀이 AWS에 쌓인 주문 데이터 50TB를 <b>매일 통째로</b> GCP BigQuery에 복사하자고 합니다. 클라우드는 나가는 데이터에 GB당 요금을 매기니 청구서가 매일 쌓이고, 1Gbps로 꽉 채워 보내도 50TB는 <b>4일 넘게</b> 걸려 하루 안에 끝나지도 않습니다.',
        '이것이 <b>데이터 중력</b>입니다. 데이터가 커질수록 앱과 분석과 도구가 그 곁으로 끌려가고, 데이터를 옮기는 일은 점점 비싸고 느려집니다.',
      ],
      callout: { type: 'key', text: '컴퓨트는 가볍고 데이터는 무겁습니다. 멀티클라우드에서 <b>데이터를 어디에 두는지</b>가 사실상 아키텍처를 정합니다.' },
      hide: ['zA', 'sts', 's3'],
      show: ['dA', 'dG', 'lake', 'bq'],
      tags: [{ on: 'lake', text: '매일 전량 복사', tone: 'bad', icon: 'copy' }],
      flows: [{ path: ['lake', 'bq'], kind: 'data', n: 6, gap: 0.25 }],
      metrics: { xfer: ['매일 50TB', 'bad'] },
      more: [
        { title: '계산해 보기', code: { title: '전송 시간 어림셈', lang: 'text', text: `50 TB × 8 = 400 Tb = 400,000 Gb
1 Gbps로 꽉 채워도   400,000초 ≈ 4.6일
10 Gbps라도          40,000초 ≈ 11시간
(실제로는 프로토콜 오버헤드 · 재시도로 더 걸림)` } },
        { title: '왜 "중력"인가', body: [
          '데이터 곁에서 도는 것이 가장 싸고 빠르기 때문에, 분석 도구 · 머신러닝 · 리포트가 하나씩 데이터 쪽 클라우드로 모입니다. 그러면 데이터는 더 커지고, 옮기기는 더 어려워져요. 그래서 큰 데이터의 위치는 초기에 <b>의식적으로</b> 정해야 합니다.',
        ] },
        { title: '한 번만 옮겨야 한다면', list: [
          '네트워크로는 너무 오래 걸리는 초기 이전에는 사업자들이 <b>물리 장비로 옮기는 서비스</b>를 제공합니다(AWS Snowball, Azure Data Box, Google Transfer Appliance 등).',
          '초기 전량은 한 번만 옮기고, 이후로는 <b>변경분만</b> 따라 보냅니다.',
          '앞에서 본 것처럼, 클라우드를 완전히 떠날 때의 전송비 면제 절차가 있는지도 확인하세요.',
        ] },
      ],
    },
    {
      key: '계산을 곁으로', kind: 'solution', title: '데이터 대신 계산을 옮깁니다',
      body: [
        '원칙은 <b>데이터는 한 곳(원천)에 두고, 계산을 데이터 가까이</b>입니다. AWS 안에서 집계와 필터를 먼저 하고 결과만 보내거나, 바뀐 행만 흘려보냅니다(<b>CDC</b>, 변경 데이터 캡처). BigQuery Omni처럼 분석 엔진이 데이터 쪽 클라우드에서 도는 서비스도 있어요.',
        '이식성은 API로 챙깁니다. NCP Object Storage, MinIO처럼 <b>S3 호환 API</b>를 제공하는 저장소가 많아서 코드는 쉽게 옮겨집니다. 다만 데이터 자체를 옮기는 비용은 그대로입니다.',
      ],
      callout: { type: 'tip', text: '"이 데이터의 원본은 어디인가"를 데이터마다 한 곳으로 정해 두세요. 원본이 둘이면 어느 쪽이 맞는지 다투게 됩니다.' },
      show: ['etl'],
      hide: ['e_lb'],
      focus: ['etl'],
      flows: [{ path: ['lake', 'etl'], kind: 'data', n: 4, gap: 0.3 }, { path: ['etl', 'bq'], kind: 'data', delay: 1.6 }],
      metrics: { xfer: ['매일 200GB', 'ok'] },
      changes: [['+', 'AWS 안의 집계 작업'], ['~', '원본 전량 → 결과 · 변경분만'], ['~', '전송량 매일 50TB → 200GB']],
      more: [
        { title: '세 가지 방법', rows: [
          ['집계 후 전송', '원천에서 줄이고 결과만', 'ok'],
          ['CDC', '바뀐 행만 이벤트로 흘려보냄', 'info'],
          ['엔진을 데이터 쪽에', '분석 엔진이 원천 클라우드에서 실행', 'accent'],
        ] },
        { title: '설정 예시: 원천에서 줄이기', body: ['원천 쪽에서 하루치 집계만 만들어 내보내는 모양입니다. 데이터가 크면 이 한 단계가 전송량을 수백 배 줄입니다.'], code: { title: 'daily_agg.sql (AWS 쪽에서 실행)', lang: 'text', text: `SELECT order_date, region, product_id,
       COUNT(*)        AS orders,
       SUM(amount)     AS revenue
FROM   orders
WHERE  order_date = CURRENT_DATE - 1
GROUP  BY order_date, region, product_id;
-- 결과(수백 MB)만 GCP로 내보냄` } },
        { title: '흔한 실수', body: [
          '"일단 다 복사해 두면 나중에 쓸 데가 있겠지"입니다. 복사본은 전송비뿐 아니라 <b>저장 비용, 접근 통제, 삭제 의무</b>까지 두 배로 만듭니다. 개인정보라면 삭제 요청이 왔을 때 모든 사본에서 지워야 해요. 필요한 열과 기간만 내보내세요.',
        ] },
      ],
    },
    {
      key: '레지던시', kind: 'concept', title: '데이터 레지던시: 사본까지 국내에',
      body: [
        '<b>데이터 레지던시</b>는 데이터가 물리적으로 놓이는 위치를 정하는 일입니다. 공공 고객 데이터는 NCP 공공 존(국내)에 둔다고 했죠. 그런데 원본만이 아니라 <b>백업, 로그, 분석 사본</b>도 데이터입니다.',
        '그래서 공공 존 안에서 백업과 감사 로그까지 머물게 하고, 바깥 분석으로는 원본을 보내지 않습니다. 비식별 · 집계한 결과만 허용된 경로로 나갑니다.',
      ],
      callout: { type: 'warn', text: '개인정보를 국외로 옮기거나 다른 사업자에게 맡기려면 법이 정한 요건과 고지가 필요할 수 있습니다. 설계 전에 <b>법무 · 보안 담당과 데이터 지도</b>를 함께 그리세요.' },
      hide: ['dA', 'lake', 'etl'],
      show: ['rK', 'pubdb', 'pbk', 'plog'],
      tags: [{ on: 'bq', text: '집계 결과만 허용', tone: 'ok', icon: 'funnel', pos: 'bottom' }],
      flows: [
        { path: ['pubdb', 'pbk'], kind: 'sync', n: 2 }, { path: ['pubdb', 'plog'], kind: 'data', delay: 0.4 },
        { path: ['pubdb', 'bq'], kind: 'bad', n: 2, delay: 1.2 },
      ],
      metrics: { xfer: ['집계만 · 원본 0', 'ok'] },
      changes: [['+', '백업 · 로그도 공공 존 안에'], ['-', '공공 원본의 바깥 반출'], ['~', '분석은 비식별 · 집계 결과로']],
      more: [
        { title: '데이터 지도에 적을 것', list: [
          '원본이 저장되는 <b>리전 · 존</b>',
          '<b>백업 · 스냅샷</b>이 복사되는 곳 (리전 간 복사 설정이 켜져 있지 않나)',
          '<b>로그 · 트레이스</b>에 개인정보가 섞여 나가는 곳',
          '분석 · 개발용 <b>사본</b>과 그 가공 수준(원본 · 가명 · 집계)',
          '운영자가 접근하는 <b>위치와 경로</b>',
        ] },
        { title: '흔한 누락', rows: [
          ['자동 백업의 리전 간 복사', '켜 두면 다른 리전 · 나라로', 'bad'],
          ['중앙 로그 수집', '요청 본문 · 이메일이 로그에', 'bad'],
          ['장애 분석용 덤프', '원본이 개발자 PC로', 'warn'],
          ['외부 SaaS 모니터링', '로그가 해외 리전으로', 'warn'],
        ] },
        { title: '시스템으로 막기', body: [
          '레지던시는 문서가 아니라 설정으로 지켜야 합니다. 허용된 리전 밖에 리소스를 못 만들게 하는 <b>조직 정책</b>(AWS SCP, Azure Policy, GCP 조직 정책의 리소스 위치 제한 등)을 걸고, 공공 존에서 나가는 경로는 네트워크 레슨처럼 경로 필터와 방화벽으로 좁힙니다.',
        ] },
      ],
    },
    {
      key: '복제', kind: 'concept', title: '두 곳에 둬야 한다면: 동기냐 비동기냐',
      body: [
        'DR처럼 데이터가 꼭 두 클라우드에 있어야 할 때도 있습니다. <b>동기 복제</b>는 쓰기마다 상대의 확인을 기다립니다. 잃는 데이터는 없지만(RPO 0) 모든 쓰기에 클라우드 간 왕복이 붙고, 상대가 멈추면 쓰기도 멈춥니다.',
        '<b>비동기 복제</b>는 먼저 커밋하고 뒤따라 보냅니다. 빠르지만 복제 지연만큼 최근 데이터를 잃을 수 있고, 복제본은 조금 <b>오래된 값</b>을 보여 줍니다. Spanner · CockroachDB 같은 <b>분산 SQL</b>도 합의를 위한 왕복이라는 같은 대가를 치릅니다.',
      ],
      callout: { type: 'key', text: '복제 방식은 RPO와 <b>쓰기 지연</b>을 맞바꾸는 선택입니다. 요구 RPO가 몇 초~몇 분이면 대개 비동기가 맞습니다.' },
      hide: ['dG', 'bq', 'rK', 'pubdb', 'pbk', 'plog'],
      show: ['dZ', 'app', 'db', 'rep'],
      panel: {
        title: '복제 방식', icon: 'repeat',
        rows: [['동기', 'RPO 0 · 쓰기마다 왕복 지연', 'info'], ['비동기', '빠름 · 지연만큼 손실 가능', 'warn'], ['분산 SQL', '합의 · 쓰기 지연이 대가', 'accent']],
      },
      flows: [
        { path: ['app', 'db'], kind: 'req', n: 3, gap: 0.4 },
        { path: ['db', [4.6, 2.4], 'rep'], kind: 'sync', n: 2, delay: 1.2 },
      ],
      metrics: { rpo: ['수 초 (비동기)', 'warn'] },
      more: [
        { title: '쓰기 지연 감 잡기', body: [
          '동기 복제에서 쓰기 한 번은 최소 <b>클라우드 간 왕복 한 번</b>만큼 느려집니다. 같은 도시의 두 클라우드라면 수 ms, 다른 나라라면 수십 ms예요. 주문 하나에 쓰기가 열 번이면 그만큼 곱해집니다. 그래서 동기 복제는 보통 가까운 거리에서만 씁니다.',
        ] },
        { title: '출력 읽기: 복제 지연', code: { title: 'psql (원본에서)', lang: 'sh', text: `=# SELECT client_addr, state, sync_state,
          replay_lag FROM pg_stat_replication;
 client_addr | state     | sync_state | replay_lag
-------------+-----------+------------+-----------
 10.20.3.21  | streaming | async      | 00:00:02.4` } },
        { title: '실무 팁', list: [
          '복제 지연을 <b>메트릭과 경보</b>로 둡니다. 지연이 곧 그 순간의 실제 RPO입니다.',
          '관리형 DB의 "다른 리전 읽기 복제본"은 대개 같은 사업자 안에서만 됩니다. 클라우드를 넘는 복제는 DB 엔진의 복제 기능이나 CDC 도구로 직접 구성해야 해요.',
          '복제 경로는 네트워크 레슨의 사설 경로와 그 전송비를 그대로 탑니다.',
        ] },
      ],
    },
    {
      key: '복제본 읽기', kind: 'case', title: '사례: 복제본에서 읽은 재고',
      body: [
        '읽기 부하를 덜려고 주문 API가 재고 조회를 <b>DR 복제본</b>에서 하게 바꿨습니다. 세일 날 같은 상품이 몇 초 사이에 여러 번 팔렸어요. 원본에서는 재고가 0이 됐는데, 복제본은 아직 <b>몇 초 전의 값</b>을 보여 주고 있었습니다.',
        '비동기 복제본은 늘 조금 늦습니다. 결제처럼 <b>방금 쓴 값을 바로 읽어야</b> 하는 흐름은 원본에서 읽고, 복제본은 늦어도 괜찮은 조회에만 씁니다.',
      ],
      callout: { type: 'warn', text: '복제본에서 재고를 읽고 결제하면 이미 팔린 상품을 또 팝니다. <b>쓰기와 그 직후의 읽기</b>는 원본에서 하세요.' },
      show: ['e_ar'],
      set: { rep: { state: 'hot' }, app: { badge: '이중 판매', tone: 'bad' } },
      tags: [{ on: 'rep', text: '몇 초 늦은 값', tone: 'warn', icon: 'clock' }],
      flows: [
        { path: ['app', 'db'], kind: 'req', n: 2 },
        { path: ['db', [4.6, 2.4], 'rep'], kind: 'sync', delay: 1.4 },
        { path: ['app', 'rep'], kind: 'bad', n: 2, delay: 0.6 },
      ],
      metrics: { rpo: ['지연 3초', 'bad'] },
      changes: [['-', '재고 조회를 복제본에서'], ['~', '복제 지연 동안 오래된 재고'], ['+', '해결: 결제 흐름은 원본에서 읽기']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '재고보다 많이 팔림 · 세일 때만', 'bad'],
          ['원인', '비동기 복제본에서 재고 확인', 'warn'],
          ['해결', '재고 확인 · 차감은 원본에서 한 트랜잭션으로', 'ok'],
          ['보완', '복제본은 목록 · 통계처럼 늦어도 되는 조회만', 'info'],
        ] },
        { title: '일관성 수준', list: [
          '<b>강한 일관성</b>: 쓰고 나면 누구든 바로 새 값을 읽음 (원본 · 동기 · 분산 SQL)',
          '<b>내가 쓴 것 읽기</b>(read-your-writes): 적어도 쓴 사람은 새 값을 봄. 쓴 직후 잠시 원본으로 읽게 하는 방식으로 구현',
          '<b>최종 일관성</b>: 언젠가는 같아짐. 비동기 복제본 · 캐시',
        ] },
        { title: '더 생각해 볼 것', body: [
          '재고 차감 자체는 원본에서 <code>UPDATE … SET stock = stock - 1 WHERE stock &gt; 0</code>처럼 조건부로 처리하면, 앞단에서 오래된 값을 봤더라도 원본이 마지막 문지기가 됩니다. 일관성이 중요한 판단은 <b>한 곳에서 원자적으로</b> 내리세요.',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 사람 · 워크로드 · 데이터',
      body: [
        '사람은 <b>IdP 하나로 연합</b>하고 권한은 그룹에, 대비책으로 비상 계정을 둡니다. 워크로드는 <b>토큰 교환</b>으로 장기 키 없이 다른 클라우드를 부릅니다. 데이터는 중력을 존중해 <b>원본을 한 곳에 두고 계산을 가까이</b>, 사본까지 위치를 지키며, 두 곳에 둬야 하면 RPO와 쓰기 지연을 맞바꿉니다.',
        '이제 조각이 모두 모였습니다. 마지막 레슨에서는 네트워크 · 클러스터 · Terraform · 파이프라인 · 관측 · ID · 데이터를 엮어 <code>shop.example</code>의 멀티클라우드 플랫폼을 처음부터 설계합니다.',
      ],
      hide: ['dZ', 'app', 'db', 'rep', 'e_ar'],
      show: ['staff', 'idp', 'aws', 'azure', 'gcp', 'ncp'],
      set: { aws: { sub: 'SSO 세션' }, azure: { sub: 'SSO 세션' }, gcp: { sub: 'SSO 세션' }, ncp: { sub: 'SSO 세션' }, rep: { state: null }, app: { badge: null } },
      focus: ['idp'],
      flows: [
        { path: ['staff', 'idp'], kind: 'ctrl' },
        { path: ['idp', 'aws'], kind: 'ctrl', delay: 1 }, { path: ['idp', 'azure'], kind: 'ctrl', delay: 1 },
        { path: ['idp', 'gcp'], kind: 'ctrl', delay: 1 }, { path: ['idp', 'ncp'], kind: 'ctrl', delay: 1 },
      ],
    },
  ],
  quiz: [
    {
      q: '엔지니어가 퇴사했습니다. 네 클라우드가 모두 Entra ID와 SSO로 연합되어 있다면, 가장 먼저 해야 할 일은?',
      options: [
        '네 클라우드 콘솔에 차례로 들어가 그 사람의 계정을 찾아 지운다',
        'Entra ID에서 그 사용자를 비활성화하고, 비상 계정과 앱 키 중 그 사람이 알던 것이 있는지 점검한다',
        '모든 클라우드의 루트 계정 비밀번호를 바꾼다',
        '세션이 언젠가 만료되니 따로 할 일은 없다',
      ],
      answer: 1, step: 2,
      why: '연합 구조에서는 클라우드에 따로 계정이 없으니 IdP에서 끄면 새 로그인이 모두 막힙니다. 다만 SSO 밖에 있는 비밀(비상 계정, 남아 있는 앱 키)은 IdP가 모르므로 따로 점검해야 합니다. 콘솔을 돌며 지우는 것은 연합 이전의 방식입니다.',
    },
    {
      q: 'SSO를 도입한 지 반년이 지났는데 보안 점검에서 활성 상태의 IAM 사용자 액세스 키가 여럿 발견됐습니다. 무엇이 잘못됐을까?',
      options: [
        'SSO는 원래 키를 자동으로 만든다',
        'SSO를 켠 뒤 예전 IAM 사용자와 키를 정리하지 않아 연합 옆에 뒷문이 남았다',
        'IdP의 인증서가 만료됐다',
        'SCIM이 키를 복제했다',
      ],
      answer: 1, step: 2,
      why: '연합은 새 로그인 길을 만들 뿐 예전 계정을 지우지 않습니다. 이전 IAM 사용자와 키를 찾아 비활성화 · 삭제해야 "계정은 IdP 한 곳"이라는 목표가 이루어집니다.',
    },
    {
      q: '사용자가 SSO로 AWS에 로그인은 되는데 아무 권한이 없다고 합니다. 매핑은 shop-dev 그룹 → 개발자 권한입니다. 먼저 확인할 것은?',
      options: [
        'IdP가 발급한 토큰 · 어설션에 그룹 클레임이 실려 있고 이름이 매핑과 같은지',
        'S3 버킷의 암호화 설정',
        '사용자의 노트북 OS 버전',
        'VPN 터널 상태',
      ],
      answer: 0, step: 3,
      why: '로그인이 된다는 것은 서명과 받는 쪽 검증은 통과했다는 뜻입니다. 권한이 없다면 역할을 고르는 근거인 그룹 클레임이 빠졌거나 이름이 다를 가능성이 큽니다.',
    },
    {
      q: '권한 변경 요청이 올 때마다 클라우드 콘솔에서 사람별로 정책을 붙이고 있습니다. 감사 때 "누가 어디에 접근하나"를 모으기 어렵습니다. 가장 좋은 개선은?',
      options: [
        '모든 사람에게 관리자 권한을 줘서 요청을 없앤다',
        '스프레드시트에 사람별 권한을 손으로 기록한다',
        '클라우드마다 담당자를 한 명씩 둔다',
        '권한은 IdP 그룹 → 클라우드 역할 매핑으로만 주고, 변경은 그룹 소속 변경으로 하며 매핑은 코드로 리뷰한다',
      ],
      answer: 3, step: 4,
      why: '그룹 단위로 권한을 주면 접근 현황이 IdP의 그룹 목록 하나로 모이고, 매핑을 코드화하면 변경 이력이 남습니다. 손으로 쓴 기록은 곧 실제와 어긋납니다.',
    },
    {
      q: '연합 인증서가 만료되어 아무도 AWS 콘솔에 들어가지 못합니다. 이때를 대비해 미리 갖춰 둬야 했던 것은?',
      options: [
        '모든 엔지니어의 IAM 사용자 계정',
        '금고에 봉인한 비상 계정과 강한 MFA, 사용 즉시 울리는 경보, 그리고 정기 로그인 훈련',
        '루트 계정 비밀번호를 팀 채팅방에 공유',
        'IdP를 하나 더 도입해 매일 번갈아 사용',
      ],
      answer: 1, step: 5,
      why: 'IdP 의존의 대비책은 소수의 통제된 비상 계정입니다. 모든 사람에게 IAM 사용자를 주면 연합 이전으로 돌아가고, 비밀번호 공유는 그 자체로 사고입니다.',
    },
    {
      q: 'Git에 커밋된 AWS 액세스 키가 발견됐습니다. 커밋은 이미 공개 저장소에 올라갔습니다. 가장 먼저 할 일은?',
      options: [
        '커밋을 되돌리고 강제 푸시해 기록에서 지운다',
        '키를 즉시 비활성화하고, 그 키로 무엇을 했는지 CloudTrail로 조사한다',
        '다음 정기 교체일까지 기다린다',
        '저장소 이름을 바꾼다',
      ],
      answer: 1, step: 6,
      why: '공개된 키는 이미 복제됐다고 봐야 하므로 기록을 지우는 것으로는 막을 수 없습니다. 먼저 키를 무효화하고, 그 키의 활동을 조사해 피해 범위를 확인합니다. 그다음 장기 키 자체를 없애는 구조로 바꿉니다.',
    },
    {
      q: 'GKE의 배치 작업이 AWS S3를 읽어야 합니다. 가장 안전한 구성은?',
      options: [
        'IAM 사용자의 액세스 키를 Kubernetes Secret에 넣고 90일마다 교체한다',
        '버킷을 공개 읽기로 열고 URL을 모르게 한다',
        'S3 데이터를 매일 GCS로 통째로 복사해 같은 클라우드 안에서 읽는다',
        'Google이 서명한 OIDC 토큰을 STS에서 임시 자격으로 바꾸고, 신뢰 정책에 그 서비스 계정만 조건으로 적는다',
      ],
      answer: 3, step: 7,
      why: '워크로드 아이덴티티 연합은 저장된 비밀 없이 짧게 사는 자격만 씁니다. 키 교체는 유출 위험을 줄일 뿐 없애지 못하고, 공개 버킷은 URL만 알면 누구나 읽습니다. 통째 복사는 전송 비용과 데이터 사본 관리 부담을 만듭니다.',
    },
    {
      q: '신뢰 정책에 Principal로 accounts.google.com만 적고 Condition을 비웠습니다. 무엇이 문제일까?',
      options: [
        'Google이 토큰을 발급하는 모든 주체가 이 역할을 맡을 수 있게 된다',
        'STS가 임시 자격을 1분만 준다',
        '토큰 교환이 아예 동작하지 않는다',
        '버킷이 자동으로 공개된다',
      ],
      answer: 0, step: 8,
      why: '발급자만 믿으면 그 발급자가 토큰을 주는 누구나 받아 줍니다. Google 계정이라면 사실상 아무나입니다. sub(서비스 계정의 고유 ID)와 aud로 주체와 용도를 좁혀야 합니다.',
    },
    {
      q: 'AWS에 있는 50TB 주문 데이터를 GCP에서 매일 분석하려 합니다. 첫 설계로 가장 타당한 것은?',
      options: [
        '매일 밤 50TB 전체를 GCP로 복사한다',
        '두 클라우드에 원본을 하나씩 두고 각자 쓰게 한다',
        '원본은 AWS에 두고, AWS 안에서 집계하거나 변경분만 GCP로 보낸다',
        '전용선만 깔면 전송 비용과 시간 문제가 사라진다',
      ],
      answer: 2, step: 10,
      why: '데이터 중력 때문에 계산을 데이터 쪽으로 옮기는 것이 싸고 빠릅니다. 전량 복사는 egress와 시간이 매일 반복되고, 원본이 둘이면 정합성이 깨집니다. 전용선은 단가와 지연을 낮출 뿐 나가는 데이터 요금과 대역폭 한계는 남습니다.',
    },
    {
      q: '처음 한 번, 200TB를 다른 클라우드로 옮겨야 합니다. 회선은 1Gbps입니다. 가장 현실적인 계획은?',
      options: [
        '1Gbps 회선으로 그냥 보낸다. 하루면 끝난다',
        '사업자의 물리 전송 장비로 초기 전량을 옮기고, 이후에는 변경분만 네트워크로 따라 보낸다',
        '데이터를 압축하지 않고 여러 번 나눠 보낸다',
        '이전을 포기한다',
      ],
      answer: 1, step: 9,
      why: '1Gbps로 꽉 채워도 200TB는 18일이 넘게 걸립니다. 초기 대량 이전은 물리 장비가 빠르고, 그동안 쌓인 변경분만 네트워크로 맞추면 됩니다.',
    },
    {
      q: '공공 고객 DB는 NCP 공공 존에 있습니다. 그런데 DB의 자동 백업이 다른 리전으로 복사되고, 앱 로그는 해외 리전의 SaaS로 보내지고 있었습니다. 무엇이 문제인가?',
      options: [
        '문제없다. 원본 DB만 국내에 있으면 된다',
        '백업은 데이터가 아니므로 괜찮지만 로그는 문제다',
        '로그는 괜찮지만 백업은 문제다',
        '백업과 로그도 데이터라서, 원본과 같은 위치 요건을 지켜야 할 수 있다',
      ],
      answer: 3, step: 11,
      why: '레지던시는 원본만이 아니라 백업 · 로그 · 사본까지 봅니다. 백업 사본은 원본과 같은 데이터이고, 로그에는 개인정보가 섞이기 쉽습니다. 데이터 지도로 모든 사본의 위치를 확인해야 합니다.',
    },
    {
      q: '주문 DB를 다른 클라우드의 DR 복제본으로 동기 복제하자는 제안이 나왔습니다. 가장 먼저 따져 봐야 할 것은?',
      options: [
        '복제본의 디스크 종류',
        '동기 복제는 데이터를 잃을 수 있다는 점',
        '모든 쓰기에 클라우드 간 왕복 지연이 붙고, 복제본 쪽이 멈추면 원본의 쓰기도 멈출 수 있다는 점',
        '비동기 복제는 RPO가 항상 0이라는 점',
      ],
      answer: 2, step: 12,
      why: '동기 복제는 RPO 0을 주는 대신 쓰기 지연과 가용성을 상대 쪽에 묶습니다. 데이터를 잃을 수 있는 것은 비동기 쪽이고, 그 손실 범위가 곧 RPO입니다. 요구 RPO가 몇 초~몇 분이면 비동기가 대개 더 맞습니다.',
    },
    {
      q: '세일 날 재고보다 많은 주문이 들어왔습니다. 재고 조회는 비동기 복제본에서 하고 있었습니다. 가장 알맞은 수정은?',
      options: [
        '재고 확인과 차감을 원본에서 한 트랜잭션으로 처리하고, 복제본은 늦어도 되는 조회에만 쓴다',
        '복제본을 하나 더 만든다',
        '세일을 하지 않는다',
        '복제본의 CPU를 늘린다',
      ],
      answer: 0, step: 13,
      why: '비동기 복제본은 복제 지연만큼 오래된 값을 보여 줍니다. 방금 바뀐 값에 의존하는 판단은 원본에서 원자적으로 내려야 합니다. 복제본을 늘리거나 키워도 지연의 본질은 바뀌지 않습니다.',
    },
  ],
};
