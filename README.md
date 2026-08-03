# COM Question Bank - Medical College

A comprehensive web application for managing questions and facilitating learning in medical education. Built with Node.js, Express, React, and MySQL.

## Features

### 👥 User Roles

1. **Admin**
   - Full control over the system
   - Create, edit, delete users
   - Manage question bank
   - View all statistics and reports

2. **Faculty**
   - Create and edit questions
   - Submit questions for review
   - Track question approval status
   - View contribution statistics

3. **Student**
   - Practice questions by subject, topic, or difficulty
   - Instant feedback on answers
   - Track performance and results
   - View explanation for each question

4. **Reviewer**
   - Review questions submitted by faculty
   - Approve or reject questions
   - Add comments and feedback
   - Dashboard showing pending reviews

### 📋 Key Features

- **Question Bank Management**: Create questions with options, explanations, and difficulty levels
- **Filtering & Search**: Filter questions by subject, topic, year, semester, and difficulty
- **Performance Tracking**: Student performance metrics and result analytics
- **Review Workflow**: Questions require review before publication
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Professional UI**: Clean, modern interface with intuitive navigation

## Project Structure

```
QB_CM/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Database operations
│   │   ├── middleware/     # Authentication & validation
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Helper functions (JWT)
│   │   └── server.js       # Express server setup
│   ├── package.json
│   └── .env.example
│
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── store/         # Zustand state management
│   │   ├── utils/         # Utility functions
│   │   ├── hooks/         # Custom React hooks
│   │   ├── App.jsx        # Main app with routing
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Tailwind CSS
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── database/              # Database schema
    └── schema.sql         # Initial database setup
```

## Tech Stack

### Backend
- **Node.js** (v24.13.1)
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Lucide React** - Professional icons
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Database
- **MySQL** - Relational database

## Installation & Setup

### Prerequisites

1. **Node.js** (v24.13.1) and npm (v11.8.0) installed
2. **XAMPP** installed with MySQL running
3. Visual Studio Code (recommended)

### Step 1: Database Setup

1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create a new database named `com_question_bank`
3. Import the schema:
   - Copy contents of `database/schema.sql`
   - Execute in phpMyAdmin SQL tab
4. A default admin user will be created:
   - **Email**: `admin@comqb.local`
   - **Password**: `admin123`

### Step 2: Backend Setup

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=(your XAMPP password)
# DB_NAME=com_question_bank

# Install dependencies
npm install

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 3: Frontend Setup

```bash
cd frontend

# Create .env file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### Step 4: Access Application

1. Open browser: `http://localhost:5173`
2. Login with:
   - **Email**: `admin@comqb.local`
   - **Password**: `admin123`

## API Documentation

### Authentication

