from flask import jsonify, make_response
from flask_restful import Resource
from flask_jwt_extended import get_jwt_identity

from models import User, UserSchema

class WhoAmI(Resource):
    """Resource to get the current logged-in user's information."""
    def get(self):
        try:
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if user:
                schema = UserSchema()
                return make_response(jsonify({'user': schema.dump(user)}), 200)
            else:
                return make_response(jsonify({'error': 'User not found'}), 404)
        except Exception as e:
            return make_response(jsonify({'error': 'An error occurred while fetching user information'}), 500)