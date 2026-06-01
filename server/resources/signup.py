from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token

from config import db
from models import CreateUserSchema, Category
from marshmallow import ValidationError

class Signup(Resource):
    """Resource for user signup"""

    def post(self):
        request_json = request.get_json()

        if not request_json:
            return make_response(jsonify({'error': 'No input data provided'}), 400)

        try:
            user = CreateUserSchema().load(request_json)

            db.session.add(user)
            db.session.commit()

            access_token = create_access_token(identity=str(user.id))

            if user:
                category1 = Category(name='Income', user_id=user.id)
                category2 = Category(name='Food', user_id=user.id)
                category3 = Category(name='Rent', user_id=user.id)
                category4 = Category(name='Others', user_id=user.id)
                db.session.add_all([category1, category2, category3, category4])
                db.session.commit()

                if not category1 or not category2 or not category3 or not category4:
                    return make_response(jsonify({'error': 'Failed to create default categories'}), 500)

            return make_response(jsonify({
                'access_token': access_token,
                'user': CreateUserSchema().dump(user)
            }), 201)

        except ValidationError as e:
            db.session.rollback()
            return make_response(jsonify({'errors': e.messages}), 400)

        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({'error': 'Username or email already exists'}), 400)
        
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({'error': 'Internal server error'}), 500)