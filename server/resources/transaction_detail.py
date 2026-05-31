from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Transaction, TransactionSchema, UpdateTransactionSchema, Category
from config import db
from utils import get_exchange_rate, TRANSACTION_TYPES

from decimal import Decimal, ROUND_HALF_UP


class TransactionDetail(Resource):
    """Resource for handling transaction details."""

    @jwt_required()
    def get(self, id):
        user_id = get_jwt_identity()

        transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()

        if not transaction:
            return make_response(jsonify({"error": "Transaction not found"}), 404)
        
        return_transaction = (db.session.query(Transaction.id.label('id'),
                                               Transaction.amount.label('amount'),
                                               Transaction.currency.label('currency'),
                                               Transaction.amount_usd.label('amount_usd'),
                                               Transaction.transaction_type.label('transaction_type'),
                                               Transaction.date.label('date'),
                                               Transaction.description.label('description'),
                                               Category.name.label('category_name'))
                                               .join(Category, Category.id == Transaction.category_id)
                                               .filter(Transaction.id == transaction.id)).first()

        return make_response(jsonify({
            "id": return_transaction.id,
            "amount": str(return_transaction.amount),
            "currency": return_transaction.currency,
            "amount_usd": str(return_transaction.amount_usd),
            "transaction_type": return_transaction.transaction_type,
            "date": return_transaction.date.isoformat(),
            "description": return_transaction.description,
            "category_name": return_transaction.category_name
        }), 200)

    @jwt_required()
    def patch(self, id):
        user_id = get_jwt_identity()

        transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()
        if not transaction:
            return make_response(jsonify({"error": "Transaction not found"}), 404)

        request_json = request.get_json()
        if not request_json:
            return make_response(jsonify({"error": "No input data provided"}), 400)
        
        # -------------------------
        # BASE VALUES (DB STATE)
        # -------------------------
        amount = Decimal(str(transaction.amount))
        currency = transaction.currency
        category = transaction.category
        transaction_type = transaction.transaction_type

        # -------------------------
        # TRANSACTION TYPE UPDATE
        # -------------------------
        if "transaction_type" in request_json:
            transaction_type = request_json["transaction_type"].strip().lower()

            if transaction_type not in TRANSACTION_TYPES:
                return make_response(jsonify({"error": "Invalid transaction type"}), 400)

        # -------------------------
        # CATEGORY LOGIC (SAFE + CONSISTENT)
        # -------------------------
        if transaction_type == "income":
            category = Category.query.filter_by(
                name="income",
                user_id=user_id
            ).first()

            if not category:
                return make_response(
                    jsonify({"error": "Default 'income' category not found"}),
                    500
                )

        elif transaction_type == "expense":
            if "category_name" in request_json:
                category = Category.query.filter_by(
                    name=request_json["category_name"].strip().lower(),
                    user_id=user_id
                ).first()
            else:
                category = Category.query.filter_by(
                    id=transaction.category_id,
                    user_id=user_id
                ).first()

            if not category:
                return make_response(jsonify({"error": "Category not found"}), 404)

            if category.name == "income":
                return make_response(
                    jsonify({"error": "Expense cannot use 'income' category"}),
                    400
                )

        request_json["category_id"] = category.id
        request_json.pop("category_name", None)  # Remove category_name since we have category_id now

        try:
            patch_data = UpdateTransactionSchema().load(request_json, partial=True)
        except ValidationError as err:
            return make_response(
                jsonify({"error": "Validation error", "details": err.messages}),
                400
            )

        # -------------------------
        # AMOUNT UPDATE
        # -------------------------
        if "amount" in patch_data:
            try:
                amount = Decimal(str(patch_data["amount"]))
            except Exception:
                return make_response(jsonify({"error": "Invalid amount"}), 400)

            if amount <= 0:
                return make_response(jsonify({"error": "Amount must be positive"}), 400)

            amount = amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # -------------------------
        # CURRENCY UPDATE
        # -------------------------
        if "currency" in patch_data:
            currency = patch_data["currency"].strip().upper()

        # -------------------------
        # USD CALCULATION (SINGLE SOURCE OF TRUTH)
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

        # -------------------------
        # APPLY PATCH
        # -------------------------
        patch_data["amount"] = amount
        patch_data["currency"] = currency
        patch_data["amount_usd"] = amount_usd

        for key, value in patch_data.items():
            setattr(transaction, key, value)

        try:
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
                                               .filter(Transaction.id == transaction.id)).first()
            return make_response(jsonify({
                "id": return_transaction.id,
                "amount": str(return_transaction.amount),
                "currency": return_transaction.currency,
                "amount_usd": str(return_transaction.amount_usd),
                "transaction_type": return_transaction.transaction_type,
                "date": return_transaction.date.isoformat(),
                "description": return_transaction.description,
                "category_name": return_transaction.category_name
            }), 200)

        except IntegrityError:
            db.session.rollback()
            return make_response(jsonify({"error": "Database integrity error"}), 400)

        except Exception as e:
            db.session.rollback()
            return make_response(
                jsonify({"error": "Internal server error", "details": str(e)}),
                500
            )

    @jwt_required()
    def delete(self, id):
        user_id = get_jwt_identity()

        transaction = Transaction.query.filter_by(id=id, user_id=user_id).first()
        if not transaction:
            return make_response(jsonify({"error": "Transaction not found"}), 404)

        try:
            db.session.delete(transaction)
            db.session.commit()
            return make_response(jsonify({}), 204)

        except Exception as e:
            db.session.rollback()
            return make_response(
                jsonify({"error": "Internal server error", "details": str(e)}),
                500
            )