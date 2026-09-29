import { apiClient } from './client';
import { EnrolledSubjectNode, StudentAttendanceLog } from '../types';

export const studentApi = {
  getDashboardData: async (studentId: number): Promise<{
    subjects: EnrolledSubjectNode[];
    logs: StudentAttendanceLog[];
    stats_map: Record<number, { total: number; attended: number }>;
    has_voice?: boolean;
  }> => {
    const res = await apiClient.get(`/api/student/dashboard-data?student_id=${studentId}`);
    return res.data;
  },

  updateVoice: async (studentId: number, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('student_id', studentId.toString());
    formData.append('voice_audio', audioBlob, 'voice.wav');
    const res = await apiClient.post('/api/student/update-voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
