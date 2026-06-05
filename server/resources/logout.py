from flask import jsonify, make_response
from flask_restful import Resource
from flask_jwt_extended import unset_jwt_cookies


class Logout(Resource):
    """Resource for logging out and clearing JWT cookies."""

    def post(self):
        response = make_response(jsonify({"message": "Logged out"}), 200)
        unset_jwt_cookies(response)
        return response
