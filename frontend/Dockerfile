# --- Build stage: compile the Vite app --------------------------------------
FROM node:20-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# API base URL is baked in at build time (defaults to same-origin "/api",
# which nginx proxies to the backend).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Runtime stage: serve static files + proxy /api and /files --------------
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
