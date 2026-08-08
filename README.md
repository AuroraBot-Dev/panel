# AuroraBot Dashboard

AuroraBot 的 AI Agent 运行与配置面板。第一阶段包含登录/RBAC、运行概览、完整业务导航、领域 API 边界和本地 Mock 服务。

## 开发

环境要求：Node.js 22.18+、pnpm 11+。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发环境默认启用 Nitro Mock API。登录账号为 `admin`，密码为 `123456`。

常用检查：

```bash
pnpm typecheck
pnpm build
```

## 接入真实 API

1. 将后端 OpenAPI 文档保存为 `openapi/openapi.yaml`。
2. 运行 `pnpm api:generate` 更新传输层类型。
3. 在 `apps/web-antd/src/api/modules` 中实现或校准领域适配器。
4. 将 `VITE_API_MODE` 设置为 `remote`，并配置 `VITE_GLOB_API_URL`。

页面只能通过 `src/services` 和 `src/api/modules` 访问后端，不应直接拼接接口地址。

## 当前边界

- 已实现：Dashboard Mock 指标、Agent 列表与 Mock 重启、业务路由骨架。
- 待 OpenAPI：真实聊天流、配置写入、资源管理、学习/记忆、插件和日志接口。
- 本阶段不包含数据库、Agent 后端或生产部署。

本项目基于 MIT 许可的 Vben Admin 5.7 精简改造，原始许可见 [LICENSE](./LICENSE)。
