import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslation";
import { useAuth } from "@/lib/auth-provider";

import {
  Server,
  Network,
  Dock,
  Database,
  Terminal,
  Shield,
  Code,
  Box,
  GitBranch,
  Globe,
  Folder,
  Settings,
  MessageCircle,
  Bell,
  Phone,
  List,
  Book,
  Command,
  Cpu,
  FileCode,
  BookMarked,
} from "lucide-react";

// Define categories and their icons
const categories = [
  { id: "basics", icon: Terminal },
  { id: "networking", icon: Network },
  { id: "services", icon: Server },
  { id: "projects", icon: Code },
  { id: "asterisk", icon: Phone },
  { id: "containers", icon: Dock },
  { id: "cicd", icon: GitBranch },
  { id: "databases", icon: Database },
  { id: "security", icon: Shield },
  { id: "project_structure", icon: Folder },
  { id: "tools", icon: Terminal },
  { id: "checklists", icon: List },
  { id: "documentation", icon: Book },
  { id: "debian", icon: Server },
  { id: "nginx", icon: Network },
  { id: "docker", icon: Dock },
  { id: "kubernetes", icon: Dock },
  { id: "ftp", icon: Server },
  { id: "vpn", icon: Network },
  { id: "monitoring", icon: Bell },
  { id: "deployment", icon: Server },
  { id: "virtualization", icon: Box },
];

const Sidebar = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, isModerator } = useAuth();
  const location = useLocation();

  return (
    <UISidebar>
      <SidebarHeader>
        <div className="p-4">
          <Link to="/" className="flex items-center font-bold text-xl text-sidebar-primary">
            DevOps CheatSheet
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="sidebar-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/"
                    className={cn(
                      "flex items-center gap-2",
                      location.pathname === "/" && "text-sidebar-primary"
                    )}
                  >
                    <Server size={18} />
                    <span>{t.navigation.home}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/cheatsheets"
                    className={cn(
                      "flex items-center gap-2",
                      location.pathname === "/cheatsheets" && "text-sidebar-primary"
                    )}
                  >
                    <Folder size={18} />
                    <span>{t.navigation.cheatsheets}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/debian-commands"
                    className={cn(
                      "flex items-center gap-2",
                      location.pathname === "/debian-commands" && "text-sidebar-primary"
                    )}
                  >
                    <Command size={18} />
                    <span>Debian Commands</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/assistant"
                    className={cn(
                      "flex items-center gap-2",
                      location.pathname === "/assistant" && "text-sidebar-primary"
                    )}
                  >
                    <MessageCircle size={18} />
                    <span>{t.navigation.aiAssistant}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/ollama"
                    className={cn(
                      "flex items-center gap-2",
                      location.pathname === "/ollama" && "text-sidebar-primary"
                    )}
                  >
                    <Cpu size={18} />
                    <span>Ollama AI</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/config-generator"
                    className={cn(
                      "flex items-center gap-2",
                      location.pathname === "/config-generator" && "text-sidebar-primary"
                    )}
                  >
                    <FileCode size={18} />
                    <span>Config Generator</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    to="/config-snippets"
                    className={cn(
                      "flex items-center gap-2",
                      location.pathname.includes("/config-snippets") && "text-sidebar-primary"
                    )}
                  >
                    <BookMarked size={18} />
                    <span>Config Snippets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.navigation.cheatsheets}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={`/cheatsheets/${category.id}`}
                      className={cn(
                        "flex items-center gap-2",
                        location.pathname === `/cheatsheets/${category.id}` && "text-sidebar-primary"
                      )}
                    >
                      <category.icon size={18} />
                      <span>{t.categories[category.id as keyof typeof t.categories] || category.id}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isModerator) && (
          <SidebarGroup>
            <SidebarGroupLabel>{t.common.admin}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      to="/admin"
                      className={cn(
                        "flex items-center gap-2",
                        location.pathname === "/admin" && "text-sidebar-primary"
                      )}
                    >
                      <Settings size={18} />
                      <span>{t.common.admin}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4">
          {!isAuthenticated && (
            <Button asChild className="w-full" variant="secondary">
              <Link to="/login">{t.common.login}</Link>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </UISidebar>
  );
};

export default Sidebar;
