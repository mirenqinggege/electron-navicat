# Plan B: 主进程 (后端)

**执行者**: Agent B

## 共享接口约定

### IPC 通道定义

```typescript
// 连接管理
'connection:test'       // 测试连接
'connection:save'       // 保存连接配置
'connection:list'       // 获取连接列表
'connection:delete'     // 删除连接

// 数据库操作
'db:connect'            // 建立连接
'db:disconnect'         // 断开连接
'db:query'              // 执行查询
'db:getDatabases'       // 获取数据库列表
'db:getTables'          // 获取表列表
'db:getColumns'         // 获取字段列表
```

### 数据结构定义

```typescript
// 连接配置
interface ConnectionConfig {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'sqlite';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  options?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// 查询结果
interface QueryResult {
  rows: Record<string, any>[];
  fields: { name: string; type: string }[];
  affectedRows?: number;
  insertId?: number;
}

// 连接状态
interface ConnectionStatus {
  id: string;
  connected: boolean;
  error?: string;
}
```

---

## 任务列表

### B1. 创建插件系统核心接口
- 创建 `electron/plugins/core/interface.ts`
- 定义 `DatabasePlugin` 接口
- 定义相关类型：`TableInfo`, `ColumnInfo`, `IndexInfo` 等

### B2. 创建插件加载器
- 创建 `electron/plugins/core/loader.ts`
- 实现插件发现和加载逻辑
- 创建 `electron/plugins/core/registry.ts` - 插件注册表

### B3. 创建 MySQL 插件骨架
- 创建 `electron/plugins/mysql/index.ts`
- 实现基础接口（先返回 mock 数据）
- 安装 `mysql2` 依赖

### B4. 创建连接管理模块
- 创建 `electron/connection/manager.ts`
- 管理活动连接的生命周期
- 连接 ID 生成、存储、销毁

### B5. 创建 IPC 处理模块
- 创建 `electron/ipc/connection.ts` - 连接相关
- 创建 `electron/ipc/database.ts` - 数据库操作相关
- 注册 `ipcMain.handle` 处理器

### B6. 更新主进程入口
- 修改 `electron/main.ts`
- 初始化插件系统
- 注册 IPC 处理器

### B7. 更新预加载脚本
- 修改 `electron/preload.ts`
- 暴露类型安全的 API

---

## 输出文件清单

```
electron/
├── main.ts              # 修改：初始化插件和IPC
├── preload.ts           # 修改：暴露API
├── plugins/
│   ├── core/
│   │   ├── interface.ts # 新建：插件接口
│   │   ├── loader.ts    # 新建：加载器
│   │   └── registry.ts  # 新建：注册表
│   └── mysql/
│       └── index.ts     # 新建：MySQL插件
├── connection/
│   └── manager.ts       # 新建：连接管理
└── ipc/
    ├── connection.ts    # 新建
    └── database.ts      # 新建
```

---

## 验证方式

```bash
pnpm dev
# 在 DevTools Console 中测试：
await window.dbApi.testConnection({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'xxx'
})
# 应返回 { success: true } 或错误信息
```
