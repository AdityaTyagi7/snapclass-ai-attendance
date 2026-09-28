import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AuthPage } from './pages/AuthPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';

const MainContent: React.FC = () => {
  const { userRole } = useAuth();

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
