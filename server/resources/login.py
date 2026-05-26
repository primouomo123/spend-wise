from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request

from config import app, db, api, jwt
from models import User, UserSchema
from marshmallow import ValidationError

class Login(Resource):
    """Resource for user login and JWT token generation."""
    def post(self):
        username = request.json.get('username')
        password = request.json.get('password')

        if not username or not password:
            return make_response(jsonify({'error': 'Username and password are required'}), 400)
        try:
            user = User.query.filter_by(username=username).first()
            if user and user.authenticate(password):
                token = create_access_token(identity=str(user.id))
                schema = UserSchema()
                return make_response(jsonify({
                    'token': token,
                    'user': schema.dump(user)
                }), 200)
            else:
                return make_response(jsonify({'error': 'Invalid username or password'}), 401)
        except Exception as e:
            return make_response(jsonify({'error': 'An error occurred during login'}), 500)