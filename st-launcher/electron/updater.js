const { app, shell } = require('electron');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// 这里填入你的 manifest.json 的远程地址
// 使用 ghproxy 加速 GitHub Raw 文件访问
const UPDATE_MANIFEST_URL = 'https://mirror.ghproxy.com/https://raw.githubusercontent.com/Wx-2025/AmilyLauncher/main/manifest.json';

// 简单的版本比较函数
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

async function checkForUpdates(mainWindow) {
  try {
    // 如果 URL 是默认值，跳过检查
    if (UPDATE_MANIFEST_URL.includes('example.com')) {
      console.log('未配置更新源，跳过更新检查');
      return;
    }

    console.log('正在检查更新...');
    const response = await axios.get(UPDATE_MANIFEST_URL, { timeout: 5000 });
    const data = response.data;

    if (!data || !data.launcher_update) return;

    const updateInfo = data.launcher_update;
    const currentVersion = app.getVersion();

    if (compareVersions(updateInfo.latest_version, currentVersion) > 0) {
      console.log(`发现新版本: ${updateInfo.latest_version}`);
      // 发送给前端
      mainWindow.webContents.send('update-available', {
        version: updateInfo.latest_version,
        changelog: updateInfo.changelog,
        force: updateInfo.force_update,
        downloadUrl: updateInfo.download_url
      });
    } else {
      console.log('当前已是最新版本');
    }
  } catch (error) {
    console.error('检查更新失败:', error.message);
  }
}

async function downloadAndInstall(downloadUrl, mainWindow) {
  try {
    const tempDir = app.getPath('temp');
    const fileName = `update-${Date.now()}.exe`;
    const filePath = path.join(tempDir, fileName);

    console.log(`开始下载更新: ${downloadUrl}`);
    
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const totalLength = parseInt(response.headers['content-length'], 10);
    let downloaded = 0;

    response.data.on('data', (chunk) => {
      downloaded += chunk.length;
      if (totalLength) {
        const progress = Math.round((downloaded / totalLength) * 100);
        mainWindow.webContents.send('update-progress', progress);
      }
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('下载完成，准备安装...');
    
    // 运行安装包并退出当前程序
    spawn(filePath, ['/S'], { // /S 是静默安装参数，视安装包制作工具而定
      detached: true,
      stdio: 'ignore'
    }).unref();

    app.quit();

  } catch (error) {
    console.error('更新失败:', error);
    mainWindow.webContents.send('update-error', error.message);
  }
}

module.exports = {
  checkForUpdates,
  downloadAndInstall
};
