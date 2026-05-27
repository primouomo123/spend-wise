from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token, create_refresh_token

from config import db
from models import User, UserSchema
from marshmallow import ValidationError

class Signup(Resource):
    """Resource for user signup"""

    def post(self):
        request_json = request.get_json()

        try:
            user = UserSchema().load(request_json)

            db.session.add(user)
            db.session.commit()

            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))

            return make_response(jsonify({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': UserSchema().dump(user)
            }), 201)

        except ValidationError as e:
            return make_response(jsonify({'errors': e.messages}), 400)

        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({'error': 'Username or email already exists'}), 400)