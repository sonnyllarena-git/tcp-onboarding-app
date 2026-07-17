# 🚀 START BUILDING NOW - Step by Step Guide

**You are:** On your PC, ready to start  
**Goal:** Clone repo, create structure, first commit  
**Time:** 30 minutes

---

# STEP 1: OPEN COMMAND PROMPT / POWERSHELL

## On Windows:
Press: **Windows Key + R**

Type: 
```
powershell
```

Press: **Enter**

You should see a window that looks like:
```
PS C:\Users\YourName\Documents>
```

---

# STEP 2: CREATE PROJECT FOLDER

## Copy & paste this command:

```powershell
cd Documents
mkdir Projects
cd Projects
```

**What this does:**
- Goes to Documents folder
- Creates Projects folder
- Goes into Projects folder

**You should see:**
```
PS C:\Users\YourName\Documents\Projects>
```

---

# STEP 3: CLONE YOUR GITHUB REPOSITORY

## Copy & paste this exact command:

```powershell
git clone https://github.com/sonnyllarena-git/tcp-onboarding-app.git
```

**What this does:**
- Downloads your repository from GitHub
- Creates tcp-onboarding-app folder
- Copies all files to your computer

**You should see:**
```
Cloning into 'tcp-onboarding-app'...
remote: Enumerating objects. done.
remote: Counting objects. 100% (3/3), done.
remote: Compressing objects. 100% (3/3), done.
remote: Receiving objects. 100% (3/3), done.
Unpacking objects. 100% (3/3), done.
```

---

# STEP 4: GO INTO PROJECT FOLDER

## Copy & paste:

```powershell
cd tcp-onboarding-app
```

**You should see:**
```
PS C:\Users\YourName\Documents\Projects\tcp-onboarding-app>
```

---

# STEP 5: VERIFY IT WORKED

## Copy & paste:

```powershell
git status
```

**You should see something like:**
```
On branch main
nothing to commit, working tree clean
```

**This means:** ✅ Repository cloned successfully!

---

# STEP 6: CREATE FOLDER STRUCTURE

## Copy & paste these commands ONE BY ONE:

```powershell
mkdir frontend
mkdir backend
mkdir database
mkdir docs
mkdir tests
mkdir .github
mkdir .github\workflows
```

**What this creates:**
```
tcp-onboarding-app/
├── frontend/
├── backend/
├── database/
├── docs/
├── tests/
├── .github/
│   └── workflows/
├── .git/
├── README.md
├── LICENSE
└── .gitignore
```

---

# STEP 7: VERIFY FOLDERS CREATED

## Copy & paste:

```powershell
dir
```

**You should see:**
```
backend
database
docs
frontend
tests
.github
.gitignore
LICENSE
README.md
```

✅ All folders created!

---

# STEP 8: OPEN PROJECT IN VS CODE

## Copy & paste:

```powershell
code .
```

**This opens VS Code with your project.**

**You should see:**
```
tcp-onboarding-app
├── frontend/
├── backend/
├── database/
├── docs/
├── tests/
├── .github/
├── README.md
├── LICENSE
└── .gitignore
```

---

# STEP 9: CREATE .gitignore (Properly)

## In VS Code, click File → New File

Name it: `.gitignore`

Paste this content:

```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite

# Build
dist/
build/
.next/

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.parcel-cache/
```

**Save:** Press Ctrl+S

---

# STEP 10: FIRST COMMIT

## Go back to PowerShell

### Check status:
```powershell
git status
```

You should see:
```
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        .gitignore
        backend/
        database/
        docs/
        frontend/
        tests/
```

### Stage all changes:
```powershell
git add .
```

### Make first commit:
```powershell
git commit -m "chore: initial project setup with folder structure

- Create frontend, backend, database folders
- Add documentation folder for design system
- Setup CI/CD workflows folder
- Create tests folder structure
- Add .gitignore for Node.js project

Ready to begin development."
```

**You should see:**
```
[main a1b2c3d] chore: initial project setup with folder structure
 8 files changed, 150 insertions(+)
```

✅ First commit successful!

---

# STEP 11: PUSH TO GITHUB

## Copy & paste:

```powershell
git push origin main
```

**You should see:**
```
Enumerating objects. done.
Counting objects. 100% (10/10), done.
Compressing objects. 100% (5/5), done.
Writing objects. 100% (9/9), 1.23 KiB | 1.23 MiB/s, done.
Total 9 (delta 1), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas. 100% (1/1), done.
To https://github.com/sonnyllarena-git/tcp-onboarding-app.git
   abcdef..a1b2c3d main -> main
```

✅ Pushed to GitHub!

---

# STEP 12: VERIFY ON GITHUB

## Go to GitHub:

```
https://github.com/sonnyllarena-git/tcp-onboarding-app
```

**You should see:**
```
tcp-onboarding-app

Latest commit: "chore: initial project setup..."
Last updated: just now

Folders:
├── frontend/
├── backend/
├── database/
├── docs/
├── tests/
├── .github/
├── README.md
├── LICENSE
└── .gitignore
```

✅ Your commit is visible on GitHub!

---

# 🎉 YOU'VE DONE IT!

## What you accomplished:
✅ Cloned repository  
✅ Created folder structure  
✅ Added .gitignore  
✅ Made first commit  
✅ Pushed to GitHub  
✅ Verified on GitHub.com  

**Your GitHub now shows:**
- 1 commit
- Project folders ready
- .gitignore configured
- Professional structure

---

# NEXT: REVIEW MOCKUPS

Now that your local environment is ready:

1. Open file: `MOCKUP_REVIEW_GUIDE.md`
2. Review all 10 mockup images
3. Give feedback on design
4. I'll update if needed
5. Then you get Claude Code prompt!

---

# QUICK REFERENCE

**Your project location:**
```
C:\Users\YourName\Documents\Projects\tcp-onboarding-app
```

**GitHub URL:**
```
https://github.com/sonnyllarena-git/tcp-onboarding-app
```

**Daily workflow:**
```powershell
# At start of day
cd C:\Users\YourName\Documents\Projects\tcp-onboarding-app
git pull

# After making changes
git add .
git commit -m "feat: your feature description"
git push
```

---

# TROUBLESHOOTING

## Git not recognized:
- Restart PowerShell
- Or restart computer
- Or reinstall Git

## Permission denied:
```powershell
git config --global user.email "your@email.com"
git config --global user.name "Your Name"
```

## Network error pushing:
```powershell
git push origin main
# (try again, might be network lag)
```

---

**Congratulations! You're officially a developer with:**
- ✅ GitHub account
- ✅ Public repository
- ✅ Local setup
- ✅ First commit

**Next step: Review mockups and start building!** 🚀
