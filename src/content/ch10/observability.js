export default {
  id: 'observability',
  learn: [
    '"느려요"만으로는 원인을 찾을 수 없는 이유와 세 가지 신호',
    'Prometheus의 scrape 모델, 메트릭 타입, PromQL',
    'RED · USE로 대시보드를 짜고 카디널리티를 지키기',
    '로그 수집(Loki · EFK)과 OpenTelemetry 트레이스',
    '알림 규칙 · Alertmanager 라우팅과 알림 피로',
    'SLI · SLO · 에러 버짓과 번 레이트 알림',
  ],
  legend: [['req', '사용자 요청'], ['ctrl', 'scrape · 질의 · 알림'], ['data', '메트릭 · 로그 · span'], ['bad', '쏟아지는 알림 · 폭주']],
  metrics: [
    { id: 'find', label: '원인 파악', icon: 'search' },
    { id: 'sig', label: '보는 신호', icon: 'activity' },
    { id: 'p99', label: '응답 p99', icon: 'timer' },
    { id: 'series', label: '활성 시계열', icon: 'chart-line' },
    { id: 'alerts', label: '하루 알림', icon: 'bell' },
  ],
  scene: {
    nodes: {
      // the shop: one request crosses three hops
      users: { kind: 'users', at: [-0.4, 3.4], label: '고객' },
      web: { at: [1.5, 1.5], label: '주문 API', icon: 'server', color: 'blue' },
      pay: { at: [3.3, -0.3], label: '결제 API', icon: 'card', color: 'blue' },
      db: { kind: 'cyl', at: [5.0, -2.0], label: 'DB', icon: 'database', color: 'purple' },
      // the three signals a service gives off
      sigM: { kind: 'tile', at: [3.5, 2.9], label: '메트릭', icon: 'chart-line', color: 'orange' },
      sigL: { kind: 'tile', at: [5.0, 1.4], label: '로그', icon: 'scroll', color: 'yellow' },
      sigT: { kind: 'tile', at: [6.5, -0.1], label: '트레이스', icon: 'route', color: 'teal' },
      // where the signals are kept
      prom: { at: [3.9, 3.9], label: 'Prometheus', sub: '메트릭', icon: 'flame', color: 'orange' },
      loki: { at: [5.7, 2.1], label: 'Loki', sub: '로그', icon: 'scroll', color: 'yellow' },
      otel: { at: [7.5, 0.3], label: 'OTel\nCollector', sub: '트레이스', icon: 'route', color: 'teal' },
      graf: { at: [8.0, 4.4], label: 'Grafana', sub: '대시보드', icon: 'chart-bar', color: 'purple' },
      eng: { kind: 'client', at: [10.6, 3.6], label: '엔지니어' },
      am: { at: [2.0, 5.8], label: 'Alert\nmanager', icon: 'bell', color: 'red' },
      oncall: { kind: 'client', at: [4.2, 8.0], label: '당직자' },
      // compare
      neutral: { at: [3.9, 2.1], label: 'Grafana', sub: '+ Prometheus', icon: 'chart-bar', color: 'purple' },
      aws: { at: [4.2, 7.8], label: 'AWS', icon: 'cloud', color: 'aws' },
      azure: { at: [6.0, 6.0], label: 'Azure', icon: 'cloud', color: 'azure' },
      gcp: { at: [7.8, 4.2], label: 'GCP', icon: 'cloud', color: 'gcp' },
      ncp: { at: [9.6, 2.4], label: 'NCP', icon: 'cloud', color: 'ncp' },
    },
    edges: {
      e_uw: { from: 'users', to: 'web' },
      e_wp: { from: 'web', to: 'pay' },
      e_pd: { from: 'pay', to: 'db' },
      e_m: { from: 'pay', to: 'sigM', style: 'dashed' },
      e_l: { from: 'pay', to: 'sigL', style: 'dashed' },
      e_t: { from: 'pay', to: 'sigT', style: 'dashed' },
      e_sw: { from: 'prom', to: 'web', style: 'dashed' },
      e_sp: { from: 'prom', to: 'pay', style: 'dashed' },
      e_sd: { from: 'prom', to: 'db', style: 'dashed' },
      e_wl: { from: 'web', to: 'loki', style: 'dashed' },
      e_pl: { from: 'pay', to: 'loki', style: 'dashed' },
      e_wo: { from: 'web', to: 'otel', style: 'dashed' },
      e_po: { from: 'pay', to: 'otel', style: 'dashed' },
      e_gp: { from: 'graf', to: 'prom' },
      e_gl: { from: 'graf', to: 'loki' },
      e_go: { from: 'graf', to: 'otel' },
      e_eg: { from: 'eng', to: 'graf' },
      e_pa: { from: 'prom', to: 'am' },
      e_ao: { from: 'am', to: 'oncall' },
      e_n1: { from: 'aws', to: 'neutral' },
      e_n2: { from: 'azure', to: 'neutral' },
      e_n3: { from: 'gcp', to: 'neutral' },
      e_n4: { from: 'ncp', to: 'neutral' },
    },
  },
  steps: [
    // 1
    {
      key: '느려요', kind: 'problem', title: '"느려요" 한마디로는 원인을 못 찾습니다',
      body: [
        'shop.example 고객센터에 "결제가 느려요"라는 제보가 들어옵니다. 요청은 <b>주문 API → 결제 API → DB</b>를 차례로 거치는데, 셋 중 어디가 느린지 알려 주는 것은 아무것도 없습니다.',
        '엔지니어는 서버마다 SSH로 들어가 <code>top</code>을 보고 로그 파일을 뒤집니다. Pod가 수십 개이고 수시로 재시작되는 환경에서는 통하지 않는 방법이에요. 들어가 볼 서버가 이미 사라졌을 수도 있습니다.',
      ],
      callout: { type: 'key', text: '<b>관측 가능성(observability)</b>은 시스템이 밖으로 내보내는 신호만으로 안에서 벌어지는 일을 설명할 수 있는 정도입니다. "서버가 떠 있나"만 보는 모니터링보다 넓은 개념이에요.' },
      more: [
        { title: '모니터링과 무엇이 다른가', body: [
          '전통적인 <b>모니터링</b>은 미리 아는 질문에 답합니다. "CPU가 90%를 넘었나", "디스크가 찼나"처럼 무엇이 고장 날지 예상하고 그 지점에 계기판을 다는 방식이에요. 서버 몇 대짜리 시스템에서는 이것으로 충분했습니다.',
          '마이크로서비스에서는 고장이 <b>예상하지 못한 조합</b>으로 옵니다. 특정 카드사 결제만, 특정 AZ의 Pod만, 새 버전을 받은 10%의 사용자만 느린 식이죠. 관측 가능성은 이런 <b>처음 보는 질문</b>도 코드를 고쳐 배포하지 않고 이미 모아 둔 신호로 답할 수 있게 하는 것을 목표로 합니다.',
        ] },
        { title: 'SSH 방식의 한계', list: [
          'Pod는 재시작되면 <b>파일 시스템이 사라집니다</b>. 원인이 담긴 로그가 장애와 함께 지워져요.',
          '같은 서비스가 Pod 30개로 나뉘어 있으면, 문제의 요청이 <b>어느 Pod를 지났는지</b>부터 알 수 없습니다.',
          '관리형 DB · 로드 밸런서처럼 <b>들어갈 수 없는</b> 구성 요소가 늘었습니다. 이들은 사업자가 내주는 메트릭과 로그로만 보입니다.',
          '운영 서버 SSH 권한 자체가 보안 위험입니다. 권한은 줄이고 관측은 늘리는 쪽이 맞아요.',
        ] },
        { title: '실무 팁', body: [
          '장애 대응에서 시간이 가장 많이 드는 구간은 고치는 시간이 아니라 <b>어디가 문제인지 찾는 시간</b>입니다. 이 레슨의 숫자 타일 중 "원인 파악"이 단계마다 어떻게 줄어드는지 따라가 보세요. 각 도구가 그 시간을 얼마나 깎는지가 곧 그 도구의 가치입니다.',
        ] },
      ],
      show: ['users', 'web', 'pay', 'db'],
      tags: [{ on: 'users', text: '"결제가 느려요"', tone: 'bad' }, { on: 'pay', text: '어디가 느린가?', tone: 'warn', icon: 'help' }],
      flows: [{ path: ['users', 'web', 'pay', 'db'], kind: 'req', n: 3, dur: 3.6 }],
      metrics: { find: ['몇 시간', 'bad'], sig: ['없음', 'bad'], p99: ['4.1초', 'bad'], series: '0', alerts: '0건' },
    },
    // 2
    {
      key: '세 가지 신호', kind: 'concept', title: '신호는 세 가지: 메트릭·로그·트레이스',
      body: [
        '<b>메트릭</b>은 시간에 따라 변하는 <b>숫자</b>입니다. 초당 요청 수, 에러율, 응답 시간처럼요. 작고 싸서 오래 보관하고 알림을 걸기 좋지만, "왜"는 알려 주지 않습니다.',
        '<b>로그</b>는 사건 하나하나를 적은 <b>기록</b>이라 원인이 담겨 있습니다. <b>트레이스</b>는 요청 하나가 서비스들을 거쳐 간 <b>경로와 구간별 시간</b>입니다. 둘은 자세한 만큼 양이 많고 비쌉니다.',
      ],
      callout: { type: 'tip', text: '보는 순서도 대개 이렇습니다. 메트릭으로 <b>이상을 알아채고</b>, 트레이스로 <b>어느 구간인지</b> 좁히고, 로그로 <b>이유</b>를 확인합니다.' },
      more: [
        { title: '비용과 정보량의 저울', rows: [
          ['메트릭', '요청 100만 건도 숫자 몇 개 · 가장 쌈', 'warn'],
          ['로그', '요청마다 한 줄 이상 · GB 단위로 쌓임', 'info'],
          ['트레이스', '요청마다 span 여러 개 · 보통 일부만 샘플링', 'accent'],
        ] },
        { title: '동작 원리', body: [
          '메트릭은 이벤트를 <b>미리 합쳐서</b> 저장합니다. 결제가 초당 500건 일어나도 Prometheus에는 "누적 요청 수" 숫자 하나가 15초마다 기록될 뿐이에요. 그래서 1년 치를 보관해도 부담이 작고, 질의도 빠릅니다. 대신 합치는 순간 개별 요청의 정보(어느 고객, 어느 주문)는 버려집니다.',
          '로그와 트레이스는 <b>이벤트 하나하나</b>를 남깁니다. 그래서 "주문 8812번이 왜 실패했나"에 답할 수 있지만, 양이 트래픽에 비례해 늘어요. 보관 기간을 메트릭보다 짧게 잡고, 트레이스는 일부만 남기는 이유입니다.',
        ] },
        { title: '네 번째 신호들', list: [
          '<b>프로파일</b>: 함수별 CPU · 메모리 사용을 계속 표본 추출합니다(Pyroscope 등). "어느 코드 줄이 CPU를 먹나"에 답해요.',
          '<b>이벤트</b>: 배포, 설정 변경, 스케일 아웃 같은 변화 기록입니다. 그래프에 배포 시점을 겹쳐 보면 원인의 절반이 보입니다.',
          '세 신호는 따로 있을 때보다 <b>서로 이어질 때</b> 강해집니다. 로그 줄에 trace ID를 넣는 법은 트레이스 단계에서 봅니다.',
        ] },
      ],
      show: ['sigM', 'sigL', 'sigT'],
      panel: { title: '세 신호가 답하는 질문', icon: 'activity', rows: [['메트릭 · 숫자', '무슨 일이, 얼마나?', 'warn'], ['로그 · 기록', '왜 그랬나?', 'info'], ['트레이스 · 경로', '어느 구간에서?', 'accent']] },
      flows: [{ path: ['pay', 'sigM'], kind: 'data' }, { path: ['pay', 'sigL'], kind: 'data', delay: 0.3 }, { path: ['pay', 'sigT'], kind: 'data', delay: 0.6 }],
    },
    // 3
    {
      key: 'Prometheus', kind: 'solution', title: 'Prometheus는 메트릭을 긁어 갑니다',
      body: [
        '<b>Prometheus</b>는 메트릭 수집의 사실상 표준입니다. 각 서비스는 현재 수치를 <code>/metrics</code>라는 HTTP 주소에 텍스트로 내놓기만 하고, Prometheus가 주기적으로 찾아가 읽어 옵니다. 이것이 <b>scrape</b>(pull 방식)입니다.',
        '읽어 온 값은 이름에 <b>레이블</b>이 붙은 시계열로 쌓입니다. DB처럼 <code>/metrics</code>가 없는 대상은 <b>exporter</b>라는 작은 프로그램이 옆에서 대신 내놓아요.',
      ],
      callout: { type: 'key', text: 'pull 방식에서는 <b>scrape 실패 자체가 신호</b>입니다. 대상이 죽으면 <code>up</code> 값이 0이 되어, 조용한 것과 죽은 것을 구분할 수 있습니다.' },
      more: [
        { title: '설정 예시', body: ['scrape 대상은 고정 주소로 적을 수도 있지만, 쿠버네티스에서는 API에서 Pod 목록을 받아 자동으로 찾습니다(service discovery).'], code: { title: 'prometheus.yml', lang: 'yaml', text: `global:
  scrape_interval: 15s      # 기본값은 1m
  evaluation_interval: 15s  # 알림 규칙 평가 주기
scrape_configs:
  - job_name: pay
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      # app=pay 레이블이 붙은 Pod만 남긴다
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: pay
        action: keep
  - job_name: postgres
    static_configs:
      - targets: ['pg-exporter:9187']` } },
        { title: '출력 읽기', body: [
          'Prometheus는 대상마다 자기 상태도 시계열로 남깁니다. <code>up{job="pay"}</code>이 1이면 마지막 scrape 성공, 0이면 실패예요. <code>scrape_duration_seconds</code>가 scrape 간격에 가까워지면 대상이 너무 많은 시계열을 내놓고 있다는 뜻이고, <code>scrape_samples_scraped</code>로 대상별 시계열 수를 볼 수 있습니다. 웹 UI의 <b>Status → Targets</b> 화면에는 대상마다 마지막 오류 메시지가 나옵니다.',
        ] },
        { title: '기본값과 한계', list: [
          '로컬 저장소의 기본 보관 기간은 <b>15일</b>입니다(<code>--storage.tsdb.retention.time</code>). 더 오래, 여러 클러스터를 합쳐 보려면 <code>remote_write</code>로 Thanos · Mimir나 관리형 Prometheus에 보냅니다.',
          '몇 초 만에 끝나는 배치 작업은 scrape 전에 사라집니다. 이런 것은 <b>Pushgateway</b>에 결과를 밀어 넣고 Prometheus가 그곳을 긁어 가요.',
          'Prometheus Operator를 쓰면 scrape 설정 대신 <code>ServiceMonitor</code> · <code>PodMonitor</code> 리소스를 앱 매니페스트 옆에 둡니다.',
        ] },
      ],
      hide: ['users', 'sigM', 'sigL', 'sigT'],
      show: ['prom'],
      focus: ['prom'],
      tags: [{ on: 'prom', text: '15초마다 scrape', icon: 'repeat', pos: 'left' }, { on: 'web', text: '/metrics' }, { on: 'db', text: 'exporter' }],
      flows: [
        { path: ['prom', 'web'], kind: 'ctrl' }, { path: ['prom', 'pay'], kind: 'ctrl' }, { path: ['prom', 'db'], kind: 'ctrl' },
        { path: ['web', 'prom'], kind: 'data', delay: 1.3 }, { path: ['pay', 'prom'], kind: 'data', delay: 1.3 }, { path: ['db', 'prom'], kind: 'data', delay: 1.6 },
      ],
      metrics: { sig: '메트릭', find: '1시간', series: '2만' },
      changes: [['+', 'Prometheus와 /metrics'], ['~', '보는 신호: 없음 → 메트릭']],
    },
    // 4
    {
      key: '메트릭 타입', kind: 'concept', title: '/metrics 안에는 세 종류의 숫자',
      body: [
        '<b>counter</b>는 늘어나기만 하는 누적값(요청 수, 에러 수), <b>gauge</b>는 오르내리는 현재값(처리 중인 요청, 메모리)입니다. 프로세스가 재시작되면 counter는 0부터 다시 셉니다.',
        '<b>histogram</b>은 응답 시간을 구간(<code>le</code>, 이하)별 누적 개수로 셉니다. 0.1초 이하 몇 건, 0.5초 이하 몇 건 하는 식이라, 나중에 이 버킷들로 p99를 계산할 수 있어요.',
      ],
      callout: { type: 'tip', text: 'counter의 <b>현재값 자체는 의미가 없습니다</b>. 18231이라는 숫자보다 "1초에 몇씩 늘고 있나"가 중요하고, 그것을 다음 단계의 <code>rate()</code>가 계산합니다.' },
      more: [
        { title: '출력 읽기', body: [
          '오른쪽 출력에서 <code># TYPE</code> 줄이 타입을 알려 줍니다. histogram 하나는 시계열 여러 개로 펼쳐져요. 버킷마다 <code>_bucket{le="…"}</code>, 그리고 전체 합 <code>_sum</code>과 개수 <code>_count</code>입니다. 버킷은 <b>누적</b>이라 <code>le="+Inf"</code>는 언제나 <code>_count</code>와 같습니다. 위 예시에서 18,273건 중 15,022건(약 82%)이 0.1초 안에 끝났고, 263건은 1초를 넘었습니다.',
          '<code>_sum / _count</code>는 평균 응답 시간입니다. 둘 다 counter라서 그대로 나누지 말고 <code>rate(_sum[5m]) / rate(_count[5m])</code>처럼 최근 구간으로 나눠야 지금의 평균이 나와요.',
        ] },
        { title: '이름 짓기 규칙', list: [
          '단위를 이름 끝에: <code>_seconds</code>, <code>_bytes</code>. 밀리초보다 <b>초</b>를 기본 단위로 씁니다.',
          'counter는 <code>_total</code>로 끝냅니다. 이름만 보고도 <code>rate()</code>를 씌울 대상인지 압니다.',
          '같은 것을 세는 시계열은 이름 하나에 <b>레이블</b>로 나눕니다. <code>pay_500_total</code>, <code>pay_200_total</code>이 아니라 <code>http_requests_total{code="500"}</code>.',
        ] },
        { title: '흔한 실수', body: [
          '버킷 경계를 서비스에 맞추지 않으면 p99가 뭉개집니다. 기본 버킷이 0.5초와 1초 사이에 아무것도 없는데 SLO가 "0.8초 이내"라면, 계산된 p99는 그 사이 어딘가를 직선으로 짐작한 값일 뿐이에요. <b>SLO 경계값을 버킷 경계로</b> 꼭 넣으세요. 버킷 하나하나가 별도 시계열이라 너무 잘게 나누는 것도 비용입니다.',
        ] },
      ],
      hide: ['web', 'db'],
      focus: ['pay'],
      code: {
        title: 'GET /metrics (결제 API)', lang: 'text', hl: [2, 6, 7, 10],
        text: `# HELP http_requests_total 처리한 요청 수
# TYPE http_requests_total counter
http_requests_total{code="200"} 18231
http_requests_total{code="500"} 42
# TYPE inflight_requests gauge
inflight_requests 7
# TYPE http_request_duration_seconds histogram
..._seconds_bucket{le="0.1"} 15022
..._seconds_bucket{le="0.5"} 17890
..._seconds_bucket{le="1"} 18010
..._seconds_bucket{le="+Inf"} 18273
..._seconds_sum 2931.4
..._seconds_count 18273`,
      },
      tags: [{ on: 'pay', text: '타입 세 가지', pos: 'top' }],
      flows: [{ path: ['prom', 'pay'], kind: 'ctrl' }, { path: ['pay', 'prom'], kind: 'data', delay: 1.2 }],
      changes: [['+', '요청 수 counter'], ['+', '응답 시간 histogram']],
    },
    // 5
    {
      key: 'PromQL', kind: 'concept', title: 'PromQL로 묻고 Grafana로 봅니다',
      body: [
        '쌓인 시계열은 <b>PromQL</b>로 질의합니다. <code>rate(…[5m])</code>은 counter를 최근 5분의 <b>초당 증가율</b>로 바꿉니다. 5xx 요청의 rate를 전체 rate로 나누면 에러율이 돼요.',
        '응답 시간은 평균이 아니라 <b>p99</b>(가장 느린 1%의 경계)를 봅니다. 평균은 일부 고객이 겪는 4초를 가려 버리거든요. <b>Grafana</b>는 이런 질의를 그래프로 그려 대시보드로 묶습니다.',
      ],
      callout: { type: 'key', text: '<code>rate()</code>는 재시작으로 counter가 0으로 떨어진 것을 알아채고 보정합니다. counter에는 언제나 <code>rate()</code>나 <code>increase()</code>를 먼저 씌우세요.' },
      more: [
        { title: '자주 쓰는 질의', code: { title: 'PromQL', lang: 'text', text: `# 서비스별 초당 요청 수
sum by (app) (rate(http_requests_total[5m]))

# 지난 1시간 동안 늘어난 5xx 개수
increase(http_requests_total{code=~"5.."}[1h])

# 지금 죽어 있는 scrape 대상
up == 0

# 요청이 가장 많은 Pod 5개
topk(5, sum by (pod) (rate(http_requests_total[5m])))

# 평균 응답 시간 (histogram의 sum / count)
rate(http_request_duration_seconds_sum[5m])
/ rate(http_request_duration_seconds_count[5m])` } },
        { title: '동작 원리', body: [
          '<code>[5m]</code>은 <b>범위 벡터</b>, 즉 시계열마다 최근 5분의 점들을 묶은 것입니다. <code>rate</code>는 그 구간의 처음과 끝의 차이를 시간으로 나눠요. 구간이 scrape 간격에 비해 너무 짧으면 점이 한두 개뿐이라 값이 비거나 튀니, <b>scrape 간격의 4배 이상</b>으로 잡는 것이 안전합니다.',
          '<code>sum by (le)</code>가 histogram_quantile에 꼭 필요한 이유는, Pod마다 따로 있는 버킷을 <b>버킷 경계별로 먼저 합쳐야</b> 서비스 전체의 분포가 되기 때문입니다. <code>le</code>를 빼고 합치면 경계 정보가 사라져 계산할 수 없어요.',
        ] },
        { title: '흔한 실수', list: [
          'Pod별 p99를 먼저 구한 뒤 평균 내기. 백분위수는 평균 낼 수 없습니다. <b>버킷을 합친 뒤</b> 한 번만 계산하세요.',
          'counter에 <code>rate</code> 없이 <code>sum</code>만 씌우기. 재시작 때마다 그래프가 절벽처럼 떨어집니다.',
          '대시보드 질의를 너무 긴 구간(<code>[1h]</code>)으로 잡아 장애가 그래프에 늦게 나타나는 것.',
        ] },
      ],
      hide: ['pay'],
      show: ['graf', 'eng'],
      code: {
        title: 'PromQL', lang: 'text', hl: [2, 3, 4],
        text: `# 5xx 에러율 (최근 5분 기준)
sum(rate(
 http_requests_total{code=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))

# p99 응답 시간 (히스토그램에서 계산)
histogram_quantile(0.99,
 sum by (le) (rate(
 http_request_duration_seconds_bucket[5m]
 )))`,
      },
      tags: [{ on: 'graf', text: '결제 API p99 4.1초', tone: 'bad' }],
      flows: [{ path: ['eng', 'graf', 'prom'], kind: 'ctrl' }, { path: ['prom', 'graf', 'eng'], kind: 'data', delay: 1.6 }],
      metrics: { find: '30분' },
      changes: [['+', 'Grafana 대시보드'], ['~', '느린 곳이 결제 API임을 확인']],
    },
    // 6
    {
      key: 'RED · USE', kind: 'concept', title: '대시보드는 RED와 USE로 짭니다',
      body: [
        '그래프를 아무렇게나 늘어놓으면 장애 때 볼 곳을 못 찾습니다. 요청을 받는 <b>서비스</b>는 <b>RED</b>로 봅니다. Rate(초당 요청), Errors(에러율), Duration(응답 시간 분포)이에요.',
        'CPU · 디스크 · 커넥션 풀 같은 <b>자원</b>은 <b>USE</b>로 봅니다. Utilization(사용률), Saturation(포화: 대기열에 밀린 정도), Errors(자원 오류)입니다. 서비스가 느리면 RED에서 증상을, USE에서 원인 자원을 찾아요.',
      ],
      callout: { type: 'tip', text: '포화는 사용률보다 먼저 봐야 할 때가 많습니다. CPU 60%여도 DB 커넥션 풀이 꽉 차 대기열이 쌓이면 응답은 느려집니다.' },
      more: [
        { title: '동작 원리', body: [
          'RED는 "사용자가 무엇을 겪고 있나"를, USE는 "기계가 얼마나 버거워하나"를 봅니다. 둘을 같은 화면 위아래에 두면 장애 때 시선이 자연스럽게 증상 → 원인으로 내려가요. 결제 API의 Duration이 튀는데 결제 API의 CPU는 한가하고 DB 커넥션 풀의 대기 수가 치솟는다면, 볼 곳은 DB입니다.',
          'Google SRE의 <b>네 가지 골든 시그널</b>(지연 · 트래픽 · 에러 · 포화)도 같은 생각입니다. RED에 포화를 더한 것이라고 보면 돼요.',
        ] },
        { title: '설정 예시: 서비스 대시보드 한 장', rows: [
          ['1행 · Rate', 'sum by (app) (rate(…_total[5m]))', 'info'],
          ['1행 · Errors', '5xx rate / 전체 rate', 'bad'],
          ['1행 · Duration', 'p50 · p90 · p99 세 줄', 'warn'],
          ['2행 · USE', 'CPU · 메모리 · 커넥션 풀 대기', 'accent'],
          ['3행 · 이벤트', '배포 시점 주석(annotation)', 'mute'],
        ] },
        { title: '실무 팁', list: [
          '대시보드를 서비스마다 손으로 만들지 말고 <b>템플릿 변수</b>(<code>$app</code>, <code>$namespace</code>)로 한 장을 만들어 고르게 합니다.',
          '대시보드도 코드로 관리합니다. JSON을 Git에 두거나 Grafana의 프로비저닝 · Terraform 프로바이더로 배포하면 클러스터를 새로 만들어도 그대로 살아나요.',
          '"보기 좋은" 그래프보다 <b>장애 때 3초 안에 읽히는</b> 그래프가 좋습니다. 패널마다 정상 범위를 선이나 색으로 표시하세요.',
        ] },
      ],
      hide: ['eng'],
      show: ['pay', 'db'],
      panel: { title: '무엇을 무엇으로 보나', icon: 'gauge', rows: [['서비스 · RED', '요청 수 · 에러율 · 응답 시간', 'info'], ['자원 · USE', '사용률 · 포화 · 오류', 'accent'], ['결제 API', 'Duration p99 4.1초', 'bad'], ['DB 커넥션 풀', '포화: 대기 120건', 'bad']] },
      tags: [{ on: 'pay', text: 'RED: 느림', tone: 'bad' }, { on: 'db', text: 'USE: 포화', tone: 'bad', pos: 'right' }],
      flows: [{ path: ['prom', 'pay'], kind: 'ctrl' }, { path: ['prom', 'db'], kind: 'ctrl', delay: 0.3 }, { path: ['prom', 'graf'], kind: 'data', delay: 1.3 }],
      metrics: { find: '20분' },
      changes: [['+', '서비스 RED 행'], ['+', '자원 USE 행'], ['~', '의심 구간: DB 쪽']],
    },
    // 7
    {
      key: '카디널리티', kind: 'case', title: '사례: 레이블 하나에 Prometheus가 죽다',
      body: [
        '고객별로 보고 싶어진 개발자가 결제 메트릭에 <code>user_id</code> 레이블을 붙여 배포했습니다. 레이블 값 조합 하나가 시계열 하나라서, 고객 수만큼 시계열이 곱해졌어요. 활성 시계열이 2만에서 180만으로 뛰었습니다.',
        'Prometheus는 메모리가 차서 재시작을 반복했고, 그동안 <b>모든 대시보드와 알림이 멈췄습니다</b>. 고친 방법은 레이블을 빼고 다시 배포한 것, 그리고 대상별 <code>sample_limit</code>을 걸어 한 서비스가 전체를 쓰러뜨리지 못하게 한 것입니다.',
      ],
      callout: { type: 'warn', text: '<b>카디널리티</b>는 시계열의 개수입니다. 사용자 ID, 주문 번호, 전체 URL처럼 값이 끝없이 늘어나는 것은 레이블이 아니라 <b>로그나 트레이스</b>에 넣으세요.' },
      more: [
        { title: '계산해 보기', body: [
          '시계열 수는 레이블 값 개수의 <b>곱</b>입니다. 응답 시간 histogram 하나가 버킷 12개 + sum + count = 14개 시계열이고, 여기에 엔드포인트 10개 × 상태 코드 5종 × Pod 20개를 곱하면 14,000개예요. 여기에 고객 1만 명을 곱하면 <b>1억 4천만</b>이 됩니다. 시계열마다 메모리를 차지하니 어떤 장비도 버티지 못해요.',
        ] },
        { title: '직접 해보기', body: ['어떤 메트릭이 시계열을 많이 쓰는지 먼저 찾습니다. 웹 UI의 Status → TSDB Status 화면에도 같은 순위가 나옵니다.'], code: { title: 'PromQL', lang: 'text', text: `# 시계열이 가장 많은 메트릭 이름 10개
topk(10, count by (__name__) ({__name__=~".+"}))

# 그 메트릭에서 값이 가장 많은 레이블 찾기
count(count by (user_id)
  (pay_request_duration_seconds_bucket))

# 대상별로 scrape한 시계열 수
sort_desc(scrape_samples_scraped)` } },
        { title: '막는 설정', code: { title: 'prometheus.yml', lang: 'yaml', text: `  - job_name: pay
    sample_limit: 50000   # 넘으면 이 대상 scrape 실패
    metric_relabel_configs:
      - action: labeldrop  # 들어오기 전에 레이블 삭제
        regex: user_id` } },
        { title: '흔한 실수', list: [
          '전체 URL(<code>/orders/8812</code>)을 레이블로 쓰기. 경로 템플릿(<code>/orders/:id</code>)으로 바꿔야 합니다.',
          '에러 메시지 원문을 레이블에 넣기. 메시지가 조금만 달라도 새 시계열이 생겨요.',
          '"고객별 지표"가 정말 필요하면 메트릭이 아니라 로그 집계나 분석용 저장소에서 계산합니다.',
        ] },
      ],
      show: ['web'],
      set: { prom: { state: 'hot', badge: '메모리 부족', tone: 'bad' } },
      focus: ['prom'],
      tags: [{ on: 'pay', text: 'label: user_id', tone: 'bad', icon: 'tag' }, { on: 'prom', text: '재시작 반복', tone: 'bad', pos: 'left' }],
      flows: [{ path: ['pay', 'prom'], kind: 'bad', n: 6, gap: 0.2 }, { path: ['web', 'prom'], kind: 'data', delay: 0.4 }],
      metrics: { series: ['180만', 'bad'], find: ['깜깜', 'bad'] },
      changes: [['+', 'user_id 레이블 배포'], ['~', '활성 시계열 2만 → 180만'], ['-', '대시보드 · 알림 전부 정지']],
    },
    // 8
    {
      key: '로그 수집', kind: 'solution', title: '로그는 한곳에 모아서 검색합니다',
      body: [
        '레이블을 되돌려 Prometheus가 살아났습니다. 이제 DB가 왜 밀리는지 볼 차례예요. 컨테이너는 로그를 <b>stdout</b>으로 내보내고, 노드마다 하나씩 뜬 <b>수집 에이전트</b>(Alloy, Fluent Bit)가 이것을 읽어 중앙 저장소로 보냅니다. Pod가 사라져도 로그는 남아요.',
        '<b>Loki</b>는 본문을 압축해 두고 레이블만 색인해서 저렴합니다. <b>EFK</b>(Fluent Bit → Elasticsearch → Kibana)는 본문 전체를 색인해 검색이 강력한 대신 저장소와 메모리가 많이 듭니다.',
      ],
      callout: { type: 'tip', text: '로그는 한 줄짜리 <b>JSON</b>(구조화 로그)으로 남기세요. <code>level</code>·<code>trace_id</code> 같은 필드로 걸러 볼 수 있습니다. 비밀번호와 개인정보는 애초에 찍지 않습니다.' },
      more: [
        { title: '동작 원리', body: [
          '쿠버네티스에서 컨테이너의 stdout은 노드의 <code>/var/log/pods/</code> 아래 파일로 쓰이고, kubelet이 크기 기준으로 돌려 가며(rotate) 지웁니다. 에이전트는 <b>DaemonSet</b>으로 노드마다 하나씩 떠서 이 파일을 tail 하고, 파일 경로에서 namespace · Pod · 컨테이너 이름을 뽑아 레이블로 붙여 보냅니다. 에이전트가 읽기 전에 파일이 돌려지면 그 로그는 사라지니, 에이전트가 밀리지 않는지도 지켜봐야 해요.',
        ] },
        { title: '직접 해보기: LogQL', body: ['Loki는 레이블로 먼저 좁힌 뒤, 본문을 줄 단위로 걸러 냅니다. 레이블 선택이 좁을수록 빠르고 쌉니다.'], code: { title: 'LogQL', lang: 'text', text: `# 결제 API에서 timeout이 들어간 줄
{namespace="shop", app="pay"} |= "timeout"

# JSON을 풀어서 level=error만
{app="pay"} | json | level="error"

# 로그로 메트릭 만들기: 5분마다 에러 줄 수
sum by (app) (
  count_over_time({app="pay"} |= "ERROR" [5m]))` } },
        { title: 'Loki와 EFK 고르기', rows: [
          ['Loki', '레이블만 색인 · 싸다 · 레이블로 먼저 좁혀야 함', 'ok'],
          ['EFK', '본문 전체 색인 · 자유 검색 · 클러스터 운영 부담', 'info'],
          ['공통 함정', '레이블에 고유값(요청 ID)을 넣으면 Loki도 폭발', 'bad'],
        ] },
        { title: '실무 팁', list: [
          '보관 기간을 등급별로 나눕니다. 디버그 로그는 며칠, 감사 로그는 규정에 맞춰 1년 이상, 오래된 것은 오브젝트 스토리지로.',
          'Promtail은 Grafana Alloy로 옮겨 가는 중입니다. 새로 구성한다면 Alloy나 Fluent Bit, OTel Collector를 고르세요.',
        ] },
      ],
      hide: ['e_sw', 'e_sp', 'e_sd'],
      show: ['db', 'loki'],
      set: { prom: { state: 'dim', badge: null } },
      focus: ['loki'],
      tags: [{ on: 'pay', text: 'ERROR db timeout', tone: 'bad' }, { on: 'loki', text: '레이블만 색인', pos: 'right' }],
      flows: [{ path: ['web', 'loki'], kind: 'data', n: 2 }, { path: ['pay', 'loki'], kind: 'data', n: 3 }, { path: ['loki', 'graf'], kind: 'data', delay: 1.5 }],
      metrics: { sig: '메트릭 · 로그', find: '15분', series: ['2만', 'ok'] },
      changes: [['-', 'user_id 레이블 (시계열 2만으로)'], ['+', '수집 에이전트와 Loki'], ['~', '결제 API 로그에서 DB 타임아웃 발견']],
    },
    // 9
    {
      key: '트레이스', kind: 'solution', title: 'OpenTelemetry로 요청 하나를 따라갑니다',
      body: [
        '로그에 타임아웃은 찍혔지만, 4초 가운데 어느 구간이 느린지는 아직 모릅니다. <b>트레이스</b>는 요청이 들어올 때 <b>trace ID</b>를 붙이고, 서비스를 넘을 때마다 <code>traceparent</code> 헤더로 넘겨줍니다.',
        '각 서비스는 자기가 쓴 시간을 <b>span</b>으로 기록해 <b>OpenTelemetry</b>(OTel) Collector로 보냅니다. 같은 ID의 span을 이으면 폭포수 그림이 되고, DB 질의 하나가 3.7초를 쓴 것이 바로 보입니다.',
      ],
      callout: { type: 'key', text: 'OTel은 계측 방법과 전송 형식(OTLP)을 정한 <b>벤더 중립 표준</b>입니다. 코드는 한 번만 계측하고, 저장소는 Tempo·Jaeger든 클라우드 서비스든 Collector 설정으로 바꿉니다.' },
      more: [
        { title: '출력 읽기: traceparent', body: [
          'W3C Trace Context 형식의 헤더는 네 조각입니다. <code>00</code>은 버전, 다음 32자리는 요청 전체의 <b>trace ID</b>, 16자리는 이 호출을 만든 <b>부모 span ID</b>, 마지막 <code>01</code>은 "샘플링해서 기록함" 플래그예요. 프록시나 메시지 큐가 이 헤더를 떨어뜨리면 트레이스가 거기서 둘로 끊깁니다.',
        ], code: { title: 'HTTP 헤더', lang: 'text', text: `traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01` } },
        { title: '설정 예시: Collector 파이프라인', code: { title: 'otel-collector.yaml', lang: 'yaml', text: `receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }
processors:
  batch: {}
  tail_sampling:
    policies:
      - { name: errors, type: status_code,
          status_code: { status_codes: [ERROR] } }
      - { name: slow, type: latency,
          latency: { threshold_ms: 1000 } }
exporters:
  otlp/tempo:
    endpoint: tempo:4317
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, batch]
      exporters: [otlp/tempo]` } },
        { title: '샘플링과 신호 잇기', list: [
          '<b>헤드 샘플링</b>: 요청이 들어올 때 "10%만 기록"처럼 미리 정합니다. 싸지만 드문 에러를 놓쳐요.',
          '<b>테일 샘플링</b>: Collector가 트레이스가 끝날 때까지 모았다가 에러와 느린 것만 남깁니다. 위 설정이 그 예이고, 대신 Collector 메모리가 듭니다.',
          '로그 줄에 <code>trace_id</code>를 함께 찍으면 Grafana에서 느린 트레이스 → 그 요청의 로그로 한 번에 넘어갑니다. histogram에 trace ID를 붙이는 <b>exemplar</b>를 쓰면 p99 그래프의 점에서 그 트레이스로 바로 갈 수 있어요.',
          '코드를 못 고친다면 언어별 <b>자동 계측</b>(Java 에이전트 등)이나 쿠버네티스 OTel Operator로 시작합니다.',
        ] },
      ],
      hide: ['prom', 'loki', 'e_wl', 'e_pl'],
      show: ['users', 'otel'],
      focus: ['otel'],
      tags: [{ on: 'web', text: 'span 0.2초' }, { on: 'pay', text: 'span 0.2초' }, { on: 'db', text: 'span 3.7초', tone: 'bad' }],
      flows: [{ path: ['users', 'web', 'pay', 'db'], kind: 'req', dur: 3 }, { path: ['web', 'otel'], kind: 'data', delay: 1 }, { path: ['pay', 'otel'], kind: 'data', delay: 1.8 }, { path: ['otel', 'graf'], kind: 'data', delay: 3 }],
      metrics: { sig: ['세 가지 모두', 'ok'], find: ['5분', 'ok'] },
      changes: [['+', 'OTel 계측과 Collector'], ['~', '원인: 인덱스 없는 DB 질의 하나']],
    },
    // 10
    {
      key: '알림 규칙', kind: 'solution', title: '알림 규칙과 Alertmanager',
      body: [
        '인덱스를 추가하자 p99가 0.3초로 돌아왔습니다. 다음에는 고객보다 먼저 알아야 해요. Prometheus는 <b>알림 규칙</b>의 <code>expr</code>을 주기적으로 평가하고, 조건이 <code>for</code> 동안 계속 참이면 알림을 <b>firing</b>으로 바꿔 Alertmanager에 넘깁니다.',
        '<b>Alertmanager</b>는 받은 알림을 <b>묶고</b>(group), 중복을 지우고, 레이블에 따라 <b>라우팅</b>합니다. <code>severity=page</code>는 호출기로, 나머지는 Slack으로 보내는 식이에요.',
      ],
      callout: { type: 'tip', text: '알림마다 <code>runbook_url</code>을 다세요. 새벽 3시에 깬 당직자가 "이 알림이면 무엇부터 확인하나"를 바로 읽을 수 있어야 합니다.' },
      more: [
        { title: '동작 원리: 세 가지 상태', body: [
          '규칙은 <b>inactive → pending → firing</b>을 오갑니다. <code>expr</code>이 처음 참이 되면 pending이 되고, <code>for: 10m</code> 동안 평가할 때마다 계속 참이어야 firing으로 넘어가요. 잠깐 튀었다 가라앉는 값으로 사람을 깨우지 않기 위한 장치입니다. 대신 <code>for</code>가 길수록 알림이 늦게 오니, 그만큼 감지 시간이 늘어난다는 것을 기억하세요.',
        ] },
        { title: '설정 예시: 라우팅', code: { title: 'alertmanager.yml', lang: 'yaml', text: `route:
  receiver: slack-default
  group_by: [alertname, app]
  group_wait: 30s       # 첫 알림 뒤 모아서 보낼 때까지
  group_interval: 5m    # 같은 묶음에 새 알림이 붙을 때
  repeat_interval: 4h   # 해결 안 되면 다시 알림
  routes:
    - matchers: [ severity="page" ]
      receiver: pager-payments
    - matchers: [ severity="ticket" ]
      receiver: jira
inhibit_rules:
  # 클러스터 전체가 죽었으면 개별 서비스 알림은 숨김
  - source_matchers: [ alertname="ClusterDown" ]
    target_matchers: [ severity="page" ]
    equal: [cluster]` } },
        { title: '실무 팁', list: [
          '위 시간 값은 Alertmanager의 기본값과 같습니다. 묶음이 너무 크면 <code>group_by</code>에 레이블을 더해 쪼개세요.',
          '점검 중에는 규칙을 지우지 말고 <b>silence</b>(기간을 정한 음소거)를 겁니다. 끝나면 저절로 풀려요.',
          '<code>promtool check rules</code>로 규칙 문법을 CI에서 검사하고, <code>promtool test rules</code>로 "이 데이터면 알림이 울린다"를 테스트할 수 있습니다.',
        ] },
      ],
      hide: ['users', 'web', 'pay', 'db', 'otel', 'graf'],
      show: ['prom', 'am', 'oncall'],
      set: { prom: { state: null } },
      focus: ['am'],
      code: {
        title: 'rules/payment.yml', lang: 'yaml', hl: [5, 8, 9, 10],
        text: `groups:
- name: payment
  rules:
  - alert: PaymentHighErrorRate
    expr: |
      sum(rate(http_requests_total{app="pay",
        code=~"5.."}[5m]))
      / sum(rate(http_requests_total{app="pay"}[5m]))
      > 0.05
    for: 10m
    labels:
      severity: page
    annotations:
      summary: 결제 5xx 에러율 5% 초과
      runbook_url: https://wiki.example/pay-5xx`,
      },
      tags: [{ on: 'am', text: '묶기 · 라우팅', icon: 'split', pos: 'left' }],
      flows: [{ path: ['prom', 'am'], kind: 'ctrl' }, { path: ['am', 'oncall'], kind: 'ctrl', delay: 1.2 }],
      metrics: { p99: ['0.3초', 'ok'], alerts: '규칙 1개' },
      changes: [['~', '인덱스 추가: p99 4.1초 → 0.3초'], ['+', '알림 규칙 · Alertmanager']],
    },
    // 11
    {
      key: '알림 피로', kind: 'case', title: '사례: 하루 200건의 알림',
      body: [
        '규칙 하나가 효과를 보자 팀은 CPU 80%, 메모리 70%, Pod 재시작마다 규칙을 걸었습니다. 하루 200건이 울렸고 대부분은 아무 조치도 필요 없었어요.',
        '몇 주 뒤 모두가 채널을 음소거했고, 진짜 결제 장애 알림은 <b>40분 동안 아무도 보지 않았습니다</b>. 원인은 <b>원인 기반</b> 알림이었습니다. CPU 80%는 사용자가 아무 문제를 겪지 않아도 울리니까요.',
      ],
      callout: { type: 'warn', text: '이것이 <b>알림 피로</b>입니다. 받은 사람이 <b>지금 할 일이 없는 알림</b>은 소음이고, 소음은 진짜 신호를 가립니다.' },
      more: [
        { title: '증상 → 원인 → 처방', rows: [
          ['증상', '알림 채널 음소거 · 확인 없이 일괄 종료', 'bad'],
          ['원인 1', 'CPU · 메모리 같은 원인 지표에 호출', 'warn'],
          ['원인 2', 'for 없이 순간값에 반응 · 묶기 없음', 'warn'],
          ['처방 1', '호출은 사용자 증상(SLO)에만', 'ok'],
          ['처방 2', '나머지는 티켓 · 대시보드로 강등', 'ok'],
        ] },
        { title: '좋은 호출 알림의 조건', list: [
          '<b>사용자가 지금 아프다</b>: 에러율, 응답 시간, 처리 지연처럼 바깥에서 보이는 증상입니다.',
          '<b>사람이 지금 할 일이 있다</b>: 스스로 회복되는 Pod 재시작은 조건이 아닙니다.',
          '<b>긴급하다</b>: 디스크 60%처럼 며칠 여유가 있으면 업무 시간 티켓이면 충분해요.',
          '<b>처음 보는 사람도 대응할 수 있다</b>: 요약, 영향 범위, 런북 링크가 들어 있습니다.',
        ] },
        { title: '실무 팁', body: [
          '매주 짧게 <b>알림 리뷰</b>를 엽니다. 지난주 울린 알림을 하나씩 보며 "조치했나?"를 묻고, 아무것도 안 한 알림은 지우거나 강등하거나 임계값을 고칩니다. 당직 한 번에 호출이 몇 건 이상이면 그 자체를 문제로 다루는 팀이 많아요. 원인 지표는 버리는 것이 아니라 <b>대시보드로</b> 옮깁니다. 증상 알림을 받고 원인을 찾을 때 필요하니까요.',
        ] },
      ],
      show: ['pay', 'e_sp'],
      tags: [{ on: 'am', text: '하루 200건', tone: 'bad', pos: 'left' }, { on: 'oncall', text: '채널 음소거', tone: 'bad', icon: 'bell', pos: 'right' }],
      flows: [{ path: ['prom', 'am', 'oncall'], kind: 'bad', n: 6, gap: 0.22 }],
      metrics: { alerts: ['200건', 'bad'] },
      changes: [['+', 'CPU · 메모리 · 재시작 규칙 40개'], ['-', '알림에 대한 신뢰'], ['~', '진짜 장애를 40분 놓침']],
    },
    // 12
    {
      key: 'SLO', kind: 'solution', title: 'SLO와 에러 버짓으로 기준을 바꿉니다',
      body: [
        '기준을 원인에서 <b>증상</b>으로 바꿉니다. <b>SLI</b>는 사용자가 겪는 품질을 잰 값(예: 성공한 요청의 비율)이고, <b>SLO</b>는 그 목표입니다. "30일 동안 결제 요청의 99.9%가 성공한다"처럼 정해요.',
        '목표가 99.9%면 0.1%는 실패해도 됩니다. 이 여유분이 <b>에러 버짓</b>이고, 30일 기준 약 <b>43분</b>입니다.',
      ],
      callout: { type: 'key', text: '에러 버짓은 판단 도구이기도 합니다. 남았으면 <b>배포를 계속</b>하고, 다 썼으면 새 기능을 멈추고 <b>안정화</b>에 씁니다. 100%를 목표로 잡지 않는 이유예요.' },
      more: [
        { title: '계산해 보기', rows: [
          ['99%', '30일에 약 7.2시간', 'mute'],
          ['99.5%', '약 3.6시간', 'mute'],
          ['99.9%', '약 43분', 'warn'],
          ['99.95%', '약 22분', 'warn'],
          ['99.99%', '약 4.3분', 'bad'],
        ] },
        { title: 'SLI를 정확히 정의하기', body: [
          '좋은 SLI는 <b>좋은 이벤트 / 전체 이벤트</b> 꼴입니다. "결제 요청 중 5xx가 아니고 1초 안에 끝난 비율"처럼 성공과 속도를 함께 넣을 수 있어요. 어디서 재는지도 정합니다. 앱 안에서 재면 로드 밸런서 앞에서 실패한 요청이 빠지고, 로드 밸런서에서 재면 그것까지 잡힙니다. 사용자에 가까울수록 정확하지만 원인을 가리기 어려워져요.',
          '99.99%는 거의 공짜가 아닙니다. 한 달 4분이면 사람이 알림을 받고 노트북을 여는 사이에 버짓이 끝나요. 의존하는 서비스(클라우드 DB, 결제 대행사)의 SLA보다 높은 SLO는 지킬 수 없다는 것도 기억하세요.',
        ] },
        { title: '실무 팁', list: [
          '처음에는 지난 몇 주의 실제 값을 보고 <b>지금 지키고 있는 수준보다 조금 낮게</b> 정합니다. 목표는 나중에 올려도 돼요.',
          'SLO는 고객과의 계약인 <b>SLA</b>보다 엄격하게 둡니다. SLO를 어겨도 SLA 위반 전에 고칠 여유가 생깁니다.',
          '에러 버짓 정책(다 쓰면 무엇을 멈추나)을 <b>미리 문서로</b> 합의해 두세요. 장애 중에 정하면 싸움이 됩니다.',
        ] },
      ],
      panel: { title: 'SLO 한눈에', icon: 'target', rows: [['SLI · 잰 값', '성공 비율 99.95%', 'info'], ['SLO · 목표', '30일 99.9%', 'accent'], ['에러 버짓', '0.1% ≈ 43분', 'warn'], ['남은 버짓', '이번 달 68%', 'ok']] },
      focus: ['pay'],
      tags: [{ on: 'pay', text: 'SLI: 성공 비율', tone: 'info' }, { on: 'oncall', text: '버짓이 기준', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['prom', 'pay'], kind: 'ctrl' }, { path: ['pay', 'prom'], kind: 'data', delay: 1 }],
      metrics: { alerts: '정리 중' },
      changes: [['-', 'CPU · 메모리 임계값 호출'], ['+', '결제 SLO 99.9% · 버짓 43분']],
    },
    // 13
    {
      key: '번 레이트', kind: 'concept', title: '번 레이트: 버짓이 타는 속도에 겁니다',
      body: [
        '<b>번 레이트</b>는 버짓을 쓰는 속도입니다. 1이면 30일 동안 딱 다 쓰는 속도, 14.4면 2일 남짓에 다 쓰는 속도예요. 에러율이 0.1%를 넘었다고 바로 울리지 않고, <b>얼마나 빨리 타는지</b>로 급한 정도를 나눕니다.',
        '빨리 타면 당직자를 깨우고, 천천히 타면 티켓으로 남깁니다. 긴 창과 짧은 창 <b>두 구간이 모두</b> 넘을 때만 울리게 해서, 이미 회복된 장애로 늦게 깨우지 않습니다.',
      ],
      callout: { type: 'tip', text: '14.4배가 1시간 이어지면 한 달 버짓의 <b>2%</b>가 탑니다. "버짓의 몇 %를 얼마 만에 쓰면 깨울 것인가"를 정하면 배수가 나옵니다.' },
      more: [
        { title: '계산해 보기', body: [
          '30일은 720시간입니다. 번 레이트 14.4로 1시간을 태우면 14.4 ÷ 720 = 버짓의 2%, 이 속도가 계속되면 720 ÷ 14.4 = 50시간 만에 버짓이 바닥나요. 번 레이트 6으로 6시간이면 6 × 6 ÷ 720 = 5%, 번 레이트 1로 3일이면 72 ÷ 720 = 10%입니다. Google SRE 워크북이 권하는 기본 조합이 바로 이 세 줄이에요.',
        ] },
        { title: '설정 예시: recording rule', body: ['창마다 에러 비율을 미리 계산해 두면 알림 규칙이 짧아지고 평가도 가벼워집니다.'], code: { title: 'rules/slo-pay.yml', lang: 'yaml', text: `- record: job:pay_errors:ratio_rate5m
  expr: |
    sum(rate(http_requests_total{app="pay",code=~"5.."}[5m]))
    / sum(rate(http_requests_total{app="pay"}[5m]))
- record: job:pay_errors:ratio_rate1h
  expr: |
    sum(rate(http_requests_total{app="pay",code=~"5.."}[1h]))
    / sum(rate(http_requests_total{app="pay"}[1h]))
# 30m · 6h · 3d 창도 같은 모양으로` } },
        { title: '왜 창이 두 개인가', list: [
          '<b>긴 창</b>(1시간)만 쓰면, 장애가 5분 만에 끝나도 1시간 평균이 기준 아래로 내려올 때까지 한참 알림이 계속됩니다.',
          '<b>짧은 창</b>(5분)이 함께 넘어야 한다는 조건이 "지금도 타고 있다"를 보장합니다. 회복되면 알림이 곧 풀려요.',
          '짧은 창만 쓰면 순간적인 튐에도 울립니다. 둘을 <code>and</code>로 묶어 서로의 약점을 덮습니다.',
          '트래픽이 아주 적은 서비스는 요청 몇 건의 실패로도 비율이 크게 튑니다. 최소 요청 수 조건을 함께 거세요.',
        ] },
      ],
      hide: ['pay'],
      set: { prom: { badge: '번 레이트 14.4', tone: 'bad' } },
      focus: ['prom'],
      code: {
        title: 'rules/slo-alerts.yml', lang: 'yaml', hl: [3, 4, 5, 6],
        text: `# SLO 99.9% → 허용 에러 비율 0.001
- alert: PayBudgetFastBurn   # 1시간에 2%
  expr: |
    job:pay_errors:ratio_rate1h > 14.4 * 0.001
    and
    job:pay_errors:ratio_rate5m > 14.4 * 0.001
  labels: { severity: page }
- alert: PayBudgetSlowBurn   # 6시간에 5%
  expr: |
    job:pay_errors:ratio_rate6h > 6 * 0.001
    and
    job:pay_errors:ratio_rate30m > 6 * 0.001
  labels: { severity: page }
- alert: PayBudgetTicket     # 3일에 10%
  expr: |
    job:pay_errors:ratio_rate3d > 1 * 0.001
    and
    job:pay_errors:ratio_rate6h > 1 * 0.001
  labels: { severity: ticket }`,
      },
      tags: [{ on: 'oncall', text: '울리면 진짜 장애', tone: 'ok', pos: 'right' }],
      flows: [{ path: ['prom', 'am', 'oncall'], kind: 'ctrl', n: 2 }],
      metrics: { alerts: ['3건', 'ok'] },
      changes: [['+', '번 레이트 알림 3줄'], ['~', '하루 알림 200건 → 3건']],
    },
    // 14
    {
      key: '4대 클라우드', kind: 'compare', title: '클라우드 기본 도구와 중립 스택',
      body: [
        '네 클라우드 모두 자기 리소스의 메트릭과 로그를 기본으로 모아 줍니다. 설치할 것이 없고, 관리형 DB나 로드 밸런서의 수치는 여기에서만 나오는 경우가 많아요. 한 클라우드만 쓴다면 좋은 출발점입니다.',
        '멀티클라우드에서는 화면도, 질의 언어도, 알림 설정도 클라우드 수만큼 생깁니다. Prometheus·Grafana·OTel 같은 <b>중립 스택</b>은 대시보드와 알림 규칙 한 벌을 어디서나 그대로 쓰게 해 주고, 기본 도구의 수치도 Grafana 데이터 소스로 함께 봅니다.',
      ],
      callout: { type: 'cloud', text: 'AWS·Azure·GCP는 <b>관리형 Prometheus</b>도 제공합니다. 표준은 그대로 쓰면서 운영 부담만 맡기는 절충안이에요.' },
      more: [
        { title: '클라우드별로', rows: [
          ['AWS', 'CloudWatch · X-Ray · Managed Prometheus · Managed Grafana', 'aws'],
          ['Azure', 'Azure Monitor · Log Analytics · Application Insights · Managed Grafana', 'azure'],
          ['GCP', 'Cloud Monitoring · Cloud Logging · Cloud Trace · Managed Prometheus', 'gcp'],
          ['NCP', 'Cloud Insight · Cloud Log Analytics', 'ncp'],
        ] },
        { title: '고르는 기준', list: [
          '<b>관리형 서비스의 수치</b>(DB 커넥션 수, LB 5xx)는 기본 도구에서만 나옵니다. 어느 쪽을 고르든 이것은 데이터 소스로 가져와야 해요.',
          '<b>앱 계측은 OTel로</b> 해 두면 나중에 저장소를 바꿔도 코드를 고치지 않습니다. 세 사업자 모두 OTLP나 자사 OTel 배포판을 받아들입니다.',
          '<b>비용 구조가 다릅니다</b>. 기본 도구는 보통 사용자 정의 메트릭 수, 로그 수집 GB, 질의량으로 과금되고, 자체 운영 스택은 장비와 사람 시간으로 과금됩니다. 로그가 많다면 수집 단가를 먼저 비교하세요.',
          '클라우드 밖으로 신호를 보내면 그것도 <b>데이터 전송 요금</b>입니다. 수집과 1차 집계는 클라우드 안에서 하고, 합친 결과만 중앙으로 보내는 구조가 흔해요.',
        ] },
        { title: '더 생각해 볼 것', body: [
          '"한곳에서 다 본다"가 꼭 "한곳에 다 저장한다"일 필요는 없습니다. Grafana는 여러 데이터 소스를 한 대시보드에 겹쳐 그릴 수 있어서, 저장은 각 클라우드에 두고 화면만 합치는 방식도 가능합니다. 알림 규칙만큼은 한 곳, 한 형식으로 두는 편이 관리가 쉽습니다.',
        ] },
      ],
      hide: ['pay', 'prom', 'am', 'oncall'],
      show: ['aws', 'azure', 'gcp', 'ncp', 'neutral'],
      panel: { title: '기본 관측 도구', icon: 'cloud', rows: [['AWS', 'CloudWatch · X-Ray', 'aws'], ['Azure', 'Monitor · App Insights', 'azure'], ['GCP', 'Cloud Monitoring · Logging', 'gcp'], ['NCP', 'Cloud Insight', 'ncp']] },
      focus: ['neutral'],
      tags: [{ on: 'neutral', text: '대시보드·알림 한 벌', tone: 'ok' }],
      flows: [{ path: ['aws', 'neutral'], kind: 'data' }, { path: ['azure', 'neutral'], kind: 'data', delay: 0.2 }, { path: ['gcp', 'neutral'], kind: 'data', delay: 0.4 }, { path: ['ncp', 'neutral'], kind: 'data', delay: 0.6 }],
    },
    // 15
    {
      key: '정리', kind: 'recap', title: '정리: 세 신호를 한 화면에서',
      body: [
        '메트릭으로 <b>이상을 알아채고</b>, 트레이스로 <b>구간을 좁히고</b>, 로그로 <b>이유를 확인</b>합니다. Prometheus는 긁어 오고(레이블은 아껴서), 에이전트는 로그를 모으고, OTel은 요청에 ID를 붙여 따라갑니다. Grafana가 셋을 한 화면에 놓아요.',
        '알림은 원인이 아니라 사용자가 겪는 증상, 곧 <b>SLO와 번 레이트</b>에 겁니다. 다음 레슨에서는 이 시스템들이 쓰는 DB 비밀번호와 API 키를 어디에 두어야 하는지 봅니다.',
      ],
      hide: ['aws', 'azure', 'gcp', 'ncp', 'neutral'],
      show: ['prom', 'loki', 'otel', 'graf', 'eng', 'am', 'oncall'],
      set: { prom: { badge: null } },
      tags: [{ on: 'prom', text: '얼마나?' }, { on: 'loki', text: '왜?' }, { on: 'otel', text: '어디서?' }],
      flows: [{ path: ['prom', 'graf'], kind: 'data' }, { path: ['loki', 'graf'], kind: 'data' }, { path: ['otel', 'graf'], kind: 'data' }, { path: ['prom', 'am', 'oncall'], kind: 'ctrl', delay: 1 }],
    },
  ],
  quiz: [
    {
      q: '평균 응답 시간은 200ms로 정상인데, 일부 고객이 계속 "느리다"고 합니다. 가장 먼저 확인할 것은?',
      options: ['p99 같은 높은 백분위 응답 시간', '서버 CPU 사용률의 하루 평균', '지난 한 달 치 로그 전체', '서버 대수가 충분한지'],
      answer: 0, step: 5,
      why: '평균은 소수의 느린 요청을 가립니다. p99를 보면 "가장 느린 1%"가 얼마나 느린지 드러납니다. CPU 평균도 같은 이유로 문제를 숨기고, 로그 전체를 읽는 것은 어디를 볼지 좁힌 뒤에 할 일입니다.',
    },
    {
      q: '결제 요청 하나가 4초 걸립니다. 주문 API · 결제 API · DB 중 어디에서 시간이 쓰였는지 알려 주는 가장 직접적인 신호는?',
      options: ['각 서비스의 CPU 메트릭', '결제 API의 에러 로그', 'Alertmanager의 알림 내역', '그 요청의 트레이스(span별 시간)'],
      answer: 3, step: 9,
      why: '트레이스는 요청 하나가 거친 구간과 구간별 소요 시간을 보여 줍니다. 메트릭은 "느리다"는 사실을, 로그는 "왜"를 알려 주지만, 여러 서비스에 걸친 시간 배분은 트레이스가 답합니다.',
    },
    {
      q: 'Grafana에서 결제 API의 요청 수 그래프가 배포 때마다 0으로 뚝 떨어졌다가 다시 올라갑니다. 질의는 sum(http_requests_total{app="pay"})입니다. 무엇을 고쳐야 할까요?',
      options: ['scrape 간격을 1초로 줄인다', 'counter에 rate()를 씌워 sum(rate(http_requests_total{app="pay"}[5m]))로 바꾼다', 'http_requests_total을 gauge로 바꿔 내보낸다', '배포를 하지 않는 시간에만 그래프를 본다'],
      answer: 1, step: 5,
      why: 'counter는 프로세스가 재시작되면 0부터 다시 셉니다. rate()는 이 리셋을 감지해 보정하고 초당 증가율을 돌려주므로 배포와 상관없이 매끈한 요청 수가 나옵니다. counter를 gauge로 바꾸면 재시작 문제가 사라지는 것이 아니라 누적의 의미를 잃습니다.',
    },
    {
      q: 'Prometheus에서 up{job="pay"}가 0으로 바뀌었습니다. 결제 API의 요청 수 그래프는 비어 있습니다. 가장 먼저 의심할 것은?',
      options: ['결제 API에 요청이 하나도 들어오지 않는다', 'Grafana 대시보드가 고장 났다', 'Prometheus가 결제 API의 /metrics를 읽지 못하고 있다(대상이 죽었거나, 주소나 네트워크가 막힘)', '결제 API의 에러율이 0%다'],
      answer: 2, step: 3,
      why: 'up은 마지막 scrape의 성공 여부입니다. 0이면 대상이 죽었거나 Prometheus가 닿지 못하는 상태이고, Status → Targets에서 오류 메시지를 확인합니다. 요청이 없는 것이라면 up은 1이고 rate만 0으로 나옵니다. pull 방식에서는 이렇게 조용한 것과 죽은 것이 구분됩니다.',
    },
    {
      q: '응답 시간 SLO는 "0.8초 이내 99%"입니다. histogram 버킷은 0.1, 0.5, 1, 5초입니다. 이 설정의 문제는?',
      options: ['버킷이 너무 많아 시계열이 폭발한다', 'SLO 경계인 0.8초가 버킷 경계에 없어서, 0.8초 이내 비율을 정확히 셀 수 없다', 'histogram으로는 p99를 계산할 수 없다', '버킷은 반드시 1초 간격이어야 한다'],
      answer: 1, step: 4,
      why: 'histogram은 경계 이하의 누적 개수만 압니다. 0.5초와 1초 사이는 어떻게 분포했는지 모르므로 0.8초 기준의 비율은 짐작값이 됩니다. SLO 경계값을 버킷 경계로 넣어야 정확합니다. 버킷 네 개는 많지 않고, histogram_quantile로 p99는 계산할 수 있습니다.',
    },
    {
      q: '어느 날부터 Prometheus가 메모리 부족으로 재시작을 반복합니다. 직전 배포에서 한 서비스가 메트릭에 order_id 레이블을 추가했습니다. 올바른 대응은?',
      options: ['Prometheus 메모리를 계속 늘린다', 'scrape 간격을 늘려 수집량을 줄인다', '보관 기간을 15일에서 1일로 줄인다', 'order_id 레이블을 빼고, 대상별 sample_limit이나 labeldrop으로 재발을 막는다'],
      answer: 3, step: 7,
      why: '레이블 값 조합마다 시계열이 생기므로 주문 번호처럼 끝없이 늘어나는 값은 카디널리티를 폭발시킵니다. 메모리를 늘려도 주문이 쌓이는 만큼 다시 찹니다. scrape 간격이나 보관 기간은 활성 시계열 수를 줄이지 못합니다. 주문 단위 정보는 로그나 트레이스에 넣습니다.',
    },
    {
      q: '결제 API가 느린데 CPU는 40%로 한가합니다. RED · USE 관점에서 다음으로 볼 것은?',
      options: ['결제 API가 쓰는 자원의 포화(DB 커넥션 풀 대기, 스레드 풀 대기열)', 'CPU 그래프를 더 긴 기간으로 다시 본다', '결제 API의 요청 수만 본다', '서버를 두 배로 늘린다'],
      answer: 0, step: 6,
      why: '사용률이 낮아도 대기열이 쌓이면 느려집니다. USE의 Saturation은 바로 이 "밀려서 기다리는 정도"를 봅니다. 커넥션 풀이 꽉 찼다면 서버를 늘려도 DB 쪽 병목은 그대로이고 오히려 커넥션 경쟁이 심해질 수 있습니다.',
    },
    {
      q: 'Loki를 도입하면서 한 개발자가 검색을 쉽게 하려고 request_id를 레이블로 붙이자고 합니다. 가장 알맞은 판단은?',
      options: ['좋다. 레이블이 많을수록 Loki 검색이 빨라진다', 'request_id는 로그 본문(JSON 필드)에 두고, 레이블은 app · namespace처럼 값이 적은 것만 쓴다', 'request_id 대신 user_id를 레이블로 쓴다', 'Loki를 버리고 메트릭으로 모든 요청을 기록한다'],
      answer: 1, step: 8,
      why: 'Loki는 레이블 조합마다 스트림을 만들어 색인하므로 고유값 레이블은 Prometheus와 똑같이 카디널리티를 폭발시킵니다. 고유값은 본문에 두고 | json 필터로 찾으면 됩니다. user_id도 같은 문제를 가집니다.',
    },
    {
      q: '주문 API → 결제 API 사이에 새로 넣은 API 게이트웨이 뒤로 트레이스가 둘로 끊겨 보입니다. 가장 먼저 확인할 것은?',
      options: ['Collector의 메모리', 'DB 인덱스', '게이트웨이가 traceparent 헤더를 그대로 전달하는지', 'Grafana 버전'],
      answer: 2, step: 9,
      why: '트레이스는 서비스를 넘을 때 traceparent 헤더로 같은 trace ID를 이어 받아야 하나로 이어집니다. 중간의 프록시나 게이트웨이가 헤더를 버리면 그 뒤에서 새 trace가 시작됩니다. Collector나 DB는 끊김의 원인이 아닙니다.',
    },
    {
      q: 'CPU 80% 알림이 하루 수십 번 울리지만, 대부분 사용자 영향은 없습니다. 가장 좋은 개선은?',
      options: ['호출은 SLO 기반 증상 알림으로 바꾸고, CPU는 대시보드나 티켓 알림으로 강등한다', '임계값을 95%로 올리고 계속 호출한다', '알림 채널을 음소거한다', '알림을 받는 사람을 늘린다'],
      answer: 0, step: 11,
      why: '사람을 깨우는 알림은 사용자가 겪는 증상이고 지금 할 일이 있어야 합니다. 임계값만 올리면 여전히 원인 지표라 오탐과 미탐이 함께 남습니다. 음소거와 인원 추가는 피로를 옮길 뿐 진짜 신호를 가리는 문제는 그대로입니다.',
    },
    {
      q: '결제 SLO를 99.9%(30일)로 정했습니다. 이번 달 이미 장애로 40분을 썼고 아직 10일이 남았습니다. 에러 버짓 정책에 따른 판단으로 알맞은 것은?',
      options: ['버짓이 거의 바닥났으니 위험한 기능 배포를 미루고 안정화 작업을 우선한다', '아직 SLO 기간이 남았으니 평소대로 배포한다', 'SLO를 99%로 낮춰 버짓을 늘린다', '남은 10일 동안 모든 배포와 장애 대응을 멈춘다'],
      answer: 0, step: 12,
      why: '99.9%의 30일 버짓은 약 43분이라 40분이면 거의 다 썼습니다. 에러 버짓은 바로 이럴 때 변경 속도를 늦추고 안정성에 투자하라는 신호입니다. 장애 중에 목표를 낮추는 것은 SLO를 무의미하게 만들고, 장애 대응까지 멈출 이유는 없습니다.',
    },
    {
      q: '번 레이트 알림을 1시간 창 하나로만 걸었더니, 10분 만에 끝난 장애 뒤에도 한참 동안 알림이 풀리지 않습니다. 어떻게 고칠까요?',
      options: ['for를 1시간으로 늘린다', '5분 같은 짧은 창 조건을 and로 함께 걸어, 지금도 타고 있을 때만 울리게 한다', '창을 30일로 늘린다', '알림을 끄고 대시보드만 본다'],
      answer: 1, step: 13,
      why: '긴 창의 평균은 장애가 끝난 뒤에도 한동안 기준 위에 머뭅니다. 짧은 창이 함께 넘어야 한다는 조건을 더하면 회복 직후 알림이 풀립니다. for를 늘리면 오히려 감지가 늦어지고, 30일 창은 급한 장애를 잡지 못합니다.',
    },
    {
      q: 'AWS와 NCP 양쪽에 같은 서비스를 운영합니다. 관측 체계로 가장 합리적인 선택은?',
      options: ['클라우드마다 기본 도구로 대시보드와 알림을 따로 만든다', 'NCP 서버에도 AWS 에이전트를 설치해 모든 것을 CloudWatch로 보낸다', '클라우드마다 다른 팀이 각자 익숙한 도구로 본다', '앱 계측 · 대시보드 · 알림은 OTel · Prometheus · Grafana로 통일하고, 관리형 서비스 수치는 기본 도구에서 데이터 소스로 가져온다'],
      answer: 3, step: 14,
      why: '중립 스택은 질의와 대시보드, 알림 규칙 한 벌을 양쪽에서 그대로 쓰게 해 줍니다. 따로 만들면 같은 일을 두 번 하고 서로 비교하기 어렵습니다. 한쪽 클라우드 도구로 몰면 그 사업자에 묶이고 전송 비용도 생깁니다.',
    },
  ],
};
