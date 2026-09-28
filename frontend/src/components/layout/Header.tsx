import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { User, ShieldCheck } from 'lucide-react';

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

  const userName = userRole === 'teacher' ? teacher?.name : student?.name;

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-[#212121]/95 backdrop-blur-md border-b border-[#0D7377]/40 transition-all duration-300 flex items-center justify-between px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold tracking-wide">
          <span>SnapClass</span>
          <span className="text-[#0D7377]">/</span>
          <span className="capitalize text-[#14FFEC]">{userRole || 'Portal'}</span>
        </div>
        <h2 className="text-base font-bold text-white tracking-tight">{pageTitle}</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Backend API Health Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition ${
            isBackendHealthy === true
              ? 'bg-[#0D7377]/30 text-[#14FFEC] border-[#14FFEC]/50 shadow-xs shadow-[#14FFEC]/20'
              : isBackendHealthy === false
              ? 'bg-rose-950/60 text-rose-300 border-rose-800'
              : 'bg-[#323232] text-zinc-400 border-[#0D7377]/40'
          }`}
          title="Backend System Status"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy === true
                ? 'bg-[#14FFEC] animate-pulse shadow-sm shadow-[#14FFEC]'
                : 'bg-rose-400'
            }`}
          />
          <span>{isBackendHealthy === true ? 'System Active' : 'System Offline'}</span>
        </div>

        {/* User Info Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#0D7377]/40">
          <div className="w-8 h-8 rounded-md bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center font-bold text-xs shadow-sm shadow-[#0D7377]/40">
            {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{userName || 'User'}</p>
            <p className="text-[10px] text-[#14FFEC] font-medium capitalize flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#14FFEC]" />
              {userRole} Account
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
