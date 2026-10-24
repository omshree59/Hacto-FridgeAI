import json
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
import httpx
from pydantic import ValidationError
from backend.app.core.config import settings
from backend.app.schemas.ai import AIScanResult, AIDetectedItem, VALID_CATEGORIES
from backend.app.utils.normalization import normalize_ingredient_name, infer_category, normalize_unit

logger = logging.getLogger(__name__)

VISION_PROMPT_TEMPLATE = """You are FridgeFlow AI, an expert computer vision grocery identification system.
Analyze the provided image of a {scan_type} and identify all clearly visible grocery items, produce, drinks, condiments, and food products.

STRICT ACCURACY RULES:
1. ONLY list items that are directly visible in the image.
2. DO NOT guess or fabricate what is inside closed opaque containers, boxes, or drawers.
3. If an item is partially visible or occluded, set "needs_review": true and record what is visible in "visible_attributes".
4. If you cannot estimate quantity with high certainty, set "quantity_estimate": null and "unit": null. NEVER fabricate precise numbers.
5. If confidence in the identification is lower, set "confidence_level": "medium" or "low" and "needs_review": true.
6. Allowed categories: vegetables, fruits, dairy, meat and seafood, eggs, beverages, grains and bread, frozen food, condiments, snacks, other.
7. Any items you cannot distinguish reliably should be listed in "uncertain_observations" rather than declared as confirmed items.
8. NEVER claim food freshness, expiry date, or safety from a photograph alone.

Return ONLY a valid JSON object matching this schema:
{{
  "scan_type": "{scan_type}",
  "items": [
    {{
      "name": "ingredient name (e.g. tomato, whole milk, cheddar cheese)",
      "category": "one of the allowed categories",
      "quantity_estimate": 2.0,
      "unit": "pcs",
      "confidence_level": "high",
      "visible_attributes": ["red", "on top shelf"],
      "needs_review": false
    }}
  ],
  "uncertain_observations": [
    "unidentified dark bottle on second door shelf"
  ]
}}
"""


