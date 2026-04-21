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
  { id: 'modes', label: 'Control Modes', icon: '🎛️', page: 8 },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onPageChange, 
  rosConnected 
}) => {
  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">🤖 AXEL</h1>
        <p className="text-sm text-gray-500 mt-1">Control Dashboard</p>
        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
          rosConnected 
            ? 'bg-green-900 text-green-300' 
            : 'bg-red-900 text-red-300'
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
              w-full px-4 py-3 rounded-lg text-left font-medium transition-all duration-200
              flex items-center gap-3
              ${
                currentPage === item.page
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
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
