"use client";

import React, { useState, useRef, useEffect } from "react";
import TypewriterMessage from "./TypewriterMessage";
import VoiceQueryModal from "./VoiceQueryModal";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Mic,
} from "lucide-react";

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  detectedConditions = [],
  task = "thoracic",
}) {
  const [input, setInput] = useState("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
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
    const userQuery = input.trim();
    setInput("");
    onSendMessage(userQuery);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (promptText) => {
    if (isLoading) return;
    onSendMessage(promptText);
  };

  // Dynamic quick prompt chips
  const quickPrompts = [
    "What areas are highlighted in the Grad-CAM heatmap?",
    detectedConditions.length > 0
      ? `Explain the ${detectedConditions[0].condition.replace(/_/g, " ")} findings.`
      : "Are there any subtle abnormalities present?",
    "What are recommended clinical next steps?",
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#423630] bg-[#1a1512]/90 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#423630] bg-[#100c0a]/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#f2eef2]">
                Conversational Assistant
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[10px] text-[#b0b7c1]">
              Grounded in image features & Grad-CAM activations
            </p>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[380px] max-h-[500px]">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 text-[#b0b7c1]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#241c17] text-[#967e71] border border-[#423630] mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-[#f2eef2]">
              Ready for your questions
            </p>
            <p className="text-xs text-[#b0b7c1] mt-1 max-w-xs">
              Upload a radiograph above or tap any quick prompt below to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.sender === "user";
            const messageKey = `${msg.created_at || index}-${msg.sender}`;
            const shouldType =
              !isUser &&
              msg.animate &&
              !animatedMessageKeys.has(messageKey);
            return (
              <div
                key={index}
                className={`flex gap-2.5 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-[#241c17] text-[#967e71] border border-[#423630]">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-gradient-to-r from-[#967e71] to-[#423630] text-[#f2eef2] font-medium border border-[#967e71]/40"
                      : "bg-[#241c17] text-[#f2eef2] border border-[#423630]"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-xs max-w-none space-y-2 text-[#f2eef2]">
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
                  <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg bg-[#423630] text-[#e0dddc] border border-[#967e71]/40">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#241c17] text-[#967e71] border border-[#423630]">
              <Bot className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-[#241c17] px-3.5 py-2 border border-[#423630]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#967e71] animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-[#967e71] animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-[#967e71] animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="text-[11px] text-[#b0b7c1] ml-1.5">Typing a reply...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="border-t border-[#423630] bg-[#100c0a]/60 px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#967e71]" />
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickPrompt(prompt)}
              className="shrink-0 rounded-full border border-[#423630] bg-[#241c17] px-3 py-1 text-[#e0dddc] hover:border-[#967e71] hover:bg-[#423630] hover:text-[#f2eef2] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-[#423630] bg-[#100c0a] p-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the image or heatmap..."
          disabled={isLoading}
          className="flex-1 rounded-xl border border-[#423630] bg-[#1a1512] px-3.5 py-2.5 text-xs text-[#f2eef2] placeholder-[#b0b7c1]/60 focus:border-[#967e71] focus:outline-none focus:ring-1 focus:ring-[#967e71] disabled:opacity-50"
        />

        {/* Microphone Button */}
        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          disabled={isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630] hover:bg-[#967e71] hover:text-[#f2eef2] hover:border-[#967e71]/60 transition-all cursor-pointer shadow-sm disabled:opacity-40"
          title="Voice Query (Ask by speaking)"
        >
          <Mic className="h-4 w-4" />
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] text-[#f2eef2] hover:from-[#a89083] hover:to-[#52443d] border border-[#967e71]/40 disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* 3D Voice Query Sphere Modal */}
      <VoiceQueryModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSendVoiceQuery={(voiceQuery) => onSendMessage(voiceQuery)}
      />
    </div>
  );
}
