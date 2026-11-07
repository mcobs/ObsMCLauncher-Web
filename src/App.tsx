import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Download from '@/pages/Download';
import PluginAPI from '@/pages/PluginAPI';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

// 各路由的标题都以中文名打头，子页面也能被「我的世界启动器下载」这类词搜到
const PAGE_TITLES: Record<string, string> = {
  '/': '黑曜石我的世界启动器 | ObsMCLauncher 开源 Minecraft 启动器',
  '/download': '下载 | 黑曜石我的世界启动器（ObsMCLauncher）',
  '/plugin-api': '插件 API 文档 | 黑曜石我的世界启动器',
};

function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = PAGE_TITLES[pathname] ?? PAGE_TITLES['/'];
    document.title = title;
    // 分享卡片抓的是静态 meta，这里同步一份，避免标题与页面不一致
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <RouteTitle />
      <div className="relative min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/download" element={<Download />} />
            <Route path="/plugin-api" element={<PluginAPI />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
