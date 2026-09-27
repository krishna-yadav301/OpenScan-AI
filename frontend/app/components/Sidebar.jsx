"use client";

import React from "react";
import Link from "next/link";
import {
  Plus,
  History,
  Trash2,
  Image as ImageIcon,
  Activity,
  Server,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  LogOut,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  task,
  onTaskChange,
  backendOnline,
  isOpen,
  onToggleOpen,
}) {
  const { user, signOut, isDemoUser } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Researcher";

  if (!isOpen) {
    return (
      <div className="hidden sm:flex flex-col items-center justify-between border-r border-[#423630]/60 bg-[#100c0a] p-2.5 w-14 shrink-0 h-full">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onToggleOpen}
            className="p-2 rounded-xl text-[#b0b7c1] hover:text-[#f2eef2] hover:bg-[#241c17] transition-colors"
            title="Open Sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNewSession}
            className="p-2 rounded-xl bg-[#967e71] text-[#f2eef2] hover:bg-[#a89083] transition-colors shadow-sm"
            title="New Scan"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          {user ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#241c17] text-[11px] font-bold text-[#967e71] border border-[#423630]"
              title={displayName}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Link
              href="/login"
              className="p-1.5 rounded-lg text-[#b0b7c1] hover:text-[#f2eef2] hover:bg-[#241c17]"
              title="Sign In"
            >
              <LogIn className="h-4 w-4" />
            </Link>
          )}
          <div className="h-2 w-2 rounded-full bg-emerald-400" title="API Online" />
        </div>
      </div>
    );
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-[#423630]/80 bg-[#100c0a] p-3 text-[#f2eef2] shrink-0 transition-all duration-300">
      {/* Brand Header & Collapse */}
      <div className="flex items-center justify-between pb-3 border-b border-[#423630]/60 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#423630] to-[#967e71] border border-[#967e71]/40 shadow-sm">
            <Activity className="h-4 w-4 text-[#f2eef2]" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#f2eef2]">
              OpenScan <span className="text-[#967e71]">AI</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleOpen}
          className="rounded-lg p-1.5 text-[#b0b7c1] hover:bg-[#241c17] hover:text-[#f2eef2] transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* New Analysis Button */}
      <div className="mt-3">
        <button
          type="button"
          onClick={onNewSession}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] px-3 py-2.5 text-xs font-semibold text-[#f2eef2] border border-[#967e71]/40 shadow-md hover:from-[#a89083] hover:to-[#52443d] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Scan Analysis
        </button>
      </div>

      {/* Task Switcher */}
      <div className="mt-3 rounded-xl bg-[#1a1512] p-1 border border-[#423630]">
        <div className="grid grid-cols-2 gap-1 text-center">
          <button
            type="button"
            onClick={() => onTaskChange("thoracic")}
            className={`rounded-lg py-1 text-[11px] font-medium transition-all ${
              task === "thoracic"
                ? "bg-[#967e71] text-[#f2eef2] font-semibold shadow-sm"
                : "text-[#b0b7c1] hover:text-[#f2eef2]"
            }`}
          >
            Thoracic (14+)
          </button>
          <button
            type="button"
            onClick={() => onTaskChange("tuberculosis")}
            className={`rounded-lg py-1 text-[11px] font-medium transition-all ${
              task === "tuberculosis"
                ? "bg-[#967e71] text-[#f2eef2] font-semibold shadow-sm"
                : "text-[#b0b7c1] hover:text-[#f2eef2]"
            }`}
          >
            Tuberculosis
          </button>
        </div>
      </div>

      {/* History Header */}
      <div className="mt-4 flex items-center justify-between px-1 text-[10px] font-semibold text-[#b0b7c1] uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <History className="h-3 w-3 text-[#967e71]" />
          Scan History ({sessions.length})
        </span>
      </div>

      {/* Session List */}
      <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-[#b0b7c1]">
            <ImageIcon className="h-6 w-6 text-[#423630] mb-1.5" />
            <span>No previous scans</span>
            <span className="text-[10px] text-[#b0b7c1]/70 mt-0.5">Uploaded scans appear here</span>
          </div>
        ) : (
          sessions.map((session) => {
            const isSelected = session.id === currentSessionId;
            const topCond = session.detected_conditions?.[0]?.condition;
            const dateStr = session.created_at
              ? new Date(session.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "Recent";

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`group relative flex items-center justify-between rounded-xl p-2 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#241c17] text-[#f2eef2] border border-[#967e71]/70"
                    : "border border-transparent bg-[#1a1512]/60 text-[#e0dddc] hover:bg-[#241c17] hover:text-[#f2eef2]"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {session.image_url ? (
                    <img
                      src={session.image_url}
                      alt="Thumbnail"
                      className="h-7 w-7 rounded-lg object-cover border border-[#423630] shrink-0"
                    />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#241c17] text-[#967e71] border border-[#423630]">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="truncate font-medium text-[11px]">
                      {topCond ? topCond.replace(/_/g, " ").toUpperCase() : session.title || "Chest X-Ray"}
                    </span>
                    <span className="text-[10px] text-[#b0b7c1]/70">
                      {session.task || "thoracic"} • {dateStr}
                    </span>
                  </div>
                </div>

                {onDeleteSession && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-[#b0b7c1] hover:text-red-400 hover:bg-red-950/40 transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* User Section / Auth Status */}
      <div className="border-t border-[#423630]/60 pt-2.5 mt-2">
        {user ? (
          <div className="flex items-center justify-between rounded-xl bg-[#1a1512] p-2 border border-[#423630]">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#967e71] to-[#423630] text-xs font-bold text-[#f2eef2]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-[11px] font-semibold text-[#f2eef2]">{displayName}</span>
                <span className="text-[9px] text-[#967e71]">{isDemoUser ? "Demo Access" : "Investigator"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg p-1.5 text-[#b0b7c1] hover:text-red-400 hover:bg-red-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#241c17] hover:bg-[#2d231d] border border-[#423630] py-2 text-xs font-semibold text-[#f2eef2] transition-colors"
          >
            <LogIn className="h-3.5 w-3.5 text-[#967e71]" />
            <span>Sign In / Register</span>
          </Link>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-[#423630]/60 pt-2.5 mt-2 text-[11px] text-[#b0b7c1] flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-[#f2eef2]">DenseNet-121</span>
          </div>
          <span className="text-[10px] text-[#967e71] font-semibold">Groq Llama-3.3</span>
        </div>
      </div>
    </aside>
  );
}
