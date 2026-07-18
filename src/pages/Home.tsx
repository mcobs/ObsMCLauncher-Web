import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Github, Sparkles, Boxes, ShieldCheck, Layers, Palette,
  Download, Plug, MonitorSmartphone, Server, RefreshCw, Gamepad2,
  Package, Settings2, Cpu, HardDriveDownload, Puzzle
} from 'lucide-react';
import SectionTitle from '@/components/SectionTitle';
import FeatureCard from '@/components/FeatureCard';
import ThemeImage from '@/components/ThemeImage';

const REPO_URL = 'https://github.com/mcobs/ObsMCLauncher';

// 功能强板块
const POWERFUL_FEATURES = [
  { icon: Layers, title: '多版本管理', description: '集中管理所有 Minecraft 版本，支持分组、隔离、自定义内存与启动脚本导出，每个版本配置独立存储于 OMCL/init.json。' },
  { icon: HardDriveDownload, title: '下载管理器', description: '多源下载支持（Mojang/BMCLAPI/镜像）、断点续传、SHA-1 哈希自动校验，任务卡片实时显示进度与状态色指示。' },
  { icon: Puzzle, title: '模组 / 光影 / 材质 / 存档', description: '一站式管理模组、光影包、材质包与存档。支持启用/禁用、删除、图标提取与模组冲突检测。' },
  { icon: Cpu, title: 'Java 自动检测', description: '跨平台扫描系统中的 JDK 安装，识别 Temurin/Corretto/Zulu 等发行版，自动匹配版本运行所需的 Java 环境。' },
  { icon: ShieldCheck, title: '安全防护', description: 'ZIP Slip 路径遍历防御、文件哈希校验、SSL 证书验证开关，从下载到解压全链路保障安全。' },
  { icon: RefreshCw, title: '增量自动更新', description: '集成 Velopack 框架，支持 delta 差异包增量更新；GitHub 代理源为大陆用户加速下载更新。' },
];

// 可定制板块
const CUSTOMIZABLE_FEATURES = [
  { icon: Plug, title: '插件系统', description: '完整的插件 API：注册主页卡片、自定义标签页、命令、事件订阅；扩展 API 支持日志、版本查询、启动钩子与下载请求。' },
  { icon: Palette, title: '四套窗口质感', description: '亚克力、磨砂玻璃、纯色扁平、悬浮卡片四套质感实时切换；颜色、画刷、阴影通过 Theme.axaml 资源化定义。' },
  { icon: Sparkles, title: '主题系统', description: '深色 / 浅色双主题，配合 SVG 图标自动跟随主题色，主题切换时所有元素平滑过渡。' },
  { icon: Boxes, title: '自定义主页卡片', description: '主页卡片可由用户和插件共同构建，支持自定义图标、命令绑定，打造属于你的启动器首屏。' },
];

// 跨平台架构
const PLATFORM_DETAILS = [
  { name: 'Windows', archs: 'x86 · x64 · ARM64', icon: MonitorSmartphone },
  { name: 'Linux', archs: 'x64 · ARM64', icon: Server },
  { name: 'macOS', archs: 'x64 · ARM64 (Apple Silicon)', icon: MonitorSmartphone },
];

// 资源管理板块
const RESOURCE_FEATURES = [
  { icon: Package, title: 'Modrinth 集成', description: '直接浏览、搜索 Modrinth 上的模组、整合包与资源，一键安装到当前版本，自动解析前置依赖。' },
  { icon: Download, title: 'CurseForge 支持', description: '完整集成 CurseForge 资源检索与下载，与 Modrinth 共用统一的资源详情与安装流程。' },
  { icon: RefreshCw, title: '镜像源加速', description: 'BMCLAPI 与可配置镜像源为大陆用户加速 Minecraft 版本、库文件与资产下载，告别龟速。' },
];

