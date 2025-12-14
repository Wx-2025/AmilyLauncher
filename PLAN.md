# SillyTavern 一键启动器 (SillyTavern Launcher) 技术方案

## 1. 项目概述
目标是开发一个 Windows 桌面应用程序 (.exe)，能够自动化管理 SillyTavern 的运行环境。
核心价值在于降低普通用户的使用门槛：无需手动安装 Node.js，无需懂 git 命令，无需配置环境变量。

## 2. 技术选型
*   **框架**: [Electron](https://www.electronjs.org/) (构建跨平台桌面应用)
*   **前端**: React 或 Vue (构建 UI 界面)
*   **终端组件**: [xterm.js](https://xtermjs.org/) (前端终端渲染) + [node-pty](https://github.com/microsoft/node-pty) (后端伪终端进程)
*   **打包工具**: electron-builder (生成 .exe 安装包)
*   **网络请求**: axios (下载文件、请求 GitHub API)
*   **解压工具**: adm-zip 或 7zip-bin (解压 Node.js 和 SillyTavern 压缩包)

## 3. 核心功能实现方案

### 3.1 一键部署 Node.js 环境 (Portable 模式)
为了不依赖用户系统是否安装了 Node.js，也不修改用户的系统环境变量，采用 **便携式 (Portable)** 策略。

*   **逻辑**:
    1.  检查软件内部数据目录（如 `app_data/runtime/node`）是否存在 Node.js。
    2.  如果不存在，从 Node.js 官网下载 Windows 版的 `.zip` 包 (例如 `node-v20.x.x-win-x64.zip`)。
    3.  解压到 `app_data/runtime/node`。
*   **调用方式**:
    在后续执行命令时，不直接使用全局的 `node` 命令，而是使用绝对路径：
    `path/to/app_data/runtime/node/node.exe`。
    或者在启动子进程时，临时修改 `process.env.PATH`，将便携版 Node 路径置于首位。

### 3.2 一键安装指定版本 SillyTavern
*   **获取版本**: 调用 GitHub API (`https://api.github.com/repos/SillyTavern/SillyTavern/releases`) 获取版本列表供用户选择。
*   **下载**: 下载对应版本的 `Source code (zip)` 或 Release 包。
*   **安装**:
    1.  解压到 `app_data/sillytavern` 目录。
    2.  **关键步骤**: 使用刚才下载的便携版 Node.js 执行 `npm install`。
        *   命令示例: `path/to/node.exe path/to/npm/cli.js install` (注意 npm 也是 Node 模块，或者直接调用 node 目录下的 npm.cmd，但在 Electron 中直接调 exe 更稳)。

### 3.3 终端封装 (Terminal Integration)
这是提升用户体验的关键。不要弹出一个黑框框 (CMD 窗口)，而是集成在 UI 里。

*   **后端 (Electron Main Process)**:
    使用 `node-pty` 创建一个伪终端进程。
    ```javascript
    const pty = require('node-pty');
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: sillyTavernPath, // 设置工作目录为 SillyTavern 目录
      env: customEnv // 注入包含便携版 Node 路径的环境变量
    });

    // 将终端输出发送给前端
    ptyProcess.onData((data) => {
      mainWindow.webContents.send('terminal-incoming', data);
    });

    // 接收前端输入写入终端
    ipcMain.on('terminal-keystroke', (event, key) => {
      ptyProcess.write(key);
    });
    ```

*   **前端 (Renderer Process)**:
    使用 `xterm.js` 渲染。
    ```javascript
    const term = new Terminal();
    term.open(document.getElementById('terminal'));
    
    // 接收后端数据
    window.electron.onTerminalData((data) => {
      term.write(data);
    });

    // 发送输入到后端
    term.onData((data) => {
      window.electron.sendKeystroke(data);
    });
    ```

### 3.4 一键启动
*   点击“启动”按钮后，后端通过 `node-pty` 执行启动命令（通常是 `node server.js` 或 `npm start`）。
*   由于使用了 `node-pty`，SillyTavern 的所有彩色日志输出都会原样显示在前端的 xterm 组件中。

## 4. 目录结构规划 (开发视角)

```text
my-launcher/
├── package.json
├── electron/
│   ├── main.js          # 主进程入口
│   ├── preload.js       # 预加载脚本 (安全通信)
│   └── pty-manager.js   # 终端进程管理模块
├── src/                 # 前端 UI (React/Vue)
│   ├── App.jsx
│   ├── components/
│   │   ├── Terminal.jsx # 终端组件
│   │   └── ControlPanel.jsx # 按钮控制面板
│   └── assets/
└── resources/           # 静态资源
```

## 5. 运行时数据目录结构 (用户视角)

软件运行后，会在用户数据目录（`AppData/Roaming/SillyTavernLauncher` 或软件同级目录）生成：

```text
data/
├── runtime/
│   └── node/            # 下载并解压的 Node.js 环境
├── instances/
│   └── sillytavern/     # SillyTavern 程序本体
└── config.json          # 启动器配置
```

## 6. 开发路线图
1.  **初始化项目**: 搭建 Electron + React/Vue 基础框架。
2.  **实现 Node.js 管理器**: 编写下载、解压 Node.js 的脚本。
3.  **集成 xterm.js**: 打通前后端终端数据流。
4.  **实现 SillyTavern 管理**: 下载代码、执行 `npm install`。
5.  **UI 美化**: 制作控制面板。
6.  **打包测试**: 使用 electron-builder 打包为 exe 并测试便携性。

## 7. 潜在难点与解决方案
*   **node-pty 在 Windows 下的编译**: `node-pty` 是原生模块，安装时需要编译环境（Python, C++ Build Tools）。
    *   *解决方案*: 在开发环境配置好编译工具。或者寻找预编译好的版本。打包时需注意原生模块的兼容性（electron-rebuild）。
*   **网络问题**: 国内下载 GitHub 或 Node 官网可能慢。
    *   *解决方案*: 允许用户在设置中配置镜像源（如 npm 淘宝镜像，Node.js 淘宝镜像，GitHub 代理加速）。
