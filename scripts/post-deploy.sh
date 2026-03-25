#!/bin/bash
# ============================================================
# Post-Deploy Script — run this on cPanel after every git pull
# Usage: bash scripts/post-deploy.sh
# ============================================================

set -e

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Clearing application caches..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear

echo "==> Re-caching for production performance..."
php artisan config:cache
php artisan route:cache

echo "==> Setting storage permissions..."
chmod -R 775 storage bootstrap/cache

echo ""
echo "✓ Deployment complete."
