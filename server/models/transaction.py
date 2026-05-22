from decimal import Decimal, InvalidOperation
from datetime import date

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, pre_load, post_load

from config import db

from utils import TRANSACTION_TYPES

from .user import UserSchema
from .category import CategorySchema

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
        if not isinstance(value, str) or len(value) != 3:
            raise ValueError(f"{key} must be a 3-letter currency code.")
        return value
    
    @model_validates('transaction_type')
    def validate_transaction_type(self, key, value):
        if not isinstance(value, str) or value not in TRANSACTION_TYPES:
            raise ValueError(f"{key} must be one of {TRANSACTION_TYPES}.")
        return value
    
    @model_validates('date')
    def validate_date(self, key, value):
        if not isinstance(value, date):
            raise ValueError(f"{key} must be a valid date.")
        if value > date.today():
            raise ValueError(f"{key} cannot be in the future.")
        return value
    
    @model_validates('description')
    def validate_description(self, key, value):
        if not isinstance(value, str) or (len(value) < 1 or len(value) > 255):
            raise ValueError(f"{key} must be between 1 and 255 characters long.")
        return value
    
    user = db.relationship('User', back_populates='transactions', lazy='selectin')
    category = db.relationship('Category', back_populates='transactions', lazy='selectin')
    
    def __repr__(self):
        return (f"<Transaction id={self.id} amount={self.amount} currency='{self.currency}' "
                f"amount_usd={self.amount_usd} transaction_type='{self.transaction_type}' "
                f"date={self.date} description='{self.description}' user_id={self.user_id} "
                f"category_id={self.category_id}>")

class TransactionSchema(Schema):
    id = fields.Int(dump_only=True)
    amount = fields.Decimal(required=True, validate=validate.Range(min=Decimal('0.01')))
    currency = fields.Str(required=True, validate=validate.Length(equal=3))
    amount_usd = fields.Decimal(required=True, validate=validate.Range(min=Decimal('0.01')))
    transaction_type = fields.Str(required=True, validate=validate.OneOf(TRANSACTION_TYPES))
    date = fields.Date(required=True)
    description = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    user_id = fields.Int(dump_only=True)
    category_id = fields.Int(required=True)

    class Meta:
        unknown = RAISE
        ordered = True
    
    @pre_load
    def preprocess_input(self, data, **kwargs):
        data = dict(data)  # Safer copy of input data
        if "currency" in data and isinstance(data["currency"], str):
            data["currency"] = data["currency"].strip().upper()
        if "description" in data and isinstance(data["description"], str):
            data["description"] = data["description"].strip()
        return data
    
    @schema_validates('amount')
    def validate_amount(self, value, **kwargs):
        if value <= Decimal('0'):
            raise ValidationError("Amount must be greater than 0.")
    
    @schema_validates('currency')
    def validate_currency(self, value, **kwargs):
        if not isinstance(value, str) or len(value) != 3:
            raise ValidationError("Currency must be a 3-letter code.")
    
    @schema_validates('amount_usd')
    def validate_amount_usd(self, value, **kwargs):
        if value <= Decimal('0'):
            raise ValidationError("Amount in USD must be greater than 0.")
    
    @schema_validates('transaction_type')
    def validate_transaction_type(self, value, **kwargs):
        if not isinstance(value, str) or value not in TRANSACTION_TYPES:
            raise ValidationError(f"Transaction type must be one of {TRANSACTION_TYPES}.")
    
    @schema_validates('date')
    def validate_date(self, value, **kwargs):
        if not isinstance(value, date):
            raise ValidationError("Date must be a valid date.")
        if value > date.today():
            raise ValidationError("Date cannot be in the future.")
    
    @schema_validates('description')
    def validate_description(self, value, **kwargs):
        if not isinstance(value, str) or (len(value) < 1 or len(value) > 255):
            raise ValidationError("Description must be between 1 and 255 characters long.")
    
    @post_load
    def make_transaction(self, data, **kwargs):
        return Transaction(**data)


class TransactionDetailSchema(TransactionSchema):
    user = fields.Nested(lambda: UserSchema(exclude=("transactions",)), dump_only=True)
    category = fields.Nested(lambda: CategorySchema(exclude=("transactions",)), dump_only=True)