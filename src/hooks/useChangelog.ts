import { useEffect, useState } from 'react';
import { parseChangelog, type ChangelogVersion } from '@/utils/changelog';

// 经 gh-proxy 加速访问 GitHub raw 资源
const CHANGELOG_URL =
  'https://gh-proxy.com/https://raw.githubusercontent.com/mcobs/ObsMCLauncher/refs/heads/main/.github/changelogs/FULLCHANGELOG.md';
const RAW_CHANGELOG_URL =
  'https://raw.githubusercontent.com/mcobs/ObsMCLauncher/refs/heads/main/.github/changelogs/FULLCHANGELOG.md';
// v2：旧缓存解析结果可能有误，换 key 强制失效
const CACHE_KEY = 'obsmc-changelog-cache-v2';
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

interface CacheEntry {
  ts: number;
  data: ChangelogVersion[];
}

function readCache(): ChangelogVersion[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(data: ChangelogVersion[]) {
  try {
    const entry: CacheEntry = { ts: Date.now(), data };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage 满了就算了
  }
}

export function useChangelog(): {
  versions: ChangelogVersion[];
  loading: boolean;
  error: string | null;
} {
  const [versions, setVersions] = useState<ChangelogVersion[]>(() => readCache() ?? []);
  const [loading, setLoading] = useState(versions.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 有缓存先展示，同时后台刷新保证内容最新（stale-while-revalidate）
      if (versions.length === 0) setLoading(true);
      const fetchText = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      };
      try {
        let text: string;
        try {
          text = await fetchText(CHANGELOG_URL);
        } catch {
          // gh-proxy 不可用时回退到官方 raw 源
          text = await fetchText(RAW_CHANGELOG_URL);
        }
        if (cancelled) return;
        const parsed = parseChangelog(text);
        setVersions(parsed);
        writeCache(parsed);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        const cached = readCache();
        if (cached) setVersions(cached);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // 仅挂载时执行；缓存内容变化由 setVersions 驱动
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { versions, loading, error };
}
