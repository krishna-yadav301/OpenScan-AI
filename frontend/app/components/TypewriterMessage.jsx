"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

/**
 * Reveals assistant text gradually so new replies feel like someone typing in chat.
 */
export default function TypewriterMessage({
  content,
  animate = false,
  onComplete,
}) {
  const [displayed, setDisplayed] = useState(animate ? "" : content);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!animate) {
      setDisplayed(content);
      return;
    }

    setDisplayed("");
    let index = 0;
    let cancelled = false;
    let timeoutId = null;

    const tick = () => {
      if (cancelled) return;

      index += 1;
      setDisplayed(content.slice(0, index));

      if (index >= content.length) {
        onCompleteRef.current?.();
        return;
      }

      const char = content[index - 1];
      let delay = 14;
      if (char === "\n") delay = 48;
      else if (char === ".") delay = 120;
      else if (char === "," || char === ";") delay = 70;
      else if (char === " ") delay = 10;
      else delay += Math.random() * 18;

      timeoutId = window.setTimeout(tick, delay);
    };

    timeoutId = window.setTimeout(tick, 120);

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [content, animate]);

  return (
    <ReactMarkdown>{displayed}</ReactMarkdown>
  );
}
