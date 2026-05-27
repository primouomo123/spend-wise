from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import Category, CategorySchema

class CategoryList(Resource):
    """Resource for listing all categories and creating new categories."""
    @jwt_required()
    def get(self):
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id = get_jwt_identity()
        pagination = Category.query.filter_by(user_id=user_id).paginate(page=page, per_page=per_page, error_out=False)

        return make_response(jsonify({
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'total_pages': pagination.pages,
            'categories': CategorySchema(many=True).dump(pagination.items)
        }), 200)
    
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        data = request.get_json()
        category_name = data.get('name')

        if not category_name:
            return make_response(jsonify({'error': 'Category name is required'}), 400)

        new_category = Category(name=category_name, user_id=user_id)
        db.session.add(new_category)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({'error': 'Category with this name already exists'}), 400)

        return make_response(jsonify(CategorySchema().dump(new_category)), 201)