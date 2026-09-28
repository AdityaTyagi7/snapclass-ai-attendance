import React, { createContext, useContext, useState, useEffect } from 'react';
import { Teacher, Student } from '../types';

interface AuthContextType {
  userRole: 'teacher' | 'student' | null;
  teacher: Teacher | null;
  student: Student | null;
  setTeacherSession: (teacher: Teacher) => void;
  setStudentSession: (student: Student) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(() => {
    return (localStorage.getItem('snapclass_role') as 'teacher' | 'student') || null;
  });
  const [teacher, setTeacher] = useState<Teacher | null>(() => {
    const saved = localStorage.getItem('snapclass_teacher');
    return saved ? JSON.parse(saved) : null;
  });
  const [student, setStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('snapclass_student');
    return saved ? JSON.parse(saved) : null;
  });

  const setTeacherSession = (teacherData: Teacher) => {
    setUserRole('teacher');
    setTeacher(teacherData);
    setStudent(null);
    localStorage.setItem('snapclass_role', 'teacher');
    localStorage.setItem('snapclass_teacher', JSON.stringify(teacherData));
    localStorage.removeItem('snapclass_student');
  };

  const setStudentSession = (studentData: Student) => {
    setUserRole('student');
    setStudent(studentData);
    setTeacher(null);
    localStorage.setItem('snapclass_role', 'student');
    localStorage.setItem('snapclass_student', JSON.stringify(studentData));
    localStorage.removeItem('snapclass_teacher');
  };

  const logout = () => {
    setUserRole(null);
    setTeacher(null);
    setStudent(null);
    localStorage.removeItem('snapclass_role');
    localStorage.removeItem('snapclass_teacher');
    localStorage.removeItem('snapclass_student');
  };

  return (
    <AuthContext.Provider
      value={{
        userRole,
        teacher,
        student,
        setTeacherSession,
        setStudentSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
