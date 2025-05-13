FROM php:8.4-fpm-alpine AS builder

ARG WORKDIR=/var/www/html
ENV TZ=Europe/Paris

# 1. On ajoute les dépendances de compilation pour gd (libpng, jpeg, webp, freetype)
RUN --mount=type=cache,target=/var/cache/apk \
  apk add --update \
  tzdata \
  postgresql-dev \
  icu-dev \
  libzip-dev \
  pcre-dev \
  libpng-dev \
  libjpeg-turbo-dev \
  libwebp-dev \
  freetype-dev \
  $PHPIZE_DEPS

# 2. On configure intl (comme avant) puis on configure gd AVANT l’installation
RUN docker-php-ext-configure intl \
  && docker-php-ext-configure gd \
  --with-freetype \
  --with-jpeg \
  --with-webp \
  && docker-php-ext-install -j$(nproc) \
  bcmath \
  pdo_pgsql \
  opcache \
  pcntl \
  intl \
  zip \
  gd

# 3. Redis reste inchangé
RUN pecl install redis \
  && docker-php-ext-enable redis.so

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

FROM php:8.4-fpm-alpine

ARG WORKDIR=/var/www/html
ENV DOCUMENT_ROOT=${WORKDIR} \
  LARAVEL_PROCS_NUMBER=8 \
  USER_NAME=www-data \
  TZ=Europe/Paris
ARG GROUP_ID=1000
ARG USER_ID=1000
ARG GROUP_NAME=www-data

# timezone
COPY --from=builder /usr/share/zoneinfo/Europe/Paris /etc/localtime
RUN echo "Europe/Paris" > /etc/timezone

# 4. On ajoute les bibliothèques runtimes nécessaires à gd
RUN --mount=type=cache,target=/var/cache/apk \
  apk add --update --no-cache \
  nginx \
  supervisor \
  redis \
  postgresql-client \
  ca-certificates \
  curl \
  bash \
  nodejs \
  npm \
  icu-libs \
  libzip \
  libpng \
  libjpeg-turbo \
  libwebp \
  freetype \
  tzdata && \
  deluser ${USER_NAME} && \
  addgroup -g ${GROUP_ID} ${GROUP_NAME} && \
  adduser -u ${USER_ID} -G ${GROUP_NAME} \
  -h /home/${USER_NAME} -s /bin/sh -D ${USER_NAME} && \
  mkdir -p \
  /etc/supervisor/conf.d \
  /var/log/supervisor \
  /var/log/nginx \
  /var/log/php-fpm

COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
COPY --from=builder /usr/bin/composer /usr/bin/composer

COPY index.php $WORKDIR/
COPY php.ini $PHP_INI_DIR/conf.d/
COPY opcache.ini $PHP_INI_DIR/conf.d/
COPY supervisord.conf /etc/supervisor/supervisord.conf
COPY entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/entrypoint.sh && \
  chown -R ${USER_NAME}:${GROUP_NAME} \
  /var/www \
  /var/log \
  /etc/supervisor/conf.d \
  $PHP_INI_DIR/conf.d \
  /tmp

# Configuration des permissions pour Laravel
RUN mkdir -p $WORKDIR/storage/logs $WORKDIR/storage/framework/cache $WORKDIR/storage/framework/sessions $WORKDIR/storage/framework/views $WORKDIR/bootstrap/cache && \
  chown -R ${USER_NAME}:${GROUP_NAME} $WORKDIR/storage $WORKDIR/bootstrap/cache && \
  chmod -R 775 $WORKDIR/storage $WORKDIR/bootstrap/cache

WORKDIR $WORKDIR

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]