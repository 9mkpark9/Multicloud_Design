// Icon registry: lesson content refers to icons by these kebab-case names.
// Each entry is a Lucide icon node list ([tag, attrs][]), drawn on a 24×24 box.
import {
  Server, Database, Globe, Cloud, User, Users, Laptop, Lock, LockOpen, Key, KeyRound, Shield, ShieldCheck,
  ShieldAlert, Package, PackageCheck, Container, Layers, Network, Router, GitBranch, GitMerge,
  GitPullRequest, GitCommitHorizontal, Hammer, FlaskConical, Rocket, FileCode, FileText, FileKey, File,
  Terminal, Cpu, HardDrive, Folder, FolderTree, Zap, Clock, Timer, Activity, Gauge, Bell, Mail, Search,
  Eye, Split, Shuffle, Repeat, RefreshCw, Scale, Coins, MapPin, Waypoints, Cable, Wifi, RadioTower,
  ShipWheel, Anchor, Boxes, Blocks, Box, Workflow, Check, X, TriangleAlert, List, ListOrdered, BookOpen,
  Settings, Moon, Sun, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowLeftRight, ChevronRight,
  ChevronDown, DoorOpen, Building2, Factory, Warehouse, Archive, ScrollText, IdCard, Fingerprint,
  Monitor, Smartphone, Table, ChartLine, ChartColumn, Bug, Puzzle, Tag, Webhook, CalendarClock,
  MessageSquare, Send, Inbox, Funnel, Code, Braces, Variable, Plug, Unplug, Power, HeartPulse, Siren,
  LifeBuoy, Copy, Undo2, SlidersHorizontal, Target, Flag, Trophy, GraduationCap, Map as MapIcon, Route,
  Signpost, Compass, Sparkles, Lightbulb, Menu, SignalHigh, CircleCheck, CircleX, Circle, Plus, Minus,
  ExternalLink, CloudCog, ServerCog, Component, LayoutGrid, Wrench, Earth, Link, Scan, Image, Save,
  Upload, Download, History, GitFork, SquareTerminal, Radar, Bot, ClipboardCheck, ClipboardList,
  CircleDollarSign, PiggyBank, Receipt, TrendingUp, TrendingDown, Snowflake, Flame, Hourglass,
  Megaphone, Satellite, Share2, Merge, SquareStack, Hexagon, Hash, Percent, Info, CircleHelp, Ban,
  UserCheck, UserCog, BadgeCheck, Pencil, House, Store, ShoppingCart, CreditCard, Landmark, Keyboard,
  Star, Truck, ArrowUpRight, ArrowDown, ArrowUp, ChevronLeft, ChevronUp, Radio, Grid3x3,
} from 'lucide';

