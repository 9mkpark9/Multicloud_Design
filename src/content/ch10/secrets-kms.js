export default {
  id: 'secrets-kms',
  learn: [
    '코드 · 이미지 · Git에 박힌 비밀이 위험한 이유와 유출 대응',
    '시크릿 저장소: 값 대신 이름만 남기기',
    'KMS와 봉투 암호화, 키 교체와 키 삭제의 무게',
    '자동 교체 · 동적 시크릿으로 비밀 수명 줄이기',
    '워크로드 아이덴티티와 감사 로그',
    '클라우드 기본 서비스와 HashiCorp Vault',
  ],
  legend: [['build', '커밋 · 배포'], ['req', 'DB 접속'], ['ctrl', 'API 호출 · 인증'], ['data', '비밀 · 키 · 토큰 · 기록'], ['bad', '유출 · 악용 · 실패']],
  metrics: [
    { id: 'where', label: '비밀 위치', icon: 'file-code' },
    { id: 'who', label: '볼 수 있는 쪽', icon: 'eye' },
    { id: 'life', label: '비밀 수명', icon: 'hourglass' },
    { id: 'audit', label: '접근 기록', icon: 'scroll' },
  ],
  scene: {
    nodes: {
      dev: { kind: 'client', at: [0.1, 3.9], label: '개발자' },
      repo: { kind: 'cyl', at: [2, 2], label: 'Git 저장소', icon: 'git', color: 'slate' },
      app: { at: [3.8, 0.2], label: '주문 API', icon: 'server', color: 'blue' },
      db: { kind: 'cyl', at: [5.6, -1.6], label: 'DB', icon: 'database', color: 'purple' },
      attacker: { kind: 'client', at: [3.9, 5.1], label: '공격자' },
      miner: { at: [6, 3], label: 'GPU VM', sub: '채굴 중', icon: 'cpu', color: 'red' },
      sm: { at: [6.4, 2.8], label: '시크릿\n저장소', icon: 'lock', color: 'green' },
      kms: { at: [8.2, 1.0], label: 'KMS', sub: '마스터 키 KEK', icon: 'key-round', color: 'yellow' },
      dek: { kind: 'tile', at: [5.6, 0.6], label: 'DEK', icon: 'key', color: 'orange' },
      kv1: { kind: 'tile', at: [8.4, 3.6], label: '키 버전 1', icon: 'key', color: 'gray' },
      kv2: { kind: 'tile', at: [10.4, 1.6], label: '키 버전 2', icon: 'key', color: 'yellow' },
      blob: { kind: 'cyl', at: [4.6, 4.6], label: '암호화된 파일', icon: 'archive', color: 'teal' },
      idp: { at: [4.6, 4.6], label: '클라우드\nIAM', icon: 'id-card', color: 'navy' },
      vault: { at: [3.9, 2.1], label: 'Vault', sub: 'HashiCorp', icon: 'shield-check', color: 'slate' },
      trail: { kind: 'cyl', at: [9.2, 3.8], label: '감사 로그', icon: 'scroll', color: 'orange' },
      aws: { at: [4.2, 7.8], label: 'AWS', icon: 'cloud', color: 'aws' },
      azure: { at: [6.0, 6.0], label: 'Azure', icon: 'cloud', color: 'azure' },
      gcp: { at: [7.8, 4.2], label: 'GCP', icon: 'cloud', color: 'gcp' },
      ncp: { at: [9.6, 2.4], label: 'NCP', icon: 'cloud', color: 'ncp' },
    },
    edges: {
      e_dr: { from: 'dev', to: 'repo' },
      e_ra: { from: 'repo', to: 'app' },
      e_ad: { from: 'app', to: 'db' },
      e_at: { from: 'attacker', to: 'repo', tone: 'bad', bi: true },
      e_am: { from: 'attacker', to: 'miner', tone: 'bad' },
      e_as: { from: 'app', to: 'sm', bi: true },
      e_sk: { from: 'sm', to: 'kms', style: 'dashed' },
      e_da: { from: 'app', to: 'dek', bi: true },
      e_kd: { from: 'dek', to: 'kms', bi: true },
      e_ab: { from: 'app', to: 'blob' },
      e_ak: { from: 'app', to: 'kms', style: 'dashed', off: true },
      e_k1: { from: 'kms', to: 'kv1', style: 'dashed' },
      e_k2: { from: 'kms', to: 'kv2' },
      e_dk: { from: 'db', to: 'kms', style: 'dashed', off: true },
      e_bk: { from: 'blob', to: 'kms', style: 'dashed', off: true },
      e_sd: { from: 'sm', to: 'db', style: 'dashed', off: true },
      e_ai: { from: 'app', to: 'idp', bi: true },
      e_av: { from: 'app', to: 'vault', bi: true },
      e_vd: { from: 'vault', to: 'db', style: 'dashed' },
      e_st: { from: 'sm', to: 'trail', style: 'dashed' },
      e_kt: { from: 'kms', to: 'trail', style: 'dashed' },
      e_v1: { from: 'vault', to: 'aws' },
      e_v2: { from: 'vault', to: 'azure' },
      e_v3: { from: 'vault', to: 'gcp' },
      e_v4: { from: 'vault', to: 'ncp' },
    },
  },
  steps: [
    // 1
    {
      key: '박힌 비밀번호', kind: 'problem', title: '비밀번호가 코드 안에 들어 있습니다',
      body: [
        '주문 API가 DB에 접속하려면 비밀번호가 필요합니다. 가장 쉬운 방법은 코드나 <code>.env</code>, Dockerfile의 <code>ENV</code>에 적어 두는 것이고, 그대로 Git에 올라가 이미지에 구워집니다.',
        '이제 이 비밀번호는 저장소를 볼 수 있는 모든 사람, 이미지를 받을 수 있는 모든 시스템이 읽을 수 있습니다. 누가 언제 봤는지 기록도 없고, 바꾸려면 코드를 고쳐 다시 배포해야 하니 아무도 바꾸지 않아요.',
      ],
      callout: { type: 'warn', text: 'Git은 <b>지워도 기억합니다</b>. 다음 커밋에서 지워도 히스토리에 남고, 이미지에 넣은 값은 <code>docker inspect</code>만으로 그대로 보입니다.' },
      more: [
        { title: '직접 해보기', body: ['이미지에 구운 비밀은 실행하지 않아도 꺼낼 수 있습니다. 레이어 기록에 빌드 명령이 그대로 남기 때문이에요.'], code: { title: 'terminal', lang: 'sh', text: `$ docker inspect shop/order-api:1.4 \\
    --format '{{json .Config.Env}}'
["DB_HOST=db.internal","DB_PASSWORD=Shop!2024"]

$ docker history --no-trunc shop/order-api:1.4 | grep -i pass
ENV DB_PASSWORD=Shop!2024

$ git log -p --all -S 'DB_PASSWORD' | head -3
commit 9c1e2f…  (6개월 전)
+DB_PASSWORD=Shop!2024` } },
        { title: '비밀이 새는 길', list: [
          '<b>Git 히스토리</b>: 지운 커밋, 다른 브랜치, 포크, 개발자 노트북의 클론까지 모두 사본입니다.',
          '<b>이미지 레이어</b>: <code>ENV</code>, <code>ARG</code>, 복사한 <code>.env</code> 파일이 레지스트리를 받는 모든 곳으로 퍼집니다.',
          '<b>CI 로그</b>: 디버깅용 <code>echo $DB_PASSWORD</code>나 <code>set -x</code>가 빌드 로그에 비밀을 찍습니다.',
          '<b>로그와 에러 메시지</b>: 접속 문자열 전체를 찍는 예외 메시지가 로그 저장소로 흘러갑니다.',
          '<b>메신저와 위키</b>: "임시로" 붙여 넣은 값은 검색에 계속 걸립니다.',
        ] },
        { title: '실무 팁', body: [
          '먼저 <b>목록</b>을 만드세요. 어떤 비밀이 있고, 어디에 쓰이고, 누가 주인인지. 목록이 없으면 유출 때 무엇을 폐기해야 하는지조차 모릅니다. 이 레슨의 목표는 그 목록을 짧게(비밀 수 줄이기), 수명을 짧게(교체), 접근을 기록되게 만드는 것입니다.',
          '이미 Git에 들어간 비밀을 발견했다면 "지우면 된다"가 아니라 "이미 샜다"고 보고 다음 단계의 유출 대응을 그대로 따릅니다. 비공개 저장소라도 접근할 수 있는 사람, 클론한 노트북, 연동된 CI가 모두 사본을 갖고 있으니까요.',
        ] },
      ],
      show: ['dev', 'repo', 'app', 'db'],
      tags: [{ on: 'repo', text: 'DB_PASSWORD=…', tone: 'bad', icon: 'unlock' }, { on: 'app', text: 'ENV에 평문 그대로', tone: 'warn' }],
      flows: [{ path: ['dev', 'repo', 'app'], kind: 'build' }, { path: ['app', 'db'], kind: 'req', n: 2, delay: 1.8 }],
      metrics: { where: ['코드 · Git', 'bad'], who: ['저장소 전원', 'bad'], life: ['무기한', 'bad'], audit: ['없음', 'bad'] },
    },
    // 2
    {
      key: '유출된 키', kind: 'case', title: '사례: 공개 저장소에 올라간 액세스 키',
      body: [
        '한 개발자가 테스트하던 코드를 공개 저장소에 push했습니다. 그 안에는 클라우드 <b>액세스 키</b>가 들어 있었어요. 공개 저장소는 키 패턴을 찾는 봇이 계속 훑고 있어서, 발견까지 몇 분이면 충분합니다.',
        '공격자는 그 키로 여러 리전에 GPU VM을 수백 대 띄워 암호화폐를 채굴했고, 팀은 며칠 뒤 청구서를 보고서야 알았습니다. 커밋을 지우는 것은 대응이 아닙니다. 이미 복사됐으니까요.',
      ],
      callout: { type: 'key', text: '유출된 비밀의 대응은 하나뿐입니다. <b>즉시 폐기하고 새로 발급</b>하세요. 그리고 push 전에 시크릿 스캐너(gitleaks, GitHub push protection)가 막도록 해 둡니다.' },
      more: [
        { title: '대응 순서', list: [
          '<b>1. 폐기</b>: 키를 비활성화하고 새 키로 바꿉니다. 키를 쓰던 시스템이 잠깐 멈추더라도 먼저 합니다.',
          '<b>2. 피해 범위</b>: 감사 로그(AWS CloudTrail 등)에서 그 키 ID로 한 모든 호출을 봅니다. 새로 만든 사용자 · 키 · 역할, 낯선 리전의 리소스가 없는지 확인해요. 공격자는 흔히 자기용 키를 하나 더 만들어 둡니다.',
          '<b>3. 정리</b>: 공격자가 만든 리소스를 지우고, 사업자 지원 창구에 부정 사용을 알립니다.',
          '<b>4. 히스토리</b>: 마지막으로 <code>git filter-repo</code> 등으로 히스토리에서 지웁니다. 순서가 바뀌면 안 됩니다.',
        ] },
        { title: '막는 설정', body: ['커밋 전에 막는 것이 가장 쌉니다. pre-commit 훅과 CI 양쪽에서 돌리세요.'], code: { title: 'terminal', lang: 'sh', text: `$ gitleaks git -v .
Finding:     AWS_ACCESS_KEY_ID=AKIA…7Q2M
RuleID:      aws-access-token
File:        scripts/test_upload.py
Commit:      4be1d0a
leaks found: 1` } },
        { title: '출력 읽기', body: [
          'AWS 액세스 키는 앞 네 글자로 종류가 갈립니다. <code>AKIA</code>로 시작하면 <b>장기 키</b>(사용자에게 묶인, 지울 때까지 유효한 키), <code>ASIA</code>로 시작하면 STS가 발급한 <b>임시 키</b>예요. 스캐너가 AKIA를 찾았다면 지금 이 순간에도 유효할 가능성이 높으니 가장 급합니다. 이 레슨 뒤쪽의 워크로드 아이덴티티는 장기 키 자체를 없애는 방법입니다.',
        ] },
      ],
      hide: ['app', 'db'],
      show: ['attacker', 'miner'],
      set: { miner: { badge: '× 수백 대', tone: 'bad', state: 'hot' } },
      tags: [{ on: 'repo', text: 'AKIA… 액세스 키', tone: 'bad', icon: 'unlock' }, { on: 'attacker', text: '봇이 몇 분 만에 발견', tone: 'bad', pos: 'left' }],
      flows: [{ path: ['dev', 'repo'], kind: 'build' }, { path: ['repo', 'attacker'], kind: 'bad', delay: 1.1 }, { path: ['attacker', 'miner'], kind: 'bad', n: 4, gap: 0.25, delay: 2.2 }],
      metrics: { who: ['인터넷 전체', 'bad'] },
      changes: [['-', '액세스 키가 공개 저장소에 노출'], ['-', '채굴용 VM 수백 대 요금'], ['~', '삭제가 아니라 폐기 · 재발급']],
    },
    // 3
    {
      key: '시크릿 저장소', kind: 'solution', title: '비밀은 시크릿 저장소에서 꺼내 씁니다',
      body: [
        '<b>시크릿 저장소</b>(Secrets Manager, Key Vault 등)는 비밀을 암호화해 보관하고 API로만 내주는 관리형 서비스입니다. 코드에는 값 대신 <code>prod/shop/db</code> 같은 <b>이름</b>만 남깁니다.',
        '앱은 시작할 때 저장소에 요청해 값을 받습니다. 누가 꺼낼 수 있는지는 <b>IAM 정책</b>이 정하고, 꺼낸 기록은 모두 감사 로그에 남아요. 값을 바꿀 때도 코드나 이미지는 건드리지 않습니다.',
      ],
      callout: { type: 'tip', text: '쿠버네티스에서는 <b>External Secrets Operator</b>나 Secrets Store CSI 드라이버가 저장소의 값을 Pod로 가져다줍니다. Git에는 "어느 비밀을 쓸지"만 올라가요.' },
      more: [
        { title: '직접 해보기', code: { title: 'terminal', lang: 'sh', text: `$ aws secretsmanager get-secret-value \\
    --secret-id prod/shop/db
{
  "Name": "prod/shop/db",
  "VersionId": "a1f3…",
  "SecretString": "{\\"username\\":\\"shop\\",
                   \\"password\\":\\"…\\"}",
  "VersionStages": ["AWSCURRENT"]
}` } },
        { title: '출력 읽기', body: [
          '비밀은 <b>버전</b>을 가집니다. <code>AWSCURRENT</code>는 지금 쓰는 값, 교체 중에는 <code>AWSPENDING</code>, 직전 값은 <code>AWSPREVIOUS</code>라는 꼬리표가 붙어요. 그래서 잘못 바꿨을 때 이전 버전으로 되돌릴 수 있습니다. 값 하나에 JSON으로 사용자 이름 · 비밀번호 · 호스트를 함께 넣는 것이 흔한 형태입니다.',
        ] },
        { title: '설정 예시: External Secrets', body: ['Git에는 이 매니페스트만 올라가고, 오퍼레이터가 주기적으로 값을 읽어 쿠버네티스 Secret을 만들어 둡니다. 쿠버네티스 Secret 자체의 성질은 7장 ConfigMap과 Secret 레슨에서 봤습니다.'], code: { title: 'external-secret.yaml', lang: 'yaml', text: `apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata: { name: shop-db, namespace: shop }
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-sm }
  target: { name: shop-db }
  data:
    - secretKey: password
      remoteRef: { key: prod/shop/db, property: password }` } },
        { title: '흔한 실수', list: [
          '저장소 읽기 권한을 <code>*</code>로 주기. 앱마다 <b>자기 비밀의 이름만</b> 읽게 하세요.',
          '요청마다 저장소를 호출하기. 호출 요금과 속도 제한에 걸립니다. 시작할 때 읽고 메모리에 캐시하되, 교체를 따라가도록 주기적으로 다시 읽습니다.',
          '저장소에서 받은 값을 다시 환경 변수 파일로 디스크에 써 두기. 저장소를 쓰는 의미가 반쯤 사라집니다.',
          'dev · stg · prod를 한 저장소, 한 권한으로 묶기. 개발자가 dev 값을 보려다 prod 값까지 보게 됩니다. 이름 앞부분(<code>prod/</code>)이나 계정으로 나누세요.',
        ] },
      ],
      hide: ['attacker', 'miner'],
      show: ['app', 'db', 'sm'],
      focus: ['sm'],
      tags: [{ on: 'repo', text: '이름만: prod/shop/db', tone: 'ok' }, { on: 'sm', text: 'IAM이 허용한 앱만', icon: 'shield-check', pos: 'right' }],
      flows: [{ path: ['app', 'sm'], kind: 'ctrl' }, { path: ['sm', 'app'], kind: 'data', delay: 1.1 }, { path: ['app', 'db'], kind: 'req', n: 2, delay: 2.2 }],
      metrics: { where: ['시크릿 저장소', 'ok'], who: ['IAM 허용만', 'ok'], audit: ['전부 기록', 'ok'] },
      changes: [['-', '코드 · 이미지 속 비밀번호'], ['+', '시크릿 저장소'], ['~', '접근 기록: 없음 → 전부']],
    },
    // 4
    {
      key: 'KMS', kind: 'concept', title: 'KMS: 키를 내주지 않는 금고',
      body: [
        '저장소 안의 값은 무엇으로 암호화할까요? 암호화 키입니다. 그럼 그 키는 어디에 둘까요? 이 물음을 끝내는 것이 <b>KMS</b>(Key Management Service)입니다.',
        'KMS는 키를 만들어 변조 방지 장비(<b>HSM</b>) 안에 보관하고, <b>키 자체는 밖으로 내주지 않습니다</b>. 우리는 "이것을 암호화해 줘", "복호화해 줘"라고 API로 부탁할 뿐이에요. 누가 부탁할 수 있는지는 키 정책과 IAM이 정하고, 호출은 전부 기록됩니다.',
      ],
      callout: { type: 'key', text: '암호화의 보안은 결국 <b>키를 누가 쓸 수 있느냐</b>로 모입니다. 데이터를 훔쳐도 KMS 호출 권한이 없으면 열 수 없어요.' },
      more: [
        { title: '직접 해보기', body: ['작은 값은 KMS로 바로 암호화할 수 있습니다. 결과는 어떤 키로 암호화했는지 정보까지 담은 덩어리라, 복호화할 때 키 ID를 따로 주지 않아도 됩니다.'], code: { title: 'terminal', lang: 'sh', text: `$ aws kms encrypt --key-id alias/shop \\
    --plaintext fileb://token.txt \\
    --query CiphertextBlob --output text > token.enc

$ aws kms decrypt \\
    --ciphertext-blob fileb://<(base64 -d token.enc) \\
    --query Plaintext --output text | base64 -d
s3cr3t-token` } },
        { title: '동작 원리: 권한이 두 겹', body: [
          'KMS 키에는 IAM 정책과 별도로 <b>키 정책</b>이 붙습니다. "이 역할은 이 키로 <code>Encrypt</code>만, 저 역할은 <code>Decrypt</code>까지"처럼 키 단위로 나눠요. 그래서 버킷 읽기 권한을 가진 사람이라도 키의 <code>Decrypt</code> 권한이 없으면 암호화된 객체를 읽지 못합니다. 데이터 권한과 키 권한을 <b>다른 사람이 관리</b>하게 하면 한 사람의 실수로 전부 새지 않아요.',
        ] },
        { title: '기본값과 한계', list: [
          'KMS에 직접 암호화를 맡길 수 있는 데이터는 작습니다(AWS 기준 4KB). 큰 데이터는 다음 단계의 봉투 암호화를 씁니다.',
          '호출에는 요청 수 한도와 요금이 있습니다. 요청마다 KMS를 부르는 설계는 느리고 비쌉니다.',
          '키는 <b>리전 단위</b>가 기본입니다. 다른 리전으로 복사한 백업을 열려면 그 리전의 키나 다중 리전 키가 필요해요.',
          'HSM은 키를 꺼낼 수 없게 만든 하드웨어이고, 클라우드 KMS는 이를 여러 고객이 나눠 쓰는 형태입니다. 규정상 전용 장비가 필요하면 CloudHSM · Managed HSM 같은 단일 고객 HSM을 따로 씁니다.',
        ] },
      ],
      hide: ['dev', 'repo'],
      show: ['kms'],
      focus: ['kms'],
      tags: [{ on: 'kms', text: '키는 밖으로 안 나감', icon: 'lock', pos: 'bottom' }],
      flows: [{ path: ['sm', 'kms'], kind: 'ctrl' }, { path: ['kms', 'sm'], kind: 'data', delay: 1.2 }],
      changes: [['+', 'KMS: 키 보관과 사용 통제']],
    },
    // 5
    {
      key: '봉투 암호화', kind: 'concept', title: '봉투 암호화: 키를 키로 감쌉니다',
      body: [
        '10GB 파일을 KMS로 보내 암호화할 수는 없습니다. 그래서 데이터는 앱이 <b>데이터 키(DEK)</b>로 직접 암호화합니다.',
        '앱이 KMS에 DEK를 요청하면 평문 DEK와, 마스터 키 <b>KEK</b>로 감싼 DEK를 함께 받습니다. 평문 DEK로 암호화한 뒤 바로 버리고, <b>감싼 DEK를 암호문 옆에 저장</b>해요. 읽을 때는 감싼 DEK를 KMS에 보내 풀어 달라고 합니다.',
      ],
      callout: { type: 'key', text: 'KEK를 교체해도 큰 데이터는 그대로 두고 <b>DEK만 다시 감싸면</b> 됩니다. 반대로 KEK를 폐기하면 그 아래 모든 데이터를 한 번에 읽을 수 없게 됩니다.' },
      more: [
        { title: '직접 해보기', body: ['KMS가 DEK를 두 형태로 한 번에 돌려줍니다.'], code: { title: 'terminal', lang: 'sh', text: `$ aws kms generate-data-key --key-id alias/shop \\
    --key-spec AES_256
{
  "Plaintext": "q8Zt…=",       # 평문 DEK: 메모리에서만
  "CiphertextBlob": "AQIDAH…", # 감싼 DEK: 저장
  "KeyId": "arn:aws:kms:ap-northeast-2:…:key/…"
}` } },
        { title: '동작 원리', body: [
          '암호화는 평문 DEK로 AES-256-GCM 같은 대칭 알고리즘을 써서 앱 안에서 합니다. 빠르고, 데이터 크기에 제한이 없어요. 저장하는 것은 <b>암호문 + 감싼 DEK</b>뿐이라, 디스크를 통째로 훔쳐도 감싼 DEK를 풀려면 KMS의 <code>Decrypt</code> 권한이 있어야 합니다.',
          '파일마다(또는 객체마다) DEK를 따로 만들면 DEK 하나가 새도 피해가 그 파일로 끝납니다. KMS 호출이 너무 많다면 DEK를 잠깐 캐시해 여러 객체에 쓰는 방법도 있지만, 캐시 시간만큼 피해 범위가 넓어지는 교환입니다.',
        ] },
        { title: '흔한 실수', list: [
          '평문 DEK를 로그에 찍거나 파일로 저장하기. 봉투가 열린 채로 놓이는 셈입니다.',
          '모든 데이터에 DEK 하나를 영원히 쓰기. DEK도 일정량, 일정 기간마다 새로 만듭니다.',
          '직접 구현하기 전에 확인하세요. S3 · 디스크 · DB의 서버 측 암호화와 AWS Encryption SDK 같은 라이브러리가 이 과정을 이미 대신해 줍니다.',
          '감싼 DEK를 데이터와 다른 곳에 따로 저장하기. 둘이 떨어지면 키를 잃어버린 것과 같습니다. 같은 파일의 머리말이나 객체 메타데이터에 함께 두세요.',
        ] },
      ],
      hide: ['sm', 'db'],
      show: ['blob', 'dek'],
      panel: { title: '봉투 암호화의 세 가지', icon: 'key', rows: [['KEK · 마스터 키', 'KMS 안에만 있음', 'warn'], ['DEK · 데이터 키', '데이터를 암호화', 'accent'], ['저장하는 것', '암호문 + 감싼 DEK', 'ok']] },
      tags: [{ on: 'dek', text: '평문 DEK: 쓰고 버림', tone: 'warn', pos: 'right' }, { on: 'blob', text: '암호문 + 감싼 DEK', tone: 'ok' }],
      flows: [{ path: ['app', 'dek', 'kms'], kind: 'ctrl' }, { path: ['kms', 'dek', 'app'], kind: 'data', delay: 1.5 }, { path: ['app', 'blob'], kind: 'data', n: 3, delay: 3 }],
    },
    // 6
    {
      key: '키 교체', kind: 'concept', title: '키 교체: 옛 버전은 풀기만 합니다',
      body: [
        'KMS 키도 오래 쓸수록 위험이 쌓입니다. <b>자동 키 교체</b>를 켜면 KMS가 주기적으로 <b>새 키 버전</b>을 만들고, 이후의 암호화는 새 버전으로 합니다.',
        '옛 버전은 지우지 않고 남겨 둡니다. 암호문에 어느 버전으로 감쌌는지 적혀 있어서, 예전 데이터는 옛 버전으로 그대로 풀립니다. 그래서 키를 교체해도 <b>데이터를 다시 암호화할 필요가 없어요</b>.',
      ],
      callout: { type: 'warn', text: '<b>키 교체</b>와 <b>비밀 교체</b>는 다른 일입니다. 키 교체는 암호화 키를, 비밀 교체는 DB 비밀번호 같은 값을 바꿉니다. 둘 다 켜야 합니다.' },
      more: [
        { title: '동작 원리', body: [
          '앱이 쓰는 키 ID(별칭)는 바뀌지 않습니다. 안쪽의 키 재료(key material)만 버전이 늘어나요. 그래서 코드도, 키 정책도 그대로입니다. 교체가 막아 주는 것은 "한 버전의 키 재료로 너무 많은 데이터를 너무 오래 암호화하는 것"이고, 유출된 키 권한을 막아 주지는 않습니다. 권한이 샜다면 교체가 아니라 <b>키 정책과 IAM을 고쳐야</b> 합니다.',
          '옛 데이터까지 새 버전으로 바꾸고 싶다면 <b>재암호화</b>가 필요합니다. 봉투 암호화에서는 큰 데이터가 아니라 감싼 DEK만 KMS의 재암호화 API로 다시 감싸면 되니 비용이 작아요.',
        ] },
        { title: '클라우드별로', rows: [
          ['AWS KMS', '자동 교체 켜기 · 기본 1년 주기(조정 가능)', 'aws'],
          ['Azure Key Vault', '교체 정책으로 새 키 버전 생성', 'azure'],
          ['GCP Cloud KMS', '교체 주기 지정 · 새 기본 버전', 'gcp'],
          ['NCP KMS', '키 회전 지원(콘솔에서 확인)', 'ncp'],
        ] },
        { title: '실무 판단', list: [
          '대부분은 사업자의 자동 교체를 켜는 것으로 충분합니다. 규정(금융 · 공공)이 주기를 정해 두었다면 그 값에 맞춥니다.',
          '외부에서 만든 키 재료를 가져온(BYOK) 키는 자동 교체가 안 되는 경우가 있어, 교체를 직접 절차로 만들어야 합니다.',
        ] },
      ],
      hide: ['dek'],
      show: ['kv1', 'kv2', 'e_ak'],
      focus: ['kms'],
      tags: [{ on: 'kv1', text: '복호화만', tone: 'mute', pos: 'bottom' }, { on: 'kv2', text: '새 암호화', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['app', 'kms', 'kv2'], kind: 'ctrl' }, { path: ['kms', 'kv1'], kind: 'ctrl', delay: 1.2 }],
      changes: [['+', '키 버전 2 (자동 교체)'], ['~', '버전 1은 옛 데이터 복호화 전용']],
    },
    // 7
    {
      key: '저장 · 전송', kind: 'concept', title: '저장 시 암호화와 전송 중 암호화',
      body: [
        '<b>저장 시 암호화</b>(at rest)는 디스크·버킷·DB 스냅샷에 적힌 데이터를 보호합니다. 클라우드 스토리지는 방금 본 봉투 암호화를 대신 해 줘요. 디스크나 백업이 엉뚱한 곳으로 새도 키 권한이 없으면 읽지 못합니다.',
        '<b>전송 중 암호화</b>(in transit)는 네트워크를 지나는 데이터를 <b>TLS</b>로 보호합니다. 사용자와 앱 사이뿐 아니라 앱과 DB 사이, VPC 안의 서비스 사이에도 겁니다.',
      ],
      callout: { type: 'warn', text: '둘 다 켜도 <b>정당한 권한을 가진 앱이 털리면</b> 데이터는 평문으로 나갑니다. 암호화는 최소 권한을 대신하지 못해요. 함께 써야 합니다.' },
      more: [
        { title: '사업자 관리 키와 고객 관리 키', rows: [
          ['사업자 관리 키', '기본값 · 설정 없음 · 키 정책을 못 고침', 'mute'],
          ['고객 관리 키(CMK)', '키 정책 · 교체 · 비활성화를 직접', 'ok'],
          ['외부 키(BYOK · HYOK)', '키 재료를 직접 만들거나 밖에 둠 · 운영 부담 큼', 'warn'],
        ] },
        { title: '언제 고객 관리 키인가', body: [
          '저장 시 암호화는 요즘 거의 모든 스토리지에서 <b>기본으로 켜져</b> 있습니다. 차이는 키를 누가 통제하느냐예요. 사업자 관리 키는 편하지만 "이 데이터를 누가 복호화할 수 있나"를 키 정책으로 나눌 수 없고, 키 사용 기록도 덜 자세합니다. 데이터 접근을 키 단위로 통제해야 하거나, 계약 해지 때 키를 폐기해 데이터를 확실히 못 쓰게 만들어야 하거나(crypto-shredding), 규정이 요구할 때 고객 관리 키를 씁니다.',
        ] },
        { title: '직접 해보기', body: ['DB 접속이 정말 TLS인지는 클라이언트에서 확인합니다. PostgreSQL이라면 접속 옵션으로 TLS를 강제하고 서버 인증서까지 검증하게 하세요.'], code: { title: 'terminal', lang: 'sh', text: `$ psql "host=db.internal dbname=shop user=shop \\
    sslmode=verify-full sslrootcert=rds-ca.pem"
SSL connection (protocol: TLSv1.3, cipher: …)` } },
        { title: '흔한 실수', list: [
          '<code>sslmode=require</code>로 끝내기. 암호화는 되지만 서버 인증서를 검증하지 않아 중간자 공격을 막지 못합니다.',
          'VPC 안이라 안전하다며 내부 구간을 평문으로 두기. 같은 VPC의 다른 워크로드가 털리면 그대로 보입니다.',
        ] },
      ],
      hide: ['kv1', 'kv2', 'e_ak'],
      show: ['db', 'e_dk', 'e_bk'],
      set: { e_ad: { label: 'TLS', tone: 'ok' } },
      panel: { title: '무엇을 막아 주나', icon: 'shield', rows: [['전송 중 · TLS', '도청과 변조', 'info'], ['저장 시 · KMS 키', '디스크 · 백업 유출', 'accent'], ['사업자 관리 키', '기본값, 설정 없음', 'mute'], ['고객 관리 키', '권한 · 폐기를 직접 통제', 'ok']] },
      tags: [{ on: 'db', text: '디스크·스냅샷 암호화', icon: 'lock' }, { on: 'blob', text: '버킷 기본 암호화', icon: 'lock' }],
      flows: [{ path: ['app', 'db'], kind: 'req', n: 2 }, { path: ['db', 'kms'], kind: 'ctrl', delay: 1 }, { path: ['blob', 'kms'], kind: 'ctrl', delay: 1.3 }],
    },
    // 8
    {
      key: '키 삭제', kind: 'case', title: '사례: 정리하다 지운 키 하나',
      body: [
        '비용을 정리하던 엔지니어가 "이름이 낯선" KMS 키를 삭제 예약했습니다. 유예 기간이 끝난 다음 날, 그 키로 감싼 <b>DB 스냅샷과 백업 파일이 전부 열리지 않았습니다</b>. 앱 로그에는 복호화 실패만 쌓였어요.',
        '키가 사라지면 그 아래 데이터는 <b>사업자도 되살릴 수 없습니다</b>. 다행히 다른 팀이 유예 기간 중 경보를 보고 삭제를 취소해, 이번에는 장애로 끝났습니다.',
      ],
      callout: { type: 'warn', text: '키 삭제는 데이터 삭제입니다. 키에는 <code>owner</code> 태그와 용도를 적고, 삭제 대신 먼저 <b>비활성화</b>해서 무엇이 깨지는지 확인하세요.' },
      more: [
        { title: '증상과 원인', rows: [
          ['증상', '복호화 실패 · 접근 거부 · 스냅샷 복원 실패', 'bad'],
          ['원인', '키 비활성화 또는 삭제 예약 상태', 'warn'],
          ['확인', '감사 로그의 ScheduleKeyDeletion · DisableKey', 'info'],
          ['해결', '유예 기간 안이면 삭제 취소 → 다시 활성화', 'ok'],
        ] },
        { title: '직접 해보기', body: ['AWS KMS는 삭제 요청 뒤 7–30일 유예 기간을 둡니다. 그 사이에는 되돌릴 수 있어요.'], code: { title: 'terminal', lang: 'sh', text: `$ aws kms describe-key --key-id 1234abcd-… \\
    --query 'KeyMetadata.[KeyState,DeletionDate]'
["PendingDeletion", "2026-12-02T00:00:00Z"]

$ aws kms cancel-key-deletion --key-id 1234abcd-…
$ aws kms enable-key --key-id 1234abcd-…` } },
        { title: '막는 설정', list: [
          '키 삭제 · 비활성화 API 호출에 <b>즉시 경보</b>를 겁니다. 감사 로그를 이벤트 규칙으로 걸러 당직 채널로 보내세요.',
          '키 삭제 권한은 일반 운영 역할에서 빼고, 별도 승인 절차가 있는 역할에만 줍니다.',
          'Azure Key Vault는 <b>소프트 삭제와 퍼지 보호</b>, GCP Cloud KMS는 키 버전 파기 예약 기간으로 같은 안전장치를 둡니다. 운영 키에서는 켜 두세요.',
          '백업용 키는 운영 키와 <b>다른 계정</b>에 두면, 운영 계정이 털리거나 실수해도 백업은 열립니다(백업과 재해 복구 레슨에서 이어집니다).',
          '"쓰지 않는 키 같다"면 감사 로그에서 최근 <code>Decrypt</code> 호출이 있었는지 먼저 봅니다. 몇 달에 한 번 쓰는 백업 복원용 키는 평소에 조용해요.',
        ] },
      ],
      set: { kms: { state: 'down', badge: '삭제 예약', tone: 'bad' }, e_ad: { label: null, tone: null } },
      focus: ['kms'],
      tags: [{ on: 'blob', text: '복호화 실패', tone: 'bad' }, { on: 'db', text: '스냅샷 복원 실패', tone: 'bad' }],
      flows: [{ path: ['db', 'kms'], kind: 'bad' }, { path: ['blob', 'kms'], kind: 'bad', delay: 0.4 }, { path: ['app', 'blob'], kind: 'bad', delay: 1 }],
      changes: [['-', 'KMS 키 삭제 예약'], ['-', '그 키로 감싼 백업 전부'], ['~', '유예 기간 중 취소로 복구']],
    },
    // 9
    {
      key: '자동 교체', kind: 'solution', title: '비밀번호는 사람 대신 자동으로 바꿉니다',
      body: [
        '오래된 비밀번호일수록 거쳐 간 사람과 시스템이 많습니다. <b>자동 교체(rotation)</b>는 시크릿 저장소가 정해진 주기마다 새 비밀번호를 만들어 DB의 비밀번호와 저장소의 값을 함께 바꾸는 기능입니다.',
        '앱은 접속할 때 저장소에서 최신 값을 받으므로 따로 배포할 일이 없습니다. 혹시 유출돼도 다음 교체 때 쓸모없어지니 <b>피해 기간에 상한</b>이 생겨요.',
      ],
      callout: { type: 'warn', text: '흔한 장애: 앱이 시작할 때 읽은 비밀번호를 <b>계속 쥐고 있다가</b> 교체 뒤 접속에 실패합니다. 인증에 실패하면 다시 읽어 오게 하세요.' },
      more: [
        { title: '동작 원리: 네 단계', list: [
          '<b>createSecret</b>: 새 비밀번호를 만들어 저장소에 <code>AWSPENDING</code> 버전으로 넣습니다.',
          '<b>setSecret</b>: DB에 접속해 실제 계정의 비밀번호를 새 값으로 바꿉니다.',
          '<b>testSecret</b>: 새 값으로 접속해 봅니다. 실패하면 여기서 멈춰요.',
          '<b>finishSecret</b>: <code>AWSCURRENT</code> 꼬리표를 새 버전으로 옮깁니다. 이 순간부터 앱이 새 값을 받습니다.',
        ] },
        { title: '틈을 없애는 두 가지 방법', body: [
          '<b>단일 사용자</b> 방식은 계정 하나의 비밀번호를 바꿉니다. setSecret과 finishSecret 사이, 그리고 앱이 새 값을 읽기 전까지 옛 비밀번호로 새 연결을 맺으면 실패합니다. 짧지만 틈이 있어요.',
          '<b>교대 사용자</b> 방식은 <code>shop_a</code>, <code>shop_b</code> 두 계정을 번갈아 바꿉니다. 지금 쓰는 계정은 건드리지 않고 쉬고 있는 계정의 비밀번호를 바꾼 뒤 저장소가 그쪽을 가리키게 하므로, 옛 값으로 맺은 연결도 다음 교체 때까지 유효합니다.',
        ] },
        { title: '흔한 실수', list: [
          '교체 함수가 DB에 닿지 못하는 네트워크에 있어 매번 실패하는데 아무도 모르는 것. 교체 실패에도 알림을 거세요.',
          '커넥션 풀이 오래 산 연결을 재사용하다가 교체 직후가 아니라 <b>며칠 뒤</b> 재연결할 때 실패하는 것. 재연결 시 다시 읽게 해야 합니다.',
        ] },
      ],
      hide: ['blob', 'kms'],
      show: ['sm', 'e_sd'],
      set: { kms: { state: null, badge: null } },
      focus: ['sm'],
      tags: [{ on: 'sm', text: '30일마다 새 비밀번호', icon: 'refresh', pos: 'right' }, { on: 'db', text: 'v7 → v8' }],
      flows: [{ path: ['sm', 'db'], kind: 'ctrl' }, { path: ['app', 'sm'], kind: 'ctrl', delay: 1.4 }, { path: ['sm', 'app'], kind: 'data', delay: 2.4 }, { path: ['app', 'db'], kind: 'req', n: 2, delay: 3.4 }],
      metrics: { life: ['30일', 'warn'] },
      changes: [['+', '자동 교체 일정'], ['~', '비밀 수명: 무기한 → 30일']],
    },
    // 10
    {
      key: '비밀 없는 접근', kind: 'solution', title: '워크로드 아이덴티티: 비밀 없이 접근',
      body: [
        '문제가 하나 남았습니다. 저장소에서 비밀을 꺼내려면 앱이 자기를 증명해야 하는데, 그 증명용 액세스 키는 또 어디에 둘까요? 이것을 <b>"secret zero" 문제</b>라고 합니다.',
        '<b>워크로드 아이덴티티</b>는 플랫폼이 "이 Pod는 주문 API가 맞다"고 보증하고, 클라우드 IAM이 그 보증을 <b>수명이 짧은 토큰</b>으로 바꿔 주는 방식입니다. 앱에 넣어 둘 장기 키가 아예 없으니 유출될 것도 없습니다.',
      ],
      callout: { type: 'cloud', text: 'AWS는 <b>IAM 역할</b>(EKS Pod Identity · IRSA), Azure는 <b>관리 ID</b>, GCP는 <b>Workload Identity</b>라고 부릅니다. CI도 같은 원리(OIDC)로 장기 키 없이 배포할 수 있어요.' },
      more: [
        { title: '동작 원리', body: [
          '쿠버네티스는 Pod마다 서비스 어카운트의 <b>서명된 토큰</b>(OIDC 형식의 JWT)을 파일로 넣어 줍니다. 토큰 안에는 "<code>system:serviceaccount:shop:order-api</code>"라는 신원과 짧은 만료 시간이 들어 있어요. SDK는 이 토큰을 클라우드의 토큰 교환 API(AWS STS 등)에 내밀고, 클라우드는 클러스터의 공개 키로 서명을 검증한 뒤 연결된 역할의 <b>임시 자격 증명</b>을 돌려줍니다. 만료 전에 SDK가 알아서 다시 받아요.',
        ] },
        { title: '설정 예시: EKS(IRSA)', code: { title: 'serviceaccount.yaml', lang: 'yaml', text: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-api
  namespace: shop
  annotations:
    eks.amazonaws.com/role-arn: >-
      arn:aws:iam::111122223333:role/order-api` } },
        { title: '신뢰 정책에서 꼭 볼 것', list: [
          '역할의 신뢰 정책 조건에 <b>정확한 서비스 어카운트</b>(<code>sub</code>)를 적습니다. 빠뜨리면 그 클러스터의 아무 Pod나 역할을 가져갑니다.',
          'GKE는 서비스 어카운트에 <code>iam.gke.io/gcp-service-account</code> 주석을, Azure는 <code>azure.workload.identity/client-id</code> 주석과 Pod 레이블을 씁니다. 모양은 달라도 "쿠버네티스 신원 ↔ 클라우드 신원" 연결이라는 점은 같아요.',
          'GitHub Actions 같은 CI도 OIDC 토큰으로 역할을 맡게 하면 저장소 시크릿에 액세스 키를 넣을 필요가 없습니다. 이때도 조건에 저장소와 브랜치를 꼭 묶으세요.',
        ] },
      ],
      show: ['idp'],
      focus: ['idp'],
      tags: [{ on: 'app', text: '저장된 키 없음', tone: 'ok' }, { on: 'idp', text: '1시간짜리 토큰 발급', icon: 'clock', pos: 'left' }],
      flows: [{ path: ['app', 'idp'], kind: 'ctrl' }, { path: ['idp', 'app'], kind: 'data', delay: 1.2 }, { path: ['app', 'sm'], kind: 'ctrl', delay: 2.4 }, { path: ['sm', 'app'], kind: 'data', delay: 3.4 }],
      metrics: { life: ['토큰 1시간', 'ok'], where: ['앱에는 없음', 'ok'] },
      changes: [['-', '앱이 쥐고 있던 장기 액세스 키'], ['+', '신원 보증 → 단기 토큰']],
    },
    // 11
    {
      key: '동적 시크릿', kind: 'solution', title: '동적 시크릿: 요청할 때 만드는 계정',
      body: [
        '자동 교체를 해도 비밀번호는 30일 동안 같고, 여러 Pod가 <b>같은 계정</b>을 씁니다. <b>동적 시크릿</b>은 앱이 요청할 때마다 Vault가 DB에 <b>새 계정을 만들어</b> 건네고, 정해진 시간(lease)이 지나면 그 계정을 지웁니다.',
        '앱은 워크로드 아이덴티티로 Vault에 로그인합니다. 계정이 Pod마다 다르니 DB 로그만 보고도 <b>어느 Pod가</b> 그 질의를 했는지 알 수 있어요.',
      ],
      callout: { type: 'tip', text: 'lease가 끝나기 전에 앱(또는 Vault Agent)이 갱신하고, Pod가 사라지면 갱신이 멈춰 계정도 저절로 사라집니다. 유출돼도 길어야 몇 시간입니다.' },
      more: [
        { title: '설정 예시', body: ['Vault에 "이 역할로 요청하면 이런 SQL로 계정을 만들어라"를 등록합니다. 계정 이름과 비밀번호, 만료 시각은 Vault가 채웁니다.'], code: { title: 'terminal', lang: 'sh', text: `$ vault write database/roles/shop-ro \\
    db_name=shopdb default_ttl=1h max_ttl=24h \\
    creation_statements="CREATE ROLE \\"{{name}}\\" \\
      WITH LOGIN PASSWORD '{{password}}' \\
      VALID UNTIL '{{expiration}}';
      GRANT SELECT ON ALL TABLES IN SCHEMA public
      TO \\"{{name}}\\";"

$ vault write auth/kubernetes/role/order-api \\
    bound_service_account_names=order-api \\
    bound_service_account_namespaces=shop \\
    policies=shop-ro ttl=1h` } },
        { title: '출력 읽기', body: [
          '오른쪽 출력의 <code>username</code>은 요청마다 다르고, <code>lease_duration</code>이 지나면 Vault가 DB에서 그 계정을 지웁니다. <code>lease_id</code>로 언제든 즉시 회수(<code>vault lease revoke</code>)할 수 있어서, 사고가 나면 그 Pod의 계정만 골라 끊을 수 있어요. <code>max_ttl</code>을 넘으면 갱신이 안 되고 새로 받아야 합니다.',
        ] },
        { title: '흔한 실수', list: [
          'Vault가 DB에 계정을 만들 관리자 계정을 쓰는데, 그 관리자 비밀번호를 사람이 알고 있는 것. Vault가 스스로 교체하게(<code>rotate-root</code>) 합니다.',
          'TTL을 너무 짧게 잡아 Vault가 잠깐만 멈춰도 모든 앱이 DB에 못 붙는 것. Vault가 <b>가장 중요한 의존성</b>이 되므로 고가용성으로 운영해야 합니다.',
          'DB의 최대 연결 · 계정 수를 생각하지 않고 Pod 수백 개가 계정을 하나씩 받는 것.',
          '앱 코드에 Vault 호출을 직접 넣기 전에, Vault Agent나 CSI 드라이버가 파일로 비밀을 넣고 갱신까지 맡게 하는 방법을 먼저 검토하세요. 앱은 파일만 다시 읽으면 됩니다.',
        ] },
      ],
      hide: ['sm', 'idp', 'e_sd'],
      show: ['vault'],
      set: { vault: { at: [6.4, 2.8] } },
      focus: ['vault'],
      code: {
        title: 'terminal', lang: 'sh', hl: [5, 6, 8],
        text: `$ vault read database/creds/shop-ro
Key              Value
---              -----
lease_id         …/creds/shop-ro/2f6a…
lease_duration   1h
lease_renewable  true
password         A1a-8kQz…
username         v-k8s-shop-ro-x7Gh…`,
      },
      tags: [{ on: 'db', text: '1시간짜리 계정', tone: 'ok' }],
      flows: [{ path: ['app', 'vault'], kind: 'ctrl' }, { path: ['vault', 'db'], kind: 'ctrl', delay: 1 }, { path: ['vault', 'app'], kind: 'data', delay: 2 }, { path: ['app', 'db'], kind: 'req', n: 2, delay: 3 }],
      metrics: { life: ['계정 1시간', 'ok'], who: ['그 Pod만', 'ok'] },
      changes: [['+', 'Vault 동적 시크릿'], ['~', '공유 계정 → Pod마다 다른 계정'], ['~', '수명 30일 → 1시간']],
    },
    // 12
    {
      key: '감사 로그', kind: 'concept', title: '누가 언제 꺼냈나: 감사 로그와 탐지',
      body: [
        'KMS와 시크릿 저장소의 장점은 <b>모든 사용이 API 호출</b>이라는 점입니다. <code>GetSecretValue</code>, <code>Decrypt</code> 한 번 한 번이 누가 · 언제 · 어디서 했는지와 함께 감사 로그에 남아요.',
        '기록은 보는 사람이 있어야 의미가 있습니다. 평소와 다른 신원이 비밀을 꺼내거나, 짧은 시간에 수많은 비밀을 읽거나, 키 정책이 바뀌면 <b>알림</b>이 가게 규칙을 겁니다.',
      ],
      callout: { type: 'key', text: '감사 로그는 공격자가 가장 먼저 지우고 싶어 하는 것입니다. <b>별도 계정의 삭제 잠금 버킷</b>으로 보내 두세요.' },
      more: [
        { title: '출력 읽기', body: ['AWS CloudTrail의 한 줄을 줄이면 이런 모양입니다. 사람이 아니라 역할(Pod의 신원)이 호출했고, 어떤 비밀이었는지가 보입니다.'], code: { title: 'CloudTrail 이벤트 (요약)', lang: 'json', text: `{
  "eventTime": "2026-11-18T02:14:07Z",
  "eventSource": "secretsmanager.amazonaws.com",
  "eventName": "GetSecretValue",
  "userIdentity": {
    "arn": "arn:aws:sts::…:assumed-role/order-api/…"
  },
  "sourceIPAddress": "10.0.12.34",
  "requestParameters": { "secretId": "prod/shop/db" }
}` } },
        { title: '알림을 걸 만한 것', list: [
          '키 삭제 예약 · 비활성화, 키 정책 변경, 시크릿 삭제.',
          '평소 그 비밀을 읽지 않던 신원의 접근, 특히 <b>사람 사용자</b>가 운영 비밀을 직접 읽는 것.',
          '한 신원이 짧은 시간에 여러 비밀을 차례로 읽는 것(목록을 훑는 공격의 전형).',
          '회사 네트워크나 VPC가 아닌 곳에서 오는 호출.',
          '알림이 너무 많으면 이것도 무시됩니다. 처음에는 키 삭제 · 정책 변경처럼 드물고 확실히 위험한 이벤트부터 걸고, 접근 패턴 기반 탐지는 사업자의 위협 탐지 서비스에 맡기는 편이 현실적입니다.',
        ] },
        { title: '클라우드별로', rows: [
          ['AWS', 'CloudTrail · GuardDuty가 이상 사용 탐지', 'aws'],
          ['Azure', 'Key Vault 진단 로그 → Log Analytics', 'azure'],
          ['GCP', 'Cloud Audit Logs (데이터 접근 로그는 켜야 함)', 'gcp'],
          ['NCP', '계정 활동 기록 서비스로 API 호출 추적', 'ncp'],
        ] },
      ],
      hide: ['vault', 'e_av', 'e_vd'],
      show: ['sm', 'kms', 'trail'],
      focus: ['trail'],
      tags: [{ on: 'trail', text: '누가 · 언제 · 무엇을', icon: 'eye', pos: 'right' }],
      flows: [{ path: ['app', 'sm'], kind: 'ctrl' }, { path: ['sm', 'trail'], kind: 'data', delay: 1 }, { path: ['sm', 'kms'], kind: 'ctrl', delay: 1.2 }, { path: ['kms', 'trail'], kind: 'data', delay: 2 }],
      metrics: { audit: ['기록 + 알림', 'ok'] },
      changes: [['+', '감사 로그를 별도 계정으로'], ['+', '이상 접근 알림']],
    },
    // 13
    {
      key: '4대 클라우드', kind: 'compare', title: '클라우드별 이름, 그리고 Vault',
      body: [
        '네 클라우드 모두 KMS와 시크릿 저장소가 있습니다. Azure는 키·시크릿·인증서를 <b>Key Vault</b> 하나에 담고, 나머지는 키 관리와 시크릿 저장을 다른 서비스로 나눕니다. 자기 클라우드의 IAM, 관리형 DB와 가장 매끄럽게 붙는 것이 장점이에요.',
        '<b>HashiCorp Vault</b>는 어느 클라우드에도 속하지 않는 선택지입니다. 한 가지 API와 정책으로 여러 클라우드의 비밀을 다루고, 앞에서 본 <b>동적 시크릿</b>이 강점입니다.',
      ],
      callout: { type: 'warn', text: 'Vault는 <b>직접 운영해야 하는 시스템</b>입니다. 고가용성, 백업, 봉인 해제(unseal)를 책임질 팀이 없다면 클라우드 기본 서비스로 시작하는 편이 안전해요.' },
      more: [
        { title: '클라우드별로', rows: [
          ['AWS', 'KMS · Secrets Manager · Parameter Store', 'aws'],
          ['Azure', 'Key Vault (키 · 시크릿 · 인증서) · Managed HSM', 'azure'],
          ['GCP', 'Cloud KMS · Secret Manager · Cloud HSM', 'gcp'],
          ['NCP', 'Key Management Service · Secret Manager', 'ncp'],
        ] },
        { title: '고르는 기준', list: [
          '<b>한 클라우드 중심</b>이면 기본 서비스가 가장 쌉니다. 관리형 DB의 자동 교체, 스토리지 암호화 연동이 클릭 몇 번이에요.',
          '<b>여러 클라우드 · 온프레미스</b>에 같은 앱이 돌고 정책을 한 벌로 관리하고 싶다면 Vault가 맞습니다. 대신 Vault 자체의 가용성이 모든 앱의 가용성이 됩니다.',
          '절충안으로 비밀은 각 클라우드 저장소에 두고, 쿠버네티스에서는 External Secrets Operator 하나로 여러 저장소를 같은 방식으로 읽는 구성이 흔합니다.',
        ] },
        { title: '봉인(seal)이란', body: [
          'Vault는 저장한 데이터를 자기 마스터 키로 암호화해 두고, 시작할 때는 그 키를 모르는 <b>봉인된</b> 상태로 뜹니다. 예전에는 관리자 여러 명이 키 조각을 입력해 봉인을 풀었지만, 요즘은 클라우드 KMS로 마스터 키를 감싸 두고 시작할 때 자동으로 푸는 <b>auto-unseal</b>을 많이 씁니다. 여기서도 결국 봉투 암호화가 바닥에 있어요.',
        ] },
      ],
      hide: ['app', 'db', 'sm', 'kms', 'trail'],
      show: ['vault', 'aws', 'azure', 'gcp', 'ncp'],
      set: { vault: { at: [3.9, 2.1] } },
      panel: { title: '키 관리와 시크릿 저장', icon: 'cloud', rows: [['AWS', 'Secrets Manager · KMS', 'aws'], ['Azure', 'Key Vault', 'azure'], ['GCP', 'Secret Manager · Cloud KMS', 'gcp'], ['NCP', 'Secret Manager · KMS', 'ncp']] },
      focus: ['vault'],
      tags: [{ on: 'vault', text: 'API 하나 · 동적 시크릿' }],
      flows: [{ path: ['vault', 'aws'], kind: 'ctrl' }, { path: ['vault', 'azure'], kind: 'ctrl', delay: 0.2 }, { path: ['vault', 'gcp'], kind: 'ctrl', delay: 0.4 }, { path: ['vault', 'ncp'], kind: 'ctrl', delay: 0.6 }],
    },
    // 14
    {
      key: '정리', kind: 'recap', title: '정리: 비밀은 적게, 짧게, 기록되게',
      body: [
        '비밀은 코드·이미지·Git이 아니라 <b>시크릿 저장소</b>에 두고, 데이터는 <b>KMS의 키로 감싼 데이터 키</b>로 암호화합니다. 키는 교체하되 함부로 지우지 않고, 진짜 방어선은 누가 그 키를 쓸 수 있느냐입니다.',
        '비밀은 <b>자동 교체 · 동적 시크릿</b>으로 수명을 줄이고, <b>워크로드 아이덴티티</b>로 아예 없애고, 모든 사용을 <b>감사 로그</b>로 지켜봅니다. 다음 레슨에서는 이렇게 만든 인프라의 청구서를 읽고 줄이는 법을 봅니다.',
      ],
      hide: ['vault', 'aws', 'azure', 'gcp', 'ncp'],
      show: ['app', 'db', 'sm', 'kms', 'idp'],
      tags: [{ on: 'idp', text: '신원 → 단기 토큰', pos: 'left' }, { on: 'kms', text: '키는 KMS 안에만', pos: 'bottom' }],
      flows: [{ path: ['app', 'idp'], kind: 'ctrl' }, { path: ['app', 'sm'], kind: 'ctrl', delay: 1 }, { path: ['sm', 'kms'], kind: 'ctrl', delay: 1.8 }, { path: ['app', 'db'], kind: 'req', n: 2, delay: 2.8 }],
    },
  ],
  quiz: [
    {
      q: '액세스 키가 담긴 커밋을 실수로 공개 저장소에 push했습니다. 가장 먼저 할 일은?',
      options: ['커밋을 지우고 force push 한다', '저장소를 비공개로 바꾼다', '그 키를 즉시 폐기하고 새로 발급한다', '키가 실제로 쓰였는지 며칠 지켜본다'],
      answer: 2, step: 2,
      why: '공개된 순간 이미 복사됐다고 봐야 합니다. 커밋 삭제나 비공개 전환은 이미 가져간 키를 무효로 만들지 못하고, 지켜보는 동안 피해는 커집니다. 폐기 후에 감사 로그로 피해 범위를 보고, 히스토리 정리는 마지막에 합니다.',
    },
    {
      q: '키를 폐기한 뒤 감사 로그를 보니, 유출된 키로 새 IAM 사용자와 액세스 키가 하나 만들어져 있었습니다. 다음으로 할 일은?',
      options: ['새로 만들어진 사용자와 키도 지우고, 그 신원으로 한 일까지 추적한다', '원래 키를 폐기했으니 더 할 일은 없다', '새 사용자는 업무용일 수 있으니 그대로 둔다', '저장소 히스토리부터 정리한다'],
      answer: 0, step: 2,
      why: '공격자는 원래 키가 막힐 것에 대비해 자기용 신원을 만들어 둡니다. 원래 키만 폐기하면 그 뒷문으로 계속 들어옵니다. 히스토리 정리는 이미 복사된 키 문제를 풀지 못하므로 마지막 순서입니다.',
    },
    {
      q: '100GB 백업 파일을 암호화해 오브젝트 스토리지에 저장하려 합니다. 올바른 방법은?',
      options: ['파일 전체를 KMS의 암호화 API로 보낸다', 'DEK로 암호화하고 평문 DEK를 파일 옆에 저장한다', '데이터 키(DEK)로 직접 암호화하고, KMS 키로 감싼 DEK를 파일과 함께 저장한다', 'KMS에서 마스터 키를 내려받아 그 키로 암호화한다'],
      answer: 2, step: 5,
      why: '이것이 봉투 암호화입니다. KMS는 큰 데이터를 받지 않고 마스터 키를 밖으로 내주지도 않습니다. 평문 DEK를 옆에 두면 파일을 가진 사람이 곧바로 풀 수 있으니 암호화한 의미가 없습니다.',
    },
    {
      q: 'KMS 키의 자동 교체를 켜려 하자, 한 팀원이 "교체하면 지난 3년 치 암호화된 데이터를 다 다시 암호화해야 한다"며 반대합니다. 맞는 설명은?',
      options: ['맞다. 교체 즉시 옛 데이터는 읽을 수 없게 된다', '틀리다. 옛 키 버전이 남아 있어 옛 데이터는 그대로 복호화되고, 새 암호화만 새 버전을 쓴다', '맞다. 그래서 키 교체는 하지 않는 것이 업계 관행이다', '틀리다. 교체해도 키 재료는 그대로이고 이름만 바뀐다'],
      answer: 1, step: 6,
      why: 'KMS는 교체 후에도 옛 키 버전을 보관하고, 암호문에 적힌 버전으로 복호화합니다. 재암호화는 원할 때만 하며, 봉투 암호화라면 감싼 DEK만 다시 감싸면 됩니다. 교체는 실제로 새 키 재료를 만든다는 점에서 마지막 보기도 틀렸습니다.',
    },
    {
      q: '고객사와의 계약이 끝나면 그 고객의 데이터를 확실히 쓸 수 없게 만들어야 합니다. 데이터는 여러 버킷과 백업에 흩어져 있습니다. 가장 알맞은 설계는?',
      options: ['모든 데이터를 사업자 관리 키로 암호화한다', '계약이 끝나면 버킷을 하나씩 찾아 지운다', '데이터를 암호화하지 않고 접근 권한만 회수한다', '고객별 고객 관리 키(CMK)로 암호화해 두고, 계약 종료 때 그 키를 폐기한다'],
      answer: 3, step: 7,
      why: '고객별 키로 감싸 두면 키를 폐기하는 것만으로 흩어진 모든 사본이 읽을 수 없게 됩니다(crypto-shredding). 사업자 관리 키는 고객별로 나눠 폐기할 수 없고, 버킷을 찾아 지우는 방식은 백업이나 잊힌 사본을 놓치기 쉽습니다.',
    },
    {
      q: '어느 아침부터 DB 스냅샷 복원과 오래된 백업 파일 읽기가 모두 "접근 거부 / 키 상태 오류"로 실패합니다. 앱 코드는 바뀌지 않았습니다. 먼저 확인할 것은?',
      options: ['그 데이터를 감싼 KMS 키의 상태(비활성화 · 삭제 예약)와 감사 로그의 키 관련 호출', 'DB 엔진 버전', '스토리지 용량', '앱 서버의 CPU'],
      answer: 0, step: 8,
      why: '서로 다른 데이터가 한꺼번에 복호화에 실패한다면 공통점인 키를 의심합니다. 키가 비활성화됐거나 삭제 예약 상태라면 유예 기간 안에 취소하고 다시 켤 수 있습니다. 유예 기간이 지나 키가 삭제되면 사업자도 되살릴 수 없습니다.',
    },
    {
      q: 'DB 비밀번호 자동 교체를 켠 뒤로, 교체 직후 몇 분씩 일부 Pod가 DB 인증 실패를 냅니다. 가장 알맞은 개선은?',
      options: ['자동 교체를 끈다', '교체 주기를 1년으로 늘린다', '앱이 인증 실패 시 저장소에서 다시 읽게 하고, 두 계정을 번갈아 바꾸는 교대 사용자 방식으로 바꾼다', '비밀번호를 다시 환경 변수에 고정한다'],
      answer: 2, step: 9,
      why: '시작할 때 읽은 값을 계속 쥐고 있으면 교체 뒤 새 연결에서 실패합니다. 실패 시 다시 읽게 하고, 교대 사용자 방식으로 옛 값이 다음 교체까지 유효하게 하면 틈이 사라집니다. 교체를 끄거나 늦추는 것은 수명을 다시 늘리는 후퇴입니다.',
    },
    {
      q: 'EKS의 Pod가 Secrets Manager에서 DB 비밀번호를 읽어야 합니다. 가장 좋은 인증 방법은?',
      options: ['액세스 키를 Kubernetes Secret에 넣어 Pod에 주입한다', 'Pod의 서비스 어카운트에 IAM 역할을 연결해 단기 토큰을 받게 한다', '액세스 키를 이미지의 ENV에 넣는다', '노드에 넓은 권한의 역할을 주고 모든 Pod가 함께 쓰게 한다'],
      answer: 1, step: 10,
      why: '워크로드 아이덴티티는 저장해 둘 장기 키 자체를 없앱니다. 액세스 키를 Secret이나 ENV에 넣으면 "비밀을 꺼내기 위한 비밀"을 다시 만들고, 노드 역할을 공유하면 그 노드의 모든 Pod가 같은 권한을 갖게 되어 최소 권한이 깨집니다.',
    },
    {
      q: 'IRSA로 역할을 연결했는데, 보안 점검에서 "같은 클러스터의 아무 Pod나 이 역할을 맡을 수 있다"는 지적이 나왔습니다. 원인으로 가장 그럴듯한 것은?',
      options: ['역할의 신뢰 정책에 서비스 어카운트(sub) 조건이 없다', 'Pod에 CPU limits가 없다', '시크릿 저장소에 자동 교체가 꺼져 있다', '역할 이름이 너무 짧다'],
      answer: 0, step: 10,
      why: '신뢰 정책이 클러스터의 OIDC 공급자만 믿고 특정 namespace와 서비스 어카운트를 조건으로 묶지 않으면, 그 클러스터가 서명한 어떤 토큰으로도 역할을 맡을 수 있습니다. sub 조건에 system:serviceaccount:shop:order-api처럼 정확히 적어야 합니다.',
    },
    {
      q: 'DB에 이상한 대량 조회가 찍혔는데, 모든 Pod가 같은 shop 계정을 써서 어느 Pod인지 알 수 없습니다. 이런 일을 막는 데 가장 맞는 방식은?',
      options: ['shop 계정의 비밀번호를 더 길게 만든다', 'DB를 다른 VPC로 옮긴다', '조회 로그를 끈다', 'Vault 동적 시크릿으로 Pod마다 수명이 짧은 개별 계정을 받게 한다'],
      answer: 3, step: 11,
      why: '동적 시크릿은 요청마다 새 계정을 만들므로 DB 로그의 계정 이름이 곧 어느 Pod인지를 알려 주고, 문제의 lease만 골라 즉시 회수할 수 있습니다. 비밀번호 길이나 네트워크 위치는 누가 했는지를 구분해 주지 못합니다.',
    },
    {
      q: '한 사람 사용자 계정이 새벽에 운영 비밀 30개를 1분 안에 차례로 읽었다는 기록이 감사 로그에 있습니다. 이것을 발견하려면 무엇이 준비돼 있어야 할까요?',
      options: ['시크릿 저장소의 자동 교체', '감사 로그를 모으고, 사람 신원의 운영 비밀 접근과 짧은 시간의 대량 조회에 알림 규칙을 걸어 두기', 'KMS 키의 자동 교체', '모든 비밀을 하나의 JSON으로 합치기'],
      answer: 1, step: 12,
      why: '기록이 있어도 아무도 보지 않으면 소용이 없습니다. 평소와 다른 신원, 대량 조회 같은 패턴에 알림을 걸어야 공격이 진행되는 중에 알 수 있습니다. 교체는 피해 기간을 줄일 뿐 탐지는 해 주지 않습니다.',
    },
    {
      q: '팀원 두 명이 AWS 한 곳에서만 서비스를 운영합니다. 시크릿 관리 도구로 가장 현실적인 선택은?',
      options: ['Vault 클러스터를 직접 구축해 운영한다', '비밀을 Git에 암호화 없이 두되 비공개 저장소로 한다', 'AWS의 Secrets Manager와 KMS를 쓰고, Pod는 워크로드 아이덴티티로 접근한다', '비밀번호를 팀 메신저에 고정해 둔다'],
      answer: 2, step: 13,
      why: '한 클라우드 중심이면 기본 서비스가 IAM, 관리형 DB의 자동 교체와 가장 매끄럽게 붙고 운영 부담이 없습니다. Vault는 강력하지만 고가용성 · 백업 · 봉인 해제를 책임질 사람이 필요해 두 명 팀에는 과합니다.',
    },
  ],
};
