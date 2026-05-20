from decimal import Decimal, InvalidOperation

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, post_load

from config import db

class Budget(db.Model):
    """Model for the budget table."""
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)

    __table_args__ = (
        CheckConstraint("amount > 0", name="positive_budget_amount"),
        CheckConstraint("month >= 1 AND month <= 12", name="valid_month"),
        CheckConstraint("year >= 2000 AND year <= 2100", name="valid_year")
    )

    @model_validates('amount')
    def validate_amount(self, key, value):
        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            raise ValueError(f"{key} must be a valid number.")
        if decimal_value <= Decimal('0'):
            raise ValueError(f"{key} must be greater than 0.")
        return decimal_value
    
    @model_validates('month')
    def validate_month(self, key, value):
        if not isinstance(value, int) or (value < 1 or value > 12):
            raise ValueError(f"{key} must be an integer between 1 and 12.")
        return value
    
    @model_validates('year')
    def validate_year(self, key, value):
        if not isinstance(value, int) or (value < 2000 or value > 2100):
            raise ValueError(f"{key} must be an integer between 2000 and 2100.")
        return value

class BudgetSchema(Schema):
    id = fields.Int(dump_only=True)
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=Decimal('0.01')))
    month = fields.Int(required=True, validate=validate.Range(min=1, max=12))
    year = fields.Int(required=True, validate=validate.Range(min=2000, max=2100))
    user_id = fields.Int(required=True)
    category_id = fields.Int(required=True)

    class Meta:
        unknown = RAISE
        ordered = True
    
    @schema_validates('amount')
    def validate_amount(self, value, **kwargs):
        if value <= Decimal('0'):
            raise ValidationError("Amount must be greater than 0.")
    
    @schema_validates('month')
    def validate_month(self, value, **kwargs):
        if value < 1 or value > 12:
            raise ValidationError("Month must be between 1 and 12.")
    
    @schema_validates('year')
    def validate_year(self, value, **kwargs):
        if value < 2000 or value > 2100:
            raise ValidationError("Year must be between 2000 and 2100.")
    
    @post_load
    def make_budget(self, data, **kwargs):
        return Budget(**data)

# Remember to ensure the categories are unique per user and month/year combination, and that the amount is positive.
# Also ensure the foreign keys (user_id and category_id) exist.
# Should I validate dates in transaction model?