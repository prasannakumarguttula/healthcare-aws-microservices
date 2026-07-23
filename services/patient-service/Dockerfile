FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget

FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
EXPOSE 3001
USER node
CMD ["node", "src/index.js"]
