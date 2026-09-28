import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherApi } from '../api/teacherApi';
import { Subject, TeacherAttendanceRecord } from '../types';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { CreateSubjectModal } from '../components/widgets/CreateSubjectModal';
import { ShareSubjectModal } from '../components/widgets/ShareSubjectModal';
import { TakeAttendanceWizard } from '../components/widgets/TakeAttendanceWizard';
import {
  BookOpen,
  Plus,
  Share2,
  Users,
  Clock,
} from 'lucide-react';

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
      case 'take_attendance': return 'Take AI Attendance';
      case 'manage_subjects': return 'Manage Subjects';
      case 'attendance_records': return 'Attendance Records';
      default: return 'Teacher Dashboard';
    }
  };

  const groupedRecords = React.useMemo(() => {
    if (!records || records.length === 0) return [];
    const map = new Map<string, { time: string; subject: string; code: string; present: number; total: number }>();

    records.forEach((r) => {
      const tsKey = r.timestamp ? r.timestamp.split('.')[0] : 'N/A';
      const timeStr = r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A';
      const subName = r.subjects?.name || 'Unknown';
      const subCode = r.subjects?.subject_code || 'N/A';

      const key = `${tsKey}_${subCode}`;
      if (!map.has(key)) {
        map.set(key, { time: timeStr, subject: subName, code: subCode, present: 0, total: 0 });
      }
      const item = map.get(key)!;
      item.total += 1;
      if (r.is_present) item.present += 1;
    });

    return Array.from(map.values());
  }, [records]);

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} pageTitle={getTitle()}>
      {/* TAB 1: TAKE ATTENDANCE */}
      {activeTab === 'take_attendance' && (
        <div>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <TakeAttendanceWizard subjects={subjects} onAttendanceCompleted={fetchData} />
          )}
        </div>
      )}

      {/* TAB 2: MANAGE SUBJECTS */}
      {activeTab === 'manage_subjects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#14FFEC]" />
                Your Enrolled Courses
              </h3>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">Create subjects and share join codes with students</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create New Subject
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
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Subjects Created Yet</h4>
                <p className="text-xs text-zinc-400 font-medium mt-1 max-w-sm mx-auto">
                  Get started by creating your first subject to generate a student join code.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsCreateModalOpen(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Create Subject Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((sub) => (
                <Card key={sub.subject_id} className="flex flex-col justify-between border-[#0D7377]/60 hover:border-[#14FFEC] transition-all">
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

                  <CardContent className="py-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#212121] rounded-xl border border-[#0D7377]/40 flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-[#14FFEC] shrink-0" />
                        <div>
                          <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Students</p>
                          <p className="text-sm font-bold text-[#14FFEC]">{sub.total_students || 0}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#212121] rounded-xl border border-[#0D7377]/40 flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#14FFEC] shrink-0" />
                        <div>
                          <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Sessions</p>
                          <p className="text-sm font-bold text-[#14FFEC]">{sub.total_classes || 0}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-[#212121]/60 border-[#212121]">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShareSubject(sub)}
                      icon={<Share2 className="w-3.5 h-3.5" />}
                    >
                      Share Code & QR Code
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATTENDANCE RECORDS */}
      {activeTab === 'attendance_records' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Attendance History Logs</h3>
            <p className="text-xs text-zinc-400 font-medium">Historical records of classroom attendance scans</p>
          </div>

          <Card className="border-[#0D7377]/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#212121] text-[#14FFEC] text-xs uppercase tracking-wider font-bold border-b border-[#0D7377]/40">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Subject Name</th>
                    <th className="py-3.5 px-4">Course Code</th>
                    <th className="py-3.5 px-4">Present Students</th>
                    <th className="py-3.5 px-4 text-right">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212121] text-sm text-zinc-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ) : groupedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400 text-xs font-semibold">
                        No historical attendance records logged yet
                      </td>
                    </tr>
                  ) : (
                    groupedRecords.map((item, idx) => {
                      const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-[#212121]/60 transition">
                          <td className="py-3.5 px-4 font-mono text-xs text-zinc-400 font-medium">{item.time}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{item.subject}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant="success" className="font-mono">
                              {item.code}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-zinc-300">
                            ✅ {item.present} / {item.total} Students
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40">
                              {rate}%
                            </span>
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
