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

未启动后端时，可在登录页输入特殊 Token `local` 进入离线调试模式。该模式只在前端建立本地会话，不会连接后端服务，便于单独调试面板界面。

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
- 操作目录：`/api/ops` 与 30 个注册操作
- 附件：`/api/ops/attachments`
- 输出流：`/api/ops/stream`

后端使用动态操作路由，前端在 `apps/web/src/api/modules` 和 `apps/web/src/api/types` 中按领域维护请求函数与传输 DTO。页面只能通过 `#/api` 访问后端。

## 当前边界

引擎观察、聊天、会话、模型、配置、提示词、记忆、日志、诊断、插件和应用页面使用真实后端数据。Emoji、表情、屏蔽词、学习和插件市场入口作为明确的功能占位保留，不提供模拟数据或虚构 API。

## 发布与部署

面板是独立于主仓发布的纯静态 SPA，`apps/web/dist` 即全部产物；API 与 WebSocket 地址是运行时配置（构建产物中的 `_app-config-*.js`），部署时修改即可，无需重新构建。

### CI 与发布

- `.github/workflows/ci.yml`：push / PR 时执行 lint、typecheck、单测与构建校验。
- `.github/workflows/release.yml`：推送 `v*` tag 时复用 CI 校验并构建，把 `apps/web/dist` 打包为 `aurorabot-panel-<tag>.zip` 附到 GitHub Release。

```bash
git tag v5.7.0
git push origin v5.7.0
```

### 部署

后端（`aurora` 进程）只监听 loopback 的 `127.0.0.1:8765`，面板需与其同机部署。两种方式：

1. **nginx 反代**：使用 `scripts/deploy/nginx.conf`（托管静态文件 + 反代 `/api`、`/healthz` 和 WebSocket），并把访问来源（如 `http://127.0.0.1:8080`）加入后端 `config/runtime.toml` 的 `runtime.panel.allowed_origins`。
2. **容器**：`scripts/deploy/build-local-docker-image.sh` 构建镜像后需用 `--network host` 运行（nginx 需访问主机 loopback 后端）。

纯本地使用也可以直接 `pnpm dev`（Vite 代理）或 `pnpm build && pnpm preview`。远程访问请按主仓文档建立可信隧道，保持后端只监听本机。

## 检查

```bash
pnpm typecheck
pnpm exec vitest run apps/web/src/api/operation-coverage.test.ts --dom
pnpm lint
pnpm build
```
