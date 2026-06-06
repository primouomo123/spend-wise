from datetime import date


def signup_user(client, username, email, password):
    return client.post(
        "/api/signup",
        json={
            "username": username,
            "email": email,
            "password": password,
        },
    )


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_summary_detects_overspending(client):
    signup = signup_user(
        client,
        username="summary_user",
        email="summary.user@gmail.com",
        password="StrongPass1!",
    )
    token = signup.get_json()["access_token"]

    create_category = client.post(
        "/api/categories",
        json={"name": "Dining"},
        headers=auth_header(token),
    )
    assert create_category.status_code == 201

    today = date.today()

    create_budget = client.post(
        "/api/budgets",
        json={
            "category_name": "dining",
            "amount": "100.00",
            "month": today.month,
            "year": today.year,
        },
        headers=auth_header(token),
    )
    assert create_budget.status_code == 201

    create_expense = client.post(
        "/api/transactions",
        json={
            "amount": "150.00",
            "currency": "USD",
            "transaction_type": "expense",
            "date": today.isoformat(),
            "description": "Groceries",
            "category_name": "dining",
        },
        headers=auth_header(token),
    )
    assert create_expense.status_code == 201

    summary_response = client.get(
        f"/api/summary?month={today.month}&year={today.year}",
        headers=auth_header(token),
    )
    assert summary_response.status_code == 200

    payload = summary_response.get_json()
    assert payload["overspending"]["is_any_category_overspent"] is True
    assert payload["overspending"]["overspent_category_count"] == 1
    assert payload["overspending"]["overspent_total_amount"] == "50.00"

    tracked_dining = next(
        item for item in payload["budget_tracking"] if item["category_name"] == "dining"
    )
    assert tracked_dining["overspent"] is True
    assert tracked_dining["overspent_amount"] == "50.00"


def test_summary_returns_expected_totals_without_type_filter(client):
    signup = signup_user(
        client,
        username="summary_filter_user",
        email="summary.filter@yahoo.com",
        password="StrongPass1!",
    )
    token = signup.get_json()["access_token"]

    create_category = client.post(
        "/api/categories",
        json={"name": "Utilities"},
        headers=auth_header(token),
    )
    assert create_category.status_code == 201

    today = date.today()

    income_tx = client.post(
        "/api/transactions",
        json={
            "amount": "500.00",
            "currency": "USD",
            "transaction_type": "income",
            "date": today.isoformat(),
            "description": "Paycheck",
        },
        headers=auth_header(token),
    )
    assert income_tx.status_code == 201

    expense_tx = client.post(
        "/api/transactions",
        json={
            "amount": "200.00",
            "currency": "USD",
            "transaction_type": "expense",
            "date": today.isoformat(),
            "description": "Electric bill",
            "category_name": "utilities",
        },
        headers=auth_header(token),
    )
    assert expense_tx.status_code == 201

    summary_response = client.get(
        f"/api/summary?month={today.month}&year={today.year}",
        headers=auth_header(token),
    )
    assert summary_response.status_code == 200

    payload = summary_response.get_json()
    assert payload["transaction_total_income"] == "500.00"
    assert payload["transaction_total_expenses"] == "200.00"
    assert payload["transaction_balance"] == "300.00"


def test_summary_validates_month_and_year(client):
    signup = signup_user(
        client,
        username="summary_invalid_user",
        email="summary.invalid@gmail.com",
        password="StrongPass1!",
    )
    token = signup.get_json()["access_token"]

    invalid_month = client.get("/api/summary?month=13", headers=auth_header(token))
    assert invalid_month.status_code == 400

    invalid_year = client.get("/api/summary?year=1999", headers=auth_header(token))
    assert invalid_year.status_code == 400
