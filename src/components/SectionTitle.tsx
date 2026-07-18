import { motion } from 'framer-motion';

interface SectionTitleProps {
  label?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionTitle({ label, title, description, align = 'left', className = '' }: SectionTitleProps) {
  const isCenter = align === 'center';
  return (
    <div className={`${isCenter ? 'text-center' : 'text-left'} ${className}`}>
      {label && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className={`mb-3 inline-flex items-center gap-2 text-sm font-mono text-accent ${isCenter ? 'justify-center' : ''}`}
        >
          <span className="inline-block h-px w-6 bg-accent/60" />
          <span>{label}</span>
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-text"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-4 text-base md:text-lg text-text-muted leading-relaxed ${isCenter ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
