import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-supabase")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to generate RFC4122 compliant UUID for Supabase compatibility
export function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to save or update a session
export async function saveChatSession({
  id,
  title,
  imageUrl = "",
  heatmapUrl = null,
  organ = "lung",
  modality = "xray",
  task = "thoracic",
  detectedConditions = [],
  confidenceScores = {},
}) {
  const sessionId = id && id.length === 36 ? id : generateUUID();
  const sessionTitle = title || "Chest Radiography Session";

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .upsert({
          id: sessionId,
          title: sessionTitle,
          image_url: imageUrl || "",
          heatmap_url: heatmapUrl,
          organ,
          modality,
          task,
          detected_conditions: detectedConditions,
          confidence_scores: confidenceScores,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase session save failed, using local storage fallback:", err.message);
    }
  }

  // Local storage fallback for seamless offline/demo mode
  try {
    const existing = JSON.parse(localStorage.getItem("openscan_sessions") || "[]");
    const sessionObj = {
      id: sessionId,
      title: sessionTitle,
      image_url: imageUrl,
      heatmap_url: heatmapUrl,
      organ,
      modality,
      task,
      detected_conditions: detectedConditions,
      confidence_scores: confidenceScores,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    const filtered = existing.filter((s) => s.id !== sessionObj.id);
    localStorage.setItem("openscan_sessions", JSON.stringify([sessionObj, ...filtered]));
    return sessionObj;
  } catch {
    return null;
  }
}

// Helper to save a chat message
export async function saveChatMessage({ sessionId, sender, content, metadata = {} }) {
  if (!sessionId || !content) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          sender,
          content,
          metadata,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn("Supabase message save failed:", err.message);
    }
  }

  // Local fallback
  try {
    const key = `openscan_messages_${sessionId}`;
    const msgs = JSON.parse(localStorage.getItem(key) || "[]");
    const msgObj = {
      id: generateUUID(),
      session_id: sessionId,
      sender,
      content,
      metadata,
      created_at: new Date().toISOString(),
    };
    msgs.push(msgObj);
    localStorage.setItem(key, JSON.stringify(msgs));
    return msgObj;
  } catch {
    return null;
  }
}

// Helper to fetch chat messages
export async function getChatMessages(sessionId) {
  if (!sessionId) return [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase message fetch failed, checking local:", err.message);
    }
  }

  try {
    const key = `openscan_messages_${sessionId}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

// Helper to fetch all sessions
export async function getChatSessions() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase sessions fetch failed, checking local:", err.message);
    }
  }

  try {
    return JSON.parse(localStorage.getItem("openscan_sessions") || "[]");
  } catch {
    return [];
  }
}

// Helper to permanently delete a session from Supabase server & local cache
export async function deleteChatSession(sessionId) {
  if (!sessionId) return false;

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Delete associated messages
      await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

      // 2. Delete the session itself
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
    } catch (err) {
      console.warn("Supabase deleteChatSession failed:", err.message);
    }
  }

  // Remove from localStorage
  try {
    const existing = JSON.parse(localStorage.getItem("openscan_sessions") || "[]");
    const updated = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem("openscan_sessions", JSON.stringify(updated));
    localStorage.removeItem(`openscan_messages_${sessionId}`);
  } catch (e) {
    console.warn("LocalStorage session cleanup error:", e);
  }

  return true;
}

// Helper to upload image to Supabase Storage
export async function uploadImageToStorage(file, path) {
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name ? file.name.split(".").pop() : "png";
      const fileName = `${path || Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `scans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("scan-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("scan-images").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.warn("Supabase Storage upload failed, returning data URL:", err.message);
    }
  }

  // Fallback: convert file to local Object URL / Base64
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
