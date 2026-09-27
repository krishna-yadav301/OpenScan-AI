"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Sparkles, Image as ImageIcon } from "lucide-react";

export default function ImageUploadArea({ onImageSelected, isAnalyzing, task }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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

  // Sample generator
  const loadSampleImage = (type) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    // Radial gradient
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 300);
    grad.addColorStop(0, "#2c221c");
    grad.addColorStop(1, "#100c0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Rib cage & lung structures
    ctx.strokeStyle = "rgba(224, 221, 220, 0.4)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";

    // Spine
    ctx.beginPath();
    ctx.moveTo(256, 60);
    ctx.lineTo(256, 460);
    ctx.stroke();

    // Clavicles
    ctx.beginPath();
    ctx.moveTo(100, 110);
    ctx.quadraticCurveTo(256, 130, 412, 110);
    ctx.stroke();

    // Left Lung Field
    ctx.fillStyle = "rgba(16, 12, 10, 0.9)";
    ctx.beginPath();
    ctx.ellipse(170, 260, 75, 130, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Right Lung Field
    ctx.beginPath();
    ctx.ellipse(342, 260, 75, 130, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Cardiac Silhouette
    ctx.fillStyle = "rgba(224, 221, 220, 0.35)";
    ctx.beginPath();
    ctx.ellipse(type === "cardiomegaly" ? 275 : 240, 310, type === "cardiomegaly" ? 95 : 65, 80, 0.2, 0, 2 * Math.PI);
    ctx.fill();

    // Infiltrate / Opacity simulation
    if (type === "pneumonia" || type === "tuberculosis") {
      ctx.fillStyle = "rgba(242, 238, 242, 0.65)";
      ctx.beginPath();
      ctx.arc(type === "tuberculosis" ? 170 : 340, type === "tuberculosis" ? 170 : 320, 45, 0, 2 * Math.PI);
      ctx.filter = "blur(12px)";
      ctx.fill();
      ctx.filter = "none";
    }

    // Rib arches
    ctx.strokeStyle = "rgba(176, 183, 193, 0.25)";
    ctx.lineWidth = 8;
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

  return (
    <div className="flex flex-col gap-4">
      {/* Modern Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
          isDragging
            ? "border-[#967e71] bg-[#241c17] scale-[1.01]"
            : "border-[#423630] bg-[#1a1512]/90 hover:border-[#967e71]/60 hover:bg-[#241c17]/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileChange}
          className="hidden"
          disabled={isAnalyzing}
        />

        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#241c17] text-[#967e71] border border-[#423630] shadow-inner group-hover:scale-105 group-hover:bg-[#967e71] group-hover:text-[#f2eef2] transition-all duration-300">
          <UploadCloud className="h-8 w-8" />
          {isAnalyzing && (
            <div className="absolute inset-0 rounded-2xl border-2 border-[#967e71] border-t-transparent animate-spin" />
          )}
        </div>

        <p className="text-sm font-semibold text-[#f2eef2]">
          Drop chest radiograph or browse file
        </p>
        <p className="mt-1 text-xs text-[#b0b7c1]">
          Supports DICOM exports, PNG, JPG (Evaluating for {task === "tuberculosis" ? "TB Screening" : "14+ Thoracic Pathologies"})
        </p>
      </div>

      {/* Instant Demo Samples */}
      <div className="rounded-2xl border border-[#423630] bg-[#1a1512]/60 p-3.5">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#e0dddc]">
            <Sparkles className="h-3.5 w-3.5 text-[#967e71]" />
            Quick Demo Samples
          </span>
          <span className="text-[10px] text-[#b0b7c1]">Instant test</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadSampleImage("tuberculosis");
            }}
            className="flex flex-col items-start rounded-xl border border-[#423630] bg-[#241c17] p-2.5 text-left hover:border-[#967e71]/60 hover:bg-[#423630]/60 transition-all text-xs cursor-pointer"
          >
            <span className="font-semibold text-[#f2eef2]">TB Pattern</span>
            <span className="text-[10px] text-[#b0b7c1]">Apical opacity</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadSampleImage("pneumonia");
            }}
            className="flex flex-col items-start rounded-xl border border-[#423630] bg-[#241c17] p-2.5 text-left hover:border-[#967e71]/60 hover:bg-[#423630]/60 transition-all text-xs cursor-pointer"
          >
            <span className="font-semibold text-[#f2eef2]">Pneumonia</span>
            <span className="text-[10px] text-[#b0b7c1]">Consolidation</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              loadSampleImage("cardiomegaly");
            }}
            className="flex flex-col items-start rounded-xl border border-[#423630] bg-[#241c17] p-2.5 text-left hover:border-[#967e71]/60 hover:bg-[#423630]/60 transition-all text-xs cursor-pointer"
          >
            <span className="font-semibold text-[#f2eef2]">Cardiomegaly</span>
            <span className="text-[10px] text-[#b0b7c1]">Cardiac silhouette</span>
          </button>
        </div>
      </div>
    </div>
  );
}
