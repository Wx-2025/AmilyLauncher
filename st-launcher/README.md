# SillyTavern Launcher

这是一个用于一键部署和启动 SillyTavern 的桌面应用程序。

## 功能特点

*   **一键环境部署**: 自动下载便携版 Node.js，不污染系统环境。
*   **一键安装 SillyTavern**: 自动从 GitHub 下载最新版本并安装依赖。
*   **内置终端**: 在软件界面内直接查看运行日志。

## 开发与运行

### 1. 安装依赖

在项目根目录下运行：

```bash
npm install
```

### 2. 启动开发模式

```bash
npm run dev
```

这将同时启动 Vite 前端服务和 Electron 主进程。

### 3. 打包发布

构建 Windows exe 安装包：

```bash
npm run build
```

打包后的文件将位于 `dist` 目录。

## 目录结构

*   `electron/`: 后端逻辑
    *   `installer.js`: 负责 Node.js 和 SillyTavern 的下载与安装
    *   `pty-manager.js`: 负责终端进程管理 (使用 child_process 模拟)
*   `src/`: 前端 React 代码
*   `data/`: (运行时生成) 存放下载的 Node.js 和 SillyTavern 实例

## 常见问题

**Q: 下载速度慢？**
A: 软件默认从 GitHub 和 Node.js 官网下载。如果网络不佳，可能需要配置代理或修改 `electron/installer.js` 中的下载链接。
