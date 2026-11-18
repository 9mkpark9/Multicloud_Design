export default {
  id: 'serverless',
  learn: [
    '스케줄 이벤트가 함수를 깨우는 구조와 과금 방식',
    '상태는 함수 밖에: DynamoDB, SNS, Discord 웹훅',
    'S3 + CloudFront(OAC)로 서버 없는 정적 대시보드',
    '재시도 · DLQ · 알람으로 실패를 드러내기',
    'at-least-once와 멱등성, "알림 먼저, 저장은 나중"',
    '콜드 스타트 · 제한 시간, 서버리스가 맞지 않는 경우',
  ],
  legend: [['ctrl', '이벤트 · 트리거'], ['req', '요청'], ['data', '데이터'], ['res', '응답'], ['bad', '실패']],
  metrics: [
    { id: 'bill', label: '과금 기준', icon: 'coins' },
    { id: 'idle', label: '노는 시간', icon: 'hourglass' },
    { id: 'lost', label: '놓친 알림', icon: 'bell' },
    { id: 'detect', label: '실패 알아채기', icon: 'siren' },
  ],
  codes: {
    handler: {
      title: 'handler.py', lang: 'text',
      text: `def handler(event, context):
    for item in fetch_items():
        if seen(item.id):
            continue  # 처리함
        notify(item)  # 1. 알림
        save(item.id) # 2. 저장

def save(item_id):
  table.put_item(
    Item={'id': item_id},
    ConditionExpression=
      'attribute_not_exists(id)')`,
    },
  },
  scene: {
    nodes: {
      ec2: { at: [2.6, 0.4], label: 'EC2', sub: 'cron 상시 실행', icon: 'server', color: 'slate' },
      sched: { kind: 'tile', at: [-0.4, 2.2], label: 'EventBridge', icon: 'calendar', color: 'purple' },
      fn: { at: [2.6, 0.4], label: 'Lambda', sub: '수집 함수', icon: 'zap', color: 'aws' },
      ddb: { kind: 'cyl', at: [2.8, -2.4], label: 'DynamoDB', icon: 'table', color: 'blue' },
      discord: { kind: 'tile', at: [5.6, 1.4], label: 'Discord 웹훅', icon: 'message', color: 'navy' },
      sns: { kind: 'tile', at: [0.2, 4.8], label: 'SNS 토픽', icon: 'megaphone', color: 'red' },
      dlq: { kind: 'cyl', at: [4.0, 3.8], label: 'SQS DLQ', icon: 'inbox', color: 'yellow' },
      alarm: { kind: 'tile', at: [2.6, 5.0], label: 'CloudWatch 알람', icon: 'siren', color: 'olive' },
      viewer: { kind: 'client', at: [-0.4, 2.2], label: '나 (브라우저)' },
      cf: { at: [2.6, 0.4], label: 'CloudFront', sub: 'HTTPS · 캐시', icon: 'globe', color: 'purple' },
      s3: { kind: 'cyl', at: [2.8, -2.4], label: 'S3 (비공개)', icon: 'archive', color: 'green' },
      anyone: { kind: 'client', at: [5.6, 1.4], label: '버킷 URL 직접' },
    },
    edges: {
      e_ec2: { from: 'ec2', to: 'discord' },
      e_sf: { from: 'sched', to: 'fn' },
      e_fd: { from: 'fn', to: 'ddb', bi: true },
      e_fdc: { from: 'fn', to: 'discord' },
      e_fs: { from: 'fn', to: 'sns' },
      e_fq: { from: 'fn', to: 'dlq', style: 'dashed', tone: 'bad', label: '3번 실패' },
      e_qa: { from: 'dlq', to: 'alarm' },
      e_as: { from: 'alarm', to: 'sns' },
      e_vc: { from: 'viewer', to: 'cf' },
      e_cs: { from: 'cf', to: 's3', label: 'OAC' },
      e_as3: { from: 'anyone', to: 's3', style: 'dashed', tone: 'bad' },
    },
  },
  steps: [
    {
      key: '상시 서버', kind: 'problem', title: '10분에 1초 일하는 서버',
      body: [
        '10분마다 새 항목을 확인해, 있으면 Discord로 알려 주는 봇을 만든다고 해 봅시다. 가장 쉬운 방법은 EC2 한 대에 스크립트를 두고 <code>cron</code>으로 돌리는 것입니다.',
        '실제로 일하는 시간은 10분에 1–2초. 나머지 99% 넘는 시간 동안 서버는 놀면서 <b>켜진 시간만큼</b> 요금이 나갑니다. OS 패치와 디스크, 프로세스가 죽었는지 확인하는 것도 여전히 내 일이에요.',
      ],
      callout: { type: 'key', text: '일이 <b>가끔, 짧게</b> 생기는 작업일수록 "항상 켜 둔 서버"는 낭비가 큽니다.' },
      show: ['ec2', 'discord'],
      tags: [{ on: 'ec2', text: '*/10 * * * *', icon: 'clock', pos: 'left' }, { on: 'discord', text: '새 항목 알림', pos: 'right' }],
      flows: [{ path: ['ec2', 'discord'], kind: 'req', n: 1 }],
      metrics: { bill: ['VM 24시간', 'bad'], idle: ['99% 이상', 'bad'], lost: '0건', detect: ['로그를 뒤져야', 'warn'] },
    },
    {
      key: '스케줄 함수', kind: 'solution', title: '스케줄이 함수를 깨웁니다',
      body: [
        '<b>서버리스</b>는 서버를 내가 관리하지 않고, <b>이벤트</b>가 올 때만 코드가 실행되는 방식입니다. <b>EventBridge</b> 스케줄에 <code>rate(10 minutes)</code> 같은 식을 걸면 10분마다 <b>Lambda</b> 함수를 호출합니다.',
        '요금은 <b>호출 횟수</b>와 <b>실행 시간 × 메모리</b>로 매깁니다. 돌지 않는 동안은 0원이고, 이런 작은 봇은 무료 사용량 안에 들어가는 경우가 많습니다. OS와 런타임 패치는 사업자 몫입니다.',
      ],
      callout: { type: 'tip', text: '이벤트는 스케줄만이 아닙니다. 파일 업로드, HTTP 요청, 큐에 들어온 메시지도 함수를 깨웁니다. 함수는 이벤트를 JSON으로 받습니다.' },
      hide: ['ec2'],
      show: ['sched', 'fn'],
      focus: ['fn'],
      tags: [{ on: 'sched', text: 'rate(10 minutes)', icon: 'clock', pos: 'left' }, { on: 'fn', text: '1–2초 실행 후 종료', tone: 'ok', pos: 'top' }],
      flows: [{ path: ['sched', 'fn'], kind: 'ctrl', n: 1 }, { path: ['fn', 'discord'], kind: 'req', delay: 1.1 }],
      metrics: { bill: ['호출 · 실행 시간', 'ok'], idle: ['0원으로 쉼', 'ok'] },
      changes: [['-', 'cron이 도는 EC2'], ['+', 'EventBridge 스케줄'], ['+', 'Lambda 함수']],
    },
    {
      key: '상태는 밖에', kind: 'concept', title: '함수는 기억하지 않습니다',
      body: [
        '함수 실행 환경은 언제든 버려집니다. 그래서 "어디까지 알렸는지" 같은 <b>상태</b>는 함수 밖에 둡니다. 여기서는 <b>DynamoDB</b>에 처리한 항목의 ID를 저장하고, 실행할 때마다 새 항목인지 확인합니다.',
        '알림은 두 갈래입니다. <b>SNS</b> 토픽에 발행하면 구독한 이메일로 퍼지고, Discord는 함수가 <b>웹훅 URL</b>로 HTTP 요청을 보냅니다. 함수는 이렇게 이벤트를 받아 다른 서비스를 잇는 접착제 역할을 합니다.',
      ],
      callout: { type: 'warn', text: '웹훅 URL은 아는 사람 누구나 메시지를 보낼 수 있는 비밀입니다. 코드에 적지 말고 환경 변수나 시크릿 저장소에서 읽으세요.' },
      show: ['ddb', 'sns'],
      tags: [{ on: 'ddb', text: '처리한 항목 ID', icon: 'key', pos: 'right' }, { on: 'sns', text: '이메일 구독', pos: 'bottom' }],
      flows: [
        { path: ['sched', 'fn'], kind: 'ctrl' }, { path: ['fn', 'ddb'], kind: 'req', delay: 0.8 }, { path: ['ddb', 'fn'], kind: 'data', delay: 1.6 },
        { path: ['fn', 'discord'], kind: 'req', delay: 2.4 }, { path: ['fn', 'sns'], kind: 'req', delay: 2.4 },
      ],
      changes: [['+', 'DynamoDB: 처리 기록'], ['+', 'SNS 토픽 → 이메일'], ['+', 'Discord 웹훅']],
    },
    {
      key: '대시보드', kind: 'concept', title: '대시보드도 서버 없이: S3 + CloudFront',
      body: [
        '결과를 보는 대시보드는 HTML·JS 같은 <b>정적 파일</b>이라 웹 서버가 필요 없습니다. 파일은 S3 버킷에 두고, 앞에 CDN인 <b>CloudFront</b>를 세워 HTTPS와 캐시를 맡깁니다.',
        '버킷은 <b>비공개</b>로 둡니다. <b>OAC</b>(Origin Access Control)를 쓰면 버킷 정책이 "이 CloudFront 배포만 읽을 수 있다"고 허용해, 버킷 URL로 직접 오는 요청은 거절됩니다.',
      ],
      callout: { type: 'warn', text: '버킷을 공개로 바꿔 정적 웹사이트로 여는 방법도 있지만, 그러면 CloudFront를 우회하는 길이 열립니다. 버킷 공개 차단은 켜 둔 채 OAC로 여세요.' },
      hide: ['sched', 'fn', 'ddb', 'sns', 'discord'],
      show: ['viewer', 'cf', 's3', 'anyone'],
      focus: ['cf'],
      tags: [{ on: 's3', text: '공개 차단 켜짐', tone: 'ok', icon: 'lock', pos: 'right' }, { on: 'anyone', text: '403 거절', tone: 'bad', pos: 'bottom' }],
      flows: [{ path: ['viewer', 'cf', 's3'], kind: 'req', n: 2 }, { path: ['s3', 'cf', 'viewer'], kind: 'res', n: 2, delay: 1.6 }, { path: ['anyone', 's3'], kind: 'bad', n: 2, delay: 0.6 }],
    },
    {
      key: '재시도 · DLQ', kind: 'concept', title: '실패는 재시도하고, 끝내 실패하면 큐로',
      body: [
        'Discord가 잠깐 응답하지 않아 함수가 예외를 던지거나 <b>제한 시간</b>을 넘겼습니다. 스케줄처럼 <b>비동기</b>로 호출된 함수는 Lambda가 기본으로 <b>2번 더 재시도</b>합니다.',
        '그래도 실패하면 이벤트를 버리지 않고 <b>DLQ</b>(dead-letter queue, 여기선 SQS)에 넣게 설정합니다. 그리고 <b>CloudWatch 알람</b>이 큐에 메시지가 1개라도 쌓이면 SNS로 나에게 알립니다.',
      ],
      callout: { type: 'key', text: '서버리스에서 가장 위험한 실패는 <b>아무도 모르는 실패</b>입니다. 재시도 → DLQ → 알람까지 이어져야 실패가 눈에 보입니다.' },
      hide: ['viewer', 'cf', 's3', 'anyone', 'ddb'],
      show: ['sched', 'fn', 'discord', 'sns', 'dlq', 'alarm'],
      set: { discord: { state: 'down' } },
      tags: [{ on: 'fn', text: '시도 1 + 재시도 2', tone: 'warn', icon: 'repeat', pos: 'right' }, { on: 'alarm', text: '메시지 ≥ 1이면 경보', icon: 'bell', pos: 'bottom' }],
      flows: [
        { path: ['sched', 'fn'], kind: 'ctrl' }, { path: ['fn', 'discord'], kind: 'bad', n: 3, gap: 0.5, delay: 0.6 },
        { path: ['fn', 'dlq'], kind: 'data', delay: 2.4 }, { path: ['dlq', 'alarm', 'sns'], kind: 'ctrl', delay: 3 },
      ],
      metrics: { detect: ['알람으로 즉시', 'ok'] },
      changes: [['+', '비동기 재시도 2회'], ['+', 'SQS DLQ'], ['+', 'CloudWatch 알람 → SNS']],
    },
    {
      key: '멱등성', kind: 'concept', title: '같은 이벤트가 두 번 올 수 있습니다',
      body: [
        '재시도가 있다는 것은 같은 이벤트로 함수가 <b>여러 번</b> 실행될 수 있다는 뜻입니다. 이벤트 서비스는 대부분 <b>at-least-once</b>, 곧 "최소 한 번은 전달"을 약속할 뿐 "정확히 한 번"은 약속하지 않아요.',
        '그래서 함수는 <b>멱등</b>해야 합니다. 두 번 실행해도 결과가 한 번 실행한 것과 같아야 해요. 이미 처리한 ID는 건너뛰고, 저장은 "이 ID가 없을 때만" 쓰는 <b>조건부 쓰기</b>로 해서 동시에 두 번 돌아도 한 번만 남게 합니다.',
      ],
      hide: ['discord', 'sns', 'dlq', 'alarm', 'sched'],
      show: ['ddb'],
      set: { discord: { state: null } },
      focus: ['ddb'],
      flows: [{ path: ['fn', 'ddb'], kind: 'req', n: 2, gap: 0.6 }, { path: ['ddb', 'fn'], kind: 'data', n: 2, gap: 0.6, delay: 1.2 }],
      tags: [{ on: 'fn', text: '같은 이벤트 × 2', tone: 'warn', icon: 'repeat', pos: 'top' }],
      code: { ref: 'handler', hl: [3, 4, 9, 10, 11, 12] },
    },
    {
      key: '조용한 누락', kind: 'case', title: '사례: 저장 먼저 했더니 알림이 사라짐',
      body: [
        '처음 코드는 <b>저장 → 알림</b> 순서였습니다. 저장은 성공했는데 Discord 호출이 실패했고, 재시도가 돌았어요. 그런데 재시도 때는 이미 저장된 ID라 <b>건너뜀</b>. 오류도 DLQ도 없이 알림 하나가 영영 사라졌습니다.',
        '순서를 <b>알림 → 저장</b>으로 바꾸면, 저장이 실패해도 재시도에서 다시 알립니다. 최악이 <b>중복 알림</b>이고, 중복은 눈에 보이니 고칠 수 있습니다.',
      ],
      callout: { type: 'key', text: '"처리했다"는 기록은 처리가 <b>정말 끝난 뒤</b>에 남깁니다. 조용한 누락보다 시끄러운 중복이 낫습니다.' },
      show: ['discord'],
      set: { discord: { state: 'down' } },
      tags: [{ on: 'ddb', text: '이미 저장됨', tone: 'warn', pos: 'right' }],
      flows: [{ path: ['fn', 'ddb'], kind: 'req' }, { path: ['fn', 'discord'], kind: 'bad', delay: 1 }, { path: ['fn', 'ddb'], kind: 'req', delay: 2.2 }],
      metrics: { lost: ['1건 (오류 없음)', 'bad'] },
      code: { ref: 'handler', hl: [5, 6] },
      changes: [['-', '저장 → 알림 순서'], ['+', '알림 → 저장 순서'], ['~', '최악은 중복 알림']],
    },
    {
      key: '안 맞는 일', kind: 'concept', title: '콜드 스타트와 한계: 안 맞는 일',
      body: [
        '한동안 호출이 없으면 실행 환경이 정리되고, 다음 호출은 환경을 새로 만들고 초기화 코드를 돌리느라 늦어집니다. 이것이 <b>콜드 스타트</b>예요. 10분 주기 봇에는 상관없지만, 응답 지연에 민감한 API라면 체감됩니다.',
        '한 번 실행은 최대 15분(기본 제한 시간은 3초)입니다. 오래 걸리는 배치, 하루 종일 꾸준히 바쁜 서비스(이때는 VM·컨테이너가 쌀 수 있음), 오래 붙어 있는 연결, 커넥션이 한정된 관계형 DB를 많이 쓰는 작업은 서버리스가 맞지 않을 수 있습니다.',
      ],
      callout: { type: 'tip', text: 'SDK 클라이언트·DB 연결은 핸들러 <b>밖</b>에서 만들어 다음 호출에 재사용하세요. 지연이 꼭 문제라면 미리 데워 두는 옵션(AWS는 프로비저닝된 동시성)이 있습니다.' },
      hide: ['discord'],
      show: ['sched'],
      set: { discord: { state: null }, fn: { badge: '첫 호출 +수백 ms' } },
      focus: ['fn'],
      tags: [{ on: 'fn', text: '최대 15분', icon: 'timer', pos: 'bottom' }],
      flows: [{ path: ['sched', 'fn'], kind: 'ctrl' }, { path: ['fn', 'ddb'], kind: 'req', delay: 1.4 }],
      metrics: { lost: ['0건', 'ok'] },
    },
    {
      key: '4대 클라우드', kind: 'compare', title: '네 클라우드의 함수 서비스',
      body: [
        'AWS <b>Lambda</b>, Azure <b>Functions</b>(타이머 트리거), GCP <b>Cloud Run functions</b>(Cloud Scheduler로 호출), NCP <b>Cloud Functions</b>가 같은 자리입니다. 이벤트를 받아 짧게 실행되고, 실행한 만큼 낸다는 모델은 같습니다.',
        'GCP는 함수 대신 컨테이너를 그대로 올리는 <b>Cloud Run</b>도 서버리스의 중심입니다. 컨테이너면 다른 곳으로 옮기기도 쉽습니다.',
      ],
      callout: { type: 'cloud', text: '함수 코드보다 옮기기 어려운 것은 <b>이벤트 배선</b>입니다. 스케줄·큐·알림·권한 설정은 사업자마다 달라서, 이식성이 중요하면 그 부분을 IaC로 정리해 두세요.' },
      show: ['discord', 'sns'],
      set: { fn: { badge: null } },
      panel: {
        title: '서버리스 함수', icon: 'zap',
        rows: [['AWS', 'Lambda + EventBridge', 'aws'], ['Azure', 'Functions (타이머 트리거)', 'azure'], ['GCP', 'Cloud Run functions · Cloud Run', 'gcp'], ['NCP', 'Cloud Functions', 'ncp']],
      },
      flows: [{ path: ['sched', 'fn'], kind: 'ctrl' }, { path: ['fn', 'discord'], kind: 'req', delay: 1 }, { path: ['fn', 'sns'], kind: 'req', delay: 1 }],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 이벤트, 상태는 밖에, 실패는 보이게',
      body: [
        '서버리스는 이벤트가 올 때만 실행하고 쓴 만큼 냅니다. 함수는 기억하지 않으니 상태는 DynamoDB 같은 외부에 두고, 실패는 <b>재시도 → DLQ → 알람</b>으로 드러냅니다.',
        '이벤트는 두 번 올 수 있으니 함수를 <b>멱등</b>하게, 기록은 일이 끝난 뒤에. 다음 레슨은 이 함수가 DynamoDB와 SNS를 부를 수 있게 해 준 것, 곧 <b>IAM 권한</b>입니다.',
      ],
      show: ['dlq', 'alarm'],
      focus: ['fn'],
      flows: [{ path: ['sched', 'fn'], kind: 'ctrl' }, { path: ['fn', 'discord'], kind: 'req', delay: 1 }, { path: ['fn', 'ddb'], kind: 'req', delay: 1.6 }, { path: ['dlq', 'alarm', 'sns'], kind: 'ctrl', delay: 2.2 }],
    },
  ],
  quiz: [
    {
      q: '함수가 "새 항목이면 DB에 저장하고 Discord로 알린다"를 이 순서로 합니다. Discord가 가끔 실패하고 재시도가 켜져 있습니다. 어떤 일이 생길까요?',
      options: ['재시도가 알림을 다시 보내므로 문제없다', '저장된 ID를 보고 재시도가 건너뛰어, 일부 알림이 오류 없이 사라진다', '같은 알림이 세 번씩 간다', '함수가 DLQ로 가서 알람이 울린다'],
      answer: 1,
      why: '재시도 때는 이미 저장된 ID라 "처리됨"으로 보고 건너뜁니다. 함수는 성공으로 끝나니 DLQ도 알람도 없습니다. 알림을 먼저, 저장을 나중에 하면 최악이 중복 알림으로 바뀌어 눈에 보입니다.',
    },
    {
      q: '스케줄로 도는 Lambda가 가끔 실패하는데 아무도 모르고 지나갑니다. 실패를 드러내는 구성으로 가장 알맞은 것은?',
      options: ['함수 제한 시간을 15분으로 늘린다', '재시도를 끄고 로그만 남긴다', '재시도 후에도 실패한 이벤트를 DLQ로 보내고, DLQ에 메시지가 쌓이면 알람으로 알린다', '함수 메모리를 최대로 올린다'],
      answer: 2,
      why: '실패한 이벤트를 보관하고(DLQ) 쌓이면 알리는(알람) 경로가 있어야 실패가 보입니다. 제한 시간과 메모리는 실패의 일부 원인을 줄일 뿐 알려 주지 않고, 로그만으로는 누가 보기 전까지 모릅니다.',
    },
    {
      q: '다음 중 서버리스 함수가 가장 맞지 않는 작업은?',
      options: ['하루 몇 번 들어오는 이미지 업로드마다 썸네일 만들기', '매시간 외부 API를 확인해 바뀐 점을 알리기', '1시간 넘게 걸리는 대용량 데이터 변환을 하루 종일 연속으로 돌리기', '가끔 오는 웹훅을 받아 큐에 넣기'],
      answer: 2,
      why: '함수는 한 번 실행에 시간 한도(Lambda는 15분)가 있고, 하루 종일 바쁜 작업은 VM이나 컨테이너가 더 싸고 단순합니다. 나머지는 가끔 짧게 생기는 이벤트 처리라 서버리스의 장점이 그대로 살아납니다.',
    },
    {
      q: 'S3 버킷의 정적 대시보드를 CloudFront로 서비스합니다. 버킷 설정으로 가장 알맞은 것은?',
      options: ['버킷을 공개 읽기로 열고 CloudFront는 캐시로만 쓴다', '버킷은 비공개로 두고 OAC로 해당 CloudFront 배포만 읽게 허용한다', '버킷 URL을 그대로 사용자에게 알려 준다', '대시보드 파일을 Lambda 코드 안에 넣는다'],
      answer: 1,
      why: 'OAC를 쓰면 버킷 정책이 특정 CloudFront 배포에만 읽기를 허용해, 버킷은 비공개로 남고 우회 접근이 막힙니다. 공개 버킷은 CloudFront를 거치지 않는 길을 열어 둡니다.',
    },
  ],
};
