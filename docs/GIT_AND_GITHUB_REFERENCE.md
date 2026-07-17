# 📚 GIT & GITHUB REFERENCE GUIDE

**For:** Sonny Llarena (sonnyllarena-git)  
**Project:** tcp-onboarding-app  
**Repository:** https://github.com/sonnyllarena-git/tcp-onboarding-app

---

# 🔑 YOUR GIT CREDENTIALS

| Item | Value |
|------|-------|
| GitHub Username | sonnyllarena-git |
| Repository Name | tcp-onboarding-app |
| Repository URL | https://github.com/sonnyllarena-git/tcp-onboarding-app |
| Local Folder | C:\Users\SonnyLlarena\Documents\Projects\tcp-onboarding-app |
| Default Branch | main |
| Git Version | 2.55.0 |
| Credential Manager | Git Credential Manager |

---

# 📁 LOCAL FOLDER STRUCTURE

```
tcp-onboarding-app/
│
├── .git/                        ← Git tracking (hidden)
├── .github/
│   └── workflows/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── routes/
├── database/
│   ├── migrations/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── SECURITY.md
│   └── SETUP.md
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── styles/
│       └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .gitignore               ← Configured
├── LICENSE
└── README.md
```

---

# 🔄 DAILY GIT WORKFLOW

## Step 1: Start Your Day
```powershell
cd C:\Users\SonnyLlarena\Documents\Projects\tcp-onboarding-app
git pull origin main
```
**Purpose:** Get latest code from GitHub

---

## Step 2: Make Changes
```
Edit files in VS Code
Write code in frontend/, backend/, database/, etc.
```
**Purpose:** Build features

---

## Step 3: Check Status
```powershell
git status
```
**Output Example:**
```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   frontend/src/components/LoginPage.jsx
        modified:   backend/routes/users.js
        new file:   database/schema.sql

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        frontend/src/components/Dashboard.jsx
```

**What this means:**
- `modified:` - You changed this file
- `new file:` - You created this file
- `Untracked files:` - New files not yet tracked by Git

---

## Step 4: Stage Changes
```powershell
git add .
```

**Or stage specific files:**
```powershell
git add frontend/src/components/LoginPage.jsx
git add backend/routes/users.js
```

**Verify what's staged:**
```powershell
git status
```

---

## Step 5: Commit Changes
```powershell
git commit -m "feat: add login component with Azure AD authentication

- Create LoginPage React component
- Add Microsoft login button
- Implement MFA flow
- Add TCP Navy styling
- Responsive design for mobile"
```

**Commit message format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Adding tests
- `chore:` Build/dependency changes

---

## Step 6: Push to GitHub
```powershell
git push origin main
```

**Output:**
```
Enumerating objects. done.
Counting objects. 100% (5/5), done.
Compressing objects. 100% (3/3), done.
Writing objects. 100% (5/5), 1.23 KiB | 1.23 MiB/s, done.
Total 5 (delta 2), reused 0 (delta 0), pack-reused 0
To https://github.com/sonnyllarena-git/tcp-onboarding-app.git
   abc1234..def5678  main -> main
```

---

## Step 7: Verify on GitHub
```
https://github.com/sonnyllarena-git/tcp-onboarding-app
```

**You should see your commit appear in the commit history!**

---

# 📋 COMMON GIT COMMANDS

## Check Repository Status
```powershell
git status          # See what changed
git log             # See commit history
git log --oneline   # Short commit history
git log -5          # Last 5 commits
git diff            # Show detailed changes
```

## Staging & Committing
```powershell
git add .           # Stage all changes
git add filename    # Stage specific file
git commit -m "..."  # Commit with message
git commit --amend   # Edit last commit message
```

## Branching
```powershell
git branch                      # List branches
git checkout -b feature/login    # Create & switch to new branch
git checkout main               # Switch to main branch
git merge feature/login          # Merge feature into main
git branch -d feature/login      # Delete branch
```

## Pushing & Pulling
```powershell
git push origin main            # Push to GitHub
git push origin feature/branch   # Push feature branch
git pull origin main            # Pull latest from GitHub
git fetch                       # Get latest without merging
```

## Undoing Changes
```powershell
git restore filename            # Discard changes to file
git reset HEAD filename         # Unstage file
git reset --hard                # Discard all local changes
```

## Viewing History
```powershell
git log --oneline               # Compact history
git log --graph --oneline --all # Branch visualization
git show commit-hash            # Show specific commit
```

---

# 🎯 EXAMPLE WORKFLOWS

## Workflow 1: Simple Feature
```powershell
# 1. Pull latest
git pull origin main

# 2. Create feature branch
git checkout -b feat/login-form

# 3. Make changes, test locally

# 4. Stage and commit
git add .
git commit -m "feat: add login form with validation

- Create LoginForm component
- Add email/password validation
- Add submit handler"

# 5. Push to GitHub
git push origin feat/login-form

# 6. Merge to main
git checkout main
git merge feat/login-form
git push origin main

# 7. Delete feature branch
git branch -d feat/login-form
```

