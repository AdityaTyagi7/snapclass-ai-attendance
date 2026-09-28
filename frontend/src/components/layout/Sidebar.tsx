import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Camera,
  ClipboardList,
  GraduationCap,
  LogOut,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const BrandMark = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M2.3 12h2.4v10.95h6.2V14.6h4.6v8.35h6.2V12h-2.4V1.05h-6.2V9.4H8.5V1.05H2.3Z" />
    </svg>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { userRole, teacher, student, logout } = useAuth();

  const teacherNav = [
    { id: 'take_attendance', label: 'Take Attendance', icon: Camera },
    { id: 'manage_subjects', label: 'Manage Courses', icon: BookOpen },
    { id: 'attendance_records', label: 'Attendance Records', icon: ClipboardList },
  ];

  const studentNav = [
    { id: 'student_subjects', label: 'My Courses', icon: GraduationCap },
    { id: 'student_attendance', label: 'My Attendance Logs', icon: UserCheck },
  ];

  const navItems = userRole === 'teacher' ? teacherNav : studentNav;
  const userName = userRole === 'teacher' ? teacher?.name : student?.name;
  const userSubtext = userRole === 'teacher' ? `@${teacher?.username}` : `ID: #${student?.student_id}`;

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-[#0c0c0e] text-[#fafafa] transition-all duration-300 border-r border-[#27272a] flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#27272a]">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-6 text-white" />
              <div>
                <h1 className="text-sm font-semibold tracking-[-0.025em] text-white">SnapClass</h1>
                <p className="text-[10px] text-[#a1a1aa] font-medium tracking-wider uppercase">Attendance System</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto">
              <BrandMark className="size-6 text-white" />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#18181b] rounded-md transition cursor-pointer ${
              isCollapsed ? 'mx-auto mt-2' : ''
            }`}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Badge */}
        {!isCollapsed && userRole && (
          <div className="px-3.5 py-2 mx-4 mt-4 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-between">
            <span className="text-xs font-medium text-[#fafafa] capitalize">{userRole} Workspace</span>
            <span className="w-2 h-2 rounded-full bg-white" />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#27272a] text-white shadow-xs font-semibold'
                    : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#a1a1aa]'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-[#27272a] bg-[#0c0c0e]">
        {!isCollapsed && (
          <div className="flex items-center justify-between p-2.5 mb-2 rounded-xl bg-[#18181b] border border-[#27272a]">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-white truncate">{userName || 'User'}</p>
              <p className="text-[10px] text-[#a1a1aa] truncate">{userSubtext}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#27272a] flex items-center justify-center font-bold text-xs text-white">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-[#a1a1aa]" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
