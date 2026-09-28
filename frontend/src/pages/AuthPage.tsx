"use client";

import * as React from "react";
import { useState } from "react";
import {
  ChevronLeft,
  Loader2,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ScanFace,
  Fingerprint,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { CameraModal } from "../components/widgets/CameraModal";
import { AudioRecorder } from "../components/widgets/AudioRecorder";

const ENTER =
  "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] fill-mode-both motion-reduce:animate-none";

const stagger = (index: number, step = 60): React.CSSProperties => ({
  animationDelay: `${index * step}ms`,
});

const BrandMark = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center justify-center rounded-xl bg-gradient-to-br from-[#0D7377] to-[#14FFEC] p-2 shadow-lg shadow-[#0D7377]/40", className)}>
      <ShieldCheck className="h-5 w-5 text-[#212121]" />
    </div>
  );
};

const jitter = (i: number) => {
  const value = Math.sin(i + 1) * 10_000;
  return value - Math.floor(value);
};

const FloatingPaths = ({ position }: { position: number }) => {
  const reduceMotion = useReducedMotion();
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-[#0D7377]"
        fill="none"
        viewBox="0 0 696 316"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            initial={{ pathLength: 0.3 }}
            animate={
              reduceMotion
                ? undefined
                : { pathLength: 1, pathOffset: [0, 1, 0] }
            }
            stroke="currentColor"
            className="opacity-70"
            strokeOpacity={0.15 + path.id * 0.025}
            strokeWidth={path.width}
            transition={{
              duration: 20 + jitter(path.id) * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export const AuthPage: React.FC = () => {
  const { setTeacherSession, setStudentSession } = useAuth();
  const { toast } = useToast();

  const [activePortal, setActivePortal] = useState<"teacher" | "student">("teacher");

  // Teacher Login / Register State
  const [teacherMode, setTeacherMode] = useState<"login" | "register">("login");
  const [tUsername, setTUsername] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tName, setTName] = useState("");
  const [tConfirmPass, setTConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Student Scan / Register State
  const [scanStep, setScanStep] = useState<"camera" | "register">("camera");
  const [studentName, setStudentName] = useState("");
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);

  // Handle Teacher Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tUsername || !tPassword) return;
    setIsLoading(true);
    try {
      const res = await authApi.teacherLogin(tUsername, tPassword);
      toast({
        type: "success",
        title: "Welcome Back",
        description: `Logged in as ${res.teacher.name}`,
      });
      setTeacherSession(res.teacher);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Authentication Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Teacher Register
  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tUsername || !tName || !tPassword) return;
    if (tPassword !== tConfirmPass) {
      toast({
        type: "warning",
        title: "Validation Error",
        description: "Passwords do not match",
      });
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
      toast({
        type: "success",
        title: "Account Created",
        description: res.message,
      });
      setTeacherMode("login");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Registration Error",
        description: err.message,
      });
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
        toast({
          type: "success",
          title: "Face ID Recognized",
          description: `Welcome back, ${res.matched_student.name}!`,
        });
        setStudentSession(res.matched_student);
      } else {
        toast({
          type: "info",
          title: "New Student Detected",
          description: "Face not found in database. Complete registration below.",
        });
        setScanStep("register");
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Face Scan Failed",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Student Registration
  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !faceFile) {
      toast({
        type: "warning",
        title: "Validation Error",
        description: "Please enter your name",
      });
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.registerStudent(
        studentName.trim(),
        faceFile,
        voiceBlob || undefined
      );
      toast({
        type: "success",
        title: "Profile Created",
        description: `Welcome to SnapClass, ${res.student.name}!`,
      });
      setStudentSession(res.student);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Registration Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      data-slot="login"
      className="relative min-h-svh overflow-hidden bg-[#212121] text-white lg:grid lg:grid-cols-2 selection:bg-[#0D7377] selection:text-[#14FFEC]"
    >
      {/* LEFT SHOWCASE PANEL (Hirael Login-03 Aside) */}
      <aside
        data-slot="login-aside"
        className="relative hidden h-full flex-col overflow-hidden border-e border-[#0D7377]/30 bg-[#323232] p-10 lg:flex justify-between"
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgba(33, 33, 33, 0.4), #212121)",
          }}
        />

        {/* Dynamic Motion Floating Paths */}
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Brand Header */}
        <div className={cn(ENTER, "relative z-10 flex items-center gap-3")}>
          <BrandMark />
          <div>
            <span className="text-lg font-bold tracking-tight text-white font-mono">
              SnapClass
            </span>
            <span className="ml-2 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#0D7377] text-[#14FFEC] border border-[#14FFEC]/30">
              AI Attendance
            </span>
          </div>
        </div>

        {/* Testimonial / Architecture Hero Quote */}
        <figure
          style={stagger(4)}
          className={cn(ENTER, "relative z-10 mt-auto flex flex-col gap-4 max-w-lg")}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#212121]/80 border border-[#0D7377] text-[#14FFEC] text-xs font-bold w-fit shadow-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-[#14FFEC]" />
            <span>Dual-Modal Biometric Engine</span>
          </div>

          <blockquote className="font-serif text-2xl leading-[1.3] tracking-tight text-zinc-100 md:text-3xl">
            "Automated attendance with 68-point spatial facial landmarks and neural voiceprints.{" "}
            <span className="italic text-[#14FFEC]">Instant verification</span> without interrupting the lecture."
          </blockquote>
          
          <figcaption className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400 font-mono">
            <span>FastAPI + PyTorch Engine</span>
            <span aria-hidden className="text-[#0D7377]">
              |
            </span>
            <span>Real-time Supabase Core</span>
          </figcaption>
        </figure>
      </aside>

      {/* RIGHT AUTH PANEL (Hirael Login-03 Main) */}
      <div
        data-slot="login-main"
        className="relative flex min-h-svh flex-col justify-center px-6 sm:px-12 py-10 lg:min-h-0 bg-[#212121]"
      >
        {/* Ambient Radial Gradient Accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-40 overflow-hidden"
        >
          <div
            className="absolute end-0 top-0 h-[450px] w-[350px] -translate-y-40 rounded-full"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(20, 255, 236, 0.15) 0, rgba(13, 115, 119, 0.1) 60%, transparent 100%)",
            }}
          />
          <div
            className="absolute start-0 bottom-0 h-[350px] w-[350px] translate-y-32 rounded-full"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(13, 115, 119, 0.2) 0, transparent 80%)",
            }}
          />
        </div>

        {/* Portal Switcher */}
        <div className={cn(ENTER, "relative z-10 mx-auto w-full max-w-md flex justify-between items-center mb-6")}>
          <div className="flex items-center gap-2 lg:hidden">
            <BrandMark />
            <span className="text-base font-bold tracking-tight text-white">
              SnapClass
            </span>
          </div>

          <div className="flex items-center p-1 bg-[#323232] rounded-xl border border-[#0D7377]/60 shadow-lg ml-auto">
            <button
              type="button"
              onClick={() => {
                setActivePortal("teacher");
                setScanStep("camera");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activePortal === "teacher"
                  ? "bg-[#0D7377] text-[#14FFEC] shadow-sm border border-[#14FFEC]/40"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActivePortal("student");
                setScanStep("camera");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                activePortal === "student"
                  ? "bg-[#0D7377] text-[#14FFEC] shadow-sm border border-[#14FFEC]/40"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div
          data-slot="login-panel"
          className="relative z-10 mx-auto w-full space-y-6 max-w-md"
        >
          {/* TEACHER PORTAL */}
          {activePortal === "teacher" && (
            <>
              <div data-slot="login-header" className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h1
                    style={stagger(1)}
                    className={cn(
                      ENTER,
                      "font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl"
                    )}
                  >
                    {teacherMode === "login" ? "Sign in to class." : "Join as Faculty."}
                  </h1>
                </div>
                <p
                  style={stagger(2)}
                  className={cn(ENTER, "text-sm text-zinc-400")}
                >
                  {teacherMode === "login"
                    ? "Enter your credentials to launch attendance scans and review logs."
                    : "Create a faculty account to register subjects and track enrollment."}
                </p>

                {/* Sub-mode Tab Selector */}
                <div
                  style={stagger(2.5)}
                  className={cn(ENTER, "flex bg-[#323232] rounded-xl p-1 border border-[#0D7377]/40 mt-1")}
                >
                  <button
                    type="button"
                    onClick={() => setTeacherMode("login")}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                      teacherMode === "login"
                        ? "bg-[#0D7377] text-[#14FFEC] shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    Instructor Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherMode("register")}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                      teacherMode === "register"
                        ? "bg-[#0D7377] text-[#14FFEC] shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    New Registration
                  </button>
                </div>
              </div>

              {teacherMode === "login" ? (
                <form
                  onSubmit={handleTeacherLogin}
                  style={stagger(3)}
                  className={cn(ENTER, "space-y-4")}
                >
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
                      type={showPassword ? "text" : "password"}
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
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isLoading}
                    className="w-full gap-2 text-sm font-bold shadow-lg shadow-[#0D7377]/40 mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#14FFEC]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    {isLoading ? "Authenticating..." : "Sign In with Credentials"}
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={handleTeacherRegister}
                  style={stagger(3)}
                  className={cn(ENTER, "space-y-3.5")}
                >
                  <Input
                    label="Full Name"
                    placeholder="e.g. Dr. Ananya Roy"
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
                    size="lg"
                    disabled={isLoading}
                    className="w-full gap-2 text-sm font-bold shadow-lg shadow-[#0D7377]/40 mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#14FFEC]" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isLoading ? "Creating Account..." : "Complete Registration"}
                  </Button>
                </form>
              )}
            </>
          )}

          {/* STUDENT PORTAL */}
          {activePortal === "student" && (
            <>
              <div data-slot="login-header" className="flex flex-col gap-2">
                <h1
                  style={stagger(1)}
                  className={cn(
                    ENTER,
                    "font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl"
                  )}
                >
                  {scanStep === "camera" ? "Biometric Face ID." : "Join as Student."}
                </h1>
                <p
                  style={stagger(2)}
                  className={cn(ENTER, "text-sm text-zinc-400")}
                >
                  {scanStep === "camera"
                    ? "Look into your camera. 68-point landmark matching will authenticate your profile."
                    : "Your face embedding is ready. Enter your name to register your attendance pass."}
                </p>
              </div>

              <div style={stagger(3)} className={ENTER}>
                {scanStep === "camera" ? (
                  <div className="space-y-4">
                    <CameraModal onCapture={handleFaceCaptured} />
                    <div className="p-3 bg-[#323232] rounded-xl border border-[#0D7377]/60 text-center">
                      <p className="text-xs text-zinc-300">
                        First time student? The camera automatically extracts your 128D embedding and prompts for your name.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStudentRegisterSubmit} className="space-y-4">
                    <div className="p-3 bg-[#323232] rounded-xl border border-[#0D7377] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0D7377] text-[#14FFEC] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-white">Face Biometrics Processed</p>
                        <p className="text-zinc-400 text-[11px]">128D spatial facial vector ready</p>
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
                        Optional: Voice Biometric Sample
                      </label>
                      <AudioRecorder
                        onAudioRecorded={(blob) => setVoiceBlob(blob)}
                        label="Record short audio (e.g. 'I am present') for voice scans"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setScanStep("camera")}
                        className="w-1/3"
                      >
                        Retake Face
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isLoading}
                        className="w-2/3 shadow-lg shadow-[#0D7377]/40 font-bold"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        {isLoading ? "Saving..." : "Create Student Pass"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}

          {/* Footer Notice */}
          <p
            style={stagger(4)}
            className={cn(ENTER, "text-xs text-zinc-400 pt-2 text-center sm:text-left")}
          >
            Protected by enterprise encryption. By signing in, you agree to the{" "}
            <a
              href="#"
              className="text-[#14FFEC] underline-offset-4 hover:underline font-medium"
            >
              terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-[#14FFEC] underline-offset-4 hover:underline font-medium"
            >
              biometric privacy policy
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
