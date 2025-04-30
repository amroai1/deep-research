# Use Node 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the code
COPY . .

# Rename env.example to .env.local if you're not committing .env.local
COPY .env.example .env.local

# Start the Express API using your 'api' script
CMD ["npm", "run", "api"]
