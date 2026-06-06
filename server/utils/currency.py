import os
from functools import lru_cache

import requests
from dotenv import load_dotenv

load_dotenv()

FALLBACK_CURRENCIES = [
    {"iso_code": "USD", "name": "US Dollar"},
    {"iso_code": "EUR", "name": "Euro"},
    {"iso_code": "GBP", "name": "Pound Sterling"},
    {"iso_code": "JPY", "name": "Japanese Yen"},
    {"iso_code": "CAD", "name": "Canadian Dollar"},
    {"iso_code": "AUD", "name": "Australian Dollar"},
    {"iso_code": "CHF", "name": "Swiss Franc"},
    {"iso_code": "CNY", "name": "Chinese Yuan"},
    {"iso_code": "INR", "name": "Indian Rupee"},
    {"iso_code": "BRL", "name": "Brazilian Real"},
]


def _normalize_supported_currencies(payload):
    currencies = []

    # Some providers return a list of objects, others return a code->name map.
    if isinstance(payload, list):
        for item in payload:
            if not isinstance(item, dict):
                continue
            code = item.get("iso_code")
            name = item.get("name")
            if isinstance(code, str) and isinstance(name, str):
                code = code.strip().upper()
                name = name.strip()
                if len(code) == 3 and name:
                    currencies.append({"iso_code": code, "name": name})

    elif isinstance(payload, dict):
        for code, name in payload.items():
            if isinstance(code, str) and isinstance(name, str):
                normalized_code = code.strip().upper()
                normalized_name = name.strip()
                if len(normalized_code) == 3 and normalized_name:
                    currencies.append({"iso_code": normalized_code, "name": normalized_name})

    unique_by_code = {item["iso_code"]: item for item in currencies}
    return sorted(unique_by_code.values(), key=lambda item: item["iso_code"])


@lru_cache(maxsize=1)
def get_supported_currencies():
    endpoint = os.getenv("currency_list_endpoint")
    if endpoint:
        try:
            response = requests.get(endpoint, timeout=10)
            response.raise_for_status()
            currencies = _normalize_supported_currencies(response.json())
            if currencies:
                return currencies
        except requests.RequestException:
            pass
        except ValueError:
            # Invalid JSON payload from provider.
            pass

    return FALLBACK_CURRENCIES


def get_supported_currency_codes():
    return {item["iso_code"].upper() for item in get_supported_currencies()}