function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // 光球位置通过鼠标位置插值，产生跟随拖尾感
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const orb1X = lerp(0.5, mousePos.x, 0.06) * 100;
  const orb1Y = lerp(0.5, mousePos.y, 0.06) * 100;
  const orb2X = lerp(0.5, mousePos.x, 0.04) * 100;
  const orb2Y = lerp(0.5, mousePos.y, 0.04) * 100;
  const orb3X = lerp(0.5, mousePos.x, 0.08) * 100;
  const orb3Y = lerp(0.5, mousePos.y, 0.08) * 100;

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32"
    >
      {/* 背景网格 + 鼠标响应暗角 */}
      <div className="absolute inset-0 -z-10 bg-grid opacity-60" />

      {/* 鼠标跟随主光球 */}
      <div
        className="glow-orb -z-10 pointer-events-none"
        style={{
          width: 540,
          height: 540,
          background: 'var(--accent)',
          left: `${orb1X}%`,
          top: `${orb1Y}%`,
          transform: 'translate(-50%, -50%)',
          opacity: 0.35,
          transition: 'left 0.12s ease-out, top 0.12s ease-out',
        }}
      />
      {/* 第二光球 - 偏蓝，跟随稍慢 */}
      <div
        className="glow-orb -z-10 pointer-events-none"
        style={{
          width: 340,
          height: 340,
          background: '#3b82f6',
          left: `${100 - orb2X}%`,
          top: `${orb2Y}%`,
          transform: 'translate(-50%, -50%)',
          opacity: 0.22,
          transition: 'left 0.2s ease-out, top 0.2s ease-out',
        }}
      />
      {/* 第三光球 - 偏紫，跟随最快 */}
      <div
        className="glow-orb -z-10 pointer-events-none"
        style={{
          width: 220,
          height: 220,
          background: '#8b5cf6',
          left: `${orb3X}%`,
          top: `${100 - orb3Y}%`,
          transform: 'translate(-50%, -50%)',
          opacity: 0.18,
          transition: 'left 0.08s ease-out, top 0.08s ease-out',
        }}
      />

      {/* 鼠标光标小光点 */}
      <div
        className="pointer-events-none fixed z-20 mix-blend-screen"
        style={{
          left: 0,
          top: 0,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)',
          transform: `translate(calc(${mousePos.x * 100}vw - 50%), calc(${mousePos.y * 100}vh - 50%))`,
          opacity: 0.5,
          willChange: 'transform',
        }}
      />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated/70 px-4 py-1.5 text-xs text-text-muted">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            最新版本 v1.0.0-rc.5 现已发布
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-center font-display text-5xl md:text-7xl lg:text-[5.5rem] font-semibold tracking-tight leading-[1.05]"
        >
          <span className="text-text">Obs</span>
          <span className="text-gradient">MCLauncher</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-center text-xl md:text-2xl text-text-muted font-medium"
        >
          你的MC启动器，无限可能
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 flex justify-center"
        >
          <div className="inline-flex items-center gap-2.5 rounded-full bg-accent-soft px-4 py-1.5">
            <Sparkles size={14} className="text-accent" />
            <span className="text-sm font-medium text-accent">功能强 · 可定制 · 跨平台</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/download"
            className="btn-primary-gradient group inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-all"
          >
            <Download size={16} />
            立即下载
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-bg-elevated/70 px-7 text-sm font-semibold text-text transition-colors hover:border-accent/40"
          >
            <Github size={16} />
            GitHub 仓库
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 text-center text-sm text-text-faint"
        >
          支持 Windows 10/11 · Linux · macOS 11+ · 基于 .NET 8 与 Avalonia
        </motion.p>
      </div>
    </section>
  );
}

function Divider() {
  return (
    <div className="container">
      <div className="relative h-px w-full bg-gradient-to-r from-transparent via-border to-transparent">
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-glow" />
      </div>
    </div>
  );
}

function PowerfulSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <SectionTitle
          label="#功能强"
          title="一款功能强的 MC 启动器"
          description="从版本管理到下载加速，从模组维护到安全防护，ObsMCLauncher 把每一个常用功能都打磨到位。"
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {POWERFUL_FEATURES.map((f, i) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} delay={i * 0.05} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-card"
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            </div>
            <span className="ml-2 text-xs font-mono text-text-faint">ObsMCLauncher — 主界面</span>
          </div>
          <ThemeImage
            lightSrc="/screenshot-home-light.png"
            darkSrc="/screenshot-home-dark.png"
            alt="ObsMCLauncher 主界面"
            className="w-full h-auto block"
          />
        </motion.div>
      </div>
    </section>
  );
}

function CustomizableSection() {
  return (
    <section className="py-20 md:py-28 bg-bg-subtle/30">
      <div className="container">
        <SectionTitle
          label="#可定制"
          title="一款可定制的 MC 启动器"
          description="插件系统、四套窗口质感、主题资源化、自定义主页卡片——把启动器变成你想要的样子。"
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            {CUSTOMIZABLE_FEATURES.map((f, i) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} delay={i * 0.05} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-card"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <span className="ml-2 text-xs font-mono text-text-faint">ObsMCLauncher — 插件管理</span>
            </div>
            <ThemeImage
              lightSrc="/screenshot-plugins-light.png"
              darkSrc="/screenshot-plugins-dark.png"
              alt="ObsMCLauncher 插件管理"
              className="w-full h-auto block"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CrossPlatformSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <SectionTitle
          label="#跨平台"
          title="一款跨平台的 MC 启动器"
          description="基于 .NET 8 + Avalonia UI 构建，对主流桌面平台原生支持，无论你在哪种系统都能得到一致的体验。"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLATFORM_DETAILS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-bg-elevated p-8 shadow-soft transition-colors hover:border-accent/40"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-soft blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent mb-5">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-text">{p.name}</h3>
                  <p className="mt-2 text-sm text-text-muted">支持架构</p>
                  <p className="mt-1 font-mono text-sm text-accent">{p.archs}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ResourceSection() {
  return (
    <section className="py-20 md:py-28 bg-bg-subtle/30">
      <div className="container">
        <SectionTitle
          label="#资源管理"
          title="海量资源，触手可及"
          description="内置 Modrinth 与 CurseForge 集成，配合镜像源加速，找模组、装资源不再切换多个网站。"
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-card"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <span className="ml-2 text-xs font-mono text-text-faint">ObsMCLauncher — 资源中心</span>
            </div>
            <ThemeImage
              lightSrc="/screenshot-resources-light.png"
              darkSrc="/screenshot-resources-dark.png"
              alt="ObsMCLauncher 资源中心"
              className="w-full h-auto block"
            />
          </motion.div>

          <div className="order-1 lg:order-2 grid gap-4">
            {RESOURCE_FEATURES.map((f, i) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-border bg-bg-elevated px-6 py-16 md:px-16 md:py-20 text-center shadow-card"
        >
          <div className="glow-orb" style={{ width: 360, height: 360, background: 'var(--accent)', top: -100, left: '50%', transform: 'translateX(-50%)' }} />
          <div className="absolute inset-0 bg-grid opacity-50" />

          <div className="relative">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent mb-6">
              <Gamepad2 size={26} />
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-text">
              准备好开启你的<span className="text-gradient"> Minecraft 之旅</span>了吗？
            </h2>
            <p className="mt-5 text-base md:text-lg text-text-muted max-w-xl mx-auto">
              立即下载 ObsMCLauncher，体验功能强、可定制、跨平台的现代化启动器。
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/download"
                className="btn-primary-gradient group inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-all"
              >
                <Download size={16} />
                立即下载
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href={`${REPO_URL}/issues`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-bg-elevated/70 px-7 text-sm font-semibold text-text transition-colors hover:border-accent/40"
              >
                <Settings2 size={16} />
                问题反馈
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Divider />
      <PowerfulSection />
      <CustomizableSection />
      <CrossPlatformSection />
      <ResourceSection />
      <FinalCTA />
    </>
  );
}
