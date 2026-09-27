"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isDemoUser: false,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithOAuth: async () => {},
  resetPassword: async () => {},
  signInAsDemo: () => {},
  signOut: async () => {},
});

const DEMO_USER_KEY = "openscan_demo_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error) console.warn("Supabase session fetch error:", error.message);
          
          if (mounted && currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            setIsDemoUser(false);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Auth initialization error:", err);
        }
      }

      // Check local demo user fallback
      try {
        const storedDemo = localStorage.getItem(DEMO_USER_KEY);
        if (storedDemo && mounted) {
          const parsed = JSON.parse(storedDemo);
          setUser(parsed);
          setIsDemoUser(true);
        }
      } catch (e) {
        console.warn("Error reading local demo session:", e);
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    // Listen to Supabase auth state changes
    let authListener = null;
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          if (newSession?.user) {
            setUser(newSession.user);
            setIsDemoUser(false);
            localStorage.removeItem(DEMO_USER_KEY);
          } else {
            // Check if demo user still exists
            const storedDemo = localStorage.getItem(DEMO_USER_KEY);
            if (storedDemo) {
              setUser(JSON.parse(storedDemo));
              setIsDemoUser(true);
            } else {
              setUser(null);
              setIsDemoUser(false);
            }
          }
          setLoading(false);
        }
      );
      authListener = subscription;
    }

    return () => {
      mounted = false;
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please use Demo Mode or configure credentials.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email, password, fullName = "", role = "Clinical Researcher") => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please use Demo Mode or configure credentials.");
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signInWithOAuth = async (provider) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please use Demo Mode or configure credentials.");
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      },
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please configure credentials to send reset emails.");
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    if (error) throw error;
    return data;
  };

  const signInAsDemo = (customName = "Dr. Morgan Vance (Investigator)") => {
    const demoUserObj = {
      id: "demo-user-777",
      email: "dr.vance@openscan-research.ai",
      user_metadata: {
        full_name: customName,
        role: "Lead Medical Imaging Fellow",
        institution: "Stanford-Affiliated Biomarkers Lab",
      },
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUserObj));
    setUser(demoUserObj);
    setIsDemoUser(true);
    return demoUserObj;
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    setIsDemoUser(false);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("SignOut warning:", err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isDemoUser,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        resetPassword,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
