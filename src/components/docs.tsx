import { useState, type ReactNode } from 'react';
import { Check, Copy, Info, AlertTriangle, Lightbulb } from 'lucide-react';

/** 行内代码 */
export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-border/70 bg-bg-subtle px-1.5 py-0.5 font-mono text-[0.85em] text-text">
      {children}
    </code>
  );
}

/** 代码块（带复制按钮） */
export function CodeBlock({ code, lang = 'csharp' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border bg-bg-subtle">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-faint transition-colors hover:bg-bg-elevated hover:text-text"
          aria-label="复制代码"
        >
          {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-text-muted">{code}</code>
      </pre>
    </div>
  );
}

/** 提示 / 警告块 */
export function Callout({
  variant = 'info',
  title,
  children,
}: {
  variant?: 'info' | 'warning' | 'tip';
  title?: string;
  children: ReactNode;
}) {
  const meta = {
    info: { icon: Info, cls: 'border-accent/30 bg-accent-soft', iconCls: 'text-accent' },
    warning: { icon: AlertTriangle, cls: 'border-amber-500/40 bg-amber-500/10', iconCls: 'text-amber-500' },
    tip: { icon: Lightbulb, cls: 'border-sky-500/30 bg-sky-500/10', iconCls: 'text-sky-500' },
  }[variant];
  const Icon = meta.icon;
  return (
    <div className={`my-4 rounded-xl border px-4 py-3 ${meta.cls}`}>
      <div className="flex items-start gap-2.5">
        <Icon size={16} className={`mt-0.5 shrink-0 ${meta.iconCls}`} />
        <div className="min-w-0 text-sm leading-relaxed text-text-muted [&_code]:break-all">
          {title && <div className="mb-1 font-medium text-text">{title}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}

/** 键值徽标 */
export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs ${
        tone === 'accent'
          ? 'border-accent/30 bg-accent-soft text-accent'
          : 'border-border bg-bg-subtle text-text-muted'
      }`}
    >
      {children}
    </span>
  );
}

/** FAQ 折叠项 */
export function FaqItem({ q, children }: { q: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-elevated/40">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-text transition-colors hover:bg-bg-subtle/60"
      >
        <span>{q}</span>
        <span className={`shrink-0 text-text-faint transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="border-t border-border/60 px-5 py-4 text-sm leading-relaxed text-text-muted [&_code]:break-all">
          {children}
        </div>
      )}
    </div>
  );
}
