const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { app, shell } = require('electron');

// 定义数据目录
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const RUNTIME_DIR = path.join(DATA_DIR, 'runtime');
const NODE_DIR = path.join(RUNTIME_DIR, 'node');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');
const USER_DATA_DIR = path.join(DATA_DIR, 'user_data');
const CURRENT_VERSION_FILE = path.join(DATA_DIR, 'current_version.json');
// 旧版路径兼容
const SILLY_TAVERN_DIR = path.join(DATA_DIR, 'instances', 'sillytavern');

// 需要共享的用户数据目录列表
// 只保留 data 目录和配置文件，避免与 SillyTavern 内置迁移逻辑冲突
const SHARED_DIRS = [
  'data', 
  'config.yaml'
];

// Node.js 下载链接 (使用淘宝镜像)
const NODE_URL = 'https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip';

async function ensureNode(ptyManager) {
  if (fs.existsSync(path.join(NODE_DIR, 'node.exe'))) {
    return path.join(NODE_DIR, 'node.exe');
  }

  ptyManager.write('正在下载 Node.js...\r\n');
  await fs.ensureDir(RUNTIME_DIR);
  
  const zipPath = path.join(RUNTIME_DIR, 'node.zip');
  
  // 下载
  const writer = fs.createWriteStream(zipPath);
  const response = await axios({
    url: NODE_URL,
    method: 'GET',
    responseType: 'stream'
  });

  const totalLength = response.headers['content-length'];
  let downloadedLength = 0;

  response.data.on('data', (chunk) => {
    downloadedLength += chunk.length;
    if (totalLength) {
      const progress = Math.round((downloadedLength / totalLength) * 100);
      ptyManager.send('download-progress', { type: 'node', progress });
    }
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  ptyManager.write('正在解压 Node.js...\r\n');
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(RUNTIME_DIR, true);
  
  // 重命名解压后的文件夹为 'node'
  const extractedName = 'node-v20.10.0-win-x64';
  await fs.rename(path.join(RUNTIME_DIR, extractedName), NODE_DIR);
  
  // 清理 zip
  await fs.remove(zipPath);
  
  return path.join(NODE_DIR, 'node.exe');
}

// SillyTavern Release API
const ST_RELEASES_API = 'https://api.github.com/repos/SillyTavern/SillyTavern/releases';

async function getVersions() {
  try {
    const response = await axios.get(ST_RELEASES_API);
    return response.data.map(release => ({
      tag: release.tag_name,
      name: release.name,
      zipUrl: release.zipball_url
    }));
  } catch (error) {
    console.error('Failed to fetch versions:', error);
    return [];
  }
}

async function ensureUserData() {
  await fs.ensureDir(USER_DATA_DIR);
  // 确保所有子目录存在
  for (const dir of SHARED_DIRS) {
    if (dir.endsWith('.yaml')) continue; // 文件跳过
    await fs.ensureDir(path.join(USER_DATA_DIR, dir));
  }
}

async function linkUserData(versionDir, ptyManager) {
  ptyManager.write('正在链接用户数据...\r\n');
  await ensureUserData();

  // 自动迁移旧版数据结构 (public -> data/default-user)
  const oldPublicDir = path.join(USER_DATA_DIR, 'public');
  const newDataDir = path.join(USER_DATA_DIR, 'data', 'default-user');
  
  if (fs.existsSync(oldPublicDir)) {
    ptyManager.write('检测到旧版数据结构，正在迁移到新版格式...\r\n');
    await fs.ensureDir(newDataDir);
    
    const dirsToMove = ['characters', 'chats', 'groups', 'worlds', 'backgrounds', 'user', 'context', 'instruct', 'themes', 'extensions'];
    
    for (const dir of dirsToMove) {
      const src = path.join(oldPublicDir, dir);
      const dest = path.join(newDataDir, dir);
      if (fs.existsSync(src)) {
        try {
          if (!fs.existsSync(dest)) {
            await fs.move(src, dest);
          } else {
            await fs.copy(src, dest, { overwrite: false });
          }
        } catch (e) {
          ptyManager.write(`迁移 ${dir} 失败: ${e.message}\r\n`);
        }
      }
    }
  }

  for (const item of SHARED_DIRS) {
    const source = path.join(USER_DATA_DIR, item);
    const target = path.join(versionDir, item);

    if (fs.existsSync(target)) {
      const stat = await fs.lstat(target);
      if (stat.isSymbolicLink()) {
        continue;
      } else {
        await fs.remove(target);
      }
    }

    await fs.ensureDir(path.dirname(target));

    try {
      if (item.endsWith('.yaml')) {
        if (!fs.existsSync(source)) {
           continue; 
        }
        await fs.copy(source, target);
      } else {
        await fs.symlink(source, target, 'junction');
      }
    } catch (e) {
      ptyManager.write(`链接 ${item} 失败: ${e.message}\r\n`);
    }
  }
}

async function installSillyTavern(ptyManager, versionTag) {
  try {
    // 1. 确保 Node.js 环境
    ptyManager.write('正在检查 Node.js 环境...\r\n');
    const nodePath = await ensureNode(ptyManager);
    ptyManager.write('Node.js 环境就绪。\r\n');

    let tagName;
    if (versionTag) {
      tagName = versionTag;
    } else {
      ptyManager.write('正在获取 SillyTavern 最新版本信息...\r\n');
      const release = await axios.get(`${ST_RELEASES_API}/latest`);
      tagName = release.data.tag_name;
    }

    const versionDir = path.join(VERSIONS_DIR, tagName);
    
    // 检查版本是否已安装
    if (fs.existsSync(versionDir)) {
      ptyManager.write(`版本 ${tagName} 已安装。\r\n`);
    } else {
      // 下载安装逻辑
      const zipPath = path.join(DATA_DIR, 'st.zip');
      // 使用随机临时文件名，避免 EPERM
      const tempZipPath = path.join(DATA_DIR, `st.zip.part.${Date.now()}`);
      const targetUrl = `https://github.com/SillyTavern/SillyTavern/archive/refs/tags/${tagName}.zip`;
      
      const mirrors = [
        'https://mirror.ghproxy.com/',
        'https://ghproxy.net/',
        'https://gh-proxy.com/',
        ''
      ];

      let downloadSuccess = false;
      let lastError = null;

      for (const mirror of mirrors) {
        const currentUrl = mirror ? `${mirror}${targetUrl}` : targetUrl;
        const sourceName = mirror ? new URL(mirror).hostname : 'GitHub 直连';
        let writer = null;
        
        try {
          ptyManager.write(`尝试从 ${sourceName} 下载...\r\n`);
          
          writer = fs.createWriteStream(tempZipPath);
          const response = await axios({
            url: currentUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 30000
          });

          const totalLength = response.headers['content-length'];
          let downloadedLength = 0;

          response.data.on('data', (chunk) => {
            downloadedLength += chunk.length;
            if (totalLength) {
              const progress = Math.round((downloadedLength / totalLength) * 100);
              ptyManager.send('download-progress', { type: 'st', progress });
            } else {
               ptyManager.send('download-progress', { type: 'st', progress: -1, downloaded: downloadedLength });
            }
          });

          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          await fs.rename(tempZipPath, zipPath);
          downloadSuccess = true;
          ptyManager.write('下载成功！\r\n');
          break;

        } catch (error) {
          lastError = error;
          if (writer) writer.destroy(); // 确保流关闭
          // 尝试删除临时文件
          try { await fs.remove(tempZipPath); } catch (e) {}
          ptyManager.write(`下载失败: ${error.message}，尝试下一个源...\r\n`);
        }
      }

      if (!downloadSuccess) {
        throw new Error(`所有下载源均失败。最后一次错误: ${lastError?.message}`);
      }

      ptyManager.write('正在解压 SillyTavern...\r\n');
      const zip = new AdmZip(zipPath);
      // 解压到临时目录
      const extractTemp = path.join(DATA_DIR, `temp_extract_${Date.now()}`);
      await fs.ensureDir(extractTemp);
      zip.extractAllTo(extractTemp, true);
      
      const files = await fs.readdir(extractTemp);
      const extractedDir = files.find(f => f.startsWith('SillyTavern-'));
      
      if (extractedDir) {
        await fs.move(path.join(extractTemp, extractedDir), versionDir, { overwrite: true });
      }
      
      await fs.remove(extractTemp);
      await fs.remove(zipPath);

      // 安装依赖
      ptyManager.write('正在安装依赖 (npm install)...\r\n');
      const env = { ...process.env };
      env.PATH = `${NODE_DIR};${env.PATH}`;
      const { spawn } = require('child_process');
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      
      const installProcess = spawn(path.join(NODE_DIR, npmCmd), ['install', '--no-audit', '--no-fund'], {
        cwd: versionDir,
        env: env,
        shell: true
      });

      installProcess.stdout.on('data', (data) => ptyManager.write(data.toString()));
      installProcess.stderr.on('data', (data) => ptyManager.write(data.toString()));

      await new Promise((resolve, reject) => {
        installProcess.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`npm install failed with code ${code}`));
        });
        installProcess.on('error', reject);
      });
    }

    // 链接用户数据
    await linkUserData(versionDir, ptyManager);

    // 更新当前版本记录
    await fs.writeJson(CURRENT_VERSION_FILE, { version: tagName });

    // 安装插件
    ptyManager.write('正在检查核心扩展...\r\n');
    const extensionsDir = path.join(versionDir, 'public', 'scripts', 'extensions', 'third-party');
    await fs.ensureDir(extensionsDir);
    
    const pluginDir = path.join(extensionsDir, 'ST-Amily2-Chat-Optimisation');
    if (!fs.existsSync(pluginDir)) {
        const pluginZipPath = path.join(DATA_DIR, 'plugin.zip');
        const pluginTempZipPath = path.join(DATA_DIR, `plugin.zip.part.${Date.now()}`);
        const pluginTargetUrl = 'https://github.com/Wx-2025/ST-Amily2-Chat-Optimisation/archive/refs/heads/main.zip';
        
        const mirrors = [
          'https://mirror.ghproxy.com/',
          'https://ghproxy.net/',
          'https://gh-proxy.com/',
          '' 
        ];

        let pluginDownloadSuccess = false;

        for (const mirror of mirrors) {
          const currentUrl = mirror ? `${mirror}${pluginTargetUrl}` : pluginTargetUrl;
          let writer = null;
          try {
            writer = fs.createWriteStream(pluginTempZipPath);
            const response = await axios({
              url: currentUrl,
              method: 'GET',
              responseType: 'stream',
              timeout: 30000
            });
            
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
              writer.on('finish', resolve);
              writer.on('error', reject);
            });

            await fs.rename(pluginTempZipPath, pluginZipPath);
            pluginDownloadSuccess = true;
            break;
          } catch (error) {
            if (writer) writer.destroy();
            try { await fs.remove(pluginTempZipPath); } catch (e) {}
            ptyManager.write(`插件下载失败: ${error.message}，尝试下一个源...\r\n`);
          }
        }

        if (pluginDownloadSuccess) {
          const zip = new AdmZip(pluginZipPath);
          zip.extractAllTo(extensionsDir, true);
          
          const files = await fs.readdir(extensionsDir);
          const extractedDir = files.find(f => f.startsWith('ST-Amily2-Chat-Optimisation-'));
          if (extractedDir) {
            try { await fs.remove(pluginDir); } catch (e) {}
            await fs.rename(path.join(extensionsDir, extractedDir), pluginDir);
          }
          
          await fs.remove(pluginZipPath);
          ptyManager.write('核心扩展安装完成！\r\n');
        } else {
          ptyManager.write('警告: 核心扩展下载失败，请稍后手动安装。\r\n');
        }
    }

    ptyManager.write(`版本 ${tagName} 部署完成！\r\n`);

  } catch (error) {
    ptyManager.write(`\r\n错误: ${error.message}\r\n`);
    console.error(error);
    throw error; // 抛出错误，让前端捕获
  }
}

