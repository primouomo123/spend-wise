import re

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from sqlalchemy.ext.hybrid import hybrid_property
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, post_load

from config import db, bcrypt

USERNAME_REGEX = re.compile(r"^[a-z0-9_]+$")
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PASSWORD_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$")

class User(db.Model):
    """User model for authentication and user management."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    _password_hash = db.Column(db.String(128), nullable=True)

    @hybrid_property
    def password_hash(self):
        raise AttributeError("Password hash cannot be viewed.")
    
    @password_hash.setter
    def password_hash(self, password):
        # Validate password strength and type before hashing
        if not isinstance(password, str):
            raise ValueError("Password must be a string.")
        password = password.strip()
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not PASSWORD_REGEX.match(password):  # Ensuring a safe password
            raise ValueError("Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.")
        
        # Password hashing with bcrypt
        password_hash = bcrypt.generate_password_hash(password.encode('utf-8'))
        self._password_hash = password_hash.decode('utf-8')
    
    def authenticate(self, password):
        if not self._password_hash:
            return False
        return bcrypt.check_password_hash(self._password_hash, password.encode('utf-8'))
    
    __table_args__ = (
        CheckConstraint("length(username) >= 3", name="username_min_length"),
        CheckConstraint("length(email) >= 6", name="email_min_length"),
        CheckConstraint("email LIKE '%@%.%'", name="email_format"),
    )

    @model_validates('username')
    def validate_username(self, key, value):
        if not isinstance(value, str):
            raise ValueError(f"{key} must be a string.")
        value = value.strip().lower()
        if len(value) < 3:
            raise ValueError(f"{key} must be at least 3 characters long.")
        if not USERNAME_REGEX.match(value):
            raise ValueError(f"{key} can only contain lowercase letters, numbers, and underscores.")
        return value
    
    @model_validates('email')
    def validate_email(self, key, value):
        if not isinstance(value, str):
            raise ValueError(f"{key} must be a string.")
        value = value.strip().lower()
        if len(value) < 6:
            raise ValueError(f"{key} must be at least 6 characters long.")
        if not EMAIL_REGEX.match(value):
            raise ValueError(f"{key} is not a valid email address.")
        return value        

        

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