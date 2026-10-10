import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, ChevronRight, Home, Lock, Menu, Moon, Shield, Sun, Unlock, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/encode', label: 'Encode', icon: Lock },
  { path: '/decode', label: 'Decode', icon: Unlock },
  { path: '/learn-encode', label: 'Learn to Encode', icon: BookOpen },
  { path: '/learn-decode', label: 'Learn to Decode', icon: BookOpen },
];

function Logo() {
  return (
    <div className="sidebar-logo">
      <div className="logo-icon"><Shield size={20} /></div>
      <span className="logo-text">CryptoForge</span>
    </div>
  );
}

export default function Sidebar() {
  const { isDark, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="mobile-bar">
        <Logo />
        <button className="icon-only" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
      </header>

      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <Logo />
          <button className="icon-only mobile-close" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          <p className="nav-label">Navigation</p>
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className="theme-info">{isDark ? 'Dark' : 'Light'} mode</span>
          <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
            <div className={`toggle-track ${isDark ? 'dark' : ''}`}>
              <div className="toggle-thumb">{isDark ? <Moon size={12} /> : <Sun size={12} />}</div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
