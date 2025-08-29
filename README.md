# MCP Manager - VS Code Extension

一个用于管理和调用多个 Model Context Protocol (MCP) 服务器的 VS Code 插件。

## 功能特性

### 🚀 核心功能
- **多服务器管理**: 在 VS Code 设置中添加、编辑和删除多个 MCP 服务器配置
- **命令面板集成**: 通过命令面板快速选择服务器并发送 API 请求
- **侧边栏视图**: 专用的 "MCP Manager" 侧边栏，直观管理所有服务器
- **RESTful API 支持**: 支持 GET、POST、PUT、DELETE 等 HTTP 方法
- **错误处理**: 完善的错误处理机制，提供用户友好的错误提示

### 🔧 技术特性
- **TypeScript 开发**: 完全使用 TypeScript 编写，提供类型安全
- **异步操作**: 所有网络请求均为异步操作，不阻塞 VS Code 界面
- **模块化设计**: 清晰的代码结构，易于维护和扩展
- **配置验证**: 自动验证服务器配置的有效性

## 安装

### 从源码安装
1. 克隆或下载此项目
2. 在项目根目录运行：
   ```bash
   npm install
   npm run compile
   ```
3. 在 VS Code 中按 `F5` 启动扩展开发主机
4. 在新窗口中测试插件功能

### 打包安装
```bash
npm install -g vsce
vsce package
```
然后在 VS Code 中安装生成的 `.vsix` 文件。

## 使用方法

### 1. 配置 MCP 服务器

#### 方法一：通过设置界面
1. 打开 VS Code 设置 (`Ctrl/Cmd + ,`)
2. 搜索 "MCP Manager"
3. 在 "Servers" 部分添加服务器配置

#### 方法二：通过侧边栏
1. 在资源管理器中找到 "MCP Manager" 视图
2. 点击 "+" 按钮添加新服务器
3. 填写服务器信息：
   - **名称**: 服务器的显示名称
   - **URL**: 服务器的 API 地址
   - **API Key**: 认证密钥（可选）

#### 配置示例
```json
{
  "mcpManager.servers": [
    {
      "name": "本地开发服务器",
      "url": "http://localhost:3000",
      "apiKey": "your-api-key"
    },
    {
      "name": "生产环境服务器",
      "url": "https://api.example.com",
      "apiKey": "prod-api-key",
      "headers": {
        "X-Custom-Header": "custom-value"
      }
    }
  ]
}
```

### 2. 调用 MCP 服务器

#### 通过命令面板
1. 按 `Ctrl/Cmd + Shift + P` 打开命令面板
2. 输入 "Select MCP Server" 并选择
3. 从列表中选择要调用的服务器
4. 输入 API 端点路径（如：`/api/users`）
5. 选择 HTTP 方法（GET、POST、PUT、DELETE）
6. 如需要，输入请求体（JSON 格式）

#### 通过侧边栏
1. 在 "MCP Manager" 视图中找到目标服务器
2. 点击服务器旁边的播放按钮 (▶️)
3. 按照提示输入请求参数

### 3. 查看响应结果
- API 响应将在新的编辑器标签页中以 JSON 格式显示
- 响应包含完整的状态码、头部信息和数据内容
- 错误信息会通过通知消息显示

## 配置选项

### 服务器配置
每个服务器配置支持以下字段：

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | ✅ | 服务器显示名称 |
| `url` | string | ✅ | 服务器 API 基础 URL |
| `apiKey` | string | ❌ | API 认证密钥 |
| `headers` | object | ❌ | 自定义 HTTP 头部 |

### 认证方式
- **Bearer Token**: 如果提供了 `apiKey`，将自动添加 `Authorization: Bearer <apiKey>` 头部
- **自定义头部**: 通过 `headers` 字段添加任意自定义头部

## 错误处理

插件提供了完善的错误处理机制：

### 网络错误
- **连接超时**: 30秒超时限制
- **服务器不可达**: 自动检测并提示网络问题
- **HTTP 错误状态**: 详细的状态码和错误信息

### 配置错误
- **URL 验证**: 自动验证 URL 格式
- **重复名称检测**: 防止添加同名服务器
- **必填字段验证**: 确保必要信息完整

### 用户友好提示
- 所有错误都会显示清晰的中文提示
- 提供具体的解决建议
- 支持进度显示和取消操作

## 开发

### 项目结构
```
src/
├── extension.ts              # 插件入口文件
├── types/
│   └── mcpServer.ts         # 类型定义
├── managers/
│   ├── configurationManager.ts  # 配置管理
│   └── apiManager.ts        # API 请求管理
├── providers/
│   └── mcpServerProvider.ts # 侧边栏视图提供者
└── utils/
    └── errorHandler.ts      # 错误处理工具
```

### 开发命令
```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 监听文件变化并自动编译
npm run watch

# 打包插件
vsce package
```

### 调试
1. 在 VS Code 中打开项目
2. 按 `F5` 启动扩展开发主机
3. 在新窗口中测试插件功能
4. 使用开发者工具查看日志

## 常见问题

### Q: 如何添加自定义 HTTP 头部？
A: 在服务器配置中添加 `headers` 字段：
```json
{
  "name": "My Server",
  "url": "https://api.example.com",
  "headers": {
    "X-API-Version": "v1",
    "X-Client-ID": "vscode-extension"
  }
}
```

### Q: 支持哪些认证方式？
A: 目前支持：
- Bearer Token 认证（通过 `apiKey` 字段）
- 自定义头部认证（通过 `headers` 字段）

### Q: 如何处理 HTTPS 证书问题？
A: 插件使用 Node.js 的默认 HTTPS 设置。如果遇到自签名证书问题，请确保服务器使用有效的 SSL 证书。

### Q: 请求超时时间是多少？
A: 默认超时时间为 30 秒。这个值在 `ApiManager` 中定义，可以根据需要修改。

## 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南
1. Fork 此项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 更新日志

### v0.0.1
- 初始版本发布
- 支持多 MCP 服务器管理
- 命令面板和侧边栏集成
- RESTful API 调用功能
- 完善的错误处理机制