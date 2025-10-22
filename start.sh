#!/bin/sh

# 替换 ccr 配置文件中的PORT为环境变量CCR_PORT的值
if [ ! -z "$CCR_PORT" ]; then
  sed -i "s/\"PORT\": [0-9]\+/\"PORT\": $CCR_PORT/g" /root/.claude-code-router/config.json
fi

# 使用环境变量PORT的值替换api_base_url中的端口
if [ ! -z "$PORT" ]; then
  sed -i "s|http://localhost:[0-9]\+|http://localhost:$PORT|g" /root/.claude-code-router/config.json
fi

# 启动 npm 服务
npm start &

# 等待一段时间确保 npm 服务已启动
sleep 2

# 启动 ccr 服务
ccr start
