"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Volume2,
  AlertCircle,
} from "lucide-react";

export default function VoiceQueryModal({ isOpen, onClose, onSendVoiceQuery }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const rotationAngleRef = useRef(0);

  // Initialize and clean up speech recognition & audio visualizer
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      return;
    }

    setTranscript("");
    setInterimText("");
    setErrorMessage("");

    // Check Speech Recognition support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
    } else {
      setSpeechSupported(true);
    }

    startListening();

    return () => {
      stopListening();
    };
  }, [isOpen]);

  // Start Voice Capture & Web Audio Frequency Analyzer
  const startListening = async () => {
    setErrorMessage("");
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // 1. Initialize Web Audio API for Live Frequency Visualizer
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      startVisualizerAnimation();
    } catch (err) {
      console.warn("Audio mic stream error:", err);
      // Even if mic visualizer fails or is simulated, continue with speech recognition if available
      startSimulatedVisualizer();
    }

    // 2. Initialize Speech Recognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          let interim = "";
          let final = "";

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript + " ";
            } else {
              interim += result[0].transcript;
            }
          }

          if (final) {
            setTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
          }
          setInterimText(interim);
        };

        recognition.onerror = (event) => {
          if (event.error !== "no-speech") {
            console.warn("Speech recognition error:", event.error);
            setErrorMessage(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          if (isListening && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore if already restarting
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Failed to initialize speech recognition:", err);
        setErrorMessage("Microphone access permitted, but speech recognition could not start.");
      }
    }
  };

  // Stop Listening & Clean up
  const stopListening = () => {
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Canvas visualizer loop: Revolving 3D sphere + live frequency waves
  const startVisualizerAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const analyser = analyserRef.current;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      if (!canvas) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 55;

      ctx.clearRect(0, 0, width, height);

      let avgFrequency = 0;
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        avgFrequency = sum / bufferLength / 255; // 0.0 to 1.0
        setAudioLevel(avgFrequency);
      } else {
        // Subtle idle pulse
        avgFrequency = 0.15 + Math.sin(Date.now() * 0.003) * 0.08;
      }

      rotationAngleRef.current += 0.02 + avgFrequency * 0.05;
      const angle = rotationAngleRef.current;

      // 1. Draw outer glowing ambient halo
      const haloGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.6,
        centerX,
        centerY,
        baseRadius * (1.8 + avgFrequency * 0.8)
      );
      haloGrad.addColorStop(0, "rgba(150, 126, 113, 0.45)");
      haloGrad.addColorStop(0.5, "rgba(66, 54, 48, 0.25)");
      haloGrad.addColorStop(1, "rgba(16, 12, 10, 0)");
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw radiating voice frequency waveform bars around sphere
      const barCount = 48;
      for (let i = 0; i < barCount; i++) {
        const barAngle = (i / barCount) * Math.PI * 2 + angle * 0.5;
        const dataIdx = Math.floor((i / barCount) * bufferLength);
        const freqVal = dataArray[dataIdx] ? dataArray[dataIdx] / 255 : Math.sin(i + angle * 2) * 0.3 + 0.3;
        const barHeight = 8 + freqVal * 45;

        const x1 = centerX + Math.cos(barAngle) * (baseRadius + 4);
        const y1 = centerY + Math.sin(barAngle) * (baseRadius + 4);
        const x2 = centerX + Math.cos(barAngle) * (baseRadius + 4 + barHeight);
        const y2 = centerY + Math.sin(barAngle) * (baseRadius + 4 + barHeight);

        const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
        barGrad.addColorStop(0, "rgba(242, 238, 242, 0.9)");
        barGrad.addColorStop(0.5, "rgba(150, 126, 113, 0.7)");
        barGrad.addColorStop(1, "rgba(66, 54, 48, 0.1)");

        ctx.strokeStyle = barGrad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // 3. Draw Revolving 3D Sphere Body
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.clip();

      // Sphere internal lighting gradient
      const sphereGrad = ctx.createRadialGradient(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        5,
        centerX,
        centerY,
        baseRadius
      );
      sphereGrad.addColorStop(0, "#f2eef2");
      sphereGrad.addColorStop(0.25, "#b0b7c1");
      sphereGrad.addColorStop(0.55, "#967e71");
      sphereGrad.addColorStop(0.85, "#423630");
      sphereGrad.addColorStop(1, "#100c0a");

      ctx.fillStyle = sphereGrad;
      ctx.fillRect(centerX - baseRadius, centerY - baseRadius, baseRadius * 2, baseRadius * 2);

      // Revolving Latitude / Longitude 3D Rings
      ctx.strokeStyle = "rgba(242, 238, 242, 0.35)";
      ctx.lineWidth = 1.2;

      // Rotating Longitude Ellipses
      for (let offset = -2; offset <= 2; offset++) {
        const radiusX = Math.cos(angle + offset * 0.6) * baseRadius;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(radiusX), baseRadius, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Horizontal Latitude Ellipses
      for (let yOffset = -0.6; yOffset <= 0.6; yOffset += 0.4) {
        const latY = centerY + yOffset * baseRadius;
        const latRadiusX = Math.sqrt(Math.max(0, baseRadius * baseRadius - (latY - centerY) ** 2));
        ctx.beginPath();
        ctx.ellipse(centerX, latY, latRadiusX, latRadiusX * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Dynamic glowing core pulse inside sphere
      const pulseSize = 12 + avgFrequency * 24;
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      coreGrad.addColorStop(0.5, "rgba(150, 126, 113, 0.6)");
      coreGrad.addColorStop(1, "rgba(66, 54, 48, 0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Outer rim edge shine
      ctx.strokeStyle = "rgba(242, 238, 242, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.stroke();
    };

    render();
  };

  const startSimulatedVisualizer = () => {
    startVisualizerAnimation();
  };

  // Submit recognized query
  const handleSend = () => {
    const fullQuery = `${transcript} ${interimText}`.trim();
    if (!fullQuery) return;
    onSendVoiceQuery(fullQuery);
    onClose();
  };

  const handleResetSpeech = () => {
    setTranscript("");
    setInterimText("");
  };

  if (!isOpen) return null;

  const currentDisplay = `${transcript} ${interimText}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#1a1512]/95 border border-[#423630] shadow-2xl p-6 overflow-hidden backdrop-blur-xl">
        {/* Top ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#967e71]/25 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#423630]/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#241c17] text-[#967e71] border border-[#423630]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#f2eef2] uppercase tracking-wider">
                Voice Radiography Assistant
              </h3>
              <p className="text-[10px] text-[#b0b7c1]">Ask your diagnostic questions out loud</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#b0b7c1] hover:bg-[#241c17] hover:text-[#f2eef2] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Central Visualizer Area: Revolving Sphere + Audio Waves */}
        <div className="relative my-4 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={280}
            height={220}
            className="w-70 h-55"
          />

          {/* Listening Status Badge */}
          <div className="mt-1 flex items-center gap-2 rounded-full bg-[#100c0a] px-3.5 py-1 text-xs font-semibold text-[#f2eef2] border border-[#423630] shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isListening ? "Listening to your voice..." : "Voice capture active"}</span>
          </div>
        </div>

        {/* Speech Transcript Display Box */}
        <div className="rounded-2xl bg-[#100c0a] p-4 border border-[#423630] min-h-[90px] max-h-[140px] overflow-y-auto shadow-inner">
          {currentDisplay ? (
            <p className="text-xs sm:text-sm font-medium text-[#f2eef2] leading-relaxed">
              <span>{transcript}</span>
              <span className="text-[#967e71] italic font-normal"> {interimText}</span>
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-2 text-[#b0b7c1]">
              <Volume2 className="h-5 w-5 text-[#967e71] animate-pulse mb-1" />
              <span className="text-xs">Speak now — e.g. &ldquo;Is there evidence of pleural effusion or TB?&rdquo;</span>
            </div>
          )}
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-950/40 p-2.5 text-xs text-red-300 border border-red-800/60">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="truncate">{errorMessage}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetSpeech}
            disabled={!currentDisplay}
            className="flex items-center gap-1.5 rounded-xl border border-[#423630] bg-[#241c17] px-3 py-2 text-xs font-medium text-[#b0b7c1] hover:text-[#f2eef2] hover:border-[#967e71]/60 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#423630] bg-[#1a1512] px-3.5 py-2 text-xs font-medium text-[#b0b7c1] hover:text-[#f2eef2] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!currentDisplay}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#967e71] to-[#423630] px-4 py-2 text-xs font-bold text-[#f2eef2] border border-[#967e71]/60 hover:brightness-110 active:scale-95 transition-all shadow-md disabled:opacity-40 cursor-pointer"
            >
              <span>Send Query</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
