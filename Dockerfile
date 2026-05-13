FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build frontend
COPY . .
RUN npm run build

# Persistent data directory — convenção Coolify
# O lib/db.js prefere /data > /app/config > ./config nesta ordem
# Monte um volume persistente no Coolify em /data para preservar o SQLite
RUN mkdir -p /data
VOLUME ["/data"]

# Aponta explicitamente o DATA_DIR pra eliminar ambiguidade
ENV DATA_DIR=/data

EXPOSE 3000

CMD ["npm", "start"]
