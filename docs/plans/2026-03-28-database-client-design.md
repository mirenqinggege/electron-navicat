# 数据库管理客户端设计文档

## 项目概述

一个类似 Navicat 的数据库管理桌面应用，基于 Electron + Vue 3 + TypeScript 构建。

## 核心功能

1. **开发调试** — SQL 编辑、表结构管理、数据可视化编辑
2. **DBA 运维** — 性能监控、备份恢复、权限管理
3. **对比同步** — 同构数据库间结构/数据对比与同步

## 支持的数据库

- MySQL / MariaDB（MVP 首发）
- PostgreSQL
- SQLite
- SQL Server
- Oracle

## 技术栈

- **前端**: Vue 3 + Ant Design Vue + Pinia + Vue Router
- **桌面框架**: Electron
- **语言**: TypeScript
- **构建**: Vite
- **存储**: IndexedDB + Web Crypto API
- **数据库驱动**: mysql2、pg、better-sqlite3 等

---

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Shell                       │
├─────────────────────────────────────────────────────────┤
│  渲染进程 (Vue 3 + Ant Design Vue)                      │
│  ┌─────────┬─────────┬─────────┬─────────┬──────────┐  │
│  │ 连接管理 │ SQL编辑器 │ 数据浏览 │ 结构对比 │ 监控面板 │  │
│  └─────────┴─────────┴─────────┴─────────┴──────────┘  │
├─────────────────────────────────────────────────────────┤
│  插件系统 (Plugin Host)                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  mysql-plugin  │  pg-plugin  │  sqlite-plugin ...│  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  主进程 (Node.js)                                       │
│  ┌────────────┬────────────┬────────────┐              │
│  │ 连接池管理  │ 插件加载    │ IPC 桥接   │              │
│  └────────────┴────────────┴────────────┘              │
└─────────────────────────────────────────────────────────┘
```

**核心思想**：
- 渲染进程负责 UI，使用 IndexedDB 存储配置
- 主进程管理连接池，通过插件支持多数据库
- 插件实现统一接口，通过 IPC 暴露能力

---

## 插件系统

### 插件接口定义

```typescript
interface DatabasePlugin {
  // 插件元信息
  name: string;           // 'mysql' | 'postgresql' | 'sqlite' ...
  displayName: string;    // 'MySQL / MariaDB'
  version: string;

  // 连接管理
  createConnection(config: ConnectionConfig): Promise<Connection>;
  testConnection(config: ConnectionConfig): Promise<boolean>;

  // 结构操作
  getDatabases(conn: Connection): Promise<string[]>;
  getTables(conn: Connection, db: string): Promise<TableInfo[]>;
  getColumns(conn: Connection, table: string): Promise<ColumnInfo[]>;
  getIndexes(conn: Connection, table: string): Promise<IndexInfo[]>;

  // 数据操作
  query(conn: Connection, sql: string): Promise<QueryResult>;
  insert(conn: Connection, table: string, data: object[]): Promise<void>;
  update(conn: Connection, table: string, data: object, where: object): Promise<void>;
  delete(conn: Connection, table: string, where: object): Promise<void>;

  // 对比同步
  getSchemaDefinition(conn: Connection, db: string): Promise<SchemaDef>;
  generateDiff(source: SchemaDef, target: SchemaDef): Promise<SchemaDiff>;
  applyDiff(conn: Connection, diff: SchemaDiff): Promise<void>;

  // 监控
  getStatus(conn: Connection): Promise<DBStatus>;
  getSlowQueries(conn: Connection): Promise<SlowQuery[]>;
}
```

### 插件目录结构

```
plugins/
├── core/                    # 插件基础接口和加载器
│   ├── interface.ts
│   └── loader.ts
├── mysql/                   # MySQL 插件
│   ├── index.ts
│   └── package.json         # 依赖 mysql2
├── postgresql/              # PostgreSQL 插件
│   ├── index.ts
│   └── package.json         # 依赖 pg
└── sqlite/                  # SQLite 插件
    ├── index.ts
    └── package.json         # 依赖 better-sqlite3
```

---

## 渲染进程模块

### 目录结构

```
src/
├── main.ts                    # Vue 应用入口
├── App.vue                    # 根组件
├── assets/                    # 静态资源
├── components/                # 通用组件
│   ├── SqlEditor/             # SQL 编辑器组件
│   ├── DataGrid/              # 数据表格组件（可编辑）
│   ├── SchemaTree/            # 数据库结构树
│   └── DiffViewer/            # 差异对比视图
├── views/                     # 页面视图
│   ├── Connection/            # 连接管理页
│   ├── Query/                 # SQL 查询页
│   ├── Data/                  # 数据浏览编辑页
│   ├── Structure/             # 结构管理页
│   ├── Compare/               # 对比同步页
│   ├── Monitor/               # 监控页
│   └── Settings/              # 设置页
├── stores/                    # Pinia 状态管理
│   ├── connection.ts          # 连接状态
│   ├── database.ts            # 当前数据库状态
│   └── settings.ts            # 应用设置
├── services/                  # 服务层
│   ├── db.ts                  # IndexedDB 封装
│   ├── crypto.ts              # 加密工具
│   └── ipc.ts                 # IPC 封装
└── utils/                     # 工具函数
```

### 核心页面交互流程

1. **连接管理** → 选择/新建连接 → 验证通过 → 进入工作区
2. **工作区** → 左侧结构树 + 右侧多标签页（查询、数据、结构、监控）
3. **对比同步** → 选择源库和目标库 → 分析差异 → 选择性同步

---

## 主进程模块

### 目录结构

```
electron/
├── main.ts                    # 主进程入口
├── preload.ts                 # 预加载脚本（IPC 暴露）
├── connection/                # 连接管理
│   ├── pool.ts                # 连接池
│   └── manager.ts             # 连接生命周期管理
├── plugin/                    # 插件系统
│   ├── loader.ts              # 插件加载器
│   └── registry.ts            # 插件注册表
└── ipc/                       # IPC 处理
    ├── connection.ts          # 连接相关 IPC
    ├── query.ts               # 查询相关 IPC
    ├── compare.ts             # 对比同步 IPC
    └── monitor.ts             # 监控相关 IPC
