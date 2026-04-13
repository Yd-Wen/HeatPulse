import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden';

  const variants = {
    // 渐变按钮 - 带有光泽流动效果
    primary: `
      bg-gradient-to-r from-[#ff3366] via-[#9933ff] to-[#ff3366] bg-[length:200%_100%]
      text-white hover:shadow-[0_0_25px_rgba(255,51,102,0.5),0_0_50px_rgba(153,51,255,0.3)]
      hover:bg-pos-[100%]
    `,
    // 次级按钮 - 带有渐变边框效果
    secondary: `
      bg-gradient-to-r from-[#1a1a25] to-[#12121a] text-[#f0f0f5]
      border border-[#2a2a3a] hover:border-[#9933ff]
      hover:shadow-[0_0_15px_rgba(153,51,255,0.3)]
    `,
    // 幽灵按钮
    ghost: 'text-[#9ca3af] hover:text-[#f0f0f5] hover:bg-[#1a1a25]',
    // 危险按钮
    danger: `
      bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400
      border border-red-500/30 hover:border-red-500
      hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles} ${variants[variant]} ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* 光泽流动效果层 */}
      {variant === 'primary' && !disabled && (
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      )}
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
