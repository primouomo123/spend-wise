from flask import request, session, jsonify, make_response

from config import app, db, api, jwt
from models import User, Category, Transaction, Budget, UserSchema, CategorySchema, TransactionSchema, BudgetSchema, UserDetailSchema, CategoryDetailSchema, TransactionDetailSchema, BudgetDetailSchema


if __name__ == '__main__':
    app.run(port=5555, debug=True)