"use client";

import React from "react";
import {
  Sparkles,
  ArrowDown,
  Activity,
  Layers,
  Cpu,
  ShieldAlert,
  Brain,
  MessageSquare,
  Zap,
} from "lucide-react";

export default function HeroSection({ onScrollToWorkspace }) {
  return (
    <section className="relative min-h-[92vh] w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden bg-[#100c0a]">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#967e71]/20 via-[#423630]/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-[350px] h-[350px] bg-[#967e71]/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[350px] h-[350px] bg-[#423630]/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#241c17] border border-[#967e71]/40 text-[#f2eef2] shadow-inner mb-6">
          <Sparkles className="h-3.5 w-3.5 text-[#967e71]" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Explainable Medical Vision & Natural Dialogue
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#f2eef2] leading-[1.15] max-w-4xl">
          Conversational Image Recognition for{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f2eef2] via-[#e0dddc] to-[#967e71]">
            Chest Radiography
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#b0b7c1] max-w-2xl leading-relaxed">
          OpenScan AI pairs <strong className="text-[#f2eef2]">DenseNet-121</strong> deep learning with real-time{" "}
          <strong className="text-[#f2eef2]">Grad-CAM explainability</strong> and an interactive conversational assistant to analyze findings with contextual clarity.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onScrollToWorkspace}
            className="group flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] text-[#f2eef2] font-semibold text-sm shadow-lg shadow-[#100c0a]/60 hover:from-[#a89083] hover:to-[#52443d] border border-[#967e71]/40 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <span>Analyze Image & Start Chat</span>
            <ArrowDown className="h-4 w-4 text-[#e0dddc] group-hover:translate-y-0.5 transition-transform" />
          </button>

          <a
            href="#architecture"
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#1a1512] text-[#e0dddc] hover:text-[#f2eef2] font-medium text-sm border border-[#423630] hover:border-[#967e71]/50 transition-all duration-300"
          >
            <Brain className="h-4 w-4 text-[#967e71]" />
            <span>Model Capabilities</span>
          </a>
        </div>

        {/* 4 Feature Architecture Pillars */}
        <div id="architecture" className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
          {/* Card 1: DenseNet Multi-label */}
          <div className="p-5 rounded-2xl bg-[#1a1512]/80 border border-[#423630] hover:border-[#967e71]/40 transition-all duration-300 group">
            <div className="h-9 w-9 rounded-xl bg-[#241c17] flex items-center justify-center border border-[#423630] text-[#967e71] mb-3 group-hover:scale-105 transition-transform">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[#f2eef2]">DenseNet-121</h2>
            <p className="mt-1 text-xs text-[#b0b7c1] leading-relaxed">
              Trained on extensive clinical datasets (NIH, CheXpert, MIMIC-CXR) to evaluate 14+ thoracic findings.
            </p>
          </div>

          {/* Card 2: Grad-CAM Explainability */}
          <div className="p-5 rounded-2xl bg-[#1a1512]/80 border border-[#423630] hover:border-[#967e71]/40 transition-all duration-300 group">
            <div className="h-9 w-9 rounded-xl bg-[#241c17] flex items-center justify-center border border-[#423630] text-[#967e71] mb-3 group-hover:scale-105 transition-transform">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[#f2eef2]">Grad-CAM Heatmaps</h2>
            <p className="mt-1 text-xs text-[#b0b7c1] leading-relaxed">
              Pixel-level explainability revealing exact lung parenchyma and mediastinum regions driving neural predictions.
            </p>
          </div>

          {/* Card 3: Fine-tuned TB Model */}
          <div className="p-5 rounded-2xl bg-[#1a1512]/80 border border-[#423630] hover:border-[#967e71]/40 transition-all duration-300 group">
            <div className="h-9 w-9 rounded-xl bg-[#241c17] flex items-center justify-center border border-[#423630] text-[#967e71] mb-3 group-hover:scale-105 transition-transform">
              <Cpu className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[#f2eef2]">Tuberculosis Detection</h2>
            <p className="mt-1 text-xs text-[#b0b7c1] leading-relaxed">
              Fine-tuned checkpoint featuring a calibrated decision threshold (0.465) for binary screening.
            </p>
          </div>

          {/* Card 4: Conversational Loop */}
          <div className="p-5 rounded-2xl bg-[#1a1512]/80 border border-[#423630] hover:border-[#967e71]/40 transition-all duration-300 group">
            <div className="h-9 w-9 rounded-xl bg-[#241c17] flex items-center justify-center border border-[#423630] text-[#967e71] mb-3 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[#f2eef2]">Conversational Dialogue</h2>
            <p className="mt-1 text-xs text-[#b0b7c1] leading-relaxed">
              Natural language Q&A strictly grounded in the detected probabilities, image features, and visual heatmaps.
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          type="button"
          onClick={onScrollToWorkspace}
          className="mt-12 flex flex-col items-center gap-2 cursor-pointer group"
        >
          <span className="text-[11px] uppercase tracking-widest text-[#967e71] font-semibold group-hover:text-[#e0dddc] transition-colors">
            Scroll to Workspace
          </span>
          <div className="w-5 h-8 rounded-full border border-[#423630] group-hover:border-[#967e71] flex justify-center pt-1 transition-colors">
            <div className="w-1 h-2 rounded-full bg-[#967e71] animate-bounce" />
          </div>
        </button>
      </div>
    </section>
  );
}
