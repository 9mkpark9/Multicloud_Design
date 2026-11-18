export default {
  id: 'linux-basics',
  learn: [
    'SSH 키로 서버에 들어가는 원리',
    '디렉터리 트리와 권한(rwx, 644 · 600 · 755)',
    'sudo와 패키지 관리자로 프로그램 설치하기',
    '프로세스와 포트, systemd 서비스와 로그',
    '흔한 사고: root 로그인 · chmod 777 · 디스크 100%',
  ],
  legend: [['ctrl', 'SSH · 명령'], ['build', '패키지'], ['data', '로그 쓰기'], ['bad', '공격 · 실패']],
  metrics: [
    { id: 'login', label: '로그인 방식', icon: 'key' },
    { id: 'hole', label: '열린 구멍', icon: 'unlock' },
    { id: 'svc', label: 'nginx 상태', icon: 'server' },
    { id: 'disk', label: '디스크 /', icon: 'hard-drive' },
  ],
  scene: {
    zones: {
      srv: { at: [1, -1], size: [4.8, 5], label: 'web-1 VM', color: 'blue' },
    },
    nodes: {
      me: { kind: 'client', at: [7.2, 2.8], label: '내 노트북' },
      sshd: { at: [4.6, 0.2], label: 'sshd', sub: 'SSH 서버', icon: 'terminal', color: 'slate' },
      // 파일 (3–4단계)
      home: { kind: 'tile', at: [2.2, 2.6], label: '/home/ubuntu', icon: 'home', color: 'sand' },
      conf: { kind: 'tile', at: [2.2, 0.2], label: '/etc', icon: 'settings', color: 'olive' },
      log: { kind: 'tile', at: [4.6, 2.6], label: '/var/log', icon: 'scroll', color: 'sand' },
      // 서비스
      nginx: { at: [2.2, 2.6], label: 'nginx', sub: '웹 서버', icon: 'server', color: 'green' },
      systemd: { at: [2.2, 0.2], label: 'systemd', sub: 'PID 1', icon: 'settings', color: 'purple' },
      disk: { kind: 'cyl', at: [2.2, 0.2], label: '디스크 /', icon: 'hard-drive', color: 'orange' },
      // 바깥
      repo: { kind: 'cyl', at: [-1.6, 0.8], label: '패키지 저장소', icon: 'package', color: 'gray' },
      bot: { kind: 'client', at: [7.4, -0.6], label: '봇 스캐너' },
    },
    edges: {
      e_ssh: { from: 'me', to: 'sshd', label: '22' },
      e_repo: { from: 'repo', to: 'nginx', style: 'dashed', label: 'apt' },
      e_curl: { from: 'sshd', to: 'nginx', style: 'dashed' },
      e_sd: { from: 'systemd', to: 'nginx', style: 'dashed' },
      e_log: { from: 'nginx', to: 'log', style: 'dashed' },
      e_disk: { from: 'log', to: 'disk' },
      e_bot: { from: 'bot', to: 'sshd', tone: 'bad' },
    },
  },
  steps: [
    {
      key: '터미널뿐', kind: 'problem', title: '서버에는 화면이 없습니다',
      body: [
        '서버리스 미니 프로젝트에서는 Lambda가 서버를 대신 돌봐 줬습니다. 이번에는 <code>shop.example</code>의 웹 서버를 Ubuntu VM 한 대에 직접 올립니다. 그런데 VM에는 바탕화면도 마우스도 없습니다.',
        '손에 쥔 것은 공인 IP 하나와 터미널뿐입니다. 접속하고, 설정을 고치고, 프로그램을 깔아 켜고, 문제가 나면 로그를 읽는 일을 전부 <b>명령어</b>로 해야 합니다.',
      ],
      callout: { type: 'key', text: '컨테이너 이미지 안도, 쿠버네티스 노드도 대부분 Linux입니다. 클라우드에서 장애를 쫓는 일은 결국 <b>셸 한 줄</b>에서 시작해요.' },
      show: ['srv', 'me', 'sshd'],
      set: { sshd: { state: 'dim' } },
      tags: [{ on: 'me', text: '203.0.113.10', icon: 'pin', pos: 'bottom' }],
      flows: [{ path: ['me', 'sshd'], kind: 'ctrl', n: 2 }],
      metrics: { login: '—', hole: '—', svc: '없음', disk: '18%' },
    },
    {
      key: 'SSH 키', kind: 'concept', title: 'SSH 키: 비밀번호 대신 열쇠 한 쌍',
      body: [
        '<b>SSH</b>는 원격 서버의 셸을 암호화된 연결로 여는 프로토콜이고, 서버에서는 <code>sshd</code>가 22번 포트에서 기다립니다. 로그인은 비밀번호 대신 <b>키 쌍</b>으로 합니다.',
        '<b>공개키</b>는 서버의 <code>~/.ssh/authorized_keys</code>에 등록하고, <b>개인키</b>는 내 노트북에만 둡니다. 서버는 "짝이 맞는 개인키를 가졌는지"만 확인하므로 개인키는 네트워크를 건너가지 않습니다. VM을 만들 때 고르는 <b>키 페어</b>가 바로 이것이에요.',
      ],
      callout: { type: 'warn', text: '개인키는 비밀번호와 같습니다. Git에 올리거나 메신저로 보내지 마세요.' },
      set: { sshd: { state: null } },
      focus: ['sshd'],
      tags: [{ on: 'me', text: '개인키 보관', icon: 'key', pos: 'bottom' }, { on: 'sshd', text: '공개키 등록됨', icon: 'lock' }],
      flows: [{ path: ['me', 'sshd'], kind: 'ctrl', n: 2 }, { path: ['sshd', 'me'], kind: 'res', delay: 1.4 }],
      code: {
        title: '내 노트북 → web-1', lang: 'sh', hl: [4],
        text: `$ ssh-keygen -t ed25519 -f ~/.ssh/shop
# shop = 개인키, shop.pub = 공개키

$ ssh -i ~/.ssh/shop ubuntu@203.0.113.10
Welcome to Ubuntu ...

# 여기부터는 서버 안
$ whoami
ubuntu
$ cat ~/.ssh/authorized_keys
ssh-ed25519 AAAAC3Nza... me@laptop`,
      },
      metrics: { login: ['SSH 키', 'ok'] },
      changes: [['+', '키 쌍 생성 (ed25519)'], ['+', '공개키 → authorized_keys']],
    },
    {
      key: '파일 트리', kind: 'concept', title: '모든 것은 / 아래 한 그루의 트리',
      body: [
        'Linux에는 C: 드라이브가 없습니다. 모든 파일이 루트 <code>/</code>에서 시작하는 하나의 트리에 달려 있어요. 설정은 <code>/etc</code>, 로그는 <code>/var/log</code>, 사용자 홈은 <code>/home/ubuntu</code>(줄여서 <code>~</code>)에 있습니다.',
        '<code>pwd</code>로 지금 위치를, <code>ls</code>로 목록을 보고, <code>cd</code>로 이동합니다. <code>less</code>로 읽고, <code>tail -f</code>로 늘어나는 로그를 지켜보고, 편집은 <code>nano</code>나 <code>vim</code>으로 합니다.',
      ],
      callout: { type: 'tip', text: '처음 보는 서버에서는 <code>/etc</code>(어떻게 설정됐나)와 <code>/var/log</code>(무슨 일이 있었나)부터 보면 길이 보입니다.' },
      show: ['home', 'conf', 'log'],
      tags: [
        { on: 'conf', text: '설정 파일', icon: 'settings' },
        { on: 'home', text: '~ = 내 홈', icon: 'home' },
      ],
      code: {
        title: 'web-1', lang: 'sh', hl: [1, 2, 3, 4],
        text: `$ pwd
/home/ubuntu
$ ls /
bin  boot  etc  home  usr  var  ...
$ cd /etc/ssh && ls
sshd_config  ssh_config  ...
$ less sshd_config          # q로 나가기
$ tail -f /var/log/syslog   # Ctrl+C로 멈춤`,
      },
    },
    {
      key: '권한', kind: 'concept', title: '권한: 누가 읽고, 쓰고, 실행하나',
      body: [
        '<code>ls -l</code> 맨 앞의 <code>rw-r--r--</code>는 <b>소유자 · 그룹 · 나머지</b> 세 칸의 권한입니다. <code>r</code>(읽기)=4, <code>w</code>(쓰기)=2, <code>x</code>(실행)=1을 더해 칸마다 숫자 하나로 적어요. <code>rw-r--r--</code>는 644입니다.',
        '설정 파일은 <code>644</code>(나만 쓰고 모두 읽기), 개인키·비밀값은 <code>600</code>(나만), 디렉터리와 실행 파일은 <code>755</code>가 기본입니다. 권한은 <code>chmod</code>, 소유자는 <code>chown</code>으로 바꿉니다.',
      ],
      callout: { type: 'tip', text: 'SSH는 권한에 깐깐합니다. 개인키가 644면 <code>UNPROTECTED PRIVATE KEY FILE</code> 경고와 함께 키를 쓰지 않아요. <code>chmod 600</code>이 답입니다.' },
      focus: ['home'],
      tags: [{ on: 'home', text: '개인키는 600', icon: 'lock', tone: 'ok' }, { on: 'conf', text: '설정은 644' }],
      code: {
        title: 'web-1', lang: 'sh', hl: [2, 3, 8, 9],
        text: `$ ls -l              # 날짜 열은 생략
-rw-r--r-- 1 ubuntu ubuntu  612 app.conf
-rw------- 1 ubuntu ubuntu  411 api.key
drwxr-xr-x 2 ubuntu ubuntu 4096 www
#  소유자 rw- · 그룹 r-- · 나머지 r--

# r=4  w=2  x=1  →  rw- = 6,  r-- = 4
$ chmod 644 app.conf     # rw-r--r--
$ chmod 600 api.key      # rw-------
$ sudo chown -R www-data:www-data www`,
      },
      metrics: { hole: ['0개', 'ok'] },
    },
    {
      key: 'sudo · 설치', kind: 'concept', title: 'sudo와 패키지 관리자로 설치합니다',
      body: [
        '패키지 설치, <code>/etc</code> 수정, 서비스 재시작처럼 시스템 전체에 영향을 주는 일은 최고 관리자 <b>root</b>만 할 수 있습니다. 평소에는 일반 사용자로 일하다가, 필요한 명령 앞에만 <code>sudo</code>를 붙여 잠깐 root 권한을 빌립니다.',
        '프로그램은 <b>패키지 관리자</b>가 배포판 저장소에서 의존성까지 함께 받아 설치합니다. <code>sudo apt install nginx</code> 한 줄이면 웹 서버가 깔립니다.',
      ],
      callout: { type: 'warn', text: '<code>sudo su</code>로 root 셸에 눌러앉지 마세요. 실수 한 번의 반경이 시스템 전체가 되고, 누가 무엇을 했는지도 흐려집니다.' },
      hide: ['home'],
      show: ['repo', 'nginx'],
      focus: ['nginx'],
      tags: [{ on: 'nginx', text: '설치 완료', tone: 'ok', icon: 'check', pos: 'bottom' }],
      flows: [{ path: ['repo', 'nginx'], kind: 'build', n: 3 }],
      panel: {
        title: '배포판별 패키지 관리자', icon: 'package',
        rows: [['Ubuntu · Debian', 'apt install nginx', 'info'], ['Amazon Linux · RHEL', 'dnf install nginx', 'accent'], ['목록 새로 받기', 'apt update', 'mute'], ['보안 업데이트', 'apt upgrade', 'warn']],
      },
      metrics: { svc: '설치됨', disk: '23%' },
      changes: [['+', 'nginx 패키지 (저장소에서)'], ['~', '디스크 18% → 23%']],
    },
    {
      key: '프로세스·포트', kind: 'concept', title: '프로세스와 포트: 누가 듣고 있나',
      body: [
        '실행 중인 프로그램을 <b>프로세스</b>라 하고, 저마다 번호(PID)가 있습니다. <code>ps aux</code>로 목록을 봅니다. 네트워크 서비스는 정해진 <b>포트</b>를 열고 연결을 기다려요(listen). <code>sshd</code>는 22, <code>nginx</code>는 80입니다.',
        '<code>ss -tlnp</code>는 어떤 프로세스가 어느 주소의 어느 포트에서 듣는지 보여 줍니다. <code>0.0.0.0:80</code>은 모든 네트워크에서, <code>127.0.0.1:5432</code>는 이 서버 안에서만 받는다는 뜻이에요.',
      ],
      callout: { type: 'tip', text: '"접속이 안 돼요"의 첫 질문은 <b>프로세스가 떠 있나, 그 포트에서 듣고 있나</b>입니다. 포트 이야기는 다음다음 레슨에서 더 합니다.' },
      hide: ['repo', 'conf'],
      tags: [{ on: 'sshd', text: ':22 듣는 중' }, { on: 'nginx', text: ':80 듣는 중', icon: 'radio' }],
      flows: [{ path: ['me', 'sshd'], kind: 'ctrl' }, { path: ['sshd', 'nginx'], kind: 'req', delay: 0.8 }, { path: ['nginx', 'sshd'], kind: 'res', delay: 1.8 }],
      code: {
        title: 'web-1', lang: 'sh', hl: [5, 7, 8, 9],
        text: `$ ps aux | grep nginx
root      1201  nginx: master process
www-data  1202  nginx: worker process

$ sudo ss -tlnp            # 일부 열 생략
Local Address:Port   Process
0.0.0.0:22           sshd
0.0.0.0:80           nginx
127.0.0.1:5432       postgres

$ curl -I http://localhost
HTTP/1.1 200 OK`,
      },
      metrics: { svc: ':80 대기' },
    },
    {
      key: 'systemd', kind: 'concept', title: 'systemd: 서비스를 켜고 지키고 기록합니다',
      body: [
        '<b>systemd</b>는 부팅 때 가장 먼저 뜨는 프로세스(PID 1)로, 서비스를 켜고 끄고 죽으면 다시 살립니다. <code>start</code>는 지금 켜기, <code>enable</code>은 <b>재부팅 후에도</b> 자동으로 켜기예요. 둘은 다른 명령입니다.',
        '서비스의 출력과 시작·종료 기록은 <b>journal</b>에 모이고 <code>journalctl -u nginx</code>로 봅니다. nginx처럼 접속 기록을 <code>/var/log/nginx/</code>에 따로 쓰는 프로그램도 있어요.',
      ],
      callout: { type: 'warn', text: '<code>start</code>만 하고 <code>enable</code>을 빠뜨리면, 서버가 재부팅된 날 웹 서버만 조용히 꺼져 있습니다.' },
      show: ['systemd'],
      focus: ['systemd'],
      flows: [{ path: ['systemd', 'nginx'], kind: 'ctrl' }, { path: ['nginx', 'log'], kind: 'data', n: 3, delay: 1 }],
      code: {
        title: 'web-1', lang: 'sh', hl: [1, 3, 9],
        text: `$ sudo systemctl enable --now nginx
$ systemctl status nginx
     Active: active (running)

$ sudo nginx -t                # 설정 문법 검사
$ sudo systemctl reload nginx  # 끊김 없이 반영

$ journalctl -u nginx --since "1 hour ago"
$ journalctl -u nginx -f       # 실시간`,
      },
      metrics: { svc: ['부팅 시 자동', 'ok'] },
      changes: [['+', 'enable: 재부팅 후 자동 시작'], ['+', 'journalctl로 서비스 로그']],
    },
    {
      key: '열어 둔 문', kind: 'case', title: '사례: 편하려고 열어 둔 두 개의 문',
      body: [
        '키 관리가 귀찮아 <code>root</code> 비밀번호 로그인을 켜고, <code>Permission denied</code>가 거슬려 웹 폴더에 <code>chmod -R 777</code>을 했습니다. 22번이 열린 서버에는 몇 분 안에 봇이 비밀번호를 대입하기 시작합니다.',
        '뚫리면 root는 서버 전체를, 777은 <b>누구나</b> 파일을 고칠 수 있게 해 웹 페이지 변조로 이어집니다. <code>sshd_config</code>에 <code>PermitRootLogin no</code>, <code>PasswordAuthentication no</code>를 두고, 폴더는 <code>chown</code>으로 주인을 맞춘 뒤 755·644로 돌립니다.',
      ],
      callout: { type: 'key', text: '777은 권한 문제를 푸는 법이 아니라 <b>권한을 없애는</b> 법입니다. "누가 써야 하나"를 먼저 묻고 소유자를 맞추세요.' },
      hide: ['systemd', 'log'],
      show: ['bot'],
      set: { sshd: { state: 'hot', badge: 'root 로그인', tone: 'bad' }, nginx: { badge: '777', tone: 'bad' } },
      tags: [{ on: 'bot', text: '비밀번호 대입', tone: 'bad', icon: 'bug' }, { on: 'nginx', text: '누구나 쓰기 가능', tone: 'bad', icon: 'unlock', pos: 'bottom' }],
      flows: [{ path: ['bot', 'sshd'], kind: 'bad', n: 5, gap: 0.3 }],
      metrics: { login: ['root 비밀번호', 'bad'], hole: ['2개', 'bad'] },
      changes: [['-', 'root 비밀번호 로그인'], ['-', 'chmod -R 777'], ['+', '키 로그인만 · 소유자 맞추고 755/644']],
    },
    {
      key: '디스크 100%', kind: 'case', title: '사례: 디스크 100%, 모든 것이 멈춥니다',
      body: [
        '어느 밤 사이트가 에러를 냅니다. 프로세스는 떠 있는데 로그에는 <code>No space left on device</code>. 같은 서버의 주문 앱이 디버그 로그를 켠 채 몇 주를 돌아 <b>디스크가 100%</b>가 됐습니다.',
        '<code>df -h</code>로 찬 디스크를, <code>du</code>로 큰 폴더를 찾습니다. 로그를 비우고 journal을 줄인 뒤, <b>logrotate</b>로 로그가 주기적으로 압축·삭제되게 합니다.',
      ],
      callout: { type: 'warn', text: '프로세스가 열어 둔 로그를 <code>rm</code>하면 공간이 바로 돌아오지 않습니다. <code>truncate</code>로 비우거나 서비스를 재시작하세요. 디스크 80%에 알람도 걸어 두세요.' },
      hide: ['bot'],
      show: ['log', 'disk'],
      set: { sshd: { state: null, badge: null }, nginx: { state: 'down', badge: '쓰기 실패', tone: 'bad' }, disk: { state: 'hot', badge: '100%', tone: 'bad' } },
      flows: [{ path: ['log', 'disk'], kind: 'data', n: 4, gap: 0.3 }, { path: ['nginx', 'log'], kind: 'bad', n: 2, delay: 0.8 }],
      code: {
        title: 'web-1', lang: 'sh', hl: [3, 7, 9, 10],
        text: `$ df -h /
Filesystem  Size  Used Avail Use%
/dev/root    20G   20G     0 100%

$ sudo du -sh /var/log/* | sort -h | tail -2
1.2G   /var/log/journal
 17G   /var/log/shop

$ sudo truncate -s 0 /var/log/shop/debug.log
$ sudo journalctl --vacuum-size=200M
$ df -h /
/dev/root    20G  8.1G   12G  41%`,
      },
      metrics: { login: ['SSH 키만', 'ok'], hole: ['0개', 'ok'], svc: ['쓰기 실패', 'bad'], disk: ['100%', 'bad'] },
      changes: [['~', '디스크 100% → 41%'], ['+', 'logrotate · 80% 알람']],
    },
    {
      key: '정리', kind: 'recap', title: '정리: 셸에서 서버를 읽는 순서',
      body: [
        '<b>SSH 키</b>로 들어가서(개인키는 600), <code>/etc</code>에서 설정을, <code>journalctl</code>과 <code>/var/log</code>에서 기록을 읽습니다. 프로그램은 <code>sudo apt</code>로 깔고, <code>systemctl enable --now</code>로 켜고, <code>ss -tlnp</code>로 포트를 확인합니다.',
        '편하자고 연 문(root 로그인, 777)은 사고로 돌아오고, 디스크는 조용히 찹니다. 다음 레슨에서는 이 서버가 가진 두 개의 IP 주소와, 네트워크를 설계할 때 쓰는 CIDR을 봅니다.',
      ],
      hide: ['disk', 'log'],
      show: ['systemd'],
      set: { nginx: { state: null, badge: null } },
      tags: [
        { on: 'sshd', text: '키로만 로그인', icon: 'key', pos: 'right' },
        { on: 'nginx', text: 'enable --now', icon: 'check', tone: 'ok', pos: 'bottom' },
        { on: 'systemd', text: 'journalctl -u', icon: 'scroll', pos: 'right' },
      ],
      flows: [{ path: ['me', 'sshd'], kind: 'ctrl' }, { path: ['systemd', 'nginx'], kind: 'ctrl', delay: 0.8 }],
      metrics: { svc: ['실행 중', 'ok'], disk: ['41%', 'ok'] },
    },
  ],
  quiz: [
    {
      q: 'ssh -i shop.pem ubuntu@… 를 실행했더니 "Permissions 0644 for \'shop.pem\' are too open" 경고와 함께 접속이 거부됩니다. 올바른 조치는?',
      options: ['chmod 777 shop.pem으로 권한을 넉넉히 준다', 'chmod 600 shop.pem으로 나만 읽게 한다', 'sudo ssh로 다시 실행한다', '서버에서 sshd를 재시작한다'],
      answer: 1,
      why: '개인키를 다른 사람도 읽을 수 있으면 SSH 클라이언트가 사용을 거부합니다. 소유자만 읽고 쓰는 600(또는 400)으로 줄여야 합니다. 777은 정반대이고, 문제는 서버가 아니라 내 노트북의 파일 권한이므로 sshd 재시작은 소용없습니다.',
    },
    {
      q: 'nginx 설정을 바꾸고 systemctl start nginx로 잘 띄웠습니다. 다음 날 정기 재부팅 뒤 사이트가 내려가 있습니다. 가장 가능성 높은 원인은?',
      options: ['재부팅하면 /etc의 설정 파일이 초기화되어서', 'enable을 하지 않아 부팅 때 자동으로 켜지지 않아서', '재부팅 후 nginx의 포트가 바뀌어서', '재부팅하면 패키지가 삭제되어서'],
      answer: 1,
      why: 'start는 지금 한 번 켜는 것이고, 부팅 때 자동으로 켜지게 하는 것은 enable입니다. 설정 파일과 패키지는 디스크에 남아 있으므로 재부팅으로 사라지지 않습니다. 보통 enable --now로 둘을 한 번에 합니다.',
    },
    {
      q: '서버에서 앱을 띄웠는데 밖에서 접속이 안 됩니다. ss -tlnp에는 127.0.0.1:3000 node가 보입니다. 무엇을 뜻할까요?',
      options: ['정상이다. 방화벽만 열면 된다', '앱이 서버 안에서 오는 연결만 받도록 떠 있다', '3000번 포트는 Linux에서 쓸 수 없다', 'node 프로세스가 죽었다'],
      answer: 1,
      why: '127.0.0.1은 자기 자신(loopback)입니다. 여기서 듣는 프로세스는 같은 서버 안의 연결만 받으니, 방화벽을 열어도 밖에서는 닿지 않습니다. 0.0.0.0으로 듣게 하거나, 앞에 nginx를 두고 내부로 넘기는 것이 보통입니다. 프로세스가 죽었다면 목록에 아예 보이지 않습니다.',
    },
    {
      q: '디스크가 100%라 17 GB짜리 로그 파일을 rm으로 지웠는데 df는 여전히 100%입니다. 왜일까요?',
      options: ['rm은 파일을 휴지통으로 옮기기 때문에', '그 파일을 아직 열고 있는 프로세스가 있어서', 'df 결과는 하루에 한 번만 갱신되어서', '로그는 항상 다른 디스크에 저장되어서'],
      answer: 1,
      why: 'Linux에서는 프로세스가 파일을 열고 있는 동안 이름을 지워도 실제 공간은 해제되지 않습니다. 그 프로세스를 재시작하거나, 처음부터 truncate로 내용을 비워야 합니다. Linux의 rm에는 휴지통이 없고, df는 즉시 반영됩니다.',
    },
  ],
};
