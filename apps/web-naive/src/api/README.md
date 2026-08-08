# AuroraBot API boundary

- `generated/`：由 `openapi/openapi.yaml` 生成的传输层类型。
- `modules/`：按业务域组织的请求适配器或适配器接口，URL 只能出现在这里。
- `types/aurora.ts`：与具体后端字段无关的前端领域类型。

所有列表使用 `PageQuery`/`PageResult`，所有可取消查询接收 `AbortSignal`。错误提示由全局请求拦截器统一处理，页面只处理空态、重试和领域级反馈。
