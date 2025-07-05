# Use Node 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the code
COPY . .

# Conditionally copy .env.local if .env.example exists
RUN if [ -f .env.example ]; then cp .env.example .env.local; else echo ".env.example not found, skipping"; fi

# Start the Express API using your 'api' script
CMD ["npm", "run", "api"]
