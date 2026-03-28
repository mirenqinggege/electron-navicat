# Electron Navicat

一个基于 **Electron + Vue 3 + TypeScript + Vite** 构建的现代桌面应用程序。

## ✨ 主要特性

- 🎯 **现代技术栈**: Vue 3 Composition API + TypeScript + Vite 5
- ⚡ **极速开发**: Vite 热模块替换 (HMR)，毫秒级重载
- 🔒 **安全通信**: Electron contextBridge 隔离主进程与渲染进程
- 📦 **开箱即用**: 预配置 electron-builder，支持跨平台打包

## 🚀 快速开始

### 系统要求

- Node.js 16+
- pnpm 8+ (建议使用 pnpm)

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动 Vite 开发服务器和 Electron 应用，支持代码热重载。

### 构建与打包

```bash
pnpm build
```

执行序列：
1. TypeScript 类型检查
2. Vite 构建渲染进程资源
3. Electron Builder 打包应用

### 预览构建

```bash
pnpm preview
```

## 📁 项目结构

```
electron-navicat/
├── electron/                # Electron 主进程
│   ├── main.ts             # 主进程入口，窗口管理
│   ├── preload.ts          # 预加载脚本，IPC 网桥
│   └── electron-env.d.ts   # 类型声明
├── src/                     # Vue 渲染进程
│   ├── main.ts             # Vue 应用入口
│   ├── App.vue             # 根组件
│   ├── components/         # Vue 组件库
│   ├── style.css           # 全局样式
│   └── vite-env.d.ts       # Vite 类型声明
├── public/                  # 静态资源
├── dist/                    # Vite 构建输出
├── dist-electron/           # Electron 主进程构建输出
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # 渲染进程 TS 配置
├── tsconfig.node.json       # 主进程 TS 配置
└── electron-builder.json5   # 应用打包配置
```

## 🛠️ 开发指南

### 代码风格

- ✅ **TypeScript Strict 模式**: 完整类型检查，禁用 `as any`
- ✅ **ESM 导入**: 所有代码遵循 ES modules 规范
- ✅ **Vue 3 `<script setup>`**: 组件使用 Composition API
- ✅ **命名规范**:
  - 文件: PascalCase (.vue) / camelCase (.ts)
  - 变量/函数: camelCase
  - 常量: UPPER_SNAKE_CASE
  - CSS 类: kebab-case

### IPC 通信

通过 `contextBridge` 在预加载脚本中暴露安全的 IPC API：

```typescript
// preload.ts - 暴露 IPC 方法
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
})

// 渲染进程 - 使用 IPC
window.ipcRenderer.send('channel-name', data)
```

### 错误处理

```typescript
// ✅ 推荐
try {
  await doSomething()
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}

// ❌ 禁止空 catch 块
```

### 类型检查

```bash
# 仅运行类型检查，不构建
pnpm exec vue-tsc --noEmit
```

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（Vite + Electron） |
| `pnpm build` | 类型检查 → 构建 → 打包 |
| `pnpm preview` | 预览构建结果 |
| `pnpm exec vue-tsc --noEmit` | 仅类型检查 |

## 🔧 IDE 推荐

- **VS Code** + **Volar** 扩展
- 禁用 Vetur (如已安装)
- 参见 `.vscode/extensions.json` 推荐扩展列表

## 📦 依赖版本

- Vue: 3.x
- Vite: 5.x
- Electron: 30.x
- TypeScript: 5.x

## 📝 许可证

MIT
