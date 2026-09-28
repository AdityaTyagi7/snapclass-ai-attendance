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

    const res = await apiClient.post('/api/attendance/face-scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  scanVoiceAudio: async (
    subjectId: number,
    audioFile: File | Blob
  ): Promise<{ results: ScanResult[]; logs: AttendanceLogEntry[]; message?: string }> => {
    const formData = new FormData();
    formData.append('subject_id', subjectId.toString());
    formData.append('audio', audioFile, 'classroom_audio.wav');

    const res = await apiClient.post('/api/attendance/voice-scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  confirmAttendance: async (logs: AttendanceLogEntry[]) => {
    const res = await apiClient.post('/api/attendance/confirm', { logs });
    return res.data;
  },
};
