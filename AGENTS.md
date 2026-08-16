# AGENTS.md

## 项目概况

- AuroraBot 面板：Vue 3 + Vite + Naive UI，基于 Vben Admin 5.7 的 pnpm monorepo（turbo 缓存）。中文代码注释与提交信息（conventional commits，czg/commitlint），不要翻译。
- 唯一真实应用是 `apps/web`（`@vben/web`）。`internal/`、`packages/`、`scripts/` 是 Vben 底座（vsh CLI、lint/tsconfig 配置等），日常改动集中在 `apps/web/src`。
- 不要用 OpenCode/其他 AI 生成内容替换 `packages/@core` 等底座代码；改动底座后需 `pnpm check:type`（turbo 全量）验证，而 `pnpm typecheck` 只查 `apps/web`。

## 常用命令

- 安装：`pnpm install --frozen-lockfile`（`.npmrc` 指向 npmmirror，preinstall 强制 pnpm）。
- `pnpm dev`：需先启动 AuroraBot 后端（`http://127.0.0.1:8765`），Vite 代理 `/api`、`/healthz` 与 WebSocket（见 `apps/web/vite.config.ts`）。登录使用后端 `data/ops/Token.txt` 中的 bootstrap token。
- 校验顺序与 CI（`.github/workflows/ci.yml`）一致：`pnpm lint` → `pnpm typecheck` → `pnpm test:unit` → `pnpm build`。
- `pnpm lint` = `vsh lint`（oxlint `--type-aware` + prettier check + eslint `--cache` + stylelint）；`pnpm format` 是自动修复版。
- 单个测试：`pnpm exec vitest run apps/web/src/api/operation-coverage.test.ts --dom`（`test:unit` 即 `vitest run --dom`，happy-dom）。
- pre-commit 由 lefthook 串行执行 oxlint/prettier/stylelint，只处理暂存文件并自动回填。

## API 契约（关键）

- 后端是动态 `/api/ops/{path}` catch-all 路由，OpenAPI 无法表达具体 DTO → 前端不做生成类型，`apps/web/src/api/types/` 按后端契约手工同步。
- 业务 URL 只能出现在 `apps/web/src/api/modules/`；`client.ts` 负责基址、Bearer 会话与 Operation envelope。
- `operation-coverage.ts` 维护 30 个后端操作与页面路由的映射，`operation-coverage.test.ts` 断言恰好 30 个。后端操作增删时必须同步 `modules/`、`types/`、coverage 映射与测试。

## 页面边界

- 引擎观察、聊天、会话、模型、配置、提示词、记忆、日志、诊断、插件、应用页面使用真实后端数据。
- Emoji、表情、屏蔽词、学习、插件市场是 `apps/web/src/views/aurora/feature-placeholder.vue` 的明确占位，禁止提供 mock 数据或虚构 API。

## 部署

- 纯静态 SPA，`apps/web/dist` 即全部产物；API/WS 地址是运行时配置（产物中的 `_app-config-*.js`，由 `internal/vite-config/src/plugins/extra-app-config.ts` 生成），改配置无需重新构建。
- 后端只监听 loopback，nginx 反代与容器化部署见 `scripts/deploy/` 及 README「发布与部署」。
