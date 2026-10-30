FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build frontend and bundled backend
RUN npm run build

# Expose backend (5000) and frontend (3000)
EXPOSE 5000 3000

# Default entrypoint
CMD ["npm", "run", "serve"]
