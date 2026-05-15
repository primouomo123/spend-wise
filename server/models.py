from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from sqlalchemy.ext.hybrid import hybrid_property
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, post_load

from config import db, bcrypt

class User(db.Model):
    """User model for authentication and user management."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    _password_hash = db.Column(db.String(128), nullable=True)

    @hybrid_property
    def password_hash(self):
        raise AttributeError("Password hash cannot be viewed.")
    
    @password_hash.setter
    def password_hash(self, password):
        password_hash = bcrypt.generate_password_hash(password.encode('utf-8'))
        self._password_hash = password_hash.decode('utf-8')
    
    def authenticate(self, password):
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))

class UserSchema(Schema):
    pass

class Category(db.Model):
    pass

class CategorySchema(Schema):
    pass

class Transaction(db.Model):
    pass

class TransactionSchema(Schema):
    pass

class Budget(db.Model):
    pass

class BudgetSchema(Schema):
    pass