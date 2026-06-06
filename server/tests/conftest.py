import os
import sys
from pathlib import Path

import pytest


SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))


os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DATABASE_URI", "sqlite:///:memory:")
os.environ.setdefault("JWT_COOKIE_SECURE", "false")
os.environ.setdefault("JWT_COOKIE_SAMESITE", "Lax")
os.environ.setdefault("JWT_COOKIE_CSRF_PROTECT", "false")

from app import app  # noqa: E402
from config import db  # noqa: E402


@pytest.fixture()
def client():
    app.config.update(TESTING=True)

    with app.app_context():
        db.drop_all()
        db.create_all()

    with app.test_client() as test_client:
        yield test_client

    with app.app_context():
        db.session.remove()
        db.drop_all()