class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.vision_model = settings.OLLAMA_VISION_MODEL
        self.text_model = settings.OLLAMA_TEXT_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    async def check_health(self) -> Dict[str, Any]:
        """Checks if Ollama service is reachable and fetches installed models."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    
                    vision_available = any(self.vision_model in m for m in models)
                    text_available = any(self.text_model in m for m in models)

                    return {
                        "connected": True,
                        "status": "online",
                        "base_url": self.base_url,
                        "configured_vision_model": self.vision_model,
                        "configured_text_model": self.text_model,
                        "vision_model_installed": vision_available,
                        "text_model_installed": text_available,
                        "installed_models": models,
                        "error": None
                    }
                else:
                    return {
                        "connected": False,
                        "status": "error",
                        "base_url": self.base_url,
                        "configured_vision_model": self.vision_model,
                        "configured_text_model": self.text_model,
                        "vision_model_installed": False,
                        "text_model_installed": False,
                        "installed_models": [],
                        "error": f"Ollama returned HTTP status {res.status_code}"
                    }
        except httpx.ConnectError:
            return {
                "connected": False,
                "status": "unreachable",
                "base_url": self.base_url,
                "configured_vision_model": self.vision_model,
                "configured_text_model": self.text_model,
                "vision_model_installed": False,
                "text_model_installed": False,
                "installed_models": [],
                "error": f"Could not connect to Ollama at {self.base_url}. Make sure Ollama is running ('ollama serve')."
            }
        except Exception as e:
            return {
                "connected": False,
                "status": "error",
                "base_url": self.base_url,
                "configured_vision_model": self.vision_model,
                "configured_text_model": self.text_model,
                "vision_model_installed": False,
                "text_model_installed": False,
                "installed_models": [],
                "error": str(e)
            }

    async def verify_model_capability(self, model_name: str) -> Dict[str, Any]:
        """Queries model details from Ollama to inspect architecture and capabilities."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/show",
                    json={"name": model_name}
                )
                if res.status_code == 200:
                    data = res.json()
                    details = data.get("details", {})
                    family = details.get("family", "").lower()
                    families = [f.lower() for f in details.get("families", [])]
                    
                    # Known vision-supporting families in Ollama
                    vision_indicators = [
                        "clip", "mllama", "vision", "gemma3", "llava", "moondream", "minicpm-v"
                    ]
                    
                    modelfile = data.get("modelfile", "").lower()
                    has_vision = (
                        any(vi in family for vi in vision_indicators) or
                        any(any(vi in f for vi in vision_indicators) for f in families) or
                        "clip" in modelfile or
                        "vision" in model_name.lower() or
                        "gemma3" in model_name.lower() or
                        "llava" in model_name.lower()
                    )

                    return {
                        "model": model_name,
                        "supports_vision": has_vision,
                        "family": family,
                        "details": details,
                        "verified": True
                    }
                return {
                    "model": model_name,
                    "supports_vision": False,
                    "error": f"Model {model_name} not found in Ollama",
                    "verified": False
                }
        except Exception as e:
            return {
                "model": model_name,
                "supports_vision": True,  # Fallback optimistic if Ollama show endpoint is unavailable
                "error": str(e),
                "verified": False
            }

    async def analyze_fridge_image(
        self,
        base64_image: str,
        scan_type: str = "full_fridge",
        custom_notes: Optional[str] = None
    ) -> Tuple[AIScanResult, str]:
        """
        Sends image and prompt to Ollama local vision model and validates structured JSON output.
        Returns: (validated_result, raw_response_text)
        """
        # First ensure Ollama is accessible
        health = await self.check_health()
        if not health["connected"]:
            raise RuntimeError(
                f"Ollama local AI is offline or unreachable at {self.base_url}. "
                "Please start Ollama using 'ollama serve' and verify it is running."
            )

        prompt = VISION_PROMPT_TEMPLATE.format(scan_type=scan_type)
        if custom_notes:
            prompt += f"\nUser additional scan note: {custom_notes}\n"

        payload = {
            "model": self.vision_model,
            "prompt": prompt,
            "images": [base64_image],
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,  # Low temperature for reliable factual output
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                
                if res.status_code == 404:
                    raise RuntimeError(
                        f"Model '{self.vision_model}' is not pulled in Ollama. "
                        f"Please run 'ollama run {self.vision_model}' or 'ollama pull {self.vision_model}' to download it."
                    )
                
                if res.status_code != 200:
                    raise RuntimeError(
                        f"Ollama inference failed with status {res.status_code}: {res.text}"
                    )

                data = res.json()
                raw_response = data.get("response", "").strip()

        except httpx.TimeoutException as exc:
            raise TimeoutError(
                f"Local AI inference timed out after {self.timeout} seconds. "
                "If running on a CPU-only system, consider using a smaller vision model "
                "or increasing OLLAMA_TIMEOUT_SECONDS."
            ) from exc

        # Parse and validate JSON response
        result = self._parse_and_validate_json(raw_response, scan_type)
        return result, raw_response

    def _parse_and_validate_json(self, raw_text: str, scan_type: str) -> AIScanResult:
        """Parses model response text into validated AIScanResult schema."""
        parsed_data = None
        
        # 1. Direct JSON parse
        try:
            parsed_data = json.loads(raw_text)
        except json.JSONDecodeError:
            # 2. Extract ```json ... ``` codeblock
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
            if match:
                try:
                    parsed_data = json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass

        # 3. Extract outermost curly braces
        if parsed_data is None:
            first_brace = raw_text.find("{")
            last_brace = raw_text.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                try:
                    parsed_data = json.loads(raw_text[first_brace:last_brace + 1])
                except json.JSONDecodeError:
                    pass

        if not parsed_data or not isinstance(parsed_data, dict):
            raise ValueError(
                f"AI model did not return a valid JSON structure. Raw response snippet: {raw_text[:200]}"
            )

        # Ensure scan_type is populated
        if "scan_type" not in parsed_data:
            parsed_data["scan_type"] = scan_type

        # Validate with Pydantic
        try:
            result = AIScanResult.model_validate(parsed_data)
        except ValidationError as e:
            # Attempt best-effort normalization if minor structure error
            items = []
            raw_items = parsed_data.get("items", [])
            if isinstance(raw_items, list):
                for item in raw_items:
                    if isinstance(item, dict) and "name" in item:
                        name = str(item.get("name", "")).strip()
                        if not name:
                            continue
                        cat = str(item.get("category", "other")).lower()
                        if cat not in VALID_CATEGORIES:
                            cat = infer_category(name, fallback_category="other")
                        
                        qty = item.get("quantity_estimate")
                        if qty is not None:
                            try:
                                qty = float(qty)
                            except (ValueError, TypeError):
                                qty = None

                        unit = normalize_unit(item.get("unit"))
                        conf = str(item.get("confidence_level", "medium")).lower()
                        if conf not in ("high", "medium", "low"):
                            conf = "medium"

                        items.append(AIDetectedItem(
                            name=normalize_ingredient_name(name),
                            category=cat,
                            quantity_estimate=qty,
                            unit=unit,
                            confidence_level=conf,  # type: ignore
                            visible_attributes=item.get("visible_attributes", []) if isinstance(item.get("visible_attributes"), list) else [],
                            needs_review=bool(item.get("needs_review", False)) or conf != "high"
                        ))
            
            result = AIScanResult(
                scan_type=scan_type,
                items=items,
                uncertain_observations=parsed_data.get("uncertain_observations", [])
            )

        # Normalize item names and categories deterministically
        for item in result.items:
            item.name = normalize_ingredient_name(item.name)
            if item.category not in VALID_CATEGORIES or item.category == "other":
                item.category = infer_category(item.name, fallback_category="other")
            item.unit = normalize_unit(item.unit)
            if item.confidence_level != "high":
                item.needs_review = True

        return result


ollama_service = OllamaService()
