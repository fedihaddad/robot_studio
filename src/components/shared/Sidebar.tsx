import React, { useEffect, useMemo, useState } from 'react';
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
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import type { AppConfig } from '../../types';

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
  cameraConnected: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onReconnectROS?: () => void;
  isReconnecting?: boolean;
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
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
  rosConnected,
  cameraConnected,
  theme,
  onToggleTheme,
  onReconnectROS,
  isReconnecting = false,
  config,
  onConfigChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [tempRosUrl, setTempRosUrl] = useState(config.rosUrl);
  const [tempCameraUrl, setTempCameraUrl] = useState(config.cameraUrl);

  useEffect(() => {
    if (!isQuickSettingsOpen) return;
    setTempRosUrl(config.rosUrl);
    setTempCameraUrl(config.cameraUrl);
  }, [isQuickSettingsOpen, config.rosUrl, config.cameraUrl]);

  useEffect(() => {
    if (!isQuickSettingsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsQuickSettingsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isQuickSettingsOpen]);

  const saveQuickSettings = () => {
    onConfigChange({ ...config, rosUrl: tempRosUrl.trim(), cameraUrl: tempCameraUrl.trim() });
    setIsQuickSettingsOpen(false);
  };

  const grouped = useMemo(() => {
    const sections: Array<NavItem['section']> = ['Core', 'Control', 'Visualization', 'System'];
    return sections.map((section) => ({
      section,
      items: navItems.filter((i) => i.section === section),
    }));
  }, []);

  return (
    <div
      className={`${isCollapsed ? 'w-[76px]' : 'w-64'} h-screen axel-surface border-r flex flex-col transition-all duration-200`}
      style={{ borderColor: 'var(--axel-border)' }}
    >
      {/* Header */}
      <div
        className={`${isCollapsed ? 'p-4' : 'p-6'} border-b`}
        style={{ borderColor: 'var(--axel-border)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className={`${isCollapsed ? 'text-xl text-center' : 'text-2xl'} font-bold axel-gradient-text`}>
              {isCollapsed ? 'A' : 'AXEL'}
            </h1>
            {!isCollapsed && <p className="text-sm axel-muted mt-1">Control Dashboard</p>}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="axel-button-secondary p-2 rounded-xl"
              onClick={onToggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </button>

            <button
              className="axel-button-secondary p-2 rounded-xl"
              onClick={() => setIsCollapsed((v) => !v)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronDoubleRightIcon className="w-4 h-4" /> : <ChevronDoubleLeftIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className={`mt-4 flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
          <div
            className={`inline-flex items-center gap-2 ${isCollapsed ? 'px-2 py-2' : 'px-3 py-1'} rounded-full text-sm font-semibold border`}
            title={rosConnected ? 'ROS Connected' : 'ROS Disconnected'}
            style={{
              background: 'var(--axel-surface-soft)',
              borderColor: 'var(--axel-border)',
              color: 'var(--axel-text)',
            }}
          >
            <span
              className={`w-2 h-2 rounded-full ${rosConnected ? 'bg-emerald-400' : 'bg-rose-400'} ${rosConnected ? 'animate-pulse' : ''}`}
            />
            {!isCollapsed && (
              <span className={rosConnected ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>
                {rosConnected ? 'ROS Connected' : 'ROS Disconnected'}
              </span>
            )}
          </div>

          <div
            className={`inline-flex items-center gap-2 ${isCollapsed ? 'px-2 py-2' : 'px-3 py-1'} rounded-full text-sm font-semibold border`}
            title={cameraConnected ? 'Camera Online' : 'Camera Offline'}
            style={{
              background: 'var(--axel-surface-soft)',
              borderColor: 'var(--axel-border)',
              color: 'var(--axel-text)',
            }}
          >
            <span
              className={`w-2 h-2 rounded-full ${cameraConnected ? 'bg-emerald-400' : 'bg-rose-400'} ${cameraConnected ? 'animate-pulse' : ''}`}
            />
            {!isCollapsed && (
              <span className={cameraConnected ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>
                {cameraConnected ? 'Camera Online' : 'Camera Offline'}
              </span>
            )}
          </div>

          {!isCollapsed && !rosConnected && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onReconnectROS?.()}
                disabled={!onReconnectROS || isReconnecting}
                className="axel-button-primary px-3 py-1.5 rounded-full text-xs font-extrabold disabled:opacity-50"
                title="Reconnect ROS"
              >
                {isReconnecting ? 'Reconnecting…' : 'Reconnect'}
              </button>

              <button
                type="button"
                onClick={() => setIsQuickSettingsOpen((v) => !v)}
                className="axel-button-secondary p-2 rounded-full"
                title="Quick settings"
                aria-label="Quick settings"
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && isQuickSettingsOpen && (
        <div className="fixed inset-0 z-[200]">
          <button
            type="button"
            className="absolute inset-0 w-full h-full bg-black/40"
            aria-label="Close quick settings"
            onClick={() => setIsQuickSettingsOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-full flex items-start justify-center p-4 md:p-8 overflow-y-auto">
            <div
              className="w-full max-w-lg rounded-3xl border axel-surface shadow-2xl"
              style={{ borderColor: 'var(--axel-border)' }}
              role="dialog"
              aria-modal="true"
              aria-label="Quick settings"
            >
              <div className="p-5 border-b" style={{ borderColor: 'var(--axel-border)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold" style={{ color: 'var(--axel-text)' }}>Quick settings</p>
                    <p className="text-xs axel-muted mt-0.5">Update ROS + Camera URLs</p>
                  </div>
                  <button
                    type="button"
                    className="axel-button-secondary px-3 py-2 rounded-xl text-xs font-extrabold"
                    onClick={() => setIsQuickSettingsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold axel-muted mb-1">ROS URL</label>
                  <input
                    value={tempRosUrl}
                    onChange={(e) => setTempRosUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border font-mono text-sm"
                    style={{ background: 'var(--axel-surface-soft)', borderColor: 'var(--axel-border)', color: 'var(--axel-text)' }}
                    placeholder="ws://192.168.1.100:9090"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold axel-muted mb-1">Camera URL</label>
                  <input
                    value={tempCameraUrl}
                    onChange={(e) => setTempCameraUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border font-mono text-sm"
                    style={{ background: 'var(--axel-surface-soft)', borderColor: 'var(--axel-border)', color: 'var(--axel-text)' }}
                    placeholder="http://robot-ip:8080/?action=stream"
                  />
                </div>
              </div>

              <div className="p-5 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--axel-border)' }}>
                <button
                  type="button"
                  className="axel-button-secondary px-4 py-2.5 rounded-2xl text-xs font-extrabold"
                  onClick={() => setIsQuickSettingsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="axel-button-primary px-4 py-2.5 rounded-2xl text-xs font-extrabold"
                  onClick={saveQuickSettings}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`${isCollapsed ? 'p-3' : 'p-4'} flex-1 space-y-4 overflow-y-auto axel-hide-scrollbar`}>
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
                      : 'border border-transparent hover:shadow-sm',
                  ].join(' ')}
                  style={
                    active
                      ? undefined
                      : {
                          color: 'var(--axel-muted)',
                        }
                  }
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
      <div
        className={`${isCollapsed ? 'p-3' : 'p-4'} border-t text-xs axel-muted`}
        style={{ borderColor: 'var(--axel-border)' }}
      >
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
