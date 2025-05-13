#!/usr/bin/env bash
set -Eeuo pipefail

echo ""
echo "***********************************************************"
echo "   Starting LARAVEL PHP-FPM Container (Production)       "
echo "***********************************************************"

info() { echo "[INFO]    $*"; }
warning() { echo "[WARNING] $*"; }
fatal() { echo "[ERROR]   $*" >&2; exit 1; }

USER_NAME=${USER_NAME:-www-data}
WEB_ROOT="/var/www/html"

# Exécuter toutes les opérations qui nécessitent un accès root d'abord
info "Setting up permissions on web root..."
chown -R $USER_NAME:$USER_NAME "$WEB_ROOT" 2>/dev/null || {
  warning "Cannot change ownership of files. This is normal if using Docker volumes."
  warning "Setting more permissive permissions for Docker volumes..."
  
  mkdir -p "$WEB_ROOT/storage/logs" "$WEB_ROOT/storage/framework" "$WEB_ROOT/bootstrap/cache"
  chmod -R 777 "$WEB_ROOT/storage" "$WEB_ROOT/bootstrap/cache"
  info "Permissions set for storage and cache directories."
}

# Créer vendor directory avec des permissions correctes
if [[ ! -d "$WEB_ROOT/vendor" ]] && [[ -f "$WEB_ROOT/composer.json" ]]; then
  info "Creating vendor directory with correct permissions..."
  mkdir -p "$WEB_ROOT/vendor"
  chown -R $USER_NAME:$USER_NAME "$WEB_ROOT/vendor"
  info "Vendor directory created and permissions set."
fi

# Vérifier la présence du .env
if [[ ! -f "$WEB_ROOT/.env" ]]; then
  fatal ".env file is missing. Please provide a .env file for production."
else
  info ".env file exists."
fi

# Créer les répertoires de logs pour PHP-FPM
mkdir -p /var/log/php-fpm
chown -R $USER_NAME:$USER_NAME /var/log/php-fpm

# Vérifier et corriger les permissions pour PHP-FPM
info "Checking and fixing permissions for PHP-FPM..."
if [ -d /var/run/php-fpm ]; then
  chown -R $USER_NAME:$USER_NAME /var/run/php-fpm
else
  mkdir -p /var/run/php-fpm
  chown -R $USER_NAME:$USER_NAME /var/run/php-fpm
fi

# Créer la configuration Supervisor
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
fi

# Maintenant exécuter les commandes qui peuvent être exécutées en tant que www-data
info "Switching to $USER_NAME user for Composer and Laravel operations..."
if ! id "$USER_NAME" &>/dev/null; then
  fatal "User $USER_NAME does not exist. Please create the user before running this script."
fi


# Installation des dépendances Composer
if [[ -f "$WEB_ROOT/composer.json" ]]; then
  if command -v composer >/dev/null 2>&1; then
    info "Installing Composer dependencies for production..."
    cd "$WEB_ROOT" || exit
    
    # Exécuter les commandes Composer en tant que $USER_NAME
    su -c "composer install --no-interaction --no-progress --no-suggest" $USER_NAME
    info "Composer dependencies installed."
  else
    warning "composer command not found, skipping Composer install."
  fi
fi

# Installer les dépendances NPM avec l'utilisateur approprié
if [[ -f "$WEB_ROOT/package.json" ]]; then
  if command -v npm >/dev/null 2>&1; then
    info "Installing NPM dependencies and building assets for production..."
    cd "$WEB_ROOT" || exit
    
    # Exécuter les commandes NPM en tant que $USER_NAME
    su -c "npm ci --no-audit --no-fund --prefer-offline" $USER_NAME
    su -c "npm run build" $USER_NAME
    info "Production assets built successfully."
  else
    warning "npm command not found, skipping assets build."
  fi
else
  info "No package.json found. Skipping frontend build."
fi

php artisan key:generate
php artisan migrate --force

# Démarrer supervisord
exec supervisord -c /etc/supervisor/supervisord.conf