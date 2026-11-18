export default {
  id: 'config-secret',
  learn: [
    '설정을 이미지에서 떼어 내야 하는 이유',
    'ConfigMap 주입: 환경 변수와 파일 마운트',
    '설정 변경이 Pod에 닿는 방식과 롤아웃',
    'Secret의 base64는 암호화가 아니다',
    '저장 시 암호화 · RBAC · 외부 시크릿 저장소',
    '비밀값 교체(rotation)를 안전하게',
  ],
  legend: [['build', '이미지 · 파일'], ['data', '설정 · 비밀값'], ['ctrl', 'API 호출'], ['bad', '유출 · 실패']],
  metrics: [
    { id: 'img', label: '이미지', icon: 'package' },
    { id: 'chg', label: '설정을 바꾸려면', icon: 'sliders' },
    { id: 'sec', label: '비밀값 위치', icon: 'key' },
    { id: 'rot', label: '비밀값 교체', icon: 'refresh' },
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
      cm_v2: { kind: 'tile', at: [5.6, -1.3], label: 'api-config-v2', icon: 'sliders', color: 'yellow' },
      sec: { kind: 'tile', at: [3.2, 3.7], label: 'Secret', icon: 'key', color: 'orange' },
      db: { kind: 'cyl', at: [5.8, 1.3], label: '운영 DB', icon: 'database', color: 'purple' },

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
      e_v2: { from: 'cm_v2', to: 'pod_n' },
      e_sp: { from: 'sec', to: 'pod_p' },
      e_db: { from: 'pod_p', to: 'db' },
      e_dy: { from: 'dev', to: 'yaml' },
      e_yg: { from: 'yaml', to: 'git' },
      e_go: { from: 'git', to: 'out', tone: 'bad' },
      e_da: { from: 'dev', to: 'api' },
      e_ae: { from: 'api', to: 'etcd' },
      e_ak: { from: 'api', to: 'kms', style: 'dashed', bi: true },
      e_se: { from: 'store', to: 'eso' },
      e_es: { from: 'eso', to: 'sec' },
      e_csi: { from: 'store', to: 'pod_p', style: 'dashed', label: 'CSI', off: true },
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
    swap: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl exec deploy/api -- \\
    ls -a /etc/api
..2026_11_18_01_02_03.1234
..data
app.yaml

# ConfigMap에서 ttl: 300 → 60
# 1분쯤 지나면 파일이 바뀜
$ kubectl exec deploy/api -- \\
    cat /etc/api/app.yaml
cache:
  ttl: 60`,
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
    ver: {
      title: 'deployment.yaml (일부)', lang: 'yaml',
      text: `spec:
  template:
    metadata:
      annotations:
        checksum/config: 9f2c41e…
    spec:
      containers:
        - name: api
          envFrom:
            - configMapRef:
                name: api-config-v2`,
    },
    secret: {
      title: '터미널', lang: 'sh',
      text: `$ kubectl create secret generic \\
    api-secret \\
    --from-literal=DB_PASSWORD=s3cr3t-pw
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
  refreshInterval: 1h     # 동기화 주기
  secretStoreRef:
    kind: ClusterSecretStore
    name: cloud-secrets   # 어느 저장소
  target:
    name: api-secret      # 만들 Secret
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/shop/db # 저장소 안 이름
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
      metrics: { img: ['환경마다 따로', 'bad'], chg: ['이미지 재빌드', 'bad'], sec: ['이미지 안', 'bad'], rot: ['재빌드 · 재배포', 'bad'] },
      more: [
        {
          title: '왜 위험한가',
          body: [
            '이미지는 레이어로 쌓인 파일 묶음이라, Dockerfile에서 값을 넣었다가 다음 줄에서 지워도 앞 레이어에는 그대로 남습니다. <code>docker history</code>나 레이어 압축을 풀어 보면 누구나 꺼낼 수 있어요. 레지스트리에 읽기 권한이 있는 사람, 이미지를 캐시한 모든 노드와 CI가 비밀번호를 갖게 됩니다.',
            '비밀번호를 바꿀 때도 문제입니다. 바꾼 값으로 이미지를 다시 빌드하고 모든 환경에 다시 배포해야 하고, 옛 이미지에는 옛 비밀번호가 영원히 남습니다.',
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ docker history shop/api:prod --no-trunc \\
    | grep ENV
ENV DB_PASSWORD=s3cr3t-pw
ENV DB_HOST=prod-db.shop.internal`,
          },
        },
        {
          title: '12-factor의 원칙',
          body: ['널리 쓰이는 12-factor 앱 원칙은 "설정은 환경에 둔다"고 말합니다. 같은 코드 · 같은 빌드 결과물에 환경마다 다른 설정을 붙여 실행하라는 뜻이에요. 쿠버네티스의 ConfigMap과 Secret은 이 원칙을 클러스터 오브젝트로 옮긴 것입니다.'],
        },
      ],
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
      more: [
        {
          title: '직접 해보기',
          body: ['ConfigMap은 YAML로 써도 되고, 값이나 파일에서 바로 만들 수도 있습니다.'],
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl create configmap api-config -n prod \\
    --from-literal=LOG_LEVEL=warn \\
    --from-file=app.yaml
configmap/api-config created

$ kubectl get configmap api-config -n prod
NAME        DATA   AGE
api-config  2      5s

# 파일로 남기려면 YAML만 출력
$ kubectl create configmap api-config \\
    --from-file=app.yaml --dry-run=client -o yaml`,
          },
        },
        {
          title: '동작 원리',
          body: [
            'ConfigMap도 다른 오브젝트처럼 etcd에 저장되고, 노드의 kubelet이 그 노드에 뜰 Pod가 참조하는 ConfigMap만 받아 와 컨테이너에 넣습니다. 값은 UTF-8 문자열(<code>data</code>)이 기본이고, 바이너리는 <code>binaryData</code>에 base64로 넣어요.',
          ],
        },
        {
          title: '환경을 나누는 방법',
          list: [
            '<b>네임스페이스별 같은 이름</b>: 이 레슨의 방식. 매니페스트를 그대로 쓸 수 있습니다.',
            '<b>Kustomize overlay</b>: 공통 base에 환경별로 값만 덮어씁니다.',
            '<b>Helm values</b>: 환경별 values 파일로 템플릿을 채웁니다(관리형 쿠버네티스와 Helm 레슨).',
            '어느 방식이든 환경별 값 파일은 Git에 두고 리뷰를 거칩니다. 단, 비밀값은 빼고요.',
          ],
        },
      ],
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
      more: [
        {
          title: '설정 예시',
          body: ['키 하나만 골라 다른 이름의 변수로 넣고, 없어도 시작은 되게 하려면 이렇게 씁니다.'],
          code: {
            title: 'Pod 템플릿 (일부)', lang: 'yaml',
            text: `env:
  - name: APP_LOG_LEVEL          # 컨테이너 안의 이름
    valueFrom:
      configMapKeyRef:
        name: api-config
        key: LOG_LEVEL           # ConfigMap의 키
        optional: true           # 없어도 시작
envFrom:
  - prefix: CFG_                 # CFG_DB_HOST …
    configMapRef:
      name: api-config`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '키에 <code>app.yaml</code>처럼 점이나 하이픈이 들어 있으면 환경 변수 이름이 될 수 없어 <code>envFrom</code>이 그 키를 <b>건너뜁니다</b>. Pod 이벤트에 경고만 남아요.',
            '값 <code>true</code>, <code>300</code>도 YAML에서 따옴표가 없으면 문자열이 아니라 오류가 납니다. ConfigMap의 값은 <code>"300"</code>처럼 문자열로 적으세요.',
            '<code>env</code>와 <code>envFrom</code>에 같은 이름이 있으면 <code>env</code>가 이깁니다. 덮어쓴 줄 모르고 헤매기 쉬워요.',
          ],
        },
        {
          title: '출력 읽기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get pods
NAME           READY  STATUS
api-6b8f9-x2k  0/1    CreateContainerConfigError

$ kubectl describe pod api-6b8f9-x2k
Warning  Failed  kubelet
  Error: configmap "api-config" not found`,
          },
        },
      ],
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
      more: [
        {
          title: '환경 변수 vs 파일',
          rows: [
            ['값 몇 개 · 단순한 문자열', '환경 변수', 'info'],
            ['구조 있는 설정 · 원래 파일을 읽는 앱', '파일', 'info'],
            ['실행 중에 값이 바뀌어야 함', '파일 (갱신됨)', 'ok'],
            ['비밀값', '파일 권장 (다음 Secret 단계)', 'warn'],
          ],
        },
        {
          title: '설정 예시',
          body: ['디렉터리를 덮지 않고 파일 하나만 끼워 넣고 싶으면 <code>subPath</code>를, 일부 키만 다른 이름으로 내보내려면 <code>items</code>를 씁니다.'],
          code: {
            title: 'Pod 템플릿 (일부)', lang: 'yaml',
            text: `volumeMounts:
  - name: nginx
    mountPath: /etc/nginx/nginx.conf
    subPath: nginx.conf       # 파일 하나만
volumes:
  - name: nginx
    configMap:
      name: web-config
      items:
        - key: nginx.conf
          path: nginx.conf
      defaultMode: 0444       # 읽기 전용 권한`,
          },
        },
        {
          title: '흔한 실수',
          body: ['nginx 설정을 바꾸려고 <code>/etc/nginx</code> 전체에 마운트했더니 <code>mime.types</code> 같은 원래 파일이 사라져 nginx가 시작하지 못합니다. 파일 하나만 바꾸려면 <code>subPath</code>나 설정 전용 디렉터리를 쓰세요. 다만 subPath에는 다음 단계에서 볼 약점이 있습니다.'],
        },
      ],
    },
    {
      key: '파일 갱신', kind: 'concept', title: '마운트한 파일은 저절로 바뀝니다',
      body: [
        'ConfigMap을 고치면 볼륨으로 마운트한 파일은 <b>잠시 뒤 새 내용으로</b> 바뀝니다. kubelet이 주기적으로 ConfigMap을 확인해 파일을 갈아 끼우기 때문이에요. 보통 1분 안팎이 걸리고, Pod는 재시작되지 않습니다.',
        '그래서 설정 파일을 주기적으로 다시 읽거나 변경을 감지하는 앱이라면 재시작 없이 새 설정을 쓸 수 있습니다.',
      ],
      callout: { type: 'warn', text: '<code>subPath</code>로 마운트한 파일은 <b>갱신되지 않습니다</b>. 그리고 파일이 바뀌어도 앱이 다시 읽지 않으면 동작은 그대로예요.' },
      code: { ref: 'swap', hl: [3, 4, 7, 8, 12] },
      tags: [
        { on: 'cm_p', text: 'ttl: 300 → 60', tone: 'accent', icon: 'pencil', pos: 'right' },
        { on: 'pod_p', text: '파일만 교체', tone: 'ok', pos: 'bottom' },
      ],
      flows: [{ path: ['cm_p', 'pod_p'], kind: 'data', n: 2, delay: 0.6 }],
      metrics: { chg: ['파일: 자동 반영', 'ok'] },
      more: [
        {
          title: '동작 원리',
          body: [
            '마운트된 디렉터리를 보면 실제 파일은 시각이 붙은 숨은 디렉터리(<code>..2026_11_18_…</code>)에 있고, <code>..data</code>가 그것을 가리키는 심볼릭 링크, <code>app.yaml</code>은 다시 <code>..data/app.yaml</code>을 가리키는 링크입니다. kubelet은 새 내용을 새 숨은 디렉터리에 다 쓴 뒤 <code>..data</code> 링크 하나만 바꿔서, 앱이 반쯤 쓰인 파일을 읽는 일이 없게 합니다.',
            '이 교체는 디렉터리 단위라서, 파일 하나를 다른 경로에 끼워 넣는 <code>subPath</code>는 링크 교체의 혜택을 받지 못합니다. 그래서 갱신이 안 돼요.',
          ],
        },
        {
          title: '얼마나 걸리나',
          list: [
            'kubelet의 동기화 주기(기본 1분)와 ConfigMap 캐시 방식에 따라 정해져, 대개 1분 안팎이고 때로 더 걸립니다.',
            '바로 반영해야 한다면 기다리기보다 롤아웃(다음 단계)을 하는 편이 확실합니다.',
          ],
        },
        {
          title: '실무 팁',
          list: [
            'nginx처럼 신호로 설정을 다시 읽는 프로그램은, 파일 변경을 감시해 reload 신호를 보내는 작은 사이드카를 붙이기도 합니다.',
            '앱이 파일을 다시 읽는다면 "언제 어떤 값이 적용됐는지"를 로그로 남기세요. 자동 반영은 편하지만 장애 조사 때 추적하기 어렵습니다.',
          ],
        },
      ],
    },
    {
      key: '재시작 필요', kind: 'problem', title: '환경 변수는 바꿔도 Pod가 그대로입니다',
      body: [
        '장애를 조사하려고 ConfigMap의 <code>LOG_LEVEL</code>을 debug로 바꿨습니다. 그런데 로그는 그대로예요. <b>환경 변수는 컨테이너가 시작될 때 한 번</b> 정해지고, 그 뒤 ConfigMap이 바뀌어도 실행 중인 프로세스에는 전달되지 않습니다.',
        '새 값을 읽히려면 Pod를 새로 띄워야 합니다. <code>kubectl rollout restart</code>가 Pod를 차례로 교체해 줘요.',
      ],
      callout: { type: 'tip', text: '파일로 받았어도 앱이 시작할 때 한 번만 읽는다면 마찬가지입니다. "이 값은 언제 읽히는가"를 앱마다 알아 두세요.' },
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
      more: [
        {
          title: '동작 원리',
          body: [
            '환경 변수는 리눅스가 프로세스를 시작할 때 넘겨주는 값의 복사본입니다. 실행 중인 프로세스의 환경 변수를 밖에서 바꿀 방법은 없어요. 그래서 kubelet도 컨테이너를 만들 때 ConfigMap을 읽어 값을 채우고, 그 뒤로는 손대지 않습니다.',
            '<code>rollout restart</code>는 Pod 템플릿에 재시작 시각 어노테이션을 넣는 것뿐입니다. template이 바뀌었으니 Deployment가 새 ReplicaSet으로 차례로 교체하고, 새 Pod는 시작할 때 새 값을 읽어요.',
          ],
        },
        {
          title: '흔한 실수',
          list: [
            'ConfigMap을 고치고 "적용됐다"고 생각해 롤아웃을 잊습니다. 그러다 며칠 뒤 어떤 이유로 Pod가 재시작되면 그제야 새 값이 적용되어, 원인을 엉뚱한 곳에서 찾게 돼요.',
            'Pod 일부만 재시작되면 옛 값과 새 값의 Pod가 섞여 돕니다. 바꿨다면 바로 롤아웃까지 하세요.',
            '<code>kubectl edit</code>로 고친 값은 Git의 YAML과 달라집니다. 다음 배포 때 원래대로 돌아가요.',
          ],
        },
        {
          title: '자동으로 롤아웃하기',
          body: ['ConfigMap · Secret이 바뀌면 그것을 쓰는 Deployment를 자동으로 롤아웃해 주는 오픈소스 컨트롤러(예: Stakater Reloader)도 있습니다. Deployment에 어노테이션 하나만 붙이면 돼요. 다음 단계의 "이름에 버전 붙이기"와 함께 비교해 고르세요.'],
        },
      ],
    },
    {
      key: '설정 버전', kind: 'solution', title: '설정 변경도 롤아웃으로 만들기',
      body: [
        'ConfigMap 이름에 버전을 붙여 <code>api-config-v2</code>를 새로 만들고, Deployment가 새 이름을 가리키게 고칩니다. Pod 템플릿이 바뀌었으니 <b>설정 변경이 곧 롤아웃</b>이 되고, 문제가 있으면 Deployment를 되돌리는 것만으로 옛 설정으로 돌아가요.',
        '이름 대신 설정 내용의 해시를 Pod 템플릿의 어노테이션에 넣어도 같은 효과가 납니다.',
      ],
      callout: { type: 'tip', text: '버전마다 새로 만드는 ConfigMap에는 <code>immutable: true</code>를 붙일 수 있습니다. 실수로 고쳐지지 않고, API 서버가 변경을 감시하지 않아도 돼 부담도 줄어요.' },
      show: ['cm_v2'],
      hide: ['e_cn'],
      set: {
        cm_p: { label: 'api-config-v1', state: 'dim' },
        pod_p: { badge: 'v1 · 교체 중', tone: 'warn' },
        pod_n: { badge: 'v2', tone: 'ok' },
      },
      code: { ref: 'ver', hl: [5, 11] },
      tags: [{ on: 'cm_v2', text: 'immutable', tone: 'info', icon: 'lock', pos: 'right' }],
      flows: [{ path: ['cm_v2', 'pod_n'], kind: 'data', n: 2 }],
      metrics: { chg: ['새 버전 · 롤아웃', 'ok'] },
      changes: [['+', 'ConfigMap api-config-v2'], ['~', 'Deployment가 v2를 가리킴'], ['~', '되돌리기: Deployment 롤백']],
      more: [
        {
          title: '두 가지 방법',
          rows: [
            ['이름에 버전 · 해시', '옛 ConfigMap이 남아 롤백 시 그대로 사용', 'ok'],
            ['', '안 쓰는 옛 ConfigMap 정리가 필요', 'warn'],
            ['template에 체크섬 어노테이션', 'ConfigMap 이름은 그대로', 'ok'],
            ['', '롤백해도 ConfigMap 내용은 새 값 그대로', 'warn'],
          ],
        },
        {
          title: '설정 예시',
          body: ['Kustomize의 configMapGenerator는 내용의 해시를 이름 뒤에 붙이고, 그 이름을 쓰는 Deployment도 함께 고쳐 줍니다.'],
          code: {
            title: 'kustomization.yaml', lang: 'yaml',
            text: `configMapGenerator:
  - name: api-config
    literals:
      - LOG_LEVEL=warn
      - DB_HOST=prod-db.shop.internal
# 결과: api-config-7k2m9t4b8c
# Deployment의 참조도 이 이름으로 바뀜`,
          },
        },
        {
          title: '실무 팁',
          body: ['Helm 차트에서는 Pod 템플릿에 <code>checksum/config</code> 어노테이션으로 ConfigMap 템플릿의 해시를 넣는 패턴을 흔히 씁니다. 어느 방법이든 핵심은 같아요. 설정이 바뀌면 <b>Pod 템플릿이 바뀌게</b> 만들어, 쿠버네티스의 롤아웃 · 롤백 장치를 그대로 쓰는 것입니다.'],
        },
      ],
    },
    {
      key: 'Secret', kind: 'concept', title: 'Secret: base64는 암호화가 아닙니다',
      body: [
        'DB 비밀번호 같은 값은 <b>Secret</b>에 담습니다. 쓰는 법은 ConfigMap과 같아요. <code>secretKeyRef</code>로 환경 변수에 넣거나 볼륨으로 마운트합니다.',
        '그런데 Secret의 값은 <b>base64로 인코딩</b>되어 있을 뿐입니다. base64는 바이너리도 담으려는 표기법이지 암호화가 아니어서, 키 없이 누구나 한 줄로 되돌려요.',
      ],
      callout: { type: 'key', text: 'Secret은 "암호화된 값"이 아니라 <b>"조심해서 다룰 값이라는 표시"</b>입니다. 실제 보호는 권한, 저장 시 암호화, 그리고 YAML을 어디에 두느냐가 만듭니다.' },
      hide: ['pod_n', 'cm_v2'],
      show: ['e_cn', 'sec'],
      set: { pod_p: { state: null, badge: null }, pod_n: { state: null, badge: null }, cm_p: { label: 'ConfigMap (prod)', state: null } },
      code: { ref: 'secret', hl: [3, 11, 13, 14] },
      tags: [{ on: 'sec', text: 'base64 ≠ 암호화', tone: 'warn', pos: 'left' }],
      flows: [{ path: ['sec', 'pod_p'], kind: 'data', n: 2 }],
      metrics: { sec: ['Secret · base64', 'warn'] },
      more: [
        {
          title: '그럼 무엇이 다른가',
          list: [
            '<b>권한을 따로</b>: 종류가 달라 "ConfigMap은 읽어도 Secret은 못 읽게" RBAC을 나눌 수 있습니다.',
            '<b>필요한 노드에만</b>: kubelet은 자기 노드에 뜬 Pod가 참조하는 Secret만 받아 올 수 있어요.',
            '<b>메모리에만</b>: 볼륨으로 마운트하면 노드 디스크가 아니라 메모리(tmpfs)에 놓입니다.',
            '<b>출력에서 숨김</b>: <code>describe</code>는 값 대신 크기만 보여 줍니다. 물론 <code>-o yaml</code>로는 보여요.',
          ],
        },
        {
          title: '설정 예시',
          body: ['<code>stringData</code>에는 평문으로 적을 수 있고, 저장될 때 base64로 바뀌어 <code>data</code>에 들어갑니다. 편의 기능일 뿐 보안 차이는 없어요.'],
          code: {
            title: 'secret.yaml', lang: 'yaml',
            text: `apiVersion: v1
kind: Secret
metadata:
  name: api-secret
type: Opaque
stringData:
  DB_PASSWORD: s3cr3t-pw   # 이 파일 자체가 비밀
---
# Pod 템플릿 (일부)
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: api-secret
        key: DB_PASSWORD`,
          },
        },
      ],
    },
    {
      key: 'Secret 주입', kind: 'concept', title: '비밀값은 환경 변수보다 파일로',
      body: [
        '환경 변수는 생각보다 많은 곳에 새어 나갑니다. 앱이 오류 보고나 디버그 화면에 환경 변수를 통째로 찍기도 하고, 자식 프로세스에 그대로 물려주며, 같은 노드의 권한 있는 사용자는 프로세스 정보로 읽을 수 있어요.',
        '그래서 비밀값은 <b>파일로 마운트</b>하는 편이 안전합니다. 메모리(tmpfs)에만 놓이고, 권한을 좁힐 수 있으며, Secret이 바뀌면 파일도 갱신됩니다.',
      ],
      callout: { type: 'tip', text: '용도에 따라 정해진 <b>Secret 타입</b>도 있습니다. TLS 인증서, 비공개 레지스트리 로그인 정보는 정해진 타입과 키 이름으로 만들어야 쓰는 쪽이 알아봅니다.' },
      panel: {
        title: '자주 쓰는 Secret 타입', icon: 'key',
        rows: [
          ['Opaque', '임의의 키-값 (기본)', 'info'],
          ['kubernetes.io/tls', 'tls.crt · tls.key', 'accent'],
          ['kubernetes.io/dockerconfigjson', '이미지 받기 인증', 'accent'],
          ['kubernetes.io/basic-auth', 'username · password', 'mute'],
        ],
      },
      tags: [{ on: 'pod_p', text: '/etc/secret (tmpfs)', tone: 'ok', icon: 'lock', pos: 'bottom' }],
      flows: [{ path: ['sec', 'pod_p'], kind: 'data', n: 2 }],
      more: [
        {
          title: '설정 예시',
          code: {
            title: 'Pod 템플릿 (일부)', lang: 'yaml',
            text: `spec:
  imagePullSecrets:
    - name: registry-cred      # dockerconfigjson 타입
  containers:
    - name: api
      volumeMounts:
        - name: secret
          mountPath: /etc/secret
          readOnly: true
  volumes:
    - name: secret
      secret:
        secretName: api-secret
        defaultMode: 0400      # 소유자만 읽기`,
          },
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl create secret docker-registry registry-cred \\
    --docker-server=registry.example.com \\
    --docker-username=ci --docker-password=…

$ kubectl exec deploy/api -- ls /etc/secret
DB_PASSWORD`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '앱 시작 로그에 "설정 값"을 모두 찍다가 비밀번호도 함께 찍습니다. 로그는 로그 시스템을 통해 훨씬 많은 사람에게 보여요.',
            '비공개 레지스트리 인증 Secret을 다른 네임스페이스에 만들어 <code>ImagePullBackOff</code>가 납니다. Secret은 Pod와 같은 네임스페이스에 있어야 합니다.',
          ],
        },
      ],
    },
    {
      key: 'Git에 커밋', kind: 'case', title: '사례: secret.yaml을 Git에 올렸다',
      body: [
        '매니페스트는 모두 Git에 두라고 배운 팀이 <code>secret.yaml</code>도 함께 커밋했습니다. 값이 <code>czNjcjN0LXB3</code>처럼 알아볼 수 없게 생겨서 리뷰도 그냥 통과했어요.',
        '이제 저장소를 읽을 수 있는 모든 사람, CI, 포크와 클론이 운영 DB 비밀번호를 갖고 있습니다. 나중에 파일을 지워도 <b>커밋 히스토리</b>에 남아요.',
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
      more: [
        {
          title: '사고 대응 순서',
          list: [
            '① 유출된 값을 <b>즉시 교체</b>합니다. DB 비밀번호라면 새 비밀번호를 만들고 옛것을 폐기해요.',
            '② 그 값으로 접근한 기록이 있는지 DB · 클라우드의 접근 로그를 확인합니다.',
            '③ 히스토리에서 파일을 지웁니다(예: git filter-repo). 모든 클론과 포크에도 남아 있다는 점은 그대로입니다.',
            '④ 재발 방지: 커밋 전 시크릿 검사(pre-commit 훅, 저장소의 시크릿 스캐닝)를 켭니다.',
          ],
        },
        {
          title: 'Git에 두어도 되는 형태',
          rows: [
            ['평문 · base64 Secret', '절대 안 됨', 'bad'],
            ['ExternalSecret (참조만)', '값이 없으니 안전', 'ok'],
            ['Sealed Secrets', '클러스터 키로만 풀리는 암호문', 'ok'],
            ['SOPS 암호화 파일', 'KMS 등으로 암호화된 값', 'ok'],
          ],
        },
        {
          title: '직접 해보기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `# 히스토리 전체에서 Secret 매니페스트 찾기
$ git log --all --oneline -- '*secret*.yaml'
a1b2c3d add db secret

$ git show a1b2c3d:k8s/secret.yaml | grep -A1 data
data:
  DB_PASSWORD: czNjcjN0LXB3`,
          },
        },
      ],
    },
    {
      key: 'etcd 암호화', kind: 'solution', title: '클러스터 안: 저장 시 암호화와 RBAC',
      body: [
        'Secret은 API 서버를 거쳐 <b>etcd</b>에 저장됩니다. 쿠버네티스 기본 설정에서는 암호화 없이 들어가서, etcd 디스크나 백업을 손에 넣으면 모든 Secret을 읽을 수 있어요. <b>저장 시 암호화</b>를 켜면 API 서버가 etcd에 쓰기 전에 암호화하고, 그 키는 클라우드 KMS에 둘 수 있습니다.',
        '하지만 API로 조회하면 여전히 원래 값이 나옵니다. 그래서 <b>RBAC</b>으로 Secret을 읽을 수 있는 주체를 좁혀요.',
      ],
      callout: { type: 'cloud', text: 'EKS · AKS · GKE 모두 클라우드 KMS 키로 Secret을 암호화하는 설정이 있습니다. 키 계층 구조(봉투 암호화)는 시크릿과 암호화 레슨에서 자세히 봅니다.' },
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
      more: [
        {
          title: 'RBAC에서 놓치기 쉬운 것',
          list: [
            'Secret에 <code>list</code>나 <code>watch</code> 권한을 주면 이름만이 아니라 <b>값까지</b> 모두 받습니다. "목록만 보게" 하려고 list를 주는 것은 get을 주는 것과 같아요.',
            '그 네임스페이스에 <b>Pod를 만들 수 있는</b> 사람은 Secret을 마운트한 Pod를 띄워 값을 읽을 수 있습니다. Pod 생성 권한도 비밀값 권한으로 다루세요.',
            '<code>kubectl auth can-i get secrets --as=…</code>로 실제 권한을 확인합니다.',
          ],
        },
        {
          title: '설정 예시',
          body: ['자체 구축 클러스터에서는 API 서버에 암호화 설정 파일을 줍니다. 목록의 첫 번째 방식으로 새로 쓰고, 나머지는 옛 데이터를 읽을 때 씁니다.'],
          code: {
            title: 'encryption-config.yaml', lang: 'yaml',
            text: `apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources: [secrets]
    providers:
      - kms:
          apiVersion: v2
          name: cloud-kms
          endpoint: unix:///var/run/kms.sock
      - identity: {}       # 암호화 안 된 옛 데이터 읽기`,
          },
        },
        {
          title: '흔한 실수',
          body: ['암호화를 켠 뒤에도 <b>이미 저장된</b> Secret은 평문 그대로입니다. 한 번 모두 다시 써 줘야 새 방식으로 암호화돼요(예: <code>kubectl get secrets -A -o json | kubectl replace -f -</code>). 관리형 서비스는 이 과정을 대신해 주는지 문서를 확인하세요.'],
        },
      ],
    },
    {
      key: '외부 저장소', kind: 'solution', title: 'Git에는 참조만, 값은 저장소에',
      body: [
        '값의 원본은 클라우드의 <b>시크릿 저장소</b>에 두는 것이 일반적입니다. 접근 기록과 교체 기능이 거기 있으니까요. <b>External Secrets Operator</b>는 <code>ExternalSecret</code>에 적힌 대로 저장소에서 값을 읽어 Secret을 만들고, 주기적으로 다시 맞춥니다.',
        'Git에 올라가는 것은 "어느 저장소의 어떤 값"이라는 <b>참조</b>뿐이에요. 앱은 평소처럼 Secret을 환경 변수나 파일로 받습니다.',
      ],
      callout: { type: 'tip', text: '오퍼레이터가 저장소에 접근할 때 쓰는 자격 증명도 비밀입니다. 고정 키 대신 클라우드의 <b>워크로드 ID</b>(Pod에 클라우드 IAM 역할을 연결하는 기능)를 쓰세요.' },
      hide: ['dev', 'api', 'etcd', 'kms'],
      show: ['store', 'eso', 'sec', 'pod_p'],
      code: { ref: 'eso', hl: [7, 8, 9, 10, 15, 16, 17] },
      tags: [{ on: 'eso', text: '읽어서 Secret 생성', tone: 'accent', pos: 'bottom' }],
      flows: [
        { path: ['store', 'eso'], kind: 'data' },
        { path: ['eso', 'sec'], kind: 'data', delay: 1 },
        { path: ['sec', 'pod_p'], kind: 'data', delay: 2 },
      ],
      metrics: { sec: ['외부 저장소', 'ok'], rot: ['저장소에서 교체', 'ok'] },
      changes: [['+', 'ExternalSecret: 참조만 Git에'], ['~', 'Secret은 오퍼레이터가 생성 · 갱신'], ['-', 'Git 안의 비밀값']],
      more: [
        {
          title: '동작 원리',
          body: [
            '<code>SecretStore</code>(네임스페이스용)나 <code>ClusterSecretStore</code>(클러스터 전체용)에 "어느 저장소에, 어떤 자격 증명으로 접근하는가"를 적고, <code>ExternalSecret</code>마다 "그 저장소의 어떤 값을 어느 Secret의 어떤 키로"를 적습니다. 오퍼레이터는 <code>refreshInterval</code>마다 저장소를 다시 읽어, 값이 바뀌었으면 Secret을 고칩니다.',
            '결과물은 평범한 Secret이라 etcd에 저장됩니다. 그래서 앞 단계의 저장 시 암호화와 RBAC은 여전히 필요해요.',
          ],
        },
        {
          title: '출력 읽기',
          code: {
            title: 'terminal', lang: 'sh',
            text: `$ kubectl get externalsecret -n prod
NAME        STORE          REFRESH  STATUS        READY
api-secret  cloud-secrets  1h       SecretSynced  True

# 실패하면
api-secret  cloud-secrets  1h       SecretSyncedError  False
$ kubectl describe externalsecret api-secret -n prod
  Warning  UpdateFailed  … AccessDenied …`,
          },
        },
        {
          title: '흔한 실수',
          list: [
            '<code>READY False</code>를 보지 못한 채 배포합니다. Secret이 만들어지지 않아 Pod가 <code>CreateContainerConfigError</code>로 멈춰요.',
            '저장소 쪽 키 이름이나 JSON 속성(<code>property</code>) 오타. 오류 메시지에 찾지 못한 키가 나옵니다.',
            '<code>refreshInterval</code>을 너무 짧게 잡아 저장소 API 호출 비용과 한도 문제가 생깁니다.',
          ],
        },
      ],
    },
    {
      key: 'CSI · 비교', kind: 'compare', title: 'etcd를 거치지 않는 길과 네 클라우드',
      body: [
        '<b>Secrets Store CSI 드라이버</b>는 다른 길입니다. Pod가 뜰 때 저장소에서 값을 읽어 Pod에 <b>파일로 바로</b> 마운트해서, Secret 오브젝트를 만들지 않으면 etcd에 남지 않습니다.',
        '대신 Pod가 뜰 때마다 저장소에 접근할 수 있어야 하고, 환경 변수가 필요하면 결국 Secret으로 동기화해야 합니다. 저장소 이름은 클라우드마다 달라요.',
      ],
      callout: { type: 'tip', text: '앱이 환경 변수를 기대하면 External Secrets가, 값을 etcd에 두고 싶지 않으면 CSI 드라이버가 맞습니다.' },
      hide: ['eso', 'sec'],
      show: ['e_csi'],
      panel: {
        title: '클라우드의 시크릿 저장소', icon: 'lock',
        rows: [
          ['AWS', 'Secrets Manager', 'aws'],
          ['Azure', 'Key Vault', 'azure'],
          ['GCP', 'Secret Manager', 'gcp'],
          ['NCP', '키 · 시크릿 관리 서비스', 'ncp'],
        ],
      },
      tags: [{ on: 'pod_p', text: '/mnt/secrets (파일)', tone: 'ok', pos: 'bottom' }],
      flows: [{ path: ['store', 'pod_p'], kind: 'data', n: 2 }],
      metrics: { sec: ['저장소 → Pod', 'ok'] },
      more: [
        {
          title: '클라우드별로',
          rows: [
            ['AWS', 'Secrets Manager · Parameter Store, Pod에 IAM 역할 연결(EKS Pod Identity · IRSA)', 'aws'],
            ['Azure', 'Key Vault, AKS 워크로드 ID로 Entra ID 인증', 'azure'],
            ['GCP', 'Secret Manager, GKE 워크로드 ID 제휴', 'gcp'],
            ['NCP', '제공 서비스와 NKS 연동 방식은 문서 확인', 'ncp'],
          ],
        },
        {
          title: '설정 예시',
          body: ['CSI 드라이버는 <code>SecretProviderClass</code>에 가져올 값을 적고, Pod는 CSI 볼륨으로 그것을 마운트합니다(AWS 예시, 필드는 제공자마다 다름).'],
          code: {
            title: 'spc.yaml', lang: 'yaml',
            text: `apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: api-db
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: "prod/shop/db"
        objectType: "secretsmanager"
---
# Pod 템플릿 (일부)
volumes:
  - name: secrets
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: api-db`,
          },
        },
        {
          title: '흔한 실수',
          body: ['저장소 접근 권한이 없으면 볼륨을 붙이지 못해 Pod가 <code>ContainerCreating</code>에 머물고, 이벤트에 <code>FailedMount</code>가 남습니다. 워크로드 ID 연결(ServiceAccount와 클라우드 역할)과 저장소 쪽 접근 정책을 함께 확인하세요.'],
        },
      ],
    },
    {
      key: '교체 사고', kind: 'case', title: '사례: 비밀번호를 바꿨더니 몇 시간 뒤 장애',
      body: [
        '보안팀이 저장소에서 DB 비밀번호를 교체하고 옛 비밀번호를 바로 폐기했습니다. External Secrets는 한 시간 안에 Secret을 새 값으로 고쳤어요. 그런데 몇 시간 뒤부터 api가 DB 인증 실패를 쏟아냅니다.',
        'Pod는 비밀번호를 <b>환경 변수</b>로 받아 시작 때의 옛 값을 쥐고 있었고, 커넥션 풀이 새 연결을 맺는 순간부터 실패한 것입니다. Secret이 바뀐 것과 앱이 새 값을 쓰는 것은 별개예요.',
      ],
      callout: { type: 'tip', text: '교체는 <b>겹치게</b> 합니다. 새 값을 추가 → 모든 Pod가 새 값을 쓰는지 확인(롤아웃이나 파일 다시 읽기) → 그다음 옛 값을 폐기합니다.' },
      hide: ['e_csi'],
      show: ['eso', 'sec', 'db'],
      set: {
        pod_p: { state: 'hot', badge: '옛 비밀번호', tone: 'bad' },
        sec: { state: 'ok' },
      },
      tags: [
        { on: 'store', text: '새 값으로 교체', tone: 'accent', icon: 'refresh' },
        { on: 'db', text: '옛 값 폐기됨', tone: 'bad', pos: 'bottom' },
      ],
      flows: [
        { path: ['store', 'eso', 'sec'], kind: 'data' },
        { path: ['pod_p', 'db'], kind: 'bad', n: 3, delay: 1.2 },
      ],
      metrics: { rot: ['Pod는 옛 값', 'bad'] },
      changes: [['~', 'Secret: 새 값으로 갱신'], ['-', '실행 중인 Pod: 옛 값 그대로'], ['-', '옛 비밀번호를 너무 일찍 폐기']],
      more: [
        {
          title: '안전한 교체 순서',
          list: [
            '① DB에 새 비밀번호(또는 새 사용자)를 <b>추가</b>합니다. 옛 것도 아직 유효합니다.',
            '② 저장소의 값을 새것으로 바꾸고, Secret이 동기화됐는지 확인합니다.',
            '③ 앱이 새 값을 쓰게 합니다. 환경 변수라면 롤아웃, 파일이라면 앱의 다시 읽기를 확인합니다.',
            '④ 옛 값으로 맺은 연결이 없는지 본 뒤 옛 비밀번호를 폐기합니다.',
          ],
        },
        {
          title: '자동화 선택지',
          rows: [
            ['Reloader류 컨트롤러', 'Secret 변경 시 Deployment 자동 롤아웃', 'ok'],
            ['파일 마운트 + 앱 다시 읽기', '재시작 없이 새 값 사용', 'ok'],
            ['두 사용자 번갈아 교체', '저장소의 교체 기능으로 겹치는 기간 확보', 'info'],
            ['짧은 수명의 동적 자격 증명', '요청마다 발급 · 만료 (예: Vault)', 'info'],
          ],
        },
        {
          title: '확인 방법',
          code: {
            title: 'terminal', lang: 'sh',
            text: `# Secret이 언제 바뀌었나
$ kubectl get secret api-secret -n prod \\
    -o jsonpath='{.metadata.annotations}'

# Pod는 언제 시작했나 (그 전이면 옛 값)
$ kubectl get pods -l app=api \\
    -o custom-columns=NAME:.metadata.name,\\
START:.status.startTime`,
          },
        },
      ],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 이미지는 하나, 설정은 밖에서',
      body: [
        '환경마다 달라지는 값은 이미지 밖에 둡니다. 설정은 <b>ConfigMap</b>, 비밀값은 <b>Secret</b>에 담아 환경 변수나 파일로 주입하고, 환경 변수는 Pod를 다시 띄워야 바뀝니다. 설정 변경도 롤아웃으로 만드세요.',
        'Secret의 base64는 암호화가 아닙니다. 클러스터 안은 저장 시 암호화와 RBAC으로, 원본은 외부 저장소로 지키고, 교체는 겹치게 합니다. 다음 레슨에서는 Pod가 <b>어느 노드에 놓이고 언제 늘어나는지</b>를 봅니다.',
      ],
      hide: ['store', 'eso', 'db'],
      show: ['img', 'pod_d', 'cm_d', 'cm_p'],
      set: { pod_p: { state: null, badge: null }, sec: { state: null } },
      flows: [
        { path: ['img', 'pod_d'], kind: 'build' }, { path: ['img', 'pod_p'], kind: 'build', delay: 0.3 },
        { path: ['cm_d', 'pod_d'], kind: 'data', delay: 1.2 }, { path: ['cm_p', 'pod_p'], kind: 'data', delay: 1.5 },
        { path: ['sec', 'pod_p'], kind: 'data', delay: 1.8 },
      ],
      metrics: { chg: ['롤아웃으로', 'ok'], rot: ['겹치게 교체', 'ok'] },
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
      step: 6,
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
      step: 10,
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
      step: 2,
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
      step: 11,
      why: '저장 시 암호화는 etcd에 기록된 데이터를 지킵니다. 디스크나 백업을 얻어도 키 없이는 읽지 못해요. API 서버는 권한이 있는 요청에 복호화한 값을 돌려주므로 kubectl로 보는 것은 RBAC으로 막아야 하고, Git 커밋과 컨테이너 안의 환경 변수는 etcd와 무관합니다.',
    },
    {
      q: 'subPath로 /etc/nginx/nginx.conf 하나만 마운트했습니다. ConfigMap을 고치고 10분이 지났는데 컨테이너 안의 파일이 그대로입니다. 이유는?',
      options: [
        'kubelet의 동기화 주기가 1시간이라 더 기다려야 한다',
        'nginx가 파일을 잠가 두었다',
        'ConfigMap을 고친 뒤 kubectl apply를 두 번 해야 반영된다',
        'subPath 마운트는 갱신 대상이 아니다. 디렉터리로 마운트하거나 롤아웃으로 반영한다',
      ],
      answer: 3,
      step: 5,
      why: 'kubelet은 숨은 디렉터리에 새 내용을 쓰고 ..data 링크를 바꾸는 방식으로 갱신하는데, subPath는 파일 하나를 직접 끼워 넣은 것이라 이 교체를 받지 못합니다. 디렉터리째 마운트하거나, 설정 변경 시 롤아웃해 새 Pod가 새 파일을 받게 합니다.',
    },
    {
      q: '설정 변경이 장애로 이어질 때 Deployment 롤백 한 번으로 옛 설정까지 되돌리고 싶습니다. 가장 알맞은 방식은?',
      options: [
        '설정마다 버전을 붙인 새 ConfigMap(가능하면 immutable)을 만들고 Deployment가 새 이름을 가리키게 한다',
        '같은 ConfigMap을 kubectl edit로 고친다',
        '설정을 이미지에 다시 넣는다',
        'ConfigMap 수정 후 Pod를 하나씩 직접 지운다',
      ],
      answer: 0,
      step: 7,
      why: '이름에 버전이 붙으면 설정 변경이 Pod 템플릿 변경이 되어 롤아웃으로 나가고, 옛 ReplicaSet은 옛 ConfigMap을 가리키므로 롤백하면 설정도 함께 돌아갑니다. 같은 ConfigMap을 고치면 롤백해도 내용은 새 값 그대로입니다.',
    },
    {
      q: '앱이 오류가 나면 환경 변수 전체를 오류 보고 서비스로 보내는데, 거기에 DB 비밀번호가 찍혀 있었습니다. 구조적으로 가장 알맞은 개선은?',
      options: [
        'Secret 대신 ConfigMap에 비밀번호를 둔다',
        '비밀번호를 base64로 한 번 더 인코딩한다',
        '비밀값은 Secret 볼륨으로 파일에 마운트해 앱이 파일에서 읽게 하고, 오류 보고에서 민감한 값을 걸러 낸다',
        'Pod의 replicas를 줄여 노출 범위를 줄인다',
      ],
      answer: 2,
      step: 9,
      why: '환경 변수는 오류 보고, 자식 프로세스, 디버그 출력으로 쉽게 새어 나갑니다. 파일로 마운트하면 tmpfs에만 놓이고 권한을 좁힐 수 있으며 프로세스 환경에 섞이지 않습니다. base64는 보호가 아니고, ConfigMap은 Secret보다 권한 분리가 약합니다.',
    },
    {
      q: '운영팀이 개발자에게 "Secret 이름 목록만 보게" 하려고 secrets에 list 권한을 줬습니다. 무엇이 문제일까요?',
      options: [
        'list 응답에는 값까지 포함되므로 사실상 모든 Secret을 읽을 수 있게 된 것이다',
        'list만으로는 아무것도 볼 수 없어 쓸모가 없다',
        'list 권한은 Secret에는 적용되지 않는다',
        '문제없다. list는 이름만 돌려준다',
      ],
      answer: 0,
      step: 11,
      why: 'Secret의 list와 watch는 오브젝트 전체를 돌려주므로 값까지 받습니다. 이름만 보여 주는 권한은 따로 없습니다. 필요하면 다른 방법(예: 문서화, 이름만 노출하는 도구)으로 대신하고, Pod 생성 권한도 Secret을 읽을 수 있는 권한으로 다룹니다.',
    },
    {
      q: '팀은 GitOps로 모든 매니페스트를 Git에 둡니다. DB 비밀번호 원본은 AWS Secrets Manager에 있고, 앱은 환경 변수로 받기를 원합니다. 가장 알맞은 구성은?',
      options: [
        'secret.yaml을 base64로 Git에 둔다',
        'External Secrets Operator: Git에는 ExternalSecret(참조)만 두고, 오퍼레이터가 Secret을 만들어 주기적으로 맞춘다',
        '비밀번호를 ConfigMap에 넣는다',
        '배포할 때마다 사람이 kubectl create secret을 친다',
      ],
      answer: 1,
      step: 12,
      why: 'ExternalSecret에는 값이 아니라 위치만 있으므로 Git에 둬도 안전하고, 결과물이 평범한 Secret이라 환경 변수로 받을 수 있습니다. 손으로 만드는 방식은 기록이 남지 않고 환경마다 어긋나기 쉽습니다.',
    },
    {
      q: '보안 규정상 "비밀값이 쿠버네티스 etcd에 저장되면 안 된다"는 요구가 생겼습니다. 가장 알맞은 방식은?',
      options: [
        'External Secrets Operator로 Secret을 만든다',
        'Secret에 immutable: true를 붙인다',
        'Secrets Store CSI 드라이버로 저장소의 값을 Pod에 파일로 바로 마운트하고, Secret 동기화 기능은 쓰지 않는다',
        'Secret을 kube-system 네임스페이스에 둔다',
      ],
      answer: 2,
      step: 13,
      why: 'CSI 드라이버는 Pod가 뜰 때 저장소에서 값을 읽어 볼륨으로 마운트하므로 Secret 오브젝트를 거치지 않습니다. External Secrets는 결과물이 Secret이라 etcd에 저장되고, immutable이나 네임스페이스는 저장 위치를 바꾸지 않습니다. 단, Secret으로 동기화하는 옵션을 켜면 다시 etcd에 남습니다.',
    },
    {
      q: '저장소에서 DB 비밀번호를 교체하고 옛 값을 즉시 폐기했더니, 몇 시간 뒤 api가 DB 인증 실패를 냅니다. Secret은 이미 새 값입니다. 가장 알맞은 판단과 재발 방지책은?',
      options: [
        'External Secrets의 버그이니 오퍼레이터를 재설치한다',
        'DB가 고장 났으니 재시작한다',
        'Secret을 지웠다가 다시 만든다',
        'Pod가 환경 변수로 받은 옛 값을 쓰고 있었다. 새 값 추가 → Pod가 새 값을 쓰게 롤아웃 → 옛 값 폐기 순으로 겹치게 교체한다',
      ],
      answer: 3,
      step: 14,
      why: 'Secret이 바뀌어도 환경 변수로 받은 Pod는 시작 때 값을 그대로 쓰고, 커넥션 풀이 새 연결을 맺을 때 비로소 실패합니다. 오퍼레이터와 DB는 제 일을 했습니다. 교체는 새 값과 옛 값이 함께 유효한 기간을 두고, 앱이 새 값을 쓰는 것을 확인한 뒤 옛 값을 폐기해야 합니다.',
    },
    {
      q: 'CSI 드라이버로 시크릿을 마운트하는 Pod가 ContainerCreating에서 멈췄고 이벤트에 FailedMount와 AccessDenied가 보입니다. 먼저 확인할 것은?',
      options: [
        'Pod의 ServiceAccount에 연결된 클라우드 역할(워크로드 ID)과 저장소의 접근 정책',
        '앱의 로그',
        'Service의 셀렉터',
        '노드의 CPU 사용률',
      ],
      answer: 0,
      step: 13,
      why: '볼륨을 붙이는 단계에서 저장소 접근이 거절된 것이라 컨테이너는 아직 시작하지도 않았습니다. 앱 로그는 없고, Service나 CPU와는 무관합니다. ServiceAccount와 클라우드 IAM 역할의 연결, 그 역할이 해당 비밀값을 읽을 수 있는지를 확인합니다.',
    },
    {
      q: '새 Deployment를 적용했더니 Pod가 CreateContainerConfigError로 멈췄습니다. 이벤트에 configmap "api-config" not found가 보입니다. 가장 먼저 의심할 것은?',
      options: [
        '이미지가 손상됐다',
        'ConfigMap을 아직 만들지 않았거나, 이름 · 네임스페이스가 Pod와 다르다',
        '노드의 디스크가 가득 찼다',
        'kube-proxy가 멈췄다',
      ],
      answer: 1,
      step: 3,
      why: 'Pod는 같은 네임스페이스의 ConfigMap만 참조할 수 있고, 참조한 ConfigMap이 없으면 컨테이너를 만들지 못해 이 상태로 멈춥니다. ConfigMap을 먼저 적용하거나 이름과 네임스페이스를 맞추면 kubelet이 재시도해 시작합니다. 꼭 필요하지 않은 값이면 optional: true를 쓸 수 있습니다.',
    },
    {
      q: 'nginx 설정을 바꾸려고 ConfigMap을 /etc/nginx에 디렉터리째 마운트했더니 nginx가 mime.types를 찾지 못해 시작하지 않습니다. 가장 알맞은 조치는?',
      options: [
        '이미지를 다시 빌드해 mime.types를 지운다',
        'ConfigMap에 nginx의 모든 기본 파일을 복사해 넣는다',
        'readOnly: false로 바꾼다',
        '설정 전용 하위 디렉터리(예: /etc/nginx/conf.d)에 마운트하거나 필요한 파일만 subPath로 끼운다',
      ],
      answer: 3,
      step: 4,
      why: '볼륨은 마운트한 디렉터리 전체를 덮어 이미지의 원래 파일을 가립니다. 설정 전용 디렉터리에 마운트하면 원래 파일은 그대로 보입니다. subPath는 파일 하나만 끼울 수 있지만 ConfigMap 변경이 자동 반영되지 않는다는 점을 함께 알고 써야 합니다.',
    },
  ],
};
