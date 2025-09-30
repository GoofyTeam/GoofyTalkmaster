#!/usr/bin/env bash
set -Eeuo pipefail

info() { echo "[INFO]    $*"; }
warning() { echo "[WARNING] $*"; }
fatal() { echo "[ERROR]   $*" >&2; exit 1; }

USER_NAME=${USER_NAME:-www-data}
WEB_ROOT="/var/www/html"
ENV_FILE="$WEB_ROOT/.env"
SUPERVISOR_CONF_DIR="/etc/supervisor/conf.d"
MAX_RETRIES=${DB_MAX_RETRIES:-30}
RETRY_DELAY=${DB_RETRY_DELAY:-5}

trim_quotes() {
  local value="$1"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'
}

format_env_value() {
  local value="$1"
  if [[ "$value" == *" "* ]] || [[ "$value" == *"#"* ]] || [[ "$value" == *";"* ]]; then
    value="$(printf '%s' "$value" | sed 's/"/\\"/g')"
    printf '"%s"' "$value"
  else
    printf '%s' "$value"
  fi
}

set_env_value() {
  local key="$1"
  local value="$2"

  if [[ -z "$value" ]]; then
    return
  fi

  local formatted
  formatted=$(format_env_value "$value")
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    local escaped
    escaped=$(escape_sed "$formatted")
    sed -i "s|^${key}=.*|${key}=${escaped}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$formatted" >>"$ENV_FILE"
  fi
}

read_env_var() {
  local key="$1"
  local fallback="${2:-}"
  local value="${!key-}"

  if [[ -z "$value" && -f "$ENV_FILE" ]]; then
    value=$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d '=' -f2- || true)
    value=$(trim_quotes "$value")
  fi

  if [[ -z "$value" ]]; then
    value="$fallback"
  fi

  printf '%s' "$value"
}

bool_is_true() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

run_as_app_user() {
  su-exec "$USER_NAME" sh -lc "$*"
}

prepare_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    if [[ -f "$WEB_ROOT/.env.example" ]]; then
      cp "$WEB_ROOT/.env.example" "$ENV_FILE"
      info ".env file not found. Created from .env.example."
    else
      touch "$ENV_FILE"
      warning "No .env or .env.example found. Created empty .env file."
    fi
  else
    info ".env file detected."
  fi

  if [[ "${LARAVEL_APPLY_ENV_VARS:-true}" != "false" ]]; then
    local env_keys=(
      APP_NAME APP_ENV APP_KEY APP_DEBUG APP_URL APP_LOCALE APP_FALLBACK_LOCALE APP_FAKER_LOCALE APP_TIMEZONE
      DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD
      SESSION_DRIVER SESSION_LIFETIME SESSION_ENCRYPT SESSION_PATH SESSION_DOMAIN
      CACHE_STORE CACHE_PREFIX QUEUE_CONNECTION BROADCAST_CONNECTION FILESYSTEM_DISK
      REDIS_CLIENT REDIS_HOST REDIS_PASSWORD REDIS_PORT REDIS_URL
      MAIL_MAILER MAIL_HOST MAIL_PORT MAIL_ENCRYPTION MAIL_FROM_ADDRESS MAIL_FROM_NAME
      AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_DEFAULT_REGION AWS_BUCKET AWS_USE_PATH_STYLE_ENDPOINT
      VITE_APP_NAME SANCTUM_STATEFUL_DOMAINS
    )

    for key in "${env_keys[@]}"; do
      if [[ -n "${!key-}" ]]; then
        set_env_value "$key" "${!key}"
      fi
    done
  fi
}

setup_permissions() {
  info "Ensuring correct permissions on application directories..."
  mkdir -p "$WEB_ROOT/storage" "$WEB_ROOT/bootstrap/cache"

  local system_dirs=(
    /var/log/nginx
    /var/log/php-fpm
    /run/php
    /var/lib/nginx
    /var/lib/nginx/tmp
    /var/lib/nginx/logs
    /var/lib/nginx/tmp/client_body
    /var/lib/nginx/tmp/proxy
    /var/lib/nginx/tmp/fastcgi
    /var/lib/nginx/tmp/uwsgi
    /var/lib/nginx/tmp/scgi
  )

  for dir in "${system_dirs[@]}"; do
    if ! mkdir -p "$dir"; then
      warning "Unable to create directory $dir (permissions issue?)."
      continue
    fi

    if ! chown "$USER_NAME":"$USER_NAME" "$dir"; then
      warning "Unable to change ownership of $dir."
    fi

    if ! chmod 775 "$dir"; then
      warning "Unable to adjust permissions on $dir."
    fi
  done

  if ! chown -R "$USER_NAME":"$USER_NAME" "$WEB_ROOT"; then
    warning "Unable to change ownership of application files in $WEB_ROOT."
  fi

  if ! chmod -R 775 "$WEB_ROOT/storage" "$WEB_ROOT/bootstrap/cache"; then
    warning "Unable to update permissions for Laravel writable directories."
  fi
}

