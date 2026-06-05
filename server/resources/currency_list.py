from flask_restful import Resource
from flask import jsonify, make_response
from flask_jwt_extended import jwt_required

from utils import get_supported_currencies

class CurrencyList(Resource):
    """Resource for listing all available currencies."""
    @jwt_required()
    def get(self):
        try:
            return make_response(jsonify(get_supported_currencies()), 200)
        except Exception as e:
            return make_response(jsonify({"error": str(e)}), 500)