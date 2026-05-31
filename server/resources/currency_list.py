import os
import requests
from flask_restful import Resource
from flask import jsonify, make_response
from dotenv import load_dotenv

from flask_jwt_extended import jwt_required

load_dotenv()

class CurrencyList(Resource):
    """Resource for listing all available currencies."""
    @jwt_required()
    def get(self):
        endpoint = os.getenv("currency_list_endpoint")
        if not endpoint:
            return make_response(jsonify({"error": "Currency list endpoint not configured"}), 500)
        try:
            response = requests.get(endpoint)
            response.raise_for_status()
            data = response.json()
            filtered = [
                {"iso_code": c["iso_code"], "name": c["name"]}
                for c in data
                if "iso_code" in c and "name" in c
            ]
            return make_response(jsonify(filtered), 200)
        except Exception as e:
            return make_response(jsonify({"error": str(e)}), 500)