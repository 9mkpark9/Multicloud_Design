export default {
  id: 'service-mapping',
  learn: [
    '이름이 아니라 역할로 대응 서비스 찾기',
    '아홉 칸 번역: 컴퓨트부터 IaC · CI까지',
    '이름은 같아도 범위가 다른 VPC · 서브넷 · LB',
    '계정 계층과 권한 모델의 차이',
    '한 클라우드에서 배운 것을 옮기는 다섯 질문',
  ],
  legend: [['ctrl', '역할 → 이름 찾기'], ['bad', '잘못 옮긴 가정']],
  metrics: [
    { id: 'cat', label: '번역한 범주', icon: 'list' },
    { id: 'trap', label: '찾은 차이', icon: 'warn' },
    { id: 'how', label: '찾는 방법', icon: 'search' },
  ],
  scene: {
    nodes: {
      role: { at: [0.6, 0.6], label: '역할', sub: '가상 서버', icon: 'target', color: 'slate' },
      aws: { at: [0, 4.8], label: 'AWS', sub: '지금 운영 중', icon: 'cloud', color: 'aws' },
      azure: { at: [1.6, 3.2], label: 'Azure', sub: '고객사 표준', icon: 'cloud', color: 'azure' },
      gcp: { at: [3.2, 1.6], label: 'GCP', sub: '분석팀 요구', icon: 'cloud', color: 'gcp' },
      ncp: { at: [4.8, 0], label: 'NCP', sub: '공공 고객', icon: 'cloud', color: 'ncp' },
    },
    edges: {
      r_aws: { from: 'role', to: 'aws' },
      r_az: { from: 'role', to: 'azure' },
      r_gcp: { from: 'role', to: 'gcp' },
      r_ncp: { from: 'role', to: 'ncp' },
    },
  },
  steps: [
    {
      key: '번역 숙제', kind: 'problem', title: '같은 구성을 세 클라우드로 그려 오세요',
      body: [
        'shop.example은 AWS에서 돕니다. 이번 분기에 요구가 셋 생겼어요. 공공기관 고객 데이터는 규제 때문에 <b>NCP</b>에, 분석팀은 <b>GCP</b>의 BigQuery를, 큰 고객사는 자기 회사 표준인 <b>Azure</b>를 원합니다.',
        '팀장이 말합니다. "지금 AWS 구성도를 세 클라우드 버전으로 그려 와요." EC2, RDS, S3를 검색창에 그대로 넣어 보지만, 같은 이름은 거의 나오지 않습니다.',
      ],
      callout: { type: 'warn', text: '이름이 같다고 같은 물건도 아닙니다. 네 곳 중 세 곳이 <b>VPC</b>라는 이름을 쓰지만 범위가 서로 다릅니다. 뒤에서 확인합니다.' },
      show: ['aws', 'azure', 'gcp', 'ncp'],
      set: { azure: { state: 'dim' }, gcp: { state: 'dim' }, ncp: { state: 'dim' } },
      focus: ['aws'],
      tags: [
        { on: 'aws', text: 'EC2 · RDS · S3 …', icon: 'server' },
        { on: 'azure', text: '"EC2" 검색 결과 없음', tone: 'bad', pos: 'bottom' },
      ],
      metrics: { cat: '0 / 9', trap: '0개', how: ['이름 검색', 'bad'] },
    },
    {
      key: '역할로 찾기', kind: 'solution', title: '이름이 아니라 역할로 찾습니다',
      body: [
        '번역의 출발점은 <b>"이 서비스가 하는 일"</b>입니다. EC2는 가상 서버를 빌려 주는 서비스이니, 다른 클라우드에서도 가상 서버 칸을 찾으면 됩니다. Azure <b>Virtual Machines</b>, GCP <b>Compute Engine</b>, NCP <b>Server</b>예요.',
        '옆 칸도 같은 요령입니다. 서버 묶음을 부하에 맞춰 늘리고 줄이는 EC2 Auto Scaling은 Azure <b>VM Scale Sets</b>, GCP <b>관리형 인스턴스 그룹(MIG)</b>, NCP <b>Auto Scaling</b>입니다.',
      ],
      callout: { type: 'tip', text: '치트시트의 <b>서비스 매핑</b> 표가 이 번역표입니다. 가로 한 줄이 같은 역할이에요. 실습할 때 옆에 띄워 두세요.' },
      show: ['role'],
      set: {
        azure: { state: null, label: 'Virtual\nMachines', sub: 'Azure' },
        gcp: { state: null, label: 'Compute\nEngine', sub: 'GCP' },
        ncp: { state: null, label: 'Server', sub: 'NCP' },
        aws: { label: 'EC2', sub: 'AWS' },
      },
      focus: ['role'],
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { cat: '1 / 9', how: ['역할 → 이름', 'ok'] },
      changes: [['+', '컴퓨트 칸 번역'], ['~', '이름 검색 → 역할로 찾기']],
    },
    {
      key: '컨테이너·함수', kind: 'concept', title: '컨테이너와 서버리스의 번역',
      body: [
        '컨테이너 칸은 셋입니다. 이미지 보관소인 <b>레지스트리</b>(ECR · ACR · Artifact Registry · Container Registry), 관리형 쿠버네티스(EKS · AKS · GKE · NKS), 클러스터 없이 컨테이너만 맡기는 <b>서버리스 컨테이너</b>(Fargate · Container Apps · Cloud Run)예요.',
        '함수(FaaS)는 Lambda, Azure <b>Functions</b>, GCP <b>Cloud Run functions</b>(옛 이름 Cloud Functions), NCP <b>Cloud Functions</b>입니다.',
      ],
      callout: { type: 'cloud', text: '빈칸도 있습니다. 매핑 표에서 NCP의 서버리스 컨테이너 칸은 "—"예요. 빈칸을 만나면 가장 가까운 대안(NKS나 Server)을 고르고, 운영 방식이 달라지는 만큼 설계에 반영합니다.' },
      set: {
        role: { sub: '함수 (FaaS)' },
        aws: { label: 'Lambda' },
        azure: { label: 'Azure\nFunctions' },
        gcp: { label: 'Cloud Run\nfunctions' },
        ncp: { label: 'Cloud\nFunctions' },
      },
      panel: {
        title: '쿠버네티스 · 서버리스 컨테이너', icon: 'container',
        rows: [['AWS', 'EKS · Fargate', 'aws'], ['Azure', 'AKS · Container Apps', 'azure'], ['GCP', 'GKE · Cloud Run', 'gcp'], ['NCP', 'NKS · —', 'ncp']],
      },
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { cat: '3 / 9' },
      changes: [['+', '컨테이너 칸 번역'], ['+', '서버리스 칸 번역']],
    },
    {
      key: '스토리지·DB', kind: 'concept', title: '스토리지와 DB: 같은 칸, 다른 API',
      body: [
        '오브젝트 스토리지는 S3, Azure <b>Blob Storage</b>, GCP <b>Cloud Storage</b>, NCP <b>Object Storage</b>입니다. 관계형 DB는 RDS, Azure SQL · Azure Database for PostgreSQL, Cloud SQL, NCP <b>Cloud DB</b>예요.',
        '역할이 같아도 <b>API</b>는 다를 수 있습니다. NCP Object Storage는 S3 호환 API를 제공해 S3용 도구를 대부분 그대로 쓰지만, Azure Blob은 API가 달라 SDK와 코드를 바꿔야 합니다. DB는 엔진이 같으면 앱 코드가 거의 그대로 옮겨 갑니다.',
      ],
      callout: { type: 'warn', text: '같은 단어가 다른 뜻이기도 합니다. Azure Blob의 <b>컨테이너</b>는 Docker 컨테이너가 아니라 S3의 <b>버킷</b>에 해당하는 저장 단위예요.' },
      set: {
        role: { sub: '오브젝트 저장' },
        aws: { label: 'S3' },
        azure: { label: 'Blob\nStorage' },
        gcp: { label: 'Cloud\nStorage' },
        ncp: { label: 'Object\nStorage' },
      },
      panel: {
        title: '스토리지 · DB', icon: 'database',
        rows: [['AWS', 'S3 · RDS', 'aws'], ['Azure', 'Blob Storage · Azure SQL', 'azure'], ['GCP', 'Cloud Storage · Cloud SQL', 'gcp'], ['NCP', 'Object Storage · Cloud DB', 'ncp']],
      },
      tags: [{ on: 'ncp', text: 'S3 호환 API', tone: 'ok', icon: 'check', pos: 'bottom' }, { on: 'azure', text: '전용 API', tone: 'warn', pos: 'bottom' }],
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { cat: '5 / 9' },
      changes: [['+', '스토리지 칸 번역'], ['+', 'DB 칸 번역']],
    },
    {
      key: '네트워크', kind: 'concept', title: '네트워크: 이름까지 비슷한 칸',
      body: [
        '가상 네트워크는 AWS · GCP · NCP가 모두 <b>VPC</b>, Azure만 <b>VNet</b>입니다. 방화벽은 Security Group · <b>NSG</b> · <b>VPC 방화벽 규칙</b> · <b>ACG</b>, DNS는 Route 53 · Azure DNS · Cloud DNS · Global DNS로 이어져요.',
        '로드 밸런서가 L7(ALB · Application Gateway · Application Load Balancer)과 L4로 나뉘는 구조도 같습니다. 네트워크는 이름이 가장 비슷한 칸이라 번역이 가장 쉬워 보입니다.',
      ],
      callout: { type: 'warn', text: '그래서 가장 위험합니다. 이름이 같으면 동작도 같다고 믿기 쉬운데, 다음 단계에서 그 믿음이 장애가 됩니다.' },
      set: {
        role: { sub: '가상 네트워크' },
        aws: { label: 'VPC' },
        azure: { label: 'VNet' },
        gcp: { label: 'VPC' },
        ncp: { label: 'VPC' },
      },
      panel: {
        title: '네트워크 · 방화벽', icon: 'network',
        rows: [['AWS', 'VPC · Security Group', 'aws'], ['Azure', 'VNet · NSG', 'azure'], ['GCP', 'VPC · 방화벽 규칙', 'gcp'], ['NCP', 'VPC · ACG', 'ncp']],
      },
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { cat: '6 / 9' },
      changes: [['+', '네트워크 칸 번역']],
    },
    {
      key: '서브넷 범위', kind: 'case', title: '사례: 한 AZ에 몰린 서버들',
      body: [
        'GCP에 익숙한 팀이 AWS에 새 서비스를 올렸습니다. GCP에서 하던 대로 서브넷을 하나만 만들고 서버를 모두 넣었죠. 어느 날 AZ 하나에 장애가 나자 서버가 <b>전부</b> 멈췄습니다.',
        'GCP와 Azure의 서브넷은 <b>리전</b> 범위라 서브넷 하나 안에서도 VM을 여러 영역에 흩어 둘 수 있습니다. AWS와 NCP의 서브넷은 <b>AZ(존) 하나</b>에 속해서, 서브넷이 하나면 서버도 한 AZ에 몰립니다.',
      ],
      callout: { type: 'cloud', text: '범위가 다른 것은 더 있습니다. VPC는 GCP만 <b>글로벌</b>이고, GCP의 외부 애플리케이션 LB는 IP 하나로 여러 리전을 받을 수 있습니다. AWS ALB와 Azure Application Gateway는 <b>리전</b> 자원이에요.' },
      set: {
        role: { sub: '서브넷 범위' },
        aws: { label: 'AZ 1개', sub: 'AWS 서브넷', state: 'hot' },
        azure: { label: '리전', sub: 'Azure 서브넷' },
        gcp: { label: '리전', sub: 'GCP 서브넷' },
        ncp: { label: '존 1개', sub: 'NCP 서브넷' },
      },
      panel: {
        title: '같은 이름, 다른 범위', icon: 'map',
        rows: [['AWS', 'VPC 리전 · 서브넷 AZ', 'aws'], ['Azure', 'VNet 리전 · 서브넷 리전', 'azure'], ['GCP', 'VPC 글로벌 · 서브넷 리전', 'gcp'], ['NCP', 'VPC 리전 · 서브넷 존', 'ncp']],
      },
      focus: ['aws'],
      tags: [{ on: 'aws', text: 'AZ 장애 = 전부 중단', tone: 'bad', icon: 'x', pos: 'bottom' }],
      flows: [{ path: ['role', 'aws'], kind: 'bad', n: 2 }],
      metrics: { trap: ['2개', 'warn'], how: '역할 + 범위' },
      changes: [['+', 'AZ마다 서브넷 하나씩'], ['~', '확인할 것: 서브넷 · VPC · LB 범위']],
    },
    {
      key: '권한·관측', kind: 'concept', title: '권한 · 관측 · 자동화의 번역',
      body: [
        '권한은 AWS <b>IAM</b>, Azure <b>Entra ID</b>(신원) + <b>Azure RBAC</b>(권한), GCP <b>IAM</b>, NCP <b>Sub Account</b>가 맡습니다. 지표·로그·알람은 CloudWatch · <b>Azure Monitor</b> · <b>Cloud Monitoring</b> · <b>Cloud Insight</b>예요.',
        'IaC는 사업자마다 자체 도구(CloudFormation · Bicep · Infrastructure Manager)가 있지만 NCP에는 그 칸이 없고, 네 곳 모두 <b>Terraform</b>을 씁니다. CI/CD도 사업자 도구가 있지만, 멀티클라우드에서는 GitHub Actions처럼 클라우드 밖의 도구 하나로 모으는 경우가 많습니다.',
      ],
      set: {
        role: { sub: 'ID · 권한' },
        aws: { label: 'IAM', sub: 'AWS', state: null },
        azure: { label: 'Entra ID', sub: 'Azure · RBAC' },
        gcp: { label: 'IAM', sub: 'GCP' },
        ncp: { label: 'Sub\nAccount', sub: 'NCP' },
      },
      panel: {
        title: '권한 · 관측', icon: 'key',
        rows: [['AWS', 'IAM · CloudWatch', 'aws'], ['Azure', 'Entra ID · Azure Monitor', 'azure'], ['GCP', 'IAM · Cloud Monitoring', 'gcp'], ['NCP', 'Sub Account · Cloud Insight', 'ncp']],
      },
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { cat: ['9 / 9', 'ok'] },
      changes: [['+', '권한 · 모니터링 칸 번역'], ['+', 'IaC는 Terraform으로 공통']],
    },
    {
      key: '계정·권한', kind: 'compare', title: '같은 "역할"이라는 말, 다른 모델',
      body: [
        '리소스를 담는 경계부터 다릅니다. AWS는 <b>계정</b>, Azure는 <b>구독</b>(그 안에 리소스 그룹), GCP는 <b>프로젝트</b>가 격리와 과금의 단위이고, NCP는 메인 계정 아래에 서브 계정을 둡니다.',
        '권한을 주는 방식도 다릅니다. AWS는 JSON <b>정책</b>을 사용자·역할에 붙이고, Azure는 주체·역할·<b>범위</b>를 묶어 역할 할당을 만들며, GCP는 리소스 계층에 주 구성원과 역할을 <b>바인딩</b>합니다.',
      ],
      callout: { type: 'tip', text: 'AWS의 "역할(Role)"은 맡을 수 있는 <b>신원</b>이고, Azure·GCP의 "역할"은 <b>권한 묶음</b>입니다. 같은 단어가 무엇을 가리키는지 먼저 확인하세요.' },
      set: {
        role: { sub: '격리 단위' },
        aws: { label: 'Account', sub: 'AWS' },
        azure: { label: '구독', sub: 'Azure' },
        gcp: { label: 'Project', sub: 'GCP' },
        ncp: { label: '메인 계정', sub: 'NCP' },
      },
      panel: {
        title: '권한을 주는 방식', icon: 'key',
        rows: [['AWS', '정책(JSON) → 사용자 · 역할', 'aws'], ['Azure', '주체 + 역할 + 범위 = 할당', 'azure'], ['GCP', '주 구성원 ↔ 역할 바인딩', 'gcp'], ['NCP', '정책 → 서브 계정 · 그룹', 'ncp']],
      },
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { trap: ['4개', 'warn'], how: '역할 · 범위 · 경계' },
      changes: [['+', '차이: 계정 계층'], ['+', '차이: 권한 모델']],
    },
    {
      key: '옮기는 법', kind: 'concept', title: '새 클라우드를 배우는 다섯 질문',
      body: [
        '한 클라우드를 제대로 배웠다면 나머지는 <b>차이만</b> 배우면 됩니다. 새 서비스를 만나면 물어보세요. 무슨 <b>역할</b>인가, <b>범위</b>는 글로벌·리전·존 중 어디인가, 어떤 <b>경계</b> 안에 사는가, <b>권한</b>은 어떻게 주는가, <b>과금</b>은 무엇으로 재는가.',
        '공통 표준 위에서 배운 것은 거의 그대로 옮겨 갑니다. 컨테이너 이미지, 쿠버네티스, PostgreSQL, S3 호환 API가 그렇습니다. EKS든 NKS든 <code>kubectl</code>은 같아요.',
      ],
      callout: { type: 'key', text: 'Terraform도 공통 도구지만 리소스 정의는 사업자마다 따로 씁니다. 도구가 같다고 차이가 사라지지는 않아요. 이 이야기는 Terraform 챕터에서 이어집니다.' },
      set: {
        role: { sub: '공통 표준' },
        aws: { label: 'EKS', sub: 'AWS' },
        azure: { label: 'AKS', sub: 'Azure' },
        gcp: { label: 'GKE', sub: 'GCP' },
        ncp: { label: 'NKS', sub: 'NCP' },
      },
      panel: {
        title: '다섯 질문', icon: 'steps',
        rows: [['역할', '무슨 일을 하는가', 'info'], ['범위', '글로벌 · 리전 · 존', 'info'], ['경계', '계정 · 구독 · 프로젝트', 'info'], ['권한', '정책 · 할당 · 바인딩', 'info'], ['과금', '시간 · 요청 · 저장 · 전송', 'info']],
      },
      tags: [{ on: 'role', text: 'kubectl은 같다', tone: 'ok', icon: 'terminal', pos: 'right' }],
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
      metrics: { how: ['다섯 질문', 'ok'] },
    },
    {
      key: '정리', kind: 'recap', title: '정리: 역할로 찾고, 차이를 확인합니다',
      body: [
        '번역은 <b>역할</b>에서 시작합니다. 컴퓨트 · 컨테이너 · 서버리스 · 스토리지 · DB · 네트워크 · 권한 · 관측 · IaC/CI 아홉 칸을 기억하면, 처음 보는 서비스도 어느 칸인지부터 찾을 수 있어요.',
        '그다음 이름이 같아도 다른 곳, 즉 <b>네트워크 범위</b>, <b>계정 계층</b>, <b>권한 모델</b>을 확인합니다. 네 클라우드의 지도는 여기까지입니다. 다음 챕터에서는 어느 클라우드에서나 똑같이 도는 상자, <b>Docker 컨테이너</b>를 다룹니다.',
      ],
      set: {
        role: { sub: '먼저 물을 것' },
        aws: { label: 'AWS', sub: 'Account' },
        azure: { label: 'Azure', sub: '구독' },
        gcp: { label: 'GCP', sub: 'Project' },
        ncp: { label: 'NCP', sub: '메인 계정' },
      },
      focus: ['aws', 'azure', 'gcp', 'ncp'],
      flows: [
        { path: ['role', 'aws'], kind: 'ctrl' }, { path: ['role', 'azure'], kind: 'ctrl', delay: 0.3 },
        { path: ['role', 'gcp'], kind: 'ctrl', delay: 0.6 }, { path: ['role', 'ncp'], kind: 'ctrl', delay: 0.9 },
      ],
    },
  ],
  quiz: [
    {
      q: 'AWS에서 EC2 Auto Scaling 그룹으로 웹 서버 VM을 늘리고 줄이던 구성을 GCP로 옮깁니다. 같은 역할을 하는 것은?',
      options: ['Cloud Run', '관리형 인스턴스 그룹(MIG)', 'GKE Autopilot', 'Cloud Run functions'],
      answer: 1,
      why: 'MIG는 인스턴스 템플릿으로 VM 묶음을 만들고 부하에 맞춰 늘리고 줄입니다. Cloud Run과 GKE도 확장은 하지만 VM이 아니라 컨테이너 단위라 운영 방식 자체가 바뀌고, Cloud Run functions는 함수 서비스입니다.',
    },
    {
      q: 'GCP에서 서브넷 하나에 VM을 여러 영역으로 흩어 두던 설계를 AWS로 옮깁니다. 무엇을 바꿔야 할까요?',
      options: ['그대로 둔다. 서브넷은 어디서나 리전 범위다', 'AZ마다 서브넷을 하나씩 만들고 서버를 나눠 둔다', 'AZ마다 VPC를 하나씩 만든다', 'VPC를 글로벌 모드로 바꾼다'],
      answer: 1,
      why: 'AWS의 서브넷은 AZ 하나에 속합니다. 서브넷이 하나면 서버도 한 AZ에 몰려 AZ 장애에 함께 멈춥니다. VPC는 리전 범위라 AZ마다 나눌 필요가 없고, AWS에는 글로벌 VPC 옵션이 없습니다.',
    },
    {
      q: 'Azure를 처음 쓰는 AWS 엔지니어가 "IAM 정책 JSON은 어디에 붙이나요?"라고 묻습니다. 가장 알맞은 안내는?',
      options: ['Azure에도 같은 IAM 정책이 있으니 사용자에게 붙이면 된다', 'Entra ID의 사용자·그룹에, 구독이나 리소스 그룹 같은 범위를 정해 역할을 할당한다', '리소스마다 액세스 키를 발급해 나눠 준다', 'NSG 규칙에 사용자를 추가한다'],
      answer: 1,
      why: 'Azure는 신원(Entra ID)과 권한(Azure RBAC)이 나뉘고, 권한은 "주체 + 역할 + 범위"로 된 역할 할당으로 줍니다. NSG는 네트워크 트래픽 규칙이라 사용자 권한과 상관이 없습니다.',
    },
    {
      q: '여러 클라우드를 오가야 하는 팀이 먼저 익혀 두면 가장 잘 옮겨 가는 지식은?',
      options: ['각 콘솔의 메뉴 위치', '컨테이너 · 쿠버네티스 · PostgreSQL 같은 공통 표준', '네 사업자의 서비스 이름 전체 암기', '한 사업자 전용 IaC 도구의 문법'],
      answer: 1,
      why: '공통 표준은 어느 클라우드에서나 같은 방식으로 동작합니다. 콘솔 메뉴와 서비스 이름은 자주 바뀌고, 전용 IaC 도구는 그 사업자 밖에서는 쓰지 못합니다.',
    },
  ],
};
