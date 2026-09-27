import os
import re
from typing import Any, Dict, List, Optional
# pyrefly: ignore [missing-import]
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

CONDITION_DESCRIPTIONS = {
    "tuberculosis": "An infectious disease caused by Mycobacterium tuberculosis, typically presenting with apical consolidations, cavitary lesions, or infiltrates.",
    "pneumonia": "Inflammation of the lung parenchyma commonly manifesting as localized or patchy opacity/consolidation on the radiograph.",
    "lung opacity": "An area of increased radiodensity in the lung field that obscures underlying lung architecture.",
    "pleural effusion": "Abnormal accumulation of fluid in the pleural cavity, usually presenting with blunting of the costophrenic angles.",
    "effusion": "Abnormal accumulation of fluid in the pleural space.",
    "pneumothorax": "Presence of air in the pleural space causing partial or complete lung collapse, marked by visible pleural line and absence of lung markings.",
    "atelectasis": "Volume loss and partial collapse of lung tissue, characterized by linear densities or shifting of mediastinal structures.",
    "consolidation": "Alveolar spaces filled with fluid/exudate rather than air, causing dense radiopaque patches.",
    "edema": "Fluid accumulation in the extravascular spaces of the lungs, often presenting with perihilar haziness and vascular engorgement.",
    "cardiomegaly": "Enlargement of the cardiac silhouette where the cardiothoracic ratio exceeds 0.50 on a PA view.",
    "infiltration": "Accumulation of foreign substances or cells in the lung tissue.",
    "nodule": "Small, well-defined focal lesion in the lung parenchyma.",
    "mass": "Large discrete lesion (>3cm) within the lung field requiring diagnostic evaluation.",
    "fibrosis": "Scarring and thickening of lung tissue leading to reticular patterns.",
    "emphysema": "Hyperinflation of the lungs with flattened diaphragms and increased retrosternal airspace.",
    "hernia": "Protrusion of abdominal contents through a diaphragmatic defect.",
    "pleural thickening": "Fibrous thickening along the pleural surfaces or chest wall apical caps.",
    "lung lesion": "Circumscribed or diffuse structural abnormality in the pulmonary field.",
    "fracture": "Discontinuity in the osseous chest structures (ribs, clavicles, or vertebrae).",
    "enlarged cardiomediastinum": "Widening of the mediastinal contour or cardiac outline."
}

HUMAN_CHAT_STYLE = """
Voice and formatting:
- Write like a thoughtful radiology colleague in a chat thread, not a formal report generator.
- Use natural contractions (I'm, that's, we're, didn't) and varied sentence length.
- Prefer short paragraphs (1–3 sentences). Use a simple bullet list only when the user asks for a breakdown or report.
- Avoid markdown headings (###) unless the user explicitly asks for a structured report.
- Do not open with filler like "Certainly!", "Great question!", "Absolutely!", or "As an AI model...".
- Stay grounded in the scan numbers you were given; if something is uncertain, say so plainly.
- End with a casual, optional follow-up invite (one short line), not a menu of capabilities.
- Mention once in plain language that this is research/educational support, not a diagnosis — woven into the reply, not as a legal disclaimer block.
"""


def generate_initial_summary(task: str, detected_conditions: List[Dict[str, Any]], confidence_scores: Dict[str, float]) -> str:
    """Generates an initial conversational breakdown of the image analysis."""
    task_label = task.replace("_", " ").lower()

    if not detected_conditions:
        sorted_top = sorted(confidence_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        top_bits = [
            f"{k.replace('_', ' ')} at {v*100:.1f}%"
            for k, v in sorted_top
            if v > 0.05
        ]
        top_sentence = (
            "The highest scores were " + ", ".join(top_bits) + "."
            if top_bits
            else "Nothing much stood out in the score list above noise level."
        )
        return (
            f"I've finished running this chest X-ray through the {task_label} model. "
            f"Nothing crossed the positive threshold we'd use for a flagged finding — "
            f"that's reassuring from the model's side, though it doesn't replace a full clinical read.\n\n"
            f"{top_sentence} The Grad-CAM overlay shows where the network was looking while it decided; "
            f"the warmer patches are just attention, not automatically a lesion.\n\n"
            f"Happy to walk through any score, the heatmap colors, or what you'd want to correlate on the image."
        )

    parts = []
    for cond in detected_conditions:
        name = cond.get("condition", "").replace("_", " ").title()
        conf = cond.get("confidence", 0) * 100
        desc = CONDITION_DESCRIPTIONS.get(
            cond.get("condition", "").lower(),
            "There's a pattern here that matched what the model was trained to pick up.",
        )
        parts.append(f"{name} ({conf:.1f}%) — {desc}")

    if len(parts) == 1:
        findings_block = f"The main thing that stood out was {parts[0]}"
    else:
        joined = "; ".join(parts[:-1])
        findings_block = f"A few patterns crossed the threshold: {joined}; and {parts[-1]}"

    return (
        f"Okay — I've gone through this {task_label} scan. {findings_block}.\n\n"
        f"The Grad-CAM heatmap lines up with the regions that pushed those scores — "
        f"warmer reds/yellows mean the model leaned on those areas, cooler blues/greens less so.\n\n"
        f"This is model output for learning and research, not a clinical diagnosis. "
        f"What would you like to dig into first — a specific finding, the heatmap, or how confident the model is?"
    )

async def generate_conversational_response(
    query: str,
    image_context: Dict[str, Any],
    history: Optional[List[Dict[str, str]]] = None
) -> str:
    """Answers user questions contextually using Groq LLM (with fallback to internal reasoning)."""
    # 1. Try Groq Llama-3.3-70b
    groq_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if groq_key:
        try:
            return await _query_groq(query, image_context, history, groq_key)
        except Exception as err:
            print(f"Groq API call warning: {err}, trying OpenAI or local engine")

    # 2. Try OpenAI if configured
    openai_key = os.getenv("OPENAI_API_KEY", OPENAI_API_KEY)
    if openai_key:
        try:
            return await _query_openai(query, image_context, history, openai_key)
        except Exception as err:
            print(f"OpenAI API call warning: {err}, falling back to internal engine")

    # 3. Fallback to Local Medical Reasoning Engine
    return _local_reasoning(query, image_context)

async def _query_groq(
    query: str,
    image_context: Dict[str, Any],
    history: Optional[List[Dict[str, str]]],
    api_key: str
) -> str:
    task = image_context.get("task", "thoracic")
    detected = image_context.get("detected_conditions", [])
    scores = image_context.get("confidence_scores", {})
    threshold = image_context.get("decision_threshold", 0.5)

    detected_summary = ", ".join([
        f"{c.get('condition', '').replace('_', ' ').title()} ({c.get('confidence', 0)*100:.1f}%)"
        for c in detected
    ]) if detected else "None exceeding decision threshold"

    top_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:6]
    scores_str = ", ".join([f"{k.replace('_', ' ').title()}: {v*100:.1f}%" for k, v in top_scores])

    system_prompt = f"""You are OpenScan AI — a radiology-savvy teammate chatting about one chest X-ray analysis.
Stick to these model results (do not invent findings):
- Task: {task.title()}
- Decision threshold: {threshold}
- Positive detections: {detected_summary}
- Top scores: {scores_str}
- Grad-CAM: DenseNet-121 + Layer Grad-CAM. Warm red/yellow = strong model focus; cool blue/green = low influence / baseline lung.

{HUMAN_CHAT_STYLE}

When the user asks for a formal report, switch to a clear structured impression — still readable, not robotic legalese."""

    messages = [{"role": "system", "content": system_prompt}]

    if history:
        for msg in history[-8:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": query})

    models_to_try = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "llama-3.3-70b-versatile",
    ]

    for model_name in models_to_try:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model_name,
                        "messages": messages,
                        "temperature": 0.78,
                        "max_tokens": 900,
                        "top_p": 0.92
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
        except Exception:
            continue
    raise Exception("Groq models request unsuccessful")

