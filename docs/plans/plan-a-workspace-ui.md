# Plan A: 渲染进程 (前端 UI)

**执行者**: Agent A

## 任务列表

### A1. 创建工作区页面
- 创建 `src/views/Workspace/index.vue` - 工作区主页面
- 左侧：数据库结构树
- 右侧：多标签页（SQL 查询、数据浏览）
- 修改路由指向新页面

### A2. 实现数据库结构树组件
- 创建 `src/components/SchemaTree/index.vue`
- 树形结构展示：数据库 → 表 → 字段
- 点击表名加载字段列表
- 支持搜索过滤

### A3. 安装并配置 SQL 编辑器
```bash
pnpm add @codemirror/lang-sql @codemirror/theme-one-dark codemirror
```
或使用 Monaco Editor：
```bash
pnpm add monaco-editor
```

### A4. 创建 SQL 编辑器组件
- 创建 `src/components/SqlEditor/index.vue`
- 功能：语法高亮、行号、执行按钮
- 显示查询结果表格

### A5. 创建数据表格组件
- 创建 `src/components/DataGrid/index.vue`
- 功能：分页、排序、可编辑单元格
- 支持新增/删除行

### A6. 更新 IPC 服务
- 修改 `src/services/ipc.ts`，添加新的调用方法
- 确保类型定义正确

### A7. 更新 Pinia Store
- 创建 `src/stores/workspace.ts`
- 管理当前连接、当前数据库、SQL 历史等状态

---

## 输出文件清单

```
src/
├── views/
│   └── Workspace/
│       └── index.vue         # 新建：工作区页面
├── components/
│   ├── SchemaTree/
│   │   └── index.vue         # 新建：结构树
│   ├── SqlEditor/
│   │   └── index.vue         # 新建：SQL 编辑器
│   └── DataGrid/
│       └── index.vue         # 新建：数据表格
├── stores/
│   └── workspace.ts          # 新建：工作区状态
├── services/
│   └── ipc.ts                # 修改：添加新方法
└── router/
    └── index.ts              # 修改：更新路由
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
# 1. 点击连接进入工作区
# 2. 左侧显示数据库结构树
# 3. 点击表名显示字段列表
# 4. 输入 SQL 并执行，显示结果
```
