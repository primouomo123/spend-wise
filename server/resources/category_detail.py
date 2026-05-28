from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Category, CategorySchema, CreateCategorySchema, UpdateCategorySchema
from config import db

class CategoryDetail(Resource):
    """Resource for managing a single category."""
    @jwt_required()
    def get(self, id):
        user_id = get_jwt_identity()
        category = Category.query.filter_by(id=id, user_id=user_id).first()
        if category:
            return make_response(jsonify(CategorySchema().dump(category)), 200)
        else:
            return make_response(jsonify({"error": "Category not found"}), 404)
    
    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()
        category = Category.query.filter_by(id=id, user_id=user_id).first()
        if not category:
            return make_response(jsonify({"error": "Category not found"}), 404)
        
        request_json = request.get_json()

        if not request_json:
            return make_response(jsonify({"error": "No input data provided"}), 400)
        
        patch_data = UpdateCategorySchema().load(request_json, partial=True)

        for key, value in patch_data.items():
            setattr(category, key, value)
        
        try:
            db.session.commit()
            return make_response(jsonify(CategorySchema().dump(category)), 200)
        except ValidationError as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Internal server error"}), 400)
        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Category name must be unique per user"}), 400)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Internal server error"}), 500)
    
    @jwt_required()
    def delete(self, id):
        user_id = get_jwt_identity()
        category = Category.query.filter_by(id=id, user_id=user_id).first()
        if not category:
            return make_response(jsonify({"error": "Category not found"}), 404)
        
        db.session.delete(category)
        db.session.commit()
        return make_response(jsonify({}), 204)