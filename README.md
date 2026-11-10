# Sweety – Blood Glucose Tracker

A full-stack web application for recording and tracking daily blood glucose readings.

## Technology Stack
- Frontend: React.js, Vite, CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL
- Authentication: JWT and bcryptjs

## Features
- User registration and login
- Secure password hashing
- JWT-based authentication
- Add, view, edit and delete glucose readings
- Four daily reading slots:
  - Morning
  - After breakfast
  - After lunch
  - After dinner
- Reading validation: 40–600 mg/dL
- Prevent duplicate readings for the same time slot and date
- Daily and monthly reports

## Project Setup

### 1. Backend

Open a terminal:

```bash
cd server
npm install
npm run dev
```

### 2. Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

### 3. Environment Configuration

Create `server/.env` using the values in `server/.env.example`. Enter your own PostgreSQL password and a strong JWT secret.

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database

Create a PostgreSQL database named `sweety_db` and configure its tables before starting the application.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/readings | Get readings |
| POST | /api/readings | Add reading |
| PUT | /api/readings/:id | Update reading |
| DELETE | /api/readings/:id | Delete reading |
| GET | /api/reports | Get reports |

## Author
Palakonda Reddy