import re
from typing import Optional, Tuple

CATEGORY_MAPPINGS = {
    # Vegetables
    "vegetable": "vegetables",
    "vegetables": "vegetables",
    "tomato": "vegetables",
    "tomatoes": "vegetables",
    "cucumber": "vegetables",
    "cucumbers": "vegetables",
    "carrot": "vegetables",
    "carrots": "vegetables",
    "onion": "vegetables",
    "onions": "vegetables",
    "garlic": "vegetables",
    "lettuce": "vegetables",
    "spinach": "vegetables",
    "pepper": "vegetables",
    "peppers": "vegetables",
    "bell pepper": "vegetables",
    "bell peppers": "vegetables",
    "broccoli": "vegetables",
    "potato": "vegetables",
    "potatoes": "vegetables",
    "zucchini": "vegetables",
    "celery": "vegetables",
    "mushroom": "vegetables",
    "mushrooms": "vegetables",
    "cabbage": "vegetables",

    # Fruits
    "fruit": "fruits",
    "fruits": "fruits",
    "apple": "fruits",
    "apples": "fruits",
    "banana": "fruits",
    "bananas": "fruits",
    "orange": "fruits",
    "oranges": "fruits",
    "lemon": "fruits",
    "lemons": "fruits",
    "lime": "fruits",
    "limes": "fruits",
    "berry": "fruits",
    "berries": "fruits",
    "strawberry": "fruits",
    "strawberries": "fruits",
    "blueberry": "fruits",
    "blueberries": "fruits",
    "grape": "fruits",
    "grapes": "fruits",
    "avocado": "fruits",
    "avocados": "fruits",

    # Dairy & Eggs
    "dairy": "dairy",
    "milk": "dairy",
    "cheese": "dairy",
    "cheddar": "dairy",
    "parmesan": "dairy",
    "mozzarella": "dairy",
    "butter": "dairy",
    "yogurt": "dairy",
    "yoghurt": "dairy",
    "cream": "dairy",
    "sour cream": "dairy",
    "egg": "eggs",
    "eggs": "eggs",

    # Meat and Seafood
    "meat": "meat and seafood",
    "chicken": "meat and seafood",
    "beef": "meat and seafood",
    "pork": "meat and seafood",
    "fish": "meat and seafood",
    "salmon": "meat and seafood",
    "shrimp": "meat and seafood",
    "tuna": "meat and seafood",
    "bacon": "meat and seafood",
    "turkey": "meat and seafood",

    # Beverages
    "beverage": "beverages",
    "beverages": "beverages",
    "juice": "beverages",
    "orange juice": "beverages",
    "apple juice": "beverages",
    "soda": "beverages",
    "water": "beverages",
    "beer": "beverages",
    "wine": "beverages",
    "tea": "beverages",
    "coffee": "beverages",

    # Grains & Bread
    "bread": "grains and bread",
    "rice": "grains and bread",
    "pasta": "grains and bread",
    "tortilla": "grains and bread",
    "tortillas": "grains and bread",
    "flour": "grains and bread",
    "oats": "grains and bread",
    "cereal": "grains and bread",

    # Condiments
    "ketchup": "condiments",
    "mayo": "condiments",
    "mayonnaise": "condiments",
    "mustard": "condiments",
    "soy sauce": "condiments",
    "hot sauce": "condiments",
    "dressing": "condiments",
    "jam": "condiments",
    "peanut butter": "condiments",
    "salsa": "condiments",
    "pickle": "condiments",
    "pickles": "condiments",

    # Frozen
    "frozen": "frozen food",
    "ice cream": "frozen food",
    "frozen peas": "frozen food",
    "frozen berries": "frozen food",
    "frozen pizza": "frozen food",

    # Snacks
    "snack": "snacks",
    "chips": "snacks",
    "crackers": "snacks",
    "nuts": "snacks",
    "chocolate": "snacks",
}

UNIT_ALIASES = {
    "g": "g",
    "gram": "g",
    "grams": "g",
    "kg": "kg",
    "kilo": "kg",
    "kilos": "kg",
    "kilogram": "kg",
    "kilograms": "kg",
    "ml": "ml",
    "milliliter": "ml",
    "milliliters": "ml",
    "l": "L",
    "liter": "L",
    "liters": "L",
    "litre": "L",
    "litres": "L",
    "oz": "oz",
    "ounce": "oz",
    "ounces": "oz",
    "lb": "lb",
    "lbs": "lb",
    "pound": "lb",
    "pounds": "lb",
    "pc": "pcs",
    "pcs": "pcs",
    "piece": "pcs",
    "pieces": "pcs",
    "item": "pcs",
    "items": "pcs",
    "carton": "carton",
    "cartons": "carton",
    "bottle": "bottle",
    "bottles": "bottle",
    "can": "can",
    "cans": "can",
    "bunch": "bunch",
    "bunches": "bunch",
    "pack": "pack",
    "packs": "pack",
    "package": "pack",
    "packages": "pack",
    "bag": "bag",
    "bags": "bag",
    "cup": "cup",
    "cups": "cup",
    "tbsp": "tbsp",
    "tablespoon": "tbsp",
    "tablespoons": "tbsp",
    "tsp": "tsp",
    "teaspoon": "tsp",
    "teaspoons": "tsp",
}


def normalize_unit(unit: Optional[str]) -> Optional[str]:
    """Standardizes unit strings."""
    if not unit:
        return None
    cleaned = unit.strip().lower()
    return UNIT_ALIASES.get(cleaned, cleaned)


def normalize_ingredient_name(name: str) -> str:
    """
    Normalizes ingredient names:
    - Lowercase, trimmed
    - Handles plural endings: tomatoes -> tomato, apples -> apple, berries -> berry
    - Preserves vital distinctive modifiers: 'oat milk' != 'milk', 'sweet potato' != 'potato'
    """
    if not name:
        return ""
    
    cleaned = re.sub(r"[^\w\s-]", "", name.strip().lower())
    words = cleaned.split()
    if not words:
        return ""
    
    # Specific plural word rules for English grocery items
    last_word = words[-1]
    
    if last_word.endswith("berries"):
        stemmed = last_word[:-7] + "berry"
    elif last_word.endswith("tomatoes"):
        stemmed = "tomato"
    elif last_word.endswith("potatoes"):
        stemmed = "potato"
    elif last_word.endswith("es") and len(last_word) > 4 and last_word[-3] in ("s", "x", "z", "c", "h"):
        stemmed = last_word[:-2]
    elif last_word.endswith("ies") and len(last_word) > 4:
        stemmed = last_word[:-3] + "y"
    elif last_word.endswith("s") and not last_word.endswith("ss") and len(last_word) > 3:
        # e.g. apples -> apple, onions -> onion, carrots -> carrot
        # but keep words like 'hummus', 'couscous', 'citrus'
        if last_word not in ("hummus", "couscous", "citrus", "asparagus", "molasses"):
            stemmed = last_word[:-1]
        else:
            stemmed = last_word
    else:
        stemmed = last_word

    words[-1] = stemmed
    return " ".join(words)


def infer_category(name: str, fallback_category: str = "other") -> str:
    """Infers category from food name if recognized."""
    normalized = normalize_ingredient_name(name)
    
    # Direct match
    if normalized in CATEGORY_MAPPINGS:
        return CATEGORY_MAPPINGS[normalized]
    
    # Check parts of name
    for key, cat in CATEGORY_MAPPINGS.items():
        if f" {key}" in f" {normalized} ":
            return cat
            
    return fallback_category
