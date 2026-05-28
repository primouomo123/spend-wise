#!/usr/bin/env python3

from app import app, db
from models import *

import datetime

with app.app_context():
    print("Deleting old data...")
    db.session.query(Transaction).delete()
    db.session.query(Budget).delete()
    db.session.query(Category).delete()
    db.session.query(User).delete()
    db.session.commit()

    print("Seeding users...")
    user1 = User(username='john_doe', email='john_doe@gmail.com')
    user1.password_hash = 'Password123**'
    user2 = User(username='jane_smith', email='jane_smith@yahoo.com')
    user2.password_hash = 'SecurePass456##'
    db.session.add_all([user1, user2])
    db.session.commit()

    print("Seeding categories...")
    category1 = Category(name='Income', user_id=user1.id)
    category2 = Category(name='Food', user_id=user1.id)
    category3 = Category(name='Rent', user_id=user1.id)
    category4 = Category(name='Others', user_id=user1.id)
    category5 = Category(name='Income', user_id=user2.id)
    category6 = Category(name='Food', user_id=user2.id)
    category7 = Category(name='Rent', user_id=user2.id)
    category8 = Category(name='Others', user_id=user2.id)
    db.session.add_all([category1, category2, category3, category4, category5, category6, category7, category8])
    db.session.commit()

    print("Seeding transactions...")
    transaction1 = Transaction(
        amount=3000.00,
        currency='USD',
        amount_usd=3000.00,
        transaction_type='income',
        date=datetime.date(2026, 5, 5),
        description='Salary',
        user_id=user1.id,
        category_id=1
    )
    transaction2 = Transaction(
        amount=50.00,
        currency='USD',
        amount_usd=50.00,
        transaction_type='expense',
        date=datetime.date(2026, 5, 15),
        description='Grocery shopping',
        user_id=user1.id,
        category_id=2
    )
    transaction3 = Transaction(
        amount=1200.00,
        currency='USD',
        amount_usd=1200.00,
        transaction_type='expense',
        date=datetime.date(2026, 5, 1),
        description='Monthly rent',
        user_id=user1.id,
        category_id=3
    )
    transaction4 = Transaction(
        amount=200.00,
        currency='USD',
        amount_usd=200.00,
        transaction_type='expense',
        date=datetime.date(2026, 5, 20),
        description='New headphones',
        user_id=user1.id,
        category_id=4
    )
    transaction5 = Transaction(
        amount=3200.00,
        currency='USD',
        amount_usd=3200.00,
        transaction_type='income',
        date=datetime.date(2026, 5, 5),
        description='Salary',
        user_id=user2.id,
        category_id=5
    )
    transaction6 = Transaction(
        amount=60.00,
        currency='USD',
        amount_usd=60.00,
        transaction_type='expense',
        date=datetime.date(2026, 5, 18),
        description='Food for the month',
        user_id=user2.id,
        category_id=6
    )
    transaction7 = Transaction(
        amount=1300.00,
        currency='USD',
        amount_usd=1300.00,
        transaction_type='expense',
        date=datetime.date(2026, 5, 3),
        description='Monthly rent',
        user_id=user2.id,
        category_id=7
    )
    transaction8 = Transaction(
        amount=150.00,
        currency='USD',
        amount_usd=150.00,
        transaction_type='expense',
        date=datetime.date(2026, 5, 22),
        description='Concert tickets',
        user_id=user2.id,
        category_id=8
    )
    db.session.add_all([transaction1, transaction2, transaction3, transaction4, transaction5, transaction6, transaction7, transaction8])
    db.session.commit()

    print("Seeding budgets...")
    budget1 = Budget(
        amount=3000.00,
        month=5,
        year=2026,
        user_id=user1.id,
        category_id=1
    )
    budget2 = Budget(
        amount=500.00,
        month=5,
        year=2026,
        user_id=user1.id,
        category_id=2
    )
    budget3 = Budget(
        amount=1200.00,
        month=5,
        year=2026,
        user_id=user1.id,
        category_id=3
    )
    budget4 = Budget(
        amount=300.00,
        month=5,
        year=2026,
        user_id=user1.id,
        category_id=4
    )
    budget5 = Budget(
        amount=3200.00,
        month=5,
        year=2026,
        user_id=user2.id,
        category_id=5
    )
    budget6 = Budget(
        amount=600.00,
        month=5,
        year=2026,
        user_id=user2.id,
        category_id=6
    )
    budget7 = Budget(
        amount=1300.00,
        month=5,
        year=2026,
        user_id=user2.id,
        category_id=7
    )
    budget8 = Budget(
        amount=200.00,
        month=5,
        year=2026,
        user_id=user2.id,
        category_id=8
    )


    db.session.add_all([budget1, budget2, budget3, budget4, budget5, budget6, budget7, budget8])
    db.session.commit()

    print("Seeding completed!")
