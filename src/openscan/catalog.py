from dataclasses import dataclass


@dataclass(frozen=True)
class ModelSpec:
    organ: str
    modality: str
    task: str
    architecture: str
    model_version: str
    checkpoint: str | None = None


MODEL_CATALOG: dict[tuple[str, str, str], ModelSpec] = {
    ("lung", "xray", "thoracic"): ModelSpec(
        organ="lung", modality="xray", task="thoracic",
        architecture="torchxrayvision_densenet121_all", model_version="xrv-densenet121-all",
    ),
    ("lung", "xray", "tuberculosis"): ModelSpec(
        organ="lung", modality="xray", task="tuberculosis",
        architecture="torchxrayvision_densenet121_tb_finetuned",
        model_version="tb-xrv-finetuned-v1", checkpoint="models/tb_xray.pt",
    ),
}
