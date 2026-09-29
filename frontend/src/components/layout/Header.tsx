import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Avatar, AvatarFallback } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Bell, Loader2, Search } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  isCollapsed: boolean;
}

type BackendStatus = 'checking' | 'active' | 'starting' | 'offline';

export const Header: React.FC<HeaderProps> = ({ pageTitle, isCollapsed }) => {
  const { userRole, teacher, student } = useAuth();
  const [status, setStatus] = useState<BackendStatus>('checking');
  const failCountRef = useRef(0);

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const checkHealth = async () => {
      if (cancelled) return;
      try {
        await apiClient.get('/api/health', { timeout: 8000 });
        if (!cancelled) {
          failCountRef.current = 0;
          setStatus('active');
        }
      } catch {
        if (!cancelled) {
          failCountRef.current += 1;
          if (failCountRef.current <= 3) {
            // 1–3 failures = server is cold-starting (Render free tier spin-up)
            setStatus('starting');
            // Retry quickly every 5s to detect when it wakes up
            retryTimeout = setTimeout(checkHealth, 5000);
          } else {
            setStatus('offline');
          }
        }
      }
    };

    checkHealth();
    // Normal polling interval once status is known
    const interval = setInterval(() => {
      if (failCountRef.current === 0) {
        checkHealth();
      }
    }, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
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

  const statusConfig = {
    checking: {
      pill: 'bg-[#18181b] text-[#a1a1aa] border-[#27272a]',
      dot: 'bg-[#52525b]',
      label: 'Connecting...',
      spinning: false,
    },
    active: {
      pill: 'bg-[#18181b] text-[#fafafa] border-[#27272a]',
      dot: 'bg-emerald-400 animate-pulse',
      label: 'System Active',
      spinning: false,
    },
    starting: {
      pill: 'bg-amber-950/60 text-amber-300 border-amber-800',
      dot: 'bg-amber-400',
      label: 'Server Starting...',
      spinning: true,
    },
    offline: {
      pill: 'bg-rose-950/70 text-rose-300 border-rose-800',
      dot: 'bg-rose-400',
      label: 'System Offline',
      spinning: false,
    },
  }[status];

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & User Greeting */}
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

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Backend Status Pill */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${statusConfig.pill}`}
          title={
            status === 'starting'
              ? 'Server is waking from sleep (Render free tier). This may take up to 60 seconds.'
              : 'Backend API Status'
          }
        >
          {statusConfig.spinning ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          )}
          <span className="text-[11px]">{statusConfig.label}</span>
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
