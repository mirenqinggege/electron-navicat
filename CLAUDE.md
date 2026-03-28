# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 Electron 桌面应用程序，使用 Vue 3 + TypeScript + Vite 构建。

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm dev

# 构建应用（TypeScript 检查 + Vite 构建 + electron-builder 打包）
pnpm build

# 预览构建结果
pnpm preview
```

## 项目架构

```
electron-native/
├── electron/              # Electron 主进程
│   ├── main.ts           # 主进程入口，创建 BrowserWindow
│   └── preload.ts        # 预加载脚本，通过 contextBridge 暴露 IPC API
├── src/                   # Vue 渲染进程
│   ├── main.ts           # Vue 应用入口
│   ├── App.vue           # 根组件
│   └── components/       # Vue 组件目录
├── public/                # 静态资源
├── vite.config.ts         # Vite 配置，集成 vite-plugin-electron
├── electron-builder.json5 # Electron 打包配置（支持 Mac/Windows/Linux）
└── tsconfig.json          # TypeScript 配置
```

## 核心架构说明

### 主进程与渲染进程通信

项目使用 `contextBridge` 安全地暴露 IPC API：

- **主进程 (`electron/main.ts`)**: 创建窗口，处理应用生命周期
- **预加载脚本 (`electron/preload.ts`)**: 暴露 `ipcRenderer` 的 `on`、`off`、`send`、`invoke` 方法到渲染进程
- **渲染进程**: 通过 `window.ipcRenderer` 访问 IPC 功能

### 构建流程

`pnpm build` 执行顺序：
1. `vue-tsc` - TypeScript 类型检查
2. `vite build` - 构建 Vue 前端资源到 `dist/`
3. `electron-builder` - 打包 Electron 应用到 `release/`

### 开发模式

开发时 Vite 开发服务器启动后，Electron 会自动加载热重载的页面。主进程和预加载脚本的修改会触发 Electron 重启。

## IDE 配置

推荐 VS Code + Volar 插件（禁用 Vetur）。参见 `.vscode/extensions.json`。
