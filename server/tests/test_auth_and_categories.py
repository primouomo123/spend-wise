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


def test_protected_route_requires_auth(client):
    response = client.get("/api/categories")

    assert response.status_code == 401
    assert response.get_json()["error"] == "401 Unauthorized"


def test_signup_and_me_flow(client):
    signup_response = signup_user(
        client,
        username="grader_one",
        email="grader.one@gmail.com",
        password="StrongPass1!",
    )

    assert signup_response.status_code == 201

    payload = signup_response.get_json()
    access_token = payload["access_token"]
    assert access_token
    assert payload["user"]["username"] == "grader_one"

    me_response = client.get("/api/me", headers=auth_header(access_token))

    assert me_response.status_code == 200
    assert me_response.get_json()["user"]["username"] == "grader_one"


def test_category_crud_and_ownership_isolation(client):
    signup_1 = signup_user(
        client,
        username="owner_user",
        email="owner.user@gmail.com",
        password="StrongPass1!",
    )
    token_1 = signup_1.get_json()["access_token"]

    create_response = client.post(
        "/api/categories",
        json={"name": "Travel"},
        headers=auth_header(token_1),
    )
    assert create_response.status_code == 201
    created_category = create_response.get_json()
    category_id = created_category["id"]

    list_response = client.get("/api/categories", headers=auth_header(token_1))
    assert list_response.status_code == 200
    category_names = [item["name"] for item in list_response.get_json()["categories"]]
    assert "travel" in category_names

    patch_response = client.patch(
        f"/api/categories/{category_id}",
        json={"name": "Trips"},
        headers=auth_header(token_1),
    )
    assert patch_response.status_code == 200
    assert patch_response.get_json()["name"] == "trips"

    signup_2 = signup_user(
        client,
        username="other_user",
        email="other.user@yahoo.com",
        password="StrongPass1!",
    )
    token_2 = signup_2.get_json()["access_token"]

    cross_user_get = client.get(
        f"/api/categories/{category_id}", headers=auth_header(token_2)
    )
    assert cross_user_get.status_code == 404

    delete_response = client.delete(
        f"/api/categories/{category_id}", headers=auth_header(token_1)
    )
    assert delete_response.status_code == 204