async def _query_openai(
    query: str,
    image_context: Dict[str, Any],
    history: Optional[List[Dict[str, str]]],
    api_key: str
) -> str:
    system_prompt = (
        "You are OpenScan AI, chatting about one chest X-ray analysis. "
        "Use only this context — do not invent findings:\n"
        f"Task: {image_context.get('task')}\n"
        f"Detected conditions: {image_context.get('detected_conditions')}\n"
        f"Confidence scores: {image_context.get('confidence_scores')}\n"
        f"Decision threshold: {image_context.get('decision_threshold')}\n"
        f"{HUMAN_CHAT_STYLE}"
    )
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for msg in history[-6:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})
    messages.append({"role": "user", "content": query})

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.78, "top_p": 0.92}
        )
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    raise Exception("OpenAI API call failed")

def _local_reasoning(query: str, image_context: Dict[str, Any]) -> str:
    query_lower = query.lower().strip()
    detected = image_context.get("detected_conditions", [])
    scores = image_context.get("confidence_scores", {})
    task = image_context.get("task", "thoracic")
    threshold = image_context.get("decision_threshold", 0.5)

    if any(term in query_lower for term in ["heatmap", "highlight", "red", "yellow", "color", "grad-cam", "gradcam", "focus", "area"]):
        if detected:
            top_cond = detected[0].get("condition", "primary finding").replace("_", " ").title()
            return (
                f"On the Grad-CAM overlay, the warm reds and yellows are where the model leaned hardest — "
                f"for this scan that ties most closely to **{top_cond}**. "
                f"The cooler blue/green bits are basically background lung and anatomy it didn't weigh as much.\n\n"
                f"In practice those hot spots often sit over opacities, pleural edges, or whatever structural change "
                f"drove the score, but the colors are attention, not a drawn lesion outline."
            )
        return (
            "The heatmap here is mostly showing baseline lung and heart borders — nothing strong enough crossed "
            "the positive threshold, so the network's attention is spread more evenly rather than locked on one finding."
        )

    for condition_key, desc in CONDITION_DESCRIPTIONS.items():
        if condition_key in query_lower:
            conf = scores.get(condition_key.replace(" ", "_"), None)
            conf_str = (
                f" On this image the model landed around **{conf*100:.1f}%** for that label."
                if conf is not None
                else ""
            )
            return (
                f"**{condition_key.title()}** — {desc}{conf_str}\n\n"
                f"That's pattern-matching from the training data, so pair it with symptoms and the full clinical picture — "
                f"this chat is research support, not a final read."
            )

    if any(term in query_lower for term in ["score", "confidence", "threshold", "percentage", "probability", "accuracy"]):
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        score_lines = ", ".join([
            f"{k.replace('_', ' ')} {v*100:.1f}%{' (above threshold)' if v >= threshold else ''}"
            for k, v in sorted_scores[:5]
        ])
        return (
            f"We're using **{threshold}** as the display cutoff for calling something a positive hit. "
            f"The top scores on this scan were {score_lines}. "
            f"Higher numbers mean the visual features looked more like what the model learned for that label — "
            f"not a guaranteed diagnosis."
        )

    top_detected_str = (
        ", ".join([c.get("condition", "").replace("_", " ").title() for c in detected])
        if detected
        else "nothing above threshold"
    )
    return (
        f"On this {task.lower()} run the model's headline was **{top_detected_str}**. "
        f"I can unpack a specific finding, talk through the heatmap, or go line-by-line on the confidence scores — "
        f"just point me at what you care about."
    )
