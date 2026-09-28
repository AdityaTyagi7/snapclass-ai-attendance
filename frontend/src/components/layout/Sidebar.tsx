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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { userRole, teacher, student, logout } = useAuth();

  const teacherNav = [
    { id: 'take_attendance', label: 'Take Attendance', icon: Camera },
    { id: 'manage_subjects', label: 'Manage Subjects', icon: BookOpen },
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
      className={`fixed left-0 top-0 z-40 h-screen bg-[#212121] text-white transition-all duration-300 border-r border-[#0D7377]/40 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Branding */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#0D7377]/40">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center font-bold shadow-md shadow-[#0D7377]/30">
                <ShieldCheck className="w-5 h-5 text-[#14FFEC]" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-[#14FFEC] tracking-wider uppercase font-sans">SnapClass</h1>
                <p className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase">Enterprise Platform</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-md bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center font-bold shadow-md shadow-[#0D7377]/30">
              <ShieldCheck className="w-5 h-5 text-[#14FFEC]" />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 text-zinc-400 hover:text-[#14FFEC] hover:bg-[#323232] rounded-md transition cursor-pointer ${
              isCollapsed ? 'mx-auto mt-2' : ''
            }`}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Badge */}
        {!isCollapsed && userRole && (
          <div className="px-3.5 py-2 mx-4 mt-4 rounded-md bg-[#323232] border border-[#0D7377]/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#14FFEC] shadow-sm shadow-[#14FFEC]" />
            <span className="text-xs font-semibold text-[#14FFEC] capitalize">{userRole} Portal</span>
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-semibold text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#0D7377] text-[#14FFEC] font-bold border border-[#14FFEC]/50 shadow-md shadow-[#0D7377]/40'
                    : 'text-zinc-400 hover:bg-[#323232] hover:text-[#14FFEC]'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#14FFEC]' : 'text-zinc-400'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-[#0D7377]/40 bg-[#212121]">
        {!isCollapsed && (
          <div className="flex items-center justify-between p-2 mb-2 rounded-md bg-[#323232] border border-[#0D7377]/60">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-white truncate">{userName || 'User'}</p>
              <p className="text-[10px] text-[#14FFEC]/80 truncate">{userSubtext}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-semibold text-xs text-zinc-400 hover:bg-[#323232] hover:text-[#14FFEC] transition cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-zinc-400" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
