# ========================================
# CTAS GitHub Security Setup Script (PowerShell)
# Run this before your first git push
# ========================================

Write-Host "🔒 CTAS Security Setup Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the CTAS root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📂 Current directory: $(Get-Location)" -ForegroundColor Blue
Write-Host ""

# 1. Check for existing .env files
Write-Host "🔍 Checking for environment files..." -ForegroundColor Yellow
$envFiles = Get-ChildItem -Recurse -Filter ".env" -Exclude "*.example", "*.template" | Where-Object { $_.FullName -notlike "*\.git\*" }

if ($envFiles) {
    Write-Host "⚠️  WARNING: Found .env files that should not be committed:" -ForegroundColor Yellow
    $envFiles | ForEach-Object { Write-Host "   $($_.FullName)" -ForegroundColor Yellow }
    Write-Host ""
    $deleteEnv = Read-Host "Do you want to delete these files? (y/N)"
    if ($deleteEnv -eq "y" -or $deleteEnv -eq "Y") {
        $envFiles | Remove-Item -Force
        Write-Host "✅ Environment files deleted" -ForegroundColor Green
    } else {
        Write-Host "❌ Please remove .env files manually before proceeding" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ No problematic .env files found" -ForegroundColor Green
}

# 2. Check for hardcoded secrets in code
Write-Host ""
Write-Host "🔍 Scanning for hardcoded secrets..." -ForegroundColor Yellow
$secretsFound = $false

# Check for Google API keys
$googleKeys = Select-String -Path "frontend\*", "backend\*" -Pattern "AIza[0-9A-Za-z_-]{35}" -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse 2>$null
if ($googleKeys) {
    Write-Host "❌ Found hardcoded Google API keys!" -ForegroundColor Red
    $secretsFound = $true
}

# Check for Twilio keys
$twilioKeys = Select-String -Path "frontend\*", "backend\*" -Pattern "AC[a-zA-Z0-9]{32}" -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse 2>$null
if ($twilioKeys) {
    Write-Host "❌ Found hardcoded Twilio Account SIDs!" -ForegroundColor Red
    $secretsFound = $true
}

# Check for OpenAI keys
$openaiKeys = Select-String -Path "frontend\*", "backend\*" -Pattern "sk-[a-zA-Z0-9]{32,}" -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse 2>$null
if ($openaiKeys) {
    Write-Host "❌ Found hardcoded OpenAI API keys!" -ForegroundColor Red
    $secretsFound = $true
}

if ($secretsFound) {
    Write-Host "❌ Please remove hardcoded secrets before proceeding" -ForegroundColor Red
    Write-Host "   Use environment variables instead: process.env.VARIABLE_NAME" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ No hardcoded secrets found" -ForegroundColor Green
}

# 3. Verify .gitignore
Write-Host ""
Write-Host "🔍 Checking .gitignore..." -ForegroundColor Yellow
if (-not (Test-Path ".gitignore")) {
    Write-Host "❌ No .gitignore file found!" -ForegroundColor Red
    exit 1
}

# Check if .env is ignored
$gitignoreContent = Get-Content ".gitignore" -Raw
if ($gitignoreContent -match "\.env" -and $gitignoreContent -match "\*\.env") {
    Write-Host "✅ Environment files are properly ignored" -ForegroundColor Green
} else {
    Write-Host "⚠️  Adding environment protection to .gitignore" -ForegroundColor Yellow
    Add-Content ".gitignore" "`n# Environment files`n.env`n*.env`n.env.*`n!.env.example"
}

# 4. Check .env.example files
Write-Host ""
Write-Host "🔍 Checking .env.example files..." -ForegroundColor Yellow

if (-not (Test-Path "frontend\.env.example")) {
    Write-Host "❌ Missing frontend\.env.example" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ frontend\.env.example exists" -ForegroundColor Green
}

if (-not (Test-Path "backend\.env.example")) {
    Write-Host "❌ Missing backend\.env.example" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ backend\.env.example exists" -ForegroundColor Green
}

# 5. Create local environment files from examples
Write-Host ""
Write-Host "📝 Creating local environment files..." -ForegroundColor Yellow

$createEnv = Read-Host "Do you want to create local .env files from examples? (y/N)"
if ($createEnv -eq "y" -or $createEnv -eq "Y") {
    if ((Test-Path "frontend\.env.example") -and -not (Test-Path "frontend\.env")) {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✅ Created frontend\.env (remember to add your API keys)" -ForegroundColor Green
    }
    
    if ((Test-Path "backend\.env.example") -and -not (Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✅ Created backend\.env (remember to add your secrets)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Update the .env files with your actual API keys" -ForegroundColor Yellow
    Write-Host "   - Frontend: Add your Google Maps API key" -ForegroundColor Yellow
    Write-Host "   - Backend: Add MongoDB URI, Twilio credentials, JWT secret" -ForegroundColor Yellow
}

# 6. Final security check
Write-Host ""
Write-Host "🔒 Final security verification..." -ForegroundColor Yellow

# Check git status for staged .env files
$gitStatus = git status --porcelain 2>$null
if ($gitStatus -and ($gitStatus -match "\.env$" -or $gitStatus -match "\.env\.")) {
    Write-Host "❌ Environment files are staged for commit!" -ForegroundColor Red
    Write-Host "   Run: git reset HEAD *.env" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repository is secure for GitHub" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update .env files with your actual API keys" -ForegroundColor White
Write-Host "   2. Test the application locally" -ForegroundColor White
Write-Host "   3. Commit your changes: git add . ; git commit -m 'feat: secure deployment ready'" -ForegroundColor White
Write-Host "   4. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "   5. Deploy to Vercel using SECURE_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember: NEVER commit actual API keys or secrets!" -ForegroundColor Yellow
