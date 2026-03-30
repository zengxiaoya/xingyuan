#!/bin/bash

# SSH 密钥手动配置指南脚本

SERVER_IP="150.158.11.197"
SERVER_USER="root"

echo "========================================"
echo "SSH 密钥配置指南"
echo "========================================"
echo "服务器: $SERVER_IP"
echo "========================================"
echo ""

echo "步骤 1: 查看你的公钥"
echo "========================================"
cat ~/.ssh/id_rsa.pub
echo ""
echo "========================================"
echo ""

echo "步骤 2: 请按以下步骤操作"
echo "========================================"
echo "1. 使用密码或其他方式登录服务器:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "2. 在服务器上执行以下命令:"
echo ""
echo "   # 创建 .ssh 目录"
echo "   mkdir -p ~/.ssh"
echo "   chmod 700 ~/.ssh"
echo ""
echo "   # 创建 authorized_keys 文件"
echo "   cat > ~/.ssh/authorized_keys << 'EOF'"
echo "$(cat ~/.ssh/id_rsa.pub)"
echo "EOF"
echo ""
echo "   # 设置正确的权限"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "========================================"
echo ""

echo "步骤 3: 测试密钥登录"
echo "========================================"
echo "配置完成后,运行以下命令测试:"
echo ""
echo "   ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "如果不需要输入密码就能登录,说明配置成功!"
echo ""
echo "========================================"
echo ""

read -p "按回车键继续,或按 Ctrl+C 退出..."

echo ""
echo "步骤 4: 验证配置"
echo "========================================"

# 尝试免密登录
if ssh -o PasswordAuthentication=no -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo '✓ SSH 密钥登录成功!'" 2>/dev/null; then
    echo ""
    echo "========================================"
    echo "✓ 配置成功!"
    echo "========================================"
    echo ""
    echo "现在你可以:"
    echo "  1. 免密码登录: ssh $SERVER_USER@$SERVER_IP"
    echo "  2. 使用部署脚本: ./deploy.sh"
    echo "  3. 使用快速更新: ./update.sh"
    echo ""
else
    echo ""
    echo "========================================"
    echo "配置尚未完成"
    echo "========================================"
    echo ""
    echo "请按照步骤2中的命令在服务器上配置密钥,"
    echo "然后再次运行本脚本验证配置。"
    echo ""
fi

echo "========================================"
