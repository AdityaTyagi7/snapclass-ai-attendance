export interface Teacher {
  teacher_id: number;
  name: string;
  username: string;
}

export interface Student {
  student_id: number;
  name: string;
  face_embedding?: number[];
  voice_embedding?: number[];
}

export interface Subject {
  subject_id: number;
  subject_code: string;
  name: string;
  section: string;
  teacher_id: number;
  total_students?: number;
  total_classes?: number;
}

export interface EnrolledSubjectNode {
  id: number;
  student_id: number;
  subject_id: number;
  subjects: Subject;
}

export interface StudentAttendanceLog {
  id: number;
  student_id: number;
  subject_id: number;
  timestamp: string;
  is_present: boolean;
  subjects?: Subject;
}

export interface TeacherAttendanceRecord {
  id: number;
  student_id: number;
  subject_id: number;
  timestamp: string;
  is_present: boolean;
  subjects: Subject;
}

export interface ScanResult {
  student_id: number;
  name: string;
  source?: string;
  score?: number;
  is_present: boolean;
  status: string;
}

export interface AttendanceLogEntry {
  student_id: number;
  subject_id: number;
  timestamp: string;
  is_present: boolean;
}

export interface FaceScanResponse {
  num_faces: number;
  detected_ids: number[];
  matched_student?: Student | null;
}
