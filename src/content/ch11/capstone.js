export default {
  id: 'capstone',
  learn: [
    '요구사항에서 클라우드 배치와 패턴을 끌어내기',
    'IP 계획 · 허브 네트워크 · ID 연합으로 바닥 깔기',
    '클러스터 · Terraform · GitOps로 같은 방식의 배포',
    '데이터 경계와 클라우드 간 전송 비용 지키기',
    '관측 · 보안 · 비용 · DR을 플랫폼의 기능으로, 그리고 훈련으로 확인하기',
    '코스 전체 지도와 다음 공부',
  ],
  legend: [['req', '요청'], ['ctrl', '로그인 · 배포 · 제어'], ['build', '빌드 · 이미지'], ['data', '데이터 · 메트릭'], ['sync', '복제'], ['bad', '위반 · 실패']],
  metrics: [
    { id: 'reqs', label: '요구 충족', icon: 'clipboard' },
    { id: 'auto', label: '변경 방식', icon: 'rocket' },
    { id: 'egress', label: '클라우드 간 전송', icon: 'truck' },
    { id: 'rto', label: '글로벌 RTO', icon: 'timer' },
  ],
  scene: {
    nodes: {
      users: { kind: 'users', at: [-2.4, 1], label: '글로벌 고객' },
      gov: { kind: 'client', at: [6.6, 3.4], label: '공공기관' },
      staff: { kind: 'users', at: [3, -3.4], label: '직원' },
      aws: { at: [0, 0], label: 'AWS', sub: '글로벌 쇼핑몰', icon: 'cloud', color: 'aws' },
      entra: { at: [5, 0], label: 'Entra ID', sub: '사내 ID', icon: 'id-card', color: 'azure' },
      gcp: { at: [0, 5], label: 'GCP', sub: '분석', icon: 'cloud', color: 'gcp' },
      ncp: { at: [5, 5], label: 'NCP', sub: '공공 존', icon: 'cloud', color: 'ncp' },
      hub: { at: [2.5, 2.5], size: 's', label: '허브', sub: '전용선', icon: 'router', color: 'navy' },
      tf: { at: [-2.8, 1.2], label: 'Terraform', sub: 'state × 4', icon: 'file-code', color: 'olive' },
      git: { kind: 'cyl', at: [-4, 4], label: 'Git 저장소', icon: 'git', color: 'slate' },
      ci: { at: [-2, 2], label: 'CI', sub: '빌드·스캔·서명', icon: 'hammer', color: 'slate' },
      argo: { at: [0, 5], label: 'Argo CD', sub: '플릿 배포', icon: 'refresh', color: 'navy' },
      obs: { at: [2.6, -2.6], label: 'Grafana', sub: '중앙 관측', icon: 'chart-line', color: 'yellow' },
      aws2: { at: [5, 0], label: 'AWS DR', sub: '다른 리전', icon: 'cloud', color: 'aws' },
    },
    edges: {
      e_u_aws: { from: 'users', to: 'aws' },
      e_g_ncp: { from: 'gov', to: 'ncp' },
      h1: { from: 'hub', to: 'aws', bi: true },
      h2: { from: 'hub', to: 'gcp', bi: true },
      h3: { from: 'hub', to: 'ncp', bi: true },
      s1: { from: 'entra', to: 'aws', style: 'dashed', off: true },
      s2: { from: 'entra', to: 'gcp', style: 'dashed', off: true },
      s3: { from: 'entra', to: 'ncp', style: 'dashed', off: true },
      e_staff: { from: 'staff', to: 'entra' },
      t1: { from: 'tf', to: 'aws', style: 'dashed' },
      t2: { from: 'tf', to: 'gcp', style: 'dashed' },
      t3: { from: 'tf', to: 'ncp', style: 'dashed' },
      e_gc: { from: 'git', to: 'ci' },
      e_ga: { from: 'git', to: 'argo', style: 'dashed' },
      a1: { from: 'argo', to: 'aws' },
      a2: { from: 'argo', to: 'ncp' },
      o1: { from: 'aws', to: 'obs' },
      o2: { from: 'gcp', to: 'obs' },
      o3: { from: 'ncp', to: 'obs' },
      r1: { from: 'aws', to: 'aws2', style: 'dashed', label: '비동기 복제' },
      e_dr: { from: 'users', to: 'aws2', via: [[1.6, 1.6]], style: 'dashed' },
    },
  },
  codes: {
    tree: {
      title: 'infra/', lang: 'text',
      text: `infra/
├─ modules/
│  ├─ network/   # VPC · 서브넷 · 라우팅
│  ├─ cluster/   # EKS · NKS 공통 입력
│  └─ dns/       # 사설 존 · 전달 규칙
├─ envs/
│  ├─ aws-prod/  # state: aws-prod
│  ├─ aws-dr/    # state: aws-dr
│  ├─ ncp-gov/   # state: ncp-gov (접근 제한)
│  └─ gcp-data/  # state: gcp-data
└─ ipam/         # 주소 계획표 (출력값)`,
    },
  },
  steps: [
    {
      key: '요구사항', kind: 'problem', title: '요구부터: 무엇을 어디에 둘까',
      body: [
        '마지막으로 <code>shop.example</code>을 처음부터 설계합니다. 5장에서 본 네 클라우드의 성격에 요구 넷을 맞춥니다. 국내 <b>공공 고객 데이터</b>는 인증받은 NCP 공공 존에, <b>글로벌 쇼핑몰</b>은 리전이 많은 AWS에, <b>분석</b>은 GCP BigQuery에, 직원 로그인은 회사가 이미 쓰는 <b>Entra ID</b>로.',
        '비기능 요구도 적습니다. 글로벌 서비스는 RTO 1시간 · RPO 5분, 배포는 하루에도 여러 번, 클라우드 간 전송비는 월 예산 안. 11장 첫 레슨의 원칙대로 클라우드마다 <b>이유가 한 문장</b>으로 붙어 있는지 확인합니다.',
      ],
      callout: { type: 'key', text: '설계는 서비스 목록이 아니라 요구에서 시작합니다. Azure는 이 설계에서 워크로드 없이 <b>ID만</b> 맡습니다. 요구가 없는 것은 그림에 넣지 않습니다.' },
      show: ['users', 'gov', 'aws', 'gcp', 'ncp', 'entra'],
      tags: [
        { on: 'aws', text: '글로벌 서비스', tone: 'aws' },
        { on: 'entra', text: '직원 로그인', tone: 'azure', pos: 'bottom' },
        { on: 'gcp', text: 'BigQuery로 분석', tone: 'gcp', pos: 'bottom' },
        { on: 'ncp', text: '공공 고객 데이터', tone: 'ncp', pos: 'bottom' },
      ],
      flows: [{ path: ['users', 'aws'], kind: 'req', n: 2 }, { path: ['gov', 'ncp'], kind: 'req', n: 2, delay: 0.5 }],
      metrics: { reqs: ['0 / 4', 'bad'], auto: '설계 전', egress: '설계 전', rto: '목표 1시간' },
      more: [
        { title: '요구 목록', rows: [
          ['R1 공공 계약', '공공 데이터는 국내 · 인증 클라우드', 'ncp'],
          ['R2 글로벌 서비스', 'RTO 1시간 · RPO 5분', 'aws'],
          ['R3 분석', 'BigQuery · 하루 단위 집계', 'gcp'],
          ['R4 운영', '하루 여러 번 배포 · 전송비 예산 안', 'info'],
        ] },
        { title: '요구를 숫자로 바꾸기', body: [
          '"빠르게", "안전하게" 같은 말은 설계의 근거가 되지 못합니다. RTO · RPO는 분 단위로, 배포 빈도는 하루 몇 번으로, 전송비는 월 금액으로 적어 둡니다. 그래야 뒤에서 대안을 비교할 때 <b>무엇을 만족하고 무엇을 넘는지</b> 판단할 수 있어요(10장 백업과 재해 복구, 비용 관리).',
        ] },
        { title: '설계 문서의 뼈대', list: [
          '요구 목록과 그 출처(계약서 · 규정 · 사업 목표)',
          '워크로드 × 위치 × 이유 표, 그리고 고른 패턴',
          '층별 설계: 네트워크 → ID → 컴퓨트 → 배포 → 데이터 → 운영',
          '주요 결정마다 ADR(대안과 이유), 남은 위험과 재검토 시점',
        ] },
      ],
    },
    {
      key: '배치표', kind: 'compare', title: '네 클라우드에 무엇을, 어떤 패턴으로',
      body: [
        '요구를 클라우드에 놓으면 패턴이 보입니다. 전체는 <b>워크로드별 분산</b>입니다. 같은 것을 두 클라우드에서 돌리지 않고, 가용성은 각 클라우드 <b>안에서</b> 챙깁니다. 글로벌 쇼핑몰은 AWS의 두 리전으로 액티브-패시브, 공공 서비스는 NCP 안의 이중화와 백업입니다.',
        '액티브-액티브와 버스팅은 쓰지 않습니다. 이 요구에서는 비용과 일관성 부담에 비해 얻는 것이 적어요. 11장 첫 레슨의 "가장 단순한 패턴"입니다.',
      ],
      callout: { type: 'tip', text: '배치표의 각 줄에는 <b>근거가 된 요구 번호</b>를 붙여 두세요. 요구가 바뀌면 어느 줄을 다시 봐야 하는지 바로 보입니다.' },
      hide: ['users', 'gov'],
      tags: [
        { on: 'aws', text: 'R2 · 리전 2개', tone: 'aws' },
        { on: 'gcp', text: 'R3 · 관리형', tone: 'gcp', pos: 'bottom' },
        { on: 'ncp', text: 'R1 · 공공 존', tone: 'ncp', pos: 'bottom' },
      ],
      panel: {
        title: '클라우드별 배치', icon: 'layers',
        rows: [['AWS', 'EKS · RDS · 리전 2개', 'aws'], ['Azure', 'Entra ID만 (워크로드 없음)', 'azure'], ['GCP', 'BigQuery (클러스터 없음)', 'gcp'], ['NCP', 'NKS · Cloud DB · 공공 존', 'ncp'], ['쓰지 않음', '액티브-액티브 · 버스팅', 'mute']],
      },
      more: [
        { title: '네 클라우드에서 쓰는 것', rows: [
          ['AWS', 'EKS · RDS · ECR · Route 53 · Direct Connect', 'aws'],
          ['Azure', 'Entra ID (SSO · 그룹)', 'azure'],
          ['GCP', 'BigQuery · Cloud Interconnect', 'gcp'],
          ['NCP', 'NKS · Cloud DB · Container Registry · Cloud Connect', 'ncp'],
        ] },
        { title: '고른 패턴과 버린 패턴', list: [
          '<b>워크로드별 분산</b>: 요구 R1 · R3이 위치를 정해 줌. 채택',
          '<b>액티브-패시브(같은 클라우드의 다른 리전)</b>: R2의 RTO 1시간 · RPO 5분을 가장 싸게 만족. 채택',
          '<b>다른 클라우드로의 DR</b>: 사업자 전체 장애 대비 요구가 생기면 재검토. 보류',
          '<b>액티브-액티브 · 버스팅</b>: 요구 없음, 비용 · 일관성 부담 큼. 버림',
        ] },
        { title: '흔한 실수', body: [
          '배치표에 "혹시 몰라서" 줄을 넣는 것입니다. 예를 들어 Azure에 쇼핑몰 대기 환경을 하나 더 두는 순간, 이미지 · 네트워크 · ID · 데이터 복제 · 훈련이 모두 한 벌씩 늘어납니다. 그 비용을 정당화할 <b>요구 번호</b>가 없다면 넣지 않습니다.',
        ] },
      ],
    },
    {
      key: '네트워크', kind: 'solution', title: '바닥부터: 주소 계획과 허브',
      body: [
        '2장의 CIDR과 3장의 VPC를 회사 단위로 넓힙니다. 먼저 <b>주소 계획표</b>를 만듭니다. 클라우드와 리전마다 겹치지 않는 /16을 주고, Pod · Service 대역과 미래를 위한 예약 블록까지 한 표에 적습니다.',
        '클라우드는 코로케이션의 <b>전용선 허브</b>로 잇고 인터넷 VPN을 백업으로 둡니다. 이름은 클라우드별 하위 도메인과 <b>조건부 전달</b>로 풀고, 바깥 입구는 GSLB가 맡습니다(11장 네트워크).',
      ],
      callout: { type: 'warn', text: '공공 존은 외부와의 연결 자체에 조건이 붙을 수 있습니다. 허브에 붙이기 전에 <b>허용되는 연결 방식</b>부터 확인하세요.' },
      hide: ['entra'],
      show: ['hub'],
      set: { aws: { sub: '10.10.0.0/16' }, gcp: { sub: '10.30.0.0/16' }, ncp: { sub: '10.40.0.0/16' } },
      focus: ['hub'],
      panel: {
        title: '주소 계획표', icon: 'table',
        rows: [['AWS 서울', '10.10.0.0/16', 'aws'], ['AWS DR 리전', '10.11.0.0/16', 'aws'], ['GCP 분석', '10.30.0.0/16', 'gcp'], ['NCP 공공', '10.40.0.0/16', 'ncp'], ['예약 (확장 · 인수)', '10.50.0.0/16 ~', 'mute']],
      },
      flows: [{ path: ['aws', 'hub', 'ncp'], kind: 'req', n: 2 }, { path: ['aws', 'hub', 'gcp'], kind: 'data', n: 2, delay: 0.6 }],
      changes: [['+', '회사 전체 주소 계획표'], ['+', '전용선 허브 + VPN 백업'], ['+', '조건부 전달 · GSLB']],
      more: [
        { title: '네트워크 설계 요약', rows: [
          ['주소', '클라우드 · 리전마다 /16 · 예약 블록', 'info'],
          ['경로', '접속 위치 2곳의 허브 + 전 구간 VPN 백업', 'ok'],
          ['허용', '스포크별 경로 필터 · 서브넷 · 포트 단위', 'warn'],
          ['이름', 'aws · ncp · gcp.shop.internal + 조건부 전달', 'accent'],
          ['입구', 'GSLB 장애 조치 · TTL 60초', 'info'],
        ] },
        { title: '이름 규칙', code: { title: 'dns 하위 도메인', lang: 'text', text: `aws.shop.internal   → AWS 리졸버가 답함
ncp.shop.internal   → NCP 쪽 DNS가 답함
gcp.shop.internal   → Cloud DNS가 답함

각 클라우드 리졸버:
  "자기 것이 아닌 하위 도메인은 그 클라우드로 전달"` } },
        { title: '흔한 실수', body: [
          '허브를 만들고 "일단 다 통하게" 열어 두는 것입니다. 공공 존 대역은 허브가 <b>AWS 주문 API 서브넷에만</b> 광고하고, GCP에는 광고하지 않습니다. 이 결정이 뒤의 데이터 경계 사례에서 마지막 방어선이 됩니다.',
        ] },
      ],
    },
    {
      key: 'ID', kind: 'solution', title: '사람과 워크로드의 신원',
      body: [
        '4장의 IAM 위에 11장의 연합을 얹습니다. 직원은 <b>Entra ID</b>에서 MFA로 한 번 로그인하고, 각 클라우드는 그 증명을 믿고 그룹에 맞는 역할을 줍니다. NCP는 지원하는 연동 방식을 확인해 맞추고, 클라우드마다 금고에 넣은 비상 계정을 하나씩 둡니다.',
        '워크로드는 <b>토큰 교환</b>으로 다른 클라우드를 부릅니다. CI도 마찬가지로 OIDC 토큰으로 배포 권한을 받습니다. 플랫폼 어디에도 <b>장기 키를 저장하지 않는 것</b>이 목표입니다.',
      ],
      callout: { type: 'tip', text: '권한은 사람이 아니라 그룹에 줍니다. 퇴사 처리는 Entra ID에서 한 번이면 끝납니다.' },
      hide: ['hub'],
      show: ['entra', 'staff', 's1', 's2', 's3'],
      set: { aws: { sub: 'SSO 역할' }, gcp: { sub: 'SSO 역할' }, ncp: { sub: 'SSO 역할' } },
      focus: ['entra'],
      tags: [{ on: 'entra', text: 'MFA 한 번', tone: 'ok', icon: 'fingerprint', pos: 'bottom' }],
      flows: [
        { path: ['staff', 'entra'], kind: 'ctrl' },
        { path: ['entra', 'aws'], kind: 'ctrl', delay: 1 }, { path: ['entra', 'gcp'], kind: 'ctrl', delay: 1 }, { path: ['entra', 'ncp'], kind: 'ctrl', delay: 1 },
      ],
      metrics: { reqs: ['1 / 4', 'warn'] },
      changes: [['+', 'Entra ID SSO 연합'], ['+', '클라우드별 비상 계정'], ['-', '사람 · CI의 장기 키']],
      more: [
        { title: '그룹 → 역할 매핑', rows: [
          ['shop-dev', 'AWS dev 개발자 · GCP 분석 읽기', 'info'],
          ['shop-ops', 'AWS prod 운영 (읽기 위주)', 'warn'],
          ['gov-ops', 'NCP 공공 존 운영 · 별도 승인', 'ncp'],
          ['data-analyst', 'GCP BigQuery 데이터셋 읽기', 'gcp'],
        ] },
        { title: '워크로드 신원 목록', list: [
          'CI → AWS · NCP 레지스트리: CI의 OIDC 토큰으로 푸시 권한',
          'Argo CD → 클러스터: 짧게 사는 토큰, 공공 존은 안쪽 Argo CD가 당겨 옴',
          'AWS 집계 작업 → BigQuery 적재: GCP Workload Identity 풀로 AWS 신원을 교환',
          '앱 → 클라우드 API: 클러스터의 Pod 신원 연동(IRSA · Pod Identity 등)',
        ] },
        { title: '점검 질문', body: [
          '"지금 이 플랫폼에서 만료가 없는 비밀은 몇 개인가?" 답은 비상 계정 정도여야 합니다. 그 밖의 장기 키가 있다면 목록에 올리고, 없앨 계획이나 없앨 수 없는 이유를 적어 둡니다.',
        ] },
      ],
    },
    {
      key: '클러스터', kind: 'solution', title: '클러스터는 필요한 곳에만',
      body: [
        '6장의 컨테이너와 7장의 Kubernetes로 앱을 올립니다. 글로벌 쇼핑몰은 두 리전의 <b>EKS</b>, 공공 서비스는 NCP 공공 존의 <b>NKS</b>. 둘은 같은 이미지와 같은 매니페스트를 쓰고, 클라우드별 차이는 overlay에 적습니다(11장 쿠버네티스).',
        'GCP에는 클러스터를 두지 않습니다. 분석은 관리형 <b>BigQuery</b>가 더 잘하니까요. 모든 곳에 Kubernetes를 깔아야 멀티클라우드인 것은 아닙니다.',
      ],
      callout: { type: 'tip', text: '옮기기 쉬운 층(컨테이너 · K8s · Terraform)은 그것이 값어치를 하는 앱 쪽에 두고, 관리형 서비스는 <b>값어치가 있으면 기꺼이</b> 씁니다.' },
      hide: ['entra', 'staff', 's1', 's2', 's3'],
      show: ['users', 'gov'],
      set: {
        aws: { label: 'EKS', sub: 'AWS · 리전 2개', icon: 'helm' },
        ncp: { label: 'NKS', sub: 'NCP 공공 존', icon: 'helm' },
        gcp: { label: 'BigQuery', sub: 'GCP 관리형', icon: 'chart-bar' },
      },
      tags: [{ on: 'gcp', text: 'K8s 없이 관리형', tone: 'gcp', pos: 'bottom' }, { on: 'ncp', text: '공공 존 안에서만', tone: 'ncp', pos: 'bottom' }],
      flows: [{ path: ['users', 'aws'], kind: 'req', n: 2 }, { path: ['gov', 'ncp'], kind: 'req', n: 2, delay: 0.5 }],
      metrics: { reqs: ['3 / 4', 'warn'], auto: '손으로' },
      more: [
        { title: '클러스터 목록', rows: [
          ['eks-prod', 'AWS 서울 · 글로벌 쇼핑몰', 'aws'],
          ['eks-dr', 'AWS 다른 리전 · 웜 스탠바이', 'aws'],
          ['nks-gov', 'NCP 공공 존 · 공공 서비스', 'ncp'],
          ['(없음)', 'GCP는 관리형 분석만', 'gcp'],
        ] },
        { title: 'overlay에 들어갈 차이', list: [
          'StorageClass 이름 (EBS CSI · NCP 블록 스토리지 CSI)',
          '로드 밸런서 애너테이션과 Ingress 클래스',
          '이미지 레지스트리 주소 (ECR · NCP Container Registry)',
          'Pod 신원 연동 방식, 레플리카 수(DR은 작게)',
        ] },
        { title: '실무 팁', body: [
          '두 클라우드의 클러스터 버전을 <b>한두 마이너 버전 안</b>에 맞춰 두세요. 업그레이드는 eks-dr → nks-gov → eks-prod처럼 영향이 작은 곳부터 합니다. 관리형 서비스마다 지원 종료 일정이 다르니 한 달력에 모아 둡니다.',
        ] },
      ],
    },
    {
      key: 'Terraform', kind: 'concept', title: '인프라는 코드로, state는 나눠서',
      body: [
        '8장의 Terraform으로 이 모든 것을 짓습니다. VPC · 클러스터 · DNS는 <b>모듈</b>로 한 번 만들고 환경마다 입력값만 바꿉니다. 주소 계획표도 코드(<code>ipam/</code>)로 두어 리뷰에서 겹침을 잡습니다.',
        '<b>state는 환경마다 따로</b>, 잠금이 되는 원격 백엔드에 둡니다. 한 번의 apply가 네 클라우드를 건드리지 않게 해서 실패의 반경을 줄이고, 공공 존 state에는 접근 권한을 따로 겁니다.',
      ],
      callout: { type: 'warn', text: '"apply 한 번으로 전부"는 데모에선 멋지지만 운영에선 위험합니다. 한 클라우드의 API 오류나 잠금이 나머지 변경까지 붙잡습니다.' },
      hide: ['users', 'gov'],
      show: ['tf'],
      code: { ref: 'tree', hl: [2, 6, 7, 8, 9, 10] },
      flows: [{ path: ['tf', 'aws'], kind: 'ctrl' }, { path: ['tf', 'gcp'], kind: 'ctrl', delay: 0.4 }, { path: ['tf', 'ncp'], kind: 'ctrl', delay: 0.8 }],
      metrics: { auto: ['Terraform', 'ok'] },
      more: [
        { title: '환경 하나의 모양', code: { title: 'envs/ncp-gov/main.tf', lang: 'hcl', text: `terraform {
  backend "s3" {}  # 버킷 · 키는 init 때 주입, 잠금 사용
}

data "terraform_remote_state" "ipam" {
  backend = "s3"
  config  = { bucket = "shop-tf", key = "ipam" }
}

module "network" {
  source = "../../modules/network"
  cidr   = data.terraform_remote_state.ipam
             .outputs.cidr["ncp_gov"]
}` } },
        { title: '파이프라인으로 돌리기', list: [
          'PR마다 환경별 <code>plan</code>을 돌려 결과를 리뷰에 붙임',
          '머지 후 <code>apply</code>는 사람이 아니라 파이프라인이, 환경마다 따로',
          '공공 존 환경은 승인자를 따로 두고, 그 state에는 gov-ops만 접근',
          '정기적으로 <code>plan</code>을 돌려 드리프트(콘솔 손 변경)를 찾음',
        ] },
        { title: '흔한 실수', body: [
          '모든 환경이 같은 state 버킷의 같은 권한을 쓰는 것입니다. state에는 리소스의 세부 정보와 때로 비밀값이 들어 있어서, 공공 존 state가 모두에게 열려 있으면 그 자체로 정보 유출 경로가 됩니다(8장 State와 백엔드).',
        ] },
      ],
    },
    {
      key: 'GitOps', kind: 'solution', title: 'push 한 번이 두 클러스터까지',
      body: [
        '9장의 파이프라인입니다. push하면 CI가 이미지를 한 번 빌드하고, 스캔하고, 서명해서 <b>각 클라우드의 레지스트리</b>로 보냅니다. 클러스터는 가까운 레지스트리에서 같은 digest를 받습니다.',
        '배포는 <b>Argo CD ApplicationSet</b>이 맡습니다. Git에 머지하면 EKS와 NKS가 각자의 overlay대로 맞춰집니다. CI도 사람도 운영 클러스터에 직접 손대지 않습니다.',
      ],
      callout: { type: 'warn', text: '공공 존 클러스터에 바깥의 Argo CD가 접속하는 것이 허용되지 않을 수 있습니다. 그럴 땐 NKS 안에 Argo CD를 따로 두고 <b>같은 Git을 당겨 오게</b> 합니다.' },
      hide: ['tf', 'gcp'],
      show: ['git', 'ci', 'argo'],
      tags: [{ on: 'ci', text: '같은 digest · 서명', icon: 'badge' }, { on: 'argo', text: 'overlay별 배포', tone: 'accent', pos: 'bottom' }],
      flows: [
        { path: ['git', 'ci'], kind: 'build', n: 2 },
        { path: ['git', 'argo'], kind: 'ctrl', delay: 1.2 },
        { path: ['argo', 'aws'], kind: 'ctrl', delay: 2.2 }, { path: ['argo', 'ncp'], kind: 'ctrl', delay: 2.2 },
      ],
      metrics: { auto: ['Git 머지', 'ok'] },
      changes: [['+', 'CI: 빌드 · 스캔 · 서명'], ['+', 'Argo CD ApplicationSet'], ['~', 'kubectl → Git 머지']],
      more: [
        { title: '커밋 하나의 여정', list: [
          'PR: 테스트 · 린트 · Terraform plan · overlay 렌더링 검사',
          '머지: 이미지 빌드 → 취약점 스캔 → 서명 → ECR과 NCP 레지스트리에 같은 digest로 푸시',
          '자동 PR: overlay의 이미지 태그를 새 digest로 올림 (eks-dr 먼저)',
          '동기화: Argo CD가 eks-dr → nks-gov → eks-prod 순서로 맞춤',
          '검증: 배포 후 지표가 나빠지면 Git revert로 되돌림',
        ] },
        { title: '서명 확인', body: [
          '클러스터에는 <b>서명된 이미지만</b> 받도록 정책을 겁니다. 예를 들어 Kyverno 같은 정책 엔진으로 우리 서명 키(또는 CI의 OIDC 신원)로 서명된 이미지인지 확인하게 하면, 누가 레지스트리에 직접 이미지를 올려도 배포되지 않습니다(9장 이미지 파이프라인).',
        ] },
        { title: '흔한 실수', body: [
          '레지스트리마다 이미지를 <b>따로 빌드</b>하는 것입니다. 빌드 시점이 다르면 같은 태그라도 내용이 달라질 수 있습니다. 한 번 빌드하고 digest로 복사하세요. 그래야 "AWS에서 검증한 것이 공공 존에서 도는 것"이라는 말이 참이 됩니다.',
        ] },
      ],
    },
    {
      key: '반출 사례', kind: 'case', title: '사례: 분석으로 흘러간 공공 데이터',
      body: [
        '분석팀이 "편하게" NCP의 공공 고객 DB를 통째로 GCP로 복제하는 작업을 걸었습니다. 허브가 있으니 길은 열려 있었고 방화벽도 막지 않았습니다. 공공 고객의 원본 데이터가 <b>인증 범위 밖</b>으로 나간 겁니다.',
        '같은 주에 AWS의 주문 데이터도 매일 전량 복사되면서 전송비가 예산을 넘었습니다. 네트워크가 이어지면 데이터는 <b>막지 않는 한 흐릅니다</b>.',
      ],
      callout: { type: 'key', text: '연결과 허용은 다릅니다. 허브는 길일 뿐이고, 무엇이 지나가도 되는지는 따로 정해서 <b>시스템에 걸어야</b> 합니다.' },
      hide: ['git', 'ci', 'argo'],
      show: ['gcp', 'hub'],
      set: { ncp: { state: 'hot', badge: '반출 위반', tone: 'bad' } },
      tags: [{ on: 'gcp', text: '공공 원본 도착', tone: 'bad', icon: 'warn', pos: 'bottom' }],
      flows: [{ path: ['ncp', 'hub', 'gcp'], kind: 'bad', n: 3, gap: 0.4 }, { path: ['aws', 'hub', 'gcp'], kind: 'data', n: 5, gap: 0.25, delay: 0.6 }],
      metrics: { reqs: ['위반 1건', 'bad'], egress: ['매일 전량', 'bad'] },
      changes: [['-', '공공 원본이 NCP 밖으로'], ['-', '주문 데이터 매일 전량 복사'], ['~', '길이 있으니 막는 것이 없음']],
      more: [
        { title: '증상 → 원인 → 대응', rows: [
          ['증상', 'BigQuery에 공공 고객 원본 테이블 등장', 'bad'],
          ['증상', '허브 전송량 급증 · 전송비 예산 초과', 'bad'],
          ['원인', '허브가 공공 대역을 GCP에도 광고 · 허용', 'warn'],
          ['원인', '데이터 분류와 반출 규칙이 문서에만 있음', 'warn'],
          ['즉시', '복제 중단 · GCP 사본 삭제 · 보고 절차', 'info'],
        ] },
        { title: '어떻게 발견했나, 어떻게 더 빨리', body: [
          '이번에는 월말 청구서를 보고서야 알았습니다. 허브의 <b>구간별 전송량</b>을 대시보드에 올리고, 공공 대역에서 나가는 흐름 로그에 경보를 걸었다면 첫날 알았을 거예요. 규제 위반은 비용보다 무겁습니다. 발견이 늦을수록 보고와 정리의 범위도 커집니다.',
        ] },
        { title: '흔한 착각', list: [
          '"암호화해서 보냈으니 괜찮다": 암호화 여부와 상관없이 데이터가 <b>인증 범위 밖에 놓인</b> 것이 문제입니다.',
          '"분석팀은 내부 사람이다": 레지던시는 사람이 아니라 데이터의 위치에 대한 요구입니다.',
        ] },
      ],
    },
    {
      key: '데이터 경계', kind: 'solution', title: '데이터마다 원본과 경계를 정합니다',
      body: [
        '데이터를 <b>분류</b>하고, 분류마다 원본 위치와 밖으로 나갈 수 있는 형태를 정합니다. 공공 고객 원본은 NCP 밖으로 못 나가고, 비식별 · 집계된 결과만 분석으로 갑니다. 주문 데이터는 원본을 AWS에 두고 <b>변경분(CDC)</b>만 보냅니다.',
        '규칙은 사람의 기억이 아니라 시스템에 겁니다. 방화벽과 라우팅에서 공공 DB → GCP 경로를 막고, 복제 작업은 승인된 목적지에만 쓰게 합니다.',
      ],
      callout: { type: 'tip', text: '"데이터는 한 곳에, 계산은 가까이"(11장 ID와 데이터). 경계를 넘는 것이 결과뿐이어야 규제와 비용이 함께 지켜집니다.' },
      set: { ncp: { state: null, badge: null } },
      panel: {
        title: '데이터 분류와 경계', icon: 'shield',
        rows: [['공공 고객 원본', 'NCP 밖으로 금지', 'bad'], ['비식별 · 집계', '분석으로 반출 허용', 'ok'], ['주문 데이터', '원본 AWS · 변경분만', 'aws']],
      },
      tags: [{ on: 'ncp', text: '집계 결과만', tone: 'ok', icon: 'funnel', pos: 'bottom' }],
      flows: [{ path: ['ncp', 'hub', 'gcp'], kind: 'data' }, { path: ['aws', 'hub', 'gcp'], kind: 'data', n: 2, delay: 0.6 }],
      metrics: { reqs: ['4 / 4', 'ok'], egress: ['변경분 · 집계', 'ok'] },
      changes: [['+', '데이터 분류 · 원본 위치'], ['-', '공공 DB → GCP 경로'], ['~', '전량 복사 → 변경분 · 집계']],
      more: [
        { title: '경계를 거는 곳', rows: [
          ['네트워크', '허브 경로 필터 · 공공 대역 미광고', 'info'],
          ['방화벽', '공공 DB는 AWS 주문 API 서브넷만', 'info'],
          ['조직 정책', '허용 리전 밖 리소스 생성 금지', 'accent'],
          ['데이터 작업', '승인된 목적지 목록 · 반출 승인 절차', 'ok'],
          ['감시', '구간별 전송량 · 흐름 로그 경보', 'warn'],
        ] },
        { title: '반출 결과물의 기준', list: [
          '개인을 알아볼 수 있는 열(이름 · 연락처 · 식별 번호)은 제거하거나 가명 처리',
          '집계 단위는 너무 작은 그룹이 드러나지 않을 만큼',
          '반출 작업은 NCP 안에서 돌고, 결과만 정해진 버킷으로',
          '구체적인 비식별 기준은 법무 · 보안 담당과 함께 정함',
        ] },
        { title: '전송비 다시 계산하기', body: [
          '주문 데이터를 매일 전량 대신 CDC 변경분으로 바꾸면 전송량은 하루 생성량 수준으로 줄어듭니다. 허브 구간별 전송량을 월 예산과 함께 대시보드에 두고, 예산의 80%에 닿으면 알림이 오게 하세요(10장 비용 관리).',
        ] },
      ],
    },
    {
      key: '관측', kind: 'concept', title: '눈: 네 클라우드를 한 화면에',
      body: [
        '10장의 관측 스택을 플랫폼으로 넓힙니다. 클라우드와 클러스터마다 수집기를 두고, 신호에 <code>cloud</code> · <code>cluster</code> 라벨을 붙여 <b>중앙 Grafana</b> 하나로 모읍니다.',
        '공공 존 로그에는 개인정보가 섞일 수 있으니 <b>로그는 NCP 안에</b> 두고, 메트릭과 집계된 지표만 중앙으로 보냅니다. 허브 구간별 전송량, 복제 지연, 동기화 상태도 같은 대시보드에 올립니다.',
      ],
      callout: { type: 'key', text: '관측 데이터도 데이터입니다. 클라우드 경계를 넘을 때마다 <b>비용과 규제</b>를 함께 따지세요.' },
      hide: ['hub'],
      show: ['obs'],
      focus: ['obs'],
      tags: [{ on: 'ncp', text: '로그는 공공 존 안에', tone: 'ncp', icon: 'lock', pos: 'bottom' }],
      flows: [{ path: ['aws', 'obs'], kind: 'data', n: 2 }, { path: ['gcp', 'obs'], kind: 'data', n: 2, delay: 0.3 }, { path: ['ncp', 'obs'], kind: 'data', n: 2, delay: 0.6 }],
      more: [
        { title: '플랫폼 대시보드에 올릴 것', rows: [
          ['서비스', '요청 수 · 오류율 · 지연 (클라우드별)', 'ok'],
          ['배포', 'Argo CD 동기화 · 상태 (클러스터별)', 'info'],
          ['데이터', '복제 지연 · CDC 지연', 'warn'],
          ['네트워크', '허브 구간별 전송량 · 터널 상태', 'accent'],
          ['비용', '클라우드 간 전송비 · 예산 대비', 'bad'],
        ] },
        { title: '경보 기준 예시', code: { title: 'alerts.yaml (일부)', lang: 'yaml', text: `- alert: ReplicationLagHigh
  expr: pg_replication_lag_seconds > 120
  for: 5m
  labels: { severity: page }   # RPO 5분의 절반 이전에
- alert: CrossCloudEgressBudget
  expr: sum(egress_bytes_30d) > 0.8 * egress_budget
  labels: { severity: ticket }` } },
        { title: '실무 팁', body: [
          '경보는 <b>요구에서</b> 끌어냅니다. RPO 5분이 요구라면 복제 지연이 그 절반쯤에서 사람을 깨워야 하고, 전송비 예산이 요구라면 80%에서 티켓을 만듭니다. 요구와 연결되지 않은 경보는 결국 무시됩니다.',
        ] },
      ],
    },
    {
      key: '보안', kind: 'concept', title: '자물쇠: 층마다 하나씩',
      body: [
        '보안은 새로 만드는 것이 아니라, 앞 챕터에서 배운 것을 <b>층마다 빠짐없이</b> 거는 일입니다. 사람은 SSO와 MFA, 워크로드는 토큰 교환, 비밀값은 클라우드별 KMS와 시크릿 서비스, 네트워크는 최소 개방, 이미지는 서명.',
        '그리고 네 클라우드의 감사 로그(누가 무엇을 했나)를 한곳에서 검색할 수 있게 모읍니다. 공공 존 감사 로그는 공공 존 안에 보관하되 <b>검색과 경보</b>는 함께 봅니다.',
      ],
      callout: { type: 'warn', text: '가장 약한 클라우드가 플랫폼 전체의 보안 수준입니다. 기준은 클라우드마다가 아니라 <b>플랫폼 하나</b>로 정하세요.' },
      hide: ['obs'],
      show: ['entra', 's1', 's2', 's3'],
      panel: {
        title: '층마다 하나씩', icon: 'shield-check',
        rows: [['사람', 'Entra ID SSO · MFA', 'azure'], ['워크로드', '토큰 교환 · 장기 키 0', 'ok'], ['비밀값', '클라우드별 KMS · 시크릿', 'info'], ['네트워크', '최소 개방 · 구간 암호화', 'info'], ['이미지', '서명된 것만 배포', 'ok']],
      },
      flows: [{ path: ['entra', 'aws'], kind: 'ctrl' }, { path: ['entra', 'gcp'], kind: 'ctrl', delay: 0.4 }, { path: ['entra', 'ncp'], kind: 'ctrl', delay: 0.8 }],
      more: [
        { title: '클라우드별 도구', rows: [
          ['AWS', 'KMS · Secrets Manager · CloudTrail', 'aws'],
          ['Azure', 'Entra ID 로그인 · 감사 로그', 'azure'],
          ['GCP', 'Cloud KMS · Secret Manager · 감사 로그', 'gcp'],
          ['NCP', '키 관리 · 감사 로그 서비스 (범위 확인)', 'ncp'],
        ] },
        { title: '비밀값의 흐름', body: [
          '비밀값은 Git에 두지 않고 각 클라우드의 시크릿 서비스에 둡니다. 클러스터는 External Secrets Operator 같은 도구로 시크릿을 읽어 Kubernetes Secret으로 만들고, 그 도구는 Pod 신원 연동으로 인증합니다. 암호화 키는 KMS의 <b>봉투 암호화</b>로 데이터 키를 감쌉니다(10장 시크릿과 암호화).',
        ] },
        { title: '분기 점검 목록', list: [
          '만료 없는 비밀(장기 키 · 토큰)의 개수와 이유',
          '비상 계정 로그인 훈련 결과',
          '지난 분기에 추가된 방화벽 · 경로 허용 규칙과 담당자',
          '서명되지 않은 이미지의 배포 시도 기록',
        ] },
      ],
    },
    {
      key: '비용', kind: 'concept', title: '청구서 네 장을 한 표로',
      body: [
        '10장의 FinOps를 네 클라우드에 적용합니다. 먼저 <b>공통 태그 키</b>(<code>service</code> · <code>env</code> · <code>team</code>)를 정해 모든 리소스에 붙이고(GCP는 라벨), 청구 데이터를 한 표로 모읍니다. FOCUS 같은 공통 청구 형식이 도움이 됩니다.',
        '가장 큰 변수는 <b>클라우드 간 전송</b>입니다. 허브를 지나는 양을 대시보드에 올리고, 약정 할인은 클라우드마다 꾸준한 기준선에만 겁니다. 사용량이 나뉘어 있어 과하게 걸면 남습니다.',
      ],
      callout: { type: 'tip', text: '개발 · 스테이징 환경은 밤과 주말에 끄고, 끊겨도 되는 배치 작업에는 스팟을 씁니다.' },
      hide: ['entra', 's1', 's2', 's3'],
      show: ['hub'],
      tags: [
        { on: 'aws', text: 'service=shop', icon: 'tag', tone: 'aws' },
        { on: 'gcp', text: 'service=analytics', icon: 'tag', tone: 'gcp', pos: 'bottom' },
        { on: 'ncp', text: 'service=gov', icon: 'tag', tone: 'ncp', pos: 'bottom' },
      ],
      flows: [{ path: ['aws', 'hub', 'gcp'], kind: 'data', n: 2 }],
      metrics: { egress: ['예산 안', 'ok'] },
      more: [
        { title: '태그 강제하기', body: ['태그는 붙이라고 말하는 것보다 Terraform에서 기본값으로 넣는 편이 확실합니다.'], code: { title: 'providers.tf', lang: 'hcl', text: `provider "aws" {
  default_tags {
    tags = {
      service = "shop"
      env     = "prod"
      team    = "commerce"
    }
  }
}
provider "google" {
  default_labels = { service = "analytics", env = "prod" }
}` } },
        { title: '비용 표의 열', list: [
          '클라우드 · 계정(구독 · 프로젝트 · Sub Account)',
          '서비스 태그 · 환경 · 팀',
          '항목 분류: 컴퓨트 · 스토리지 · <b>데이터 전송</b> · 관리형 서비스 · 지원료',
          '약정 할인 적용분과 미사용분',
        ] },
        { title: '흔한 실수', body: [
          '네 클라우드의 약정 할인을 각자 최대치로 거는 것입니다. 워크로드가 클라우드 사이를 옮겨 가면 한쪽 약정이 놀게 돼요. 약정은 <b>몇 달 동안 줄지 않은 최소 사용량</b>에만 걸고, 나머지는 온디맨드와 스팟으로 둡니다.',
        ] },
      ],
    },
    {
      key: 'DR', kind: 'solution', title: '재해 복구: 먼저 같은 클라우드 안에서',
      body: [
        '10장의 RTO · RPO로 워크로드마다 등급을 매깁니다. 글로벌 쇼핑몰은 <b>AWS의 다른 리전</b>에 웜 스탠바이를 두고 DB를 비동기로 복제하며, GSLB가 헬스 체크로 넘깁니다. 다른 클라우드보다 <b>다른 리전</b>이 먼저입니다.',
        '공공 서비스는 NCP 안의 백업과 복원으로, 분석은 원천에서 다시 만드는 것으로 충분합니다. 그리고 분기마다 실제로 넘겨 보는 <b>훈련</b>을 합니다.',
      ],
      callout: { type: 'warn', text: '연습하지 않은 DR은 없는 것과 같습니다. 훈련에서 잰 시간이 곧 진짜 RTO입니다.' },
      hide: ['gcp', 'ncp', 'hub'],
      show: ['users', 'aws2'],
      set: { aws: { state: 'down', badge: '리전 장애', tone: 'bad' } },
      tags: [{ on: 'users', text: 'GSLB · TTL 60초', icon: 'compass' }, { on: 'aws2', text: 'RPO 5분 이내', tone: 'ok', pos: 'bottom' }],
      flows: [
        { path: ['aws', 'aws2'], kind: 'sync', n: 2 },
        { path: ['users', 'aws'], kind: 'bad', n: 2, delay: 1 },
        { path: ['users', [1.6, 1.6], 'aws2'], kind: 'req', n: 3, delay: 2 },
      ],
      metrics: { rto: ['목표 1시간', 'warn'] },
      changes: [['+', 'AWS 다른 리전 웜 스탠바이'], ['+', 'GSLB 헬스 체크 전환'], ['~', 'DB 비동기 복제 · RPO 5분']],
      more: [
        { title: '워크로드별 DR 등급', rows: [
          ['글로벌 쇼핑몰', 'RTO 1시간 · RPO 5분 · 웜 스탠바이', 'aws'],
          ['공공 서비스', '계약 기준 · NCP 안 백업 · 복원', 'ncp'],
          ['분석', 'RTO 하루 · 원천에서 재생성', 'gcp'],
          ['ID (Entra ID)', '사업자 SLA · 비상 계정으로 대비', 'azure'],
        ] },
        { title: '전환 순서 (런북의 뼈대)', list: [
          '장애 판단: 누가, 어떤 지표로 전환을 결정하는가',
          'DB: DR 리전 복제본을 원본으로 승격',
          '앱: eks-dr의 레플리카를 운영 규모로 늘림',
          '입구: GSLB가 DR 쪽을 가리키는지 확인(자동이 아니면 수동 전환)',
          '확인: 주문 · 결제 핵심 흐름 점검 후 공지',
        ] },
        { title: '더 생각해 볼 것', body: [
          '다른 클라우드로의 DR은 <b>사업자 전체 장애</b>나 계정 정지 같은 위험을 감독 기관이나 경영진이 요구할 때 검토합니다. 그때도 첫걸음은 백업을 다른 클라우드에 보관하는 것처럼 작게 시작하는 것이 현실적이에요.',
        ] },
      ],
    },
    {
      key: '훈련 사례', kind: 'case', title: '사례: 첫 DR 훈련은 3시간 걸렸습니다',
      body: [
        '첫 분기 훈련에서 DR 리전으로 넘기는 데 <b>3시간</b>이 걸렸습니다. DR 리전 레지스트리에 최신 이미지가 없어 Pod가 뜨지 않았고, DB 비밀번호가 원래 리전의 시크릿 서비스에만 있었으며, 런북의 DB 승격 명령은 반년 전 구성 기준이었어요.',
        '고친 뒤 다시 훈련하니 <b>50분</b>이 걸렸습니다. 목표 1시간은 이제 문서의 숫자가 아니라 <b>잰 숫자</b>입니다.',
      ],
      callout: { type: 'key', text: '훈련은 실패하라고 하는 것입니다. 실제 장애 날이 아니라 <b>훈련 날</b>에 구멍을 찾은 것이 성공입니다.' },
      set: { aws2: { state: 'hot', badge: '전환 3시간', tone: 'bad' } },
      tags: [{ on: 'aws2', text: '이미지 · 시크릿 없음', tone: 'bad', icon: 'ban', pos: 'bottom' }],
      flows: [{ path: ['users', 'aws'], kind: 'bad', n: 2 }, { path: ['users', [1.6, 1.6], 'aws2'], kind: 'bad', n: 2, delay: 0.8 }],
      metrics: { rto: ['첫 훈련 3시간', 'bad'] },
      changes: [['+', '레지스트리 · 시크릿 리전 간 복제'], ['~', '런북을 스크립트로 · 매 훈련 갱신'], ['~', '재훈련: 3시간 → 50분']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['Pod ImagePullBackOff', 'ECR 리전 간 복제 꺼짐 → 켬', 'bad'],
          ['앱이 DB에 로그인 실패', '시크릿 리전 복제 없음 → 복제본 생성', 'bad'],
          ['DB 승격 명령 실패', '런북이 옛 구성 → 스크립트화 · CI 검증', 'warn'],
          ['전환 결정에 40분', '판단 기준 없음 → 지표 · 권한자 명시', 'warn'],
        ] },
        { title: '훈련 기록 남기기', code: { title: 'dr-drill-2026Q4.md', lang: 'text', text: `시작          09:00  주 리전 트래픽 차단
판단 완료     09:12  (기준: 오류율 > 50% 5분)
DB 승격       09:20
앱 확장 완료  09:41
GSLB 전환     09:44
핵심 흐름 OK  09:50  → 측정 RTO 50분
잃은 주문     0건    → 측정 RPO 2분 이내
다음 개선     승격 · 확장을 병렬로` } },
        { title: '실무 팁', body: [
          'DR 환경이 운영을 따라오게 하는 가장 확실한 방법은 <b>평소에도 쓰는 것</b>입니다. eks-dr을 GitOps 순서의 첫 번째 배포 대상으로 두면, 새 버전은 늘 DR에서 먼저 뜨고 이미지 · 설정 누락이 평소에 드러납니다.',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 코스 전체가 한 장에',
      body: [
        '요구에서 클라우드와 패턴을 고르고, <b>주소 → 경로 → 신원 → 클러스터 → 코드 → 파이프라인 → 데이터 경계 → 관측 · 보안 · 비용 → DR과 훈련</b> 순서로 쌓았습니다. 조각 하나하나가 이 코스의 챕터입니다.',
        '다음 공부로는 서비스 메시와 정책 코드(OPA · Kyverno), SRE와 카오스 엔지니어링, 그리고 이 모든 것을 개발자에게 셀프서비스로 내주는 <b>플랫폼 엔지니어링</b>을 권합니다. 작게라도 직접 만들어 보는 것이 가장 빠른 길입니다.',
      ],
      callout: { type: 'tip', text: 'AWS SAA, CKA, Terraform Associate 같은 자격증은 배운 것을 점검하는 지도로 쓰세요.' },
      hide: ['users', 'aws2'],
      show: ['gcp', 'ncp', 'hub', 'gov', 'entra'],
      set: { aws: { state: null, badge: null }, aws2: { state: null, badge: null } },
      panel: {
        title: '코스 지도', icon: 'map',
        rows: [
          ['01–02 기초 · IP', '주소 계획', 'mute'], ['03–04 네트워크 · IAM', '허브 · 신원', 'info'], ['05 4대 클라우드', '요구별 배치', 'accent'],
          ['06–07 Docker · K8s', 'EKS · NKS', 'info'], ['08–09 IaC · CI/CD', '모듈 · GitOps', 'ok'], ['10–11 운영 · 통합', '관측 · DR · 설계', 'warn'],
        ],
      },
      focus: ['hub'],
      metrics: { rto: ['50분 · 훈련함', 'ok'] },
      flows: [
        { path: ['gov', 'ncp'], kind: 'req', n: 2 },
        { path: ['aws', 'hub', 'gcp'], kind: 'data', delay: 0.6 }, { path: ['ncp', 'hub', 'gcp'], kind: 'data', delay: 1 },
      ],
    },
  ],
  quiz: [
    {
      q: '설계 회의에서 "Azure에도 쇼핑몰 대기 환경을 하나 두자"는 의견이 나왔습니다. 요구 목록에는 사업자 전체 장애 대비가 없습니다. 가장 알맞은 판단은?',
      options: [
        '대비는 많을수록 좋으니 바로 추가한다',
        '근거가 되는 요구가 없으므로 넣지 않고, 그런 요구가 생기면 비용과 함께 재검토한다',
        'Azure를 아예 쓰지 않도록 Entra ID도 다른 IdP로 바꾼다',
        '쇼핑몰을 Azure로 옮기고 AWS를 대기로 둔다',
      ],
      answer: 1, step: 2,
      why: '배치표의 줄마다 요구 번호가 있어야 합니다. 다른 클라우드 대기 환경은 이미지 · 네트워크 · ID · 복제 · 훈련을 모두 한 벌씩 늘립니다. 요구가 생기면 그때 비용과 함께 판단합니다.',
    },
    {
      q: '이 설계에서 GCP에 Kubernetes 클러스터를 두지 않은 이유로 가장 알맞은 것은?',
      options: [
        'GCP는 Kubernetes를 지원하지 않아서',
        '분석은 관리형 BigQuery가 더 잘하고, 클러스터를 둘 요구가 없어서',
        '클러스터는 클라우드마다 하나만 둘 수 있어서',
        'GCP에는 전용선이 없어서',
      ],
      answer: 1, step: 5,
      why: '옮기기 쉬운 층은 값어치를 하는 곳에만 둡니다. 분석 요구는 관리형 서비스가 더 잘 풀고, 클러스터를 두면 운영 부담만 늘어납니다. 모든 곳에 Kubernetes를 깔아야 멀티클라우드인 것은 아닙니다.',
    },
    {
      q: '공공 존을 허브에 연결하기 직전입니다. 가장 먼저 확인할 것은?',
      options: [
        '허브 라우터의 색상',
        '공공 존에 허용되는 외부 연결 방식과, 허브가 공공 대역을 어느 스포크에만 광고할지',
        'GCP 리전의 개수',
        'Argo CD의 버전',
      ],
      answer: 1, step: 3,
      why: '공공 존은 외부 연결 자체에 조건이 붙을 수 있고, 연결이 생기면 데이터는 막지 않는 한 흐릅니다. 허용 방식과 경로 광고 범위를 먼저 정해야 뒤의 데이터 경계가 성립합니다.',
    },
    {
      q: '플랫폼 점검에서 "만료가 없는 비밀"을 세어 보니 CI의 클라우드 액세스 키 2개가 나왔습니다. 가장 알맞은 조치는?',
      options: [
        '키를 더 긴 것으로 바꾼다',
        '키를 CI 변수에 암호화해 두었으니 그대로 둔다',
        'CI의 OIDC 토큰을 각 클라우드 역할로 교환하도록 바꾸고 키를 삭제한다',
        '키를 사람에게 나눠 준다',
      ],
      answer: 2, step: 4,
      why: '목표는 비상 계정 외에 장기 키를 두지 않는 것입니다. CI도 워크로드처럼 OIDC 토큰 교환으로 짧게 사는 자격을 받을 수 있습니다. 암호화해 저장해도 유출되면 만료 없이 통합니다.',
    },
    {
      q: '네 클라우드 인프라를 Terraform 하나의 state로 관리하자는 의견이 나왔습니다. 가장 큰 문제는?',
      options: [
        'Terraform은 한 state에 여러 프로바이더를 넣을 수 없다',
        'state 파일이 너무 커져서 Git에 올릴 수 없다',
        '모듈을 쓸 수 없게 된다',
        '한 클라우드의 오류나 잠금이 나머지 변경까지 막고, 실수 한 번의 반경과 접근 권한이 네 클라우드 전체로 넓어진다',
      ],
      answer: 3, step: 6,
      why: '한 state에 여러 프로바이더를 넣는 것은 가능하지만, 실패와 권한의 반경이 커집니다. 환경마다 state를 나누면 공공 존 state에만 접근을 제한하는 것도 쉽습니다. state는 원래 Git이 아니라 잠금이 되는 원격 백엔드에 둡니다.',
    },
    {
      q: '보안 규정상 NCP 공공 존의 NKS에 바깥 관리 클러스터의 Argo CD가 접속할 수 없습니다. 가장 좋은 방법은?',
      options: [
        'NKS 배포만 사람이 kubectl로 직접 한다',
        '규정 예외를 받아 Argo CD에 클러스터 관리자 권한을 준다',
        'NKS 안에 Argo CD를 따로 두고, 같은 Git 저장소의 공공 존 overlay를 당겨 오게 한다',
        '공공 서비스를 EKS로 옮긴다',
      ],
      answer: 2, step: 7,
      why: 'GitOps는 클러스터가 Git을 당겨 오는 방식이라 바깥에서 들어오는 연결이 없어도 됩니다. 같은 Git을 기준으로 삼으니 배포 방식도 하나로 유지됩니다. 손 배포는 드리프트를 만들고, 공공 서비스를 옮기면 처음의 규제 요구를 어깁니다.',
    },
    {
      q: 'AWS와 NCP 레지스트리에 이미지를 보낼 때, 각 레지스트리용으로 따로 빌드하자는 제안이 있습니다. 무엇이 문제인가?',
      options: [
        '빌드 시점이 달라 같은 태그라도 내용이 달라질 수 있어, 검증한 이미지와 배포된 이미지가 같다는 보장이 사라진다',
        '레지스트리가 하나만 있어야 한다',
        '이미지 서명이 불가능해진다',
        '문제없다. 오히려 더 안전하다',
      ],
      answer: 0, step: 7,
      why: '한 번 빌드하고 같은 digest로 복사해야 어디서나 같은 것이 돕니다. 따로 빌드하면 의존성 버전이나 기반 이미지가 달라질 수 있습니다.',
    },
    {
      q: '분석팀이 공공 고객 행동을 분석하고 싶어 합니다. 원본은 NCP 공공 존에 있고 분석은 GCP BigQuery에서 합니다. 가장 타당한 방법은?',
      options: [
        '허브 경로가 있으니 공공 DB를 GCP로 실시간 복제한다',
        '암호화만 하면 원본을 GCP에 둬도 된다',
        '분석을 포기하고 공공 데이터는 아무 데도 쓰지 않는다',
        'NCP 안에서 비식별 · 집계한 결과만 GCP로 보내고, 공공 DB → GCP 경로는 막아 둔다',
      ],
      answer: 3, step: 9,
      why: '데이터 경계는 원본 위치와 밖으로 나갈 수 있는 형태로 정합니다. 경로가 열려 있다는 것은 허용과 다르고, 암호화해도 데이터가 인증 범위 밖에 놓이는 것은 그대로입니다. 결과만 내보내면 규제와 분석이 함께 성립합니다.',
    },
    {
      q: '공공 데이터가 GCP로 복제된 사실을 월말 청구서를 보고서야 알았습니다. 더 빨리 알아차리려면 무엇을 해 뒀어야 할까?',
      options: [
        '청구서를 주 단위로 출력한다',
        '허브 구간별 전송량을 대시보드에 올리고, 공공 대역에서 나가는 흐름에 경보를 건다',
        '분석팀의 권한을 모두 없앤다',
        'GCP 계정을 삭제한다',
      ],
      answer: 1, step: 8,
      why: '네트워크가 이어지면 데이터는 막지 않는 한 흐르므로, 막는 규칙과 함께 흐름을 보는 눈이 필요합니다. 구간별 전송량과 흐름 로그 경보가 있으면 첫날 발견할 수 있습니다.',
    },
    {
      q: '중앙 Grafana로 모든 로그를 보내려는데, 공공 존 로그에는 개인정보가 섞일 수 있습니다. 가장 알맞은 설계는?',
      options: [
        '공공 존 로그는 NCP 안에 보관하고, 중앙으로는 메트릭과 집계된 지표만 보낸다',
        '모든 로그를 그대로 중앙으로 보낸다',
        '공공 존에서는 로그를 남기지 않는다',
        '로그를 암호화해서 해외 리전의 SaaS로 보낸다',
      ],
      answer: 0, step: 10,
      why: '관측 데이터도 데이터라서 레지던시와 비용을 함께 따져야 합니다. 로그를 안 남기면 감사와 장애 분석이 불가능하고, 해외 SaaS로 보내면 위치 요건을 어길 수 있습니다.',
    },
    {
      q: '네 클라우드 중 한 곳만 MFA가 선택 사항으로 남아 있습니다. 나머지 셋은 필수입니다. 이 플랫폼의 실질적인 보안 수준은?',
      options: [
        '셋이 필수이니 75% 수준이다',
        '가장 약한 곳, 즉 MFA가 선택인 곳의 수준이다',
        '가장 강한 곳의 수준이다',
        'MFA는 보안 수준과 관계없다',
      ],
      answer: 1, step: 11,
      why: '공격자는 가장 약한 입구를 고릅니다. 그래서 기준은 클라우드마다가 아니라 플랫폼 하나로 정하고, 연합으로 MFA를 IdP 한곳에서 강제하는 것이 효과적입니다.',
    },
    {
      q: '네 클라우드의 약정 할인을 각자 최대치로 걸자는 제안이 있습니다. 가장 알맞은 판단은?',
      options: [
        '할인은 많을수록 좋으니 최대치로 건다',
        '약정은 위험하니 아예 쓰지 않는다',
        '몇 달 동안 줄지 않은 최소 사용량에만 걸고, 나머지는 온디맨드와 스팟으로 둔다',
        '한 클라우드에만 모든 약정을 건다',
      ],
      answer: 2, step: 12,
      why: '사용량이 클라우드에 나뉘어 있고 워크로드가 옮겨 갈 수 있어, 과하게 건 약정은 놀게 됩니다. 꾸준한 기준선에만 걸면 할인을 받으면서 남는 약정을 피할 수 있습니다.',
    },
    {
      q: 'AWS에서 도는 글로벌 쇼핑몰의 목표는 RTO 1시간 · RPO 5분입니다. 첫 DR 설계로 가장 알맞은 것은?',
      options: [
        'Azure에 같은 구성을 두 벌로 올려 액티브-액티브로 돌린다',
        '매일 밤 백업을 같은 리전의 다른 버킷에 저장한다',
        '관리형 서비스는 알아서 복구되니 DR은 필요 없다',
        'AWS의 다른 리전에 웜 스탠바이와 비동기 DB 복제를 두고, GSLB 전환을 정기적으로 훈련한다',
      ],
      answer: 3, step: 13,
      why: '흔한 장애는 AZ · 리전 단위라 같은 사업자의 다른 리전이 가장 싸고 단순한 답입니다. 다른 클라우드의 액티브-액티브는 비용과 데이터 일관성 부담이 크고, 같은 리전 백업으로는 리전 장애를 못 막고 RPO 5분도 지키기 어렵습니다.',
    },
    {
      q: '첫 DR 훈련에서 DR 리전의 Pod가 ImagePullBackOff로 뜨지 않았고 DB 비밀번호도 찾지 못했습니다. 재발을 막는 가장 근본적인 방법은?',
      options: [
        '레지스트리와 시크릿을 리전 간 복제하고, DR 클러스터를 GitOps 배포 순서의 첫 대상으로 두어 평소에도 쓰게 한다',
        '장애 때 이미지를 손으로 복사하는 절차를 런북에 추가한다',
        'DR 훈련을 그만둔다',
        'Pod의 재시작 횟수를 늘린다',
      ],
      answer: 0, step: 14,
      why: 'DR 환경이 운영을 따라오지 못한 것이 원인입니다. 복제를 켜고 DR을 평소 배포의 첫 대상으로 쓰면 누락이 평소에 드러납니다. 손 절차는 장애 중의 혼란에서 빠지기 쉽고, 재시작을 늘려도 없는 이미지는 생기지 않습니다.',
    },
  ],
};
