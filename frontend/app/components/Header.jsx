"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Server,
  Database,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export default function Header({ backendOnline, task, onTaskChange, onScrollToWorkspace }) {
  const { user, signOut, isDemoUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Researcher";

  const userRole = user?.user_metadata?.role || (isDemoUser ? "Demo Guest" : "Verified Investigator");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#423630]/60 bg-[#100c0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#423630] to-[#967e71] shadow-md border border-[#967e71]/40">
            <Activity className="h-5 w-5 text-[#f2eef2]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-[#f2eef2]">
              OpenScan <span className="text-[#967e71]">AI</span>
            </span>
            <span className="hidden sm:inline-block rounded-full bg-[#241c17] px-2 py-0.5 text-[10px] font-semibold text-[#b0b7c1] border border-[#423630]">
              v2.4
            </span>
          </div>
        </Link>

        {/* Task Model Switcher & Status */}
        <div className="flex items-center gap-3">
          {/* Switcher */}
          <div className="flex items-center rounded-xl bg-[#1a1512] p-1 border border-[#423630]">
            <button
              type="button"
              onClick={() => onTaskChange("thoracic")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                task === "thoracic"
                  ? "bg-[#967e71] text-[#f2eef2] shadow-sm font-semibold"
                  : "text-[#b0b7c1] hover:text-[#f2eef2]"
              }`}
            >
              Thoracic (14+)
            </button>
            <button
              type="button"
              onClick={() => onTaskChange("tuberculosis")}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                task === "tuberculosis"
                  ? "bg-[#967e71] text-[#f2eef2] shadow-sm font-semibold"
                  : "text-[#b0b7c1] hover:text-[#f2eef2]"
              }`}
            >
              Tuberculosis
            </button>
          </div>

          {/* Quick Nav to Workspace */}
          {onScrollToWorkspace && (
            <button
              type="button"
              onClick={onScrollToWorkspace}
              className="hidden lg:flex items-center gap-1.5 rounded-xl bg-[#241c17] border border-[#423630] px-3 py-1.5 text-xs font-medium text-[#e0dddc] hover:border-[#967e71]/60 hover:text-[#f2eef2] transition-colors"
            >
              <span>Workspace</span>
            </button>
          )}

          {/* Connection Pills */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#423630]">
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                backendOnline
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                  : "bg-amber-950/40 text-amber-300 border-amber-800/50"
              }`}
              title={backendOnline ? "FastAPI server running at localhost:8000" : "FastAPI server offline"}
            >
              <Server className="h-3 w-3" />
              <span>{backendOnline ? "API Online" : "API Local"}</span>
            </div>

            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                isSupabaseConfigured
                  ? "bg-[#241c17] text-[#967e71] border-[#423630]"
                  : "bg-[#1a1512] text-[#b0b7c1] border-[#423630]"
              }`}
            >
              <Database className="h-3 w-3" />
              <span>{isSupabaseConfigured ? "Supabase Cloud" : "Local Store"}</span>
            </div>
          </div>

          {/* User Auth Section */}
          <div className="relative pl-2 border-l border-[#423630]" ref={dropdownRef}>
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-xl bg-[#1a1512] hover:bg-[#241c17] border border-[#423630] p-1.5 pr-2.5 text-xs text-[#f2eef2] transition-all cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#967e71] to-[#423630] font-bold text-[#f2eef2] text-xs shadow-inner">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="truncate max-w-[110px] text-xs font-semibold leading-tight text-[#f2eef2]">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-[#967e71] leading-tight">
                      {isDemoUser ? "Demo Access" : "Investigator"}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#b0b7c1]" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1a1512] p-2 text-xs shadow-2xl border border-[#423630] z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="border-b border-[#423630] px-3 py-2.5">
                      <p className="font-semibold text-[#f2eef2] truncate">{displayName}</p>
                      <p className="text-[11px] text-[#b0b7c1] truncate">{user.email || "demo@openscan.ai"}</p>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#241c17] px-2 py-0.5 text-[10px] text-[#967e71] border border-[#423630]">
                        <ShieldCheck className="h-3 w-3" />
                        <span>{userRole}</span>
                      </div>
                    </div>

                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] px-3.5 py-1.5 text-xs font-semibold text-[#f2eef2] border border-[#967e71]/50 shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
