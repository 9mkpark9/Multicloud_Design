export default {
  id: 'multicloud-identity-data',
  learn: [
    '하나의 IdP로 모든 클라우드에 SSO 연합하기',
    'SAML · OIDC와 그룹 → 역할 매핑',
    '워크로드 아이덴티티 연합: 장기 키 없이 다른 클라우드 호출',
    '데이터 중력과 클라우드 간 전송 비용',
    '"데이터는 한 곳에, 계산은 가까이"',
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
    },
    nodes: {
      // people
      staff: { kind: 'users', at: [-2.4, 0.6], label: '엔지니어 5명' },
      idp: { at: [2.5, 2.5], label: 'Entra ID', sub: '사내 IdP', icon: 'id-card', color: 'azure' },
      aws: { at: [0, 0], label: 'AWS', sub: 'IAM 사용자', icon: 'cloud', color: 'aws' },
      azure: { at: [5, 0], label: 'Azure', sub: 'Entra 계정', icon: 'cloud', color: 'azure' },
      gcp: { at: [0, 5], label: 'GCP', sub: 'Google 계정', icon: 'cloud', color: 'gcp' },
      ncp: { at: [5, 5], label: 'NCP', sub: 'Sub Account', icon: 'cloud', color: 'ncp' },
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
      e_ps: { from: 'pod', to: 's3' },
      e_leak: { from: 'pod', to: 'git', style: 'dashed', tone: 'bad' },
      e_grab: { from: 'git', to: 'att', tone: 'bad' },
      e_att: { from: 'att', to: 's3', tone: 'bad' },
      e_tok: { from: 'pod', to: 'sts', bi: true, label: '토큰 교환' },
      e_ss: { from: 'sts', to: 's3', style: 'dashed', tone: 'mute', arrow: false },
      e_lb: { from: 'lake', to: 'bq', tone: 'bad', label: 'egress' },
      e_le: { from: 'lake', to: 'etl' },
      e_eb: { from: 'etl', to: 'bq', tone: 'ok', label: '결과만' },
      e_ad: { from: 'app', to: 'db' },
      e_rep: { from: 'db', to: 'rep', via: [[4.6, 2.4]], style: 'dashed', label: '복제' },
    },
  },
  codes: {
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
    },
    {
      key: 'SAML·OIDC', kind: 'compare', title: '증명 안에는 그룹이 들어 있습니다',
      body: [
        '증명의 형식은 둘입니다. <b>SAML 2.0</b>은 XML 어설션으로, 콘솔 SSO에 오래 쓰여 온 기업 표준입니다. <b>OIDC</b>는 OAuth 2.0 위의 JSON 토큰(JWT)으로, 앱과 CLI에 흔합니다. 둘 다 "누구인지"와 "어느 그룹인지"를 <b>클레임</b>으로 담습니다.',
        '클라우드는 그룹을 역할에 매핑합니다. <code>shop-dev</code> 그룹이면 AWS에서는 개발자 권한, GCP에서는 읽기 권한을 받는 식이에요. 4장의 최소 권한을 사람 대신 <b>그룹 단위</b>로 적는 겁니다.',
      ],
      callout: { type: 'warn', text: 'IdP가 멈추면 아무도 못 들어갑니다. 클라우드마다 SSO를 거치지 않는 <b>비상 계정(break-glass)</b>을 하나씩 금고에 두고, 쓰면 즉시 경보가 울리게 하세요.' },
      hide: ['staff'],
      set: { aws: { sub: '역할 매핑' }, azure: { sub: 'Azure RBAC' }, gcp: { sub: '역할 매핑' }, ncp: { sub: '연동 확인' } },
      tags: [{ on: 'idp', text: 'groups: shop-dev', icon: 'users', pos: 'left', dx: 30 }],
      panel: {
        title: '클라우드가 받는 곳', icon: 'id-card',
        rows: [['AWS', 'IAM Identity Center', 'aws'], ['Azure', 'Entra ID (같은 원장)', 'azure'], ['GCP', 'Workforce Identity 연합', 'gcp'], ['NCP', 'Sub Account · 연동 방식 확인', 'ncp']],
      },
      flows: [{ path: ['idp', 'aws'], kind: 'ctrl' }, { path: ['idp', 'gcp'], kind: 'ctrl', delay: 0.5 }],
      metrics: { keys: ['앱에만 남음', 'warn'] },
      changes: [['~', '권한은 사람이 아니라 그룹에'], ['-', '사람의 장기 키 (CLI도 SSO로)'], ['+', '클라우드마다 비상 계정 1개']],
    },
    {
      key: '키 유출', kind: 'case', title: '사례: Git에 올라간 액세스 키',
      body: [
        '사람은 정리됐지만 <b>워크로드</b>가 남았습니다. GKE의 분석 배치가 AWS S3의 주문 로그를 읽어야 했고, 가장 빠른 방법은 IAM 사용자의 액세스 키를 만들어 Kubernetes Secret에 넣는 것이었어요.',
        '몇 달 뒤 누군가 디버깅하며 키가 든 파일을 Git에 커밋했고, 저장소가 노출되자 자동 스캐너가 키를 주워 S3를 내려받았습니다. 장기 키는 <b>만료가 없고</b>, 누가 쓰는지 가려낼 수도 없습니다.',
      ],
      callout: { type: 'key', text: '근본 원인은 사람의 실수가 아니라 <b>오래 살고 어디서나 통하는 비밀</b>이 존재했다는 것입니다. 없앨 수 있다면 없애는 것이 답입니다.' },
      hide: ['staff', 'idp', 'aws', 'azure', 'gcp', 'ncp'],
      show: ['zG', 'zA', 'pod', 's3', 'git', 'att'],
      set: { pod: { badge: '키 내장', tone: 'warn' }, s3: { state: 'hot' } },
      flows: [
        { path: ['pod', 's3'], kind: 'req', n: 2 },
        { path: ['pod', 'git'], kind: 'bad', delay: 1 }, { path: ['git', 'att'], kind: 'bad', delay: 1.8 },
        { path: ['att', 's3'], kind: 'req', delay: 2.6 }, { path: ['s3', 'att'], kind: 'bad', n: 3, delay: 3.4 },
      ],
      metrics: { keys: ['유출 1건', 'bad'] },
      changes: [['-', 'Secret 속 장기 키가 Git으로'], ['-', '외부에서 S3 데이터 반출'], ['~', '만료 없음 · 사용자 구분 불가']],
    },
    {
      key: '토큰 교환', kind: 'solution', title: '키 대신 신원을 교환합니다',
      body: [
        '<b>워크로드 아이덴티티 연합</b>은 사람의 SSO와 같은 생각입니다. Pod는 이미 자기 플랫폼이 준 신원이 있어요. GKE에서는 연결된 서비스 계정으로 <b>Google이 서명한 OIDC 토큰</b>을 받을 수 있습니다.',
        '이 토큰을 AWS <b>STS</b>에 내밀면(<code>AssumeRoleWithWebIdentity</code>), STS가 서명과 조건을 확인하고 보통 1시간짜리 <b>임시 자격 증명</b>을 줍니다. 저장해 둔 비밀이 없으니 샐 것도 없고, 토큰이 새도 곧 만료됩니다.',
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
    },
    {
      key: '복제', kind: 'concept', title: '두 곳에 둬야 한다면: 동기냐 비동기냐',
      body: [
        'DR처럼 데이터가 꼭 두 클라우드에 있어야 할 때도 있습니다. <b>동기 복제</b>는 쓰기마다 상대의 확인을 기다립니다. 잃는 데이터는 없지만(RPO 0) 모든 쓰기에 클라우드 간 왕복이 붙고, 상대가 멈추면 쓰기도 멈춥니다.',
        '<b>비동기 복제</b>는 먼저 커밋하고 뒤따라 보냅니다. 빠르지만 복제 지연만큼 최근 데이터를 잃을 수 있고, 복제본은 조금 <b>오래된 값</b>을 보여 줍니다. Spanner · CockroachDB 같은 <b>분산 SQL</b>도 합의를 위한 왕복이라는 같은 대가를 치릅니다.',
      ],
      callout: { type: 'warn', text: '복제본에서 재고를 읽고 결제하면 이미 팔린 상품을 또 팝니다. <b>쓰기와 그 직후의 읽기</b>는 원본에서 하세요.' },
      hide: ['dG', 'lake', 'bq', 'etl'],
      show: ['dZ', 'app', 'db', 'rep'],
      tags: [{ on: 'rep', text: '몇 초 늦은 값', tone: 'warn', icon: 'clock' }],
      panel: {
        title: '복제 방식', icon: 'repeat',
        rows: [['동기', 'RPO 0 · 쓰기마다 왕복 지연', 'info'], ['비동기', '빠름 · 지연만큼 손실 가능', 'warn'], ['분산 SQL', '합의 · 쓰기 지연이 대가', 'accent']],
      },
      flows: [
        { path: ['app', 'db'], kind: 'req', n: 3, gap: 0.4 },
        { path: ['db', [4.6, 2.4], 'rep'], kind: 'sync', n: 2, delay: 1.2 },
      ],
      metrics: { rpo: ['수 초 (비동기)', 'warn'] },
    },
    {
      key: '정리', kind: 'recap', title: '정리: 사람 · 워크로드 · 데이터',
      body: [
        '사람은 <b>IdP 하나로 연합</b>하고 권한은 그룹에 줍니다. 워크로드는 <b>토큰 교환</b>으로 장기 키 없이 다른 클라우드를 부릅니다. 데이터는 중력을 존중해 <b>원본을 한 곳에 두고 계산을 가까이</b>, 두 곳에 둬야 하면 RPO와 쓰기 지연을 맞바꿉니다.',
        '이제 조각이 모두 모였습니다. 마지막 레슨에서는 네트워크 · 클러스터 · Terraform · 파이프라인 · 관측 · ID · 데이터를 엮어 <code>shop.example</code>의 멀티클라우드 플랫폼을 처음부터 설계합니다.',
      ],
      hide: ['dA', 'dZ', 'app', 'db', 'rep'],
      show: ['staff', 'idp', 'aws', 'azure', 'gcp', 'ncp'],
      set: { aws: { sub: 'SSO 세션' }, azure: { sub: 'SSO 세션' }, gcp: { sub: 'SSO 세션' }, ncp: { sub: 'SSO 세션' } },
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
      answer: 1,
      why: '연합 구조에서는 클라우드에 따로 계정이 없으니 IdP에서 끄면 새 로그인이 모두 막힙니다. 다만 SSO 밖에 있는 비밀(비상 계정, 남아 있는 앱 키)은 IdP가 모르므로 따로 점검해야 합니다. 콘솔을 돌며 지우는 것은 연합 이전의 방식입니다.',
    },
    {
      q: 'GKE의 배치 작업이 AWS S3를 읽어야 합니다. 가장 안전한 구성은?',
      options: [
        'IAM 사용자의 액세스 키를 Kubernetes Secret에 넣고 90일마다 교체한다',
        '버킷을 공개 읽기로 열고 URL을 모르게 한다',
        'Google이 서명한 OIDC 토큰을 STS에서 임시 자격으로 바꾸고, 신뢰 정책에 그 서비스 계정만 조건으로 적는다',
        'S3 데이터를 매일 GCS로 통째로 복사해 같은 클라우드 안에서 읽는다',
      ],
      answer: 2,
      why: '워크로드 아이덴티티 연합은 저장된 비밀 없이 짧게 사는 자격만 씁니다. 키 교체는 유출 위험을 줄일 뿐 없애지 못하고, 공개 버킷은 URL만 알면 누구나 읽습니다. 통째 복사는 전송 비용과 데이터 사본 관리 부담을 만듭니다.',
    },
    {
      q: 'AWS에 있는 50TB 주문 데이터를 GCP에서 매일 분석하려 합니다. 첫 설계로 가장 타당한 것은?',
      options: [
        '매일 밤 50TB 전체를 GCP로 복사한다',
        '원본은 AWS에 두고, AWS 안에서 집계하거나 변경분만 GCP로 보낸다',
        '두 클라우드에 원본을 하나씩 두고 각자 쓰게 한다',
        '전용선만 깔면 전송 비용과 시간 문제가 사라진다',
      ],
      answer: 1,
      why: '데이터 중력 때문에 계산을 데이터 쪽으로 옮기는 것이 싸고 빠릅니다. 전량 복사는 egress와 시간이 매일 반복되고, 원본이 둘이면 정합성이 깨집니다. 전용선은 단가와 지연을 낮출 뿐 나가는 데이터 요금과 대역폭 한계는 남습니다.',
    },
    {
      q: '주문 DB를 다른 클라우드의 DR 복제본으로 동기 복제하자는 제안이 나왔습니다. 가장 먼저 따져 봐야 할 것은?',
      options: [
        '복제본의 디스크 종류',
        '모든 쓰기에 클라우드 간 왕복 지연이 붙고, 복제본 쪽이 멈추면 원본의 쓰기도 멈출 수 있다는 점',
        '동기 복제는 데이터를 잃을 수 있다는 점',
        '비동기 복제는 RPO가 항상 0이라는 점',
      ],
      answer: 1,
      why: '동기 복제는 RPO 0을 주는 대신 쓰기 지연과 가용성을 상대 쪽에 묶습니다. 데이터를 잃을 수 있는 것은 비동기 쪽이고, 그 손실 범위가 곧 RPO입니다. 요구 RPO가 몇 초~몇 분이면 비동기가 대개 더 맞습니다.',
    },
  ],
};
