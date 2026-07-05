# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Stage 2: Production release
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /usr/src/app/src ./src

EXPOSE 5000

CMD ["node", "src/server.js"]
