from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Budget, BudgetSchema, UpdateBudgetSchema, Category
from config import db
from utils import get_exchange_rate, TRANSACTION_TYPES

from decimal import Decimal, ROUND_HALF_UP

class BudgetDetail(Resource):
    """Resource for retrieving, updating, and deleting a specific budget."""

    @jwt_required()
    def get(self, id):
        user_id = get_jwt_identity()

        budget = Budget.query.filter_by(id=id, user_id=user_id).first()

        if not budget:
            return make_response(jsonify({"error": "Budget not found"}), 404)
        
        return_budget = (
            db.session.query(Budget.id.label('id'),
                             Category.name.label('category_name'),
                             Budget.amount.label('amount'),
                             Budget.month.label('month'),
                             Budget.year.label('year'))
            .join(Category, Budget.category_id == Category.id)
            .filter(Budget.id == budget.id)
            .first()
        )
        
        return make_response(jsonify({
            "id": return_budget.id,
            "category_name": return_budget.category_name,
            "amount": str(return_budget.amount),
            "month": return_budget.month,
            "year": return_budget.year
        }), 200)
        
    
    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()

        budget = Budget.query.filter_by(id=id, user_id=user_id).first()
        if not budget:
            return make_response(jsonify({"error": "Budget not found"}), 404)

        request_json = request.get_json()
        if not request_json:
            return make_response(jsonify({"error": "No input data provided"}), 400)
        
        category_name = request_json.get("category_name")
        if category_name:
            category = Category.query.filter_by(name=category_name, user_id=user_id).first()
            if not category:
                return make_response(jsonify({"error": "Category not found"}), 404)
        
        else:
            category = Category.query.filter_by(id=budget.category_id, user_id=user_id).first()
            if not category:
                return make_response(jsonify({"error": "Category not found"}), 404)
            
            request_json["category_id"] = category.id
            request_json.pop("category_name", None)

        try:
            patch_data = UpdateBudgetSchema().load(request_json, partial=True)
        except ValidationError as err:
            return make_response(
                jsonify({"error": "Validation error", "details": err.messages}),
                400
            )

        for key, value in patch_data.items():
            setattr(budget, key, value)
        
        try:
            db.session.commit()
            return_budget = (
                db.session.query(Budget.id.label('id'),
                                 Category.name.label('category_name'),
                                 Budget.amount.label('amount'),
                                 Budget.month.label('month'),
                                 Budget.year.label('year'))
                .join(Category, Budget.category_id == Category.id)
                .filter(Budget.id == budget.id)
                .first()
            )
            return make_response(jsonify({
                "id": return_budget.id,
                "category_name": return_budget.category_name,
                "amount": str(return_budget.amount),
                "month": return_budget.month,
                "year": return_budget.year
            }), 200)
        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Budget name must be unique per user"}), 400)
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Internal server error", "details": str(e)}), 500)
    

    @jwt_required()
    def delete(self, id):
        user_id = get_jwt_identity()

        budget = Budget.query.filter_by(id=id, user_id=user_id).first()
        if not budget:
            return make_response(jsonify({"error": "Budget not found"}), 404)

        try:
            db.session.delete(budget)
            db.session.commit()
            return make_response(jsonify({}), 200)
        
        except Exception as e:
            db.session.rollback()
            return make_response(jsonify({"error": "Internal server error", "details": str(e)}), 500)