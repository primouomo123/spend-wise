# utils/exchange_rate.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_exchange_rate(base_currency, target_currency):
    endpoint = os.getenv("exchange_rate_endpoint")
    if not endpoint:
        raise Exception("Exchange rate endpoint not configured")
    response = requests.get(f"{endpoint}/{base_currency}/{target_currency}")
    response.raise_for_status()
    data = response.json()
    return data.get("rate", {})