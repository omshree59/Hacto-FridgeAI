from backend.app.utils.normalization import (
    normalize_ingredient_name,
    infer_category,
    normalize_unit,
)


def test_normalize_ingredient_names():
    # Plural handling
    assert normalize_ingredient_name("tomatoes") == "tomato"
    assert normalize_ingredient_name("Tomatoes") == "tomato"
    assert normalize_ingredient_name("apples") == "apple"
    assert normalize_ingredient_name("strawberries") == "strawberry"
    assert normalize_ingredient_name("potatoes") == "potato"
    assert normalize_ingredient_name("carrots") == "carrot"

    # Distinct items preservation
    assert normalize_ingredient_name("milk") == "milk"
    assert normalize_ingredient_name("oat milk") == "oat milk"
    assert normalize_ingredient_name("almond milk") == "almond milk"
    assert normalize_ingredient_name("sweet potato") == "sweet potato"
    assert normalize_ingredient_name("sour cream") == "sour cream"


def test_normalize_units():
    assert normalize_unit("liters") == "L"
    assert normalize_unit("l") == "L"
    assert normalize_unit("grams") == "g"
    assert normalize_unit("kg") == "kg"
    assert normalize_unit("kilograms") == "kg"
    assert normalize_unit("pieces") == "pcs"
    assert normalize_unit("cartons") == "carton"
    assert normalize_unit(None) is None


def test_infer_category():
    assert infer_category("tomato") == "vegetables"
    assert infer_category("apple") == "fruits"
    assert infer_category("whole milk") == "dairy"
    assert infer_category("chicken breast") == "meat and seafood"
    assert infer_category("eggs") == "eggs"
    assert infer_category("orange juice") == "beverages"
    assert infer_category("unknown mystery item") == "other"
