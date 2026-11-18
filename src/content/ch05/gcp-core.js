export default {
  id: 'gcp-core',
  learn: [
    '프로젝트: API 사용 설정 · 리소스 · 청구의 단위',
    '조직 → 폴더 → 프로젝트와 IAM 상속',
    '글로벌 VPC와 리전 범위 서브넷',
    '서비스 계정: 키 파일 없이 워크로드 인증하기',
    '핵심 서비스, 데이터 · 쿠버네티스 강점, gcloud 구성',
  ],
  legend: [['ctrl', 'API 호출 · 권한'], ['data', '데이터'], ['res', '응답'], ['bad', '실패 · 유출']],
  metrics: [
    { id: 'api', label: 'Cloud Run API', icon: 'plug' },
    { id: 'proj', label: '프로젝트', icon: 'box' },
    { id: 'net', label: '리전 간 통신', icon: 'network' },
    { id: 'key', label: '키 파일', icon: 'file-key' },
  ],
  scene: {
    zones: {
      proj: { at: [0, -1.6], size: [5.4, 3.6], label: 'shop-dev (프로젝트)', color: 'gcp' },
      gvpc: { at: [0, -1.8], size: [7.8, 3.9], label: 'VPC shop-vpc (글로벌)', color: 'purple' },
      sn_kr: { at: [0.4, -1.4], size: [3.4, 3], label: 'asia-northeast3 서울', color: 'teal' },
      sn_us: { at: [4, -1.4], size: [3.4, 3], label: 'us-central1 (아이오와)', color: 'blue' },
    },
    nodes: {
      // 프로젝트
      dev: { kind: 'client', at: [-2.8, 0.6], label: '나 (gcloud)' },
      api: { kind: 'tile', at: [1.2, 0], label: 'Cloud Run API', icon: 'plug', color: 'gray' },
      run: { at: [3.8, 0], label: 'Cloud Run', sub: '주문 API', icon: 'container', color: 'gcp' },
      bill: { at: [3.8, -3.4], label: '결제 계정', sub: 'Billing', icon: 'receipt', color: 'yellow' },
      // 계층
      org: { at: [0, 0], label: '조직', sub: 'example.com', icon: 'building', color: 'gcp' },
      f_svc: { at: [3.2, 1.6], label: '폴더', sub: '서비스', icon: 'folder', color: 'sand' },
      f_data: { at: [3.2, -1.6], label: '폴더', sub: '데이터', icon: 'folder', color: 'sand' },
      p_dev: { at: [6.4, 3.2], label: 'shop-dev', sub: '프로젝트', icon: 'box', color: 'green' },
      p_prod: { at: [6.4, 0], label: 'shop-prod', sub: '프로젝트', icon: 'box', color: 'red' },
      p_data: { at: [6.4, -3.2], label: 'shop-data', sub: '프로젝트', icon: 'box', color: 'blue' },
      term: { kind: 'client', at: [1.6, 1.8], label: '터미널' },
      // 글로벌 VPC
      vm_kr: { at: [2, -0.3], label: 'VM', sub: '10.0.1.5', icon: 'server', color: 'gcp' },
      vm_us: { at: [5.6, -0.3], label: 'VM', sub: '10.0.2.7', icon: 'server', color: 'gcp' },
      // 서비스 계정
      c_run: { at: [0, 3.6], label: 'Cloud Run', sub: '주문 API', icon: 'container', color: 'gcp' },
      sa: { kind: 'tile', at: [1.8, 1.8], label: '서비스 계정', icon: 'id-card', color: 'teal' },
      gcs: { kind: 'cyl', at: [3.6, 0], label: 'Cloud Storage', icon: 'archive', color: 'green' },
      keyf: { kind: 'tile', at: [3.6, 4.4], label: 'sa-key.json', icon: 'file-key', color: 'red' },
      thief: { kind: 'client', at: [6.4, 2.4], label: '공격자' },
      // 서비스 지도
      g_ce: { at: [0, 0], label: 'Compute\nEngine', sub: '가상 서버', icon: 'server', color: 'gcp' },
      g_run: { at: [0, -2.6], label: 'Cloud Run', sub: '컨테이너 실행', icon: 'container', color: 'gcp' },
      g_gke: { at: [0, -5.2], label: 'GKE', sub: '쿠버네티스', icon: 'helm', color: 'gcp' },
      g_mon: { at: [0, -7.8], label: 'Cloud\nMonitoring', sub: '지표 · 알림', icon: 'activity', color: 'yellow' },
      g_gcs: { at: [2.6, 0], label: 'Cloud\nStorage', sub: '오브젝트 저장', icon: 'archive', color: 'green' },
      g_sql: { at: [2.6, -2.6], label: 'Cloud SQL', sub: '관리형 DB', icon: 'database', color: 'purple' },
      g_bq: { at: [2.6, -5.2], label: 'BigQuery', sub: '분석 · DW', icon: 'chart-bar', color: 'blue' },
    },
    edges: {
      e_dapi: { from: 'dev', to: 'api' },
      e_apirun: { from: 'api', to: 'run' },
      e_bill: { from: 'run', to: 'bill', style: 'dashed', label: '비용' },
      e_h1: { from: 'org', to: 'f_svc' },
      e_h2: { from: 'org', to: 'f_data' },
      e_h3: { from: 'f_svc', to: 'p_dev' },
      e_h4: { from: 'f_svc', to: 'p_prod' },
      e_h5: { from: 'f_data', to: 'p_data' },
      e_c1: { from: 'term', to: 'p_prod', label: '구성: prod', style: 'dashed' },
      e_c2: { from: 'term', to: 'p_dev', label: '구성: dev' },
      e_int: { from: 'vm_kr', to: 'vm_us', bi: true, tone: 'ok', label: '내부 IP' },
      e_s1: { from: 'c_run', to: 'sa' },
      e_s2: { from: 'sa', to: 'gcs' },
      e_k1: { from: 'sa', to: 'keyf', style: 'dashed', tone: 'bad' },
      e_k2: { from: 'keyf', to: 'thief', tone: 'bad' },
      e_k3: { from: 'thief', to: 'gcs', tone: 'bad' },
    },
  },
  steps: [
    {
      key: 'API 꺼짐', kind: 'problem', title: '명령은 맞는데 API가 꺼져 있습니다',
      body: [
        'GCP에 새 프로젝트를 만들고 컨테이너를 <b>Cloud Run</b>에 올리려 합니다. <code>gcloud run deploy</code>를 쳤더니 권한 오류가 아니라, Cloud Run API가 이 프로젝트에서 <b>사용 설정되어 있지 않다</b>는 메시지가 나옵니다.',
        'AWS에서는 계정을 만들면 서비스가 바로 열려 있었습니다. GCP는 다릅니다. 서비스마다 <b>API를 프로젝트 단위로 켜야</b> 쓸 수 있어요. GCP에서 "프로젝트"가 얼마나 많은 것의 기준인지 보여 주는 첫 관문입니다.',
      ],
      callout: { type: 'tip', text: '<code>gcloud services enable run.googleapis.com</code> 한 줄이면 켜집니다. Terraform으로 만들 때도 API 사용 설정을 코드에 함께 넣어야 새 프로젝트에서 같은 오류를 만나지 않습니다.' },
      show: ['dev', 'proj', 'api'],
      set: { api: { state: 'down' } },
      tags: [{ on: 'api', text: '사용 설정 안 됨', tone: 'bad', pos: 'right' }],
      flows: [{ path: ['dev', 'api'], kind: 'ctrl', n: 2 }, { path: ['api', 'dev'], kind: 'bad', delay: 1.5 }],
      metrics: { api: ['꺼짐', 'bad'], proj: '1개', net: '아직 없음', key: '0개' },
    },
    {
      key: '프로젝트', kind: 'solution', title: '프로젝트: API · 리소스 · 청구의 단위',
      body: [
        '<b>프로젝트</b>는 GCP의 기본 단위입니다. 모든 리소스는 어느 한 프로젝트에 속하고, API 사용 설정, 할당량, IAM 정책이 프로젝트마다 따로 있습니다. 전 세계에서 하나뿐인 <b>프로젝트 ID</b>가 명령과 URL에 계속 등장해요.',
        '요금도 프로젝트 단위로 모입니다. 프로젝트를 <b>결제 계정</b>에 연결해야 유료 서비스를 쓸 수 있고, 결제 계정 하나가 여러 프로젝트의 비용을 냅니다. 청구서에서 "어느 프로젝트가 얼마"가 바로 보입니다.',
      ],
      callout: { type: 'key', text: 'AWS의 계정, Azure의 구독과 같은 자리지만 훨씬 <b>가볍게</b> 만들고 지웁니다. 실습이 끝나면 프로젝트를 통째로 삭제하는 것이 가장 깔끔한 정리입니다.' },
      show: ['run', 'bill'],
      set: { api: { state: 'ok', color: 'teal' } },
      focus: ['run'],
      tags: [{ on: 'api', text: 'API 켜짐', tone: 'ok', icon: 'check' }, { on: 'bill', text: '프로젝트별로 집계', icon: 'receipt' }],
      flows: [{ path: ['dev', 'api', 'run'], kind: 'ctrl', n: 2 }, { path: ['run', 'bill'], kind: 'data', delay: 1.8 }],
      metrics: { api: ['켜짐', 'ok'] },
      changes: [['+', 'Cloud Run API 사용 설정'], ['+', '프로젝트를 결제 계정에 연결'], ['~', '배포 성공']],
    },
    {
      key: '조직 · 폴더', kind: 'concept', title: '조직 → 폴더 → 프로젝트',
      body: [
        '프로젝트가 늘어나면 위에 층을 둡니다. 맨 위는 회사 도메인(Google Workspace 또는 Cloud Identity)에 묶인 <b>조직</b>, 그 아래 부서나 환경을 나누는 <b>폴더</b>, 그 아래가 프로젝트입니다.',
        'IAM 정책은 위에서 아래로 <b>상속</b>됩니다. 조직에 준 뷰어 역할은 모든 프로젝트에 미치고, 프로젝트에 준 역할은 그 안에서만 통합니다. 아래 층에서는 위에서 내려온 허용을 빼지 못하므로, 넓은 역할일수록 위에 걸 때 조심해야 합니다.',
      ],
      callout: { type: 'cloud', text: '같은 자리의 이름: AWS <b>조직 → OU → 계정</b>, Azure <b>관리 그룹 → 구독 → 리소스 그룹</b>. GCP에는 리소스 그룹 같은 층이 따로 없고, 프로젝트가 그 역할까지 합니다.' },
      hide: ['dev', 'proj', 'api', 'run', 'bill'],
      show: ['org', 'f_svc', 'f_data', 'p_dev', 'p_prod', 'p_data'],
      tags: [{ on: 'org', text: '감사팀: 뷰어', icon: 'eye' }, { on: 'p_dev', text: '나: Cloud Run 관리자', tone: 'ok', icon: 'key', pos: 'left' }],
      flows: [{ path: ['org', 'f_svc', 'p_dev'], kind: 'ctrl' }, { path: ['org', 'f_svc', 'p_prod'], kind: 'ctrl', delay: 0.4 }, { path: ['org', 'f_data', 'p_data'], kind: 'ctrl', delay: 0.8 }],
      metrics: { proj: '3개 + 조직' },
      changes: [['+', '프로젝트를 dev · prod · data로 분리'], ['+', '폴더와 조직으로 묶기'], ['~', '권한은 위에서 아래로 상속']],
    },
    {
      key: '글로벌 VPC', kind: 'concept', title: 'VPC 하나가 전 세계에 걸칩니다',
      body: [
        'GCP의 가장 독특한 선택입니다. <b>VPC 네트워크는 글로벌 리소스</b>이고, 그 안의 <b>서브넷이 리전 범위</b>입니다. 서브넷 하나가 리전 안의 모든 영역(zone)에 걸쳐요.',
        '그래서 서울 서브넷의 VM과 아이오와 서브넷의 VM이 같은 VPC 안에서 <b>내부 IP로 바로</b> 통신합니다. AWS라면 리전마다 VPC를 만들고 피어링 등으로 이어야 하는 구성입니다. 방화벽 규칙도 VPC 단위로 걸고, 네트워크 태그나 서비스 계정으로 대상을 고릅니다.',
      ],
      callout: { type: 'warn', text: '새 프로젝트의 <code>default</code> 네트워크는 모든 리전에 서브넷이 자동으로 생기고 SSH를 넓게 여는 규칙이 딸려 옵니다. 실습용으로만 쓰고, 운영은 <b>커스텀 모드</b> VPC로 직접 설계합니다.' },
      hide: ['org', 'f_svc', 'f_data', 'p_dev', 'p_prod', 'p_data'],
      show: ['gvpc', 'sn_kr', 'sn_us', 'vm_kr', 'vm_us'],
      tags: [{ at: [6.2, 2.8], text: '방화벽 규칙은 VPC 단위', icon: 'shield' }, { on: 'vm_us', text: '피어링 · VPN 없이', tone: 'ok' }],
      flows: [{ path: ['vm_kr', 'vm_us'], kind: 'data', n: 2 }, { path: ['vm_us', 'vm_kr'], kind: 'res', n: 2, delay: 1.4 }],
      metrics: { net: ['내부 IP 직통', 'ok'] },
    },
    {
      key: '서비스 계정', kind: 'concept', title: '서비스 계정: 워크로드의 신분증',
      body: [
        '사람은 Google 계정으로 로그인합니다. 그럼 Cloud Run의 코드는 누구의 이름으로 Cloud Storage를 읽을까요? <b>서비스 계정</b>입니다. 사람이 아니라 워크로드가 쓰는 신원이고, 이메일 모양의 이름을 가집니다.',
        '서비스 계정을 Cloud Run 서비스나 VM에 <b>붙이면</b>, 그 안의 코드는 키 파일 없이 그 신원으로 API를 부릅니다. 권한은 서비스 계정에 역할을 부여해 정합니다. AWS에서 Lambda에 IAM 역할을 붙이던 것과 같은 자리예요.',
      ],
      callout: { type: 'warn', text: '따로 지정하지 않으면 쓰이는 <b>기본 서비스 계정</b>은 권한이 넓게 잡혀 있는 경우가 많습니다. 서비스마다 전용 서비스 계정을 만들고 필요한 역할만 주세요.' },
      hide: ['gvpc', 'sn_kr', 'sn_us', 'vm_kr', 'vm_us'],
      show: ['c_run', 'sa', 'gcs'],
      focus: ['sa'],
      tags: [{ on: 'sa', text: '사람이 아닌 워크로드용', icon: 'bot' }, { on: 'gcs', text: '버킷 읽기 역할만', tone: 'ok' }],
      flows: [{ path: ['c_run', 'sa', 'gcs'], kind: 'ctrl', n: 2 }, { path: ['gcs', 'sa', 'c_run'], kind: 'data', n: 2, delay: 1.6 }],
    },
    {
      key: '키 유출', kind: 'case', title: '사례: 깃에 올라간 서비스 계정 키',
      body: [
        '로컬에서 테스트하려고 서비스 계정의 <b>JSON 키 파일</b>을 내려받았고, 그 파일이 설정 파일들과 함께 공개 저장소에 커밋됐습니다. 얼마 뒤 모르는 VM 수십 대가 프로젝트에 떠 있었습니다.',
        '키 파일은 기본적으로 만료되지 않는 비밀번호와 같습니다. 가진 사람은 어디서든 그 서비스 계정이 됩니다. 클라우드 안에서는 서비스 계정을 리소스에 붙이면 키가 필요 없고, 내 PC에서는 <code>gcloud auth application-default login</code>으로 내 계정을 씁니다.',
      ],
      callout: { type: 'tip', text: 'GitHub Actions 같은 클라우드 밖의 시스템은 <b>워크로드 아이덴티티 제휴</b>로 키 없이 인증합니다. 조직 정책으로 키 생성 자체를 막아 두는 팀도 많습니다.' },
      show: ['keyf', 'thief'],
      set: { keyf: { state: 'hot' } },
      tags: [{ on: 'keyf', text: '공개 저장소에 커밋', tone: 'bad', icon: 'git', pos: 'bottom' }, { on: 'thief', text: '키만 있으면 어디서든', tone: 'bad', pos: 'right' }],
      flows: [{ path: ['sa', 'keyf', 'thief'], kind: 'bad', n: 2 }, { path: ['thief', 'gcs'], kind: 'bad', n: 3, delay: 1.8 }],
      metrics: { key: ['1개 유출', 'bad'] },
      changes: [['-', 'JSON 키 파일 (폐기)'], ['+', '서비스 계정은 리소스에 직접 연결'], ['+', '외부 CI는 워크로드 아이덴티티 제휴']],
    },
    {
      key: '서비스 지도', kind: 'concept', title: '핵심 서비스 일곱 개의 자리',
      body: [
        '컴퓨트는 <b>Compute Engine</b>(VM), 컨테이너를 서버 없이 돌리는 <b>Cloud Run</b>, 쿠버네티스 <b>GKE</b>입니다. 데이터는 <b>Cloud Storage</b>(오브젝트), <b>Cloud SQL</b>(관리형 MySQL·PostgreSQL), 분석용 <b>BigQuery</b>, 관측은 <b>Cloud Monitoring</b>이 맡습니다.',
        'AWS 지도와 겹쳐 보면 대부분 자리가 맞습니다. 눈에 띄는 차이는 서버리스의 중심이 함수보다 <b>컨테이너</b>(Cloud Run)라는 점, 그리고 분석 서비스 BigQuery가 맨 앞줄에 있다는 점입니다.',
      ],
      callout: { type: 'tip', text: '로그는 <b>Cloud Logging</b>, 이미지는 <b>Artifact Registry</b>, 메시지는 <b>Pub/Sub</b>. 이름이 기능을 그대로 말해 주는 편이라 찾기 쉽습니다.' },
      hide: ['c_run', 'sa', 'gcs', 'keyf', 'thief'],
      show: ['g_ce', 'g_run', 'g_gke', 'g_mon', 'g_gcs', 'g_sql', 'g_bq'],
      metrics: { key: ['0개', 'ok'] },
    },
    {
      key: '강점', kind: 'concept', title: '데이터와 쿠버네티스가 강한 이유',
      body: [
        '쿠버네티스는 Google이 내부에서 컨테이너를 운영하던 경험에서 나온 오픈소스입니다. <b>GKE</b>는 그 본가답게 완성도가 높고, <b>Autopilot</b> 모드에서는 노드 관리까지 맡기고 Pod가 요청한 자원만큼 냅니다.',
        '<b>BigQuery</b>는 서버를 띄우지 않는 데이터 웨어하우스입니다. 테이블에 SQL을 던지면 끝이고, 기본 요금제는 쿼리가 <b>읽은 데이터 양</b>으로 과금합니다. 주력은 다른 클라우드에 두고 분석만 BigQuery로 하는 팀도 흔합니다.',
      ],
      callout: { type: 'warn', text: '읽은 만큼 낸다는 것은 <code>SELECT *</code> 한 번이 비쌀 수 있다는 뜻입니다. 필요한 열만 고르고, 날짜로 <b>파티션</b>을 나눠 읽는 범위를 줄이세요.' },
      hide: ['g_ce', 'g_run', 'g_mon', 'g_gcs', 'g_sql'],
      focus: ['g_gke', 'g_bq'],
      tags: [
        { on: 'g_gke', text: 'Autopilot: 노드 위임', pos: 'left', icon: 'helm' },
        { on: 'g_bq', text: '서버 없는 웨어하우스', pos: 'right', icon: 'chart-bar' },
        { on: 'g_bq', text: '읽은 데이터만큼 과금', pos: 'bottom', tone: 'warn', icon: 'coins' },
      ],
    },
    {
      key: 'gcloud 구성', kind: 'concept', title: 'gcloud: 구성으로 프로젝트를 바꿉니다',
      body: [
        '<code>gcloud</code> 명령은 <code>gcloud &lt;서비스&gt; &lt;대상&gt; &lt;동작&gt;</code> 모양이고, 모든 명령이 "현재 프로젝트"에 대해 실행됩니다. 현재 값은 <code>gcloud config list</code>로 봅니다.',
        '<b>구성(configuration)</b>은 계정·프로젝트·기본 리전을 묶은 이름표입니다. AWS의 프로파일과 같은 자리예요. <code>dev</code>와 <code>prod</code> 구성을 만들어 두고 <code>activate</code>로 바꾸거나, 한 번만 다른 곳에 실행할 때는 <code>--project</code>를 붙입니다.',
      ],
      callout: { type: 'warn', text: '프로젝트 이름이 비슷하면(<code>shop-dev</code> / <code>shop-prod</code>) 엉뚱한 곳에 배포하기 쉽습니다. 셸 프롬프트에 현재 프로젝트를 표시해 두는 것이 가장 싼 안전장치입니다.' },
      hide: ['g_gke', 'g_bq'],
      show: ['term', 'p_dev', 'p_prod'],
      focus: ['p_dev'],
      flows: [{ path: ['term', 'p_dev'], kind: 'ctrl', n: 2 }],
      code: {
        title: '터미널', lang: 'sh', hl: [1, 2, 3, 13],
        text: `$ gcloud config configurations create dev
$ gcloud config set project shop-dev
$ gcloud config set run/region asia-northeast3

$ gcloud config configurations list
NAME  IS_ACTIVE  ACCOUNT         PROJECT
dev   True       me@example.com  shop-dev
prod  False      me@example.com  shop-prod

$ gcloud services enable run.googleapis.com
$ gcloud run deploy order --source .

$ gcloud config configurations activate prod
$ gcloud run services list --project shop-dev`,
      },
    },
    {
      key: '정리', kind: 'recap', title: '정리: 프로젝트가 모든 것의 기준',
      body: [
        'GCP에서는 <b>프로젝트</b>가 리소스·API·권한·청구의 기준이고, 그 위에 폴더와 조직이 있습니다. 네트워크는 반대로 넓습니다. VPC 하나가 전 세계에 걸치고 서브넷이 리전 단위예요.',
        '워크로드는 키 파일이 아니라 <b>붙인 서비스 계정</b>으로 인증하고, 강점은 GKE와 BigQuery입니다. 다음 레슨은 국내 리전과 공공·금융 규제 대응이 강점인 <b>네이버 클라우드(NCP)</b>입니다.',
      ],
      hide: ['term'],
      show: ['org', 'f_svc', 'f_data', 'p_data'],
      focus: ['p_dev', 'p_prod', 'p_data'],
      flows: [{ path: ['org', 'f_svc', 'p_dev'], kind: 'ctrl' }, { path: ['org', 'f_data', 'p_data'], kind: 'ctrl', delay: 0.5 }],
    },
  ],
  quiz: [
    {
      q: 'Terraform으로 새 GCP 프로젝트에 Cloud SQL을 만들려는데 "API가 사용 설정되지 않았다"는 오류가 납니다. 올바른 이해는?',
      options: ['내 계정의 IAM 역할이 부족하다는 뜻이다', '프로젝트마다 쓸 서비스의 API를 켜야 하는데, 이 프로젝트에서는 아직 켜지 않았다', '결제 계정의 한도를 넘었다', '리전을 잘못 골랐다'],
      answer: 1,
      why: 'GCP는 서비스 API를 프로젝트 단위로 켜야 합니다. 다른 프로젝트에서 잘 되던 코드도 새 프로젝트에서는 API부터 켜야 합니다. 권한 부족이면 "permission denied" 계열의 다른 오류가 납니다.',
    },
    {
      q: '서울과 미국 리전에 VM을 하나씩 두고 내부 IP로 통신시키려 합니다. GCP에서 필요한 최소 구성은?',
      options: ['리전마다 VPC를 만들고 VPC 피어링으로 잇는다', 'VPC 하나에 리전별 서브넷을 두 개 만든다', '두 VM에 공인 IP를 붙이고 방화벽을 연다', '리전 사이에 VPN 터널을 만든다'],
      answer: 1,
      why: 'GCP의 VPC는 글로벌이고 서브넷이 리전 범위입니다. 같은 VPC의 서브넷끼리는 리전이 달라도 내부 IP로 통신합니다. 피어링이나 VPN은 AWS처럼 VPC가 리전 범위일 때 필요한 방법입니다.',
    },
    {
      q: 'Cloud Run 서비스가 Cloud Storage 버킷을 읽어야 합니다. 가장 좋은 방법은?',
      options: ['내 Google 계정의 자격 증명을 환경 변수로 넣는다', '서비스 계정 JSON 키를 컨테이너 이미지에 넣는다', '전용 서비스 계정에 버킷 읽기 역할만 주고 Cloud Run 서비스에 연결한다', '버킷을 공개 읽기로 바꾼다'],
      answer: 2,
      why: '서비스 계정을 리소스에 붙이면 키 파일 없이 인증됩니다. 키를 이미지나 환경 변수에 넣으면 유출될 표면이 생기고, 공개 버킷은 필요 이상으로 엽니다. 전용 계정에 필요한 역할만 주는 것이 최소 권한입니다.',
    },
    {
      q: 'dev·prod 프로젝트를 오가며 작업하는 팀이 엉뚱한 프로젝트에 배포하는 실수를 줄이려 합니다. 가장 알맞은 방법은?',
      options: ['프로젝트를 하나로 합친다', '환경별 gcloud 구성을 만들어 전환하고, 실행 전에 현재 프로젝트를 확인한다', '모든 팀원에게 조직 관리자 역할을 준다', 'default 네트워크를 삭제한다'],
      answer: 1,
      why: '구성은 계정·프로젝트·리전을 묶어 한 번에 바꾸게 해 줍니다. 프로젝트를 합치면 격리와 비용 구분을 잃고, 넓은 역할은 실수의 피해 범위만 키웁니다.',
    },
  ],
};
