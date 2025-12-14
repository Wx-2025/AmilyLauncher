const os = require('os');
const { spawn } = require('child_process');

let ptyProcess = null;
let _mainWindow = null;

function init(ipcMain, mainWindow) {
  _mainWindow = mainWindow;
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

  ipcMain.on('terminal-keystroke', (event, key) => {
    if (ptyProcess && ptyProcess.stdin) {
      try {
        ptyProcess.stdin.write(key);
      } catch (e) {
        // ignore
      }
    }
  });

  // 创建初始终端会话
  createPty(shell, [], process.cwd());
}

function createPty(shell, args, cwd, env = process.env) {
  if (ptyProcess) {
    try {
      ptyProcess.kill();
    } catch (e) {
      console.error('Failed to kill process:', e);
    }
  }

  // 尝试强制开启颜色输出
  const customEnv = { ...env, FORCE_COLOR: '1', TERM: 'xterm-256color' };

  ptyProcess = spawn(shell, args, {
    cwd: cwd,
    env: customEnv,
    shell: true // 使用 shell 模式以支持命令解析
  });

  // 处理 stdout
  ptyProcess.stdout.on('data', (data) => {
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      // 将 Buffer 转为字符串，并处理换行符以适应 xterm.js
      const output = data.toString().replace(/\n/g, '\r\n');
      _mainWindow.webContents.send('terminal-incoming', output);
    }
  });

  // 处理 stderr
  ptyProcess.stderr.on('data', (data) => {
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      const output = data.toString().replace(/\n/g, '\r\n');
      _mainWindow.webContents.send('terminal-incoming', output);
    }
  });

  ptyProcess.on('close', (code) => {
    if (_mainWindow && !_mainWindow.isDestroyed()) {
      _mainWindow.webContents.send('terminal-incoming', `\r\nProcess exited with code ${code}\r\n`);
    }
  });
}

function write(data) {
  if (_mainWindow && !_mainWindow.isDestroyed()) {
    // 直接发送到前端显示，模拟回显
    _mainWindow.webContents.send('terminal-incoming', data.replace(/\n/g, '\r\n'));
  }
}

function send(channel, ...args) {
  if (_mainWindow && !_mainWindow.isDestroyed()) {
    _mainWindow.webContents.send(channel, ...args);
  }
}

function kill() {
  if (ptyProcess) {
    try {
      // 在 Windows 上，kill 可能只能杀掉 shell 进程，子进程（如 node）可能残留
      // 可以尝试使用 taskkill 或 tree-kill 库，但为了简单，先尝试 pty.kill
      ptyProcess.kill();
      ptyProcess = null;
    } catch (e) {
      console.error('Failed to kill pty process:', e);
    }
  }
}

module.exports = {
  init,
  createPty,
  write,
  send,
  kill
};
