
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'gray' | 'green' | 'yellow' | 'red' | 'blue';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'gray' }) => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-status-green/10 text-status-green',
    yellow: 'bg-status-yellow/10 text-status-yellow',
    red: 'bg-status-red/10 text-status-red',
    blue: 'bg-brand-accent/10 text-brand-accent',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
};
