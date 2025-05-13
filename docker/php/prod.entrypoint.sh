#!/usr/bin/env bash
set -Eeuo pipefail

echo ""
echo "***********************************************************"
echo "   Starting LARAVEL PHP-FPM Container (Production)       "
echo "***********************************************************"

info() { echo "[INFO]    $*"; }
warning() { echo "[WARNING] $*"; }
fatal() { echo "[ERROR]   $*" >&2; exit 1; }

WEB_ROOT="/var/www/html"

# Vérifier la présence du .env (en production, il doit être fourni manuellement)
if [[ ! -f "$WEB_ROOT/.env" ]]; then
  fatal ".env file is missing. Please provide a .env file for production."
else
  info ".env file exists."
fi

# Installation des dépendances Composer avec les options production
if [[ -f "$WEB_ROOT/composer.json" ]]; then
  if command -v composer >/dev/null 2>&1; then
    info "Installing Composer dependencies for production..."
    cd "$WEB_ROOT" || exit
    composer install --no-interaction --no-progress --no-suggest
    info "Composer dependencies installed."
    php artisan filament:optimize-clear
    php artisan filament:optimize
  else
    warning "composer command not found, skipping Composer install."
  fi
fi

# Générer la clé de l'application si absente (en production, il est préférable de la définir manuellement)
if ! grep -q "APP_KEY" "$WEB_ROOT/.env"; then
  info "APP_KEY not found. Generating application key..."
  php "$WEB_ROOT/artisan" key:generate --force
  info "Application key generated."
fi

# Installer les dépendances NPM et construire les assets en production
if [[ -f "$WEB_ROOT/package.json" ]]; then
  if command -v npm >/dev/null 2>&1; then
    info "Installing NPM dependencies and building assets for production..."
    cd "$WEB_ROOT" || exit
    npm ci --no-audit --no-fund --prefer-offline
    npm run build
    info "Production assets built successfully."
  else
    warning "npm command not found, skipping assets build."
  fi
else
  info "No package.json found. Skipping frontend build."
fi

# Créer la configuration Supervisor si artisan est présent
if [[ -f "$WEB_ROOT/artisan" ]]; then
    info "Creating Laravel supervisor configuration for production..."
    TASK=/etc/supervisor/conf.d/laravel-worker.conf
    cat > "$TASK" <<EOF
[program:Laravel-scheduler]
process_name=%(program_name)s_%(process_num)02d
command=/bin/sh -c "while true; do php /var/www/html/artisan schedule:run --no-interaction; sleep 60; done"
autostart=true
autorestart=true
numprocs=1
user=$USER_NAME
stdout_logfile=/var/www/html/storage/logs/laravel_scheduler.log
redirect_stderr=true

[program:Laravel-horizon]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan horizon
autostart=true
autorestart=true
numprocs=1
user=$USER_NAME
stdout_logfile=/var/www/html/storage/logs/laravel_horizon.log
redirect_stderr=true

[program:php-fpm]
command=php-fpm -F
autostart=true
autorestart=true
priority=5
stdout_events_enabled=true
stderr_events_enabled=true
stdout_logfile=/var/log/php-fpm/stdout.log
stderr_logfile=/var/log/php-fpm/stderr.log
EOF
    info "Laravel supervisor configuration created."
else
    info "artisan not found; skipping supervisor configuration."
fi

# Créer les répertoires de logs pour PHP-FPM
mkdir -p /var/log/php-fpm
chown -R $USER_NAME:$USER_NAME /var/log/php-fpm

# Copier un php.ini personnalisé si présent
if [[ -f "$WEB_ROOT/conf/php/php.ini" ]]; then
  cp "$WEB_ROOT/conf/php/php.ini" "$PHP_INI_DIR/conf.d/"
  info "Custom php.ini copied."
else
  info "No custom php.ini found."
fi

# Créer les dossiers storage et logs si nécessaires
if [[ ! -d "$WEB_ROOT/storage" ]]; then
  info "Storage folder not found, creating it..."
  mkdir -p "$WEB_ROOT/storage"
fi

if [[ ! -d "$WEB_ROOT/storage/logs" ]]; then
  info "Logs folder not found, creating it..."
  mkdir -p "$WEB_ROOT/storage/logs"
fi

# Créer le fichier laravel.log s'il n'existe pas
if [[ ! -f "$WEB_ROOT/storage/logs/laravel.log" ]]; then
  info "laravel.log file not found, creating it..."
  touch "$WEB_ROOT/storage/logs/laravel.log"
fi

chown -R www-data:www-data "$WEB_ROOT/storage"
chmod -R 775 "$WEB_ROOT/storage"
info "Storage folder ownership set to www-data and permissions updated (775)."

# Optionnel : exécuter les migrations si AUTO_MIGRATE est défini à true (par défaut, c'est désactivé en production)
if [ "${AUTO_MIGRATE:-false}" = "true" ]; then
  info "Waiting for database connection..."
  MAX_RETRIES=10
  RETRY_DELAY=10
  DB_READY=0
  for i in $(seq 1 $MAX_RETRIES); do
    if php "$WEB_ROOT/artisan" db:show >/dev/null 2>&1; then
      info "Database connection established."
      DB_READY=1
      break
    else
      warning "Database not ready. Retry $i/$MAX_RETRIES."
      sleep $RETRY_DELAY
    fi
  done
  if [ "$DB_READY" -eq 1 ]; then
    info "Running migrations..."
    php "$WEB_ROOT/artisan" migrate --force
    info "Migrations completed."
  else
    fatal "Database connection failed after $MAX_RETRIES attempts."
  fi
else
  info "AUTO_MIGRATE not enabled. Skipping migrations."
fi

# Vérifier et corriger les permissions
info "Checking and fixing permissions..."
if [ -d /var/run/php-fpm ]; then
  chown -R $USER_NAME:$USER_NAME /var/run/php-fpm
else
  mkdir -p /var/run/php-fpm
  chown -R $USER_NAME:$USER_NAME /var/run/php-fpm
fi

# Vérifier si le socket PHP-FPM existe et est accessible
if [ -S /var/run/php-fpm/php-fpm.sock ]; then
  chmod 660 /var/run/php-fpm/php-fpm.sock
fi

# Lancer supervisord
exec supervisord -c /etc/supervisor/supervisord.conf