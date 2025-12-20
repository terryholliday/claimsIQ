import React from 'react';
import { Screen } from '../types';
import { DashboardIcon, ShieldCheckIcon, CodeBracketIcon, LightBulbIcon, BuildingLibraryIcon, AcademicCapIcon } from './icons/Icons';

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onNavigate }) => {
  const navItems = [
    { screen: Screen.FEATURES, label: 'Platform Features', icon: <LightBulbIcon /> },
    { screen: Screen.TRAINING, label: 'Training Academy', icon: <AcademicCapIcon /> },
    { screen: Screen.DASHBOARD, label: 'Manifest Inbox', icon: <DashboardIcon /> },
    { screen: Screen.COMPLIANCE, label: 'Regulatory Compliance', icon: <BuildingLibraryIcon /> },
    { screen: Screen.API_DOCS, label: 'API Documentation', icon: <CodeBracketIcon /> },
  ];

  return (
    <nav className="w-64 bg-brand-primary text-white flex flex-col shadow-2xl z-40 h-full flex-shrink-0 transition-all duration-300">
      {/* Logo Section */}
      <div className="h-24 flex items-center justify-center border-b border-blue-800 bg-blue-900/30 px-6 shrink-0">
         <div className="text-center">
            <div className="font-black text-3xl tracking-tighter">
                <span className="text-brand-accent">PROVENIQ</span>
                <span className="text-white"> ClaimsIQ</span>
            </div>
         </div>
      </div>
      
      <div className="flex-1 mt-6 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 rounded-lg transition-all duration-200 group ${
              activeScreen === item.screen
                ? 'bg-brand-secondary text-white shadow-md ring-1 ring-white/10'
                : 'text-blue-100 hover:bg-brand-secondary/50 hover:text-white'
            }`}
          >
            <div className={`p-1.5 rounded-md transition-colors ${activeScreen === item.screen ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
                <div className="h-5 w-5">{item.icon}</div>
            </div>
            <span className="font-medium text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="p-6 text-xs text-blue-200/60 border-t border-blue-800/50 bg-blue-900/10 shrink-0">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="font-mono uppercase">System Online</span>
        </div>
        <p>&copy; 2025 PROVENIQ Technologies.</p>
        <p className="mt-1 opacity-70">Build v2.5.4 (Stable)</p>
      </div>
    </nav>
  );
};

export default Sidebar;