# docker/front.Dockerfile

# 1) Build de l’app en mode production
FROM node:slim AS build
WORKDIR /app

# Copier package.json et lock
COPY front/package.json front/package-lock.json ./
RUN npm ci

# Copier le reste et builder
COPY front/. .
RUN npm run build

# 2) Stage Nginx pour servir le build
FROM nginx:alpine AS prod
# Supprimez la config par défaut si besoin
RUN rm /etc/nginx/conf.d/default.conf

# Copier votre conf nginx personnalisée
COPY front/front.conf /etc/nginx/conf.d/default.conf

# Copier le build Vite dans le dossier servi par nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
