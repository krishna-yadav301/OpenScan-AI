const FASTAPI_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";

/**
 * Uploads an image to FastAPI for explainable inference
 */
export async function analyzeImage({ file, task = "thoracic", organ = "lung", modality = "xray" }) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("organ", organ);
  formData.append("modality", modality);
  formData.append("task", task);

  const response = await fetch(`${FASTAPI_BASE_URL}/api/analyze-image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = "Failed to analyze image";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = `Server responded with status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Sends a conversational query to the FastAPI chat endpoint
 */
export async function sendChatMessage({ sessionId, query, imageContext, history = [] }) {
  const payload = {
    session_id: sessionId,
    query,
    image_context: {
      task: imageContext?.task || "thoracic",
      organ: imageContext?.organ || "lung",
      modality: imageContext?.modality || "xray",
      detected_conditions: imageContext?.detected_conditions || [],
      confidence_scores: imageContext?.confidence_scores || {},
      decision_threshold: imageContext?.decision_threshold || 0.5,
    },
    history: history.map((msg) => ({
      sender: msg.sender,
      content: msg.content,
      created_at: msg.created_at,
    })),
  };

  const response = await fetch(`${FASTAPI_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Failed to generate chat response";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = `Server error ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Health check for FastAPI backend
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/health`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}
