import re

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from sqlalchemy.ext.hybrid import hybrid_property
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, pre_load, post_load

from config import db, bcrypt

USERNAME_REGEX = re.compile(r"^[a-z0-9_]+$")
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
        if not isinstance(password, str) or not PASSWORD_REGEX.match(password):  # Ensuring a safe password
            raise ValueError("Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.")
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        
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
        if not isinstance(value, str) or not USERNAME_REGEX.match(value):
            raise ValueError(f"{key} can only contain lowercase letters, numbers, and underscores.")
        if len(value) < 3 or len(value) > 50:
            raise ValueError(f"{key} must be between 3 and 50 characters long.")
        return value
    
    @model_validates('email')
    def validate_email(self, key, value):
        if not isinstance(value, str) or (len(value) < 6 or len(value) > 255):
            raise ValueError(f"{key} must be between 6 and 255 characters long.")
        return value
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

        

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=[
        validate.Length(min=3, max=50),
        validate.Regexp(USERNAME_REGEX, error="Username can only contain lowercase letters, numbers, and underscores.")
    ])
    email = fields.Email(required=True, validate=validate.Length(min=6, max=255))
    password = fields.Str(load_only=True, required=True, validate=[
        validate.Length(min=8),
        validate.Regexp(PASSWORD_REGEX, error="Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character.")
    ])

    class Meta:
        unknown = RAISE
        ordered = True
    
    @pre_load
    def preprocess_input(self, data, **kwargs):
        data = dict(data)  # Safer copy of input data
        if "username" in data:
            data["username"] = data["username"].strip().lower()
        if "email" in data:
            data["email"] = data["email"].strip().lower()
        if "password" in data:
            data["password"] = data["password"].strip()
        return data
    
    @schema_validates('username')
    def validate_unique_username(self, value, **kwargs):
        if not isinstance(value, str) or not USERNAME_REGEX.match(value):
            raise ValidationError("Username can only contain lowercase letters, numbers, and underscores.")
        if len(value) < 3 or len(value) > 50:
            raise ValidationError("Username must be between 3 and 50 characters long.")
    
    @schema_validates('email')
    def validate_unique_email(self, value, **kwargs):
        if not isinstance(value, str) or (len(value) < 6 or len(value) > 255):
            raise ValidationError("Email must be between 6 and 255 characters long.")
            

    @post_load
    def create_user(self, data, **kwargs):
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.password_hash = data['password']  # This will trigger the password hashing
        return user