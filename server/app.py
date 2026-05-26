from flask import request, jsonify, make_response
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request

from config import app, db, api, jwt
from models import *
from resources import *

@app.before_request
def check_if_logged_in():
    open_access_list = ['signup', 'login']

    if request.endpoint and request.endpoint not in open_access_list:
        try:
            verify_jwt_in_request()
        except Exception as e:
            return make_response(jsonify({'error': '401 Unauthorized'}), 401)

api.add_resource(Signup, '/signup', endpoint='signup')


if __name__ == '__main__':
    app.run(port=5555, debug=True)