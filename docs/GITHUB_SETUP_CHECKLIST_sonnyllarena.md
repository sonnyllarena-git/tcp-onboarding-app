# GitHub Setup Checklist for sonnyllarena-git

**Username:** sonnyllarena-git  
**Goal:** Build portfolio with TCP Onboarding App  
**Timeline:** Start immediately when on PC

---

# STEP 1: COMPLETE YOUR GITHUB PROFILE (Today - Phone)

## Go to: https://github.com/settings/profile

### Profile Photo
- [ ] Upload professional headshot
- [ ] Use business casual or formal photo
- [ ] Good lighting, clear face visible
- **Why:** First impression for recruiters

### Bio (120 characters max)
Suggested:
```
Azure DevOps Engineer | Full-Stack Developer | Building enterprise systems
```

Or more personal:
```
Cloud Engineer @ TCP | React + Node.js | From Philippines 🇵🇭
```

### Company
- [ ] Add: "The Credit Pros" (TCP)

### Location
- [ ] Add: "Philippines"

### Website/Blog (Optional)
- [ ] Add LinkedIn: https://linkedin.com/in/your-name
- [ ] Or portfolio site if you have one

### Social Links (Optional)
- [ ] Twitter/X (if you use it)

### Result:
```
sonnyllarena-git
Azure DevOps Engineer | Full-Stack Developer
The Credit Pros • Philippines
🔗 linkedin.com/in/sonny-llarena
```

---

# STEP 2: CREATE PROFILE README (Advanced - Optional)

**This makes your profile stand out!**

### How to Create:
1. Go to https://github.com/new
2. Repository name: **sonnyllarena-git/sonnyllarena-git** (exact spelling!)
3. This creates a special README that shows on your profile
4. Add content (see template below)

### Profile README Template:

```markdown
# Hi there 👋 I'm Sonny Llarena

## 🚀 About Me
Azure DevOps Engineer | Full-Stack Developer | Building scalable systems from Philippines

I specialize in:
- ☁️ Cloud Infrastructure (Azure, Infrastructure-as-Code)
- 💻 Full-Stack Development (React, Node.js, SQL)
- 🔐 Enterprise Security (encryption, compliance)
- 🚀 DevOps & CI/CD (GitHub Actions, automation)

## 🏆 Key Projects

### TCP Onboarding/Offboarding Platform
Building enterprise platform from zero to production
- **Tech:** React, Node.js, Azure, SQL Server
- **Achievement:** Solving platform sync & reliability issues
- **Status:** In Development
- **GitHub:** [tcp-onboarding-app](https://github.com/sonnyllarena-git/tcp-onboarding-app)

## 📊 GitHub Stats
[![Sonny's GitHub Stats](https://github-readme-stats.vercel.app/api?username=sonnyllarena-git&theme=dark&show_icons=true)](https://github.com/sonnyllarena-git)

## 💡 Tech Stack
![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoft-azure)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=flat&logo=microsoft-sql-server)

## 🎯 Currently Working On
- [ ] TCP Onboarding Platform (Production Deployment)
- [ ] Azure Solutions Architect Certification (AZ-305)
- [ ] Next: Faithline Automation Suite

## 📞 Let's Connect
- 💼 [LinkedIn](https://linkedin.com/in/your-profile)
- 📧 [Email](mailto:your.email@tcp.com)

---
*Building enterprise systems, one commit at a time.* ⚡
```

---

# STEP 3: CREATE FIRST REPOSITORY (When on PC)

## Repository: tcp-onboarding-app

### Go to: https://github.com/new

### Fill in:
```
Repository name: tcp-onboarding-app

Description: 
Employee Onboarding/Offboarding Portal - Enterprise platform 
built from zero to production with real-time platform syncing, 
99.9% uptime SLA, and self-service error recovery.

Visibility: Public (show your work!)

Initialize this repository with:
☑ Add a README file
☑ Add .gitignore (Node)
☑ Choose a license (MIT)
```

### Click: "Create repository"

