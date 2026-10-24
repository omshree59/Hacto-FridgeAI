import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "FridgeFlow AI"


@patch("backend.app.services.ollama_service.OllamaService.check_health", new_callable=AsyncMock)
def test_ai_status_mocked(mock_health):
    mock_health.return_value = {
        "connected": True,
        "status": "online",
        "base_url": "http://localhost:11434",
        "configured_vision_model": "gemma3:4b",
        "configured_text_model": "gemma3:4b",
        "vision_model_installed": True,
        "text_model_installed": True,
        "installed_models": ["gemma3:4b", "llama3.2-vision:latest"],
        "error": None
    }

    with patch("backend.app.services.ollama_service.OllamaService.verify_model_capability", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = {
            "model": "gemma3:4b",
            "supports_vision": True,
            "family": "gemma3",
            "verified": True
        }
        res = client.get("/api/ai/status")
        assert res.status_code == 200
        data = res.json()
        assert data["connected"] is True
        assert data["vision_capability"]["supports_vision"] is True


def test_settings_endpoint():
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    assert data["project_name"] == "FridgeFlow AI"
    assert "gemma3:4b" in data["ollama_vision_model"]
