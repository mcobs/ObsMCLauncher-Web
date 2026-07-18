// GitHub Release 相关类型与通道/平台匹配工具

export type Channel = 'stable' | 'pre' | 'rc' | 'beta';

export type Platform = 'windows' | 'linux' | 'macos';

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
  content_type: string;
}

export interface GithubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  prerelease: boolean;
  body: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export interface ChannelMeta {
  key: Channel;
  label: string;
  suffix: string;
  description: string;
  badgeColor: string;
}

export const CHANNELS: ChannelMeta[] = [
  {
    key: 'stable',
    label: '正式版',
    suffix: '',
    description: '接收稳定版更新，特性成熟可靠，推荐日常使用。',
    badgeColor: '#10b981',
  },
  {
    key: 'pre',
    label: '预览版',
    suffix: '.pre',
    description: '预览即将到来的新功能，基本可用，可能存在小问题。',
    badgeColor: '#3b82f6',
  },
  {
    key: 'rc',
    label: '预发布版',
    suffix: '.rc',
    description: '候选发布版本，已接近正式版质量，用于发布前的最后验证。',
    badgeColor: '#f59e0b',
  },
  {
    key: 'beta',
    label: '测试版',
    suffix: '.beta',
    description: '测试通道，包含最新实验性功能，可能不稳定。',
    badgeColor: '#ef4444',
  },
];

export function classifyChannel(tag: string): Channel {
  const lower = tag.toLowerCase();
  if (lower.includes('-beta')) return 'beta';
  if (lower.includes('-rc')) return 'rc';
  if (lower.includes('-pre') || lower.includes('-preview')) return 'pre';
  return 'stable';
}

export function pickLatestByChannel(releases: GithubRelease[], channel: Channel): GithubRelease | null {
  const filtered = releases.filter(r => classifyChannel(r.tag_name) === channel);
  if (filtered.length === 0) return null;
  filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  return filtered[0];
}

const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  windows: [/(-|_)win-x64\.zip$/i, /(-|_)win-x86\.zip$/i, /(-|_)win-arm64\.zip$/i],
  linux: [/(-|_)linux-x64\.(AppImage|zip)$/i, /(-|_)linux-arm64\.(AppImage|zip)$/i],
  macos: [/(-|_)osx-arm64\.zip$/i, /(-|_)osx-x64\.zip$/i],
};

// 默认推荐架构
export const DEFAULT_ARCH: Record<Platform, string> = {
  windows: 'x64',
  linux: 'x64',
  macos: 'arm64',
};

export const PLATFORM_META: Record<Platform, {
  name: string;
  osLabel: string;
  requirements: string;
  archs: string[];
  icon: 'windows' | 'apple' | 'linux';
}> = {
  windows: {
    name: 'Windows',
    osLabel: 'Windows 10 / 11',
    requirements: 'Windows 10 及更高版本',
    archs: ['x64', 'x86', 'arm64'],
    icon: 'windows',
  },
  linux: {
    name: 'Linux',
    osLabel: '主流发行版',
    requirements: 'Debian/Ubuntu/Arch/Fedora 等',
    archs: ['x64', 'arm64'],
    icon: 'linux',
  },
  macos: {
    name: 'macOS',
    osLabel: 'macOS 11+',
    requirements: 'macOS Big Sur 11 及更高版本',
    archs: ['arm64', 'x64'],
    icon: 'apple',
  },
};

export function pickAsset(release: GithubRelease, platform: Platform, arch: string): ReleaseAsset | null {
  const archPattern = new RegExp(`(-|_)${platform === 'windows' ? 'win' : platform === 'linux' ? 'linux' : 'osx'}-${arch}\\.(zip|AppImage)$`, 'i');
  return release.assets.find(a => archPattern.test(a.name)) ?? null;
}

export function pickAllAssets(release: GithubRelease, platform: Platform): ReleaseAsset[] {
  return release.assets.filter(a => PLATFORM_PATTERNS[platform].some(p => p.test(a.name)));
}

export function applyMirror(url: string, useMirror: boolean): string {
  if (!useMirror) return url;
  return `https://gh-proxy.com/${url}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

// 从文件名提取架构标识，例如 ObsMCLauncher-v1.0.0-win-x64.zip → x64
export function extractArch(name: string): string {
  const match = name.match(/(?:win|linux|osx)-(x86|x64|arm64)/i);
  return match ? match[1] : '未知';
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

// 把 tag (v1.0.0-rc.5) 转成更友好的版本号显示
export function formatVersion(tag: string): string {
  return tag.replace(/^v/, '');
}
