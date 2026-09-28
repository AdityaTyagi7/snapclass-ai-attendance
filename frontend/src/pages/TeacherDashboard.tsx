"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  BarChart3,
  BookOpen,
  Camera,
  ClipboardList,
  FileText,
  Plus,
  Share2,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { teacherApi } from '../api/teacherApi';
import { Subject, TeacherAttendanceRecord } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { CreateSubjectModal } from '../components/widgets/CreateSubjectModal';
import { ShareSubjectModal } from '../components/widgets/ShareSubjectModal';
import { TakeAttendanceWizard } from '../components/widgets/TakeAttendanceWizard';

export const TeacherDashboard: React.FC = () => {
  const { teacher } = useAuth();
  const [activeTab, setActiveTab] = useState('take_attendance');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareSubject, setShareSubject] = useState<Subject | null>(null);

  const fetchData = async () => {
    if (!teacher) return;
    setIsLoading(true);
    try {
      const [subs, recs] = await Promise.all([
        teacherApi.getSubjects(teacher.teacher_id),
        teacherApi.getAttendanceRecords(teacher.teacher_id),
      ]);
      setSubjects(subs);
      setRecords(recs);
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teacher]);

  const getTitle = () => {
    switch (activeTab) {
      case 'take_attendance':
        return 'Take AI Attendance';
      case 'manage_subjects':
        return 'Manage Courses';
      case 'attendance_records':
        return 'Attendance Records';
      default:
        return 'Teacher Dashboard';
    }
  };

  // Grouped records for table & statistics
  const groupedRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    const map = new Map<string, { time: string; subject: string; code: string; present: number; total: number; rawTime: string }>();

    records.forEach((r) => {
      const tsKey = r.timestamp ? r.timestamp.split('.')[0] : 'N/A';
      const timeStr = r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A';
      const subName = r.subjects?.name || 'Unknown';
      const subCode = r.subjects?.subject_code || 'N/A';

      const key = `${tsKey}_${subCode}`;
      if (!map.has(key)) {
        map.set(key, { time: timeStr, subject: subName, code: subCode, present: 0, total: 0, rawTime: r.timestamp || '' });
      }
      const item = map.get(key)!;
      item.total += 1;
      if (r.is_present) item.present += 1;
    });

    return Array.from(map.values());
  }, [records]);

  // Aggregate stats matching template STATS
  const totalStudents = useMemo(() => {
    return subjects.reduce((acc, s) => acc + (s.total_students || 0), 0);
  }, [subjects]);

  const totalSessions = useMemo(() => {
    return subjects.reduce((acc, s) => acc + (s.total_classes || 0), 0);
  }, [subjects]);

  const avgAttendanceRate = useMemo(() => {
    if (groupedRecords.length === 0) return 0;
    const totalPresent = groupedRecords.reduce((acc, r) => acc + r.present, 0);
    const totalPossible = groupedRecords.reduce((acc, r) => acc + r.total, 0);
    return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  }, [groupedRecords]);

  // Dynamic weekly chart data matching template
  const chartData = useMemo(() => {
    if (groupedRecords.length === 0) {
      return [
        { session: 'W1', expected: 30, present: 28 },
        { session: 'W2', expected: 30, present: 26 },
        { session: 'W3', expected: 35, present: 33 },
        { session: 'W4', expected: 35, present: 32 },
        { session: 'W5', expected: 40, present: 38 },
        { session: 'W6', expected: 40, present: 39 },
      ];
    }
    return groupedRecords.slice(-8).map((r, i) => ({
      session: `S${i + 1}`,
      expected: r.total,
      present: r.present,
    }));
  }, [groupedRecords]);

  const stats = [
    {
      label: 'Active courses',
      value: subjects.length.toString(),
      hint: `${subjects.length} registered subject(s)`,
      icon: BookOpen,
    },
    {
      label: 'Enrolled students',
      value: totalStudents.toString(),
      hint: 'Across all active courses',
      icon: Users,
    },
    {
      label: 'Total sessions',
      value: totalSessions.toString(),
      hint: `${groupedRecords.length} verified scan logs`,
      icon: Clock,
    },
    {
      label: 'Avg attendance rate',
      value: `${avgAttendanceRate}%`,
      hint: 'Calculated over all sessions',
      icon: BarChart3,
    },
  ];

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} pageTitle={getTitle()}>
      <div className="flex flex-col gap-6">
        
        {/* TOP STATS CARDS MATCHING TEMPLATE */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#a1a1aa]">
                  {stat.label}
                </CardTitle>
                <stat.icon aria-hidden className="size-4 text-[#a1a1aa]" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-[#a1a1aa] mt-1">{stat.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* TAB NAVIGATION PILLS */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121215] rounded-xl border border-[#27272a] w-fit">
          <button
            onClick={() => setActiveTab('take_attendance')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'take_attendance'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('manage_subjects')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'manage_subjects'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manage Courses</span>
          </button>
          <button
            onClick={() => setActiveTab('attendance_records')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'attendance_records'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>History & Records</span>
          </button>
        </div>

        {/* TAB 1: TAKE ATTENDANCE */}
        {activeTab === 'take_attendance' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <TakeAttendanceWizard subjects={subjects} onAttendanceCompleted={fetchData} />
            )}
          </div>
        )}

        {/* TAB 2: MANAGE COURSES */}
        {activeTab === 'manage_subjects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight">Active Courses</h2>
                <p className="text-xs text-[#a1a1aa] mt-0.5">Manage your registered subjects and share student join codes</p>
              </div>
              <Button
                variant="default"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Create Subject
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-44 w-full" />
              </div>
            ) : subjects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-3 text-white">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">No Courses Created Yet</h3>
                  <p className="text-xs text-[#a1a1aa] mt-1 max-w-sm">
                    Get started by creating your first subject to generate a student join code.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsCreateModalOpen(true)}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Create Subject
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((sub) => {
                  const rate = sub.total_students ? Math.min(100, Math.round(((sub.total_classes || 0) / 20) * 100)) : 0;
                  return (
                    <Card key={sub.subject_id} className="flex flex-col justify-between hover:border-[#3f3f46] transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base font-semibold">{sub.name}</CardTitle>
                            <CardDescription>Section {sub.section || 'A'}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="font-mono">
                            {sub.subject_code}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="py-2 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-[#18181b] rounded-lg border border-[#27272a]">
                            <p className="text-[#a1a1aa] uppercase tracking-wider text-[10px] font-medium">Students</p>
                            <p className="text-sm font-semibold text-white mt-0.5">{sub.total_students || 0}</p>
                          </div>
                          <div className="p-2.5 bg-[#18181b] rounded-lg border border-[#27272a]">
                            <p className="text-[#a1a1aa] uppercase tracking-wider text-[10px] font-medium">Sessions</p>
                            <p className="text-sm font-semibold text-white mt-0.5">{sub.total_classes || 0}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-xs text-[#a1a1aa]">
                            <span>Course Progress</span>
                            <span>{sub.total_classes || 0} classes logged</span>
                          </div>
                          <Progress value={rate} />
                        </div>
                      </CardContent>

                      <CardFooter className="pt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setShareSubject(sub)}
                          icon={<Share2 className="w-3.5 h-3.5" />}
                        >
                          Share Code & QR
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ATTENDANCE RECORDS & ANALYTICS (Matches Template Chart & Recent Activity) */}
        {activeTab === 'attendance_records' && (
          <div className="space-y-6">
            {/* AREA CHART MATCHING TEMPLATE */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance throughput</CardTitle>
                <CardDescription>
                  Enrolled students against verified attendees over recent sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="session"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={30}
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="expected"
                        stroke="#71717a"
                        strokeDasharray="4 4"
                        fill="none"
                        strokeWidth={1.5}
                        name="Enrolled"
                      />
                      <Area
                        type="monotone"
                        dataKey="present"
                        stroke="#ffffff"
                        fill="url(#colorPresent)"
                        strokeWidth={2}
                        name="Present"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* TABLE & RECENT ACTIVITY MATCHING TEMPLATE */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Log History</CardTitle>
                <CardDescription>Historical records of classroom attendance scans</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#18181b]/50 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                      <th className="py-3 px-5">Timestamp</th>
                      <th className="py-3 px-5">Subject</th>
                      <th className="py-3 px-5">Course Code</th>
                      <th className="py-3 px-5">Present Count</th>
                      <th className="py-3 px-5 text-right">Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a] text-sm text-[#fafafa]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ) : groupedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-[#a1a1aa]">
                          No attendance sessions recorded yet
                        </td>
                      </tr>
                    ) : (
                      groupedRecords.map((item, idx) => {
                        const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
                        return (
                          <tr key={idx} className="hover:bg-[#18181b]/60 transition-colors">
                            <td className="py-3 px-5 font-mono text-xs text-[#a1a1aa]">{item.time}</td>
                            <td className="py-3 px-5 font-medium text-white">{item.subject}</td>
                            <td className="py-3 px-5">
                              <Badge variant="secondary" className="font-mono">
                                {item.code}
                              </Badge>
                            </td>
                            <td className="py-3 px-5 text-xs text-[#a1a1aa]">
                              {item.present} of {item.total} students
                            </td>
                            <td className="py-3 px-5 text-right">
                              <Badge variant="default" className="font-mono font-bold">
                                {rate}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

      </div>

      {/* Modals */}
      <CreateSubjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubjectCreated={fetchData}
      />
      <ShareSubjectModal
        isOpen={!!shareSubject}
        onClose={() => setShareSubject(null)}
        subject={shareSubject}
      />
    </AppShell>
  );
};

export default TeacherDashboard;
