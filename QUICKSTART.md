# COM Question Bank - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Prerequisites Check
- ✅ Node.js v24.13.1 installed? (`node --version`)
- ✅ npm v11.8.0 installed? (`npm --version`)
- ✅ XAMPP running with MySQL on port 3306?

---

## Phase 1: Database Setup (2 minutes)

### Step 1: Create Database
1. Open browser → `http://localhost/phpmyadmin`
2. Click "Databases" tab
3. Enter `com_question_bank` in "Create database"
4. Click "Create"

### Step 2: Import Schema
1. Select the new `com_question_bank` database
2. Click "Import" tab
3. Click "Choose File"
4. Select `database/schema.sql` from your project
5. Click "Import"

**Default Admin Created:**
- Email: `admin@comqb.local`
- Password: `admin123`

---

## Phase 2: Backend Setup (2 minutes)

### Terminal Session 1: Backend

```bash
cd e:\QB_CM\backend

# Setup environment
copy .env.example .env

# Edit .env file (open in notepad and update if needed):
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=(leave empty if no password)
# DB_NAME=com_question_bank

# Install dependencies
npm install

# Start server
npm run dev
```

✅ **Backend should be running at:** http://localhost:5000

**Health Check:** Visit http://localhost:5000/health

---

## Phase 3: Frontend Setup (1 minute)

### Terminal Session 2: Frontend

```bash
cd e:\QB_CM\frontend

# Setup environment
copy .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ **Frontend should be running at:** http://localhost:5173

---

## Access the Application

### In Your Browser:
```
http://localhost:5173
```

### Default Login:
```
Email: admin@comqb.local
Password: admin123
```

---

## 📝 First Steps After Login

### 1. Create a Faculty Account
1. Logout from admin account
2. Go to http://localhost:5173/register
3. Register as "Faculty"
4. Complete registration

### 2. Create a Student Account
1. Similar process, register as "Student"

### 3. Create a Reviewer Account (as Admin)
1. Login as admin
2. Go to Admin → User Management
3. Click "Add User"
4. Create user with role "reviewer"

### 4. Create Your First Question (as Faculty)
1. Login as faculty account
2. Navigate to Faculty → Questions
3. Click "Add Question"
4. Fill in:
   - Question text
   - Subject (e.g., Anatomy)
   - Topic (e.g., Heart)
   - Difficulty (easy/medium/hard)
   - 4 Multiple choice options
   - Mark correct answer
   - Add explanation
5. Click "Save Question"

### 5. Review Question (as Reviewer)
1. Login as reviewer account
2. Navigate to Reviewer → Reviews
3. Select pending question
4. Add comments
5. Choose "Approve" or "Reject"
6. Submit review

### 6. Practice Question (as Student)
1. Login as student account
2. Navigate to Student → Practice
3. Answer a question
4. Review result and explanation
5. View stats in "My Results"

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Error: Port 5000 already in use?
# Windows: Find and close the process
# Check if another instance is running

# Try changing PORT in .env
PORT=5001

# Try again
npm run dev
```

### Frontend won't start
```bash
# Error: Port 5173 already in use?
# Kill other process and try again

# Check vite.config.js for port configuration
npm run dev
```

### Cannot login
- Check email is correct
- Default: `admin@comqb.local`
- Check password: `admin123`
- Verify database was imported correctly

### API calls failing
- Check backend is running (`http://localhost:5000/health`)
- Check firewall isn't blocking port 5000
- Check CORS configuration in backend .env
- Check network tab in browser DevTools

---

## 📚 Application Workflow

```
Admin
├── Manages users (create, edit, delete)
├── Views all questions
├── Views all statistics
└── Can perform all operations

Faculty
├── Create questions
├── Edit own questions
├── View submission status
└── Wait for reviewer approval

Reviewer
├── See pending questions
├── Review questions
├── Approve/Reject with comments
└── Questions become available after approval

Student
├── Browse available questions
├── Practice by subject/topic
├── Get instant feedback
├── Track performance
└── View results
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend/src/server.js` | Express server entry point |
| `backend/.env` | Backend configuration |
| `frontend/src/App.jsx` | React app router |
| `frontend/.env` | Frontend configuration |
| `database/schema.sql` | Database initial setup |

---

## 🛠️ Development Commands

### Backend
```bash
cd backend
npm run dev       # Development server with auto-reload
npm start         # Production server
```

### Frontend
```bash
cd frontend
npm run dev       # Development server
npm run build     # Create production build
npm run preview   # Preview production build
```

---

## 🔐 Security Reminders

1. **Change Default Password**: After first login, change admin password
2. **Never commit .env**: These files contain sensitive data
3. **Use HTTPS in Production**: Install SSL certificate
4. **Change JWT_SECRET**: Use strong random string in production
5. **Database Backups**: Regularly backup `com_question_bank` database

---

## 📊 Database Schema Overview

### Tables
- **users**: User accounts and authentication
- **questions**: Question bank with metadata
- **reviews**: Question review workflow
- **student_answers**: Student responses and performance tracking

---

## 🎯 Next Steps

1. ✅ Setup completed successfully
2. Create test users of each type
3. Create sample questions
4. Test the full workflow (Faculty → Reviewer → Student)
5. Configure any specific requirements
6. Deploy to production server
7. Setup SSL/HTTPS

---

## 📞 Support Resources

- **Database Connection Issues:** Check XAMPP, verify credentials in .env
- **Port Conflicts:** Change port in .env and vite.config.js
- **Authentication Errors:** Clear browser cache, verify JWT in .env
- **UI Issues:** Check browser console for errors (F12)

---

## ✨ Features Ready to Use

- ✅ Role-based authentication (4 roles)
- ✅ Question CRUD operations
- ✅ Review workflow
- ✅ Student practice and results
- ✅ Professional responsive UI
- ✅ Real-time notifications
- ✅ Filtering and search
- ✅ Performance analytics

---

**Happy learning! 🎓**
