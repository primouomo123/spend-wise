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
            return_category = (db.session.query(Category.id.label('id'), Category.name.label('name'))
                                                .filter_by(id=category.id)).first()
            return make_response(jsonify({'id': return_category.id, 'name': return_category.name}), 200)
        else:
            return make_response(jsonify({"error": "Category not found"}), 404)
    
    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()
        category = Category.query.filter_by(id=id, user_id=user_id).first()
        if not category:
            return make_response(jsonify({"error": "Category not found"}), 404)
        
        if category.name == "income":
            return make_response(jsonify({"error": "Cannot modify the default 'income' category"}), 400)
        
        request_json = request.get_json()

        if not request_json:
            return make_response(jsonify({"error": "No input data provided"}), 400)
        
        try:
            patch_data = UpdateCategorySchema().load(request_json, partial=True)
        except ValidationError as err:
            return make_response(jsonify({"error": "Validation error", "details": err.messages}), 400)

        for key, value in patch_data.items():
            setattr(category, key, value)
        
        try:
            db.session.commit()
            return_category = (db.session.query(Category.id.label('id'), Category.name.label('name'))
                                                .filter_by(id=category.id)).first()
            return make_response(jsonify({'id': return_category.id, 'name': return_category.name}), 200)
        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Category name must be unique per user"}), 400)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Internal server error", "details": str(e)}), 500)
    
    @jwt_required()
    def delete(self, id):
        user_id = get_jwt_identity()
        category = Category.query.filter_by(id=id, user_id=user_id).first()
        if not category:
            return make_response(jsonify({"error": "Category not found"}), 404)
        
        if category.name == "income":
            return make_response(jsonify({"error": "Cannot delete the default 'income' category"}), 400)
        
        db.session.delete(category)
        
        try:
            db.session.commit()
            return make_response(jsonify({}), 204)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Internal server error", "details": str(e)}), 500)