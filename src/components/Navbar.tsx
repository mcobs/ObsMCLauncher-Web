import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Github, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: '主页' },
  { to: '/download', label: '下载' },
];

const REPO_URL = 'https://github.com/mcobs/ObsMCLauncher';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-border' : 'border-b border-transparent'
      }`}
    >
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.svg" alt="ObsMCLauncher" className="h-7 w-7 transition-transform group-hover:scale-105" />
          <span className="font-display text-base font-semibold tracking-tight text-text">
            ObsMCLauncher
          </span>
        </Link>

        {/* 桌面导航 */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActive ? 'text-accent' : 'text-text-muted hover:text-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-px h-px bg-accent"
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-bg-elevated/60 px-3.5 text-sm text-text-muted transition-colors hover:text-text hover:border-accent/40"
            aria-label="GitHub 仓库"
          >
            <Github size={15} />
            <span>GitHub</span>
          </a>
          <ThemeToggle />
          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-elevated/60 text-text-muted"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="菜单"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* 移动端菜单 */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden glass border-b border-border"
          >
            <div className="container py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-accent-soft text-accent' : 'text-text-muted hover:bg-bg-subtle'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-bg-subtle inline-flex items-center gap-2"
              >
                <Github size={15} /> GitHub 仓库
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
