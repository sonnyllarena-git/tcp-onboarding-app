# 🔧 FIX: Add Files to Folders So They Show on GitHub

**Problem:** Empty folders don't show on GitHub  
**Solution:** Add .gitkeep files to each folder

---

# IN POWERSHELL, RUN THESE COMMANDS:

```powershell
# Make sure you're in the tcp-onboarding-app folder
cd C:\Users\SonnyLlarena\Documents\Projects\tcp-onboarding-app

# Create .gitkeep files in each folder
# (This tells Git: "keep this folder even though it's empty")

echo "" > frontend\.gitkeep
echo "" > backend\.gitkeep
echo "" > database\.gitkeep
echo "" > docs\.gitkeep
echo "" > tests\.gitkeep
echo "" > .github\.gitkeep
echo "" > .github\workflows\.gitkeep

# Check what we created
dir
dir frontend
dir backend
```

---

# NOW COMMIT AND PUSH

```powershell
# Stage all files
git add .

# Commit
git commit -m "feat: add folder structure with .gitkeep files

- Add frontend folder for React components
- Add backend folder for Node.js API
- Add database folder for SQL files
- Add docs folder for documentation
- Add tests folder for test files
- Add .github/workflows folder for CI/CD

Folders are now tracked on GitHub."

# Push to GitHub
git push origin main
```

---

# VERIFY ON GITHUB

Go to: https://github.com/sonnyllarena-git/tcp-onboarding-app

**You should now see:**
```
tcp-onboarding-app
├── .github/
│   ├── workflows/
│   └── .gitkeep
├── backend/
│   └── .gitkeep
├── database/
│   └── .gitkeep
├── docs/
│   └── .gitkeep
├── frontend/
│   └── .gitkeep
├── tests/
│   └── .gitkeep
├── README.md
├── .gitignore
└── LICENSE
```

✅ **All folders now visible on GitHub!**

---

**Let me know when you've run these commands and verified on GitHub!** 🚀
