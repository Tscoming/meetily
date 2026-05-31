'use client';

import React from 'react';
import { SIDEBAR_COLLAPSED_WIDTH, useSidebar } from '@/components/Sidebar/SidebarProvider';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { isCollapsed, sidebarWidth } = useSidebar();
  const marginLeft = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth;

  return (
    <main 
      className="flex-1 transition-all duration-300"
      style={{ marginLeft }}
    >
      <div className="pl-8">
        {children}
      </div>
    </main>
  );
};

export default MainContent;