```

### IPC 通信模式

```typescript
// 渲染进程调用
await window.ipcRenderer.invoke('db:query', { connId, sql });

// 主进程处理
ipcMain.handle('db:query', async (event, { connId, sql }) => {
  const conn = connectionManager.get(connId);
  const plugin = pluginRegistry.get(conn.type);
  return await plugin.query(conn, sql);
});
```

---

## 数据存储

### IndexedDB 结构

```typescript
// 数据库名: dbclient
const DB_SCHEMA = {
  connections: {               // 连接配置表
    keyPath: 'id',
    indexes: ['name', 'type', 'createdAt']
  },
  queryHistory: {              // 查询历史
    keyPath: 'id',
    indexes: ['connId', 'timestamp']
  },
  settings: {                  // 应用设置
    keyPath: 'key'
  }
};

// 连接配置结构
interface ConnectionConfig {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'sqlite';
  host: string;
  port: number;
  username: string;
  password: string;            // 加密存储
  database: string;
  options?: object;
  createdAt: number;
  updatedAt: number;
}
```

### 加密方案

- 使用 Web Crypto API（AES-GCM）
- 密码使用用户设置的本地密码派生密钥加密
- 或使用 `crypto.subtle.generateKey()` 生成随机密钥，存储在 `localStorage`

---

## 数据对比与同步

### 对比流程

```
┌─────────────┐     ┌─────────────┐
│   源数据库   │     │   目标数据库  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ 导出 Schema │     │ 导出 Schema │
└──────┬──────┘     └──────┬──────┘
       │                   │
       └─────────┬─────────┘
                 ▼
         ┌───────────────┐
         │   Diff Engine  │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │  差异报告展示   │
         │  表/列/索引差异 │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ 用户选择同步项  │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ 生成并执行 SQL  │
         └───────────────┘
```

### 结构对比粒度

```typescript
interface SchemaDiff {
  tables: {
    added: TableInfo[];        // 目标库缺少的表
    removed: TableInfo[];      // 目标库多余的表
    modified: {
      table: TableInfo;
      columns: {
        added: ColumnInfo[];
        removed: ColumnInfo[];
        modified: ColumnInfo[];  // 类型、长度、默认值变化
      };
      indexes: {
        added: IndexInfo[];
        removed: IndexInfo[];
      };
    }[];
  };
}
```

### 数据对比策略

| 场景 | 策略 | 说明 |
|------|------|------|
| 小表（<1万行） | 全量对比 | 内存中对比所有行 |
| 大表（≥1万行） | 增量同步 | 基于主键分批对比 |
| 有时间戳字段 | 时间戳增量 | 对比 last_modified 时间 |

### 同步方式

- **单向同步**：源 → 目标（目标会被修改）
- **双向合并**：合并两边变更（需要冲突解决策略）

---

## MVP 开发计划

### 阶段一：基础框架（预计 2 周）

| 模块 | 内容 |
|------|------|
| 项目初始化 | 集成 Ant Design Vue、Pinia、Vue Router |
| 插件系统 | 核心接口 + 加载器 |
| IndexedDB | 连接配置存储 + 加密 |
| 连接管理 | 新建/编辑/删除/测试连接 |
| IPC 桥接 | 主进程与渲染进程通信 |

### 阶段二：MySQL 插件 + 核心功能（预计 3 周）

| 模块 | 内容 |
|------|------|
| MySQL 插件 | 连接、查询、结构获取 |
| SQL 编辑器 | 语法高亮 + 自动补全 |
| 数据浏览 | 表格展示 + 分页 |
| 数据编辑 | 表格内增删改 |
| 结构树 | 数据库/表/字段导航 |

### 阶段三：DBA 功能（预计 2 周）

| 模块 | 内容 |
|------|------|
| 性能监控 | 连接数、QPS、慢查询 |
| 备份恢复 | SQL 导出/导入 |
| 用户权限 | 用户列表、权限查看 |

### 阶段四：对比同步（预计 2 周）

| 模块 | 内容 |
|------|------|
| 结构对比 | 表/列/索引差异分析 |
| 数据对比 | 全量 + 增量对比 |
| 同步执行 | 差异应用、SQL 预览 |

### 阶段五：扩展（后续迭代）

| 模块 | 内容 |
|------|------|
| PostgreSQL 插件 | 支持 PostgreSQL |
| SQLite 插件 | 支持 SQLite |
| 云同步 | 可选功能 |
