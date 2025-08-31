#!/bin/bash

# ========================================
# CTAS GitHub Security Setup Script
# Run this before your first git push
# ========================================

echo "🔒 CTAS Security Setup Script"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the CTAS root directory"
    exit 1
fi

echo "📂 Current directory: $(pwd)"
echo ""

# 1. Check for existing .env files
echo "🔍 Checking for environment files..."
ENV_FILES=$(find . -name ".env" -not -path "./.git/*" -not -name "*.example" -not -name "*.template")
if [ ! -z "$ENV_FILES" ]; then
    echo "⚠️  WARNING: Found .env files that should not be committed:"
    echo "$ENV_FILES"
    echo ""
    read -p "Do you want to delete these files? (y/N): " delete_env
    if [ "$delete_env" = "y" ] || [ "$delete_env" = "Y" ]; then
        echo "$ENV_FILES" | xargs rm -f
        echo "✅ Environment files deleted"
    else
        echo "❌ Please remove .env files manually before proceeding"
        exit 1
    fi
else
    echo "✅ No problematic .env files found"
fi

# 2. Check for hardcoded secrets in code
echo ""
echo "🔍 Scanning for hardcoded secrets..."
SECRETS_FOUND=false

# Check for Google API keys
if grep -r "AIza[0-9A-Za-z_-]\{35\}" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" frontend/ backend/ 2>/dev/null; then
    echo "❌ Found hardcoded Google API keys!"
    SECRETS_FOUND=true
fi

# Check for Twilio keys
if grep -r "AC[a-zA-Z0-9]\{32\}" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" frontend/ backend/ 2>/dev/null; then
    echo "❌ Found hardcoded Twilio Account SIDs!"
    SECRETS_FOUND=true
fi

# Check for OpenAI keys
if grep -r "sk-[a-zA-Z0-9]\{32,\}" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" frontend/ backend/ 2>/dev/null; then
    echo "❌ Found hardcoded OpenAI API keys!"
    SECRETS_FOUND=true
fi

if [ "$SECRETS_FOUND" = true ]; then
    echo "❌ Please remove hardcoded secrets before proceeding"
    echo "   Use environment variables instead: process.env.VARIABLE_NAME"
    exit 1
else
    echo "✅ No hardcoded secrets found"
fi

# 3. Verify .gitignore
echo ""
echo "🔍 Checking .gitignore..."
if [ ! -f ".gitignore" ]; then
    echo "❌ No .gitignore file found!"
    exit 1
fi

# Check if .env is ignored
if grep -q "^\.env$" .gitignore && grep -q "^\*\.env$" .gitignore; then
    echo "✅ Environment files are properly ignored"
else
    echo "⚠️  Adding environment protection to .gitignore"
    echo "" >> .gitignore
    echo "# Environment files" >> .gitignore
    echo ".env" >> .gitignore
    echo "*.env" >> .gitignore
    echo ".env.*" >> .gitignore
    echo "!.env.example" >> .gitignore
fi

# 4. Check .env.example files
echo ""
echo "🔍 Checking .env.example files..."

if [ ! -f "frontend/.env.example" ]; then
    echo "❌ Missing frontend/.env.example"
    exit 1
else
    echo "✅ frontend/.env.example exists"
fi

if [ ! -f "backend/.env.example" ]; then
    echo "❌ Missing backend/.env.example"
    exit 1
else
    echo "✅ backend/.env.example exists"
fi

# 5. Install husky for pre-commit hooks (if package.json exists)
echo ""
echo "🔧 Setting up pre-commit hooks..."
if [ -f "package.json" ]; then
    if ! npm list husky >/dev/null 2>&1; then
        echo "📦 Installing husky..."
        npm install --save-dev husky
        npx husky install
    fi
    
    # Ensure pre-commit hook exists
    if [ ! -f ".husky/pre-commit" ]; then
        echo "🪝 Creating pre-commit hook..."
        npx husky add .husky/pre-commit "npm run pre-commit"
    fi
    echo "✅ Pre-commit hooks configured"
else
    echo "⚠️  No package.json found, skipping husky setup"
fi

# 6. Create local environment files from examples
echo ""
echo "📝 Creating local environment files..."

read -p "Do you want to create local .env files from examples? (y/N): " create_env
if [ "$create_env" = "y" ] || [ "$create_env" = "Y" ]; then
    if [ -f "frontend/.env.example" ] && [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        echo "✅ Created frontend/.env (remember to add your API keys)"
    fi
    
    if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env (remember to add your secrets)"
    fi
    
    echo ""
    echo "⚠️  IMPORTANT: Update the .env files with your actual API keys"
    echo "   - Frontend: Add your Google Maps API key"
    echo "   - Backend: Add MongoDB URI, Twilio credentials, JWT secret"
fi

# 7. Final security check
echo ""
echo "🔒 Final security verification..."

# Check git status
if git status --porcelain | grep -E "\.env$|\.env\."; then
    echo "❌ Environment files are staged for commit!"
    echo "   Run: git reset HEAD *.env"
    exit 1
fi

echo "✅ Repository is secure for GitHub"
echo ""
echo "🚀 Next steps:"
echo "   1. Update .env files with your actual API keys"
echo "   2. Test the application locally"
echo "   3. Commit your changes: git add . && git commit -m 'feat: secure deployment ready'"
echo "   4. Push to GitHub: git push origin main"
echo "   5. Deploy to Vercel using SECURE_DEPLOYMENT_GUIDE.md"
echo ""
echo "⚠️  Remember: NEVER commit actual API keys or secrets!"
