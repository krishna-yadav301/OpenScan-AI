"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

export default function ConditionList({
  detectedConditions = [],
  confidenceScores = {},
  decisionThreshold = 0.5,
  onConditionClick,
}) {
  const [showAll, setShowAll] = useState(false);

  const sortedScores = Object.entries(confidenceScores || {}).sort(
    ([, a], [, b]) => b - a
  );

  const displayedScores = showAll ? sortedScores : sortedScores.slice(0, 6);

  return (
    <div className="rounded-2xl border border-[#423630] bg-[#1a1512]/90 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#423630]">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#967e71]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#e0dddc]">
            Findings & Probabilities
          </span>
        </div>
        <span className="rounded-full bg-[#241c17] px-2.5 py-0.5 text-[11px] font-semibold text-[#f2eef2] border border-[#423630]">
          {detectedConditions.length} Positive
        </span>
      </div>

      {/* Positive Findings Chips */}
      {detectedConditions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {detectedConditions.map((cond, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onConditionClick && onConditionClick(cond.condition)}
              className="group flex items-center gap-1.5 rounded-xl border border-[#967e71]/50 bg-[#241c17] px-3 py-1.5 text-xs font-semibold text-[#f2eef2] hover:border-[#967e71] hover:bg-[#423630] transition-all cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-[#967e71] animate-pulse" />
              <span className="capitalize">{cond.condition.replace(/_/g, " ")}</span>
              <span className="font-mono text-[11px] text-[#e0dddc]">
                {(cond.confidence * 100).toFixed(1)}%
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#241c17] border border-[#423630] px-3 py-2 text-xs text-[#b0b7c1]">
          <CheckCircle className="h-4 w-4 shrink-0 text-[#967e71]" />
          <span>No findings exceeded the decision threshold ({decisionThreshold * 100}%).</span>
        </div>
      )}

      {/* Confidence Score Bars */}
      <div className="mt-4 space-y-2.5">
        {displayedScores.map(([name, score]) => {
          const isPositive = score >= decisionThreshold;
          const percentage = (score * 100).toFixed(1);

          return (
            <div
              key={name}
              onClick={() => onConditionClick && onConditionClick(name)}
              className="group cursor-pointer rounded-xl p-1.5 hover:bg-[#241c17] transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span
                  className={`capitalize font-medium transition-colors ${
                    isPositive
                      ? "text-[#f2eef2] font-bold"
                      : "text-[#b0b7c1] group-hover:text-[#f2eef2]"
                  }`}
                >
                  {name.replace(/_/g, " ")}
                </span>
                <span className="font-mono text-xs text-[#b0b7c1]">
                  {percentage}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#100c0a]">
                <div
                  style={{ width: `${Math.min(score * 100, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive
                      ? "bg-gradient-to-r from-[#967e71] to-[#e0dddc]"
                      : score > 0.25
                      ? "bg-[#967e71]/60"
                      : "bg-[#423630]"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Show all toggle */}
      {sortedScores.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-[#423630] bg-[#100c0a] py-1.5 text-xs font-medium text-[#b0b7c1] hover:bg-[#241c17] hover:text-[#f2eef2] transition-colors cursor-pointer"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 text-[#967e71]" /> Show Top Findings
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 text-[#967e71]" /> View All ({sortedScores.length}) Evaluated Markers
            </>
          )}
        </button>
      )}
    </div>
  );
}
