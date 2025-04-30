FROM node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e

WORKDIR /app

# Only copy package.json first to leverage Docker caching for dependencies
COPY package.json ./

RUN npm install

# Copy the rest of the code (after installing dependencies to avoid unnecessary reinstalls)
COPY . .

# Rename env.example to .env.local
COPY ./.env.example ./.env.local

CMD ["npm", "run", "docker"]
