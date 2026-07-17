# 🔧 FIX: Install Git on Windows

**Problem:** Git is not installed on your computer  
**Solution:** Install Git (takes 5 minutes)

---

# STEP 1: DOWNLOAD GIT

Go to: https://git-scm.com/download/win

**You'll see:**
```
Git for Windows portable
(or)
Git for Windows installer
```

**Click:** "Git for Windows installer" (the bigger download)

A file will download:
```
Git-2.42.0-64-bit.exe
(or similar version)
```

---

# STEP 2: RUN INSTALLER

Find the file you just downloaded (probably in Downloads folder)

**Double-click:** `Git-2.42.0-64-bit.exe`

A window will open: "Git Setup Wizard"

---

# STEP 3: FOLLOW INSTALLER (Click Next through all steps)

### Screen 1: License
- Read it (or skip)
- Click: **Next**

### Screen 2: Installation Location
- Default is fine: `C:\Program Files\Git`
- Click: **Next**

### Screen 3: Select Components
- Default selections are fine
- Click: **Next**

### Screen 4: Start Menu Folder
- Default is fine
- Click: **Next**

### Screen 5: Choose Default Editor
- Select: **Use Visual Studio Code as Git's default editor**
- (or Notepad if VS Code not available)
- Click: **Next**

### Screen 6: Adjust PATH Environment
- Select: **Git from the command line and also from 3rd-party software**
- Click: **Next**

### Screen 7: Choose SSH Executable
- Default is fine
- Click: **Next**

### Screen 8: Choose HTTPS Transport Backend
- Default is fine (Use the native Windows Secure Channel library)
- Click: **Next**

### Screen 9: Configure Line Endings
- Select: **Checkout Windows-style, commit Unix-style line endings**
- Click: **Next**

### Screen 10: Configure Terminal
- Select: **Use Windows' default console window**
- Click: **Next**

### Screen 11: Configure Extra Options
- Default is fine
- Click: **Install**

**Wait for installation to complete** (1-2 minutes)

### Final Screen:
- Check: ☑️ Launch Git Bash
- Click: **Finish**

---

# STEP 4: VERIFY INSTALLATION

After installer closes, **close any Git Bash windows** that opened.

Go back to PowerShell and run:

```powershell
git --version
```

**You should see:**
```
git version 2.42.0.windows.1
```

✅ **Git is installed!**

---

# NOW TRY AGAIN

Go back to PowerShell and run:

```powershell
cd Documents\Projects
git clone https://github.com/sonnyllarena-git/tcp-onboarding-app.git
```

**You should see:**
```
Cloning into 'tcp-onboarding-app'...
remote: Enumerating objects. done.
remote: Counting objects. 100% (3/3), done.
remote: Compressing objects. 100% (3/3), done.
remote: Receiving objects. 100% (3/3), done.
Unpacking objects. 100% (3/3), done.
```

✅ **Repository cloned!**

---

# THEN CONTINUE WITH:

```powershell
cd tcp-onboarding-app
git status
mkdir frontend backend database docs tests
mkdir .github\.github\workflows
code .
git add .
git commit -m "chore: initial project setup with folder structure"
git push origin main
```

---

# TROUBLESHOOTING

## PowerShell says "git" not found after installing:

**Solution:** Restart PowerShell or restart your computer

```powershell
# Close PowerShell completely
# Open it again fresh
# Try: git --version
```

## Git installation won't start:

Try downloading from here instead:
https://github.com/git-for-windows/git/releases/download/v2.42.0.windows.1/Git-2.42.0-64-bit.exe

---

**Once Git is installed and you've run the clone command, tell me:**

"Git installed! Repository cloned! Ready for next steps! ✅"

Then we'll continue with folder structure and first commit!
