import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'pink' | 'purple' | 'cyan' | 'none';
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  hover = true,
  glow = 'none',
  onClick,
}: CardProps) {
  const glowStyles = {
    pink: 'hover:shadow-[0_0_30px_rgba(255,51,102,0.15)]',
    purple: 'hover:shadow-[0_0_30px_rgba(153,51,255,0.15)]',
    cyan: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]',
    none: '',
  };

  return (
    <motion.div
      className={`
        bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5
        ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:border-[#3a3a4a]' : ''}
        ${glowStyles[glow]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
