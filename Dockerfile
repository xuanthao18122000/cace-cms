# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Để trống: gọi /api cùng origin qua nginx bên dưới
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm build

# ---------- Serve ----------
FROM nginx:stable-alpine
# Đích proxy, đổi khi chạy: docker run -e API_UPSTREAM=http://api:4000 ...
ENV API_UPSTREAM=http://cace-api:4000 \
    UPLOAD_UPSTREAM=http://cace-upload:4002 \
    NGINX_RESOLVER=127.0.0.11

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
