import re

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, pre_load, post_load

from config import db

from utils import TRANSACTION_TYPES

class Transaction(db.Model):
    """Transaction model for recording income and expenses."""
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    amount_usd = db.Column(db.Float, nullable=False)
    type = db.Column(db.Enum(*TRANSACTION_TYPES, name="transaction_types"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)

    __table_args__ = (
        CheckConstraint("amount > 0", name="positive_amount"),
        CheckConstraint("length(currency) = 3", name="currency_length"),
        CheckConstraint("amount_usd >= 0", name="non_negative_amount_usd"),
        CheckConstraint("type IN ('income', 'expense')", name="valid_transaction_type"),
        CheckConstraint("date <= CURRENT_DATE", name="valid_transaction_date"),
        CheckConstraint("length(description) <= 255", name="description_max_length"),
    )

class TransactionSchema(Schema):
    pass