"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Trash2,
  UserCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';

import { useAuth } from '../context/AuthContext';
import { studentApi } from '../api/studentApi';
import { EnrolledSubjectNode, StudentAttendanceLog } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { EnrollSubjectModal } from '../components/widgets/EnrollSubjectModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const StudentDashboard: React.FC = () => {
  const { student } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('student_subjects');

  const [subjects, setSubjects] = useState<EnrolledSubjectNode[]>([]);
  const [logs, setLogs] = useState<StudentAttendanceLog[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, { total: number; attended: number }>>({});
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [joinCodeToEnroll, setJoinCodeToEnroll] = useState<string>('');

  // Auto popup join class modal when invited via link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode =
      params.get('join-code') ||
      params.get('join_code') ||
      params.get('joinCode') ||
      params.get('code');
    const storedCode = localStorage.getItem('snapclass_pending_join_code');
    const code = (urlCode || storedCode || '').trim().toUpperCase();

    if (code) {
      setJoinCodeToEnroll(code);
      setIsEnrollModalOpen(true);
      localStorage.removeItem('snapclass_pending_join_code');
      if (urlCode) {
        const url = new URL(window.location.href);
        url.searchParams.delete('join-code');
        url.searchParams.delete('join_code');
        url.searchParams.delete('joinCode');
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
      }
    }
  }, []);

  const fetchData = async () => {
    if (!student) return;
    setIsLoading(true);
    try {
      const res = await studentApi.getDashboardData(student.student_id);
      setSubjects(res.subjects || []);
      setLogs(res.logs || []);
      setStatsMap(res.stats_map || {});
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [student]);

  const handleUnenroll = async (subjectId: number, subjectName: string) => {
    if (!student) return;
    if (!confirm(`Are you sure you want to unenroll from ${subjectName}?`)) return;

    try {
      await studentApi.unenroll(student.student_id, subjectId);
      toast({ type: 'success', title: 'Unenrolled', description: `Unenrolled from ${subjectName}` });
      fetchData();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', description: err.message });
    }
  };

  const getTitle = () => {
    return activeTab === 'student_subjects' ? 'My Courses' : 'My Attendance Logs';
  };

  // Aggregate stats matching template STATS
  const totalAttended = useMemo(() => {
    return Object.values(statsMap).reduce((acc, s) => acc + (s.attended || 0), 0);
  }, [statsMap]);

  const totalClasses = useMemo(() => {
    return Object.values(statsMap).reduce((acc, s) => acc + (s.total || 0), 0);
  }, [statsMap]);

  const missedClasses = Math.max(0, totalClasses - totalAttended);

  const overallRate = useMemo(() => {
    return totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;
  }, [totalClasses, totalAttended]);

  // Dynamic weekly chart data matching template
  const chartData = useMemo(() => {
    if (logs.length === 0) {
      return [
        { week: 'W1', attended: 4, total: 5 },
        { week: 'W2', attended: 5, total: 5 },
        { week: 'W3', attended: 3, total: 4 },
        { week: 'W4', attended: 4, total: 4 },
        { week: 'W5', attended: 5, total: 5 },
        { week: 'W6', attended: 5, total: 5 },
      ];
    }
    return logs.slice(-8).map((log, i) => ({
      week: `Log ${i + 1}`,
      attended: log.is_present ? 1 : 0,
      total: 1,
    }));
  }, [logs]);

  const stats = [
    {
      label: 'Enrolled courses',
      value: subjects.length.toString(),
      hint: `${subjects.length} active subject enrollment(s)`,
      icon: GraduationCap,
    },
    {
      label: 'Classes attended',
      value: totalAttended.toString(),
      hint: 'Verified present sessions',
      icon: UserCheck,
    },
    {
      label: 'Missed classes',
      value: missedClasses.toString(),
      hint: `${missedClasses} absent mark(s)`,
      icon: Calendar,
    },
    {
      label: 'Overall rate',
      value: `${overallRate}%`,
      hint: `${totalAttended} of ${totalClasses} total classes`,
      icon: BarChart3,
    },
  ];

  const tabs = [
    { id: 'student_subjects', label: 'My Courses', icon: GraduationCap },
    { id: 'student_attendance', label: 'My Attendance History', icon: UserCheck },
  ];

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} pageTitle={getTitle()}>
      <div className="flex flex-col gap-6">

        {/* TOP STATS CARDS WITH STAGGERED MOTION */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <Card className="h-full hover:border-[#3f3f46] transition-colors">
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
            </motion.div>
          ))}
        </motion.div>

        {/* TAB NAVIGATION PILLS WITH ANIMATED ACTIVE INDICATOR */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121215] rounded-xl border border-[#27272a] w-fit relative">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer z-10 ${
                  isActive ? 'text-black font-semibold' : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="studentTabIndicator"
                    className="absolute inset-0 bg-white rounded-lg -z-10 shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ANIMATED TAB CONTENT */}
        <AnimatePresence mode="wait">
          {/* TAB 1: ENROLLED COURSES */}
          {activeTab === 'student_subjects' && (
            <motion.div
              key="student_subjects"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white tracking-tight">Enrolled Courses</h2>
                  <p className="text-xs text-[#a1a1aa] mt-0.5">Track your attendance progress and enrolled subjects</p>
                </div>
                <Button
                  variant="default"
                  onClick={() => setIsEnrollModalOpen(true)}
                  icon={<UserPlus className="w-4 h-4" />}
                >
                  Enroll in Subject
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
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">No Enrolled Courses Found</h3>
                    <p className="text-xs text-[#a1a1aa] mt-1 max-w-sm">
                      Ask your instructor for a course join code and enroll to track your attendance.
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-4"
                      onClick={() => setIsEnrollModalOpen(true)}
                      icon={<UserPlus className="w-4 h-4" />}
                    >
                      Enroll Now
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {subjects.map((node) => {
                    const sub = node.subjects;
                    const statsObj = statsMap[sub.subject_id] || { total: 0, attended: 0 };
                    const rate = statsObj.total > 0 ? Math.round((statsObj.attended / statsObj.total) * 100) : 0;

                    return (
                      <motion.div
                        key={node.id}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        <Card className="flex flex-col justify-between h-full hover:border-[#3f3f46] transition-colors">
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
                                <p className="text-[#a1a1aa] uppercase tracking-wider text-[10px] font-medium">Total Classes</p>
                                <p className="text-sm font-semibold text-white mt-0.5">{statsObj.total}</p>
                              </div>
                              <div className="p-2.5 bg-[#18181b] rounded-lg border border-[#27272a]">
                                <p className="text-[#a1a1aa] uppercase tracking-wider text-[10px] font-medium">Attended</p>
                                <p className="text-sm font-semibold text-white mt-0.5">{statsObj.attended}</p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-xs text-[#a1a1aa]">
                                <span>Attendance Rate</span>
                                <span className="font-medium text-white">{rate}%</span>
                              </div>
                              <Progress value={rate} />
                            </div>
                          </CardContent>

                          <CardFooter className="pt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs text-[#a1a1aa] hover:text-rose-400 hover:bg-rose-950/30 font-medium"
                              onClick={() => handleUnenroll(sub.subject_id, sub.name)}
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Unenroll
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* TAB 2: ATTENDANCE HISTORY */}
          {activeTab === 'student_attendance' && (
            <motion.div
              key="student_attendance"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* AREA CHART */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Consistency</CardTitle>
                  <CardDescription>
                    Your attendance presence trend across registered sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="studentCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="week"
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
                          dataKey="attended"
                          stroke="#ffffff"
                          fill="url(#studentCompleted)"
                          strokeWidth={2}
                          name="Presence"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* RECENT ACTIVITY TABLE */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Log History</CardTitle>
                  <CardDescription>Detailed logs of all scans recorded for your student profile</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#27272a] bg-[#18181b]/50 text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                        <th className="py-3 px-5">Timestamp</th>
                        <th className="py-3 px-5">Subject</th>
                        <th className="py-3 px-5">Course Code</th>
                        <th className="py-3 px-5 text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a] text-sm text-[#fafafa]">
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center">
                            <Skeleton className="h-6 w-full" />
                          </td>
                        </tr>
                      ) : logs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-xs text-[#a1a1aa]">
                            No attendance records found yet
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#18181b]/60 transition-colors">
                            <td className="py-3 px-5 font-mono text-xs text-[#a1a1aa]">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-3 px-5 font-medium text-white">
                              {log.subjects?.name || 'Unknown Subject'}
                            </td>
                            <td className="py-3 px-5">
                              <Badge variant="secondary" className="font-mono">
                                {log.subjects?.subject_code || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-5 text-right">
                              {log.is_present ? (
                                <Badge variant="default" className="font-semibold gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-black" /> Present
                                </Badge>
                              ) : (
                                <Badge variant="error" className="gap-1">
                                  <XCircle className="w-3 h-3 text-rose-400" /> Absent
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Enroll Modal */}
      <EnrollSubjectModal
        isOpen={isEnrollModalOpen}
        onClose={() => {
          setIsEnrollModalOpen(false);
          setJoinCodeToEnroll('');
        }}
        onEnrolled={() => {
          fetchData();
          setJoinCodeToEnroll('');
        }}
        defaultCode={joinCodeToEnroll}
      />
    </AppShell>
  );
};

export default StudentDashboard;
