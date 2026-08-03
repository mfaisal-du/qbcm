# COM Question Bank - Complete Setup Guide

This guide will walk you through setting up the entire application step by step.

## ✅ Already Completed:
- ✅ All source code files created
- ✅ Backend configuration (`.env` file)
- ✅ Frontend configuration (`.env` file)
- ✅ Database schema prepared
- ✅ Project structure organized

---

## 🔄 NEXT STEPS - Follow in Order

### **STEP 1: Import Database Schema** (5 minutes)

**You are here:** In phpMyAdmin with `cm_question_bank` database visible

**Action:**
1. Click **"cm_question_bank"** database name in left sidebar
2. Once inside the database, click **"Import"** tab at the top
3. Click **"Choose File"** button
4. Browse to: `e:\QB_CM\database\schema.sql`
5. Click **"Open"** / **"Select"**
6. Scroll down and click **"Import"** button

**Expected Result:**
- Tables created: users, questions, reviews, student_answers
- Admin user created: admin@comqb.local / admin123
- Success message appears

✅ **Screenshot confirmation:** Send screenshot after successful import

---

### **STEP 2: Install Backend Dependencies** (3-5 minutes)

**Open Terminal 1 (PowerShell):**

```powershell
cd e:\QB_CM\backend
npm install
```

**Wait for:**
- All packages to download (you'll see progress)
- "added X packages" message at the end
- `node_modules` folder appears in backend folder

✅ **Expected output:** "added 47 packages" or similar

---

### **STEP 3: Start Backend Server** (Terminal 1)

```powershell
npm run dev
```

**Wait for message like:**
```
🚀 Server running on http://localhost:5000
```

✅ **Keep this terminal open!** Don't close it.

---

### **STEP 4: Install Frontend Dependencies** (Terminal 2)

**Open NEW Terminal (PowerShell) - DO NOT close Terminal 1:**

```powershell
cd e:\QB_CM\frontend
npm install
```

**Wait for:**
- All packages to download
- "added X packages" message

✅ **Expected output:** "added 150+ packages" or similar

---

### **STEP 5: Start Frontend Server** (Terminal 2)

```powershell
npm run dev
```

**Wait for message like:**
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

✅ **Keep this terminal open too!**

---

## 🌐 STEP 6: Access the Application

**Open your browser and visit:**
```
http://localhost:5173
```

**You should see:**
- COM Question Bank login page
- Login form with fields for email and password

---

## 🔐 STEP 7: First Login

**Use the default admin credentials:**

```
Email:    admin@comqb.local
Password: admin123
```

**After login:**
- You'll see Admin Dashboard
- Navigate using the top menu
- You have access to all features

---

## 🎯 TROUBLESHOOTING

### Issue: "Cannot connect to database"
**Solution:**
1. Check XAMPP MySQL is running (should be green)
2. Verify database `cm_question_bank` exists in phpMyAdmin
3. Check `.env` file has correct credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=(leave empty)
   DB_NAME=cm_question_bank
   ```

### Issue: "Port 5000 already in use"
**Solution:**
1. Close any previous backend sessions
2. Kill the process: Open Task Manager → search "node" → End task
3. Try `npm run dev` again

### Issue: "Port 5173 already in use"
**Solution:**
1. Close any previous frontend sessions
2. Similar to above, kill node.exe processes
3. Try `npm run dev` again

### Issue: "Cannot find module"
**Solution:**
1. Make sure you ran `npm install` in correct folder
2. Check you have `node_modules` folder after npm install
3. Try deleting `node_modules` and run `npm install` again

### Issue: "CORS error" or "API connection failed"
**Solution:**
1. Ensure backend is running on Terminal 1
2. Check browser console (F12) for exact error
3. Visit `http://localhost:5000/health` to test backend
4. Should see: `{"message":"Server is running","timestamp":"..."}`

---

## ✨ What to do after setup

### **As Admin:**

1. **Create Faculty User:**
   - Admin Dashboard → User Management → Add User
   - First Name, Last Name, Email, Role: Faculty, Password
   - Click Save

2. **Create Reviewer User:**
   - Similar process, Role: Reviewer

3. **Create Student User:**
   - Similar process, Role: Student

### **As Faculty (After creating faculty account):**

1. Log out (button top right)
2. Create a new faculty account at `/register` OR
3. Login as the faculty user you created as admin

4. Navigate to: **Faculty → Questions**
5. Click **"Add Question"**
6. Fill in:
   - Question text
   - Subject (e.g., Anatomy)
   - Topic (e.g., Heart)
   - Difficulty (easy/medium/hard)
   - 4 options
   - Mark correct answer
   - Add explanation
7. Click **"Save Question"**

### **As Reviewer:**

1. Login as reviewer user
2. Navigate to: **Reviewer → Reviews**
3. Select a pending question
4. Review and add comments
5. Choose: Approve or Reject
6. Submit

### **As Student:**

1. Login as student user
2. Navigate to: **Student → Practice**
3. Filter questions by subject/difficulty
4. Answer questions
5. View instant feedback
6. Check **My Results** for statistics

---

## 📊 Terminal Status Check

**Terminal 1 (Backend)** should show:
```
🚀 Server running on http://localhost:5000
```

**Terminal 2 (Frontend)** should show:
```
  ➜  Local:   http://localhost:5173/
```

**If you see these messages, everything is working!** ✅

---

## 🔑 Key Credentials

### Default Admin:
- **Email:** admin@comqb.local
- **Password:** admin123

Other users you create will have their own passwords.

---

## 📝 Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | Backend configuration |
| `frontend/.env` | Frontend configuration |
| `database/schema.sql` | Database schema (already imported) |
| `backend/src/server.js` | Express server |
| `frontend/src/App.jsx` | React app |

---

## ✅ Success Indicators

- ✅ Both terminals showing "running" messages
- ✅ Browser showing login page at `http://localhost:5173`
- ✅ Can login with admin@comqb.local
- ✅ Dashboard loads without errors
- ✅ Menu shows appropriate role-based options

---

## 🚀 You're All Set!

Your COM Question Bank is now ready to use. Start by:

1. [Import Database](#step-1-import-database-schema)
2. [Start Backend & Frontend](#step-2-install-backend-dependencies)
3. [Login and Explore](#step-6-access-the-application)

**Questions? Check the README.md or QUICKSTART.md in the project root!**
