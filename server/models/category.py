from sqlalchemy import CheckConstraint
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
    )

    @model_validates('name')
    def validate_name(self, key, value):
        if not isinstance(value, str) or (len(value) < 1 or len(value) > 100):
            raise ValueError(f"{key} must be between 1 and 100 characters long.")
        return value
    
    def __repr__(self):
        return f"<Category id={self.id} name='{self.name}' user_id={self.user_id}>"

class CategorySchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    user_id = fields.Int(required=True)

    class Meta:
        unknown = RAISE
        ordered = True
    
    @pre_load
    def preprocess_input(self, data, **kwargs):
        data = dict(data)  # Safer copy of input data
        if "name" in data:
            data["name"] = data["name"].strip()
        return data
    
    @schema_validates('name')
    def validate_name(self, value, **kwargs):
        if not isinstance(value, str) or (len(value) < 1 or len(value) > 100):
            raise ValidationError("Name must be between 1 and 100 characters long.")
    
    @post_load
    def create_category(self, data, **kwargs):
        return Category(**data)