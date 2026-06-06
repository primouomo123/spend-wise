from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from sqlalchemy import extract, func, case
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Category, Transaction, Budget
from config import db
from utils import get_exchange_rate, TRANSACTION_TYPES

from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

class Summary(Resource):
    """Resource for Returning aggregated totals: income, expenses, balance, budget vs. actual per category."""

    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()

        # Get month and year from query params, default to current month/year
        now = datetime.now()
        month = request.args.get('month', now.month, type=int)
        year = request.args.get('year', now.year, type=int)

        # Total Transaction income and expenses by category
        transaction_summaries = (
            db.session.query(
                Category.name.label('category_name'),
                Transaction.transaction_type,
                func.sum(Transaction.amount_usd).label('total_amount')
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(Transaction.user_id == user_id,
                 extract('month', Transaction.date) == month,
                 extract('year', Transaction.date) == year
        )
        .group_by(Category.name, Transaction.transaction_type
                  )
        ).all()

        transaction_total_income = sum(ts.total_amount for ts in transaction_summaries if ts.transaction_type == TRANSACTION_TYPES[0])  # income
        transaction_total_expenses = sum(ts.total_amount for ts in transaction_summaries if ts.transaction_type == TRANSACTION_TYPES[1])  # expenses
        transaction_balance = Decimal(transaction_total_income) - Decimal(transaction_total_expenses)

        # Total Budgeted amount by category
        budget_summaries = (
            db.session.query(
                Category.name.label('category_name'),
                func.sum(Budget.amount).label('budgeted_amount')
        )
        .join(Budget, Budget.category_id == Category.id)
        .filter(Budget.user_id == user_id,
                 Budget.month == month,
                 Budget.year == year
        )
        .group_by(Category.name)
        ).all()

        budget_total_income = sum(bs.budgeted_amount for bs in budget_summaries if bs.category_name == TRANSACTION_TYPES[0])
        budget_total_expenses = sum(bs.budgeted_amount for bs in budget_summaries if bs.category_name != TRANSACTION_TYPES[0])
        budget_balance = Decimal(budget_total_income) - Decimal(budget_total_expenses)

        totals = {
            "transaction_summaries": [
                {
                    "category_name": cs.category_name,
                    "transaction_type": cs.transaction_type,
                    "total_amount": Decimal(cs.total_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                }
                for cs in transaction_summaries
            ],

            "transaction_total_income": Decimal(transaction_total_income).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            "transaction_total_expenses": Decimal(transaction_total_expenses).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            "transaction_balance": Decimal(transaction_balance).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),

            
            "budget_summaries": [
                {
                    "category_name": bs.category_name,
                    "budgeted_amount": Decimal(bs.budgeted_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                }
                for bs in budget_summaries
            ],

            "budget_total_income": Decimal(budget_total_income).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            "budget_total_expenses": Decimal(budget_total_expenses).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            "budget_balance": Decimal(budget_balance).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        }
        return make_response(jsonify(totals), 200)