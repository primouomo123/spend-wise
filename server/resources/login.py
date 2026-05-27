from flask import request, jsonify, make_response
from flask_restful import Resource
from flask_jwt_extended import create_access_token, create_refresh_token

from models import User, UserSchema

class Login(Resource):
    """Resource for user login and JWT token generation."""
    def post(self):
        username = request.json.get('username')
        password = request.json.get('password')

        if not username or not password:
            return make_response(jsonify({'error': 'Username and password are required'}), 400)
        
        username = username.strip().lower()
        
        try:
            user = User.query.filter_by(username=username).first()
            if user and user.authenticate(password):
                access_token = create_access_token(identity=str(user.id))
                refresh_token = create_refresh_token(identity=str(user.id))
                schema = UserSchema()
                return make_response(jsonify({
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'user': schema.dump(user)
                }), 200)
            else:
                return make_response(jsonify({'error': 'Invalid username or password'}), 401)
        except Exception as e:
            return make_response(jsonify({'error': 'An error occurred during login'}), 500)