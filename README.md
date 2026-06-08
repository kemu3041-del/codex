# Codex 项目工作区

这个文件夹用于后续的项目管理与项目创建，并关联到 GitHub 仓库：

https://github.com/kemu3041-del/codex.git

## 使用约定

- 新项目可以直接放在当前 `Codex` 文件夹下，或按项目名称创建子目录。
- Node.js 项目安装依赖后生成的 `node_modules/` 不提交到 Git。
- 需要提交依赖信息时，提交 `package.json` 和对应的锁文件，例如 `package-lock.json`、`pnpm-lock.yaml` 或 `yarn.lock`。
- 本地环境变量文件 `.env`、`.env.*` 默认不提交；如需提供配置模板，请使用 `.env.example`。

## Git 常用命令

```bash
git status
git add .
git commit -m "提交说明"
git push origin main
```

如果默认分支不是 `main`，可以按实际分支名调整最后一条命令。
