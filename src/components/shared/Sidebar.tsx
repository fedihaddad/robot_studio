import React, { useMemo, useState } from 'react';
import {
  HomeIcon,
  VideoCameraIcon,
  WrenchScrewdriverIcon,
  CubeTransparentIcon,
  CursorArrowRaysIcon,
  SignalIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

export interface NavItem {
  id: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  page: number;
  section: 'Core' | 'Control' | 'Visualization' | 'System';
}

interface SidebarProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  rosConnected: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: HomeIcon, page: 1, section: 'Core' },
  { id: 'camera', label: 'Camera & Vision', Icon: VideoCameraIcon, page: 2, section: 'Core' },
  { id: 'modes', label: 'Live Axel', Icon: AdjustmentsHorizontalIcon, page: 8, section: 'Core' },

  { id: 'servo', label: 'Servo Presets', Icon: WrenchScrewdriverIcon, page: 3, section: 'Control' },
  { id: 'manual_servo', label: 'Manual Control', Icon: CursorArrowRaysIcon, page: 7, section: 'Control' },

  { id: 'visualization', label: '3D Visualization', Icon: CubeTransparentIcon, page: 6, section: 'Visualization' },

  { id: 'ros', label: 'ROS2 Monitor', Icon: SignalIcon, page: 4, section: 'System' },
  { id: 'settings', label: 'Settings', Icon: Cog6ToothIcon, page: 5, section: 'System' },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onPageChange, 
  rosConnected 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const grouped = useMemo(() => {
    const sections: Array<NavItem['section']> = ['Core', 'Control', 'Visualization', 'System'];
    return sections.map((section) => ({
      section,
      items: navItems.filter((i) => i.section === section),
    }));
  }, []);

  return (
    <div className={`${isCollapsed ? 'w-[76px]' : 'w-64'} h-screen axel-surface border-r border-slate-700/70 flex flex-col transition-all duration-200`}>
      {/* Header */}
      <div className={`${isCollapsed ? 'p-4' : 'p-6'} border-b border-slate-700/60`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`${isCollapsed ? 'text-xl text-center' : 'text-2xl'} font-bold axel-gradient-text`}>
              {isCollapsed ? 'A' : 'AXEL'}
            </h1>
            {!isCollapsed && <p className="text-sm axel-muted mt-1">Control Dashboard</p>}
          </div>

          <button
            className="axel-button-secondary p-2 rounded-xl"
            onClick={() => setIsCollapsed((v) => !v)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronDoubleRightIcon className="w-4 h-4" /> : <ChevronDoubleLeftIcon className="w-4 h-4" />}
          </button>
        </div>

        <div
          className={`mt-4 inline-flex items-center gap-2 ${isCollapsed ? 'px-2 py-2' : 'px-3 py-1'} rounded-full text-sm font-medium border ${
            rosConnected
              ? 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-900/20 text-rose-300 border-rose-500/30'
          }`}
          title={rosConnected ? 'ROS Connected' : 'ROS Disconnected'}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {!isCollapsed && (rosConnected ? 'ROS Connected' : 'ROS Disconnected')}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`${isCollapsed ? 'p-3' : 'p-4'} flex-1 space-y-4 overflow-y-auto`}>
        {grouped.map(({ section, items }) => (
          <div key={section} className="space-y-2">
            {!isCollapsed && (
              <p className="text-[10px] uppercase tracking-widest axel-muted px-2">
                {section}
              </p>
            )}
            {items.map((item) => {
              const active = currentPage === item.page;
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.page)}
                  title={isCollapsed ? item.label : undefined}
                  className={[
                    'group w-full rounded-xl text-left font-semibold transition-all duration-200 flex items-center gap-3',
                    isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                    active
                      ? 'axel-button-primary text-white shadow-[0_0_0_1px_rgba(57,184,164,0.35)]'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent hover:border-slate-600/60',
                  ].join(' ')}
                >
                  <div className={`${active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'} transition-opacity`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                      <span className="truncate">{item.label}</span>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white/90" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`${isCollapsed ? 'p-3' : 'p-4'} border-t border-slate-700/60 text-xs axel-muted`}>
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <span>AXEL Dashboard</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
