"use client";

import React, { useState, useRef, useEffect } from "react";
import TypewriterMessage from "./TypewriterMessage";
import VoiceQueryModal from "./VoiceQueryModal";
import {
  Send,
  Plus,
  Bot,
  User,
  Sparkles,
  Layers,
  Sliders,
  ChevronDown,
  ChevronUp,
  Loader2,
  UploadCloud,
  FileText,
  Clock,
  Cpu,
  RefreshCw,
  Mic,
} from "lucide-react";

export default function FullChatInterface({
  messages,
  onSendMessage,
  isLoading,
  selectedFile,
  imagePreviewUrl,
  heatmapBase64,
  analysisData,
  task,
  onImageSelected,
  onReset,
}) {
  const [input, setInput] = useState("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisualizerExpanded, setIsVisualizerExpanded] = useState(true);
  const [viewMode, setViewMode] = useState("blend"); // "blend" | "side" | "original" | "heatmap"
  const [blendOpacity, setBlendOpacity] = useState(65);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [animatedMessageKeys, setAnimatedMessageKeys] = useState(() => new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const query = input.trim();
    setInput("");
    onSendMessage(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageSelected(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  // Quick sample loader
  const loadSample = (type) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 300);
    grad.addColorStop(0, "#2c221c");
    grad.addColorStop(1, "#100c0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = "rgba(224, 221, 220, 0.4)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(256, 60);
    ctx.lineTo(256, 460);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(100, 110);
    ctx.quadraticCurveTo(256, 130, 412, 110);
    ctx.stroke();

    ctx.fillStyle = "rgba(16, 12, 10, 0.9)";
    ctx.beginPath();
    ctx.ellipse(170, 260, 75, 130, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(342, 260, 75, 130, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(224, 221, 220, 0.35)";
    ctx.beginPath();
    ctx.ellipse(type === "cardiomegaly" ? 275 : 240, 310, type === "cardiomegaly" ? 95 : 65, 80, 0.2, 0, 2 * Math.PI);
    ctx.fill();

    if (type === "pneumonia" || type === "tuberculosis") {
      ctx.fillStyle = "rgba(242, 238, 242, 0.65)";
      ctx.beginPath();
      ctx.arc(type === "tuberculosis" ? 170 : 340, type === "tuberculosis" ? 170 : 320, 45, 0, 2 * Math.PI);
      ctx.filter = "blur(12px)";
      ctx.fill();
      ctx.filter = "none";
    }

    for (let y = 160; y <= 400; y += 45) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.quadraticCurveTo(256, y - 20, 402, y);
      ctx.stroke();
    }

    canvas.toBlob((blob) => {
      const sampleFile = new File([blob], `sample_${type}_xray.png`, { type: "image/png" });
      onImageSelected(sampleFile);
    }, "image/png");
  };

  const heatmapSrc = heatmapBase64?.startsWith("data:")
    ? heatmapBase64
    : `data:image/png;base64,${heatmapBase64}`;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-full flex-1 flex-col bg-[#100c0a] text-[#f2eef2] overflow-hidden"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop Canvas Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#100c0a]/90 backdrop-blur-sm border-2 border-dashed border-[#967e71] p-6 text-center">
          <UploadCloud className="h-16 w-16 text-[#967e71] animate-bounce mb-3" />
          <h3 className="text-xl font-bold text-[#f2eef2]">
            Drop your Chest Radiograph here
          </h3>
          <p className="mt-1 text-sm text-[#b0b7c1]">
            OpenScan AI will immediately run deep learning analysis & Grad-CAM explainability
          </p>
        </div>
      )}

      {/* Top Bar inside workspace */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#423630]/60 bg-[#100c0a]/95 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-[#f2eef2]">
            {selectedFile ? (selectedFile.name || "Chest Radiograph") : "Diagnostic Workspace"}
          </span>
          <span className="rounded-full bg-[#241c17] px-2 py-0.5 text-[10px] font-semibold text-[#967e71] border border-[#423630]">
            {task === "tuberculosis" ? "Tuberculosis Model" : "DenseNet-121"}
          </span>
        </div>

        {imagePreviewUrl && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVisualizerExpanded(!isVisualizerExpanded)}
              className="flex items-center gap-1.5 rounded-xl border border-[#423630] bg-[#1a1512] px-3 py-1.5 text-xs font-medium text-[#e0dddc] hover:border-[#967e71]/60 hover:text-[#f2eef2] transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-[#967e71]" />
              <span>{isVisualizerExpanded ? "Hide Visualizer" : "Show Visualizer"}</span>
              {isVisualizerExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-[#423630] bg-[#241c17] px-2.5 py-1.5 text-xs font-medium text-[#b0b7c1] hover:text-[#f2eef2] transition-colors cursor-pointer"
            >
              New Scan
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Scan & Grad-CAM Visualizer Card */}
      {imagePreviewUrl && isVisualizerExpanded && (
        <div className="shrink-0 border-b border-[#423630]/80 bg-[#140f0c] p-4 transition-all duration-300 shadow-xl">
          <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-5 items-center justify-between">
            {/* Image Viewer */}
            <div className="relative flex h-56 w-full md:w-88 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#100c0a] p-1.5 border border-[#423630] shadow-md">
              {viewMode === "side" ? (
                <div className="grid w-full h-full grid-cols-2 gap-1.5">
                  <img src={imagePreviewUrl} alt="Original" className="h-full w-full object-contain rounded-lg" />
                  <img src={heatmapSrc} alt="Heatmap" className="h-full w-full object-contain rounded-lg" />
                </div>
              ) : viewMode === "original" ? (
                <img src={imagePreviewUrl} alt="Original" className="h-full w-full object-contain rounded-lg" />
              ) : viewMode === "heatmap" ? (
                <img src={heatmapSrc} alt="Heatmap" className="h-full w-full object-contain rounded-lg" />
              ) : (
                /* Overlay Blend */
                <div className="relative flex h-full w-full items-center justify-center">
                  <img src={imagePreviewUrl} alt="Original" className="h-full w-full object-contain rounded-lg" />
                  {heatmapBase64 && (
                    <img
                      src={heatmapSrc}
                      alt="Overlay"
                      style={{ opacity: blendOpacity / 100 }}
                      className="absolute inset-0 m-auto h-full w-full object-contain rounded-lg pointer-events-none mix-blend-screen"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Controls & Findings Column */}
            <div className="flex-1 w-full flex flex-col justify-between h-56 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* View Mode Buttons */}
                <div className="flex items-center gap-1 rounded-xl bg-[#100c0a] p-1 border border-[#423630]">
                  <button
                    type="button"
                    onClick={() => setViewMode("blend")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "blend" ? "bg-[#967e71] text-[#f2eef2] font-semibold" : "text-[#b0b7c1] hover:text-[#f2eef2]"
                    }`}
                  >
                    Blend Overlay
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("side")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "side" ? "bg-[#967e71] text-[#f2eef2] font-semibold" : "text-[#b0b7c1] hover:text-[#f2eef2]"
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("original")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                      viewMode === "original" ? "bg-[#967e71] text-[#f2eef2] font-semibold" : "text-[#b0b7c1] hover:text-[#f2eef2]"
                    }`}
                  >
                    Original
                  </button>
                </div>

                {/* Opacity slider */}
                {viewMode === "blend" && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#100c0a] px-3 py-1 text-xs border border-[#423630]">
                    <Sliders className="h-3.5 w-3.5 text-[#967e71]" />
                    <span className="text-[11px] text-[#b0b7c1]">Heatmap:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={blendOpacity}
                      onChange={(e) => setBlendOpacity(Number(e.target.value))}
                      className="h-1.5 w-24 cursor-pointer appearance-none rounded bg-[#241c17] accent-[#967e71]"
                    />
                    <span className="font-mono text-[11px] text-[#f2eef2] w-7 text-right">{blendOpacity}%</span>
                  </div>
                )}
              </div>

              {/* Detected Condition Chips */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#b0b7c1]">
                  Neural Network Detections
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {analysisData?.detected_conditions?.length > 0 ? (
                    analysisData.detected_conditions.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onSendMessage(`Tell me more about the ${c.condition.replace(/_/g, " ")} finding in this scan.`)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#967e71]/50 bg-[#241c17] px-2.5 py-1 text-xs font-medium text-[#f2eef2] hover:border-[#967e71] hover:bg-[#423630] transition-colors cursor-pointer"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#967e71] animate-pulse" />
                        <span className="capitalize">{c.condition.replace(/_/g, " ")}</span>
                        <span className="font-mono text-[10px] text-[#e0dddc]">{(c.confidence * 100).toFixed(1)}%</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-[#b0b7c1]">No critical findings exceeded positive threshold.</span>
                  )}
                </div>
              </div>

              {/* Metadata strip */}
              <div className="flex items-center gap-4 text-[11px] text-[#b0b7c1] border-t border-[#423630]/60 pt-1.5">
                <span>Inference: <strong className="text-[#f2eef2]">{analysisData?.processing_time_ms?.toFixed(1) || 0} ms</strong></span>
                <span>Model: <strong className="text-[#f2eef2]">{analysisData?.model_version || "DenseNet-121"}</strong></span>
                <span>Threshold: <strong className="text-[#967e71]">{analysisData?.decision_threshold || 0.5}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Messages Stream Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Welcome state if no image attached yet */}
        {messages.length === 0 && !imagePreviewUrl ? (
          <div className="mx-auto max-w-xl flex h-full flex-col items-center justify-center text-center py-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#241c17] text-[#967e71] border border-[#423630] shadow-xl mb-3">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#f2eef2]">
              Attach Chest X-Ray to Begin
            </h3>
            <p className="mt-1 text-xs text-[#b0b7c1] max-w-sm">
              Upload a radiograph using the <strong className="text-[#f2eef2]">+ button</strong> below or drop a scan anywhere into this window.
            </p>

            {/* Target Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 w-full cursor-pointer rounded-2xl border-2 border-dashed border-[#423630] bg-[#1a1512]/80 p-6 hover:border-[#967e71]/80 hover:bg-[#241c17] transition-all group"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630] group-hover:scale-105 group-hover:bg-[#967e71] group-hover:text-[#f2eef2] transition-all mb-2">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-[#f2eef2]">
                  Click or Drag & Drop Radiograph
                </span>
                <span className="text-[10px] text-[#b0b7c1] mt-0.5">
                  PNG, JPEG, DICOM export (Max 15MB)
                </span>
              </div>
            </div>

            {/* Instant Demo Samples */}
            <div className="mt-5 w-full text-left">
              <span className="text-[11px] font-semibold text-[#b0b7c1] px-1">
                Instant test samples:
              </span>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => loadSample("tuberculosis")}
                  className="rounded-xl border border-[#423630] bg-[#1a1512] p-2.5 text-left hover:border-[#967e71] hover:bg-[#241c17] transition-all cursor-pointer"
                >
                  <div className="font-semibold text-xs text-[#f2eef2]">TB Pattern</div>
                  <div className="text-[10px] text-[#b0b7c1]">Apical opacity</div>
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("pneumonia")}
                  className="rounded-xl border border-[#423630] bg-[#1a1512] p-2.5 text-left hover:border-[#967e71] hover:bg-[#241c17] transition-all cursor-pointer"
                >
                  <div className="font-semibold text-xs text-[#f2eef2]">Pneumonia</div>
                  <div className="text-[10px] text-[#b0b7c1]">Consolidation</div>
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("cardiomegaly")}
                  className="rounded-xl border border-[#423630] bg-[#1a1512] p-2.5 text-left hover:border-[#967e71] hover:bg-[#241c17] transition-all cursor-pointer"
                >
                  <div className="font-semibold text-xs text-[#f2eef2]">Cardiomegaly</div>
                  <div className="text-[10px] text-[#b0b7c1]">Cardiac silhouette</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";
              const messageKey = `${msg.created_at || index}-${msg.sender}`;
              const shouldType =
                !isUser &&
                msg.animate &&
                !animatedMessageKeys.has(messageKey);
              return (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630] shadow-sm">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isUser
                        ? "bg-gradient-to-r from-[#967e71] to-[#423630] text-[#f2eef2] font-medium border border-[#967e71]/50"
                        : "bg-[#1a1512] text-[#f2eef2] border border-[#423630]"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert max-w-none space-y-2 text-[#f2eef2] text-xs sm:text-sm">
                        <TypewriterMessage
                          content={msg.content}
                          animate={shouldType}
                          onComplete={() =>
                            setAnimatedMessageKeys((prev) => {
                              const next = new Set(prev);
                              next.add(messageKey);
                              return next;
                            })
                          }
                        />
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-xl bg-[#423630] text-[#e0dddc] border border-[#967e71]/40 shadow-sm">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Analyzing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630]">
                  <Bot className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl bg-[#1a1512] px-3.5 py-2.5 border border-[#423630]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#967e71] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#967e71] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#967e71] animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-xs text-[#b0b7c1] ml-2">Typing a reply...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Clean Bottom Input Bar without Auto-Generated Question Section */}
      <div className="shrink-0 border-t border-[#423630]/80 bg-[#100c0a] p-3 sm:p-4">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center rounded-2xl border border-[#423630] bg-[#1a1512] px-3 py-2 shadow-2xl focus-within:border-[#967e71] focus-within:ring-1 focus-within:ring-[#967e71] transition-all"
          >
            {/* '+' Plus Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630] hover:bg-[#967e71] hover:text-[#f2eef2] transition-all cursor-pointer mr-2 shadow-sm"
              title="Upload / Drop Chest Radiograph Scan"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={imagePreviewUrl ? "Ask questions about this X-ray, Grad-CAM heatmap, or findings..." : "Ask a question or click '+' to attach a chest X-ray..."}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent py-1.5 px-1 text-xs sm:text-sm text-[#f2eef2] placeholder-[#b0b7c1]/60 focus:outline-none max-h-32"
            />

            {/* Microphone Voice Query Button */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              disabled={isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630] hover:bg-[#967e71] hover:text-[#f2eef2] hover:border-[#967e71]/60 transition-all cursor-pointer ml-1 shadow-sm disabled:opacity-40"
              title="Voice Query (Ask by speaking)"
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] text-[#f2eef2] hover:from-[#a89083] hover:to-[#52443d] border border-[#967e71]/40 disabled:opacity-30 transition-all cursor-pointer ml-1.5 shadow-sm"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 3D Voice Query Sphere Modal */}
      <VoiceQueryModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSendVoiceQuery={(voiceQuery) => onSendMessage(voiceQuery)}
      />
    </div>
  );
}
