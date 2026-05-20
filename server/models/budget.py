from decimal import Decimal, InvalidOperation

from sqlalchemy import CheckConstraint
from sqlalchemy.orm import validates as model_validates
from marshmallow import Schema, fields, validate, validates as schema_validates, ValidationError, RAISE, pre_load, post_load

from config import db

from utils import TRANSACTION_TYPES

class Budget(db.Model):
    pass

class BudgetSchema(Schema):
    pass