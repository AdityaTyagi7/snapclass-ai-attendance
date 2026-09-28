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
  ScanFace,
  Mic,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Activity,
  Layers,
  GraduationCap,
  Fingerprint,
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
  const [showPassword, setShowPassword] = useState(false);
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
        toast({ type: 'info', title: 'New Student Detected', description: 'Face not found in database. Complete your registration below.' });
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
      toast({ type: 'success', title: 'Profile Created', description: `Welcome to SnapClass, ${res.student.name}!` });
      setStudentSession(res.student);
    } catch (err: any) {
      toast({ type: 'error', title: 'Registration Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] text-white flex flex-col justify-between p-4 sm:p-8 relative font-sans antialiased overflow-hidden bg-grid-pattern">
      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0D7377]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#14FFEC]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#0D7377]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between z-20 pb-4 border-b border-[#0D7377]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D7377] to-[#14FFEC] text-[#212121] flex items-center justify-center font-black shadow-lg shadow-[#14FFEC]/20">
            <ShieldCheck className="w-6 h-6 text-[#212121]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-wider uppercase font-mono">SnapClass</h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-extrabold bg-[#0D7377]/50 text-[#14FFEC] border border-[#14FFEC]/40 rounded-full">
                AI 2.0
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase">Smart Attendance Ecosystem</p>
          </div>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="flex items-center p-1 bg-[#323232] rounded-xl border border-[#0D7377] shadow-lg">
          <button
            onClick={() => setActivePortal('teacher')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activePortal === 'teacher'
                ? 'bg-[#0D7377] text-[#14FFEC] shadow-md shadow-[#0D7377]/50 border border-[#14FFEC]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Teacher Portal</span>
          </button>
          <button
            onClick={() => setActivePortal('student')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activePortal === 'student'
                ? 'bg-[#0D7377] text-[#14FFEC] shadow-md shadow-[#0D7377]/50 border border-[#14FFEC]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </button>
        </div>
      </header>

      {/* Main Split-Screen Section */}
      <main className="max-w-7xl w-full mx-auto my-auto z-10 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Hero Feature Showcase (5 cols on Desktop) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#323232] border border-[#0D7377] text-[#14FFEC] text-xs font-bold shadow-md shadow-[#0D7377]/30">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#14FFEC]" />
            <span>Next-Generation Dual-Modal Biometrics</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Classroom Attendance, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14FFEC] via-teal-300 to-white">
                Solved in Seconds.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
              Eliminate manual roll calls with continuous 3D face alignment and neural speaker recognition designed for university & enterprise scale.
            </p>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-[#323232]/80 backdrop-blur-md rounded-xl border border-[#0D7377]/60 hover:border-[#14FFEC]/80 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-[#0D7377] text-[#14FFEC] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <ScanFace className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">68-Pt Landmark Face ID</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">High-accuracy spatial orientation match</p>
            </div>

            <div className="p-3.5 bg-[#323232]/80 backdrop-blur-md rounded-xl border border-[#0D7377]/60 hover:border-[#14FFEC]/80 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-[#0D7377] text-[#14FFEC] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Neural Voiceprint</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Resemblyzer speaker identification</p>
            </div>

            <div className="p-3.5 bg-[#323232]/80 backdrop-blur-md rounded-xl border border-[#0D7377]/60 hover:border-[#14FFEC]/80 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-[#0D7377] text-[#14FFEC] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Real-Time Sync</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Instant Supabase verification logs</p>
            </div>
          </div>

          {/* Micro Telemetry Bar */}
          <div className="flex items-center gap-4 pt-1 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#14FFEC] animate-pulse" />
              <span>Matching Latency: &lt;320ms</span>
            </div>
            <span className="text-[#0D7377]">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#14FFEC]" />
              <span>Biometrics Encrypted</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card (6 cols on Desktop) */}
        <div className="lg:col-span-6 max-w-lg w-full mx-auto">
          
          {/* TEACHER PORTAL CARD */}
          {activePortal === 'teacher' && (
            <Card className="bg-[#323232] border-[#0D7377] text-white shadow-2xl backdrop-blur-xl relative overflow-hidden">
              {/* Header Tab Switcher inside Card */}
              <div className="flex border-b border-[#212121]">
                <button
                  type="button"
                  onClick={() => setTeacherMode('login')}
                  className={`flex-1 py-3 text-center text-xs font-bold transition-all cursor-pointer ${
                    teacherMode === 'login'
                      ? 'text-[#14FFEC] border-b-2 border-[#14FFEC] bg-[#0D7377]/20'
                      : 'text-zinc-400 hover:text-white hover:bg-[#212121]/50'
                  }`}
                >
                  Instructor Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherMode('register')}
                  className={`flex-1 py-3 text-center text-xs font-bold transition-all cursor-pointer ${
                    teacherMode === 'register'
                      ? 'text-[#14FFEC] border-b-2 border-[#14FFEC] bg-[#0D7377]/20'
                      : 'text-zinc-400 hover:text-white hover:bg-[#212121]/50'
                  }`}
                >
                  Register Account
                </button>
              </div>

              <CardHeader className="border-[#212121] pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center shadow-md shadow-[#0D7377]/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base font-bold">
                      {teacherMode === 'login' ? 'Teacher Access' : 'Create Teacher Profile'}
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">
                      {teacherMode === 'login'
                        ? 'Sign in to launch AI sessions and manage student records'
                        : 'Register your faculty account to start creating courses'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-2 pb-6">
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
                    
                    <div className="relative">
                      <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={tPassword}
                        onChange={(e) => setTPassword(e.target.value)}
                        icon={<Lock className="w-4 h-4 text-[#14FFEC]/70" />}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-8 text-zinc-400 hover:text-[#14FFEC] transition cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-2.5 mt-2 text-sm font-bold shadow-lg shadow-[#0D7377]/40"
                      isLoading={isLoading}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Authenticate & Launch Portal
                    </Button>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-zinc-400">New instructor?</span>
                      <button
                        type="button"
                        onClick={() => setTeacherMode('register')}
                        className="text-[#14FFEC] hover:underline font-bold transition cursor-pointer"
                      >
                        Register new faculty account →
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleTeacherRegister} className="space-y-3.5">
                    <Input
                      label="Full Name"
                      placeholder="e.g. Dr. Ananya Roy"
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      required
                    />
                    <Input
                      label="Desired Username"
                      placeholder="e.g. ananyaroy"
                      value={tUsername}
                      onChange={(e) => setTUsername(e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={tPassword}
                        onChange={(e) => setTPassword(e.target.value)}
                        required
                      />
                      <Input
                        label="Confirm Password"
                        type="password"
                        placeholder="••••••••"
                        value={tConfirmPass}
                        onChange={(e) => setTConfirmPass(e.target.value)}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full py-2.5 mt-2 text-sm font-bold shadow-lg shadow-[#0D7377]/40"
                      isLoading={isLoading}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Complete Faculty Registration
                    </Button>

                    <div className="text-center pt-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setTeacherMode('login')}
                        className="text-[#14FFEC] hover:underline font-bold transition cursor-pointer"
                      >
                        ← Already have an account? Sign In
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* STUDENT PORTAL CARD */}
          {activePortal === 'student' && (
            <Card className="bg-[#323232] border-[#0D7377] text-white shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <CardHeader className="border-[#212121] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/40 flex items-center justify-center shadow-md shadow-[#0D7377]/30">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base font-bold">
                      {scanStep === 'camera' ? 'Instant Face ID Biometric Scan' : 'Register New Student Profile'}
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">
                      {scanStep === 'camera'
                        ? 'Position your face inside the high-res camera scanner to sign in'
                        : 'Your face embedding is captured. Enter your name to complete registration'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-2 pb-6">
                {scanStep === 'camera' ? (
                  <div className="space-y-4">
                    <CameraModal onCapture={handleFaceCaptured} />
                    <div className="p-3 bg-[#212121] rounded-xl border border-[#0D7377]/50 text-center">
                      <p className="text-xs text-zinc-400">
                        First time? The camera will automatically detect your face and guide you through registration.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStudentRegisterSubmit} className="space-y-4">
                    <div className="p-3 bg-[#212121] rounded-xl border border-[#0D7377] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0D7377] text-[#14FFEC] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-white">Face Biometrics Captured</p>
                        <p className="text-zinc-400 text-[11px]">128-dimensional embedding extracted successfully</p>
                      </div>
                    </div>

                    <Input
                      label="Full Student Name"
                      placeholder="e.g. Akash Kumar"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      autoFocus
                    />

                    <div>
                      <label className="block text-xs font-bold text-[#14FFEC] uppercase tracking-wider mb-1.5">
                        Optional: Voice Biometric Profile
                      </label>
                      <AudioRecorder
                        onAudioRecorded={(blob) => setVoiceBlob(blob)}
                        label="Record a short voice sample (e.g. 'I am present') for voice scans"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setScanStep('camera')}
                        className="w-1/3"
                      >
                        Retake Face
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-2/3 shadow-lg shadow-[#0D7377]/40"
                        isLoading={isLoading}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Create Student Pass
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer System Status & Branding */}
      <footer className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 font-medium pt-4 border-t border-[#0D7377]/30 z-20 gap-2">
        <div className="flex items-center gap-2">
          <span>SnapClass &copy; {new Date().getFullYear()}</span>
          <span>•</span>
          <span className="text-[#14FFEC]">Multi-Modal AI Attendance System</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-[#14FFEC]" />
            FastAPI + PyTorch Backend
          </span>
        </div>
      </footer>
    </div>
  );
};
