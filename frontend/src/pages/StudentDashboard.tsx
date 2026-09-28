import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentApi } from '../api/studentApi';
import { EnrolledSubjectNode, StudentAttendanceLog } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { EnrollSubjectModal } from '../components/widgets/EnrollSubjectModal';
import {
  GraduationCap,
  UserPlus,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { student } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('student_subjects');

  const [subjects, setSubjects] = useState<EnrolledSubjectNode[]>([]);
  const [logs, setLogs] = useState<StudentAttendanceLog[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, { total: number; attended: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

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
    return activeTab === 'student_subjects' ? 'My Enrolled Courses' : 'My Attendance Logs';
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} pageTitle={getTitle()}>
      {/* TAB 1: ENROLLED SUBJECTS */}
      {activeTab === 'student_subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#14FFEC]" />
                Enrolled Courses
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">Track your attendance progress and enrolled subjects</p>
            </div>
            <Button
              variant="primary"
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
            <Card className="text-center py-12 border-[#0D7377]/60">
              <CardContent>
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center mb-3 shadow-md shadow-[#0D7377]/30">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Enrolled Courses Found</h4>
                <p className="text-xs text-zinc-400 font-medium mt-1 max-w-sm mx-auto">
                  Ask your instructor for a course join code and enroll to track your attendance.
                </p>
                <Button
                  variant="primary"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((node) => {
                const sub = node.subjects;
                const stats = statsMap[sub.subject_id] || { total: 0, attended: 0 };
                const rate = stats.total > 0 ? Math.round((stats.attended / stats.total) * 100) : 0;

                return (
                  <Card key={node.id} className="flex flex-col justify-between border-[#0D7377]/60 hover:border-[#14FFEC] transition-all">
                    <CardHeader className="pb-3 border-[#212121]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="font-bold text-white text-base">{sub.name}</CardTitle>
                          <CardDescription className="text-zinc-400">Section {sub.section || 'A'}</CardDescription>
                        </div>
                        <Badge variant="success" className="font-mono">
                          {sub.subject_code}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="py-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-[#212121] rounded-xl border border-[#0D7377]/40">
                          <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Total Classes</p>
                          <p className="text-sm font-bold text-[#14FFEC]">{stats.total}</p>
                        </div>

                        <div className="p-3 bg-[#212121] rounded-xl border border-[#0D7377]/40">
                          <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Attended</p>
                          <p className="text-sm font-bold text-[#14FFEC]">{stats.attended}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-zinc-400">Attendance Rate</span>
                          <span className="text-[#14FFEC] font-bold">{rate}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#212121] rounded-full overflow-hidden border border-[#0D7377]/40">
                          <div
                            className="h-full bg-linear-to-r from-[#0D7377] to-[#14FFEC] transition-all duration-300 shadow-sm shadow-[#14FFEC]/40"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="bg-[#212121]/60 border-[#212121]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 font-semibold"
                        onClick={() => handleUnenroll(sub.subject_id, sub.name)}
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Unenroll from Subject
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATTENDANCE LOGS */}
      {activeTab === 'student_attendance' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Your Attendance History</h3>
            <p className="text-xs text-zinc-400 font-medium">Detailed logs of all attendance scans recorded for your profile</p>
          </div>

          <Card className="border-[#0D7377]/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#212121] text-[#14FFEC] text-xs uppercase tracking-wider font-bold border-b border-[#0D7377]/40">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Subject Name</th>
                    <th className="py-3.5 px-4">Course Code</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212121] text-sm text-zinc-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-400 text-xs font-semibold">
                        No attendance logs recorded yet
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#212121]/60 transition">
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-400 font-medium">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {log.subjects?.name || 'Unknown Subject'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="success" className="font-mono">
                            {log.subjects?.subject_code || 'N/A'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          {log.is_present ? (
                            <Badge variant="success">
                              <CheckCircle className="w-3.5 h-3.5 text-[#14FFEC]" /> Present
                            </Badge>
                          ) : (
                            <Badge variant="error">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" /> Absent
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
        </div>
      )}

      {/* Modal */}
      <EnrollSubjectModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrolled={fetchData}
      />
    </AppShell>
  );
};