**POST /api/auth/register**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@medical.edu",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "student"
}
```

**POST /api/auth/login**
```json
{
  "email": "john@medical.edu",
  "password": "password123"
}
```

### Questions

**GET /api/questions** - Get all questions (with filters)
```
Query Parameters:
- year: optional
- semester: optional
- subject: optional
- topic: optional
- difficulty: optional
- status: optional (pending, approved, rejected)
```

**POST /api/questions** - Create question (Faculty/Admin only)
```json
{
  "questionText": "What is...",
  "questionType": "multiple_choice",
  "subject": "Anatomy",
  "topic": "Heart",
  "year": 2024,
  "semester": 1,
  "difficulty": "medium",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option A",
  "explanation": "Explanation here..."
}
```

**PUT /api/questions/:id** - Update question (Faculty/Admin only)

**DELETE /api/questions/:id** - Delete question (Faculty/Admin only)

### Student Answers

**POST /api/student-answers/submit** - Submit answer
```json
{
  "questionId": 1,
  "selectedAnswer": "Option A",
  "timeSpent": 30
}
```

**GET /api/student-answers/my-results** - Get student results

**GET /api/student-answers/my-stats** - Get student statistics

### Reviews

**POST /api/reviews** - Create review (Reviewer only)
```json
{
  "questionId": 1,
  "status": "approved",
  "comments": "Good question..."
}
```

**GET /api/reviews** - Get all reviews (Reviewer only)

**PUT /api/reviews/:id** - Update review (Reviewer only)

## User Management

### Creating Users

1. **As Admin**: Go to Admin Panel → User Management → Add User
2. **Self Registration**: Users can register on the login page
   - Only students and faculty can self-register
   - Admin and Reviewer accounts created by Admin

### User Roles

| Role | Permissions |
|------|-----------|
| Admin | Create users, manage questions, view all stats |
| Faculty | Create/edit questions, submit for review |
| Student | Practice questions, view results |
| Reviewer | Review and approve/reject questions |

## Common Tasks

### Create Questions (Faculty)

1. Navigate to Faculty → Questions
2. Click "Add Question"
3. Fill in question details
4. Add 4 multiple choice options
5. Mark the correct answer
6. Add explanation (optional)
7. Click "Save Question"

### Review Questions (Reviewer)

1. Navigate to Reviewer → Reviews
2. Select a pending question
3. Review question content
4. Add comments
5. Choose: Approve or Reject
6. Submit review

### Practice Questions (Student)

1. Navigate to Student → Practice
2. Optional: Apply filters (Subject, Difficulty)
3. Answer questions one by one
4. Get instant feedback
5. View results in "My Results"

## Deployment to Vercel (No Backend Server Required)

Each frontend now ships its **own API** as a Vercel Serverless Function (the `api/index.js` + `server/` folder inside each app). The frontends call a **relative `/api`** path, so on production `VITE_API_URL` is left unset and requests hit the same-domain function, which connects directly to the remote MySQL database.

> Frontends CANNOT talk to MySQL from the browser. The serverless functions act as the API layer — they are the middle "backend", but they deploy alongside each frontend, so there is no separate server to host.

### Deploying (3 Vercel projects, or 2 apps + keep DB remote)

1. **Hostinger** — enable remote MySQL, create a DB user allowed from any host (`%`), and note the external host (e.g. `sqlXXX.hostinger.com`).
2. **GitHub** — commit `frontend/` and `student-app/` (`.env`, `node_modules/`, `dist/` are gitignored — never commit secrets).
3. **Vercel** — create a project per app:
   - Project A: root = `frontend/` (admin UI + admin API)
   - Project B: root = `student-app/` (student UI + student API)
4. **Environment Variables** (Vercel → Project → Settings → Environment Variables):
   ```
   DB_HOST=sqlXXX.hostinger.com
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=com_question_bank
   DB_POOL_LIMIT=5
   JWT_SECRET=your_very_long_secret
   JWT_EXPIRE=24h
   ```
   Do **not** set `VITE_API_URL` — the apps fall back to `/api` automatically.
5. Deploy. Refresh routing is solved by `vercel.json` (rewrites `/api/*` to the function and everything else to `index.html`).

### Testing the serverless API locally (optional)

```bash
cd frontend
$env:DB_HOST='localhost'; $env:DB_PORT='3307'; $env:DB_USER='root'; $env:DB_PASSWORD=''
node -e "import('./api/index.js').then(async({default:app})=>{const{createServer}=await import('http');createServer(app).listen(5900,()=>console.log('ok'))})"
```

### Keeping local development working

Local `.env` files still point to `http://localhost:5000` / `http://localhost:5001`, so `npm run dev` + the local backend work exactly as before. Production just omits `VITE_API_URL`, switching both apps to their own `/api` functions.

## Troubleshooting

### Cannot connect to database
- Ensure XAMPP MySQL is running
- Check .env file has correct credentials
- Verify database `com_question_bank` exists

### Frontend cannot reach backend
- Ensure backend is running on port 5000
- Check CORS origin in backend .env
- Visit http://localhost:5000/health to test

### Port already in use
- Backend: `lsof -i :5000` to find and kill process
- Frontend: `lsof -i :5173` to find and kill process

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=com_question_bank
DB_PORT=3306
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=24h
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Security Notes

1. **Change JWT Secret** in production
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** in production
4. **Implement rate limiting** for API endpoints
5. **Validate all inputs** on both frontend and backend
6. **Use strong passwords** for user accounts
7. **Regular backups** of database

## Performance Tips

1. Use database indexes for frequently queried columns
2. Implement pagination for large datasets
3. Cache questions on frontend
4. Use lazy loading for images
5. Minify and compress frontend assets
6. Implement database query optimization

## Support

For issues or feature requests, please contact the development team.

## License

This project is proprietary to COM Medical College.

---

**Built with ❤️ for Medical Education**
