#!/bin/bash

# 在服务器上执行的 SSH 密钥配置脚本
# 请先通过腾讯云控制台或其他方式登录服务器后运行此脚本

echo "========================================"
echo "服务器端 SSH 密钥配置"
echo "========================================"
echo ""

# 公钥内容
PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDI+Ecin8hMe3jeLK5qNGQUhTw2+qv11mFFUbeyhEUjqPU9JvjSqeEVAjq0K59ILgncP3Cg+Xyb5kBGAJaLNONXMDYP63EhCpnJfSx1Js5nnbKvKRRKYWs4JwdTUucz5cn6h24rAQdRDXxb0i5j+M2WWC0bedhhIfqzoOEdi3N7VKjB3+TKcMPFaXe5IYWNendvsVoEfx95yZnyzu2RINeHHJDA+ppkrZAi1L8O678POrC0Gv2XizAOHHvQWBpe8eMLQDMjrGhQU27hC5liA5obbwIkt99Ff1YbSNf7WyqL4X0hIVlchtzd7arD/+BctKWotO0ghX1S/6Uv/CbcPC7iS0BsDhoWTHcH5tufp+agTINiB9SOP8xld9va99HGeVEAcS0mjlGDhPqCtw2/69aU12a5DdjPWYbKFh1fpuEx0EDKgvV06laVC6OJsvFI4aud8y4BkTqWN5OP6+VSESMQJgEjdNTXM64ie+A5FZrmtWK1HTNcrDtdmvwyZaujmS6KQFv85xGi6ZVeEtoi+PzeP/lR5qjfXTlirCnZhrRWSMAI98vqKiLvJIBCGvjaopcjbKM6NvMaTZN1tBV5PlMN2DrZ3FjpK1wwMha1d+YLvp0uLKT6aCv39pHvAO2P2mv7NN/5PGirQIEM/imNTdtuT78t0ws8VMxrH9Sq5meJpQ== zengya@radnova.com"

echo "步骤 1: 创建 .ssh 目录..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "✓ .ssh 目录已创建"
echo ""

echo "步骤 2: 配置 authorized_keys..."

# 检查公钥是否已存在
if [ -f ~/.ssh/authorized_keys ] && grep -q "$PUBLIC_KEY" ~/.ssh/authorized_keys; then
    echo "✓ 公钥已存在于 authorized_keys 中"
else
    # 添加或创建 authorized_keys
    if [ -f ~/.ssh/authorized_keys ]; then
        echo "$PUBLIC_KEY" >> ~/.ssh/authorized_keys
    else
        echo "$PUBLIC_KEY" > ~/.ssh/authorized_keys
    fi
    chmod 600 ~/.ssh/authorized_keys
    echo "✓ 公钥已添加到 authorized_keys"
fi
echo ""

echo "步骤 3: 验证配置..."
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
echo ".ssh 目录权限: $(stat -c %a ~/.ssh 2>/dev/null || ls -ld ~/.ssh | awk '{print $1}')"
echo "authorized_keys 权限: $(stat -c %a ~/.ssh/authorized_keys 2>/dev/null || ls -l ~/.ssh/authorized_keys | awk '{print $1}')"
echo ""

echo "步骤 4: 查看 authorized_keys 内容..."
cat ~/.ssh/authorized_keys
echo ""

echo "步骤 5: 检查 SSH 配置..."
if [ -f /etc/ssh/sshd_config ]; then
    echo "PubkeyAuthentication: $(grep -E '^PubkeyAuthentication' /etc/ssh/sshd_config || echo '未设置(默认启用)')"
    echo "PasswordAuthentication: $(grep -E '^PasswordAuthentication' /etc/ssh/sshd_config || echo '未设置(默认启用)')"
fi
echo ""

echo "步骤 6: (可选) 启用密码登录作为备份"
read -p "是否启用密码登录? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f /etc/ssh/sshd_config ]; then
        sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
        if ! grep -q '^PasswordAuthentication' /etc/ssh/sshd_config; then
            echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
        fi
        echo "✓ 密码登录已启用"
        echo ""
        read -p "是否重启 SSH 服务? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            systemctl restart sshd
            echo "✓ SSH 服务已重启"
        fi
    fi
fi
echo ""

echo "========================================"
echo "配置完成!"
echo "========================================"
echo ""
echo "现在请回到你的本地电脑,测试密钥登录:"
echo "  ssh root@150.158.11.197"
echo ""
echo "如果成功,你将无需输入密码即可登录!"
echo "========================================"
