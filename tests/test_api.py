from fastapi.testclient import TestClient

from openscan.main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_rejects_unknown_route() -> None:
    response = client.post(
        "/predict/explain",
        data={"organ": "brain", "modality": "xray"},
        files={"image": ("image.png", b"not-an-image", "image/png")},
    )
    assert response.status_code == 422


def test_requires_image_upload() -> None:
    response = client.post(
        "/predict/explain",
        data={"organ": "lung", "modality": "xray"},
        files={"image": ("image.txt", b"not-an-image", "text/plain")},
    )
    assert response.status_code == 415
