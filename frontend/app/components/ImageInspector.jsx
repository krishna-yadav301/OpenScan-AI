"use client";

import React, { useState } from "react";
import { Layers, Sliders, Clock, Cpu, RefreshCw } from "lucide-react";

export default function ImageInspector({
  originalUrl,
  heatmapBase64,
  analysisData,
  onReset,
}) {
  const [viewMode, setViewMode] = useState("blend"); // "blend" | "side" | "original" | "heatmap"
  const [blendOpacity, setBlendOpacity] = useState(65);

  const heatmapSrc = heatmapBase64?.startsWith("data:")
    ? heatmapBase64
    : `data:image/png;base64,${heatmapBase64}`;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#423630] bg-[#1a1512]/90 p-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#423630] pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#967e71]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#e0dddc]">
            Grad-CAM Explainability
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-[#100c0a] p-1 border border-[#423630]">
          <button
            type="button"
            onClick={() => setViewMode("blend")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "blend"
                ? "bg-[#967e71] text-[#f2eef2] font-semibold shadow-sm"
                : "text-[#b0b7c1] hover:text-[#f2eef2]"
            }`}
          >
            Overlay
          </button>
          <button
            type="button"
            onClick={() => setViewMode("side")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "side"
                ? "bg-[#967e71] text-[#f2eef2] font-semibold shadow-sm"
                : "text-[#b0b7c1] hover:text-[#f2eef2]"
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode("original")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "original"
                ? "bg-[#967e71] text-[#f2eef2] font-semibold shadow-sm"
                : "text-[#b0b7c1] hover:text-[#f2eef2]"
            }`}
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => setViewMode("heatmap")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "heatmap"
                ? "bg-[#967e71] text-[#f2eef2] font-semibold shadow-sm"
                : "text-[#b0b7c1] hover:text-[#f2eef2]"
            }`}
          >
            Heatmap
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-xl border border-[#423630] bg-[#241c17] px-3 py-1 text-xs font-medium text-[#e0dddc] hover:border-[#967e71]/60 hover:text-[#f2eef2] transition-all cursor-pointer"
        >
          <RefreshCw className="h-3 w-3 text-[#967e71]" />
          <span>New</span>
        </button>
      </div>

      {/* Image Display */}
      <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl bg-[#100c0a] p-2 border border-[#423630]">
        {viewMode === "side" ? (
          <div className="grid w-full grid-cols-2 gap-2">
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-medium text-[#b0b7c1]">Original X-Ray</span>
              <img
                src={originalUrl}
                alt="Original X-ray"
                className="max-h-[300px] w-full rounded-lg object-contain"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="mb-1 text-[11px] font-medium text-[#967e71]">Grad-CAM Heatmap</span>
              <img
                src={heatmapSrc}
                alt="Grad-CAM Heatmap"
                className="max-h-[300px] w-full rounded-lg object-contain"
              />
            </div>
          </div>
        ) : viewMode === "original" ? (
          <img
            src={originalUrl}
            alt="Original X-ray"
            className="max-h-[340px] w-full rounded-lg object-contain"
          />
        ) : viewMode === "heatmap" ? (
          <img
            src={heatmapSrc}
            alt="Grad-CAM Heatmap"
            className="max-h-[340px] w-full rounded-lg object-contain"
          />
        ) : (
          /* Blend Mode */
          <div className="relative flex items-center justify-center">
            <img
              src={originalUrl}
              alt="Original Base"
              className="max-h-[340px] w-full rounded-lg object-contain"
            />
            {heatmapBase64 && (
              <img
                src={heatmapSrc}
                alt="Grad-CAM Overlay"
                style={{ opacity: blendOpacity / 100 }}
                className="absolute inset-0 m-auto max-h-[340px] w-full rounded-lg object-contain transition-opacity duration-150 pointer-events-none mix-blend-screen"
              />
            )}
          </div>
        )}
      </div>

      {/* Opacity Slider */}
      {viewMode === "blend" && (
        <div className="flex items-center gap-3 rounded-xl bg-[#100c0a] px-3 py-2 text-xs border border-[#423630]">
          <Sliders className="h-3.5 w-3.5 text-[#967e71]" />
          <span className="text-[#b0b7c1] whitespace-nowrap">Heatmap Blend:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={blendOpacity}
            onChange={(e) => setBlendOpacity(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#241c17] accent-[#967e71]"
          />
          <span className="w-8 text-right font-mono font-medium text-[#f2eef2]">
            {blendOpacity}%
          </span>
        </div>
      )}

      {/* Meta Footer */}
      {analysisData && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#b0b7c1] pt-1">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#967e71]" />
            <span>Inference: <strong className="text-[#f2eef2]">{analysisData.processing_time_ms?.toFixed(1)} ms</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-[#967e71]" />
            <span>Model: <strong className="text-[#f2eef2]">{analysisData.model_version || "DenseNet-121"}</strong></span>
          </div>
          <div>
            <span>Threshold: <strong className="text-[#967e71]">{analysisData.decision_threshold}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
