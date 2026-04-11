import type { LucideIcon } from 'lucide-react';
import { NavLink as RouterNavLink } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  mobile?: boolean;
  onClick?: () => void;
}

export function NavLink({ to, icon: Icon, children, mobile, onClick }: NavLinkProps) {
  const baseStyles = mobile
    ? 'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200'
    : 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';

  return (
    <RouterNavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${baseStyles} ${
          isActive
            ? 'text-[#f0f0f5] bg-gradient-to-r from-[#ff3366]/20 to-[#9933ff]/20 border border-[#ff3366]/30'
            : 'text-[#9ca3af] hover:text-[#f0f0f5] hover:bg-[#1a1a25]'
        }`
      }
    >
      <Icon className="w-4 h-4" />
      {children}
    </RouterNavLink>
  );
}
