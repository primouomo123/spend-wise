from flask import jsonify
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token

class TokenRefresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        identity = get_jwt_identity()
        new_access_token = create_access_token(identity=identity)
        return jsonify(access_token=new_access_token), 200