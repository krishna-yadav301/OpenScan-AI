"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import Sidebar from "./components/Sidebar";
import FullChatInterface from "./components/FullChatInterface";
import { analyzeImage, sendChatMessage, checkBackendHealth } from "@/lib/api";
import {
  saveChatSession,
  saveChatMessage,
  getChatSessions,
  getChatMessages,
  deleteChatSession,
  uploadImageToStorage,
  generateUUID,
} from "@/lib/supabase";

export default function Home() {
  // Application State
  const [task, setTask] = useState("thoracic"); // "thoracic" | "tuberculosis"
  const [backendOnline, setBackendOnline] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Active Image & Analysis State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [heatmapBase64, setHeatmapBase64] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const workspaceRef = useRef(null);

  const scrollToWorkspace = () => {
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Check backend health & load past sessions on mount
  useEffect(() => {
    async function init() {
      const health = await checkBackendHealth();
      setBackendOnline(Boolean(health));

      const loadedSessions = await getChatSessions();
      setSessions(loadedSessions);
    }
    init();

    const interval = setInterval(async () => {
      const health = await checkBackendHealth();
      setBackendOnline(Boolean(health));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Handle image selection & attach to conversation without wiping previous chat
  const handleImageSelected = async (file) => {
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localUrl);
    setIsAnalyzing(true);

    // Reuse existing session ID or generate a new compliant UUID
    const sessionId = currentSessionId || generateUUID();
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    scrollToWorkspace();

    try {
      // 1. Send to FastAPI backend for deep learning inference & Grad-CAM heatmap
      const result = await analyzeImage({
        file,
        task,
        organ: "lung",
        modality: "xray",
      });

      setAnalysisData(result);
      setHeatmapBase64(result.heatmap_base64);

      // 2. Upload image to Supabase Storage or local data URL
      const storageImageUrl = await uploadImageToStorage(file, sessionId);

      // 3. Save / update session metadata
      const sessionTitle = `${task === "tuberculosis" ? "TB" : "Thoracic"} Scan (${file.name})`;
      const savedSession = await saveChatSession({
        id: sessionId,
        title: sessionTitle,
        imageUrl: storageImageUrl || localUrl,
        heatmapUrl: result.heatmap_base64,
        task,
        organ: result.organ,
        modality: result.modality,
        detectedConditions: result.detected_conditions,
        confidenceScores: result.confidence_scores,
      });

      // 4. Create assistant message with findings breakdown (appended to existing chat)
      const findingsMessage = {
        sender: "assistant",
        content:
          result.initial_summary ||
          `Scan attached and analyzed. Detected **${result.detected_conditions?.length || 0} finding(s)**. Ask me anything about the image or the Grad-CAM heatmap.`,
        created_at: new Date().toISOString(),
        animate: true,
      };

      setMessages((prev) => [...prev, findingsMessage]);
      await saveChatMessage({
        sessionId,
        sender: "assistant",
        content: findingsMessage.content,
      });

      // Update sessions list
      if (savedSession) {
        setSessions((prev) => [savedSession, ...prev.filter((s) => s.id !== sessionId)]);
      }
    } catch (err) {
      console.error("Analysis Error:", err);
      const errorMessage = {
        sender: "assistant",
        content: `**Notice:** ${err.message || "Failed to communicate with FastAPI backend. Ensure the backend server is running."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sending a chat query (logs and persists every message automatically)
  const handleSendMessage = async (queryText) => {
    if (!queryText.trim()) return;

    // Ensure we have a valid session ID
    let sessionId = currentSessionId;
    let isNewSession = false;

    if (!sessionId) {
      sessionId = generateUUID();
      setCurrentSessionId(sessionId);
      isNewSession = true;
    }

    const userMessage = {
      sender: "user",
      content: queryText,
      created_at: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsChatLoading(true);

    // If new session started by typing, log and save session record first
    if (isNewSession) {
      const generatedTitle =
        queryText.length > 32 ? `${queryText.substring(0, 32)}...` : queryText;
      const initialSession = await saveChatSession({
        id: sessionId,
        title: generatedTitle,
        imageUrl: imagePreviewUrl || "",
        heatmapUrl: heatmapBase64 || null,
        task,
        organ: analysisData?.organ || "lung",
        modality: analysisData?.modality || "xray",
        detectedConditions: analysisData?.detected_conditions || [],
        confidenceScores: analysisData?.confidence_scores || {},
      });

      if (initialSession) {
        setSessions((prev) => [initialSession, ...prev.filter((s) => s.id !== sessionId)]);
      }
    }

    // Save user message to database
    await saveChatMessage({
      sessionId,
      sender: "user",
      content: queryText,
    });

    try {
      // Send conversational query to FastAPI with image context
      const chatResponse = await sendChatMessage({
        sessionId,
        query: queryText,
        imageContext: {
          task,
          organ: analysisData?.organ || "lung",
          modality: analysisData?.modality || "xray",
          detected_conditions: analysisData?.detected_conditions || [],
          confidence_scores: analysisData?.confidence_scores || {},
          decision_threshold: analysisData?.decision_threshold || 0.5,
        },
        history: newMessages,
      });

      const assistantMessage = {
        sender: "assistant",
        content: chatResponse.response,
        created_at: new Date().toISOString(),
        animate: true,
      };

      setMessages([...newMessages, assistantMessage]);

      // Save assistant message to database
      await saveChatMessage({
        sessionId,
        sender: "assistant",
        content: chatResponse.response,
      });
    } catch (err) {
      console.error("Chat error:", err);
      const errorReply = {
        sender: "assistant",
        content: `Failed to generate response: ${err.message}`,
        created_at: new Date().toISOString(),
      };
      setMessages([...newMessages, errorReply]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Load a previous session
  const handleSelectSession = async (session) => {
    setCurrentSessionId(session.id);
    setImagePreviewUrl(session.image_url || null);
    setSelectedFile(session.image_url ? { name: session.title } : null);
    setHeatmapBase64(session.heatmap_url || null);
    setTask(session.task || "thoracic");
    setAnalysisData({
      organ: session.organ || "lung",
      modality: session.modality || "xray",
      task: session.task || "thoracic",
      detected_conditions: session.detected_conditions || [],
      confidence_scores: session.confidence_scores || {},
      decision_threshold: 0.5,
      processing_time_ms: 0,
      model_version: "DenseNet-121",
    });

    const sessionMessages = await getChatMessages(session.id);
    setMessages(sessionMessages);
    scrollToWorkspace();
  };

  // Reset to new clean chat/scan
  const handleReset = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setHeatmapBase64(null);
    setAnalysisData(null);
    setMessages([]);
    setCurrentSessionId(null);
  };

  // Delete session from both the database server & local cache
  const handleDeleteSession = async (sessionId) => {
    // 1. Immediately remove from local sessions UI
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    if (currentSessionId === sessionId) {
      handleReset();
    }

    // 2. Permanently delete from Supabase database server & storage
    try {
      await deleteChatSession(sessionId);
    } catch (err) {
      console.error("Failed to delete session from server:", err);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#100c0a] text-[#f2eef2] antialiased selection:bg-[#967e71] selection:text-[#f2eef2]">
      {/* Sleek Minimal Header */}
      <Header
        backendOnline={backendOnline}
        task={task}
        onTaskChange={(newTask) => setTask(newTask)}
        onScrollToWorkspace={scrollToWorkspace}
      />

      {/* Model Showcase Hero Section */}
      <HeroSection onScrollToWorkspace={scrollToWorkspace} />

      {/* Main Diagnostic & Chat Workspace */}
      <section
        id="workspace"
        ref={workspaceRef}
        className="w-full scroll-mt-16 border-t border-[#423630]/60 bg-[#100c0a] h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
      >
        <div className="flex h-full w-full overflow-hidden">
          {/* Left History Sidebar */}
          <Sidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleReset}
            onDeleteSession={handleDeleteSession}
            task={task}
            onTaskChange={(newTask) => setTask(newTask)}
            backendOnline={backendOnline}
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* Full-Window Chat Interface with Visualizer */}
          <FullChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading || isAnalyzing}
            selectedFile={selectedFile}
            imagePreviewUrl={imagePreviewUrl}
            heatmapBase64={heatmapBase64}
            analysisData={analysisData}
            task={task}
            onImageSelected={handleImageSelected}
            onReset={handleReset}
          />
        </div>
      </section>
    </div>
  );
}
