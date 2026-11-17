// Design Lab: one web architecture, drawn with whichever cloud's parts you pick.
import { createScene } from '../engine/scene.js';
import { icon } from '../engine/icons.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CLOUDS = [
  { id: 'aws', name: 'AWS' }, { id: 'azure', name: 'Azure' }, { id: 'gcp', name: 'GCP' }, { id: 'ncp', name: 'NCP' },
];
const COMPUTE = [
  { id: 'vm', name: 'VM 그룹', icon: 'server' }, { id: 'k8s', name: '쿠버네티스', icon: 'helm' }, { id: 'fn', name: '서버리스', icon: 'zap' },
];

// Each part: where it stands, what it is called in each cloud ([label, sub?]) and its Terraform resource type.
const PARTS = {
  dns: {
    role: 'DNS', icon: 'signpost', at: [-1.7, 2.9], kind: 'tile', always: true,
    name: { aws: ['Route 53'], azure: ['Azure DNS'], gcp: ['Cloud DNS'], ncp: ['Global DNS'] },
    tf: { aws: 'aws_route53_record', azure: 'azurerm_dns_a_record', gcp: 'google_dns_record_set', ncp: '—' },
  },
  cdn: {
    role: 'CDN', icon: 'globe', at: [1.5, 4.5], opt: '엣지 캐시 (CDN)',
    name: { aws: ['CloudFront', 'CDN'], azure: ['Front Door', 'CDN'], gcp: ['Cloud CDN', 'CDN'], ncp: ['Global\nEdge', 'CDN'] },
    tf: { aws: 'aws_cloudfront_distribution', azure: 'azurerm_cdn_frontdoor_profile', gcp: 'google_compute_backend_service (enable_cdn)', ncp: '—' },
  },
  waf: {
    role: '웹 방화벽', icon: 'shield', at: [0.15, 1.65], size: 's', opt: '웹 방화벽 (WAF)',
    name: { aws: ['WAF'], azure: ['WAF'], gcp: ['Armor'], ncp: ['WAF'] },
    full: { aws: 'AWS WAF', azure: 'Azure WAF', gcp: 'Cloud Armor', ncp: 'WAF (Security Monitoring)' },
    tf: { aws: 'aws_wafv2_web_acl', azure: 'azurerm_web_application_firewall_policy', gcp: 'google_compute_security_policy', ncp: '—' },
  },
  lb: {
    role: 'L7 로드 밸런서', icon: 'split', at: [3, 3], always: true,
    name: { aws: ['ALB', 'L7 LB'], azure: ['App\nGateway', 'L7 LB'], gcp: ['HTTP(S)\nLB', '글로벌'], ncp: ['Load\nBalancer', 'ALB'] },
    full: { aws: 'Application Load Balancer', azure: 'Application Gateway', gcp: 'Application Load Balancer', ncp: 'Load Balancer (ALB)' },
    tf: { aws: 'aws_lb', azure: 'azurerm_application_gateway', gcp: 'google_compute_url_map', ncp: 'ncloud_lb' },
  },
  vm: {
    role: '서버 그룹', icon: 'server', at: [4.5, 1.5], compute: 'vm',
    name: { aws: ['EC2', 'Auto Scaling'], azure: ['VM Scale\nSets'], gcp: ['MIG', 'Compute Eng.'], ncp: ['Server', 'Auto Scaling'] },
    full: { aws: 'EC2 Auto Scaling Group', azure: 'Virtual Machine Scale Sets', gcp: 'Managed Instance Group', ncp: 'Server + Auto Scaling' },
    tf: { aws: 'aws_autoscaling_group', azure: 'azurerm_linux_virtual_machine_scale_set', gcp: 'google_compute_region_instance_group_manager', ncp: 'ncloud_auto_scaling_group' },
  },
  k8s: {
    role: '쿠버네티스', icon: 'helm', at: [4.5, 1.5], compute: 'k8s',
    name: { aws: ['EKS', 'Kubernetes'], azure: ['AKS', 'Kubernetes'], gcp: ['GKE', 'Kubernetes'], ncp: ['NKS', 'Kubernetes'] },
    full: { aws: 'Elastic Kubernetes Service', azure: 'Azure Kubernetes Service', gcp: 'Google Kubernetes Engine', ncp: 'Ncloud Kubernetes Service' },
    tf: { aws: 'aws_eks_cluster', azure: 'azurerm_kubernetes_cluster', gcp: 'google_container_cluster', ncp: 'ncloud_nks_cluster' },
  },
  fn: {
    role: '서버리스', icon: 'zap', at: [4.5, 1.5], compute: 'fn',
    name: { aws: ['Lambda', '함수'], azure: ['Functions', '함수'], gcp: ['Cloud Run', '컨테이너'], ncp: ['Cloud\nFunctions'] },
    tf: { aws: 'aws_lambda_function', azure: 'azurerm_linux_function_app', gcp: 'google_cloud_run_v2_service', ncp: '—' },
  },
  db: {
    role: '관계형 DB', icon: 'database', at: [6, 0], kind: 'cyl', always: true,
    name: { aws: ['RDS'], azure: ['Azure SQL'], gcp: ['Cloud SQL'], ncp: ['Cloud DB'] },
    full: { ncp: 'Cloud DB for MySQL' },
    tf: { aws: 'aws_db_instance', azure: 'azurerm_mssql_database', gcp: 'google_sql_database_instance', ncp: 'ncloud_mysql' },
  },
  cache: {
    role: '캐시', icon: 'zap', at: [3.15, -1.35], kind: 'cyl', size: 's', opt: '인메모리 캐시',
    name: { aws: ['ElastiCache'], azure: ['Azure Redis'], gcp: ['Memorystore'], ncp: ['Redis'] },
    full: { azure: 'Azure Cache for Redis', ncp: 'Cloud DB for Redis' },
    tf: { aws: 'aws_elasticache_replication_group', azure: 'azurerm_redis_cache', gcp: 'google_redis_instance', ncp: 'ncloud_redis' },
  },
  storage: {
    role: '오브젝트 스토리지', icon: 'archive', at: [7.35, 2.85], kind: 'cyl', opt: '파일 · 이미지 저장',
    name: { aws: ['S3'], azure: ['Blob Storage'], gcp: ['Cloud Storage'], ncp: ['Object Storage'] },
    tf: { aws: 'aws_s3_bucket', azure: 'azurerm_storage_account', gcp: 'google_storage_bucket', ncp: 'ncloud_objectstorage_bucket' },
  },
  queue: {
    role: '메시지 큐', icon: 'inbox', at: [8.85, 1.35], opt: '비동기 작업 큐',
    name: { aws: ['SQS', '큐'], azure: ['Service\nBus', '큐'], gcp: ['Pub/Sub', '메시징'], ncp: ['Data\nStream', 'Kafka'] },
    full: { ncp: 'Cloud Data Streaming Service' },
    tf: { aws: 'aws_sqs_queue', azure: 'azurerm_servicebus_queue', gcp: 'google_pubsub_topic', ncp: '—' },
  },
  monitor: {
    role: '모니터링', icon: 'activity', at: [5.85, 4.35], size: 's', opt: '모니터링 · 알람',
    name: { aws: ['Cloud\nWatch'], azure: ['Monitor'], gcp: ['Monitoring'], ncp: ['Insight'] },
    full: { aws: 'CloudWatch', azure: 'Azure Monitor', gcp: 'Cloud Monitoring', ncp: 'Cloud Insight' },
    tf: { aws: 'aws_cloudwatch_metric_alarm', azure: 'azurerm_monitor_metric_alert', gcp: 'google_monitoring_alert_policy', ncp: '—' },
  },
  secrets: {
    role: '시크릿 저장소', icon: 'key', at: [1.65, 0.15], size: 's', opt: '시크릿 관리',
    name: { aws: ['Secrets'], azure: ['Key Vault'], gcp: ['Secrets'], ncp: ['Secrets'] },
    full: { aws: 'Secrets Manager', azure: 'Key Vault', gcp: 'Secret Manager', ncp: 'Secret Manager' },
    tf: { aws: 'aws_secretsmanager_secret', azure: 'azurerm_key_vault_secret', gcp: 'google_secret_manager_secret', ncp: '—' },
  },
  vpn: {
    role: 'VPN', icon: 'cable', at: [4.35, 5.85], size: 's', opt: '사무실과 VPN 연결',
    name: { aws: ['VPN'], azure: ['VPN GW'], gcp: ['Cloud VPN'], ncp: ['IPsec VPN'] },
    full: { aws: 'Site-to-Site VPN', azure: 'VPN Gateway', gcp: 'Cloud VPN (HA)', ncp: 'IPsec VPN' },
    tf: { aws: 'aws_vpn_connection', azure: 'azurerm_virtual_network_gateway', gcp: 'google_compute_ha_vpn_gateway', ncp: '—' },
  },
};
const OPTS = ['cdn', 'waf', 'cache', 'storage', 'queue', 'monitor', 'secrets', 'vpn'];
const fullName = (id, c) => PARTS[id].full?.[c] || PARTS[id].name[c].join(' ').replace(/\n/g, ' ').replace(/ (CDN|L7 LB|글로벌|ALB|Kubernetes|함수|컨테이너|큐|메시징|Kafka|Auto Scaling|Compute Eng\.)$/, '');

