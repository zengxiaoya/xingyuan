#!/bin/bash

# 快速更新脚本 - 自动检测变更类型，前端重新构建，后端仅重启

SERVER_IP="150.158.11.197"
SERVER_USER="root"
SERVER_DIR="/opt/xing-yuan"

echo "上传文件..."

RSYNC_OUT=$(rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude 'ude-design' \
    --exclude '.DS_Store' \
    ./ $SERVER_USER@$SERVER_IP:$SERVER_DIR/ 2>&1)

echo "$RSYNC_OUT"

# 检测变更范围
CLIENT_CHANGED=$(echo "$RSYNC_OUT" | grep -c '^client/' || true)
SERVER_CHANGED=$(echo "$RSYNC_OUT" | grep -c '^server/' || true)

if [ "$CLIENT_CHANGED" -gt 0 ] && [ "$SERVER_CHANGED" -gt 0 ]; then
    echo "前端 + 后端均有变更，重新构建 client，重启 server..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker compose up -d --build client && docker compose restart server"
elif [ "$CLIENT_CHANGED" -gt 0 ]; then
    echo "前端文件变更，重新构建 client 镜像..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker compose up -d --build client"
elif [ "$SERVER_CHANGED" -gt 0 ]; then
    echo "后端文件变更，重启 server 容器..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker compose restart server"
else
    echo "其他文件变更，重启所有容器..."
    ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && docker compose restart"
fi

echo "完成! 访问 https://starvene.club"
