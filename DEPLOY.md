# 星渊项目部署指南

## 服务器信息

- **IP地址**: 150.158.11.197
- **系统**: CentOS 7.6
- **Docker**: 26.1.3 (已安装)
- **Docker Compose**: v2.27.1 (已安装)
- **项目目录**: /opt/xing-yuan

## 首次部署

### 1. 准备工作

```bash
# 确保 server/.env 文件存在
cat > server/.env << EOF
ANTHROPIC_API_KEY=your_api_key_here
EOF
```

### 2. 执行部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. 验证部署

访问 http://150.158.11.197

## 快速更新

当修改代码后,使用快速更新脚本:

```bash
./update.sh
```

## 常用命令

### 连接到服务器

```bash
ssh root@150.158.11.197
```

### 查看容器状态

```bash
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose ps'
```

### 查看容器日志

```bash
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose logs -f'
```

### 重启服务

```bash
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose restart'
```

### 停止服务

```bash
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose down'
```

### 完全重新构建

```bash
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose down'
./deploy.sh
```

## 配置 HTTPS (可选)

如果需要配置 SSL 证书:

1. 安装 certbot:
```bash
ssh root@150.158.11.197
yum install certbot -y
```

2. 获取证书:
```bash
certbot certonly --standalone -d your-domain.com
```

3. 更新 nginx 配置和 docker-compose.yml 以使用 HTTPS

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose logs server'
ssh root@150.158.11.197 'cd /opt/xing-yuan && docker compose logs client'
```

### 端口被占用

```bash
# 检查端口占用
ssh root@150.158.11.197 'netstat -tulpn | grep -E ":80|:443|:3001"'
```

### SELinux 问题

如果遇到权限问题,临时禁用 SELinux:
```bash
ssh root@150.158.11.197 'setenforce 0'
```

永久禁用 SELinux (不推荐):
```bash
ssh root@150.158.11.197 'sed -i s/^SELINUX=enforcing/SELINUX=disabled/ /etc/selinux/config'
```

## 性能优化

### 设置容器资源限制

在 `docker-compose.yml` 中添加:

```yaml
services:
  client:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
  server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

## 备份

### 备份数据

```bash
ssh root@150.158.11.197 'cd /opt/xing-yuan && tar -czf xingyuan-backup-$(date +%Y%m%d).tar.gz .'
```

### 恢复数据

```bash
ssh root@150.158.11.197 'cd /opt && tar -xzf xingyuan-backup-YYYYMMDD.tar.gz'
```

## 监控

### 实时监控容器资源

```bash
ssh root@150.158.11.197 'docker stats'
```

### 查看磁盘使用

```bash
ssh root@150.158.11.197 'df -h'
ssh root@150.158.11.197 'du -sh /opt/xing-yuan'
```

## 安全建议

1. 修改默认 SSH 端口
2. 配置防火墙规则
3. 定期更新系统和 Docker
4. 使用强密码
5. 配置 SSH 密钥认证

## 技术支持

如遇到问题,请检查:
1. Docker 服务是否正常运行
2. 容器日志是否有错误信息
3. 端口是否被占用
4. SELinux 是否阻止了操作
5. 防火墙规则是否正确
