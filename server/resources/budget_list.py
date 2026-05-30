from flask import request, jsonify, make_response
from datetime import datetime
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from sqlalchemy import extract
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Budget, BudgetSchema, CreateBudgetSchema, Category
from config import db

from decimal import Decimal, ROUND_HALF_UP

class BudgetList(Resource):
    """Resource for listing and creating budgets."""

    @jwt_required()
    def get(self):
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Get month and year from query params, default to current month/year
        now = datetime.now()
        month = request.args.get('month', now.month, type=int)
        year = request.args.get('year', now.year, type=int)

        user_id = get_jwt_identity()

        query = Budget.query.filter(Budget.user_id == user_id,
                                    Budget.month == month,
                                    Budget.year == year)
        pagination = (
            query
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return make_response(jsonify({
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "total_pages": pagination.pages,
            "budgets": BudgetSchema(many=True).dump(pagination.items)
        }), 200)
    

    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        request_json = request.get_json()

        if not request_json:
            return make_response(jsonify({"error": "No input data provided"}), 400)

        # -------------------------
        # REQUIRED RAW INPUTS
        # -------------------------
        category_id = request_json.get("category_id")
        amount = request_json.get("amount")
        month = request_json.get("month")
        year = request_json.get("year")

        # -------------------------
        # VALIDATION
        # -------------------------
        if not category_id:
            return make_response(jsonify({"error": "category_id is required"}), 400)
        
        if not amount or amount is None:
            return make_response(jsonify({"error": "amount is required"}), 400)
        try:
            amount = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            request_json["amount"] = amount
        except Exception:
            return make_response(jsonify({"error": "amount must be a valid number"}), 400)
        if amount <= 0:
            return make_response(jsonify({"error": "amount must be greater than 0"}), 400)

        if not month:
            return make_response(jsonify({"error": "month is required"}), 400)
        if not year:
            return make_response(jsonify({"error": "year is required"}), 400)
        
        # Validate category belongs to user
        category = Category.query.filter_by(id=category_id, user_id=user_id).first()
        if not category:
            return make_response(jsonify({"error": "Category not found"}), 404)
        
        budget = Budget.query.filter_by(user_id=user_id,
                                        category_id=category_id,
                                        month=month,
                                        year=year).first()
        if budget:
            return make_response(jsonify({"error": "Budget for this category, month, and year already exists"}), 400)
        
        # Create new budget
        schema = CreateBudgetSchema()
        schema.context = {"user_id": user_id}
        try:
            new_budget = schema.load(request_json)

            db.session.add(new_budget)
            db.session.commit()

            return make_response(jsonify(BudgetSchema().dump(new_budget)), 201)
        
        except ValidationError as err:
            db.session.rollback()
            return make_response(jsonify({"error": err.messages}), 400)
        
        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Database integrity error"}), 500)
        
        except Exception as err:
            db.session.rollback()
            return make_response(jsonify({"error": str(err)}), 500)