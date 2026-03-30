#!/bin/bash

# 快速更新脚本 - 不重新构建镜像,只重启容器

SERVER_IP="150.158.11.197"
SERVER_USER="root"
SERVER_DIR="/opt/xing-yuan"

echo "快速更新项目..."

# 上传代码
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude 'ude-design' \
    --exclude '.DS_Store' \
    ./ $SERVER_USER@$SERVER_IP:$SERVER_DIR/

# 重启容器
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker compose restart"

echo "更新完成! 访问 http://$SERVER_IP"
