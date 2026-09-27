import os
import sys

# Configure UTF-8 for Windows console & subprocesses
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["TQDM_ASCII"] = "true"
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    if hasattr(sys.stderr, "reconfigure"):
        try:
            sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from .catalog import MODEL_CATALOG
from .schemas import (
    ConditionScore,
    ExplainResponse,
    ChatRequest,
    ChatResponse,
)
from .service import InferenceService
from .chat_engine import generate_initial_summary, generate_conversational_response

app = FastAPI(
    title="OpenScan AI - Conversational Medical Vision API",
    version="0.2.0",
    description="Explainable chest X-ray deep learning analysis and conversational AI chatbot."
)

# Enable CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

service = InferenceService()
DISCLAIMER = "Research and education only. This output is not a medical diagnosis and must not guide patient care."


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "openscan-ai", "version": "0.2.0"}


@app.post("/predict/explain", response_model=ExplainResponse)
@app.post("/api/analyze-image", response_model=ExplainResponse)
async def predict_explain(
    organ: str = Form("lung"),
    modality: str = Form("xray"),
    image: UploadFile = File(...),
    task: str = Form("thoracic"),
) -> ExplainResponse:
    key = (organ.lower(), modality.lower(), task.lower())
    if key not in MODEL_CATALOG:
        raise HTTPException(
            status_code=422,
            detail=f"Supported tasks: lung/xray thoracic and tuberculosis. Received {key}"
        )
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload an image file.")

    try:
        image_bytes = await image.read()
        result = service.explain(*key, image_bytes)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    scores = result["scores"]
    decision_threshold = result["decision_threshold"]
    
    detected = [
        ConditionScore(condition=name, confidence=score)
        for name, score in scores.items()
        if score >= decision_threshold
    ]

    initial_summary = generate_initial_summary(
        task=key[2],
        detected_conditions=[d.model_dump() for d in detected],
        confidence_scores=scores
    )

    return ExplainResponse(
        organ=key[0],
        modality=key[1],
        task=key[2],
        detected_conditions=detected,
        confidence_scores=scores,
        processing_time_ms=result["processing_time_ms"],
        decision_threshold=decision_threshold,
        heatmap_base64=result["heatmap"],
        model_version=result["spec"].model_version,
        disclaimer=DISCLAIMER,
        initial_summary=initial_summary,
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest) -> ChatResponse:
    try:
        history_list = [h.model_dump() for h in request.history] if request.history else []
        image_context_dict = request.image_context.model_dump()
        
        reply = await generate_conversational_response(
            query=request.query,
            image_context=image_context_dict,
            history=history_list
        )
        return ChatResponse(
            session_id=request.session_id,
            response=reply,
            disclaimer=DISCLAIMER
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversational generation error: {str(exc)}") from exc
