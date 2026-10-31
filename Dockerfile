FROM node:26.13.0-bookworm-slim
# pg_dump / psql are needed for database backups and restore
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG BUILD_HEAP=1536
RUN NODE_OPTIONS=--max-old-space-size=$BUILD_HEAP npm run build
EXPOSE 3000
# creates/updates tables and seeds the chosen SCHOOL_PROFILE, then starts the site
CMD ["sh", "-c", "node scripts/setup-db.mjs && npm start"]
