from decimal import Decimal, InvalidOperation

from sqlalchemy import CheckConstraint, UniqueConstraint, select
from sqlalchemy.orm import validates as model_validates
from marshmallow import Schema, fields, validate, validates as schema_validates, validates_schema, ValidationError, RAISE, post_load

from config import db

from utils import YEAR_FROM, YEAR_TO

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
        CheckConstraint(f"year >= {YEAR_FROM} AND year <= {YEAR_TO}", name="valid_year"),
        UniqueConstraint('user_id', 'category_id', 'month', 'year', name='unique_budget_per_user_category_month_year')
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
        if not isinstance(value, int) or (value < YEAR_FROM or value > YEAR_TO):
            raise ValueError(f"{key} must be an integer between {YEAR_FROM} and {YEAR_TO}.")
        return value
    
    user = db.relationship('User', back_populates='budgets', lazy='selectin')
    category = db.relationship('Category', back_populates='budgets', lazy='selectin')
    
    def __repr__(self):
        return f"<Budget id={self.id} amount={self.amount} month={self.month} year={self.year} user_id={self.user_id} category_id={self.category_id}>"

class BudgetSchema(Schema):
    id = fields.Int(dump_only=True)
    amount = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=Decimal('0.01')))
    month = fields.Int(required=True, validate=validate.Range(min=1, max=12))
    year = fields.Int(required=True, validate=validate.Range(min=YEAR_FROM, max=YEAR_TO))
    user_id = fields.Int(dump_only=True)
    category_id = fields.Int(required=True)

    class Meta:
        unknown = RAISE
        ordered = True
    
    def __init__(self, *args, user=None, budget=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user
        self.budget = budget
    
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
        if value < YEAR_FROM or value > YEAR_TO:
            raise ValidationError(f"Year must be between {YEAR_FROM} and {YEAR_TO}.")
    
    @schema_validates('category_id')
    def validate_category_id(self, value, **kwargs):
        from .category import Category  # Avoid circular import
        if not isinstance(value, int) or value <= 0:
            raise ValidationError("category_id must be a positive integer.")
        
        if not self.user:
            raise ValidationError("Authenticated user is required to validate category_id.")
        
        stmt = select(Category.id).where(Category.id == value, Category.user_id == self.user.id)
        
        if not db.session.scalar(stmt):
            raise ValidationError(f"Category with id {value} does not exist for the authenticated user.")
    
    @validates_schema
    def validate_unique_budget(self, data, **kwargs):
        if not self.user:
            raise ValidationError("Authenticated user is required to validate unique budget constraint.")
        
        stmt = select(Budget.id).where(
            Budget.user_id == self.user.id,
            Budget.category_id == data['category_id'],
            Budget.month == data['month'],
            Budget.year == data['year']
        )

        if self.budget:
            stmt = stmt.where(Budget.id != self.budget.id)
        if db.session.scalar(stmt):
            raise ValidationError("You already have a budget for this category and month. Please update the existing budget instead of creating a new one.")
    
    @post_load
    def make_budget(self, data, **kwargs):
        return Budget(**data)


class BudgetDetailSchema(BudgetSchema):
    user = fields.Nested('UserSchema', exclude=("budgets",), dump_only=True)
    category = fields.Nested('CategorySchema', exclude=("budgets",), dump_only=True)