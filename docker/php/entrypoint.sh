#!/usr/bin/env bash

set -Eeuo pipefail

echo ""
echo "***********************************************************"
echo "   Starting LARAVEL PHP-FPM Container                      "
echo "***********************************************************"

#=== LOGGING FUNCTIONS =========================================
info() {
  echo "[INFO]    $*"
}

warning() {
  echo "[WARNING] $*"
}

fatal() {
  echo "[ERROR]   $*" >&2
  exit 1
}

#=== GLOBAL VARIABLES ==========================================
WEB_ROOT="/var/www/html"
MAX_RETRIES=10
RETRY_DELAY=10

#=== FUNCTION TO CHECK IF COMMAND EXISTS =======================
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

#=== START SCRIPT ==============================================
if [[ ! -f "$WEB_ROOT/.env" ]]; then
  if [[ -f "$WEB_ROOT/.env.example" ]]; then
    cp "$WEB_ROOT/.env.example" "$WEB_ROOT/.env"
    info ".env file was missing. Copied .env.example to .env"
  else
    fatal "Both .env and .env.example are missing. Cannot proceed."
  fi
else
  info ".env file already exists."
fi

# Composer installation
if [[ -f "$WEB_ROOT/composer.json" ]]; then
  if command_exists composer; then
    info "Composer file found, installing dependencies..."

    cd "$WEB_ROOT" || exit

    composer install --no-interaction --no-progress --no-suggest

    info "Composer dependencies installed"
  else
    warning "composer command not found, skipping Composer install."
  fi
else
  info "composer.json not found, skipping Composer step."
fi

# APP_KEY generation
if ! grep -q "APP_KEY" "$WEB_ROOT/.env"; then
  php "$WEB_ROOT/artisan" key:generate
  info "Generated application key"
fi

# NPM installation
if [[ -f "$WEB_ROOT/package.json" ]]; then
  if command_exists npm; then
    info "package.json file found, installing NPM dependencies..."
    cd "$WEB_ROOT" || exit
    npm install
    info "NPM dependencies installed"
  else
    warning "npm command not found, skipping NPM install."
  fi
else
  info "package.json file not found, skipping NPM step."
fi

if [ -f "$WEB_ROOT/artisan" ]; then
    info "Artisan file found, creating laravel supervisor config..."

    TASK=/etc/supervisor/conf.d/laravel-worker.conf
    touch $TASK
    cat > "$TASK" <<EOF
    [program:Laravel-scheduler]
    process_name=%(program_name)s_%(process_num)02d
    command=/bin/sh -c "while [ true ]; do (php /var/www/html/artisan schedule:run --verbose --no-interaction &); sleep 60; done"
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
    redirect_stderr=true
    stdout_logfile=/var/www/html/storage/logs/laravel_horizon.log

EOF
    info "Laravel supervisor config created"
else
    info "artisan file not found"
fi

if [[ -f "$WEB_ROOT/conf/php/php.ini" ]]; then
  cp "$WEB_ROOT/conf/php/php.ini" "$PHP_INI_DIR/conf.d/"
  info "Custom php.ini file found and copied to $PHP_INI_DIR/conf.d/"
else
  info "Custom php.ini file not found"
  info "If you want to add a custom php.ini file, place it in $WEB_ROOT/conf/php/php.ini"
fi

if [[ ! -d "$WEB_ROOT/storage" ]]; then
  info "Storage folder not found, creating it..."
  mkdir -p "$WEB_ROOT/storage"
fi

if [[ ! -d "$WEB_ROOT/storage/logs" ]]; then
  info "Logs folder not found, creating it..."
  mkdir -p "$WEB_ROOT/storage/logs"
fi

if [[ ! -f "$WEB_ROOT/storage/logs/laravel.log" ]]; then
  info "laravel.log file not found, creating it..."
  touch "$WEB_ROOT/storage/logs/laravel.log"
fi

chown -R www-data:www-data "$WEB_ROOT/storage"
chmod -R 775 "$WEB_ROOT/storage"
info "Storage folder ownership set to www-data and permissions updated (775)."

info "Waiting for database connection to be ready..."
DB_READY=0
for i in $(seq 1 "$MAX_RETRIES"); do
  if php "$WEB_ROOT/artisan" db:show >/dev/null 2>&1; then
    info "Database connection successful. Running migrations..."
    DB_READY=1
    break
  else
    warning "Database connection failed. Retrying in $RETRY_DELAY seconds... (Attempt $i/$MAX_RETRIES)"
    sleep "$RETRY_DELAY"
  fi
done

if [[ "$DB_READY" -eq 1 ]]; then
  php "$WEB_ROOT/artisan" migrate --force
  info "Database migrations completed successfully."
else
  fatal "Database connection failed after $MAX_RETRIES attempts. Exiting..."
fi

info "Running npm dev..."
cd "$WEB_ROOT" || exit
npm run dev &
npm run watch &

supervisord -c /etc/supervisor/supervisord.conf