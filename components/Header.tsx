
import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, UserCircleIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons/Icons';
import { Screen } from '../types';

interface HeaderProps {
  onNavigate: (screen: Screen) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, type: 'warning', text: "Fraud Alert: High Risk detected on Claim MF-2024-004.", time: "10m ago" },
    { id: 2, type: 'success', text: "System Update: Gemini 2.5 Flash model integration complete.", time: "1h ago" },
    { id: 3, type: 'info', text: "New Assignment: 3 Claims added to your inbox.", time: "2h ago" }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white h-16 flex items-center justify-between px-8 border-b border-neutral-medium relative z-30">
      <div>
        <h2 className="text-xl font-semibold text-neutral-dark">Asset Intelligence Portal</h2>
        <p className="text-sm text-gray-500">Incoming Claims from PROVENIQ Home</p>
      </div>
      <div className="flex items-center space-x-6">
        
        {/* Notifications Bell */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`text-gray-500 hover:text-brand-primary relative transition-colors p-1 rounded-full hover:bg-gray-100 ${isNotificationsOpen ? 'bg-gray-100 text-brand-primary' : ''}`}
          >
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-status-red rounded-full border-2 border-white"></span>
          </button>

          {/* Notification Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
               <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-neutral-dark text-sm">Notifications</h3>
                   <button onClick={() => setIsNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600">
                       <XMarkIcon className="h-4 w-4" />
                   </button>
               </div>
               <div className="max-h-64 overflow-y-auto">
                   {notifications.map(note => (
                       <div key={note.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                           <div className="flex items-start gap-3">
                               <div className={`mt-0.5 ${note.type === 'warning' ? 'text-status-red' : note.type === 'success' ? 'text-status-green' : 'text-brand-secondary'}`}>
                                   {note.type === 'warning' ? <ExclamationTriangleIcon className="h-4 w-4" /> : note.type === 'success' ? <CheckCircleIcon className="h-4 w-4" /> : <BellIcon className="h-4 w-4" />}
                               </div>
                               <div>
                                   <p className="text-sm text-gray-800 leading-snug">{note.text}</p>
                                   <p className="text-xs text-gray-400 mt-1">{note.time}</p>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
               <div className="p-2 text-center bg-gray-50 border-t border-gray-100">
                   <button className="text-xs font-bold text-brand-primary hover:underline">Mark all as read</button>
               </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          onClick={() => onNavigate(Screen.ACCOUNT_SETTINGS)}
          title="Manage Account"
        >
          <UserCircleIcon className="h-9 w-9 text-gray-400" />
          <div>
            <p className="font-medium text-neutral-dark text-sm">Alex Johnson</p>
            <p className="text-xs text-gray-500">Senior Adjuster</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
