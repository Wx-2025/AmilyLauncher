# Amily 酒馆管理器 - 发布与更新指南

本教程将指导你如何发布软件版本，并配置自动更新。

你的仓库地址：`https://github.com/Wx-2025/AmilyLauncher`

## 准备工作

确保你已经安装了 Git 和 Node.js，并且本地代码已经提交到 GitHub。

## 流程一：发布新版本 (以 v1.0.0 为例)

### 1. 构建安装包
在本地项目根目录打开终端，运行：

```bash
cd st-launcher
npm run build
```

等待构建完成。生成的安装包位于 `st-launcher/release` 目录下，文件名类似 `Amily酒馆管理器 Setup 1.0.0.exe`。

### 2. 在 GitHub 发布 Release
1.  打开你的 GitHub 仓库页面：[https://github.com/Wx-2025/AmilyLauncher](https://github.com/Wx-2025/AmilyLauncher)
2.  点击右侧的 **Releases**。
3.  点击 **Draft a new release**。
4.  **Choose a tag**: 输入 `v1.0.0`，点击 **Create new tag**。
5.  **Release title**: 输入标题，例如 `v1.0.0 - 初始版本`。
6.  **Describe this release**: 填写更新日志。
7.  **Attach binaries**: 将刚才生成的 `.exe` 文件拖拽到这里上传。
8.  点击 **Publish release**。

### 3. 配置自动更新 (manifest.json)
为了让用户能检测到这个新版本，你需要更新仓库根目录下的 `manifest.json` 文件。

1.  在本地项目根目录找到 `manifest.json` 文件。
2.  修改内容如下（注意替换版本号）：

```json
{
  "launcher_update": {
    "latest_version": "1.0.0",
    "download_url": "https://mirror.ghproxy.com/https://github.com/Wx-2025/AmilyLauncher/releases/download/v1.0.0/Amily酒馆管理器.Setup.1.0.0.exe",
    "force_update": false,
    "changelog": "这是初始版本发布！"
  }
}
```

*   **注意**：`download_url` 中的文件名必须与你上传到 Release 的文件名**完全一致**（包括空格）。
*   `force_update`: 设置为 `true` 则强制用户更新，`false` 则允许跳过。

3.  提交并推送到 GitHub：

```bash
git add manifest.json
git commit -m "Update manifest to v1.0.0"
git push
```

**完成！** 现在，用户打开软件时，就会自动检查 `manifest.json`，如果发现新版本，就会弹出更新提示。

---

## 流程二：发布后续更新 (例如 v1.1.0)

当你开发了新功能，想要发布 v1.1.0 时：

1.  **修改版本号**：
    打开 `st-launcher/package.json`，将 `"version": "1.0.0"` 修改为 `"version": "1.1.0"`。

2.  **构建**：
    运行 `npm run build`，生成 `Amily酒馆管理器 Setup 1.1.0.exe`。

3.  **发布 Release**：
    在 GitHub 创建新 Release `v1.1.0`，上传新的 exe 文件。

4.  **更新 manifest.json**：
    修改本地 `manifest.json`：
    *   `latest_version`: "1.1.0"
    *   `download_url`: 修改链接中的版本号和文件名。
    *   `changelog`: 填写新的更新内容。

5.  **推送**：
    `git add .` -> `git commit` -> `git push`。

这样，所有旧版本用户都会收到 v1.1.0 的更新推送。
