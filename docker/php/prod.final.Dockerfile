FROM php:8.4-fpm-alpine AS extensions

ARG WORKDIR=/var/www/html
ENV TZ=Europe/Paris

RUN --mount=type=cache,target=/var/cache/apk \
  apk add --update --no-cache \
  tzdata \
  postgresql-dev \
  icu-dev \
  libzip-dev \
  pcre-dev \
  libpng-dev \
  libjpeg-turbo-dev \
  libwebp-dev \
  freetype-dev \
  git \
  nodejs \
  npm \
  $PHPIZE_DEPS

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

RUN pecl install redis \
  && docker-php-ext-enable redis.so

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY back/composer.json back/composer.lock ./
RUN composer install --no-interaction --no-progress --no-suggest --prefer-dist --no-dev --optimize-autoloader

COPY back/package.json back/package-lock.json ./
RUN npm ci --no-audit --no-fund --prefer-offline

COPY back/. ./
RUN npm run build \
  && rm -rf node_modules

FROM php:8.4-fpm-alpine

ARG WORKDIR=/var/www/html
ENV DOCUMENT_ROOT=${WORKDIR} \
  LARAVEL_PROCS_NUMBER=8 \
  USER_NAME=www-data \
  TZ=Europe/Paris
ARG USER_ID=33
ARG GROUP_ID=33
ARG GROUP_NAME=www-data

COPY --from=extensions /usr/share/zoneinfo/Europe/Paris /etc/localtime
RUN echo "Europe/Paris" > /etc/timezone

RUN --mount=type=cache,target=/var/cache/apk \
  apk add --update --no-cache \
  nginx \
  supervisor \
  postgresql-client \
  ca-certificates \
  curl \
  bash \
  icu-libs \
  libzip \
  libpng \
  libjpeg-turbo \
  libwebp \
  freetype \
  tzdata \
  shadow \
  su-exec \
  && deluser ${USER_NAME} \
  && addgroup -g ${GROUP_ID} ${GROUP_NAME} \
  && adduser -u ${USER_ID} -G ${GROUP_NAME} -h /home/${USER_NAME} -s /bin/sh -D ${USER_NAME} \
  && mkdir -p \
  /etc/supervisor/conf.d \
  /var/log/supervisor \
  /var/log/nginx \
  /var/log/php-fpm \
  /run/php \
  && chown -R ${USER_NAME}:${GROUP_NAME} /var/log

COPY --from=extensions /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=extensions /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
COPY --from=extensions /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini $PHP_INI_DIR/conf.d/
COPY docker/php/opcache.ini $PHP_INI_DIR/conf.d/
COPY docker/php/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/php/prod.final.entrypoint.sh /usr/local/bin/
COPY --from=extensions /app ${WORKDIR}
COPY docker/nginx/api.conf /etc/nginx/http.d/default.conf

RUN chmod +x /usr/local/bin/prod.final.entrypoint.sh \
  && chown -R ${USER_NAME}:${GROUP_NAME} \
  $WORKDIR \
  /etc/nginx \
  /etc/supervisor \
  /usr/local/bin/prod.final.entrypoint.sh \
  /var/log \
  /run/php \
  && find $WORKDIR -type f -exec chmod 664 {} + \
  && find $WORKDIR -type d -exec chmod 775 {} +

WORKDIR $WORKDIR

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/prod.final.entrypoint.sh"]
