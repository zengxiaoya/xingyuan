# SSH 密钥登录配置指南

## 📋 什么是 SSH 密钥登录?

SSH 密钥登录是一种更安全、更方便的登录方式,相比密码登录有以下优势:

- ✅ **更安全**: 密钥比密码更难破解
- ✅ **更方便**: 无需每次输入密码
- ✅ **自动化**: 便于脚本自动操作

## 🚀 快速配置 (推荐)

### 方式一: 自动配置 (最简单)

我们已经为你准备好了自动配置脚本,只需一条命令:

```bash
./setup-ssh-key.exp
```

这个脚本会自动:
1. 检查本地 SSH 密钥
2. 连接到服务器
3. 将公钥添加到服务器
4. 测试密钥登录

完成后,你就可以免密码登录了!

### 方式二: 手动配置

如果你想了解详细过程,可以手动配置:

#### 步骤 1: 检查本地密钥

```bash
ls -la ~/.ssh
```

如果有 `id_rsa` 和 `id_rsa.pub` 文件,说明已经有密钥了。

#### 步骤 2: (可选) 生成新密钥

如果没有密钥,生成一个:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

按提示操作,可以使用默认设置。

#### 步骤 3: 复制公钥到服务器

**方法 A: 使用 ssh-copy-id (推荐 Linux/macOS)**

```bash
ssh-copy-id root@150.158.11.197
```

输入服务器密码后,会自动配置好密钥。

**方法 B: 手动复制**

1. 获取公钥:
```bash
cat ~/.ssh/id_rsa.pub
```

2. 登录服务器:
```bash
ssh root@150.158.11.197
```

3. 在服务器上执行:
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# 粘贴公钥内容
chmod 600 ~/.ssh/authorized_keys
```

#### 步骤 4: 测试密钥登录

```bash
ssh root@150.158.11.197
```

如果不需要输入密码就能登录,说明配置成功!

## 📝 验证配置

### 测试免密登录

```bash
# 测试连接
ssh root@150.158.11.197 "echo '登录成功!'"
```

### 查看服务器上的授权密钥

```bash
ssh root@150.158.11.197 "cat ~/.ssh/authorized_keys"
```

### 查看本地密钥

```bash
# 查看私钥
ls -la ~/.ssh/id_rsa

# 查看公钥
cat ~/.ssh/id_rsa.pub
```

## 🎯 配置后的优势

### 1. 免密码登录

```bash
ssh root@150.158.11.197
```

### 2. 简化部署脚本

配置密钥后,可以使用标准部署脚本:

```bash
# 不再需要 --password 参数
./deploy.sh
```

### 3. 方便的文件传输

```bash
# 上传文件
scp local.txt root@150.158.11.197:/path/to/destination

# 同步文件
rsync -avz ./ root@150.158.11.197:/opt/xing-yuan/
```

## 🔧 常见问题

### 1. 还是需要密码?

可能的原因:
- 服务器 SSH 配置不允许密钥登录
- 权限设置不正确

解决方法:

```bash
# 登录服务器检查 SSH 配置
ssh root@150.158.11.197

# 编辑 SSH 配置
nano /etc/ssh/sshd_config

# 确保以下配置:
PubkeyAuthentication yes
PasswordAuthentication yes  # 可以保留密码作为备份

# 重启 SSH 服务
systemctl restart sshd
```

### 2. 权限问题

确保服务器上文件权限正确:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 3. 多个密钥管理

如果你有多个服务器的密钥,可以配置 SSH config:

```bash
# 创建/编辑配置文件
nano ~/.ssh/config

# 添加以下内容:
Host xingyuan
    HostName 150.158.11.197
    User root
    IdentityFile ~/.ssh/id_rsa
```

之后就可以使用:
```bash
ssh xingyuan
```

### 4. 密钥丢失或损坏

如果私钥丢失,需要:
1. 从服务器删除旧公钥
2. 重新生成密钥对
3. 重新配置

## 🔒 安全建议

### 1. 保护私钥

```bash
# 私钥应该只有读权限
chmod 600 ~/.ssh/id_rsa

# .ssh 目录应该只有所有者可以访问
chmod 700 ~/.ssh
```

### 2. 使用 passphrase (可选)

生成密钥时设置 passphrase 增加安全性:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 提示时输入 passphrase
```

### 3. 禁用密码登录 (可选)

确认密钥登录正常后,可以禁用密码登录:

```bash
# 编辑服务器 SSH 配置
ssh root@150.158.11.197
nano /etc/ssh/sshd_config

# 修改:
PasswordAuthentication no

# 重启 SSH 服务
systemctl restart sshd
```

⚠️ **警告**: 禁用密码登录前确保密钥配置正确!

## 📊 密钥类型对比

| 类型 | 安全性 | 兼容性 | 速度 | 推荐度 |
|------|--------|--------|------|--------|
| RSA 2048 | 一般 | 很好 | 较慢 | ⭐⭐⭐ |
| RSA 4096 | 很好 | 很好 | 慢 | ⭐⭐⭐⭐ |
| Ed25519 | 最好 | 好 | 很快 | ⭐⭐⭐⭐⭐ |

生成 Ed25519 密钥:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

## 🎓 进阶用法

### SSH Agent (避免重复输入 passphrase)

```bash
# 启动 agent
eval "$(ssh-agent -s)"

# 添加密钥
ssh-add ~/.ssh/id_rsa

# 之后就不需要重复输入 passphrase
```

### 跳板机配置

通过跳板机连接:

```bash
# ~/.ssh/config
Host bastion
    HostName bastion.example.com
    User bastion_user

Host target
    HostName 150.158.11.197
    User root
    ProxyJump bastion
```

### 端口转发

```bash
# 本地端口转发
ssh -L 8080:localhost:80 root@150.158.11.197

# 远程端口转发
ssh -R 8080:localhost:80 root@150.158.11.197
```

## 📚 参考资料

- [SSH 官方文档](https://www.openssh.com/manual.html)
- [GitHub SSH 密钥指南](https://docs.github.com/zh/authentication/connecting-to-github-with-ssh)

## ✅ 快速检查清单

配置完成后,检查以下项目:

- [ ] 可以免密码登录: `ssh root@150.158.11.197`
- [ ] 私钥权限正确: `ls -la ~/.ssh/id_rsa`
- [ ] 公钥已在服务器上: `cat ~/.ssh/authorized_keys`
- [ ] 部署脚本可以免密码运行: `./deploy.sh`

---

**现在就开始配置吧!**

```bash
./setup-ssh-key.exp
```

配置成功后,你就可以享受免密码登录的便利了! 🎉
