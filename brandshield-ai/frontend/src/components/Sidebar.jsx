import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  Share2,
  Smartphone,
  Flame,
  SearchCode,
  Network,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  User
} from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export default function Sidebar() {
  const { selectedBrand, unreadAlertsCount } = useBrand();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Brand Profile', path: '/brands', icon: Building2 },
    { name: 'Social Monitoring', path: '/social-monitoring', icon: Share2 },
    { name: 'Authenticity Verifier', path: '/authenticity-verification', icon: ShieldCheck },
    { name: 'App Monitoring', path: '/app-monitoring', icon: Smartphone },
    { name: 'Threat Center', path: '/threat-center', icon: Flame, badge: selectedBrand?.active_threats_count },
    { name: 'Investigations', path: '/investigations', icon: SearchCode },
    { name: 'Campaigns', path: '/campaigns', icon: Network },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: unreadAlertsCount, isAlertBadge: true },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between select-none z-30">
      {/* BrandShield Header & Scrollable Nav */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3 flex-shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">BrandShield</span>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Digital Risk Protection</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/5 text-cyan-300 border-l-2 border-cyan-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.isNew && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    AI
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      item.isAlertBadge
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Organization / Active Brand */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070b14]/70">
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Org:</span>
            <span className="text-slate-300 font-semibold truncate max-w-[120px]">Global SOC Ops</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Active Brand:</span>
            <div className="flex items-center gap-1 text-cyan-400 font-semibold truncate max-w-[120px]">
              <ShieldCheck className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <span className="truncate">{selectedBrand?.name || 'Loading...'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Monitoring
            </span>
            <span className="text-slate-400 font-mono">v1.0 DRP</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
