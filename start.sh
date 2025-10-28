#!/bin/sh


# 使用环境变量PORT的值替换api_base_url中的端口
if [ ! -z "$PORT" ]; then
  sed -i "s|http://localhost:[0-9]\+|http://localhost:$PORT|g" /root/.claude-code-router/config.json
fi

# 启动 npm 服务
npm start &

# 等待一段时间确保 npm 服务已启动
sleep 2