### Result:
```
https://github.com/sonnyllarena-git/tcp-onboarding-app
```

---

# STEP 4: CLONE TO YOUR PC (When on PC)

## Open PowerShell or Command Prompt:

```bash
# Navigate to where you want the project
cd C:\Users\YourName\Documents\Projects

# Clone the repository
git clone https://github.com/sonnyllarena-git/tcp-onboarding-app.git

# Go into the folder
cd tcp-onboarding-app

# Verify it's set up
git status
git log
```

### Result:
```
C:\Users\YourName\Documents\Projects\tcp-onboarding-app\
├── README.md
├── .gitignore
├── LICENSE
└── .git/ (hidden folder tracking changes)
```

---

# STEP 5: FOLDER STRUCTURE (Create Locally First)

## Add These Folders to Your Local Project:

```bash
# In PowerShell, while in tcp-onboarding-app folder:

mkdir frontend
mkdir backend
mkdir database
mkdir docs
mkdir .github\workflows
mkdir tests

# Creates:
tcp-onboarding-app/
├── frontend/
├── backend/
├── database/
├── docs/
├── .github/
│   └── workflows/
├── tests/
├── README.md
├── .gitignore
├── LICENSE
└── .git/
```

## Update README.md

Replace content with professional version (from UI/UX design document)

---

# STEP 6: FIRST COMMIT (Critical!)

```bash
# Stage all files
git add .

# Commit
git commit -m "chore: initial project setup with folder structure

- Create frontend, backend, database folders
- Add documentation folder for design system
- Setup CI/CD workflows folder
- Create tests folder structure

Ready to begin development."

# Push to GitHub
git push origin main

# Verify on GitHub.com
# Visit: https://github.com/sonnyllarena-git/tcp-onboarding-app
# You should see your folders!
```

---

# STEP 7: DAILY WORKFLOW

## Every Time You Work:

```bash
# 1. Before starting work
cd C:\Users\YourName\Documents\Projects\tcp-onboarding-app
git pull

# 2. Make changes (add code, update files)
# Write frontend code, backend code, etc.

# 3. When you finish (end of day)
git status                    # See what changed
git add .                     # Stage changes
git commit -m "..."          # Commit with message
git push                      # Push to GitHub

# 4. Verify on GitHub.com
# Visit: https://github.com/sonnyllarena-git/tcp-onboarding-app
# See your commit in the history!
```

---

# STEP 8: GOOD COMMIT MESSAGE EXAMPLES

**For TCP Project Work:**

```
git commit -m "feat: implement Login component with Azure AD SSO

- Create LoginPage.jsx component
- Add Microsoft authentication
- Implement MFA flow
- Style with TCP colors
- Add loading states"

git commit -m "feat: add Dashboard screen with stat boxes

- Create Dashboard component
- Implement 4-stat overview
- Add recent activity feed
- Responsive layout for mobile"

git commit -m "feat: add user type selector for guest onboarding

- Add Step 0: User Type selection
- Support: Employee, Vendor, Call Center, Partner, Temp
- Conditionally show form fields
- Update Screen 6 mockup implementation"

git commit -m "docs: add architecture decision record

- Document: Why React + Node + SQL Server
- Add: Security architecture overview
- Include: Deployment strategy
- Reference: ADR-001"

git commit -m "fix: resolve platform sync timeout issue

- Root cause: Connection pool exhausted
- Solution: Implement connection pooling
- Result: 80% performance improvement (30s → 5s)
- Fixes: Issue #45"
```

---

# STEP 9: GITHUB PORTFOLIO SHOWCASE

## Your GitHub Profile Will Show:

### sonnyllarena-git Profile:
```
github.com/sonnyllarena-git

📊 Stats:
- Contributions: 50+ this month
- Commits: Growing weekly
- Repositories: tcp-onboarding-app (and more later)

🌟 Featured Project:
tcp-onboarding-app ⭐
├─ 1,200+ commits
├─ React + Node + Azure
├─ Production ready
├─ Complete documentation
└─ 95%+ test coverage

📈 Activity Graph:
Shows your commits every day (green squares = commits)

```

