# Quick Testing Guide - Faculty & Reviewer Features

## Setup (Run These First)

```bash
# Terminal 1: Backend
cd e:\QB_CM\backend
npm start

# Terminal 2: Frontend  
cd e:\QB_CM\frontend
npm run dev
```

Access app at: **http://localhost:5173**

---

## Test Scenario 1: Faculty Creating Questions

### Credentials
- **Email:** faculty1@test.com
- **Password:** password123

### Steps
1. Navigate to **Faculty Dashboard** → **My Questions**
2. Click **Create Question** button
3. **Fill the form:**
   - Question Text: "What is the primary function of mitochondria?"
   - Subject: "Biochemistry"
   - Topic: "Cellular Biology"
   - Year: "1"
   - Semester: "1"
   - Difficulty: "medium"
   - Cognitive Level: "comprehension"
   - Assessment Type: "formative"
   - Learning Outcome: "Understanding cellular metabolism"
   - Competencies: "Biochemical analysis"
   - Course Code: "BIO101"
   - Weighting: "5"
   - Coverage: "course"
   - Options: ["ATP production", "Protein synthesis", "DNA replication", "Photosynthesis"]
   - Correct Answer: "ATP production"
   - Explanation: "Mitochondria are responsible for ATP production through oxidative phosphorylation."

4. Click **Save** → Verify question appears in list
5. Click **Eye icon** → View details (read-only modal)
6. Click **Edit icon** → Modify question
7. Check **FacultyContributions** page for statistics

### Expected Results
- ✅ Question appears in "My Questions" list
- ✅ Status shows "PENDING" (yellow badge)
- ✅ Subject and Cognitive Level badges display
- ✅ Question metadata visible
- ✅ Can view, edit, and delete questions

---

## Test Scenario 2: Faculty Viewing Questions with Status

### Steps
1. In **My Questions**, observe:
   - ✓ **Green badge**: Approved questions (previously reviewed)
   - ✗ **Red badge**: Rejected questions (with comments)
   - ⏱ **Yellow badge**: Pending questions (awaiting review)

2. View different question statuses:
   - Click Eye icon on different questions
   - Note status symbol in top-left of detail view
   - Approved: ✓ APPROVED
   - Rejected: ✗ REJECTED  
   - Pending: ⏱ PENDING

### Expected Results
- ✅ Status badges clearly indicate question state
- ✅ Detail view shows status consistently
- ✅ Can distinguish between different statuses at a glance

---

## Test Scenario 3: Reviewer Dashboard

### Credentials
- **Email:** reviewer1@test.com
- **Password:** password123

### Steps
1. Navigate to **Reviewer Dashboard**
2. **Verify stats displayed:**
   - Pending Reviews count (number of pending questions)
   - Approved count (previously approved)
   - Rejected count (previously rejected)
3. **View Pending Questions section:**
   - Shows up to 5 recent pending questions
   - Each shows: Question preview, Subject, Topic, Cognitive Level, Status badge

### Expected Results
- ✅ Stats accurately reflect pending/approved/rejected counts
- ✅ Pending questions list shows with all metadata
- ✅ Numbers match total questions in database

---

## Test Scenario 4: Reviewer Reviewing Questions

### Steps
1. Click **Reviewer** → **Questions to Review**
2. **Verify empty message** appears if no pending questions
3. **If pending questions exist:**
   - Click on any question card
   - **Detail view opens showing:**
     - Full question text
     - Subject, Topic, Cognitive Level
     - Year/Semester, Difficulty
     - Assessment Type, Coverage
     - Learning Outcome, Competencies
     - Answer Options with correct answer highlighted (✓)
     - Explanation

4. **In review form (right panel):**
   - Select **Approve** or **Reject** option
   - Type review comments
   - Click **Submit Review**

5. **Verify:**
   - Question removed from pending list
   - Dashboard stats updated
   - Back to Questions list after submission

### Expected Results
- ✅ Question detail displays all fields correctly
- ✅ Review form accepts decision and comments
- ✅ Submission successful
- ✅ Question no longer in pending list
- ✅ Dashboard counts updated

---

## Test Scenario 5: Testing with Multiple Questions

