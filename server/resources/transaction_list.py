from flask import request, jsonify, make_response
from datetime import datetime
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from sqlalchemy import extract
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Transaction, TransactionSchema, CreateTransactionSchema, Category
from config import db
from utils import get_exchange_rate, TRANSACTION_TYPES

from decimal import Decimal, ROUND_HALF_UP


class TransactionList(Resource):
    """Resource for listing and creating transactions."""

    @jwt_required()
    def get(self):
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Get month and year from query params, default to current month/year
        now = datetime.now()
        month = request.args.get('month', now.month, type=int)
        year = request.args.get('year', now.year, type=int)

        user_id = get_jwt_identity()

        query = Transaction.query.filter(Transaction.user_id == user_id,
                                         extract('month', Transaction.date) == month,
                                         extract('year', Transaction.date) == year)
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
            "transactions": TransactionSchema(many=True).dump(pagination.items)
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
        transaction_type = request_json.get("transaction_type")
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

            category_id = category.id if category else None
        
        if not category_id or category_id is None:
            return make_response(jsonify({"error": "Category ID is required"}), 400)
        
        if transaction_type == "expense":
            category = Category.query.filter_by(
                id=category_id,
                user_id=user_id
            ).first()

            if category.name == "income":
                return make_response(jsonify({"error": "Cannot assign income category to expense transaction"}), 400)
        
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

            return make_response(
                jsonify(TransactionSchema().dump(new_transaction)),
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