export function mountLab(main) {
  const state = { cloud: 'aws', compute: 'vm', on: new Set(['cdn', 'cache', 'storage', 'monitor']) };
  try {
    const saved = JSON.parse(localStorage.getItem('mcd:lab'));
    if (saved && PARTS[saved.compute] && CLOUDS.some((c) => c.id === saved.cloud)) { state.cloud = saved.cloud; state.compute = saved.compute; state.on = new Set(saved.on.filter((o) => OPTS.includes(o))); }
  } catch { /* first visit */ }
  let scene = null;

  const active = () => Object.keys(PARTS).filter((id) => PARTS[id].always || state.on.has(id) || PARTS[id].compute === state.compute);

  function buildScene() {
    const c = state.cloud;
    const ids = active();
    const has = (id) => ids.includes(id);
    const nodes = { users: { kind: 'users', at: [0, 6], label: '사용자' } };
    if (has('vpn')) nodes.office = { kind: 'client', at: [2.85, 7.35], label: '사무실' };
    for (const id of ids) {
      const p = PARTS[id];
      const [label, sub] = p.name[c];
      nodes[id] = { kind: p.kind || 'box', at: p.at, size: p.size || 'm', label, sub, icon: p.icon, color: ['dns', 'cdn', 'waf', 'monitor', 'secrets', 'vpn'].includes(id) ? 'sand' : c };
    }
    const app = state.compute;
    const edges = {};
    const E = (id, from, to, extra = {}) => { if ((from in nodes) && (to in nodes)) edges[id] = { from, to, ...extra }; };
    E('e_dns', 'users', 'dns', { style: 'dashed', tone: 'mute' });
    if (has('cdn')) { E('e_u', 'users', 'cdn'); E('e_c', 'cdn', 'lb'); } else E('e_u', 'users', 'lb');
    E('e_waf', 'waf', 'lb', { style: 'dashed', tone: 'ok' });
    E('e_app', 'lb', app);
    E('e_db', app, 'db');
    E('e_cache', app, 'cache');
    E('e_st', app, 'storage');
    E('e_q', app, 'queue');
    E('e_mon', 'monitor', app, { style: 'dashed', tone: 'mute' });
    E('e_sec', 'secrets', app, { style: 'dashed', tone: 'mute' });
    E('e_off', 'office', 'vpn', { bi: true });
    E('e_vpn', 'vpn', app, { style: 'dashed' });
    const front = has('cdn') ? ['users', 'cdn', 'lb', app] : ['users', 'lb', app];
    const flows = [
      { path: [...front, 'db'], kind: 'req', n: 2, gap: 0.5 },
      { path: ['db', ...[...front].reverse()], kind: 'res', n: 2, gap: 0.5, delay: 3.2 },
    ];
    if (has('cache')) flows.push({ path: [app, 'cache'], kind: 'data', delay: 1.6 });
    if (has('queue')) flows.push({ path: [app, 'queue'], kind: 'build', delay: 2.2 });
    if (has('storage')) flows.push({ path: [app, 'storage'], kind: 'data', delay: 2.6 });
    if (has('monitor')) flows.push({ path: [app, 'monitor'], kind: 'ctrl', delay: 1 });
    return { title: '설계 랩', scene: { nodes, edges, zones: {} }, steps: [{ show: Object.keys(nodes), flows }] };
  }

  function review() {
    const on = (id) => state.on.has(id);
    const out = [];
    const add = (tone, text) => out.push({ tone, text });
    if (!on('cdn')) add('warn', '정적 파일까지 전부 오리진이 직접 응답합니다. 먼 지역 사용자는 느리고, 트래픽이 몰리면 서버가 다 받습니다.');
    else add('ok', '이미지·JS·CSS는 엣지에서 응답하므로 오리진 부하와 지연이 줄어듭니다.');
    if (!on('waf')) add('warn', '웹 방화벽이 없습니다. SQL 인젝션·봇 트래픽이 로드 밸런서까지 그대로 들어옵니다.');
    if (!on('cache')) add('info', '모든 읽기가 DB로 갑니다. 같은 조회가 반복된다면 캐시가 DB 부하를 크게 줄여 줍니다.');
    if (!on('storage')) add('warn', state.compute === 'vm' ? '업로드 파일을 둘 곳이 없습니다. VM 디스크에 저장하면 서버가 교체될 때 함께 사라집니다.' : '업로드 파일을 둘 곳이 없습니다. 컨테이너·함수의 로컬 디스크는 오래 남지 않습니다.');
    if (!on('queue')) add('info', '메일 발송·이미지 변환 같은 느린 작업도 요청 안에서 처리됩니다. 큐로 빼면 응답이 빨라지고 실패 시 재시도할 수 있습니다.');
    if (!on('monitor')) add('bad', '모니터링이 없습니다. 장애를 고객 문의로 알게 됩니다.');
    if (!on('secrets')) add('warn', 'DB 비밀번호가 어디에 있나요? 코드나 환경 파일에 있다면 시크릿 저장소로 옮기세요.');
    if (state.compute === 'vm') add('info', 'VM 그룹: 가장 익숙하지만 OS 패치·이미지 관리가 내 몫입니다. 서버는 무상태로 두어야 오토스케일링이 안전합니다.');
    if (state.compute === 'k8s') add('info', '쿠버네티스: 네 클라우드에서 같은 매니페스트를 쓸 수 있어 멀티클라우드에 유리합니다. 대신 클러스터 운영 지식이 필요합니다.');
    if (state.compute === 'fn') add('info', '서버리스: 쓴 만큼만 내고 운영 부담이 적습니다. 콜드 스타트, 실행 시간 제한, DB 커넥션 폭증을 주의하세요.');
    if (state.cloud === 'gcp') add('info', 'GCP의 HTTP(S) 로드 밸런서는 글로벌입니다. 한 IP로 여러 리전에 분산할 수 있습니다.');
    if (state.cloud === 'ncp') add('info', 'NCP는 일부 서비스의 Terraform 리소스가 없을 수 있습니다(표의 "—"). 그런 부분은 콘솔·API와 병행합니다.');
    if (state.cloud === 'azure') add('info', 'Azure에서는 이 모든 리소스를 하나의 리소스 그룹에 담아 통째로 관리·삭제할 수 있습니다.');
    return out;
  }

  function paint() {
    try { localStorage.setItem('mcd:lab', JSON.stringify({ cloud: state.cloud, compute: state.compute, on: [...state.on] })); } catch { /* ignore */ }
    const ids = active();
    main.innerHTML = `
<section class="view card lab">
  <header class="view-head">
    <div><h1>설계 랩</h1><p>같은 3계층 웹 아키텍처를 네 클라우드의 부품으로 조립해 보세요. 이름은 달라도 뼈대는 같습니다.</p></div>
    <div class="seg clouds">${CLOUDS.map((c) => `<button type="button" class="seg-btn cl-${c.id} ${state.cloud === c.id ? 'on' : ''}" data-cloud="${c.id}">${c.name}</button>`).join('')}</div>
  </header>
  <div class="lab-controls">
    <div class="ctl"><small>컴퓨트</small><div class="seg">${COMPUTE.map((c) => `<button type="button" class="seg-btn ${state.compute === c.id ? 'on' : ''}" data-compute="${c.id}">${icon(c.icon, 13)}${c.name}</button>`).join('')}</div></div>
    <div class="ctl grow"><small>부품 추가</small><div class="toggles">${OPTS.map((o) => `<label class="tog ${state.on.has(o) ? 'on' : ''}"><input type="checkbox" data-opt="${o}" ${state.on.has(o) ? 'checked' : ''}/><i>${state.on.has(o) ? icon('check', 11) : ''}</i>${PARTS[o].opt}</label>`).join('')}</div></div>
  </div>
  <div class="stage lab-stage">
    <div class="stage-body"><div class="scene-wrap"><div class="scene-host" id="lab-scene"></div></div></div>
    <div class="legend"><span class="lg k-req"><i></i>요청</span><span class="lg k-res"><i></i>응답</span><span class="lg k-data"><i></i>데이터</span><span class="lg k-build"><i></i>비동기 작업</span><span class="lg k-ctrl"><i></i>지표</span></div>
  </div>
</section>
<aside class="side lab-side">
  <section class="card pad">
    <h3>설계 점검</h3>
    <ul class="review">${review().map((r) => `<li class="t-${r.tone}"><i>${icon(r.tone === 'ok' ? 'check' : r.tone === 'info' ? 'info' : 'warn', 12)}</i><span>${esc(r.text)}</span></li>`).join('')}</ul>
  </section>
  <section class="card pad">
    <h3>부품 번역표</h3>
    <div class="parts">
      ${ids.map((id) => `<div class="part"><b>${esc(PARTS[id].role)}</b>
        <div class="part-names">${CLOUDS.map((c) => `<span class="pn cl-${c.id} ${c.id === state.cloud ? 'on' : ''}">${esc(fullName(id, c.id))}</span>`).join('')}</div>
        <code>${esc(PARTS[id].tf[state.cloud])}</code></div>`).join('')}
    </div>
  </section>
</aside>`;
    scene?.destroy();
    scene = createScene(main.querySelector('#lab-scene'), buildScene());
    scene.apply(0, { instant: true });
    main.querySelectorAll('[data-cloud]').forEach((b) => b.addEventListener('click', () => { state.cloud = b.dataset.cloud; paint(); }));
    main.querySelectorAll('[data-compute]').forEach((b) => b.addEventListener('click', () => { state.compute = b.dataset.compute; paint(); }));
    main.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('change', () => { if (b.checked) state.on.add(b.dataset.opt); else state.on.delete(b.dataset.opt); paint(); }));
  }
  paint();
  return { destroy() { scene?.destroy(); } };
}
