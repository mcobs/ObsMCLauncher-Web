import { useEffect, useState } from 'react';
import type { Platform } from '@/utils/releases';

export interface DetectedSystem {
  platform: Platform;
  /** x86 / x64 / arm64，与 Release 资产名里的架构段一致 */
  arch: string;
  /**
   * 架构是否来自明确信息（UA 里的 Win64 / arm64，或 Chromium 的高熵值）。
   * Safari / Firefox 的 macOS UA 无论 Intel 还是 Apple Silicon 都写「Intel」，
   * 这种情况只能按多数情况猜，不能对外宣称「已识别」。
   */
  archConfident: boolean;
}

// 识别不出来时按最常见组合兜底，保证 UI 始终有东西可高亮
const FALLBACK: DetectedSystem = { platform: 'windows', arch: 'x64', archConfident: false };

interface UaDataLike {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>;
}

function uaDataOf(navigatorRef: Navigator): UaDataLike | undefined {
  return (navigatorRef as Navigator & { userAgentData?: UaDataLike }).userAgentData;
}

/** 从 UA Client Hints / 传统 UA 判断操作系统 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return FALLBACK.platform;

  const hinted = uaDataOf(navigator)?.platform?.toLowerCase() ?? '';
  if (hinted.includes('windows')) return 'windows';
  if (hinted.includes('mac')) return 'macos';
  if (hinted.includes('linux')) return 'linux';

  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macos';
  // 其余（Linux、ChromeOS 等）在下载页里都落到 AppImage
  return 'linux';
}

/** 传统 UA 里的架构线索 */
export function detectArchFromUserAgent(platform: Platform): { arch: string; archConfident: boolean } {
  if (typeof navigator === 'undefined') return { arch: FALLBACK.arch, archConfident: false };
  const ua = navigator.userAgent;

  if (/arm64|aarch64|armv8/i.test(ua)) return { arch: 'arm64', archConfident: true };

  if (platform === 'windows') {
    // Win64 / WOW64 / x64 说明跑在 64 位系统上；纯 Win32 且无 WOW64 才是 32 位
    if (/Win64|WOW64|x64/i.test(ua)) return { arch: 'x64', archConfident: true };
    return { arch: 'x86', archConfident: true };
  }

  if (platform === 'macos') {
    return { arch: 'arm64', archConfident: false };
  }

  return { arch: 'x64', archConfident: false };
}

/** Chromium 的 UA-CH 架构值 → 资产名里的架构段 */
export function archFromHighEntropy(values: { architecture?: string; bitness?: string }): string | null {
  if (values.architecture === 'arm') return 'arm64';
  if (values.architecture === 'x86') return values.bitness === '32' ? 'x86' : 'x64';
  return null;
}

export function detectSystem(): DetectedSystem {
  const platform = detectPlatform();
  return { platform, ...detectArchFromUserAgent(platform) };
}

/**
 * 识别当前系统：先同步用 UA 猜一个（首屏就能高亮），
 * 再用 Chromium 的高熵值异步纠正架构（例如 Windows ARM64、Apple Silicon 上的 Chrome）。
 */
export function useDetectedSystem(): DetectedSystem {
  const [system, setSystem] = useState<DetectedSystem>(detectSystem);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const uaData = uaDataOf(navigator);
    if (!uaData?.getHighEntropyValues) return;

    let cancelled = false;
    uaData
      .getHighEntropyValues(['architecture', 'bitness'])
      .then(values => {
        const arch = archFromHighEntropy(values);
        if (!cancelled && arch) {
          setSystem(prev => ({ ...prev, arch, archConfident: true }));
        }
      })
      .catch(() => {
        // 高熵值可能被权限策略拒绝，保留 UA 的判断结果即可
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return system;
}
