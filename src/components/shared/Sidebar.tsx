import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  page: number;
}

interface SidebarProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  rosConnected: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', page: 1 },
  { id: 'camera', label: 'Camera & Vision', icon: '📷', page: 2 },
  { id: 'servo', label: 'Servo Presets', icon: '🎨', page: 3 },
  { id: 'visualization', label: '3D Visualization', icon: '🤖', page: 6 },
  { id: 'manual_servo', label: 'Manual Control', icon: '🎮', page: 7 },
  { id: 'ros', label: 'ROS2 Monitor', icon: '📡', page: 4 },
  { id: 'settings', label: 'Settings', icon: '⚙️', page: 5 },
  { id: 'modes', label: 'Live Axel', icon: '🎛️', page: 8 },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onPageChange, 
  rosConnected 
}) => {
  return (
    <div className="w-64 h-screen axel-surface border-r border-slate-700/70 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/60">
        <h1 className="text-2xl font-bold axel-gradient-text">AXEL</h1>
        <p className="text-sm axel-muted mt-1">Control Dashboard</p>
        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
          rosConnected 
            ? 'bg-emerald-900/20 text-emerald-300 border-emerald-500/30' 
            : 'bg-rose-900/20 text-rose-300 border-rose-500/30'
        }`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {rosConnected ? 'ROS Connected' : 'ROS Disconnected'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.page)}
            className={`
              w-full px-4 py-3 rounded-xl text-left font-medium transition-all duration-200
              flex items-center gap-3
              ${
                currentPage === item.page
                  ? 'axel-button-primary text-white shadow-[0_0_0_1px_rgba(57,184,164,0.35)]'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent hover:border-slate-600/60'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
      </div>
    </div>
  );
};

export default Sidebar;
