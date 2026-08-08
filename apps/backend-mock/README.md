# AuroraBot development Mock API

该服务为 Dashboard 第一阶段提供登录、RBAC、Agent 状态、指标趋势和安全的 Mock 重启接口。数据只存在于进程内，不连接数据库，也不会操作真实 Agent。

开发时由前端构建插件自动启动，也可单独运行：

```bash
pnpm -F @vben/backend-mock start
pnpm -F @vben/backend-mock build
```
