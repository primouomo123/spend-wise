from flask import request, jsonify, make_response
from flask_restful import Resource
from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from models import Transaction, CreateTransactionSchema, TransactionDetailSchema
from config import db

from utils import get_exchange_rate

class TransactionList(Resource):
    """Resource for listing all transactions and creating new transactions."""
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()