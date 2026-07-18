import { Link } from 'react-router-dom';
import { Github, Heart } from 'lucide-react';

const REPO_URL = 'https://github.com/mcobs/ObsMCLauncher';

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border bg-bg-subtle/40">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="ObsMCLauncher" className="h-7 w-7" />
              <span className="font-display text-base font-semibold text-text">ObsMCLauncher</span>
            </div>
            <p className="text-sm leading-relaxed text-text-muted max-w-xs">
              一款功能强、可定制、跨平台的 Minecraft 启动器。基于 .NET 8 与 Avalonia 构建。
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-faint">导航</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-text-muted hover:text-accent transition-colors">主页</Link>
              </li>
              <li>
                <Link to="/download" className="text-text-muted hover:text-accent transition-colors">下载</Link>
              </li>
              <li>
                <a href={`${REPO_URL}/releases`} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent transition-colors">
                  版本发布
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent transition-colors">
                  问题反馈
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-faint">资源</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors">
                  <Github size={14} /> GitHub 仓库
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/Plugin-Development.md`} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent transition-colors">
                  插件开发指南
                </a>
              </li>
              <li>
                <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent transition-colors">
                  GPL-3.0 许可证
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-text-faint">
            © 2026 ObsMCLauncher · 采用 GPL-3.0 许可证开源
          </p>
          <p className="text-xs text-text-faint max-w-xl md:text-right">
            本启动器为第三方工具，与 Mojang Studios 和 Microsoft 无关。Minecraft 是 Mojang Studios 的注册商标。
          </p>
        </div>
        <p className="mt-4 text-xs text-text-faint inline-flex items-center gap-1.5">
          <Heart size={11} className="text-accent" /> 用心打造，献给每一位 Minecraft 玩家
        </p>
      </div>
    </footer>
  );
}
