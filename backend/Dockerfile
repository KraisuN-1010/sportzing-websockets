FROM node:18-alpine

# Isolates application files from system files to prevent host conflicts
WORKDIR /usr/src/app

# Leverages Docker layer caching for faster subsequent builds
COPY package*.json ./

# Ensures deterministic dependency resolution using package-lock.json
RUN npm ci

# Injects the application logic and network entry point
COPY . .

# Exposes network traffic boundary
EXPOSE 8000

# Initializes the network binding
CMD ["node", "server.js"]