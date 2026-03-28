# Plan B: 主进程 (后端完善)

**执行者**: Agent B

## 任务列表

### B1. 检查并完善 MySQL 插件
- 确认 `getDatabases` 正常工作
- 确认 `getTables` 正常工作
- 确认 `getColumns` 正常工作
- 确认 `query` 正常工作

### B2. 优化连接管理
- 修改 `electron/connection/manager.ts`
- 支持连接池（可选，单个连接先跑通）

### B3. 完善 IPC 处理器
- 检查 `electron/ipc/database.ts`
- 确保所有处理器正确注册
- 添加错误处理和日志

### B4. 更新预加载脚本类型
- 确保 `electron/preload.ts` 暴露的 API 完整
- 更新类型定义 `src/types/index.ts`

### B5. 添加日志和错误处理
- 在关键位置添加 console.log
- 统一错误返回格式

---

## 输出文件清单

```
electron/
├── plugins/mysql/index.ts    # 检查/完善
├── connection/manager.ts     # 检查/优化
├── ipc/database.ts           # 检查/完善
├── preload.ts                # 检查/完善
└── main.ts                   # 检查

src/types/index.ts            # 检查/完善
```

---

## IPC 接口约定

```typescript
// 连接管理
'connection:connect'      // 建立连接，返回 connId
'connection:disconnect'   // 断开连接

// 数据库操作
'db:getDatabases'         // 获取数据库列表
'db:getTables'            // 获取表列表
'db:getColumns'           // 获取字段列表
'db:query'                // 执行 SQL
```

---

## 验证方式

```bash
pnpm dev
# 在 DevTools Console 中测试：
const result = await window.dbApi.connect({
  id: 'test',
  name: 'Test',
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'xxx',
  database: 'mysql',
  createdAt: Date.now(),
  updatedAt: Date.now()
})
console.log(result)  // { success: true, connId: 'conn_xxx' }

const connId = result.connId
await window.dbApi.getDatabases(connId)
await window.dbApi.getTables(connId, 'mysql')
await window.dbApi.query(connId, 'SELECT 1')
```
