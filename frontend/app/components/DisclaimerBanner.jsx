"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Research & Education Only:</strong> OpenScan AI predictions and Grad-CAM overlays are for research prototyping and not intended for primary clinical diagnosis or guiding patient treatment decisions.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="ml-4 rounded p-0.5 text-amber-400 hover:bg-amber-500/20"
          aria-label="Dismiss banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
