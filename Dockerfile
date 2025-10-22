FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Copy .env file to container
COPY .env /app/.env

# Load environment variables
ENV NODE_ENV=production

# Create directory for qwen credentials
RUN mkdir -p /root/.qwen

# 创建CCR配置目录
RUN mkdir -p /root/.claude-code-router

RUN mkdir -p /root/.claude

RUN mkdir -p /root/.claude/projects

# 复制CCR配置文件
COPY ccr.config.json /root/.claude-code-router/config.json

RUN npm install -g @musistudio/claude-code-router

# Copy and setup start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE ${PORT:-8080}
EXPOSE ${CCR_PORT:-3456}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-8080}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["/app/start.sh"]
