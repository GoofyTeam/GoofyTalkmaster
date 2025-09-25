# syntax=docker/dockerfile:1.7

FROM node:20-slim AS build
WORKDIR /app

COPY front/package.json front/package-lock.json ./
RUN npm ci --no-audit --no-fund

ARG VITE_API_URL="http://localhost:8080"
ENV VITE_API_URL=${VITE_API_URL}

COPY front/. ./

RUN printf 'VITE_API_URL=%s\n' "${VITE_API_URL}" > .env.production \
  && npm run build

FROM nginx:alpine AS runtime
RUN rm /etc/nginx/conf.d/default.conf

COPY front/front.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