## Workflow 2: Bug Fix
```powershell
# 1. Create bug fix branch
git checkout -b fix/login-button

# 2. Fix the bug

# 3. Commit
git add .
git commit -m "fix: resolve login button click issue

- Add event handler properly
- Remove duplicate onClick
- Test in all browsers"

# 4. Push and merge
git push origin fix/login-button
git checkout main
git merge fix/login-button
git push origin main
```

## Workflow 3: Multiple Commits in One Day
```powershell
# Morning
git add frontend/src/components/LoginPage.jsx
git commit -m "feat: add login page component"
git push origin main

# Afternoon
git add backend/routes/auth.js
git commit -m "feat: add authentication routes"
git push origin main

# Evening
git add database/schema.sql
git commit -m "docs: document user authentication schema"
git push origin main

# Result: 3 commits on GitHub showing daily progress!
```

---

# 📊 GITHUB INTERFACE

## Your Repository Page
```
https://github.com/sonnyllarena-git/tcp-onboarding-app
```

**What you'll see:**
- Commit history on the right
- Folder structure in the middle
- README.md displayed below
- About section with description
- Commits count
- Contributors

## Viewing Commits
```
Click on "3 Commits" (or however many)
→ See all commits with messages
→ Click on commit to see changes
→ Green = Added, Red = Deleted
```

## Branch Management
```
Click on "main" button
→ See all branches
→ Delete old branches
→ Create new branches
```

---

# ⚠️ IMPORTANT GIT RULES

## DO:
✅ Commit frequently (daily minimum)  
✅ Write clear commit messages  
✅ Push to GitHub daily  
✅ Pull before starting work  
✅ Create branches for big features  
✅ Test before committing  

## DON'T:
❌ Commit secrets (.env files with passwords)  
❌ Commit large files (videos, packages)  
❌ Use vague messages ("update", "fix", "changes")  
❌ Force push to main (git push --force)  
❌ Delete main branch  
❌ Commit node_modules/ or .env  

---

# 🔒 .gitignore (Already Configured)

Your `.gitignore` file tells Git what NOT to commit:

```
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Database
*.db

# Build
dist/
build/

# Testing
coverage/
```

**What this prevents:**
- Committing `node_modules/` (huge, can reinstall with npm)
- Committing `.env` (has passwords, not safe to commit)
- Committing IDE files (.vscode settings)

---

# 🆘 TROUBLESHOOTING

## Problem: "Git command not found"
```powershell
# Solution: Restart PowerShell
# Close PowerShell completely
# Open fresh PowerShell
# Try again
```

## Problem: "Permission denied" when pushing
```powershell
# Solution: Re-authenticate
# Git will ask for GitHub credentials
# Or use GitHub CLI: gh auth login
```

## Problem: "Merge conflict"
```powershell
# This happens when same file changed on both branches
# Fix: Edit file, remove conflict markers
# Then: git add . && git commit -m "..."
```

## Problem: Need to undo last commit
```powershell
# If not pushed yet:
git reset --soft HEAD~1

# If already pushed:
git revert HEAD
git push origin main
```

---

# 📈 MEASURING PROGRESS

## Commits Show Your Progress
```
Week 1: 5-10 commits (setup)
Week 2: 20-30 commits (building)
Week 3-8: 500+ commits total (production app)
```

## GitHub Shows:
- Contribution graph (green squares = commits)
- Commit history (tells your story)
- Code changes (shows what you built)
- Collaborators (who worked with you)

**Your goal:** 500+ commits by week 8

---

# 🎓 LEARNING MORE

## Git Commands Help
```powershell
git help <command>
git help commit
git help push
```

## GitHub Docs
```
https://docs.github.com/
https://docs.github.com/en/get-started
```

## Common Patterns
- **Feature branch workflow** (recommended for you)
- **GitHub flow** (simpler)
- **Git flow** (complex, for teams)

---

# 🎯 YOUR DAILY ROUTINE

```
9:00 AM:
  git pull origin main

9:00 AM - 12:00 PM:
  Code (edit files, create features)

12:00 PM:
  git add .
  git commit -m "feat: morning work"
  git push origin main

1:00 PM - 5:00 PM:
  Code (edit files, create more features)

5:00 PM:
  git add .
  git commit -m "feat: afternoon work"
  git push origin main
```

**Result:** 2 commits per day = 10 per week = 80+ per 8 weeks!

---

# ✅ CHECKLIST

- [x] Git installed
- [x] Repository cloned
- [x] Folder structure created
- [x] .gitignore configured
- [x] README.md visible
- [x] GitHub username set up
- [x] First commits made
- [ ] Ready to code!

---

**You're now ready to commit code and build the app!** 🚀

Remember: Every commit is a step toward production.
Every push is saving your work.
Every feature is building your portfolio.

**Keep committing. Keep building. Keep pushing.** 💪

