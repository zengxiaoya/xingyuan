#!/bin/bash

# 星渊项目部署脚本
# 用于将项目部署到腾讯云轻量级服务器

set -e

echo "========================================"
echo "星渊项目部署脚本"
echo "========================================"

# 服务器配置
SERVER_IP="150.158.11.197"
SERVER_USER="root"
SERVER_DIR="/opt/xing-yuan"

# 如果需要使用密码登录,取消下面这行的注释
# 使用 sshpass 工具 (需要先安装: brew install hudochenkov/sshpass/sshpass)
# 使用方式: ./deploy.sh --password
USE_PASSWORD=false

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}步骤 1: 检查本地 Docker 镜像构建...${NC}"

# 检查是否有 .env 文件
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}警告: server/.env 文件不存在${NC}"
    echo "请创建 server/.env 文件并添加 ANTHROPIC_API_KEY"
    echo "示例:"
    echo "ANTHROPIC_API_KEY=your_api_key_here"
    read -p "是否继续部署? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}步骤 2: 测试服务器连接...${NC}"

# 检查是否使用密码登录
if [ "$1" = "--password" ] || [ "$USE_PASSWORD" = "true" ]; then
    echo "使用密码方式连接服务器..."
    echo "首次连接会要求输入密码"
    # 创建临时脚本存储密码
    read -s -p "请输入服务器密码: " SERVER_PASSWORD
    echo

    # 检查 sshpass 是否安装
    if ! command -v sshpass &> /dev/null; then
        echo "错误: 需要安装 sshpass 工具"
        echo "macOS: brew install hudochenkov/sshpass/sshpass"
        echo "Linux: apt-get install sshpass 或 yum install sshpass"
        exit 1
    fi

    # 使用 sshpass 测试连接
    if ! sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo '服务器连接成功'" > /dev/null 2>&1; then
        echo "无法连接到服务器 $SERVER_IP"
        echo "请检查:"
        echo "1. 服务器 IP 地址是否正确"
        echo "2. 密码是否正确"
        echo "3. 服务器 SSH 服务是否启动"
        exit 1
    fi
else
    # 使用密钥方式连接
    if ! ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo '服务器连接成功'" > /dev/null 2>&1; then
        echo "无法连接到服务器 $SERVER_IP"
        echo "请确保:"
        echo "1. 服务器 IP 地址正确"
        echo "2. SSH 密钥已配置"
        echo "3. 服务器 SSH 服务已启动"
        echo ""
        echo "如果需要使用密码登录,运行: ./deploy.sh --password"
        exit 1
    fi
fi

echo -e "${GREEN}步骤 3: 在服务器上创建项目目录...${NC}"
if [ "$1" = "--password" ] || [ "$USE_PASSWORD" = "true" ]; then
    sshpass -p "$SERVER_PASSWORD" ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR"
else
    ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR"
fi

echo -e "${GREEN}步骤 4: 上传项目文件到服务器...${NC}"
# 排除不需要上传的文件和目录
if [ "$1" = "--password" ] || [ "$USE_PASSWORD" = "true" ]; then
    # 使用密码方式上传
    sshpass -p "$SERVER_PASSWORD" rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude '.env' \
        --exclude 'ude-design' \
        --exclude '.DS_Store' \
        ./ $SERVER_USER@$SERVER_IP:$SERVER_DIR/
else
    rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude '.env' \
        --exclude 'ude-design' \
        --exclude '.DS_Store' \
        ./ $SERVER_USER@$SERVER_IP:$SERVER_DIR/
fi

echo -e "${GREEN}步骤 5: 在服务器上创建 .env 文件...${NC}"
if [ -f "server/.env" ]; then
    echo "上传 server/.env 文件..."
    if [ "$1" = "--password" ] || [ "$USE_PASSWORD" = "true" ]; then
        sshpass -p "$SERVER_PASSWORD" scp server/.env $SERVER_USER@$SERVER_IP:$SERVER_DIR/server/.env
    else
        scp server/.env $SERVER_USER@$SERVER_IP:$SERVER_DIR/server/.env
    fi
fi

echo -e "${GREEN}步骤 6: 在服务器上构建和启动容器...${NC}"

# 使用 SSH 在服务器上执行命令
SSH_CMD="ssh $SERVER_USER@$SERVER_IP"

$SSH_CMD << 'ENDSSH'
cd /opt/xing-yuan

# 检查 SELinux 状态并临时禁用（避免容器权限问题）
if [ "$(getenforce)" != "Disabled" ]; then
    echo "临时禁用 SELinux..."
    setenforce 0
    echo "SELinux 已临时禁用"
fi

# 拉取最新镜像
echo "拉取最新镜像..."
docker compose pull

# 构建并启动容器
echo "构建并启动容器..."
docker compose up -d --build

# 查看容器状态
echo ""
echo "容器状态:"
docker compose ps

echo ""
echo "查看容器日志 (按 Ctrl+C 退出):"
docker compose logs -f
ENDSSH

echo ""
echo -e "${GREEN}========================================"
echo "部署完成!"
echo "========================================${NC}"
echo "访问地址: http://$SERVER_IP"
echo ""
echo "查看日志:"
echo "  ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_DIR && docker compose logs -f'"
echo ""
echo "重启服务:"
echo "  ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_DIR && docker compose restart'"
echo ""
echo "停止服务:"
echo "  ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_DIR && docker compose down'"
echo ""
