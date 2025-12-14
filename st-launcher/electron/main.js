const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const WebSocket = require('ws');

// 保持对 window 对象的全局引用，避免被垃圾回收
let mainWindow;
let wss;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // 安全性考虑，禁用 nodeIntegration
      contextIsolation: true, // 启用上下文隔离
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true, // 隐藏默认菜单栏
    icon: path.join(app.getAppPath(), 'dist/icon.ico')
  });
  
  // 移除默认菜单
  mainWindow.setMenu(null);

  // 开发环境下加载 Vite 开发服务器，生产环境下加载打包后的文件
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 集成 pty-manager
const ptyManager = require('./pty-manager');
// 集成 installer
const installer = require('./installer');
// 集成 updater
const updater = require('./updater');

app.whenReady().then(() => {
  createWindow();
  
  // 确保在窗口创建后初始化 ptyManager
  if (mainWindow) {
    ptyManager.init(ipcMain, mainWindow);
    // 检查更新
    setTimeout(() => updater.checkForUpdates(mainWindow), 3000); // 延迟3秒检查
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      // 重新初始化 ptyManager
      if (mainWindow) {
        ptyManager.init(ipcMain, mainWindow);
      }
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  ptyManager.kill();
  if (wss) wss.close();
});

// 启动 WebSocket 服务器用于插件联动
function startWebSocketServer() {
  try {
    wss = new WebSocket.Server({ port: 2086 });
    console.log('WebSocket server started on port 2086');
    
    wss.on('connection', (ws) => {
      console.log('Plugin connected');
      ws.on('message', (message) => {
        console.log('Received:', message);
      });
    });
  } catch (e) {
    console.error('Failed to start WebSocket server:', e);
  }
}

startWebSocketServer();

ipcMain.handle('install-sillytavern', async (event, version) => {
  // 传递版本号给安装器
  await installer.installSillyTavern(ptyManager, version);
  return true;
});

ipcMain.handle('start-sillytavern', async () => {
  installer.startSillyTavern(ptyManager);
  return true;
});

ipcMain.handle('get-versions', async () => {
  return await installer.getVersions();
});

ipcMain.handle('get-installed-versions', async () => {
  return await installer.getInstalledVersions();
});

ipcMain.handle('switch-version', async (event, version) => {
  await installer.switchVersion(version);
  return true;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('send-test-message', async () => {
  if (!wss) return false;
  
  const command = {
    type: 'command',
    command: 'triggerSlash',
    args: { content: '/echo [启动器] 联动测试成功！' }
  };
  
  const data = JSON.stringify(command);
  let sent = false;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      sent = true;
    }
  });
  
  return sent;
});

ipcMain.handle('send-command', async (event, commandName, args = {}) => {
  if (commandName === 'openDir') {
    return await installer.openDirectory(args.type);
  }
  if (commandName === 'createBackup') {
    return await installer.createBackup();
  }
  if (commandName === 'clearCache') {
    return await installer.clearCache();
  }
  if (commandName === 'openUrl') {
    const { shell } = require('electron');
    await shell.openExternal(args.url);
    return true;
  }
  if (commandName === 'startUpdate') {
    const { downloadUrl } = args;
    updater.downloadAndInstall(downloadUrl, mainWindow);
    return true;
  }

  if (!wss) return false;
  
  const command = {
    type: 'command',
    command: commandName,
    args: args
  };
  
  const data = JSON.stringify(command);
  let sent = false;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      sent = true;
    }
  });
  
  return sent;
});
