# 🐍 Python Function Study

一个帮助你系统学习 Python 标准库函数的交互式学习工具。通过间隔重复（spaced repetition）算法，让你高效掌握 Python 常用函数。

## ✨ 功能

- **📦 函数库管理** — 添加、编辑、搜索、按库筛选 Python 函数
- **✍️ 5 种练习模式** — 混合随机出题，全方位巩固记忆
  - 🆔 函数→库 — 看到函数名，回想所属库
  - 📝 函数→描述 — 看到函数名，描述功能用途
  - 🔍 描述→函数 — 看到功能描述，写出函数名
  - 💻 代码→函数 — 看到代码片段，识别核心函数
  - 🔤 签名→函数 — 看到函数签名和参数，写出函数名
- **📈 学习统计** — 每日练习趋势、正确率变化、库分布图表
- **🎯 智能选题** — 基于掌握度的间隔重复算法，优先复习薄弱函数
- **📥 数据导入/导出** — JSON 格式备份，跨设备同步学习进度
- **🌱 内置 46 个种子函数** — 开箱即用，覆盖 11 个常用库

## 🚀 快速开始

### 要求
- [Node.js](https://nodejs.org) 18+

### 运行
```bash
# 安装依赖
npm install

# 启动开发模式（前后端同时启动）
npm run dev
```

访问 `http://localhost:5173`

### 便携版（给朋友用）

下载 `python-function-study.zip`，解压后双击 `start.bat`，浏览器自动打开。

## 📚 内置函数库覆盖

| 库 | 函数数量 | 示例函数 |
|---|---|---|
| builtins | 10 | enumerate, zip, map, filter, sorted, any, all... |
| os / os.path | 6 | os.path.join, os.listdir, os.makedirs, os.remove... |
| itertools | 7 | chain, product, permutations, combinations, groupby... |
| functools | 4 | lru_cache, partial, reduce, wraps |
| collections | 5 | Counter, defaultdict, namedtuple, deque |
| datetime | 4 | datetime.now, strptime, strftime, timedelta |
| json | 3 | json.dumps, json.loads, json.dump |
| pathlib | 3 | Path, Path.glob, Path.read_text |
| re | 4 | re.match, re.search, re.findall, re.sub |
| sys | 4 | sys.argv, sys.exit, sys.path, sys.version |

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Recharts |
| 后端 | Express + TypeScript |
| 存储 | JSON 文件 |

## 📁 项目结构

```
├── client/          # React 前端
│   └── src/
│       ├── components/   # Navbar, FunctionCard, Layout
│       ├── pages/        # Dashboard, FunctionList, Practice, Stats, Settings
│       ├── api/          # API 请求层
│       └── types/        # TypeScript 类型定义
├── server/          # Express 后端
│   └── src/
│       ├── routes/       # functions, practice, stats 路由
│       └── services/     # functionService, practiceService, storageService
├── server/data/     # 数据文件 + 种子数据
└── release/         # 便携版打包输出
```

## 📄 License

MIT
