export default {
  id: 'aws-core',
  learn: [
    '리소스가 "사라지는" 이유: 리전과 글로벌 서비스',
    '계정과 Organizations: 격리, SCP, 통합 결제',
    'VPC는 리전 범위, 서브넷은 AZ 범위',
    '핵심 서비스 여덟 개와 aws CLI 프로파일',
    '과금 단위와 데이터 전송 비용이라는 함정',
  ],
  legend: [['ctrl', 'API 호출 · 정책'], ['res', '응답'], ['data', '데이터'], ['bad', '실패 · 과금 주의']],
  metrics: [
    { id: 'region', label: '콘솔 리전', icon: 'pin' },
    { id: 'found', label: '보이는 리소스', icon: 'search' },
    { id: 'acct', label: '계정', icon: 'id-card' },
    { id: 'bill', label: '청구서 1위', icon: 'receipt' },
  ],
  scene: {
    zones: {
      acct: { at: [-0.4, -3.9], size: [4.2, 8.3], label: 'AWS 계정 1234-5678-9012', color: 'aws' },
      seoul: { at: [0, 0.2], size: [3.4, 3.5], label: '서울 ap-northeast-2', color: 'teal' },
      use1: { at: [0, -3.5], size: [3.4, 3.5], label: '버지니아 us-east-1', color: 'gray', labelPos: 'back' },
      vpc: { at: [0.1, -2.8], size: [5.4, 6.1], label: 'VPC 10.0.0.0/16 · 서울 리전', color: 'purple' },
      aza: { at: [0.5, 0.2], size: [4.6, 2.2], label: 'AZ ap-northeast-2a', color: 'blue' },
      azc: { at: [0.5, -2.4], size: [4.6, 2.2], label: 'AZ ap-northeast-2c', color: 'blue' },
    },
    nodes: {
      // 계정 · 리전
      dev: { kind: 'client', at: [-2.8, 0.4], label: '나 (콘솔)' },
      fn: { at: [0.9, 2.3], label: 'Lambda', sub: '주문 함수', icon: 'zap', color: 'aws' },
      tbl: { kind: 'cyl', at: [2.4, 1.1], label: 'DynamoDB', icon: 'table', color: 'purple' },
      none: { kind: 'tile', at: [2.1, -1.3], label: '리소스 0개', icon: 'search', color: 'gray' },
      // Organizations
      org: { at: [0, 0], label: '관리 계정', sub: 'Organizations', icon: 'building', color: 'aws' },
      ou_wl: { at: [3.2, 1.6], label: 'OU', sub: '워크로드', icon: 'folder', color: 'sand' },
      ou_sec: { at: [3.2, -1.6], label: 'OU', sub: '보안', icon: 'folder', color: 'sand' },
      a_prod: { at: [6.4, 3.2], label: '운영 계정', sub: 'prod', icon: 'id-card', color: 'red' },
      a_dev: { at: [6.4, 0], label: '개발 계정', sub: 'dev', icon: 'id-card', color: 'green' },
      a_log: { at: [6.4, -3.2], label: '로그 계정', sub: 'log-archive', icon: 'id-card', color: 'slate' },
      me: { kind: 'client', at: [1.6, 1.8], label: '터미널' },
      // VPC 범위
      pub_a: { at: [1.5, 0.95], size: 's', label: '퍼블릭', sub: '10.0.1.0/24', color: 'green' },
      pri_a: { at: [3.7, 0.95], size: 's', label: '프라이빗', sub: '10.0.11.0/24', color: 'purple' },
      pub_c: { at: [1.5, -1.65], size: 's', label: '퍼블릭', sub: '10.0.2.0/24', color: 'green' },
      pri_c: { at: [3.7, -1.65], size: 's', label: '프라이빗', sub: '10.0.12.0/24', color: 'purple' },
      // 서비스 지도
      m_ec2: { at: [0, 0], label: 'EC2', sub: '가상 서버', icon: 'server', color: 'aws' },
      m_lam: { at: [0, -2.6], label: 'Lambda', sub: '함수', icon: 'zap', color: 'aws' },
      m_eks: { at: [0, -5.2], label: 'EKS', sub: '쿠버네티스', icon: 'helm', color: 'aws' },
      m_r53: { at: [0, -7.8], label: 'Route 53', sub: 'DNS', icon: 'signpost', color: 'blue' },
      m_s3: { at: [2.6, 0], label: 'S3', sub: '오브젝트 저장', icon: 'archive', color: 'green' },
      m_rds: { at: [2.6, -2.6], label: 'RDS', sub: '관리형 DB', icon: 'database', color: 'purple' },
      m_iam: { at: [2.6, -5.2], label: 'IAM', sub: '권한', icon: 'key', color: 'red' },
      m_cw: { at: [2.6, -7.8], label: 'CloudWatch', sub: '지표 · 로그', icon: 'activity', color: 'yellow' },
      // 데이터 전송 사례
      app: { at: [0, 3.6], label: 'EC2', sub: '야간 배치', icon: 'server', color: 'aws' },
      nat: { at: [1.8, 1.8], label: 'NAT', sub: 'Gateway', icon: 'router', color: 'red' },
      bkt: { kind: 'cyl', at: [3.6, 0], label: 'S3 버킷', icon: 'archive', color: 'green' },
      ep: { kind: 'tile', at: [3.9, 3.9], label: '게이트웨이 엔드포인트', icon: 'door', color: 'teal' },
    },
    edges: {
      e_wrong: { from: 'dev', to: 'none', style: 'dashed', tone: 'bad' },
      e_fn: { from: 'dev', to: 'fn', off: true },
      e_o1: { from: 'org', to: 'ou_wl' },
      e_o2: { from: 'org', to: 'ou_sec' },
      e_o3: { from: 'ou_wl', to: 'a_prod' },
      e_o4: { from: 'ou_wl', to: 'a_dev' },
      e_o5: { from: 'ou_sec', to: 'a_log' },
      e_p1: { from: 'me', to: 'a_dev', label: '--profile dev' },
      e_p2: { from: 'me', to: 'a_prod', label: '--profile prod', style: 'dashed' },
      e_n1: { from: 'bkt', to: 'nat', tone: 'bad' },
      e_n2: { from: 'nat', to: 'app', tone: 'bad' },
      e_e1: { from: 'bkt', to: 'ep', tone: 'ok' },
      e_e2: { from: 'ep', to: 'app', tone: 'ok' },
    },
  },
  steps: [
    {
      key: '사라진 함수', kind: 'problem', title: '어제 만든 Lambda가 안 보입니다',
      body: [
        'AWS 콘솔에 로그인했더니 어제 만든 <b>Lambda</b> 함수와 DynamoDB 테이블이 목록에 없습니다. 지운 적도 없는데 "리소스가 없습니다"만 보여요.',
        '삭제된 것이 아닙니다. 콘솔 오른쪽 위의 <b>리전</b>이 서울이 아니라 버지니아 북부(<code>us-east-1</code>)로 되어 있을 뿐입니다. AWS를 처음 쓸 때 가장 흔히 겪는 일이에요.',
      ],
      callout: { type: 'warn', text: '반대 경우가 더 위험합니다. 엉뚱한 리전에 만들어 놓고 잊은 리소스는 <b>보이지 않는 채로 요금만</b> 나갑니다.' },
      show: ['dev', 'seoul', 'use1', 'fn', 'tbl', 'none'],
      tags: [{ on: 'none', text: '"리소스가 없습니다"', tone: 'bad', pos: 'right' }, { on: 'fn', text: '서울에 그대로 있음', pos: 'left' }],
      flows: [{ path: ['dev', 'none'], kind: 'ctrl', n: 2 }, { path: ['none', 'dev'], kind: 'bad', delay: 1.6 }],
      metrics: { region: ['버지니아', 'bad'], found: ['0개', 'bad'], acct: '1개', bill: '없음' },
    },
    {
      key: '리전', kind: 'solution', title: '리전마다 따로인 세계입니다',
      body: [
        'AWS의 대부분 서비스는 <b>리전 단위</b>로 동작합니다. EC2·Lambda·RDS·VPC는 리전마다 API 엔드포인트도, 리소스 목록도 따로예요. 콘솔의 리전을 서울(<code>ap-northeast-2</code>)로 바꾸면 함수가 다시 보입니다.',
        '예외는 <b>글로벌 서비스</b>입니다. IAM, Route 53, CloudFront, Organizations는 리전을 고르지 않습니다. S3는 버킷 목록을 한 화면에 모아 보여 주지만, 버킷 하나하나는 만들 때 고른 리전에 삽니다.',
      ],
      callout: { type: 'tip', text: '리소스가 안 보이면 지웠는지 의심하기 전에 <b>리전과 계정</b>부터 확인하세요.' },
      show: ['e_fn'],
      hide: ['e_wrong'],
      set: { none: { state: 'dim' } },
      focus: ['fn'],
      tags: [{ on: 'fn', text: '리전을 바꾸니 보임', tone: 'ok', icon: 'check', pos: 'left' }],
      flows: [{ path: ['dev', 'fn'], kind: 'ctrl', n: 2 }, { path: ['fn', 'dev'], kind: 'res', n: 2, delay: 1.5 }],
      metrics: { region: ['서울', 'ok'], found: ['2개', 'ok'] },
      changes: [['~', '콘솔 리전: 버지니아 → 서울'], ['+', '함수와 테이블이 다시 보임']],
    },
    {
      key: '계정', kind: 'concept', title: '계정: 가장 바깥의 상자',
      body: [
        '리전보다 바깥에는 <b>AWS 계정</b>이 있습니다. 12자리 숫자 ID를 가진 계정은 리소스를 담는 그릇이자 <b>청구서가 나오는 단위</b>이고, 권한이 기본적으로 넘어가지 못하는 <b>보안 경계</b>입니다.',
        '그래서 리소스의 주소인 <b>ARN</b>에는 리전과 계정이 함께 들어갑니다. <code>arn:aws:lambda:ap-northeast-2:123456789012:function:order</code>처럼요. IAM 같은 글로벌 서비스의 ARN은 리전 자리가 비어 있습니다.',
      ],
      callout: { type: 'warn', text: '계정을 만든 이메일로 로그인하는 <b>루트 사용자</b>는 무엇이든 할 수 있습니다. MFA를 걸어 두고 평소에는 쓰지 않습니다.' },
      show: ['acct'],
      set: { none: { state: null } },
      tags: [{ on: 'fn', text: '주소 = 리전 + 계정 ID', icon: 'tag', pos: 'left' }],
    },
    {
      key: 'Organizations', kind: 'concept', title: '계정을 여러 개로 나누는 이유',
      body: [
        '실무에서는 계정 하나에 모든 것을 넣지 않습니다. 운영·개발·로그용 계정을 따로 만들어요. 개발 계정에서 사고가 나도 운영 계정의 데이터에는 닿기 어렵고, 비용도 계정별로 갈립니다.',
        '<b>AWS Organizations</b>는 이 계정들을 한 조직으로 묶습니다. <b>관리 계정</b> 아래에 <b>OU</b>(조직 단위)로 계정을 분류하고, 청구서는 하나로 합쳐집니다(통합 결제).',
      ],
      callout: { type: 'key', text: 'OU에 <b>SCP</b>(서비스 제어 정책)를 붙이면 그 아래 계정들이 할 수 있는 일의 <b>상한선</b>이 정해집니다. 예: 서울 리전 밖에서는 리소스 생성 금지. SCP는 권한을 주지는 않고, 막기만 합니다.' },
      hide: ['dev', 'seoul', 'use1', 'fn', 'tbl', 'none', 'acct'],
      show: ['org', 'ou_wl', 'ou_sec', 'a_prod', 'a_dev', 'a_log'],
      tags: [{ on: 'org', text: '청구서는 하나로', icon: 'receipt' }, { on: 'ou_wl', text: 'SCP: 서울 리전만', tone: 'warn', icon: 'shield', pos: 'left' }],
      flows: [{ path: ['org', 'ou_wl', 'a_prod'], kind: 'ctrl' }, { path: ['org', 'ou_wl', 'a_dev'], kind: 'ctrl', delay: 0.4 }, { path: ['org', 'ou_sec', 'a_log'], kind: 'ctrl', delay: 0.8 }],
      metrics: { acct: '3개 + 조직' },
      changes: [['+', '계정을 운영 · 개발 · 로그로 분리'], ['+', 'OU와 SCP로 상한선 설정'], ['~', '청구서는 조직 단위로 통합']],
    },
    {
      key: 'VPC 범위', kind: 'concept', title: 'VPC는 리전, 서브넷은 AZ에 묶입니다',
      body: [
        '운영 계정의 서울 리전 안으로 들어가 봅시다. AWS의 <b>VPC는 리전 범위</b>입니다. 서울에 만든 VPC는 서울의 모든 AZ에 걸쳐 있지만, 도쿄 리전으로는 이어지지 않습니다.',
        '<b>서브넷은 AZ 범위</b>입니다. 서브넷 하나는 정확히 AZ 하나에 속해요. 그래서 고가용성 구성은 언제나 "같은 역할의 서브넷을 AZ마다 하나씩"입니다. 로드 밸런서와 RDS Multi-AZ가 서브넷을 둘 이상 요구하는 이유입니다.',
      ],
      callout: { type: 'cloud', text: '이 범위는 클라우드마다 다릅니다. GCP의 VPC는 <b>글로벌</b>이고 서브넷이 리전 범위, Azure의 VNet은 리전 범위이고 서브넷이 여러 영역에 걸칩니다.' },
      hide: ['org', 'ou_wl', 'ou_sec', 'a_prod', 'a_dev', 'a_log'],
      show: ['vpc', 'aza', 'azc', 'pub_a', 'pri_a', 'pub_c', 'pri_c'],
      tags: [{ on: 'pub_c', text: '서브넷 1개 = AZ 1개', icon: 'pin' }, { at: [6.3, 0.4], text: 'VPC 1개 = 리전 전체', tone: 'accent' }],
    },
    {
      key: '서비스 지도', kind: 'concept', title: '핵심 서비스 여덟 개의 자리',
      body: [
        'AWS 서비스는 200개가 넘지만 뼈대는 몇 개입니다. 컴퓨트는 <b>EC2</b>(VM)·<b>Lambda</b>(함수)·<b>EKS</b>(쿠버네티스), 데이터는 <b>S3</b>(오브젝트)·<b>RDS</b>(관리형 DB)입니다.',
        '그 둘레를 <b>Route 53</b>(DNS), <b>IAM</b>(권한), <b>CloudWatch</b>(지표·로그·알람)가 감쌉니다. 새 서비스를 만나면 "이 지도의 어느 칸인가"부터 물어보세요. 대부분 이 여덟 칸 중 하나의 변형입니다.',
      ],
      callout: { type: 'tip', text: '같은 칸의 이웃도 알아 두세요. 컨테이너를 EKS보다 단순하게 돌리는 <b>ECS · Fargate</b>, 키-값 DB <b>DynamoDB</b>, 누가 무엇을 했는지 남기는 감사 로그 <b>CloudTrail</b>.' },
      hide: ['vpc', 'aza', 'azc', 'pub_a', 'pri_a', 'pub_c', 'pri_c'],
      show: ['m_ec2', 'm_lam', 'm_eks', 'm_r53', 'm_s3', 'm_rds', 'm_iam', 'm_cw'],
    },
    {
      key: 'CLI 프로파일', kind: 'concept', title: 'aws CLI: 지금 나는 누구인가',
      body: [
        '콘솔에서 클릭하는 모든 일은 API 호출이고, <code>aws</code> CLI는 그 API를 터미널에서 부릅니다. 명령은 항상 <code>aws &lt;서비스&gt; &lt;동작&gt;</code> 모양이에요.',
        '<b>프로파일</b>은 "어느 계정에, 누구로, 어느 리전에"를 묶어 둔 이름입니다. 계정이 여러 개면 프로파일도 여러 개가 되고 <code>--profile</code>이나 <code>AWS_PROFILE</code>로 고릅니다. 작업 전에 <code>aws sts get-caller-identity</code>로 계정을 확인하는 습관을 들이세요.',
      ],
      callout: { type: 'warn', text: '운영 프로파일이 기본값인 터미널에서 개발용 삭제 명령을 치는 사고가 실제로 납니다. 장기 액세스 키 대신 <b>IAM Identity Center</b>(SSO)의 임시 자격 증명을 쓰면 유출 피해도 줄어듭니다.' },
      hide: ['m_ec2', 'm_lam', 'm_eks', 'm_r53', 'm_s3', 'm_rds', 'm_iam', 'm_cw'],
      show: ['me', 'a_dev', 'a_prod'],
      focus: ['a_dev'],
      flows: [{ path: ['me', 'a_dev'], kind: 'ctrl', n: 2 }],
      code: {
        title: '터미널', lang: 'sh', hl: [6, 7, 8, 9, 10],
        text: `$ aws configure sso --profile dev
$ aws configure list-profiles
dev
prod

$ aws sts get-caller-identity --profile dev
{
  "Account": "111122223333",
  "Arn": "arn:aws:sts::111122223333:..."
}

$ aws lambda list-functions \\
    --profile dev --region ap-northeast-2

$ export AWS_PROFILE=prod  # 이 터미널의 기본값
$ aws s3 ls`,
      },
    },
    {
      key: '과금 단위', kind: 'concept', title: '서비스마다 요금을 재는 자가 다릅니다',
      body: [
        'AWS 요금에는 세 개의 축이 있습니다. <b>컴퓨트</b>는 켜 둔 시간, <b>스토리지</b>는 저장한 양과 기간, <b>네트워크</b>는 밖으로 나간 데이터 양입니다.',
        '재는 단위는 서비스마다 다릅니다. EC2는 인스턴스가 켜져 있던 시간을 초 단위로, Lambda는 요청 수와 실행 시간으로, S3는 GB·월과 요청 수로 잽니다. RDS는 쿼리가 한 건도 없어도 인스턴스가 켜져 있으면 요금이 나가요.',
      ],
      callout: { type: 'key', text: '질문은 하나입니다. <b>"안 써도 돈이 나가는가?"</b> EC2·RDS·NAT Gateway·로드 밸런서는 켜 둔 동안 계속 나가고, Lambda는 호출이 없으면 0원입니다. 실습 뒤에 꼭 지워야 하는 것은 앞쪽입니다.' },
      hide: ['me', 'a_dev', 'a_prod'],
      show: ['m_ec2', 'm_lam', 'm_s3', 'm_rds'],
      tags: [
        { on: 'm_ec2', text: '켜 둔 시간 (초 단위)', pos: 'left', icon: 'clock' },
        { on: 'm_lam', text: '요청 수 + 실행 시간', icon: 'zap' },
        { on: 'm_s3', text: 'GB·월 + 요청 수', pos: 'bottom', icon: 'archive' },
        { on: 'm_rds', text: '인스턴스 시간 + 저장', pos: 'right', icon: 'clock' },
      ],
      metrics: { bill: 'EC2 시간' },
    },
    {
      key: '전송 비용', kind: 'case', title: '사례: 청구서 1위가 NAT Gateway',
      body: [
        '프라이빗 서브넷의 EC2가 매일 밤 S3에서 수백 GB를 내려받아 처리합니다. 월말 청구서에서 가장 큰 항목은 EC2가 아니라 <b>NAT Gateway 데이터 처리</b>였습니다.',
        '프라이빗 서브넷에서 S3로 가는 길이 NAT Gateway뿐이었기 때문입니다. NAT Gateway는 시간당 요금에 더해 <b>지나간 GB마다</b> 요금을 받습니다. S3용 <b>게이트웨이 VPC 엔드포인트</b>를 붙이면 트래픽이 NAT를 거치지 않고, 이 엔드포인트에는 추가 요금이 없습니다.',
      ],
      callout: { type: 'warn', text: '데이터 전송 요금의 단골 셋: <b>인터넷으로 나가는</b> 트래픽, <b>AZ 사이</b> 트래픽, <b>NAT 경유</b> 트래픽. 들어오는 트래픽은 무료라서 테스트 때는 잘 드러나지 않습니다.' },
      hide: ['m_ec2', 'm_lam', 'm_s3', 'm_rds'],
      show: ['app', 'nat', 'bkt', 'ep'],
      set: { nat: { state: 'hot' } },
      tags: [
        { on: 'nat', text: 'GB마다 처리 요금', tone: 'bad', icon: 'coins' },
        { on: 'ep', text: '추가 요금 없음', tone: 'ok', icon: 'check', pos: 'bottom' },
        { on: 'app', text: '프라이빗 서브넷', pos: 'left' },
      ],
      flows: [{ path: ['bkt', 'nat', 'app'], kind: 'bad', n: 3 }, { path: ['bkt', 'ep', 'app'], kind: 'data', n: 3, delay: 1.8 }],
      metrics: { bill: ['NAT 처리', 'bad'] },
      changes: [['-', 'S3 트래픽의 NAT 경유'], ['+', 'S3 게이트웨이 엔드포인트'], ['~', '청구서 1위: NAT 처리 → EC2 시간']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 계정 × 리전 × 서비스',
      body: [
        'AWS의 모든 리소스는 <b>어느 계정의, 어느 리전의, 어느 서비스</b>에 있습니다. 안 보이면 계정과 리전부터 확인하고, CLI에서는 프로파일이 그 둘을 정합니다.',
        'VPC는 리전에, 서브넷은 AZ에 묶이고, 요금은 켜 둔 시간·저장량·나간 데이터로 잽니다. 다음 레슨에서는 같은 뼈대가 Azure에서 <b>테넌트 · 구독 · 리소스 그룹</b>이라는 다른 계층으로 나타나는 것을 봅니다.',
      ],
      hide: ['app', 'nat', 'bkt', 'ep', 'none'],
      show: ['acct', 'seoul', 'use1', 'fn', 'tbl', 'dev'],
      focus: ['fn'],
      flows: [{ path: ['dev', 'fn'], kind: 'ctrl', n: 2 }, { path: ['fn', 'dev'], kind: 'res', n: 2, delay: 1.5 }],
      metrics: { bill: ['EC2 시간', 'ok'] },
    },
  ],
  quiz: [
    {
      q: '콘솔에서 어제 만든 EC2 인스턴스가 보이지 않습니다. 가장 먼저 확인할 것은?',
      options: ['AWS 고객 지원에 복구를 요청한다', '콘솔에 선택된 리전과 로그인한 계정', 'IAM 정책에서 EC2 권한이 빠졌는지', '결제 수단이 만료됐는지'],
      answer: 1,
      why: 'EC2는 리전 단위 서비스라 다른 리전을 보고 있으면 목록이 비어 보입니다. 권한이 없으면 빈 목록이 아니라 권한 오류가 나고, 결제 문제로 리소스가 조용히 사라지지는 않습니다.',
    },
    {
      q: 'RDS Multi-AZ를 만들려는데 "서브넷이 둘 이상의 AZ에 있어야 한다"는 오류가 납니다. 이런 요구가 생기는 이유는?',
      options: ['VPC가 AZ 범위라서 VPC를 두 개 만들어야 해서', '서브넷 하나는 AZ 하나에만 속하므로, 두 AZ에 두려면 서브넷도 둘이어야 해서', '서브넷이 리전 범위라 IP가 모자라서', 'RDS는 퍼블릭 서브넷에만 둘 수 있어서'],
      answer: 1,
      why: 'AWS에서 VPC는 리전 범위, 서브넷은 AZ 범위입니다. 대기 인스턴스를 다른 AZ에 두려면 그 AZ에 속한 서브넷이 따로 있어야 합니다. VPC를 둘로 나눌 필요는 없습니다.',
    },
    {
      q: '계정 하나에서 개발과 운영을 함께 돌리던 팀이 계정을 나누고 Organizations로 묶었습니다. 이것으로 얻는 것이 아닌 것은?',
      options: ['개발 계정의 사고가 운영 데이터에 닿기 어려워진다', '계정별로 비용이 자연스럽게 갈린다', 'SCP로 계정들이 할 수 있는 일의 상한선을 정한다', '계정 사이의 데이터 전송이 자동으로 무료가 된다'],
      answer: 3,
      why: '계정 분리의 이득은 격리, 비용 구분, 정책 상한선입니다. 데이터 전송 요금은 계정이 아니라 트래픽이 어디서 어디로 가는지(리전·AZ·인터넷)에 따라 매겨집니다.',
    },
    {
      q: '프라이빗 서브넷의 서버가 같은 리전의 S3에서 대용량 파일을 자주 받는데, NAT Gateway 데이터 처리 요금이 큽니다. 가장 알맞은 조치는?',
      options: ['NAT Gateway를 AZ마다 하나씩 늘린다', '서버를 퍼블릭 서브넷으로 옮기고 공인 IP를 붙인다', 'S3 게이트웨이 VPC 엔드포인트를 만들어 NAT를 우회한다', 'S3 버킷을 다른 리전으로 옮긴다'],
      answer: 2,
      why: '게이트웨이 엔드포인트는 S3 트래픽을 NAT 없이 보내고 추가 요금이 없습니다. NAT를 늘리면 시간당 요금만 늘고, 퍼블릭으로 옮기면 서버가 인터넷에 노출됩니다. 다른 리전으로 옮기면 리전 간 전송 요금이 새로 붙습니다.',
    },
  ],
};
