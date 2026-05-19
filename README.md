# Stylee - AI 私人穿搭顾问

你的 AI 私人穿搭顾问，从衣橱出发，穿出更好的自己。

## 在线体验

**https://styleeamazingmvp.vercel.app**

## 功能概览

| 模块 | 功能 |
|------|------|
| 引导设置 | 3 步完成个人资料、风格偏好、初始衣橱 |
| 穿搭推荐 | NLP 语义搜索 + 天气感知 + 场合/风格/色系标签筛选，AI 生成搭配方案 |
| 衣橱管理 | 按分类浏览、添加单品、查看详情 |
| 个人主页 | 穿搭日历、衣橱统计、风格偏好一览 |
| 天气联动 | 自动获取城市天气，推荐适合当天的穿搭 |

## 技术栈

- **前端**：Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **数据库**：Turso (libSQL) + Prisma 7 ORM
- **部署**：Vercel
- **UI 设计**：iPhone 风格移动端，桌面端模拟 iPhone 预览框

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 主页面（全部 UI 组件）
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 设计系统 & 组件样式
│   └── api/
│       ├── user/route.ts     # 用户资料 CRUD
│       ├── wardrobe/route.ts # 衣橱单品 CRUD
│       ├── wardrobe/[id]/    # 单品详情
│       ├── outfit/route.ts   # 搭配 CRUD
│       ├── outfit/recommend/ # AI 穿搭推荐
│       ├── weather/route.ts  # 天气查询
│       └── onboarding/route.ts # 引导设置
├── lib/
│   ├── prisma.ts             # Prisma 客户端（Turso adapter）
│   └── store.ts              # Zustand 状态管理
prisma/
├── schema.prisma             # 数据模型（9 张表）
├── seed.ts                   # 演示数据
└── migrations/               # 数据库迁移
```

## 数据模型

9 个核心模型：User → UserStylePreference / WardrobeItem → ItemTag → Tag / Outfit → OutfitItem / RecommendationSession / UserAction / WearEvent

## 本地开发

### 前置条件

- Node.js 18+
- [Turso CLI](https://docs.turso.tech/cli)（用于云数据库）

### 1. 克隆项目

```bash
git clone https://github.com/yiguo2026/stylee_amazing_mvp.git
cd stylee_amazing_mvp
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 Turso 数据库信息：

```
DATABASE_URL="libsql://your-db-name-your-org.aws-us-west-2.turso.io"
DATABASE_AUTH_TOKEN="your-auth-token"
MIGRATE_URL="file:./prisma/dev.db"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建本地 SQLite（用于迁移管理）并同步到 Turso
npx prisma migrate dev --name init

# 写入演示数据
npx tsx prisma/seed.ts
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 查看效果。

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量：`DATABASE_URL`、`DATABASE_AUTH_TOKEN`、`MIGRATE_URL`
4. 部署完成

## 演示数据

Seed 脚本会创建：

- 用户「小美」（25 岁，设计师，上海）
- 8 件衣橱单品（衬衫、T恤、针织开衫、西裤、西装外套、德训鞋、邮差包、手表）
- 4 套搭配方案（周四会议装、周末早午餐、雨天保暖风、清爽休闲风）
- 22 个标签（场合/风格/色系/季节）

## License

MIT
