import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { useToast } from '../components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { CameraModal } from '../components/widgets/CameraModal';
import { AudioRecorder } from '../components/widgets/AudioRecorder';
import {
  Camera,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { setTeacherSession, setStudentSession } = useAuth();
  const { toast } = useToast();

  const [activePortal, setActivePortal] = useState<'teacher' | 'student'>('teacher');

  // Teacher Login / Register State
  const [teacherMode, setTeacherMode] = useState<'login' | 'register'>('login');
  const [tUsername, setTUsername] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tName, setTName] = useState('');
  const [tConfirmPass, setTConfirmPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Student Scan / Register State
  const [scanStep, setScanStep] = useState<'camera' | 'register'>('camera');
  const [studentName, setStudentName] = useState('');
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);

  // Handle Teacher Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tUsername || !tPassword) return;
    setIsLoading(true);
    try {
      const res = await authApi.teacherLogin(tUsername, tPassword);
      toast({ type: 'success', title: 'Welcome Back', description: `Logged in as ${res.teacher.name}` });
      setTeacherSession(res.teacher);
    } catch (err: any) {
      toast({ type: 'error', title: 'Authentication Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Teacher Register
  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tUsername || !tName || !tPassword) return;
    if (tPassword !== tConfirmPass) {
      toast({ type: 'warning', title: 'Validation Error', description: 'Passwords do not match' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.teacherRegister({
        username: tUsername,
        name: tName,
        password: tPassword,
        confirm_password: tConfirmPass,
      });
      toast({ type: 'success', title: 'Account Created', description: res.message });
      setTeacherMode('login');
    } catch (err: any) {
      toast({ type: 'error', title: 'Registration Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Face Scan
  const handleFaceCaptured = async (file: File) => {
    setFaceFile(file);
    setIsLoading(true);
    try {
      const res = await authApi.scanStudentFace(file);
      if (res.matched_student) {
        toast({ type: 'success', title: 'Face ID Recognized', description: `Welcome back, ${res.matched_student.name}!` });
        setStudentSession(res.matched_student);
      } else {
        toast({ type: 'info', title: 'New Student Detected', description: 'Face not recognized. Please register your name.' });
        setScanStep('register');
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Face Scan Failed', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Registration
  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !faceFile) {
      toast({ type: 'warning', title: 'Validation Error', description: 'Please enter your name' });
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.registerStudent(studentName.trim(), faceFile, voiceBlob || undefined);
      toast({ type: 'success', title: 'Profile Created', description: `Hi ${res.student.name}, welcome to SnapClass!` });
      setStudentSession(res.student);
    } catch (err: any) {
      toast({ type: 'error', title: 'Registration Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] flex flex-col justify-between p-6 relative font-sans antialiased text-white">
      {/* Header Branding */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/50 flex items-center justify-center font-extrabold shadow-lg shadow-[#0D7377]/40">
            <ShieldCheck className="w-6 h-6 text-[#14FFEC]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#14FFEC] tracking-widest uppercase">SnapClass</h1>
            <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">Enterprise Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#323232] rounded-lg border border-[#0D7377]">
          <button
            onClick={() => setActivePortal('teacher')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activePortal === 'teacher'
                ? 'bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 shadow-sm shadow-[#0D7377]'
                : 'text-zinc-400 hover:text-[#14FFEC]'
            }`}
          >
            Teacher Portal
          </button>
          <button
            onClick={() => setActivePortal('student')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activePortal === 'student'
                ? 'bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 shadow-sm shadow-[#0D7377]'
                : 'text-zinc-400 hover:text-[#14FFEC]'
            }`}
          >
            Student Portal
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto my-auto z-10 py-8">
        {/* TEACHER PORTAL CARD */}
        {activePortal === 'teacher' && (
          <Card className="bg-[#323232] border-[#0D7377] text-white shadow-2xl">
            <CardHeader className="border-[#212121] text-center pb-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center mb-2 shadow-md shadow-[#0D7377]/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-[#14FFEC] text-lg font-bold">
                {teacherMode === 'login' ? 'Teacher Sign In' : 'Register Teacher Account'}
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                {teacherMode === 'login' ? 'Enter credentials to access class management' : 'Register to manage subjects and take attendance'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {teacherMode === 'login' ? (
                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <Input
                    label="Username"
                    placeholder="e.g. ananyaroy"
                    value={tUsername}
                    onChange={(e) => setTUsername(e.target.value)}
                    icon={<User className="w-4 h-4 text-[#14FFEC]/70" />}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={tPassword}
                    onChange={(e) => setTPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4 text-[#14FFEC]/70" />}
                    required
                  />
                  <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} icon={<ArrowRight className="w-4 h-4" />}>
                    Sign In
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setTeacherMode('register')}
                      className="text-xs text-[#14FFEC] hover:underline font-semibold transition cursor-pointer"
                    >
                      Need an account? Register as Teacher
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleTeacherRegister} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Ananya Roy"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    required
                  />
                  <Input
                    label="Username"
                    placeholder="e.g. ananyaroy"
                    value={tUsername}
                    onChange={(e) => setTUsername(e.target.value)}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    value={tPassword}
                    onChange={(e) => setTPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm password"
                    value={tConfirmPass}
                    onChange={(e) => setTConfirmPass(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                    Create Account
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setTeacherMode('login')}
                      className="text-xs text-[#14FFEC] hover:underline font-semibold transition cursor-pointer"
                    >
                      Already registered? Sign In instead
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* STUDENT PORTAL CARD */}
        {activePortal === 'student' && (
          <Card className="bg-[#323232] border-[#0D7377] text-white shadow-2xl">
            <CardHeader className="border-[#212121] text-center pb-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center mb-2 shadow-md shadow-[#0D7377]/30">
                <Camera className="w-6 h-6" />
              </div>
              <CardTitle className="text-[#14FFEC] text-lg font-bold">Student Face ID Scan</CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                {scanStep === 'camera'
                  ? 'Position your face inside the camera frame'
                  : 'Complete student profile registration'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {scanStep === 'camera' ? (
                <CameraModal onCapture={handleFaceCaptured} />
              ) : (
                <form onSubmit={handleStudentRegisterSubmit} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Akash Kumar"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-[#14FFEC] uppercase tracking-wider mb-1.5">
                      Optional: Voice Profile
                    </label>
                    <AudioRecorder
                      onAudioRecorded={(blob) => setVoiceBlob(blob)}
                      label="Record phrase for voice attendance scan"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setScanStep('camera')}
                      className="w-1/3"
                    >
                      Back
                    </Button>
                    <Button type="submit" variant="primary" className="w-2/3" isLoading={isLoading} icon={<CheckCircle2 className="w-4 h-4" />}>
                      Create Profile
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-zinc-400 font-semibold uppercase tracking-wider z-10">
        SnapClass &copy; {new Date().getFullYear()} — <span className="text-[#14FFEC]">Enterprise Web Platform</span>
      </footer>
    </div>
  );
};
