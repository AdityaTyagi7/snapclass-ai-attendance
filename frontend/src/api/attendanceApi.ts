import { apiClient } from './client';
import { ScanResult, AttendanceLogEntry } from '../types';

export const attendanceApi = {
  scanFacePhotos: async (
    subjectId: number,
    photoFiles: File[]
  ): Promise<{ results: ScanResult[]; logs: AttendanceLogEntry[]; message?: string }> => {
    const formData = new FormData();
    formData.append('subject_id', subjectId.toString());
    photoFiles.forEach((file) => {
      formData.append('photos', file);
    });

    const res = await apiClient.post('/api/attendance/face-scan', formData);
    return res.data;
  },

  confirmAttendance: async (logs: AttendanceLogEntry[]) => {
    const res = await apiClient.post('/api/attendance/confirm', { logs });
    return res.data;
  },
};
