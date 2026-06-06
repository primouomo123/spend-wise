from flask import request, jsonify, make_response
from datetime import datetime
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from sqlalchemy import extract
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Transaction, CreateTransactionSchema, Category
from config import db
from utils import get_exchange_rate, TRANSACTION_TYPES

from decimal import Decimal, ROUND_HALF_UP


class TransactionList(Resource):
    """Resource for listing and creating transactions."""

    @jwt_required()
    def get(self):
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        category_name = request.args.get('category_name', type=str)

        # Get month and year from query params, default to current month/year
        now = datetime.now()
        month = request.args.get('month', now.month, type=int)
        year = request.args.get('year', now.year, type=int)

        user_id = get_jwt_identity()

        query = (db.session.query(Transaction.id.label('id'),
                                  Transaction.amount.label('amount'),
                                  Transaction.currency.label('currency'),
                                  Transaction.amount_usd.label('amount_usd'),
                                  Transaction.transaction_type.label('transaction_type'),
                                  Transaction.date.label('date'),
                                  Transaction.description.label('description'),
                                  Category.name.label('category_name'))
                                  .join(Category, Category.id == Transaction.category_id)
                                  .filter(Transaction.user_id == user_id,
                                          extract('month', Transaction.date) == month,
                                          extract('year', Transaction.date) == year))

        if category_name:
            normalized_category = category_name.strip().lower()
            if normalized_category:
                query = query.filter(Category.name == normalized_category)

        pagination = (
            query
            .order_by(Transaction.date.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return make_response(jsonify({
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "total_pages": pagination.pages,
            "transactions": [{
                "id": item.id,
                "amount": str(item.amount),
                "currency": item.currency,
                "amount_usd": str(item.amount_usd),
                "transaction_type": item.transaction_type,
                "date": item.date.isoformat(),
                "description": item.description,
                "category_name": item.category_name
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
        category_name = request_json.get("category_name").strip().lower() if request_json.get("category_name") else None
        transaction_type = request_json.get("transaction_type").strip().lower() if request_json.get("transaction_type") else None
        amount_raw = request_json.get("amount")
        currency_raw = request_json.get("currency")

        # -------------------------
        # VALIDATION
        # -------------------------
        if not transaction_type or transaction_type.strip().lower() not in TRANSACTION_TYPES:
            return make_response(jsonify({"error": "Invalid transaction type"}), 400)
        
        if transaction_type == "income":
            category = Category.query.filter_by(
                name="income",
                user_id=user_id
            ).first()
        
            if not category:
                return make_response(jsonify({"error": "Category not found"}), 404)
        
        
        if transaction_type == "expense":
            if category_name == "income":
                return make_response(jsonify({"error": "Cannot assign income category to expense transaction"}), 400)
            category = Category.query.filter_by(
                name=category_name,
                user_id=user_id
            ).first()

            if not category:
                return make_response(jsonify({"error": "Category not found"}), 404)
            
        category_id = category.id if category else None
        request_json.pop("category_name", None)  # Remove category_name since we have category_id now
        
        request_json["category_id"] = category.id if category else None

        if not category:
            return make_response(jsonify({"error": "Category not found"}), 404)

        if not currency_raw:
            return make_response(jsonify({"error": "Currency is required"}), 400)

        currency = currency_raw.strip().upper()
        transaction_type = transaction_type.strip().lower()

        # -------------------------
        # AMOUNT CONVERSION + VALIDATION
        # -------------------------
        if amount_raw is None:
            return make_response(jsonify({"error": "Amount is required"}), 400)

        try:
            amount = Decimal(str(amount_raw)).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP
            )
        except Exception:
            return make_response(jsonify({"error": "Invalid amount"}), 400)

        if amount <= 0:
            return make_response(jsonify({"error": "Amount must be positive"}), 400)

        # store normalized value
        request_json["amount"] = amount

        try:
            # -------------------------
            # CURRENCY CONVERSION
            # -------------------------
            if currency != "USD":
                exchange_rate = get_exchange_rate(currency, "USD")

                if not exchange_rate:
                    return make_response(
                        jsonify({"error": "Failed to retrieve exchange rate"}),
                        500
                    )

                amount_usd = (amount * Decimal(str(exchange_rate))).quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP
                )
            else:
                amount_usd = amount

            request_json["amount_usd"] = amount_usd
            request_json["currency"] = currency
            request_json["transaction_type"] = transaction_type

            # -------------------------
            # CREATE TRANSACTION
            # -------------------------
            schema = CreateTransactionSchema()
            schema.context = {"user_id": user_id}
            new_transaction = schema.load(request_json)
            db.session.add(new_transaction)
            db.session.commit()

            return_transaction = (db.session.query(Transaction.id.label('id'),
                                                Transaction.amount.label('amount'),
                                                Transaction.currency.label('currency'),
                                                Transaction.amount_usd.label('amount_usd'),
                                                Transaction.transaction_type.label('transaction_type'),
                                                Transaction.date.label('date'),
                                                Transaction.description.label('description'),
                                                Category.name.label('category_name'))
                                                .join(Category, Category.id == Transaction.category_id)
                                                .filter(Transaction.id == new_transaction.id)).first()

            return make_response(
                jsonify({
                    "id": return_transaction.id,
                    "amount": str(return_transaction.amount),
                    "currency": return_transaction.currency,
                    "amount_usd": str(return_transaction.amount_usd),
                    "transaction_type": return_transaction.transaction_type,
                    "date": return_transaction.date.isoformat(),
                    "description": return_transaction.description,
                    "category_name": return_transaction.category_name
                }),
                201
            )

        except ValidationError as e:
            db.session.rollback()
            return make_response(jsonify({"error": e.messages}), 400)

        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Database integrity error"}), 400)

        except Exception as e:
            db.session.rollback()
            return make_response(
                jsonify({"error": "Internal server error", "details": str(e)}),
                500
            )