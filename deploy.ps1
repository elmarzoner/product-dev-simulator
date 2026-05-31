# 1コマンドでGitHub + Firebaseの両方に反映するデプロイスクリプト
# 使い方: .\deploy.ps1 "コミットメッセージ"

param(
  [Parameter(Mandatory=$true)]
  [string]$Message
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " デプロイ開始: $Message" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. index.htmlをpublicへ同期
Write-Host "[1/4] index.html を public/ へコピー..." -ForegroundColor Yellow
Copy-Item -Path "index.html" -Destination "public\index.html" -Force
Write-Host "  → コピー完了" -ForegroundColor Green

# 2. Git add
Write-Host ""
Write-Host "[2/4] git add..." -ForegroundColor Yellow
git add index.html public/index.html
Write-Host "  → 追加完了" -ForegroundColor Green

# 3. Git commit & push（差分がある時だけ）
$status = git status --porcelain
if (-not $status) {
  Write-Host ""
  Write-Host "[3/4] 変更なし → コミットスキップ" -ForegroundColor Yellow
} else {
  Write-Host ""
  Write-Host "[3/4] git commit & push..." -ForegroundColor Yellow
  git commit -m $Message
  git push
  Write-Host "  → GitHub 反映完了" -ForegroundColor Green
}

# 4. Firebase deploy
Write-Host ""
Write-Host "[4/4] Firebase Hosting にデプロイ中..." -ForegroundColor Yellow
firebase deploy --only hosting
Write-Host "  → Firebase 反映完了" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " デプロイ完了！" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  GitHub Pages: https://elmarzoner.github.io/product-dev-simulator/"
Write-Host "  Firebase    : https://product-dev-simulator.web.app/"
Write-Host ""
