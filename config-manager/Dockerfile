FROM node:18-alpine

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY src/ ./src/

# Copy env file if needed (optional, usually passed via docker-compose)
# COPY .env .env

CMD ["npm", "start"]
