export default {
  id: 'iac-why',
  learn: [
    '콘솔 클릭(ClickOps)이 남기는 세 가지 문제',
    '드리프트: 실제 인프라가 의도에서 멀어지는 현상',
    '명령형과 선언형의 차이, 그리고 멱등성',
    'Git 리뷰와 권한으로 변경 경로를 코드 하나로',
    'Terraform · CloudFormation · Bicep · Pulumi의 자리',
    '프로비저닝 · 구성 관리 · 불변 인프라의 구분',
  ],
  legend: [['ctrl', 'API 호출 · 적용'], ['build', '코드 변경 · 이미지'], ['res', '조회 결과']],
  metrics: [
    { id: 'time', label: '환경 구축', icon: 'clock' },
    { id: 'diff', label: '환경 차이', icon: 'scale' },
    { id: 'hist', label: '변경 이력', icon: 'history' },
    { id: 'review', label: '변경 리뷰', icon: 'eye' },
  ],
  scene: {
    nodes: {
      eng: { kind: 'client', at: [0.6, 3.6], label: '엔지니어' },
      console: { at: [2.4, 2.4], label: '웹 콘솔', sub: '클릭', icon: 'monitor', color: 'sand' },
      tf: { kind: 'tile', at: [2.4, 2.4], label: 'main.tf', icon: 'file-code', color: 'olive' },
      script: { kind: 'tile', at: [2.4, 2.4], label: 'create.sh', icon: 'terminal', color: 'gray' },
      git: { at: [2.4, 2.4], label: 'Git', sub: 'PR · 이력', icon: 'git', color: 'slate' },
      dev: { at: [4, 0.4], label: 'dev 환경', sub: '서버 · DB', icon: 'layers', color: 'teal' },
      dr: { at: [4, 0.4], label: 'DR 환경', sub: '도쿄 리전', icon: 'layers', color: 'yellow' },
      prod: { at: [6.2, 2.6], label: 'prod 환경', sub: '서버 · DB', icon: 'layers', color: 'purple' },
      night: { kind: 'client', at: [8.2, 1.6], label: '당직자' },
      reviewer: { kind: 'client', at: [2.4, -0.4], label: '리뷰어' },
      engine: { at: [4.8, 4.8], label: 'IaC 도구', sub: '원하는 vs 실제', icon: 'scale', color: 'olive' },
      readme: { kind: 'tile', at: [2.4, 5.0], label: 'README 수동 단계', icon: 'file-text', color: 'gray' },

      tfx: { at: [-1.5, -1.5], label: 'Terraform', sub: 'OpenTofu', icon: 'blocks', color: 'olive' },
      aws: { at: [-1.4, 3.4], label: 'AWS', icon: 'cloud', color: 'aws' },
      azure: { at: [0.2, 1.8], label: 'Azure', icon: 'cloud', color: 'azure' },
      gcp: { at: [1.8, 0.2], label: 'GCP', icon: 'cloud', color: 'gcp' },
      ncp: { at: [3.4, -1.4], label: 'NCP', icon: 'cloud', color: 'ncp' },
      cfn: { at: [1.1, 5.9], label: 'Cloud\nFormation', icon: 'file-text', color: 'sand' },
      bicep: { at: [2.7, 4.3], label: 'Bicep', sub: 'ARM', icon: 'file-text', color: 'sand' },
      vm: { at: [0.5, -3.5], label: '서버 (VM)', sub: 'nginx · 설정', icon: 'server', color: 'blue' },
      ans: { at: [2.5, -5.5], label: 'Ansible', sub: '구성 관리', icon: 'wrench', color: 'red' },
      vm2: { at: [3.0, -1.0], label: '새 서버', sub: '이미지 v2', icon: 'server', color: 'teal' },
      img: { kind: 'tile', at: [3.0, -3.6], label: 'AMI v2 (Packer)', icon: 'image', color: 'olive' },
    },
    edges: {
      e_console: { from: 'eng', to: 'console' },
      e_c_dev: { from: 'console', to: 'dev' },
      e_c_prod: { from: 'console', to: 'prod' },
      e_night: { from: 'night', to: 'prod', tone: 'bad' },
      e_tf: { from: 'eng', to: 'tf' },
      e_tf_dev: { from: 'tf', to: 'dev' },
      e_tf_prod: { from: 'tf', to: 'prod' },
      e_tf_dr: { from: 'tf', to: 'dr' },
      e_rd_prod: { from: 'readme', to: 'prod', style: 'dashed', tone: 'mute', label: '손으로' },
      e_tf_eng: { from: 'tf', to: 'engine' },
      e_eng_dev: { from: 'engine', to: 'dev' },
      e_script: { from: 'eng', to: 'script' },
      e_s_dev: { from: 'script', to: 'dev' },
      e_git: { from: 'eng', to: 'git' },
      e_review: { from: 'reviewer', to: 'git', style: 'dashed' },
      e_git_dev: { from: 'git', to: 'dev' },
      e_git_prod: { from: 'git', to: 'prod' },
      e_x_aws: { from: 'tfx', to: 'aws' },
      e_x_azure: { from: 'tfx', to: 'azure' },
      e_x_gcp: { from: 'tfx', to: 'gcp' },
      e_x_ncp: { from: 'tfx', to: 'ncp' },
      e_cfn: { from: 'cfn', to: 'aws', tone: 'mute' },
      e_bicep: { from: 'bicep', to: 'azure', tone: 'mute' },
      e_x_vm: { from: 'tfx', to: 'vm' },
      e_ans: { from: 'ans', to: 'vm' },
      e_x_vm2: { from: 'tfx', to: 'vm2' },
      e_img_vm2: { from: 'img', to: 'vm2', style: 'dashed' },
    },
  },
  codes: {
    main: {
      title: 'main.tf', lang: 'hcl',
      text: `# 쇼핑몰 웹 서버: "이런 모습이어야 한다"
resource "aws_instance" "web" {
  count         = 2
  ami           = var.ami_id
  instance_type = "t3.small"
  subnet_id     = var.subnet_id

  tags = {
    Name = "shop-web-\${count.index}"
  }
}
`,
    },
    script: {
      title: 'create.sh', lang: 'sh',
      text: `# create.sh: "서버 2대를 만들어라"
aws ec2 run-instances \\
  --image-id "$AMI_ID" \\
  --instance-type t3.small \\
  --subnet-id "$SUBNET_ID" \\
  --count 2

# 터미널에서
$ ./create.sh    # 서버 2대 생성
$ ./create.sh    # 또 2대 생성 → 합계 4대
`,
    },
    readme: {
      title: 'README.md (prod 구축)', lang: 'text',
      text: `## prod 환경 만들기

1. terraform apply
2. (콘솔) 인증서 발급 후 LB에 연결
3. (콘솔) DNS에 shop.example 레코드 추가
4. (콘솔) WAF 규칙 3개 붙이기

※ 2~4는 나중에 코드로 옮길 예정
  (작성: 2년 전)
`,
    },
    diff: {
      title: 'PR #42 · security.tf', lang: 'sh',
      text: `$ git diff main -- security.tf

 resource "aws_security_group_rule" "ssh" {
   type        = "ingress"
   protocol    = "tcp"
   from_port   = 22
   to_port     = 22
-  cidr_blocks = ["10.0.0.0/16"]
+  cidr_blocks = ["0.0.0.0/0"]
 }
`,
    },
  },
  steps: [
    {
      key: '콘솔 클릭', kind: 'problem', title: '콘솔에서 클릭으로 만든 dev 환경',
      body: [
        '쇼핑몰 <code>shop.example</code>의 dev 환경을 웹 콘솔에서 만들었습니다. VPC, 서브넷, 보안 그룹, 서버, DB까지 화면을 넘기며 수십 번 클릭했고, 잘 돌아갑니다. 이렇게 손으로 클릭해서 인프라를 만드는 방식을 흔히 <b>ClickOps</b>라고 부릅니다.',
        '처음 한 번은 가장 빠른 방법입니다. 문제는 그다음이에요. 팀장이 말합니다. "좋네요. 이제 <b>똑같은 걸 prod로 하나 더</b> 만들어 주세요."',
      ],
      callout: { type: 'key', text: '콘솔은 <b>탐색과 학습</b>에는 훌륭합니다. 하지만 클릭한 과정은 어디에도 남지 않아요. 남는 것은 결과물뿐입니다.' },
      show: ['eng', 'console', 'dev'],
      tags: [{ on: 'console', text: '클릭 60여 번', icon: 'pencil' }],
      flows: [{ path: ['eng', 'console', 'dev'], kind: 'ctrl', n: 3 }],
      metrics: { time: '반나절', diff: '-', hist: ['없음', 'warn'], review: ['없음', 'warn'] },
      more: [
        { title: '동작 원리', body: [
          '콘솔도 결국 <b>API를 부르는 화면</b>입니다. "VPC 만들기" 버튼을 누르면 브라우저가 <code>CreateVpc</code> 같은 API를 대신 호출하고, 서브넷 · 라우팅 테이블 · 게이트웨이마다 호출이 하나씩 이어집니다. CLI, SDK, IaC 도구도 정확히 같은 API를 부릅니다.',
          '그러니 방법의 차이는 "무엇을 만들 수 있나"가 아니라 <b>"무엇이 남는가"</b>입니다. 콘솔은 결과물만 남기고, 스크립트는 절차를 남기고, IaC는 원하는 최종 모습을 남깁니다. 이 레슨은 그 차이가 운영에서 어떤 값을 치르게 하는지 따라갑니다.',
        ] },
        { title: '콘솔이 잘 맞는 곳', list: [
          '처음 써 보는 서비스의 옵션과 기본값을 둘러볼 때',
          '대시보드 · 로그 · 비용처럼 <b>읽기</b> 위주의 확인',
          '장애 중 상태를 빠르게 조회할 때 (변경은 다른 길로)',
          '일부 콘솔은 이미 만든 리소스를 템플릿이나 코드 초안으로 내보내 주므로, 콘솔에서 익힌 뒤 코드로 옮기는 출발점이 됩니다',
        ] },
        { title: '흔한 실수', list: [
          '"일단 콘솔로 만들고 나중에 코드로 옮기자" → 나중은 잘 오지 않고, 운영 중인 리소스를 코드로 옮기는 일은 처음부터 쓰는 것보다 어렵습니다',
          '마법사가 함께 만들어 주는 부속 리소스(보안 그룹, IAM 역할 등)를 기억하지 못해, 나중에 무엇이 왜 있는지 아무도 모릅니다',
          '마법사 기본값에 출발지가 넓게 열린 규칙이 포함되어 그대로 운영에 들어가기도 합니다',
        ] },
      ],
    },
    {
      key: '재현 불가', kind: 'problem', title: '똑같이 한 번 더? 기억에 의존합니다',
      body: [
        'prod를 만들려면 같은 클릭을 처음부터 다시 해야 합니다. 근거는 기억과 위키에 붙여 둔 스크린샷뿐이에요. 사람은 60번의 클릭 가운데 한두 개를 반드시 틀립니다.',
        '결과: prod는 DB 백업이 꺼져 있고, 인스턴스 크기도 다릅니다. 겉으로는 똑같이 동작하니 아무도 모릅니다. dev에서 통과한 배포가 prod에서만 깨지는 날에야 처음 드러나요.',
      ],
      callout: { type: 'warn', text: '환경을 <b>재현할 수 없으면</b> 테스트도 믿을 수 없습니다. dev에서 검증한 것은 "prod와 닮은 무언가"일 뿐이니까요.' },
      show: ['prod'],
      tags: [
        { on: 'eng', text: '기억 + 스크린샷', icon: 'image' },
        { on: 'prod', text: 'DB 백업 꺼짐', tone: 'bad', pos: 'right' },
        { on: 'prod', text: '인스턴스 크기 다름', tone: 'bad', pos: 'bottom' },
      ],
      flows: [{ path: ['eng', 'console', 'prod'], kind: 'ctrl', n: 3 }],
      metrics: { time: '반나절 × 2', diff: ['2곳 이상', 'bad'] },
      changes: [['+', 'prod 환경 (손으로 다시 클릭)'], ['~', 'dev와 prod 설정이 2곳 이상 다름']],
      more: [
        { title: '왜 꼭 틀리는가', body: [
          '콘솔 화면은 대부분의 칸을 <b>기본값으로 미리 채워</b> 둡니다. 백업 보존 기간, 저장 암호화, 삭제 보호, 퍼블릭 접근 같은 값이에요. 사람은 자기가 바꾼 칸은 기억하지만, 그대로 둔 칸은 기억하지 않습니다. 그사이 콘솔 화면이 개편되거나 기본값이 바뀌면 스크린샷도 더는 같은 결과를 보장하지 못합니다.',
          'dev와 prod가 다르면 문제는 "버그가 있다"가 아니라 <b>"어디가 다른지 모른다"</b>가 됩니다. 원인을 찾기 전에 차이부터 찾아야 하니 장애 시간이 길어져요.',
        ] },
        { title: '직접 해보기', body: ['콘솔로 만든 두 환경이 정말 같은지 CLI로 같은 값을 뽑아 비교합니다. 보존 기간 0은 자동 백업이 꺼져 있다는 뜻이에요.'], code: { title: 'terminal', lang: 'sh', text: `$ for db in shop-dev shop-prod; do
    aws rds describe-db-instances \\
      --db-instance-identifier "$db" \\
      --query 'DBInstances[0].[DBInstanceClass,
               BackupRetentionPeriod]' \\
      --output text
  done
db.t3.medium    7
db.t3.small     0` } },
        { title: '더 생각해 볼 것', list: [
          '이런 비교를 리소스 수백 개에 대해 손으로 할 수는 없습니다. 비교의 기준이 되는 "원래 의도"가 파일로 있어야 도구가 대신 비교할 수 있어요',
          '"환경을 하나 더"는 생각보다 자주 옵니다: 새 리전, 부하 테스트용 복제본, 고객 전용 환경, 재해 복구용 환경',
        ] },
      ],
    },
    {
      key: '야간 수정', kind: 'case', title: '사례: 새벽에 누군가 포트를 열었다',
      body: [
        '새벽 장애 중에 당직자가 원인을 보려고 prod 보안 그룹의 <b>SSH 22번 포트를 전체(<code>0.0.0.0/0</code>)로</b> 열었습니다. 장애는 끝났고, 규칙은 그대로 남았습니다.',
        '석 달 뒤 보안 점검에서 발견됩니다. 누가, 왜 열었을까요? 클라우드 감사 로그에 API 호출 기록은 남지만 <b>의도와 승인</b>은 어디에도 없습니다. 이렇게 실제 인프라가 의도한 모습에서 조금씩 멀어지는 것을 <b>드리프트(drift)</b>라고 합니다.',
      ],
      callout: { type: 'warn', text: '콘솔 변경에는 <b>리뷰가 없습니다</b>. 저장을 누르는 순간 운영에 반영되고, 돌아갈 "이전 버전"도 없어요.' },
      show: ['night'],
      set: { prod: { state: 'hot' } },
      tags: [
        { on: 'night', text: '리뷰 없이 즉시 반영', icon: 'zap' },
        { on: 'prod', text: 'SSH 22 전체 개방', tone: 'bad', icon: 'unlock', pos: 'bottom' },
      ],
      flows: [{ path: ['night', 'prod'], kind: 'ctrl', n: 2 }],
      metrics: { diff: ['3곳 이상', 'bad'], hist: ['감사 로그뿐', 'warn'], review: ['없음', 'bad'] },
      changes: [['~', 'prod 보안 그룹: 22번 포트 전체 개방'], ['-', '누가 · 왜 바꿨는지에 대한 기록']],
      more: [
        { title: '감사 로그가 알려 주는 것', body: [
          'AWS CloudTrail, Azure Activity Log, GCP Cloud Audit Logs는 <b>누가 · 언제 · 어떤 API를 · 어떤 인자로</b> 불렀는지 남깁니다. 하지만 "왜"와 "누가 승인했나"는 없어요. 게다가 CloudTrail의 기본 이벤트 기록은 최근 90일치만 콘솔에서 조회되므로, 석 달 뒤라면 기록마저 사라졌을 수 있습니다. 오래 보관하려면 트레일을 만들어 버킷에 쌓아야 합니다.',
        ] },
        { title: '직접 해보기', body: ['보안 그룹 규칙을 추가한 호출을 찾아봅니다. <code>Username</code>은 보이지만 이유는 보이지 않습니다.'], code: { title: 'terminal', lang: 'sh', text: `$ EV=AuthorizeSecurityGroupIngress
$ aws cloudtrail lookup-events --max-results 1 \\
    --lookup-attributes \\
    AttributeKey=EventName,AttributeValue=$EV
{
  "Events": [{
    "EventName": "AuthorizeSecurityGroupIngress",
    "EventTime": "2026-08-14T03:12:44+09:00",
    "Username": "oncall-kim",
    "EventSource": "ec2.amazonaws.com"
  }]
}` } },
        { title: '드리프트의 출처', list: [
          '<b>사람</b>: 장애 중 콘솔 수정, "잠깐만" 연 규칙, 손으로 키운 인스턴스',
          '<b>다른 도구</b>: 스크립트나 다른 팀의 자동화가 같은 리소스를 건드림',
          '<b>클라우드 자신</b>: 오토스케일링이 바꾸는 대수, 자동으로 갱신되는 값. 이런 것은 드리프트로 보지 않도록 코드에서 무시하게 설정합니다',
        ] },
      ],
    },
    {
      key: '코드로 쓰기', kind: 'solution', title: '인프라를 파일로 적어 둡니다',
      body: [
        '<b>IaC</b>(Infrastructure as Code)는 인프라를 클릭 대신 <b>텍스트 파일</b>로 기술하는 방식입니다. 왼쪽이 그 파일이에요. "t3.small 웹 서버 2대"가 글로 적혀 있습니다.',
        '도구가 이 파일을 읽어 클라우드 API를 대신 호출합니다. 같은 파일을 dev에 한 번, prod에 한 번 적용하면 <b>같은 모양의 환경이 두 벌</b> 나옵니다. 60번의 클릭이 명령 한 줄이 돼요.',
      ],
      callout: { type: 'key', text: '핵심은 자동화보다 <b>기록</b>입니다. 인프라의 모습이 사람 머릿속이 아니라 파일에 있으니 읽고, 비교하고, 복사할 수 있습니다.' },
      hide: ['console', 'night'],
      show: ['tf'],
      set: { prod: { state: null } },
      code: { ref: 'main', hl: [2, 3, 4, 5, 6] },
      flows: [{ path: ['eng', 'tf'], kind: 'build' }, { path: ['tf', 'dev'], kind: 'ctrl', n: 2, delay: 1 }, { path: ['tf', 'prod'], kind: 'ctrl', n: 2, delay: 1.2 }],
      metrics: { time: ['몇 분', 'ok'], diff: ['0곳', 'ok'] },
      changes: [['+', 'main.tf: 인프라를 적은 파일'], ['-', '웹 콘솔 클릭'], ['~', '환경 구축 반나절 → 몇 분']],
      more: [
        { title: '파일 읽는 법', body: [
          '<code>resource "aws_instance" "web"</code>은 "AWS 인스턴스 종류의 리소스를, 이 코드 안에서는 <code>web</code>이라 부르겠다"는 뜻입니다. 중괄호 안은 그 리소스가 가져야 할 <b>속성</b>이에요. <code>var.ami_id</code>처럼 환경마다 다른 값은 변수로 빼 두었기 때문에, 같은 파일이 dev와 prod 양쪽에 쓰입니다(변수는 이 챕터의 모듈 레슨에서 자세히 봅니다).',
          '이 파일은 도구의 입력이면서 동시에 <b>사람이 읽는 문서</b>입니다. 위키의 "prod 구성도"는 금방 낡지만, 실제로 적용되는 파일은 낡을 수가 없어요.',
        ] },
        { title: '파일이 되면 생기는 일', list: [
          '<b>재현</b>: 빈 계정에 같은 환경을 몇 번이든 다시 만듭니다',
          '<b>리뷰와 이력</b>: 변경이 diff가 되고 커밋으로 남습니다 (뒤의 단계)',
          '<b>재사용</b>: 잘 짠 네트워크 구성을 다른 서비스가 가져다 씁니다',
          '<b>자동 검사</b>: "0.0.0.0/0으로 연 SSH 금지" 같은 규칙을 적용 전에 기계가 확인합니다',
        ] },
        { title: '실무 팁', list: [
          '처음부터 전부 옮기려 하지 말고 <b>새로 만드는 것부터</b> 코드로 시작하세요. 이미 있는 리소스를 코드로 들여오는 방법(import)은 state 레슨에서 봅니다',
          '파일에 비밀번호나 액세스 키를 적지 않습니다. 코드는 여러 사람이 읽고 Git에 영원히 남습니다',
        ] },
      ],
    },
    {
      key: '명령형', kind: 'concept', title: '명령형: 절차를 적은 스크립트',
      body: [
        '코드로 적는 방법은 두 가지입니다. 먼저 <b>명령형(imperative)</b>. "서버 2대를 만들어라"처럼 <b>할 일의 순서</b>를 적습니다. 셸 스크립트에 CLI 명령을 나열하는 방식이 대표적이에요.',
        '약점은 스크립트가 <b>지금 상태를 모른다</b>는 것입니다. 중간에 실패해서 다시 돌리거나 실수로 두 번 실행하면 서버가 2대 더 생겨 4대가 됩니다. 이미 있는지 확인하고 건너뛰는 로직을 전부 직접 짜야 해요.',
      ],
      callout: { type: 'warn', text: '명령형은 <b>"어떻게"</b>를 적습니다. 수정과 삭제까지 다루려면 경우의 수만큼 if 문이 늘어납니다.' },
      hide: ['tf', 'prod'],
      show: ['script'],
      set: { dev: { state: 'hot', badge: '서버 4대', tone: 'bad' } },
      code: { ref: 'script', hl: [9, 10] },
      flows: [{ path: ['eng', 'script', 'dev'], kind: 'ctrl', n: 2 }, { path: ['eng', 'script', 'dev'], kind: 'ctrl', n: 2, delay: 1.8 }],
      metrics: { diff: ['서버 +2대', 'bad'] },
      changes: [['~', '같은 스크립트를 두 번 실행'], ['+', '의도하지 않은 서버 2대']],
      more: [
        { title: '직접 해보기', body: ['스크립트를 멱등하게 만들려면 먼저 세고 모자란 만큼만 만들어야 합니다. 생성 하나에도 이만큼이 필요해요.'], code: { title: 'create.sh (개선판)', lang: 'sh', text: `have=$(aws ec2 describe-instances \\
  --filters "Name=tag:App,Values=shop-web" \\
    "Name=instance-state-name,Values=running" \\
  --query 'length(Reservations[].Instances[])' \\
  --output text)
need=$((2 - have))
if [ "$need" -gt 0 ]; then
  aws ec2 run-instances --count "$need" ...
fi
# 크기를 바꾸려면? 하나를 지우려면?
# 태그가 틀린 서버는? → 경우마다 또 if 문` } },
        { title: '함정이 더 있습니다', list: [
          '위 스크립트도 막 시작해 <code>pending</code> 상태인 서버는 세지 않아, 연달아 실행하면 또 중복이 생깁니다',
          'API의 멱등 토큰(EC2의 <code>--client-token</code> 등)은 <b>같은 요청의 재시도</b>를 한 번으로 쳐 줄 뿐, "2대여야 한다"는 상태를 맞춰 주지는 않습니다',
          '삭제는 더 어렵습니다. 무엇을 지워야 하는지 알려면 "원래 있어야 할 목록"이 어딘가에 있어야 해요',
        ] },
        { title: '명령형이 맞는 곳', body: [
          '한 번만 하는 데이터 이전, 순서 자체가 핵심인 배포 절차, 선언형 도구가 표현하지 못하는 작업에는 스크립트가 여전히 알맞습니다. 다만 <b>"계속 같은 모양을 유지해야 하는 인프라"</b>를 스크립트로 관리하면, 결국 상태 비교 로직을 직접 다시 만드는 셈이 됩니다.',
        ] },
      ],
    },
    {
      key: '선언형', kind: 'solution', title: '선언형: 원하는 결과만 적습니다',
      body: [
        '<b>선언형(declarative)</b>은 절차 대신 <b>원하는 최종 상태</b>를 적습니다. <code>count = 2</code>는 "2대를 만들어라"가 아니라 "<b>2대여야 한다</b>"는 뜻이에요.',
        '도구는 지금 상태와 비교해 <b>차이만</b> 메웁니다. 0대면 2대를 만들고, 2대면 아무것도 하지 않고, 숫자를 4로 고치면 2대만 더 만듭니다. 몇 번을 실행해도 결과가 같은 이 성질을 <b>멱등성(idempotency)</b>이라고 합니다.',
      ],
      callout: { type: 'key', text: '멱등하기 때문에 <b>겁내지 않고 다시 실행</b>할 수 있습니다. 실패하면 고쳐서 한 번 더 돌리면 돼요.' },
      hide: ['script'],
      show: ['tf'],
      set: { dev: { state: 'ok', badge: '서버 2대', tone: 'ok' } },
      code: { ref: 'main', hl: [3] },
      flows: [{ path: ['eng', 'tf', 'dev'], kind: 'ctrl', n: 2 }],
      tags: [{ on: 'tf', text: '몇 번 적용해도 2대', tone: 'ok', icon: 'repeat' }],
      metrics: { diff: ['0곳', 'ok'] },
      changes: [['~', '"어떻게" 대신 "무엇을" 적음'], ['~', '재실행해도 서버 2대 그대로']],
      more: [
        { title: '같은 파일, 다른 결과', rows: [
          ['실제 0대 → count = 2', '2대 생성', 'ok'],
          ['실제 2대 → count = 2', '아무것도 안 함', 'info'],
          ['실제 2대 → count = 4', '2대만 추가', 'ok'],
          ['실제 2대 → count = 1', '번호가 큰 1대 삭제', 'warn'],
          ['블록을 통째로 지움', '2대 모두 삭제', 'bad'],
        ] },
        { title: '삭제도 선언입니다', body: [
          '선언형에서 <b>코드에서 지운다 = 실제로 지운다</b>입니다. "더는 이 리소스가 있어서는 안 된다"고 선언한 셈이니까요. 파일 정리하듯 블록을 옮기거나 지웠다가, 운영 DB가 삭제 계획에 올라가는 일이 실제로 흔합니다. 그래서 선언형 도구의 결과는 적용 <b>전에</b> 반드시 읽어야 합니다.',
        ] },
        { title: '선언형의 값', list: [
          '순서를 내가 정하지 않습니다. 도구가 의존 관계로 계산하므로, 순서가 본질인 절차(스키마 마이그레이션 등)는 다른 도구에 맡깁니다',
          '선언형 도구 안에서 셸 명령을 실행하는 탈출구도 있지만, 그 부분은 다시 멱등하지 않게 됩니다. 정말 필요할 때만 씁니다',
        ] },
      ],
    },
    {
      key: '차이 계산', kind: 'concept', title: '도구는 비교하고, 차이만 메웁니다',
      body: [
        '선언형 도구 안에서는 세 가지 일이 차례로 일어납니다. ① 코드를 읽어 <b>원하는 상태</b>를 만들고, ② API로 <b>실제 상태</b>를 조회한 뒤, ③ 둘의 <b>차이</b>만큼만 API를 호출합니다.',
        '누군가 dev 서버 한 대를 지웠다면, 코드는 2대 · 실제는 1대이니 차이는 "+1대"입니다. 이 비교 결과를 적용 전에 사람에게 먼저 보여 주는 것이 다음 레슨의 <code>terraform plan</code>이에요.',
      ],
      callout: { type: 'tip', text: '쿠버네티스 컨트롤러도 같은 비교를 하지만 <b>끝없이 반복</b>합니다. Terraform은 사람이 실행할 때 <b>한 번</b> 비교해요. 그사이 생긴 차이는 다음 실행 때 드러납니다.' },
      show: ['engine'],
      hide: ['e_tf_dev'],
      set: { dev: { state: 'hot', badge: '실제 1대', tone: 'warn' } },
      tags: [
        { on: 'tf', text: '원하는 상태: 2대', tone: 'accent', pos: 'right' },
        { on: 'engine', text: '차이: +1대', tone: 'ok', pos: 'right' },
      ],
      flows: [
        { path: ['tf', 'engine'], kind: 'build' },
        { path: ['dev', 'engine'], kind: 'res', delay: 0.8 },
        { path: ['engine', 'dev'], kind: 'ctrl', delay: 2.2 },
      ],
      metrics: { diff: ['1대 부족', 'warn'] },
      changes: [['~', '실제: 2대 → 1대 (누군가 삭제)'], ['+', '비교 결과: 1대만 생성']],
      more: [
        { title: '동작 원리', body: [
          '"실제 상태 조회"에는 문제가 하나 있습니다. 계정 안에 서버가 수백 대인데 <b>어느 것이 이 코드의 것인지</b> 어떻게 알까요? Terraform은 자기가 만든 리소스의 ID를 따로 기록해 두고(state), 그 ID로 실제 리소스를 조회합니다. 이 기록이 왜 중요하고 어떻게 지키는지는 state 레슨의 주제예요.',
          '비교 결과는 네 종류뿐입니다. <b>생성</b>(코드에만 있음), <b>수정</b>(둘 다 있는데 속성이 다름), <b>교체</b>(바꿀 수 없는 속성이 달라 지우고 새로 만듦), <b>삭제</b>(기록에는 있는데 코드에서 사라짐).',
        ] },
        { title: '출력 읽기', body: ['비교 결과를 사람이 읽을 수 있게 보여 주면 이런 모양입니다. 기호 읽는 법은 다음 레슨에서 자세히 봅니다.'], code: { title: 'terminal', lang: 'sh', text: `$ terraform plan
  # aws_instance.web[1] will be created
  + resource "aws_instance" "web" {
      + instance_type = "t3.small"
      + tags          = {
          + "Name" = "shop-web-1"
        }
      ...
    }

Plan: 1 to add, 0 to change, 0 to destroy.` } },
        { title: '한 번 vs 계속', rows: [
          ['Terraform · CloudFormation', '실행할 때 한 번 비교', 'accent'],
          ['쿠버네티스 컨트롤러', '몇 초마다 계속 비교', 'info'],
          ['GitOps (Argo CD 등)', 'Git과 클러스터를 계속 비교', 'info'],
        ] },
      ],
    },
    {
      key: '절반만 코드', kind: 'case', title: '사례: 코드로 지었는데 새 환경이 안 뜬다',
      body: [
        'prod는 Terraform으로 만들었습니다. 그런데 README에는 "apply 후 콘솔에서 인증서 연결, DNS 레코드 추가, WAF 규칙 붙이기"가 남아 있었어요. 재해 대비로 같은 코드를 도쿄 리전에 apply했더니 서버는 떴는데 <b>사이트가 열리지 않습니다</b>.',
        '원인은 코드 <b>밖</b>에 남은 세 단계입니다. 2년 전 한 번 해 본 사람은 퇴사했어요. 해결은 수동 단계를 모두 코드로 옮기고, 빈 계정에 <b>처음부터 apply하는 연습</b>을 정기적으로 하는 것입니다.',
      ],
      callout: { type: 'warn', text: '수동 단계가 <b>하나라도</b> 남아 있으면 그 환경은 재현할 수 없습니다. "코드로 관리한다"는 말이 사실인지는 새 환경을 만들어 봐야 압니다.' },
      hide: ['eng', 'dev', 'engine'],
      show: ['prod', 'dr', 'readme'],
      set: { dev: { state: null, badge: null }, dr: { state: 'hot', badge: 'HTTPS 실패', tone: 'bad' } },
      code: { ref: 'readme', hl: [4, 5, 6, 8] },
      flows: [
        { path: ['tf', 'prod'], kind: 'ctrl' },
        { path: ['readme', 'prod'], kind: 'ctrl', delay: 0.8 },
        { path: ['tf', 'dr'], kind: 'ctrl', n: 2, delay: 1.6 },
      ],
      metrics: { time: ['몇 분 + 수동', 'warn'], diff: ['수동 3단계', 'bad'] },
      changes: [['+', 'DR 환경 (같은 코드로 apply)'], ['-', '인증서 · DNS · WAF (코드 밖)']],
      more: [
        { title: '증상 → 원인 → 해결', rows: [
          ['증상', '서버는 정상, 브라우저는 인증서 오류', 'bad'],
          ['1차 확인', 'LB 리스너에 인증서가 없음', 'warn'],
          ['근본 원인', '콘솔 단계가 README에만 있음', 'warn'],
          ['해결', '인증서 · DNS · WAF를 코드로', 'ok'],
          ['재발 방지', '빈 계정에 정기적으로 새로 apply', 'ok'],
        ] },
        { title: '왜 이렇게 되는가', body: [
          '처음 IaC를 도입할 때 "어려운 부분은 일단 손으로"가 흔합니다. 인증서 검증, DNS처럼 <b>다른 팀이나 외부 시스템</b>과 엮인 부분이 특히 그래요. 운영 중인 prod에서는 그 단계가 이미 끝나 있으니 아무도 불편을 느끼지 못하고, 새 환경을 만드는 날에야 드러납니다.',
          '같은 이유로 "코드 + 위키의 수동 절차" 조합은 시간이 지날수록 위험해집니다. 절차는 실행되지 않으니 아무도 검증하지 않아요.',
        ] },
        { title: '실무 팁', list: [
          'README에 "콘솔에서" 라는 말이 있으면 그 자체로 할 일 목록입니다',
          '분기나 반기마다 <b>빈 계정에 처음부터</b> 환경을 만들어 보는 연습(재해 복구 훈련)이 가장 확실한 검증입니다',
          '도저히 코드로 못 옮기는 단계(외부 기관 승인 등)는 그 사실과 확인 방법을 코드 옆에 명시합니다',
        ] },
      ],
    },
    {
      key: 'Git 리뷰', kind: 'solution', title: '코드니까 Git으로 리뷰하고 되돌립니다',
      body: [
        '인프라가 텍스트 파일이 되면 애플리케이션 코드와 똑같이 다룰 수 있습니다. <b>Git</b>에 넣고, 변경은 <b>Pull Request</b>로 올리고, 동료가 승인해야 반영됩니다.',
        '아까 그 SSH 규칙을 보세요. 이번에는 diff 두 줄로 리뷰어 눈앞에 놓입니다. 반영되기 <b>전에</b> 막을 수 있어요. 이미 반영된 변경도 커밋을 <code>git revert</code> 하고 다시 적용하면 이전 설정으로 돌아갑니다.',
      ],
      callout: { type: 'warn', text: '되돌아오는 것은 <b>설정</b>입니다. 삭제된 DB의 <b>데이터</b>는 코드를 되돌려도 돌아오지 않아요. 백업은 따로 필요합니다.' },
      hide: ['tf', 'dr', 'readme'],
      show: ['eng', 'git', 'reviewer'],
      set: { dr: { state: null, badge: null } },
      code: { ref: 'diff', hl: [8, 9] },
      flows: [{ path: ['eng', 'git'], kind: 'build' }, { path: ['reviewer', 'git'], kind: 'ctrl', delay: 1 }, { path: ['git', 'prod'], kind: 'ctrl', n: 2, delay: 2 }],
      tags: [{ on: 'reviewer', text: '승인해야 반영', icon: 'user-check' }],
      metrics: { time: ['몇 분', 'ok'], diff: ['0곳', 'ok'], hist: ['Git 커밋', 'ok'], review: ['PR 승인', 'ok'] },
      changes: [['+', 'Git 저장소와 PR 리뷰'], ['~', '변경 이력: 감사 로그뿐 → 커밋'], ['~', '되돌리기: revert 후 다시 적용']],
      more: [
        { title: 'PR에서 무엇을 보나', list: [
          '<b>코드 diff</b>만으로는 부족합니다. 같은 diff가 실제로 무엇을 만들고 지우는지는 도구의 계획(plan) 결과를 함께 봐야 알아요. 다음 챕터에서 파이프라인이 그 결과를 PR에 붙이게 만듭니다',
          '눈여겨볼 것: <code>0.0.0.0/0</code>, 삭제와 교체, 큰 인스턴스 크기(비용), 태그 누락',
          '커밋 메시지와 PR 설명에 <b>왜</b>를 적습니다. 감사 로그에 없던 바로 그 정보예요',
        ] },
        { title: '설정 예시', body: ['prod 폴더의 변경은 특정 팀의 승인을 반드시 받게 합니다. 브랜치 보호 규칙과 함께 쓰면 main에 직접 push할 수 없어요.'], code: { title: '.github/CODEOWNERS', lang: 'text', text: `# 경로                  승인해야 하는 팀
/envs/prod/             @shop/platform-leads
/modules/network/       @shop/network-team
*.tf                    @shop/infra` } },
        { title: '사람이 놓치는 것은 기계가', body: [
          '리뷰어는 피곤하면 두 줄짜리 diff도 놓칩니다. Checkov나 Trivy 같은 정적 검사 도구, OPA 같은 정책 엔진은 "SSH를 전체에 열지 말 것", "버킷은 반드시 암호화" 같은 규칙을 PR마다 기계적으로 확인합니다. <b>정책도 코드</b>로 두면 규칙 자체도 리뷰와 이력의 대상이 됩니다.',
        ] },
      ],
    },
    {
      key: '콘솔 잠그기', kind: 'solution', title: '콘솔은 읽기 전용, 변경은 코드로만',
      body: [
        'IaC를 도입해도 모두가 콘솔 쓰기 권한을 그대로 가지면 드리프트는 다시 생깁니다. 그래서 평소 사람 계정에는 <b>읽기 권한</b>만 주고, 쓰기는 <b>파이프라인의 역할</b>만 갖게 합니다.',
        '장애 때는 기록이 남는 <b>긴급 역할(break-glass)</b>을 잠시 받아 고치고, 끝나면 같은 변경을 PR로 올려 코드와 맞춥니다. 안 그러면 다음 apply가 그 수정을 되돌려요.',
      ],
      callout: { type: 'tip', text: '처음부터 전부 막으면 반발이 큽니다. <b>prod부터</b> 읽기 전용으로 바꾸고, dev는 실험용으로 열어 두는 것이 흔한 출발점이에요.' },
      show: ['night'],
      set: { e_night: { tone: 'mute', style: 'dashed', label: '긴급 시만' } },
      tags: [{ on: 'night', text: '긴급 역할 · 사후 PR', tone: 'warn', icon: 'siren' }],
      flows: [
        { path: ['eng', 'git'], kind: 'build' },
        { path: ['git', 'prod'], kind: 'ctrl', n: 2, delay: 1 },
        { path: ['night', 'prod'], kind: 'ctrl', delay: 2.4 },
      ],
      panel: {
        title: '변경 경로', icon: 'route',
        rows: [
          ['평소 (사람)', '콘솔 · CLI 읽기 전용', 'info'],
          ['변경', 'PR → 승인 → 파이프라인', 'ok'],
          ['긴급', 'break-glass 역할 + 사후 PR', 'warn'],
        ],
      },
      metrics: { hist: ['커밋 + 감사', 'ok'], review: ['PR만 경로', 'ok'] },
      changes: [['~', '사람 계정: 쓰기 → 읽기 전용'], ['+', '파이프라인 전용 배포 역할'], ['+', '기록이 남는 긴급 역할']],
      more: [
        { title: '클라우드별로', rows: [
          ['AWS', '사람: ReadOnlyAccess · 배포: CI 역할', 'aws'],
          ['Azure', '사람: Reader · 배포: 서비스 주체', 'azure'],
          ['GCP', '사람: roles/viewer · 배포: 서비스 계정', 'gcp'],
          ['NCP', 'Sub Account로 사용자별 권한 분리', 'ncp'],
        ] },
        { title: 'break-glass 운영', list: [
          '긴급 역할은 평소 아무에게도 붙어 있지 않고, 요청하면 짧은 시간만 쓸 수 있게 합니다',
          '쓰는 순간 팀 채널에 알림이 가게 하고, 그 세션의 API 호출을 감사 로그로 남깁니다',
          '장애가 끝나면 <b>같은 변경을 PR로</b> 올리거나, 임시 조치였다면 되돌립니다. 이 마무리를 빼먹으면 다음 apply가 수정을 조용히 되돌려 장애가 재발합니다',
        ] },
        { title: '흔한 실수', list: [
          '사람은 막았는데 파이프라인 역할에 관리자 권한을 통째로 줌 → 파이프라인 자격 증명 하나가 새면 전부가 열립니다',
          '막는 대신 공유 관리자 계정 하나를 돌려 씀 → 감사 로그의 "누가"까지 사라집니다',
          '긴급 역할을 너무 자주 써서 사실상 두 번째 정문이 됨 → 사용 횟수를 지표로 보고, 반복되는 긴급 작업은 코드로 옮깁니다',
        ] },
      ],
    },
    {
      key: '도구 지형', kind: 'compare', title: 'IaC 도구들: 누가 어디까지 다루나',
      body: [
        '<b>Terraform</b>은 프로바이더 플러그인으로 여러 클라우드를 같은 언어(HCL)와 같은 절차로 다룹니다. <b>OpenTofu</b>는 Terraform의 라이선스가 바뀐 뒤 갈라져 나온 오픈소스 포크로, 사용법이 거의 같습니다.',
        '사업자 전용 도구도 있습니다. AWS의 <b>CloudFormation</b>, Azure의 <b>Bicep</b>(ARM 템플릿을 간결하게 쓰는 언어)은 자기 클라우드와 가장 깊게 통합되지만 다른 클라우드는 다루지 못해요. <b>Pulumi</b>는 TypeScript · Python 같은 범용 언어로 같은 일을 합니다.',
      ],
      callout: { type: 'cloud', text: 'GCP와 NCP도 공식 Terraform 프로바이더를 제공합니다. 네 클라우드를 한 도구로 다루려는 이 코스가 Terraform을 쓰는 이유예요.' },
      hide: ['eng', 'git', 'reviewer', 'prod', 'night'],
      show: ['tfx', 'aws', 'azure', 'gcp', 'ncp', 'cfn', 'bicep'],
      panel: {
        title: 'IaC 도구 지형', icon: 'map',
        rows: [
          ['Terraform · OpenTofu', '멀티 클라우드 · HCL', 'accent'],
          ['CloudFormation', 'AWS 전용', 'aws'],
          ['Bicep · ARM', 'Azure 전용', 'azure'],
          ['Pulumi', '범용 언어로 작성', 'info'],
          ['Ansible', '구성 관리 (다음 단계)', 'mute'],
        ],
      },
      flows: [
        { path: ['tfx', 'aws'], kind: 'ctrl' }, { path: ['tfx', 'azure'], kind: 'ctrl', delay: 0.2 },
        { path: ['tfx', 'gcp'], kind: 'ctrl', delay: 0.4 }, { path: ['tfx', 'ncp'], kind: 'ctrl', delay: 0.6 },
      ],
      more: [
        { title: '"기억"을 누가 쥐나', rows: [
          ['Terraform · OpenTofu', 'state 파일 (사용자가 보관)', 'accent'],
          ['CloudFormation', 'AWS가 스택으로 보관 · 실패 시 롤백', 'aws'],
          ['Bicep · ARM', '리소스 그룹 기준 배포 · what-if', 'azure'],
          ['GCP', 'Infrastructure Manager가 Terraform 실행', 'gcp'],
          ['Pulumi', 'state (Pulumi Cloud 또는 버킷)', 'info'],
        ] },
        { title: '고르는 기준', list: [
          '<b>한 클라우드만</b> 쓰고 state를 직접 관리하고 싶지 않다 → 사업자 도구(CloudFormation, Bicep)가 운영 부담이 적습니다',
          '<b>여러 클라우드</b>에 DNS · 모니터링 · Git 저장소 설정 같은 SaaS까지 한 방식으로 → Terraform · OpenTofu',
          '개발자 팀이 반복문 · 테스트 · 패키지를 <b>범용 언어</b>로 쓰고 싶다 → Pulumi, 또는 CloudFormation을 만들어 내는 AWS CDK',
          '쿠버네티스를 중심으로 운영한다 → 클라우드 리소스도 쿠버네티스 객체로 다루는 Crossplane 같은 선택지도 있습니다',
        ] },
        { title: '더 생각해 볼 것', body: [
          'OpenTofu는 Terraform과 호환되는 지점에서 출발했지만, 이후 state 암호화처럼 자기만의 기능을 더해 가며 조금씩 갈라지고 있습니다. 어느 쪽을 쓰든 이 챕터의 개념(선언, plan, state, 모듈)은 그대로 통해요. 도구보다 오래가는 것은 <b>개념과 팀의 습관</b>입니다.',
        ] },
      ],
    },
    {
      key: '구성 관리', kind: 'concept', title: 'Ansible은 서버 "안"을 맡습니다',
      body: [
        'Ansible도 흔히 IaC로 묶이지만 주특기가 다릅니다. Terraform 같은 <b>프로비저닝</b> 도구는 VM · 네트워크 · DB처럼 클라우드 API로 <b>자원 자체</b>를 만듭니다.',
        '<b>Ansible</b>은 <b>구성 관리(configuration management)</b> 도구입니다. 이미 떠 있는 서버에 SSH로 접속해 패키지를 깔고, 설정 파일을 놓고, 서비스를 켭니다. 둘은 경쟁이 아니라 이어달리기예요. Terraform이 서버를 만들고, Ansible이 그 안을 채웁니다.',
      ],
      callout: { type: 'tip', text: '컨테이너를 쓰면 "서버 안"의 설정이 이미지에 미리 구워지므로, 구성 관리가 할 일이 크게 줄어듭니다.' },
      hide: ['aws', 'azure', 'gcp', 'ncp', 'cfn', 'bicep'],
      show: ['vm', 'ans'],
      tags: [
        { on: 'tfx', text: '① 서버를 만든다', tone: 'accent', pos: 'bottom' },
        { on: 'ans', text: '② 안을 채운다', tone: 'warn', pos: 'bottom' },
      ],
      flows: [{ path: ['tfx', 'vm'], kind: 'ctrl' }, { path: ['ans', 'vm'], kind: 'ctrl', n: 2, delay: 1.2 }],
      panel: {
        title: '역할 구분', icon: 'split',
        rows: [['프로비저닝', 'Terraform · Bicep', 'accent'], ['구성 관리', 'Ansible · Chef', 'warn'], ['이미지 굽기', 'Packer · Dockerfile', 'info']],
      },
      more: [
        { title: '설정 예시', body: ['Ansible의 플레이북도 선언형에 가깝습니다. "nginx가 설치돼 있어야 한다(<code>state: present</code>)"고 적으면, 이미 있으면 건너뜁니다.'], code: { title: 'site.yml', lang: 'yaml', text: `- hosts: web
  become: true
  tasks:
    - name: nginx 설치
      ansible.builtin.apt:
        name: nginx
        state: present
    - name: 설정 파일 배치
      ansible.builtin.template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
      notify: restart nginx
  handlers:
    - name: restart nginx
      ansible.builtin.service:
        name: nginx
        state: restarted` } },
        { title: '출력 읽기', body: ['<code>changed=0</code>이면 이미 원하는 모습이었다는 뜻입니다. 한 대만 <code>changed=1</code>이면 그 서버의 설정이 달라져 있었던 거예요.'], code: { title: 'terminal', lang: 'sh', text: `$ ansible-playbook -i inventory.ini site.yml
...
PLAY RECAP ***********************************
web-0 : ok=3  changed=0  unreachable=0  failed=0
web-1 : ok=3  changed=1  unreachable=0  failed=0` } },
        { title: '흔한 실수', list: [
          '<code>shell</code> · <code>command</code> 모듈로 명령을 그대로 실행하면 멱등성이 사라집니다. 전용 모듈을 쓰거나 <code>creates</code> 같은 조건을 붙입니다',
          'Terraform의 provisioner로 서버 안을 설정하는 것은 공식 문서도 최후의 수단으로 권합니다. 부팅 시 한 번이면 user data(cloud-init), 지속 관리면 Ansible이 맞습니다',
        ] },
      ],
    },
    {
      key: '불변 인프라', kind: 'concept', title: '고치지 말고 새것으로 바꿔 끼웁니다',
      body: [
        '살아 있는 서버에 패치와 설정을 계속 덧대면 서버마다 조금씩 달라집니다. 이런 서버를 <b>눈송이 서버</b>라고 불러요. <b>불변 인프라(immutable infrastructure)</b>는 설정이 끝난 이미지를 미리 굽고, 바꿀 때는 새 이미지로 <b>새 서버를 띄운 뒤 옛 서버를 지웁니다</b>.',
        '서버 안의 드리프트가 원천적으로 생기지 않고, 롤백은 이전 이미지로 다시 띄우면 끝입니다.',
      ],
      callout: { type: 'key', text: '컨테이너 이미지가 바로 이 생각입니다. 실행 중인 컨테이너를 고치지 않고, 새 이미지를 만들어 갈아 끼우죠.' },
      hide: ['ans'],
      show: ['img', 'vm2'],
      set: { vm: { state: 'dim', badge: '패치 37번째' } },
      tags: [
        { on: 'vm', text: '교체 후 삭제', tone: 'bad', pos: 'right' },
        { on: 'vm2', text: '같은 이미지에서 출발', tone: 'ok', pos: 'bottom' },
      ],
      flows: [
        { path: ['img', 'vm2'], kind: 'build' },
        { path: ['tfx', 'vm2'], kind: 'ctrl', n: 2, delay: 1 },
      ],
      metrics: { diff: ['서버 간 0곳', 'ok'] },
      changes: [['+', '이미지 v2 (Packer로 굽기)'], ['+', '새 서버를 이미지 v2로'], ['-', '패치를 덧댄 옛 서버']],
      more: [
        { title: '두 방식 비교', rows: [
          ['변경 방법', '가변: 제자리 패치 · 불변: 새로 교체', 'info'],
          ['서버 간 차이', '가변: 쌓임 · 불변: 이미지가 같으면 0', 'ok'],
          ['롤백', '가변: 역패치 · 불변: 이전 이미지로', 'ok'],
          ['배포 속도', '가변: 빠름 · 불변: 이미지 빌드 필요', 'warn'],
        ] },
        { title: '직접 해보기', body: ['Packer로 Ansible 플레이북을 적용한 AMI를 굽습니다. 구성 관리는 사라지지 않고 <b>이미지를 만드는 시점</b>으로 옮겨 갑니다.'], code: { title: 'web.pkr.hcl', lang: 'hcl', text: `locals {
  ts = regex_replace(timestamp(), "[- TZ:]", "")
}

source "amazon-ebs" "web" {
  region        = "ap-northeast-2"
  instance_type = "t3.small"
  source_ami    = var.base_ami
  ssh_username  = "ec2-user"
  ami_name      = "shop-web-\${local.ts}"
}

build {
  sources = ["source.amazon-ebs.web"]
  provisioner "ansible" {
    playbook_file = "site.yml"
  }
}` } },
        { title: '한계와 판단', list: [
          'DB처럼 <b>데이터를 품은 서버</b>는 바꿔 끼울 수 없습니다. 데이터는 관리형 DB나 별도 볼륨으로 빼고, 바꿔 끼우는 것은 상태 없는 서버로 한정합니다',
          '긴급 보안 패치도 "이미지 다시 굽기 → 교체" 경로를 타야 하므로, 이미지 빌드가 빨라야 합니다',
          '교체할 때 서비스가 끊기지 않게 새 서버를 먼저 띄우는 방법은 다음 레슨의 lifecycle 설정에서 봅니다',
        ] },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 인프라도 코드처럼 다룹니다',
      body: [
        '콘솔 클릭은 재현할 수 없고, 환경이 서로 어긋나며, 리뷰와 이력이 남지 않습니다. IaC는 인프라를 <b>선언형 코드</b>로 적어, 같은 파일에서 같은 환경을 몇 번이든 만들어 냅니다. 변경은 Git과 리뷰를 거치는 한 길로만 들어오게 하고요.',
        '그런데 도구는 "지금 상태"를 어떻게 알고 차이만 메울까요? 다음 레슨에서 <code>main.tf</code> 하나를 들고 Terraform의 <code>init → plan → apply</code>를 끝까지 따라갑니다.',
      ],
      hide: ['tfx', 'vm', 'vm2', 'img'],
      show: ['eng', 'git', 'dev', 'prod'],
      set: { vm: { state: null, badge: null }, e_night: { tone: 'bad', style: 'solid', label: null } },
      focus: ['git'],
      flows: [{ path: ['eng', 'git'], kind: 'build' }, { path: ['git', 'dev'], kind: 'ctrl', n: 2, delay: 1 }, { path: ['git', 'prod'], kind: 'ctrl', n: 2, delay: 1.2 }],
      tags: [{ on: 'git', text: '리뷰 → 병합 → 적용', tone: 'ok', icon: 'git-merge' }],
    },
  ],
  quiz: [
    {
      q: '배포 스크립트가 중간에 실패해서 처음부터 다시 돌렸더니 서버가 계획의 두 배로 생겼습니다. 근본 원인은?',
      options: [
        '클라우드 API가 같은 요청을 두 번 처리하는 버그',
        '스크립트가 현재 상태를 보지 않고 절차를 그대로 다시 실행해서',
        '스크립트를 Git에 올리지 않아서',
        '서버 사양을 너무 작게 잡아서',
      ],
      answer: 1,
      step: 5,
      why: '명령형 스크립트는 "만들어라"를 실행할 뿐, 이미 몇 대가 있는지 모릅니다. 선언형 도구는 "2대여야 한다"와 현재 상태를 비교해 차이만 메우므로 다시 실행해도 결과가 같습니다(멱등성). Git에 올리는 것은 이력 문제를 풀 뿐 중복 생성을 막지 못합니다.',
    },
    {
      q: 'IaC를 쓰는 팀에서 장애 중에 긴급 역할로 콘솔에서 보안 그룹을 고쳤습니다. 장애가 끝난 뒤 가장 먼저 할 일은?',
      options: [
        '그대로 둔다. 다음 적용 때 도구가 콘솔 변경을 코드에 써 넣어 준다',
        '콘솔 권한을 전원 회수하고 넘어간다',
        '같은 변경을 코드에 반영해 PR로 올리거나, 임시 조치였다면 콘솔 변경을 되돌린다',
        '감사 로그에 기록이 남았으니 아무것도 하지 않아도 된다',
      ],
      answer: 2,
      step: 10,
      why: '코드와 실제가 어긋난 채(드리프트)로 두면, 다음 적용 때 도구는 코드를 기준으로 실제를 되돌립니다. 코드를 고쳐 주지는 않아요. 필요한 변경이면 코드에 넣어 리뷰를 받고, 임시 조치였으면 되돌려서 둘을 다시 맞춰야 합니다. 감사 로그는 누가 호출했는지만 알려 줍니다.',
    },
    {
      q: '이미 떠 있는 VM 20대에 nginx 설정 파일을 배포하고 서비스를 재시작해야 합니다. 가장 잘 맞는 도구는?',
      options: ['Terraform', 'CloudFormation', 'Bicep', 'Ansible'],
      answer: 3,
      step: 12,
      why: '서버 안의 패키지 · 파일 · 서비스를 다루는 일은 구성 관리 도구인 Ansible의 주특기입니다. Terraform · CloudFormation · Bicep은 VM이나 네트워크 같은 자원 자체를 만들고 지우는 프로비저닝 도구예요. Terraform의 provisioner로 할 수는 있지만 공식 문서도 최후의 수단으로 권합니다.',
    },
    {
      q: '실수로 DB를 삭제하는 변경이 병합되어 적용됐습니다. 그 커밋을 git revert 하고 다시 적용하면?',
      options: [
        'DB와 그 안의 데이터가 삭제 직전 상태로 복구된다',
        '같은 설정의 빈 DB가 새로 만들어진다. 데이터는 백업에서 복원해야 한다',
        'revert는 인프라 코드에는 쓸 수 없다',
        'Git이 클라우드에 삭제 취소를 요청해 준다',
      ],
      answer: 1,
      step: 9,
      why: 'IaC가 되돌리는 것은 설정(어떤 자원이 어떤 모습이어야 하는가)입니다. 코드를 되돌리면 도구는 "DB가 있어야 한다"를 보고 새 DB를 만들 뿐, 지워진 데이터는 모릅니다. 그래서 IaC를 써도 백업과 삭제 보호는 따로 챙겨야 합니다.',
    },
    {
      q: 'prod와 같은 Terraform 코드로 재해 복구용 환경을 새 리전에 만들었습니다. 서버는 정상인데 브라우저에서 인증서 오류가 납니다. 먼저 의심할 것은?',
      options: [
        'prod를 만들 때 코드 밖에서 손으로 한 단계(인증서 연결, DNS 등)가 새 환경에서 빠졌다',
        '새 리전의 서버 사양이 부족하다',
        'Terraform이 리전마다 다른 결과를 낸다',
        '브라우저 캐시 문제이므로 기다리면 해결된다',
      ],
      answer: 0,
      step: 8,
      why: '같은 코드로 만들었는데 특정 기능만 빠졌다면, 코드에 없는 수동 단계가 가장 먼저 의심됩니다. 운영 중인 prod에서는 그 단계가 이미 끝나 있어 아무도 몰랐던 것이죠. 서버 사양은 인증서 오류와 무관하고, Terraform은 같은 코드와 같은 입력이면 리전과 상관없이 같은 것을 만듭니다.',
    },
    {
      q: '파일을 정리하다 main.tf에서 aws_db_instance 블록을 다른 파일로 옮기려다 실수로 지운 채 apply하려 합니다. 무슨 일이 일어날까요?',
      options: [
        '코드에서 사라졌으니 그 DB를 삭제하는 계획이 나온다',
        '코드에 없는 리소스는 Terraform이 건드리지 않는다',
        '블록이 없으면 문법 오류로 실행되지 않는다',
        'DB는 데이터가 있어서 자동으로 보호된다',
      ],
      answer: 0,
      step: 6,
      why: '선언형에서 코드는 "이 모습이어야 한다"는 선언이라, 기록에는 있는데 코드에서 사라진 리소스는 "더는 없어야 한다"로 해석되어 삭제 계획에 오릅니다. 데이터가 있다고 자동 보호되지 않으므로 적용 전에 계획을 읽고, 중요한 리소스에는 삭제 보호를 따로 걸어야 합니다.',
    },
    {
      q: 'AWS만 쓰고 앞으로도 그럴 계획인 작은 팀이, state 파일을 직접 보관 · 잠금 관리하는 부담 없이 IaC를 시작하고 싶어 합니다. 가장 알맞은 선택은?',
      options: [
        'Ansible',
        'Terraform에 로컬 state',
        'CloudFormation (또는 그것을 만들어 내는 AWS CDK)',
        '셸 스크립트와 AWS CLI',
      ],
      answer: 2,
      step: 11,
      why: 'CloudFormation은 스택의 상태를 AWS가 직접 보관하고 실패 시 롤백도 해 주므로, 한 클라우드만 쓴다면 운영 부담이 가장 적습니다. 로컬 state의 Terraform은 바로 그 보관 · 잠금 부담을 지는 선택이고, Ansible과 스크립트는 인프라 상태를 기억하지 않습니다.',
    },
    {
      q: 'AWS · GCP · NCP에 걸친 인프라와 DNS 서비스, Git 저장소 설정까지 한 가지 방식으로 관리하려 합니다. 가장 알맞은 도구는?',
      options: [
        'CloudFormation',
        'Bicep',
        'Ansible',
        'Terraform 또는 OpenTofu',
      ],
      answer: 3,
      step: 11,
      why: 'Terraform 계열은 프로바이더 플러그인으로 여러 클라우드와 SaaS를 같은 언어와 같은 절차로 다룹니다. CloudFormation과 Bicep은 각자 자기 클라우드 전용이고, Ansible은 서버 안을 설정하는 구성 관리가 주특기라 리소스의 상태를 기억하지 않습니다.',
    },
    {
      q: '서버 20대 가운데 몇 대만 nginx 버전이 다릅니다. 앞으로는 모든 서버가 정확히 같은 상태에서 출발하고, 롤백은 이전 버전으로 다시 띄우기만 하면 되게 하고 싶습니다. 어떤 방식이 맞을까요?',
      options: [
        'SSH로 접속해 다른 서버들을 하나씩 맞춘다',
        'Packer로 설정이 끝난 이미지를 굽고, 새 이미지로 서버를 교체하는 불변 방식',
        'Terraform의 count를 늘려 서버를 더 만든다',
        '버전이 다른 서버에만 Ansible을 한 번 더 돌린다',
      ],
      answer: 1,
      step: 13,
      why: '불변 인프라는 서버를 고치지 않고 같은 이미지에서 새로 띄우므로 서버 간 차이가 생기지 않고, 롤백은 이전 이미지로 다시 띄우기입니다. Ansible을 다시 돌리면 지금의 차이는 맞출 수 있지만, 살아 있는 서버에 변경이 계속 쌓이는 구조는 그대로예요. SSH 수작업은 차이를 만든 원인 그 자체입니다.',
    },
    {
      q: '누군가 콘솔에서 dev 서버 한 대를 지웠습니다. 이후 아무도 Terraform을 실행하지 않았다면 어떻게 될까요?',
      options: [
        'Terraform이 몇 초 안에 감지해 자동으로 다시 만든다',
        '클라우드가 Terraform 코드를 읽어 삭제를 거부한다',
        '다음에 누군가 plan이나 apply를 실행할 때까지 1대인 채로 남는다',
        'Terraform 코드에서도 count가 자동으로 1로 바뀐다',
      ],
      answer: 2,
      step: 7,
      why: 'Terraform은 사람이 실행할 때 한 번 비교하는 도구입니다. 계속 감시하며 되돌리는 것은 쿠버네티스 컨트롤러나 GitOps 도구의 방식이에요. 다음 실행 때 원하는 2대와 실제 1대를 비교해 1대를 만드는 계획을 세웁니다. 코드는 사람이 고치지 않는 한 바뀌지 않습니다.',
    },
    {
      q: '보안 점검에서 석 달 전에 열린 SSH 규칙을 발견했습니다. CloudTrail 콘솔의 이벤트 기록에서 찾아보니 해당 호출이 보이지 않습니다. 가장 그럴듯한 이유와 대책은?',
      options: [
        '이벤트 기록은 최근 90일치만 보여 준다. 트레일을 만들어 버킷에 장기 보관해야 한다',
        '보안 그룹 변경은 감사 로그에 남지 않는다',
        '콘솔에서 한 변경은 CloudTrail에 기록되지 않는다',
        '규칙이 Terraform으로 만들어졌기 때문이다',
      ],
      answer: 0,
      step: 3,
      why: 'CloudTrail의 기본 이벤트 기록은 최근 90일치 관리 이벤트만 조회할 수 있습니다. 그보다 오래 보관하려면 트레일을 만들어 버킷 등에 쌓아야 해요. 콘솔 변경도 API 호출이라 기록되며, 보안 그룹 변경도 관리 이벤트로 남습니다. 다만 기록이 있어도 "왜"는 알 수 없습니다.',
    },
    {
      q: '콘솔로 만든 dev와 prod에서, dev에서 통과한 배포가 prod에서만 실패합니다. 원인 분석을 위해 가장 먼저 할 일은?',
      options: [
        'prod를 지우고 dev를 다시 복제한다',
        '배포를 다시 시도해 본다',
        '애플리케이션 코드부터 디버깅한다',
        '두 환경의 설정 값(인스턴스 크기, 백업, 네트워크 규칙 등)을 같은 방법으로 뽑아 비교한다',
      ],
      answer: 3,
      step: 2,
      why: '손으로 만든 두 환경은 기본값과 실수 때문에 어딘가 다를 가능성이 큽니다. 같은 코드가 한쪽에서만 실패하면 환경 차이부터 찾아야 원인에 빨리 닿아요. 재시도는 원인을 알려 주지 않고, 지우고 다시 복제하는 것은 운영 환경에서 감당하기 어려운 조치입니다.',
    },
    {
      q: 'IaC 도입 후에도 prod에서 드리프트가 계속 생깁니다. 사람 계정 대부분이 관리자 권한을 가진 상태입니다. 가장 효과적인 다음 조치는?',
      options: [
        '드리프트가 생길 때마다 apply로 되돌린다',
        '사람 계정은 읽기 전용으로 바꾸고, 쓰기는 파이프라인 역할과 기록이 남는 긴급 역할만 갖게 한다',
        '공유 관리자 계정 하나만 남기고 비밀번호를 금고에 둔다',
        '콘솔 사용을 금지하는 공지를 보낸다',
      ],
      answer: 1,
      step: 10,
      why: '변경 경로가 여러 개면 드리프트는 반드시 다시 생깁니다. 권한으로 경로를 코드 하나로 좁히고, 장애 때만 기록이 남는 긴급 역할을 쓰게 하는 것이 근본 대책이에요. 되돌리기만 반복하면 필요한 수정까지 되돌려 장애를 부르고, 공유 계정은 감사 로그의 "누가"마저 지웁니다.',
    },
  ],
};
