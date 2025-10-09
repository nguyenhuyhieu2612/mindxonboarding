# ===========================
# Stage 1: Build stage
# ===========================
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./ 
COPY tsconfig.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate   # 👈 Thêm dòng này để tạo client trước khi build

COPY src/ ./src/
RUN npm run build


# ===========================
# Stage 2: Production stage
# ===========================
FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma         
RUN npm ci --only=production && \
    npx prisma generate && \ 
    npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
