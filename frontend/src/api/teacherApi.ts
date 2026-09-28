import { apiClient } from './client';
import { Subject, TeacherAttendanceRecord } from '../types';

export const teacherApi = {
  getSubjects: async (teacherId: number): Promise<Subject[]> => {
    const res = await apiClient.get(`/api/teacher/subjects?teacher_id=${teacherId}`);
    return res.data.subjects || [];
  },

  createSubject: async (data: { subject_code: string; name: string; section: string; teacher_id: number }): Promise<Subject> => {
    const res = await apiClient.post('/api/teacher/subjects', data);
    return res.data.subject;
  },

  getAttendanceRecords: async (teacherId: number): Promise<TeacherAttendanceRecord[]> => {
    const res = await apiClient.get(`/api/teacher/attendance-records?teacher_id=${teacherId}`);
    return res.data.records || [];
  },
};
