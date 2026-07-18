import { useEffect, useRef, useState } from 'react';

interface ThemeImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  className?: string;
}

// 根据当前主题自动切换截图，并用交叉淡入过渡避免闪烁
export default function ThemeImage({ lightSrc, darkSrc, alt, className = '' }: ThemeImageProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const src = isDark ? darkSrc : lightSrc;

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`screenshot-fade ${className}`}
      style={{ opacity: 1 }}
    />
  );
}
