from __future__ import annotations

import base64
import io
import time
from pathlib import Path

import numpy as np
import torch
import torchxrayvision as xrv
from captum.attr import LayerAttribution, LayerGradCam
from PIL import Image

from .catalog import MODEL_CATALOG, ModelSpec


class InferenceService:
    """TorchXRayVision inference with Captum Grad-CAM visual explanations."""

    def __init__(self) -> None:
        self._models: dict[tuple[str, str, str], tuple[torch.nn.Module, ModelSpec, float]] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def _load(self, spec: ModelSpec) -> tuple[torch.nn.Module, float]:
        key = (spec.organ, spec.modality, spec.task)
        if key not in self._models:
            if spec.task == "thoracic":
                # This public baseline is downloaded and cached by TorchXRayVision on first use.
                model = xrv.models.DenseNet(weights="densenet121-res224-all")
                threshold = 0.5
            elif spec.task == "tuberculosis":
                if not spec.checkpoint or not Path(spec.checkpoint).is_file():
                    raise FileNotFoundError("The tuberculosis checkpoint is unavailable.")
                # The locally trained checkpoint also stores evaluation metadata.
                checkpoint = torch.load(spec.checkpoint, map_location=self.device, weights_only=False)
                model = xrv.models.DenseNet()
                model.classifier = torch.nn.Linear(model.classifier.in_features, 1)
                model.load_state_dict(checkpoint["state_dict"])
                threshold = float(checkpoint["threshold"])
            else:
                raise ValueError(f"Unsupported task: {spec.task}")
            model.to(self.device).eval()
            self._models[key] = (model, spec, threshold)
        model, _, threshold = self._models[key]
        return model, threshold

    @staticmethod
    def _image(raw: bytes) -> Image.Image:
        try:
            return Image.open(io.BytesIO(raw)).convert("L")
        except Exception as exc:
            raise ValueError("Upload a valid PNG, JPEG, or other Pillow-supported image.") from exc

    @staticmethod
    def _prepare(image: Image.Image) -> torch.Tensor:
        pixels = np.asarray(image)
        pixels = xrv.utils.normalize(pixels, 255)
        if pixels.ndim == 2:
            pixels = pixels[None, ...]
        pixels = xrv.datasets.XRayCenterCrop()(pixels)
        pixels = xrv.datasets.XRayResizer(224)(pixels)
        return torch.from_numpy(pixels).unsqueeze(0).float()

    def explain(self, organ: str, modality: str, task: str, raw: bytes) -> dict:
        spec = MODEL_CATALOG[(organ, modality, task)]
        started = time.perf_counter()
        image = self._image(raw)
        tensor = self._prepare(image).to(self.device)
        model, threshold = self._load(spec)
        with torch.no_grad():
            # TorchXRayVision applies its published per-finding operating-point
            # normalization, so values are already scaled to the 0–1 range.
            scores_tensor = model(tensor)[0]
            probabilities = scores_tensor if spec.task == "thoracic" else torch.sigmoid(scores_tensor)
        target_index = int(torch.argmax(probabilities).item())
        cam = LayerGradCam(model, model.features.denseblock4).attribute(tensor, target=target_index)
        cam = LayerAttribution.interpolate(cam, (224, 224))[0].mean(0).detach().cpu().numpy()
        labels = model.pathologies if spec.task == "thoracic" else ["tuberculosis"]
        scores = {label.lower().replace(" ", "_"): round(float(probabilities[index]), 4) for index, label in enumerate(labels)}
        return {
            "spec": spec,
            "scores": scores,
            "heatmap": self._overlay(image, cam),
            "decision_threshold": threshold,
            "processing_time_ms": round((time.perf_counter() - started) * 1000, 2),
        }

    @staticmethod
    def _overlay(image: Image.Image, cam: np.ndarray) -> str:
        normalized = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        heat = np.zeros((224, 224, 3), dtype=np.uint8)
        heat[..., 0] = (255 * normalized).astype(np.uint8)
        heat[..., 1] = (180 * (1 - np.abs(normalized - .5) * 2)).astype(np.uint8)
        gray = np.asarray(image.resize((224, 224))).astype(np.float32)
        base = np.repeat(gray[..., None], 3, axis=2)
        rendered = Image.fromarray((base * .55 + heat * .45).astype(np.uint8))
        buffer = io.BytesIO()
        rendered.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("ascii")
