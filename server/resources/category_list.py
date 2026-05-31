from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Category, CategorySchema, CreateCategorySchema, UpdateCategorySchema
from config import db

class CategoryList(Resource):
    """Resource for listing all categories and creating new categories."""
    @jwt_required()
    def get(self):
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id = get_jwt_identity()
        pagination = (db.session.query(Category.id.label('id'), Category.name.label('name'))
                      .filter_by(user_id=user_id)
                      .paginate(page=page, per_page=per_page, error_out=False))

        return make_response(jsonify({
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'total_pages': pagination.pages,
            'categories': [{'id': item.id, 'name': item.name} for item in pagination.items]
        }), 200)
    
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        request_json = request.get_json()

        if not request_json:
                return make_response(jsonify({"error": "No input data provided"}), 400)
        
        if Category.query.filter_by(name=request_json.get('name'), user_id=user_id).first():
                return make_response(jsonify({"error": "Category name must be unique per user"}), 400)
        
        try:
            schema = CreateCategorySchema()
            schema.context = {'user_id': user_id}
            new_category = schema.load(request_json)
            db.session.add(new_category)
            db.session.commit()
            return_category = (db.session.query(Category.id.label('id'), Category.name.label('name'))
                                                .filter_by(id=new_category.id)).first()
                               
            return make_response(jsonify({'id': return_category.id, 'name': return_category.name}), 201)
        except ValidationError as e:
            db.session.rollback()
            return make_response(jsonify({'error': e.messages}), 400)
        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Category name must be unique per user"}), 400)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Internal server error", "details": str(e)}), 500)