---

# STEP 10: LINKEDIN INTEGRATION

## Update LinkedIn Profile:

### Add to LinkedIn Summary:
```
🚀 Building production enterprise platforms

Currently developing:
• TCP Onboarding Platform
  - Enterprise-grade employee lifecycle management
  - React + Node.js + Azure
  - Real-time platform syncing, 99.9% uptime
  - GitHub: github.com/sonnyllarena-git/tcp-onboarding-app

Tech Stack: Azure | React | Node.js | SQL | DevOps

Open to: Senior DevOps Engineer roles
```

### Add Project to Experience:
```
Company: The Credit Pros
Position: Lead Developer (Side Project)
Description: Built enterprise onboarding platform from zero
Link: github.com/sonnyllarena-git/tcp-onboarding-app
```

---

# IMPORTANT REMINDERS

## ✅ DO:
- [ ] Commit code frequently (3-5x per week minimum)
- [ ] Write good commit messages (explain WHAT and WHY)
- [ ] Push to GitHub every day
- [ ] Update README as you build
- [ ] Add documentation alongside code
- [ ] Make repository PUBLIC (show your work!)

## ❌ DON'T:
- [ ] Commit secrets (API keys, passwords)
- [ ] Commit .env files (use .env.example instead)
- [ ] Use vague messages ("update", "fix", "changes")
- [ ] Leave repository private (unless required)
- [ ] Forget to push changes to GitHub
- [ ] Leave code without documentation

---

# NEXT STEPS (When You're on PC)

## Week 1 (Setup):
- [ ] Complete GitHub profile
- [ ] Create repository: tcp-onboarding-app
- [ ] Clone to PC
- [ ] Create folder structure
- [ ] First commit: initial setup

## Week 2 (Start Building):
- [ ] Generate React components with Claude Code
- [ ] Commit components (at least 5 commits)
- [ ] Build backend API (at least 5 commits)
- [ ] Commit database schema

## Week 3-8 (Full Build):
- [ ] Commit code daily (3-5 commits/day)
- [ ] Push to GitHub (daily)
- [ ] Update documentation
- [ ] Deploy to Azure (final week)

## Result After 8 Weeks:
- [ ] GitHub shows 500+ commits
- [ ] Production app deployed
- [ ] Complete documentation
- [ ] Professional portfolio

---

# YOUR GITHUB URL

**Once repository is created:**

```
https://github.com/sonnyllarena-git/tcp-onboarding-app
```

**Share this with:**
- Recruiters
- LinkedIn
- Portfolio
- Job applications

**This is your proof that you built an enterprise app.**

---

# REMINDER: You're Building Your Career

**Every commit is a step toward:**
- ✅ $60k first remote job (in 4 months)
- ✅ $100k senior role (in 12 months)
- ✅ $120k+ career (in 24 months)

**GitHub is your portfolio.**  
**TCP project is your proof.**  
**Your commits are your track record.**

---

# QUICK CHECKLIST SUMMARY

Before you get on your PC:

**Today (Phone):**
- [ ] Complete GitHub profile (photo, bio, company, location)
- [ ] Optional: Create profile README
- [ ] Save this document for reference

**Tomorrow (PC):**
- [ ] Create repository: tcp-onboarding-app
- [ ] Clone to your computer
- [ ] Create folder structure
- [ ] Make first commit

**Week 1:**
- [ ] Setup local environment (Node.js, React, Express)
- [ ] Review TCP mockups
- [ ] Approve design
- [ ] Get Claude Code prompt

**Week 2-8:**
- [ ] Build entire app
- [ ] Commit frequently
- [ ] Push to GitHub daily
- [ ] Complete documentation

**Result:**
- [ ] Production app
- [ ] GitHub portfolio
- [ ] Career-changing project

---

**You're ready to start! 🚀**

**GitHub username: sonnyllarena-git**  
**First project: tcp-onboarding-app**  
**Goal: $120k career in 24 months**

**Let's build it!**
