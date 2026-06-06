from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy import extract, func
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import Category, Transaction, Budget
from config import db
from utils import TRANSACTION_TYPES, YEAR_FROM, YEAR_TO
from datetime import datetime

from utils import quantize_money, as_money_string, ZERO


class Summary(Resource):
    """Resource for Returning aggregated totals: income, expenses, balance, budget vs. actual per category."""

    @jwt_required()
    def get(self):
        try:
            user_id = get_jwt_identity()

            now = datetime.now()
            month = request.args.get("month", now.month, type=int)
            year = request.args.get("year", now.year, type=int)

            if month is None or month < 1 or month > 12:
                return make_response(jsonify({"error": "month must be an integer between 1 and 12"}), 400)

            if year is None or year < YEAR_FROM or year > YEAR_TO:
                return make_response(
                    jsonify({"error": f"year must be an integer between {YEAR_FROM} and {YEAR_TO}"}),
                    400,
                )

            transaction_query = (
                db.session.query(
                    Category.name.label("category_name"),
                    Transaction.transaction_type,
                    func.sum(Transaction.amount_usd).label("total_amount"),
                )
                .join(Transaction, Transaction.category_id == Category.id)
                .filter(
                    Transaction.user_id == user_id,
                    extract("month", Transaction.date) == month,
                    extract("year", Transaction.date) == year,
                )
            )

            transaction_summaries = (
                transaction_query
                .group_by(Category.name, Transaction.transaction_type)
                .all()
            )

            transaction_total_income = sum(
                quantize_money(ts.total_amount)
                for ts in transaction_summaries
                if ts.transaction_type == TRANSACTION_TYPES[0]
            )
            transaction_total_expenses = sum(
                quantize_money(ts.total_amount)
                for ts in transaction_summaries
                if ts.transaction_type == TRANSACTION_TYPES[1]
            )
            transaction_balance = quantize_money(transaction_total_income - transaction_total_expenses)

            budget_query = (
                db.session.query(
                    Category.name.label("category_name"),
                    func.sum(Budget.amount).label("budgeted_amount"),
                )
                .join(Budget, Budget.category_id == Category.id)
                .filter(
                    Budget.user_id == user_id,
                    Budget.month == month,
                    Budget.year == year,
                )
            )

            budget_summaries = budget_query.group_by(Category.name).all()

            budget_total_income = sum(
                quantize_money(bs.budgeted_amount)
                for bs in budget_summaries
                if bs.category_name == TRANSACTION_TYPES[0]
            )
            budget_total_expenses = sum(
                quantize_money(bs.budgeted_amount)
                for bs in budget_summaries
                if bs.category_name != TRANSACTION_TYPES[0]
            )
            budget_balance = quantize_money(budget_total_income - budget_total_expenses)

            actual_by_category = {
                item.category_name: quantize_money(item.total_amount)
                for item in transaction_summaries
            }
            budget_by_category = {
                item.category_name: quantize_money(item.budgeted_amount)
                for item in budget_summaries
            }
            all_categories = sorted(set(actual_by_category.keys()) | set(budget_by_category.keys()))

            budget_tracking = []
            overspent_categories = []
            total_overspent_amount = ZERO

            for category in all_categories:
                actual_amount = actual_by_category.get(category, ZERO)
                budgeted_amount = budget_by_category.get(category, ZERO)
                is_income = category == TRANSACTION_TYPES[0]

                if is_income:
                    difference = quantize_money(actual_amount - budgeted_amount)
                    overspent_amount = ZERO
                    overspent = False
                else:
                    difference = quantize_money(budgeted_amount - actual_amount)
                    overspent_amount = quantize_money(max(actual_amount - budgeted_amount, ZERO))
                    overspent = overspent_amount > ZERO

                if overspent:
                    total_overspent_amount += overspent_amount
                    overspent_categories.append({
                        "category_name": category,
                        "overspent_amount": as_money_string(overspent_amount),
                    })

                budget_tracking.append({
                    "category_name": category,
                    "transaction_type": TRANSACTION_TYPES[0] if is_income else TRANSACTION_TYPES[1],
                    "actual_amount": as_money_string(actual_amount),
                    "budgeted_amount": as_money_string(budgeted_amount),
                    "difference": as_money_string(difference),
                    "overspent": overspent,
                    "overspent_amount": as_money_string(overspent_amount),
                })

            totals = {
                "transaction_summaries": [
                    {
                        "category_name": cs.category_name,
                        "transaction_type": cs.transaction_type,
                        "total_amount": as_money_string(cs.total_amount),
                    }
                    for cs in transaction_summaries
                ],
                "transaction_total_income": as_money_string(transaction_total_income),
                "transaction_total_expenses": as_money_string(transaction_total_expenses),
                "transaction_balance": as_money_string(transaction_balance),
                "budget_summaries": [
                    {
                        "category_name": bs.category_name,
                        "budgeted_amount": as_money_string(bs.budgeted_amount),
                    }
                    for bs in budget_summaries
                ],
                "budget_total_income": as_money_string(budget_total_income),
                "budget_total_expenses": as_money_string(budget_total_expenses),
                "budget_balance": as_money_string(budget_balance),
                "budget_tracking": budget_tracking,
                "overspending": {
                    "is_any_category_overspent": len(overspent_categories) > 0,
                    "overspent_category_count": len(overspent_categories),
                    "overspent_total_amount": as_money_string(total_overspent_amount),
                    "overspent_categories": overspent_categories,
                },
            }
            return make_response(jsonify(totals), 200)

        except Exception:
            return make_response(jsonify({"error": "Internal server error"}), 500)