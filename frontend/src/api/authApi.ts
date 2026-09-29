import { apiClient } from './client';
import { Teacher, Student, FaceScanResponse } from '../types';

export const authApi = {
  teacherLogin: async (username: string, password: string): Promise<{ teacher: Teacher }> => {
    const res = await apiClient.post('/api/auth/teacher/login', { username, password });
    return res.data;
  },

  teacherRegister: async (data: { username: string; name: string; password: string; confirm_password: string }) => {
    const res = await apiClient.post('/api/auth/teacher/register', data);
    return res.data;
  },

  scanStudentFace: async (imageFile: File): Promise<FaceScanResponse> => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await apiClient.post('/api/auth/student/scan-face', formData);
    return res.data;
  },

  registerStudent: async (name: string, faceImage: File, voiceAudio?: File | Blob): Promise<{ student: Student }> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('face_image', faceImage, 'face.jpg');
    if (voiceAudio) {
      formData.append('voice_audio', voiceAudio, 'voice.wav');
    }
    const res = await apiClient.post('/api/auth/student/register', formData);
    return res.data;
  },
};
