FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "src/server.js"]
