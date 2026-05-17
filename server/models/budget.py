import re

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, pre_load, post_load

from config import db

TRANSACTION_TYPES = ('income', 'expense')

class Budget(db.Model):
    pass

class BudgetSchema(Schema):
    pass