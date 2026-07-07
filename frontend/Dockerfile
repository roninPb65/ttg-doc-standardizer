# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine AS runtime
# nginx's stock entrypoint envsubst's any *.template file here into
# /etc/nginx/conf.d/*.conf on container start, using env vars present
# at runtime (only vars that exist in the environment get substituted,
# so nginx's own $host/$scheme/etc. built-ins are left untouched).
COPY templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Defaults for local `docker compose` (matches the backend service name there);
# Render overrides these via render.yaml's `fromService`.
ENV BACKEND_HOST=https://ttg-doc-standardizer-1.onrender.com/
ENV BACKEND_PORT=443
EXPOSE 8080
