# 星渊项目快速部署指南

## 服务器信息

- **IP地址**: 150.158.11.197
- **用户名**: root
- **系统**: CentOS 7.6
- **Docker**: 26.1.3 (已安装)
- **Docker Compose**: v2.27.1 (已安装)

## 快速部署 (推荐)

### 方法一: 自动密码登录 (最简单)

```bash
./deploy-auto.exp
```

这个脚本会自动:
- ✅ 使用密码登录服务器
- ✅ 上传所有项目文件
- ✅ 构建 Docker 镜像
- ✅ 启动所有容器
- ✅ 显示实时日志

### 方法二: 使用密钥登录 (推荐长期使用)

如果已经配置了 SSH 密钥:

```bash
./deploy.sh
```

如果需要使用密码:

```bash
./deploy.sh --password
```

## 首次部署前的准备

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑 .env 文件,填入你的 Anthropic API Key
# nano server/.env  或  vim server/.env
```

**server/.env 内容:**
```
ANTHROPIC_API_KEY=sk-ant-xxxxx...
PORT=3001
NODE_ENV=production
```

### 2. 安装 expect (仅方法一需要)

macOS:
```bash
brew install expect
```

Linux:
```bash
# Ubuntu/Debian
apt-get install expect

# CentOS/RHEL
yum install expect
```

### 3. 确保服务器端口开放

在腾讯云控制台确保以下端口已开放:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

## 验证部署

访问应用:

```
http://150.158.11.197
```

## 日常更新

修改代码后,快速更新:

```bash
# 自动密码方式
./deploy-auto.exp

# 或使用密钥方式
./update.sh
```

## 常用管理命令

```bash
# 查看容器状态
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose ps'

# 查看日志
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose logs -f'

# 重启服务
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose restart'

# 停止服务
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose down'

# 重新构建
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose up -d --build'
```

## 项目文件说明

```
xingyuan/
├── deploy-auto.exp       # 自动部署脚本 (推荐)
├── deploy.sh             # 部署脚本 (密钥/密码)
├── update.sh             # 快速更新脚本
├── docker-compose.yml    # Docker 配置
├── README-DEPLOY.md      # 本文件
├── DEPLOY.md             # 详细部署文档
├── server/
│   ├── .env.example      # 环境变量模板
│   └── .env              # 环境变量 (需手动创建)
└── nginx/
    └── nginx.conf        # Nginx 配置
```

## 故障排查

### 1. expect 命令未找到

安装 expect:
```bash
# macOS
brew install expect

# CentOS
yum install expect

# Ubuntu
apt-get install expect
```

### 2. 容器无法启动

查看详细日志:
```bash
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose logs'
```

### 3. SELinux 权限问题

自动部署脚本会自动处理,如果需要手动:
```bash
ssh root@150.158.11.197 'setenforce 0'
```

### 4. 端口被占用

检查端口占用:
```bash
ssh root@150.158.11.197 'netstat -tulpn | grep -E ":80|:3001"'
```

### 5. rsync 上传失败

如果 rsync 提示找不到,可以安装:
```bash
# macOS (已预装)
# CentOS
yum install rsync

# Ubuntu
apt-get install rsync
```

## 安全建议

1. **修改默认密码**: 首次登录后立即修改 root 密码
2. **配置 SSH 密钥**: 推荐使用 SSH 密钥而非密码
3. **修改 SSH 端口**: 修改默认的 22 端口
4. **配置防火墙**: 只开放必要的端口
5. **定期更新**: 定期更新系统和 Docker

## 配置 SSH 密钥 (推荐)

在本地生成密钥:

```bash
# 生成密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 将公钥复制到服务器
ssh-copy-id root@150.158.11.197

# 之后就可以免密码登录
ssh root@150.158.11.197
```

配置密钥后,可以使用 `./deploy.sh` 而无需输入密码。

## 监控和维护

### 查看容器资源使用

```bash
ssh root@150.158.11.197 'docker stats'
```

### 查看磁盘使用

```bash
ssh root@150.158.11.197 'df -h && du -sh /opt/xing-yuan'
```

### 备份数据

```bash
ssh root@150.158.11.197 'cd /opt && tar -czf xingyuan-backup-$(date +%Y%m%d).tar.gz xing-yuan'
```

## 技术支持

如遇到问题:
1. 查看容器日志
2. 检查服务器资源
3. 查看 DEPLOY.md 详细文档

---

**祝你部署顺利!** 🚀

访问地址: http://150.158.11.197
