export default {
  id: 'iac-why',
  learn: [
    '콘솔 클릭(ClickOps)이 남기는 세 가지 문제',
    '드리프트: 실제 인프라가 의도에서 멀어지는 현상',
    '명령형과 선언형의 차이, 그리고 멱등성',
    'Git으로 인프라 변경을 리뷰하고 되돌리기',
    'Terraform · CloudFormation · Bicep · Pulumi의 자리',
    '프로비저닝과 구성 관리(Ansible)의 구분',
  ],
  legend: [['ctrl', 'API 호출 · 적용'], ['build', '코드 변경']],
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
      prod: { at: [6.2, 2.6], label: 'prod 환경', sub: '서버 · DB', icon: 'layers', color: 'purple' },
      night: { kind: 'client', at: [8.2, 1.6], label: '당직자' },
      reviewer: { kind: 'client', at: [2.4, -0.4], label: '리뷰어' },

      tfx: { at: [-1.5, -1.5], label: 'Terraform', sub: 'OpenTofu', icon: 'blocks', color: 'olive' },
      aws: { at: [-1.4, 3.4], label: 'AWS', icon: 'cloud', color: 'aws' },
      azure: { at: [0.2, 1.8], label: 'Azure', icon: 'cloud', color: 'azure' },
      gcp: { at: [1.8, 0.2], label: 'GCP', icon: 'cloud', color: 'gcp' },
      ncp: { at: [3.4, -1.4], label: 'NCP', icon: 'cloud', color: 'ncp' },
      cfn: { at: [1.1, 5.9], label: 'Cloud\nFormation', icon: 'file-text', color: 'sand' },
      bicep: { at: [2.7, 4.3], label: 'Bicep', sub: 'ARM', icon: 'file-text', color: 'sand' },
      vm: { at: [0.5, -3.5], label: '서버 (VM)', sub: 'nginx · 설정', icon: 'server', color: 'blue' },
      ans: { at: [2.5, -5.5], label: 'Ansible', sub: '구성 관리', icon: 'wrench', color: 'red' },
    },
    edges: {
      e_console: { from: 'eng', to: 'console' },
      e_c_dev: { from: 'console', to: 'dev' },
      e_c_prod: { from: 'console', to: 'prod' },
      e_night: { from: 'night', to: 'prod', tone: 'bad' },
      e_tf: { from: 'eng', to: 'tf' },
      e_tf_dev: { from: 'tf', to: 'dev' },
      e_tf_prod: { from: 'tf', to: 'prod' },
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
    },
    {
      key: 'Git 리뷰', kind: 'solution', title: '코드니까 Git으로 리뷰하고 되돌립니다',
      body: [
        '인프라가 텍스트 파일이 되면 애플리케이션 코드와 똑같이 다룰 수 있습니다. <b>Git</b>에 넣고, 변경은 <b>Pull Request</b>로 올리고, 동료가 승인해야 반영됩니다.',
        '아까 그 SSH 규칙을 보세요. 이번에는 diff 두 줄로 리뷰어 눈앞에 놓입니다. 반영되기 <b>전에</b> 막을 수 있어요. 이미 반영된 변경도 커밋을 <code>git revert</code> 하고 다시 적용하면 이전 설정으로 돌아갑니다.',
      ],
      callout: { type: 'warn', text: '되돌아오는 것은 <b>설정</b>입니다. 삭제된 DB의 <b>데이터</b>는 코드를 되돌려도 돌아오지 않아요. 백업은 따로 필요합니다.' },
      hide: ['tf', 'dev'],
      show: ['git', 'reviewer', 'prod'],
      set: { dev: { state: null, badge: null } },
      code: { ref: 'diff', hl: [8, 9] },
      flows: [{ path: ['eng', 'git'], kind: 'build' }, { path: ['reviewer', 'git'], kind: 'ctrl', delay: 1 }, { path: ['git', 'prod'], kind: 'ctrl', n: 2, delay: 2 }],
      tags: [{ on: 'reviewer', text: '승인해야 반영', icon: 'user-check' }],
      metrics: { hist: ['Git 커밋', 'ok'], review: ['PR 승인', 'ok'] },
      changes: [['+', 'Git 저장소와 PR 리뷰'], ['~', '변경 이력: 감사 로그뿐 → 커밋'], ['~', '되돌리기: revert 후 다시 적용']],
    },
    {
      key: '도구 지형', kind: 'compare', title: 'IaC 도구들: 누가 어디까지 다루나',
      body: [
        '<b>Terraform</b>은 프로바이더 플러그인으로 여러 클라우드를 같은 언어(HCL)와 같은 절차로 다룹니다. <b>OpenTofu</b>는 Terraform의 라이선스가 바뀐 뒤 갈라져 나온 오픈소스 포크로, 사용법이 거의 같습니다.',
        '사업자 전용 도구도 있습니다. AWS의 <b>CloudFormation</b>, Azure의 <b>Bicep</b>(ARM 템플릿을 간결하게 쓰는 언어)은 자기 클라우드와 가장 깊게 통합되지만 다른 클라우드는 다루지 못해요. <b>Pulumi</b>는 TypeScript · Python 같은 범용 언어로 같은 일을 합니다.',
      ],
      callout: { type: 'cloud', text: 'GCP와 NCP도 공식 Terraform 프로바이더를 제공합니다. 네 클라우드를 한 도구로 다루려는 이 코스가 Terraform을 쓰는 이유예요.' },
      hide: ['eng', 'git', 'reviewer', 'prod'],
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
    },
    {
      key: '정리', kind: 'recap', title: '정리: 인프라도 코드처럼 다룹니다',
      body: [
        '콘솔 클릭은 재현할 수 없고, 환경이 서로 어긋나며, 리뷰와 이력이 남지 않습니다. IaC는 인프라를 <b>선언형 코드</b>로 적어, 같은 파일에서 같은 환경을 몇 번이든 만들어 냅니다. 코드는 Git에서 리뷰하고 되돌릴 수 있고요.',
        '그런데 도구는 "지금 상태"를 어떻게 알고 차이만 메울까요? 다음 레슨에서 <code>main.tf</code> 하나를 들고 Terraform의 <code>init → plan → apply</code>를 끝까지 따라갑니다.',
      ],
      hide: ['tfx', 'vm', 'ans'],
      show: ['eng', 'git', 'dev', 'prod'],
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
      why: '명령형 스크립트는 "만들어라"를 실행할 뿐, 이미 몇 대가 있는지 모릅니다. 선언형 도구는 "2대여야 한다"와 현재 상태를 비교해 차이만 메우므로 다시 실행해도 결과가 같습니다(멱등성). Git에 올리는 것은 이력 문제를 풀 뿐 중복 생성을 막지 못합니다.',
    },
    {
      q: 'IaC를 쓰는 팀에서 장애 중에 급히 콘솔로 보안 그룹을 고쳤습니다. 장애가 끝난 뒤 가장 먼저 할 일은?',
      options: [
        '그대로 둔다. 다음 적용 때 도구가 콘솔 변경을 코드에 써 넣어 준다',
        '콘솔 권한을 전원 회수하고 넘어간다',
        '같은 변경을 코드에 반영해 PR로 올리거나, 콘솔 변경을 원래대로 돌린다',
        '감사 로그에 기록이 남았으니 아무것도 하지 않아도 된다',
      ],
      answer: 2,
      why: '코드와 실제가 어긋난 채(드리프트)로 두면, 다음 적용 때 도구는 코드를 기준으로 실제를 되돌립니다. 코드를 고쳐 주지는 않아요. 필요한 변경이면 코드에 넣어 리뷰를 받고, 임시 조치였으면 되돌려서 둘을 다시 맞춰야 합니다. 감사 로그는 "누가 호출했나"만 알려 줍니다.',
    },
    {
      q: '이미 떠 있는 VM 20대에 nginx 설정 파일을 배포하고 서비스를 재시작해야 합니다. 가장 잘 맞는 도구는?',
      options: ['Terraform', 'CloudFormation', 'Ansible', 'Bicep'],
      answer: 2,
      why: '서버 "안"의 패키지 · 파일 · 서비스를 다루는 일은 구성 관리 도구인 Ansible의 주특기입니다. Terraform · CloudFormation · Bicep은 VM이나 네트워크 같은 자원 자체를 만들고 지우는 프로비저닝 도구예요.',
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
      why: 'IaC가 되돌리는 것은 설정(어떤 자원이 어떤 모습이어야 하는가)입니다. 코드를 되돌리면 도구는 "DB가 있어야 한다"를 보고 새 DB를 만들 뿐, 지워진 데이터는 모릅니다. 그래서 IaC를 써도 백업과 삭제 보호는 따로 챙겨야 합니다.',
    },
  ],
};
