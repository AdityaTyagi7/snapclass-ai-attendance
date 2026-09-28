import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Avatar, AvatarFallback } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Bell, Search, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  isCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, isCollapsed }) => {
  const { userRole, teacher, student } = useAuth();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.get('/api/health');
        setIsBackendHealthy(true);
      } catch {
        setIsBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const rawName = userRole === 'teacher' ? teacher?.name : student?.name;
  const firstName = rawName ? rawName.split(' ')[0] : 'User';
  const initials = rawName
    ? rawName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & User Greeting matching template */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1 className="truncate text-base sm:text-lg font-semibold text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs text-[#a1a1aa] hidden sm:block">
            {pageTitle} • <span className="capitalize">{userRole} Portal</span>
          </p>
        </div>
      </div>

      {/* Right Controls matching template */}
      <div className="flex items-center gap-2">
        {/* Backend Status Pill */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
            isBackendHealthy === true
              ? 'bg-[#18181b] text-[#fafafa] border-[#27272a]'
              : isBackendHealthy === false
              ? 'bg-rose-950/70 text-rose-300 border-rose-800'
              : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a]'
          }`}
          title="Backend API Status"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendHealthy === true
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-rose-400'
            }`}
          />
          <span className="text-[11px]">{isBackendHealthy === true ? 'System Active' : 'System Offline'}</span>
        </div>

        <Button variant="ghost" size="icon" aria-label="Search" className="text-[#a1a1aa] hover:text-white">
          <Search className="size-4" />
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications" className="text-[#a1a1aa] hover:text-white relative">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white" />
        </Button>

        <Avatar className="ml-1 size-8 bg-[#27272a] border border-[#3f3f46]">
          <AvatarFallback className="text-xs font-semibold text-white">{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