configure_supervisor() {
  mkdir -p "$SUPERVISOR_CONF_DIR"

  if bool_is_true "${ENABLE_LARAVEL_SCHEDULER:-true}"; then
    cat >"$SUPERVISOR_CONF_DIR/laravel-scheduler.conf" <<EOF_SCHED
[program:laravel-scheduler]
command=/bin/sh -c "cd $WEB_ROOT && while true; do php artisan schedule:run --no-interaction; sleep 60; done"
autostart=true
autorestart=true
user=$USER_NAME
priority=20
stdout_logfile=/var/www/html/storage/logs/laravel_scheduler.log
stderr_logfile=/var/www/html/storage/logs/laravel_scheduler_error.log
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
EOF_SCHED
  fi

  if bool_is_true "${ENABLE_LARAVEL_HORIZON:-true}"; then
    cat >"$SUPERVISOR_CONF_DIR/laravel-horizon.conf" <<EOF_HORIZON
[program:laravel-horizon]
command=/bin/sh -c "cd $WEB_ROOT && php artisan horizon"
autostart=true
autorestart=true
user=$USER_NAME
priority=30
stdout_logfile=/var/www/html/storage/logs/laravel_horizon.log
stderr_logfile=/var/www/html/storage/logs/laravel_horizon_error.log
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
EOF_HORIZON
  fi

  cat >"$SUPERVISOR_CONF_DIR/nginx.conf" <<EOF_NGINX
[program:nginx]
command=/usr/sbin/nginx -g 'daemon off;'
autostart=true
autorestart=true
priority=10
stdout_logfile=/var/log/nginx/stdout.log
stderr_logfile=/var/log/nginx/stderr.log
stdout_logfile_maxbytes=0
stderr_logfile_maxbytes=0
EOF_NGINX
}

wait_for_database() {
  local connection host port username password
  connection=$(read_env_var DB_CONNECTION pgsql)
  host=$(read_env_var DB_HOST postgres-talkmaster)
  port=$(read_env_var DB_PORT 5432)
  username=$(read_env_var DB_USERNAME talkmaster)
  password=$(read_env_var DB_PASSWORD password)

  if [[ "$connection" != "pgsql" ]]; then
    warning "Unsupported DB_CONNECTION '$connection'. Skipping readiness probe."
    return
  fi

  info "Waiting for PostgreSQL at $host:$port (user: $username)..."
  for attempt in $(seq 1 "$MAX_RETRIES"); do
    if PGPASSWORD="$password" pg_isready -h "$host" -p "$port" -U "$username" >/dev/null 2>&1; then
      info "PostgreSQL is ready."
      return
    fi

    warning "Database not ready yet. Retrying in ${RETRY_DELAY}s (${attempt}/${MAX_RETRIES})..."
    sleep "$RETRY_DELAY"
  done

  fatal "Database connection failed after $MAX_RETRIES attempts."
}

artisan_cmd() {
  local cmd="$1"
  if [[ ! -f "$WEB_ROOT/artisan" ]]; then
    warning "artisan file missing. Skipping command '$cmd'."
    return
  fi
  info "Running artisan command: php artisan $cmd"
  run_as_app_user "cd $WEB_ROOT && php artisan $cmd"
}

ensure_storage_link() {
  local link="$WEB_ROOT/public/storage"
  if [[ -L "$link" || -e "$link" ]]; then
    info "Storage link already present."
    return
  fi

  artisan_cmd "storage:link"
}

configure_nginx_user() {
  local nginx_conf="/etc/nginx/nginx.conf"
  if [[ ! -f "$nginx_conf" ]]; then
    warning "nginx.conf not found. Skipping user adjustment."
    return
  fi

  if grep -q '^user[[:space:]]' "$nginx_conf"; then
    sed -i "s/^user[[:space:]].*/user ${USER_NAME};/" "$nginx_conf"
  else
    sed -i "1s|^|user ${USER_NAME};\n|" "$nginx_conf"
  fi
}

main() {
  echo ""
  echo "***********************************************************"
  echo "   Starting LARAVEL PHP-FPM Container (Production)          "
  echo "***********************************************************"

  prepare_env_file
  setup_permissions
  configure_nginx_user
  configure_supervisor

  if bool_is_true "${LARAVEL_GENERATE_APP_KEY:-true}"; then
    local app_key
    app_key=$(read_env_var APP_KEY)
    if [[ -z "$app_key" ]]; then
      artisan_cmd "key:generate --force"
    else
      info "APP_KEY already provided."
    fi
  fi

  if bool_is_true "${LARAVEL_STORAGE_LINK:-true}"; then
    ensure_storage_link
  fi

  if bool_is_true "${LARAVEL_RUN_MIGRATIONS:-true}"; then
    wait_for_database
    artisan_cmd "migrate --force"
  else
    info "Skipping database migrations (LARAVEL_RUN_MIGRATIONS=${LARAVEL_RUN_MIGRATIONS:-false})."
  fi

  if bool_is_true "${LARAVEL_OPTIMIZE:-true}"; then
    artisan_cmd "optimize"
  fi

  info "Launching Supervisor..."
  exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
}

main "$@"
