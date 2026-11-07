import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download as DownloadIcon, ExternalLink, RefreshCw, AlertCircle, Loader2, CheckCircle2,
  ChevronRight, Calendar, Tag, Github, Zap, Cpu, PlusCircle, Wrench, Trash2, Sparkles, Gauge, ShieldCheck,
  MonitorCheck,
} from 'lucide-react';
import {
  CHANNELS, PLATFORM_META, DEFAULT_ARCH, ASSET_KINDS, applyMirror, formatFileSize,
  formatDate, formatVersion, pickAllAssets, pickDownloads, extractArch, assetTypeLabel,
  type AssetKind, type Channel, type Platform,
} from '@/utils/releases';
import { useLatestRelease } from '@/hooks/useReleases';
import { useDetectedSystem, type DetectedSystem } from '@/hooks/useDetectedSystem';
import { useChangelog } from '@/hooks/useChangelog';
import { findChangelog } from '@/utils/changelog';

const REPO_URL = 'https://github.com/mcobs/ObsMCLauncher';

// 平台品牌 SVG 图标
function PlatformIcon({ platform, size = 28 }: { platform: Platform; size?: number }) {
  if (platform === 'windows') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.831" />
      </svg>
    );
  }
  if (platform === 'linux') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 0 0-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.563.187.166.124.282.295.396.521.108.245.18.519.20.815.014.218-.014.418-.075.61h-.003c-.046.151-.115.296-.2.431-.082.135-.183.255-.296.356-.092.085-.198.155-.314.21l-.006.003a.587.587 0 0 1-.058.025c.062.171.158.346.299.51.19.218.466.395.786.51.32.116.676.16 1.026.085.395-.085.786-.255 1.13-.51.345-.255.65-.601.866-1.046.215-.445.32-.97.32-1.564 0-.535-.105-1.066-.32-1.55-.214-.485-.515-.89-.866-1.205-.35-.315-.75-.535-1.13-.66-.395-.13-.786-.171-1.13-.13-.355.04-.69.18-.97.42l.013-.003c.045-.045.13-.07.21-.085.075-.014.155-.014.234-.014z" />
      </svg>
    );
  }
  // macOS / Apple
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}

