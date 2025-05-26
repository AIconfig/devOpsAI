
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface CheatsheetLayoutProps {
  children: React.ReactNode;
}

const CheatsheetLayout: React.FC<CheatsheetLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Navbar />
          <div className="flex-1 p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CheatsheetLayout;
