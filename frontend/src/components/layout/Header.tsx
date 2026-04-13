import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Menu, X, Zap, Radio } from 'lucide-react';
import { NavLink } from './NavLink';

const navItems = [
  { path: '/', label: '仪表盘', icon: Activity },
  { path: '/keywords', label: '关键词', icon: Zap },
  { path: '/hotspots', label: '热点', icon: Activity },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-[#2a2a3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#ff3366] via-[#9933ff] to-[#00d4ff] p-[1px]">
                <div className="w-full h-full rounded-lg bg-[#0a0a0f] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
              {/* 发光效果 */}
              <motion.div
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#ff3366] via-[#9933ff] to-[#00d4ff]"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold gradient-text-animated">HeatPulse</span>
              {/* 实时指示器 */}
              <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20">
                <Radio className="w-3 h-3 text-[#00d4ff] animate-pulse" />
                <span className="text-xs text-[#00d4ff]">LIVE</span>
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#9ca3af] hover:text-[#f0f0f5] hover:bg-[#1a1a25] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#2a2a3a] bg-[#0a0a0f]"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  mobile
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
