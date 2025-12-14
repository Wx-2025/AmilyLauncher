const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // 终端相关
  onTerminalData: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('terminal-incoming', subscription);
    return () => ipcRenderer.removeListener('terminal-incoming', subscription);
  },
  sendKeystroke: (key) => ipcRenderer.send('terminal-keystroke', key),
  
  // 系统操作相关
  install: (version) => ipcRenderer.invoke('install-sillytavern', version),
  start: () => ipcRenderer.invoke('start-sillytavern'),
  getVersions: () => ipcRenderer.invoke('get-versions'),
  getInstalledVersions: () => ipcRenderer.invoke('get-installed-versions'),
  switchVersion: (version) => ipcRenderer.invoke('switch-version', version),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  sendTestMessage: () => ipcRenderer.invoke('send-test-message'),
  sendCommand: (command, args) => ipcRenderer.invoke('send-command', command, args),
  
  // 状态监听
  onStatusChange: (callback) => {
    const subscription = (event, status) => callback(status);
    ipcRenderer.on('status-change', subscription);
    return () => ipcRenderer.removeListener('status-change', subscription);
  },
  onDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },
  
  // 更新相关
  onUpdateAvailable: (callback) => {
    const subscription = (event, info) => callback(info);
    ipcRenderer.on('update-available', subscription);
    return () => ipcRenderer.removeListener('update-available', subscription);
  },
  onUpdateProgress: (callback) => {
    const subscription = (event, progress) => callback(progress);
    ipcRenderer.on('update-progress', subscription);
    return () => ipcRenderer.removeListener('update-progress', subscription);
  },
  onUpdateError: (callback) => {
    const subscription = (event, error) => callback(error);
    ipcRenderer.on('update-error', subscription);
    return () => ipcRenderer.removeListener('update-error', subscription);
  },
  startUpdate: (downloadUrl) => ipcRenderer.invoke('send-command', 'startUpdate', { downloadUrl })
});
