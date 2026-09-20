import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, FileCode, ExternalLink, ShieldCheck, Sparkles, Cloud, RefreshCw,
  Loader2, AlertCircle,
} from 'lucide-react';
import { Pill } from '@/components/docs';
import MarkdownDocs, { extractToc, preprocessMd, type TocItem } from '@/components/MarkdownDocs';

const REPO_URL = 'https://github.com/mcobs/ObsMCLauncher';
const DOC_PATH = 'Plugin-Development.md';

/** 在线文档源（按顺序尝试，jsDelivr 在国内可达性更好） */
const REMOTE_SOURCES = [
  { label: 'jsDelivr CDN', url: `https://cdn.jsdelivr.net/gh/mcobs/ObsMCLauncher@main/${DOC_PATH}` },
  { label: 'GitHub Raw', url: `https://raw.githubusercontent.com/mcobs/ObsMCLauncher/main/${DOC_PATH}` },
];

interface TocNode {
  id: string;
  label: string;
  children?: TocNode[];
}

function flattenIds(nodes: TocNode[]): string[] {
  return nodes.flatMap(n => [n.id, ...flattenIds(n.children ?? [])]);
}

/** 把 Markdown 标题列表转成三级目录树（h2 → h3 → h4） */
function tocFromTocItems(items: TocItem[]): TocNode[] {
  const roots: TocNode[] = [];
  let lastH2: TocNode | null = null;
  let lastH3: TocNode | null = null;

  for (const it of items) {
    if (it.level === 2) {
      lastH2 = { id: it.id, label: it.text, children: [] };
      lastH3 = null;
      roots.push(lastH2);
    } else if (it.level === 3 && lastH2) {
      lastH3 = { id: it.id, label: it.text, children: [] };
      (lastH2.children ??= []).push(lastH3);
    } else if (it.level >= 4) {
      const parent = lastH3 ?? lastH2;
      if (parent) (parent.children ??= []).push({ id: it.id, label: it.text });
    }
  }
  // 去掉空的 children 数组，避免渲染多余的缩进容器
  const clean = (nodes: TocNode[]): TocNode[] =>
    nodes.map(n => {
      const kids = n.children?.length ? clean(n.children) : undefined;
      return kids ? { ...n, children: kids } : { id: n.id, label: n.label };
    });
  return clean(roots);
}

/** 滚动侦测当前激活的章节 */
function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const idsRef = useRef(ids);
  idsRef.current = ids;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const list = idsRef.current;
        let current = list[0] ?? '';
        for (const id of list) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 110) current = id;
        }
        setActive(current);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return active;
}

function TocList({ items }: { items: TocNode[] }) {
  const active = useScrollSpy(useMemo(() => flattenIds(items), [items]));

  const render = (nodes: TocNode[], depth: number) => (
    <div className={depth > 0 ? 'mb-1 ml-3 space-y-0.5 border-l border-border pl-2' : 'space-y-0.5'}>
      {nodes.map(node => (
        <div key={node.id}>
          <a
            href={`#${node.id}`}
            className={`block rounded-lg px-3 transition-colors ${
              depth === 0 ? 'py-2 text-sm font-medium' : depth === 1 ? 'py-1.5 text-[13px]' : 'py-1 text-xs'
            } ${
              active === node.id
                ? 'bg-accent-soft text-accent'
                : 'text-text-muted hover:bg-bg-subtle hover:text-text'
            }`}
          >
            {node.label}
          </a>
          {node.children && node.children.length > 0 && render(node.children, depth + 1)}
        </div>
      ))}
    </div>
  );

  return <nav>{render(items, 0)}</nav>;
}

function DocSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="文档加载中">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-7 w-2/5 rounded-lg bg-bg-subtle" />
          <div className="h-4 w-full rounded bg-bg-subtle/70" />
          <div className="h-4 w-11/12 rounded bg-bg-subtle/70" />
          <div className="h-4 w-4/5 rounded bg-bg-subtle/70" />
        </div>
      ))}
    </div>
  );
}

