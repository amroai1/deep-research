# Use Node 22
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy rest of the code
COPY . .

# Rename env.example if .env.local is not committed
COPY .env.example .env.local

# Run the run.ts script using the defined npm script
CMD ["npm", "run", "docker"]
