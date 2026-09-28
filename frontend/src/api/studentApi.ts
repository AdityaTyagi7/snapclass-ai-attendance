import { apiClient } from './client';
import { EnrolledSubjectNode, StudentAttendanceLog } from '../types';

export const studentApi = {
  getDashboardData: async (studentId: number): Promise<{
    subjects: EnrolledSubjectNode[];
    logs: StudentAttendanceLog[];
    stats_map: Record<number, { total: number; attended: number }>;
  }> => {
    const res = await apiClient.get(`/api/student/dashboard-data?student_id=${studentId}`);
    return res.data;
  },

  enroll: async (studentId: number, subjectCode: string) => {
    const res = await apiClient.post('/api/student/enroll', { student_id: studentId, subject_code: subjectCode });
    return res.data;
  },

  unenroll: async (studentId: number, subjectId: number) => {
    const res = await apiClient.post('/api/student/unenroll', { student_id: studentId, subject_id: subjectId });
    return res.data;
  },
};
