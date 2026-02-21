FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
RUN npm ci --production 2>/dev/null || npm install --production

COPY server/server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
