import { useEffect, useState, useCallback } from 'react';
import type { GithubRelease, Channel } from '@/utils/releases';
import { pickLatestByChannel } from '@/utils/releases';

const REPO = 'mcobs/ObsMCLauncher';
const ENDPOINT = `https://api.github.com/repos/${REPO}/releases?per_page=100`;
const CACHE_KEY = 'obsmc-releases-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

interface CacheEntry {
  ts: number;
  data: GithubRelease[];
}

function readCache(): GithubRelease[] | null {
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

function writeCache(data: GithubRelease[]) {
  try {
    const entry: CacheEntry = { ts: Date.now(), data };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage 满了就算了
  }
}

interface UseReleasesResult {
  releases: GithubRelease[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useReleases(): UseReleasesResult {
  const [releases, setReleases] = useState<GithubRelease[]>(() => readCache() ?? []);
  const [loading, setLoading] = useState<boolean>(releases.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchReleases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINT, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: GithubRelease[] = await res.json();
      setReleases(data);
      writeCache(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      // 降级：用缓存（哪怕过期）
      const cached = readCache();
      if (cached) setReleases(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (releases.length === 0) {
      fetchReleases();
    }
  }, [releases.length, fetchReleases]);

  return { releases, loading, error, refresh: fetchReleases };
}

export function useLatestRelease(channel: Channel): {
  release: GithubRelease | null;
  loading: boolean;
  error: string | null;
} {
  const { releases, loading, error } = useReleases();
  const release = pickLatestByChannel(releases, channel);
  return { release, loading, error };
}
