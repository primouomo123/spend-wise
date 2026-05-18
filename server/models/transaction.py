from decimal import Decimal, InvalidOperation
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
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    amount_usd = db.Column(db.Numeric(12, 2), nullable=False)
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

    @model_validates('amount', 'amount_usd')
    def validate_amount(self, key, value):
        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            raise ValueError(f"{key} must be a valid number.")
        if decimal_value <= Decimal('0'):
            raise ValueError(f"{key} must be greater than 0.")
        return decimal_value
    
    @model_validates('currency')
    def validate_currency(self, key, value):
        if not isinstance(value, str):
            raise ValueError(f"{key} must be a string.")
        if len(value) != 3:
            raise ValueError(f"{key} must be a 3-letter currency code.")
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
    id = fields.Int(dump_only=True)
    amount = fields.Decimal(required=True, validate=validate.Range(min=0.01))
    currency = fields.Str(required=True, validate=validate.Length(equal=3))
    amount_usd = fields.Decimal(required=True, validate=validate.Range(min=0.01))
    transaction_type = fields.Str(required=True, validate=validate.OneOf(TRANSACTION_TYPES))
    date = fields.Date(required=True)
    description = fields.Str(required=True, validate=validate.Length(min=1))
    user_id = fields.Int(required=True)
    category_id = fields.Int(required=True)

    class Meta:
        unknown = RAISE
        ordered = True
    
    @pre_load
    def preprocess_input(self, data, **kwargs):
        data = dict(data)  # Safer copy of input data
        if "currency" in data:
            data["currency"] = data["currency"].strip().upper()
        if "description" in data:
            data["description"] = data["description"].strip()
        return data
    
    @schema_validates('amount')
    def validate_amount(self, value, **kwargs):
        if value <= Decimal('0'):
            raise ValidationError("Amount must be greater than 0.")
        return value
    
    @schema_validates('currency')
    def validate_currency(self, value, **kwargs):
        if not isinstance(value, str):
            raise ValidationError("Currency must be a string.")
        if len(value) != 3:
            raise ValidationError("Currency must be a 3-letter code.")
        return value
    
    @schema_validates('amount_usd')
    def validate_amount_usd(self, value, **kwargs):
        if value <= Decimal('0'):
            raise ValidationError("Amount in USD must be greater than 0.")
        return value
    
    @schema_validates('transaction_type')
    def validate_transaction_type(self, value, **kwargs):
        if not isinstance(value, str):
            raise ValidationError("Transaction type must be a string.")
        if value not in TRANSACTION_TYPES:
            raise ValidationError(f"Transaction type must be one of {TRANSACTION_TYPES}.")
        return value
    
    @schema_validates('date')
    def validate_date(self, value, **kwargs):
        if not isinstance(value, date):
            raise ValidationError("Date must be a valid date.")
        return value
    
    @schema_validates('description')
    def validate_description(self, value, **kwargs):
        if not isinstance(value, str):
            raise ValidationError("Description must be a string.")
        if len(value) < 1:
            raise ValidationError("Description must be at least 1 character long.")
        return value
    
    @post_load
    def make_transaction(self, data, **kwargs):
        return Transaction(**data)