export default function PluginAPI() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [source, setSource] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      for (const src of REMOTE_SOURCES) {
        try {
          const res = await fetch(src.url, { cache: 'no-store' });
          if (!res.ok) continue;
          const text = await res.text();
          if (!cancelled && text.length > 1000) {
            setMarkdown(text);
            setSource(src.label);
            setStatus('ok');
            return;
          }
        } catch {
          /* 尝试下一个源 */
        }
      }
      if (!cancelled) setStatus('error');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const processedMd = useMemo(() => (markdown ? preprocessMd(markdown) : null), [markdown]);
  const toc = useMemo(
    () => (processedMd ? tocFromTocItems(extractToc(processedMd)) : []),
    [processedMd],
  );
  const apiAnchorId = useMemo(
    () => toc.find(t => t.label.includes('API 参考'))?.id ?? '',
    [toc],
  );

  return (
    <div className="relative">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
        <div className="bg-grid absolute inset-0" />
        <div className="glow-orb left-[10%] top-[-120px] h-[360px] w-[360px] bg-accent/30" />
        <div className="glow-orb right-[5%] top-[-80px] h-[300px] w-[300px] bg-accent/15" />
      </div>

      {/* Hero */}
      <div className="container relative pt-16 pb-10 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-mono text-accent">
            <span className="inline-block h-px w-6 bg-accent/60" />
            Developer Documentation
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-text md:text-5xl">
            插件 <span className="text-gradient">API 文档</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-muted md:text-lg">
            本文档由仓库中的 <code className="rounded-md border border-border/70 bg-bg-subtle px-1.5 py-0.5 font-mono text-[0.85em]">{DOC_PATH}</code> 实时解析渲染，
            始终与 GitHub main 分支保持一致。内容涵盖插件结构、接口定义、全部 API 说明与示例插件。
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Pill tone="accent">.NET 8</Pill>
            <Pill tone="accent">C#</Pill>
            <Pill tone="accent">Avalonia UI</Pill>
            <Pill>事件驱动</Pill>
            <Pill>跨平台</Pill>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={`${REPO_URL}/blob/main/${DOC_PATH}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-bg-elevated/60 px-5 text-sm font-medium text-text-muted backdrop-blur transition-colors hover:border-accent/40 hover:text-text"
            >
              <FileCode size={15} /> 在 GitHub 查看
              <ExternalLink size={12} className="text-text-faint" />
            </a>
            {apiAnchorId && (
              <a
                href={`#${apiAnchorId}`}
                className="inline-flex h-10 items-center gap-2 rounded-full btn-primary-gradient px-5 text-sm font-medium text-white"
              >
                <BookOpen size={15} /> 浏览 API 参考
              </a>
            )}
            <div className="flex items-center gap-2 text-xs text-text-faint">
              {status === 'loading' && (
                <>
                  <Loader2 size={13} className="animate-spin text-accent" /> 正在拉取最新文档…
                </>
              )}
              {status === 'ok' && (
                <>
                  <Cloud size={13} className="text-accent" />
                  已加载最新版 · 来源：{source}
                  <button
                    type="button"
                    onClick={() => setReloadKey(k => k + 1)}
                    className="inline-flex items-center gap-1 text-text-muted transition-colors hover:text-accent"
                    aria-label="重新加载文档"
                  >
                    <RefreshCw size={12} /> 刷新
                  </button>
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle size={13} className="text-amber-500" /> 文档加载失败
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 正文 */}
      <div className="container relative pb-20">
        <div className="flex gap-10">
          {/* 侧边目录（桌面端） */}
          {toc.length > 0 && (
            <aside className="hidden w-60 shrink-0 lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-bg-elevated/50 p-3 backdrop-blur">
                <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-text-faint">
                  页面目录
                </div>
                <TocList items={toc} />
              </div>
            </aside>
          )}

          <div className="min-w-0 flex-1">
            {/* 移动端目录 */}
            {toc.length > 0 && (
              <details className="mb-10 rounded-xl border border-border bg-bg-elevated/50 lg:hidden">
                <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-medium text-text">
                  页面目录（点击展开）
                </summary>
                <div className="border-t border-border px-3 pb-3 pt-2">
                  <TocList items={toc} />
                </div>
              </details>
            )}

            {status === 'loading' && <DocSkeleton />}

            {status === 'error' && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-6 py-8 text-center">
                <AlertCircle size={26} className="mx-auto mb-3 text-amber-500" />
                <h2 className="font-display text-lg font-semibold text-text">无法加载在线文档</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
                  已尝试 jsDelivr CDN 与 GitHub Raw 两个源均未成功，可能是网络受限或仓库暂时不可访问。
                  你可以重试，或直接在 GitHub 上阅读原文。
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setReloadKey(k => k + 1)}
                    className="inline-flex h-10 items-center gap-2 rounded-full btn-primary-gradient px-5 text-sm font-medium text-white"
                  >
                    <RefreshCw size={15} /> 重新加载
                  </button>
                  <a
                    href={`${REPO_URL}/blob/main/${DOC_PATH}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-bg-elevated/60 px-5 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text"
                  >
                    <ExternalLink size={14} /> 阅读 GitHub 原文
                  </a>
                </div>
              </div>
            )}

            {status === 'ok' && processedMd && <MarkdownDocs md={processedMd} />}

            {/* 底部 */}
            <div className="mt-16 flex flex-col items-center gap-4 border-t border-border/60 pt-10 text-center">
              <Sparkles className="text-accent" size={20} />
              <p className="text-sm text-text-muted">祝您开发愉快！如有任何问题，欢迎在 GitHub 上提问或参与讨论。</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/download"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-bg-elevated/60 px-5 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text"
                >
                  <ShieldCheck size={15} /> 前往下载启动器
                </Link>
                <a
                  href={`${REPO_URL}/issues`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-bg-elevated/60 px-5 text-sm font-medium text-text-muted transition-colors hover:border-accent/40 hover:text-text"
                >
                  <FileCode size={15} /> 反馈问题
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
