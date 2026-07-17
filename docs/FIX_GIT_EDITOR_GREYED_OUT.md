# 🔧 FIX: Git Installer - Editor Selection Greyed Out

**Problem:** VS Code option is greyed out and Next button won't work  
**Solution:** Choose a different editor that's available

---

# QUICK FIX

## On the Git Setup screen where it says "Choose Default Editor":

**You should see options like:**
```
☐ Use Visual Studio Code as Git's default editor
☐ Use Visual Studio Code Insiders as Git's default editor
☐ Use Notepad as Git's default editor
☐ Use Vim as Git's default editor
☐ (others)
```

### If VS Code is greyed out:

**CLICK ON:** `Use Notepad as Git's default editor`

You should see a radio button selected:
```
◯ Use Notepad as Git's default editor
```

**NOW click: Next →**

---

# WHY THIS WORKS

- Notepad is always available on Windows
- Git just needs SOME editor selected
- You can change it later if you want
- For now, it doesn't matter which one

---

# CONTINUE INSTALLATION

After selecting Notepad and clicking Next:

- Keep clicking Next through remaining screens
- When you see "Install" button, click it
- Wait for installation to complete
- When done, click "Finish"

---

# VERIFY GIT INSTALLED

Close PowerShell completely.

Open PowerShell again fresh.

Run:
```powershell
git --version
```

Should show:
```
git version 2.xx.x.windows.x
```

✅ **Git is installed!**

---

# NOW CLONE YOUR REPO

```powershell
cd Documents\Projects
git clone https://github.com/sonnyllarena-git/tcp-onboarding-app.git
```

---

**Try this and let me know when it works!** 🚀
