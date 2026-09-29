"use client";

import * as React from "react";
import { useState } from "react";
import {
  Loader2,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ScanFace,
  ChevronLeft,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/authApi";
import { useToast } from "../components/ui/Toast";
import { CameraModal } from "../components/widgets/CameraModal";

const ENTER =
  "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] fill-mode-both motion-reduce:animate-none";

const stagger = (index: number, step = 60): React.CSSProperties => ({
  animationDelay: `${index * step}ms`,
});

const BrandMark = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-6 text-white", className)}
    >
      <path d="M2.3 12h2.4v10.95h6.2V14.6h4.6v8.35h6.2V12h-2.4V1.05h-6.2V9.4H8.5V1.05H2.3Z" />
    </svg>
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
        className="h-full w-full text-white"
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
            className="opacity-60"
            strokeOpacity={0.08 + path.id * 0.025}
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
  const [pendingJoinCode, setPendingJoinCode] = useState<string>("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code =
      params.get("join-code") ||
      params.get("join_code") ||
      params.get("joinCode") ||
      params.get("code") ||
      localStorage.getItem("snapclass_pending_join_code");
    if (code) {
      const clean = code.trim().toUpperCase();
      setPendingJoinCode(clean);
      localStorage.setItem("snapclass_pending_join_code", clean);
      setActivePortal("student");
    }
  }, []);

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
        faceFile
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
      className="relative min-h-svh overflow-hidden bg-[#09090b] text-[#fafafa] lg:grid lg:grid-cols-2"
    >
      {/* LEFT ASIDE (Hirael Login-03 Aside) */}
      <aside
        data-slot="login-aside"
        className="relative hidden h-full flex-col overflow-hidden border-e border-[#27272a] bg-[#0c0c0e] p-10 lg:flex justify-between"
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent, transparent, #09090b)",
          }}
        />

        {/* Dynamic Motion Floating Paths */}
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Brand Header */}
        <div className={cn(ENTER, "relative z-10 flex items-center gap-2.5")}>
          <BrandMark className="size-6 text-white" />
          <span className="text-base font-semibold tracking-[-0.025em] text-white">
            SnapClass
          </span>
        </div>

        {/* Quote Section */}
        <figure
          style={stagger(4)}
          className={cn(ENTER, "relative z-10 mt-auto flex flex-col gap-3 max-w-lg")}
        >
          <blockquote className="font-serif text-2xl leading-[1.25] tracking-tight text-[#fafafa] md:text-3xl">
            "Automated classroom attendance with spatial facial landmarks and biometric verification.{" "}
            <span className="italic text-white">Never manual roll calls again</span>."
          </blockquote>
          <figcaption className="flex items-center gap-2 text-xs uppercase text-[#a1a1aa] font-mono">
            <span>AI Platform</span>
            <span aria-hidden className="text-[#3f3f46]">
              |
            </span>
            <span>Enterprise Core</span>
          </figcaption>
        </figure>
      </aside>

      {/* RIGHT MAIN (Hirael Login-03 Main) */}
      <div
        data-slot="login-main"
        className="relative flex min-h-svh flex-col justify-center px-8 py-10 lg:min-h-0 bg-[#09090b]"
      >
        {/* Hirael Template Subtle Radial Glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-60 overflow-hidden"
        >
          <div
            className="absolute end-0 top-0 h-[320px] w-[140px] -translate-y-[88px] rounded-full"
            style={{
              background:
                "radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgba(255, 255, 255, 0.06) 0, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.01) 80%)",
            }}
          />
          <div
            className="absolute end-0 top-0 h-[320px] w-[60px] translate-x-[5%] -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255, 255, 255, 0.04) 0, rgba(255, 255, 255, 0.01) 80%, transparent 100%)",
            }}
          />
        </div>

        {/* Portal Switcher & Top Mobile Brand */}
        <div className={cn(ENTER, "relative z-10 mx-auto w-full max-w-sm flex items-center justify-between mb-4")}>
          <div className="flex items-center gap-2 lg:hidden">
            <BrandMark className="size-6 text-white" />
            <span className="text-base font-semibold tracking-[-0.025em] text-white">
              SnapClass
            </span>
          </div>

          <div className="flex items-center p-1 bg-[#18181b] rounded-xl border border-[#27272a] shadow-xs ml-auto">
            <button
              type="button"
              onClick={() => {
                setActivePortal("teacher");
                setScanStep("camera");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                activePortal === "teacher"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-[#a1a1aa] hover:text-white"
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
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                activePortal === "student"
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-[#a1a1aa] hover:text-white"
              )}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
          </div>
        </div>

        {/* Login Panel Content */}
        <div
          data-slot="login-panel"
          className="relative z-10 mx-auto w-full space-y-6 max-w-sm"
        >
          {/* TEACHER PORTAL */}
          {activePortal === "teacher" && (
            <>
              <div data-slot="login-header" className="flex flex-col gap-2">
                <h1
                  style={stagger(1)}
                  className={cn(
                    ENTER,
                    "font-serif text-4xl font-medium tracking-tight text-white sm:text-5xl"
                  )}
                >
                  {teacherMode === "login" ? "Sign in or join." : "Create account."}
                </h1>
                <p
                  style={stagger(2)}
                  className={cn(ENTER, "text-sm text-[#a1a1aa]")}
                >
                  {teacherMode === "login"
                    ? "Enter your credentials to access class management."
                    : "Register to manage subjects and take attendance."}
                </p>

                {/* Sub-mode Tab Switcher */}
                <div
                  style={stagger(2.5)}
                  className={cn(ENTER, "flex bg-[#18181b] rounded-xl p-1 border border-[#27272a] mt-1")}
                >
                  <button
                    type="button"
                    onClick={() => setTeacherMode("login")}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                      teacherMode === "login"
                        ? "bg-[#27272a] text-white font-semibold shadow-xs"
                        : "text-[#a1a1aa] hover:text-white"
                    )}
                  >
                    Instructor Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeacherMode("register")}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                      teacherMode === "register"
                        ? "bg-[#27272a] text-white font-semibold shadow-xs"
                        : "text-[#a1a1aa] hover:text-white"
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
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                      Username
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 text-[#71717a] pointer-events-none w-4 h-4" />
                      <input
                        type="text"
                        placeholder="e.g. ananyaroy"
                        value={tUsername}
                        onChange={(e) => setTUsername(e.target.value)}
                        className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 pl-10 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 text-[#71717a] pointer-events-none w-4 h-4" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={tPassword}
                        onChange={(e) => setTPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-[#71717a] hover:text-white transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-[#e4e4e7] active:bg-[#d4d4d8] transition cursor-pointer disabled:opacity-50 mt-2 shadow-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    {isLoading ? "Signing in..." : "Continue"}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleTeacherRegister}
                  style={stagger(3)}
                  className={cn(ENTER, "space-y-3.5")}
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Ananya Roy"
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ananyaroy"
                      value={tUsername}
                      onChange={(e) => setTUsername(e.target.value)}
                      className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={tPassword}
                        onChange={(e) => setTPassword(e.target.value)}
                        className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                        Confirm
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={tConfirmPass}
                        onChange={(e) => setTConfirmPass(e.target.value)}
                        className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-[#e4e4e7] active:bg-[#d4d4d8] transition cursor-pointer disabled:opacity-50 mt-2 shadow-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {isLoading ? "Creating..." : "Create Account"}
                  </button>
                </form>
              )}
            </>
          )}

          {/* STUDENT PORTAL */}
          {activePortal === "student" && (
            <>
              {pendingJoinCode && (
                <div
                  style={stagger(0)}
                  className={cn(
                    ENTER,
                    "p-3.5 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center gap-3 text-xs"
                  )}
                >
                  <div className="px-2.5 py-1 bg-white text-black font-mono font-bold rounded-lg text-xs tracking-wider shrink-0 shadow-xs">
                    {pendingJoinCode}
                  </div>
                  <div className="flex-1 text-[#a1a1aa] leading-snug">
                    <span className="text-white font-medium block">Class Invitation</span>
                    {scanStep === "camera"
                      ? "Scan your face to log in and automatically join this class."
                      : "Complete registration to join this class automatically."}
                  </div>
                </div>
              )}

              <div data-slot="login-header" className="flex flex-col gap-2">
                <h1
                  style={stagger(1)}
                  className={cn(
                    ENTER,
                    "font-serif text-4xl font-medium tracking-tight text-white sm:text-5xl"
                  )}
                >
                  {scanStep === "camera" ? "Face ID scan." : "Student join."}
                </h1>
                <p
                  style={stagger(2)}
                  className={cn(ENTER, "text-sm text-[#a1a1aa]")}
                >
                  {scanStep === "camera"
                    ? "Position your face in front of the camera for instant identification."
                    : "Enter your name to register your biometric attendance pass."}
                </p>
              </div>

              <div style={stagger(3)} className={ENTER}>
                {scanStep === "camera" ? (
                  <div className="space-y-4">
                    <CameraModal onCapture={handleFaceCaptured} />
                    <div className="p-3 bg-[#18181b] rounded-xl border border-[#27272a] text-center">
                      <p className="text-xs text-[#a1a1aa]">
                        Automatic face detector matches your 128D embedding in real-time.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleStudentRegisterSubmit} className="space-y-4">
                    <div className="p-3 bg-[#18181b] rounded-xl border border-[#27272a] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-white">Face Biometrics Processed</p>
                        <p className="text-[#a1a1aa] text-[11px]">Embedding vector ready</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[#a1a1aa] uppercase tracking-wider">
                        Full Student Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Akash Kumar"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full rounded-xl border border-[#27272a] bg-[#18181b] px-3.5 py-2.5 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white transition"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setScanStep("camera")}
                        className="w-1/3 py-2.5 px-3 rounded-xl bg-[#18181b] border border-[#27272a] text-white text-xs font-semibold hover:bg-[#27272a] transition cursor-pointer"
                      >
                        Retake
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-2/3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-[#e4e4e7] active:bg-[#d4d4d8] transition cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        {isLoading ? "Saving..." : "Create Student Pass"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}

          {/* Hirael Template Footer Notice */}
          <p
            style={stagger(4)}
            className={cn(ENTER, "text-xs text-[#a1a1aa]")}
          >
            By continuing, you agree to the{" "}
            <a
              href="#"
              className="text-white underline-offset-4 hover:underline"
            >
              terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-white underline-offset-4 hover:underline"
            >
              privacy policy
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
