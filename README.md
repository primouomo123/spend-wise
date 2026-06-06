# Spend Wise

Spend Wise is a full-stack personal finance web application that helps users manage their money by tracking transactions, organizing spending categories, creating monthly budgets, and reviewing a monthly summary dashboard. The app includes authentication and user-level data ownership so each user can only access their own records.

## Technologies Used

### Frontend

- React
- Vite
- React Router
- Material UI
- Axios

### Backend

- Python
- Flask
- Flask RESTful
- Flask SQLAlchemy
- Flask Migrate
- Marshmallow
- Flask JWT Extended
- Flask CORS
- Gunicorn

### Database

- SQLite (local development)
- PostgreSQL (for production)

## Setup And Run Instructions

## 1) Clone The Repository

```bash
git clone https://github.com/primouomo123/spend-wise.git
cd spend-wise
```

## 2) Backend Setup

```bash
cd server
pipenv install
pipenv shell
```

Create a .env file in the server folder with:

```env
SECRET_KEY=your_secret_key
DATABASE_URI=sqlite:///app.db
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
JWT_COOKIE_SECURE=false
JWT_COOKIE_SAMESITE=Lax
JWT_COOKIE_CSRF_PROTECT=false
```

Run migrations seed:

```bash
flask db upgrade
python seed.py
```

Start backend server:

```bash
python app.py
```

Backend runs on http://localhost:5555

## 3) Frontend Setup

Open a new terminal:

```bash
cd client
npm install
```

Client .env file:

```env
VITE_API_ENDPOINT=http://localhost:5555/api
```

Start frontend dev server:

```bash
npm run dev
```

Frontend runs on http://localhost:5173

## 4) Run Tests

Backend tests:

```bash
cd server
pytest
```

Optional quality checks:

```bash
cd client
npm run lint
```

## Overview Of Core Functionality

- User authentication: sign up, log in, token refresh, and log out
- Protected routes and API authorization for authenticated users
- Category management: create, read, update, and delete custom categories
- Transaction management: create, read, update, and delete income and expense transactions
- Budget management: create, read, update, and delete monthly budgets by category
- Monthly summary endpoint for dashboard insights
- Ownership enforcement so users can only access their own data

## Deployment Link (Optional)

- Frontend: https://spend-wise-sngk.onrender.com
- Backend API: https://spend-wise-88ez.onrender.com