
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  Search,
  User,
  Sun,
  Moon,
  LogIn,
  Settings,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/useTranslation";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/lib/auth-provider";

const Navbar = () => {
  const { t, locale, setLocale } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "uk" : "en");
  };

  return (
    <header className="border-b border-border glass sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu size={20} />
            </Button>
          </SidebarTrigger>
          <div className="hidden md:flex">
            <Link to="/" className="font-bold text-xl text-primary">
              DevOps CheatSheet
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="animate-fade-in">
              <Input
                type="search"
                placeholder={t.common.search}
                className="w-[180px] md:w-[260px]"
                autoFocus
                onBlur={() => setShowSearch(false)}
              />
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={toggleSearch}>
              <Search size={20} />
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {locale === "en" ? "EN" : "UK"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleLanguage}>
                {locale === "en" ? "Ukrainian" : "English"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings size={16} className="mr-2" />
                    {t.common.settings}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogIn size={16} className="mr-2" />
                  {t.common.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/login">
                <LogIn size={20} />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
