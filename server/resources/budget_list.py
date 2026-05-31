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

        query = (
            db.session.query(Budget.id.label('id'),
                     Category.name.label('category_name'),
                     Budget.amount.label('amount'),
                     Budget.month.label('month'),
                     Budget.year.label('year'))
            .join(Category, Budget.category_id == Category.id)
            .filter(Budget.user_id == user_id,
                    Budget.month == month,
                    Budget.year == year)
        )
        pagination = (
            query
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return make_response(jsonify({
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "total_pages": pagination.pages,
            "budgets": [{
                "id": item.id,
                "category_name": item.category_name,
                "amount": str(item.amount),
                "month": item.month,
                "year": item.year
            } for item in pagination.items]
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
        category_name = request_json.get("category_name")
        amount = request_json.get("amount")
        month = request_json.get("month")
        year = request_json.get("year")

        # -------------------------
        # VALIDATION
        # -------------------------
        if not category_name:
            return make_response(jsonify({"error": "category_name is required"}), 400)
        
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
        category = Category.query.filter_by(name=category_name, user_id=user_id).first()
        if not category:
            return make_response(jsonify({"error": "Category not found"}), 404)
        
        request_json["category_id"] = category.id
        request_json.pop("category_name", None)
        category_id = category.id
        
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

            return_budget = (
                db.session.query(Budget.id.label('id'),
                                 Category.name.label('category_name'),
                                 Budget.amount.label('amount'),
                                 Budget.month.label('month'),
                                 Budget.year.label('year'))
                .join(Category, Budget.category_id == Category.id)
                .filter(Budget.id == new_budget.id)
                .first()
            )

            return make_response(jsonify({
                "id": return_budget.id,
                "category_name": return_budget.category_name,
                "amount": str(return_budget.amount),
                "month": return_budget.month,
                "year": return_budget.year
            }), 201)
        
        except ValidationError as err:
            db.session.rollback()
            return make_response(jsonify({"error": err.messages}), 400)
        
        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Database integrity error"}), 500)
        
        except Exception as err:
            db.session.rollback()
            return make_response(jsonify({"error": str(err)}), 500)