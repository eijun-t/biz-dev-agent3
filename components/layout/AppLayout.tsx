'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* サイドバー */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* メインコンテンツ */}
      <motion.main
        animate={{ 
          marginLeft: sidebarCollapsed ? 80 : 256 
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className={cn("min-h-screen transition-all", className)}
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default AppLayout;