// The course outline: chapters and their lessons, in reading order.
// A lesson's steps, scene and quiz live in src/content/<chapter id>/<lesson id>.js.

export const CHAPTERS = [
  {
    id: 'ch01', title: '클라우드 기초', color: 'sand', phase: 'done',
    lessons: [
      { id: 'cloud-basics', title: '클라우드란 무엇인가', blurb: '서버실을 직접 짓던 시절에서 IaaS·PaaS·SaaS까지, 그리고 누가 무엇을 책임지는지.', minutes: 10, level: '입문' },
      { id: 'regions-az', title: '리전과 가용 영역', blurb: '데이터센터 하나가 통째로 꺼져도 서비스가 살아남게 만드는 지리적 구조.', minutes: 10, level: '입문' },
      { id: 'request-journey', title: '요청 하나의 여정', blurb: '브라우저에서 Enter를 누른 뒤 클라우드 안에서 일어나는 일을 한 홉씩 따라가기.', minutes: 11, level: '입문' },
    ],
  },
  {
    id: 'ch02', title: 'Linux와 네트워크 기초', color: 'green', phase: 'done',
    lessons: [
      { id: 'linux-basics', title: 'Linux 서버 다루기', blurb: 'SSH로 들어가서 파일·권한·프로세스·서비스를 다루는, 모든 클라우드 작업의 바닥.', minutes: 12, level: '입문' },
      { id: 'ip-cidr', title: 'IP 주소와 CIDR', blurb: '10.0.0.0/16이 무슨 뜻인지, 대역을 어떻게 쪼개야 나중에 후회하지 않는지.', minutes: 11, level: '입문' },
      { id: 'ports-tls', title: '포트·TCP·TLS', blurb: '연결 하나가 맺어지고 암호화되기까지: 포트, 3-way 핸드셰이크, 인증서.', minutes: 11, level: '입문' },
    ],
  },
  {
    id: 'ch03', title: '클라우드 네트워크', color: 'purple', phase: 'done',
    lessons: [
      { id: 'vpc-subnet', title: 'VPC와 서브넷', blurb: '클라우드 안에 나만의 사설망 짓기: 퍼블릭·프라이빗 서브넷, 라우팅, IGW, NAT.', minutes: 13, level: '초급' },
      { id: 'firewall', title: '보안 그룹과 NACL', blurb: '누가 어디로 들어올 수 있는지 정하는 두 겹의 방화벽과 최소 개방 원칙.', minutes: 11, level: '초급' },
      { id: 'load-balancer', title: '로드 밸런서', blurb: '여러 서버 앞의 현관 하나: L4와 L7, 헬스 체크, 그리고 장애 우회.', minutes: 12, level: '초급' },
      { id: 'cdn-dns', title: 'CDN과 글로벌 DNS', blurb: '먼 곳의 사용자에게도 빠르게: 엣지 캐시와 DNS 기반 트래픽 분산.', minutes: 11, level: '초급' },
      { id: 'hybrid-connect', title: 'VPN·전용선·피어링', blurb: '사무실과 클라우드, 클라우드와 클라우드를 사설로 잇는 세 가지 방법.', minutes: 12, level: '중급' },
    ],
  },
  {
    id: 'ch04', title: '컴퓨트·스토리지·IAM', color: 'orange', phase: 'done',
    lessons: [
      { id: 'vm-autoscale', title: 'VM과 오토스케일링', blurb: '가상 서버 한 대에서 트래픽에 맞춰 늘고 주는 서버 그룹까지.', minutes: 12, level: '초급' },
      { id: 'storage-types', title: '오브젝트·블록·파일 스토리지', blurb: '세 가지 저장소의 성격과, 어떤 데이터를 어디에 둬야 하는지.', minutes: 11, level: '초급' },
      { id: 'managed-db', title: '관리형 데이터베이스', blurb: '백업·패치·장애 조치를 클라우드에 맡기기: Multi-AZ와 읽기 복제본.', minutes: 12, level: '초급' },
      { id: 'serverless', title: '서버리스와 이벤트', blurb: '서버 없이 이벤트로 도는 구조: 함수, 스케줄, 큐, 알림, 그리고 실패 처리.', minutes: 13, level: '중급' },
      { id: 'iam', title: 'IAM: 누가 무엇을 할 수 있나', blurb: '사용자·역할·정책으로 권한을 다루고, 최소 권한으로 사고 반경을 줄이기.', minutes: 13, level: '초급' },
    ],
  },
  {
    id: 'ch05', title: '4대 클라우드', color: 'blue', phase: 'now',
    lessons: [
      { id: 'aws-core', title: 'AWS 핵심 지도', blurb: '계정·리전·VPC에서 EC2·S3·RDS·EKS까지, AWS를 구성하는 뼈대.', minutes: 12, level: '초급' },
      { id: 'azure-core', title: 'Azure 핵심 지도', blurb: '테넌트·구독·리소스 그룹이라는 계층과 Entra ID 중심의 Azure 세계.', minutes: 12, level: '초급' },
      { id: 'gcp-core', title: 'GCP 핵심 지도', blurb: '프로젝트 단위 과금, 전 세계에 걸친 글로벌 VPC, 그리고 GKE.', minutes: 12, level: '초급' },
      { id: 'ncp-core', title: 'NCP 핵심 지도', blurb: '네이버 클라우드 플랫폼: 국내 리전, 공공·금융 존, NKS와 주요 서비스.', minutes: 12, level: '초급' },
      { id: 'service-mapping', title: '서비스 매핑: 같은 역할, 다른 이름', blurb: '한 클라우드에서 배운 것을 나머지 셋으로 옮기는 번역표.', minutes: 12, level: '초급' },
    ],
  },
  {
    id: 'ch06', title: 'Docker', color: 'teal', phase: 'next',
    lessons: [
      { id: 'container-vs-vm', title: '컨테이너 vs VM', blurb: '"내 PC에선 되는데요"를 끝내는 방법과, 컨테이너가 VM보다 가벼운 이유.', minutes: 11, level: '입문' },
      { id: 'image-layers', title: '이미지와 레이어', blurb: '이미지는 읽기 전용 레이어의 탑: 캐시, 태그, 그리고 컨테이너의 쓰기 레이어.', minutes: 11, level: '초급' },
      { id: 'dockerfile', title: 'Dockerfile과 멀티스테이지 빌드', blurb: 'Dockerfile을 한 줄씩 따라가며 작고 빠르고 안전한 이미지를 만들기.', minutes: 13, level: '초급' },
      { id: 'docker-network-volume', title: '컨테이너 네트워크와 볼륨', blurb: '컨테이너끼리 통신하는 법, 포트 매핑, 그리고 지워져도 남는 데이터.', minutes: 12, level: '초급' },
      { id: 'compose-registry', title: 'Compose와 레지스트리', blurb: '여러 컨테이너를 한 파일로 띄우고, 이미지를 레지스트리로 실어 나르기.', minutes: 12, level: '초급' },
    ],
  },
  {
    id: 'ch07', title: 'Kubernetes', color: 'red', phase: 'next',
    lessons: [
      { id: 'k8s-architecture', title: '클러스터 아키텍처', blurb: '컨트롤 플레인과 워커 노드: 선언한 상태를 끝까지 맞춰 주는 기계.', minutes: 13, level: '초급' },
      { id: 'pods-deployments', title: 'Pod·ReplicaSet·Deployment', blurb: '컨테이너를 감싸는 세 겹의 포장과 스스로 복구하는 원리.', minutes: 12, level: '초급' },
      { id: 'services-ingress', title: 'Service와 Ingress', blurb: '계속 바뀌는 Pod 앞에 고정 주소를 두고, 바깥 트래픽을 안으로 들이기.', minutes: 13, level: '초급' },
      { id: 'config-secret', title: 'ConfigMap과 Secret', blurb: '이미지는 그대로 두고 환경마다 다른 설정과 비밀값을 주입하기.', minutes: 11, level: '초급' },
      { id: 'scheduling-scaling', title: '스케줄링과 오토스케일링', blurb: 'requests·limits로 자리를 잡고, HPA와 Cluster Autoscaler로 늘리기.', minutes: 13, level: '중급' },
      { id: 'rolling-update', title: '롤링 업데이트와 롤백', blurb: '무중단으로 새 버전을 내보내고, 프로브로 지키고, 한 줄로 되돌리기.', minutes: 12, level: '중급' },
      { id: 'k8s-storage', title: 'PV·PVC·StatefulSet', blurb: 'Pod가 죽어도 남아야 하는 데이터와, 상태를 가진 워크로드 다루기.', minutes: 12, level: '중급' },
      { id: 'managed-k8s', title: 'EKS·AKS·GKE·NKS와 Helm', blurb: '관리형 쿠버네티스가 대신해 주는 일, 네 서비스의 차이, 패키지 매니저 Helm.', minutes: 13, level: '중급' },
    ],
  },
  {
    id: 'ch08', title: 'Terraform과 IaC', color: 'olive', phase: 'next',
    lessons: [
      { id: 'iac-why', title: '왜 코드로 인프라를 짓는가', blurb: '콘솔 클릭의 한계에서 선언형 IaC까지: 재현, 리뷰, 되돌리기.', minutes: 10, level: '초급' },
      { id: 'tf-workflow', title: 'init · plan · apply', blurb: 'main.tf 한 파일을 따라가며 Terraform이 인프라를 만드는 과정 보기.', minutes: 13, level: '초급' },
      { id: 'tf-state', title: 'State와 백엔드', blurb: 'Terraform의 기억인 state: 원격 저장, 잠금, 드리프트.', minutes: 12, level: '중급' },
      { id: 'tf-modules', title: '변수·모듈·환경 분리', blurb: '같은 코드로 dev·stg·prod를 찍어내는 구조 만들기.', minutes: 12, level: '중급' },
      { id: 'tf-multicloud', title: '멀티 프로바이더', blurb: '한 번의 apply로 AWS·Azure·GCP·NCP에 걸친 인프라 만들기.', minutes: 13, level: '중급' },
    ],
  },
  {
    id: 'ch09', title: 'CI/CD와 GitOps', color: 'slate', phase: 'next',
    lessons: [
      { id: 'ci-pipeline', title: 'CI 파이프라인', blurb: 'push할 때마다 빌드하고 테스트해서, 깨진 코드가 main에 못 들어오게.', minutes: 12, level: '초급' },
      { id: 'image-pipeline', title: '이미지 빌드·스캔·푸시', blurb: '커밋 하나가 서명된 컨테이너 이미지가 되어 레지스트리에 놓이기까지.', minutes: 12, level: '중급' },
      { id: 'deploy-strategies', title: '롤링·블루그린·카나리', blurb: '새 버전을 안전하게 내보내는 세 가지 방법과 각각의 비용.', minutes: 12, level: '중급' },
      { id: 'gitops', title: 'GitOps와 Argo CD', blurb: 'Git을 유일한 진실로 삼고, 클러스터가 스스로 Git을 따라오게 하기.', minutes: 13, level: '중급' },
    ],
  },
  {
    id: 'ch10', title: '관측·보안·비용', color: 'yellow', phase: 'next',
    lessons: [
      { id: 'observability', title: '메트릭·로그·트레이스', blurb: '시스템 안을 들여다보는 세 가지 신호와 Prometheus·Grafana 스택.', minutes: 12, level: '중급' },
      { id: 'secrets-kms', title: '시크릿과 암호화', blurb: '비밀번호를 코드에서 몰아내기: KMS, 시크릿 매니저, 봉투 암호화.', minutes: 12, level: '중급' },
      { id: 'finops', title: '비용 관리와 FinOps', blurb: '청구서를 읽고, 태그로 나누고, 약정과 스팟으로 줄이기.', minutes: 11, level: '중급' },
      { id: 'backup-dr', title: '백업과 재해 복구', blurb: 'RTO·RPO로 목표를 정하고, 네 가지 DR 전략 중 맞는 것을 고르기.', minutes: 12, level: '중급' },
    ],
  },
  {
    id: 'ch11', title: '멀티클라우드 플랫폼', color: 'navy', phase: 'next',
    lessons: [
      { id: 'why-multicloud', title: '왜 멀티클라우드인가', blurb: '쓰는 이유와 치르는 값: 종속, 규제, 장애, 그리고 복잡도.', minutes: 11, level: '중급' },
      { id: 'multicloud-network', title: '멀티클라우드 네트워크', blurb: '겹치지 않는 IP 설계부터 VPN 메시, 전용선 허브까지 클라우드 잇기.', minutes: 13, level: '고급' },
      { id: 'multicloud-k8s', title: '멀티클라우드 쿠버네티스', blurb: '여러 클라우드의 클러스터를 하나의 플릿처럼 배포하고 운영하기.', minutes: 13, level: '고급' },
      { id: 'multicloud-identity-data', title: 'ID 연합과 데이터', blurb: '한 번의 로그인으로 모든 클라우드에, 그리고 데이터 중력 다루기.', minutes: 13, level: '고급' },
      { id: 'capstone', title: '멀티클라우드 플랫폼 설계', blurb: '지금까지의 모든 조각을 모아 하나의 플랫폼으로: 종합 설계.', minutes: 15, level: '고급' },
    ],
  },
];

export const LESSON_META = {};
export const ORDER = [];
CHAPTERS.forEach((ch, ci) => {
  ch.no = String(ci + 1).padStart(2, '0');
  ch.lessons.forEach((l, li) => {
    LESSON_META[l.id] = { ...l, chapter: ch, index: li };
    ORDER.push(l.id);
  });
});
