FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build frontend
COPY . .
RUN npm run build

# Persistent data directory — mount a volume here in Coolify
# to preserve SQLite DB (dashboard.db) across deploys
VOLUME ["/app/config"]

EXPOSE 3000

CMD ["npm", "start"]
