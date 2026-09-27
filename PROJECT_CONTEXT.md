# OpenScan AI — Project Context

## Purpose

OpenScan AI is a research-and-education-only FastAPI service for explainable 2D chest X-ray analysis. It is **not** a medical device and must not be used for diagnosis, triage, or treatment decisions.

## Phase 1 delivered

- FastAPI API with `POST /predict/explain` and `GET /health`
- Docker setup, dependency list, tests, MIT license, and Git LFS configuration
- Captum Layer Grad-CAM heatmaps encoded as base64 PNG in every prediction response
- Modular request routing through `organ`, `modality`, and `task`

## Supported API modes

All predictions use `organ=lung` and `modality=xray`.

- `task=thoracic` (default): TorchXRayVision pretrained `densenet121-res224-all` model. Returns the model's supported thoracic findings, including pneumonia, lung opacity, pleural effusion, pneumothorax, edema, and cardiomegaly.
- `task=tuberculosis`: custom TorchXRayVision DenseNet-121 model fine-tuned for binary TB classification. Checkpoint: `models/tb_xray.pt`.

## TB model training record

- Base model: TorchXRayVision `densenet121-res224-all`
- Fine-tuning: classifier layer replaced with one binary TB output; pretrained feature extractor frozen
- Training data: Shenzhen NLM TB dataset, 662 images
- Split: 529 train / 133 validation, stratified, seed 42
- External test data: Montgomery NLM TB dataset, 138 images
- Validation threshold selection: 0.465, selected using Shenzhen validation balanced accuracy only
- Best validation AUC: 0.886
- Montgomery external-test AUC: 0.884
- Montgomery external-test metrics at threshold 0.465: accuracy 0.761, sensitivity 0.448, specificity 0.988, balanced accuracy 0.718

## Important limitations

- The TB model misses too many positive cases at its selected threshold. It is a research baseline only.
- The generic thoracic model is not a validated COVID-19 or TB model.
- The generic model's `Fracture` output concerns chest X-rays; it is not an upper-extremity fracture model.
- No clinical validation, calibration study, demographic analysis, prospective evaluation, or regulatory clearance has been performed.

## Run locally

```bash
pip install -r requirements.txt
uvicorn openscan.main:app --app-dir src --reload
```

Example TB request:

```bash
curl -X POST http://localhost:8000/predict/explain \
  -F organ=lung \
  -F modality=xray \
  -F task=tuberculosis \
  -F image=@chest-xray.png
```

## Key files

- `src/openscan/main.py`: FastAPI routes and validation
- `src/openscan/service.py`: preprocessing, model loading, inference, and Grad-CAM
- `src/openscan/catalog.py`: supported model routes
- `models/tb_xray.pt`: trained TB checkpoint
- `README.md`: setup and API overview

## Recommended next work

1. Improve TB sensitivity with more diverse, independently sourced data and careful validation.
2. Train a separate upper-extremity abnormality/fracture model using MURA or a fracture-specific dataset.
3. Add a properly validated COVID-19 model if it remains in scope.
4. Add automated API tests using model fixtures and a reproducible training notebook.
5. Add authentication, rate limits, upload-size limits, and audit logging before any wider research deployment.
