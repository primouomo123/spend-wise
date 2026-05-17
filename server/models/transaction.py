from datetime import date

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
    transaction_type = db.Column(db.Enum(*TRANSACTION_TYPES, name="transaction_types"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)

    __table_args__ = (
        CheckConstraint("amount > 0", name="positive_amount"),
        CheckConstraint("length(currency) = 3", name="currency_length"),
        CheckConstraint("amount_usd > 0", name="positive_amount_usd"),
        CheckConstraint("date <= CURRENT_DATE", name="valid_transaction_date"),
        CheckConstraint("length(description) >= 1", name="description_min_length"),
    )

    @model_validates('amount')
    def validate_amount(self, key, value):
        if not isinstance(value, (int, float)):
            raise ValueError(f"{key} must be a number.")
        if value <= 0:
            raise ValueError(f"{key} must be greater than 0.")
        return value
    
    @model_validates('currency')
    def validate_currency(self, key, value):
        if not isinstance(value, str):
            raise ValueError(f"{key} must be a string.")
        if len(value) != 3:
            raise ValueError(f"{key} must be a 3-letter currency code.")
        return value
    
    @model_validates('amount_usd')
    def validate_amount_usd(self, key, value):
        if not isinstance(value, (int, float)):
            raise ValueError(f"{key} must be a number.")
        if value <= 0:
            raise ValueError(f"{key} must be greater than 0.")
        return value
    
    @model_validates('transaction_type')
    def validate_transaction_type(self, key, value):
        if not isinstance(value, str):
            raise ValueError(f"{key} must be a string.")
        if value not in TRANSACTION_TYPES:
            raise ValueError(f"{key} must be one of {TRANSACTION_TYPES}.")
        return value
    
    @model_validates('date')
    def validate_date(self, key, value):
        if not isinstance(value, date):
            raise ValueError(f"{key} must be a valid date.")
        return value
    
    @model_validates('description')
    def validate_description(self, key, value):
        if not isinstance(value, str):
            raise ValueError(f"{key} must be a string.")
        if len(value) < 1:
            raise ValueError(f"{key} must be at least 1 character long.")
        return value

class TransactionSchema(Schema):
    pass