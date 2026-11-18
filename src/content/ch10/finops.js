export default {
  id: 'finops',
  learn: [
    '청구서의 세 덩어리와 청구 데이터를 직접 읽는 법',
    '태그와 계정 분리로 비용에 주인 붙이기',
    '예산 · 이상 탐지 알림으로 청구서보다 먼저 알기',
    '크기 맞추기와 야간 중지',
    '약정 할인과 스팟을 쓰는 순서',
    'NAT · egress가 청구서와 멀티클라우드 설계를 좌우하는 이유',
  ],
  legend: [['data', '쌓이는 비용'], ['ctrl', '알림'], ['req', '나가는 트래픽'], ['bad', '새는 돈']],
  metrics: [
    { id: 'bill', label: '월 청구액', icon: 'receipt' },
    { id: 'untag', label: '태그 없는 비용', icon: 'tag' },
    { id: 'cpu', label: '운영 VM CPU', icon: 'cpu' },
    { id: 'commit', label: '약정 커버리지', icon: 'percent' },
    { id: 'egress', label: '전송 요금', icon: 'upload' },
  ],
  scene: {
    nodes: {
      bill: { kind: 'tile', at: [2.4, 0.6], label: '청구서', icon: 'receipt', color: 'yellow' },
      budget: { kind: 'tile', at: [4.0, -1.0], label: '예산 알림', icon: 'bell', color: 'orange' },
      lead: { kind: 'client', at: [5.7, -2.7], label: '팀장' },
      gpu: { at: [2.2, 5.8], label: 'GPU VM', sub: '실험용', icon: 'cpu', color: 'red' },
      spot: { at: [2.2, 5.8], label: 'VM', sub: '배치 (스팟)', icon: 'server', color: 'teal' },
      vm1: { at: [4, 4], label: 'VM', sub: '주문 (운영)', icon: 'server', color: 'blue' },
      vm2: { at: [5.8, 2.2], label: 'VM', sub: '검색 (개발)', icon: 'server', color: 'blue' },
      nat: { at: [5.8, 2.2], label: 'NAT', sub: 'Gateway', icon: 'router', color: 'orange' },
      ep: { kind: 'tile', at: [7.2, 3.6], label: '엔드포인트', icon: 'plug', color: 'green' },
      bkt: { kind: 'cyl', at: [7.6, 0.4], label: '스토리지', icon: 'archive', color: 'purple' },
      net: { kind: 'users', at: [6.8, 5.4], label: '인터넷 사용자' },
      other: { at: [8.9, 3.3], label: '분석 DB', sub: '다른 클라우드', icon: 'database', color: 'gcp' },
      one: { at: [3.9, 2.1], label: '통합 비용\n대시보드', icon: 'chart-bar', color: 'purple' },
      aws: { at: [4.2, 7.8], label: 'AWS', icon: 'cloud', color: 'aws' },
      azure: { at: [6.0, 6.0], label: 'Azure', icon: 'cloud', color: 'azure' },
      gcp: { at: [7.8, 4.2], label: 'GCP', icon: 'cloud', color: 'gcp' },
      ncp: { at: [9.6, 2.4], label: 'NCP', icon: 'cloud', color: 'ncp' },
    },
    edges: {
      e_v1: { from: 'vm1', to: 'bill' },
      e_v2: { from: 'vm2', to: 'bill' },
      e_bk: { from: 'bkt', to: 'bill' },
      e_gp: { from: 'gpu', to: 'bill', tone: 'bad' },
      e_sp: { from: 'spot', to: 'bill' },
      e_bl: { from: 'bill', to: 'lead' },
      e_bb: { from: 'bill', to: 'budget' },
      e_bd: { from: 'budget', to: 'lead' },
      e_out: { from: 'vm1', to: 'net' },
      e_x: { from: 'vm2', to: 'other', bi: true, tone: 'bad' },
      e_vn: { from: 'vm1', to: 'nat' },
      e_nb: { from: 'nat', to: 'bkt', tone: 'bad' },
      e_nbill: { from: 'nat', to: 'bill', tone: 'bad' },
      e_ve: { from: 'vm1', to: 'ep' },
      e_eb: { from: 'ep', to: 'bkt', tone: 'ok' },
      e_n1: { from: 'aws', to: 'one' },
      e_n2: { from: 'azure', to: 'one' },
      e_n3: { from: 'gcp', to: 'one' },
      e_n4: { from: 'ncp', to: 'one' },
    },
  },
  steps: [
    // 1
    {
      key: '두 배 청구서', kind: 'problem', title: '청구서가 지난달의 두 배로 나왔습니다',
      body: [
        'shop.example의 이번 달 클라우드 청구서는 1,240만 원. 지난달의 두 배입니다. 팀장이 묻습니다. "뭐가 늘었죠?" 아무도 답하지 못합니다.',
        '온프레미스에서는 구매 품의가 비용을 통제했습니다. 클라우드에서는 <b>엔지니어 누구나 클릭 한 번으로 돈을 씁니다</b>. 쓴 만큼 낸다는 장점이, 보지 않으면 얼마든지 새는 구조가 되는 거예요.',
      ],
      callout: { type: 'key', text: '<b>FinOps</b>는 비용을 재무팀만이 아니라 <b>만드는 사람의 일</b>로 삼는 운영 방식입니다. 순서는 늘 같아요. 먼저 <b>보이게</b> 하고, 그다음 <b>줄이고</b>, 계속 <b>지켜봅니다</b>.' },
      more: [
        { title: 'FinOps의 세 단계', rows: [
          ['보이게 (Inform)', '누가 무엇에 얼마를 쓰나 · 태그 · 대시보드', 'info'],
          ['줄이기 (Optimize)', '삭제 · 크기 · 시간 · 약정 · 스팟', 'ok'],
          ['운영하기 (Operate)', '예산 · 알림 · 정기 리뷰 · 정책', 'accent'],
        ] },
        { title: '왜 클라우드에서 새나', body: [
          '온프레미스 서버는 사는 순간 돈이 나가고 끝입니다. 더 쓰고 싶으면 다시 품의를 올려야 하니 자연스럽게 브레이크가 걸려요. 클라우드는 반대로 <b>사용을 멈추지 않으면 돈이 계속 나갑니다</b>. 실험용 VM, 연결이 끊긴 디스크, 아무도 안 보는 로그가 모두 매시간 과금돼요. 게다가 비용을 만드는 결정(인스턴스 크기, 로그 보관 기간, 데이터 경로)은 재무팀이 아니라 엔지니어가 코드로 내립니다.',
          '그래서 FinOps는 비용을 "줄여라"는 지시가 아니라, 엔지니어가 <b>자기 결정의 가격을 볼 수 있게</b> 만드는 일부터 시작합니다. 볼 수 있으면 대부분은 스스로 고칩니다.',
        ] },
        { title: '실무 팁', list: [
          '총액보다 <b>단위 비용</b>(주문 1건당, 활성 사용자 1명당 비용)을 같이 보세요. 트래픽이 두 배가 돼서 청구서가 두 배라면 정상입니다.',
          '이 레슨에서 청구서가 단계마다 어떻게 줄어드는지 "월 청구액" 타일로 따라가 보세요.',
        ] },
      ],
      show: ['bill', 'lead', 'vm1', 'vm2', 'bkt'],
      set: { bill: { badge: '1,240만 원', tone: 'bad' } },
      tags: [{ on: 'lead', text: '"뭐가 늘었죠?"', tone: 'warn', pos: 'right' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data', n: 2 }, { path: ['vm2', 'bill'], kind: 'data', n: 2, delay: 0.2 }, { path: ['bkt', 'bill'], kind: 'data', n: 2, delay: 0.4 }, { path: ['bill', 'lead'], kind: 'ctrl', delay: 1.8 }],
      metrics: { bill: ['1,240만 원', 'bad'], untag: ['100%', 'bad'], cpu: ['8%', 'warn'], commit: '0%', egress: '180만 원' },
    },
    // 2
    {
      key: '청구서 구조', kind: 'concept', title: '청구서는 세 덩어리로 읽습니다',
      body: [
        '수백 줄짜리 청구서도 크게 보면 셋입니다. <b>컴퓨트</b>는 크기 × 켜 둔 시간으로, <b>스토리지</b>는 용량 × 보관 기간으로 매겨집니다. 쓰든 안 쓰든 켜 둔 VM과 쌓아 둔 데이터는 계속 과금돼요.',
        '셋째가 <b>데이터 전송</b>입니다. 들어오는 트래픽은 대부분 무료지만, 클라우드 <b>밖으로 나가는</b> 데이터(egress)에는 GB마다 요금이 붙습니다. 견적에서 가장 자주 빠뜨리는 항목이에요.',
      ],
      callout: { type: 'tip', text: '청구서는 <b>큰 줄부터</b> 봅니다. 보통 상위 몇 줄이 대부분을 차지하니, 줄일 것도 거기서 찾는 편이 빠릅니다.' },
      more: [
        { title: '동작 원리: 한 줄의 생김새', body: [
          '청구서의 한 줄은 대개 <b>서비스 · 사용 유형 · 리전 · 수량 · 단가</b>로 이루어집니다. "서울 리전, m7g.large, 720시간, 시간당 얼마"처럼요. 관리형 DB는 인스턴스 시간 + 스토리지 GB + I/O · 백업 저장 + 전송으로 쪼개지고, 로드 밸런서도 시간 요금과 처리량 요금이 따로 붙습니다. 결국 대부분의 서비스 요금은 컴퓨트 · 스토리지 · 전송의 조합이에요.',
        ] },
        { title: '자주 놓치는 줄', list: [
          '<b>스냅샷과 백업</b>: 원본을 지워도 스냅샷은 남아 과금됩니다.',
          '<b>공인 IP</b>: 붙여 두기만 해도 시간당 요금이 붙는 클라우드가 많습니다.',
          '<b>로그 수집 · 보관</b>: 디버그 로그를 운영에 켜 두면 GB 단위로 쌓입니다(관측 레슨의 보관 등급을 떠올리세요).',
          '<b>NAT · 로드 밸런서의 처리량</b>: 시간 요금보다 GB당 처리 요금이 커지는 경우가 있습니다.',
          '<b>가용 영역 간 전송</b>: 같은 리전 안이라도 AZ를 넘으면 요금이 붙는 클라우드가 있습니다.',
        ] },
        { title: '두 가지 금액', body: [
          '약정을 선결제했다면 청구서에는 결제한 달에 한꺼번에 찍힙니다. 이것이 <b>실제 청구액</b>이고, 선결제를 약정 기간에 나눠 매달 쓴 만큼으로 보는 것이 <b>상각(amortized) 비용</b>입니다. 팀별로 비용을 나눌 때는 상각 비용을 써야 "선결제한 달의 팀"만 비싸 보이는 왜곡이 없습니다.',
        ] },
      ],
      show: ['net'],
      panel: { title: '과금 단위', icon: 'receipt', rows: [['컴퓨트', '크기 × 켜 둔 시간', 'info'], ['스토리지', '용량 × 보관 기간', 'accent'], ['데이터 전송', '밖으로 나간 GB', 'warn']] },
      tags: [{ on: 'vm1', text: '컴퓨트', tone: 'info', pos: 'bottom' }, { on: 'bkt', text: '스토리지', tone: 'accent', pos: 'right' }, { on: 'net', text: '데이터 전송', tone: 'warn', pos: 'left' }],
      flows: [{ path: ['vm1', 'net'], kind: 'req', n: 3 }, { path: ['vm1', 'bill'], kind: 'data', delay: 0.6 }, { path: ['bkt', 'bill'], kind: 'data', delay: 0.9 }],
    },
    // 3
    {
      key: '청구 데이터', kind: 'concept', title: '청구 데이터를 내보내 직접 묻습니다',
      body: [
        '콘솔의 비용 화면은 빠르게 훑기 좋지만, "어느 서비스의 어느 리소스가 언제부터"를 파려면 원천 데이터가 필요합니다. 네 클라우드 모두 <b>시간 · 리소스 단위 청구 데이터</b>를 스토리지나 데이터 웨어하우스로 매일 내보낼 수 있어요.',
        '내보낸 데이터는 SQL로 묻습니다. 서비스별로 묶어 큰 순서로 정렬하는 것이 첫 질의예요. 이번 달에는 컴퓨트, 그중 <b>태그 없는 GPU 인스턴스</b>가 위에 올라왔습니다.',
      ],
      callout: { type: 'tip', text: '청구 데이터 내보내기는 <b>첫날 켜 두세요</b>. 대부분 켠 시점부터 쌓이므로, 문제가 생긴 뒤에 켜면 지난달은 볼 수 없습니다.' },
      more: [
        { title: '동작 원리', body: [
          '내보내기는 하루에도 여러 번 갱신되는 큰 표입니다. 한 행이 "이 리소스가 이 시간에 이만큼 써서 이만큼 나왔다"예요. AWS는 Cost and Usage Report(Data Exports), Azure는 Cost Management의 내보내기, GCP는 BigQuery로의 청구 내보내기가 이 역할을 합니다. 최근에는 세 사업자 모두 공통 규격인 <b>FOCUS</b> 형식으로도 내보낼 수 있어서, 오른쪽처럼 같은 SQL을 여러 클라우드에 쓸 수 있습니다.',
        ] },
        { title: '직접 해보기', body: ['태그별, 리소스별로 파고드는 질의입니다. 열 이름은 FOCUS 규격을 따릅니다.'], code: { title: 'cost.sql', lang: 'text', text: `-- 태그가 없는 리소스 중 비싼 것 10개
SELECT ResourceId, ServiceName,
       SUM(EffectiveCost) AS cost
FROM focus_billing
WHERE ChargePeriodStart >= '2026-10-01'
  AND Tags['team'] IS NULL
GROUP BY 1, 2
ORDER BY cost DESC
LIMIT 10;

-- 일별 추이: 언제부터 늘었나
SELECT DATE(ChargePeriodStart) AS d,
       SUM(EffectiveCost)
FROM focus_billing GROUP BY 1 ORDER BY 1;` } },
        { title: '출력 읽기', list: [
          '<code>BilledCost</code>는 청구서에 찍히는 금액, <code>EffectiveCost</code>는 약정 할인과 선결제 상각을 반영한 금액입니다. 팀별 배분에는 보통 후자를 씁니다.',
          '일별 추이에서 계단처럼 뛰는 날을 찾으면 그날의 배포나 변경 기록과 맞춰 봅니다. 비용 급증의 원인은 대개 변경입니다.',
          '데이터는 몇 시간에서 하루쯤 늦게 반영됩니다. 오늘 일어난 일은 내일 보여요.',
          '팀마다 SQL을 따로 짜지 말고, 자주 쓰는 질의(서비스별 · 팀별 · 일별)를 대시보드로 만들어 모두가 같은 숫자를 보게 하세요.',
        ] },
      ],
      hide: ['net', 'lead'],
      code: {
        title: 'cost.sql', lang: 'text', hl: [6, 7, 8, 9],
        text: `SELECT ServiceName,
       SUM(EffectiveCost) AS cost
FROM focus_billing
WHERE ChargePeriodStart >= '2026-10-01'
GROUP BY 1 ORDER BY cost DESC LIMIT 4;
-- ServiceName        cost(만 원)
-- Compute            720
-- Data Transfer      180
-- Object Storage     150`,
      },
      tags: [{ on: 'vm1', text: '컴퓨트 720만', tone: 'warn', pos: 'bottom' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data', n: 2 }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.3 }, { path: ['bkt', 'bill'], kind: 'data', delay: 0.6 }],
      changes: [['+', '청구 데이터 매일 내보내기'], ['~', '가장 큰 줄: 컴퓨트 720만 원']],
    },
    // 4
    {
      key: '태그', kind: 'solution', title: '태그와 계정으로 주인을 붙입니다',
      body: [
        '줄이기 전에 <b>누구의 비용인지</b>부터 알아야 합니다. 모든 리소스에 <code>team</code>, <code>env</code>, <code>service</code> 같은 <b>태그</b>(GCP는 레이블)를 붙이면 청구서를 팀별·환경별로 쪼개 볼 수 있어요.',
        '더 확실한 경계는 <b>계정·구독·프로젝트를 나누는 것</b>입니다. 팀이나 환경마다 따로 두면 태그를 빠뜨려도 비용이 섞이지 않습니다. 나눠 본 결과를 각 팀에 보여 주는 것(showback)만으로도 지출이 줄어듭니다.',
      ],
      callout: { type: 'warn', text: '태그는 사람이 붙이면 반드시 빠집니다. Terraform의 기본 태그로 자동으로 붙이고, <b>태그 없는 리소스는 만들 수 없게</b> 정책으로 막으세요.' },
      more: [
        { title: '설정 예시', body: ['프로바이더에 기본 태그를 걸면 이 코드로 만드는 모든 리소스에 붙습니다.'], code: { title: 'providers.tf', lang: 'hcl', text: `provider "aws" {
  region = "ap-northeast-2"
  default_tags {
    tags = {
      team    = "order"
      env     = "prod"
      service = "shop"
      owner   = "order-team@shop.example"
    }
  }
}` } },
        { title: '태그 규칙 정하기', list: [
          '키는 소문자로, 몇 개만. <code>team · env · service · owner</code> 정도로 시작하고, 값의 목록도 정해 둡니다(<code>prod</code>와 <code>production</code>이 섞이면 둘로 나뉩니다).',
          '<b>태그를 못 붙이는 비용</b>도 있습니다. 공용 네트워크, 지원 플랜, 공유 클러스터는 사용량 비율 같은 규칙으로 나눠 배분(chargeback)합니다.',
          'AWS는 비용 할당 태그를 결제 콘솔에서 <b>활성화해야</b> 비용 데이터에 나타납니다. 활성화 전 기간은 따로 처리해야 할 수 있어요.',
          '쿠버네티스는 노드 하나를 여러 팀이 나눠 써서 클라우드 태그만으로는 못 나눕니다. 네임스페이스 · 레이블 단위로 나눠 주는 OpenCost 같은 도구를 씁니다.',
        ] },
        { title: '막는 설정', rows: [
          ['AWS', 'Organizations 태그 정책 · SCP로 태그 없는 생성 거부', 'aws'],
          ['Azure', 'Azure Policy: 태그 필수 · 리소스 그룹에서 상속', 'azure'],
          ['GCP', '프로젝트 단위 분리 + 레이블 규칙 검사', 'gcp'],
          ['공통', 'CI에서 Terraform plan의 태그 누락 검사', 'mute'],
        ] },
      ],
      show: ['lead'],
      panel: { title: '태그로 나눈 청구서', icon: 'tag', rows: [['team=order', '430만 원', 'info'], ['team=search', '390만 원', 'accent'], ['태그 없음', '420만 원', 'bad']] },
      tags: [{ on: 'vm1', text: 'team=order', tone: 'info', icon: 'tag', pos: 'bottom' }, { on: 'vm2', text: 'team=search', tone: 'accent', icon: 'tag', pos: 'bottom' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data', n: 2 }, { path: ['vm2', 'bill'], kind: 'data', n: 2, delay: 0.3 }, { path: ['bkt', 'bill'], kind: 'data', delay: 0.6 }],
      metrics: { untag: ['34%', 'warn'] },
      changes: [['+', 'team · env 태그'], ['~', '태그 없는 비용 100% → 34%'], ['~', '남은 420만 원은 주인 불명']],
    },
    // 5
    {
      key: '잊힌 리소스', kind: 'case', title: '사례: 석 달째 혼자 돌던 GPU 서버',
      body: [
        '"태그 없음" 420만 원을 열어 보니 대부분이 GPU VM 한 대였습니다. 석 달 전 누군가 추천 모델을 실험하려고 띄웠고, 실험이 끝난 뒤 끄는 것을 잊었습니다. 만든 사람은 이미 다른 팀으로 옮겼고요.',
        '아무도 몰랐던 이유는 단순합니다. 주인을 알려 줄 태그도, 비용이 튀었다고 알려 줄 알림도 없었습니다. VM을 지운 뒤 남은 <b>연결 안 된 디스크</b>, 쓰지 않는 공인 IP, 오래된 스냅샷도 같은 식으로 조용히 과금됩니다.',
      ],
      callout: { type: 'tip', text: '실험용 리소스에는 만들 때 <code>owner</code>와 <b>만료일</b> 태그를 붙이고, 기한이 지난 것은 자동으로 정리하세요. Terraform으로 만들었다면 <code>destroy</code> 한 번입니다.' },
      more: [
        { title: '직접 해보기: 고아 리소스 찾기', code: { title: 'terminal', lang: 'sh', text: `# 어디에도 붙어 있지 않은 디스크
$ aws ec2 describe-volumes \\
    --filters Name=status,Values=available \\
    --query 'Volumes[].[VolumeId,Size,CreateTime]'

# 연결 안 된 공인 IP
$ aws ec2 describe-addresses \\
    --query 'Addresses[?AssociationId==null].PublicIp'

# 90일 넘은 내 스냅샷
$ aws ec2 describe-snapshots --owner-ids self \\
    --query "Snapshots[?StartTime<'2026-08-20'].SnapshotId"` } },
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '"태그 없음"과 컴퓨트 줄이 몇 달째 같은 금액', 'bad'],
          ['원인', '주인 태그 없음 · 비용 알림 없음 · 종료 절차 없음', 'warn'],
          ['해결', '스냅샷 남기고 삭제 · 만료일 태그 · 자동 정리', 'ok'],
        ] },
        { title: '실무 팁', list: [
          '지우기 전에 주인을 찾는 시간을 정해 둡니다. "태그 없는 리소스는 공지 후 2주 뒤 중지, 4주 뒤 삭제" 같은 규칙이 있으면 망설이지 않아도 됩니다.',
          '바로 지우기 겁나면 먼저 <b>중지</b>하고 디스크 스냅샷을 남겨 둡니다. 누가 찾아오면 되살릴 수 있어요.',
          '실험 계정(샌드박스)을 따로 두고 계정 단위 예산을 낮게 잡으면 이런 사고의 크기 자체가 줄어듭니다.',
          'GPU처럼 시간당 단가가 큰 리소스는 만들 때부터 <b>자동 종료 시각</b>을 함께 정하게 합니다. 노트북 · 실험 플랫폼 대부분이 "유휴 몇 시간 뒤 종료" 옵션을 갖고 있어요.',
          '위 명령은 리전 하나만 봅니다. 공격이나 실수로 만든 리소스는 평소 안 쓰는 리전에 숨어 있기 쉬우니 모든 리전을 돌며 확인하세요.',
        ] },
      ],
      hide: ['lead'],
      show: ['gpu'],
      set: { gpu: { state: 'hot', badge: '월 310만 원', tone: 'bad' } },
      focus: ['gpu'],
      tags: [{ on: 'gpu', text: '석 달째 · 주인 없음', tone: 'bad', pos: 'bottom' }],
      flows: [{ path: ['gpu', 'bill'], kind: 'bad', n: 5, gap: 0.25 }, { path: ['vm1', 'bill'], kind: 'data', delay: 0.4 }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.6 }],
    },
    // 6
    {
      key: '예산 알림', kind: 'solution', title: '예산 알림: 청구서보다 먼저 알기',
      body: [
        '석 달 뒤 청구서로 아는 것은 너무 늦습니다. <b>예산(budget)</b>을 팀·계정별로 정해 두면 실제 지출이 50%·80%·100%에 닿을 때, 또는 <b>이 속도면 넘길 것으로 예측될 때</b> 담당자에게 알림이 갑니다.',
        '평소와 다른 지출을 찾아 주는 <b>이상 탐지</b>도 함께 켜 두세요. GPU 서버가 켜진 그 주에 알았다면 석 달 치가 아니라 일주일 치로 끝났을 겁니다.',
      ],
      callout: { type: 'warn', text: '예산 알림은 <b>알려 줄 뿐 멈추지 않습니다</b>. 한도를 넘어도 리소스는 계속 돌아가요. 비용 데이터도 몇 시간에서 하루쯤 늦게 반영됩니다.' },
      more: [
        { title: '설정 예시', code: { title: 'budget.tf', lang: 'hcl', text: `resource "aws_budgets_budget" "order" {
  name         = "team-order-monthly"
  budget_type  = "COST"
  limit_amount = "4000"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  cost_filter {
    name   = "TagKeyValue"
    values = ["user:team$order"]
  }
  notification {
    comparison_operator = "GREATER_THAN"
    threshold           = 80
    threshold_type      = "PERCENTAGE"
    notification_type   = "FORECASTED"
    subscriber_email_addresses = ["order-team@shop.example"]
  }
}` } },
        { title: '예산과 이상 탐지의 차이', body: [
          '예산은 <b>고정된 선</b>입니다. 월 400만 원 예산이면 하루 5만 원이 새는 일은 월말에야 걸립니다. 이상 탐지는 각 서비스 · 계정의 <b>평소 패턴</b>을 학습해, 총액이 예산 안이어도 "GPU 비용이 어제부터 평소의 열 배"처럼 튀는 것을 잡아요. 둘은 서로를 대신하지 못합니다.',
        ] },
        { title: '알림을 행동으로', list: [
          '알림은 재무팀이 아니라 <b>그 비용을 만든 팀</b>의 채널로 보냅니다. 받은 사람이 바로 고칠 수 있어야 합니다.',
          '정말 멈춰야 하는 곳(샌드박스 계정)은 알림을 자동화에 연결합니다. 예컨대 GCP 예산은 Pub/Sub로 메시지를 보내 함수가 리소스를 끄게 할 수 있고, AWS Budgets에도 한도 도달 시 정책을 붙이는 동작이 있습니다. 운영 계정에 자동 중지를 거는 것은 장애를 부를 수 있으니 신중하게.',
          '월말이 아니라 <b>주간 비용 리뷰</b>를 짧게 엽니다. 지난주 대비 가장 많이 늘어난 줄 다섯 개만 봐도 충분합니다.',
          '예산 금액은 처음엔 지난 3개월 평균에 약간의 여유를 더해 잡고, 분기마다 실제 계획에 맞춰 고칩니다. 너무 넉넉하면 알림이 안 오고, 너무 빡빡하면 매달 울려 무시됩니다.',
        ] },
      ],
      hide: ['gpu', 'e_bl'],
      show: ['budget', 'lead'],
      set: { bill: { badge: '930만 원', tone: 'warn' } },
      focus: ['budget'],
      tags: [{ on: 'budget', text: '예산의 80% 예측', tone: 'warn' }],
      flows: [{ path: ['bill', 'budget', 'lead'], kind: 'ctrl', n: 2 }, { path: ['vm1', 'bill'], kind: 'data', delay: 0.5 }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.7 }],
      metrics: { bill: '930만 원', untag: ['0%', 'ok'] },
      changes: [['-', '잊힌 GPU VM 삭제 (−310만 원)'], ['+', '팀별 예산 · 이상 탐지'], ['~', '태그 없는 비용 34% → 0%']],
    },
    // 7
    {
      key: '크기 맞추기', kind: 'solution', title: '크기 맞추기: 쓰는 만큼의 VM으로',
      body: [
        '주문 VM의 CPU는 평균 8%, 최고 30%였습니다. <b>크기 맞추기(rightsizing)</b>는 몇 주치 메트릭에서 CPU와 <b>메모리의 최고치</b>를 확인하고 한두 단계 작은 크기로 바꾸는 일입니다. 같은 계열에서 한 단계 내릴 때마다 요금은 대략 절반이에요.',
        '세 클라우드 모두 사용률을 보고 <b>추천</b>을 내줍니다. 추천은 출발점일 뿐, 피크와 메모리를 직접 확인하고 바꿉니다.',
      ],
      callout: { type: 'warn', text: '크기는 평균이 아니라 <b>피크와 메모리</b>를 보고 줄여야 장애가 나지 않아요. 메모리 사용률은 에이전트를 깔아야 보이는 경우가 많습니다.' },
      more: [
        { title: '판단 기준', rows: [
          ['CPU 최고치', '4주간 p95 · p99가 40% 미만이면 후보', 'info'],
          ['메모리 최고치', '에이전트로 확인 · 여유 20% 이상 남기기', 'warn'],
          ['네트워크 · 디스크', '작은 크기는 대역폭 · IOPS 한도도 낮음', 'warn'],
          ['세대 바꾸기', '같은 크기라도 새 세대 · ARM이 더 싼 경우', 'ok'],
        ] },
        { title: '추천 도구', list: [
          'AWS <b>Compute Optimizer</b>, Azure <b>Advisor</b>, GCP <b>Recommender</b>가 VM · 디스크 · 관리형 DB의 크기 추천을 냅니다.',
          'AWS에서 메모리는 기본 메트릭에 없습니다. CloudWatch 에이전트를 깔아야 추천이 메모리를 고려해요.',
          '쿠버네티스에서는 VM보다 <b>Pod의 requests</b>가 먼저입니다. requests를 부풀려 두면 노드가 한가해도 꽉 찬 것처럼 보여 노드가 늘어납니다(7장 스케줄링 레슨). VPA의 추천 모드로 실제 사용량을 확인하세요.',
        ] },
        { title: '흔한 실수', body: [
          '평균만 보고 줄였다가 월말 정산이나 이벤트 날 피크에 터지는 것이 가장 흔합니다. 바꾼 뒤에는 응답 시간과 에러율(관측 레슨의 RED)을 며칠 지켜보고, 오토스케일링 그룹이라면 최소 대수와 함께 조정하세요. 크게 줄일 수 있는 것은 대개 "혹시 몰라 크게 잡은" 개발 · 스테이징 환경입니다.',
        ] },
      ],
      hide: ['budget', 'lead'],
      set: { bill: { badge: '820만 원', tone: 'warn' }, vm1: { sub: '절반 크기' } },
      focus: ['vm1'],
      tags: [{ on: 'vm1', text: 'CPU 8% → 크기 절반', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data' }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.4 }, { path: ['bkt', 'bill'], kind: 'data', delay: 0.8 }],
      metrics: { cpu: ['35%', 'ok'], bill: '820만 원' },
      changes: [['~', '주문 VM을 한 단계 작은 크기로'], ['~', '월 930만 → 820만 원']],
    },
    // 8
    {
      key: '야간 중지', kind: 'solution', title: '야간 중지: 안 쓰는 시간에는 끕니다',
      body: [
        '개발 환경은 평일 낮에만 씁니다. 일주일 168시간 가운데 50시간쯤이죠. 스케줄로 <b>밤과 주말에 꺼 두면</b> 그 환경의 컴퓨트 비용의 약 70%가 사라집니다.',
        '운영 환경은 끌 수 없지만 <b>오토스케일링</b>으로 같은 효과를 냅니다. 새벽에 트래픽이 줄면 서버도 줄어들게요.',
      ],
      callout: { type: 'warn', text: 'VM을 <b>중지해도 디스크 요금은 계속</b> 나옵니다. 공인 IP를 붙여 둔 채라면 그 요금도요. 중지는 컴퓨트만 멈춥니다.' },
      more: [
        { title: '계산해 보기', body: [
          '평일 10시간 × 5일 = 50시간. 168시간 중 118시간을 끄면 70%가 줄어요. 개발 VM 열 대가 시간당 1,000원씩이라면 월 약 73만 원(730시간)에서 약 22만 원으로 내려갑니다. 디스크와 스냅샷 요금은 그대로 남으니 실제 절감은 그보다 조금 작습니다.',
        ] },
        { title: '설정 예시', body: ['쿠버네티스 개발 클러스터라면 노드 그룹의 크기를 스케줄로 0까지 줄입니다.'], code: { title: 'terminal', lang: 'sh', text: `# 평일 20시: 개발 노드 그룹을 0대로
$ aws eks update-nodegroup-config \\
    --cluster-name dev --nodegroup-name apps \\
    --scaling-config minSize=0,maxSize=6,desiredSize=0

# 평일 08시: 다시 3대로 (스케줄러가 실행)
$ aws eks update-nodegroup-config \\
    --cluster-name dev --nodegroup-name apps \\
    --scaling-config minSize=3,maxSize=6,desiredSize=3` } },
        { title: '클라우드별로', rows: [
          ['AWS', 'EventBridge Scheduler · Instance Scheduler', 'aws'],
          ['Azure', 'VM 시작/중지 자동화 · 자동 종료 설정', 'azure'],
          ['GCP', 'VM 인스턴스 일정(instance schedule)', 'gcp'],
          ['공통', 'CI 파이프라인의 예약 작업으로 Terraform 적용', 'mute'],
        ] },
        { title: '흔한 실수', list: [
          '끄는 것만 자동화하고 켜는 것은 사람이 하게 두기. 아침마다 "개발 서버 켜 주세요"가 오고, 결국 아무도 안 끄게 됩니다.',
          '야근이나 다른 시간대 동료를 잊는 것. <code>keep-on=true</code> 같은 태그로 하루 예외를 둘 수 있게 하세요.',
          '관리형 DB는 중지해도 일정 기간이 지나면 <b>저절로 다시 시작</b>되는 경우가 있습니다(예: AWS RDS는 7일). 스케줄이 주기적으로 다시 꺼야 합니다.',
        ] },
      ],
      set: { bill: { badge: '740만 원', tone: 'warn' }, vm2: { sub: '낮에만 켬' } },
      focus: ['vm2'],
      tags: [{ on: 'vm2', text: '밤·주말 자동 중지', tone: 'ok', icon: 'moon', pos: 'bottom' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data' }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.4 }, { path: ['bkt', 'bill'], kind: 'data', delay: 0.8 }],
      metrics: { bill: '740만 원' },
      changes: [['~', '개발 환경: 주 168시간 → 50시간'], ['~', '월 820만 → 740만 원']],
    },
    // 9
    {
      key: '약정 할인', kind: 'solution', title: '항상 켜 두는 몫은 약정으로',
      body: [
        '크기와 시간을 맞춘 뒤 남는 것이 <b>항상 켜 두는 바닥 사용량</b>입니다. 이 몫은 1년이나 3년 쓰겠다고 약속하는 <b>약정 할인</b>으로 크게 깎습니다. 대신 약속한 만큼은 안 써도 내야 해요.',
        '얼마나 약정할지는 지난 몇 달의 <b>최저 사용량</b>을 보고 정합니다. 바닥만큼 약정하고, 그 위로 오르내리는 부분은 온디맨드로 둡니다.',
      ],
      callout: { type: 'cloud', text: '약정은 AWS <b>Savings Plans · Reserved Instances</b>, Azure <b>Reservations · Savings Plan</b>, GCP <b>CUD</b>입니다. 크기를 줄이기 전에 약정하면 <b>낭비를 3년 동안 약속</b>하게 됩니다.' },
      more: [
        { title: '두 숫자로 관리합니다', rows: [
          ['커버리지', '전체 사용량 중 약정이 덮는 비율', 'info'],
          ['활용률', '약정한 것 중 실제로 쓴 비율', 'ok'],
          ['목표 예', '커버리지 70~80% · 활용률 95% 이상', 'accent'],
        ] },
        { title: '동작 원리', body: [
          '약정은 특정 VM에 붙는 것이 아니라 <b>매시간의 사용량에 할인을 적용</b>하는 방식입니다. 예컨대 "시간당 1만 원어치 컴퓨트를 1년 쓰겠다"고 약정하면, 매시간 그만큼의 사용량이 할인가로 계산되고 넘는 부분은 정가예요. 그 시간에 덜 썼다면 남은 약정은 사라집니다. 그래서 커버리지를 100%로 잡으면 새벽처럼 사용량이 줄어드는 시간마다 버리는 돈이 생깁니다.',
        ] },
        { title: '고르는 기준', list: [
          '<b>유연한 약정</b>(금액 단위, 인스턴스 계열 · 리전 무관)은 할인이 조금 작은 대신 크기나 계열을 바꿔도 계속 적용됩니다. 크기 맞추기를 계속할 팀에게 맞아요.',
          '<b>특정 인스턴스 약정</b>은 할인이 더 크지만 그 계열 · 리전에 묶입니다.',
          '1년과 3년, 선결제 여부에 따라 할인율이 달라집니다. 3년은 할인이 크지만 그 사이 아키텍처가 바뀔 위험도 큽니다.',
          'GCP는 약정 없이도 한 달에 오래 켜 둔 일부 VM에 <b>지속 사용 할인</b>이 자동으로 붙습니다.',
          '약정은 조직 전체에서 나눠 쓰게 할 수 있습니다. 팀마다 따로 사면 남는 약정이 생기기 쉬워요.',
        ] },
      ],
      set: { bill: { badge: '650만 원', tone: 'warn' }, vm1: { sub: '약정 적용' } },
      focus: ['vm1'],
      panel: { title: '세 가지 구매 방식', icon: 'coins', rows: [['온디맨드', '정가 · 약속 없음', 'mute'], ['약정 1~3년', '큰 할인 · 못 무름', 'ok'], ['스팟', '가장 쌈 · 회수 가능', 'warn']] },
      tags: [{ on: 'vm1', text: '바닥 사용량만 약정', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data' }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.4 }],
      metrics: { bill: '650만 원', commit: ['72%', 'ok'] },
      changes: [['+', '바닥 사용량에 1년 약정'], ['~', '약정 커버리지 0% → 72%'], ['~', '월 740만 → 650만 원']],
    },
    // 10
    {
      key: '스팟', kind: 'solution', title: '끊겨도 되는 일은 스팟으로',
      body: [
        '<b>스팟</b>은 클라우드의 남는 용량을 아주 싸게 빌리는 대신, 짧은 예고 뒤 <b>회수될 수 있는</b> VM입니다. 야간 통계 배치, CI 빌드, 상태 없는 워커처럼 중간에 끊겨도 다시 하면 되는 일에 씁니다.',
        '회수 예고를 받으면 하던 일을 정리하고(체크포인트), 다른 스팟이나 온디맨드로 이어서 합니다. 여러 인스턴스 유형과 AZ에 <b>골고루 나눠</b> 요청할수록 한꺼번에 회수될 위험이 줄어요.',
      ],
      callout: { type: 'warn', text: '회수 예고는 짧습니다. AWS는 약 2분, Azure · GCP는 약 30초예요. 그 안에 정리할 수 없는 일은 스팟에 올리지 마세요.' },
      more: [
        { title: '맞는 일과 안 맞는 일', rows: [
          ['맞음', '배치 · CI · 렌더링 · 상태 없는 웹 워커 일부', 'ok'],
          ['조건부', '쿠버네티스 노드 일부(여러 유형 · 온디맨드와 섞기)', 'warn'],
          ['안 맞음', '단일 DB · 세션을 쥔 서버 · 한 대뿐인 서비스', 'bad'],
        ] },
        { title: '동작 원리: 회수 처리', body: [
          'AWS는 인스턴스 메타데이터와 이벤트로 회수 예고를 알려 줍니다. 쿠버네티스라면 노드 종료 처리기나 Karpenter가 이 신호를 받아 노드를 <b>cordon · drain</b> 해서 Pod를 다른 노드로 옮겨요. 앱은 SIGTERM을 받으면 진행 중인 요청을 끝내고 나가도록 만들어 둡니다(7장 롤링 업데이트의 graceful shutdown과 같은 원리).',
        ], code: { title: 'terminal (인스턴스 안에서)', lang: 'sh', text: `$ curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/spot/instance-action
{"action": "terminate", "time": "2026-11-18T02:31:00Z"}` } },
        { title: '실무 팁', list: [
          '쿠버네티스에서는 스팟 노드에 taint를 걸고, 끊겨도 되는 워크로드만 toleration으로 올라가게 합니다.',
          '배치는 작게 쪼개 자주 저장합니다. 6시간짜리 작업이 5시간 59분에 회수되면 할인이 의미 없어져요.',
          '스팟 가격과 회수 빈도는 유형 · AZ마다 다르고 수시로 변합니다. 특정 유형 하나에 의존하지 마세요.',
          '운영 웹 서버라면 온디맨드(또는 약정)로 최소 대수를 받치고, 늘어나는 몫만 스팟으로 채우는 혼합 구성이 흔합니다. 스팟이 모두 회수돼도 서비스는 느려질 뿐 멈추지 않아요.',
        ] },
      ],
      show: ['spot'],
      set: { bill: { badge: '610만 원', tone: 'warn' } },
      focus: ['spot'],
      tags: [{ on: 'spot', text: '끊겨도 다시 하면 됨', tone: 'warn', pos: 'bottom' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data' }, { path: ['spot', 'bill'], kind: 'data', delay: 0.3 }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.6 }],
      metrics: { bill: '610만 원' },
      changes: [['+', '야간 배치를 스팟으로'], ['~', '월 650만 → 610만 원']],
    },
    // 11
    {
      key: 'NAT 요금', kind: 'case', title: '사례: 백업이 NAT를 지나간 대가',
      body: [
        '"데이터 전송" 줄을 열어 보니 인터넷으로 나간 것도 아닌데 <b>NAT 게이트웨이 처리 요금</b>이 월 60만 원이었습니다. 프라이빗 서브넷의 주문 VM이 매일 밤 수백 GB 백업을 같은 리전의 스토리지로 올리고 있었어요.',
        '프라이빗 서브넷에서 스토리지의 공개 주소로 가는 트래픽은 기본 경로인 <b>NAT를 지나고</b>, NAT는 지나간 GB마다 요금을 받습니다. 해결은 스토리지용 <b>VPC 엔드포인트</b>를 만들어 그 경로를 NAT 밖으로 빼는 것이었습니다.',
      ],
      callout: { type: 'tip', text: 'AWS에서 S3 · DynamoDB용 <b>게이트웨이 엔드포인트</b>는 무료입니다. 같은 리전의 스토리지로 큰 데이터를 보낸다면 가장 먼저 확인하세요.' },
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', 'NAT 처리 바이트 · 요금이 밤마다 급증', 'bad'],
          ['원인', '프라이빗 서브넷 → 스토리지 공개 주소 → NAT 경유', 'warn'],
          ['해결', '스토리지 엔드포인트 + 라우팅 테이블 연결', 'ok'],
          ['확인', 'NAT 처리량 메트릭 · 청구서의 NAT 줄 감소', 'info'],
        ] },
        { title: '설정 예시', code: { title: 'endpoint.tf', lang: 'hcl', text: `resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.shop.id
  service_name      = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
}` } },
        { title: '같은 함정의 다른 모습', list: [
          '컨테이너 이미지를 매번 NAT 너머 레지스트리에서 받는 노드들. 레지스트리용 엔드포인트나 같은 리전의 미러를 둡니다.',
          '<b>가용 영역 간 트래픽</b>: AZ마다 NAT가 하나씩 있는데 다른 AZ의 NAT로 라우팅하면 AZ 간 전송비까지 붙습니다. AZ마다 자기 NAT를 쓰게 하세요.',
          'Azure는 서비스 엔드포인트 · 프라이빗 엔드포인트, GCP는 비공개 Google 액세스(Private Google Access)로 같은 문제를 풉니다. 이름은 달라도 "공용 서비스로 가는 길을 사설로" 만드는 것입니다.',
          'VPC와 NAT 자체의 구조는 3장 VPC와 서브넷 레슨에서 봤습니다.',
          '찾는 방법: NAT의 처리 바이트 메트릭이 튀는 시각과 VPC 흐름 로그의 목적지 IP를 맞춰 보면, 어느 서버가 어디로 보내는지 나옵니다.',
        ] },
      ],
      hide: ['spot', 'vm2', 'e_bk'],
      show: ['nat', 'ep'],
      set: { nat: { state: 'hot', badge: '월 60만 원', tone: 'bad' }, bill: { badge: '550만 원', tone: 'warn' } },
      focus: ['nat'],
      tags: [{ on: 'vm1', text: '밤마다 백업 수백 GB', pos: 'bottom' }, { on: 'ep', text: '해결: NAT 우회', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['vm1', 'nat', 'bkt'], kind: 'bad', n: 4, gap: 0.3 }, { path: ['nat', 'bill'], kind: 'bad', n: 2, delay: 1.2 }, { path: ['vm1', 'ep', 'bkt'], kind: 'data', n: 2, delay: 2.6 }],
      metrics: { egress: ['120만 원', 'warn'], bill: '550만 원' },
      changes: [['-', 'NAT 처리 요금 월 60만 원'], ['~', '원인: 스토리지 트래픽이 NAT 경유'], ['+', '해결: 스토리지 엔드포인트']],
    },
    // 12
    {
      key: 'egress', kind: 'concept', title: '나가는 데이터: 멀티클라우드의 숨은 비용',
      body: [
        '데이터 전송 요금은 <b>경계를 넘을 때</b> 붙습니다. 인터넷으로 나갈 때가 가장 비싸고, 리전이나 가용 영역 사이에도 붙을 수 있어요. 멀티클라우드에서는 <b>클라우드 사이를 오가는 모든 데이터가 egress</b>입니다.',
        '앱은 AWS, 분석 DB는 다른 클라우드에 두니 하루 1TB를 복제하고 있었습니다. GB당 100원으로만 쳐도 한 달에 300만 원이에요. 분석 DB를 앱과 같은 클라우드로 옮기고, 사용자 응답은 CDN과 압축으로 줄였습니다.',
      ],
      callout: { type: 'key', text: '<b>자주 대화하는 것끼리는 같은 클라우드, 같은 리전에</b> 둡니다. 데이터는 무거워서, 옮기는 비용이 아키텍처를 정합니다.' },
      more: [
        { title: '경계별 요금의 대략적인 순서', rows: [
          ['같은 AZ · 사설 IP', '대개 무료', 'ok'],
          ['다른 AZ (같은 리전)', 'GB당 소액 · 양방향일 수 있음', 'mute'],
          ['다른 리전', 'GB당 더 큼', 'warn'],
          ['인터넷 · 다른 클라우드', '가장 큼 · 지역별로 다름', 'bad'],
          ['들어오는 트래픽', '대부분 무료', 'ok'],
        ] },
        { title: '줄이는 방법', list: [
          '<b>CDN</b>: 정적 파일과 이미지를 엣지에서 내주면 원본의 egress가 크게 줄고, CDN의 전송 단가는 보통 원본보다 쌉니다.',
          '<b>압축과 형식</b>: 응답 압축, 이미지 형식 바꾸기, 분석용 데이터는 컬럼 형식으로 압축해 보냅니다.',
          '<b>계산을 데이터 쪽으로</b>: 원본을 통째로 옮기지 말고 그 클라우드 안에서 집계한 결과만 보냅니다.',
          '<b>전용선</b>: 클라우드 간 대량 전송이 계속된다면 전용선 연결의 전송 단가가 인터넷보다 낮은 경우가 있습니다(3장 하이브리드 연결).',
        ] },
        { title: '더 생각해 볼 것', body: [
          '최근 일부 사업자는 다른 클라우드로 <b>완전히 이전하는</b> 고객에게 egress를 면제해 주는 제도를 두고 있습니다. 하지만 매일 오가는 운영 트래픽은 해당하지 않아요. "나중에 옮기기 쉽게"와 "평소에 싸게"는 다른 문제입니다. 멀티클라우드 설계에서 데이터를 어디에 두느냐는 11장에서 데이터 중력이라는 이름으로 다시 다룹니다.',
        ] },
      ],
      hide: ['nat', 'ep'],
      show: ['vm2', 'e_bk', 'net', 'other'],
      set: { bill: { badge: '500만 원', tone: 'ok' } },
      tags: [{ on: 'other', text: '오갈 때마다 egress', tone: 'bad', pos: 'bottom' }, { on: 'net', text: 'CDN · 압축', tone: 'ok', pos: 'left' }],
      flows: [{ path: ['vm1', 'net'], kind: 'req', n: 3 }, { path: ['vm2', 'other'], kind: 'bad', n: 3, delay: 0.4 }, { path: ['other', 'vm2'], kind: 'bad', n: 3, delay: 1.6 }],
      metrics: { egress: ['70만 원', 'ok'], bill: ['500만 원', 'ok'] },
      changes: [['~', '분석 DB를 앱과 같은 클라우드로'], ['+', '정적 파일은 CDN으로'], ['~', '전송 요금 120만 → 70만 원']],
    },
    // 13
    {
      key: '4대 클라우드', kind: 'compare', title: '네 장의 청구서를 하나로 보기',
      body: [
        '네 클라우드 모두 비용 분석 화면과 예산 알림을 기본으로 제공합니다. 한 클라우드 안에서는 이것으로 충분해요. 문제는 청구서가 네 장이고, 항목 이름도 단위도 통화도 제각각이라는 점입니다.',
        '멀티클라우드라면 <b>태그 키를 모든 클라우드에서 똑같이</b> 쓰고, 청구 데이터를 내보내 한곳에 모읍니다. 형식을 맞추는 공개 규격 <b>FOCUS</b>가 있고, 쿠버네티스 비용은 OpenCost 같은 도구가 네임스페이스별로 나눠 줍니다.',
      ],
      callout: { type: 'warn', text: '약정 할인은 <b>클라우드마다 따로</b>입니다. 워크로드를 여러 클라우드에 얇게 펴면 어느 쪽에서도 큰 할인을 받기 어려워요. 멀티클라우드의 값에는 이것도 들어 있습니다.' },
      more: [
        { title: '클라우드별로', rows: [
          ['AWS', 'Cost Explorer · Budgets · Cost Anomaly Detection · Data Exports', 'aws'],
          ['Azure', 'Cost Management (분석 · 예산 · 이상 알림 · 내보내기)', 'azure'],
          ['GCP', 'Billing 보고서 · Budgets · BigQuery 청구 내보내기', 'gcp'],
          ['NCP', '콘솔의 비용 관리 화면 · 이용 내역 조회', 'ncp'],
        ] },
        { title: '한곳에 모으는 구조', list: [
          '각 클라우드의 청구 데이터를 매일 오브젝트 스토리지나 데이터 웨어하우스로 내보냅니다.',
          '가능하면 FOCUS 형식으로 받아 열 이름을 맞추고, 통화를 하나로 환산합니다.',
          '태그 키(<code>team · env · service</code>)가 클라우드마다 같아야 합칠 수 있습니다. 대소문자와 값 목록까지 맞추세요.',
          '공유 비용(전용선, 공통 모니터링)은 배분 규칙을 문서로 정해 둡니다.',
        ] },
        { title: '더 생각해 볼 것', body: [
          '도구보다 어려운 것은 <b>같은 기준</b>입니다. 한쪽은 상각 비용, 한쪽은 청구 금액으로 비교하면 엉뚱한 클라우드가 비싸 보입니다. 단위 비용(주문 1건당)으로 클라우드 간 같은 서비스를 비교할 수 있게 되면, "어디에 무엇을 둘지"를 감이 아니라 숫자로 이야기할 수 있어요.',
        ] },
      ],
      hide: ['bill', 'vm1', 'vm2', 'bkt', 'net', 'other', 'ep'],
      show: ['one', 'aws', 'azure', 'gcp', 'ncp'],
      panel: { title: '비용 분석 도구', icon: 'cloud', rows: [['AWS', 'Cost Explorer · Budgets', 'aws'], ['Azure', 'Cost Management', 'azure'], ['GCP', 'Billing 보고서 · Budgets', 'gcp'], ['NCP', '콘솔 비용 관리', 'ncp']] },
      focus: ['one'],
      tags: [{ on: 'one', text: '같은 태그 키로 합산', tone: 'ok' }],
      flows: [{ path: ['aws', 'one'], kind: 'data' }, { path: ['azure', 'one'], kind: 'data', delay: 0.2 }, { path: ['gcp', 'one'], kind: 'data', delay: 0.4 }, { path: ['ncp', 'one'], kind: 'data', delay: 0.6 }],
    },
    // 14
    {
      key: '정리', kind: 'recap', title: '정리: 보이게, 줄이고, 지켜보기',
      body: [
        '청구서는 <b>컴퓨트·스토리지·데이터 전송</b>으로 읽고, 청구 데이터를 내보내 직접 묻고, <b>태그와 계정</b>으로 주인을 붙이고, <b>예산 · 이상 탐지</b>로 먼저 압니다. 줄이는 순서는 지우기 → 크기와 시간 → 약정과 스팟입니다.',
        '1,240만 원이던 청구서가 500만 원이 됐지만 서비스는 그대로예요. NAT와 egress처럼 <b>데이터가 지나는 길</b>이 돈이 된다는 것도 기억하세요. 다음 레슨은 이 모든 것이 사라졌을 때를 대비하는 백업과 재해 복구입니다.',
      ],
      hide: ['one', 'aws', 'azure', 'gcp', 'ncp'],
      show: ['bill', 'budget', 'lead', 'vm1', 'vm2', 'bkt'],
      tags: [{ on: 'lead', text: '1,240 → 500만 원', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['vm1', 'bill'], kind: 'data' }, { path: ['vm2', 'bill'], kind: 'data', delay: 0.3 }, { path: ['bkt', 'bill'], kind: 'data', delay: 0.6 }, { path: ['bill', 'budget', 'lead'], kind: 'ctrl', delay: 1.6 }],
    },
  ],
  quiz: [
    {
      q: '클라우드 비용을 줄이려 합니다. 가장 적절한 작업 순서는?',
      options: ['3년 약정 구매 → 크기 맞추기 → 안 쓰는 리소스 삭제', '안 쓰는 리소스 삭제 → 크기 맞추기 → 남은 바닥 사용량에 약정', '모든 VM을 스팟으로 전환 → 약정 구매', '예산 알림 설정 → 그대로 기다리기'],
      answer: 1, step: 9,
      why: '약정은 "이만큼은 계속 쓴다"는 약속이라, 낭비를 걷어 내고 크기를 맞춘 뒤의 사용량에 걸어야 합니다. 먼저 약정하면 낭비까지 몇 년 동안 확정됩니다. 스팟은 끊겨도 되는 일에만 맞고, 알림만으로는 비용이 줄지 않습니다.',
    },
    {
      q: '이번 달 청구서가 갑자기 늘었습니다. 원인을 찾기 위해 가장 먼저 할 일은?',
      options: ['모든 VM을 한 단계씩 작게 바꾼다', '청구 데이터를 서비스 · 일별로 묶어, 가장 많이 늘어난 줄과 늘기 시작한 날을 찾는다', '3년 약정을 구매한다', '모든 팀에 비용을 줄이라고 공지한다'],
      answer: 1, step: 3,
      why: '줄이기 전에 보이게 해야 합니다. 큰 줄과 늘어난 날을 찾으면 그날의 변경과 맞춰 원인을 좁힐 수 있습니다. 원인을 모른 채 크기를 줄이거나 약정을 사면 엉뚱한 곳을 건드리거나 낭비를 확정합니다.',
    },
    {
      q: '태그 정책을 만들었는데도 매달 "태그 없음" 비용이 30% 가까이 나옵니다. 가장 효과적인 개선은?',
      options: ['Terraform 기본 태그로 자동 부착하고, 태그 없는 리소스 생성을 정책으로 거부한다', '월말마다 담당자가 콘솔에서 태그를 손으로 붙인다', '태그 대신 리소스 이름 규칙만 쓴다', '태그 없는 비용은 공통 비용으로 처리하고 넘어간다'],
      answer: 0, step: 4,
      why: '사람이 붙이는 태그는 반드시 빠집니다. 코드가 자동으로 붙이고, 빠지면 만들 수 없게 막아야 비율이 0에 가까워집니다. 손으로 붙이기는 늘 늦고, 공통 비용으로 넘기면 주인 없는 낭비가 계속 숨습니다.',
    },
    {
      q: '월 예산을 500만 원으로 정하고 100% 도달 알림을 걸었습니다. 옳은 설명은?',
      options: ['500만 원을 넘으면 리소스가 자동으로 중지된다', '비용은 실시간으로 집계되어 넘는 즉시 알림이 온다', '알림만 오고 과금은 계속되므로, 더 낮은 임계값과 예측 기반 알림, 이상 탐지도 함께 건다', '태그가 없는 리소스는 예산 집계에서 빠진다'],
      answer: 2, step: 6,
      why: '예산은 알림 장치이지 차단 장치가 아닙니다. 비용 데이터는 몇 시간에서 하루쯤 늦게 반영되므로 100% 알림 하나만으로는 이미 늦습니다. 50%·80%와 예측 알림, 평소 패턴에서 벗어난 지출을 잡는 이상 탐지를 함께 걸어야 대응할 시간이 생깁니다.',
    },
    {
      q: '추천 도구가 운영 DB 서버를 "CPU 평균 10%이니 크기를 4분의 1로" 줄이라고 합니다. 가장 알맞은 대응은?',
      options: ['추천대로 바로 줄인다', 'CPU 평균이 낮으니 오히려 약정을 산다', '추천은 무시한다. 운영 서버는 건드리지 않는다', '몇 주간의 CPU 최고치, 메모리 사용량, 디스크 · 네트워크 한도를 확인하고 한 단계씩 줄이며 지표를 지켜본다'],
      answer: 3, step: 7,
      why: '평균은 피크를 가리고, 메모리 · IOPS · 대역폭 한도는 CPU만으로 보이지 않습니다. 확인 후 한 단계씩 줄이며 응답 시간과 에러율을 보는 것이 안전합니다. 바로 4분의 1로 줄이면 피크에 장애가 나고, 줄이기 전에 약정하면 과한 크기를 약속하게 됩니다.',
    },
    {
      q: '개발 환경의 VM 20대를 밤과 주말에 자동으로 중지했습니다. 다음 중 계속 과금되는 것은?',
      options: ['VM의 vCPU 시간 요금', 'VM에 붙은 디스크와 스냅샷, 붙어 있는 공인 IP', '중지된 VM의 메모리 요금', '아무것도 과금되지 않는다'],
      answer: 1, step: 8,
      why: '중지는 컴퓨트 시간만 멈춥니다. 디스크는 데이터를 들고 있으니 계속 과금되고, 붙여 둔 공인 IP도 요금이 붙는 경우가 많습니다. 그래서 실제 절감은 컴퓨트 몫만큼이고, 오래 안 쓸 환경은 지우고 코드로 다시 만드는 편이 쌉니다.',
    },
    {
      q: '운영 컴퓨트 사용량이 새벽에는 시간당 40, 낮 피크에는 120(단위 임의)입니다. 1년 약정 규모로 가장 알맞은 것은?',
      options: ['피크인 120만큼 약정한다', '평균인 80만큼 약정한다', '새벽 바닥인 40 안팎만큼 약정하고 나머지는 온디맨드로 둔다', '사용량이 변하므로 약정하지 않는다'],
      answer: 2, step: 9,
      why: '약정은 매시간의 사용량에 적용되고, 덜 쓴 시간의 남은 약정은 사라집니다. 바닥만큼 약정하면 거의 항상 다 쓰므로 활용률이 높고, 그 위로 오르내리는 부분은 온디맨드나 오토스케일링으로 처리합니다. 피크나 평균으로 잡으면 새벽마다 버리는 약정이 생깁니다.',
    },
    {
      q: '다음 중 스팟 VM에 올리기에 가장 알맞은 워크로드는?',
      options: ['복제본 없이 한 대로 도는 운영 DB', '사용자 세션을 메모리에 들고 있는 단일 서버', '한 대뿐인 결제 API 서버', '작게 쪼개 중간 결과를 저장하며 도는 야간 통계 배치'],
      answer: 3, step: 10,
      why: '스팟은 짧은 예고 뒤 회수될 수 있으므로, 끊겨도 저장한 지점부터 다시 하면 되는 일에 맞습니다. 나머지 셋은 그 VM이 사라지는 순간 데이터나 서비스를 잃습니다.',
    },
    {
      q: '스팟 노드로 CI를 돌리는데, 특정 시간대에 빌드가 한꺼번에 실패합니다. 모든 노드가 같은 인스턴스 유형, 같은 AZ입니다. 가장 먼저 할 개선은?',
      options: ['여러 인스턴스 유형과 AZ로 나눠 요청하고, 회수 예고 시 작업을 정리하게 한다', 'CI를 모두 온디맨드로 바꾼다', '빌드 타임아웃을 늘린다', '같은 유형을 더 많이 요청한다'],
      answer: 0, step: 10,
      why: '같은 유형 · 같은 AZ의 스팟은 그 용량이 필요해질 때 한꺼번에 회수됩니다. 유형과 AZ를 섞으면 동시 회수 위험이 줄고, 회수 예고를 처리하면 실패 대신 재시도가 됩니다. 전부 온디맨드로 바꾸는 것은 할인을 포기하는 마지막 수단입니다.',
    },
    {
      q: '프라이빗 서브넷의 서버가 같은 리전 S3로 매일 1TB를 올립니다. 청구서에 NAT 게이트웨이 처리 요금이 크게 나옵니다. 가장 알맞은 조치는?',
      options: ['NAT 게이트웨이를 더 큰 것으로 바꾼다', 'S3용 게이트웨이 VPC 엔드포인트를 만들어 프라이빗 라우팅 테이블에 연결한다', '서버를 퍼블릭 서브넷으로 옮기고 공인 IP를 붙인다', '업로드를 낮 시간으로 옮긴다'],
      answer: 1, step: 11,
      why: '같은 리전 S3로 가는 트래픽도 엔드포인트가 없으면 NAT를 지나며 GB당 처리 요금이 붙습니다. S3 게이트웨이 엔드포인트는 무료이고 경로를 NAT 밖으로 뺍니다. 서버를 퍼블릭으로 옮기는 것은 보안을 희생하고, NAT 크기나 시간대는 처리 요금과 무관합니다.',
    },
    {
      q: '앱 서버는 AWS에, 분석용 DB는 GCP에 두고 매일 수백 GB를 복사합니다. 견적보다 크게 나올 가능성이 가장 높은 항목은?',
      options: ['컴퓨트 요금', '스토리지 요금', '지원 플랜 요금', '데이터 전송(egress) 요금'],
      answer: 3, step: 12,
      why: '클라우드 밖으로 나가는 데이터에는 GB마다 요금이 붙고, 클라우드 사이를 오가는 복제는 전부 여기에 해당합니다. 컴퓨트와 스토리지는 크기로 미리 계산하기 쉽지만 전송량은 견적에서 자주 빠집니다.',
    },
    {
      q: 'AWS · Azure · GCP 세 곳의 비용을 팀별로 합쳐 보고 싶습니다. 가장 먼저 맞춰야 할 것은?',
      options: ['세 클라우드의 태그 키와 값 규칙(team · env · service), 그리고 비교에 쓸 금액 기준(청구 · 상각)', '세 클라우드의 인스턴스 크기 이름', '세 클라우드의 콘솔 언어 설정', '세 클라우드의 리전 이름'],
      answer: 0, step: 13,
      why: '합칠 수 있는 열쇠는 같은 태그 키와 값입니다. 한쪽이 team, 다른 쪽이 Team이나 owner_team이면 같은 팀이 둘로 나뉩니다. 금액 기준이 다르면 약정을 많이 산 클라우드가 엉뚱하게 비싸 보입니다. 인스턴스나 리전 이름은 합산의 열쇠가 아닙니다.',
    },
  ],
};
