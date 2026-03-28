# Plan A: 渲染进程 (前端)

**执行者**: Agent A

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

### A1. 安装依赖
```bash
pnpm add ant-design-vue@4.x pinia vue-router@4 idb
pnpm add -D @types/node
```

### A2. 配置 Vue Router
- 创建 `src/router/index.ts`
- 配置路由：
  - `/` - 连接管理页
  - `/workspace/:connId` - 工作区（查询、数据、结构等）

### A3. 配置 Pinia
- 创建 `src/stores/index.ts`
- 创建 `src/stores/connections.ts` (连接状态)

### A4. 集成 Ant Design Vue
- 修改 `src/main.ts`，注册 Ant Design Vue
- 配置中文语言包

### A5. 创建 IndexedDB 服务
- 创建 `src/services/db.ts`
- 使用 `idb` 库封装 IndexedDB
- 实现 connections 表的 CRUD

### A6. 创建加密服务
- 创建 `src/services/crypto.ts`
- 使用 Web Crypto API 实现 AES-GCM 加密
- 密码加密/解密函数

### A7. 创建 IPC 服务
- 创建 `src/services/ipc.ts`
- 封装 `window.ipcRenderer.invoke` 调用

### A8. 创建连接管理页面
- 创建 `src/views/Connection/List.vue` - 连接列表
- 创建 `src/views/Connection/Form.vue` - 新建/编辑连接表单
- 使用 Ant Design Vue 组件

### A9. 更新 App.vue
- 添加 `<router-view />`
- 配置基础布局

---

## 输出文件清单

```
src/
├── main.ts              # 修改：注册插件
├── App.vue              # 修改：路由视图
├── router/
│   └── index.ts         # 新建
├── stores/
│   ├── index.ts         # 新建
│   └── connections.ts   # 新建
├── services/
│   ├── db.ts            # 新建：IndexedDB
│   ├── crypto.ts        # 新建：加密
│   └── ipc.ts           # 新建：IPC 封装
├── views/
│   └── Connection/
│       ├── List.vue     # 新建
│       └── Form.vue     # 新建
└── types/
    └── index.ts         # 新建：类型定义
```

---

## 验证方式

```bash
pnpm dev
# 访问 http://localhost:5173
# 能看到连接管理页面
# 能新建、保存、删除连接配置（本地存储）
```