function ChannelSwitcher({
  channel,
  onChange,
}: {
  channel: Channel;
  onChange: (c: Channel) => void;
}) {
  return (
    <div className="relative inline-flex rounded-full border border-border bg-bg-elevated/60 p-1 backdrop-blur">
      {CHANNELS.map(c => {
        const active = c.key === channel;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'text-white' : 'text-text-muted hover:text-text'
            }`}
          >
            {active && (
              <motion.span
                layoutId="channel-pill"
                className="absolute inset-0 -z-10 rounded-full btn-primary-gradient"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <span>{c.label}</span>
            {c.suffix && (
              <span className={`font-mono text-xs ${active ? 'text-white/70' : 'text-text-faint'}`}>
                {c.suffix}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function VersionInfoCard({
  channel,
  release,
  loading,
  error,
}: {
  channel: Channel;
  release: ReturnType<typeof useLatestRelease>['release'];
  loading: boolean;
  error: string | null;
}) {
  const meta = CHANNELS.find(c => c.key === channel)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-bg-elevated p-8 md:p-10 shadow-card"
    >
      <div className="glow-orb" style={{ width: 280, height: 280, background: meta.badgeColor, top: -100, right: -50, opacity: 0.16 }} />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${meta.badgeColor}22`, color: meta.badgeColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.badgeColor }} />
              {meta.label}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-text-muted"
              >
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">正在从 GitHub 拉取最新版本…</span>
              </motion.div>
            ) : error && !release ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-red-500"
              >
                <AlertCircle size={20} />
                <span className="text-sm">获取版本信息失败：{error}</span>
              </motion.div>
            ) : release ? (
              <motion.div
                key={release.tag_name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-2"
              >
                <div className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-text">
                  v{formatVersion(release.tag_name)}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDate(release.published_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Tag size={13} />
                    {release.tag_name}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-text-muted text-sm"
              >
                暂未发布该通道的版本
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="md:max-w-xs">
          <p className="text-sm leading-relaxed text-text-muted">{meta.description}</p>
        </div>
      </div>

      <ChangelogPanel release={release} />
    </motion.div>
  );
}

// 更新日志分类的颜色与图标
const SECTION_META: Record<string, { color: string; icon: typeof Zap }> = {
  新增: { color: '#10b981', icon: PlusCircle },
  修复: { color: '#3b82f6', icon: Wrench },
  优化: { color: '#a855f7', icon: Zap },
  移除: { color: '#6b7280', icon: Trash2 },
  性能: { color: '#f59e0b', icon: Gauge },
  安全: { color: '#ef4444', icon: ShieldCheck },
};
const DEFAULT_SECTION_META = { color: '#64748b', icon: Sparkles };

function ChangelogPanel({ release }: { release: { tag_name: string } | null }) {
  const { versions, loading } = useChangelog();
  const [expanded, setExpanded] = useState(false);

  if (!release) return null;

  const entry = findChangelog(versions, release.tag_name);

  if (loading) {
    return (
      <div className="relative mt-6 border-t border-border pt-5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 size={13} className="animate-spin" />
          正在加载更新日志…
        </div>
      </div>
    );
  }

  if (!entry || entry.sections.length === 0) return null;

  const totalItems = entry.sections.reduce((n, s) => n + s.items.length, 0);
  const showAll = expanded || totalItems <= 8;

  return (
    <div className="relative mt-6 border-t border-border pt-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <Sparkles size={14} className="text-accent" />
          更新说明
        </h4>
      </div>

      <div className="space-y-4">
        {entry.sections.map(section => {
          const meta = SECTION_META[section.title] ?? DEFAULT_SECTION_META;
          const Icon = meta.icon;
          const items = showAll ? section.items : section.items.slice(0, 3);
          return (
            <div key={section.title}>
              <div
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: meta.color }}
              >
                <Icon size={12} />
                {section.title}
                <span className="font-normal text-text-faint">({section.items.length})</span>
              </div>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-1.5 text-xs leading-relaxed text-text-muted"
                  >
                    <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {totalItems > 8 && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-3 inline-flex items-center gap-1 text-xs text-accent transition-colors hover:text-accent/80"
        >
          {expanded ? '收起更新说明' : `展开全部 ${totalItems} 条更新`}
          <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      )}
    </div>
  );
}

// 两类产物的定位：安装程序是主推路径，便携包是「不想装进系统」时的备选
const DOWNLOAD_KIND_META: Record<AssetKind, { label: string; hint: string }> = {
  installer: { label: '安装程序', hint: '带安装向导' },
  portable: { label: '便携包', hint: '免安装' },
};

function PlatformDownloadCard({
  platform,
  release,
  useMirror,
  detected,
}: {
  platform: Platform;
  release: ReturnType<typeof useLatestRelease>['release'];
  useMirror: boolean;
  detected: DetectedSystem;
}) {
  const meta = PLATFORM_META[platform];
  const isCurrent = detected.platform === platform;

  // 资产里确实存在当前系统的架构时才认它，否则退回平台推荐架构（例如 ARM64 用户碰上只发了 x64）
  const platformAssets = release ? pickAllAssets(release, platform) : [];
  const hasDetectedArch =
    isCurrent &&
    detected.archConfident &&
    platformAssets.some(a => extractArch(a.name) === detected.arch);

  const preferredArch = hasDetectedArch ? detected.arch : DEFAULT_ARCH[platform];
  const downloads = release
    ? pickDownloads(release, platform, preferredArch)
    : { installer: [], portable: [] };
  const isEmpty = downloads.installer.length === 0 && downloads.portable.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-bg-elevated p-7 shadow-soft transition-colors ${
        isCurrent
          ? 'border-accent/50 ring-1 ring-accent/15'
          : 'border-border hover:border-accent/40'
      }`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-soft blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-center gap-3 mb-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-bg-subtle text-text">
          <PlatformIcon platform={platform} size={26} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl font-semibold text-text">{meta.name}</h3>
            {isCurrent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                <MonitorCheck size={10} />
                当前系统
              </span>
            )}
          </div>
          <p className="text-xs text-text-faint">{meta.requirements}</p>
        </div>
      </div>

      <div className="relative flex-1 space-y-4">
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-border px-5 py-4 text-center text-sm text-text-muted">
            该通道暂无 {meta.name} 下载
          </div>
        ) : (
          ASSET_KINDS.map(kind => {
            const list = downloads[kind];
            if (list.length === 0) return null;

            const kindMeta = DOWNLOAD_KIND_META[kind];
            const isPrimary = kind === 'installer';

            return (
              <div key={kind} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium ${isPrimary ? 'text-accent' : 'text-text-muted'}`}>
                    {kindMeta.label}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[10px] text-text-faint">{kindMeta.hint}</span>
                </div>

                {list.map(asset => {
                  const arch = extractArch(asset.name);
                  const isPreferred = arch === preferredArch;
                  return (
                    <a
                      key={asset.name}
                      href={applyMirror(asset.browser_download_url, useMirror)}
                      title={asset.name}
                      className={`group/btn flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        isPrimary
                          ? `border bg-accent-soft/40 hover:bg-accent-soft/70 ${
                              isPreferred && isCurrent ? 'border-accent/60' : 'border-accent/30 hover:border-accent/60'
                            }`
                          : `border bg-bg-subtle/50 ${
                              isPreferred && isCurrent ? 'border-accent/40' : 'border-border hover:border-accent/40'
                            }`
                      }`}
                    >
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-medium ${
                          isPreferred
                            ? 'bg-accent text-white'
                            : 'bg-bg-subtle text-text-muted ring-1 ring-border'
                        }`}
                      >
                        {arch}
                      </span>

                      <span className={`flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs ${isPrimary ? 'font-semibold text-text' : 'font-medium text-text-muted'}`}>
                        {assetTypeLabel(asset.name)}
                        {isPreferred && isPrimary && (
                          <span className="rounded-full bg-accent/15 px-1.5 py-px text-[10px] font-medium text-accent">
                            {hasDetectedArch ? '当前系统' : '推荐'}
                          </span>
                        )}
                        {useMirror && <Zap size={10} className="shrink-0 text-accent/60" />}
                      </span>

                      <span className="shrink-0 font-mono text-[11px] text-text-faint">
                        {formatFileSize(asset.size)}
                      </span>
                    </a>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {release && (
        <a
          href={release.html_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
        >
          查看全部架构与历史版本
          <ChevronRight size={12} />
        </a>
      )}
    </motion.div>
  );
}

function MirrorToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-bg-elevated/60 p-4 transition-colors hover:border-accent/40">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-bg-subtle border border-border'
        }`}
      >
        <motion.span
          layout
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ${checked ? 'ml-6' : 'ml-1'}`}
        />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text">镜像下载</span>
          {checked && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent"
            >
              <CheckCircle2 size={11} /> 已启用
            </motion.span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-text-muted">
          为所有下载链接添加 <code className="font-mono text-accent">gh-proxy.com/</code> 前缀，加速中国大陆访问。
        </p>
      </div>
    </label>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Cpu;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-elevated/60 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-text">
        <Icon size={15} className="text-accent" />
        {title}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">{body}</p>
    </div>
  );
}

export default function Download() {
  const [channel, setChannel] = useState<Channel>('stable');
  const [useMirror, setUseMirror] = useState(false);
  const { release, loading, error } = useLatestRelease(channel);
  const detected = useDetectedSystem();

  const platforms: Platform[] = useMemo(() => ['windows', 'linux', 'macos'], []);

  return (
    <div className="relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="glow-orb" style={{ width: 420, height: 420, background: 'var(--accent)', top: -100, left: '20%', opacity: 0.18 }} />
        <div className="glow-orb" style={{ width: 360, height: 360, background: '#3b82f6', top: 60, right: '10%', opacity: 0.14 }} />
      </div>

      <section className="py-16 md:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated/70 px-3.5 py-1 text-xs text-text-muted mb-5">
              <DownloadIcon size={12} className="text-accent" />
              选择适合你的平台与通道
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight text-text">
              下载 <span className="text-gradient">ObsMCLauncher</span>
            </h1>
            <p className="mt-4 text-base md:text-lg text-text-muted max-w-xl mx-auto">
              所有版本均从 GitHub Release 自动获取，确保你拿到的总是最新且未被篡改的官方构建。
            </p>

            {/* 系统识别提示：下方对应平台卡片会同时高亮 */}
            <div className="mt-5 flex justify-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-full border border-accent/30 bg-accent-soft/60 px-3.5 py-1.5 text-xs font-medium text-accent">
                <MonitorCheck size={13} className="shrink-0" />
                <span>已为你匹配当前系统：{PLATFORM_META[detected.platform].name}</span>
                {detected.archConfident && (
                  <span className="font-mono text-[11px] opacity-80">· {detected.arch}</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* 通道切换 */}
          <div className="flex justify-center mb-8">
            <ChannelSwitcher channel={channel} onChange={setChannel} />
          </div>

          {/* 版本信息卡 */}
          <div className="mb-10 max-w-4xl mx-auto">
            <VersionInfoCard channel={channel} release={release} loading={loading} error={error} />
          </div>

          {/* 镜像下载选项 */}
          <div className="mb-8 max-w-4xl mx-auto">
            <MirrorToggle checked={useMirror} onChange={setUseMirror} />
          </div>

          {/* 平台下载卡片 */}
          <div className="max-w-5xl mx-auto grid gap-5 md:grid-cols-3">
            {platforms.map(p => (
              <PlatformDownloadCard
                key={p}
                platform={p}
                release={release}
                useMirror={useMirror}
                detected={detected}
              />
            ))}
          </div>

          {/* 安装须知：产物特性与卸载行为，文案与 .github/installer 下的向导页保持一致 */}
          <div className="mt-6 max-w-5xl mx-auto grid gap-4 md:grid-cols-3">
            <InfoPanel
              icon={Cpu}
              title="无需另装运行时"
              body="安装程序与便携包都是自包含发布，已内置 .NET 8 运行时，下载后即可运行。"
            />
            <InfoPanel
              icon={ShieldCheck}
              title="安装包暂未签名"
              body="Windows 会弹出 SmartScreen 提示，选「更多信息 → 仍要运行」；macOS 首次打开需右键 →「打开」，或在「隐私与安全性」中放行。"
            />
            <InfoPanel
              icon={Trash2}
              title="卸载前先备份"
              body="Windows 卸载会删除安装目录，OMCL 配置与「运行目录」模式的存档都在其中；macOS 的数据在 ~/Library/Application Support/ObsMCLauncher，卸载不会删除。"
            />
          </div>

          {/* 底部链接区 */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm">
            <a
              href={`${REPO_URL}/releases`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated/60 px-4 py-2 text-text-muted transition-colors hover:text-text hover:border-accent/40"
            >
              <Github size={14} />
              查看全部 GitHub Release
              <ExternalLink size={11} />
            </a>
            <a
              href={`${REPO_URL}/actions/workflows/release.yml`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-elevated/60 px-4 py-2 text-text-muted transition-colors hover:text-text hover:border-accent/40"
            >
              <RefreshCw size={14} />
              查看 CI 构建
              <ExternalLink size={11} />
            </a>
          </div>

          {/* 通道说明 */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="font-display text-xl font-semibold text-text mb-4">通道说明</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {CHANNELS.map(c => (
                <div
                  key={c.key}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    c.key === channel
                      ? 'border-accent/40 bg-accent-soft/40'
                      : 'border-border bg-bg-elevated/40'
                  }`}
                >
                  <span
                    className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: `${c.badgeColor}22`, color: c.badgeColor }}
                  >
                    {c.label[0]}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{c.label}</span>
                      {c.suffix && <span className="font-mono text-xs text-text-faint">{c.suffix}</span>}
                    </div>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 免责声明 */}
          <div className="mt-16 max-w-3xl mx-auto rounded-2xl border border-border bg-bg-subtle/40 p-5 text-center">
            <p className="text-xs text-text-faint leading-relaxed">
              ObsMCLauncher 采用 GPL-3.0 许可证开源。本启动器为第三方工具，与 Mojang Studios 和 Microsoft 无关。
              <br />
              下载即表示你已阅读并同意 <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="text-accent hover:underline">GPL-3.0 许可证</a> 的全部条款。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
