import pytest
from backend.app.services.ollama_service import OllamaService


def test_parse_valid_ai_json():
    service = OllamaService()
    valid_json = """
    {
      "scan_type": "full_fridge",
      "items": [
        {
          "name": "tomatoes",
          "category": "vegetables",
          "quantity_estimate": 4.0,
          "unit": "pieces",
          "confidence_level": "high",
          "visible_attributes": ["red", "fresh"],
          "needs_review": false
        },
        {
          "name": "milk carton",
          "category": "dairy",
          "quantity_estimate": null,
          "unit": null,
          "confidence_level": "medium",
          "visible_attributes": ["partially occluded"],
          "needs_review": true
        }
      ],
      "uncertain_observations": ["unidentified container on bottom shelf"]
    }
    """
    res = service._parse_and_validate_json(valid_json, "full_fridge")
    assert res.scan_type == "full_fridge"
    assert len(res.items) == 2
    assert res.items[0].name == "tomato"  # normalized
    assert res.items[0].category == "vegetables"
    assert res.items[0].quantity_estimate == 4.0
    assert res.items[0].unit == "pcs"  # normalized
    assert res.items[0].confidence_level == "high"

    # Second item with unknown quantity
    assert res.items[1].quantity_estimate is None
    assert res.items[1].unit is None
    assert res.items[1].needs_review is True
    assert len(res.uncertain_observations) == 1


def test_parse_markdown_wrapped_ai_json():
    service = OllamaService()
    wrapped_json = """
    Here is what I found in your fridge:
    ```json
    {
      "scan_type": "full_fridge",
      "items": [
        {
          "name": "cheddar cheese",
          "category": "dairy",
          "quantity_estimate": 1.0,
          "unit": "pack",
          "confidence_level": "high",
          "visible_attributes": ["yellow block"],
          "needs_review": false
        }
      ],
      "uncertain_observations": []
    }
    ```
    I hope this helps!
    """
    res = service._parse_and_validate_json(wrapped_json, "full_fridge")
    assert len(res.items) == 1
    assert res.items[0].name == "cheddar cheese"


def test_parse_invalid_ai_output_fails_gracefully():
    service = OllamaService()
    garbage = "I am an AI and I cannot identify this image."
    with pytest.raises(ValueError):
        service._parse_and_validate_json(garbage, "full_fridge")