export const ICONS = {
  // compute & infra
  server: Server, 'server-cog': ServerCog, cpu: Cpu, 'hard-drive': HardDrive, database: Database,
  container: Container, box: Box, boxes: Boxes, blocks: Blocks, package: Package, 'package-check': PackageCheck,
  layers: Layers, stack: SquareStack, component: Component, hexagon: Hexagon, grid: LayoutGrid, cells: Grid3x3,
  cloud: Cloud, 'cloud-cog': CloudCog, zap: Zap, building: Building2, factory: Factory, warehouse: Warehouse,
  archive: Archive, image: Image, monitor: Monitor, laptop: Laptop, phone: Smartphone, bot: Bot,
  // network
  globe: Globe, earth: Earth, network: Network, router: Router, waypoints: Waypoints, cable: Cable,
  wifi: Wifi, tower: RadioTower, radio: Radio, satellite: Satellite, door: DoorOpen, split: Split,
  shuffle: Shuffle, route: Route, signpost: Signpost, link: Link, plug: Plug, unplug: Unplug,
  swap: ArrowLeftRight, share: Share2, merge: Merge, map: MapIcon, pin: MapPin, compass: Compass,
  // security & identity
  lock: Lock, unlock: LockOpen, key: Key, 'key-round': KeyRound, shield: Shield, 'shield-check': ShieldCheck,
  'shield-alert': ShieldAlert, fingerprint: Fingerprint, 'id-card': IdCard, user: User, users: Users,
  'user-check': UserCheck, 'user-cog': UserCog, badge: BadgeCheck, scroll: ScrollText, 'file-key': FileKey,
  scan: Scan, ban: Ban, eye: Eye,
  // code & delivery
  git: GitBranch, 'git-merge': GitMerge, 'git-pr': GitPullRequest, 'git-commit': GitCommitHorizontal,
  'git-fork': GitFork, hammer: Hammer, flask: FlaskConical, rocket: Rocket, 'file-code': FileCode,
  'file-text': FileText, file: File, terminal: Terminal, 'terminal-square': SquareTerminal, code: Code,
  braces: Braces, variable: Variable, workflow: Workflow, webhook: Webhook, tag: Tag, puzzle: Puzzle,
  wrench: Wrench, settings: Settings, sliders: SlidersHorizontal, bug: Bug, helm: ShipWheel, anchor: Anchor,
  folder: Folder, 'folder-tree': FolderTree, save: Save, upload: Upload, download: Download, copy: Copy,
  undo: Undo2, history: History, repeat: Repeat, refresh: RefreshCw, power: Power, truck: Truck,
  // data & messaging
  table: Table, inbox: Inbox, send: Send, mail: Mail, message: MessageSquare, bell: Bell, megaphone: Megaphone,
  funnel: Funnel, hash: Hash, search: Search,
  // ops & money
  activity: Activity, gauge: Gauge, 'chart-line': ChartLine, 'chart-bar': ChartColumn, radar: Radar,
  'heart-pulse': HeartPulse, siren: Siren, lifebuoy: LifeBuoy, clock: Clock, timer: Timer,
  calendar: CalendarClock, hourglass: Hourglass, coins: Coins, dollar: CircleDollarSign, piggy: PiggyBank,
  receipt: Receipt, 'trending-up': TrendingUp, 'trending-down': TrendingDown, scale: Scale, percent: Percent,
  snowflake: Snowflake, flame: Flame, signal: SignalHigh,
  // people & places
  home: House, store: Store, cart: ShoppingCart, card: CreditCard, bank: Landmark,
  // ui
  check: Check, x: X, warn: TriangleAlert, info: Info, help: CircleHelp, list: List, steps: ListOrdered,
  book: BookOpen, moon: Moon, sun: Sun, play: Play, pause: Pause, replay: RotateCcw, 'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight, 'arrow-up-right': ArrowUpRight, 'arrow-down': ArrowDown, 'arrow-up': ArrowUp,
  'chevron-right': ChevronRight, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp, menu: Menu, 'circle-check': CircleCheck, 'circle-x': CircleX, circle: Circle,
  plus: Plus, minus: Minus, external: ExternalLink, sparkles: Sparkles, bulb: Lightbulb, target: Target,
  flag: Flag, trophy: Trophy, cap: GraduationCap, clipboard: ClipboardCheck, 'clipboard-list': ClipboardList,
  pencil: Pencil, keyboard: Keyboard, star: Star,
};

export const ICON_NAMES = Object.keys(ICONS);

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Inner SVG markup (no <svg> wrapper) for an icon, drawn in a 24×24 box. */
export function iconInner(name) {
  const node = ICONS[name];
  if (!node) return '';
  return node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')}/>`)
    .join('');
}

/** A standalone inline <svg> icon for HTML UI. */
export function icon(name, size = 16, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconInner(name)}</svg>`;
}

/** An icon placed inside an SVG scene, centred on (cx, cy). */
export function iconAt(name, cx, cy, size = 22, extra = '') {
  const s = size / 24;
  return `<g class="n-ico" transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${s.toFixed(3)})" fill="none" stroke-width="${(1.9 / s * (size / 22)).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" ${extra}>${iconInner(name)}</g>`;
}
