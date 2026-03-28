# AGENTS.md

本文件为在此仓库工作的 AI 编码代理提供项目上下文和编码规范。

## 项目概述

这是一个 **Electron + Vue 3 + TypeScript + Vite** 桌面应用项目。
- **框架**: Vue 3 (Composition API, `<script setup>`)
- **构建工具**: Vite 5.x
- **桌面框架**: Electron 30.x
- **包管理器**: pnpm
- **类型检查**: vue-tsc (TypeScript strict mode)

## 目录结构

```
electron-native/
├── electron/           # Electron 主进程代码
│   ├── main.ts        # 主进程入口
│   ├── preload.ts     # 预加载脚本 (contextBridge)
│   └── electron-env.d.ts  # Electron 类型声明
├── src/               # Vue 渲染进程代码
│   ├── main.ts        # Vue 应用入口
│   ├── App.vue        # 根组件
│   ├── components/    # Vue 组件
│   ├── style.css      # 全局样式
│   └── vite-env.d.ts  # Vite 类型声明
├── public/            # 静态资源
├── dist/              # 构建输出 (渲染进程)
├── dist-electron/     # 构建输出 (主进程)
├── vite.config.ts     # Vite 配置
├── tsconfig.json      # TypeScript 配置 (渲染进程)
├── tsconfig.node.json # TypeScript 配置 (Node.js)
└── electron-builder.json5  # Electron 打包配置
```

## 构建命令

```bash
# 开发模式 (热重载)
pnpm dev

# 类型检查 + 构建 + 打包
pnpm build

# 预览构建结果
pnpm preview

# 仅类型检查 (推荐在提交前运行)
pnpm exec vue-tsc --noEmit
```

### 运行单个测试

当前项目未配置测试框架。如需添加测试，推荐使用 Vitest：

```bash
# 安装 Vitest
pnpm add -D vitest @vue/test-utils

# 运行所有测试
pnpm exec vitest

# 运行单个测试文件
pnpm exec vitest path/to/test.spec.ts

# 运行匹配名称的测试
pnpm exec vitest -t "测试名称"
```

## 代码风格规范

### TypeScript 配置

项目使用严格 TypeScript 配置：
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`
- `target: ES2020`, `module: ESNext`

**禁止使用**: `as any`, `@ts-ignore`, `@ts-expect-error`

### 导入规范

**使用 ESM 导入** (项目为 `"type": "module"`):

```typescript
// ✅ 正确 - ESM 导入
import { createApp } from 'vue'
import { app, BrowserWindow } from 'electron'

// ✅ 正确 - Node.js 内置模块使用 node: 前缀
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

// ❌ 错误 - CommonJS 风格
const path = require('path')
```

### Vue 组件规范

**使用 Composition API + `<script setup lang="ts">`**:

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Props 使用泛型定义
defineProps<{ msg: string }>()

// 响应式状态
const count = ref(0)
</script>

<template>
  <div>{{ msg }}</div>
</template>

<style scoped>
/* 组件作用域样式 */
</style>
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 (组件) | PascalCase.vue | `HelloWorld.vue` |
| 文件名 (TS) | camelCase.ts | `main.ts`, `preload.ts` |
| 变量/函数 | camelCase | `createWindow`, `win` |
| 常量 | UPPER_SNAKE_CASE 或 camelCase | `VITE_DEV_SERVER_URL` |
| 类型/接口 | PascalCase | `BrowserWindow`, `ProcessEnv` |
| CSS 类 | kebab-case | `.read-the-docs` |

### 错误处理

```typescript
// ✅ 推荐 - 明确的错误类型和处理
try {
  await someAsyncOperation()
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  }
  throw error
}

// ❌ 禁止 - 空 catch 块
try {
  doSomething()
} catch (e) {} // 绝对禁止
```

### Electron IPC 通信

使用 `contextBridge` 暴露安全的 IPC API：

```typescript
// preload.ts
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
})
```

### 环境变量

```typescript
// 使用 process.env['VAR_NAME'] 避免 vite:define 替换
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// 已定义的环境变量类型 (见 electron/electron-env.d.ts)
process.env.APP_ROOT
process.env.VITE_PUBLIC
```

## 关键文件说明

| 文件 | 用途 |
|------|------|
| `vite.config.ts` | Vite + Electron 插件配置，定义主进程和预加载入口 |
| `tsconfig.json` | 渲染进程 TypeScript 配置 |
| `tsconfig.node.json` | Node.js/主进程 TypeScript 配置 |
| `electron-builder.json5` | Electron 打包配置 (appId, 产物格式) |

## IDE 推荐

- VS Code + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 扩展
- 禁用 Vetur (如果已安装)
- 可选: TypeScript Vue Plugin (Volar) 或 Take Over Mode

## 注意事项

1. **不要删除 `dist` 和 `dist-electron` 目录** - 构建输出
2. **修改 Electron 配置时** - 同步更新 `electron-builder.json5`
3. **添加新 IPC channel 时** - 在 `preload.ts` 中暴露并在 `electron-env.d.ts` 中声明类型
4. **异步操作** - 优先使用 `async/await` 而非 `.then()` 链式调用
