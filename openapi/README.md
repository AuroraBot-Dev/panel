# OpenAPI contract

将 AuroraBot 后端提供的规范文件保存为 `openapi.yaml`，然后在仓库根目录运行：

```bash
pnpm api:generate
pnpm api:check
```

生成结果位于 `apps/web-naive/src/api/generated/schema.d.ts`。生成文件只描述传输层，不得由页面直接引用，也不得手工修改；字段转换和错误语义统一放在 `src/api/modules`。

在正式规范到位前，不为聊天流、响应包裹格式或后端字段名称建立临时假设。
