from flask import request, jsonify, make_response
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request

from config import app, db, api, jwt
from models import *
from resources import *

@app.before_request
def check_if_logged_in():
    open_access_list = ['signup', 'login', 'refresh', 'logout']

    if request.endpoint and request.endpoint not in open_access_list:
        try:
            verify_jwt_in_request()
        except Exception as e:
            return make_response(jsonify({'error': '401 Unauthorized'}), 401)

api.add_resource(Signup, '/api/signup', endpoint='signup')
api.add_resource(Login, '/api/login', endpoint='login')
api.add_resource(Logout, '/api/logout', endpoint='logout')
api.add_resource(WhoAmI, '/api/me', endpoint='me')
api.add_resource(TokenRefresh, '/api/refresh', endpoint='refresh')
api.add_resource(CategoryList, '/api/categories', endpoint='categories')
api.add_resource(CategoryDetail, '/api/categories/<int:id>', endpoint='category_detail')
api.add_resource(CurrencyList, '/api/currencies', endpoint='currencies')
api.add_resource(TransactionList, '/api/transactions', endpoint='transactions')
api.add_resource(TransactionDetail, '/api/transactions/<int:id>', endpoint='transaction_detail')
api.add_resource(BudgetList, '/api/budgets', endpoint='budgets')
api.add_resource(BudgetDetail, '/api/budgets/<int:id>', endpoint='budget_detail')
api.add_resource(Summary, '/api/summary', endpoint='summary')

if __name__ == '__main__':
    app.run(port=5555, debug=True)