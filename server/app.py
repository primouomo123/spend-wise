from flask import request, session, jsonify, make_response

from config import app, db, api, jwt
from models import *


if __name__ == '__main__':
    app.run(port=5555, debug=True)