export default {
  id: 'config-secret',
  learn: [
    '설정을 이미지에서 떼어 내야 하는 이유',
    'ConfigMap을 환경 변수와 파일로 주입하기',
    '설정을 바꿔도 Pod가 그대로인 까닭',
    'Secret의 base64는 암호화가 아니다',
    '저장 시 암호화 · RBAC · 외부 시크릿 저장소',
  ],
  legend: [['build', '이미지 · 파일'], ['data', '설정 · 비밀값'], ['ctrl', 'API 호출'], ['bad', '유출']],
  metrics: [
    { id: 'img', label: '이미지', icon: 'package' },
    { id: 'chg', label: '설정을 바꾸려면', icon: 'sliders' },
    { id: 'sec', label: '비밀값 위치', icon: 'key' },
  ],
  scene: {
    nodes: {
      img_d: { at: [0.6, -1.3], label: 'api:dev', sub: '설정 내장', icon: 'package', color: 'blue' },
      img_p: { at: [0.6, 1.3], label: 'api:prod', sub: '설정 내장', icon: 'package', color: 'blue' },
      img: { at: [0.6, 0], label: 'api:1.4', sub: '이미지 하나', icon: 'package', color: 'blue' },
      pod_d: { at: [3.2, -1.3], label: 'Pod', sub: 'dev', icon: 'box', color: 'teal' },
      pod_p: { at: [3.2, 1.3], label: 'Pod', sub: 'prod', icon: 'box', color: 'teal' },
      pod_n: { at: [3.2, -1.3], label: 'Pod', sub: '새로 뜬 것', icon: 'box', color: 'teal' },
      cm_d: { kind: 'tile', at: [5.6, -1.3], label: 'ConfigMap (dev)', icon: 'sliders', color: 'yellow' },
      cm_p: { kind: 'tile', at: [5.6, 1.3], label: 'ConfigMap (prod)', icon: 'sliders', color: 'yellow' },
      sec: { kind: 'tile', at: [3.2, 3.7], label: 'Secret', icon: 'key', color: 'orange' },

      dev: { kind: 'client', at: [0.4, 2.6], label: '개발자' },
      yaml: { kind: 'tile', at: [2.2, 0.8], label: 'secret.yaml', icon: 'file-key', color: 'orange' },
      git: { kind: 'cyl', at: [4, -1], label: 'Git 저장소', icon: 'git', color: 'slate' },
      out: { kind: 'users', at: [5.8, -2.8], label: '저장소를 읽는 모두' },

      api: { at: [2.2, 0.8], label: 'API 서버', icon: 'server-cog', color: 'slate' },
      etcd: { kind: 'cyl', at: [2.2, -1.8], label: 'etcd', icon: 'database', color: 'purple' },
      kms: { at: [4.8, 0.8], size: 's', label: 'KMS', sub: '암호화 키', icon: 'key-round', color: 'orange' },

      store: { kind: 'cyl', at: [-1.4, -0.5], label: '시크릿 저장소', icon: 'lock', color: 'navy' },
      eso: { at: [0.6, 3.7], label: 'External\nSecrets', sub: 'Operator', icon: 'refresh', color: 'purple' },
    },
    edges: {
      e_id: { from: 'img_d', to: 'pod_d' },
      e_ip: { from: 'img_p', to: 'pod_p' },
      e_i_d: { from: 'img', to: 'pod_d' },
      e_i_p: { from: 'img', to: 'pod_p' },
      e_cd: { from: 'cm_d', to: 'pod_d' },
      e_cp: { from: 'cm_p', to: 'pod_p' },
      e_cn: { from: 'cm_p', to: 'pod_n' },
      e_sp: { from: 'sec', to: 'pod_p' },
      e_dy: { from: 'dev', to: 'yaml' },
      e_yg: { from: 'yaml', to: 'git' },
      e_go: { from: 'git', to: 'out', tone: 'bad' },
      e_da: { from: 'dev', to: 'api' },
      e_ae: { from: 'api', to: 'etcd' },
      e_ak: { from: 'api', to: 'kms', style: 'dashed', bi: true },
      e_se: { from: 'store', to: 'eso' },
      e_es: { from: 'eso', to: 'sec' },
      e_csi: { from: 'store', to: 'pod_p', style: 'dashed', label: 'CSI' },
    },
  },
  codes: {
    env: {
      title: 'api-config.yaml', lang: 'yaml',
      text: `apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: prod
data:
  DB_HOST: prod-db.shop.internal
  LOG_LEVEL: warn
  PAYMENT_URL: https://pay.example/v2
---
# Deployment의 Pod 템플릿 (일부)
containers:
  - name: api
    image: shop/api:1.4
    envFrom:
      - configMapRef:
          name: api-config   # 모든 키를 env로
`,
    },
    vol: {
      title: '파일로 마운트', lang: 'yaml',
      text: `# ConfigMap: 키 이름이 파일 이름이 됩니다
data:
  app.yaml: |
    cache:
      ttl: 300
    features:
      new_checkout: true
---
# Deployment의 Pod 템플릿 (일부)
containers:
  - name: api
    image: shop/api:1.4
    volumeMounts:
      - name: config
        mountPath: /etc/api   # app.yaml이 생김
        readOnly: true
volumes:
  - name: config
    configMap:
      name: api-config
`,
    },
    restart: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl edit configmap api-config
configmap/api-config edited
# LOG_LEVEL: warn → debug

$ kubectl exec deploy/api -- env | grep LOG
LOG_LEVEL=warn
# 실행 중인 Pod는 옛 값 그대로

$ kubectl rollout restart deploy/api
deployment.apps/api restarted

$ kubectl exec deploy/api -- env | grep LOG
LOG_LEVEL=debug
`,
    },
    secret: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl create secret generic api-secret \\
    --from-literal=DB_PASSWORD='s3cr3t-pw'
secret/api-secret created

$ kubectl get secret api-secret -o yaml
apiVersion: v1
kind: Secret
type: Opaque
data:
  DB_PASSWORD: czNjcjN0LXB3

$ echo czNjcjN0LXB3 | base64 -d
s3cr3t-pw
`,
    },
    eso: {
      title: 'externalsecret.yaml', lang: 'yaml',
      text: `apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: api-secret
  namespace: prod
spec:
  refreshInterval: 1h         # 주기적 동기화
  secretStoreRef:
    kind: ClusterSecretStore
    name: cloud-secrets       # 어느 저장소인지
  target:
    name: api-secret          # 만들어질 Secret
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/shop/db     # 저장소 안의 이름
        property: password
`,
    },
  },
  steps: [
    {
      key: '박힌 설정', kind: 'problem', title: '설정이 이미지 안에 박혀 있으면',
      body: [
        'shop.example의 api는 DB 주소, 로그 수준, 결제 API 주소, DB 비밀번호를 알아야 합니다. 가장 쉬운 방법은 이 값들을 코드나 Dockerfile의 <code>ENV</code>에 적어 이미지에 넣는 것이죠.',
        '그러면 dev와 prod는 DB 주소가 다르니 <b>환경마다 이미지를 따로</b> 빌드해야 합니다. dev에서 테스트한 이미지와 prod에 나가는 이미지가 서로 다른 물건이 되고, 로그 수준 하나를 바꾸려 해도 다시 빌드해야 해요. 비밀번호는 이미지를 받을 수 있는 모두에게 보입니다.',
      ],
      callout: { type: 'key', text: '컨테이너의 약속은 <b>한 번 빌드한 이미지를 어디서나 그대로</b> 실행하는 것입니다. 환경마다 달라지는 것은 이미지 밖에 있어야 해요.' },
      show: ['img_d', 'img_p', 'pod_d', 'pod_p'],
      tags: [
        { on: 'img_d', text: 'DB_HOST=dev-db' },
        { on: 'img_p', text: 'DB 비밀번호 포함', tone: 'bad', icon: 'unlock', pos: 'bottom', dx: -34 },
      ],
      flows: [{ path: ['img_d', 'pod_d'], kind: 'build' }, { path: ['img_p', 'pod_p'], kind: 'build', delay: 0.5 }],
      metrics: { img: ['환경마다 따로', 'bad'], chg: ['이미지 재빌드', 'bad'], sec: ['이미지 안', 'bad'] },
    },
    {
      key: '설정 분리', kind: 'solution', title: 'ConfigMap: 설정을 이미지 밖으로',
      body: [
        '쿠버네티스는 설정을 담는 오브젝트를 따로 둡니다. <b>ConfigMap</b>은 비밀이 아닌 설정을 <b>키-값</b>으로 저장하는 API 오브젝트이고, Pod가 뜰 때 그 값을 컨테이너에 넣어 줍니다.',
        '이제 이미지는 <code>shop/api:1.4</code> 하나입니다. dev와 prod 네임스페이스에 <b>이름은 같고 내용은 다른</b> ConfigMap을 두면, 같은 Deployment 매니페스트가 환경에 맞는 값을 받아요. dev에서 검증한 바로 그 이미지가 prod로 갑니다.',
      ],
      callout: { type: 'tip', text: 'Pod는 <b>같은 네임스페이스</b>의 ConfigMap만 참조할 수 있습니다. 크기는 1MiB까지라, 큰 파일을 담는 용도는 아니에요.' },
      hide: ['img_d', 'img_p'],
      show: ['img', 'cm_d', 'cm_p'],
      tags: [
        { on: 'pod_d', text: 'DB_HOST=dev-db', tone: 'accent' },
        { on: 'pod_p', text: 'DB_HOST=prod-db', tone: 'accent', pos: 'bottom', dx: -44 },
      ],
      flows: [
        { path: ['img', 'pod_d'], kind: 'build' }, { path: ['img', 'pod_p'], kind: 'build', delay: 0.3 },
        { path: ['cm_d', 'pod_d'], kind: 'data', delay: 1.2 }, { path: ['cm_p', 'pod_p'], kind: 'data', delay: 1.5 },
      ],
      metrics: { img: ['1개', 'ok'], chg: ['ConfigMap 수정', 'ok'] },
      changes: [['-', '환경별 이미지 2개'], ['+', '이미지 1개'], ['+', '환경별 ConfigMap']],
    },
    {
      key: '환경 변수', kind: 'concept', title: '주입 방법 ① 환경 변수로',
      body: [
        '위쪽이 prod의 ConfigMap입니다. <code>data</code> 아래에 키와 값을 적어요. 값은 모두 문자열입니다.',
        '아래는 Deployment의 Pod 템플릿이에요. <code>envFrom</code>에 ConfigMap 이름을 적으면 <b>모든 키가 환경 변수</b>가 됩니다. 일부만 필요하거나 변수 이름을 바꾸고 싶으면 <code>env</code>의 <code>valueFrom.configMapKeyRef</code>로 키를 하나씩 고릅니다. 앱은 평소처럼 환경 변수를 읽으면 되니, 쿠버네티스를 몰라도 돼요.',
      ],
      callout: { type: 'warn', text: '참조한 ConfigMap이 없으면 컨테이너가 시작되지 못하고 <code>CreateContainerConfigError</code>로 멈춥니다. ConfigMap을 먼저 적용하세요.' },
      hide: ['pod_d', 'cm_d'],
      code: { ref: 'env', hl: [6, 7, 8, 9, 15, 16, 17] },
      tags: [{ on: 'pod_p', text: '$DB_HOST로 읽음', tone: 'accent', pos: 'bottom' }],
      flows: [{ path: ['cm_p', 'pod_p'], kind: 'data', n: 3, gap: 0.5 }],
    },
    {
      key: '볼륨 마운트', kind: 'concept', title: '주입 방법 ② 파일로 마운트',
      body: [
        '설정이 파일이어야 할 때가 있습니다. nginx.conf나 앱의 YAML 설정 파일처럼요. ConfigMap을 <b>볼륨</b>으로 마운트하면 <b>키 하나가 파일 하나</b>가 됩니다. 키 이름이 파일 이름, 값이 파일 내용이에요.',
        '여기서는 <code>app.yaml</code> 키가 컨테이너 안의 <code>/etc/api/app.yaml</code>로 나타납니다. 값이 몇 개뿐이면 환경 변수가, 구조가 있는 긴 설정이면 파일이 편합니다.',
      ],
      callout: { type: 'warn', text: '마운트한 디렉터리에 이미지가 원래 갖고 있던 파일은 <b>가려집니다</b>. 볼륨이 디렉터리 전체를 덮기 때문이에요. 설정 전용 디렉터리에 마운트하세요.' },
      code: { ref: 'vol', hl: [3, 13, 14, 15, 19, 20] },
      tags: [{ on: 'pod_p', text: '/etc/api/app.yaml', icon: 'file-text', pos: 'bottom' }],
      flows: [{ path: ['cm_p', 'pod_p'], kind: 'build', n: 2 }],
    },
    {
      key: '재시작 필요', kind: 'problem', title: '값을 바꿨는데 Pod는 그대로입니다',
      body: [
        '장애를 조사하려고 ConfigMap의 <code>LOG_LEVEL</code>을 debug로 바꿨습니다. 그런데 로그는 그대로예요. <b>환경 변수는 컨테이너가 시작될 때 한 번</b> 정해지고, 그 뒤 ConfigMap이 바뀌어도 실행 중인 프로세스에는 전달되지 않습니다.',
        '새 값을 읽히려면 Pod를 새로 띄워야 합니다. <code>kubectl rollout restart</code>가 Pod를 차례로 교체해 줘요. 볼륨으로 마운트한 파일은 kubelet이 잠시 뒤 새 내용으로 바꿔 주지만, 앱이 파일을 다시 읽지 않으면 역시 그대로입니다.',
      ],
      callout: { type: 'tip', text: '설정 변경도 <b>배포</b>입니다. ConfigMap 이름에 버전을 붙이고(<code>api-config-v2</code>) Deployment가 새 이름을 가리키게 하면, 변경이 곧 롤아웃이 되고 되돌리기도 쉬워져요.' },
      hide: ['img'],
      show: ['pod_n'],
      set: {
        pod_p: { state: 'dim', badge: '옛 값', tone: 'warn' },
        pod_n: { state: 'ok', badge: '새 값', tone: 'ok' },
      },
      code: { ref: 'restart', hl: [5, 6, 9, 13] },
      tags: [{ on: 'cm_p', text: 'LOG_LEVEL: debug', tone: 'accent', icon: 'pencil', pos: 'right' }],
      flows: [{ path: ['cm_p', 'pod_n'], kind: 'data', n: 2 }],
      metrics: { chg: ['수정 + 재시작', 'warn'] },
      changes: [['~', 'ConfigMap: warn → debug'], ['-', '실행 중인 Pod: 옛 값 그대로'], ['+', '새로 뜬 Pod: 새 값']],
    },
    {
      key: 'Secret', kind: 'concept', title: 'Secret: base64는 암호화가 아닙니다',
      body: [
        'DB 비밀번호 같은 값은 <b>Secret</b>에 담습니다. 쓰는 법은 ConfigMap과 같아요. <code>secretKeyRef</code>로 환경 변수에 넣거나 볼륨으로 마운트합니다.',
        '그런데 Secret의 값은 <b>base64로 인코딩</b>되어 있을 뿐입니다. base64는 바이너리도 담으려는 표기법이지 암호화가 아니어서, 키 없이 누구나 한 줄로 되돌려요. Secret의 쓸모는 다른 데 있습니다. 종류가 달라 <b>권한(RBAC)을 따로</b> 걸 수 있고, 필요한 Pod가 있는 노드에만 전달되며, 마운트하면 디스크가 아닌 메모리(tmpfs)에 놓입니다.',
      ],
      callout: { type: 'key', text: 'Secret은 "암호화된 값"이 아니라 <b>"조심해서 다룰 값이라는 표시"</b>입니다. 실제 보호는 권한, 저장 시 암호화, 그리고 YAML을 어디에 두느냐가 만듭니다.' },
      hide: ['pod_n'],
      show: ['sec'],
      set: { pod_p: { state: null, badge: null } },
      code: { ref: 'secret', hl: [10, 12, 13] },
      tags: [{ on: 'sec', text: 'base64 ≠ 암호화', tone: 'warn', pos: 'left' }],
      flows: [{ path: ['sec', 'pod_p'], kind: 'data', n: 2 }],
      metrics: { sec: ['Secret · base64', 'warn'] },
    },
    {
      key: 'Git에 커밋', kind: 'case', title: '사례: secret.yaml을 Git에 올렸다',
      body: [
        '매니페스트는 모두 Git에 두라고 배운 팀이 <code>secret.yaml</code>도 함께 커밋했습니다. 값이 <code>czNjcjN0LXB3</code>처럼 알아볼 수 없게 생겨서 리뷰도 그냥 통과했어요.',
        '이제 저장소를 읽을 수 있는 모든 사람, CI, 포크와 클론이 운영 DB 비밀번호를 갖고 있습니다. 나중에 파일을 지워도 <b>커밋 히스토리</b>에 남아요. 저장소가 공개로 바뀌거나 계정 하나가 털리는 날, 비밀번호도 함께 나갑니다.',
      ],
      callout: { type: 'warn', text: '이미 올라갔다면 먼저 <b>비밀번호를 교체</b>하세요. 히스토리를 지우는 것은 그 다음이고, 누군가 이미 받아 갔다면 지워도 소용없습니다.' },
      hide: ['pod_p', 'cm_p', 'sec'],
      show: ['dev', 'yaml', 'git', 'out'],
      set: { git: { state: 'hot' } },
      tags: [
        { on: 'yaml', text: 'data: czNjcjN0…' },
        { on: 'git', text: '히스토리에 남음', tone: 'warn', icon: 'history' },
        { on: 'out', text: '한 줄로 디코드', tone: 'bad', icon: 'unlock' },
      ],
      flows: [{ path: ['dev', 'yaml', 'git'], kind: 'build' }, { path: ['git', 'out'], kind: 'bad', n: 3, delay: 1.6 }],
      metrics: { sec: ['Git 히스토리', 'bad'] },
      changes: [['-', 'DB 비밀번호가 Git 히스토리에'], ['~', '저장소 읽기 권한 = 비밀번호 열람']],
    },
    {
      key: 'etcd 암호화', kind: 'solution', title: '클러스터 안: 저장 시 암호화와 RBAC',
      body: [
        'Secret은 API 서버를 거쳐 <b>etcd</b>에 저장됩니다. 쿠버네티스 기본 설정에서는 암호화 없이 들어가서, etcd 디스크나 백업 파일을 손에 넣으면 모든 Secret을 읽을 수 있어요. <b>저장 시 암호화</b>를 켜면 API 서버가 etcd에 쓰기 전에 암호화하고, 그 키는 클라우드 KMS에 둘 수 있습니다.',
        '하지만 API로 조회하면 여전히 원래 값이 나옵니다. 그래서 <b>RBAC</b>으로 Secret을 <code>get</code> · <code>list</code> 할 수 있는 주체를 좁혀요. 그 네임스페이스에 Pod를 만들 수 있는 사람은 Secret을 마운트해 읽을 수 있다는 점도 기억하세요.',
      ],
      callout: { type: 'cloud', text: 'EKS · AKS · GKE 모두 클라우드 KMS 키로 Secret을 암호화하는 설정이 있습니다. 클러스터를 만들 때 켜 두는 것이 가장 쉽습니다.' },
      hide: ['yaml', 'git', 'out'],
      show: ['api', 'etcd', 'kms'],
      set: { git: { state: null } },
      tags: [
        { on: 'etcd', text: '암호문으로 저장', tone: 'ok', icon: 'lock' },
        { on: 'dev', text: 'RBAC: 권한 있는 사람만', pos: 'bottom', dy: 26 },
      ],
      flows: [
        { path: ['dev', 'api'], kind: 'ctrl' },
        { path: ['api', 'kms'], kind: 'ctrl', delay: 0.9 }, { path: ['kms', 'api'], kind: 'data', delay: 1.7 },
        { path: ['api', 'etcd'], kind: 'data', delay: 2.5 },
      ],
      panel: {
        title: 'Secret을 읽는 세 가지 길', icon: 'eye',
        rows: [
          ['etcd 디스크 · 백업', '저장 시 암호화', 'ok'],
          ['kubectl get secret', 'RBAC으로 제한', 'ok'],
          ['Pod 생성 권한', '마운트해서 읽음', 'warn'],
        ],
      },
      metrics: { sec: ['etcd · 암호화', 'ok'] },
    },
    {
      key: '외부 저장소', kind: 'solution', title: 'Git에는 참조만, 값은 저장소에',
      body: [
        '값의 원본은 클라우드의 <b>시크릿 저장소</b>(AWS Secrets Manager, Azure Key Vault 등)에 두는 것이 일반적입니다. 접근 기록과 교체 기능이 거기 있으니까요. <b>External Secrets Operator</b>는 <code>ExternalSecret</code>에 적힌 대로 저장소에서 값을 읽어 Secret을 만들고, 주기적으로 다시 맞춥니다.',
        'Git에 올라가는 것은 "어느 저장소의 어떤 값"이라는 <b>참조</b>뿐이에요. <b>Secrets Store CSI 드라이버</b>는 다른 길입니다. Secret 오브젝트를 거치지 않고 값을 Pod에 파일로 바로 마운트해서, etcd에 남지 않습니다.',
      ],
      callout: { type: 'tip', text: '앱이 환경 변수를 기대하면 External Secrets가, 값을 etcd에 두고 싶지 않으면 CSI 드라이버가 맞습니다. 어느 쪽이든 환경 변수로 받은 Pod는 값이 교체된 뒤 재시작해야 해요.' },
      hide: ['dev', 'api', 'etcd', 'kms'],
      show: ['store', 'eso', 'sec', 'pod_p'],
      code: { ref: 'eso', hl: [8, 9, 10, 15, 16, 17] },
      tags: [{ on: 'eso', text: '읽어서 Secret 생성', tone: 'accent', pos: 'bottom' }],
      flows: [
        { path: ['store', 'eso'], kind: 'data' },
        { path: ['eso', 'sec'], kind: 'data', delay: 1 },
        { path: ['sec', 'pod_p'], kind: 'data', delay: 2 },
      ],
      metrics: { sec: ['외부 저장소', 'ok'] },
      changes: [['+', 'ExternalSecret: 참조만 Git에'], ['~', 'Secret은 오퍼레이터가 생성 · 갱신'], ['-', 'Git 안의 비밀값']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 이미지는 하나, 설정은 밖에서',
      body: [
        '환경마다 달라지는 값은 이미지 밖에 둡니다. 비밀이 아닌 설정은 <b>ConfigMap</b>, 비밀값은 <b>Secret</b>에 담아 환경 변수나 파일로 주입하고, 환경 변수로 받은 값은 Pod를 다시 띄워야 바뀝니다.',
        'Secret의 base64는 암호화가 아니니 YAML을 Git에 올리지 않습니다. 클러스터 안은 저장 시 암호화와 RBAC으로, 원본은 외부 시크릿 저장소로 지켜요. 다음 레슨에서는 Pod가 <b>어느 노드에 놓이고 언제 늘어나는지</b>, 스케줄링과 오토스케일링을 봅니다.',
      ],
      hide: ['store', 'eso'],
      show: ['img', 'pod_d', 'cm_d', 'cm_p'],
      flows: [
        { path: ['img', 'pod_d'], kind: 'build' }, { path: ['img', 'pod_p'], kind: 'build', delay: 0.3 },
        { path: ['cm_d', 'pod_d'], kind: 'data', delay: 1.2 }, { path: ['cm_p', 'pod_p'], kind: 'data', delay: 1.5 },
        { path: ['sec', 'pod_p'], kind: 'data', delay: 1.8 },
      ],
      metrics: { chg: ['수정 + 재시작', 'ok'] },
    },
  ],
  quiz: [
    {
      q: 'api Deployment는 envFrom으로 ConfigMap을 받습니다. 로그 수준을 바꾸려고 ConfigMap을 수정했는데 동작이 그대로입니다. 가장 알맞은 조치는?',
      options: [
        'ConfigMap을 지웠다가 같은 이름으로 다시 만든다',
        'kubectl rollout restart로 Pod를 새로 띄운다',
        '1분쯤 기다리면 kubelet이 환경 변수를 새 값으로 바꿔 준다',
        '설정이 바뀌었으니 이미지를 다시 빌드한다',
      ],
      answer: 1,
      why: '환경 변수는 컨테이너가 시작될 때 한 번 정해지므로, 새 값을 읽히려면 Pod를 새로 띄워야 합니다. kubelet이 나중에 갱신해 주는 것은 볼륨으로 마운트한 파일뿐이고 환경 변수는 아닙니다. ConfigMap을 다시 만들어도 실행 중인 프로세스는 그대로이며, 설정을 이미지 밖으로 뺀 이유가 바로 재빌드를 피하기 위해서입니다.',
    },
    {
      q: '동료가 "Secret 값은 base64로 되어 있으니 secret.yaml을 Git에 올려도 된다"고 합니다. 가장 정확한 답은?',
      options: [
        '비공개 저장소라면 문제없다',
        'stringData 대신 data 필드를 쓰면 안전하다',
        'base64는 키 없이 되돌리는 인코딩이라 평문과 같다. Git에는 외부 저장소를 가리키는 참조만 둔다',
        'type을 Opaque로 지정하면 값이 암호화된다',
      ],
      answer: 2,
      why: 'base64는 암호화가 아니라 표기법이어서 누구나 한 줄로 디코드합니다. 비공개 저장소여도 읽기 권한이 있는 모든 사람과 CI, 클론이 비밀번호를 갖게 되고 히스토리에 계속 남습니다. data와 stringData는 적는 방식만 다르고, Opaque는 "형식이 정해지지 않은 Secret"이라는 뜻일 뿐입니다.',
    },
    {
      q: 'dev와 prod의 DB 주소가 다릅니다. 어떻게 구성하는 것이 가장 좋을까요?',
      options: [
        '환경마다 값을 넣어 태그가 다른 이미지를 빌드한다',
        '이미지에 두 환경의 값을 모두 넣고, 실행 인자로 고르게 한다',
        '이미지는 하나로 두고, 네임스페이스마다 같은 이름의 ConfigMap에 그 환경의 값을 둔다',
        'prod 값을 기본으로 넣고, dev에서는 컨테이너에 들어가 고친다',
      ],
      answer: 2,
      why: '같은 이미지를 모든 환경에 쓰려면 환경마다 다른 값이 이미지 밖에 있어야 합니다. 환경별 이미지는 테스트한 것과 배포하는 것이 달라지고, 두 값을 모두 넣는 방식은 환경이 늘 때마다 이미지를 다시 빌드해야 하며 prod 값이 dev에도 실려 다닙니다. 컨테이너 안에서 고친 것은 Pod가 다시 뜨면 사라집니다.',
    },
    {
      q: '클러스터에 etcd 저장 시 암호화를 켰습니다. 이것으로 막을 수 있는 것은?',
      options: [
        'Secret 조회 권한이 있는 사용자가 kubectl get secret -o yaml로 값을 보는 것',
        'etcd 백업 파일이 유출됐을 때 Secret 값이 그대로 읽히는 것',
        'secret.yaml이 Git에 커밋되는 것',
        '컨테이너 안에서 환경 변수로 비밀번호가 보이는 것',
      ],
      answer: 1,
      why: '저장 시 암호화는 etcd에 기록된 데이터를 지킵니다. 디스크나 백업을 얻어도 키 없이는 읽지 못해요. API 서버는 권한이 있는 요청에 복호화한 값을 돌려주므로 kubectl로 보는 것은 RBAC으로 막아야 하고, Git 커밋과 컨테이너 안의 환경 변수는 etcd와 무관합니다.',
    },
  ],
};
