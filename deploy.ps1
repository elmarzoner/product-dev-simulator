# 1コマンドで GitHub（ソース管理）+ Firebase（公開）へ反映するデプロイスクリプト
# 使い方: .\deploy.ps1 "コミットメッセージ"
#
# ※ 公開は Firebase Hosting（https://product-dev-simulator.web.app）に一本化。
#    アプリ本体は public/ 配下が唯一の正（旧ルート index.html / GitHub Pages は廃止済み）。

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

# 1. Git add（変更をすべてステージ）
Write-Host "[1/3] git add..." -ForegroundColor Yellow
git add -A
Write-Host "  → 追加完了" -ForegroundColor Green

# 2. Git commit & push（差分がある時だけ）
$status = git status --porcelain
if (-not $status) {
  Write-Host ""
  Write-Host "[2/3] 変更なし → コミットスキップ" -ForegroundColor Yellow
} else {
  Write-Host ""
  Write-Host "[2/3] git commit & push..." -ForegroundColor Yellow
  git commit -m $Message
  git push
  Write-Host "  → GitHub 反映完了" -ForegroundColor Green
}

# 3. Firebase deploy（Hosting + Firestore ルール）
Write-Host ""
Write-Host "[3/3] Firebase にデプロイ中..." -ForegroundColor Yellow
firebase deploy --only hosting,firestore:rules
Write-Host "  → Firebase 反映完了" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " デプロイ完了！" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Firebase: https://product-dev-simulator.web.app/"
Write-Host ""
