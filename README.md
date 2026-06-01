# 婚礼请柬与来宾管理系统

一个移动端优先的 H5 婚礼请柬与来宾管理 MVP，支持来宾管理、筛选统计、请柬文案复制、请柬图片生成下载，以及婚礼信息和标签配置。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。

## 构建

```bash
npm run build
```

构建产物会生成到 `dist/`。

## Netlify 部署

仓库已包含 `netlify.toml`，Netlify 连接 GitHub 仓库后通常会自动识别：

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

## 数据说明

当前版本使用浏览器 `localStorage` 保存来宾和系统设置。部署到 Netlify 后，每台设备/每个浏览器的数据彼此独立；后续多人协作或跨设备同步时，可以接入 Supabase、Firebase 或 SQLite 后端。
