FROM node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e

WORKDIR /app

COPY . .
COPY package.json ./
COPY env.example ./.env.local

RUN npm install

CMD ["npm", "run", "docker"]
