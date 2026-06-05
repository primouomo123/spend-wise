import os
from functools import lru_cache

import requests
from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def get_supported_currencies():
    endpoint = os.getenv("currency_list_endpoint")
    if not endpoint:
        raise Exception("Currency list endpoint not configured")

    response = requests.get(endpoint, timeout=10)
    response.raise_for_status()
    data = response.json()

    return [
        {"iso_code": item["iso_code"], "name": item["name"]}
        for item in data
        if "iso_code" in item and "name" in item
    ]


def get_supported_currency_codes():
    return {item["iso_code"].upper() for item in get_supported_currencies()}