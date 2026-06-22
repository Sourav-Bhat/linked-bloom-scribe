# Stage 1: build
# Local Docker is a dev/test environment, so it builds in development mode
# (reads .env.development -> the DEV Firebase project). Override for a prod-like
# image with:  docker build --build-arg BUILD_MODE=production .
FROM node:20-slim AS builder
ARG BUILD_MODE=development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --mode "$BUILD_MODE"

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
