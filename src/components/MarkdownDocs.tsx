import { useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Puzzle, Terminal, FolderTree, Package, Braces, BookOpen, GitBranch, FlaskConical,
  Rocket, FileCode, LayoutTemplate, HelpCircle, Link2, Heart, ScrollText, Zap,
  LayoutGrid, Bug, Siren, Blocks, Boxes, Monitor, SearchCode, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { CodeBlock, C, Callout, FaqItem } from './docs';

/** 从 React 子节点中递归提取纯文本 */
function extractText(node: ReactNode): string {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object') {
    const el = node as unknown as { props?: { children?: ReactNode } };
    if (el.props) return extractText(el.props.children);
  }
  return '';
}

/**
 * 标题转锚点 ID，算法与 GitHub 保持一致：
 * 小写化 → 去掉标点和 emoji（只保留字母、数字、空格、连字符）→ 空格转连字符。
 * 这样文档正文里的站内链接（如 [3.1](#31-注册标签页)）才能正确跳转。
 * 重复标题按 GitHub 规则追加 -1、-2…
 */
function slugify(text: string, seen: Map<string, number>): string {
  let base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim() // 移除 emoji 后可能残留首尾空格（如 "🔧 API 参考" → " api 参考"）
    .replace(/\s+/g, '-');
  if (!base) base = 'section';
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/** 预处理：去掉文档自带的“目录”章节（页面有自己的侧边目录） */
export function preprocessMd(md: string): string {
  return md.replace(/^#{1,2}\s*[📖]*\s*目录[\s\S]*?(?=^##\s)/m, '');
}

/** 从 Markdown 提取标题目录（跳过 h1，与渲染器的 slug 规则一致） */
export function extractToc(md: string): TocItem[] {
  const seen = new Map<string, number>();
  const out: TocItem[] = [];
  let inCode = false;
  for (const line of md.split('\n')) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (m) {
      const text = m[2].replace(/[`*_]/g, '').trim();
      out.push({ id: slugify(text, seen), text, level: m[1].length });
    }
  }
  return out;
}

/* ============================ 结构化解析 ============================ */

type CalloutVariant = 'info' | 'warning' | 'tip';

interface HeadingBlock {
  kind: 'heading';
  level: number;
  text: string;
  id: string;
  num?: string;
  icon?: LucideIcon;
  badge?: string;
}
interface MdBlock { kind: 'md'; md: string }
interface CalloutBlock { kind: 'callout'; variant: CalloutVariant; title?: string; md: string }
interface CardsBlock {
  kind: 'cards';
  items: { icon?: LucideIcon; emoji?: string; title: string; desc: string }[];
}
interface FaqBlock { kind: 'faq'; id: string; q: string; md: string }

type Block = HeadingBlock | MdBlock | CalloutBlock | CardsBlock | FaqBlock;

/** 章节图标 + 徽标（与内置文档的 DocSection badge 风格一致） */
const SECTION_META: { key: string; icon: LucideIcon; badge: string }[] = [
  { key: '插件系统介绍', icon: Puzzle, badge: 'Overview' },
  { key: '开发环境', icon: Terminal, badge: 'Prerequisites' },
  { key: '插件目录位置', icon: FolderTree, badge: 'Layout' },
  { key: '插件结构', icon: Package, badge: 'Structure' },
  { key: '插件接口', icon: Braces, badge: 'Interfaces' },
  { key: 'API 参考', icon: BookOpen, badge: 'Reference' },
  { key: '开发流程', icon: GitBranch, badge: 'Workflow' },
  { key: '测试插件', icon: FlaskConical, badge: 'Testing' },
  { key: '发布流程', icon: Rocket, badge: 'Publishing' },
  { key: '示例插件', icon: FileCode, badge: 'Examples' },
  { key: 'UI 框架说明', icon: LayoutTemplate, badge: 'UI' },
  { key: '常见问题', icon: HelpCircle, badge: 'FAQ' },
  { key: '参考资源', icon: Link2, badge: 'Resources' },
  { key: '支持', icon: Heart, badge: 'Support' },
  { key: '许可证', icon: ScrollText, badge: 'License' },
];

/** 卡片图标（按标题关键字匹配，回退为 Puzzle / emoji） */
const CARD_ICONS: { key: string; icon: LucideIcon }[] = [
  { key: '性能', icon: Zap },
  { key: 'API', icon: BookOpen },
  { key: 'UI', icon: LayoutGrid },
  { key: '崩溃报告', icon: Bug },
  { key: '崩溃', icon: Siren },
  { key: '事件', icon: GitBranch },
  { key: '配置', icon: Package },
  { key: '跨平台', icon: Blocks },
  { key: '功能增强', icon: Puzzle },
  { key: '工具', icon: Terminal },
  { key: '集成', icon: Blocks },
  { key: 'SDK', icon: Boxes },
  { key: 'Visual', icon: Monitor },
  { key: 'Rider', icon: Monitor },
  { key: 'Git', icon: GitBranch },
  { key: 'ILSpy', icon: SearchCode },
  { key: 'dnSpy', icon: SearchCode },
  { key: 'Avalonia', icon: LayoutTemplate },
];

function decorateHeading(level: number, text: string) {
  if (level !== 2) return {};
  const meta = SECTION_META.find(s => text.includes(s.key));
  return meta ? { icon: meta.icon, badge: meta.badge } : {};
}

/** 卡片项解析：支持 "**标题**：说明"、"emoji 标题，说明"、"纯文本" */
function parseCardItem(raw: string) {
  const source = raw.trim().replace(/\s+/g, ' ');
  const emojiMatch = /^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*/u.exec(source);
  const emoji = emojiMatch?.[1];
  let rest = emoji ? source.slice(emojiMatch![0].length) : source;

  let title = rest;
  let desc = '';
  const bold = /^\*\*(.+?)\*\*\s*[:：]?\s*/.exec(rest);
  if (bold) {
    title = bold[1];
    desc = rest.slice(bold[0].length);
  } else {
    const sep = /^(.{2,30}?)[:：]\s*/.exec(rest);
    if (sep && !/^https?:/.test(rest)) {
      title = sep[1];
      desc = rest.slice(sep[0].length);
    }
  }
  return { emoji, title: title.trim(), desc: desc.trim() };
}

/** 判定一组列表项是否适合渲染成卡片网格 */
function toCards(items: string[]): CardsBlock['items'] | null {
  if (items.length < 2) return null;
  // 含代码围栏 / 换行 / Markdown 链接的列表保持原样，避免结构被压扁
  const hasComplex = items.some(t => t.includes('\n') || t.includes('```') || t.includes('](') || /^https?:\/\//.test(t.trim()));
  if (hasComplex) return null;
  const parsed = items.map(parseCardItem);
  const ok = parsed.every(p => p.title.length > 0 && p.title.length <= 30);
  if (!ok) return null;
  return parsed.map(p => {
    const hit = CARD_ICONS.find(c => p.title.includes(c.key));
    return {
      icon: hit?.icon,
      emoji: hit ? undefined : p.emoji,
      title: p.title,
      desc: p.desc,
    };
  });
}

/** 引用块 → 提示/警告/技巧 */
function parseCallout(text: string) {
  const first = text.split('\n')[0] ?? '';
  let variant: CalloutVariant = 'info';
  if (/[⚠❗❌🚨]/.test(first) || /^(注意|警告|重要)/.test(first)) variant = 'warning';
  else if (/[💡✨🔔]/.test(first) || /^(提示|建议|小贴士)/.test(first)) variant = 'tip';

  let title: string | undefined;
  let rest = text;

  const bold = /^\s*(?:\p{Extended_Pictographic}️?\s*)?\*\*(.+?)\*\*\s*[:：]?\s*/u.exec(first);
  if (bold) {
    title = bold[1];
    rest = text.slice(bold[0].length);
  } else {
    const plain = /^\s*(?:\p{Extended_Pictographic}️?\s*)?([^:：\n]{2,12})[:：]\s*/u.exec(first);
    if (plain) {
      title = plain[1];
      rest = text.slice(plain[0].length);
    } else {
      rest = text.replace(/^\s*\p{Extended_Pictographic}️?\s*/u, '');
    }
  }
  if (!title) {
    title = variant === 'warning' ? '注意' : variant === 'tip' ? '提示' : undefined;
  }
  return { variant, title, body: rest.trim() };
}

/** 把 Markdown 拆成结构化区块（标题 / 提示块 / 卡片 / FAQ / 普通 Markdown） */
function parseBlocks(md: string, seen: Map<string, number>): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join('\n').trim();
    if (text) blocks.push({ kind: 'md', md: text });
    buf = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 代码围栏原样保留
    if (/^\s*```/.test(line)) {
      const fence = [line];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        fence.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        fence.push(lines[i]);
        i++;
      }
      buf.push(...fence);
      continue;
    }

    // 标题
    const heading = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1].length;
      const raw = heading[2].replace(/[`*_]/g, '').trim();
      const id = slugify(raw, seen);
      const isFaq = level === 3 && /^Q\s*[:：]/.test(raw);
      if (isFaq) {
        i++;
        const body: string[] = [];
        let inFence = false;
        while (i < lines.length) {
          const l = lines[i];
          if (/^\s*```/.test(l)) inFence = !inFence;
          if (!inFence && /^#{1,3}\s+/.test(l)) break;
          body.push(l);
          i++;
        }
        blocks.push({ kind: 'faq', id, q: raw.replace(/^Q\s*[:：]\s*/, ''), md: body.join('\n').trim() });
        continue;
      }
      // 支持 "1." / "3.1" 这类序号前缀（h3 / h4）
      const numMatch = level >= 3 ? /^(\d+(?:\.\d+)*\.)\s+/.exec(raw) : null;
      blocks.push({
        kind: 'heading',
        level,
        text: numMatch ? raw.slice(numMatch[0].length) : raw,
        id,
        num: numMatch?.[1],
        ...decorateHeading(level, raw),
      });
      i++;
      continue;
    }

    // 引用块
    if (/^\s*>\s?/.test(line)) {
      flush();
      const quoted: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      const { variant, title, body } = parseCallout(quoted.join('\n').trim());
      blocks.push({ kind: 'callout', variant, title, md: body });
      continue;
    }

    // 列表（可能是卡片）
    const isItem = (l: string) => /^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l);
    if (isItem(line)) {
      flush();
      const start = i;
      const items: string[] = [];
      let cur: string[] = [];
      while (i < lines.length && (isItem(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && !isItem(lines[i])))) {
        if (isItem(lines[i])) {
          if (cur.length) items.push(cur.join('\n'));
          cur = [lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, '')];
        } else {
          cur.push(lines[i].trim());
        }
        i++;
      }
      if (cur.length) items.push(cur.join('\n'));
      const cards = toCards(items);
      if (cards) blocks.push({ kind: 'cards', items: cards });
      else blocks.push({ kind: 'md', md: lines.slice(start, i).join('\n').trim() });
      continue;
    }

    buf.push(line);
    i++;
  }
  flush();
  return blocks;
}

/* ============================ 渲染 ============================ */

function makeComponents(): Components {
  return {
    h1: () => null,
    h2: ({ children }) => (
      <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight text-text md:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="!mt-8 font-display text-xl font-semibold text-text">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="!mt-6 font-display text-lg font-semibold text-text">{children}</h4>
    ),
    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
    a: ({ children, href }) => {
      const external = /^https?:\/\//.test(href ?? '');
      return (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
          className="break-all text-accent hover:underline"
        >
          {children}
        </a>
      );
    },
    pre: ({ children }) => {
      const child = (Array.isArray(children) ? children[0] : children) as
        | { props?: { className?: string; children?: ReactNode } }
        | undefined;
      const className = child?.props?.className ?? '';
      const lang = /language-([\w-]+)/.exec(className)?.[1] ?? 'text';
      const code = extractText(child?.props?.children);
      return <CodeBlock code={code.replace(/\n$/, '')} lang={lang} />;
    },
    code: ({ children }) => <C>{children}</C>,
    ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-6">{children}</ul>,
    ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-6">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto rounded-xl border border-border [&_tbody]:divide-y [&_tbody]:divide-border [&_tbody_tr:hover]:bg-bg-subtle/60">
        <table className="w-full min-w-[520px] text-sm">{children}</table>
      </div>
    ),
    // 注意：thead 的 children 是 <tr> 行元素，不能再套一层 <tr>，否则表头会错位
    thead: ({ children }) => <thead className="bg-bg-subtle">{children}</thead>,
    th: ({ children }) => (
      <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-faint">
        {children}
      </th>
    ),
    td: ({ children }) => <td className="px-4 py-2.5 align-top text-text-muted">{children}</td>,
    tr: ({ children }) => <tr className="transition-colors">{children}</tr>,
    blockquote: ({ children }) => (
      <blockquote className="my-4 rounded-xl border-l-4 border-accent/40 bg-accent-soft px-4 py-3 text-sm leading-relaxed">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-10 border-border/60" />,
    strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
    img: ({ src, alt }) => (
      <img
        src={typeof src === 'string' ? src : undefined}
        alt={alt ?? ''}
        className="my-4 max-w-full rounded-xl border border-border"
      />
    ),
  };
}

/** 行内 Markdown（用于卡片标题/描述） */
function InlineMd({ text, components }: { text: string; components: Components }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{ ...components, p: ({ children }) => <>{children}</> }}
    >
      {text}
    </ReactMarkdown>
  );
}

export default function MarkdownDocs({ md }: { md: string }) {
  const seen = useMemo(() => new Map<string, number>(), [md]);
  const blocks = useMemo(() => parseBlocks(md, seen), [md, seen]);
  const components = useMemo(() => makeComponents(), []);

  return (
    <div className="text-[15px] leading-relaxed text-text-muted">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        if (block.kind === 'md') {
          return (
            <ReactMarkdown key={key} remarkPlugins={[remarkGfm]} components={components}>
              {block.md}
            </ReactMarkdown>
          );
        }

        if (block.kind === 'heading') {
          const Icon = block.icon;
          if (block.level === 2) {
            return (
              <div key={key} className="mt-14 first:mt-0">
                <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-3">
                  {Icon && (
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Icon size={17} />
                    </span>
                  )}
                  <h2
                    id={block.id}
                    className="scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-text md:text-3xl"
                  >
                    {block.text}
                  </h2>
                  {block.badge && (
                    <span className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 font-mono text-xs text-accent">
                      {block.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          }
          if (block.level === 3) {
            return (
              <h3
                key={key}
                id={block.id}
                className="!mt-10 scroll-mt-24 font-display text-xl font-semibold text-text"
              >
                {block.num && <span className="mr-2 font-mono text-sm font-medium text-accent">{block.num}</span>}
                {block.text}
              </h3>
            );
          }
          return (
            <h4
              key={key}
              id={block.id}
              className="!mt-8 scroll-mt-24 font-display text-lg font-semibold text-text"
            >
              {block.num && <span className="mr-2 font-mono text-xs font-medium text-accent">{block.num}</span>}
              {block.text}
            </h4>
          );
        }

        if (block.kind === 'callout') {
          return (
            <div key={key} className="my-4">
              <Callout variant={block.variant} title={block.title}>
                <InlineMd text={block.md} components={components} />
              </Callout>
            </div>
          );
        }

        if (block.kind === 'cards') {
          return (
            <div key={key} className="my-5 grid gap-3 sm:grid-cols-2">
              {block.items.map(item => {
                const Icon = item.icon ?? Puzzle;
                return (
                  <div key={item.title} className="rounded-xl border border-border bg-bg-elevated/50 p-4">
                    <div className="flex items-start gap-2.5">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        {item.emoji ? (
                          <span className="text-[15px] leading-none">{item.emoji}</span>
                        ) : (
                          <Icon size={16} />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text">
                          <InlineMd text={item.title} components={components} />
                        </div>
                        {item.desc && (
                          <div className="mt-0.5 text-sm text-text-muted">
                            <InlineMd text={item.desc} components={components} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // FAQ 折叠项
        return (
          <div key={key} id={block.id} className="my-3 scroll-mt-24">
            <FaqItem q={block.q}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {block.md}
              </ReactMarkdown>
            </FaqItem>
          </div>
        );
      })}

      {/* 结尾与内置文档一致的收尾装饰 */}
      <div className="mt-12 flex items-center justify-center gap-2 text-xs text-text-faint">
        <Sparkles size={13} className="text-accent" />
        文档由 GitHub 仓库实时解析渲染
      </div>
    </div>
  );
}
