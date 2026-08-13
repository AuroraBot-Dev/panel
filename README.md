# AuroraBot Panel

AuroraBot 的 Web 管理面板，基于 Vue 3、Vite、Naive UI 和 Vben Admin 5.7。面板直接连接 AuroraBot `ops` 后端，用于观察运行态、聊天、查看配置和执行诊断操作。

## 环境要求

- Node.js 22.18+ 或 24.12+
- pnpm 11+
- 已启动的 AuroraBot 后端

## 本地开发

先在 AuroraBot 仓库启动后端：

```bash
uv run aurora start
```

后端默认监听 `http://127.0.0.1:8765`。随后在本仓库运行：

```bash
pnpm install --frozen-lockfile
pnpm dev
```

开发服务器通过 Vite 将 `/api`、`/healthz` 和 WebSocket 转发到 AuroraBot。登录时使用后端生成在 `data/ops/Token.txt` 中的 bootstrap token。

跨域部署可通过 `VITE_GLOB_API_URL` 设置 API 地址，并通过 `VITE_GLOB_WS_URL` 显式设置 WebSocket 地址。

## 项目结构

```text
apps/web            唯一应用（Vue 3 + Naive UI）
internal/           构建与开发期工具：vite-config、node-utils、tsconfig、tailwind-config、lint 配置
packages/@core/     UI 基元层：shared、icons、composables、preferences 与各 ui-kit 组件包
packages/effects/   应用增强层：layouts、common-ui、plugins、request、access、hooks 等
packages/           应用共享层：types、utils、stores、locales、styles、constants、icons 等
scripts/            vsh（内部 CLI）与 deploy（Docker 构建）
```

## API 契约

- 认证：`/api/auth/login`、`/api/auth/logout`
- 健康检查：`/api/health`、`/healthz`
- 操作目录：`/api/ops` 与 26 个注册操作
- 附件：`/api/ops/attachments`
- 输出流：`/api/ops/stream`

后端使用动态操作路由，前端在 `apps/web/src/api/modules` 和 `apps/web/src/api/types` 中按领域维护请求函数与传输 DTO。页面只能通过 `#/api` 访问后端。

## 当前边界

引擎观察、聊天、会话、模型、配置、提示词、记忆、日志和诊断页面使用真实后端数据。Emoji、表情、屏蔽词、学习、插件和市场入口作为明确的功能占位保留，不提供模拟数据或虚构 API。

## 检查

```bash
pnpm typecheck
pnpm exec vitest run apps/web/src/api/operation-coverage.test.ts --dom
pnpm lint
pnpm build
```