const net = require('net');
const { exec } = require('child_process');

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // 端口被占用
      } else {
        reject(err);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // 端口未被占用
    });
    server.listen(port, '127.0.0.1');
  });
}

function killPort(port) {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' 
      ? `netstat -ano` 
      : `lsof -i :${port} -t`;
      
    exec(cmd, (err, stdout) => {
      if (err) {
        return resolve();
      }
      
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        // Windows netstat output: Proto Local Address Foreign Address State PID
        // TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING       1234
        if (parts.length >= 5) {
          const localAddress = parts[1]; // 0.0.0.0:8000
          const pid = parts[parts.length - 1];
          
          // 严格匹配端口，防止误杀 (例如 8000 匹配到 58000)
          if (localAddress && (localAddress.endsWith(`:${port}`) || localAddress.endsWith(`:${port}`)) && /^\d+$/.test(pid) && pid !== '0') {
            pids.add(pid);
          }
        }
      });
      
      if (pids.size === 0) return resolve();
      
      const killCmd = process.platform === 'win32'
        ? `taskkill /F /PID ${Array.from(pids).join(' /PID ')}`
        : `kill -9 ${Array.from(pids).join(' ')}`;
        
      exec(killCmd, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

async function startSillyTavern(ptyManager) {
  try {
    // 检查端口占用
    const isPortInUse = await checkPort(8000);
    if (isPortInUse) {
      ptyManager.write('检测到端口 8000 被占用，正在尝试自动清理...\r\n');
      try {
        await killPort(8000);
        ptyManager.write('已清理占用端口的进程。\r\n');
        // 等待一小会儿确保端口释放
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        ptyManager.write(`清理端口失败: ${e.message}。请手动关闭占用端口的程序。\r\n`);
        throw new Error('端口被占用且无法清理');
      }
    }

    // 读取当前版本
    let currentVersion;
    try {
      const config = await fs.readJson(CURRENT_VERSION_FILE);
      currentVersion = config.version;
    } catch (e) {
      if (fs.existsSync(SILLY_TAVERN_DIR)) {
         ptyManager.write('检测到旧版安装，请先在版本管理中执行迁移或重新安装。\r\n');
         throw new Error('检测到旧版安装');
      }
    }

    if (!currentVersion) {
      ptyManager.write('未选择当前版本，请先在版本管理中选择版本。\r\n');
      throw new Error('未选择版本');
    }

    const versionDir = path.join(VERSIONS_DIR, currentVersion);
    if (!fs.existsSync(versionDir)) {
      ptyManager.write(`版本 ${currentVersion} 文件不存在，请重新安装。\r\n`);
      throw new Error('版本文件不存在');
    }

    // 恢复自动打开浏览器 (移除之前的强制禁用配置)
    const configPath = path.join(USER_DATA_DIR, 'config.yaml');
    if (fs.existsSync(configPath)) {
      try {
        let configContent = await fs.readFile(configPath, 'utf8');
        if (configContent.includes('# AMILY_LAUNCHER_OVERRIDE')) {
          // 移除之前追加的配置
          configContent = configContent.split('# AMILY_LAUNCHER_OVERRIDE')[0];
          await fs.writeFile(configPath, configContent);
          
          // 同步到版本目录
          const targetConfigPath = path.join(versionDir, 'config.yaml');
          await fs.copy(configPath, targetConfigPath, { overwrite: true });
          
          ptyManager.write('已恢复 SillyTavern 自动打开浏览器配置。\r\n');
        }
      } catch (e) {
        console.error('恢复 config.yaml 失败:', e);
      }
    }

    ptyManager.write(`正在启动 SillyTavern (${currentVersion})...\r\n`);

    const env = { ...process.env };
    env.PATH = `${NODE_DIR};${env.PATH}`;
    
    // 移除禁用浏览器的参数，允许 SillyTavern 自动打开默认浏览器
    ptyManager.createPty(path.join(NODE_DIR, 'node.exe'), ['server.js'], versionDir, env); 

  } catch (error) {
    ptyManager.write(`\r\n启动错误: ${error.message}\r\n`);
    throw error; // 抛出错误，让前端捕获
  }
}

async function getInstalledVersions() {
  try {
    await fs.ensureDir(VERSIONS_DIR);
    const files = await fs.readdir(VERSIONS_DIR);
    const versions = [];
    for (const file of files) {
      const stat = await fs.stat(path.join(VERSIONS_DIR, file));
      if (stat.isDirectory()) {
        versions.push(file);
      }
    }
    
    let current = null;
    try {
      const config = await fs.readJson(CURRENT_VERSION_FILE);
      current = config.version;
    } catch (e) {}

    return { versions, current };
  } catch (e) {
    return { versions: [], current: null };
  }
}

async function switchVersion(version) {
  const versionDir = path.join(VERSIONS_DIR, version);
  if (!fs.existsSync(versionDir)) {
    throw new Error('版本不存在');
  }
  await fs.writeJson(CURRENT_VERSION_FILE, { version });
}

async function openDirectory(type) {
  let targetPath;
  if (type === 'userData') {
    targetPath = USER_DATA_DIR;
  } else if (type === 'versions') {
    targetPath = VERSIONS_DIR;
  } else {
    targetPath = DATA_DIR;
  }
  await fs.ensureDir(targetPath);
  await shell.openPath(targetPath);
  return true;
}

async function createBackup() {
  const backupDir = path.join(DATA_DIR, 'backups');
  await fs.ensureDir(backupDir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.zip`);
  
  const zip = new AdmZip();
  // 备份 user_data 目录
  if (fs.existsSync(USER_DATA_DIR)) {
    zip.addLocalFolder(USER_DATA_DIR, 'user_data');
  }
  
  zip.writeZip(backupFile);
  return backupFile;
}

async function clearCache() {
  const files = await fs.readdir(DATA_DIR);
  for (const file of files) {
    if (file.endsWith('.zip') || file.endsWith('.part') || file.startsWith('temp_extract')) {
      await fs.remove(path.join(DATA_DIR, file));
    }
  }
  return true;
}

async function updateConfig(args) {
  const { type, value } = args;
  const configPath = path.join(USER_DATA_DIR, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    throw new Error('配置文件不存在，请先安装并运行一次酒馆');
  }

  let content = await fs.readFile(configPath, 'utf8');
  let modified = false;

  if (type === 'proxy') {
    if (value === 'disabled') {
      // 禁用代理
      if (content.includes('# PROXY_OVERRIDE')) {
        content = content.replace(/# PROXY_OVERRIDE[\s\S]*?bypass:[\s\S]*?::1/, '');
        modified = true;
      }
      // 同时也尝试修改原始配置
      if (content.includes('requestProxy:')) {
        const regex = /(requestProxy:\s*[\r\n]+\s*)enabled:\s*true/g;
        if (regex.test(content)) {
          content = content.replace(regex, '$1enabled: false');
          modified = true;
        }
      }
    } else {
      // 启用代理
      const proxyConfig = `
requestProxy:
  enabled: true
  url: "${value}"
  bypass:
    - localhost
    - 127.0.0.1
    - ::1
`;
      if (!content.includes('# PROXY_OVERRIDE')) {
        content += `\n# PROXY_OVERRIDE${proxyConfig}`;
        modified = true;
      } else {
        content = content.replace(/# PROXY_OVERRIDE[\s\S]*?bypass:[\s\S]*?::1/, `# PROXY_OVERRIDE${proxyConfig}`);
        modified = true;
      }
    }
  } else if (type === 'memory') {
    const memValue = value || '600';
    if (content.includes('memoryCacheCapacity:')) {
      content = content.replace(/memoryCacheCapacity: \d+mb/, `memoryCacheCapacity: ${memValue}mb`);
      modified = true;
    } else {
      content += `\nperformance:\n  memoryCacheCapacity: ${memValue}mb\n`;
      modified = true;
    }
  }

  if (modified) {
    await fs.writeFile(configPath, content);
    
    // 同步到当前版本目录
    try {
      const config = await fs.readJson(CURRENT_VERSION_FILE);
      if (config && config.version) {
        const versionDir = path.join(VERSIONS_DIR, config.version);
        if (fs.existsSync(versionDir)) {
          await fs.copy(configPath, path.join(versionDir, 'config.yaml'), { overwrite: true });
        }
      }
    } catch (e) {}
    
    return true;
  }
  return false;
}

module.exports = {
  ensureNode,
  installSillyTavern,
  startSillyTavern,
  getVersions,
  getInstalledVersions,
  switchVersion,
  openDirectory,
  createBackup,
  clearCache,
  updateConfig,
  DATA_DIR,
  NODE_DIR,
  SILLY_TAVERN_DIR
};
