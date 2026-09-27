# OpenScan AI — Phase 1

OpenScan AI is an **educational and research-only** API for explainable 2D chest X-ray classification. It is not a medical device and must not be used for diagnosis, triage, or treatment decisions.

Phase 1 provides:

- `POST /predict/explain` for chest and upper-extremity X-rays
- modular routing by `organ` and `modality`
- a TorchXRayVision pretrained DenseNet baseline for thoracic findings
- Captum Layer Grad-CAM image overlays returned as base64 PNG
- Docker deployment and a small test suite

## Run locally

```bash
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
uvicorn openscan.main:app --app-dir src --reload
```

Send a multipart request with `image`, `organ=lung`, `modality=xray`, and the optional `task`:

```bash
curl -X POST http://localhost:8000/predict/explain -F organ=lung -F modality=xray -F task=tuberculosis -F image=@chest-xray.png
```

## Pretrained baseline

The default `task=thoracic` request downloads the `densenet121-res224-all` TorchXRayVision weights and caches them locally. This baseline returns its supported chest-X-ray findings, including pneumonia, lung opacity, fracture, and pleural effusion.

`task=tuberculosis` loads the included fine-tuned model. Its selected display threshold is `0.465`, based solely on Shenzhen validation data. It achieved an AUC of `0.884` on the held-out Montgomery dataset, but sensitivity was `0.448`; it is a research baseline only and must not guide care.

The API reports scores at or above 0.50 as detected conditions. This is a display threshold only—not a clinically validated decision threshold.

## Docker

```bash
docker build -t openscan-ai .
docker run --rm -p 8000:8000 -v ${PWD}/models:/app/models openscan-ai
```
