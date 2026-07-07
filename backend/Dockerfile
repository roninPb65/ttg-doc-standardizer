# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
ENV TRANSFORMERS_CACHE_DIR=/models
ENV TRANSFORMERS_OFFLINE=true
WORKDIR /app
COPY package*.json ./
# Installs prod + optional deps. @huggingface/transformers + onnxruntime-node
# fetch a native binary here (needs nuget.org reachable during build).
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY db ./db
COPY scripts ./scripts
# Pre-download the zero-shot model into /models so the container runs fully
# offline (needs huggingface.co reachable during build only).
RUN node scripts/prewarm.mjs
# storage for rendered .docx files (mount a PVC over this in k8s)
RUN mkdir -p /data/outputs
EXPOSE 4000
# apply schema then start (safe to re-run; uses IF NOT EXISTS)
CMD ["sh", "-c", "node dist/scripts/migrate.js && node dist/index.js"]
