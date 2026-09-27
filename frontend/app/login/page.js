"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Fingerprint,
  Database,
  ChevronLeft,
  User,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInAsDemo,
    loading: authLoading,
  } = useAuth();

  // Mode: "signin" | "signup" | "forgot"
  const [mode, setMode] = useState("signin");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please provide your registered email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await signInWithEmail(email, password);
        setSuccessMsg("Authentication verified! Loading workspace...");
        setTimeout(() => router.push("/"), 700);
      } else {
        signInAsDemo(fullName || email.split("@")[0]);
        setSuccessMsg("Signed in with Local Research Session!");
        setTimeout(() => router.push("/"), 700);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter an email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const data = await signUpWithEmail(email, password, fullName, "Clinical Researcher");
        if (data?.user && !data?.session) {
          setSuccessMsg("Verification link sent! Please check your email inbox to activate your account.");
        } else {
          setSuccessMsg("Account created successfully! Loading workspace...");
          setTimeout(() => router.push("/"), 900);
        }
      } else {
        signInAsDemo(fullName || "Researcher");
        setSuccessMsg("Account initialized locally! Redirecting...");
        setTimeout(() => router.push("/"), 700);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Please specify your registered account email.");
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await resetPassword(email);
        setSuccessMsg("Password recovery link has been sent to your email.");
      } else {
        setSuccessMsg("Password reset dispatched to " + email);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setLoading(true);
    setErrorMsg("");
    try {
      signInAsDemo("Dr. Morgan Vance (Lead Fellow)");
      setSuccessMsg("Instant Demo Access granted! Loading workspace...");
      setTimeout(() => router.push("/"), 500);
    } catch (err) {
      setErrorMsg("Failed to start demo session: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#100c0a] text-[#f2eef2] flex flex-col justify-between overflow-x-hidden selection:bg-[#967e71] selection:text-[#f2eef2]">
      {/* Dynamic Background Glows & Mesh Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#967e71]/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[15%] h-[600px] w-[600px] rounded-full bg-[#423630]/30 blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #f2eef2 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-[#423630]/60 bg-[#100c0a]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2 text-xs text-[#b0b7c1] hover:text-[#f2eef2] transition-colors"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-[#967e71]" />
            <span>Return to Workspace</span>
          </Link>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#423630] to-[#967e71] shadow-md border border-[#967e71]/40">
              <Activity className="h-5 w-5 text-[#f2eef2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-[#f2eef2]">
                OpenScan <span className="text-[#967e71]">AI</span>
              </span>
              <span className="rounded-full bg-[#241c17] px-2 py-0.5 text-[10px] font-semibold text-[#b0b7c1] border border-[#423630]">
                v2.4
              </span>
            </div>
          </Link>

          {/* Compliance Pill */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#1a1512] px-3 py-1 text-[11px] text-[#b0b7c1] border border-[#423630]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#967e71]" />
            <span>Research & Educational Sandbox</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12">
          
          {/* Left Research Overview (5 cols) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#241c17] px-3 py-1 text-xs font-semibold text-[#967e71] border border-[#967e71]/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Medical Imaging Intelligence</span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#f2eef2] sm:text-4xl leading-tight">
                Explainable Chest Radiography at Your Fingertips.
              </h1>
              <p className="mt-3 text-sm text-[#b0b7c1] leading-relaxed">
                Authenticate your research session, store scan history across devices, and collaborate with conversational AI backed by DenseNet-121 Grad-CAM heatmaps.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 rounded-2xl bg-[#1a1512]/80 p-3.5 border border-[#423630]/60 backdrop-blur-sm">
                <div className="rounded-xl bg-[#241c17] p-2 text-[#967e71] border border-[#423630]">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#f2eef2]">Dual Deep Learning Models</h4>
                  <p className="text-[11px] text-[#b0b7c1] mt-0.5">
                    TorchXRayVision 14-pathology multi-label & binary Tuberculosis classification.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#1a1512]/80 p-3.5 border border-[#423630]/60 backdrop-blur-sm">
                <div className="rounded-xl bg-[#241c17] p-2 text-[#967e71] border border-[#423630]">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#f2eef2]">Captum Layer Grad-CAM</h4>
                  <p className="text-[11px] text-[#b0b7c1] mt-0.5">
                    Transparent layer attribution maps highlighting anatomical regions of interest.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-[#1a1512]/80 p-3.5 border border-[#423630]/60 backdrop-blur-sm">
                <div className="rounded-xl bg-[#241c17] p-2 text-[#967e71] border border-[#423630]">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#f2eef2]">Cloud Sync & History Storage</h4>
                  <p className="text-[11px] text-[#b0b7c1] mt-0.5">
                    Encrypted session persistence with seamless local storage fallback.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs text-[#b0b7c1]/80 pt-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Retention Mode</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Open Source Baseline</span>
              </div>
            </div>
          </div>

          {/* Right Login / Register Card (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-[#1a1512]/95 p-6 sm:p-8 border border-[#423630] shadow-2xl backdrop-blur-xl relative overflow-hidden">
              
              {/* Top Subtle Ambient Glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#967e71]/20 rounded-full blur-2xl pointer-events-none" />

              {/* Mode Toggle Tabs (Sign In / Create Account) */}
              <div className="relative mb-6 grid grid-cols-2 rounded-2xl bg-[#100c0a] p-1 border border-[#423630]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    mode === "signin"
                      ? "bg-[#967e71] text-[#f2eef2] shadow-md font-bold"
                      : "text-[#b0b7c1] hover:text-[#f2eef2]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    mode === "signup"
                      ? "bg-[#967e71] text-[#f2eef2] shadow-md font-bold"
                      : "text-[#b0b7c1] hover:text-[#f2eef2]"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Instant One-Click Demo Mode Banner */}
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#241c17] to-[#1a1512] p-3.5 border border-[#967e71]/40 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#967e71]/20 text-[#967e71] shrink-0 border border-[#967e71]/30">
                      <Sparkles className="h-4 w-4 text-[#e0dddc]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#f2eef2]">Instant Researcher Demo</h4>
                      <p className="text-[10px] text-[#b0b7c1]">Explore without signing up</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] px-3.5 py-1.5 text-xs font-bold text-[#f2eef2] border border-[#967e71]/60 hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    <span>Instant Enter</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Feedback Alerts */}
              {errorMsg && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-red-950/40 p-3 text-xs text-red-300 border border-red-800/60 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-emerald-950/40 p-3 text-xs text-emerald-300 border border-emerald-800/60 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Sign In Form */}
              {mode === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#b0b7c1]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#967e71]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="researcher@institution.edu"
                        className="w-full rounded-xl border border-[#423630] bg-[#100c0a] py-2.5 pl-10 pr-4 text-xs text-[#f2eef2] placeholder-[#967e71]/60 focus:border-[#967e71] focus:outline-none focus:ring-1 focus:ring-[#967e71] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-medium text-[#b0b7c1]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-[11px] font-medium text-[#967e71] hover:text-[#e0dddc] hover:underline transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#967e71]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-[#423630] bg-[#100c0a] py-2.5 pl-10 pr-10 text-xs text-[#f2eef2] placeholder-[#967e71]/60 focus:border-[#967e71] focus:outline-none focus:ring-1 focus:ring-[#967e71] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0b7c1] hover:text-[#f2eef2] p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-[#b0b7c1] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[#423630] bg-[#100c0a] text-[#967e71] accent-[#967e71] focus:ring-0 cursor-pointer"
                      />
                      <span>Stay signed in for 30 days</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] py-3 text-xs font-bold text-[#f2eef2] border border-[#967e71]/50 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f2eef2] border-t-transparent" />
                    ) : (
                      <>
                        <span>Sign In to OpenScan</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Create Account Form */}
              {mode === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#b0b7c1]">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#967e71]" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Alex Rivera"
                        className="w-full rounded-xl border border-[#423630] bg-[#100c0a] py-2.5 pl-10 pr-4 text-xs text-[#f2eef2] placeholder-[#967e71]/60 focus:border-[#967e71] focus:outline-none focus:ring-1 focus:ring-[#967e71] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#b0b7c1]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#967e71]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex.rivera@hospital.org"
                        className="w-full rounded-xl border border-[#423630] bg-[#100c0a] py-2.5 pl-10 pr-4 text-xs text-[#f2eef2] placeholder-[#967e71]/60 focus:border-[#967e71] focus:outline-none focus:ring-1 focus:ring-[#967e71] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#b0b7c1]">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#967e71]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 6 chars"
                          className="w-full rounded-xl border border-[#423630] bg-[#100c0a] py-2.5 pl-8 pr-3 text-xs text-[#f2eef2] placeholder-[#967e71]/60 focus:border-[#967e71] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[#b0b7c1]">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#967e71]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter"
                          className="w-full rounded-xl border border-[#423630] bg-[#100c0a] py-2.5 pl-8 pr-3 text-xs text-[#f2eef2] placeholder-[#967e71]/60 focus:border-[#967e71] focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#b0b7c1]/70 leading-normal pt-1">
                    OpenScan AI is built strictly for research and educational purposes. Not for diagnostic triage.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] py-3 text-xs font-bold text-[#f2eef2] border border-[#967e71]/50 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f2eef2] border-t-transparent" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Forgot Password Form */}
              {mode === "forgot" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-center pb-1">
                    <h3 className="text-sm font-bold text-[#f2eef2]">Reset Password</h3>
                    <p className="text-xs text-[#b0b7c1] mt-1">
                      Enter your account email to receive a secure password recovery link.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#b0b7c1]">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#967e71]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="researcher@institution.edu"
                        className="w-full rounded-xl border border-[#423630] bg-[#100c0a] py-2.5 pl-10 pr-4 text-xs text-[#f2eef2] placeholder-[#967e71]/60 focus:border-[#967e71] focus:outline-none focus:ring-1 focus:ring-[#967e71] transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] py-2.5 text-xs font-bold text-[#f2eef2] border border-[#967e71]/50 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f2eef2] border-t-transparent" />
                    ) : (
                      <span>Send Recovery Instructions</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="text-xs font-medium text-[#967e71] hover:underline cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* Disclaimer */}
              <div className="mt-6 border-t border-[#423630]/60 pt-4 text-center">
                <p className="text-[10px] text-[#b0b7c1]/60">
                  OpenScan AI is a research diagnostic framework protected by end-to-end sandbox policies.
                </p>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#423630]/60 bg-[#100c0a]/80 py-4 text-center text-xs text-[#b0b7c1]/70">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6">
          <span>&copy; {new Date().getFullYear()} OpenScan AI — Explainable 2D Chest Radiography System</span>
          <div className="flex gap-4 mt-2 sm:mt-0 text-[11px]">
            <Link href="/" className="hover:text-[#f2eef2] transition-colors">Documentation</Link>
            <Link href="/" className="hover:text-[#f2eef2] transition-colors">Privacy Notice</Link>
            <Link href="/" className="hover:text-[#f2eef2] transition-colors">Model Checkpoints</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