### Bulk Testing Steps
1. **As Faculty (faculty1@test.com):**
   - Create 3-5 questions with different cognitive levels
   - Mix of formative/summative assessments
   - Different subjects and years
   - Save all questions

2. **As Reviewer (reviewer1@test.com):**
   - View Questions to Review page
   - Verify all faculty questions appear
   - Approve 2 questions
   - Reject 1-2 questions with comments
   - Note any that remain pending

3. **Back as Faculty:**
   - Refresh My Questions page
   - Verify status updates reflect reviewer actions
   - Approved questions: ✓ badge
   - Rejected questions: ✗ badge with comment visible

### Expected Results
- ✅ All questions created successfully
- ✅ All pending questions visible to reviewer
- ✅ Reviews submitted and processed
- ✅ Status updates reflected in faculty view
- ✅ Comment preservation (if modal shows comments)

---

## Test Scenario 6: Verified Field Display

### In Faculty Form - Verify These Fields Appear:
- [x] Question Text (textarea)
- [x] Subject (dropdown)
- [x] Topic (text input)
- [x] Year (dropdown)
- [x] Semester (dropdown)
- [x] Difficulty (dropdown)
- [x] Cognitive Level (dropdown with 7 options)
- [x] Assessment Type (dropdown)
- [x] Learning Outcome (text input)
- [x] Competencies (text input)
- [x] Course Code (text input)
- [x] Weighting (number input)
- [x] Coverage (dropdown)
- [x] Answer Options (4 inputs)
- [x] Correct Answer (dropdown)
- [x] Explanation (textarea)

### In Reviewer Detail - Verify These Display:
- [x] Question text
- [x] Status badge
- [x] Subject, Cognitive Level, Topic
- [x] Year/Semester, Difficulty
- [x] Assessment Type, Coverage
- [x] Learning Outcome
- [x] Competencies
- [x] Answer options with correct marked
- [x] Explanation

---

## Troubleshooting

### Issue: "No questions to review" but questions were created
**Solution:**
- Verify questions were saved (check Contributions for count)
- Ensure frontend is connected to backend
- Check browser console (F12 → Console) for errors
- Refresh page (Ctrl+R)

### Issue: Form fields missing
**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check console for import errors
- Verify Common.jsx has all components exported

### Issue: API errors in console
**Solution:**
- Verify backend is running: `npm start` in backend folder
- Check port 5000 is not blocked
- Verify JWT token is valid
- Check database connection

### Issue: Cannot edit/delete questions
**Solution:**
- Verify authenticated as original creator
- Check user permissions in backend
- Verify question ID is correct
- Try refresh and retry

---

## Performance Notes

- **First load:** May take 1-2 seconds to fetch 3,770 questions (consider pagination)
- **Question renders:** Smooth with <50 questions in view
- **Modal open/close:** Instant
- **API calls:** ~500ms response time (backend dependent)

---

## Expected Database State After Testing

After running all scenarios, your database should have:
- Original 3,770 seeded questions
- +5-10 new questions created by faculty test accounts
- Mix of pending/approved/rejected questions
- All questions with new fields populated

**Verify:**
```sql
SELECT COUNT(*) FROM questions;                    -- Should be 3,775+
SELECT COUNT(*) FROM questions WHERE status='pending';  -- Varies by review actions
SELECT COUNT(*) FROM questions WHERE cognitiveLevel IS NOT NULL;
```

---

## Success Criteria ✓

All items completed successfully when:
- [ ] Faculty can create questions with all new fields
- [ ] Faculty can view, edit, delete their questions
- [ ] Faculty sees correct status for each question
- [ ] Reviewer sees pending questions list
- [ ] Reviewer can view full question details
- [ ] Reviewer can approve/reject with comments
- [ ] Questions disappear from pending after review
- [ ] Statistics update in real-time
- [ ] No JavaScript errors in console
- [ ] UI is responsive and user-friendly

---

## Notes

- Questions persist after logout/login
- 3,770 pre-seeded questions available for testing
- Test accounts available:
  - Admin: admin@test.com / password123
  - Faculty: faculty1@test.com / password123
  - Reviewer: reviewer1@test.com / password123
  - Student: student@test.com / password123

---

**Happy Testing! Report any issues or unexpected behavior.**
