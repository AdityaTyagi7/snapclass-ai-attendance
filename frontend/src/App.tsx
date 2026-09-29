import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AuthPage } from './pages/AuthPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';

const MainContent: React.FC = () => {
  const { userRole } = useAuth();

  React.useEffect(() => {
    // Preserve invite join code across authentication flow
    const params = new URLSearchParams(window.location.search);
    const code =
      params.get('join-code') ||
      params.get('join_code') ||
      params.get('joinCode') ||
      params.get('code');
    if (code) {
      localStorage.setItem('snapclass_pending_join_code', code.trim().toUpperCase());
    }
  }, []);

  if (!userRole) {
    return <AuthPage />;
  }

  if (userRole === 'teacher') {
    return <TeacherDashboard />;
  }

  if (userRole === 'student') {
    return <StudentDashboard />;
  }

  return <AuthPage />;
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
