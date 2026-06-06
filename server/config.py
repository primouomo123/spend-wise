import os
from datetime import timedelta

from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_restful import Api
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from flask_jwt_extended import JWTManager
from flask_cors import CORS


def env_flag(name, default=False):
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def parse_origins(raw_origins):
    if not raw_origins:
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_COOKIE_SECURE"] = env_flag("JWT_COOKIE_SECURE", default=False)
app.config["JWT_COOKIE_SAMESITE"] = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
app.config["JWT_COOKIE_CSRF_PROTECT"] = env_flag("JWT_COOKIE_CSRF_PROTECT", default=False)
app.config["JWT_REFRESH_COOKIE_PATH"] = "/api/refresh"
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URI") or os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.json.compact = False

# CORS origins are configurable for deployment and default to local frontend hosts.
allowed_origins = parse_origins(os.getenv("CORS_ALLOWED_ORIGINS"))

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": allowed_origins
        }
    },
    supports_credentials=True,
)

jwt = JWTManager(app)

metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})
db = SQLAlchemy(metadata=metadata)

migrate = Migrate(app, db)
db.init_app(app)

bcrypt = Bcrypt(app)

api = Api(app)