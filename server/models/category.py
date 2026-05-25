from sqlalchemy import CheckConstraint, UniqueConstraint, select, exists
from sqlalchemy.orm import validates as model_validates
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, pre_load, post_load

from config import db

class Category(db.Model):
    """Category model for organizing transactions."""
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    __table_args__ = (
        CheckConstraint("length(name) >= 1", name="category_name_min_length"),
        UniqueConstraint("user_id", "name", name="unique_category_per_user"),
    )

    @model_validates('name')
    def validate_name(self, key, value):
        if not isinstance(value, str) or (len(value) < 1 or len(value) > 100):
            raise ValueError(f"{key} must be between 1 and 100 characters long.")
        return value.strip()
    
    user = db.relationship('User', back_populates='categories', lazy='selectin')
    transactions = db.relationship('Transaction', back_populates='category', cascade='all, delete-orphan', lazy='selectin')
    budgets = db.relationship('Budget', back_populates='category', cascade='all, delete-orphan', lazy='selectin')
    
    def __repr__(self):
        return f"<Category id={self.id} name='{self.name}' user_id={self.user_id}>"

class CategorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    user_id = fields.Int(dump_only=True)

    class Meta:
        unknown = RAISE
        ordered = True
    
    def __init__(self, *args, user_id=None, category_id=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_id = user_id
        self.category_id = category_id
    
    @pre_load
    def preprocess_input(self, data, **kwargs):
        data = dict(data)  # Safer copy of input data
        if "name" in data and isinstance(data["name"], str):
            data["name"] = data["name"].strip()
        return data
    
    @schema_validates('name')
    def validate_name(self, value, **kwargs):
        if not isinstance(value, str) or (len(value) < 1 or len(value) > 100):
            raise ValidationError("Category name must be between 1 and 100 characters long.")
        
        if not self.user_id:
            raise ValidationError("Authenticated user is required to validate category name uniqueness.")
        
        conditions = [Category.name == value, Category.user_id == self.user_id]

        if self.category_id:
            conditions.append(Category.id != self.category_id)
        
        stmt = select(exists().where(*conditions))

        if db.session.scalar(stmt):
            raise ValidationError("You already have a category with this name.")
    
    @post_load
    def create_category(self, data, **kwargs):
        if not self.user_id:
            raise ValidationError("Authenticated user is required to create a Category.")
        data["user_id"] = self.user_id
        if self.category_id:
            return data  # For updates, we just return the validated data
        return Category(**data)


class CategoryDetailSchema(CategorySchema):
    user = fields.Nested('UserSchema', exclude=("categories",), dump_only=True)
    transactions = fields.Nested('TransactionSchema', exclude=("category",), many=True, dump_only=True)
    budgets = fields.Nested('BudgetSchema', exclude=("category",), many=True, dump_only=True)