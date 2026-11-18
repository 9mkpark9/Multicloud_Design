export default {
  id: 'azure-core',
  learn: [
    '신원(테넌트)과 리소스(구독)가 나뉘어 있는 이유',
    '테넌트 → 관리 그룹 → 구독 → 리소스 그룹 → 리소스',
    'RBAC이 범위를 타고 아래로 상속되는 방식',
    '리소스 그룹은 수명의 단위: 통째로 만들고 지우기',
    'VNet · NSG와 핵심 서비스, az CLI',
  ],
  legend: [['req', '요청 · 로그인'], ['res', '응답'], ['ctrl', '역할 · API 호출'], ['bad', '거부 · 삭제']],
  metrics: [
    { id: 'sub', label: '구독', icon: 'card' },
    { id: 'role', label: '내 역할', icon: 'key' },
    { id: 'rg', label: '리소스 그룹', icon: 'folder' },
    { id: 'res', label: '리소스', icon: 'server' },
  ],
  scene: {
    zones: {
      z_rg: { at: [0, -1.5], size: [7.6, 3.2], label: 'rg-shop-dev (리소스 그룹)', color: 'yellow' },
      vnet: { at: [2, -2.4], size: [6.2, 4.5], label: 'VNet 10.1.0.0/16 · koreacentral', color: 'azure' },
      snet: { at: [2.4, -1.9], size: [5.4, 3.4], label: 'snet-web 10.1.1.0/24 (리전 전체)', color: 'teal' },
    },
    nodes: {
      // 계층
      user: { kind: 'client', at: [-2.6, 0], label: '나' },
      tenant: { at: [0, 0], label: 'Entra ID', sub: '테넌트', icon: 'fingerprint', color: 'azure' },
      m365: { at: [0, -2.8], label: 'Microsoft\n365', sub: 'Teams · 메일', icon: 'mail', color: 'sand' },
      nosub: { kind: 'tile', at: [2.5, 0], label: '구독 없음', icon: 'ban', color: 'gray' },
      mg: { at: [2.5, 0], label: '관리 그룹', sub: 'mg-shop', icon: 'folder-tree', color: 'purple' },
      sub_dev: { at: [5, 0], label: '구독', sub: 'sub-dev', icon: 'card', color: 'teal' },
      sub_prod: { at: [5, -2.6], label: '구독', sub: 'sub-prod', icon: 'card', color: 'teal' },
      rg_a: { at: [7.5, 0], label: '리소스 그룹', sub: 'rg-shop-dev', icon: 'folder', color: 'yellow' },
      rg_b: { at: [7.5, -2.6], label: '리소스 그룹', sub: 'rg-shop-prod', icon: 'folder', color: 'yellow' },
      vm: { at: [10, 0], label: 'VM', sub: '리소스', icon: 'server', color: 'green' },
      term: { kind: 'client', at: [2.6, 0], label: '터미널' },
      // 리소스 그룹 삭제 사례
      r_vm: { at: [1.2, -0.3], label: 'VM', sub: '실습용', icon: 'server', color: 'green' },
      r_st: { kind: 'cyl', at: [3.7, -0.3], label: '실습 스토리지', icon: 'archive', color: 'green' },
      r_sql: { kind: 'cyl', at: [6.2, -0.3], label: '팀 공용 DB', icon: 'database', color: 'purple' },
      // VNet · NSG
      inet: { kind: 'users', at: [-2.1, 0.5], label: '인터넷' },
      nsg: { kind: 'tile', at: [2, -0.2], label: 'NSG', icon: 'shield', color: 'red' },
      vm_z1: { at: [4.6, 0.2], label: 'VM', sub: '영역 1', icon: 'server', color: 'green' },
      vm_z2: { at: [7, -0.8], label: 'VM', sub: '영역 2', icon: 'server', color: 'green' },
      // 서비스 지도
      s_vm: { at: [0, 0], label: 'Virtual\nMachines', sub: '가상 서버', icon: 'server', color: 'azure' },
      s_fn: { at: [0, -2.6], label: 'Functions', sub: '함수', icon: 'zap', color: 'azure' },
      s_aks: { at: [0, -5.2], label: 'AKS', sub: '쿠버네티스', icon: 'helm', color: 'azure' },
      s_blob: { at: [2.6, 0], label: 'Blob\nStorage', sub: '오브젝트 저장', icon: 'archive', color: 'green' },
      s_sql: { at: [2.6, -2.6], label: 'Azure SQL', sub: '관리형 DB', icon: 'database', color: 'purple' },
      s_mon: { at: [2.6, -5.2], label: 'Monitor', sub: '지표 · 로그', icon: 'activity', color: 'yellow' },
    },
    edges: {
      e_login: { from: 'user', to: 'tenant' },
      e_m365: { from: 'm365', to: 'tenant', bi: true, style: 'dashed' },
      e_nosub: { from: 'tenant', to: 'nosub', style: 'dashed', tone: 'bad' },
      e_tsd: { from: 'tenant', to: 'sub_dev' },
      e_tsp: { from: 'tenant', to: 'sub_prod' },
      e_tmg: { from: 'tenant', to: 'mg' },
      e_mgd: { from: 'mg', to: 'sub_dev' },
      e_mgp: { from: 'mg', to: 'sub_prod' },
      e_drg: { from: 'sub_dev', to: 'rg_a' },
      e_prg: { from: 'sub_prod', to: 'rg_b' },
      e_rgvm: { from: 'rg_a', to: 'vm' },
      e_term: { from: 'term', to: 'sub_dev' },
      e_del: { from: 'user', to: 'r_vm', tone: 'bad', label: 'az group delete' },
      e_in: { from: 'inet', to: 'nsg' },
      e_n1: { from: 'nsg', to: 'vm_z1' },
      e_n2: { from: 'nsg', to: 'vm_z2' },
    },
  },
  steps: [
    {
      key: '구독 없음', kind: 'problem', title: '로그인은 됐는데 만들 수가 없습니다',
      body: [
        'AWS에서 하던 대로 Azure 포털에 회사 계정으로 로그인했습니다. 로그인은 잘 됩니다. 그런데 VM을 만들려고 하니 <b>"구독이 없습니다"</b>라는 화면만 나옵니다.',
        'AWS에서는 계정 하나가 로그인·결제·리소스를 모두 담았습니다. Azure는 이것을 나눠 놓았습니다. <b>누구인지</b>는 테넌트가, <b>어디에 만들고 누가 돈을 내는지</b>는 구독이 맡습니다. 지금은 앞의 것만 가진 상태예요.',
      ],
      callout: { type: 'key', text: 'Azure의 지도는 <b>신원(테넌트)</b>과 <b>리소스(구독)</b>가 분리되어 있다는 데서 출발합니다.' },
      show: ['user', 'tenant', 'nosub'],
      tags: [{ on: 'tenant', text: '로그인 성공', tone: 'ok', icon: 'check' }, { on: 'nosub', text: '만들 곳이 없음', tone: 'bad', pos: 'right' }],
      flows: [{ path: ['user', 'tenant'], kind: 'req', n: 2 }, { path: ['tenant', 'nosub'], kind: 'bad', delay: 1.4 }],
      metrics: { sub: ['없음', 'bad'], role: ['없음', 'bad'], rg: '0개', res: '0개' },
    },
    {
      key: '테넌트', kind: 'concept', title: '테넌트: 회사의 신원 저장소',
      body: [
        '<b>테넌트</b>는 한 조직의 <b>Microsoft Entra ID</b>(예전 이름 Azure AD) 디렉터리입니다. 사용자, 그룹, 앱 등록이 여기에 삽니다. "누구인가"와 "어떻게 인증하는가"를 책임져요.',
        '회사가 <b>Microsoft 365</b>를 쓰고 있다면 테넌트는 이미 있습니다. Teams와 메일에 로그인하는 그 계정, 그 그룹, 그 MFA 정책이 Azure에도 그대로 적용됩니다. 기업이 Azure를 고르는 큰 이유 중 하나입니다.',
      ],
      callout: { type: 'warn', text: 'Entra ID의 관리자 역할(예: 전역 관리자)과 Azure 리소스 권한(RBAC)은 <b>서로 다른 체계</b>입니다. 디렉터리 관리자라고 해서 구독의 VM을 바로 만질 수 있는 것은 아닙니다.' },
      show: ['m365'],
      focus: ['tenant'],
      tags: [{ on: 'm365', text: '같은 계정 · 같은 MFA', icon: 'user-check', pos: 'right' }, { on: 'tenant', text: '사용자 · 그룹 · 앱', pos: 'left' }],
      flows: [{ path: ['user', 'tenant'], kind: 'req', n: 2 }, { path: ['tenant', 'm365'], kind: 'res', delay: 1.2 }],
    },
    {
      key: '구독', kind: 'solution', title: '구독: 청구서와 리소스의 그릇',
      body: [
        '<b>구독</b>(Subscription)은 리소스를 담는 그릇이자 <b>청구서가 나오는 단위</b>이고, 한도(쿼터)가 걸리는 경계입니다. AWS의 계정과 가장 비슷한 자리예요.',
        '구독은 정확히 하나의 테넌트를 믿고, 테넌트 하나에는 구독이 여러 개 달릴 수 있습니다. 보통 운영과 개발을 구독으로 나눕니다. 관리자가 개발 구독에 내 계정의 역할을 지정해 주자 비로소 리소스를 만들 수 있게 됐습니다.',
      ],
      callout: { type: 'tip', text: '포털 오른쪽 위의 <b>디렉터리 + 구독</b> 필터가 AWS 콘솔의 리전 선택기 같은 함정입니다. 리소스가 안 보이면 여기부터 확인하세요.' },
      hide: ['nosub'],
      show: ['sub_dev', 'sub_prod'],
      focus: ['sub_dev'],
      tags: [{ on: 'sub_dev', text: '나: Contributor', tone: 'ok', icon: 'key', pos: 'left' }, { on: 'sub_prod', text: '청구서도 따로', icon: 'receipt', pos: 'right' }],
      flows: [{ path: ['user', 'tenant', 'sub_dev'], kind: 'ctrl', n: 2 }],
      metrics: { sub: ['2개', 'ok'], role: '구독에 Contributor' },
      changes: [['+', '구독 2개 (dev · prod)'], ['+', '개발 구독에 내 역할 할당'], ['~', '테넌트 1 : 구독 N']],
    },
    {
      key: '계층', kind: 'concept', title: '구독 아래와 위: 다섯 층의 계층',
      body: [
        '구독 안에서 모든 리소스는 정확히 하나의 <b>리소스 그룹</b>에 들어갑니다. 리소스 그룹은 "함께 만들고 함께 지울 것들"을 묶는 폴더예요. 리전은 리소스마다 정하므로, 한 그룹에 서울과 도쿄의 리소스가 섞여도 됩니다.',
        '구독이 많아지면 그 위에 <b>관리 그룹</b>을 둡니다. 구독들을 묶어 정책과 권한을 한 번에 걸기 위한 층입니다. 이렇게 테넌트 → 관리 그룹 → 구독 → 리소스 그룹 → 리소스의 다섯 층이 완성됩니다.',
      ],
      callout: { type: 'key', text: '각 층은 하나의 <b>범위(scope)</b>입니다. 권한(RBAC)도, 규칙(Azure Policy)도, 비용 집계도 이 범위 중 하나에 겁니다.' },
      hide: ['user', 'm365', 'e_tsd', 'e_tsp'],
      show: ['mg', 'rg_a', 'rg_b', 'vm'],
      focus: ['mg'],
      metrics: { rg: '2개', res: 'VM 1대' },
      changes: [['+', '관리 그룹 (구독의 위)'], ['+', '리소스 그룹 (구독의 아래)'], ['~', '리전은 그룹이 아니라 리소스마다']],
    },
    {
      key: 'RBAC 상속', kind: 'concept', title: '권한은 범위를 타고 아래로 흐릅니다',
      body: [
        'Azure <b>RBAC</b>의 역할 할당은 세 조각입니다. <b>누구에게</b>(사용자·그룹), <b>어떤 역할을</b>(Reader, Contributor, Owner …), <b>어느 범위에</b>. 범위는 관리 그룹, 구독, 리소스 그룹, 리소스 중 하나입니다.',
        '위쪽 범위에 준 역할은 아래 모든 것에 <b>상속</b>됩니다. 관리 그룹에 Reader를 주면 그 아래 모든 구독의 리소스를 읽을 수 있고, 리소스 그룹에 Contributor를 주면 그 그룹 안에서만 만들고 지울 수 있습니다.',
      ],
      callout: { type: 'warn', text: '흔한 실수: 편하다고 <b>구독 범위에 Owner</b>를 여러 명에게 주는 것. 그 구독 전체에 대한 전권과 권한 부여권까지 상속됩니다. 범위는 가능한 한 <b>낮게</b>, 역할은 가능한 한 <b>작게</b>.' },
      tags: [{ on: 'mg', text: '감사팀: Reader', icon: 'eye' }, { on: 'rg_a', text: '나: Contributor', tone: 'ok', icon: 'key', pos: 'left' }],
      flows: [{ path: ['mg', 'sub_dev', 'rg_a', 'vm'], kind: 'ctrl', n: 2 }, { path: ['mg', 'sub_prod', 'rg_b'], kind: 'ctrl', n: 2, delay: 0.3 }],
      metrics: { role: ['RG에 Contributor', 'ok'] },
      changes: [['~', '내 역할 범위: 구독 → 리소스 그룹'], ['+', '감사팀 Reader는 관리 그룹에 한 번']],
    },
    {
      key: 'RG 삭제', kind: 'case', title: '사례: 실습 정리하다 공용 DB까지',
      body: [
        '리소스 그룹의 가장 편한 점은 <b>통째로 지울 수 있다</b>는 것입니다. <code>az group delete</code> 한 줄이면 그 안의 VM, 디스크, 공인 IP가 남김없이 사라져서, 잊힌 리소스가 요금을 내는 일이 없습니다.',
        '같은 이유로 사고도 납니다. 실습용 VM과 팀 공용 DB가 한 그룹에 들어 있었고, 실습을 정리하려던 삭제가 DB까지 지웠습니다. 리소스 그룹은 이름이 아니라 <b>수명</b>으로 나눠야 합니다.',
      ],
      callout: { type: 'tip', text: '수명이 다른 것은 다른 그룹으로 나누고(<code>rg-shop-dev</code> / <code>rg-shop-data</code>), 지워지면 안 되는 것에는 <b>삭제 잠금</b>(CanNotDelete)을 겁니다.' },
      hide: ['tenant', 'mg', 'sub_dev', 'sub_prod', 'rg_a', 'rg_b', 'vm'],
      show: ['user', 'z_rg', 'r_vm', 'r_st', 'r_sql'],
      set: { r_vm: { state: 'down' }, r_st: { state: 'down' }, r_sql: { state: 'down' } },
      tags: [{ on: 'r_sql', text: '공용 DB도 함께 삭제', tone: 'bad', icon: 'warn' }, { on: 'r_vm', text: '지우려던 것', pos: 'bottom' }],
      flows: [{ path: ['user', 'r_vm'], kind: 'bad', n: 3 }],
      metrics: { rg: ['1개', 'bad'], res: ['0개', 'bad'] },
      changes: [['-', 'VM · 스토리지 · 공용 DB 모두 삭제'], ['+', '공용 DB는 별도 리소스 그룹으로'], ['+', '중요 리소스에 삭제 잠금']],
    },
    {
      key: 'VNet · NSG', kind: 'concept', title: 'VNet과 NSG: 이름만 다른 게 아닙니다',
      body: [
        'Azure의 사설망은 <b>VNet</b>이고, AWS VPC처럼 리전 범위입니다. 다른 점은 서브넷이에요. Azure의 <b>서브넷은 가용 영역에 묶이지 않고</b> 리전 전체에 걸칩니다. 한 서브넷 안에서 VM마다 영역 1, 2를 골라 배치합니다.',
        '방화벽은 <b>NSG</b>(네트워크 보안 그룹)입니다. 서브넷이나 NIC에 붙이고, 규칙마다 <b>우선순위 숫자</b>가 있어 작은 숫자부터 평가합니다. 맨 끝에는 인바운드를 모두 막는 기본 규칙이 있습니다.',
      ],
      callout: { type: 'cloud', text: 'AWS 보안 그룹은 허용 규칙만 있고 순서가 없습니다. NSG는 <b>허용 + 거부 + 우선순위</b>라서 보안 그룹과 NACL의 성격을 한 리소스에 합친 모습에 가깝습니다. 연결 상태는 기억합니다(stateful).' },
      hide: ['user', 'z_rg', 'r_vm', 'r_st', 'r_sql'],
      show: ['vnet', 'snet', 'inet', 'nsg', 'vm_z1', 'vm_z2'],
      tags: [{ on: 'nsg', text: '100: 443 허용', tone: 'ok' }, { on: 'nsg', text: '나머지는 거부', tone: 'bad', pos: 'bottom' }],
      flows: [{ path: ['inet', 'nsg', 'vm_z1'], kind: 'req', n: 2 }, { path: ['inet', 'nsg', 'vm_z2'], kind: 'req', n: 2, delay: 0.5 }, { path: ['inet', 'nsg'], kind: 'bad', delay: 1.6 }],
      metrics: { rg: '2개 (수명별)', res: 'VM 2대' },
    },
    {
      key: '서비스 지도', kind: 'concept', title: '핵심 서비스 여섯 개의 자리',
      body: [
        '컴퓨트는 <b>Virtual Machines</b>, 코드만 올리는 <b>Functions</b>, 쿠버네티스 <b>AKS</b>입니다. 데이터는 <b>Blob Storage</b>(오브젝트)와 <b>Azure SQL</b>(관리형 DB), 관측은 <b>Azure Monitor</b>가 맡습니다.',
        '이름 아래의 구조가 AWS와 다른 곳이 있습니다. Blob은 <b>스토리지 계정 → 컨테이너 → Blob</b>의 세 층이고, Azure SQL은 SQL Server 엔진의 관리형 서비스입니다. 로그는 Monitor 아래 <b>Log Analytics</b> 작업 영역에 모입니다.',
      ],
      callout: { type: 'tip', text: '웹 앱을 VM 없이 올리는 <b>App Service</b>, 컨테이너 이미지를 두는 <b>ACR</b>도 자주 만납니다. 새 서비스를 보면 "AWS 지도의 어느 칸과 같은가"를 먼저 물어보세요.' },
      hide: ['vnet', 'snet', 'inet', 'nsg', 'vm_z1', 'vm_z2'],
      show: ['s_vm', 's_fn', 's_aks', 's_blob', 's_sql', 's_mon'],
    },
    {
      key: 'az CLI', kind: 'concept', title: 'az CLI: 구독을 고르고, 그룹에 만든다',
      body: [
        '<code>az login</code>은 테넌트에 로그인하고, <code>az account set</code>은 <b>어느 구독에서 일할지</b> 고릅니다. AWS의 프로파일 자리에 "현재 구독"이 있는 셈이에요. 명령은 <code>az &lt;대상&gt; &lt;동작&gt;</code> 모양입니다.',
        '거의 모든 생성 명령이 <code>-g</code>(리소스 그룹)를 요구합니다. 리전은 <code>-l koreacentral</code>처럼 따로 줍니다. 그리고 정리는 리소스 하나하나가 아니라 <b>그룹 단위</b>로 합니다.',
      ],
      callout: { type: 'warn', text: '<code>az account show</code>로 현재 구독을 확인하지 않고 <code>az group delete</code>를 치는 것이 Azure판 "운영에서 삭제" 사고입니다.' },
      hide: ['s_vm', 's_fn', 's_aks', 's_blob', 's_sql', 's_mon'],
      show: ['term', 'sub_dev', 'rg_a'],
      focus: ['sub_dev'],
      flows: [{ path: ['term', 'sub_dev', 'rg_a'], kind: 'ctrl', n: 2 }],
      code: {
        title: '터미널', lang: 'sh', hl: [7, 9, 10],
        text: `$ az login
$ az account list -o table   # 일부 열만
Name      SubscriptionId  IsDefault
sub-dev   1111...         True
sub-prod  2222...         False

$ az account set --subscription sub-dev

$ az group create -n rg-shop-dev \\
    -l koreacentral
$ az vm list -g rg-shop-dev -o table

$ az group delete -n rg-shop-dev
Are you sure you want to perform
this operation? (y/n):`,
      },
    },
    {
      key: '정리', kind: 'recap', title: '정리: 신원은 테넌트, 리소스는 구독',
      body: [
        'Azure에서는 <b>테넌트(Entra ID)</b>가 "누구인가"를, <b>구독</b>이 "어디에 만들고 누가 내는가"를 맡습니다. 그 아래 리소스 그룹이 수명의 단위이고, 위로는 관리 그룹이 구독들을 묶습니다.',
        'RBAC은 이 계층의 범위에 걸리고 아래로 상속됩니다. 범위는 낮게, 역할은 작게. 다음 레슨의 GCP는 또 다른 선택을 합니다. <b>프로젝트</b>가 중심이고, VPC가 리전을 넘어 전 세계에 걸칩니다.',
      ],
      hide: ['term'],
      show: ['tenant', 'mg', 'sub_prod', 'rg_b', 'vm'],
      focus: ['tenant', 'sub_dev'],
      flows: [{ path: ['tenant', 'mg', 'sub_dev', 'rg_a', 'vm'], kind: 'ctrl', n: 2 }],
    },
  ],
  quiz: [
    {
      q: '회사 계정으로 Azure 포털에 로그인은 되는데 리소스를 하나도 만들 수 없습니다. 가장 가능성이 높은 원인은?',
      options: ['테넌트에는 속해 있지만 구독에 대한 역할 할당이 없다', '리전을 koreacentral로 고르지 않았다', 'Microsoft 365 라이선스가 만료됐다', '리소스 그룹의 위치가 구독과 다르다'],
      answer: 0,
      why: '로그인은 테넌트(Entra ID)의 일이고, 리소스를 만드는 권한은 구독 이하 범위의 역할 할당에서 나옵니다. 리전이나 M365 라이선스는 "구독 없음"과 관계가 없고, 구독에는 위치라는 개념이 없습니다.',
    },
    {
      q: '감사팀이 회사의 모든 구독에 있는 리소스를 읽기만 할 수 있어야 합니다. 가장 알맞은 역할 할당은?',
      options: ['리소스 그룹마다 Reader를 하나씩 할당한다', '구독마다 Contributor를 할당한다', '구독들을 묶은 관리 그룹에 Reader를 한 번 할당한다', 'Entra ID의 전역 관리자 역할을 준다'],
      answer: 2,
      why: '위 범위의 역할은 아래로 상속되므로 관리 그룹에 Reader 한 번이면 새로 생기는 구독까지 따라옵니다. Contributor는 쓰기 권한이라 과하고, 전역 관리자는 디렉터리 관리 역할이라 리소스 읽기와는 다른 체계입니다.',
    },
    {
      q: '실습용 VM 여러 대와 팀이 계속 쓰는 공용 DB가 있습니다. 리소스 그룹을 나누는 기준으로 가장 좋은 것은?',
      options: ['관리가 쉽도록 모두 한 그룹에 둔다', '리전이 같은 것끼리 묶는다', '함께 만들고 함께 지울 것끼리, 즉 수명이 같은 것끼리 묶는다', 'VM 그룹, DB 그룹처럼 종류별로 묶는다'],
      answer: 2,
      why: '리소스 그룹은 통째로 지우는 단위입니다. 수명이 다른 것이 섞여 있으면 정리할 때 남겨야 할 것까지 지워집니다. 리전은 리소스마다 정하는 것이라 그룹을 나누는 기준이 되지 못합니다.',
    },
    {
      q: 'AWS에서는 Multi-AZ를 위해 AZ마다 서브넷을 만들었습니다. Azure에서 VM 두 대를 서로 다른 가용 영역에 두려면?',
      options: ['영역마다 VNet을 하나씩 만든다', '영역마다 서브넷을 하나씩 만들어야만 한다', '같은 서브넷에 두고 VM마다 영역을 지정하면 된다', 'NSG에 영역별 규칙을 추가한다'],
      answer: 2,
      why: 'Azure의 서브넷은 영역에 묶이지 않고 리전 전체에 걸칩니다. 영역은 VM을 만들 때 고르는 속성입니다. AWS의 습관대로 영역별 서브넷을 꼭 만들 필요가 없습니다.',
    },
  ],
};
