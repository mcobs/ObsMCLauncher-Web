// FULLCHANGELOG.md 解析工具

export interface ChangelogSection {
  title: string; // 新增 / 修复 / 优化 / 移除 ...
  items: string[];
}

export interface ChangelogVersion {
  tag: string; // 如 v1.0.1-pre.1
  date: string; // 如 2026-08-13
  sections: ChangelogSection[];
}

// 分类固定展示顺序
const SECTION_ORDER = ['新增', '修复', '优化', '性能', '安全', '移除'];

// 合并同名分类、条目去重，并固定展示顺序；未命中的分类按原文顺序追加
function normalizeSections(sections: ChangelogSection[]): ChangelogSection[] {
  const groups = new Map<string, Set<string>>();
  for (const s of sections) {
    if (!groups.has(s.title)) groups.set(s.title, new Set());
    for (const item of s.items) groups.get(s.title)!.add(item);
  }
  const ordered: ChangelogSection[] = [];
  for (const title of SECTION_ORDER) {
    const items = groups.get(title);
    if (items && items.size > 0) ordered.push({ title, items: [...items] });
  }
  for (const [title, items] of groups) {
    if (!SECTION_ORDER.includes(title)) ordered.push({ title, items: [...items] });
  }
  return ordered;
}

// 解析 FULLCHANGELOG.md，返回按文档顺序排列的版本列表
export function parseChangelog(markdown: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = [];
  const versionRe = /^\s*##\s*\[([^\]]+)\]\s*(?:-\s*([^\s]+))?\s*$/gm;
  const sectionRe = /^\s*###\s*(.+?)\s*$/gm;

  const versionMatches = [...markdown.matchAll(versionRe)];
  for (let i = 0; i < versionMatches.length; i++) {
    const m = versionMatches[i];
    const tag = m[1].trim();
    const date = (m[2] ?? '').trim();
    const start = m.index! + m[0].length;
    const end = i + 1 < versionMatches.length ? versionMatches[i + 1].index! : markdown.length;
    const body = markdown.slice(start, end);

    const sections: ChangelogSection[] = [];
    const sectionMatches = [...body.matchAll(sectionRe)];
    for (let j = 0; j < sectionMatches.length; j++) {
      const sm = sectionMatches[j];
      const title = sm[1].trim();
      const sStart = sm.index! + sm[0].length;
      const sEnd = j + 1 < sectionMatches.length ? sectionMatches[j + 1].index! : body.length;
      const items = body
        .slice(sStart, sEnd)
        .split('\n')
        .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
        .filter(Boolean);
      if (items.length > 0) sections.push({ title, items });
    }
    versions.push({ tag, date, sections: normalizeSections(sections) });
  }
  return versions;
}

// 按版本标签查找对应的更新日志（忽略 v 前缀）
export function findChangelog(versions: ChangelogVersion[], tag: string): ChangelogVersion | null {
  const key = tag.replace(/^v/, '');
  return versions.find(v => v.tag.replace(/^v/, '') === key) ?? null;
}
